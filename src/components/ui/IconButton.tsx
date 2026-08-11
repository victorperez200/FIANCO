import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Tone = 'neutral' | 'primary' | 'danger';

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /**
   * Obligatorio, no opcional.
   *
   * Un boton de solo icono sin nombre accesible es literalmente un boton sin
   * texto para un lector de pantalla. Al exigirlo en el tipo, TypeScript impide
   * que se cuele uno sin etiquetar.
   */
  label: string;
  icon: ReactNode;
  tone?: Tone;
}

const tones: Record<Tone, string> = {
  neutral: 'text-ink-secondary hover:bg-cream-100 active:bg-cream-200',
  primary: 'text-primary-700 hover:bg-primary-50 active:bg-primary-100',
  danger: 'text-error-700 hover:bg-error-50 active:bg-error-100',
};

export function IconButton({ label, icon, tone = 'neutral', className = '', ...props }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`inline-flex items-center justify-center min-h-touch min-w-touch rounded-lg cursor-pointer
        transition-colors duration-base ease-smooth
        disabled:opacity-50 disabled:cursor-not-allowed
        ${tones[tone]} ${className}`}
      {...props}
    >
      <span aria-hidden="true">{icon}</span>
    </button>
  );
}
