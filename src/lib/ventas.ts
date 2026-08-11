import { supabase } from './supabase';
import type { CarritoItem, Cliente } from '../types';

export async function registrarVenta(
  cliente: Cliente | null,
  tipoPago: 'contado' | 'fiao',
  items: CarritoItem[],
  montoRecibido?: number,
): Promise<{ ventaId: string | null; error: string | null }> {
  const payload = items.map((i) => ({
    producto_id: i.producto.id,
    cantidad: i.cantidad,
    precio_unitario: i.producto.precio,
  }));

  const { data, error } = await supabase.rpc('registrar_venta', {
    p_cliente_id: cliente?.id ?? null,
    p_tipo_pago: tipoPago,
    p_items: payload,
    p_monto_recibido: montoRecibido ?? null,
  });

  if (error) {
    let msg = error.message;
    if (msg.includes('No tiene permisos')) msg = 'No tiene permisos para registrar ventas.';
    else if (msg.includes('Stock insuficiente')) msg = msg.replace('Stock insuficiente para', 'Stock insuficiente para el producto');
    return { ventaId: null, error: msg };
  }
  return { ventaId: data as string, error: null };
}

export async function registrarAbono(
  deudaId: string,
  monto: number,
): Promise<{ abonoId: string | null; error: string | null }> {
  const { data, error } = await supabase.rpc('registrar_abono', {
    p_deuda_id: deudaId,
    p_monto: monto,
  });
  if (error) return { abonoId: null, error: error.message };
  return { abonoId: data as string, error: null };
}

export async function marcarVencidas(): Promise<number> {
  const { data, error } = await supabase.rpc('verificar_vencidas');
  if (error) return 0;
  return (data as number) ?? 0;
}

export async function anularVenta(
  ventaId: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc('anular_venta', { p_venta_id: ventaId });
  if (error) {
    let msg = error.message;
    if (msg.includes('Solo el dueño')) msg = 'Solo el dueño puede anular ventas.';
    return { error: msg };
  }
  return { error: null };
}
