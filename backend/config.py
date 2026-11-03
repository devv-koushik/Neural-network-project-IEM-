import os
from datetime import timedelta
from dotenv import load_dotenv

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
load_dotenv(os.path.join(BASE_DIR, '.env'))


def _env_bool(name, default=False):
    val = os.environ.get(name)
    if val is None:
        return default
    return val.strip().lower() in ('1', 'true', 'yes', 'on')


class Config:
    BASE_DIR = BASE_DIR

    # Flask
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key')
    DEBUG = _env_bool('FLASK_DEBUG', True)

    # Database
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        'DATABASE_URL', f"sqlite:///{os.path.join(BASE_DIR, 'smartcart.db')}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # JWT
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'dev-jwt-secret-key')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(
        minutes=int(os.environ.get('JWT_ACCESS_TOKEN_EXPIRES_MINUTES', 1440))
    )
    JWT_TOKEN_LOCATION = ['headers']
    JWT_HEADER_NAME = 'Authorization'
    JWT_HEADER_TYPE = 'Bearer'

    # CORS
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', 'http://localhost:5173').split(',')

    # Server
    PORT = int(os.environ.get('PORT', 5000))

    # ML paths
    ML_DATA_DIR = os.path.join(BASE_DIR, 'ml', 'data')
    SAVED_MODELS_DIR = os.path.join(BASE_DIR, 'saved_models')
    LOGS_DIR = os.path.join(BASE_DIR, 'logs')
    RESULTS_DIR = os.path.join(BASE_DIR, 'results')
    DATASET_PATH = os.path.join(ML_DATA_DIR, 'ecommerce_customers.csv')

    PURCHASE_MODEL_PATH = os.path.join(SAVED_MODELS_DIR, 'purchase_basic.keras')
    CHURN_MODEL_PATH = os.path.join(SAVED_MODELS_DIR, 'churn_basic.keras')
    SCALER_PATH = os.path.join(SAVED_MODELS_DIR, 'scaler.joblib')
    ENCODERS_PATH = os.path.join(SAVED_MODELS_DIR, 'encoders.joblib')
    FEATURE_CONFIG_PATH = os.path.join(SAVED_MODELS_DIR, 'feature_config.json')
