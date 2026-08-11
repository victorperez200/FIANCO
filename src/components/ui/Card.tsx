import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  /** Eleva la tarjeta. Usar solo cuando flota sobre otro contenido. */
  raised?: boolean;
  as?: 'div' | 'section' | 'article' | 'li';
}

export function Card({ children, className = '', raised = false, as: Tag = 'div' }: CardProps) {
  return (
    <Tag className={`bg-surface rounded-2xl border border-line ${raised ? 'shadow-md' : ''} ${className}`}>
      {children}
    </Tag>
  );
}

interface CardHeaderProps {
  title: ReactNode;
  /** Se anuncia como encabezado real: mantiene el orden del arbol de titulos. */
  level?: 2 | 3;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}

export function CardHeader({ title, level = 2, action, icon, className = '' }: CardHeaderProps) {
  const Heading = level === 2 ? 'h2' : 'h3';
  return (
    <div className={`flex items-center justify-between gap-3 px-4 py-3 border-b border-line ${className}`}>
      <div className="flex items-center gap-2 min-w-0">
        {icon && <span className="text-ink-muted shrink-0">{icon}</span>}
        <Heading className="text-sm font-bold text-ink truncate">{title}</Heading>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
