import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Spinner } from './Spinner';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'success' | 'accent';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  /** Muestra spinner y bloquea el boton. Evita el doble cobro por doble toque. */
  loading?: boolean;
  /** Ocupa todo el ancho disponible. */
  block?: boolean;
  children: ReactNode;
}

const variants: Record<Variant, string> = {
  primary: 'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800',
  /* Acento de dinero: cobrar, abonar. Reservado a la accion monetaria de la pantalla. */
  accent: 'bg-accent-600 text-white hover:bg-accent-700 active:bg-accent-800',
  secondary: 'bg-cream-100 text-ink-secondary hover:bg-cream-200 active:bg-cream-200',
  danger: 'bg-error-600 text-white hover:bg-error-700 active:bg-error-800',
  success: 'bg-success-600 text-white hover:bg-success-700 active:bg-success-800',
  outline: 'bg-surface text-ink-secondary border border-line-strong hover:bg-cream-50 active:bg-cream-100',
  ghost: 'text-ink-secondary hover:bg-cream-100 active:bg-cream-200',
};

/**
 * Alturas minimas, no solo padding: `sm` se queda en 36px y por eso esta
 * restringido a barras densas de escritorio. `md` es el tamano por defecto y
 * cumple los 44px que exige WCAG 2.5.5 para un objetivo tactil.
 */
const sizes: Record<Size, string> = {
  sm: 'min-h-[36px] px-3 text-sm gap-1.5',
  md: 'min-h-touch px-4 text-sm gap-2',
  lg: 'min-h-[52px] px-5 text-base gap-2',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  block = false,
  className = '',
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center font-semibold rounded-xl cursor-pointer
        transition-colors duration-base ease-smooth
        disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
        ${variants[variant]} ${sizes[size]} ${block ? 'w-full' : ''} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Spinner className="w-4 h-4" />}
      {children}
    </button>
  );
}
