import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export default function Modal({ open, onClose, title, children, footer, size = 'md' }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') onClose?.();
    }
    if (open) {
      document.addEventListener('keydown', handleKey);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink-950/60 backdrop-blur-sm animate-fadeIn" onClick={onClose} aria-hidden="true" />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative w-full ${sizes[size]} max-h-[85vh] overflow-y-auto rounded-2xl bg-white dark:bg-ink-900 border border-ink-100 dark:border-ink-800 shadow-soft-lg animate-scaleIn`}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-ink-100 dark:border-ink-800 bg-white dark:bg-ink-900 px-6 py-4 rounded-t-2xl">
          <h3 className="text-base font-semibold font-display text-ink-800 dark:text-white">{title}</h3>
          <button onClick={onClose} aria-label="Close dialog" className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800 hover:text-ink-700 dark:hover:text-ink-100 transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
        {footer && <div className="flex items-center justify-end gap-2 border-t border-ink-100 dark:border-ink-800 px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
}
