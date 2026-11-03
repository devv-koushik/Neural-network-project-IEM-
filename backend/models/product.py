from datetime import datetime, timezone
from database.db import db


class Product(db.Model):
    __tablename__ = 'products'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    category = db.Column(db.String(80), nullable=False, index=True)
    price = db.Column(db.Float, nullable=False)
    rating = db.Column(db.Float, nullable=False, default=4.5)
    reviews = db.Column(db.Integer, nullable=False, default=0)
    stock = db.Column(db.Integer, nullable=False, default=0)
    description = db.Column(db.Text, nullable=True)
    image_url = db.Column(db.String(255), nullable=True)
    color = db.Column(db.String(20), nullable=True, default='#5B6EF5')
    featured = db.Column(db.Boolean, nullable=False, default=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'category': self.category,
            'price': self.price,
            'rating': self.rating,
            'reviews': self.reviews,
            'stock': self.stock,
            'description': self.description,
            'image_url': self.image_url,
            'color': self.color,
            'featured': self.featured,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
