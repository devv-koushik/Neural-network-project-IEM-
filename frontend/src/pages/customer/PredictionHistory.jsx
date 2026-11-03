import { useEffect, useMemo, useState } from 'react';
import { Search, History as HistoryIcon } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/Layout';
import DataTable from '../../components/dashboard/DataTable';
import Badge from '../../components/common/Badge';
import Select from '../../components/common/Select';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import ProgressRing from '../../components/common/ProgressRing';
import { getPredictionHistory } from '../../services/api';

export default function PredictionHistory() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('All');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    getPredictionHistory().then((d) => { setData(d); setLoading(false); });
  }, []);

  const filtered = useMemo(() => {
    return data.filter((row) => {
      const matchesSearch = row.customerName.toLowerCase().includes(search.toLowerCase());
      const matchesRisk = riskFilter === 'All' || row.churnRisk === riskFilter;
      return matchesSearch && matchesRisk;
    });
  }, [data, search, riskFilter]);

  const columns = [
    { key: 'customerName', label: 'Customer' },
    { key: 'date', label: 'Date' },
    { key: 'purchaseProbability', label: 'Purchase Probability', render: (r) => `${(r.purchaseProbability * 100).toFixed(1)}%` },
    { key: 'purchaseResult', label: 'Purchase Result', render: (r) => <Badge tone={r.purchaseProbability >= 0.5 ? 'mint' : 'coral'}>{r.purchaseResult}</Badge> },
    { key: 'churnProbability', label: 'Churn Probability', render: (r) => `${(r.churnProbability * 100).toFixed(1)}%` },
    { key: 'churnRisk', label: 'Churn Risk', render: (r) => <Badge tone={r.churnRisk === 'High' ? 'coral' : r.churnRisk === 'Medium' ? 'amber' : 'mint'}>{r.churnRisk}</Badge> },
  ];

  return (
    <DashboardLayout role="customer" title="Prediction History" subtitle="Every prediction run for this account">
      <div className="card p-5">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by customer name..." className="input pl-9" aria-label="Search predictions" />
          </div>
          <Select value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)} options={['All', 'Low', 'Medium', 'High']} className="sm:w-48" />
        </div>

        {loading ? (
          <LoadingSpinner label="Loading prediction history..." />
        ) : filtered.length === 0 ? (
          <EmptyState icon={HistoryIcon} title="No predictions yet" description="Run a prediction to see it appear here." />
        ) : (
          <DataTable columns={columns} data={filtered} onRowClick={setSelected} pageSize={10} />
        )}
      </div>

      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.customerName} size="md">
        {selected && (
          <div>
            <p className="text-xs text-ink-400 mb-4">Prediction run on {selected.date} · {selected.confidence}% confidence</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col items-center gap-2">
                <ProgressRing value={selected.purchaseProbability * 100} color="#2BD9A8" size={110} />
                <span className="text-xs font-semibold text-ink-500 dark:text-ink-300">{selected.purchaseResult}</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <ProgressRing value={selected.churnProbability * 100} color="#F5566B" size={110} />
                <span className="text-xs font-semibold text-ink-500 dark:text-ink-300">{selected.churnRisk} Risk</span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
