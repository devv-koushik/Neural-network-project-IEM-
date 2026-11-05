import os
from flask import Blueprint, request, send_file

from utils import ok, err, parse_pagination, admin_required
from services import generative_service
from models.generative import SyntheticDataJob

bp = Blueprint('generative', __name__, url_prefix='/api/generative')


@bp.post('/synthetic-data/generate')
@admin_required
def generate_synthetic():
    body = request.get_json(silent=True) or {}
    source = body.get('source', 'customers')
    num_records = int(body.get('num_records', 100))

    try:
        result = generative_service.create_synthetic_data(source=source, num_records=num_records)
        return ok(result)
    except Exception as e:
        return err(f'Synthetic data generation failed: {str(e)}', 'GENERATION_FAILED', 500)


@bp.get('/synthetic-data/history')
@admin_required
def synthetic_history():
    page, limit = parse_pagination(request)
    data = generative_service.get_synthetic_history(page=page, per_page=limit)
    return ok(data)


@bp.get('/synthetic-data/download/<int:job_id>')
@admin_required
def download_synthetic(job_id):
    from database.db import db
    job = db.session.get(SyntheticDataJob, job_id)
    if not job or not job.output_path or not os.path.exists(job.output_path):
        return err('Generated synthetic dataset file not found.', 'NOT_FOUND', 404)

    return send_file(
        job.output_path,
        mimetype='text/csv',
        as_attachment=True,
        download_name=job.output_filename or f'synthetic_data_{job.id}.csv'
    )


@bp.post('/product-description')
@admin_required
def create_description():
    body = request.get_json(silent=True) or {}
    name = body.get('product_name')
    if not name:
        return err('product_name is required.', 'VALIDATION_ERROR', 400)

    category = body.get('category', 'General')
    price = float(body.get('price', 49.99))
    specs = body.get('specifications', '')

    try:
        data = generative_service.generate_description(
            product_name=name,
            category=category,
            price=price,
            specifications=specs
        )
        return ok(data)
    except Exception as e:
        return err(f'Description generation failed: {str(e)}', 'GENERATION_FAILED', 500)


@bp.get('/product-description/history')
@admin_required
def description_history():
    page, limit = parse_pagination(request)
    data = generative_service.get_description_history(page=page, per_page=limit)
    return ok(data)


@bp.post('/sales-report')
@admin_required
def sales_report():
    try:
        data = generative_service.generate_executive_sales_report()
        return ok(data)
    except Exception as e:
        return err(f'Sales report generation failed: {str(e)}', 'REPORT_FAILED', 500)

