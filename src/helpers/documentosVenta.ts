import Swal from 'sweetalert2';
import { apiFetch, leerError } from './apiFetch';
import { descargarPdfBase64, imprimirPdfBase64 } from './impresion';

const API = () => import.meta.env.VITE_API_URL as string;
const MAX_BYTES = 5 * 1024 * 1024;

export interface ComprobanteAdjunto {
  pagoId: number;
  metodo: string;
  nombre: string;
  tipo: string;
  url: string;
}

const error = (e: unknown, defecto: string) => Swal.fire('Error', e instanceof Error ? e.message : defecto, 'error');

/** Pide una foto/PDF al cajero y lo sube como comprobante de la transferencia de la venta. */
export const adjuntarComprobante = async (ventaId: number, pagoId?: number): Promise<boolean> => {
  const { value: archivo } = await Swal.fire({
    title: 'Comprobante de transferencia',
    text: 'Sube la captura o foto del comprobante (JPG, PNG, WEBP o PDF, máx. 5 MB).',
    input: 'file',
    inputAttributes: { accept: 'image/*,application/pdf', 'aria-label': 'Comprobante de transferencia' },
    showCancelButton: true,
    confirmButtonText: 'Subir',
    cancelButtonText: 'Después',
    confirmButtonColor: '#0F766E',
    inputValidator: (f) => {
      if (!f) return 'Selecciona un archivo.';
      if ((f as File).size > MAX_BYTES) return 'El archivo supera 5 MB.';
      return undefined;
    },
  });
  if (!archivo) return false;

  try {
    const datos = new FormData();
    datos.append('file', archivo as File);
    if (pagoId) datos.append('pagoId', String(pagoId));
    const res = await apiFetch(`${API()}/ventas/${ventaId}/comprobante`, { method: 'POST', body: datos });
    if (!res.ok) throw new Error(await leerError(res, 'No se pudo subir el comprobante'));
    await Swal.fire({ icon: 'success', title: 'Comprobante guardado', timer: 1500, showConfirmButton: false });
    return true;
  } catch (e) {
    await error(e, 'No se pudo subir el comprobante');
    return false;
  }
};

/** Abre los comprobantes adjuntos (URL temporal firmada) en una pestaña nueva. */
export const verComprobantes = async (ventaId: number) => {
  try {
    const res = await apiFetch(`${API()}/ventas/${ventaId}/comprobantes`);
    if (!res.ok) throw new Error(await leerError(res, 'No se pudo obtener el comprobante'));
    const lista: ComprobanteAdjunto[] = await res.json();
    if (lista.length === 0) {
      Swal.fire('Sin comprobante', 'Esta venta no tiene comprobante adjunto.', 'info');
      return;
    }
    lista.forEach((c) => window.open(c.url, '_blank', 'noopener,noreferrer'));
  } catch (e) {
    error(e, 'No se pudo obtener el comprobante');
  }
};

const pedirPdf = async (ruta: string, mensaje: string): Promise<string | null> => {
  const res = await apiFetch(`${API()}${ruta}`);
  if (!res.ok) throw new Error(await leerError(res, mensaje));
  const j = await res.json();
  return j.pdf || null;
};

export const reimprimirTicket = async (ventaId: number) => {
  try {
    const pdf = await pedirPdf(`/ventas/${ventaId}/ticket`, 'No se pudo generar el ticket');
    if (!pdf) return;
    if (!(await imprimirPdfBase64(pdf))) descargarPdfBase64(pdf, `Ticket_${ventaId}.pdf`);
  } catch (e) {
    error(e, 'No se pudo reimprimir el ticket');
  }
};

export const reimprimirVale = async (ventaId: number) => {
  try {
    const pdf = await pedirPdf(`/ventas/${ventaId}/vale`, 'No se pudo generar el vale');
    if (!pdf) return;
    if (!(await imprimirPdfBase64(pdf))) descargarPdfBase64(pdf, `Vale_${ventaId}.pdf`);
  } catch (e) {
    error(e, 'No se pudo reimprimir el vale');
  }
};

const pedirCorreo = async (titulo: string, sugerido?: string | null): Promise<string | null> => {
  const { value } = await Swal.fire({
    title: titulo,
    input: 'email',
    inputValue: sugerido || '',
    inputPlaceholder: 'cliente@correo.cl',
    showCancelButton: true,
    confirmButtonText: 'Enviar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#0F766E',
  });
  return value ? String(value).trim() : null;
};

export const enviarTicketPorCorreo = async (ventaId: number) => {
  const email = await pedirCorreo('Enviar comprobante por correo');
  if (!email) return;
  try {
    Swal.fire({ title: 'Enviando...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    const res = await apiFetch(`${API()}/ventas/${ventaId}/ticket/enviar`, {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    if (!res.ok) throw new Error(await leerError(res, 'No se pudo enviar el correo'));
    Swal.fire({ icon: 'success', title: 'Comprobante enviado', text: email, timer: 2000, showConfirmButton: false });
  } catch (e) {
    error(e, 'No se pudo enviar el correo');
  }
};

export const enviarEstadoCuentaPorCorreo = async (clienteId: number, emailCliente?: string | null) => {
  const email = await pedirCorreo('Enviar estado de cuenta', emailCliente);
  if (!email) return;
  try {
    Swal.fire({ title: 'Enviando...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    const res = await apiFetch(`${API()}/clientes/${clienteId}/estado-cuenta/enviar`, {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    if (!res.ok) throw new Error(await leerError(res, 'No se pudo enviar el correo'));
    Swal.fire({ icon: 'success', title: 'Estado de cuenta enviado', text: email, timer: 2000, showConfirmButton: false });
  } catch (e) {
    error(e, 'No se pudo enviar el correo');
  }
};
