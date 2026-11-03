"""
Loads the trained purchase/churn models + shared preprocessing once per
process, and exposes predict_purchase() / predict_churn() / predict_both().

This is the ONLY place model inference happens — routes call into this
service, never load a Keras model directly.
"""
import os
import json
import numpy as np
from functools import lru_cache

from config import Config
from ml.preprocessing.preprocess import dataframe_from_payload, transform, load_preprocessing

# snake_case API payload keys -> PascalCase dataset/model feature names
FIELD_MAP = {
    'age': 'Age',
    'gender': 'Gender',
    'device_type': 'Device_Type',
    'browsing_time': 'Browsing_Time',
    'pages_viewed': 'Pages_Viewed',
    'previous_purchases': 'Previous_Purchases',
    'average_order_value': 'Average_Order_Value',
    'number_of_sessions': 'Number_of_Sessions',
    'cart_additions': 'Cart_Additions',
    'cart_abandonments': 'Cart_Abandonments',
    'days_since_last_purchase': 'Days_Since_Last_Purchase',
    'customer_lifetime_value': 'Customer_Lifetime_Value',
    'discount_usage': 'Discount_Usage',
    'support_interactions': 'Support_Interactions',
}

VALIDATION_RULES = {
    'age': (13, 100),
    'browsing_time': (0, 600),
    'pages_viewed': (0, 500),
    'previous_purchases': (0, 500),
    'average_order_value': (0, 100000),
    'number_of_sessions': (0, 1000),
    'cart_additions': (0, 500),
    'cart_abandonments': (0, 500),
    'days_since_last_purchase': (0, 3650),
    'customer_lifetime_value': (0, 1000000),
    'discount_usage': (0, 500),
    'support_interactions': (0, 500),
}


class ModelNotTrainedError(Exception):
    pass


class ValidationError(Exception):
    def __init__(self, message):
        super().__init__(message)
        self.message = message


def validate_payload(payload: dict):
    for field, (lo, hi) in VALIDATION_RULES.items():
        if field not in payload:
            continue
        value = payload[field]
        try:
            value = float(value)
        except (TypeError, ValueError):
            raise ValidationError(f'{field} must be a number.')
        if value < lo or value > hi:
            raise ValidationError(f'{field} must be between {lo} and {hi}.')
    if 'gender' in payload and payload['gender'] not in ('Female', 'Male', 'Other'):
        raise ValidationError('gender must be one of Female, Male, Other.')
    if 'device_type' in payload and payload['device_type'] not in ('Mobile', 'Desktop', 'Tablet'):
        raise ValidationError('device_type must be one of Mobile, Desktop, Tablet.')
    if payload.get('cart_abandonments', 0) and payload.get('cart_additions', 0):
        if float(payload['cart_abandonments']) > float(payload['cart_additions']):
            raise ValidationError('cart_abandonments cannot exceed cart_additions.')


@lru_cache(maxsize=1)
def _load_preprocessing_cached():
    if not (os.path.exists(Config.SCALER_PATH) and os.path.exists(Config.ENCODERS_PATH)):
        raise ModelNotTrainedError(
            'Preprocessing artifacts not found. Run: python ml/training/train_basic.py'
        )
    return load_preprocessing()


def _load_keras_model(path):
    if not os.path.exists(path):
        raise ModelNotTrainedError(
            f'Model not found at {path}. Run: python ml/training/train_basic.py'
        )
    # Imported lazily so importing this module doesn't force-load TensorFlow
    # until a prediction is actually requested (keeps `flask run` startup fast).
    from tensorflow import keras
    return keras.models.load_model(path)


_model_cache = {}


def _get_model(kind: str):
    """kind: 'purchase' | 'churn'. Cached in-process after first load."""
    if kind not in _model_cache:
        path = Config.PURCHASE_MODEL_PATH if kind == 'purchase' else Config.CHURN_MODEL_PATH
        _model_cache[kind] = _load_keras_model(path)
    return _model_cache[kind]


def _to_pascal_case_payload(payload: dict) -> dict:
    result = {}
    for snake_key, pascal_key in FIELD_MAP.items():
        if snake_key in payload and payload[snake_key] is not None:
            result[pascal_key] = payload[snake_key]
    return result


def _prepare_features(payload: dict):
    scaler, encoders, _ = _load_preprocessing_cached()
    pascal_payload = _to_pascal_case_payload(payload)
    df = dataframe_from_payload(pascal_payload)
    X = transform(df, scaler, encoders)
    return X, df


def _engagement_score(payload: dict) -> int:
    """Simple, transparent derived UI metric (not a model output) reflecting
    how active this customer profile is, based on the raw inputs supplied."""
    sessions = float(payload.get('number_of_sessions', 0) or 0)
    browsing = float(payload.get('browsing_time', 0) or 0)
    pages = float(payload.get('pages_viewed', 0) or 0)
    score = min(1.0, sessions / 15) * 35 + min(1.0, browsing / 60) * 35 + min(1.0, pages / 20) * 30
    return int(round(score))


