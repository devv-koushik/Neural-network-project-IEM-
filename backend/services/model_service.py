import json
import os

from config import Config
from models.experiment import ModelExperiment


def get_purchase_churn_metrics():
    """Powers GET /api/models/metrics - the frontend's ModelPerformance page,
    which shows the Basic ANN's accuracy/precision/recall/f1/auc plus
    per-epoch train-vs-validation accuracy/loss curves."""
    purchase_path = os.path.join(Config.RESULTS_DIR, 'purchase_metrics.json')
    if not os.path.exists(purchase_path):
        return None

    with open(purchase_path) as f:
        purchase_metrics = json.load(f)

    history = purchase_metrics.get('history', [])
    accuracy_history = [
        {'epoch': h['epoch'], 'train_acc': h['train_acc'], 'val_acc': h['val_acc']} for h in history
    ]
    loss_history = [
        {'epoch': h['epoch'], 'train_loss': h['train_loss'], 'val_loss': h['val_loss']} for h in history
    ]

    return {
        'basic_ann': {
            'name': 'Basic ANN',
            'accuracy': purchase_metrics['accuracy'],
            'precision': purchase_metrics['precision'],
            'recall': purchase_metrics['recall'],
            'f1': purchase_metrics['f1'],
            'auc': purchase_metrics['auc'],
        },
        'accuracy_history': accuracy_history,
        'loss_history': loss_history,
    }


def get_model_comparison():
    """Powers GET /api/models/comparison - reads the model_experiments table
    (is_experiment=False rows written by ml/training/train_optimized.py)."""
    experiments = (
        ModelExperiment.query.filter_by(is_experiment=False)
        .order_by(ModelExperiment.created_at.asc())
        .all()
    )
    return [e.to_comparison_dict() for e in experiments]


def get_best_model():
    experiments = ModelExperiment.query.filter_by(is_experiment=False).all()
    if not experiments:
        return None
    best = max(experiments, key=lambda e: e.validation_accuracy)
    return best.to_comparison_dict()


def get_training_history(experiment_name: str):
    """Powers GET /api/models/training-history?experiment=... - per-epoch
    curves for the Training Analytics page's experiment selector."""
    exp = (
        ModelExperiment.query.filter_by(is_experiment=False, name=experiment_name)
        .order_by(ModelExperiment.created_at.desc())
        .first()
    )
    if not exp:
        return []
    return exp.get_history()


def available_experiment_names():
    experiments = ModelExperiment.query.filter_by(is_experiment=False).order_by(ModelExperiment.id.asc()).all()
    return [e.name for e in experiments]
