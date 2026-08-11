import { useEffect, useMemo, useState } from 'react';
import { HandCoins, Users, Search, ArrowLeft, Plus, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useRealtime } from '../lib/useRealtime';
import { registrarAbono, marcarVencidas } from '../lib/ventas';
import { useToast } from '../lib/toast';
import { useAuth } from '../lib/auth';
import { formatMoneda, formatFecha, formatFechaHora, diasHasta } from '../lib/format';
import {
  Button,
  Card,
  Badge,
  EmptyState,
  Input,
  Money,
  PageHeader,
  Skeleton,
  SkeletonRows,
} from '../components/ui';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import type { Deuda, Cliente, Abono, EstadoDeuda } from '../types';

const ESTADO_CONFIG: Record<EstadoDeuda, { label: string; variant: 'warning' | 'info' | 'success' | 'error' }> = {
  pendiente: { label: 'Pendiente', variant: 'warning' },
  abonada: { label: 'Abonada', variant: 'info' },
  saldada: { label: 'Saldada', variant: 'success' },
  vencida: { label: 'Vencida', variant: 'error' },
};

/* Numero sin el simbolo de moneda: en el heroe el «RD$» se pinta aparte, mas
   pequeno y atenuado, para que la cifra sea la protagonista. */
const pesos = (n: number) =>
  new Intl.NumberFormat('es-DO', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(
    Number.isFinite(n) ? n : 0,
  );

export function Fiao() {
  const toast = useToast();
  const { perfil } = useAuth();
  const esDueno = perfil?.rol === 'dueño';
  const [vista, setVista] = useState<'lista' | 'detalle'>('lista');
  const [clienteSel, setClienteSel] = useState<Cliente | null>(null);
  const [filtro, setFiltro] = useState<'todas' | EstadoDeuda>('todas');
  const [busqueda, setBusqueda] = useState('');
  const [abonoDeuda, setAbonoDeuda] = useState<Deuda | null>(null);
  const [montoAbono, setMontoAbono] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [confirmarVencida, setConfirmarVencida] = useState<Deuda | null>(null);

  const { data: deudas, cargando } = useRealtime<Deuda>({
    query: async () => {
      const { data, error } = await supabase
        .from('deudas')
        .select('*, cliente:clientes(*), venta:ventas(*), abonos:abonos(*)')
        .order('created_at', { ascending: false });
      return { data, error };
    },
    tabla: 'deudas',
  });

  useEffect(() => {
    marcarVencidas();
  }, [deudas]);

  const clientesConDeudas = useMemo(() => {
    const mapa = new Map<string, { cliente: Cliente; deudas: Deuda[]; saldoTotal: number; tieneVencida: boolean }>();
    const filtradas = deudas.filter((d) => {
      if (filtro !== 'todas' && d.estado !== filtro) return false;
      if (busqueda.trim()) {
        const q = busqueda.toLowerCase();
        return d.cliente?.nombre.toLowerCase().includes(q);
      }
      return true;
    });
    for (const d of filtradas) {
      if (!d.cliente) continue;
      const key = d.cliente.id;
      if (!mapa.has(key)) mapa.set(key, { cliente: d.cliente, deudas: [], saldoTotal: 0, tieneVencida: false });
      const entry = mapa.get(key)!;
      entry.deudas.push(d);
      if (d.estado !== 'saldada') entry.saldoTotal += parseFloat(String(d.saldo));
      if (d.estado === 'vencida') entry.tieneVencida = true;
    }
    return Array.from(mapa.values()).sort((a, b) => b.saldoTotal - a.saldoTotal);
  }, [deudas, filtro, busqueda]);

  const totalFiao = deudas
    .filter((d) => d.estado !== 'saldada')
    .reduce((s, d) => s + parseFloat(String(d.saldo)), 0);

  const abrirDetalle = (c: Cliente) => {
    setClienteSel(c);
    setVista('detalle');
  };

  const iniciarAbono = (d: Deuda) => {
    if (d.estado === 'saldada') {
      toast.error('Esta deuda ya está saldada. No acepta más abonos.');
      return;
    }
    if (d.estado === 'vencida' && !esDueno) {
      toast.error('Solo el dueño puede abonar deudas vencidas. Solicita autorización.');
      return;
    }
    if (d.estado === 'vencida') {
      setConfirmarVencida(d);
      return;
    }
    setAbonoDeuda(d);
    setMontoAbono(String(d.saldo));
  };

  const confirmarAbonoVencida = () => {
    if (confirmarVencida) {
      setAbonoDeuda(confirmarVencida);
      setMontoAbono(String(confirmarVencida.saldo));
    }
  };

  const guardarAbono = async () => {
    if (!abonoDeuda) return;
    const monto = parseFloat(montoAbono);
    if (isNaN(monto) || monto <= 0) {
      toast.error('Monto inválido');
      return;
    }
    setGuardando(true);
    const { error } = await registrarAbono(abonoDeuda.id, monto);
    setGuardando(false);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success(monto >= parseFloat(String(abonoDeuda.saldo)) ? 'Deuda saldada completamente' : 'Abono registrado');
    setAbonoDeuda(null);
    setMontoAbono('');
  };

  /* ======================= Detalle de cliente ======================= */
  if (vista === 'detalle' && clienteSel) {
    const deudasCliente = deudas.filter((d) => d.cliente_id === clienteSel.id);
    const saldoTotal = deudasCliente
      .filter((d) => d.estado !== 'saldada')
      .reduce((s, d) => s + parseFloat(String(d.saldo)), 0);

    return (
      <div className="page-shell max-w-4xl animate-fade-in">
        <Button variant="ghost" size="sm" className="mb-3 -ml-2" onClick={() => setVista('lista')}>
          <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Volver
        </Button>

        <section className="rounded-2xl bg-hero text-white p-5 sm:p-6 mb-4 shadow-lg">
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl bg-white/10 text-white flex items-center justify-center text-2xl font-extrabold shrink-0"
              aria-hidden="true"
            >
              {clienteSel.nombre.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-extrabold truncate">{clienteSel.nombre}</h1>
              {clienteSel.telefono && (
                <a
                  href={`tel:${clienteSel.telefono.replace(/\s/g, '')}`}
                  className="text-sm text-rail-muted hover:text-white hover:underline"
                >
                  {clienteSel.telefono}
                </a>
              )}
              <p className="text-rail-muted text-xs mt-0.5">
                Límite: <span className="tabular-nums">{formatMoneda(clienteSel.limite_credito)}</span>
              </p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="text-rail-muted text-xs">Saldo pendiente total</p>
            <p className="font-extrabold leading-none tracking-tight tabular-nums text-[clamp(2rem,5vw,2.75rem)] mt-1">
              <span className="text-rail-muted font-semibold text-[0.42em] align-[0.34em] mr-[0.08em]">RD$</span>
              {pesos(saldoTotal)}
            </p>
          </div>
        </section>

        <h2 className="font-bold text-ink mb-2">Historial de deudas</h2>
        {deudasCliente.length === 0 ? (
          <EmptyState
            icon={<HandCoins className="w-7 h-7" />}
            title="Sin deudas"
            description="Este cliente no tiene deudas registradas."
          />
        ) : (
          <ul className="space-y-3">
            {deudasCliente.map((d) => (
              <DeudaCard key={d.id} deuda={d} onAbonar={() => iniciarAbono(d)} esDueno={esDueno} />
            ))}
          </ul>
        )}

        {/* ---------- Registrar abono ---------- */}
        <Modal
          open={abonoDeuda !== null}
          onClose={() => setAbonoDeuda(null)}
          title="Registrar abono"
          size="sm"
          footer={
            abonoDeuda ? (
              <Button variant="accent" block size="lg" onClick={guardarAbono} loading={guardando} disabled={!montoAbono}>
                Registrar {formatMoneda(parseFloat(montoAbono) || 0)}
              </Button>
            ) : undefined
          }
        >
          {abonoDeuda && (
            <div className="space-y-3">
              <dl className="rounded-xl bg-cream-50 p-4 space-y-1.5">
                <p className="text-sm font-semibold text-ink">{abonoDeuda.cliente?.nombre}</p>
                <div className="flex justify-between text-sm">
                  <dt className="text-ink-secondary">Saldo actual</dt>
                  <dd>
                    <Money value={abonoDeuda.saldo} className="font-bold text-ink" />
                  </dd>
                </div>
                <div className="flex justify-between text-sm">
                  <dt className="text-ink-secondary">Original</dt>
                  <dd>
                    <Money value={abonoDeuda.monto_original} className="text-ink-secondary" />
                  </dd>
                </div>
                <div className="flex justify-between items-center text-sm pt-1">
                  <dt className="text-ink-secondary">Estado</dt>
                  <dd>
                    <Badge variant={ESTADO_CONFIG[abonoDeuda.estado].variant}>
                      {ESTADO_CONFIG[abonoDeuda.estado].label}
                    </Badge>
                  </dd>
                </div>
              </dl>

              {abonoDeuda.estado === 'vencida' && (
                <p role="status" className="flex items-start gap-2 p-3 rounded-lg bg-error-50 text-error-800 text-sm">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
                  <span>Esta deuda está vencida. El dueño autorizó este abono.</span>
                </p>
              )}

              <Input
                label="Monto del abono"
                type="number"
                inputMode="decimal"
                step="0.01"
                required
                value={montoAbono}
                onChange={(e) => setMontoAbono(e.target.value)}
              />

              <div className="flex gap-2">
                <Button variant="secondary" block onClick={() => setMontoAbono(String(abonoDeuda.saldo))}>
                  Saldar todo
                </Button>
                <Button
                  variant="secondary"
                  block
                  onClick={() => setMontoAbono(String(parseFloat(String(abonoDeuda.saldo)) / 2))}
                >
                  Mitad
                </Button>
              </div>
            </div>
          )}
        </Modal>

        <ConfirmDialog
          open={confirmarVencida !== null}
          onClose={() => setConfirmarVencida(null)}
          onConfirm={confirmarAbonoVencida}
          title="Deuda vencida — autorización"
          message={
            <>
              Esta deuda está <strong>vencida</strong>. Como dueño, autorizas el abono a pesar del atraso. ¿Deseas
              continuar?
            </>
          }
          confirmLabel="Sí, autorizar"
          variant="warning"
        />
      </div>
    );
  }

  /* ======================= Lista ======================= */
  const contadores = {
    pendiente: deudas.filter((d) => d.estado === 'pendiente').length,
    abonada: deudas.filter((d) => d.estado === 'abonada').length,
    vencida: deudas.filter((d) => d.estado === 'vencida').length,
    saldada: deudas.filter((d) => d.estado === 'saldada').length,
  };
  /* Clientes distintos con algún saldo abierto (independiente del filtro y de
     la búsqueda): es el descriptor del héroe. */
  const clientesConSaldo = new Set(
    deudas.filter((d) => d.estado !== 'saldada' && d.cliente_id).map((d) => d.cliente_id),
  ).size;

  return (
    <div className="page-shell animate-fade-in">
      <PageHeader title="Fiao" subtitle="Crédito informal del colmado" />

      {/* Héroe: el total por cobrar manda, sobre superficie oscura */}
      <section className="relative overflow-hidden rounded-2xl bg-hero text-white p-6 sm:p-7 shadow-lg mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-rail-muted">En deuda activa</p>
        {cargando ? (
          <Skeleton className="h-14 w-52 mt-2 bg-white/10" />
        ) : (
          <p className="mt-2 font-extrabold leading-none tracking-tight tabular-nums text-[clamp(2.5rem,6.5vw,4.25rem)]">
            <span className="text-rail-muted font-semibold text-[0.4em] align-[0.34em] mr-[0.08em]">RD$</span>
            {pesos(totalFiao)}
          </p>
        )}
        <p className="text-sm text-rail-muted mt-3">
          {clientesConSaldo} cliente{clientesConSaldo !== 1 ? 's' : ''} con saldo
          {contadores.vencida > 0 && (
            <>
              {' · '}
              <span className="text-error-300 font-semibold tabular-nums">
                {contadores.vencida} vencida{contadores.vencida !== 1 ? 's' : ''}
              </span>
            </>
          )}
        </p>
      </section>

      <div className="grid grid-cols-4 gap-2 mb-3" role="group" aria-label="Filtrar por estado de deuda">
        {(['pendiente', 'abonada', 'vencida', 'saldada'] as EstadoDeuda[]).map((e) => (
          <button
            key={e}
            onClick={() => setFiltro(filtro === e ? 'todas' : e)}
            aria-pressed={filtro === e}
            className={`rounded-xl p-3 text-center border-2 cursor-pointer
              transition-colors duration-base ease-smooth
              ${filtro === e ? 'border-primary-600 bg-primary-50' : 'border-line-strong bg-surface hover:bg-cream-50'}`}
          >
            <p className="text-xl sm:text-2xl font-extrabold text-ink tabular-nums">{contadores[e]}</p>
            <p className="text-xs text-ink-secondary">{ESTADO_CONFIG[e].label}</p>
          </button>
        ))}
      </div>

      <Input
        label="Buscar cliente"
        wrapperClassName="mb-4"
        type="search"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        placeholder="Nombre del cliente…"
        leading={<Search className="w-5 h-5" />}
      />

      {cargando ? (
        <SkeletonRows rows={6} />
      ) : clientesConDeudas.length === 0 ? (
        <EmptyState
          icon={<Users className="w-7 h-7" />}
          title="Sin deudas"
          description={filtro !== 'todas' ? 'No hay deudas en este estado.' : 'No hay clientes con deudas registradas.'}
        />
      ) : (
        <ul className="grid sm:grid-cols-2 gap-3">
          {clientesConDeudas.map(({ cliente, deudas: dCliente, saldoTotal, tieneVencida }) => (
            <li key={cliente.id}>
              <button
                onClick={() => abrirDetalle(cliente)}
                className="w-full text-left bg-surface rounded-2xl border border-line p-4 cursor-pointer
                  transition-colors duration-base ease-smooth hover:bg-cream-50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className="w-11 h-11 rounded-xl bg-accent-50 text-accent-800 flex items-center justify-center font-bold shrink-0"
                      aria-hidden="true"
                    >
                      {cliente.nombre.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-ink truncate">{cliente.nombre}</p>
                      <p className="text-xs text-ink-secondary">
                        {dCliente.length} deuda{dCliente.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  {tieneVencida && <Badge variant="error">Vencida</Badge>}
                </div>

                <div className="mt-3 pt-3 border-t border-line flex items-center justify-between gap-2">
                  <span className="text-xs text-ink-secondary">Saldo pendiente</span>
                  <Money value={saldoTotal} className="text-lg font-extrabold text-accent-800" />
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function DeudaCard({ deuda, onAbonar, esDueno }: { deuda: Deuda; onAbonar: () => void; esDueno: boolean }) {
  const saldo = parseFloat(String(deuda.saldo));
  const original = parseFloat(String(deuda.monto_original));
  const pagado = original - saldo;
  const porcentaje = original > 0 ? Math.round((pagado / original) * 100) : 0;
  const dias = diasHasta(deuda.fecha_vencimiento);
  const config = ESTADO_CONFIG[deuda.estado];
  const abonos: Abono[] = deuda.abonos ?? [];
  const bloqueada = deuda.estado === 'vencida' && !esDueno;

  return (
    <Card as="li">
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Badge variant={config.variant}>{config.label}</Badge>
              <span className="text-xs text-ink-muted">{formatFecha(deuda.created_at)}</span>
            </div>
            <p className="text-xs text-ink-secondary">
              {deuda.estado === 'saldada' ? 'Saldada' : 'Vence'}: {formatFecha(deuda.fecha_vencimiento)}
              {deuda.estado !== 'saldada' && dias >= 0 && ` (${dias} días)`}
              {deuda.estado !== 'saldada' && dias < 0 && ` (vencida hace ${Math.abs(dias)} días)`}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-ink-secondary">Saldo</p>
            <Money value={saldo} className="text-xl font-extrabold text-accent-800" />
          </div>
        </div>

        {/* La barra se anuncia como barra de progreso con su valor: sin esto el
            avance del pago solo existia visualmente. */}
        <div
          role="progressbar"
          aria-valuenow={porcentaje}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Pagado ${porcentaje}% de la deuda`}
          className="h-2 rounded-full bg-cream-200 overflow-hidden mb-1"
        >
          <div
            className={`h-full ${deuda.estado === 'saldada' ? 'bg-success-600' : 'bg-primary-600'}`}
            style={{ width: `${porcentaje}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-ink-secondary">
          <span>
            <Money value={pagado} /> pagado
          </span>
          <span>
            de <Money value={original} />
          </span>
        </div>

        {abonos.length > 0 && (
          <details className="mt-3">
            <summary className="text-xs font-semibold text-ink-secondary cursor-pointer min-h-touch flex items-center">
              {abonos.length} abono{abonos.length !== 1 ? 's' : ''} registrado{abonos.length !== 1 ? 's' : ''}
            </summary>
            <ul className="mt-1 space-y-1">
              {abonos.map((a) => (
                <li key={a.id} className="flex justify-between text-xs text-ink-secondary py-1">
                  <span>{formatFechaHora(a.created_at)}</span>
                  <Money value={a.monto} className="font-semibold" />
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>

      {deuda.estado !== 'saldada' && (
        <button
          onClick={onAbonar}
          disabled={bloqueada}
          className={`w-full px-4 min-h-touch font-semibold text-sm border-t border-line
            flex items-center justify-center gap-2 rounded-b-2xl
            transition-colors duration-base ease-smooth
            ${
              bloqueada
                ? 'bg-cream-50 text-ink-secondary cursor-not-allowed'
                : 'bg-accent-50 text-accent-800 hover:bg-accent-100 cursor-pointer'
            }`}
        >
          {bloqueada ? (
            <>
              <AlertCircle className="w-4 h-4" aria-hidden="true" /> Requiere autorización del dueño
            </>
          ) : deuda.estado === 'vencida' ? (
            <>
              <AlertCircle className="w-4 h-4" aria-hidden="true" /> Abonar (vencida — autoriza dueño)
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" aria-hidden="true" /> Registrar abono
            </>
          )}
        </button>
      )}

      {deuda.estado === 'saldada' && (
        <p className="px-4 py-3 bg-success-50 text-success-800 text-sm font-semibold flex items-center justify-center gap-2 border-t border-line rounded-b-2xl">
          <CheckCircle2 className="w-4 h-4" aria-hidden="true" /> Deuda saldada
        </p>
      )}
    </Card>
  );
}