def _build_factors(payload: dict, purchase_prob: float, churn_prob: float):
    positive, negative = [], []

    browsing = float(payload.get('browsing_time', 0) or 0)
    prev = float(payload.get('previous_purchases', 0) or 0)
    sessions = float(payload.get('number_of_sessions', 0) or 0)
    discount = float(payload.get('discount_usage', 0) or 0)
    clv = float(payload.get('customer_lifetime_value', 0) or 0)
    cart_add = float(payload.get('cart_additions', 0) or 0)
    cart_abandon = float(payload.get('cart_abandonments', 0) or 0)
    days_since = float(payload.get('days_since_last_purchase', 0) or 0)
    support = float(payload.get('support_interactions', 0) or 0)

    if browsing >= 15:
        positive.append('Frequent browsing sessions')
    if prev >= 5:
        positive.append('Strong purchase history')
    if sessions >= 6:
        positive.append('Multiple recent sessions')
    if discount >= 2:
        positive.append('Responsive to discounts')
    if clv >= 500:
        positive.append('High customer lifetime value')
    if cart_add >= 5 and cart_abandon <= 1:
        positive.append('Active cart engagement with low abandonment')

    if cart_abandon >= 3:
        negative.append('Recent cart abandonment')
    if days_since >= 60:
        negative.append('Extended inactivity since last purchase')
    if support >= 3:
        negative.append('Elevated support interactions')
    if prev <= 1:
        negative.append('Limited purchase history')
    if sessions <= 2:
        negative.append('Low recent session count')

    if not positive:
        positive.append('Baseline engagement within normal range')
    if not negative:
        negative.append('No significant risk signals detected')

    return {'positive': positive, 'negative': negative}


def _build_insight(payload: dict, purchase_prob: float, churn_prob: float) -> str:
    device = payload.get('device_type', 'device')
    sessions = payload.get('number_of_sessions', 0)
    cart_abandon = float(payload.get('cart_abandonments', 0) or 0)
    days_since = float(payload.get('days_since_last_purchase', 0) or 0)

    if purchase_prob >= 0.7 and churn_prob < 0.3:
        return (
            f'Recent browsing activity and purchase history indicate a high likelihood of conversion, '
            f'with low churn risk. This customer profile ({str(device).lower()}, {sessions} sessions) '
            f'shows strong loyalty signals.'
        )
    if purchase_prob >= 0.5:
        driver = 'recent cart abandonments' if cart_abandon >= 2 else 'session frequency'
        return (
            f'This customer shows moderate purchase intent. Engagement patterns are healthy, but {driver} '
            f'suggest targeted incentives could improve conversion.'
        )
    if churn_prob >= 0.6:
        driver = 'extended inactivity' if days_since >= 60 else 'reduced engagement'
        return f'This customer shows elevated churn risk driven primarily by {driver}. A re-engagement campaign is recommended.'
    return (
        'Purchase intent is currently low. Browsing and session activity are limited, but churn risk remains '
        'manageable — consider a nurture sequence rather than aggressive discounting.'
    )


def _confidence(purchase_prob: float, churn_prob: float) -> float:
    conf = 0.68 + abs(purchase_prob - 0.5) * 0.4 + abs(churn_prob - 0.5) * 0.2
    return float(min(0.98, max(0.55, conf)))


def predict_purchase(payload: dict):
    validate_payload(payload)
    X, _ = _prepare_features(payload)
    model = _get_model('purchase')
    prob = float(model.predict(X, verbose=0).ravel()[0])
    label = 'Likely to Buy' if prob >= 0.5 else 'Unlikely to Buy'
    return {
        'purchase_probability': round(prob, 4),
        'purchase_percentage': round(prob * 100, 1),
        'prediction': label,
        'confidence': round(_confidence(prob, 1 - prob), 3),
        'engagement_score': _engagement_score(payload),
        'factors': _build_factors(payload, prob, 0.0),
        'insight': _build_insight(payload, prob, 0.0),
    }


def predict_churn(payload: dict):
    validate_payload(payload)
    X, _ = _prepare_features(payload)
    model = _get_model('churn')
    prob = float(model.predict(X, verbose=0).ravel()[0])
    if prob >= 0.6:
        risk = 'High'
    elif prob >= 0.3:
        risk = 'Medium'
    else:
        risk = 'Low'
    return {
        'churn_probability': round(prob, 4),
        'churn_percentage': round(prob * 100, 1),
        'risk': risk,
        'confidence': round(_confidence(1 - prob, prob), 3),
        'engagement_score': _engagement_score(payload),
        'factors': _build_factors(payload, 0.0, prob),
        'insight': _build_insight(payload, 0.0, prob),
    }


def predict_both(payload: dict):
    validate_payload(payload)
    X, _ = _prepare_features(payload)

    purchase_model = _get_model('purchase')
    churn_model = _get_model('churn')

    purchase_prob = float(purchase_model.predict(X, verbose=0).ravel()[0])
    churn_prob = float(churn_model.predict(X, verbose=0).ravel()[0])

    purchase_label = 'Likely to Buy' if purchase_prob >= 0.5 else 'Unlikely to Buy'
    if churn_prob >= 0.6:
        churn_risk = 'High'
    elif churn_prob >= 0.3:
        churn_risk = 'Medium'
    else:
        churn_risk = 'Low'

    confidence = _confidence(purchase_prob, churn_prob)
    factors = _build_factors(payload, purchase_prob, churn_prob)
    insight = _build_insight(payload, purchase_prob, churn_prob)

    return {
        'purchase': {
            'probability': round(purchase_prob, 4),
            'percentage': round(purchase_prob * 100, 1),
            'prediction': purchase_label,
        },
        'churn': {
            'probability': round(churn_prob, 4),
            'percentage': round(churn_prob * 100, 1),
            'risk': churn_risk,
        },
        'confidence': round(confidence, 3),
        'engagement_score': _engagement_score(payload),
        'factors': factors,
        'insights': [insight],
    }


def models_available() -> bool:
    return (
        os.path.exists(Config.PURCHASE_MODEL_PATH)
        and os.path.exists(Config.CHURN_MODEL_PATH)
        and os.path.exists(Config.SCALER_PATH)
        and os.path.exists(Config.ENCODERS_PATH)
    )
