import { useMemo, useState } from 'react';
import { Receipt, Search, ArrowLeft, Ban, Wallet, HandCoins, Package, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useRealtime } from '../lib/useRealtime';
import { useToast } from '../lib/toast';
import { useAuth } from '../lib/auth';
import { anularVenta } from '../lib/ventas';
import { formatFechaHora, formatHora } from '../lib/format';
import {
  Button,
  Card,
  Badge,
  EmptyState,
  Input,
  Money,
  PageHeader,
  SkeletonRows,
} from '../components/ui';
import { ConfirmDialog } from '../components/ConfirmDialog';
import type { Venta, VentaItem } from '../types';

type Filtro = 'todas' | 'contado' | 'fiao' | 'anuladas';

export function Historial() {
  const toast = useToast();
  const { perfil } = useAuth();
  const esDueno = perfil?.rol === 'dueño';
  const [vista, setVista] = useState<'lista' | 'detalle'>('lista');
  const [ventaSel, setVentaSel] = useState<Venta | null>(null);
  const [items, setItems] = useState<VentaItem[]>([]);
  const [cargandoItems, setCargandoItems] = useState(false);
  const [aAnular, setAAnular] = useState<Venta | null>(null);
  const [anulando, setAnulando] = useState(false);
  const [filtro, setFiltro] = useState<Filtro>('todas');
  const [busqueda, setBusqueda] = useState('');

  const { data: ventas, cargando } = useRealtime<Venta>({
    query: async () => {
      const { data, error } = await supabase
        .from('ventas')
        .select('*, cliente:clientes(*), cajero:perfiles(*)')
        .order('created_at', { ascending: false })
        .limit(200);
      return { data, error };
    },
    tabla: 'ventas',
  });

  const filtradas = useMemo(() => {
    let r = ventas;
    if (filtro === 'contado') r = r.filter((v) => v.tipo_pago === 'contado' && !v.anulada);
    else if (filtro === 'fiao') r = r.filter((v) => v.tipo_pago === 'fiao' && !v.anulada);
    else if (filtro === 'anuladas') r = r.filter((v) => v.anulada);
    else r = r.filter((v) => !v.anulada);

    const q = busqueda.toLowerCase().trim();
    if (q) {
      r = r.filter(
        (v) =>
          v.id.toLowerCase().includes(q) ||
          v.cliente?.nombre?.toLowerCase().includes(q) ||
          v.tipo_pago.toLowerCase().includes(q),
      );
    }
    return r;
  }, [ventas, filtro, busqueda]);

  const abrirDetalle = async (v: Venta) => {
    setVentaSel(v);
    setVista('detalle');
    setCargandoItems(true);
    const { data, error } = await supabase
      .from('venta_items')
      .select('*, producto:productos(*)')
      .eq('venta_id', v.id);
    setCargandoItems(false);
    if (error) {
      toast.error('Error al cargar los detalles de la venta');
      return;
    }
    setItems((data ?? []) as unknown as VentaItem[]);
  };

  const confirmarAnular = async () => {
    if (!aAnular) return;
    setAnulando(true);
    const { error } = await anularVenta(aAnular.id);
    setAnulando(false);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success('Venta anulada. El stock fue restaurado.');
    setAAnular(null);
    if (vista === 'detalle') setVista('lista');
  };

  /* ======================= Detalle ======================= */
  if (vista === 'detalle' && ventaSel) {
    const total = parseFloat(String(ventaSel.total));
    const esContado = ventaSel.tipo_pago === 'contado';

    return (
      <div className="page-shell max-w-3xl animate-fade-in">
        <Button variant="ghost" size="sm" className="mb-3 -ml-2" onClick={() => setVista('lista')}>
          <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Volver al historial
        </Button>

        <Card className={`p-5 mb-4 ${ventaSel.anulada ? 'bg-error-50 border-error-200' : 'bg-primary-50 border-primary-200'}`}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="flex items-center gap-2 text-sm font-semibold text-ink mb-2">
                {esContado ? (
                  <Wallet className="w-5 h-5 shrink-0" aria-hidden="true" />
                ) : (
                  <HandCoins className="w-5 h-5 shrink-0" aria-hidden="true" />
                )}
                Venta #{ventaSel.id.slice(0, 8)}
              </h1>

              <p className="text-xs flex items-center gap-1.5 mb-1 text-ink-secondary">
                <Calendar className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                {formatFechaHora(ventaSel.created_at)}
              </p>
              {ventaSel.cliente && <p className="text-sm text-ink-secondary">Cliente: {ventaSel.cliente.nombre}</p>}
              {ventaSel.cajero?.nombre && <p className="text-sm text-ink-secondary">Cajero: {ventaSel.cajero.nombre}</p>}
            </div>

            <div className="text-right">
              <p className="text-xs text-ink-secondary">Total</p>
              <Money
                value={total}
                className={`text-3xl font-extrabold ${ventaSel.anulada ? 'text-ink-secondary line-through' : 'text-primary-800'}`}
              />
            </div>
          </div>

          {ventaSel.anulada && (
            <p className="mt-4 flex items-center gap-2 text-error-800 text-sm font-semibold">
              <Ban className="w-4 h-4 shrink-0" aria-hidden="true" /> Venta anulada
            </p>
          )}
        </Card>

        <h2 className="font-bold text-ink mb-2">Productos vendidos</h2>
        {cargandoItems ? (
          <SkeletonRows rows={3} />
        ) : items.length === 0 ? (
          <EmptyState
            icon={<Package className="w-7 h-7" />}
            title="Sin productos"
            description="No se encontraron productos en esta venta."
          />
        ) : (
          <Card>
            <ul className="divide-y divide-line">
              {items.map((item) => (
                <li key={item.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink truncate">
                      {item.producto?.nombre ?? 'Producto eliminado'}
                    </p>
                    <p className="text-xs text-ink-secondary">
                      {item.cantidad} × <Money value={item.precio_unitario} />
                    </p>
                  </div>
                  <Money
                    value={item.cantidad * parseFloat(String(item.precio_unitario))}
                    className="text-sm font-bold text-ink shrink-0"
                  />
                </li>
              ))}
            </ul>
            <div className="px-4 py-3 border-t border-line flex items-center justify-between bg-cream-50 rounded-b-2xl">
              <span className="font-bold text-ink">Total</span>
              <Money value={total} className="text-xl font-extrabold text-primary-800" />
            </div>
          </Card>
        )}

        {esDueno && !ventaSel.anulada && (
          <Button variant="danger" block className="mt-4" onClick={() => setAAnular(ventaSel)}>
            <Ban className="w-5 h-5" aria-hidden="true" /> Anular venta
          </Button>
        )}

        <ConfirmDialog
          open={aAnular !== null}
          onClose={() => setAAnular(null)}
          onConfirm={confirmarAnular}
          title="Anular venta"
          message={
            <>
              Vas a anular la venta <strong>#{aAnular?.id.slice(0, 8)}</strong>. Se restaurará el stock de los
              productos y se eliminarán los movimientos de caja o deudas asociadas. Esta acción no se puede deshacer.
            </>
          }
          confirmLabel="Sí, anular venta"
          loading={anulando}
        />
      </div>
    );
  }

  /* ======================= Lista ======================= */
  const filtros: { id: Filtro; label: string; count: number }[] = [
    { id: 'todas', label: 'Todas', count: ventas.filter((v) => !v.anulada).length },
    { id: 'contado', label: 'Contado', count: ventas.filter((v) => v.tipo_pago === 'contado' && !v.anulada).length },
    { id: 'fiao', label: 'Fiao', count: ventas.filter((v) => v.tipo_pago === 'fiao' && !v.anulada).length },
    { id: 'anuladas', label: 'Anuladas', count: ventas.filter((v) => v.anulada).length },
  ];

  return (
    <div className="page-shell max-w-5xl animate-fade-in">
      <PageHeader title="Historial de ventas" subtitle={`Últimas ${ventas.length} ventas registradas`} />

      {/* `chip-row` reemplaza a la clase inexistente `scrollbar-none` que habia
          antes, y ademas contiene el rebote horizontal en movil. */}
      <div className="chip-row mb-3" role="group" aria-label="Filtrar ventas">
        {filtros.map((f) => (
          <button
            key={f.id}
            onClick={() => setFiltro(f.id)}
            aria-pressed={filtro === f.id}
            className={`px-3 min-h-[36px] rounded-lg text-sm font-semibold whitespace-nowrap cursor-pointer
              transition-colors duration-base ease-smooth
              ${filtro === f.id ? 'bg-primary-600 text-white' : 'bg-surface text-ink-secondary border border-line hover:bg-cream-50'}`}
          >
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      <Input
        label="Buscar venta"
        wrapperClassName="mb-4"
        type="search"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        placeholder="Cliente o ID de venta…"
        leading={<Search className="w-5 h-5" />}
      />

      {cargando ? (
        <SkeletonRows rows={6} />
      ) : filtradas.length === 0 ? (
        <EmptyState
          icon={<Receipt className="w-7 h-7" />}
          title="Sin ventas"
          description="No hay ventas que coincidan con el filtro."
        />
      ) : (
        <ul className="space-y-2">
          {filtradas.map((v) => {
            const total = parseFloat(String(v.total));
            const esContado = v.tipo_pago === 'contado';
            return (
              <li key={v.id}>
                <button
                  onClick={() => abrirDetalle(v)}
                  className="w-full text-left bg-surface rounded-2xl border border-line p-3
                    flex items-center gap-3 cursor-pointer
                    transition-colors duration-base ease-smooth hover:bg-cream-50"
                >
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                      esContado ? 'bg-success-50 text-success-800' : 'bg-accent-50 text-accent-800'
                    }`}
                    aria-hidden="true"
                  >
                    {esContado ? <Wallet className="w-5 h-5" /> : <HandCoins className="w-5 h-5" />}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-ink truncate">{v.cliente?.nombre ?? 'Venta al contado'}</p>
                      {v.anulada && <Badge variant="error">Anulada</Badge>}
                    </div>
                    <p className="text-xs text-ink-secondary">
                      {formatHora(v.created_at)} · #{v.id.slice(0, 8)}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <Money
                      value={total}
                      className={`font-bold ${v.anulada ? 'text-ink-secondary line-through' : 'text-ink'}`}
                    />
                    <Badge variant={esContado ? 'success' : 'accent'} className="mt-0.5">
                      {esContado ? 'Contado' : 'Fiao'}
                    </Badge>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmDialog
        open={aAnular !== null}
        onClose={() => setAAnular(null)}
        onConfirm={confirmarAnular}
        title="Anular venta"
        message={
          <>
            Vas a anular la venta <strong>#{aAnular?.id.slice(0, 8)}</strong>. Se restaurará el stock de los productos
            y se eliminarán los movimientos de caja o deudas asociadas. Esta acción no se puede deshacer.
          </>
        }
        confirmLabel="Sí, anular venta"
        loading={anulando}
      />
    </div>
  );
}
