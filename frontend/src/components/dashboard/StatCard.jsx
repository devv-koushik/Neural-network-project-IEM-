import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import Card from '../common/Card';

export default function StatCard({ label, value, icon: Icon, trend, trendDirection = 'up', tone = 'signal', suffix = '' }) {
  const tones = {
    signal: 'bg-signal-500/10 text-signal-500',
    mint: 'bg-mint-500/10 text-mint-600 dark:text-mint-500',
    coral: 'bg-coral-500/10 text-coral-500',
    amber: 'bg-amber-500/10 text-amber-500',
  };

  return (
    <Card hover className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">{label}</p>
          <p className="mt-2 font-display text-2xl font-bold text-ink-800 dark:text-white">
            {value}
            {suffix && <span className="ml-1 text-base font-medium text-ink-400">{suffix}</span>}
          </p>
        </div>
        {Icon && (
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tones[tone]}`}>
            <Icon size={18} />
          </div>
        )}
      </div>
      {trend !== undefined && (
        <div className="mt-3 flex items-center gap-1 text-xs font-semibold">
          {trendDirection === 'up' ? (
            <ArrowUpRight size={14} className="text-mint-500" />
          ) : (
            <ArrowDownRight size={14} className="text-coral-500" />
          )}
          <span className={trendDirection === 'up' ? 'text-mint-600 dark:text-mint-500' : 'text-coral-500'}>{trend}</span>
          <span className="font-normal text-ink-400">vs last period</span>
        </div>
      )}
    </Card>
  );
}
