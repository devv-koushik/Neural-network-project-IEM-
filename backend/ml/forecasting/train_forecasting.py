"""
Module 4: Demand & Sales Forecasting with LSTM.

Trains an LSTM Recurrent Neural Network on chronological product sales time-series.
Uses a lookback sliding window, chronological train/val/test splits,
MinMaxScaler fit strictly on train partition to eliminate data leakage,
and computes real regression metrics: MAE, RMSE, and MAPE.
"""
import os
import sys
import json
import time
import joblib
import numpy as np
import pandas as pd
from sklearn.preprocessing import MinMaxScaler

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))
from config import Config
from ml.utils.tensorboard_utils import make_tensorboard_callback
from ml.forecasting.generate_sales_data import generate_historical_sales

LOOKBACK = 14  # look back 14 days of sales to forecast the next day


def create_sequences(values, lookback=LOOKBACK):
    X, y = [], []
    for i in range(len(values) - lookback):
        X.append(values[i:i + lookback])
        y.append(values[i + lookback])
    return np.array(X), np.array(y)


def calculate_metrics(y_true, y_pred):
    mae = float(np.mean(np.abs(y_true - y_pred)))
    rmse = float(np.sqrt(np.mean((y_true - y_pred) ** 2)))
    # Avoid div by zero in MAPE
    denom = np.where(y_true == 0, 1e-5, y_true)
    mape = float(np.mean(np.abs((y_true - y_pred) / denom)) * 100)
    return {'mae': round(mae, 3), 'rmse': round(rmse, 3), 'mape': round(mape, 2)}


def train_forecasting_model(epochs=20, batch_size=32):
    print('\n======================================================')
    print('  Training Module 4: Demand Forecasting LSTM         ')
    print('======================================================\n')
    from tensorflow import keras
    from tensorflow.keras import layers

    csv_path = os.path.join(Config.BASE_DIR, 'ml', 'forecasting', 'sales_data.csv')
    if not os.path.exists(csv_path):
        print('Sales dataset not found. Generating now...')
        df = generate_historical_sales(days=730)
    else:
        df = pd.read_csv(csv_path)

    # Sort strictly chronologically
    df['date'] = pd.to_datetime(df['date'])
    df = df.sort_values('date').reset_index(drop=True)

    # Aggregate daily sales across all products to train the foundational demand model
    daily_sales = df.groupby('date')['quantity_sold'].sum().values.reshape(-1, 1).astype('float32')

    n = len(daily_sales)
    train_end = int(n * 0.70)
    val_end = int(n * 0.85)

    train_data = daily_sales[:train_end]
    val_data = daily_sales[train_end - LOOKBACK:val_end]
    test_data = daily_sales[val_end - LOOKBACK:]

    # Fit scaler strictly on train set
    scaler = MinMaxScaler(feature_range=(0, 1))
    scaler.fit(train_data)

    scaled_train = scaler.transform(train_data)
    scaled_val = scaler.transform(val_data)
    scaled_test = scaler.transform(test_data)

    X_train, y_train = create_sequences(scaled_train, LOOKBACK)
    X_val, y_val = create_sequences(scaled_val, LOOKBACK)
    X_test, y_test = create_sequences(scaled_test, LOOKBACK)

    print(f'Sequence shapes — Train: {X_train.shape}, Val: {X_val.shape}, Test: {X_test.shape}')

    model = keras.Sequential([
        layers.Input(shape=(LOOKBACK, 1)),
        layers.LSTM(64, return_sequences=True, name='lstm_1'),
        layers.Dropout(0.2),
        layers.LSTM(32, return_sequences=False, name='lstm_2'),
        layers.Dropout(0.2),
        layers.Dense(16, activation='relu', name='dense_1'),
        layers.Dense(1, name='output_dense'),
    ], name='SmartCart_Demand_LSTM')

    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=0.001),
        loss='mse',
        metrics=['mae'],
    )

    tb_cb = make_tensorboard_callback(Config.LOGS_DIR, os.path.join('forecasting', 'lstm'))
    early_stop = keras.callbacks.EarlyStopping(monitor='val_loss', patience=6, restore_best_weights=True)

    start = time.time()
    history = model.fit(
        X_train, y_train,
        validation_data=(X_val, y_val),
        epochs=epochs,
        batch_size=batch_size,
        callbacks=[tb_cb, early_stop],
        verbose=1,
    )
    elapsed = time.time() - start

    # Evaluate on held-out test split
    test_pred_scaled = model.predict(X_test, verbose=0)
    test_pred = scaler.inverse_transform(test_pred_scaled).ravel()
    test_true = scaler.inverse_transform(y_test).ravel()

    metrics = calculate_metrics(test_true, test_pred)
    print(f'\nTest Set Evaluation: MAE={metrics["mae"]}, RMSE={metrics["rmse"]}, MAPE={metrics["mape"]}%')

    # Save artifacts
    os.makedirs(Config.SAVED_MODELS_DIR, exist_ok=True)
    os.makedirs(Config.RESULTS_DIR, exist_ok=True)

    model_path = os.path.join(Config.SAVED_MODELS_DIR, 'forecasting_lstm.keras')
    scaler_path = os.path.join(Config.SAVED_MODELS_DIR, 'forecasting_scaler.joblib')
    metrics_path = os.path.join(Config.RESULTS_DIR, 'forecasting_metrics.json')

    model.save(model_path)
    joblib.dump(scaler, scaler_path)

    summary = {
        'model_name': 'LSTM Demand Forecaster',
        'architecture': 'LSTM(64) -> LSTM(32) -> Dense(16) -> Dense(1)',
        'lookback_days': LOOKBACK,
        'metrics': metrics,
        'training_time_seconds': round(elapsed, 2),
        'epochs_run': len(history.history['loss']),
        'total_days_analyzed': n,
    }
    with open(metrics_path, 'w') as f:
        json.dump(summary, f, indent=2)

    print(f'Model saved -> {model_path}')
    print(f'Scaler saved -> {scaler_path}')
    print(f'Metrics saved -> {metrics_path}')
    return summary


if __name__ == '__main__':
    train_forecasting_model(epochs=15)
