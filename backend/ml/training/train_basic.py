"""
Trains the two Module 1 baseline models:
    saved_models/purchase_basic.keras
    saved_models/churn_basic.keras

Also fits + saves the shared preprocessing artifacts (scaler, encoders,
feature_config.json) on first run, evaluates both models on a held-out
test split, and writes real metrics to:
    results/purchase_metrics.json
    results/churn_metrics.json

TensorBoard logs are written to logs/basic_model/purchase and
logs/basic_model/churn.

Run from the backend/ folder:
    python ml/training/train_basic.py
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

EPOCHS = 30
BATCH_SIZE = 32
HIDDEN_UNITS = 64


def train_one(target: str, model_path: str, run_name: str):
    print(f'\n=== Training basic ANN for target="{target}" ===')
    X_train, y_train, X_val, y_val, X_test, y_test = load_split(target=target)

    model = build_ann(input_dim=X_train.shape[1], hidden_units=HIDDEN_UNITS)

    from tensorflow import keras
    early_stop = keras.callbacks.EarlyStopping(
        monitor='val_loss', patience=6, restore_best_weights=True
    )
    tb_callback = make_tensorboard_callback(Config.LOGS_DIR, os.path.join('basic_model', run_name))

    start = time.time()
    history = model.fit(
        X_train, y_train,
        validation_data=(X_val, y_val),
        epochs=EPOCHS,
        batch_size=BATCH_SIZE,
        callbacks=[early_stop, tb_callback],
        verbose=2,
    )
    elapsed = time.time() - start

    os.makedirs(Config.SAVED_MODELS_DIR, exist_ok=True)
    model.save(model_path)

    y_prob_test = model.predict(X_test, verbose=0).ravel()
    metrics = evaluate_predictions(y_test, y_prob_test)

    history_records = [
        {
            'epoch': i + 1,
            'train_acc': float(history.history['accuracy'][i]),
            'val_acc': float(history.history['val_accuracy'][i]),
            'train_loss': float(history.history['loss'][i]),
            'val_loss': float(history.history['val_loss'][i]),
        }
        for i in range(len(history.history['loss']))
    ]

    # EarlyStopping(restore_best_weights=True) restores the lowest-val_loss epoch,
    # so report that epoch's validation accuracy rather than the last epoch trained.
    best_epoch_idx = min(range(len(history_records)), key=lambda i: history_records[i]['val_loss'])

    result = {
        'target': target,
        'accuracy': metrics['accuracy'],
        'validation_accuracy': history_records[best_epoch_idx]['val_acc'],
        'precision': metrics['precision'],
        'recall': metrics['recall'],
        'f1': metrics['f1'],
        'auc': metrics['auc'],
        'confusion_matrix': metrics['confusion_matrix'],
        'training_time_seconds': round(elapsed, 2),
        'epochs_run': len(history_records),
        'history': history_records,
    }

    os.makedirs(Config.RESULTS_DIR, exist_ok=True)
    metrics_path = os.path.join(Config.RESULTS_DIR, f'{target}_metrics.json')
    with open(metrics_path, 'w') as f:
        json.dump(result, f, indent=2)

    print(f'  Test accuracy:  {metrics["accuracy"]:.4f}')
    print(f'  Test precision: {metrics["precision"]:.4f}')
    print(f'  Test recall:    {metrics["recall"]:.4f}')
    print(f'  Test F1:        {metrics["f1"]:.4f}')
    print(f'  Test AUC:       {metrics["auc"]:.4f}')
    print(f'  Saved model  -> {model_path}')
    print(f'  Saved metrics -> {metrics_path}')
    return result


if __name__ == '__main__':
    train_one('purchase', Config.PURCHASE_MODEL_PATH, 'purchase')
    train_one('churn', Config.CHURN_MODEL_PATH, 'churn')
    print('\nDone. TensorBoard:  tensorboard --logdir logs')
