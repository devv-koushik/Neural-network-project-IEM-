from flask import Blueprint, request
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity

from services.auth_service import register_user, authenticate_user, AuthError
from models.user import User
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
    user = User.query.get(int(user_id))
    if not user:
        return err('User not found.', 'NOT_FOUND', 404)
    return ok({'user': user.to_dict()})


@bp.post('/logout')
@jwt_required()
def logout():
    # Stateless JWT - logout is handled client-side by discarding the token.
    return ok({'message': 'Logged out successfully.'})
