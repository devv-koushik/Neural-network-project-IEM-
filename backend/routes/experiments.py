from flask import Blueprint, request

from services import training_service
from utils import ok, err, admin_required

bp = Blueprint('experiments', __name__, url_prefix='/api/experiments')


@bp.post('/run')
@admin_required
def run_experiment():
    body = request.get_json(silent=True) or {}
    try:
        result = training_service.run_single_experiment(body)
    except ValueError as e:
        return err(str(e), 'VALIDATION_ERROR', 400)
    except Exception as e:  # noqa: BLE001
        return err(f'Experiment failed: {e}', 'EXPERIMENT_FAILED', 500)
    return ok(result)


@bp.get('')
@admin_required
def list_experiments():
    limit = request.args.get('limit', 50, type=int)
    return ok(training_service.list_experiments(limit=limit))
