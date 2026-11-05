import json
from datetime import datetime, timezone
from database.db import db


class ImagePrediction(db.Model):
    __tablename__ = 'image_predictions'

    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(255), nullable=False)
    original_filename = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(500), nullable=False)
    image_url = db.Column(db.String(500), nullable=True)
    predicted_category = db.Column(db.String(80), nullable=False)
    confidence = db.Column(db.Float, nullable=False)
    top3_json = db.Column(db.Text, nullable=False)  # JSON-encoded list of {category, confidence}
    status = db.Column(db.String(20), nullable=False, default='completed')
    error_message = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    @property
    def top3(self):
        try:
            return json.loads(self.top3_json) if self.top3_json else []
        except Exception:
            return []

    @top3.setter
    def top3(self, value):
        self.top3_json = json.dumps(value)

    def to_dict(self):
        return {
            'id': self.id,
            'filename': self.filename,
            'original_filename': self.original_filename,
            'image_url': self.image_url or f'/uploads/visual/{self.filename}',
            'predicted_category': self.predicted_category,
            'confidence': round(float(self.confidence), 4),
            'top3': self.top3,
            'status': self.status,
            'error_message': self.error_message,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
