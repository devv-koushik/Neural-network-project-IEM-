"""
Module 2 — trains the 5 comparison model variants referenced by the
frontend's Model Comparison / Training Analytics pages:

    Basic ANN, Dropout, L2 Regularization, Batch Normalization, Optimized Model

All 5 variants are trained on the PURCHASE target (this is what the
frontend's Model Comparison table and Training Analytics experiment
selector both represent). Each variant:
  - trains with EarlyStopping + validation data
  - is evaluated on the same held-out test split
  - is saved to saved_models/purchase_<slug>.keras
  - is logged to TensorBoard under logs/<slug>_model/
  - has its metrics + per-epoch history written to
    results/model_comparison.json
  - is written to the model_experiments DB table (is_experiment=False)
    so GET /api/models/comparison and GET /api/models/training-history
    are served from real data.

Run from the backend/ folder:
    python ml/training/train_optimized.py
"""
import os
import sys
import json
import time

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))
from config import Config
from ml.utils.data_loader import load_split
from ml.utils.tensorboard_utils import make_tensorboard_callback
from ml.models.architectures import build_ann
from ml.evaluation.evaluate import evaluate_predictions

EPOCHS = 45
BATCH_SIZE = 32
TARGET = 'purchase'

VARIANTS = [
    {
        'name': 'Basic ANN', 'slug': 'basic', 'status_label': 'Baseline',
        'hidden_units': 64, 'dropout': 0.0, 'l2': 0.0, 'use_batchnorm': False,
        'initialization': 'glorot', 'learning_rate': 0.001, 'batch_size': 32,
    },
    {
        'name': 'Dropout', 'slug': 'dropout', 'status_label': 'Improved',
        'hidden_units': 64, 'dropout': 0.3, 'l2': 0.0, 'use_batchnorm': False,
        'initialization': 'glorot', 'learning_rate': 0.001, 'batch_size': 32,
    },
    {
        'name': 'L2 Regularization', 'slug': 'l2', 'status_label': 'Improved',
        'hidden_units': 64, 'dropout': 0.0, 'l2': 0.002, 'use_batchnorm': False,
        'initialization': 'glorot', 'learning_rate': 0.001, 'batch_size': 32,
    },
    {
        'name': 'Batch Normalization', 'slug': 'batchnorm', 'status_label': 'Improved',
        'hidden_units': 96, 'dropout': 0.0, 'l2': 0.0, 'use_batchnorm': True,
        'initialization': 'he', 'learning_rate': 0.001, 'batch_size': 32,
    },
    {
        'name': 'Optimized Model', 'slug': 'optimized', 'status_label': 'Best',
        'hidden_units': 128, 'dropout': 0.25, 'l2': 0.0008, 'use_batchnorm': True,
        'initialization': 'he', 'learning_rate': 0.0015, 'batch_size': 64,
    },
]


