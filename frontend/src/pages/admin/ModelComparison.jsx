import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import { Trophy } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/Layout';
import ChartCard from '../../components/dashboard/ChartCard';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { getModelComparison } from '../../services/api';

export default function ModelComparison() {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getModelComparison().then((d) => { setModels(d); setLoading(false); });
  }, []);

  if (loading) return <DashboardLayout role="admin" title="Model Comparison"><LoadingSpinner label="Loading model comparison..." className="py-32" /></DashboardLayout>;

  const best = models.reduce((a, b) => (b.valAccuracy > a.valAccuracy ? b : a));

  return (
    <DashboardLayout role="admin" title="Model Comparison" subtitle="Module 2 — regularization strategy comparison">
      <ChartCard title="Validation accuracy by model" subtitle="Higher is better">
        <ResponsiveContainer>
          <BarChart data={models}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E8EAEF" vertical={false} />
            <XAxis dataKey="model" tick={{ fontSize: 11, fill: '#9AA4B5' }} axisLine={false} tickLine={false} interval={0} angle={-12} textAnchor="end" height={60} />
            <YAxis tick={{ fontSize: 12, fill: '#9AA4B5' }} axisLine={false} tickLine={false} domain={[0.7, 1]} />
            <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E8EAEF', fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="accuracy" name="Training Accuracy" fill="#5B6EF5" radius={[6, 6, 0, 0]} />
            <Bar dataKey="valAccuracy" name="Validation Accuracy" radius={[6, 6, 0, 0]}>
              {models.map((m) => <Cell key={m.model} fill={m.model === best.model ? '#2BD9A8' : '#9AA4B5'} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="mt-6 card p-5">
        <h3 className="font-display text-sm font-semibold text-ink-800 dark:text-white mb-4">Experiment comparison</h3>
        <div className="overflow-x-auto -mx-5 px-5">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-ink-100 dark:border-ink-800">
                {['Model', 'Accuracy', 'Val Accuracy', 'Precision', 'Recall', 'F1', 'AUC', 'Status'].map((h) => (
                  <th key={h} className="whitespace-nowrap px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {models.map((m) => {
                const isBest = m.model === best.model;
                return (
                  <tr key={m.model} className={`border-b border-ink-50 dark:border-ink-800/60 ${isBest ? 'bg-mint-500/5' : ''}`}>
                    <td className="whitespace-nowrap px-3 py-3 font-medium text-ink-800 dark:text-white">
                      <span className="flex items-center gap-1.5">{isBest && <Trophy size={14} className="text-amber-500" />} {m.model}</span>
                    </td>
                    <td className="px-3 py-3 text-ink-600 dark:text-ink-200">{(m.accuracy * 100).toFixed(1)}%</td>
                    <td className="px-3 py-3 font-semibold text-ink-800 dark:text-white">{(m.valAccuracy * 100).toFixed(1)}%</td>
                    <td className="px-3 py-3 text-ink-600 dark:text-ink-200">{(m.precision * 100).toFixed(1)}%</td>
                    <td className="px-3 py-3 text-ink-600 dark:text-ink-200">{(m.recall * 100).toFixed(1)}%</td>
                    <td className="px-3 py-3 text-ink-600 dark:text-ink-200">{(m.f1 * 100).toFixed(1)}%</td>
                    <td className="px-3 py-3 text-ink-600 dark:text-ink-200">{m.auc.toFixed(3)}</td>
                    <td className="px-3 py-3"><Badge tone={isBest ? 'mint' : m.status === 'Baseline' ? 'neutral' : 'signal'}>{m.status}</Badge></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
