from datetime import datetime, timezone
from database.db import db


class Customer(db.Model):
    __tablename__ = 'customers'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(255), nullable=True)
    age = db.Column(db.Integer, nullable=False)
    gender = db.Column(db.String(20), nullable=False, default='Female')
    device_type = db.Column(db.String(20), nullable=False, default='Mobile')
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    behavior = db.relationship('CustomerBehavior', backref='customer', uselist=False, cascade='all, delete-orphan')
    predictions = db.relationship('Prediction', backref='customer', cascade='all, delete-orphan',
                                   order_by='desc(Prediction.created_at)')

    def to_dict(self, include_behavior=True, include_latest_prediction=True):
        data = {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'age': self.age,
            'gender': self.gender,
            'device_type': self.device_type,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
        if include_behavior and self.behavior:
            data.update(self.behavior.to_dict())
        if include_latest_prediction:
            latest = self.predictions[0] if self.predictions else None
            if latest:
                data['purchase_probability'] = latest.purchase_probability
                data['churn_probability'] = latest.churn_probability
                data['churn_risk'] = latest.churn_risk
                data['engagement_score'] = latest.engagement_score
        return data


class CustomerBehavior(db.Model):
    __tablename__ = 'customer_behavior'

    id = db.Column(db.Integer, primary_key=True)
    customer_id = db.Column(db.Integer, db.ForeignKey('customers.id'), nullable=False)

    browsing_time = db.Column(db.Float, nullable=False, default=0)
    pages_viewed = db.Column(db.Integer, nullable=False, default=0)
    previous_purchases = db.Column(db.Integer, nullable=False, default=0)
    average_order_value = db.Column(db.Float, nullable=False, default=0)
    number_of_sessions = db.Column(db.Integer, nullable=False, default=0)
    cart_additions = db.Column(db.Integer, nullable=False, default=0)
    cart_abandonments = db.Column(db.Integer, nullable=False, default=0)
    days_since_last_purchase = db.Column(db.Integer, nullable=False, default=0)
    customer_lifetime_value = db.Column(db.Float, nullable=False, default=0)
    discount_usage = db.Column(db.Integer, nullable=False, default=0)
    support_interactions = db.Column(db.Integer, nullable=False, default=0)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            'browsing_time': self.browsing_time,
            'pages_viewed': self.pages_viewed,
            'previous_purchases': self.previous_purchases,
            'average_order_value': self.average_order_value,
            'number_of_sessions': self.number_of_sessions,
            'cart_additions': self.cart_additions,
            'cart_abandonments': self.cart_abandonments,
            'days_since_last_purchase': self.days_since_last_purchase,
            'customer_lifetime_value': self.customer_lifetime_value,
            'discount_usage': self.discount_usage,
            'support_interactions': self.support_interactions,
        }
