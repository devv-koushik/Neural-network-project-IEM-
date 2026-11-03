"""
Lightweight Flask app factory used ONLY by standalone scripts (training
scripts, seed.py) that need to write to the database but should not import
the full app (routes, JWT, CORS, etc.) to avoid circular imports.

Usage:
    from database.app_context import get_db_app
    app = get_db_app()
    with app.app_context():
        db.session.add(...)
        db.session.commit()
"""
import os
import sys
from flask import Flask

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from config import Config
from database.db import db


def get_db_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    db.init_app(app)
    return app
