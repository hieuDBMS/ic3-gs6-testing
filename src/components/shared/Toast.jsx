import { useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

const STYLES = {
  success: { bg: 'bg-emerald-600', icon: CheckCircle2 },
  error: { bg: 'bg-red-600', icon: AlertTriangle },
  warning: { bg: 'bg-amber-500', icon: AlertCircle },
  info: { bg: 'bg-gray-900', icon: Info },
};

/**
 * Single toast queue shared across pages. `showToast(message, type)` enqueues
 * a toast that auto-dismisses after 3.5s; `toast` exposes the most recent one
 * for call sites that only ever show one at a time.
 */
// eslint-disable-next-line react-refresh/only-export-components -- hook is intentionally co-located with the Toast component it drives
export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => dismissToast(id), 3500);
  }, [dismissToast]);

  return { toast: toasts[toasts.length - 1] || null, toasts, showToast, dismissToast };
};

export const Toast = ({ toasts, onDismiss }) => (
  <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
    {toasts.map((t) => {
      const { bg, icon: Icon } = STYLES[t.type] || STYLES.success;
      return (
        <div
          key={t.id}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white pointer-events-auto transition-all ${bg}`}
        >
          <Icon className="w-4 h-4 flex-shrink-0" />
          <span>{t.message}</span>
          {onDismiss && (
            <button onClick={() => onDismiss(t.id)} className="ml-2 opacity-70 hover:opacity-100">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      );
    })}
  </div>
);
