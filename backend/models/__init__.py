# Import every SQLAlchemy model here so that db.create_all() (called from
# app.py) discovers all tables, and so other modules can do
# `from models import User, Customer, ...`.
from models.user import User
from models.customer import Customer, CustomerBehavior
from models.product import Product
from models.prediction import Prediction
from models.experiment import ModelExperiment
from models.image_prediction import ImagePrediction
from models.sales_forecast import SalesRecord, ForecastResult
from models.generative import SyntheticDataJob, ProductDescription

__all__ = [
    'User',
    'Customer',
    'CustomerBehavior',
    'Product',
    'Prediction',
    'ModelExperiment',
    'ImagePrediction',
    'SalesRecord',
    'ForecastResult',
    'SyntheticDataJob',
    'ProductDescription',
]
