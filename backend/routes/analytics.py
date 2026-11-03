from flask import Blueprint, request
from flask_jwt_extended import jwt_required

from services import analytics_service
from utils import ok, err

bp = Blueprint('analytics', __name__, url_prefix='/api/analytics')

VALID_PERIODS = ('today', '7d', '30d', '90d')


def _period():
    period = request.args.get('period', '30d')
    return period if period in VALID_PERIODS else '30d'


@bp.get('/dashboard')
@jwt_required()
def dashboard():
    return ok(analytics_service.dashboard_summary(_period()))


@bp.get('/customers')
@jwt_required()
def customers():
    return ok({
        'age_distribution': analytics_service.age_distribution(),
        'churn_distribution': analytics_service.churn_distribution(),
        'customer_growth': analytics_service.customer_growth(),
    })


@bp.get('/purchases')
@jwt_required()
def purchases():
    return ok({'distribution': analytics_service.purchase_distribution()})


@bp.get('/churn')
@jwt_required()
def churn():
    return ok({'distribution': analytics_service.churn_distribution()})


@bp.get('/activity')
@jwt_required()
def activity():
    return ok({'prediction_trend': analytics_service.prediction_trend(_period())})
