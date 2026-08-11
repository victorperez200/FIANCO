import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

type ToastTipo = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  tipo: ToastTipo;
  mensaje: string;
}

interface ToastContextValue {
  notify: (tipo: ToastTipo, mensaje: string) => void;
  success: (mensaje: string) => void;
  error: (mensaje: string) => void;
  info: (mensaje: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const notify = useCallback((tipo: ToastTipo, mensaje: string) => {
    const id = nextId++;
    setToasts((t) => [...t, { id, tipo, mensaje }]);
    setTimeout(() => remove(id), 4000);
  }, [remove]);

  const value: ToastContextValue = {
    notify,
    success: (m) => notify('success', m),
    error: (m) => notify('error', m),
    info: (m) => notify('info', m),
  };

  const iconos = {
    success: <CheckCircle2 className="w-5 h-5 text-success-600" />,
    error: <AlertCircle className="w-5 h-5 text-error-600" />,
    info: <Info className="w-5 h-5 text-primary-600" />,
  };

  const estilos = {
    success: 'border-success-200 bg-success-50',
    error: 'border-error-200 bg-error-50',
    info: 'border-primary-200 bg-primary-50',
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-[calc(100vw-2rem)]">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg animate-slide-in ${estilos[t.tipo]}`}
          >
            {iconos[t.tipo]}
            <p className="flex-1 text-sm font-medium text-ink">{t.mensaje}</p>
            <button onClick={() => remove(t.id)} className="text-ink-muted hover:text-ink-secondary">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast debe usarse dentro de ToastProvider');
  return ctx;
}
