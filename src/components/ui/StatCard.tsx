import type { ReactNode } from 'react';
import { Skeleton } from './Skeleton';

type Tone = 'neutral' | 'primary' | 'accent' | 'success' | 'warning' | 'error';

interface StatCardProps {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  hint?: string;
  tone?: Tone;
  loading?: boolean;
  /** Si se pasa, la tarjeta entera es un boton accesible. */
  onClick?: () => void;
  className?: string;
}

const tones: Record<Tone, string> = {
  neutral: 'bg-cream-100 text-ink-secondary',
  primary: 'bg-primary-50 text-primary-800',
  accent: 'bg-accent-50 text-accent-800',
  success: 'bg-success-50 text-success-800',
  warning: 'bg-warning-50 text-warning-800',
  error: 'bg-error-50 text-error-800',
};

/** Ficha de indicador del panel. Densidad alta: 8-16px de aire interno. */
export function StatCard({
  label,
  value,
  icon,
  hint,
  tone = 'neutral',
  loading = false,
  onClick,
  className = '',
}: StatCardProps) {
  const contenido = (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold text-ink-secondary uppercase tracking-wide">{label}</p>
        {icon && (
          <span
            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${tones[tone]}`}
            aria-hidden="true"
          >
            {icon}
          </span>
        )}
      </div>

      {loading ? (
        <Skeleton className="h-8 w-24 mt-2" />
      ) : (
        <p className="text-xl sm:text-2xl font-extrabold text-ink mt-2 tabular-nums">{value}</p>
      )}

      {hint && <p className="text-xs text-ink-muted mt-1">{hint}</p>}
    </>
  );

  const base = 'bg-surface rounded-2xl border border-line p-4 text-left w-full';

  /* Si la ficha navega, tiene que ser un <button> real: foco, Enter y Espacio
     salen gratis. Un <div onClick> deja fuera a quien usa teclado. */
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${base} cursor-pointer transition-colors duration-base ease-smooth hover:bg-cream-50 active:bg-cream-100 ${className}`}
      >
        {contenido}
      </button>
    );
  }

  return <div className={`${base} ${className}`}>{contenido}</div>;
}
