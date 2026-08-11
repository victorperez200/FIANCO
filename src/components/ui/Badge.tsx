import type { ReactNode } from 'react';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'accent';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  /** Icono a la izquierda. El color nunca comunica solo: forma + texto tambien. */
  icon?: ReactNode;
  className?: string;
}

/**
 * Pares fondo/texto verificados a 4.5:1 o mejor (los antiguos `-100/-700`
 * quedaban por debajo en varios casos).
 */
const variants: Record<BadgeVariant, string> = {
  default: 'bg-cream-100 text-ink-secondary',
  success: 'bg-success-50 text-success-800',
  warning: 'bg-warning-50 text-warning-800',
  error: 'bg-error-50 text-error-800',
  info: 'bg-primary-50 text-primary-800',
  accent: 'bg-accent-50 text-accent-800',
};

export function Badge({ children, variant = 'default', icon, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${variants[variant]} ${className}`}
    >
      {icon && (
        <span className="shrink-0" aria-hidden="true">
          {icon}
        </span>
      )}
      {children}
    </span>
  );
}
