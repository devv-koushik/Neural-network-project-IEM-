// Seed data + simulator for the Hyperparameter Tuning page.
// Replace runExperimentSimulation() with POST /api/experiments/run once the Flask ML service is live.

export const INITIAL_EXPERIMENT_HISTORY = [
  { id: 'exp_1', learningRate: 0.01, batchSize: 32, dropout: 0.2, hiddenUnits: 64, initialization: 'Xavier', accuracy: 0.847, valAccuracy: 0.831, f1: 0.802, loss: 0.452, timestamp: '2024-11-02 09:14' },
  { id: 'exp_2', learningRate: 0.005, batchSize: 64, dropout: 0.3, hiddenUnits: 128, initialization: 'He', accuracy: 0.861, valAccuracy: 0.849, f1: 0.819, loss: 0.418, timestamp: '2024-11-03 11:02' },
  { id: 'exp_3', learningRate: 0.001, batchSize: 32, dropout: 0.4, hiddenUnits: 128, initialization: 'He', accuracy: 0.872, valAccuracy: 0.861, f1: 0.832, loss: 0.396, timestamp: '2024-11-05 15:41' },
  { id: 'exp_4', learningRate: 0.001, batchSize: 128, dropout: 0.3, hiddenUnits: 256, initialization: 'He', accuracy: 0.893, valAccuracy: 0.881, f1: 0.854, loss: 0.351, timestamp: '2024-11-07 10:27' },
];

export const HYPERPARAM_DEFAULTS = {
  learningRate: 0.001,
  batchSize: 64,
  dropout: 0.3,
  hiddenUnits: 128,
  initialization: 'He',
};

export const LEARNING_RATES = [0.1, 0.01, 0.005, 0.001, 0.0005, 0.0001];
export const BATCH_SIZES = [16, 32, 64, 128, 256];
export const INITIALIZATIONS = ['Xavier', 'He', 'Random Normal', 'Uniform'];

/**
 * Frontend-only simulation of a hyperparameter tuning run.
 * Replace this with: axios.post('/api/experiments/run', params) once the Flask ML service is available.
 */
export function runExperimentSimulation(params) {
  const { learningRate, batchSize, dropout, hiddenUnits, initialization } = params;

  let score = 0.5;
  // Learning rate sweet spot around 0.001-0.005
  const lrDistance = Math.abs(Math.log10(learningRate) - Math.log10(0.002));
  score += Math.max(0, 0.22 - lrDistance * 0.09);
  // Larger hidden layers help up to a point
  score += Math.min(0.14, (hiddenUnits / 256) * 0.14);
  // Moderate dropout regularizes well; too high hurts
  score += dropout <= 0.5 ? 0.1 - Math.abs(dropout - 0.3) * 0.2 : -0.05;
  // Batch size sweet spot ~64-128
  score += batchSize >= 32 && batchSize <= 128 ? 0.06 : 0.01;
  // Init bonus
  score += initialization === 'He' ? 0.05 : initialization === 'Xavier' ? 0.04 : 0.01;

  const noise = (Math.random() - 0.5) * 0.03;
  const accuracy = Math.min(0.965, Math.max(0.5, score + noise));
  const valAccuracy = Math.min(accuracy - 0.01, Math.max(0.48, accuracy - 0.015 - Math.random() * 0.02));
  const f1 = Math.max(0.45, accuracy - 0.03 - Math.random() * 0.02);
  const loss = Math.max(0.12, 0.9 - accuracy * 0.75);

  return {
    accuracy: Math.round(accuracy * 1000) / 1000,
    valAccuracy: Math.round(valAccuracy * 1000) / 1000,
    f1: Math.round(f1 * 1000) / 1000,
    loss: Math.round(loss * 1000) / 1000,
  };
}
