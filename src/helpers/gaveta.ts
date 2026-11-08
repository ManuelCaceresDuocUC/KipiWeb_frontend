/**
 * Gaveta de efectivo. Va conectada a la impresora térmica y se abre con la orden que la impresora recibe.
 * Dos modos (se elige en Opciones Operativas):
 *  - IMPRESION (sin instalar nada): el driver de la impresora está configurado en Windows para abrir la gaveta al
 *    imprimir. KIPIPOS se asegura de que SE IMPRIMA un comprobante cada vez que corresponde abrirla
 *    (venta con efectivo, ingreso, retiro, apertura sin venta). Limitación: cualquier ticket impreso abre la gaveta.
 *  - PUENTE: un programa local en la caja (gaveta-puente/) manda la orden sin imprimir; abre solo cuando corresponde.
 * Nunca bloquea una venta: si algo falla, solo se avisa con un mensaje breve.
 */
import { escaparHtmlTicket, imprimirHtml80 } from './impresion';
import { enviarAEstacion, impresionRemotaActiva } from './estacionImpresion';
import { getSesion } from './session';

export type ModoGaveta = 'NINGUNA' | 'IMPRESION' | 'PUENTE';

const CLAVE_MODO = 'kipipos_gaveta_modo';
const CLAVE_ACTIVA_ANTIGUA = 'kipipos_gaveta_activa';
const CLAVE_URL = 'kipipos_gaveta_url';
export const URL_PUENTE_POR_DEFECTO = 'http://localhost:9101';

export const modoGaveta = (): ModoGaveta => {
  try {
    const m = localStorage.getItem(CLAVE_MODO);
    if (m === 'IMPRESION' || m === 'PUENTE' || m === 'NINGUNA') return m;
    return localStorage.getItem(CLAVE_ACTIVA_ANTIGUA) === '1' ? 'PUENTE' : 'NINGUNA'; // versión anterior
  } catch {
    return 'NINGUNA';
  }
};

export const guardarModoGaveta = (modo: ModoGaveta) => {
  try {
    localStorage.setItem(CLAVE_MODO, modo);
  } catch {
    /* sin almacenamiento: queda desactivada */
  }
};

const urlPuente = (): string => {
  try {
    return (localStorage.getItem(CLAVE_URL) || URL_PUENTE_POR_DEFECTO).replace(/\/+$/, '');
  } catch {
    return URL_PUENTE_POR_DEFECTO;
  }
};

let ultimoAviso = 0;

/** Aviso liviano que no interfiere con los diálogos de la caja (no usa SweetAlert). */
const avisar = (texto: string) => {
  const ahora = Date.now();
  if (ahora - ultimoAviso < 60_000) return;
  ultimoAviso = ahora;
  const el = document.createElement('div');
  el.setAttribute('role', 'status');
  el.className = 'fixed top-4 right-4 z-[9999] max-w-xs rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-lg';
  el.textContent = texto;
  document.body.appendChild(el);
  window.setTimeout(() => el.remove(), 6000);
};

const llamar = async (ruta: string, metodo: 'GET' | 'POST'): Promise<Response> => {
  const ctrl = new AbortController();
  const timer = window.setTimeout(() => ctrl.abort(), 2500);
  try {
    return await fetch(`${urlPuente()}${ruta}`, { method: metodo, signal: ctrl.signal });
  } finally {
    window.clearTimeout(timer);
  }
};

/** Modo PUENTE: manda la orden de apertura. En otros modos no hace nada (con IMPRESION la abre la propia impresión). */
export const abrirGaveta = async (forzar = false): Promise<boolean> => {
  if (!forzar && modoGaveta() !== 'PUENTE') return false;
  try {
    const r = await llamar('/abrir', 'POST');
    if (!r.ok) throw new Error(String(r.status));
    return true;
  } catch {
    avisar('No se pudo abrir la gaveta. Revisa que el programa de la gaveta esté activo en este computador (no se detuvo la venta).');
    return false;
  }
};

/** Venta: en modo PUENTE abre si hay efectivo. En modo IMPRESION la apertura la provoca el comprobante (ver forzarCopiaLocalPorGaveta). */
export const abrirGavetaSiHayEfectivo = (pagos: Array<{ metodo: string }>) => {
  if (impresionRemotaActiva()) return; // la gaveta la abre la caja de impresión al recibir el ticket
  if (pagos.some((p) => p.metodo === 'EFECTIVO')) void abrirGaveta();
};

