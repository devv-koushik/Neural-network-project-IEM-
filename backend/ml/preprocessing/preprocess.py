"""
Shared preprocessing pipeline for purchase and churn prediction models.

Applies:
  - StandardScaler for continuous numerical features.
  - OneHotEncoder for nominal categorical features (Gender, Device_Type),
    avoiding arbitrary ordinal assumptions made by LabelEncoder.
  - Robust handling of missing/NaN and out-of-vocabulary inputs (handle_unknown='ignore').

Artifacts saved to backend/saved_models/:
  scaler.joblib          - fitted StandardScaler for numeric features
  encoders.joblib        - fitted OneHotEncoder for nominal categoricals
  feature_config.json    - feature column order, category mappings, and shapes
"""
import os
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler, OneHotEncoder

import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))
from config import Config

NUMERIC_FEATURES = [
    'Age',
    'Browsing_Time',
    'Pages_Viewed',
    'Previous_Purchases',
    'Average_Order_Value',
    'Number_of_Sessions',
    'Cart_Additions',
    'Cart_Abandonments',
    'Days_Since_Last_Purchase',
    'Customer_Lifetime_Value',
    'Discount_Usage',
    'Support_Interactions',
]
CATEGORICAL_FEATURES = ['Gender', 'Device_Type']
ALL_FEATURES = NUMERIC_FEATURES + CATEGORICAL_FEATURES

CATEGORY_CHOICES = {
    'Gender': ['Female', 'Male', 'Other'],
    'Device_Type': ['Mobile', 'Desktop', 'Tablet'],
}

DEFAULTS = {
    'Age': 30.0,
    'Gender': 'Female',
    'Device_Type': 'Mobile',
    'Browsing_Time': 10.0,
    'Pages_Viewed': 5.0,
    'Previous_Purchases': 2.0,
    'Average_Order_Value': 60.0,
    'Number_of_Sessions': 3.0,
    'Cart_Additions': 3.0,
    'Cart_Abandonments': 1.0,
    'Days_Since_Last_Purchase': 20.0,
    'Customer_Lifetime_Value': 200.0,
    'Discount_Usage': 1.0,
    'Support_Interactions': 0.0,
}


def fit_preprocessing(df: pd.DataFrame):
    """
    Fits scaler on numeric features and OneHotEncoder on categorical features.
    Must ONLY be called on the training split to prevent data leakage.
    """
    encoder = OneHotEncoder(
        categories=[CATEGORY_CHOICES['Gender'], CATEGORY_CHOICES['Device_Type']],
        sparse_output=False,
        handle_unknown='ignore',
    )
    encoder.fit(df[CATEGORICAL_FEATURES])

    scaler = StandardScaler()
    scaler.fit(df[NUMERIC_FEATURES].values)

    return scaler, encoder


def save_preprocessing(scaler, encoder):
    os.makedirs(Config.SAVED_MODELS_DIR, exist_ok=True)
    joblib.dump(scaler, Config.SCALER_PATH)
    joblib.dump(encoder, Config.ENCODERS_PATH)

    encoded_cat_names = []
    if hasattr(encoder, 'get_feature_names_out'):
        encoded_cat_names = encoder.get_feature_names_out(CATEGORICAL_FEATURES).tolist()

    with open(Config.FEATURE_CONFIG_PATH, 'w') as f:
        json.dump({
            'numeric_features': NUMERIC_FEATURES,
            'categorical_features': CATEGORICAL_FEATURES,
            'all_features': ALL_FEATURES,
            'category_choices': CATEGORY_CHOICES,
            'encoding': 'OneHotEncoder',
            'encoded_categorical_columns': encoded_cat_names,
            'total_input_dim': len(NUMERIC_FEATURES) + len(encoded_cat_names),
        }, f, indent=2)


def load_preprocessing():
    scaler = joblib.load(Config.SCALER_PATH)
    encoder = joblib.load(Config.ENCODERS_PATH)
    with open(Config.FEATURE_CONFIG_PATH) as f:
        feature_config = json.load(f)
    return scaler, encoder, feature_config


def transform(df: pd.DataFrame, scaler, encoder) -> np.ndarray:
    """
    Applies fitted StandardScaler and OneHotEncoder to dataframe.
    Handles missing values and returns float32 ndarray with shape (N, total_input_dim).
    """
    df = df.copy()

    # Impute any missing values with valid defaults
    for col in ALL_FEATURES:
        if col in df.columns:
            df[col] = df[col].fillna(DEFAULTS[col])
        else:
            df[col] = DEFAULTS[col]

    # Convert numeric values safely
    for col in NUMERIC_FEATURES:
        df[col] = pd.to_numeric(df[col], errors='coerce').fillna(DEFAULTS[col])

    # Ensure categoricals are strings
    for col in CATEGORICAL_FEATURES:
        df[col] = df[col].astype(str)

    numeric_scaled = scaler.transform(df[NUMERIC_FEATURES].values)
    categorical_encoded = encoder.transform(df[CATEGORICAL_FEATURES].values)

    return np.concatenate([numeric_scaled, categorical_encoded], axis=1).astype('float32')


def dataframe_from_payload(payload: dict) -> pd.DataFrame:
    """
    Builds a single-row DataFrame in canonical ALL_FEATURES order from an API payload.
    Missing or partial fields safely fall back to defaults.
    """
    row = {**DEFAULTS, **payload}
    sanitized = {k: row.get(k, DEFAULTS[k]) for k in ALL_FEATURES}
    return pd.DataFrame([sanitized], columns=ALL_FEATURES)
