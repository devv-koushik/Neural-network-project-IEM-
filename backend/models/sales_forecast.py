import json
from datetime import datetime, timezone
from database.db import db


class SalesRecord(db.Model):
    __tablename__ = 'sales_records'

    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=True)
    product_name = db.Column(db.String(200), nullable=False)
    category = db.Column(db.String(80), nullable=False)
    sale_date = db.Column(db.Date, nullable=False, index=True)
    quantity_sold = db.Column(db.Integer, nullable=False, default=0)
    revenue = db.Column(db.Float, nullable=False, default=0.0)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            'id': self.id,
            'product_id': self.product_id,
            'product_name': self.product_name,
            'category': self.category,
            'sale_date': self.sale_date.isoformat(),
            'quantity_sold': self.quantity_sold,
            'revenue': round(self.revenue, 2),
        }


class ForecastResult(db.Model):
    __tablename__ = 'forecast_results'

    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, nullable=True)
    product_name = db.Column(db.String(200), nullable=False)
    forecast_period = db.Column(db.Integer, nullable=False)  # 7 or 30 days
    forecast_data_json = db.Column(db.Text, nullable=False)  # list of {date, predicted_quantity, predicted_revenue, lower_bound, upper_bound}
    mae = db.Column(db.Float, nullable=True)
    rmse = db.Column(db.Float, nullable=True)
    mape = db.Column(db.Float, nullable=True)
    model_type = db.Column(db.String(20), nullable=False, default='LSTM')
    is_demo_data = db.Column(db.Boolean, nullable=False, default=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    @property
    def forecast_data(self):
        try:
            return json.loads(self.forecast_data_json) if self.forecast_data_json else []
        except Exception:
            return []

    @forecast_data.setter
    def forecast_data(self, value):
        self.forecast_data_json = json.dumps(value)

    def to_dict(self):
        return {
            'id': self.id,
            'product_id': self.product_id,
            'product_name': self.product_name,
            'forecast_period': self.forecast_period,
            'forecast_data': self.forecast_data,
            'metrics': {
                'mae': round(self.mae, 3) if self.mae is not None else None,
                'rmse': round(self.rmse, 3) if self.rmse is not None else None,
                'mape': round(self.mape, 3) if self.mape is not None else None,
            },
            'model_type': self.model_type,
            'is_demo_data': self.is_demo_data,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
