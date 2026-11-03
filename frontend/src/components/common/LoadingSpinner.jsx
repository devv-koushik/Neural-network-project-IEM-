import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ label = 'Loading...', size = 22, className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 py-10 text-ink-400 ${className}`} role="status" aria-live="polite">
      <Loader2 size={size} className="animate-spin text-signal-500" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
