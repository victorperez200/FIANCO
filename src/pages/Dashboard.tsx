import { useEffect, useState, type ReactNode } from 'react';
import { Wallet, HandCoins, Package, ArrowDown, ArrowUp, Clock, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cargarMetricas, cargarDeudasVencidas } from '../lib/queries';
import { marcarVencidas } from '../lib/ventas';
import { formatFechaHora } from '../lib/format';
import { Badge, Card, CardHeader, EmptyState, Money, PageHeader, Skeleton, SkeletonRows } from '../components/ui';
import { useAuth } from '../lib/auth';

interface Metricas {
  totalVendidoHoy: number;
  totalCaja: number;
  deudasPendientes: number;
  totalFiaoPendiente: number;
  ventasContadoHoy: number;
  ventasFiaoHoy: number;
  ticketPromedio: number;
  ingresos: number;
  egresos: number;
  productosBajoStock: number;
}

type DeudaVencida = { id: string; saldo: number; fecha_vencimiento: string; cliente: { nombre: string } | null };

/* Numero sin el simbolo de moneda: en el heroe el «RD$» se pinta aparte, mas
   pequeno y atenuado, para que la cifra sea la protagonista. */
const pesos = (n: number) =>
  new Intl.NumberFormat('es-DO', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(
    Number.isFinite(n) ? n : 0,
  );

export function Dashboard({ onIrInventario }: { onIrInventario: () => void }) {
  const { perfil } = useAuth();
  const [metricas, setMetricas] = useState<Metricas | null>(null);
  const [cargando, setCargando] = useState(true);
  const [vencidas, setVencidas] = useState<DeudaVencida[]>([]);

  const cargar = async () => {
    const [m, v] = await Promise.all([cargarMetricas(), cargarDeudasVencidas()]);
    setMetricas(m);
    setVencidas(v as unknown as DeudaVencida[]);
    setCargando(false);
  };

  useEffect(() => {
    marcarVencidas().then(() => cargar());

    const channel = supabase
      .channel('dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ventas' }, () => cargar())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'caja_movimientos' }, () => cargar())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deudas' }, () => cargar())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'abonos' }, () => cargar())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'productos' }, () => cargar())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const esDueno = perfil?.rol === 'dueño';
  const bajos = metricas?.productosBajoStock ?? 0;

  return (
    <div className="page-shell space-y-4 animate-fade-in">
      <PageHeader title={`Hola, ${perfil?.nombre ?? ''}`} subtitle="Resumen de hoy en tu colmado" />

      {/* ============ Heroe + columna de tarjetas ============ */}
      <div className="grid gap-3 lg:grid-cols-[1.6fr_1fr] lg:items-stretch">
        {/* --- Heroe: la cifra del dia manda, sobre superficie oscura --- */}
        <section className="relative overflow-hidden rounded-2xl bg-hero text-white p-6 sm:p-7 shadow-lg flex flex-col">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-rail-muted">Vendido hoy</p>

          {cargando ? (
            <Skeleton className="h-16 w-56 mt-3 mb-auto bg-white/10" />
          ) : (
            <p className="mt-2 mb-auto font-extrabold leading-none tracking-tight tabular-nums text-[clamp(2.75rem,7vw,4.75rem)]">
              <span className="text-rail-muted font-semibold text-[0.4em] align-[0.34em] mr-[0.08em]">RD$</span>
              {pesos(metricas?.totalVendidoHoy ?? 0)}
            </p>
          )}

          <dl className="flex gap-6 sm:gap-9 pt-5 mt-6 border-t border-white/10">
            <div>
              <dt className="text-xl font-bold tabular-nums">{metricas?.ventasContadoHoy ?? 0}</dt>
              <dd className="text-xs text-rail-muted mt-0.5">ventas al contado</dd>
            </div>
            <div>
              <dt className="text-xl font-bold tabular-nums">{metricas?.ventasFiaoHoy ?? 0}</dt>
              <dd className="text-xs text-rail-muted mt-0.5">ventas al fiao</dd>
            </div>
            <div>
              <dt className="text-xl font-bold tabular-nums">
                <span className="text-rail-muted text-[0.65em] mr-0.5">RD$</span>
                {pesos(metricas?.ticketPromedio ?? 0)}
              </dt>
              <dd className="text-xs text-rail-muted mt-0.5">ticket promedio</dd>
            </div>
          </dl>
        </section>

        {/* --- Columna de tarjetas --- */}
        <div className="flex flex-col gap-3">
          <StatBox
            label="Efectivo en caja"
            icon={<Wallet className="w-5 h-5" />}
            tone="success"
            loading={cargando}
            value={<Money value={metricas?.totalCaja} />}
            aux={<span className="text-ink-muted">Ingresos y egresos del día</span>}
          />
          <StatBox
            label="Fiao pendiente"
            icon={<HandCoins className="w-5 h-5" />}
            tone="accent"
            loading={cargando}
            value={<Money value={metricas?.totalFiaoPendiente} />}
            aux={
              <span className="text-right leading-tight">
                <span className="text-ink-secondary tabular-nums">
                  {metricas?.deudasPendientes ?? 0} deuda{(metricas?.deudasPendientes ?? 0) !== 1 ? 's' : ''}
                </span>
                {vencidas.length > 0 && (
                  <>
                    <br />
                    <span className="text-error-700 font-semibold tabular-nums">{vencidas.length} vencidas</span>
                  </>
                )}
              </span>
            }
          />
          <StatBox
            label="Stock bajo"
            icon={<Package className="w-5 h-5" />}
            tone="warning"
            loading={cargando}
            onClick={onIrInventario}
            value={<span className="tabular-nums">{bajos} producto{bajos !== 1 ? 's' : ''}</span>}
            aux={
              <span className="inline-flex items-center gap-0.5 text-primary-700 font-semibold">
                Reponer <ChevronRight className="w-4 h-4" aria-hidden="true" />
              </span>
            }
          />
        </div>
      </div>

      {/* ---------- Deudas vencidas (solo dueño) ---------- */}
      {esDueno && (
        <Card as="section">
          <CardHeader
            title="Deudas vencidas"
            icon={<Clock className="w-4 h-4" />}
            action={vencidas.length > 0 && <Badge variant="error">{vencidas.length}</Badge>}
          />
          <div className="p-3">
            {cargando ? (
              <SkeletonRows rows={3} />
            ) : vencidas.length === 0 ? (
              <EmptyState
                icon={<HandCoins className="w-7 h-7" />}
                title="Sin deudas vencidas"
                description="Todos los clientes están al día."
              />
            ) : (
              <ul className="space-y-1.5">
                {vencidas.slice(0, 5).map((d) => (
                  <li
                    key={d.id}
                    className="flex items-center justify-between gap-3 py-2 px-3 rounded-lg bg-error-50"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink truncate">{d.cliente?.nombre ?? '—'}</p>
                      <p className="text-xs text-ink-secondary">Venció: {formatFechaHora(d.fecha_vencimiento)}</p>
                    </div>
                    <Money value={d.saldo} className="text-sm font-bold text-error-800 shrink-0" />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      )}

      {/* ---------- Caja del día (solo dueño) ---------- */}
      {esDueno && metricas && (
        <Card as="section">
          <CardHeader title="Resumen de caja del día" icon={<Wallet className="w-4 h-4" />} />
          <div className="grid grid-cols-2 gap-3 p-3">
            <div className="rounded-xl bg-success-50 p-4">
              <p className="flex items-center gap-2 text-success-800 mb-2 text-xs font-semibold">
                <ArrowUp className="w-4 h-4" aria-hidden="true" />
                Ingresos
              </p>
              <Money value={metricas.ingresos} className="text-xl sm:text-2xl font-extrabold text-success-800" />
            </div>
            <div className="rounded-xl bg-error-50 p-4">
              <p className="flex items-center gap-2 text-error-800 mb-2 text-xs font-semibold">
                <ArrowDown className="w-4 h-4" aria-hidden="true" />
                Egresos
              </p>
              <Money value={metricas.egresos} className="text-xl sm:text-2xl font-extrabold text-error-800" />
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

/* ============================================================
   Tarjeta de la columna del heroe. Igual que StatCard pero con un dato
   secundario a la derecha (apertura, deudas, accion) como en las capturas.
   Se queda local: solo el dashboard la usa con esta forma.
   ============================================================ */
type Tone = 'accent' | 'success' | 'warning';
const toneChip: Record<Tone, string> = {
  accent: 'bg-accent-50 text-accent-800',
  success: 'bg-success-50 text-success-800',
  warning: 'bg-warning-50 text-warning-800',
};

function StatBox({
  label,
  icon,
  tone,
  value,
  aux,
  loading = false,
  onClick,
}: {
  label: string;
  icon: ReactNode;
  tone: Tone;
  value: ReactNode;
  aux?: ReactNode;
  loading?: boolean;
  onClick?: () => void;
}) {
  const cuerpo = (
    <>
      <div className="flex items-start justify-between gap-2">
        <span className="inline-flex items-center gap-2">
          <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${toneChip[tone]}`} aria-hidden="true">
            {icon}
          </span>
          <span className="text-xs font-semibold uppercase tracking-wide text-ink-secondary">{label}</span>
        </span>
        {aux && <span className="text-xs mt-0.5">{aux}</span>}
      </div>
      {loading ? (
        <Skeleton className="h-8 w-28 mt-3" />
      ) : (
        <p className="text-2xl sm:text-3xl font-extrabold text-ink mt-3 tabular-nums">{value}</p>
      )}
    </>
  );

  const base = 'bg-surface rounded-2xl border border-line p-4 sm:p-5 text-left w-full flex flex-col justify-center flex-1';

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${base} cursor-pointer transition-colors duration-base ease-smooth hover:bg-cream-50 active:bg-cream-100`}
      >
        {cuerpo}
      </button>
    );
  }
  return <div className={base}>{cuerpo}</div>;
}
