export type Rol = 'dueño' | 'cajero' | 'cliente';

export type TipoPago = 'contado' | 'fiao';

export type EstadoDeuda = 'pendiente' | 'abonada' | 'saldada' | 'vencida';

export type TipoCaja = 'ingreso' | 'egreso';

export interface Perfil {
  id: string;
  nombre: string;
  rol: Rol;
  email?: string | null;
  created_at: string;
}

export interface Producto {
  id: string;
  nombre: string;
  categoria: string;
  precio: number;
  stock: number;
  stock_minimo: number;
  activo: boolean;
  created_at: string;
}

export interface Cliente {
  id: string;
  nombre: string;
  telefono: string | null;
  limite_credito: number;
  activo: boolean;
  created_at: string;
}

export interface Venta {
  id: string;
  cliente_id: string | null;
  total: number;
  tipo_pago: TipoPago;
  anulada: boolean;
  cajero_id?: string | null;
  monto_recibido?: number | string | null;
  created_at: string;
  cliente?: Cliente | null;
  cajero?: Perfil | null;
  venta_items?: VentaItem[];
}

export interface VentaItem {
  id: string;
  venta_id: string;
  producto_id: string;
  cantidad: number;
  precio_unitario: number;
  created_at: string;
  producto?: Producto;
}

export interface Deuda {
  id: string;
  cliente_id: string;
  venta_id: string;
  monto_original: number;
  saldo: number;
  estado: EstadoDeuda;
  fecha_vencimiento: string;
  created_at: string;
  cliente?: Cliente;
  venta?: Venta;
  abonos?: Abono[];
}

export interface Abono {
  id: string;
  deuda_id: string;
  monto: number;
  created_at: string;
}

export interface CajaMovimiento {
  id: string;
  tipo: TipoCaja;
  monto: number;
  concepto: string;
  usuario_id?: string | null;
  created_at: string;
  usuario?: Perfil | null;
}

export interface CarritoItem {
  producto: Producto;
  cantidad: number;
}
