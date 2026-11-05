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

    if os.path.exists(classes_path):
        with open(classes_path, 'r') as f:
            _cached_classes = json.load(f)
    else:
        _cached_classes = CATEGORIES

    if os.path.exists(model_path):
        from tensorflow import keras
        try:
            _cached_model = keras.models.load_model(model_path)
            print('[visual_service] Loaded fine-tuned MobileNetV2 classifier.')
            return _cached_model, _cached_classes
        except Exception as e:
            print(f'[visual_service] Error loading saved model: {e}. Falling back to base MobileNetV2.')

    # Fallback: Load pretrained MobileNetV2 with ImageNet mapping
    from tensorflow.keras.applications.mobilenet_v2 import MobileNetV2
    print('[visual_service] Initializing pretrained MobileNetV2 feature network.')
    _cached_model = MobileNetV2(weights='imagenet', input_shape=(224, 224, 3))
    return _cached_model, _cached_classes


def preprocess_image(file_path):
    img = Image.open(file_path).convert('RGB')
    img = img.resize(TARGET_SIZE, Image.Resampling.BILINEAR)
    arr = np.array(img, dtype=np.float32)
    return np.expand_dims(arr, axis=0)


def classify_image(file_path):
    """Runs deep learning inference on the image and returns category predictions."""
    model, classes = load_model()
    img_tensor = preprocess_image(file_path)

    # Check whether the model is our 6-class classifier or 1000-class ImageNet
    if model.output_shape[-1] == len(classes):
        probs = model.predict(img_tensor, verbose=0)[0]
    else:
        # Pretrained MobileNetV2 on ImageNet -> decode and aggregate to our e-commerce categories
        from tensorflow.keras.applications.mobilenet_v2 import preprocess_input, decode_predictions
        norm_img = preprocess_input(img_tensor.copy())
        raw_preds = model.predict(norm_img, verbose=0)
        decoded = decode_predictions(raw_preds, top=20)[0]

        # Semantic cluster mapping from ImageNet synsets to 6 categories
        category_weights = {c: 0.05 for c in classes}
        for _, label, prob in decoded:
            label_lower = label.lower()
            if any(k in label_lower for k in ['shoe', 'boot', 'sandal', 'loafer', 'sneaker', 'clog']):
                category_weights['Shoes'] += float(prob)
            elif any(k in label_lower for k in ['shirt', 'jersey', 'suit', 'jacket', 'coat', 'jean', 'dress', 'cardigan', 'trench']):
                category_weights['Shirts'] += float(prob)
            elif any(k in label_lower for k in ['cellular', 'phone', 'computer', 'laptop', 'mouse', 'keyboard', 'screen', 'monitor', 'camera', 'ipod', 'television', 'radio']):
                category_weights['Electronics'] += float(prob)
            elif any(k in label_lower for k in ['watch', 'sunglasses', 'glasses', 'umbrella', 'wallet', 'necklace', 'buckle', 'whistle']):
                category_weights['Accessories'] += float(prob)
            elif any(k in label_lower for k in ['backpack', 'bag', 'purse', 'basket', 'luggage', 'sack']):
                category_weights['Bags'] += float(prob)
            else:
                category_weights['Other'] += float(prob) * 0.5

        total_weight = sum(category_weights.values())
        probs = np.array([category_weights[c] / total_weight for c in classes])

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


def save_prediction(original_filename, stored_filename, file_path, result):
    pred = ImagePrediction(
        filename=stored_filename,
        original_filename=original_filename,
        file_path=file_path,
        image_url=f'/api/visual-recognition/images/{stored_filename}',
        predicted_category=result['predicted_category'],
        confidence=result['confidence'],
        top3_json=json.dumps(result['top3']),
        status='completed',
    )
    db.session.add(pred)
    db.session.commit()
    return pred


def get_prediction_history(page=1, per_page=10):
    query = ImagePrediction.query.order_by(ImagePrediction.created_at.desc())
    total = query.count()
    items = query.offset((page - 1) * per_page).limit(per_page).all()
    pages = max(1, (total + per_page - 1) // per_page)
    return {
        'items': [p.to_dict() for p in items],
        'pagination': {'page': page, 'per_page': per_page, 'total': total, 'pages': pages},
    }
