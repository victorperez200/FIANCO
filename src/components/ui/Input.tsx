import type { InputHTMLAttributes, ReactNode } from 'react';
import { Field } from './Field';
import { controlClasses, describedBy, useFieldIds } from './field-utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  /** Icono decorativo a la izquierda (lupa, moneda...). */
  leading?: ReactNode;
  /** Control a la derecha (mostrar contraseña, limpiar...). Sí es interactivo. */
  trailing?: ReactNode;
  wrapperClassName?: string;
}

export function Input({
  label,
  hint,
  error,
  leading,
  trailing,
  id: idProp,
  className = '',
  wrapperClassName = '',
  ...props
}: InputProps) {
  const { id, hintId, errorId } = useFieldIds(idProp);

  return (
    <Field
      id={id}
      label={label}
      hint={hint}
      error={error}
      hintId={hintId}
      errorId={errorId}
      required={props.required}
      className={wrapperClassName}
    >
      <div className="relative">
        {leading && (
          <span
            className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none"
            aria-hidden="true"
          >
            {leading}
          </span>
        )}
        <input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(hint && hintId, error && errorId)}
          className={`${controlClasses(error)} ${leading ? 'pl-10' : ''} ${trailing ? 'pr-12' : ''} ${className}`}
          {...props}
        />
        {trailing && <span className="absolute right-1 top-1/2 -translate-y-1/2">{trailing}</span>}
      </div>
    </Field>
  );
}
