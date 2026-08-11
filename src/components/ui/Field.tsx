import type { ReactNode } from 'react';

interface FieldProps {
  id: string;
  label?: string;
  hint?: string;
  error?: string;
  hintId: string;
  errorId: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

/**
 * Envoltorio comun de todo control de formulario: etiqueta asociada, ayuda y
 * error. Los identificadores se generan con `useFieldIds` (en `field-utils`).
 */
export function Field({
  id,
  label,
  hint,
  error,
  hintId,
  errorId,
  required,
  children,
  className = '',
}: FieldProps) {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-sm font-semibold text-ink-secondary mb-1.5">
          {label}
          {required && (
            <span className="text-error-700 ml-0.5" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}

      {/* La ayuda va ANTES del control: se lee mientras se rellena, no despues. */}
      {hint && (
        <p id={hintId} className="text-xs text-ink-muted mb-1.5">
          {hint}
        </p>
      )}

      {children}

      {/* El error vive junto al campo, no en un resumen al final del formulario.
          `role="alert"` hace que se anuncie en cuanto aparece. */}
      {error && (
        <p id={errorId} role="alert" className="mt-1.5 text-xs text-error-800 font-medium">
          {error}
        </p>
      )}
    </div>
  );
}
