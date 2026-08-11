/**
 * Reserva el espacio que ocupara el contenido real.
 *
 * Sin esto la pagina "salta" cuando llegan los datos de Supabase (Cumulative
 * Layout Shift). El objetivo es CLS < 0.1.
 */
export function Skeleton({ className = '' }: { className?: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-lg bg-cream-200 ${className}`} />;
}

/** Bloque de filas para listas y tablas mientras cargan. */
export function SkeletonRows({ rows = 5, className = '' }: { rows?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`} role="status" aria-label="Cargando datos">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-14 w-full" />
      ))}
    </div>
  );
}
