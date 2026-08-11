import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  /** Acciones de la pagina. En movil bajan a su propia fila y ocupan el ancho. */
  actions?: ReactNode;
  className?: string;
}

/**
 * Cabecera unica de pagina. Sustituye las repeticiones de titulo y padding que
 * estaban copiadas por las nueve pantallas, y garantiza que cada vista tenga
 * exactamente un `<h1>`.
 */
export function PageHeader({ title, subtitle, actions, className = '' }: PageHeaderProps) {
  return (
    <div className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4 ${className}`}>
      <div className="min-w-0">
        <h1 className="text-xl sm:text-2xl font-extrabold text-ink tracking-tight truncate">{title}</h1>
        {subtitle && <p className="text-sm text-ink-secondary mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
