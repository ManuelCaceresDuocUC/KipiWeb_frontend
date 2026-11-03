// Vales de fiado en papel para cuando no hay conexión. Se generan en el propio equipo (no necesitan internet),
// vienen con número ya impreso y dos copias: una para el local y otra para el cliente.

import { getSesion } from './session';

const K_CORRELATIVO = 'kipi_correlativo_vale';
const K_DISPOSITIVO = 'kipi_codigo_dispositivo';

/** Código corto fijo por equipo (2 letras): evita que dos cajas distintas impriman el mismo número de vale. */
const codigoDispositivo = (): string => {
  try {
    let c = localStorage.getItem(K_DISPOSITIVO);
    if (!c) {
      const letras = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
      c = letras[Math.floor(Math.random() * letras.length)] + letras[Math.floor(Math.random() * letras.length)];
      localStorage.setItem(K_DISPOSITIVO, c);
    }
    return c;
  } catch {
    return 'XX';
  }
};

/** Reserva los próximos números de vale de este equipo, por ejemplo FM-AB-0007. */
const reservarNumeros = (cantidad: number): string[] => {
  let actual = 0;
  try {
    actual = Number(localStorage.getItem(K_CORRELATIVO) || '0');
  } catch {
    /* sin almacenamiento: la numeración parte de 1 */
  }
  const codigo = codigoDispositivo();
  const numeros: string[] = [];
  for (let i = 1; i <= cantidad; i++) numeros.push(`FM-${codigo}-${String(actual + i).padStart(4, '0')}`);
  try {
    localStorage.setItem(K_CORRELATIVO, String(actual + cantidad));
  } catch {
    /* ignorado */
  }
  return numeros;
};

const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const copia = (titulo: string, numero: string, empresa: string, sucursal: string) => `
  <section class="copia">
    <div class="cab"><b>${esc(empresa)}</b><span>${esc(titulo)}</span></div>
    <div class="fila"><b>VALE DE FIADO N° ${esc(numero)}</b><span>Local: ${esc(sucursal)}</span></div>
    <div class="fila"><span>Fecha y hora: ____ / ____ / ______ &nbsp; ____ : ____</span></div>
    <div class="fila"><span>Cliente: ______________________________________</span><span>RUT: ________________</span></div>
    <table>
      <tr><th style="width:52%">Producto</th><th>Cant.</th><th>Precio</th><th>Subtotal</th></tr>
      ${'<tr><td>&nbsp;</td><td></td><td></td><td></td></tr>'.repeat(7)}
    </table>
    <div class="total">TOTAL ADEUDADO: $ ____________________</div>
    <p class="texto">Acepto la deuda detallada en este vale y me comprometo a pagarla en ${esc(empresa)}.</p>
    <div class="firmas">
      <div>______________________<br>Firma del cliente</div>
      <div>______________________<br>Atendió (nombre y firma)</div>
    </div>
  </section>`;

/**
 * Abre el diálogo de impresión con `cantidad` hojas, cada una con un vale de dos copias.
 * Devuelve los números reservados (para que el local los controle).
 */
export const imprimirValesManuales = (cantidad: number): Promise<string[]> =>
  new Promise((resolve) => {
    const n = Math.min(Math.max(Math.floor(cantidad) || 1, 1), 20);
    const sesion = getSesion();
    const empresa = sesion?.empresa.razonSocial ?? 'Comercio';
    const sucursal = sesion?.sucursal?.nombre ?? '';
    const numeros = reservarNumeros(n);

    const hojas = numeros
      .map(
        (num) =>
          `<div class="hoja">${copia('COPIA LOCAL', num, empresa, sucursal)}<div class="corte">✂ - - - - - - - - - - - - - - - - - - - - - - - - - - - -</div>${copia('COPIA CLIENTE', num, empresa, sucursal)}</div>`,
      )
      .join('');

    const html = `<!doctype html><html><head><meta charset="utf-8"><style>
      @page{size:A4;margin:10mm}
      body{font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#000;margin:0}
      .hoja{page-break-after:always;height:277mm;display:flex;flex-direction:column;justify-content:space-between}
      .hoja:last-child{page-break-after:auto}
      .copia{border:1px solid #000;padding:8px 10px;height:128mm;box-sizing:border-box}
      .cab,.fila{display:flex;justify-content:space-between;margin-bottom:6px}
      .cab span{font-weight:bold;border:1px solid #000;padding:1px 6px}
      table{width:100%;border-collapse:collapse;margin:6px 0}
      th,td{border:1px solid #000;padding:3px 4px;height:15px;text-align:left}
      .total{font-weight:bold;font-size:14px;text-align:right;margin:8px 0}
      .texto{margin:6px 0;font-size:11px}
      .firmas{display:flex;justify-content:space-around;margin-top:22px;text-align:center;font-size:11px}
      .corte{text-align:center;color:#555;font-size:11px}
    </style></head><body>${hojas}</body></html>`;

    const iframe = document.createElement('iframe');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:1px;height:1px;border:0;opacity:0;pointer-events:none;';
    iframe.onload = () => {
      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch {
          /* el navegador no permitió imprimir */
        }
        resolve(numeros);
        setTimeout(() => iframe.remove(), 120000);
      }, 300);
    };
    iframe.srcdoc = html;
    document.body.appendChild(iframe);
  });
