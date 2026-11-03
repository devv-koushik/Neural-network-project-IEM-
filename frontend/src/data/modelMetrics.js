// Centralized model performance + comparison data (Module 1 & 2).
// Replace with GET /api/models/metrics when Flask ML service is connected.

export const BASIC_ANN_METRICS = {
  name: 'Basic ANN',
  accuracy: 0.847,
  precision: 0.812,
  recall: 0.793,
  f1: 0.802,
  auc: 0.891,
};

export const TRAIN_VS_VAL_ACCURACY = [
  { epoch: 1, trainAcc: 0.61, valAcc: 0.58 },
  { epoch: 2, trainAcc: 0.68, valAcc: 0.64 },
  { epoch: 3, trainAcc: 0.73, valAcc: 0.69 },
  { epoch: 4, trainAcc: 0.77, valAcc: 0.72 },
  { epoch: 5, trainAcc: 0.80, valAcc: 0.75 },
  { epoch: 6, trainAcc: 0.83, valAcc: 0.78 },
  { epoch: 7, trainAcc: 0.85, valAcc: 0.80 },
  { epoch: 8, trainAcc: 0.87, valAcc: 0.81 },
  { epoch: 9, trainAcc: 0.885, valAcc: 0.822 },
  { epoch: 10, trainAcc: 0.90, valAcc: 0.831 },
  { epoch: 11, trainAcc: 0.912, valAcc: 0.838 },
  { epoch: 12, trainAcc: 0.921, valAcc: 0.843 },
];

export const TRAIN_VS_VAL_LOSS = [
  { epoch: 1, trainLoss: 0.91, valLoss: 0.98 },
  { epoch: 2, trainLoss: 0.74, valLoss: 0.82 },
  { epoch: 3, trainLoss: 0.61, valLoss: 0.71 },
  { epoch: 4, trainLoss: 0.52, valLoss: 0.63 },
  { epoch: 5, trainLoss: 0.45, valLoss: 0.58 },
  { epoch: 6, trainLoss: 0.39, valLoss: 0.54 },
  { epoch: 7, trainLoss: 0.34, valLoss: 0.51 },
  { epoch: 8, trainLoss: 0.30, valLoss: 0.49 },
  { epoch: 9, trainLoss: 0.27, valLoss: 0.475 },
  { epoch: 10, trainLoss: 0.24, valLoss: 0.465 },
  { epoch: 11, trainLoss: 0.22, valLoss: 0.458 },
  { epoch: 12, trainLoss: 0.20, valLoss: 0.452 },
];

// Module 2: Model comparison across regularization strategies.
export const MODEL_COMPARISON = [
  { model: 'Basic ANN', accuracy: 0.847, valAccuracy: 0.831, precision: 0.812, recall: 0.793, f1: 0.802, auc: 0.891, status: 'Baseline' },
  { model: 'Dropout', accuracy: 0.861, valAccuracy: 0.849, precision: 0.828, recall: 0.811, f1: 0.819, auc: 0.902, status: 'Improved' },
  { model: 'L2 Regularization', accuracy: 0.858, valAccuracy: 0.845, precision: 0.822, recall: 0.808, f1: 0.815, auc: 0.898, status: 'Improved' },
  { model: 'Batch Normalization', accuracy: 0.872, valAccuracy: 0.861, precision: 0.839, recall: 0.826, f1: 0.832, auc: 0.911, status: 'Improved' },
  { model: 'Optimized Model', accuracy: 0.893, valAccuracy: 0.881, precision: 0.861, recall: 0.847, f1: 0.854, auc: 0.928, status: 'Best' },
];

export const bestModel = () => MODEL_COMPARISON.reduce((a, b) => (b.valAccuracy > a.valAccuracy ? b : a));
