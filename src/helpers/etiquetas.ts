import JsBarcode from 'jsbarcode';

export interface ItemEtiqueta { codigo: string; nombre: string; precio: number; copias: number }
export interface FormatoEtiqueta { id: string; nombre: string; ancho: number; alto: number; columnas: number; filas: number; hoja?: boolean }

/** Medidas en milímetros. "hoja" = varias etiquetas por página A4 (impresora común); el resto, una por etiqueta (térmica). */
export const FORMATOS: FormatoEtiqueta[] = [
  { id: 'termica50x30', nombre: 'Térmica 50 × 30 mm', ancho: 50, alto: 30, columnas: 1, filas: 1 },
  { id: 'termica40x25', nombre: 'Térmica 40 × 25 mm', ancho: 40, alto: 25, columnas: 1, filas: 1 },
  { id: 'a4-3x8', nombre: 'Hoja A4 · 24 etiquetas (3 × 8)', ancho: 70, alto: 37, columnas: 3, filas: 8, hoja: true },
];

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export const formatoPesos = (n: number) => '$' + Math.round(n).toLocaleString('es-CL');

/** EAN-13 válido (13 dígitos con dígito verificador correcto). */
const esEan13 = (c: string) => {
  if (!/^\d{13}$/.test(c)) return false;
  let suma = 0;
  for (let i = 0; i < 12; i++) suma += Number(c[i]) * (i % 2 === 0 ? 1 : 3);
  return (10 - (suma % 10)) % 10 === Number(c[12]);
};

/** SVG del código de barras (EAN-13 si corresponde, si no CODE128), o null si el código no se puede dibujar. */
export const svgCodigo = (codigo: string, altoBarras: number): string | null => {
  const limpio = codigo.trim();
  if (!limpio) return null;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  try {
    JsBarcode(svg, limpio, {
      format: esEan13(limpio) ? 'EAN13' : 'CODE128',
      displayValue: true, fontSize: 12, height: altoBarras, margin: 0, width: 2, textMargin: 1,
    });
  } catch {
    return null;
  }
  svg.setAttribute('style', 'width:100%;height:auto;max-height:100%');
  svg.removeAttribute('width');
  svg.removeAttribute('height');
  return svg.outerHTML;
};

const htmlEtiqueta = (it: ItemEtiqueta, f: FormatoEtiqueta, conPrecio: boolean) => {
  const barras = svgCodigo(it.codigo, f.alto >= 30 ? 40 : 30);
  return `<div class="et"><div class="nom">${esc(it.nombre)}</div>` +
    `<div class="bar">${barras ?? `<span class="sin">${esc(it.codigo || 'Sin código')}</span>`}</div>` +
    (conPrecio ? `<div class="pre">${formatoPesos(it.precio)}</div>` : '') + '</div>';
};

/** Abre el cuadro de impresión con las etiquetas. Devuelve cuántas se generaron. */
export const imprimirEtiquetas = (items: ItemEtiqueta[], f: FormatoEtiqueta, conPrecio: boolean): number => {
  const etiquetas: string[] = [];
  for (const it of items) for (let i = 0; i < Math.max(1, Math.min(500, it.copias)); i++) etiquetas.push(htmlEtiqueta(it, f, conPrecio));
  if (!etiquetas.length) return 0;

  let cuerpo: string;
  if (f.hoja) {
    const porPagina = f.columnas * f.filas;
    const paginas: string[] = [];
    for (let i = 0; i < etiquetas.length; i += porPagina) paginas.push(`<div class="hoja">${etiquetas.slice(i, i + porPagina).join('')}</div>`);
    cuerpo = paginas.join('');
  } else {
    cuerpo = etiquetas.join('');
  }
  const css = f.hoja
    ? `@page{size:A4;margin:10mm 0}.hoja{display:grid;grid-template-columns:repeat(${f.columnas},${f.ancho}mm);grid-auto-rows:${f.alto}mm;justify-content:center;page-break-after:always}`
    : `@page{size:${f.ancho}mm ${f.alto}mm;margin:0}.et{page-break-after:always}`;
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Etiquetas</title><style>
    ${css}
    *{box-sizing:border-box}body{margin:0;font-family:Arial,sans-serif;color:#000}
    .et{width:${f.ancho}mm;height:${f.alto}mm;padding:1.5mm 2mm;overflow:hidden;display:flex;flex-direction:column;align-items:center;justify-content:space-between;text-align:center}
    .nom{font-size:8pt;font-weight:bold;line-height:1.1;max-height:2.3em;overflow:hidden;width:100%}
    .bar{flex:1;min-height:0;width:100%;display:flex;align-items:center;justify-content:center;padding:.5mm 0}
    .bar svg{max-height:100%}.sin{font-size:9pt}.pre{font-size:12pt;font-weight:bold}
  </style></head><body>${cuerpo}</body></html>`;

  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0';
  document.body.appendChild(iframe);
  const doc = iframe.contentDocument;
  if (!doc || !iframe.contentWindow) { iframe.remove(); return 0; }
  doc.open(); doc.write(html); doc.close();
  setTimeout(() => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    setTimeout(() => iframe.remove(), 60_000);
  }, 300);
  return etiquetas.length;
};
