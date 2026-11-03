import { TrendingUp, ShieldCheck, Activity, Radio } from 'lucide-react';
import ProgressRing from '../common/ProgressRing';
import { HERO_PREVIEW_PREDICTION } from '../../data/predictions';

export default function HeroPreviewPanel() {
  const { purchaseProbability, purchaseResult, churnProbability, churnRisk } = HERO_PREVIEW_PREDICTION;

  return (
    <div className="relative rounded-2xl border border-ink-800 bg-ink-900 p-5 sm:p-6 shadow-soft-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-mint-500">
          <Radio size={13} className="animate-pulseRing" />
          <span className="text-[11px] font-semibold uppercase tracking-widest">Live model readout</span>
        </div>
        <span className="text-[11px] font-mono text-ink-500">customer_id: #48213</span>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="flex flex-col items-center gap-3 rounded-xl bg-ink-850 p-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-ink-300">
            <TrendingUp size={13} className="text-mint-500" /> Purchase Probability
          </div>
          <ProgressRing value={purchaseProbability * 100} color="#2BD9A8" size={104} stroke={9} />
          <span className="text-xs font-medium text-mint-500">{purchaseResult}</span>
        </div>
        <div className="flex flex-col items-center gap-3 rounded-xl bg-ink-850 p-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-ink-300">
            <ShieldCheck size={13} className="text-signal-400" /> Churn Risk
          </div>
          <ProgressRing value={churnProbability * 100} color="#5B6EF5" size={104} stroke={9} />
          <span className="text-xs font-medium text-signal-400">{churnRisk}</span>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-xl bg-ink-850 px-4 py-3">
        <Activity size={14} className="text-signal-400 shrink-0" />
        <p className="text-xs leading-relaxed text-ink-300">
          Engagement trending upward — 3 sessions this week, browsing time up 18%.
        </p>
      </div>
    </div>
  );
}