def train_variant(variant, X_train, y_train, X_val, y_val, X_test, y_test):
    print(f'\n=== Training variant: {variant["name"]} ===')
    from tensorflow import keras

    model = build_ann(
        input_dim=X_train.shape[1],
        hidden_units=variant['hidden_units'],
        dropout=variant['dropout'],
        l2=variant['l2'],
        use_batchnorm=variant['use_batchnorm'],
        initialization=variant['initialization'],
        learning_rate=variant['learning_rate'],
    )

    early_stop = keras.callbacks.EarlyStopping(monitor='val_loss', patience=8, restore_best_weights=True)
    tb_callback = make_tensorboard_callback(Config.LOGS_DIR, f'{variant["slug"]}_model')

    start = time.time()
    history = model.fit(
        X_train, y_train,
        validation_data=(X_val, y_val),
        epochs=EPOCHS,
        batch_size=variant['batch_size'],
        callbacks=[early_stop, tb_callback],
        verbose=2,
    )
    elapsed = time.time() - start

    model_path = os.path.join(Config.SAVED_MODELS_DIR, f'purchase_{variant["slug"]}.keras')
    model.save(model_path)

    y_prob_test = model.predict(X_test, verbose=0).ravel()
    test_metrics = evaluate_predictions(y_test, y_prob_test)

    history_records = [
        {
            'epoch': i + 1,
            'trainAcc': round(float(history.history['accuracy'][i]), 4),
            'valAcc': round(float(history.history['val_accuracy'][i]), 4),
            'trainLoss': round(float(history.history['loss'][i]), 4),
            'valLoss': round(float(history.history['val_loss'][i]), 4),
        }
        for i in range(len(history.history['loss']))
    ]

    # EarlyStopping(restore_best_weights=True) restores the epoch with the lowest
    # val_loss, so summary stats should reflect THAT epoch rather than the last
    # epoch trained (which may be a few epochs past the best one).
    best_epoch_idx = min(range(len(history_records)), key=lambda i: history_records[i]['valLoss'])
    best_epoch = history_records[best_epoch_idx]

    result = {
        'name': variant['name'],
        'slug': variant['slug'],
        'status_label': variant['status_label'],
        'accuracy': best_epoch['trainAcc'],
        'validation_accuracy': best_epoch['valAcc'],
        'precision': test_metrics['precision'],
        'recall': test_metrics['recall'],
        'f1': test_metrics['f1'],
        'auc': test_metrics['auc'],
        'loss': best_epoch['trainLoss'],
        'val_loss': best_epoch['valLoss'],
        'training_time_seconds': round(elapsed, 2),
        'parameters': {
            'hidden_units': variant['hidden_units'],
            'dropout': variant['dropout'],
            'l2': variant['l2'],
            'use_batchnorm': variant['use_batchnorm'],
            'initialization': variant['initialization'],
            'learning_rate': variant['learning_rate'],
            'batch_size': variant['batch_size'],
            'status_label': variant['status_label'],
        },
        'history': history_records,
    }
    print(f'  Val accuracy: {result["validation_accuracy"]:.4f}  |  Test F1: {result["f1"]:.4f}  |  AUC: {result["auc"]:.4f}')
    return result


def save_to_database(results):
    from database.app_context import get_db_app
    from database.db import db
    import models  # noqa: F401 - ensures every table is registered before create_all()
    from models.experiment import ModelExperiment

    app = get_db_app()
    with app.app_context():
        db.create_all()
        # Clear previous non ad-hoc comparison rows so re-running this script doesn't duplicate them.
        ModelExperiment.query.filter_by(is_experiment=False, model_type='purchase').delete()
        for r in results:
            exp = ModelExperiment(
                name=r['name'],
                model_type='purchase',
                accuracy=r['accuracy'],
                validation_accuracy=r['validation_accuracy'],
                precision=r['precision'],
                recall=r['recall'],
                f1_score=r['f1'],
                auc=r['auc'],
                loss=r['loss'],
                val_loss=r['val_loss'],
                status='completed',
                is_experiment=False,
            )
            exp.set_parameters(r['parameters'])
            exp.set_history(r['history'])
            db.session.add(exp)
        db.session.commit()
    print('\nSaved all variants to model_experiments table.')


if __name__ == '__main__':
    X_train, y_train, X_val, y_val, X_test, y_test = load_split(target=TARGET)

    all_results = []
    for variant in VARIANTS:
        result = train_variant(variant, X_train, y_train, X_val, y_val, X_test, y_test)
        all_results.append(result)

    os.makedirs(Config.RESULTS_DIR, exist_ok=True)
    comparison_path = os.path.join(Config.RESULTS_DIR, 'model_comparison.json')
    with open(comparison_path, 'w') as f:
        json.dump(all_results, f, indent=2)
    print(f'\nSaved comparison results -> {comparison_path}')

    save_to_database(all_results)

    best = max(all_results, key=lambda r: r['validation_accuracy'])
    print(f'\nBest model: {best["name"]} (validation accuracy: {best["validation_accuracy"]:.4f})')
    print('TensorBoard: tensorboard --logdir logs')
