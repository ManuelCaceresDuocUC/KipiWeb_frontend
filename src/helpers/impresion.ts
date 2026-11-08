/**
 * Impresión de tickets 80 mm desde el navegador.
 *
 * El servidor entrega el PDF en base64; aquí se carga en un iframe oculto y se llama a print().
 * - Con Chrome/Edge iniciado con --kiosk-printing el ticket sale directo a la impresora predeterminada,
 *   sin diálogo (ver LEEME de la etapa 3B).
 * - Sin ese parámetro el navegador muestra el diálogo de impresión (un clic en "Imprimir").
 * - Si el navegador no permite imprimir el iframe, se descarga el PDF como respaldo.
 */

import { enviarAEstacion, impresionRemotaActiva } from './estacionImpresion';

const CLAVE_AUTO = 'kipipos_impresion_auto';

/** Con la gaveta "por impresión" la gaveta se abre al imprimir: la impresión no puede desactivarse. */
export const modoGavetaImpresion = (): boolean => {
  try {
    return localStorage.getItem('kipipos_gaveta_modo') === 'IMPRESION';
  } catch {
    return false;
  }
};

export const impresionAutomaticaActiva = (): boolean => {
  if (modoGavetaImpresion()) return true;
  try {
    return localStorage.getItem(CLAVE_AUTO) !== '0';
  } catch {
    return true;
  }
};

export const guardarImpresionAutomatica = (activa: boolean) => {
  try {
    localStorage.setItem(CLAVE_AUTO, activa ? '1' : '0');
  } catch {
    /* sin almacenamiento: queda el valor por defecto */
  }
};

const CLAVE_COPIAS = 'kipipos_copias_ticket';

/** Copias del comprobante de venta: 1 (solo cliente, ahorra papel) o 2 (cliente y local). Por defecto, 1. */
export const copiasTicket = (): 1 | 2 => {
  try {
    return localStorage.getItem(CLAVE_COPIAS) === '2' ? 2 : 1;
  } catch {
    return 1;
  }
};

export const guardarCopiasTicket = (copias: 1 | 2) => {
  try {
    localStorage.setItem(CLAVE_COPIAS, String(copias));
  } catch {
    /* sin almacenamiento: queda el valor por defecto */
  }
};

const aBlobUrl = (base64: string): string => {
  const binario = atob(base64);
  const bytes = new Uint8Array(binario.length);
  for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i);
  return URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
};

export const descargarPdfBase64 = (base64: string, nombre: string) => {
  const url = aBlobUrl(base64);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
};

/** Imprime un PDF. Devuelve true si se envió a imprimir (no garantiza que el usuario no cancele el diálogo). */
export const imprimirPdfBase64 = (base64: string): Promise<boolean> =>
  new Promise((resolve) => {
    let url = '';
    try {
      url = aBlobUrl(base64);
    } catch {
      resolve(false);
      return;
    }
    const iframe = document.createElement('iframe');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:1px;height:1px;border:0;opacity:0;pointer-events:none;';

    const limpiar = () => {
      iframe.remove();
      URL.revokeObjectURL(url);
    };

    let resuelto = false;
    const terminar = (ok: boolean) => {
      if (resuelto) return;
      resuelto = true;
      resolve(ok);
    };

    iframe.onload = () => {
      // Pequeña espera para que el visor de PDF termine de dibujar antes de imprimir
      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          terminar(true);
        } catch {
          terminar(false);
        }
        setTimeout(limpiar, 120000);
      }, 400);
    };
    iframe.onerror = () => {
      limpiar();
      terminar(false);
    };

    iframe.src = url;
    document.body.appendChild(iframe);
    // Si nunca carga, no dejar la venta esperando
    setTimeout(() => terminar(false), 8000);
  });

/**
 * Imprime varios documentos en orden (ticket, vale...). Espera entre uno y otro para que, si el navegador
 * muestra diálogo, no se pisen. Si falla alguno, lo descarga para que no se pierda.
 */
export const imprimirDocumentos = async (
  documentos: Array<string | null | undefined>,
  prefijo = 'Ticket',
  opts: { abrirGaveta?: boolean; forzar?: boolean } = {},
) => {
  if (!opts.forzar && !impresionAutomaticaActiva()) return;
  const validos = documentos.filter((d): d is string => !!d);
  // Este equipo no tiene impresora: el ticket se manda a la caja de impresión (PC) en vez de imprimirse aquí
  if (!opts.forzar && impresionRemotaActiva()) {
    if (validos.length > 0) await enviarAEstacion({ tipo: 'PDF', documentos: validos, abrirGaveta: !!opts.abrirGaveta });
    return;
  }
  for (let i = 0; i < validos.length; i++) {
    const ok = await imprimirPdfBase64(validos[i]);
    if (!ok) descargarPdfBase64(validos[i], `${prefijo}_${Date.now()}_${i + 1}.pdf`);
    if (i < validos.length - 1) await new Promise((r) => setTimeout(r, 1500));
  }
};

