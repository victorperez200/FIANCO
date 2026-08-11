import { useId } from 'react';

/**
 * Genera el trio de identificadores que ata un control con su etiqueta, su
 * texto de ayuda y su error.
 *
 * El problema que resuelve: antes las etiquetas eran un `<label>` suelto sin
 * `htmlFor` y los `<input>` no tenian `id`. Visualmente parecia correcto, pero
 * para un lector de pantalla el campo no tenia nombre. Al centralizarlo aqui,
 * es imposible construir un campo sin asociar.
 *
 * Vive fuera de `Field.tsx` para que ese archivo exporte solo componentes y no
 * rompa el refresco en caliente de Vite.
 */
export function useFieldIds(explicitId?: string) {
  const auto = useId();
  const id = explicitId ?? auto;
  return { id, hintId: `${id}-hint`, errorId: `${id}-error` };
}

/** Encadena solo los ids que existen; devuelve undefined si no hay ninguno. */
export function describedBy(...ids: (string | false | undefined)[]) {
  const list = ids.filter(Boolean).join(' ');
  return list || undefined;
}

/** Clases compartidas por input, select y textarea. */
export const controlClasses = (error?: string) =>
  `w-full min-h-touch px-3 rounded-xl border bg-surface text-ink
   placeholder:text-ink-muted transition-colors duration-base ease-smooth
   disabled:opacity-60 disabled:cursor-not-allowed
   text-base sm:text-sm
   ${error ? 'border-error-600' : 'border-line-strong hover:border-ink-muted'}`;
