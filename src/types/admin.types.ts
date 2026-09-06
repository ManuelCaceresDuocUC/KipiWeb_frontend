// src/types/admin.types.ts
export interface Metricas {
  ventasHoy: number;
  ivaMes: number;
  ticketPromedio: number;
  costoInventario: number;
}
export interface Empleado { id: number; usuario: string; rol: string; }
export interface Nota { id: number; texto: string; }
export interface ProductoMasVendido { nombre: string; total: number; }
export interface Categoria { id: number; nombre: string; }
export interface Cuadratura {
  id: number; cajeroId: number; cajeroNombre?: string;
  fechaApertura: string; fechaCierre: string; montoApertura: number;
  totalSistema: number; totalRealFisico: number; diferencia: number; estado: string;
}
export interface ClienteInfo {
  id: number; nombre: string; rut: string; telefono?: string;
  limiteCredito: number; deudaActual: number;
}