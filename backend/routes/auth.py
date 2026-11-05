from flask import Blueprint, request
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity

from services.auth_service import register_user, authenticate_user, AuthError
from models.user import User
from models.prediction import Prediction
from database.db import db
from utils import ok, err

bp = Blueprint('auth', __name__, url_prefix='/api/auth')


def _token_for(user):
    return create_access_token(identity=str(user.id), additional_claims={'role': user.role, 'email': user.email})


@bp.post('/register')
def register():
    body = request.get_json(silent=True) or {}
    try:
        user = register_user(body.get('name'), body.get('email'), body.get('password'))
    except AuthError as e:
        return err(e.message, e.code, e.status)

    token = _token_for(user)
    return ok({'token': token, 'user': user.to_dict()}, status=201)


@bp.post('/login')
def login():
    body = request.get_json(silent=True) or {}
    try:
        user = authenticate_user(body.get('email'), body.get('password'))
    except AuthError as e:
        return err(e.message, e.code, e.status)

    token = _token_for(user)
    return ok({'token': token, 'user': user.to_dict()})


@bp.get('/me')
@jwt_required()
def me():
    user_id = get_jwt_identity()
    user = db.session.get(User, int(user_id))
    if not user:
        return err('User not found.', 'NOT_FOUND', 404)

    # Include personalized stats for the customer dashboard
    prediction_count = 0
    latest_prediction = None
    if user.customer:
        prediction_count = Prediction.query.filter_by(customer_id=user.customer.id).count()
        latest_prediction = (
            Prediction.query
            .filter_by(customer_id=user.customer.id)
            .order_by(Prediction.created_at.desc())
            .first()
        )

    user_dict = user.to_dict()
    user_dict['created_at'] = user.created_at.isoformat() if user.created_at else None
    user_dict['total_predictions'] = prediction_count
    if latest_prediction:
        user_dict['latest_prediction'] = {
            'purchase_probability': latest_prediction.purchase_probability,
            'churn_probability': latest_prediction.churn_probability,
            'churn_risk': latest_prediction.churn_risk,
            'engagement_score': latest_prediction.engagement_score,
            'confidence': latest_prediction.confidence,
        }
    return ok({'user': user_dict})


@bp.put('/profile')
@jwt_required()
def update_profile():
    """Update the authenticated user's name and/or email."""
    user_id = get_jwt_identity()
    user = db.session.get(User, int(user_id))
    if not user:
        return err('User not found.', 'NOT_FOUND', 404)

    body = request.get_json(silent=True) or {}
    new_name = (body.get('name') or '').strip()
    new_email = (body.get('email') or '').strip().lower()

    if new_name:
        user.name = new_name
    if new_email and new_email != user.email:
        existing = User.query.filter_by(email=new_email).first()
        if existing and existing.id != user.id:
            return err('Email is already taken.', 'EMAIL_TAKEN', 409)
        user.email = new_email

    db.session.commit()
    user_dict = user.to_dict()
    user_dict['created_at'] = user.created_at.isoformat() if user.created_at else None
    return ok({'user': user_dict})


@bp.put('/password')
@jwt_required()
def change_password():
    """Change the authenticated user's password."""
    user_id = get_jwt_identity()
    user = db.session.get(User, int(user_id))
    if not user:
        return err('User not found.', 'NOT_FOUND', 404)

    body = request.get_json(silent=True) or {}
    current_password = body.get('current_password', '')
    new_password = body.get('new_password', '')

    if not user.check_password(current_password):
        return err('Current password is incorrect.', 'INVALID_CREDENTIALS', 401)
    if len(new_password) < 6:
        return err('New password must be at least 6 characters.', 'VALIDATION_ERROR', 400)

    user.set_password(new_password)
    db.session.commit()
    return ok({'message': 'Password updated successfully.'})


@bp.post('/logout')
@jwt_required()
def logout():
    # Stateless JWT - logout is handled client-side by discarding the token.
    return ok({'message': 'Logged out successfully.'})
