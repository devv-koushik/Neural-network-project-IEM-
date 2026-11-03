import Card from '../common/Card';

export default function ChartCard({ title, subtitle, action, children, className = '', height = 280 }) {
  return (
    <Card className={`p-5 ${className}`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-sm font-semibold text-ink-800 dark:text-white">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-ink-400">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div style={{ width: '100%', height }}>{children}</div>
    </Card>
  );
}
