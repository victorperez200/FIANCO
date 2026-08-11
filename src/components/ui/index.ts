/**
 * Punto unico de entrada de la libreria de UI.
 *
 * Las paginas siguen importando `from '../components/ui'` exactamente igual que
 * antes: al ser una carpeta con index, la ruta no cambia y ningun import se
 * rompe pese a que el archivo `ui.tsx` original ya no existe.
 */
export { Button } from './Button';
export { IconButton } from './IconButton';
export { Card, CardHeader } from './Card';
export { Input } from './Input';
export { Select } from './Select';
export { Field } from './Field';
export { useFieldIds, describedBy, controlClasses } from './field-utils';
export { Badge } from './Badge';
export { StockBadge } from './StockBadge';
export { Money } from './Money';
export { StatCard } from './StatCard';
export { DataTable, type Column } from './DataTable';
export { PageHeader } from './PageHeader';
export { EmptyState } from './EmptyState';
export { Skeleton, SkeletonRows } from './Skeleton';
export { Spinner } from './Spinner';
export { Logo, LogoMarca } from './Logo';
