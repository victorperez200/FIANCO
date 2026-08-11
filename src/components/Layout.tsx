import { useCallback, useState, type ReactNode } from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  HandCoins,
  Wallet,
  LogOut,
  UserCog,
  MoreHorizontal,
  X,
  Receipt,
  Users,
  Contact,
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useFocusTrap } from '../lib/useFocusTrap';
import { IconButton, Logo } from './ui';
import { MiCuenta } from './MiCuenta';
import type { Rol } from '../types';

export type Vista = 'dashboard' | 'ventas' | 'inventario' | 'clientes' | 'fiao' | 'caja' | 'historial' | 'staff';

interface LayoutProps {
  vista: Vista;
  onVista: (v: Vista) => void;
  children: ReactNode;
  alertaBadge?: number;
}

interface NavItem {
  id: Vista;
  label: string;
  icon: typeof LayoutDashboard;
  roles: Rol[];
  /**
   * Las cuatro tareas del dia a dia del colmado. Solo estas ocupan sitio en la
   * barra inferior; el resto vive en la hoja "Mas".
   *
   * El limite de cinco destinos no es capricho: con ocho iconos en 375px cada
   * objetivo bajaba de los 44px minimos y las etiquetas quedaban en 10px.
   */
  principal?: boolean;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Inicio', icon: LayoutDashboard, roles: ['dueño', 'cajero'], principal: true },
  { id: 'ventas', label: 'Vender', icon: ShoppingCart, roles: ['dueño', 'cajero'], principal: true },
  { id: 'inventario', label: 'Inventario', icon: Package, roles: ['dueño'], principal: true },
  { id: 'fiao', label: 'Fiao', icon: HandCoins, roles: ['dueño', 'cajero'], principal: true },
  { id: 'clientes', label: 'Clientes', icon: Contact, roles: ['dueño', 'cajero'] },
  { id: 'caja', label: 'Caja', icon: Wallet, roles: ['dueño', 'cajero'] },
  { id: 'historial', label: 'Historial', icon: Receipt, roles: ['dueño', 'cajero'] },
  { id: 'staff', label: 'Usuarios', icon: Users, roles: ['dueño'] },
];

/**
 * Unica fuente de verdad de "que rol puede ver que modulo". La usan tanto el
 * menu (para mostrar u ocultar destinos) como App (para no renderizar el
 * contenido de un modulo prohibido). Sin este segundo control, ocultar el
 * enlace no basta: si `vista` ya apunta a un modulo restringido —por ejemplo
 * porque el dueño lo dejo abierto antes de que entrara el cajero— el modulo se
 * pintaria igual.
 */
export function rolPuedeVer(vista: Vista, rol: Rol): boolean {
  const item = navItems.find((i) => i.id === vista);
  return !!item && item.roles.includes(rol);
}

