import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from './ui';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Red de seguridad de la interfaz.
 *
 * Un fallo de render en una sola pantalla (un producto sin categoria, una fecha
 * invalida) dejaba la app entera en blanco. Aqui se contiene y se ofrece una
 * salida, en vez de perder la venta que estaba en curso.
 *
 * Tiene que ser una clase: React todavia no expone equivalente en hooks.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Error no controlado en la interfaz:', error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div role="alert" className="min-h-screen bg-canvas flex items-center justify-center p-4">
        <div className="bg-surface rounded-2xl border border-line shadow-md p-6 max-w-sm w-full text-center">
          <div
            className="w-14 h-14 rounded-full bg-error-50 text-error-800 flex items-center justify-center mx-auto mb-4"
            aria-hidden="true"
          >
            <AlertTriangle className="w-7 h-7" />
          </div>

          <h1 className="text-lg font-bold text-ink">Algo salió mal</h1>
          <p className="text-sm text-ink-secondary mt-1">
            La pantalla no se pudo mostrar. Tus datos están guardados.
          </p>

          <p className="mt-3 text-xs text-ink-muted font-mono break-words">{error.message}</p>

          <Button block className="mt-5" onClick={() => window.location.reload()}>
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            Recargar
          </Button>
        </div>
      </div>
    );
  }
}
