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
import { getPredictionHistory } from '../../services/api';
import { HERO_PREVIEW_PREDICTION } from '../../data/predictions';
import { useAuth } from '../../hooks/useAuth';

const ACTIVITY = [
  { day: 'Mon', activity: 22 }, { day: 'Tue', activity: 34 }, { day: 'Wed', activity: 28 },
  { day: 'Thu', activity: 41 }, { day: 'Fri', activity: 38 }, { day: 'Sat', activity: 52 }, { day: 'Sun', activity: 47 },
];

const TREND = [
  { week: 'W1', purchase: 0.42, engagement: 38 }, { week: 'W2', purchase: 0.51, engagement: 44 },
  { week: 'W3', purchase: 0.48, engagement: 49 }, { week: 'W4', purchase: 0.63, engagement: 55 },
  { week: 'W5', purchase: 0.71, engagement: 61 }, { week: 'W6', purchase: 0.864, engagement: 68 },
];

export default function CustomerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPredictionHistory().then((data) => { setHistory(data.slice(0, 5)); setLoading(false); });
  }, []);

  const columns = [
    { key: 'date', label: 'Date' },
    { key: 'purchaseResult', label: 'Purchase', render: (r) => <Badge tone={r.purchaseProbability >= 0.5 ? 'mint' : 'coral'}>{r.purchaseResult}</Badge> },
    { key: 'churnRisk', label: 'Churn', render: (r) => <Badge tone={r.churnRisk === 'High' ? 'coral' : r.churnRisk === 'Medium' ? 'amber' : 'mint'}>{r.churnRisk}</Badge> },
    { key: 'confidence', label: 'Status', render: (r) => <span className="text-xs text-ink-400">{r.confidence}% confidence</span>, sortable: false },
  ];

  return (
    <DashboardLayout role="customer" title={`Welcome back, ${user?.name?.split(' ')[0] || 'Customer'}`} subtitle="Here's what your AI assistant sees today">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Purchase Probability" value={`${(HERO_PREVIEW_PREDICTION.purchaseProbability * 100).toFixed(1)}%`} icon={TrendingUp} tone="mint" trend="+4.2%" trendDirection="up" />
        <StatCard label="Churn Risk" value={`${(HERO_PREVIEW_PREDICTION.churnProbability * 100).toFixed(1)}%`} icon={ShieldAlert} tone="signal" trend="-1.8%" trendDirection="down" />
        <StatCard label="Total Purchases" value="14" icon={ShoppingBag} tone="amber" trend="+2" trendDirection="up" />
        <StatCard label="Engagement Score" value="68" suffix="/ 100" icon={Activity} tone="coral" trend="+9 pts" trendDirection="up" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Customer activity over time" subtitle="Sessions per day, last 7 days">
          <ResponsiveContainer>
            <AreaChart data={ACTIVITY}>
              <defs>
                <linearGradient id="actGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#5B6EF5" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#5B6EF5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8EAEF" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#9AA4B5' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#9AA4B5' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E8EAEF', fontSize: 12 }} />
              <Area type="monotone" dataKey="activity" stroke="#5B6EF5" strokeWidth={2.5} fill="url(#actGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Purchase probability & engagement trend" subtitle="Last 6 weeks">
          <ResponsiveContainer>
            <LineChart data={TREND}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8EAEF" vertical={false} />
              <XAxis dataKey="week" tick={{ fontSize: 12, fill: '#9AA4B5' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#9AA4B5' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E8EAEF', fontSize: 12 }} />
              <Line type="monotone" dataKey="purchase" stroke="#2BD9A8" strokeWidth={2.5} dot={false} name="Purchase Probability" />
              <Line type="monotone" dataKey="engagement" stroke="#F5A623" strokeWidth={2.5} dot={false} name="Engagement" yAxisId={0} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AIInsight text="Your recent browsing activity and previous purchases indicate a high likelihood of purchase. Consider checking out items left in your cart to lock in your current discount eligibility." />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
          <Button variant="primary" icon={Brain} onClick={() => navigate('/predict')} className="flex-1">Run New Prediction</Button>
          <Button variant="secondary" icon={History} onClick={() => navigate('/predict/history')} className="flex-1">View History</Button>
        </div>
      </div>

      <div className="mt-6 card p-5">
        <h3 className="font-display text-sm font-semibold text-ink-800 dark:text-white mb-4">Recent predictions</h3>
        {loading ? <LoadingSpinner label="Loading predictions..." /> : <DataTable columns={columns} data={history} pageSize={5} />}
      </div>
    </DashboardLayout>
  );
}
