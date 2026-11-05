"""
Module 5: Generative AI & Synthetic Data Service.
Integrates tabular synthesis, product description generation, and executive sales reports.
"""
import os
import json
import pandas as pd
from datetime import datetime, timezone

from config import Config
from database.db import db
from models.customer import Customer, CustomerBehavior
from models.product import Product
from models.generative import SyntheticDataJob, ProductDescription
from ml.generative.synthetic_generator import generate_synthetic_tabular_data, get_output_dir
from ml.generative.description_generator import generate_product_copy, generate_sales_narrative
from services.analytics_service import dashboard_summary


def create_synthetic_data(source: str = 'customers', num_records: int = 100):
    source = 'products' if source == 'products' else 'customers'
    num_records = min(1000, max(10, int(num_records)))

    if source == 'customers':
        customers = Customer.query.all()
        data = [c.to_dict(include_behavior=True, include_latest_prediction=False) for c in customers]
        if not data:
            # Fallback to demo baseline if DB has no customers
            df_source = pd.DataFrame([{
                'name': 'Customer Demo', 'age': 32, 'gender': 'Female', 'device_type': 'Mobile',
                'browsing_time': 25.0, 'pages_viewed': 8, 'previous_purchases': 3,
                'average_order_value': 75.0, 'number_of_sessions': 4, 'cart_additions': 4,
                'cart_abandonments': 1, 'days_since_last_purchase': 12, 'customer_lifetime_value': 280.0,
                'discount_usage': 2, 'support_interactions': 0,
            }])
        else:
            df_source = pd.DataFrame(data)
    else:
        products = Product.query.all()
        data = [p.to_dict() for p in products]
        if not data:
            df_source = pd.DataFrame([{
                'name': 'Wireless Headphones', 'category': 'Electronics', 'price': 149.99,
                'rating': 4.6, 'reviews': 85, 'stock': 30,
            }])
        else:
            df_source = pd.DataFrame(data)

    syn_df, ks_stats, quality_score, filename, file_path = generate_synthetic_tabular_data(
        df_source, num_records=num_records, source_name=source
    )

    job = SyntheticDataJob(
        source_dataset=source,
        num_records=num_records,
        status='completed',
        quality_score=quality_score,
        output_filename=filename,
        output_path=file_path,
        statistics_json=json.dumps(ks_stats),
        completed_at=datetime.now(timezone.utc),
    )
    db.session.add(job)
    db.session.commit()

    # Preview first 10 rows
    preview = syn_df.head(10).to_dict(orient='records')

    return {
        'job': job.to_dict(),
        'preview': preview,
        'statistics': ks_stats,
        'quality_score': round(quality_score, 4),
        'filename': filename,
    }


def get_synthetic_history(page=1, per_page=10):
    query = SyntheticDataJob.query.order_by(SyntheticDataJob.created_at.desc())
    total = query.count()
    items = query.offset((page - 1) * per_page).limit(per_page).all()
    pages = max(1, (total + per_page - 1) // per_page)
    return {
        'items': [j.to_dict() for j in items],
        'pagination': {'page': page, 'per_page': per_page, 'total': total, 'pages': pages},
    }


def generate_description(product_name: str, category: str, price: float, specifications: str = ''):
    copy_result = generate_product_copy(
        product_name=product_name,
        category=category,
        price=price,
        specifications=specifications,
    )

    record = ProductDescription(
        product_name=product_name,
        category=category,
        price=float(price or 0.0),
        specifications=specifications,
        generated_title=copy_result['title'],
        generated_short_desc=copy_result['short_description'],
        generated_long_desc=copy_result['long_description'],
        keywords_json=json.dumps(copy_result['keywords']),
        generation_method=copy_result['method'],
    )
    db.session.add(record)
    db.session.commit()

    return record.to_dict()


def get_description_history(page=1, per_page=10):
    query = ProductDescription.query.order_by(ProductDescription.created_at.desc())
    total = query.count()
    items = query.offset((page - 1) * per_page).limit(per_page).all()
    pages = max(1, (total + per_page - 1) // per_page)
    return {
        'items': [d.to_dict() for d in items],
        'pagination': {'page': page, 'per_page': per_page, 'total': total, 'pages': pages},
    }


def generate_executive_sales_report():
    summary_data = dashboard_summary(period='30d')
    report_markdown = generate_sales_narrative(summary_data)
    return {
        'report_markdown': report_markdown,
        'metrics_snapshot': summary_data,
        'generated_at': datetime.now(timezone.utc).isoformat(),
    }
