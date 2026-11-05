"""
Module 4: Demand & Sales Forecasting with LSTM.

Trains an LSTM Recurrent Neural Network on product-wise time-series data.
Features:
  - Product-wise sequence preparation with zero-fill for missing dates
  - Strictly chronological 70% train / 15% validation / 15% held-out test splits
  - Per-product MinMaxScaler fit exclusively on training data (no lookahead leakage)
  - Walk-forward backtesting evaluation on unseen test period
  - Rigorous benchmark comparison: LSTM vs. 7-day Moving Average baseline
  - Persists trained LSTM weights, per-product scalers, and comprehensive metric reports
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
from ml.forecasting.generate_sales_data import generate_historical_sales, PRODUCTS

LOOKBACK = 14  # 14 days lookback sequence window


def create_sequences(values, lookback=LOOKBACK):
    X, y = [], []
    for i in range(len(values) - lookback):
        X.append(values[i:i + lookback])
        y.append(values[i + lookback])
    return np.array(X, dtype=np.float32), np.array(y, dtype=np.float32)


def calculate_metrics(y_true, y_pred):
    mae = float(np.mean(np.abs(y_true - y_pred)))
    rmse = float(np.sqrt(np.mean((y_true - y_pred) ** 2)))
    denom = np.where(y_true <= 0, 1.0, y_true)
    mape = float(np.mean(np.abs((y_true - y_pred) / denom)) * 100)
    return {'mae': round(mae, 3), 'rmse': round(rmse, 3), 'mape': round(mape, 2)}


def train_forecasting_model(epochs=25, batch_size=32):
    print('\n======================================================')
    print('  Training Module 4: Product-Wise Demand LSTM        ')
    print('======================================================\n')
    from tensorflow import keras
    from tensorflow.keras import layers

    csv_path = os.path.join(Config.BASE_DIR, 'ml', 'forecasting', 'sales_data.csv')
    if not os.path.exists(csv_path):
        print('Sales dataset not found. Generating now...')
        df = generate_historical_sales(days=730)
    else:
        df = pd.read_csv(csv_path)

    df['date'] = pd.to_datetime(df['date'])

    # Find global date range
    min_date = df['date'].min()
    max_date = df['date'].max()
    full_dates = pd.date_range(min_date, max_date, freq='D')
    total_days = len(full_dates)

    train_end_idx = int(total_days * 0.70)
    val_end_idx = int(total_days * 0.85)

    print(f'Full date span: {min_date.date()} to {max_date.date()} ({total_days} days)')
    print(f'Splits: Train {train_end_idx}d | Val {val_end_idx - train_end_idx}d | Test {total_days - val_end_idx}d')

    product_names = [p['name'] for p in PRODUCTS]
    scalers = {}

    all_train_X, all_train_y = [], []
    all_val_X, all_val_y = [], []
    test_eval_by_prod = {}

    for p_name in product_names:
        p_df = df[df['product_name'] == p_name].copy()
        # Handle missing dates & zero sales by reindexing to full date range
        p_series = p_df.set_index('date').reindex(full_dates, fill_value=0)['quantity_sold'].values.reshape(-1, 1).astype('float32')

        train_part = p_series[:train_end_idx]
        val_part = p_series[train_end_idx - LOOKBACK:val_end_idx]
        test_part = p_series[val_end_idx - LOOKBACK:]

        # Fit scaler STRICTLY on train partition to eliminate data leakage
        scaler = MinMaxScaler(feature_range=(0, 1))
        scaler.fit(train_part)
        scalers[p_name] = scaler

        scaled_train = scaler.transform(train_part)
        scaled_val = scaler.transform(val_part)
        scaled_test = scaler.transform(test_part)

        X_tr, y_tr = create_sequences(scaled_train, LOOKBACK)
        X_v, y_v = create_sequences(scaled_val, LOOKBACK)
        X_te, y_te = create_sequences(scaled_test, LOOKBACK)

        all_train_X.append(X_tr)
        all_train_y.append(y_tr)
        all_val_X.append(X_v)
        all_val_y.append(y_v)

        test_eval_by_prod[p_name] = {
            'X_test': X_te,
            'y_test_scaled': y_te,
            'y_test_raw': scaler.inverse_transform(y_te).ravel(),
            'raw_test_series': p_series[val_end_idx:].ravel(),
            'scaler': scaler,
        }

    X_train = np.concatenate(all_train_X, axis=0)
    y_train = np.concatenate(all_train_y, axis=0)
    X_val = np.concatenate(all_val_X, axis=0)
    y_val = np.concatenate(all_val_y, axis=0)

    print(f'Aggregated sequence shapes — Train: {X_train.shape}, Val: {X_val.shape}')

    # Model architecture
    model = keras.Sequential([
        layers.Input(shape=(LOOKBACK, 1)),
        layers.LSTM(64, return_sequences=True, name='lstm_1'),
        layers.Dropout(0.2),
        layers.LSTM(32, return_sequences=False, name='lstm_2'),
        layers.Dropout(0.2),
        layers.Dense(16, activation='relu', name='dense_1'),
        layers.Dense(1, name='output_dense'),
    ], name='SmartCart_Product_Demand_LSTM')

    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=0.001),
        loss='mse',
        metrics=['mae'],
    )

    tb_cb = make_tensorboard_callback(Config.LOGS_DIR, os.path.join('forecasting', 'lstm_product'))
    early_stop = keras.callbacks.EarlyStopping(monitor='val_loss', patience=6, restore_best_weights=True)
    reduce_lr = keras.callbacks.ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=3, min_lr=1e-5)

    start = time.time()
    history = model.fit(
        X_train, y_train,
        validation_data=(X_val, y_val),
        epochs=epochs,
        batch_size=batch_size,
        callbacks=[tb_cb, early_stop, reduce_lr],
        verbose=1,
    )
    elapsed = time.time() - start

    # Walk-forward evaluation on held-out test split + Moving Average comparison
    print('\nEvaluating LSTM vs. Moving Average Baseline on held-out test split...')
    all_lstm_preds, all_baseline_preds, all_true = [], [], []
    per_product_metrics = {}

    for p_name, data in test_eval_by_prod.items():
        scaler = data['scaler']
        y_true = data['y_test_raw']
        # LSTM prediction
        preds_scaled = model.predict(data['X_test'], verbose=0)
        lstm_preds = scaler.inverse_transform(preds_scaled).ravel()

        # Moving average baseline (mean of past LOOKBACK window)
        ma_preds = []
        for seq in data['X_test']:
            raw_seq = scaler.inverse_transform(seq).ravel()
            ma_preds.append(float(np.mean(raw_seq)))
        ma_preds = np.array(ma_preds)

        m_lstm = calculate_metrics(y_true, lstm_preds)
        m_ma = calculate_metrics(y_true, ma_preds)

        per_product_metrics[p_name] = {
            'lstm': m_lstm,
            'moving_average_baseline': m_ma,
            'improvement_over_baseline_pct': round(((m_ma['mae'] - m_lstm['mae']) / max(0.01, m_ma['mae'])) * 100, 2),
        }
        all_lstm_preds.extend(lstm_preds)
        all_baseline_preds.extend(ma_preds)
        all_true.extend(y_true)

    overall_lstm = calculate_metrics(np.array(all_true), np.array(all_lstm_preds))
    overall_baseline = calculate_metrics(np.array(all_true), np.array(all_baseline_preds))

    print(f'Overall LSTM Performance:     MAE={overall_lstm["mae"]}, RMSE={overall_lstm["rmse"]}, MAPE={overall_lstm["mape"]}%')
    print(f'Moving Average Baseline:      MAE={overall_baseline["mae"]}, RMSE={overall_baseline["rmse"]}, MAPE={overall_baseline["mape"]}%')

    # Save artifacts
    os.makedirs(Config.SAVED_MODELS_DIR, exist_ok=True)
    os.makedirs(Config.RESULTS_DIR, exist_ok=True)

    model_path = os.path.join(Config.SAVED_MODELS_DIR, 'forecasting_lstm.keras')
    scalers_path = os.path.join(Config.SAVED_MODELS_DIR, 'forecasting_scalers.joblib')
    metrics_path = os.path.join(Config.RESULTS_DIR, 'forecasting_metrics.json')

    model.save(model_path)
    joblib.dump(scalers, scalers_path)

    summary = {
        'model_name': 'Product-Wise Demand LSTM',
        'architecture': 'LSTM(64) -> LSTM(32) -> Dense(16) -> Dense(1)',
        'lookback_days': LOOKBACK,
        'metrics': overall_lstm,
        'baseline_metrics': overall_baseline,
        'per_product_metrics': per_product_metrics,
        'training_time_seconds': round(elapsed, 2),
        'epochs_run': len(history.history['loss']),
        'total_products': len(product_names),
        'total_days_analyzed': total_days,
        'evaluation_mode': 'Chronological held-out walk-forward backtest',
    }
    with open(metrics_path, 'w') as f:
        json.dump(summary, f, indent=2)

    print(f'\nModel saved -> {model_path}')
    print(f'Per-product scalers saved -> {scalers_path}')
    print(f'Metrics saved -> {metrics_path}')
    return summary


if __name__ == '__main__':
    train_forecasting_model(epochs=20)
