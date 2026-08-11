export function formatMoneda(valor: number | string | null | undefined): string {
  const n = typeof valor === 'string' ? parseFloat(valor) : valor ?? 0;
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: 'DOP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n || 0);
}

export function formatFecha(fecha: string | Date): string {
  const d = typeof fecha === 'string' ? new Date(fecha) : fecha;
  return new Intl.DateTimeFormat('es-DO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}

export function formatFechaCorta(fecha: string | Date): string {
  const d = typeof fecha === 'string' ? new Date(fecha) : fecha;
  return new Intl.DateTimeFormat('es-DO', {
    day: '2-digit',
    month: 'short',
  }).format(d);
}

export function formatHora(fecha: string | Date): string {
  const d = typeof fecha === 'string' ? new Date(fecha) : fecha;
  return new Intl.DateTimeFormat('es-DO', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function formatFechaHora(fecha: string | Date): string {
  return `${formatFecha(fecha)} ${formatHora(fecha)}`;
}

export function diasHasta(fecha: string | Date): number {
  const d = typeof fecha === 'string' ? new Date(fecha) : fecha;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const diff = d.getTime() - hoy.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}
