import { supabase } from './supabase';
import { esStockBajo } from './stock';

function hoyInicio(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export async function cargarMetricas() {
  const inicioHoy = hoyInicio();

  // Total vendido hoy (contado + fiao)
  const { data: ventasHoy } = await supabase
    .from('ventas')
    .select('total, tipo_pago')
    .gte('created_at', inicioHoy);

  const ventas = ventasHoy ?? [];
  const totalVendidoHoy = ventas.reduce((s: number, v: { total: string | number }) => s + parseFloat(String(v.total)), 0);
  const ventasContadoHoy = ventas.filter((v: { tipo_pago: string }) => v.tipo_pago === 'contado').length;
  /* Derivados de la MISMA consulta de arriba: no cuestan una peticion extra.
     El ticket promedio reparte lo vendido entre todas las ventas del dia. */
  const ventasFiaoHoy = ventas.length - ventasContadoHoy;
  const ticketPromedio = ventas.length > 0 ? totalVendidoHoy / ventas.length : 0;

  // Total en caja (ingresos - egresos de hoy)
  const { data: cajaHoy } = await supabase
    .from('caja_movimientos')
    .select('tipo, monto')
    .gte('created_at', inicioHoy);

  const ingresos = (cajaHoy ?? []).filter((c: { tipo: string }) => c.tipo === 'ingreso').reduce((s: number, c: { monto: string | number }) => s + parseFloat(String(c.monto)), 0);
  const egresos = (cajaHoy ?? []).filter((c: { tipo: string }) => c.tipo === 'egreso').reduce((s: number, c: { monto: string | number }) => s + parseFloat(String(c.monto)), 0);
  const totalCaja = ingresos - egresos;

  // Deudas pendientes
  const { count: deudasPendientes } = await supabase
    .from('deudas')
    .select('*', { count: 'exact', head: true })
    .in('estado', ['pendiente', 'abonada']);

  // Total saldo de deudas
  const { data: deudasActivas } = await supabase
    .from('deudas')
    .select('saldo')
    .in('estado', ['pendiente', 'abonada', 'vencida']);
  const totalFiaoPendiente = (deudasActivas ?? []).reduce((s: number, d: { saldo: string | number }) => s + parseFloat(String(d.saldo)), 0);

  // Productos con stock bajo
  const productosBajoStock = await cargarProductosBajoStock();

  return {
    totalVendidoHoy,
    totalCaja,
    deudasPendientes: deudasPendientes ?? 0,
    totalFiaoPendiente,
    ventasContadoHoy,
    ventasFiaoHoy,
    ticketPromedio,
    ingresos,
    egresos,
    productosBajoStock: productosBajoStock.length,
  };
}

/**
 * Productos por debajo de su minimo, de mas critico a menos.
 *
 * El filtro anterior era `.filter('stock', 'lt', 'stock_minimo')`. PostgREST no
 * compara una columna con otra: mandaba la cadena literal "stock_minimo" como
 * valor y Postgres respondia `22P02 invalid input syntax for type integer`. La
 * consulta fallaba SIEMPRE, asi que la ficha del inicio y la insignia del menu
 * se quedaban en cero aunque hubiera productos bajo minimo (Inventario acertaba
 * porque comparaba en el cliente).
 *
 * Se resuelve trayendo los productos activos y comparando aqui. El catalogo de
 * un colmado son cientos de filas; si algun dia fueran muchas mas, lo correcto
 * seria una columna generada `stock < stock_minimo` indexada en una migracion.
 */
export async function cargarProductosBajoStock() {
  const { data, error } = await supabase
    .from('productos')
    .select('id, nombre, stock, stock_minimo, categoria, activo')
    .eq('activo', true)
    .order('stock', { ascending: true });
  if (error) return [];
  return (data ?? []).filter(esStockBajo);
}

export async function cargarDeudasVencidas() {
  const { data, error } = await supabase
    .from('deudas')
    .select('id, saldo, fecha_vencimiento, cliente:clientes(nombre)')
    .eq('estado', 'vencida')
    .order('fecha_vencimiento', { ascending: true });
  if (error) return [];
  return data;
}

export async function cargarProductos() {
  const { data, error } = await supabase
    .from('productos')
    .select('*')
    .order('nombre', { ascending: true });
  if (error) return [];
  return data;
}

export async function cargarClientes() {
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .order('nombre', { ascending: true });
  if (error) return [];
  return data;
}

export async function cargarDeudas() {
  const { data, error } = await supabase
    .from('deudas')
    .select('*, cliente:clientes(*), venta:ventas(*), abonos:abonos(*)')
    .order('created_at', { ascending: false });
  if (error) return [];
  return data;
}

export async function cargarCajaHoy() {
  const inicioHoy = hoyInicio();
  const { data, error } = await supabase
    .from('caja_movimientos')
    .select('*')
    .gte('created_at', inicioHoy)
    .order('created_at', { ascending: false });
  if (error) return [];
  return data;
}

export async function cargarMovimientosPorProducto(productoId: string) {
  const { data: items, error } = await supabase
    .from('venta_items')
    .select('id, cantidad, precio_unitario, created_at, venta:ventas(id, created_at, tipo_pago)')
    .eq('producto_id', productoId)
    .order('created_at', { ascending: false })
    .limit(30);
  if (error) return [];
  return items;
}
