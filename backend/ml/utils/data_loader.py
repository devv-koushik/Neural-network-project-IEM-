import os
import sys
import pandas as pd
from sklearn.model_selection import train_test_split

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))
from config import Config
from ml.preprocessing.preprocess import (
    ALL_FEATURES, fit_preprocessing, save_preprocessing, load_preprocessing, transform,
)


def load_raw_dataset() -> pd.DataFrame:
    if not os.path.exists(Config.DATASET_PATH):
        raise FileNotFoundError(
            f'Dataset not found at {Config.DATASET_PATH}. '
            f'Run: python ml/data/generate_dataset.py'
        )
    return pd.read_csv(Config.DATASET_PATH)


def ensure_preprocessing_fitted(df: pd.DataFrame):
    """Fits + saves the scaler/encoders if they don't already exist on disk,
    so every training script (basic + variants) shares identical preprocessing."""
    if os.path.exists(Config.SCALER_PATH) and os.path.exists(Config.ENCODERS_PATH):
        scaler, encoders, _ = load_preprocessing()
        return scaler, encoders
    scaler, encoders = fit_preprocessing(df)
    save_preprocessing(scaler, encoders)
    return scaler, encoders


def load_split(target: str = 'purchase', test_size: float = 0.15, val_size: float = 0.15, seed: int = 42):
    """Returns (X_train, y_train, X_val, y_val, X_test, y_test) as numpy arrays,
    already scaled/encoded, ready for model.fit()."""
    assert target in ('purchase', 'churn')

    df = load_raw_dataset()
    scaler, encoders = ensure_preprocessing_fitted(df)

    X = transform(df[ALL_FEATURES], scaler, encoders)
    y = df[target].values.astype('float32')

    X_train, X_temp, y_train, y_temp = train_test_split(
        X, y, test_size=(test_size + val_size), random_state=seed, stratify=y
    )
    relative_test_size = test_size / (test_size + val_size)
    X_val, X_test, y_val, y_test = train_test_split(
        X_temp, y_temp, test_size=relative_test_size, random_state=seed, stratify=y_temp
    )
    return X_train, y_train, X_val, y_val, X_test, y_test
