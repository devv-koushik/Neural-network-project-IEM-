from flask_sqlalchemy import SQLAlchemy

# Single SQLAlchemy instance shared across the whole app.
# Imported by app.py (db.init_app) and by every model module.
db = SQLAlchemy()
