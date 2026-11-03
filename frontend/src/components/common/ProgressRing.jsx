export default function ProgressRing({ value = 0, size = 140, stroke = 12, color = '#5B6EF5', trackColor, label, sublabel }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, value));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={trackColor || 'currentColor'} className="text-ink-100 dark:text-ink-800" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.65,0,0.35,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display font-bold text-ink-800 dark:text-white" style={{ fontSize: size * 0.19 }}>{clamped.toFixed(1)}%</span>
        {sublabel && <span className="text-[11px] font-medium text-ink-400 mt-0.5">{sublabel}</span>}
      </div>
      {label && <span className="sr-only">{label}</span>}
    </div>
  );
}
