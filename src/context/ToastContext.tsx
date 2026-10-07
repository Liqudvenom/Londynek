import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { Info, X } from 'lucide-react';
import './toast.css';

interface Toast {
  id: number;
  message: string;
}

const ToastContext = createContext<((message: string) => void) | null>(null);

const TOAST_MS = 4200;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const notify = useCallback(
    (message: string) => {
      const id = nextId.current++;
      setToasts((t) => [...t.slice(-2), { id, message }]);
      window.setTimeout(() => dismiss(id), TOAST_MS);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={notify}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className="toast">
            <Info size={18} aria-hidden="true" />
            <span>{t.message}</span>
            <button type="button" className="toast__close" onClick={() => dismiss(t.id)} aria-label="Zamknij powiadomienie">
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}

export const PROTOTYPE_MESSAGE = 'Wersja prototypowa – ta funkcja wymaga podłączenia backendu Londynek.net.';
