import Swal from 'sweetalert2';
import { apiFetch, leerError } from './apiFetch';

const API = () => import.meta.env.VITE_API_URL as string;

export const TIPOS_DOC: { id: string; nombre: string }[] = [
  { id: 'FACTURA', nombre: 'Factura' },
  { id: 'FACTURA_EXENTA', nombre: 'Factura exenta' },
  { id: 'BOLETA', nombre: 'Boleta' },
  { id: 'NOTA_VENTA', nombre: 'Nota de venta' },
  { id: 'GUIA', nombre: 'Guía de despacho' },
  { id: 'OTRO', nombre: 'Otro documento' },
];
export const nombreTipo = (id: string) => TIPOS_DOC.find((t) => t.id === id)?.nombre ?? id;

export type EstadoCompra = 'PAGADA' | 'POR_PAGAR' | 'VENCIDA' | 'ANULADA';
export const ETIQUETA_ESTADO: Record<EstadoCompra, { texto: string; clase: string }> = {
  PAGADA: { texto: 'Pagada', clase: 'bg-emerald-100 text-emerald-800' },
  POR_PAGAR: { texto: 'Por pagar', clase: 'bg-amber-100 text-amber-800' },
  VENCIDA: { texto: 'Vencida', clase: 'bg-red-100 text-red-700' },
  ANULADA: { texto: 'Anulada', clase: 'bg-slate-200 text-slate-600' },
};

export interface Proveedor {
  id: number;
  nombre: string;
  rut?: string | null;
  telefono?: string | null;
  email?: string | null;
  notas?: string | null;
  totalComprado?: number;
  adeudado?: number;
}

export interface CompraResumen {
  id: number;
  proveedorId: number;
  proveedor: string;
  tipoDocumento: string;
  folio?: string | null;
  fechaDocumento: string;
  vencimiento?: string | null;
  total: number;
  pagado: number;
  saldo: number;
  estado: EstadoCompra;
  ingresoStock: boolean;
  tieneAdjunto: boolean;
  adjuntoNombre?: string | null;
}

export interface CompraDetalle extends CompraResumen {
  items: { productoId: number; descripcion: string; cantidad: number; costoUnitario: number; subtotal: number }[];
  pagos: { id: number; monto: number; metodo: string; fecha: string; nota?: string | null; usuario?: string | null }[];
  nota?: string | null;
  motivoAnulacion?: string | null;
  usuario?: string | null;
  actualizoCostos: boolean;
  preciosNetos: boolean;
}

export const clp = (n: number) => '$' + Math.round(n).toLocaleString('es-CL');
export const fechaCorta = (iso?: string | null) => {
  if (!iso) return '—';
  const [a, m, d] = iso.split('-');
  return `${d}/${m}/${a}`;
};
export const hoyISO = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

/** Total del documento a partir de los valores unitarios: con precios netos se suma el IVA (salvo factura exenta). */
export const totalConIva = (suma: number, netos: boolean, tipo: string) =>
  netos && tipo !== 'FACTURA_EXENTA' ? Math.round(suma * 1.19) : suma;

/** Las fotos del celular pesan varios MB: se reducen antes de subir (el servidor acepta hasta 5 MB). */
export const prepararArchivo = async (archivo: File): Promise<File> => {
  if (!archivo.type.startsWith('image/') || archivo.size <= 1_500_000) return archivo;
  try {
    const bmp = await createImageBitmap(archivo);
    const escala = Math.min(1, 1800 / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bmp.width * escala);
    canvas.height = Math.round(bmp.height * escala);
    canvas.getContext('2d')?.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob: Blob | null = await new Promise((r) => canvas.toBlob(r, 'image/jpeg', 0.8));
    if (!blob) return archivo;
    return new File([blob], archivo.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' });
  } catch {
    return archivo;
  }
};

export const subirAdjunto = async (compraId: number, archivo: File): Promise<boolean> => {
  try {
    const f = await prepararArchivo(archivo);
    if (f.size > 5 * 1024 * 1024) throw new Error('El archivo supera los 5 MB.');
    const datos = new FormData();
    datos.append('file', f);
    const res = await apiFetch(`${API()}/compras/${compraId}/adjunto`, { method: 'POST', body: datos, timeoutMs: 60_000 });
    if (!res.ok) throw new Error(await leerError(res, 'No se pudo guardar el documento.'));
    return true;
  } catch (e) {
    Swal.fire('No se guardó el documento', e instanceof Error ? e.message : 'Error inesperado.', 'error');
    return false;
  }
};

export const verAdjunto = async (compraId: number) => {
  try {
    const res = await apiFetch(`${API()}/compras/${compraId}/adjunto`);
    if (!res.ok) throw new Error(await leerError(res, 'No se pudo abrir el documento.'));
    const { url } = (await res.json()) as { url: string };
    window.open(url, '_blank', 'noopener,noreferrer');
  } catch (e) {
    Swal.fire('Error', e instanceof Error ? e.message : 'No se pudo abrir el documento.', 'error');
  }
};
