const TONES = {
  mint: 'bg-mint-500/10 text-mint-600 dark:text-mint-500',
  coral: 'bg-coral-500/10 text-coral-500',
  amber: 'bg-amber-500/10 text-amber-500',
  signal: 'bg-signal-500/10 text-signal-600 dark:text-signal-400',
  neutral: 'bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300',
};

export default function Badge({ children, tone = 'neutral', icon: Icon, className = '' }) {
  return (
    <span className={`badge ${TONES[tone]} ${className}`}>
      {Icon && <Icon size={12} />}
      {children}
    </span>
  );
}
