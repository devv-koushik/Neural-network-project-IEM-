import { AlertTriangle } from 'lucide-react';
import Button from './Button';

export default function ErrorState({ title = 'Something went wrong', description = 'We could not load this data. Please try again.', onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-coral-500/20 bg-coral-500/5 py-14 px-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-coral-500/10 text-coral-500">
        <AlertTriangle size={22} />
      </div>
      <h3 className="text-sm font-semibold text-ink-700 dark:text-ink-100">{title}</h3>
      <p className="max-w-sm text-sm text-ink-400">{description}</p>
      {onRetry && <Button variant="secondary" onClick={onRetry} className="mt-2">Try again</Button>}
    </div>
  );
}
