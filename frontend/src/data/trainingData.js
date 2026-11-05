// Mock per-experiment training history for the Training Analytics page.
// Keys match the EXACT experiment names returned by the backend
// (GET /api/models/experiment-names → model_experiments table).

function buildHistory(seedAcc, seedLoss, epochs = 15) {
  const history = [];
  let trainAcc = seedAcc.start;
  let valAcc = seedAcc.start - 0.04;
  let trainLoss = seedLoss.start;
  let valLoss = seedLoss.start + 0.08;
  for (let e = 1; e <= epochs; e++) {
    trainAcc = Math.min(0.97, trainAcc + seedAcc.step * (1 - trainAcc));
    valAcc = Math.min(seedAcc.cap, valAcc + seedAcc.step * 0.82 * (1 - valAcc));
    trainLoss = Math.max(0.04, trainLoss * (1 - seedLoss.step));
    valLoss = Math.max(seedLoss.floor, valLoss * (1 - seedLoss.step * 0.78));
    history.push({
      epoch: e,
      trainAcc: Math.round(trainAcc * 1000) / 1000,
      valAcc: Math.round(valAcc * 1000) / 1000,
      trainLoss: Math.round(trainLoss * 1000) / 1000,
      valLoss: Math.round(valLoss * 1000) / 1000,
    });
  }
  return history;
}

// Keys match EXACTLY the names stored in the model_experiments table
// by train_optimized.py: 'Basic ANN', 'Dropout', 'L2 Regularization',
// 'Batch Normalization', 'Optimized Model'.
export const TRAINING_HISTORY = {
  'Basic ANN':          buildHistory({ start: 0.55, step: 0.09, cap: 0.86  }, { start: 1.05, step: 0.16,  floor: 0.46 }),
  'Dropout':            buildHistory({ start: 0.53, step: 0.085, cap: 0.87 }, { start: 1.08, step: 0.15,  floor: 0.42 }),
  'L2 Regularization':  buildHistory({ start: 0.54, step: 0.086, cap: 0.865}, { start: 1.06, step: 0.153, floor: 0.43 }),
  'Batch Normalization':buildHistory({ start: 0.58, step: 0.1,  cap: 0.885 }, { start: 0.98, step: 0.17,  floor: 0.39 }),
  'Optimized Model':    buildHistory({ start: 0.60, step: 0.11, cap: 0.905 }, { start: 0.92, step: 0.185, floor: 0.34 }),
};

export const EXPERIMENT_NAMES = Object.keys(TRAINING_HISTORY);
