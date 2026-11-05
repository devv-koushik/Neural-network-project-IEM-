import { Link } from 'react-router-dom';
import { ScanEye, LineChart, Wand2, ArrowRight } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/Layout';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';

const MODULES = [
  {
    to: '/admin/visual-recognition',
    icon: ScanEye,
    name: 'Module 3',
    title: 'Visual Product Recognition',
    desc: 'MobileNetV2 deep learning classifier. Upload any product image to predict category with top-3 rankings and confidence scores.',
    tone: 'mint',
  },
  {
    to: '/admin/demand-forecasting',
    icon: LineChart,
    name: 'Module 4',
    title: 'Demand & Sales Forecasting',
    desc: 'LSTM time-series neural network. Predict 7-day and 30-day product demand with actual vs. forecasted curves and inventory alerts.',
    tone: 'mint',
  },
  {
    to: '/admin/synthetic-data',
    icon: Wand2,
    name: 'Module 5',
    title: 'Synthetic Data & AI Content',
    desc: 'Tabular synthesis with KS-test distribution evaluation, plus neural product copywriter and live database sales reporting.',
    tone: 'mint',
  },
];

export default function FutureModulesHub() {
  return (
    <DashboardLayout
      role="admin"
      title="Advanced AI Modules"
      subtitle="Complete five-module deep learning and generative intelligence suite"
    >
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {MODULES.map((m) => (
          <Link key={m.to} to={m.to}>
            <Card hover className="p-6 h-full flex flex-col">
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-signal-500/10 text-signal-500">
                  <m.icon size={20} />
                </div>
                <Badge tone={m.tone}>Active</Badge>
              </div>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-ink-400">{m.name}</p>
              <h3 className="mt-1 font-display text-base font-semibold text-ink-800 dark:text-white">{m.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-400">{m.desc}</p>
              <span className="mt-4 flex items-center gap-1 text-sm font-semibold text-signal-500">
                Launch module <ArrowRight size={14} />
              </span>
            </Card>
          </Link>
        ))}
      </div>
    </DashboardLayout>
  );
}
