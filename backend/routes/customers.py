from flask import Blueprint, request
from flask_jwt_extended import jwt_required

from database.db import db
from models.customer import Customer, CustomerBehavior
from models.prediction import Prediction
from services.analytics_service import customer_statistics, age_distribution, churn_distribution, customer_growth
from utils import ok, err, admin_required, paginated, parse_pagination

bp = Blueprint('customers', __name__, url_prefix='/api/customers')


@bp.get('')
@jwt_required()
def list_customers():
    page, limit = parse_pagination(request)
    search = (request.args.get('search') or '').strip().lower()

    query = Customer.query
    if search:
        query = query.filter(Customer.name.ilike(f'%{search}%'))

    total = query.count()
    items = query.order_by(Customer.created_at.desc()).offset((page - 1) * limit).limit(limit).all()
    data = [c.to_dict() for c in items]

    # For small admin tables the frontend expects a flat array most of the
    # time (see CustomerAnalytics.jsx) - default to a flat array unless the
    # caller explicitly paginates.
    if 'page' in request.args or 'limit' in request.args:
        return ok(paginated(data, page, limit, total))
    all_items = Customer.query.order_by(Customer.created_at.desc()).all()
    return ok([c.to_dict() for c in all_items])


@bp.get('/statistics')
@jwt_required()
def statistics():
    return ok(customer_statistics())


@bp.get('/analytics')
@jwt_required()
def analytics():
    return ok({
        'age_distribution': age_distribution(),
        'churn_distribution': churn_distribution(),
        'customer_growth': customer_growth(),
    })


@bp.get('/<int:customer_id>')
@jwt_required()
def get_customer(customer_id):
    customer = Customer.query.get(customer_id)
    if not customer:
        return err('Customer not found.', 'NOT_FOUND', 404)
    return ok(customer.to_dict())


@bp.post('')
@admin_required
def create_customer():
    body = request.get_json(silent=True) or {}
    if not body.get('name') or body.get('age') is None:
        return err('name and age are required.', 'VALIDATION_ERROR', 400)

    customer = Customer(
        name=body['name'],
        email=body.get('email'),
        age=int(body['age']),
        gender=body.get('gender', 'Female'),
        device_type=body.get('device_type', 'Mobile'),
    )
    db.session.add(customer)
    db.session.flush()

    behavior = CustomerBehavior(customer_id=customer.id, **{
        k: body.get(k, 0) for k in [
            'browsing_time', 'pages_viewed', 'previous_purchases', 'average_order_value',
            'number_of_sessions', 'cart_additions', 'cart_abandonments', 'days_since_last_purchase',
            'customer_lifetime_value', 'discount_usage', 'support_interactions',
        ]
    })
    db.session.add(behavior)
    db.session.commit()
    return ok(customer.to_dict(), status=201)


@bp.put('/<int:customer_id>')
@admin_required
def update_customer(customer_id):
    customer = Customer.query.get(customer_id)
    if not customer:
        return err('Customer not found.', 'NOT_FOUND', 404)

    body = request.get_json(silent=True) or {}
    for field in ('name', 'email', 'age', 'gender', 'device_type'):
        if field in body:
            setattr(customer, field, body[field])

    behavior = customer.behavior or CustomerBehavior(customer_id=customer.id)
    for field in [
        'browsing_time', 'pages_viewed', 'previous_purchases', 'average_order_value',
        'number_of_sessions', 'cart_additions', 'cart_abandonments', 'days_since_last_purchase',
        'customer_lifetime_value', 'discount_usage', 'support_interactions',
    ]:
        if field in body:
            setattr(behavior, field, body[field])
    db.session.add(behavior)
    db.session.commit()
    return ok(customer.to_dict())


@bp.delete('/<int:customer_id>')
@admin_required
def delete_customer(customer_id):
    customer = Customer.query.get(customer_id)
    if not customer:
        return err('Customer not found.', 'NOT_FOUND', 404)
    db.session.delete(customer)
    db.session.commit()
    return ok({'message': 'Customer deleted.'})


@bp.get('/<int:customer_id>/predictions')
@jwt_required()
def customer_predictions(customer_id):
    customer = Customer.query.get(customer_id)
    if not customer:
        return err('Customer not found.', 'NOT_FOUND', 404)
    page, limit = parse_pagination(request)
    query = Prediction.query.filter_by(customer_id=customer_id).order_by(Prediction.created_at.desc())
    total = query.count()
    items = query.offset((page - 1) * limit).limit(limit).all()
    return ok(paginated([p.to_dict() for p in items], page, limit, total))
