from datetime import datetime, timedelta, timezone
from sqlalchemy import func

from database.db import db
from models.customer import Customer
from models.product import Product
from models.prediction import Prediction
from models.experiment import ModelExperiment

PERIOD_DAYS = {'today': 1, '7d': 7, '30d': 30, '90d': 90}


def _period_start(period: str):
    days = PERIOD_DAYS.get(period, 30)
    return datetime.now(timezone.utc) - timedelta(days=days)


def customer_statistics():
    total = Customer.query.count()
    predictions = Prediction.query.all()
    if predictions:
        avg_purchase = sum(p.purchase_probability for p in predictions) / len(predictions)
    else:
        avg_purchase = 0.0
    high_churn = Prediction.query.filter_by(churn_risk='High').count()
    return {
        'total_customers': total,
        'avg_purchase_probability': round(avg_purchase, 3),
        'high_churn_risk': high_churn,
    }


def age_distribution():
    buckets = [('18-24', 18, 24), ('25-34', 25, 34), ('35-44', 35, 44), ('45-54', 45, 54), ('55+', 55, 200)]
    result = []
    for label, lo, hi in buckets:
        count = Customer.query.filter(Customer.age >= lo, Customer.age <= hi).count()
        result.append({'bucket': label, 'count': count})
    return result


def churn_distribution():
    colors = {'Low': '#2BD9A8', 'Medium': '#F5A623', 'High': '#F5566B'}
    result = []
    for risk in ('Low', 'Medium', 'High'):
        # latest prediction per customer determines their current risk bucket
        count = (
            db.session.query(Customer.id)
            .join(Prediction, Prediction.customer_id == Customer.id)
            .filter(Prediction.churn_risk == risk)
            .distinct()
            .count()
        )
        result.append({'name': risk, 'value': count, 'color': colors[risk]})
    return result


def customer_growth():
    """Cumulative customer signups by month, for the last 12 months."""
    now = datetime.now(timezone.utc)
    result = []
    cursor = now.replace(day=1)
    month_starts = []
    for i in range(11, -1, -1):
        # step back i months from the current month
        year = cursor.year
        month = cursor.month - i
        while month <= 0:
            month += 12
            year -= 1
        month_starts.append(datetime(year, month, 1, tzinfo=timezone.utc))

    for idx, start in enumerate(month_starts):
        if idx + 1 < len(month_starts):
            end = month_starts[idx + 1]
        else:
            end = start + timedelta(days=32)
            end = end.replace(day=1)
        count = Customer.query.filter(Customer.created_at >= start, Customer.created_at < end).count()
        result.append({'month': start.strftime('%b'), 'customers': count})

    # Growth charts read best as *cumulative* signups, matching the frontend's mock trend.
    cumulative = []
    running_total = Customer.query.filter(Customer.created_at < month_starts[0]).count()
    for row in result:
        running_total += row['customers']
        cumulative.append({'month': row['month'], 'customers': running_total})
    return cumulative


def prediction_trend(period: str):
    start = _period_start(period)
    predictions = Prediction.query.filter(Prediction.created_at >= start).order_by(Prediction.created_at).all()

    if period == 'today':
        buckets = {f'{h}:00': 0 for h in range(0, 24, 4)}
        for p in predictions:
            hour = (p.created_at.hour // 4) * 4
            key = f'{hour}:00'
            buckets[key] = buckets.get(key, 0) + 1
        return [{'label': k, 'value': v} for k, v in buckets.items()]

    if period == '7d':
        buckets = {}
        for i in range(6, -1, -1):
            day = (datetime.now(timezone.utc) - timedelta(days=i)).strftime('%a')
            buckets[day] = 0
        for p in predictions:
            day = p.created_at.strftime('%a')
            if day in buckets:
                buckets[day] += 1
        return [{'label': k, 'value': v} for k, v in buckets.items()]

    # 30d / 90d -> weekly or monthly buckets
    bucket_size = 7 if period == '30d' else 30
    buckets = {}
    for p in predictions:
        days_ago = (datetime.now(timezone.utc) - p.created_at.replace(tzinfo=timezone.utc)).days
        bucket_idx = days_ago // bucket_size
        label = f'W{bucket_idx + 1}' if period == '30d' else f'M{bucket_idx + 1}'
        buckets[label] = buckets.get(label, 0) + 1
    ordered = sorted(buckets.items(), key=lambda kv: kv[0])
    return [{'label': k, 'value': v} for k, v in reversed(ordered)]


def purchase_distribution():
    likely = Prediction.query.filter_by(purchase_prediction='Likely to Buy').count()
    unlikely = Prediction.query.filter_by(purchase_prediction='Unlikely to Buy').count()
    return [
        {'name': 'Likely to Buy', 'value': likely, 'color': '#2BD9A8'},
        {'name': 'Unlikely to Buy', 'value': unlikely, 'color': '#F5566B'},
    ]


def dashboard_summary(period: str = '30d'):
    stats = customer_statistics()
    total_predictions = Prediction.query.count()
    active_products = Product.query.filter(Product.stock > 0).count()

    best_experiment = (
        ModelExperiment.query.filter_by(is_experiment=False)
        .order_by(ModelExperiment.validation_accuracy.desc())
        .first()
    )
    best_model_accuracy = round(best_experiment.validation_accuracy, 4) if best_experiment else None

    return {
        'total_customers': stats['total_customers'],
        'total_predictions': total_predictions,
        'avg_purchase_probability': stats['avg_purchase_probability'],
        'high_churn_risk': stats['high_churn_risk'],
        'best_model_accuracy': best_model_accuracy,
        'active_products': active_products,
        'customer_growth': customer_growth(),
        'prediction_trend': prediction_trend(period),
        'purchase_distribution': purchase_distribution(),
        'churn_distribution': churn_distribution(),
    }
