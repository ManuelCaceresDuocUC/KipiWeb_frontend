/**
 * Impresión de tickets 80 mm desde el navegador.
 *
 * El servidor entrega el PDF en base64; aquí se carga en un iframe oculto y se llama a print().
 * - Con Chrome/Edge iniciado con --kiosk-printing el ticket sale directo a la impresora predeterminada,
 *   sin diálogo (ver LEEME de la etapa 3B).
 * - Sin ese parámetro el navegador muestra el diálogo de impresión (un clic en "Imprimir").
 * - Si el navegador no permite imprimir el iframe, se descarga el PDF como respaldo.
 */

const CLAVE_AUTO = 'kipipos_impresion_auto';

export const impresionAutomaticaActiva = (): boolean => {
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
export const imprimirDocumentos = async (documentos: Array<string | null | undefined>, prefijo = 'Ticket') => {
  if (!impresionAutomaticaActiva()) return;
  const validos = documentos.filter((d): d is string => !!d);
  for (let i = 0; i < validos.length; i++) {
    const ok = await imprimirPdfBase64(validos[i]);
    if (!ok) descargarPdfBase64(validos[i], `${prefijo}_${Date.now()}_${i + 1}.pdf`);
    if (i < validos.length - 1) await new Promise((r) => setTimeout(r, 1500));
  }
};
