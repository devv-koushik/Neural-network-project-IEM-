"""
Handles:
  - POST /api/experiments/run   -> single quick hyperparameter experiment
  - POST /api/training/train    -> full synchronous retrain (basic or all variants)
  - POST /api/models/train      -> alias of the above, for spec compatibility

Training runs synchronously (no background worker / task queue). For a
project of this size that is the simplest reliable option: the dataset is
small (8,000 rows) and epoch counts are kept low, so even a full retrain of
all 5 comparison models completes in well under a minute on a normal CPU.
The frontend shows a loading state while the request is in flight and reads
`status` ("completed" | "failed") from the response.
"""
import time

from database.db import db
from config import Config
from models.experiment import ModelExperiment
from ml.utils.data_loader import load_split
from ml.models.architectures import build_ann
from ml.evaluation.evaluate import evaluate_predictions


def run_single_experiment(params: dict):
    """Trains one small ANN with the given hyperparameters and records it as
    an ad hoc experiment (is_experiment=True) in model_experiments."""
    learning_rate = float(params.get('learning_rate', 0.001))
    batch_size = int(params.get('batch_size', 32))
    dropout = float(params.get('dropout', 0.3))
    hidden_units = int(params.get('hidden_units', 64))
    initialization = str(params.get('initialization', 'he'))

    for name, val, lo, hi in [
        ('learning_rate', learning_rate, 0.00001, 1.0),
        ('batch_size', batch_size, 1, 1024),
        ('dropout', dropout, 0.0, 0.9),
        ('hidden_units', hidden_units, 1, 1024),
    ]:
        if not (lo <= val <= hi):
            raise ValueError(f'{name} must be between {lo} and {hi}.')

    X_train, y_train, X_val, y_val, X_test, y_test = load_split(target='purchase')

    model = build_ann(
        input_dim=X_train.shape[1],
        hidden_units=hidden_units,
        dropout=dropout,
        initialization=initialization,
        learning_rate=learning_rate,
    )

    from tensorflow import keras
    early_stop = keras.callbacks.EarlyStopping(monitor='val_loss', patience=4, restore_best_weights=True)

    start = time.time()
    history = model.fit(
        X_train, y_train,
        validation_data=(X_val, y_val),
        epochs=18,
        batch_size=batch_size,
        callbacks=[early_stop],
        verbose=0,
    )
    elapsed = time.time() - start

    y_prob_test = model.predict(X_test, verbose=0).ravel()
    test_metrics = evaluate_predictions(y_test, y_prob_test)

    best_idx = min(range(len(history.history['val_loss'])), key=lambda i: history.history['val_loss'][i])
    train_acc = float(history.history['accuracy'][best_idx])
    val_acc = float(history.history['val_accuracy'][best_idx])
    train_loss = float(history.history['loss'][best_idx])

    exp = ModelExperiment(
        name=f'Experiment (lr={learning_rate}, bs={batch_size})',
        model_type='purchase',
        accuracy=train_acc,
        validation_accuracy=val_acc,
        precision=test_metrics['precision'],
        recall=test_metrics['recall'],
        f1_score=test_metrics['f1'],
        auc=test_metrics['auc'],
        loss=train_loss,
        val_loss=float(history.history['val_loss'][best_idx]),
        status='completed',
        is_experiment=True,
    )
    exp.set_parameters({
        'learning_rate': learning_rate, 'batch_size': batch_size, 'dropout': dropout,
        'hidden_units': hidden_units, 'initialization': initialization,
        'training_time_seconds': round(elapsed, 2),
    })
    db.session.add(exp)
    db.session.commit()

    return {
        'id': f'exp_{exp.id}',
        'accuracy': round(train_acc, 4),
        'validation_accuracy': round(val_acc, 4),
        'f1': round(test_metrics['f1'], 4),
        'loss': round(train_loss, 4),
        'auc': round(test_metrics['auc'], 4),
        'training_time_seconds': round(elapsed, 2),
    }


def list_experiments(limit: int = 50):
    experiments = (
        ModelExperiment.query.filter_by(is_experiment=True)
        .order_by(ModelExperiment.created_at.desc())
        .limit(limit)
        .all()
    )
    return [e.to_experiment_dict() for e in reversed(experiments)]


def train_full_pipeline(scope: str = 'basic'):
    """scope: 'basic' retrains the two production models (purchase_basic,
    churn_basic). 'variants' retrains all 5 Module 2 comparison models."""
    try:
        if scope == 'variants':
            from ml.training.train_optimized import VARIANTS, train_variant, save_to_database
            X_train, y_train, X_val, y_val, X_test, y_test = load_split(target='purchase')
            results = [
                train_variant(v, X_train, y_train, X_val, y_val, X_test, y_test) for v in VARIANTS
            ]
            save_to_database(results)
            return {'status': 'completed', 'message': f'Retrained {len(results)} comparison models.'}

        from ml.training.train_basic import train_one
        train_one('purchase', Config.PURCHASE_MODEL_PATH, 'purchase')
        train_one('churn', Config.CHURN_MODEL_PATH, 'churn')
        # Invalidate cached model/preprocessing objects so the next prediction
        # request picks up the freshly retrained weights.
        import services.prediction_service as prediction_service
        prediction_service._model_cache.clear()
        prediction_service._load_preprocessing_cached.cache_clear()
        return {'status': 'completed', 'message': 'Retrained purchase and churn models.'}
    except Exception as exc:  # noqa: BLE001 - surfaced to the API caller as a failure status
        return {'status': 'failed', 'message': str(exc)}
