/**
 * Planes comerciales de KIPI. Es la ÚNICA fuente de precios y características que muestran
 * la portada, la página /planes y el registro.
 *
 * IMPORTANTE: el precio debe coincidir con el plan "KIPI" creado en Flow (hoy $25.000 / mes).
 * Si se agrega un segundo plan, basta con sumarlo a PLANES: la página /planes lo compara automáticamente
 * (el backend hoy suscribe siempre al plan "KIPI"; un plan nuevo requiere también un cambio allí).
 */
export interface Plan {
  id: string;
  nombre: string;
  descripcion: string;
  precioMensual: number;
  destacado?: boolean;
  /** ids de CARACTERISTICAS incluidas */
  incluye: string[];
}

export interface Caracteristica {
  id: string;
  categoria: 'Ventas y caja' | 'Inventario' | 'Equipo y sucursales' | 'Documentos tributarios' | 'Soporte';
  nombre: string;
  detalle: string;
}

export const MONEDA = 'CLP';

export const CARACTERISTICAS: Caracteristica[] = [
  { id: 'pos', categoria: 'Ventas y caja', nombre: 'Punto de venta web', detalle: 'Venta rápida con buscador y lector de código de barras (también con la cámara del celular).' },
  { id: 'pagos', categoria: 'Ventas y caja', nombre: 'Múltiples formas de pago', detalle: 'Efectivo, tarjeta, transferencia, crédito (fiado) y vales.' },
  { id: 'turnos', categoria: 'Ventas y caja', nombre: 'Turnos y cierre de caja', detalle: 'Apertura y cierre de turno con arqueo del efectivo y trazabilidad de movimientos.' },
  { id: 'tickets', categoria: 'Ventas y caja', nombre: 'Comprobantes e impresión', detalle: 'Ticket para impresora térmica de 80 mm, descarga en PDF y envío por correo.' },
  { id: 'clientes', categoria: 'Ventas y caja', nombre: 'Clientes y fiado', detalle: 'Ficha de clientes, créditos, abonos y estado de cuenta.' },
  { id: 'stock', categoria: 'Inventario', nombre: 'Stock en tiempo real', detalle: 'Descuento automático por venta y alertas de productos con stock crítico.' },
  { id: 'catalogo', categoria: 'Inventario', nombre: 'Productos y categorías', detalle: 'Catálogo organizado, con códigos de barras y valorización del inventario.' },
  { id: 'recetas', categoria: 'Inventario', nombre: 'Recetas e insumos', detalle: 'Productos elaborados que descuentan sus insumos al venderse.' },
  { id: 'movimientos', categoria: 'Inventario', nombre: 'Historial de movimientos', detalle: 'Registro de entradas, salidas y ajustes para cuadrar diferencias.' },
  { id: 'roles', categoria: 'Equipo y sucursales', nombre: 'Usuarios y roles', detalle: 'Administrador y cajero: cada uno ve solo lo que necesita.' },
  { id: 'sucursales', categoria: 'Equipo y sucursales', nombre: 'Multi-sucursal', detalle: 'Varias sucursales con su stock y su personal asignado.' },
  { id: 'reportes', categoria: 'Equipo y sucursales', nombre: 'Reportes e historial', detalle: 'Historial de ventas, cierres de caja, movimientos y reporte de deudores.' },
  { id: 'dte', categoria: 'Documentos tributarios', nombre: 'Boleta y factura electrónica', detalle: 'Emisión desde el POS con tu propio proveedor autorizado por el SII (tú ingresas tu API Key).' },
  { id: 'nc', categoria: 'Documentos tributarios', nombre: 'Anulación con nota de crédito', detalle: 'Al anular una venta con boleta, KIPI emite la nota de crédito correspondiente.' },
  { id: 'soporte', categoria: 'Soporte', nombre: 'Soporte por correo y WhatsApp', detalle: 'Te ayudamos con la puesta en marcha y tus dudas del día a día.' },
];

export const PLANES: Plan[] = [
  {
    id: 'KIPI',
    nombre: 'Plan KIPI',
    descripcion: 'Todo lo que necesita un comercio para vender, controlar su stock y emitir documentos.',
    precioMensual: 25000,
    destacado: true,
    incluye: CARACTERISTICAS.map((c) => c.id),
  },
];

export const PLAN_PRINCIPAL = PLANES[0];

export const formatoPrecio = (valor: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: MONEDA, maximumFractionDigits: 0 }).format(valor);
