# Import every SQLAlchemy model here so that db.create_all() (called from
# app.py) discovers all tables, and so other modules can do
# `from models import User, Customer, ...`.
from models.user import User
from models.customer import Customer, CustomerBehavior
from models.product import Product
from models.prediction import Prediction
from models.experiment import ModelExperiment

__all__ = ['User', 'Customer', 'CustomerBehavior', 'Product', 'Prediction', 'ModelExperiment']
