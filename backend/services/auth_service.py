from database.db import db
from models.user import User
from models.customer import Customer, CustomerBehavior


class AuthError(Exception):
    def __init__(self, message, code='AUTH_ERROR', status=401):
        super().__init__(message)
        self.message = message
        self.code = code
        self.status = status


def register_user(name: str, email: str, password: str, role: str = 'customer', age=None, gender: str = None):
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
    db.session.flush()

    if role == 'customer':
        try:
            parsed_age = int(age) if age is not None else 25
        except (ValueError, TypeError):
            parsed_age = 25

        clean_gender = (gender or 'Female').strip().capitalize()
        if clean_gender not in ('Female', 'Male', 'Other'):
            clean_gender = 'Female'

        customer = Customer(
            user_id=user.id,
            name=user.name,
            email=user.email,
            age=parsed_age,
            gender=clean_gender,
            device_type='Desktop',
        )
        db.session.add(customer)
        db.session.flush()

        behavior = CustomerBehavior(
            customer_id=customer.id,
            browsing_time=12.0,
            pages_viewed=4,
            previous_purchases=0,
            average_order_value=0.0,
            number_of_sessions=1,
            cart_additions=0,
            cart_abandonments=0,
            days_since_last_purchase=0,
            customer_lifetime_value=0.0,
            discount_usage=0,
            support_interactions=0,
        )
        db.session.add(behavior)

    db.session.commit()
    return user


def authenticate_user(email: str, password: str):
    email = (email or '').strip().lower()
    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password or ''):
        raise AuthError('Invalid email or password.', 'INVALID_CREDENTIALS', 401)
    return user
