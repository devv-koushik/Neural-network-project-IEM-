"""
Data loading and train/validation/test splitting for SmartCart ML models.

IMPORTANT — No data leakage guarantee:
  The preprocessing artifacts (scaler, encoders) are fitted ONLY on the training
  partition (X_train). Validation and test sets are transformed using the same
  fitted artifacts but are never used to influence the fit.  This matches the
  pattern required by the prompt: "Split data into training, validation and testing
  sets BEFORE fitting preprocessing transformations."
"""
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


def load_split(target: str = 'purchase', test_size: float = 0.15, val_size: float = 0.15, seed: int = 42):
    """Returns (X_train, y_train, X_val, y_val, X_test, y_test) as numpy arrays,
    already scaled/encoded, ready for model.fit().

    Data-leakage-free pipeline:
        1. Split the RAW (un-preprocessed) dataset into train / val / test.
        2. Fit the scaler + encoders on df_train ONLY.
        3. Transform all three splits using those fitted artifacts.
        4. Save the fitted artifacts so inference uses identical preprocessing.
    """
    assert target in ('purchase', 'churn')

    df = load_raw_dataset()
    y = df[target].values.astype('float32')

    # ── Step 1: raw row-level split ──────────────────────────────────────────
    # Split indices so we can partition the raw dataframe BEFORE fitting.
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

    # ── Step 2: fit preprocessing on TRAIN only ──────────────────────────────
    # Reuse existing artifacts if already saved (so variants share the same
    # preprocessing as the basic model, which is fitted first).
    if os.path.exists(Config.SCALER_PATH) and os.path.exists(Config.ENCODERS_PATH):
        scaler, encoders, _ = load_preprocessing()
    else:
        scaler, encoders = fit_preprocessing(df_train)
        save_preprocessing(scaler, encoders)

    # ── Step 3: transform all three splits ───────────────────────────────────
    X_train = transform(df_train, scaler, encoders)
    X_val   = transform(df_val,   scaler, encoders)
    X_test  = transform(df_test,  scaler, encoders)

    return X_train, y_train, X_val, y_val, X_test, y_test
