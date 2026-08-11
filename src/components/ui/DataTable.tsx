import type { ReactNode } from 'react';
import { SkeletonRows } from './Skeleton';

export interface Column<T> {
  /** Identificador estable de la columna. */
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  align?: 'left' | 'right' | 'center';
  /** No aparece en la vista de tarjeta (movil). Para datos de relleno. */
  hideOnCard?: boolean;
  /** Clases extra para la celda. */
  className?: string;
  /** Ancho sugerido de la columna en escritorio. */
  width?: string;
}

interface DataTableProps<T> {
  rows: T[];
  columns: Column<T>[];
  getKey: (row: T) => string;
  /** Titulo de la tarjeta en movil. Suele ser el nombre de la entidad. */
  cardTitle: (row: T) => ReactNode;
  /** Acciones por fila (editar, anular...). */
  rowActions?: (row: T) => ReactNode;
  /** Qué mostrar cuando no hay filas. */
  empty?: ReactNode;
  loading?: boolean;
  /** Descripcion de la tabla para lectores de pantalla. */
  caption: string;
  className?: string;
}

const aligns = {
  left: 'text-left',
  right: 'text-right',
  center: 'text-center',
};

/**
 * Una sola fuente para listados tabulares.
 *
 * En >=768px pinta una `<table>` real (semantica correcta, encabezados
 * asociados). Por debajo cambia a tarjetas etiqueta/valor, porque una tabla de
 * seis columnas en 375px o desborda el viewport o se vuelve ilegible. Antes las
 * dos tablas de la app no tenian ni contenedor con scroll.
 */
export function DataTable<T>({
  rows,
  columns,
  getKey,
  cardTitle,
  rowActions,
  empty,
  loading = false,
  caption,
  className = '',
}: DataTableProps<T>) {
  if (loading) {
    return <SkeletonRows rows={6} className={className} />;
  }

  if (rows.length === 0) {
    return <>{empty}</>;
  }

  return (
    <div className={className}>
      {/* ---------- Escritorio: tabla ---------- */}
      <div className="hidden md:block table-scroll">
        <table className="w-full border-collapse">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="border-b border-line">
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  style={col.width ? { width: col.width } : undefined}
                  className={`px-3 py-2.5 text-xs font-bold text-ink-secondary uppercase tracking-wide ${aligns[col.align ?? 'left']}`}
                >
                  {col.header}
                </th>
              ))}
              {rowActions && (
                <th scope="col" className="px-3 py-2.5 w-px">
                  <span className="sr-only">Acciones</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={getKey(row)}
                className="border-b border-line last:border-0 transition-colors duration-base ease-smooth hover:bg-cream-50"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-3 py-3 text-sm text-ink ${aligns[col.align ?? 'left']} ${col.className ?? ''}`}
                  >
                    {col.cell(row)}
                  </td>
                ))}
                {rowActions && (
                  <td className="px-3 py-3">
                    <div className="flex items-center justify-end gap-1">{rowActions(row)}</div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ---------- Movil: tarjetas ---------- */}
      <ul className="md:hidden space-y-2">
        {rows.map((row) => (
          <li key={getKey(row)} className="bg-surface rounded-xl border border-line p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="font-semibold text-ink text-sm min-w-0">{cardTitle(row)}</div>
              {rowActions && <div className="flex items-center gap-1 shrink-0">{rowActions(row)}</div>}
            </div>

            <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5">
              {columns
                .filter((col) => !col.hideOnCard)
                .map((col) => (
                  <div key={col.key} className="min-w-0">
                    <dt className="text-[11px] font-semibold text-ink-muted uppercase tracking-wide">
                      {col.header}
                    </dt>
                    <dd className="text-sm text-ink truncate">{col.cell(row)}</dd>
                  </div>
                ))}
            </dl>
          </li>
        ))}
      </ul>
    </div>
  );
}
