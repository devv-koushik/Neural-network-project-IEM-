"""
Module 4: Demand & Sales Forecasting Service.
Handles time-series forecasting, LSTM inference caching, inventory risk warnings,
and forecast result persistence.
"""
import os
import json
import joblib
import datetime
import numpy as np
import pandas as pd

from config import Config
from database.db import db
from models.product import Product
from models.sales_forecast import SalesRecord, ForecastResult
from ml.forecasting.generate_sales_data import generate_historical_sales

LOOKBACK = 14
_cached_lstm = None
_cached_scalers = None


def load_forecasting_artifacts():
    global _cached_lstm, _cached_scalers
    if _cached_lstm is not None and _cached_scalers is not None:
        return _cached_lstm, _cached_scalers

    model_path = os.path.join(Config.SAVED_MODELS_DIR, 'forecasting_lstm.keras')
    scalers_path = os.path.join(Config.SAVED_MODELS_DIR, 'forecasting_scalers.joblib')
    legacy_scaler_path = os.path.join(Config.SAVED_MODELS_DIR, 'forecasting_scaler.joblib')

    if os.path.exists(model_path):
        from tensorflow import keras
        try:
            _cached_lstm = keras.models.load_model(model_path)
            if os.path.exists(scalers_path):
                _cached_scalers = joblib.load(scalers_path)
            elif os.path.exists(legacy_scaler_path):
                _cached_scalers = joblib.load(legacy_scaler_path)
            print('[forecasting_service] Loaded trained LSTM forecasting model and scalers.')
            return _cached_lstm, _cached_scalers
        except Exception as e:
            print(f'[forecasting_service] Error loading LSTM model: {e}')

    return None, None


def ensure_sales_data_seeded():
    """Seeds historical sales data from CSV into SalesRecord if empty."""
    if SalesRecord.query.count() > 0:
        return

    csv_path = os.path.join(Config.BASE_DIR, 'ml', 'forecasting', 'sales_data.csv')
    if not os.path.exists(csv_path):
        generate_historical_sales(days=730)

    df = pd.read_csv(csv_path)
    records = []
    for _, row in df.iterrows():
        records.append(SalesRecord(
            product_id=int(row['product_id']),
            product_name=str(row['product_name']),
            category=str(row['category']),
            sale_date=datetime.date.fromisoformat(str(row['date'])),
            quantity_sold=int(row['quantity_sold']),
            revenue=float(row['revenue']),
        ))

    db.session.bulk_save_objects(records)
    db.session.commit()
    print(f'[forecasting_service] Seeded {len(records)} sales records into database.')


def get_products_list():
    ensure_sales_data_seeded()
    results = db.session.query(
        SalesRecord.product_id,
        SalesRecord.product_name,
        SalesRecord.category,
        db.func.sum(SalesRecord.quantity_sold).label('total_qty'),
        db.func.sum(SalesRecord.revenue).label('total_revenue')
    ).group_by(SalesRecord.product_name).all()

    items = []
    for r in results:
        prod = Product.query.filter_by(name=r.product_name).first()
        items.append({
            'product_id': r.product_id,
            'name': r.product_name,
            'category': r.category,
            'total_sales_units': int(r.total_qty or 0),
            'total_revenue': round(float(r.total_revenue or 0.0), 2),
            'current_stock': prod.stock if prod else 45,
            'price': prod.price if prod else 99.99,
        })
    return items


