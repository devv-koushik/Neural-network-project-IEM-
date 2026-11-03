import { useEffect, useState } from 'react';
import { Play, SlidersHorizontal } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/Layout';
import Card from '../../components/common/Card';
import Select from '../../components/common/Select';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import DataTable from '../../components/dashboard/DataTable';
import StatCard from '../../components/dashboard/StatCard';
import { Target, TrendingUp, Percent, Activity } from 'lucide-react';
import { getExperiments, runExperiment } from '../../services/api';
import { HYPERPARAM_DEFAULTS, LEARNING_RATES, BATCH_SIZES, INITIALIZATIONS } from '../../data/experiments';
import { useToast } from '../../hooks/useToast';

export default function HyperparameterTuning() {
  const [params, setParams] = useState(HYPERPARAM_DEFAULTS);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    getExperiments().then((d) => { setHistory(d); setLoadingHistory(false); });
  }, []);

  function update(field, value) { setParams((p) => ({ ...p, [field]: value })); }

  async function handleRun() {
    setRunning(true);
    setResult(null);
    try {
      const r = await runExperiment(params);
      setResult(r);
      const entry = {
        id: `exp_${Date.now()}`,
        ...params,
        ...r,
        timestamp: new Date().toISOString().slice(0, 16).replace('T', ' '),
      };
      setHistory((h) => [entry, ...h]);
      showToast('Experiment completed.', 'success');
    } catch {
      showToast('Experiment failed. Please try again.', 'error');
    } finally {
      setRunning(false);
    }
  }

  const columns = [
    { key: 'timestamp', label: 'Run' },
    { key: 'learningRate', label: 'LR' },
    { key: 'batchSize', label: 'Batch' },
    { key: 'dropout', label: 'Dropout' },
    { key: 'hiddenUnits', label: 'Hidden Units' },
    { key: 'initialization', label: 'Init' },
    { key: 'accuracy', label: 'Accuracy', render: (r) => `${(r.accuracy * 100).toFixed(1)}%` },
    { key: 'valAccuracy', label: 'Val Accuracy', render: (r) => `${(r.valAccuracy * 100).toFixed(1)}%` },
    { key: 'f1', label: 'F1', render: (r) => `${(r.f1 * 100).toFixed(1)}%` },
    { key: 'loss', label: 'Loss' },
  ];

  return (
    <DashboardLayout role="admin" title="Hyperparameter Tuning" subtitle="Module 2 — experiment with training configuration">
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_360px]">
        <Card className="p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-5"><SlidersHorizontal size={16} className="text-signal-500" /><h3 className="font-display text-sm font-semibold text-ink-800 dark:text-white">Experiment controls</h3></div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select label="Learning Rate" value={params.learningRate} onChange={(e) => update('learningRate', Number(e.target.value))} options={LEARNING_RATES.map((v) => ({ value: v, label: v }))} />
            <Select label="Batch Size" value={params.batchSize} onChange={(e) => update('batchSize', Number(e.target.value))} options={BATCH_SIZES.map((v) => ({ value: v, label: v }))} />
            <div>
              <label htmlFor="dropout" className="label">Dropout Rate: {params.dropout}</label>
              <input id="dropout" type="range" min={0} max={0.6} step={0.05} value={params.dropout} onChange={(e) => update('dropout', Number(e.target.value))} className="w-full accent-signal-500" />
            </div>
            <div>
              <label htmlFor="hiddenUnits" className="label">Hidden Units: {params.hiddenUnits}</label>
              <input id="hiddenUnits" type="range" min={16} max={512} step={16} value={params.hiddenUnits} onChange={(e) => update('hiddenUnits', Number(e.target.value))} className="w-full accent-signal-500" />
            </div>
            <Select label="Initialization" value={params.initialization} onChange={(e) => update('initialization', e.target.value)} options={INITIALIZATIONS} />
          </div>
          <Button variant="primary" icon={Play} loading={running} onClick={handleRun} className="mt-6">Run Experiment</Button>
        </Card>

        <Card className="p-6">
          <h3 className="font-display text-sm font-semibold text-ink-800 dark:text-white mb-4">Latest result</h3>
          {running ? (
            <LoadingSpinner label="Running experiment..." />
          ) : result ? (
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Accuracy" value={`${(result.accuracy * 100).toFixed(1)}%`} icon={Target} tone="signal" />
              <StatCard label="Val Accuracy" value={`${(result.valAccuracy * 100).toFixed(1)}%`} icon={TrendingUp} tone="mint" />
              <StatCard label="F1 Score" value={`${(result.f1 * 100).toFixed(1)}%`} icon={Percent} tone="amber" />
              <StatCard label="Loss" value={result.loss} icon={Activity} tone="coral" />
            </div>
          ) : (
            <p className="py-10 text-center text-sm text-ink-400">Run an experiment to see results here.</p>
          )}
        </Card>
      </div>

      <div className="mt-6 card p-5">
        <h3 className="font-display text-sm font-semibold text-ink-800 dark:text-white mb-4">Experiment history</h3>
        {loadingHistory ? <LoadingSpinner label="Loading history..." /> : <DataTable columns={columns} data={history} pageSize={8} />}
      </div>
    </DashboardLayout>
  );
}
