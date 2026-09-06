export interface ResumenCaja {
  fondoInicial: number;
  ventasEfectivo: number;
  ventasTarjeta: number;
  ventasCredito?: number;
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
}

export interface ClienteInfo {
  id: number;
  nombre: string;
  rut: string;
  telefono?: string;
  limiteCredito: number;
  deudaActual: number;
}