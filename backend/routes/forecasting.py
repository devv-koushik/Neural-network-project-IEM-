import threading
from flask import Blueprint, request

from utils import ok, err, parse_pagination, admin_required
from services import forecasting_service
from ml.forecasting.train_forecasting import train_forecasting_model

bp = Blueprint('forecasting', __name__, url_prefix='/api/forecasting')


@bp.get('/products')
def products():
    data = forecasting_service.get_products_list()
    return ok(data)


@bp.post('/predict')
def predict():
    body = request.get_json(silent=True) or {}
    product_name = body.get('product_name')
    if not product_name:
        return err('product_name is required.', 'VALIDATION_ERROR', 400)

    period = int(body.get('forecast_days', 7))
    if period not in (7, 30):
        period = 7

    try:
        result = forecasting_service.predict_demand(product_name, forecast_days=period)
        return ok(result)
    except Exception as e:
        return err(f'Forecasting error: {str(e)}', 'FORECAST_FAILED', 500)


@bp.get('/history')
def history():
    page, limit = parse_pagination(request)
    data = forecasting_service.get_forecast_history(page=page, per_page=limit)
    return ok(data)


@bp.post('/train')
@admin_required
def train():
    body = request.get_json(silent=True) or {}
    epochs = int(body.get('epochs', 15))

    def run_training_async():
        try:
            train_forecasting_model(epochs=epochs)
        except Exception as e:
            print(f'[Forecasting Training] Error: {e}')

    thread = threading.Thread(target=run_training_async, daemon=True)
    thread.start()

    return ok({
        'status': 'training_started',
        'message': f'LSTM Demand Forecasting training launched for {epochs} epochs.',
        'model_type': 'LSTM',
    })


@bp.get('/status')
def status():
    model, scaler = forecasting_service.load_forecasting_artifacts()
    return ok({
        'status': 'ready' if model is not None else 'needs_training',
        'model_loaded': model is not None,
        'architecture': 'LSTM(64) -> LSTM(32) -> Dense(16) -> Dense(1)',
        'supported_horizons': [7, 30],
    })

