import ProgressRing from '../common/ProgressRing';
import Card from '../common/Card';

export default function PredictionCard({ title, value, label, color, size = 150 }) {
  return (
    <Card className="flex flex-col items-center gap-4 p-6 text-center">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">{title}</p>
      <ProgressRing value={value} color={color} size={size} sublabel={label} />
    </Card>
  );
}
