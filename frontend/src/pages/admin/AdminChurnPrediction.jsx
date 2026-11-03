import { useEffect, useMemo, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Eye, Search as SearchIcon, BrainCircuit } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/Layout';
import ChartCard from '../../components/dashboard/ChartCard';
import StatCard from '../../components/dashboard/StatCard';
import DataTable from '../../components/dashboard/DataTable';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import ProgressRing from '../../components/common/ProgressRing';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Button from '../../components/common/Button';
import { getCustomers, getCustomerAnalytics } from '../../services/api';
import { AlertOctagon, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function AdminChurnPrediction() {
  const [customers, setCustomers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    Promise.all([getCustomers(), getCustomerAnalytics()]).then(([c, a]) => {
      setCustomers(c); setAnalytics(a); setLoading(false);
    });
  }, []);

  const { high, medium, low } = useMemo(() => ({
    high: customers.filter((c) => c.churnRisk === 'High'),
    medium: customers.filter((c) => c.churnRisk === 'Medium'),
    low: customers.filter((c) => c.churnRisk === 'Low'),
  }), [customers]);

  if (loading) return <DashboardLayout role="admin" title="Churn Prediction"><LoadingSpinner label="Loading churn analytics..." className="py-32" /></DashboardLayout>;
  if (!analytics) return <DashboardLayout role="admin" title="Churn Prediction"><LoadingSpinner label="Loading analytics data..." className="py-32" /></DashboardLayout>;

  const columns = [
    { key: 'name', label: 'Customer' },
    { key: 'daysSinceLastPurchase', label: 'Last Purchase', render: (r) => `${r.daysSinceLastPurchase}d ago` },
    { key: 'sessions', label: 'Sessions' },
    { key: 'churnProbability', label: 'Churn Probability', render: (r) => `${(r.churnProbability * 100).toFixed(1)}%` },
    { key: 'churnRisk', label: 'Risk', render: (r) => <Badge tone={r.churnRisk === 'High' ? 'coral' : r.churnRisk === 'Medium' ? 'amber' : 'mint'}>{r.churnRisk}</Badge> },
    {
      key: 'action', label: 'Action', sortable: false,
      render: (r) => (
        <button onClick={(e) => { e.stopPropagation(); setSelected(r); }} className="flex items-center gap-1 text-xs font-semibold text-signal-500 hover:underline">
          <Eye size={12} /> View
        </button>
      ),
    },
  ];

  return (
    <DashboardLayout role="admin" title="Churn Prediction" subtitle="Identify and act on at-risk customers">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="High Risk" value={high.length} icon={AlertOctagon} tone="coral" />
        <StatCard label="Medium Risk" value={medium.length} icon={AlertTriangle} tone="amber" />
        <StatCard label="Low Risk" value={low.length} icon={ShieldCheck} tone="mint" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[360px_1fr]">
        <ChartCard title="Churn probability distribution" subtitle="Full customer base">
          <ResponsiveContainer>
            <PieChart>
              <Pie data={analytics.churnDistribution} dataKey="value" nameKey="name" innerRadius={65} outerRadius={95} paddingAngle={3}>
                {analytics.churnDistribution.map((d) => <Cell key={d.name} fill={d.color} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E8EAEF', fontSize: 12 }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <div className="card p-5">
          <h3 className="font-display text-sm font-semibold text-ink-800 dark:text-white mb-4">Customer risk table</h3>
          <DataTable columns={columns} data={customers} onRowClick={setSelected} pageSize={8} />
        </div>
      </div>

      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.name} size="md">
        {selected && (
          <div>
            <div className="flex flex-col items-center gap-2 mb-5">
              <ProgressRing value={selected.churnProbability * 100} color="#F5566B" size={130} />
              <Badge tone={selected.churnRisk === 'High' ? 'coral' : selected.churnRisk === 'Medium' ? 'amber' : 'mint'}>{selected.churnRisk} Risk</Badge>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-ink-50 dark:bg-ink-850 p-3"><p className="text-xs text-ink-400">Last purchase</p><p className="font-semibold text-ink-800 dark:text-white">{selected.daysSinceLastPurchase}d ago</p></div>
              <div className="rounded-lg bg-ink-50 dark:bg-ink-850 p-3"><p className="text-xs text-ink-400">Sessions</p><p className="font-semibold text-ink-800 dark:text-white">{selected.sessions}</p></div>
              <div className="rounded-lg bg-ink-50 dark:bg-ink-850 p-3"><p className="text-xs text-ink-400">Purchases</p><p className="font-semibold text-ink-800 dark:text-white">{selected.purchases}</p></div>
              <div className="rounded-lg bg-ink-50 dark:bg-ink-850 p-3"><p className="text-xs text-ink-400">CLV</p><p className="font-semibold text-ink-800 dark:text-white">${selected.clv}</p></div>
            </div>
            <Button variant="primary" icon={BrainCircuit} className="mt-5 w-full">Analyze in detail</Button>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
