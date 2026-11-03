import { useEffect, useState } from 'react';
import { User, Activity, ShoppingBag, Brain, CheckCircle2, AlertTriangle } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/Layout';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import ProgressRing from '../../components/common/ProgressRing';
import DataTable from '../../components/dashboard/DataTable';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { predictPurchase, getPredictionHistory } from '../../services/api';
import { useToast } from '../../hooks/useToast';

const DEFAULTS = {
  age: 29, gender: 'Male', device: 'Desktop', browsingTime: 12, pagesViewed: 6, sessions: 4,
  previousPurchases: 3, avgOrderValue: 70, cartAdditions: 4, cartAbandonments: 2,
  daysSinceLastPurchase: 25, discountUsage: 1, clv: 320, supportInteractions: 1,
};

export default function AdminPurchasePrediction() {
  const [form, setForm] = useState(DEFAULTS);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    getPredictionHistory().then((d) => { setHistory(d.slice(0, 8)); setHistoryLoading(false); });
  }, []);

  function update(field, value) { setForm((f) => ({ ...f, [field]: value })); }
  function num(field) {
    return { value: form[field], onChange: (e) => update(field, e.target.value === '' ? '' : Number(e.target.value)), type: 'number' };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const r = await predictPurchase(form);
      setResult(r);
      showToast('Prediction completed.', 'success');
    } catch {
      showToast('Prediction failed. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  }

  const columns = [
    { key: 'customerName', label: 'Customer' },
    { key: 'date', label: 'Date' },
    { key: 'purchaseProbability', label: 'Probability', render: (r) => `${(r.purchaseProbability * 100).toFixed(1)}%` },
    { key: 'purchaseResult', label: 'Result', render: (r) => <Badge tone={r.purchaseProbability >= 0.5 ? 'mint' : 'coral'}>{r.purchaseResult}</Badge> },
  ];

  return (
    <DashboardLayout role="admin" title="Purchase Prediction" subtitle="Run a manual purchase-likelihood analysis for any customer profile">
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_360px]">
        <Card className="p-5 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <div className="flex items-center gap-2 mb-3"><User size={15} className="text-signal-500" /><h3 className="text-sm font-semibold text-ink-800 dark:text-white">Customer</h3></div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Input id="age" label="Age" {...num('age')} min={13} max={100} />
                <Select id="gender" label="Gender" value={form.gender} onChange={(e) => update('gender', e.target.value)} options={['Female', 'Male', 'Other']} />
                <Select id="device" label="Device" value={form.device} onChange={(e) => update('device', e.target.value)} options={['Mobile', 'Desktop', 'Tablet']} />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-3"><Activity size={15} className="text-amber-500" /><h3 className="text-sm font-semibold text-ink-800 dark:text-white">Engagement</h3></div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Input id="browsingTime" label="Browsing Time (min)" {...num('browsingTime')} min={0} />
                <Input id="pagesViewed" label="Pages Viewed" {...num('pagesViewed')} min={0} />
                <Input id="sessions" label="Sessions" {...num('sessions')} min={0} />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-3"><ShoppingBag size={15} className="text-mint-500" /><h3 className="text-sm font-semibold text-ink-800 dark:text-white">Purchase Behavior</h3></div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Input id="previousPurchases" label="Previous Purchases" {...num('previousPurchases')} min={0} />
                <Input id="avgOrderValue" label="Avg Order Value ($)" {...num('avgOrderValue')} min={0} />
                <Input id="cartAdditions" label="Cart Additions" {...num('cartAdditions')} min={0} />
                <Input id="cartAbandonments" label="Cart Abandonments" {...num('cartAbandonments')} min={0} />
                <Input id="daysSinceLastPurchase" label="Days Since Last Purchase" {...num('daysSinceLastPurchase')} min={0} />
                <Input id="discountUsage" label="Discount Usage" {...num('discountUsage')} min={0} />
              </div>
            </div>
            <Button type="submit" variant="primary" icon={Brain} loading={loading}>Run Prediction</Button>
          </form>
        </Card>

        <div className="space-y-5">
          <Card className="p-6 flex flex-col items-center text-center">
            {loading ? (
              <LoadingSpinner label="Analyzing customer..." />
            ) : result ? (
              <>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Purchase Probability</p>
                <ProgressRing value={result.purchaseProbability * 100} color="#2BD9A8" size={140} sublabel={result.purchaseLabel} />
                <Badge tone={result.purchaseProbability >= 0.5 ? 'mint' : 'coral'} icon={result.purchaseProbability >= 0.5 ? CheckCircle2 : AlertTriangle} className="mt-3">{result.purchaseLabel}</Badge>
                <div className="mt-4 w-full text-left">
                  <p className="text-xs font-semibold text-ink-500 dark:text-ink-300 mb-1.5">Key factors</p>
                  <ul className="space-y-1">
                    {result.factors.positive.slice(0, 3).map((f) => <li key={f} className="text-xs text-ink-400 flex gap-1.5"><CheckCircle2 size={11} className="mt-0.5 text-mint-500 shrink-0" />{f}</li>)}
                  </ul>
                </div>
              </>
            ) : (
              <p className="py-10 text-sm text-ink-400">Run a prediction to see results here.</p>
            )}
          </Card>
        </div>
      </div>

      <div className="mt-6 card p-5">
        <h3 className="font-display text-sm font-semibold text-ink-800 dark:text-white mb-4">Recent prediction history</h3>
        {historyLoading ? <LoadingSpinner label="Loading history..." /> : <DataTable columns={columns} data={history} pageSize={8} />}
      </div>
    </DashboardLayout>
  );
}
