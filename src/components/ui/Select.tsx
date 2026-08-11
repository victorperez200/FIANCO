import type { SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { Field } from './Field';
import { controlClasses, describedBy, useFieldIds } from './field-utils';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
  wrapperClassName?: string;
}

export function Select({
  label,
  hint,
  error,
  id: idProp,
  className = '',
  wrapperClassName = '',
  children,
  ...props
}: SelectProps) {
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
        <select
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(hint && hintId, error && errorId)}
          className={`${controlClasses(error)} appearance-none pr-10 cursor-pointer ${className}`}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted pointer-events-none"
          aria-hidden="true"
        />
      </div>
    </Field>
  );
}
