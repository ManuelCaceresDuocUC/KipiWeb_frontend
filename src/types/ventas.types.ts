export interface ResumenCaja {
  fondoInicial: number;
  ventasEfectivo: number;
  ventasTarjeta: number;
  ventasCredito?: number;
  ventasTransferencia?: number;
  ingresosExtra: number;
  abonosCredito?: number;
  retiros: number;
  totalEnCaja: number;
}

export interface ItemCarrito {
  id: number;
  descripcion: string;
  precio: number;
  cantidad: number;
  subtotal: number;
  unidadMedida?: string;
  pesable?: boolean;
}

/** Qué se le entrega al cliente al cobrar. */
export type ComprobanteVenta = 'IMPRIMIR' | 'CORREO' | 'NINGUNO';

export interface ClienteInfo {
  id: number;
  nombre: string;
  rut: string;
  telefono?: string;
  email?: string;
  limiteCredito: number;
  deudaActual: number;
}

export type MetodoPago = 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA' | 'CREDITO';

/** Una forma de pago de la venta. El total de todas las líneas debe ser igual al total de la venta. */
export interface LineaPago {
  metodo: MetodoPago;
  monto: number;
  referencia?: string;
  /** Transferencia: el cajero confirma que el dinero ya llegó a la cuenta. */
  confirmado?: boolean;
}

export interface MovimientoCuenta {
  id: number;
  fecha: string;
  tipo: 'CARGO' | 'ABONO' | 'ANULACION' | 'AJUSTE';
  monto: number;
  saldoResultante: number;
  ventaId?: number | null;
  metodoPago?: string | null;
  motivo?: string | null;
  usuario?: string | null;
}
