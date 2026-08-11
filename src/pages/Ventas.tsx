import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, ShoppingCart, Plus, Minus, Wallet, HandCoins, CheckCircle2, Package, X, UserPlus, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useRealtime } from '../lib/useRealtime';
import { registrarVenta } from '../lib/ventas';
import { useToast } from '../lib/toast';
import { formatMoneda } from '../lib/format';
import {
  Button,
  IconButton,
  Card,
  CardHeader,
  EmptyState,
  Input,
  Money,
  SkeletonRows,
} from '../components/ui';
import { Modal } from '../components/Modal';
import type { Producto, Cliente, CarritoItem } from '../types';

type TipoPago = 'contado' | 'fiao';

export function Ventas() {
  const toast = useToast();
  const carritoRef = useRef<HTMLDivElement>(null);

  const { data: productos, cargando } = useRealtime<Producto>({
    query: async () => {
      const { data, error } = await supabase.from('productos').select('*').order('nombre');
      return { data, error };
    },
    tabla: 'productos',
  });
  const { data: clientes } = useRealtime<Cliente>({
    query: async () => {
      const { data, error } = await supabase.from('clientes').select('*').order('nombre');
      return { data, error };
    },
    tabla: 'clientes',
  });

  const [busqueda, setBusqueda] = useState('');
  const [categoriaSel, setCategoriaSel] = useState('Todo');
  const [carrito, setCarrito] = useState<CarritoItem[]>([]);
  const [tipoPago, setTipoPago] = useState<TipoPago>('contado');
  const [clienteSel, setClienteSel] = useState<Cliente | null>(null);
  const [showClientes, setShowClientes] = useState(false);
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [showNuevoCliente, setShowNuevoCliente] = useState(false);
  const [clienteForm, setClienteForm] = useState({ nombre: '', telefono: '', limite: '' });
  const [creandoCliente, setCreandoCliente] = useState(false);
  const [recibido, setRecibido] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [exito, setExito] = useState<string | null>(null);

  const categorias = useMemo(() => {
    const cats = new Set(productos.map((p) => p.categoria));
    return ['Todo', ...Array.from(cats).sort()];
  }, [productos]);

  const filtrados = useMemo(() => {
    const q = busqueda.toLowerCase().trim();
    let r = productos.filter((p) => p.activo);
    if (categoriaSel !== 'Todo') r = r.filter((p) => p.categoria === categoriaSel);
    if (q) {
      r = r.filter((p) => p.nombre.toLowerCase().includes(q) || p.categoria.toLowerCase().includes(q));
    }
    return r;
  }, [productos, busqueda, categoriaSel]);

  const total = carrito.reduce((s, i) => s + i.producto.precio * i.cantidad, 0);
  const unidades = carrito.reduce((s, i) => s + i.cantidad, 0);
  const recibidoNum = parseFloat(recibido) || 0;
  const cambio = recibidoNum - total;
  const falta = total - recibidoNum;

  /* Un pago al contado que no cubre el total genera un faltante a fiao, y eso
     exige cliente. Es la misma regla que valida `confirmar`. */
  const pagoParcial = tipoPago === 'contado' && recibidoNum > 0 && recibidoNum < total;
  const requiereCliente = tipoPago === 'fiao' || pagoParcial;
  const bloqueado = enviando || (requiereCliente && !clienteSel);
  const sobreLimite = Boolean(clienteSel && clienteSel.limite_credito > 0 && total > clienteSel.limite_credito);

  const agregarAlCarrito = (p: Producto) => {
    if (p.stock <= 0) {
      toast.error(`«${p.nombre}» no tiene stock disponible`);
      return;
    }
    setCarrito((c) => {
      const existente = c.find((i) => i.producto.id === p.id);
      if (existente) {
        if (existente.cantidad >= p.stock) {
          toast.error(`Solo quedan ${p.stock} unidades de «${p.nombre}»`);
          return c;
        }
        return c.map((i) => (i.producto.id === p.id ? { ...i, cantidad: i.cantidad + 1 } : i));
      }
      return [...c, { producto: p, cantidad: 1 }];
    });
  };

  const cambiarCantidad = (id: string, delta: number) => {
    setCarrito((c) =>
      c
        .map((i) => {
          if (i.producto.id !== id) return i;
          const nueva = i.cantidad + delta;
          if (nueva > i.producto.stock) {
            toast.error(`Solo quedan ${i.producto.stock} unidades`);
            return i;
          }
          return { ...i, cantidad: nueva };
        })
        .filter((i) => i.cantidad > 0),
    );
  };

  const crearCliente = async () => {
    if (!clienteForm.nombre.trim()) {
      toast.error('El nombre del cliente es obligatorio');
      return;
    }
    setCreandoCliente(true);
    const { data, error } = await supabase
      .from('clientes')
      .insert({
        nombre: clienteForm.nombre.trim(),
        telefono: clienteForm.telefono || null,
        limite_credito: clienteForm.limite ? parseFloat(clienteForm.limite) : 0,
      })
      .select()
      .single();
    setCreandoCliente(false);
    if (error) {
      toast.error('Error al crear el cliente');
      return;
    }
    setClienteSel(data as Cliente);
    setShowNuevoCliente(false);
    setShowClientes(false);
    setClienteForm({ nombre: '', telefono: '', limite: '' });
    toast.success('Cliente creado correctamente');
  };

  const confirmar = async () => {
    if (carrito.length === 0) {
      toast.error('Agrega productos al carrito primero');
      return;
    }
    if (tipoPago === 'fiao' && !clienteSel) {
      toast.error('Las ventas a fiao requieren un cliente');
      return;
    }
    if (pagoParcial && !clienteSel) {
      toast.error('El pago es menor al total. Selecciona un cliente para registrar el faltante en fiao.');
      return;
    }

    setEnviando(true);
    const montoRecibido = tipoPago === 'contado' && recibidoNum > 0 ? recibidoNum : undefined;
    const { ventaId, error } = await registrarVenta(clienteSel, tipoPago, carrito, montoRecibido);
    setEnviando(false);
    if (error) {
      toast.error(error);
      return;
    }

    const fueParcial = tipoPago === 'contado' && montoRecibido !== undefined && montoRecibido < total;
    setExito(ventaId);
    setCarrito([]);
    setClienteSel(null);
    setTipoPago('contado');
    setRecibido('');
    toast.success(
      tipoPago === 'fiao'
        ? 'Venta a fiao registrada'
        : fueParcial
          ? 'Venta registrada: efectivo + faltante en fiao'
          : 'Venta al contado registrada',
    );
  };

  useEffect(() => {
    if (!exito) return;
    const t = setTimeout(() => setExito(null), 3000);
    return () => clearTimeout(t);
  }, [exito]);

  const clientesFiltrados = useMemo(() => {
    const q = busquedaCliente.toLowerCase().trim();
    const activos = clientes.filter((c) => c.activo);
    return q ? activos.filter((c) => c.nombre.toLowerCase().includes(q)) : activos;
  }, [clientes, busquedaCliente]);

  const irAlCarrito = () => carritoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <div className="page-shell">
      {exito && (
        <div
          role="status"
          className="fixed top-16 lg:top-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-5 py-3
            rounded-xl bg-success-600 text-white shadow-lg animate-slide-up"
        >
          <CheckCircle2 className="w-6 h-6 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-semibold">Venta registrada</p>
            <p className="text-xs">ID: {exito.slice(0, 8)}</p>
          </div>
        </div>
      )}

      {/*
        Antes esta pantalla partia el alto de la ventana en dos mitades fijas con
        `h-screen` y `overflow-hidden`, lo que en movil metia el carrito por
        debajo de la barra de navegacion. Ahora es una columna que fluye en movil
        y dos columnas con el carrito fijo en escritorio.
      */}
      <div className="lg:grid lg:grid-cols-[1fr_22rem] lg:gap-4 lg:items-start">
        {/* ==================== Catálogo ==================== */}
        <section aria-label="Catálogo de productos" className="min-w-0">
          <Input
            label="Buscar producto"
            wrapperClassName="mb-3"
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Nombre o categoría…"
            leading={<Search className="w-5 h-5" />}
          />

          <div className="chip-row mb-3" role="group" aria-label="Filtrar por categoría">
            {categorias.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoriaSel(cat)}
                aria-pressed={categoriaSel === cat}
                className={`px-4 min-h-[36px] rounded-lg text-sm font-semibold whitespace-nowrap border cursor-pointer
                  transition-colors duration-base ease-smooth
                  ${
                    categoriaSel === cat
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'bg-surface text-ink-secondary border-line hover:bg-cream-50'
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {cargando ? (
            <SkeletonRows rows={4} />
          ) : filtrados.length === 0 ? (
            <EmptyState
              icon={<Package className="w-7 h-7" />}
              title="Sin productos"
              description="No se encontraron productos que coincidan."
            />
          ) : (
            /* El catalogo mostraba solo los 12 primeros resultados: el resto del
               inventario era inalcanzable desde la venta. Ahora se listan todos. */
            <ul className="grid grid-cols-2 xs:grid-cols-3 2xl:grid-cols-4 gap-2">
              {filtrados.map((p) => {
                const enCarrito = carrito.find((i) => i.producto.id === p.id);
                const sinStock = p.stock <= 0;
                const bajoMin = p.stock < p.stock_minimo && p.stock > 0;
                return (
                  <li key={p.id}>
                    <button
                      onClick={() => agregarAlCarrito(p)}
                      disabled={sinStock}
                      aria-label={`Agregar ${p.nombre}, ${formatMoneda(p.precio)}${sinStock ? ', agotado' : `, ${p.stock} unidades`}`}
                      className={`relative w-full h-full text-left p-3 rounded-xl border bg-surface
                        min-h-[92px] flex flex-col justify-between cursor-pointer
                        transition-colors duration-base ease-smooth
                        ${
                          sinStock
                            ? 'border-line text-ink-muted cursor-not-allowed'
                            : enCarrito
                              ? 'border-primary-600 bg-primary-50'
                              : 'border-line hover:bg-cream-50'
                        }`}
                    >
                      {enCarrito && (
                        <span className="absolute top-1.5 right-1.5 min-w-5 h-5 px-1 rounded-full bg-primary-600 text-white text-xs font-bold flex items-center justify-center">
                          {enCarrito.cantidad}
                        </span>
                      )}

                      <p className="text-sm font-semibold text-ink leading-tight line-clamp-2 pr-5">{p.nombre}</p>

                      <div className="flex items-end justify-between gap-1 mt-1">
                        <Money value={p.precio} className="text-base font-extrabold text-ink" />
                        {sinStock ? (
                          <span className="text-xs font-semibold text-error-800">Agotado</span>
                        ) : (
                          <span className={`text-xs font-semibold ${bajoMin ? 'text-warning-800' : 'text-ink-secondary'}`}>
                            {p.stock} und
                          </span>
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* ==================== Carrito ==================== */}
        <section ref={carritoRef} aria-label="Carrito de venta" className="mt-4 lg:mt-0 lg:sticky lg:top-4">
          <Card>
            <CardHeader
              title={
                <span className="flex items-center gap-2">
                  Carrito
                  {carrito.length > 0 && (
                    <span className="text-xs font-semibold text-ink-secondary bg-cream-100 px-2 py-0.5 rounded-full">
                      {unidades} und
                    </span>
                  )}
                </span>
              }
              icon={<ShoppingCart className="w-4 h-4" />}
              action={
                carrito.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={() => setCarrito([])}>
                    Vaciar
                  </Button>
                )
              }
            />

            {carrito.length === 0 ? (
              <p className="text-sm text-ink-secondary text-center px-4 py-8">
                Agrega productos tocando el catálogo.
              </p>
            ) : (
              <>
                <ul className="divide-y divide-line max-h-[22rem] overflow-y-auto overscroll-contain">
                  {carrito.map((item) => (
                    <li key={item.producto.id} className="px-3 py-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-ink truncate">{item.producto.nombre}</p>
                          <p className="text-xs text-ink-secondary">
                            <Money value={item.producto.precio} /> c/u
                          </p>
                        </div>
                        <IconButton
                          label={`Quitar ${item.producto.nombre} del carrito`}
                          icon={<X className="w-4 h-4" />}
                          tone="danger"
                          onClick={() => setCarrito((c) => c.filter((i) => i.producto.id !== item.producto.id))}
                        />
                      </div>

                      <div className="flex items-center justify-between gap-2 mt-1.5">
                        <div className="flex items-center gap-1.5">
                          <IconButton
                            label={`Quitar una unidad de ${item.producto.nombre}`}
                            icon={<Minus className="w-5 h-5" />}
                            onClick={() => cambiarCantidad(item.producto.id, -1)}
                            className="bg-cream-100 hover:bg-cream-200"
                          />
                          <span className="w-10 text-center text-base font-bold text-ink tabular-nums" aria-live="polite">
                            {item.cantidad}
                          </span>
                          <IconButton
                            label={`Agregar una unidad de ${item.producto.nombre}`}
                            icon={<Plus className="w-5 h-5" />}
                            onClick={() => cambiarCantidad(item.producto.id, 1)}
                            className="bg-cream-100 hover:bg-cream-200"
                          />
                        </div>
                        <Money value={item.producto.precio * item.cantidad} className="text-sm font-bold text-ink" />
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="border-t border-line px-3 py-3 space-y-3 bg-cream-50 rounded-b-2xl">
                  {/* ---- Tipo de pago ---- */}
                  <fieldset>
                    <legend className="sr-only">Tipo de pago</legend>
                    <div className="grid grid-cols-2 gap-2">
                      {(
                        [
                          { valor: 'contado' as TipoPago, texto: 'Al contado', Icono: Wallet },
                          { valor: 'fiao' as TipoPago, texto: 'Al fiao', Icono: HandCoins },
                        ]
                      ).map(({ valor, texto, Icono }) => (
                        <label
                          key={valor}
                          className={`flex items-center justify-center gap-2 min-h-touch rounded-xl border-2
                            font-semibold text-sm cursor-pointer
                            transition-colors duration-base ease-smooth
                            has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus
                            ${
                              tipoPago === valor
                                ? 'border-primary-600 bg-primary-50 text-primary-800'
                                : 'border-line-strong bg-surface text-ink-secondary hover:bg-cream-50'
                            }`}
                        >
                          <input
                            type="radio"
                            name="tipo-pago"
                            value={valor}
                            checked={tipoPago === valor}
                            onChange={() => setTipoPago(valor)}
                            className="sr-only"
                          />
                          <Icono className="w-5 h-5" aria-hidden="true" />
                          {texto}
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  {/* ---- Cliente ---- */}
                  {requiereCliente && (
                    <div className="space-y-2">
                      {clienteSel ? (
                        <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-accent-50 border border-accent-200">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-ink truncate">{clienteSel.nombre}</p>
                            <p className="text-xs text-ink-secondary">
                              {clienteSel.limite_credito > 0 ? (
                                <>
                                  Límite <Money value={clienteSel.limite_credito} />
                                </>
                              ) : (
                                'Sin límite de crédito'
                              )}
                            </p>
                          </div>
                          <IconButton
                            label="Quitar cliente seleccionado"
                            icon={<X className="w-4 h-4" />}
                            onClick={() => setClienteSel(null)}
                          />
                        </div>
                      ) : (
                        <Button variant="outline" block onClick={() => setShowClientes(true)}>
                          Seleccionar cliente
                        </Button>
                      )}

                      {sobreLimite && (
                        <p role="status" className="flex items-start gap-2 px-3 py-2 rounded-lg bg-warning-50 border border-warning-200 text-warning-800 text-xs font-semibold">
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                          <span>
                            Esta venta supera el límite de crédito del cliente (
                            {formatMoneda(clienteSel?.limite_credito ?? 0)}).
                          </span>
                        </p>
                      )}
                    </div>
                  )}

                  {/* ---- Cambio ---- */}
                  {tipoPago === 'contado' && (
                    <div className="space-y-2">
                      <div className="flex items-end gap-2">
                        <Input
                          label="Recibido RD$"
                          wrapperClassName="flex-1"
                          type="number"
                          inputMode="decimal"
                          step="0.01"
                          value={recibido}
                          onChange={(e) => setRecibido(e.target.value)}
                          placeholder="0"
                          className="text-lg font-bold"
                        />
                        {recibidoNum > 0 && (
                          <div className="flex-1">
                            <p className="block text-sm font-semibold text-ink-secondary mb-1.5">
                              {cambio >= 0 ? 'Cambio' : 'Falta'}
                            </p>
                            <div
                              className={`min-h-touch flex items-center px-3 rounded-xl border text-lg font-bold ${
                                cambio >= 0
                                  ? 'bg-success-50 border-success-200 text-success-800'
                                  : 'bg-error-50 border-error-200 text-error-800'
                              }`}
                            >
                              <Money value={Math.abs(cambio)} />
                            </div>
                          </div>
                        )}
                      </div>

                      {pagoParcial && (
                        <p role="status" className="flex items-start gap-2 px-3 py-2 rounded-lg bg-accent-50 border border-accent-200 text-accent-800 text-xs font-semibold">
                          <HandCoins className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                          <span>
                            El cliente paga {formatMoneda(recibidoNum)} de {formatMoneda(total)}. El faltante de{' '}
                            {formatMoneda(falta)} se registrará en su fiao.
                          </span>
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <span className="text-sm font-semibold text-ink-secondary">Total</span>
                    <Money value={total} className="text-2xl font-extrabold text-ink" />
                  </div>

                  <Button size="lg" block onClick={confirmar} loading={enviando} disabled={bloqueado}>
                    Confirmar venta · {formatMoneda(total)}
                  </Button>

                  {requiereCliente && !clienteSel && (
                    <p className="text-xs text-ink-secondary text-center">
                      Selecciona un cliente para poder confirmar.
                    </p>
                  )}
                </div>
              </>
            )}
          </Card>
        </section>
      </div>

      {/* Barra flotante en movil: el carrito queda mas abajo en el scroll, asi
          que el total sigue siendo visible y accesible de un toque. */}
      {carrito.length > 0 && (
        <div className="lg:hidden sticky bottom-[calc(3.5rem+env(safe-area-inset-bottom,0px))] z-20 mt-3">
          <button
            onClick={irAlCarrito}
            className="w-full flex items-center justify-between gap-3 px-4 min-h-touch rounded-xl
              bg-primary-600 text-white font-bold shadow-lg cursor-pointer
              transition-colors duration-base ease-smooth hover:bg-primary-700"
          >
            <span className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" aria-hidden="true" />
              Ver carrito ({unidades})
            </span>
            <Money value={total} />
          </button>
        </div>
      )}

      {/* ==================== Seleccionar cliente ==================== */}
      <Modal open={showClientes} onClose={() => setShowClientes(false)} title="Seleccionar cliente" size="sm">
        <div className="space-y-3">
          <Input
            label="Buscar cliente"
            type="search"
            value={busquedaCliente}
            onChange={(e) => setBusquedaCliente(e.target.value)}
            placeholder="Nombre del cliente…"
            leading={<Search className="w-5 h-5" />}
          />

          <Button variant="outline" block onClick={() => setShowNuevoCliente(true)}>
            <UserPlus className="w-4 h-4" aria-hidden="true" /> Crear nuevo cliente
          </Button>

          {clientesFiltrados.length === 0 ? (
            <p className="text-center text-sm text-ink-secondary py-4">No hay clientes.</p>
          ) : (
            <ul className="divide-y divide-line max-h-64 overflow-y-auto overscroll-contain">
              {clientesFiltrados.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => {
                      setClienteSel(c);
                      setShowClientes(false);
                      setBusquedaCliente('');
                    }}
                    className="w-full flex items-center justify-between gap-2 px-2 min-h-touch text-left cursor-pointer
                      rounded-lg transition-colors duration-base ease-smooth hover:bg-cream-50"
                  >
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-ink truncate">{c.nombre}</span>
                      {c.telefono && <span className="block text-xs text-ink-secondary">{c.telefono}</span>}
                    </span>
                    {c.limite_credito > 0 && (
                      <span className="text-xs text-ink-secondary shrink-0">
                        Lím <Money value={c.limite_credito} />
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Modal>

      {/* ==================== Crear cliente ==================== */}
      <Modal
        open={showNuevoCliente}
        onClose={() => setShowNuevoCliente(false)}
        title="Crear cliente"
        size="sm"
        footer={
          <Button block onClick={crearCliente} loading={creandoCliente}>
            Crear cliente
          </Button>
        }
      >
        <div className="space-y-3">
          <Input
            label="Nombre"
            required
            value={clienteForm.nombre}
            onChange={(e) => setClienteForm({ ...clienteForm, nombre: e.target.value })}
            placeholder="Nombre del cliente"
          />
          <Input
            label="Teléfono"
            type="tel"
            inputMode="tel"
            hint="Opcional."
            value={clienteForm.telefono}
            onChange={(e) => setClienteForm({ ...clienteForm, telefono: e.target.value })}
            placeholder="809-555-0000"
          />
          <Input
            label="Límite de crédito (RD$)"
            type="number"
            inputMode="decimal"
            step="0.01"
            hint="Opcional. Deja 0 para no aplicar límite."
            value={clienteForm.limite}
            onChange={(e) => setClienteForm({ ...clienteForm, limite: e.target.value })}
            placeholder="0"
          />
        </div>
      </Modal>
    </div>
  );
}
