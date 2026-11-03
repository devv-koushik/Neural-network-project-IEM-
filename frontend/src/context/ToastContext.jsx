import { createContext, useCallback, useState } from 'react';
import { CheckCircle2, XCircle, Info, X, AlertTriangle } from 'lucide-react';

export const ToastContext = createContext(null);

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};

const STYLES = {
  success: 'border-mint-500/30 text-mint-600 dark:text-mint-500',
  error: 'border-coral-500/30 text-coral-500',
  info: 'border-signal-500/30 text-signal-500',
  warning: 'border-amber-500/30 text-amber-500',
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((t) => t.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'success', duration = 3200) => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => removeToast(id), duration);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm">
        {toasts.map((toast) => {
          const Icon = ICONS[toast.type] || Info;
          return (
            <div
              key={toast.id}
              role="status"
              className={`animate-slideInRight flex items-start gap-3 rounded-xl border bg-white dark:bg-ink-850 px-4 py-3 shadow-soft-lg ${STYLES[toast.type]}`}
            >
              <Icon size={18} className="mt-0.5 shrink-0" />
              <p className="text-sm text-ink-700 dark:text-ink-100 flex-1">{toast.message}</p>
              <button onClick={() => removeToast(toast.id)} aria-label="Dismiss notification" className="text-ink-400 hover:text-ink-600 dark:hover:text-ink-200">
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
