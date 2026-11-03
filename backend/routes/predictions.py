from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt

from database.db import db
from models.user import User
from models.customer import Customer, CustomerBehavior
from models.prediction import Prediction
from services import prediction_service
from services.prediction_service import ValidationError, ModelNotTrainedError
from utils import ok, err, paginated, parse_pagination

bp = Blueprint('predictions', __name__, url_prefix='/api')


def _get_or_create_customer_for_current_user(payload):
    """If the caller is authenticated as a customer, find (or create) their
    Customer profile so predictions attach to a real, persisted customer
    record instead of floating unattached. Admin callers running an ad hoc
    prediction (no logged-in customer context) get customer_id=None."""
    try:
        user_id = get_jwt_identity()
        claims = get_jwt()
    except Exception:
        return None

    if not user_id or claims.get('role') != 'customer':
        return None

    user = User.query.get(int(user_id))
    if not user:
        return None

    customer = Customer.query.filter_by(user_id=user.id).first()
    if not customer:
        customer = Customer(
            user_id=user.id,
            name=user.name,
            email=user.email,
            age=int(payload.get('age', 30) or 30),
            gender=payload.get('gender', 'Female'),
            device_type=payload.get('device_type', 'Mobile'),
        )
        db.session.add(customer)
        db.session.flush()

    behavior = customer.behavior or CustomerBehavior(customer_id=customer.id)
    behavior.browsing_time = float(payload.get('browsing_time', behavior.browsing_time or 0))
    behavior.pages_viewed = int(payload.get('pages_viewed', behavior.pages_viewed or 0))
    behavior.previous_purchases = int(payload.get('previous_purchases', behavior.previous_purchases or 0))
    behavior.average_order_value = float(payload.get('average_order_value', behavior.average_order_value or 0))
    behavior.number_of_sessions = int(payload.get('number_of_sessions', behavior.number_of_sessions or 0))
    behavior.cart_additions = int(payload.get('cart_additions', behavior.cart_additions or 0))
    behavior.cart_abandonments = int(payload.get('cart_abandonments', behavior.cart_abandonments or 0))
    behavior.days_since_last_purchase = int(payload.get('days_since_last_purchase', behavior.days_since_last_purchase or 0))
    behavior.customer_lifetime_value = float(payload.get('customer_lifetime_value', behavior.customer_lifetime_value or 0))
    behavior.discount_usage = int(payload.get('discount_usage', behavior.discount_usage or 0))
    behavior.support_interactions = int(payload.get('support_interactions', behavior.support_interactions or 0))
    db.session.add(behavior)
    db.session.flush()
    return customer


def _optional_jwt_customer(payload):
    """Best-effort: attach the prediction to a customer if a valid JWT is
    present, but never fail the request if it isn't (admin ad hoc runs)."""
    from flask_jwt_extended import verify_jwt_in_request
    try:
        verify_jwt_in_request(optional=True)
    except Exception:
        return None
    return _get_or_create_customer_for_current_user(payload)


def _save_prediction(customer, purchase_prob, purchase_label, churn_prob, churn_risk, confidence, engagement, factors, insight):
    pred = Prediction(
        customer_id=customer.id if customer else None,
        purchase_probability=purchase_prob,
        purchase_prediction=purchase_label,
        churn_probability=churn_prob,
        churn_risk=churn_risk,
        confidence=confidence,
        engagement_score=engagement,
        insight=insight,
    )
    pred.set_factors(factors)
    db.session.add(pred)
    db.session.commit()
    return pred


@bp.post('/predict/purchase')
def predict_purchase():
    payload = request.get_json(silent=True) or {}
    try:
        result = prediction_service.predict_purchase(payload)
    except ValidationError as e:
        return err(e.message, 'VALIDATION_ERROR', 400)
    except ModelNotTrainedError as e:
        return err(str(e), 'MODEL_NOT_TRAINED', 503)

    # Also run the churn model so the stored history row is complete/accurate,
    # even though this endpoint only returns purchase-related fields.
    try:
        churn_side = prediction_service.predict_churn(payload)
    except (ValidationError, ModelNotTrainedError):
        churn_side = {'churn_probability': 0.0, 'risk': 'Low'}

    customer = _optional_jwt_customer(payload)
    _save_prediction(
        customer, result['purchase_probability'], result['prediction'],
        churn_side['churn_probability'], churn_side['risk'],
        result['confidence'], result['engagement_score'], result['factors'], result['insight'],
    )
    return ok(result)


@bp.post('/predict/churn')
def predict_churn():
    payload = request.get_json(silent=True) or {}
    try:
        result = prediction_service.predict_churn(payload)
    except ValidationError as e:
        return err(e.message, 'VALIDATION_ERROR', 400)
    except ModelNotTrainedError as e:
        return err(str(e), 'MODEL_NOT_TRAINED', 503)

    try:
        purchase_side = prediction_service.predict_purchase(payload)
    except (ValidationError, ModelNotTrainedError):
        purchase_side = {'purchase_probability': 0.0, 'prediction': 'Unlikely to Buy'}

    customer = _optional_jwt_customer(payload)
    _save_prediction(
        customer, purchase_side['purchase_probability'], purchase_side['prediction'],
        result['churn_probability'], result['risk'], result['confidence'],
        result['engagement_score'], result['factors'], result['insight'],
    )
    return ok(result)


@bp.post('/predict/both')
def predict_both():
    payload = request.get_json(silent=True) or {}
    try:
        result = prediction_service.predict_both(payload)
    except ValidationError as e:
        return err(e.message, 'VALIDATION_ERROR', 400)
    except ModelNotTrainedError as e:
        return err(str(e), 'MODEL_NOT_TRAINED', 503)

    customer = _optional_jwt_customer(payload)
    _save_prediction(
        customer,
        result['purchase']['probability'], result['purchase']['prediction'],
        result['churn']['probability'], result['churn']['risk'],
        result['confidence'], result['engagement_score'], result['factors'], result['insights'][0] if result.get('insights') else '',
    )
    return ok(result)


@bp.get('/predictions')
@jwt_required()
def list_predictions():
    page, limit = parse_pagination(request)
    search = (request.args.get('search') or '').strip().lower()
    risk = request.args.get('risk')
    sort = request.args.get('sort', '-created_at')

    query = Prediction.query.join(Customer, Prediction.customer_id == Customer.id, isouter=True)

    if search:
        query = query.filter(Customer.name.ilike(f'%{search}%'))
    if risk and risk != 'All':
        query = query.filter(Prediction.churn_risk == risk)

    sort_map = {
        'created_at': Prediction.created_at.asc(),
        '-created_at': Prediction.created_at.desc(),
        'purchase_probability': Prediction.purchase_probability.asc(),
        '-purchase_probability': Prediction.purchase_probability.desc(),
    }
    query = query.order_by(sort_map.get(sort, Prediction.created_at.desc()))

    total = query.count()
    items = query.offset((page - 1) * limit).limit(limit).all()
    return ok(paginated([p.to_dict() for p in items], page, limit, total))


@bp.get('/predictions/<int:prediction_id>')
@jwt_required()
def get_prediction(prediction_id):
    pred = Prediction.query.get(prediction_id)
    if not pred:
        return err('Prediction not found.', 'NOT_FOUND', 404)
    return ok(pred.to_dict())
