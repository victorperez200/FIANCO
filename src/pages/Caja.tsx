import { useMemo, useState } from 'react';
import { Wallet, ArrowUp, ArrowDown, FileText, Plus, Receipt } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useRealtime } from '../lib/useRealtime';
import { useToast } from '../lib/toast';
import { useAuth } from '../lib/auth';
import { formatHora } from '../lib/format';
import {
  Button,
  Card,
  CardHeader,
  EmptyState,
  Input,
  Money,
  PageHeader,
  SkeletonRows,
  StatCard,
} from '../components/ui';
import { Modal } from '../components/Modal';
import type { CajaMovimiento, TipoCaja } from '../types';

export function Caja() {
  const toast = useToast();
  const { perfil } = useAuth();
  const esDueno = perfil?.rol === 'dueño';
  const { data: movimientos, cargando } = useRealtime<CajaMovimiento>({
    query: async () => {
      const inicio = new Date();
      inicio.setHours(0, 0, 0, 0);
      const { data, error } = await supabase
        .from('caja_movimientos')
        .select('*, usuario:perfiles(*)')
        .gte('created_at', inicio.toISOString())
        .order('created_at', { ascending: false });
      return { data, error };
    },
    tabla: 'caja_movimientos',
  });

  const [showMov, setShowMov] = useState(false);
  const [tipoMov, setTipoMov] = useState<TipoCaja>('egreso');
  const [monto, setMonto] = useState('');
  const [concepto, setConcepto] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [showCierre, setShowCierre] = useState(false);

  const { ingresos, egresos, total } = useMemo(() => {
    let ing = 0;
    let egr = 0;
    for (const m of movimientos) {
      const v = parseFloat(String(m.monto));
      if (m.tipo === 'ingreso') ing += v;
      else egr += v;
    }
    return { ingresos: ing, egresos: egr, total: ing - egr };
  }, [movimientos]);

  const { ventasContado, abonosTotal } = useMemo(() => {
    const contado = movimientos
      .filter((m) => m.concepto.includes('Venta al contado'))
      .reduce((s, m) => s + parseFloat(String(m.monto)), 0);
    const abonos = movimientos
      .filter((m) => m.concepto.includes('Abono'))
      .reduce((s, m) => s + parseFloat(String(m.monto)), 0);
    return { ventasContado: contado, abonosTotal: abonos };
  }, [movimientos]);

  const registrarMov = async () => {
    const m = parseFloat(monto);
    if (isNaN(m) || m <= 0) {
      toast.error('Monto inválido');
      return;
    }
    if (!concepto.trim()) {
      toast.error('Describe el concepto');
      return;
    }
    setGuardando(true);
    const { error } = await supabase.from('caja_movimientos').insert({
      tipo: tipoMov,
      monto: m,
      concepto: concepto.trim(),
      usuario_id: perfil?.id ?? null,
    });
    setGuardando(false);
    if (error) {
      toast.error('Error al registrar el movimiento');
      return;
    }
    toast.success(tipoMov === 'ingreso' ? 'Ingreso registrado' : 'Egreso registrado');
    setShowMov(false);
    setMonto('');
    setConcepto('');
    setTipoMov('egreso');
  };

  return (
    <div className="page-shell animate-fade-in">
      <PageHeader
        title="Caja"
        subtitle="Movimientos de hoy"
        actions={
          <Button variant="outline" onClick={() => setShowMov(true)}>
            <Plus className="w-5 h-5" aria-hidden="true" />
            <span className="hidden sm:inline">Movimiento</span>
            <span className="sm:hidden sr-only">Registrar movimiento</span>
          </Button>
        }
      />

      {/* En móvil, tres cifras de miles en una sola fila desbordaban (la de
          Total quedaba cortada y aparecía scroll horizontal). Ahora: 2 columnas
          —Ingresos y Egresos— con Total a lo ancho debajo; 3 en fila desde sm. */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 mb-4">
        <StatCard
          label="Ingresos"
          value={<Money value={ingresos} />}
          icon={<ArrowUp className="w-5 h-5" />}
          tone="success"
          loading={cargando}
        />
        <StatCard
          label="Egresos"
          value={<Money value={egresos} />}
          icon={<ArrowDown className="w-5 h-5" />}
          tone="error"
          loading={cargando}
        />
        <StatCard
          label="Total"
          value={<Money value={total} />}
          icon={<Wallet className="w-5 h-5" />}
          tone="primary"
          loading={cargando}
          className="col-span-2 sm:col-span-1"
        />
      </div>

      {esDueno && (
        <Button variant="outline" block className="mb-4" onClick={() => setShowCierre(true)}>
          <FileText className="w-4 h-4" aria-hidden="true" /> Cerrar caja del día
        </Button>
      )}

      <Card as="section">
        <CardHeader title="Movimientos" icon={<Receipt className="w-4 h-4" />} />
        {cargando ? (
          <div className="p-3">
            <SkeletonRows rows={5} />
          </div>
        ) : movimientos.length === 0 ? (
          <EmptyState
            icon={<Wallet className="w-7 h-7" />}
            title="Sin movimientos"
            description="No hay movimientos registrados hoy."
          />
        ) : (
          <ul className="divide-y divide-line">
            {movimientos.map((m) => {
              const esIngreso = m.tipo === 'ingreso';
              return (
                <li key={m.id} className="flex items-center gap-3 px-4 py-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      esIngreso ? 'bg-success-50 text-success-800' : 'bg-error-50 text-error-800'
                    }`}
                    aria-hidden="true"
                  >
                    {esIngreso ? <ArrowUp className="w-5 h-5" /> : <ArrowDown className="w-5 h-5" />}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink truncate">{m.concepto}</p>
                    <p className="text-xs text-ink-secondary">
                      {formatHora(m.created_at)}
                      {m.usuario?.nombre ? ` · ${m.usuario.nombre}` : ''}
                    </p>
                  </div>

                  <p className={`text-sm font-bold shrink-0 ${esIngreso ? 'text-success-800' : 'text-error-800'}`}>
                    <span aria-hidden="true">{esIngreso ? '+' : '−'}</span>
                    <span className="sr-only">{esIngreso ? 'Ingreso de ' : 'Egreso de '}</span>
                    <Money value={m.monto} />
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {/* ---------- Registrar movimiento ---------- */}
      <Modal
        open={showMov}
        onClose={() => setShowMov(false)}
        title="Registrar movimiento"
        size="sm"
        footer={
          <Button block onClick={registrarMov} loading={guardando}>
            Registrar
          </Button>
        }
      >
        <div className="space-y-3">
          {/*
            Radios reales dentro de un fieldset en lugar de dos botones sueltos:
            se anuncia como "1 de 2", se navega con las flechas y el estado
            seleccionado es programatico, no solo un borde de color.
          */}
          <fieldset>
            <legend className="block text-sm font-semibold text-ink-secondary mb-1.5">Tipo de movimiento</legend>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { valor: 'ingreso' as TipoCaja, texto: 'Ingreso', Icono: ArrowUp, activo: 'border-success-600 bg-success-50 text-success-800' },
                  { valor: 'egreso' as TipoCaja, texto: 'Egreso', Icono: ArrowDown, activo: 'border-error-600 bg-error-50 text-error-800' },
                ]
              ).map(({ valor, texto, Icono, activo }) => (
                <label
                  key={valor}
                  className={`flex items-center justify-center gap-2 min-h-touch px-3 rounded-xl border-2
                    font-semibold text-sm cursor-pointer
                    transition-colors duration-base ease-smooth
                    has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus
                    ${tipoMov === valor ? activo : 'border-line-strong text-ink-secondary hover:bg-cream-50'}`}
                >
                  <input
                    type="radio"
                    name="tipo-movimiento"
                    value={valor}
                    checked={tipoMov === valor}
                    onChange={() => setTipoMov(valor)}
                    className="sr-only"
                  />
                  <Icono className="w-4 h-4" aria-hidden="true" />
                  {texto}
                </label>
              ))}
            </div>
          </fieldset>

          <Input
            label="Monto (RD$)"
            type="number"
            inputMode="decimal"
            step="0.01"
            required
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            placeholder="0.00"
          />
          <Input
            label="Concepto"
            required
            value={concepto}
            onChange={(e) => setConcepto(e.target.value)}
            placeholder={tipoMov === 'ingreso' ? 'Ej: Venta del mostrador' : 'Ej: Compra de mercancía'}
          />
        </div>
      </Modal>

      {/* ---------- Cierre de caja ---------- */}
      <Modal
        open={showCierre}
        onClose={() => setShowCierre(false)}
        title="Cierre de caja"
        size="md"
        footer={
          <div className="flex flex-col-reverse sm:flex-row gap-2">
            <Button variant="outline" block onClick={() => setShowCierre(false)} className="sm:flex-1">
              Cerrar
            </Button>
            <Button block onClick={() => window.print()} className="sm:flex-1">
              <FileText className="w-4 h-4" aria-hidden="true" /> Imprimir
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <p className="flex items-center gap-2 text-ink-secondary font-semibold">
            <Receipt className="w-5 h-5 text-primary-700" aria-hidden="true" />
            Resumen del día
          </p>

          <dl className="space-y-1">
            <CierreRow label="Ventas al contado" valor={ventasContado} />
            <CierreRow label="Abonos recibidos" valor={abonosTotal} />
            <CierreRow label="Otros ingresos" valor={Math.max(0, ingresos - ventasContado - abonosTotal)} />
            <CierreRow label="Egresos" valor={egresos} negativo />
          </dl>

          <div className="pt-3 border-t border-line">
            <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-primary-50">
              <span className="font-bold text-ink">Total general</span>
              <Money value={total} className="text-xl font-extrabold text-primary-800" />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function CierreRow({ label, valor, negativo }: { label: string; valor: number; negativo?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2 rounded-lg">
      <dt className="text-sm text-ink-secondary">{label}</dt>
      <dd className={`text-sm font-bold ${negativo ? 'text-error-800' : 'text-success-800'}`}>
        <span aria-hidden="true">{negativo ? '−' : '+'}</span>
        <Money value={valor} />
      </dd>
    </div>
  );
}
