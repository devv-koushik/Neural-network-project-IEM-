import { Sparkles } from 'lucide-react';

export default function AIInsight({ text, title = 'AI Insight' }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-signal-500/20 bg-gradient-to-br from-signal-500/[0.07] to-mint-500/[0.05] dark:from-signal-500/10 dark:to-mint-500/[0.06] p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-signal-500 text-white">
          <Sparkles size={16} />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-signal-500">{title}</p>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-600 dark:text-ink-200">{text}</p>
        </div>
      </div>
    </div>
  );
}
