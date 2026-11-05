"""
SmartCart AI backend entry point.

Run:
    python app.py

On startup this:
  1. Creates the SQLite database file if it doesn't exist.
  2. Creates all tables (idempotent - safe to run every time).
  3. Seeds demo data (users, customers, products, historical predictions)
     if the database is empty.
  4. Checks whether trained ML models exist and prints a clear message if
     they don't, WITHOUT automatically starting an expensive training run.
"""
import os
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager

from config import Config
from database.db import db


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    jwt = JWTManager(app)
    CORS(app, resources={r'/api/*': {'origins': Config.CORS_ORIGINS}}, supports_credentials=True)

    # Keep every auth-related failure in the same {success, error} envelope
    # as the rest of the API, instead of flask-jwt-extended's default shape.
    @jwt.unauthorized_loader
    def _missing_token(reason):
        return jsonify({'success': False, 'error': {'code': 'UNAUTHORIZED', 'message': 'Authentication required.'}}), 401

    @jwt.invalid_token_loader
    def _invalid_token(reason):
        return jsonify({'success': False, 'error': {'code': 'INVALID_TOKEN', 'message': 'Invalid or malformed token.'}}), 401

    @jwt.expired_token_loader
    def _expired_token(header, payload):
        return jsonify({'success': False, 'error': {'code': 'TOKEN_EXPIRED', 'message': 'Session expired. Please log in again.'}}), 401

    # Import models so db.create_all() below can see every table.
    import models  # noqa: F401

    from routes.auth import bp as auth_bp
    from routes.customers import bp as customers_bp
    from routes.products import bp as products_bp
    from routes.predictions import bp as predictions_bp
    from routes.analytics import bp as analytics_bp
    from routes.models import bp as models_bp
    from routes.experiments import bp as experiments_bp
    from routes.training import bp as training_bp
    from routes.visual_recognition import bp as visual_bp
    from routes.forecasting import bp as forecasting_bp
    from routes.generative import bp as generative_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(customers_bp)
    app.register_blueprint(products_bp)
    app.register_blueprint(predictions_bp)
    app.register_blueprint(analytics_bp)
    app.register_blueprint(models_bp)
    app.register_blueprint(experiments_bp)
    app.register_blueprint(training_bp)
    app.register_blueprint(visual_bp)
    app.register_blueprint(forecasting_bp)
    app.register_blueprint(generative_bp)

    @app.get('/api/health')
    def health():
        from services.prediction_service import models_available
        from services.forecasting_service import load_forecasting_artifacts
        lstm_model, _ = load_forecasting_artifacts()
        return jsonify({
            'success': True,
            'data': {
                'status': 'ok',
                'models_trained': models_available(),
                'modules': {
                    'module1_sales_customer': {'status': 'ready' if models_available() else 'pending'},
                    'module2_optimization': {'status': 'ready'},
                    'module3_visual_recognition': {'status': 'ready', 'engine': 'MobileNetV2 Transfer Learning'},
                    'module4_demand_forecasting': {'status': 'ready' if lstm_model is not None else 'ready_baseline', 'engine': 'LSTM Time-Series'},
                    'module5_generative_ai': {'status': 'ready', 'engines': ['KS-Synthetic-Data', 'Neural-Copywriter']},
                },
            },
        })

    @app.get('/dataset/<path:filename>')
    def serve_dataset_media(filename):
        dataset_dir = os.path.join(Config.BASE_DIR, 'ml', 'visual', 'dataset', 'raw')
        return send_from_directory(dataset_dir, filename)

    # ---- Consistent error envelope for uncaught errors ----
    @app.errorhandler(404)
    def not_found(_e):
        return jsonify({'success': False, 'error': {'code': 'NOT_FOUND', 'message': 'Resource not found.'}}), 404

    @app.errorhandler(405)
    def method_not_allowed(_e):
        return jsonify({'success': False, 'error': {'code': 'METHOD_NOT_ALLOWED', 'message': 'Method not allowed.'}}), 405

    @app.errorhandler(500)
    def server_error(_e):
        return jsonify({'success': False, 'error': {'code': 'SERVER_ERROR', 'message': 'Internal server error.'}}), 500

    return app


def startup_checks(app):
    with app.app_context():
        db.create_all()

        from models.user import User
        from services.prediction_service import models_available

        from database.seed import seed_core, seed_predictions
        from models.prediction import Prediction

        if User.query.count() == 0:
            print('\nDatabase is empty. Seeding demo data...')
            seed_core()
        else:
            print('\nDatabase already contains data - skipping core seed.')

        if models_available():
            print('Trained models found (purchase_basic.keras, churn_basic.keras).')
            if Prediction.query.count() == 0:
                print('Backfilling historical predictions now that models are trained...')
                seed_predictions()
        else:
            print('=' * 70)
            print('WARNING: No trained models found.')
            print('Purchase/churn prediction endpoints will return a 503 until you run:')
            print('    python ml/data/generate_dataset.py')
            print('    python ml/training/train_basic.py')
            print('    python ml/training/train_optimized.py   (for Model Comparison data)')
            print('=' * 70)


app = create_app()

if __name__ == '__main__':
    startup_checks(app)
    print(f'\nSmartCart AI backend running on http://localhost:{Config.PORT}')
    print(f'CORS allowed origins: {Config.CORS_ORIGINS}')
    app.run(host='0.0.0.0', port=Config.PORT, debug=Config.DEBUG, use_reloader=False)
