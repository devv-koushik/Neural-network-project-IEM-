from datetime import datetime, timezone
from werkzeug.security import generate_password_hash, check_password_hash
from database.db import db


class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='customer')  # 'customer' | 'admin'
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    customer = db.relationship('Customer', backref='user', uselist=False, cascade='all, delete-orphan')

    def set_password(self, raw_password):
        self.password_hash = generate_password_hash(raw_password)

    def check_password(self, raw_password):
        return check_password_hash(self.password_hash, raw_password)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'role': self.role,
        }

    def __repr__(self):
        return f'<User {self.email} ({self.role})>'
