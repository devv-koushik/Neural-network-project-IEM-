import { useEffect, useState } from 'react';
import { Users, Brain, TrendingUp, ShieldAlert, Gauge, Package } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { DashboardLayout } from '../../components/layout/Layout';
import StatCard from '../../components/dashboard/StatCard';
import ChartCard from '../../components/dashboard/ChartCard';
import Select from '../../components/common/Select';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorState from '../../components/common/ErrorState';
import { getAdminDashboard } from '../../services/api';

const DATE_FILTERS = [
  { value: 'today', label: 'Today' },
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
];

export default function AdminDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [range, setRange] = useState('30d');

  function load(period) {
    setLoading(true);
    setError(false);
    getAdminDashboard(period)
      .then(setDashboard)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(range); }, [range]);

  if (loading) return <DashboardLayout role="admin" title="Admin Dashboard"><LoadingSpinner label="Loading analytics..." className="py-32" /></DashboardLayout>;
  if (error || !dashboard) {
    return (
      <DashboardLayout role="admin" title="Admin Dashboard">
        <ErrorState
          title="Couldn't load dashboard analytics"
          description="The backend may be unreachable, or no data has been seeded/trained yet."
          onRetry={() => load(range)}
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin" title="Admin Dashboard" subtitle="Platform-wide customer & model analytics">
      <div className="mb-5 flex justify-end">
        <Select value={range} onChange={(e) => setRange(e.target.value)} options={DATE_FILTERS} className="w-40" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <StatCard label="Total Customers" value={dashboard.totalCustomers} icon={Users} tone="signal" />
        <StatCard label="Total Predictions" value={dashboard.totalPredictions} icon={Brain} tone="amber" />
        <StatCard label="Avg. Purchase Prob." value={`${(dashboard.avgPurchaseProbability * 100).toFixed(1)}%`} icon={TrendingUp} tone="mint" />
        <StatCard label="High Churn Risk" value={dashboard.highChurnRisk} icon={ShieldAlert} tone="coral" />
        <StatCard
          label="Best Model Accuracy"
          value={dashboard.bestModelAccuracy != null ? `${(dashboard.bestModelAccuracy * 100).toFixed(1)}%` : '—'}
          icon={Gauge} tone="signal"
        />
        <StatCard label="Active Products" value={dashboard.activeProducts} icon={Package} tone="amber" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Customer growth" subtitle="Cumulative signups by month">
          <ResponsiveContainer>
            <LineChart data={dashboard.customerGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8EAEF" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9AA4B5' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#9AA4B5' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E8EAEF', fontSize: 12 }} />
              <Line type="monotone" dataKey="customers" stroke="#5B6EF5" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Prediction trend" subtitle={`Predictions run — ${DATE_FILTERS.find((d) => d.value === range).label.toLowerCase()}`}>
          <ResponsiveContainer>
            <BarChart data={dashboard.predictionTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8EAEF" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#9AA4B5' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#9AA4B5' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E8EAEF', fontSize: 12 }} />
              <Bar dataKey="value" fill="#5B6EF5" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Purchase prediction distribution" subtitle="Across all logged predictions">
          <ResponsiveContainer>
            <PieChart>
              <Pie data={dashboard.purchaseDistribution} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={3}>
                {dashboard.purchaseDistribution.map((d) => <Cell key={d.name} fill={d.color} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E8EAEF', fontSize: 12 }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Churn risk distribution" subtitle="Current customer base">
          <ResponsiveContainer>
            <PieChart>
              <Pie data={dashboard.churnDistribution} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={3}>
                {dashboard.churnDistribution.map((d) => <Cell key={d.name} fill={d.color} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E8EAEF', fontSize: 12 }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </DashboardLayout>
  );
}
