import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props { children: ReactNode }
interface State { error: Error | null }

/** Evita la pantalla en blanco: si un componente falla al renderizar, muestra una salida en vez de desmontar toda la app. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Error de renderizado:', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md text-center bg-white border border-slate-200 rounded-lg shadow-sm p-8">
          <h1 className="text-xl font-semibold text-slate-900">Algo salió mal</h1>
          <p className="mt-2 text-sm text-slate-500">Ocurrió un error al mostrar esta pantalla. Puedes volver al inicio o recargar la página.</p>
          <div className="mt-6 flex gap-2 justify-center">
            <a href="/" className="px-4 py-2 rounded bg-slate-800 text-white text-sm font-medium">Ir al inicio</a>
            <button onClick={() => window.location.reload()} className="px-4 py-2 rounded border border-slate-300 text-slate-700 text-sm font-medium">Recargar</button>
          </div>
        </div>
      </div>
    );
  }
}