def predict_demand(product_name: str, forecast_days: int = 7):
    """
    Runs multi-step product demand forecasting.
    Returns historical series, predicted future sequence, confidence bounds,
    and stock risk warnings.
    """
    ensure_sales_data_seeded()
    forecast_days = 30 if forecast_days == 30 else 7

    # Load recent historical records for this product
    records = (
        SalesRecord.query
        .filter_by(product_name=product_name)
        .order_by(SalesRecord.sale_date.asc())
        .all()
    )

    if not records:
        records = SalesRecord.query.order_by(SalesRecord.sale_date.asc()).limit(365).all()

    quantities = [r.quantity_sold for r in records]
    dates = [r.sale_date for r in records]
    prod_record = Product.query.filter_by(name=product_name).first()
    unit_price = prod_record.price if prod_record else (records[-1].revenue / max(1, records[-1].quantity_sold))
    current_stock = prod_record.stock if prod_record else 40

    # Recent history for display (last 30 days)
    history_len = min(30, len(records))
    actual_history = [
        {
            'date': dates[-history_len + i].isoformat(),
            'actual_quantity': quantities[-history_len + i],
            'revenue': round(quantities[-history_len + i] * unit_price, 2),
        }
        for i in range(history_len)
    ]

    model, scalers = load_forecasting_artifacts()
    last_date = dates[-1]

    # Resolve scaler for this product
    scaler = None
    if isinstance(scalers, dict):
        scaler = scalers.get(product_name) or next(iter(scalers.values()), None)
    elif scalers is not None:
        scaler = scalers

    # Read genuine model evaluation metrics from saved metrics (no hardcoded defaults)
    metrics_path = os.path.join(Config.RESULTS_DIR, 'forecasting_metrics.json')
    mae, rmse, mape = None, None, None
    if os.path.exists(metrics_path):
        try:
            with open(metrics_path) as f:
                saved = json.load(f)
                prod_m = saved.get('per_product_metrics', {}).get(product_name, {}).get('lstm')
                if prod_m:
                    mae = prod_m.get('mae')
                    rmse = prod_m.get('rmse')
                    mape = prod_m.get('mape')
                elif 'metrics' in saved:
                    mae = saved['metrics'].get('mae')
                    rmse = saved['metrics'].get('rmse')
                    mape = saved['metrics'].get('mape')
        except Exception:
            pass

    forecast_points = []
    total_projected_demand = 0

    if model is not None and scaler is not None:
        model_type = 'LSTM'
        # Genuine LSTM autoregressive sequence rollout
        recent_window = np.array(quantities[-LOOKBACK:], dtype=np.float32).reshape(-1, 1)
        scaled_window = scaler.transform(recent_window).flatten().tolist()

        for day_step in range(1, forecast_days + 1):
            next_date = last_date + datetime.timedelta(days=day_step)
            inp = np.array(scaled_window[-LOOKBACK:], dtype=np.float32).reshape(1, LOOKBACK, 1)
            pred_scaled = model.predict(inp, verbose=0)[0][0]
            pred_qty = float(scaler.inverse_transform([[pred_scaled]])[0][0])
            pred_qty = max(1, int(round(pred_qty)))

            scaled_window.append(pred_scaled)
            total_projected_demand += pred_qty

            spread = max(1, int(round(1.96 * mae))) if mae is not None else max(1, int(round(pred_qty * 0.15)))
            lower_bound = max(0, pred_qty - spread)
            upper_bound = pred_qty + spread
            projected_rev = round(pred_qty * unit_price, 2)

            forecast_points.append({
                'date': next_date.isoformat(),
                'predicted_quantity': pred_qty,
                'predicted_revenue': projected_rev,
                'lower_bound': lower_bound,
                'upper_bound': upper_bound,
            })
    else:
        model_type = 'Moving Average Baseline'
        window = quantities[-14:]
        mean_qty = float(np.mean(window))
        for day_step in range(1, forecast_days + 1):
            next_date = last_date + datetime.timedelta(days=day_step)
            dow = next_date.weekday()
            dow_mult = 1.35 if dow in [4, 5, 6] else 0.92
            pred_qty = max(1, int(round(mean_qty * dow_mult)))
            total_projected_demand += pred_qty

            spread = max(1, int(round(mean_qty * 0.2)))
            forecast_points.append({
                'date': next_date.isoformat(),
                'predicted_quantity': pred_qty,
                'predicted_revenue': round(pred_qty * unit_price, 2),
                'lower_bound': max(0, pred_qty - spread),
                'upper_bound': pred_qty + spread,
            })

    # Inventory Warnings
    warnings = []
    if total_projected_demand > current_stock:
        shortage = total_projected_demand - current_stock
        warnings.append({
            'type': 'shortage',
            'severity': 'high',
            'title': 'Stock Shortage Risk',
            'message': f'Projected {forecast_days}-day demand is {total_projected_demand} units, but current stock is only {current_stock}. Potential stockout of ~{shortage} units.',
        })
    elif current_stock > total_projected_demand * 4 and current_stock > 30:
        warnings.append({
            'type': 'overstock',
            'severity': 'low',
            'title': 'Potential Overstock',
            'message': f'Current inventory of {current_stock} units significantly exceeds the {forecast_days}-day demand of {total_projected_demand} units.',
        })

    # Save forecast in DB
    result_record = ForecastResult(
        product_id=prod_record.id if prod_record else None,
        product_name=product_name,
        forecast_period=forecast_days,
        forecast_data_json=json.dumps(forecast_points),
        mae=mae,
        rmse=rmse,
        mape=mape,
        model_type=model_type,
        is_demo_data=True,
    )
    db.session.add(result_record)
    db.session.commit()

    return {
        'id': result_record.id,
        'product_name': product_name,
        'forecast_period': forecast_days,
        'unit_price': unit_price,
        'current_stock': current_stock,
        'total_projected_demand': total_projected_demand,
        'total_projected_revenue': round(total_projected_demand * unit_price, 2),
        'metrics': {'mae': mae, 'rmse': rmse, 'mape': mape},
        'actual_history': actual_history,
        'forecast_data': forecast_points,
        'warnings': warnings,
        'model_type': model_type,
        'data_source': 'Historical Demonstration Sales (730 days)',
        'created_at': result_record.created_at.isoformat(),
    }


def get_forecast_history(page=1, per_page=10):
    query = ForecastResult.query.order_by(ForecastResult.created_at.desc())
    total = query.count()
    items = query.offset((page - 1) * per_page).limit(per_page).all()
    pages = max(1, (total + per_page - 1) // per_page)
    return {
        'items': [r.to_dict() for r in items],
        'pagination': {'page': page, 'per_page': per_page, 'total': total, 'pages': pages},
    }
