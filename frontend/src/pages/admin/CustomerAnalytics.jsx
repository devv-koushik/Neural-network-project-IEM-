import { useEffect, useState } from 'react';
import { Users, Clock, ShoppingBag, Activity } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ScatterChart, Scatter } from 'recharts';
import { DashboardLayout } from '../../components/layout/Layout';
import ChartCard from '../../components/dashboard/ChartCard';
import StatCard from '../../components/dashboard/StatCard';
import DataTable from '../../components/dashboard/DataTable';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { getCustomers, getCustomerAnalytics } from '../../services/api';

export default function CustomerAnalytics() {
  const [customers, setCustomers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getCustomers(), getCustomerAnalytics()]).then(([c, a]) => {
      setCustomers(c); setAnalytics(a); setLoading(false);
    });
  }, []);

  if (loading) return <DashboardLayout role="admin" title="Customer Analytics"><LoadingSpinner label="Loading customer analytics..." className="py-32" /></DashboardLayout>;
  if (!analytics) return <DashboardLayout role="admin" title="Customer Analytics"><LoadingSpinner label="Loading analytics data..." className="py-32" /></DashboardLayout>;

  const avgEngagement = customers.length ? Math.round(customers.reduce((s, c) => s + c.engagement, 0) / customers.length) : 0;
  const avgBrowsing = customers.length ? (customers.reduce((s, c) => s + c.browsingMinutes, 0) / customers.length).toFixed(1) : '0.0';
  const purchaseFrequency = [
    { bucket: '0', count: customers.filter((c) => c.purchases === 0).length },
    { bucket: '1-5', count: customers.filter((c) => c.purchases >= 1 && c.purchases <= 5).length },
    { bucket: '6-15', count: customers.filter((c) => c.purchases >= 6 && c.purchases <= 15).length },
    { bucket: '16+', count: customers.filter((c) => c.purchases >= 16).length },
  ];
  const browsingScatter = customers.map((c) => ({ x: c.browsingMinutes, y: c.purchaseProbability * 100 }));

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'age', label: 'Age' },
    { key: 'purchases', label: 'Purchases' },
    { key: 'engagement', label: 'Engagement', render: (r) => `${r.engagement}/100` },
    { key: 'purchaseProbability', label: 'Purchase Probability', render: (r) => `${(r.purchaseProbability * 100).toFixed(1)}%` },
    { key: 'churnRisk', label: 'Churn Risk', render: (r) => <Badge tone={r.churnRisk === 'High' ? 'coral' : r.churnRisk === 'Medium' ? 'amber' : 'mint'}>{r.churnRisk}</Badge> },
  ];

  return (
    <DashboardLayout role="admin" title="Customer Analytics" subtitle="Behavior, engagement, and risk across the customer base">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Customers" value={customers.length} icon={Users} tone="signal" />
        <StatCard label="Avg. Browsing Time" value={avgBrowsing} suffix="min" icon={Clock} tone="amber" />
        <StatCard label="Avg. Engagement" value={avgEngagement} suffix="/100" icon={Activity} tone="mint" />
        <StatCard label="Avg. Purchases" value={customers.length ? (customers.reduce((s, c) => s + c.purchases, 0) / customers.length).toFixed(1) : '0.0'} icon={ShoppingBag} tone="coral" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Age distribution" subtitle="Customers by age bucket">
          <ResponsiveContainer>
            <BarChart data={analytics.ageDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8EAEF" vertical={false} />
              <XAxis dataKey="bucket" tick={{ fontSize: 12, fill: '#9AA4B5' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#9AA4B5' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E8EAEF', fontSize: 12 }} />
              <Bar dataKey="count" fill="#5B6EF5" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Purchase frequency" subtitle="Customers grouped by number of purchases">
          <ResponsiveContainer>
            <BarChart data={purchaseFrequency}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8EAEF" vertical={false} />
              <XAxis dataKey="bucket" tick={{ fontSize: 12, fill: '#9AA4B5' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#9AA4B5' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E8EAEF', fontSize: 12 }} />
              <Bar dataKey="count" fill="#2BD9A8" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Browsing behavior vs purchase probability" subtitle="Each point is one customer">
          <ResponsiveContainer>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8EAEF" />
              <XAxis dataKey="x" name="Browsing minutes" tick={{ fontSize: 12, fill: '#9AA4B5' }} axisLine={false} tickLine={false} />
              <YAxis dataKey="y" name="Purchase probability %" tick={{ fontSize: 12, fill: '#9AA4B5' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E8EAEF', fontSize: 12 }} cursor={{ strokeDasharray: '3 3' }} />
              <Scatter data={browsingScatter} fill="#F5A623" />
            </ScatterChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Churn risk distribution" subtitle="Share of customers by risk tier">
          <ResponsiveContainer>
            <PieChart>
              <Pie data={analytics.churnDistribution} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={3}>
                {analytics.churnDistribution.map((d) => <Cell key={d.name} fill={d.color} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E8EAEF', fontSize: 12 }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="mt-6 card p-5">
        <h3 className="font-display text-sm font-semibold text-ink-800 dark:text-white mb-4">All customers</h3>
        <DataTable columns={columns} data={customers} pageSize={10} />
      </div>
    </DashboardLayout>
  );
}
