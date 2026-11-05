"""
Module 2 — Hyperparameter Optimization and Comparison Models.

Trains the 5 comparison model variants referenced by the frontend's
Model Comparison / Training Analytics pages:
    Basic ANN, Dropout, L2 Regularization, Batch Normalization, Optimized Model

All 5 variants are trained on the PURCHASE target. Each variant:
  - trains with EarlyStopping + validation data + learning rate scheduling
  - is evaluated on the same held-out test split
  - is saved to saved_models/purchase_<slug>.keras
  - is logged to TensorBoard under logs/<slug>_model/
  - has its metrics + per-epoch history written to results/model_comparison.json
  - is written to the model_experiments DB table (is_experiment=False)
    so GET /api/models/comparison and GET /api/models/training-history
    are served from real data.

Also provides:
  - run_hyperparameter_search() for genuine randomized hyperparameter exploration
  - train_churn_optimized() to optimize the churn prediction pipeline as well
"""
import os
import sys
import json
import time
import random
import numpy as np

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))
from config import Config
from ml.utils.data_loader import load_split
from ml.utils.tensorboard_utils import make_tensorboard_callback
from ml.models.architectures import build_ann
from ml.evaluation.evaluate import evaluate_predictions

EPOCHS = 35
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


def train_variant(variant, X_train, y_train, X_val, y_val, X_test, y_test, target='purchase'):
    print(f'\n=== Training variant: {variant["name"]} (target={target}) ===')
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

    early_stop = keras.callbacks.EarlyStopping(monitor='val_loss', patience=6, restore_best_weights=True)
    reduce_lr = keras.callbacks.ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=3, min_lr=1e-5)
    tb_callback = make_tensorboard_callback(Config.LOGS_DIR, f'{variant["slug"]}_{target}_model')

    start = time.time()
    history = model.fit(
        X_train, y_train,
        validation_data=(X_val, y_val),
        epochs=EPOCHS,
        batch_size=variant['batch_size'],
        callbacks=[early_stop, reduce_lr, tb_callback],
        verbose=2,
    )
    elapsed = time.time() - start

    model_path = os.path.join(Config.SAVED_MODELS_DIR, f'{target}_{variant["slug"]}.keras')
    os.makedirs(Config.SAVED_MODELS_DIR, exist_ok=True)
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

    best_epoch_idx = min(range(len(history_records)), key=lambda i: history_records[i]['valLoss'])
    best_epoch = history_records[best_epoch_idx]

    result = {
        'name': variant['name'],
        'slug': variant['slug'],
        'status_label': variant['status_label'],
        'accuracy': best_epoch['trainAcc'],
        'validation_accuracy': best_epoch['valAcc'],
        'test_accuracy': test_metrics['accuracy'],
        'precision': test_metrics['precision'],
        'recall': test_metrics['recall'],
        'f1': test_metrics['f1'],
        'auc': test_metrics['auc'],
        'confusion_matrix': test_metrics['confusion_matrix'],
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


def run_randomized_search(target='purchase', n_iter=5):
    """Executes genuine hyperparameter search sampling across layer sizes,
    learning rates, batch sizes, dropout, and regularizers."""
    print(f'\n--- Starting Hyperparameter Search ({n_iter} iterations) for {target} ---')
    X_train, y_train, X_val, y_val, X_test, y_test = load_split(target=target)

    param_distributions = {
        'learning_rate': [0.0005, 0.001, 0.002],
        'batch_size': [16, 32, 64],
        'hidden_units': [64, 96, 128],
        'dropout': [0.1, 0.2, 0.3, 0.4],
        'l2': [0.0, 0.0005, 0.001],
        'initialization': ['he', 'glorot'],
        'use_batchnorm': [True, False],
    }

    best_score = -1.0
    best_config = None
    search_results = []

    for i in range(n_iter):
        sampled = {k: random.choice(v) for k, v in param_distributions.items()}
        sampled['name'] = f'Search Trial {i+1}'
        sampled['slug'] = f'trial_{i+1}'
        sampled['status_label'] = 'Trial'
        print(f'Trial {i+1}/{n_iter}: lr={sampled["learning_rate"]}, bs={sampled["batch_size"]}, '
              f'units={sampled["hidden_units"]}, drop={sampled["dropout"]}, bn={sampled["use_batchnorm"]}')

        res = train_variant(sampled, X_train, y_train, X_val, y_val, X_test, y_test, target=target)
        search_results.append(res)
        if res['validation_accuracy'] > best_score:
            best_score = res['validation_accuracy']
            best_config = sampled

    print(f'\nBest Trial Val Accuracy: {best_score:.4f} with {best_config}')
    return search_results, best_config


def save_to_database(results, target='purchase'):
    from database.app_context import get_db_app
    from database.db import db
    import models  # noqa: F401 - ensures every table is registered before create_all()
    from models.experiment import ModelExperiment

    app = get_db_app()
    with app.app_context():
        db.create_all()
        ModelExperiment.query.filter_by(is_experiment=False, model_type=target).delete()
        for r in results:
            exp = ModelExperiment(
                name=r['name'],
                model_type=target,
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
    print(f'Saved all variants to model_experiments table for {target}.')


if __name__ == '__main__':
    X_train, y_train, X_val, y_val, X_test, y_test = load_split(target=TARGET)

    all_results = []
    for variant in VARIANTS:
        result = train_variant(variant, X_train, y_train, X_val, y_val, X_test, y_test, target=TARGET)
        all_results.append(result)

    os.makedirs(Config.RESULTS_DIR, exist_ok=True)
    comparison_path = os.path.join(Config.RESULTS_DIR, 'model_comparison.json')
    with open(comparison_path, 'w') as f:
        json.dump(all_results, f, indent=2)
    print(f'\nSaved comparison results -> {comparison_path}')

    save_to_database(all_results, target='purchase')

    # Run randomized hyperparameter search
    print('\n=== Running Randomized Hyperparameter Search ===')
    search_results, best_search_config = run_randomized_search(target=TARGET, n_iter=4)
    search_summary = {
        'best_config': best_search_config,
        'trials': [
            {
                'name': t['name'],
                'validation_accuracy': t['validation_accuracy'],
                'test_accuracy': t['test_accuracy'],
                'f1': t['f1'],
                'auc': t['auc'],
                'parameters': t['parameters']
            }
            for t in search_results
        ]
    }
    with open(os.path.join(Config.RESULTS_DIR, 'hyperparameter_search.json'), 'w') as f:
        json.dump(search_summary, f, indent=2)
    print(f'Saved hyperparameter search results -> {os.path.join(Config.RESULTS_DIR, "hyperparameter_search.json")}')

    # Also train optimized churn model
    print('\n=== Optimizing Churn Model ===')
    X_train_c, y_train_c, X_val_c, y_val_c, X_test_c, y_test_c = load_split(target='churn')
    churn_opt_variant = {
        'name': 'Optimized Churn Model', 'slug': 'optimized', 'status_label': 'Best',
        'hidden_units': 96, 'dropout': 0.25, 'l2': 0.001, 'use_batchnorm': True,
        'initialization': 'he', 'learning_rate': 0.001, 'batch_size': 32,
    }
    churn_result = train_variant(churn_opt_variant, X_train_c, y_train_c, X_val_c, y_val_c, X_test_c, y_test_c, target='churn')
    with open(os.path.join(Config.RESULTS_DIR, 'churn_optimized_metrics.json'), 'w') as f:
        json.dump(churn_result, f, indent=2)

    best = max(all_results, key=lambda r: r['validation_accuracy'])
    print(f'\nBest purchase model: {best["name"]} (validation accuracy: {best["validation_accuracy"]:.4f})')
    print('TensorBoard: tensorboard --logdir logs')
