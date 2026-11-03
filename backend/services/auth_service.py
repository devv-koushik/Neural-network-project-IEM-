from database.db import db
from models.user import User


class AuthError(Exception):
    def __init__(self, message, code='AUTH_ERROR', status=401):
        super().__init__(message)
        self.message = message
        self.code = code
        self.status = status


def register_user(name: str, email: str, password: str, role: str = 'customer'):
    email = (email or '').strip().lower()
    if not name or not email or not password:
        raise AuthError('Name, email, and password are required.', 'VALIDATION_ERROR', 400)
    if len(password) < 6:
        raise AuthError('Password must be at least 6 characters.', 'VALIDATION_ERROR', 400)
    if role not in ('customer', 'admin'):
        role = 'customer'

    existing = User.query.filter_by(email=email).first()
    if existing:
        raise AuthError('An account with this email already exists.', 'EMAIL_TAKEN', 409)

    user = User(name=name.strip(), email=email, role=role)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()
    return user


def authenticate_user(email: str, password: str):
    email = (email or '').strip().lower()
    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password or ''):
        raise AuthError('Invalid email or password.', 'INVALID_CREDENTIALS', 401)
    return user
