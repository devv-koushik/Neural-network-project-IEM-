import json
from datetime import datetime, timezone
from database.db import db


class SyntheticDataJob(db.Model):
    __tablename__ = 'synthetic_data_jobs'

    id = db.Column(db.Integer, primary_key=True)
    source_dataset = db.Column(db.String(80), nullable=False)  # 'customers' | 'products'
    num_records = db.Column(db.Integer, nullable=False)
    status = db.Column(db.String(20), nullable=False, default='completed')
    quality_score = db.Column(db.Float, nullable=True)  # KS-statistic similarity score (0.0 to 1.0)
    output_filename = db.Column(db.String(255), nullable=True)
    output_path = db.Column(db.String(500), nullable=True)
    statistics_json = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    completed_at = db.Column(db.DateTime, nullable=True)

    @property
    def statistics(self):
        try:
            return json.loads(self.statistics_json) if self.statistics_json else {}
        except Exception:
            return {}

    @statistics.setter
    def statistics(self, value):
        self.statistics_json = json.dumps(value)

    def to_dict(self):
        return {
            'id': self.id,
            'source_dataset': self.source_dataset,
            'num_records': self.num_records,
            'status': self.status,
            'quality_score': round(float(self.quality_score), 4) if self.quality_score is not None else None,
            'output_filename': self.output_filename,
            'download_url': f'/api/generative/synthetic-data/download/{self.id}' if self.output_filename else None,
            'statistics': self.statistics,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
        }


class ProductDescription(db.Model):
    __tablename__ = 'product_descriptions'

    id = db.Column(db.Integer, primary_key=True)
    product_name = db.Column(db.String(200), nullable=False)
    category = db.Column(db.String(80), nullable=False)
    price = db.Column(db.Float, nullable=False)
    specifications = db.Column(db.Text, nullable=True)
    generated_title = db.Column(db.Text, nullable=False)
    generated_short_desc = db.Column(db.Text, nullable=False)
    generated_long_desc = db.Column(db.Text, nullable=False)
    keywords_json = db.Column(db.Text, nullable=False)
    generation_method = db.Column(db.String(50), nullable=False, default='SmartCart AI Engine')
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    @property
    def keywords(self):
        try:
            return json.loads(self.keywords_json) if self.keywords_json else []
        except Exception:
            return []

    @keywords.setter
    def keywords(self, value):
        self.keywords_json = json.dumps(value)

    def to_dict(self):
        return {
            'id': self.id,
            'product_name': self.product_name,
            'category': self.category,
            'price': self.price,
            'specifications': self.specifications,
            'generated_title': self.generated_title,
            'generated_short_desc': self.generated_short_desc,
            'generated_long_desc': self.generated_long_desc,
            'keywords': self.keywords,
            'generation_method': self.generation_method,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
