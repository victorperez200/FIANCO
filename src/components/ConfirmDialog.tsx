import { type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './ui';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary';
  /** Bloquea el boton mientras se resuelve la accion. */
  loading?: boolean;
}

const tonos = {
  danger: 'bg-error-50 text-error-800',
  warning: 'bg-warning-50 text-warning-800',
  primary: 'bg-primary-50 text-primary-800',
};

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
  loading = false,
}: ConfirmDialogProps) {
  const btnVariant = variant === 'danger' ? 'danger' : 'primary';

  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="flex flex-col items-center text-center">
        <div
          className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${tonos[variant]}`}
          aria-hidden="true"
        >
          <AlertTriangle className="w-7 h-7" />
        </div>

        <div className="text-sm text-ink-secondary mb-6">{message}</div>

        {/* Cancelar va primero en el orden del DOM: es la salida segura y la
            primera parada al tabular dentro del dialogo. */}
        <div className="flex flex-col-reverse sm:flex-row gap-2 w-full">
          <Button variant="outline" block onClick={onClose} className="sm:flex-1">
            {cancelLabel}
          </Button>
          <Button
            variant={btnVariant}
            block
            loading={loading}
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="sm:flex-1"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
