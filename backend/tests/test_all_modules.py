"""
End-to-End Test Suite for SmartCart AI (Modules 1 through 5).
Tests authentication, prediction APIs, model evaluation, visual recognition,
demand forecasting, synthetic data, and AI copy generation.
"""
import io
import os
import sys
import json
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from database.db import db
from models.user import User
from models.product import Product


@pytest.fixture(scope='session')
def app():
    os.environ['FLASK_ENV'] = 'testing'
    app = create_app()
    app.config['TESTING'] = True
    with app.app_context():
        db.create_all()
    yield app


@pytest.fixture(scope='session')
def client(app):
    return app.test_client()


@pytest.fixture(scope='session')
def admin_token(client):
    # Login with demo admin
    res = client.post('/api/auth/login', json={
        'email': 'admin@demo.com',
        'password': 'admin123',
    })
    data = res.get_json()
    if res.status_code == 200 and data.get('data', {}).get('token'):
        return data['data']['token']

    # If demo account doesn't exist, register
    res2 = client.post('/api/auth/register', json={
        'name': 'Test Admin',
        'email': 'testadmin@demo.com',
        'password': 'adminpassword123',
    })
    token = res2.get_json().get('data', {}).get('token')
    return token


# =========================================================================
# 1. Health and Multi-Module Readiness
# =========================================================================
def test_health_endpoint(client):
    res = client.get('/api/health')
    assert res.status_code == 200
    data = res.get_json()
    assert data['success'] is True
    assert 'modules' in data['data']
    assert data['data']['modules']['module3_visual_recognition']['status'] == 'ready'
    assert data['data']['modules']['module5_generative_ai']['status'] == 'ready'


# =========================================================================
# 2. Authentication & User Profile
# =========================================================================
def test_auth_me_endpoint(client, admin_token):
    res = client.get('/api/auth/me', headers={'Authorization': f'Bearer {admin_token}'})
    assert res.status_code == 200
    data = res.get_json()
    assert data['success'] is True
    assert 'email' in data['data']['user']


# =========================================================================
# 3. Module 1: AI Purchase & Churn Prediction
# =========================================================================
def test_predict_both_endpoint(client):
    payload = {
        'age': 34,
        'gender': 'Female',
        'device_type': 'Mobile',
        'browsing_time': 45.0,
        'pages_viewed': 12,
        'previous_purchases': 5,
        'average_order_value': 85.0,
        'number_of_sessions': 6,
        'cart_additions': 4,
        'cart_abandonments': 1,
        'days_since_last_purchase': 10,
        'customer_lifetime_value': 450.0,
        'discount_usage': 3,
        'support_interactions': 1,
    }
    res = client.post('/api/predict/both', json=payload)
    assert res.status_code == 200
    data = res.get_json()
    assert data['success'] is True
    assert 'purchase' in data['data']
    assert 'churn' in data['data']
    assert 0.0 <= data['data']['purchase']['probability'] <= 1.0
    assert 0.0 <= data['data']['churn']['probability'] <= 1.0


def test_predict_missing_values_handled(client):
    # Partial payload should not crash; defaults must be applied cleanly
    res = client.post('/api/predict/both', json={'age': 25})
    assert res.status_code == 200
    data = res.get_json()
    assert data['success'] is True
    assert 'purchase' in data['data']


# =========================================================================
# 4. Module 2: Model Comparison & Experiment Tuning
# =========================================================================
def test_model_comparison_endpoint(client):
    res = client.get('/api/models/comparison')
    assert res.status_code == 200
    data = res.get_json()
    assert data['success'] is True
    assert isinstance(data['data'], list)


def test_tensorboard_info_endpoint(client):
    res = client.get('/api/models/tensorboard')
    assert res.status_code == 200
    data = res.get_json()
    assert data['success'] is True
    assert 'available' in data['data']


# =========================================================================
# 5. Module 3: Visual Product Recognition
# =========================================================================
def test_visual_status_endpoint(client):
    res = client.get('/api/visual-recognition/status')
    assert res.status_code == 200
    data = res.get_json()
    assert data['success'] is True
    assert 'categories' in data['data']
    assert 'Shoes' in data['data']['categories']


def test_visual_prediction_with_image(client):
    from PIL import Image
    # Create test in-memory JPEG image
    img = Image.new('RGB', (224, 224), color=(200, 50, 50))
    byte_arr = io.BytesIO()
    img.save(byte_arr, format='JPEG')
    byte_arr.seek(0)

    res = client.post(
        '/api/visual-recognition/predict',
        data={'image': (byte_arr, 'test_product.jpg')},
        content_type='multipart/form-data',
    )
    assert res.status_code == 200
    data = res.get_json()
    assert data['success'] is True
    assert 'predicted_category' in data['data']
    assert 'confidence' in data['data']
    assert len(data['data']['top3']) == 3


# =========================================================================
# 6. Module 4: Demand Forecasting (LSTM)
# =========================================================================
def test_forecasting_products_endpoint(client):
    res = client.get('/api/forecasting/products')
    assert res.status_code == 200
    data = res.get_json()
    assert data['success'] is True
    assert len(data['data']) > 0


def test_forecasting_prediction(client):
    res = client.post('/api/forecasting/predict', json={
        'product_name': 'Premium Wireless Headphones',
        'forecast_days': 7,
    })
    assert res.status_code == 200
    data = res.get_json()
    assert data['success'] is True
    assert data['data']['forecast_period'] == 7
    assert len(data['data']['forecast_data']) == 7
    assert 'metrics' in data['data']


# =========================================================================
# 7. Module 5: Synthetic Data & Generative AI Copy
# =========================================================================
def test_product_description_generation(client, admin_token):
    res = client.post(
        '/api/generative/product-description',
        headers={'Authorization': f'Bearer {admin_token}'},
        json={
            'product_name': 'Ergonomic Desk Mat',
            'category': 'Home',
            'price': 29.99,
            'specifications': 'Waterproof PU leather, non-slip base, 80x40cm',
        },
    )
    assert res.status_code == 200
    data = res.get_json()
    assert data['success'] is True
    assert 'generated_title' in data['data']
    assert 'generated_short_desc' in data['data']
    assert len(data['data']['keywords']) > 0


def test_synthetic_data_generation(client, admin_token):
    res = client.post(
        '/api/generative/synthetic-data/generate',
        headers={'Authorization': f'Bearer {admin_token}'},
        json={'source': 'customers', 'num_records': 15},
    )
    assert res.status_code == 200
    data = res.get_json()
    assert data['success'] is True
    assert data['data']['job']['num_records'] == 15
    assert len(data['data']['preview']) > 0
    assert 0.0 <= data['data']['quality_score'] <= 1.0


def test_sales_report_generation(client, admin_token):
    res = client.post(
        '/api/generative/sales-report',
        headers={'Authorization': f'Bearer {admin_token}'},
    )
    assert res.status_code == 200
    data = res.get_json()
    assert data['success'] is True
    assert 'report_markdown' in data['data']
