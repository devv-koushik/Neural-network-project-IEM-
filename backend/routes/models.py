from flask import Blueprint, request

from services import model_service, training_service
from services.prediction_service import models_available
from utils import ok, err, admin_required

bp = Blueprint('models', __name__, url_prefix='/api/models')


@bp.get('/metrics')
def metrics():
    data = model_service.get_purchase_churn_metrics()
    if data is None:
        return err(
            'Model metrics not found. Train the basic models first: python ml/training/train_basic.py',
            'MODEL_NOT_TRAINED', 503,
        )
    return ok(data)


@bp.get('/comparison')
def comparison():
    return ok(model_service.get_model_comparison())


@bp.get('/best')
def best():
    best_model = model_service.get_best_model()
    if not best_model:
        return err('No trained models found yet.', 'MODEL_NOT_TRAINED', 503)
    return ok(best_model)


@bp.get('/training-history')
def training_history():
    experiment = request.args.get('experiment', 'Basic ANN')
    return ok(model_service.get_training_history(experiment))


@bp.get('/experiment-names')
def experiment_names():
    return ok(model_service.available_experiment_names())


@bp.post('/train')
@admin_required
def train():
    body = request.get_json(silent=True) or {}
    scope = body.get('scope', 'basic')  # 'basic' | 'variants'
    result = training_service.train_full_pipeline(scope)
    status_code = 200 if result['status'] == 'completed' else 500
    return ok(result, status=status_code)


@bp.get('/tensorboard')
def tensorboard_info():
    return ok({
        'available': False,
        'instructions': 'TensorBoard is not embedded in the API. From the backend/ folder, run: tensorboard --logdir logs',
        'default_url': 'http://localhost:6006',
        'log_dirs': ['basic_model', 'dropout_model', 'l2_model', 'batchnorm_model', 'optimized_model'],
    })
