import { Inbox } from 'lucide-react';

export default function EmptyState({ icon: Icon = Inbox, title = 'Nothing here yet', description, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-ink-200 dark:border-ink-700 py-14 px-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ink-100 dark:bg-ink-800 text-ink-400">
        <Icon size={22} />
      </div>
      <h3 className="text-sm font-semibold text-ink-700 dark:text-ink-100">{title}</h3>
      {description && <p className="max-w-sm text-sm text-ink-400">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
