import { useId, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { useFocusTrap } from '../lib/useFocusTrap';
import { IconButton } from './ui';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  /** Pie fijo para las acciones: no se va con el scroll del contenido. */
  footer?: ReactNode;
}

const widths = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
};

export function Modal({ open, onClose, title, children, size = 'md', footer }: ModalProps) {
  const titleId = useId();
  const ref = useFocusTrap<HTMLDivElement>(open, onClose);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div
        className="absolute inset-0 bg-black/40 animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* `aria-modal` mas la trampa de foco es lo que hace que el resto de la
          pagina deje de existir para un lector de pantalla mientras esta abierto. */}
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`relative w-full ${widths[size]} bg-surface rounded-t-2xl sm:rounded-2xl
          border border-line shadow-lg animate-slide-up
          max-h-[90vh] flex flex-col outline-none`}
      >
        {/* Asa de arrastre: en movil el dialogo sube desde abajo y esta pista
            visual indica que es una hoja descartable. */}
        <div className="sm:hidden flex justify-center pt-2" aria-hidden="true">
          <span className="h-1 w-10 rounded-full bg-cream-200" />
        </div>

        <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-line">
          <h2 id={titleId} className="text-lg font-bold text-ink truncate">
            {title}
          </h2>
          <IconButton label="Cerrar" icon={<X className="w-5 h-5" />} onClick={onClose} className="-mr-2" />
        </div>

        <div className="overflow-y-auto overscroll-contain px-5 py-4">{children}</div>

        {footer && <div className="px-5 py-3 border-t border-line pb-safe">{footer}</div>}
      </div>
    </div>
  );
}
