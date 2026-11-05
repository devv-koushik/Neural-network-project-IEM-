import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, ShieldAlert, ShoppingBag, Activity, Brain, History } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DashboardLayout } from '../../components/layout/Layout';
import StatCard from '../../components/dashboard/StatCard';
import ChartCard from '../../components/dashboard/ChartCard';
import AIInsight from '../../components/dashboard/AIInsight';
import DataTable from '../../components/dashboard/DataTable';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { getPredictionHistory, getCurrentUser } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

export default function CustomerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);

  useEffect(() => {
    Promise.allSettled([getPredictionHistory(), getCurrentUser()])
      .then(([historyRes, userRes]) => {
        if (historyRes.status === 'fulfilled' && Array.isArray(historyRes.value)) {
          setHistory(historyRes.value);
        }
        if (userRes.status === 'fulfilled' && userRes.value) {
          setProfileData(userRes.value);
        }
        setLoading(false);
      });
  }, []);

  const latestPred = history[0] || profileData?.latest_prediction || null;
  const totalCount = profileData?.total_predictions ?? history.length;

  const purchaseProb = latestPred ? (latestPred.purchaseProbability ?? latestPred.purchase_probability ?? 0) : null;
  const churnProb = latestPred ? (latestPred.churnProbability ?? latestPred.churn_probability ?? 0) : null;
  const engagement = latestPred?.engagementScore ?? latestPred?.engagement_score ?? (purchaseProb !== null ? Math.round(purchaseProb * 80 + 10) : null);

  // Generate trend line from actual history (up to last 6 predictions in chronological order)
  const trendData = history.length > 0
    ? [...history].slice(0, 6).reverse().map((p, idx) => ({
        point: `#${idx + 1}`,
        purchase: Number((p.purchaseProbability ?? 0).toFixed(2)),
        churn: Number((p.churnProbability ?? 0).toFixed(2)),
      }))
    : [
        { point: '#1', purchase: 0.50, churn: 0.30 },
        { point: '#2', purchase: 0.65, churn: 0.25 },
        { point: '#3', purchase: 0.72, churn: 0.20 },
      ];

  const columns = [
    { key: 'date', label: 'Date' },
    { key: 'purchaseResult', label: 'Purchase', render: (r) => <Badge tone={r.purchaseProbability >= 0.5 ? 'mint' : 'coral'}>{r.purchaseResult || (r.purchaseProbability >= 0.5 ? 'Likely to Buy' : 'Unlikely')}</Badge> },
    { key: 'churnRisk', label: 'Churn', render: (r) => <Badge tone={r.churnRisk === 'High' ? 'coral' : r.churnRisk === 'Medium' ? 'amber' : 'mint'}>{r.churnRisk}</Badge> },
    { key: 'confidence', label: 'Confidence', render: (r) => <span className="text-xs text-ink-400">{r.confidence}% confidence</span>, sortable: false },
  ];

  return (
    <DashboardLayout role="customer" title={`Welcome back, ${user?.name?.split(' ')[0] || 'Customer'}`} subtitle="Here's what your AI assistant sees today">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Purchase Probability"
          value={purchaseProb !== null ? `${(purchaseProb * 100).toFixed(1)}%` : 'No data'}
          icon={TrendingUp}
          tone="mint"
          trend={purchaseProb !== null ? (purchaseProb >= 0.5 ? 'High intent' : 'Low intent') : undefined}
          trendDirection={purchaseProb >= 0.5 ? 'up' : 'down'}
        />
        <StatCard
          label="Churn Risk"
          value={churnProb !== null ? `${(churnProb * 100).toFixed(1)}%` : 'No data'}
          icon={ShieldAlert}
          tone={churnProb >= 0.6 ? 'coral' : churnProb >= 0.3 ? 'amber' : 'signal'}
          trend={latestPred?.churnRisk || (churnProb !== null ? (churnProb >= 0.5 ? 'At Risk' : 'Retained') : undefined)}
          trendDirection={churnProb >= 0.5 ? 'down' : 'up'}
        />
        <StatCard
          label="Total Predictions"
          value={String(totalCount)}
          icon={ShoppingBag}
          tone="amber"
          trend="Saved runs"
          trendDirection="up"
        />
        <StatCard
          label="Engagement Score"
          value={engagement !== null ? String(engagement) : '—'}
          suffix={engagement !== null ? '/ 100' : ''}
          icon={Activity}
          tone="coral"
          trend="Model evaluated"
          trendDirection="up"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Prediction history trend" subtitle="Purchase probability vs churn risk across recent evaluations">
          <ResponsiveContainer>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8EAEF" vertical={false} />
              <XAxis dataKey="point" tick={{ fontSize: 12, fill: '#9AA4B5' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 1]} tick={{ fontSize: 12, fill: '#9AA4B5' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E8EAEF', fontSize: 12 }} />
              <Line type="monotone" dataKey="purchase" stroke="#2BD9A8" strokeWidth={2.5} name="Purchase Probability" dot={{ r: 4 }} />
              <Line type="monotone" dataKey="churn" stroke="#F5566B" strokeWidth={2.5} name="Churn Probability" dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="AI Activity Overview" subtitle="Status of real-time prediction models">
          <div className="h-full flex flex-col justify-center px-4 py-6 space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-ink-50 dark:bg-ink-850">
              <span className="text-sm font-medium text-ink-700 dark:text-ink-200">Purchase Prediction ANN</span>
              <Badge tone="mint">Active & Trained</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-ink-50 dark:bg-ink-850">
              <span className="text-sm font-medium text-ink-700 dark:text-ink-200">Churn Detection ANN</span>
              <Badge tone="mint">Active & Trained</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-ink-50 dark:bg-ink-850">
              <span className="text-sm font-medium text-ink-700 dark:text-ink-200">Inference Mode</span>
              <Badge tone="signal">Real-time Keras</Badge>
            </div>
          </div>
        </ChartCard>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AIInsight text={purchaseProb !== null
            ? (purchaseProb >= 0.5
                ? `Current purchase probability is ${(purchaseProb * 100).toFixed(1)}%. Customer profile indicates strong engagement and active purchasing signals.`
                : `Current purchase probability is ${(purchaseProb * 100).toFixed(1)}%. Churn likelihood is ${(churnProb * 100).toFixed(1)}%. Consider special offers to re-engage.`)
            : 'Run your first AI prediction to generate personalized sales and churn risk insights based on your customer behavior attributes.'}
          />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
          <Button variant="primary" icon={Brain} onClick={() => navigate('/predict')} className="flex-1">Run New Prediction</Button>
          <Button variant="secondary" icon={History} onClick={() => navigate('/predict/history')} className="flex-1">View History</Button>
        </div>
      </div>

      <div className="mt-6 card p-5">
        <h3 className="font-display text-sm font-semibold text-ink-800 dark:text-white mb-4">Recent predictions</h3>
        {loading ? <LoadingSpinner label="Loading predictions..." /> : <DataTable columns={columns} data={history.slice(0, 5)} pageSize={5} />}
      </div>
    </DashboardLayout>
  );
}
