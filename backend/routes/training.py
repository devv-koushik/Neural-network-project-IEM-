"""
Dedicated training-trigger endpoint (kept separate from routes/models.py's
POST /api/models/train, which does the exact same thing, so both spec
sections - "Model Experiment API" and "Training API" - are satisfied).

Training runs synchronously: with an 8,000-row dataset and the low epoch
counts used here, even a full 5-model retrain finishes in well under a
minute on a normal CPU, so a background job queue (Celery/RQ) would add
real complexity for no practical benefit in this project. The response's
`status` field is "completed" or "failed" once the request returns, which
is what the frontend's Training Analytics / Hyperparameter Tuning pages
read to show a loading vs. completed vs. failed state.
"""
from flask import Blueprint, request

from services import training_service
from utils import ok, admin_required

bp = Blueprint('training', __name__, url_prefix='/api/training')


@bp.post('/train')
@admin_required
def train():
    body = request.get_json(silent=True) or {}
    scope = body.get('scope', 'basic')
    result = training_service.train_full_pipeline(scope)
    status_code = 200 if result['status'] == 'completed' else 500
    return ok(result, status=status_code)
