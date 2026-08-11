import { useMemo, useState } from 'react';
import { Search, Plus, Edit2, Trash2, Package, History, AlertTriangle, Power, PowerOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useRealtime } from '../lib/useRealtime';
import { useToast } from '../lib/toast';
import { useAuth } from '../lib/auth';
import { formatFechaHora } from '../lib/format';
import { esStockBajo } from '../lib/stock';
import {
  Button,
  IconButton,
  Input,
  Select,
  EmptyState,
  DataTable,
  Money,
  StockBadge,
  PageHeader,
  SkeletonRows,
  type Column,
} from '../components/ui';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import type { Producto } from '../types';

const CATEGORIAS = ['General', 'Cervezas', 'Refrescos', 'Bebidas', 'Jugos', 'Abarrotes', 'Viveres', 'Snacks', 'Lacteos', 'Panaderia', 'Varios'];
const vacio = { nombre: '', categoria: 'General', precio: '', stock: '', stock_minimo: '5' };

export function Inventario() {
  const toast = useToast();
  const { perfil } = useAuth();
  const esDueno = perfil?.rol === 'dueño';
  const { data: productos, cargando } = useRealtime<Producto>({
    query: async () => {
      const { data, error } = await supabase.from('productos').select('*').order('nombre');
      return { data, error };
    },
    tabla: 'productos',
  });

  const [busqueda, setBusqueda] = useState('');
  const [filtroBajo, setFiltroBajo] = useState(false);
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [editando, setEditando] = useState<Producto | null>(null);
  const [creando, setCreando] = useState(false);
  const [form, setForm] = useState<Record<string, string>>(vacio);
  const [guardando, setGuardando] = useState(false);
  const [aEliminar, setAEliminar] = useState<Producto | null>(null);
  const [historial, setHistorial] = useState<Producto | null>(null);
  const [movimientos, setMovimientos] = useState<Array<{ id: string; cantidad: number; precio_unitario: number; created_at: string; venta: unknown }>>([]);
  const [cargandoHist, setCargandoHist] = useState(false);

  /* `mostrarInactivos` faltaba en las dependencias: el filtro se quedaba
     congelado en el valor con el que se calculo la primera vez. */
  const filtrados = useMemo(() => {
    let r = productos;
    if (!mostrarInactivos) r = r.filter((p) => p.activo);
    const q = busqueda.toLowerCase().trim();
    if (q) r = r.filter((p) => p.nombre.toLowerCase().includes(q) || p.categoria.toLowerCase().includes(q));
    if (filtroBajo) r = r.filter(esStockBajo);
    return r;
  }, [productos, busqueda, filtroBajo, mostrarInactivos]);

  /* Mismo predicado que el inicio y la insignia del menu. Antes este contador
     incluia productos dados de baja, asi que podia no cuadrar con el resto. */
  const bajoStock = productos.filter(esStockBajo).length;

  const abrirEditar = (p: Producto) => {
    setEditando(p);
    setForm({
      nombre: p.nombre,
      categoria: p.categoria,
      precio: String(p.precio),
      stock: String(p.stock),
      stock_minimo: String(p.stock_minimo),
    });
  };

  const abrirCrear = () => {
    setCreando(true);
    setForm(vacio);
  };

  const guardar = async () => {
    if (!form.nombre.trim()) { toast.error('El nombre es obligatorio'); return; }
    const precio = parseFloat(form.precio);
    const stock = parseInt(form.stock);
    const stockMin = parseInt(form.stock_minimo);
    if (isNaN(precio) || precio < 0) { toast.error('Precio inválido'); return; }
    if (isNaN(stock) || stock < 0) { toast.error('Stock inválido'); return; }
    if (isNaN(stockMin) || stockMin < 0) { toast.error('Stock mínimo inválido'); return; }

    setGuardando(true);
    const payload = {
      nombre: form.nombre.trim(),
      categoria: form.categoria,
      precio,
      stock,
      stock_minimo: stockMin,
    };
    if (editando) {
      const { error } = await supabase.from('productos').update(payload).eq('id', editando.id);
      if (error) toast.error('Error al actualizar el producto');
      else { toast.success('Producto actualizado'); setEditando(null); }
    } else {
      const { error } = await supabase.from('productos').insert(payload);
      if (error) toast.error('Error al crear el producto');
      else { toast.success('Producto creado'); setCreando(false); }
    }
    setGuardando(false);
  };

  const toggleActivo = async (p: Producto) => {
    const { error } = await supabase.from('productos').update({ activo: !p.activo }).eq('id', p.id);
    if (error) toast.error('Error al cambiar el estado del producto');
    else toast.success(p.activo ? 'Producto desactivado' : 'Producto reactivado');
  };

  const eliminar = async (p: Producto) => {
    const { error } = await supabase.from('productos').delete().eq('id', p.id);
    if (error) toast.error('No se pudo eliminar (puede tener ventas asociadas)');
    else toast.success('Producto eliminado');
  };

  const abrirHistorial = async (p: Producto) => {
    setHistorial(p);
    setCargandoHist(true);
    const { data, error } = await supabase
      .from('venta_items')
      .select('id, cantidad, precio_unitario, created_at, venta:ventas(id, created_at, tipo_pago)')
      .eq('producto_id', p.id)
      .order('created_at', { ascending: false })
      .limit(30);
    setCargandoHist(false);
    if (error) { toast.error('Error al cargar el historial'); return; }
    setMovimientos((data ?? []) as unknown as typeof movimientos);
  };

  const modalOpen = editando !== null || creando;
  const cerrarModal = () => { setEditando(null); setCreando(false); };

  /* Una sola definicion de columnas alimenta la tabla de escritorio y las
     tarjetas de movil. Antes ese marcado estaba escrito dos veces. */
  const columnas: Column<Producto>[] = [
    { key: 'nombre', header: 'Producto', cell: (p) => <span className="font-semibold text-ink">{p.nombre}</span>, hideOnCard: true },
    { key: 'categoria', header: 'Categoría', cell: (p) => <span className="text-ink-secondary">{p.categoria}</span> },
    { key: 'precio', header: 'Precio', align: 'right', cell: (p) => <Money value={p.precio} className="font-semibold" /> },
    {
      key: 'stock',
      header: 'Stock',
      align: 'right',
      cell: (p) => (
        <span className={`font-bold tabular-nums ${p.stock < p.stock_minimo ? 'text-warning-800' : 'text-ink'}`}>
          {p.stock}
          <span className="font-normal text-ink-muted"> / {p.stock_minimo}</span>
        </span>
      ),
    },
    { key: 'estado', header: 'Estado', align: 'center', cell: (p) => <StockBadge stock={p.stock} stockMinimo={p.stock_minimo} /> },
  ];

  const acciones = (p: Producto) => (
    <>
      <IconButton label={`Historial de ${p.nombre}`} icon={<History className="w-4 h-4" />} tone="primary" onClick={() => abrirHistorial(p)} />
      <IconButton label={`Editar ${p.nombre}`} icon={<Edit2 className="w-4 h-4" />} tone="primary" onClick={() => abrirEditar(p)} />
      <IconButton
        label={p.activo ? `Desactivar ${p.nombre}` : `Reactivar ${p.nombre}`}
        icon={p.activo ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
        onClick={() => toggleActivo(p)}
      />
      {esDueno && (
        <IconButton label={`Eliminar ${p.nombre}`} icon={<Trash2 className="w-4 h-4" />} tone="danger" onClick={() => setAEliminar(p)} />
      )}
    </>
  );

  return (
    <div className="page-shell animate-fade-in">
      <PageHeader
        title="Inventario"
        subtitle={`${productos.length} productos en el catálogo`}
        actions={
          <Button onClick={abrirCrear}>
            <Plus className="w-5 h-5" aria-hidden="true" />
            <span className="hidden sm:inline">Agregar producto</span>
            <span className="sm:hidden sr-only">Agregar producto</span>
          </Button>
        }
      />

      {bajoStock > 0 && (
        <div role="status" className="mb-4 flex flex-wrap items-center gap-3 p-3 rounded-xl bg-warning-50 border border-warning-200">
          <AlertTriangle className="w-5 h-5 text-warning-800 shrink-0" aria-hidden="true" />
          <p className="text-sm text-warning-800">
            <strong>{bajoStock}</strong> producto{bajoStock !== 1 ? 's' : ''} por debajo del stock mínimo
          </p>
          <Button size="sm" variant="ghost" className="ml-auto" onClick={() => setFiltroBajo((v) => !v)}>
            {filtroBajo ? 'Ver todo' : 'Ver solo estos'}
          </Button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <Input
          label="Buscar producto"
          wrapperClassName="flex-1"
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Nombre o categoría…"
          leading={<Search className="w-5 h-5" />}
        />
        <Button
          variant={mostrarInactivos ? 'secondary' : 'outline'}
          className="sm:self-end sm:mb-0"
          aria-pressed={mostrarInactivos}
          onClick={() => setMostrarInactivos((v) => !v)}
        >
          {mostrarInactivos ? <PowerOff className="w-5 h-5" aria-hidden="true" /> : <Power className="w-5 h-5" aria-hidden="true" />}
          {mostrarInactivos ? 'Ver activos' : 'Ver inactivos'}
        </Button>
      </div>

      <DataTable
        caption="Listado de productos del inventario"
        rows={filtrados}
        columns={columnas}
        getKey={(p) => p.id}
        cardTitle={(p) => p.nombre}
        rowActions={acciones}
        loading={cargando}
        empty={
          <EmptyState
            icon={<Package className="w-7 h-7" />}
            title="Sin productos"
            description="No hay productos que mostrar. Agrega uno para empezar."
            action={
              <Button onClick={abrirCrear}>
                <Plus className="w-4 h-4" aria-hidden="true" /> Agregar producto
              </Button>
            }
          />
        }
      />

      {/* ---------- Crear / editar ---------- */}
      <Modal
        open={modalOpen}
        onClose={cerrarModal}
        title={editando ? 'Editar producto' : 'Nuevo producto'}
        size="md"
        footer={
          <div className="flex flex-col-reverse sm:flex-row gap-2">
            <Button variant="outline" block onClick={cerrarModal} className="sm:flex-1">
              Cancelar
            </Button>
            <Button block onClick={guardar} loading={guardando} className="sm:flex-1">
              {editando ? 'Guardar' : 'Crear'}
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <Input label="Nombre" required value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Nombre del producto" />
          <Select label="Categoría" value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}>
            {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Precio (RD$)" type="number" inputMode="decimal" step="0.01" value={form.precio} onChange={(e) => setForm({ ...form, precio: e.target.value })} placeholder="0.00" />
            <Input label="Stock" type="number" inputMode="numeric" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} placeholder="0" />
          </div>
          <Input
            label="Stock mínimo"
            type="number"
            inputMode="numeric"
            hint="Por debajo de esta cantidad el producto se marca como stock bajo."
            value={form.stock_minimo}
            onChange={(e) => setForm({ ...form, stock_minimo: e.target.value })}
            placeholder="5"
          />
        </div>
      </Modal>

      {/* ---------- Historial ---------- */}
      <Modal open={historial !== null} onClose={() => setHistorial(null)} title={`Historial: ${historial?.nombre ?? ''}`} size="md">
        {cargandoHist ? (
          <SkeletonRows rows={4} />
        ) : movimientos.length === 0 ? (
          <EmptyState icon={<History className="w-7 h-7" />} title="Sin movimientos" description="Este producto no tiene ventas registradas aún." />
        ) : (
          <ul className="divide-y divide-line">
            {movimientos.map((m) => (
              <li key={m.id} className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink">{m.cantidad} unidades</p>
                  <p className="text-xs text-ink-secondary">
                    {formatFechaHora(m.created_at)} ·{' '}
                    {(m.venta as { tipo_pago: string } | null)?.tipo_pago === 'fiao' ? 'Fiao' : 'Contado'}
                  </p>
                </div>
                <Money value={m.precio_unitario * m.cantidad} className="text-sm font-bold text-ink shrink-0" />
              </li>
            ))}
          </ul>
        )}
      </Modal>

      <ConfirmDialog
        open={aEliminar !== null}
        onClose={() => setAEliminar(null)}
        onConfirm={() => aEliminar && eliminar(aEliminar)}
        title="Eliminar producto"
        message={<>¿Seguro que quieres eliminar <strong>{aEliminar?.nombre}</strong>? Esta acción no se puede deshacer. No podrás eliminar productos que ya tengan ventas registradas.</>}
        confirmLabel="Sí, eliminar"
      />
    </div>
  );
}