/** En modo IMPRESION, toda venta con efectivo debe imprimir al menos la copia del local para que se abra la gaveta. */
export const forzarCopiaLocalPorGaveta = (pagos: Array<{ metodo: string }>): boolean =>
  // Si este equipo manda a imprimir a la caja, la gaveta está allá: toda venta con efectivo lleva la copia del local
  (modoGaveta() === 'IMPRESION' || impresionRemotaActiva()) && pagos.some((p) => p.metodo === 'EFECTIVO');

export type EventoCaja =
  | { tipo: 'ingreso' | 'retiro'; monto: number; motivo: string }
  | { tipo: 'sin_venta'; motivo: string }
  | { tipo: 'prueba' };

const TITULOS: Record<EventoCaja['tipo'], string> = {
  ingreso: 'INGRESO DE EFECTIVO',
  retiro: 'RETIRO DE EFECTIVO',
  sin_venta: 'APERTURA DE GAVETA SIN VENTA',
  prueba: 'PRUEBA DE GAVETA',
};

/**
 * Movimientos de caja y aperturas manuales. PUENTE: manda la orden. IMPRESION: imprime un comprobante interno
 * mínimo de 80 mm (sirve además como respaldo en papel) y el driver abre la gaveta. Sin modo activo, no hace nada.
 */
export const gavetaPorEvento = async (ev: EventoCaja, opts: { local?: boolean } = {}): Promise<boolean> => {
  // Equipo sin impresora: la caja de impresión (PC) imprime el comprobante y abre su gaveta
  if (!opts.local && impresionRemotaActiva()) return enviarAEstacion({ tipo: 'CAJA', evento: ev });
  const modo = modoGaveta();
  if (modo === 'NINGUNA' && ev.tipo !== 'prueba') return false;
  if (modo === 'PUENTE') return abrirGaveta(true);
  if (modo === 'NINGUNA') return false;

  const sesion = getSesion();
  const monto = 'monto' in ev ? `<p>Monto: <b>$${Math.round(ev.monto).toLocaleString('es-CL')}</b></p>` : '';
  const motivo = 'motivo' in ev ? `<p>Motivo: ${escaparHtmlTicket(ev.motivo)}</p>` : '';
  const ok = await imprimirHtml80(
    `<h1>${escaparHtmlTicket(sesion?.empresa.razonSocial ?? 'KIPIPOS')}</h1>
     <p class="c"><b>${TITULOS[ev.tipo]}</b></p>
     <p class="c">Comprobante interno de caja</p><hr>
     <p>${new Date().toLocaleString('es-CL')}</p>
     <p>Usuario: ${escaparHtmlTicket(sesion?.usuario ?? '—')}</p>
     ${monto}${motivo}`,
  );
  if (!ok) avisar('No se pudo imprimir el comprobante, por lo que la gaveta podría no abrirse.');
  return ok;
};

export interface EstadoPuente {
  ok: boolean;
  impresora?: string;
  error?: string;
}

export const estadoPuente = async (): Promise<EstadoPuente> => {
  try {
    const r = await llamar('/estado', 'GET');
    if (!r.ok) return { ok: false, error: `El programa respondió ${r.status}.` };
    const d = await r.json();
    return { ok: true, impresora: d?.impresora };
  } catch {
    return { ok: false, error: 'No se pudo conectar con el programa de la gaveta en este computador.' };
  }
};

export const GUIA_DRIVER_HTML = `
  <div style="text-align:left;font-size:14px">
    <p>En <b>cada computador con caja</b>, una sola vez (no se instala nada):</p>
    <ol style="padding-left:18px;margin:8px 0">
      <li>Windows: <i>Configuración &gt; Bluetooth y dispositivos &gt; Impresoras y escáneres</i> &rarr; tu impresora térmica &rarr; <i>Preferencias de impresión</i> (o <i>Propiedades de la impresora</i>).</li>
      <li>Busca la opción de la gaveta: <i>Cash Drawer</i>, <i>Open drawer</i>, <i>Peripheral devices</i> o <i>Gaveta</i> (Epson: pestaña <i>Optional</i> o <i>Utility</i> &rarr; <i>Drawer 1</i>; Xprinter/Bixolon: <i>Cash Drawer</i>).</li>
      <li>Elígela como <b>"Abrir después de imprimir"</b> (After print / After document) para <b>Drawer 1</b>. Aplica y guarda.</li>
      <li>Usa <b>Probar gaveta</b> en este menú.</li>
    </ol>
    <p style="color:#64748b">Importante: con este modo, <b>cualquier ticket impreso abre la gaveta</b>, también el de una venta con tarjeta. KIPIPOS imprime la copia del local en toda venta con efectivo para que se abra.</p>
  </div>`;
