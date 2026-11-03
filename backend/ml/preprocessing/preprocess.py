"""
Shared preprocessing pipeline for the purchase/churn models.

This module is imported by BOTH the training scripts and the prediction
service, guaranteeing that the exact same encoding + scaling logic is
applied at train time and at inference time.

Artifacts saved to backend/saved_models/:
    scaler.joblib          - fitted StandardScaler for numeric features
    encoders.joblib        - dict of fitted LabelEncoders for categorical features
    feature_config.json    - ordered feature list + categorical choices,
                              used to validate & order incoming API payloads
"""
import os
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler, LabelEncoder

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
ALL_FEATURES = NUMERIC_FEATURES + CATEGORICAL_FEATURES  # canonical column order used everywhere

CATEGORY_CHOICES = {
    'Gender': ['Female', 'Male', 'Other'],
    'Device_Type': ['Mobile', 'Desktop', 'Tablet'],
}


def fit_preprocessing(df: pd.DataFrame):
    """Fit scaler + encoders on a training dataframe. Returns (scaler, encoders)."""
    encoders = {}
    for col in CATEGORICAL_FEATURES:
        le = LabelEncoder()
        le.fit(CATEGORY_CHOICES[col])  # fit on the known/fixed vocabulary, not just what's in the df
        encoders[col] = le

    scaler = StandardScaler()
    scaler.fit(df[NUMERIC_FEATURES].values)

    return scaler, encoders


def save_preprocessing(scaler, encoders):
    os.makedirs(Config.SAVED_MODELS_DIR, exist_ok=True)
    joblib.dump(scaler, Config.SCALER_PATH)
    joblib.dump(encoders, Config.ENCODERS_PATH)
    with open(Config.FEATURE_CONFIG_PATH, 'w') as f:
        json.dump({
            'numeric_features': NUMERIC_FEATURES,
            'categorical_features': CATEGORICAL_FEATURES,
            'all_features': ALL_FEATURES,
            'category_choices': CATEGORY_CHOICES,
        }, f, indent=2)


def load_preprocessing():
    scaler = joblib.load(Config.SCALER_PATH)
    encoders = joblib.load(Config.ENCODERS_PATH)
    with open(Config.FEATURE_CONFIG_PATH) as f:
        feature_config = json.load(f)
    return scaler, encoders, feature_config


def transform(df: pd.DataFrame, scaler, encoders) -> np.ndarray:
    """Apply fitted scaler/encoders to a dataframe with ALL_FEATURES columns.
    Returns a numpy array ready to feed into the Keras model."""
    df = df.copy()
    for col in CATEGORICAL_FEATURES:
        le = encoders[col]
        # Any unseen category collapses to the first known class rather than crashing.
        df[col] = df[col].apply(lambda v: v if v in le.classes_ else le.classes_[0])
        df[col] = le.transform(df[col])

    numeric_scaled = scaler.transform(df[NUMERIC_FEATURES].values)
    categorical_values = df[CATEGORICAL_FEATURES].values
    return np.concatenate([numeric_scaled, categorical_values], axis=1).astype('float32')


def dataframe_from_payload(payload: dict) -> pd.DataFrame:
    """Builds a single-row dataframe (in ALL_FEATURES order) from an API request payload.
    Missing fields fall back to sane defaults so the endpoint never crashes on a partial body."""
    defaults = {
        'Age': 30, 'Gender': 'Female', 'Device_Type': 'Mobile',
        'Browsing_Time': 10, 'Pages_Viewed': 5, 'Previous_Purchases': 2,
        'Average_Order_Value': 60, 'Number_of_Sessions': 3, 'Cart_Additions': 3,
        'Cart_Abandonments': 1, 'Days_Since_Last_Purchase': 20,
        'Customer_Lifetime_Value': 200, 'Discount_Usage': 1, 'Support_Interactions': 0,
    }
    row = {**defaults, **payload}
    row = {k: row.get(k, v) for k, v in defaults.items()}
    return pd.DataFrame([row], columns=ALL_FEATURES)
