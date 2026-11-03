"""
Shared evaluation helpers. Computes real metrics from real predictions —
never hardcoded.
"""
import numpy as np
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix,
)


def evaluate_predictions(y_true, y_prob, threshold: float = 0.5):
    y_true = np.asarray(y_true).astype(int).ravel()
    y_prob = np.asarray(y_prob).astype(float).ravel()
    y_pred = (y_prob >= threshold).astype(int)

    try:
        auc = roc_auc_score(y_true, y_prob)
    except ValueError:
        # AUC is undefined if y_true has only one class in this split
        auc = 0.5

    cm = confusion_matrix(y_true, y_pred).tolist()

    return {
        'accuracy': float(accuracy_score(y_true, y_pred)),
        'precision': float(precision_score(y_true, y_pred, zero_division=0)),
        'recall': float(recall_score(y_true, y_pred, zero_division=0)),
        'f1': float(f1_score(y_true, y_pred, zero_division=0)),
        'auc': float(auc),
        'confusion_matrix': cm,
    }
