"""
Data loading and train/validation/test splitting for SmartCart ML models.

Guarantees:
  - Strict zero data leakage: StandardScaler & OneHotEncoder are fitted ONLY on df_train.
  - Stratified partitioning across Train (70%), Validation (15%), Test (15%).
  - Identical feature pipeline between training and real-time inference.
"""
import os
import sys
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder

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


def load_split(target: str = 'purchase', test_size: float = 0.15, val_size: float = 0.15, seed: int = 42, force_refit: bool = False):
    """
    Returns (X_train, y_train, X_val, y_val, X_test, y_test) as float32 numpy arrays.
    Splits the un-preprocessed data first, fits preprocessors on df_train ONLY,
    and transforms all splits.
    """
    assert target in ('purchase', 'churn')

    df = load_raw_dataset()
    y = df[target].values.astype('float32')

    # Step 1: Split raw rows into Train, Val, Test
    idx = df.index.to_numpy()
    idx_train, idx_temp, _, y_temp = train_test_split(
        idx, y, test_size=(test_size + val_size), random_state=seed, stratify=y
    )
    relative_test_size = test_size / (test_size + val_size)
    idx_val, idx_test, _, _ = train_test_split(
        idx_temp, y_temp, test_size=relative_test_size, random_state=seed, stratify=y_temp
    )

    df_train = df.loc[idx_train, ALL_FEATURES]
    df_val   = df.loc[idx_val,   ALL_FEATURES]
    df_test  = df.loc[idx_test,  ALL_FEATURES]

    y_train = df.loc[idx_train, target].values.astype('float32')
    y_val   = df.loc[idx_val,   target].values.astype('float32')
    y_test  = df.loc[idx_test,  target].values.astype('float32')

    # Step 2: Fit preprocessing exclusively on train partition
    needs_fit = force_refit or not (os.path.exists(Config.SCALER_PATH) and os.path.exists(Config.ENCODERS_PATH))
    if not needs_fit:
        try:
            scaler, encoder, conf = load_preprocessing()
            if not isinstance(encoder, OneHotEncoder):
                needs_fit = True
        except Exception:
            needs_fit = True

    if needs_fit:
        scaler, encoder = fit_preprocessing(df_train)
        save_preprocessing(scaler, encoder)
    else:
        scaler, encoder, _ = load_preprocessing()

    # Step 3: Transform all splits
    X_train = transform(df_train, scaler, encoder)
    X_val   = transform(df_val,   scaler, encoder)
    X_test  = transform(df_test,  scaler, encoder)

    return X_train, y_train, X_val, y_val, X_test, y_test
