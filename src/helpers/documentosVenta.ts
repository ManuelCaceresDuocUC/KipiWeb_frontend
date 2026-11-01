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

// ---------------- Boleta electrónica (DTE) ----------------

export interface EstadoEmision {
  estado: string; // EMITIDO | PENDIENTE | REVISAR | EN_CURSO | NO_APLICA
  folio: number | null;
  aviso: string;
  pdf?: string;
}

export const ETIQUETA_DTE: Record<string, string> = {
  EMITIDO: 'Boleta emitida',
  PENDIENTE: 'Boleta pendiente',
  REVISAR: 'Boleta por revisar',
  CANCELADO: 'Boleta cancelada',
};

/** Reintenta emitir la boleta de una venta cuyo proveedor falló. Imprime el PDF si sale. */
export const reintentarBoleta = async (ventaId: number, forzar = false): Promise<EstadoEmision | null> => {
  try {
    Swal.fire({ title: 'Emitiendo boleta...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    const res = await apiFetch(`${API()}/ventas/${ventaId}/boleta/reintentar?forzar=${forzar}`, { method: 'POST' });
    if (!res.ok) throw new Error(await leerError(res, 'No se pudo reintentar la boleta'));
    const r: EstadoEmision = await res.json();
    if (r.estado === 'EMITIDO') {
      if (r.pdf) {
        const ok = await imprimirPdfBase64(r.pdf);
        if (!ok) descargarPdfBase64(r.pdf, `Boleta_${r.folio ?? ventaId}.pdf`);
      }
      await Swal.fire({ icon: 'success', title: `Boleta emitida${r.folio ? ` (N° ${r.folio})` : ''}`, text: r.aviso || '' });
    } else {
      await Swal.fire({ icon: r.estado === 'EN_CURSO' ? 'info' : 'warning', title: 'La boleta aún no salió', text: r.aviso || 'Intenta nuevamente.' });
    }
    return r;
  } catch (e) {
    await error(e, 'No se pudo reintentar la boleta');
    return null;
  }
};

/** Reimprime la copia guardada de la boleta electrónica. */
export const reimprimirBoleta = async (ventaId: number) => {
  try {
    const pdf = await pedirPdf(`/ventas/${ventaId}/boleta`, 'No se pudo abrir la boleta');
    if (!pdf) return;
    if (!(await imprimirPdfBase64(pdf))) descargarPdfBase64(pdf, `Boleta_${ventaId}.pdf`);
  } catch (e) {
    error(e, 'No se pudo reimprimir la boleta');
  }
};

/** Emite o consulta la nota de crédito de una venta anulada (solo administradores). */
export const reintentarNotaCredito = async (ventaId: number) => {
  try {
    Swal.fire({ title: 'Procesando nota de crédito...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    const res = await apiFetch(`${API()}/ventas/${ventaId}/nota-credito/reintentar`, { method: 'POST' });
    if (!res.ok) throw new Error(await leerError(res, 'No se pudo procesar la nota de crédito'));
    const r: EstadoEmision = await res.json();
    await Swal.fire({
      icon: r.estado === 'EMITIDO' ? 'success' : r.estado === 'NO_APLICA' ? 'info' : 'warning',
      title: r.estado === 'EMITIDO' ? `Nota de crédito emitida${r.folio ? ` (N° ${r.folio})` : ''}` : 'Nota de crédito',
      text: r.aviso || (r.estado === 'NO_APLICA' ? 'Esta venta no requiere nota de crédito.' : ''),
    });
  } catch (e) {
    await error(e, 'No se pudo procesar la nota de crédito');
  }
};
