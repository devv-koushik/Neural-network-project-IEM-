import json
from datetime import datetime, timezone
from database.db import db


class Prediction(db.Model):
    __tablename__ = 'predictions'

    id = db.Column(db.Integer, primary_key=True)
    customer_id = db.Column(db.Integer, db.ForeignKey('customers.id'), nullable=True)

    purchase_probability = db.Column(db.Float, nullable=False)
    purchase_prediction = db.Column(db.String(30), nullable=False)  # "Likely to Buy" | "Unlikely to Buy"
    churn_probability = db.Column(db.Float, nullable=False)
    churn_risk = db.Column(db.String(10), nullable=False)  # "Low" | "Medium" | "High"
    confidence = db.Column(db.Float, nullable=False)  # 0-1
    engagement_score = db.Column(db.Integer, nullable=False, default=0)  # 0-100, derived from inputs
    factors = db.Column(db.Text, nullable=True)  # JSON-encoded {"positive": [...], "negative": [...]}
    insight = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def get_factors(self):
        if not self.factors:
            return {'positive': [], 'negative': []}
        try:
            return json.loads(self.factors)
        except (ValueError, TypeError):
            return {'positive': [], 'negative': []}

    def set_factors(self, factors_dict):
        self.factors = json.dumps(factors_dict)

    def to_dict(self):
        customer_name = self.customer.name if self.customer else 'Guest'
        return {
            'id': self.id,
            'customer_id': self.customer_id,
            'customer_name': customer_name,
            'purchase_probability': round(self.purchase_probability, 3),
            'purchase_prediction': self.purchase_prediction,
            'churn_probability': round(self.churn_probability, 3),
            'churn_risk': self.churn_risk,
            'confidence': round(self.confidence, 3),
            'engagement_score': self.engagement_score,
            'factors': self.get_factors(),
            'insight': self.insight,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'date': self.created_at.date().isoformat() if self.created_at else None,
        }
