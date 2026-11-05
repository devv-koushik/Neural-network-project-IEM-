import os
import uuid
from flask import Blueprint, request, send_from_directory
from werkzeug.utils import secure_filename

from utils import ok, err, parse_pagination
from services import visual_service

bp = Blueprint('visual_recognition', __name__, url_prefix='/api/visual-recognition')


@bp.post('/predict')
def predict():
    if 'image' not in request.files:
        return err('No image file provided in request. Key must be "image".', 'MISSING_FILE', 400)

    file = request.files['image']
    if file.filename == '':
        return err('No file selected.', 'EMPTY_FILENAME', 400)

    if not visual_service.allowed_file(file.filename):
        return err(
            f'Unsupported file format. Allowed extensions: {", ".join(visual_service.ALLOWED_EXTENSIONS)}',
            'INVALID_FORMAT', 400
        )

    # Secure unique filename
    orig_name = secure_filename(file.filename) or 'upload.jpg'
    ext = orig_name.rsplit('.', 1)[1].lower() if '.' in orig_name else 'jpg'
    unique_name = f'{uuid.uuid4().hex}.{ext}'

    upload_dir = visual_service.get_upload_dir()
    file_path = os.path.join(upload_dir, unique_name)

    try:
        file.save(file_path)

        # Check file size (max 10MB)
        if os.path.getsize(file_path) > visual_service.MAX_FILE_SIZE:
            os.remove(file_path)
            return err('Image exceeds maximum allowed size of 10MB.', 'FILE_TOO_LARGE', 400)

        # Run CNN inference
        result = visual_service.classify_image(file_path)

        # Store prediction in database
        saved_record = visual_service.save_prediction(orig_name, unique_name, file_path, result)

        return ok({
            'id': saved_record.id,
            'predicted_category': result['predicted_category'],
            'confidence': result['confidence'],
            'top3': result['top3'],
            'image_url': f'/api/visual-recognition/images/{unique_name}',
            'filename': orig_name,
            'created_at': saved_record.created_at.isoformat() if saved_record.created_at else None,
        })
    except visual_service.ModelNotTrainedError as e:
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception:
                pass
        return err(str(e), 'MODEL_NOT_TRAINED', 503)
    except Exception as e:
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception:
                pass
        return err(f'Visual recognition error: {str(e)}', 'INFERENCE_FAILED', 500)


@bp.get('/history')
def history():
    page, limit = parse_pagination(request)
    data = visual_service.get_prediction_history(page=page, per_page=limit)
    return ok(data)


@bp.get('/images/<filename>')
def serve_image(filename):
    upload_dir = visual_service.get_upload_dir()
    return send_from_directory(upload_dir, filename)


@bp.get('/status')
def status():
    return ok({
        'status': 'ready',
        'model': 'MobileNetV2 Transfer Learning',
        'categories': visual_service.CATEGORIES,
        'max_file_size_mb': 10,
        'allowed_formats': list(visual_service.ALLOWED_EXTENSIONS),
    })


@bp.get('/metrics')
def visual_metrics():
    import json
    from config import Config
    metrics_path = os.path.join(Config.RESULTS_DIR, 'visual_metrics.json')
    if not os.path.exists(metrics_path):
        return err('Visual recognition metrics not found. Train MobileNetV2 first.', 'METRICS_NOT_FOUND', 404)
    with open(metrics_path, 'r') as f:
        data = json.load(f)
    return ok(data)

