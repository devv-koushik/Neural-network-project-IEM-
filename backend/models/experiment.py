import json
from datetime import datetime, timezone
from database.db import db


class ModelExperiment(db.Model):
    __tablename__ = 'model_experiments'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False)  # e.g. "Basic ANN", "Dropout", "Optimized Model"
    model_type = db.Column(db.String(30), nullable=False, default='purchase')  # 'purchase' | 'churn'
    accuracy = db.Column(db.Float, nullable=False)
    validation_accuracy = db.Column(db.Float, nullable=False)
    precision = db.Column(db.Float, nullable=False)
    recall = db.Column(db.Float, nullable=False)
    f1_score = db.Column(db.Float, nullable=False)
    auc = db.Column(db.Float, nullable=False)
    loss = db.Column(db.Float, nullable=True)
    val_loss = db.Column(db.Float, nullable=True)
    parameters = db.Column(db.Text, nullable=True)  # JSON-encoded hyperparameters
    history = db.Column(db.Text, nullable=True)  # JSON-encoded per-epoch training history
    status = db.Column(db.String(20), nullable=False, default='completed')  # training | completed | failed
    is_experiment = db.Column(db.Boolean, nullable=False, default=False)  # True = ad hoc hyperparameter run
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def get_parameters(self):
        if not self.parameters:
            return {}
        try:
            return json.loads(self.parameters)
        except (ValueError, TypeError):
            return {}

    def set_parameters(self, params_dict):
        self.parameters = json.dumps(params_dict)

    def get_history(self):
        if not self.history:
            return []
        try:
            return json.loads(self.history)
        except (ValueError, TypeError):
            return []

    def set_history(self, history_list):
        self.history = json.dumps(history_list)

    def to_comparison_dict(self):
        """Shape matching the frontend's MODEL_COMPARISON mock structure."""
        best_flag = self.parameters and 'is_best' in self.get_parameters()
        return {
            'model': self.name,
            'accuracy': round(self.accuracy, 4),
            'val_accuracy': round(self.validation_accuracy, 4),
            'precision': round(self.precision, 4),
            'recall': round(self.recall, 4),
            'f1': round(self.f1_score, 4),
            'auc': round(self.auc, 4),
            'status': self.get_parameters().get('status_label', 'Improved'),
        }

    def to_experiment_dict(self):
        """Shape matching the frontend's INITIAL_EXPERIMENT_HISTORY mock structure."""
        params = self.get_parameters()
        return {
            'id': f'exp_{self.id}',
            'learning_rate': params.get('learning_rate'),
            'batch_size': params.get('batch_size'),
            'dropout': params.get('dropout'),
            'hidden_units': params.get('hidden_units'),
            'initialization': params.get('initialization'),
            'accuracy': round(self.accuracy, 4),
            'val_accuracy': round(self.validation_accuracy, 4),
            'f1': round(self.f1_score, 4),
            'loss': round(self.loss, 4) if self.loss is not None else None,
            'timestamp': self.created_at.strftime('%Y-%m-%d %H:%M') if self.created_at else None,
        }

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'model_type': self.model_type,
            'accuracy': round(self.accuracy, 4),
            'validation_accuracy': round(self.validation_accuracy, 4),
            'precision': round(self.precision, 4),
            'recall': round(self.recall, 4),
            'f1_score': round(self.f1_score, 4),
            'auc': round(self.auc, 4),
            'loss': self.loss,
            'val_loss': self.val_loss,
            'parameters': self.get_parameters(),
            'status': self.status,
            'is_experiment': self.is_experiment,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
