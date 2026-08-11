import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './lib/auth';
import { ToastProvider } from './lib/toast';
import { Login } from './pages/Login';
import { Layout, rolPuedeVer, type Vista } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Ventas } from './pages/Ventas';
import { Inventario } from './pages/Inventario';
import { Clientes } from './pages/Clientes';
import { Fiao } from './pages/Fiao';
import { Caja } from './pages/Caja';
import { Historial } from './pages/Historial';
import { Staff } from './pages/Staff';
import { Spinner } from './components/ui';
import { ErrorBoundary } from './components/ErrorBoundary';
import { supabase } from './lib/supabase';
import { cargarProductosBajoStock } from './lib/queries';

function AppContent() {
  const { session, perfil, cargando } = useAuth();
  const [vista, setVista] = useState<Vista>('dashboard');
  const [alertaBadge, setAlertaBadge] = useState(0);

  // Badge de productos con stock bajo para la navegación
  useEffect(() => {
    if (!session) return;
    const cargar = async () => {
      /* Mismo criterio que el inicio e Inventario. Antes esta consulta usaba el
         filtro columna-contra-columna que Postgres rechaza, asi que la insignia
         era siempre 0. */
      const bajos = await cargarProductosBajoStock();
      setAlertaBadge(bajos.length);
    };
    cargar();
    const channel = supabase
      .channel('badge-stock')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'productos' }, cargar)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [session]);

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas">
        <div className="flex flex-col items-center gap-3">
          <Spinner className="w-10 h-10 text-primary-600" />
          <p className="text-sm text-ink-secondary">Cargando Fianco…</p>
        </div>
      </div>
    );
  }

  if (!session || !perfil) {
    return <Login />;
  }

  /* `vista` es estado en memoria y sobrevive a un cambio de usuario sin recargar
     (el dueño cierra sesion en "Usuarios" y entra el cajero). Si el rol actual
     no puede ver la vista guardada, se cae a "Inicio". Esto se decide en el
     render, no en un efecto, para que el modulo prohibido no llegue a pintarse
     ni un fotograma. */
  const vistaSegura: Vista = rolPuedeVer(vista, perfil.rol) ? vista : 'dashboard';

  return (
    <Layout vista={vistaSegura} onVista={setVista} alertaBadge={alertaBadge}>
      {vistaSegura === 'dashboard' && <Dashboard onIrInventario={() => setVista('inventario')} />}
      {vistaSegura === 'ventas' && <Ventas />}
      {vistaSegura === 'inventario' && <Inventario />}
      {vistaSegura === 'clientes' && <Clientes />}
      {vistaSegura === 'fiao' && <Fiao />}
      {vistaSegura === 'caja' && <Caja />}
      {vistaSegura === 'historial' && <Historial />}
      {vistaSegura === 'staff' && <Staff />}
    </Layout>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
