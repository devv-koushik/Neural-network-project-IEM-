import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Activity, ShoppingBag, Gem, Brain } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/Layout';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { predictPurchase } from '../../services/api';
import { useToast } from '../../hooks/useToast';

const DEFAULTS = {
  age: 32,
  gender: 'Female',
  device: 'Mobile',
  browsingTime: 18,
  pagesViewed: 9,
  sessions: 6,
  previousPurchases: 5,
  avgOrderValue: 85,
  cartAdditions: 6,
  cartAbandonments: 1,
  daysSinceLastPurchase: 15,
  discountUsage: 2,
  clv: 480,
  supportInteractions: 0,
};

function Section({ icon: Icon, title, children }) {
  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-signal-500/10 text-signal-500"><Icon size={16} /></div>
        <h3 className="font-display text-sm font-semibold text-ink-800 dark:text-white">{title}</h3>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
    </Card>
  );
}

export default function AIPrediction() {
  const [form, setForm] = useState(DEFAULTS);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function num(field) {
    return {
      value: form[field],
      onChange: (e) => update(field, e.target.value === '' ? '' : Number(e.target.value)),
      type: 'number',
    };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await predictPurchase(form);
      showToast('Prediction completed.', 'success');
      navigate('/predict/result', { state: { result, input: form } });
    } catch {
      showToast('Something went wrong while analyzing. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardLayout role="customer" title="AI Customer Prediction" subtitle="Fill in customer signals to generate a purchase and churn prediction">
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <LoadingSpinner label="Analyzing customer..." size={30} />
          <p className="mt-1 text-xs text-ink-400">Running purchase and churn models</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5 max-w-4xl">
          <Section icon={User} title="Customer Information">
            <Input id="age" label="Age" {...num('age')} min={13} max={100} />
            <Select id="gender" label="Gender" value={form.gender} onChange={(e) => update('gender', e.target.value)} options={['Female', 'Male', 'Other']} />
            <Select id="device" label="Device Type" value={form.device} onChange={(e) => update('device', e.target.value)} options={['Mobile', 'Desktop', 'Tablet']} />
          </Section>

          <Section icon={Activity} title="Engagement">
            <Input id="browsingTime" label="Browsing Time (minutes)" {...num('browsingTime')} min={0} />
            <Input id="pagesViewed" label="Pages Viewed" {...num('pagesViewed')} min={0} />
            <Input id="sessions" label="Number of Sessions" {...num('sessions')} min={0} />
          </Section>

          <Section icon={ShoppingBag} title="Purchase Behavior">
            <Input id="previousPurchases" label="Previous Purchases" {...num('previousPurchases')} min={0} />
            <Input id="avgOrderValue" label="Average Order Value ($)" {...num('avgOrderValue')} min={0} />
            <Input id="cartAdditions" label="Cart Additions" {...num('cartAdditions')} min={0} />
            <Input id="cartAbandonments" label="Cart Abandonments" {...num('cartAbandonments')} min={0} />
            <Input id="daysSinceLastPurchase" label="Days Since Last Purchase" {...num('daysSinceLastPurchase')} min={0} />
            <Input id="discountUsage" label="Discount Usage (count)" {...num('discountUsage')} min={0} />
          </Section>

          <Section icon={Gem} title="Customer Value">
            <Input id="clv" label="Customer Lifetime Value ($)" {...num('clv')} min={0} />
            <Input id="supportInteractions" label="Support Interactions" {...num('supportInteractions')} min={0} />
          </Section>

          <div className="flex justify-end">
            <Button type="submit" variant="primary" icon={Brain} className="!px-6 !py-3">Analyze Customer</Button>
          </div>
        </form>
      )}
    </DashboardLayout>
  );
}
