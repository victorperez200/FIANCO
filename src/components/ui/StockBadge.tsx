import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { Badge } from './Badge';

interface StockBadgeProps {
  stock: number;
  stockMinimo: number;
  /** Muestra la cantidad ademas del estado. */
  showCount?: boolean;
  className?: string;
}

/**
 * Semaforo de inventario.
 *
 * Cada estado lleva icono + palabra ademas del color: quien no distingue el
 * verde del rojo sigue pudiendo leer "Agotado" y ver una X. Es la regla de no
 * comunicar nunca solo con color.
 */
export function StockBadge({ stock, stockMinimo, showCount = false, className = '' }: StockBadgeProps) {
  const sufijo = showCount ? ` · ${stock}` : '';

  if (stock <= 0) {
    return (
      <Badge variant="error" icon={<XCircle className="w-3.5 h-3.5" />} className={className}>
        Agotado{sufijo}
      </Badge>
    );
  }

  if (stock < stockMinimo) {
    return (
      <Badge variant="warning" icon={<AlertTriangle className="w-3.5 h-3.5" />} className={className}>
        Stock bajo{sufijo}
      </Badge>
    );
  }

  return (
    <Badge variant="success" icon={<CheckCircle2 className="w-3.5 h-3.5" />} className={className}>
      Disponible{sufijo}
    </Badge>
  );
}