export function Layout({ vista, onVista, children, alertaBadge = 0 }: LayoutProps) {
  const { perfil, signOut } = useAuth();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [cuentaOpen, setCuentaOpen] = useState(false);

  const cerrarSheet = useCallback(() => setSheetOpen(false), []);
  const sheetRef = useFocusTrap<HTMLDivElement>(sheetOpen, cerrarSheet);

  const items = navItems.filter((i) => perfil && i.roles.includes(perfil.rol));
  const principales = items.filter((i) => i.principal);
  const secundarios = items.filter((i) => !i.principal);
  const enSecundarios = secundarios.some((i) => i.id === vista);

  const ir = (v: Vista) => {
    onVista(v);
    setSheetOpen(false);
  };

  const iniciales = perfil?.nombre?.charAt(0).toUpperCase() ?? '?';

  return (
    <div className="min-h-screen bg-canvas flex">
      {/* Primer elemento tabulable de la pagina: deja saltarse la navegacion
          entera en vez de recorrer ocho enlaces en cada carga. */}
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60]
          focus:px-4 focus:py-2 focus:rounded-xl focus:bg-primary-600 focus:text-white focus:font-semibold"
      >
        Saltar al contenido
      </a>

      {/* ================= Rail de escritorio ================= */}
      <aside className="hidden lg:flex w-64 flex-col bg-rail fixed h-screen">
        <div className="px-6 py-5 border-b border-white/10">
          <Logo tono="oscuro" size="sm" claim />
        </div>

        <nav aria-label="Navegación principal" className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {items.map((item) => {
            const Icon = item.icon;
            const activo = vista === item.id;
            return (
              <button
                key={item.id}
                onClick={() => ir(item.id)}
                aria-current={activo ? 'page' : undefined}
                className={`relative w-full flex items-center gap-3 px-3 min-h-touch rounded-xl
                  font-semibold text-sm cursor-pointer
                  transition-colors duration-base ease-smooth
                  ${activo ? 'bg-white/10 text-white' : 'text-rail-muted hover:text-white hover:bg-white/5'}`}
              >
                <Icon className="w-5 h-5 shrink-0" aria-hidden="true" />
                <span className="truncate">{item.label}</span>

                {item.id === 'inventario' && alertaBadge > 0 && (
                  <span className="ml-auto bg-error-600 text-white text-xs font-bold rounded-full px-2 py-0.5 min-w-[20px] text-center">
                    {alertaBadge}
                    <span className="sr-only"> productos con stock bajo</span>
                  </span>
                )}

                {activo && (
                  <span
                    aria-hidden="true"
                    className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-l-full"
                  />
                )}
              </button>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-white/10">
          {/* La ficha de usuario abre "Mi cuenta": es el sitio donde uno busca
              cambiar su correo o su contraseña. */}
          <button
            onClick={() => setCuentaOpen(true)}
            aria-haspopup="dialog"
            className="w-full flex items-center gap-3 px-3 py-2 mb-2 rounded-xl text-left cursor-pointer
              hover:bg-white/5 transition-colors duration-base ease-smooth"
          >
            <div
              className="w-9 h-9 rounded-full bg-white/10 text-white flex items-center justify-center font-bold text-sm shrink-0"
              aria-hidden="true"
            >
              {iniciales}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white truncate">{perfil?.nombre}</p>
              <p className="text-xs text-rail-muted capitalize">{perfil?.rol}</p>
            </div>
            <UserCog className="w-4 h-4 text-rail-muted shrink-0" aria-hidden="true" />
            <span className="sr-only">Mi cuenta</span>
          </button>
          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 px-3 min-h-touch rounded-xl text-sm font-semibold
              text-rail-muted hover:text-white hover:bg-white/5 cursor-pointer
              transition-colors duration-base ease-smooth"
          >
            <LogOut className="w-5 h-5 shrink-0" aria-hidden="true" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ================= Contenido ================= */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen min-w-0">
        <header className="lg:hidden sticky top-0 z-30 bg-surface border-b border-line pt-safe">
          <div className="px-4 py-2.5 flex items-center justify-between">
            <Logo tono="claro" size="sm" />
            <div className="flex items-center gap-2">
              <span className="text-sm text-ink-secondary truncate max-w-[9rem]">{perfil?.nombre}</span>
              <IconButton label="Cerrar sesión" icon={<LogOut className="w-5 h-5" />} onClick={signOut} />
            </div>
          </div>
        </header>

        {/* El colchon inferior deja libre la barra de navegacion y ademas la
            franja de gestos del sistema. */}
        <main id="contenido" tabIndex={-1} className="flex-1 outline-none pb-[calc(5rem+env(safe-area-inset-bottom,0px))] lg:pb-8">
          {children}
        </main>
      </div>

      {/* ================= Barra inferior movil: 4 destinos + "Mas" ================= */}
      <nav
        aria-label="Navegación principal"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-surface border-t border-line pb-safe"
      >
        <div className="flex items-stretch justify-around px-1 pt-1">
          {principales.map((item) => {
            const Icon = item.icon;
            const activo = vista === item.id;
            return (
              <button
                key={item.id}
                onClick={() => ir(item.id)}
                aria-current={activo ? 'page' : undefined}
                className={`relative flex flex-col items-center justify-center gap-0.5 flex-1
                  min-h-touch py-1.5 rounded-lg cursor-pointer
                  transition-colors duration-base ease-smooth
                  ${activo ? 'text-primary-700' : 'text-ink-muted hover:text-ink-secondary'}`}
              >
                <Icon className="w-6 h-6" aria-hidden="true" />
                <span className="text-[11px] font-semibold leading-none">{item.label}</span>

                {item.id === 'inventario' && alertaBadge > 0 && (
                  <span className="absolute top-0 right-2 bg-error-600 text-white text-[9px] font-bold rounded-full px-1.5 py-0.5 min-w-[16px] text-center leading-none">
                    {alertaBadge}
                    <span className="sr-only"> productos con stock bajo</span>
                  </span>
                )}
              </button>
            );
          })}

          {secundarios.length > 0 && (
            <button
              onClick={() => setSheetOpen(true)}
              aria-expanded={sheetOpen}
              aria-haspopup="dialog"
              className={`flex flex-col items-center justify-center gap-0.5 flex-1
                min-h-touch py-1.5 rounded-lg cursor-pointer
                transition-colors duration-base ease-smooth
                ${enSecundarios ? 'text-primary-700' : 'text-ink-muted hover:text-ink-secondary'}`}
            >
              <MoreHorizontal className="w-6 h-6" aria-hidden="true" />
              <span className="text-[11px] font-semibold leading-none">Más</span>
            </button>
          )}
        </div>
      </nav>

      {/* ================= Hoja "Mas" ================= */}
      {sheetOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/40 animate-fade-in" onClick={cerrarSheet} aria-hidden="true" />

          <div
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-label="Más secciones"
            tabIndex={-1}
            className="relative w-full bg-surface rounded-t-2xl shadow-lg animate-sheet-up outline-none pb-safe max-h-[80vh] overflow-y-auto"
          >
            <div className="flex justify-center pt-2" aria-hidden="true">
              <span className="h-1 w-10 rounded-full bg-cream-200" />
            </div>

            <div className="flex items-center justify-between px-4 py-3 border-b border-line">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-10 h-10 rounded-full bg-primary-50 text-primary-800 flex items-center justify-center font-bold shrink-0"
                  aria-hidden="true"
                >
                  {iniciales}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-ink truncate">{perfil?.nombre}</p>
                  <p className="text-xs text-ink-secondary capitalize">{perfil?.rol}</p>
                </div>
              </div>
              <IconButton label="Cerrar" icon={<X className="w-5 h-5" />} onClick={cerrarSheet} />
            </div>

            <ul className="p-2">
              {secundarios.map((item) => {
                const Icon = item.icon;
                const activo = vista === item.id;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => ir(item.id)}
                      aria-current={activo ? 'page' : undefined}
                      className={`w-full flex items-center gap-3 px-3 min-h-touch rounded-xl
                        font-semibold text-sm cursor-pointer text-left
                        transition-colors duration-base ease-smooth
                        ${activo ? 'bg-primary-50 text-primary-800' : 'text-ink-secondary hover:bg-cream-100'}`}
                    >
                      <Icon className="w-5 h-5 shrink-0" aria-hidden="true" />
                      {item.label}
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className="p-2 border-t border-line">
              <button
                onClick={() => {
                  cerrarSheet();
                  setCuentaOpen(true);
                }}
                className="w-full flex items-center gap-3 px-3 min-h-touch rounded-xl text-sm font-semibold
                  text-ink-secondary hover:bg-cream-100 cursor-pointer text-left
                  transition-colors duration-base ease-smooth"
              >
                <UserCog className="w-5 h-5 shrink-0" aria-hidden="true" />
                Mi cuenta
              </button>
              <button
                onClick={() => {
                  signOut();
                  cerrarSheet();
                }}
                className="w-full flex items-center gap-3 px-3 min-h-touch rounded-xl text-sm font-semibold
                  text-error-700 hover:bg-error-50 cursor-pointer text-left
                  transition-colors duration-base ease-smooth"
              >
                <LogOut className="w-5 h-5 shrink-0" aria-hidden="true" />
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}

      <MiCuenta open={cuentaOpen} onClose={() => setCuentaOpen(false)} />
    </div>
  );
}
