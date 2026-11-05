"""
Module 3: Visual Product Recognition Service.
Handles image upload validation, MobileNetV2 inference caching, and prediction history.
"""
import os
import json
import uuid
import numpy as np
from PIL import Image

from config import Config
from database.db import db
from models.image_prediction import ImagePrediction

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp', 'gif'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
TARGET_SIZE = (224, 224)
CATEGORIES = ['Shoes', 'Shirts', 'Electronics', 'Accessories', 'Bags', 'Other']

# Module-level model cache to avoid re-loading on each request
_cached_model = None
_cached_classes = None


class ModelNotTrainedError(Exception):
    pass


def get_upload_dir():
    upload_dir = os.path.join(Config.BASE_DIR, 'uploads', 'visual')
    os.makedirs(upload_dir, exist_ok=True)
    return upload_dir


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def load_model():
    global _cached_model, _cached_classes
    if _cached_model is not None:
        return _cached_model, _cached_classes

    model_path = os.path.join(Config.SAVED_MODELS_DIR, 'visual_classifier.keras')
    classes_path = os.path.join(Config.SAVED_MODELS_DIR, 'visual_classes.json')

    if not os.path.exists(model_path):
        raise ModelNotTrainedError(
            'Visual classifier model not trained. Run: python ml/visual/train_visual.py'
        )

    if os.path.exists(classes_path):
        with open(classes_path, 'r') as f:
            _cached_classes = json.load(f)
    else:
        _cached_classes = CATEGORIES

    from tensorflow import keras
    _cached_model = keras.models.load_model(model_path)
    print(f'[visual_service] Loaded fine-tuned MobileNetV2 classifier with {len(_cached_classes)} classes.')
    return _cached_model, _cached_classes


def preprocess_image(file_path):
    """Identical preprocessing to training: convert to RGB, resize with bilinear interpolation to 224x224."""
    img = Image.open(file_path).convert('RGB')
    img = img.resize(TARGET_SIZE, Image.Resampling.BILINEAR)
    arr = np.array(img, dtype=np.float32)
    return np.expand_dims(arr, axis=0)


def classify_image(file_path):
    """Runs genuine deep learning inference on the image and returns category predictions."""
    model, classes = load_model()
    img_tensor = preprocess_image(file_path)

    # Genuine CNN inference output probabilities
    probs = model.predict(img_tensor, verbose=0)[0]
    probs = np.array(probs, dtype=float)

    top_indices = np.argsort(probs)[::-1]
    predicted_category = classes[top_indices[0]]
    confidence = float(probs[top_indices[0]])

    top3 = [
        {'category': classes[i], 'confidence': round(float(probs[i]), 4)}
        for i in top_indices[:3]
    ]

    return {
        'predicted_category': predicted_category,
        'confidence': round(confidence, 4),
        'top3': top3,
        'classes': classes,
    }


def save_prediction(orig_name, unique_name, file_path, result):
    pred = ImagePrediction(
        filename=unique_name,
        original_filename=orig_name,
        file_path=file_path,
        image_url=f'/api/visual-recognition/images/{unique_name}',
        predicted_category=result['predicted_category'],
        confidence=result['confidence'],
    )
    pred.top3 = result['top3']
    db.session.add(pred)
    db.session.commit()
    return pred


def get_prediction_history(page=1, per_page=20):
    query = ImagePrediction.query.order_by(ImagePrediction.created_at.desc())
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    return {
        'data': [p.to_dict() for p in pagination.items],
        'total': pagination.total,
        'page': page,
        'per_page': per_page,
        'pages': pagination.pages,
    }
