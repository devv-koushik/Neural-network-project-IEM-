import { ArrowRight } from 'lucide-react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';

export default function ComingSoon({ eyebrow, title, description, steps, icon: Icon }) {
  return (
    <Card className="overflow-hidden">
      <div className="relative bg-gradient-to-br from-signal-500/10 to-mint-500/5 p-8 sm:p-10">
        <Badge tone="amber" className="mb-4">Planned Extension</Badge>
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-signal-500 text-white">
            <Icon size={26} />
          </div>
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <h2 className="mt-1 font-display text-2xl font-bold text-ink-800 dark:text-white">{title}</h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-500 dark:text-ink-300">{description}</p>
          </div>
        </div>
      </div>

      <div className="p-8 sm:p-10">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-400 mb-5">Planned workflow</h3>
        <div className="flex flex-wrap items-center gap-3">
          {steps.map((step, i) => (
            <div key={step} className="flex items-center gap-3">
              <div className="rounded-xl border border-ink-200 dark:border-ink-700 bg-ink-50 dark:bg-ink-850 px-4 py-2.5 text-sm font-medium text-ink-700 dark:text-ink-100">
                {step}
              </div>
              {i < steps.length - 1 && <ArrowRight size={16} className="text-ink-300 dark:text-ink-600 shrink-0" />}
            </div>
          ))}
        </div>
        <div className="mt-8 rounded-xl border border-dashed border-ink-200 dark:border-ink-700 p-5 text-center">
          <p className="text-sm text-ink-400">This module will activate once the corresponding Flask ML service is connected.</p>
        </div>
      </div>
    </Card>
  );
}