export interface TicketLocal {
  numeroLocal: number;
  fecha: Date;
  empresa: string;
  items: { descripcion: string; cantidad: number; precio: number }[];
  total: number;
  metodos: string[];
}

const escaparHtml = (t: string) =>
  t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const clp = (n: number) => '$' + Math.round(n).toLocaleString('es-CL');

const ETIQUETA_METODO: Record<string, string> = {
  EFECTIVO: 'Efectivo',
  TARJETA: 'Tarjeta',
  TRANSFERENCIA: 'Transferencia',
};

/**
 * Comprobante interno de una venta hecha sin conexión (80 mm). NO es boleta: la boleta electrónica se emite
 * cuando la venta llega al servidor. Se arma en el propio equipo, sin necesitar internet.
 */
export const imprimirTicketLocal = (t: TicketLocal): Promise<boolean> =>
  new Promise((resolve) => {
    if (!impresionAutomaticaActiva()) {
      resolve(false);
      return;
    }
    const filas = t.items
      .map(
        (i) =>
          `<tr><td colspan="2">${escaparHtml(i.descripcion)}</td></tr>` +
          `<tr><td>${Number(i.cantidad).toLocaleString('es-CL', { maximumFractionDigits: 3 })} x ${clp(i.precio)}</td><td class="d">${clp(Math.round(i.cantidad * i.precio))}</td></tr>`,
      )
      .join('');
    const medios = t.metodos.map((m) => ETIQUETA_METODO[m] ?? m).join(' + ');
    const html = `<!doctype html><html><head><meta charset="utf-8"><style>
      @page{size:80mm auto;margin:3mm}
      body{font-family:monospace;font-size:12px;width:72mm;margin:0;color:#000}
      h1{font-size:14px;text-align:center;margin:0 0 2px}
      p{margin:2px 0}.c{text-align:center}.d{text-align:right}
      table{width:100%;border-collapse:collapse;margin:6px 0}
      hr{border:0;border-top:1px dashed #000;margin:6px 0}
      .t{font-size:15px;font-weight:bold}
    </style></head><body>
      <h1>${escaparHtml(t.empresa)}</h1>
      <p class="c"><b>COMPROBANTE INTERNO</b></p>
      <p class="c">Sin valor tributario. La boleta electrónica se emitirá al restablecerse la conexión.</p>
      <hr>
      <p>N° local: ${t.numeroLocal}</p>
      <p>${t.fecha.toLocaleString('es-CL')}</p>
      <hr>
      <table>${filas}</table>
      <hr>
      <table><tr class="t"><td>TOTAL</td><td class="d">${clp(t.total)}</td></tr></table>
      <p>Pago: ${escaparHtml(medios)}</p>
    </body></html>`;

    const iframe = document.createElement('iframe');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:1px;height:1px;border:0;opacity:0;pointer-events:none;';
    let resuelto = false;
    const terminar = (ok: boolean) => {
      if (resuelto) return;
      resuelto = true;
      resolve(ok);
    };
    iframe.onload = () => {
      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          terminar(true);
        } catch {
          terminar(false);
        }
        setTimeout(() => iframe.remove(), 120000);
      }, 200);
    };
    iframe.srcdoc = html;
    document.body.appendChild(iframe);
    setTimeout(() => terminar(false), 8000);
  });


/** Imprime un HTML de 80 mm en el equipo (mismo mecanismo que el comprobante local). Ignora el interruptor de impresión automática. */
export const imprimirHtml80 = (cuerpo: string): Promise<boolean> =>
  new Promise((resolve) => {
    const html = `<!doctype html><html><head><meta charset="utf-8"><style>
      @page{size:80mm auto;margin:3mm}
      body{font-family:monospace;font-size:12px;width:72mm;margin:0;color:#000}
      h1{font-size:14px;text-align:center;margin:0 0 2px}
      p{margin:2px 0}.c{text-align:center}.d{text-align:right}
      hr{border:0;border-top:1px dashed #000;margin:6px 0}
      .t{font-size:15px;font-weight:bold}
    </style></head><body>${cuerpo}</body></html>`;
    const iframe = document.createElement('iframe');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:1px;height:1px;border:0;opacity:0;pointer-events:none;';
    let resuelto = false;
    const terminar = (ok: boolean) => {
      if (resuelto) return;
      resuelto = true;
      resolve(ok);
    };
    iframe.onload = () => {
      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          terminar(true);
        } catch {
          terminar(false);
        }
        setTimeout(() => iframe.remove(), 120000);
      }, 200);
    };
    iframe.srcdoc = html;
    document.body.appendChild(iframe);
    setTimeout(() => terminar(false), 8000);
  });

export { escaparHtml as escaparHtmlTicket };
