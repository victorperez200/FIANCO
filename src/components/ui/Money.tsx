import { formatMoneda } from '../../lib/format';

interface MoneyProps {
  value: number | string | null | undefined;
  /** Colorea segun el signo. Solo donde el signo es informacion (caja, abonos). */
  signed?: boolean;
  /** Antepone +/- explicitamente. */
  showSign?: boolean;
  className?: string;
}

/**
 * Toda cifra monetaria pasa por aqui.
 *
 * `data-numeric` activa las cifras tabulares definidas en index.css: sin ellas
 * los digitos tienen anchos distintos y las columnas de totales se desalinean
 * cada vez que llega una actualizacion en tiempo real.
 */
export function Money({ value, signed = false, showSign = false, className = '' }: MoneyProps) {
  const n = typeof value === 'string' ? parseFloat(value) : value ?? 0;
  const safe = Number.isFinite(n) ? n : 0;

  const tone = signed ? (safe > 0 ? 'text-success-700' : safe < 0 ? 'text-error-700' : 'text-ink') : '';
  const sign = showSign && safe > 0 ? '+' : '';

  return (
    <span data-numeric className={`${tone} ${className}`}>
      {sign}
      {formatMoneda(safe)}
    </span>
  );
}
