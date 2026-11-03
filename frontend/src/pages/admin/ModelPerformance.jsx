import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Target, Crosshair, RefreshCcw, Percent, Activity, ExternalLink } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/Layout';
import ChartCard from '../../components/dashboard/ChartCard';
import StatCard from '../../components/dashboard/StatCard';
import Card from '../../components/common/Card';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { getModelMetrics } from '../../services/api';

export default function ModelPerformance() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getModelMetrics().then((d) => { setData(d); setLoading(false); });
  }, []);

  if (loading) return <DashboardLayout role="admin" title="Model Performance"><LoadingSpinner label="Loading model metrics..." className="py-32" /></DashboardLayout>;

  const { basicAnn, accuracyHistory, lossHistory } = data;

  return (
    <DashboardLayout role="admin" title="Model Performance" subtitle="Basic ANN — Module 1 & 2 baseline model">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Accuracy" value={`${(basicAnn.accuracy * 100).toFixed(1)}%`} icon={Target} tone="signal" />
        <StatCard label="Precision" value={`${(basicAnn.precision * 100).toFixed(1)}%`} icon={Crosshair} tone="mint" />
        <StatCard label="Recall" value={`${(basicAnn.recall * 100).toFixed(1)}%`} icon={RefreshCcw} tone="amber" />
        <StatCard label="F1 Score" value={`${(basicAnn.f1 * 100).toFixed(1)}%`} icon={Percent} tone="coral" />
        <StatCard label="AUC" value={basicAnn.auc.toFixed(3)} icon={Activity} tone="signal" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Training vs Validation Accuracy" subtitle="Basic ANN, 12 epochs">
          <ResponsiveContainer>
            <LineChart data={accuracyHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8EAEF" vertical={false} />
              <XAxis dataKey="epoch" tick={{ fontSize: 12, fill: '#9AA4B5' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#9AA4B5' }} axisLine={false} tickLine={false} domain={[0.5, 1]} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E8EAEF', fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="trainAcc" name="Training Accuracy" stroke="#5B6EF5" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="valAcc" name="Validation Accuracy" stroke="#2BD9A8" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Training vs Validation Loss" subtitle="Basic ANN, 12 epochs">
          <ResponsiveContainer>
            <LineChart data={lossHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8EAEF" vertical={false} />
              <XAxis dataKey="epoch" tick={{ fontSize: 12, fill: '#9AA4B5' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#9AA4B5' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E8EAEF', fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="trainLoss" name="Training Loss" stroke="#F5566B" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="valLoss" name="Validation Loss" stroke="#F5A623" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <Card className="mt-6 p-6 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink-100 dark:bg-ink-800 text-ink-500 dark:text-ink-300"><ExternalLink size={18} /></div>
          <div>
            <h3 className="font-display text-sm font-semibold text-ink-800 dark:text-white">TensorBoard</h3>
            <p className="text-xs text-ink-400">TensorBoard training logs will be available when the backend ML pipeline is connected.</p>
          </div>
        </div>
        <span className="badge bg-ink-100 dark:bg-ink-800 text-ink-500 dark:text-ink-300 shrink-0">Not connected</span>
      </Card>
    </DashboardLayout>
  );
}
