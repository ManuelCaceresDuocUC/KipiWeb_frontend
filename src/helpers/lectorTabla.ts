/**
 * Lector de tablas para la importación: CSV (con ; , o tabulador) y Excel .xlsx. No usa librerías: un .xlsx es un
 * ZIP con XML, que el navegador sabe descomprimir (DecompressionStream). Devuelve la primera hoja como texto.
 */
export type Tabla = string[][];

// ---------------------------------------------------------------------------------------------
// CSV
// ---------------------------------------------------------------------------------------------

/** UTF-8 si es válido; si no, Windows-1252 (el "CSV" de Excel en Chile suele guardarse así y rompe las tildes). */
export const decodificarTexto = (buffer: ArrayBuffer): string => {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buffer);
  } catch {
    return new TextDecoder('windows-1252').decode(buffer);
  }
};

const detectarSeparador = (texto: string): string => {
  const primera = texto.split(/\r?\n/).find((l) => l.trim() !== '') ?? '';
  let mejor = ';';
  let max = -1;
  for (const s of [';', ',', '\t']) {
    // Se ignoran los separadores dentro de comillas
    let dentro = false;
    let n = 0;
    for (const ch of primera) {
      if (ch === '"') dentro = !dentro;
      else if (ch === s && !dentro) n++;
    }
    if (n > max) {
      max = n;
      mejor = s;
    }
  }
  return mejor;
};

export const parsearCsv = (textoOriginal: string): Tabla => {
  const texto = textoOriginal.replace(/^﻿/, '');
  const sep = detectarSeparador(texto);
  const filas: Tabla = [];
  let fila: string[] = [];
  let celda = '';
  let entreComillas = false;

  const cerrarCelda = () => {
    fila.push(celda);
    celda = '';
  };
  const cerrarFila = () => {
    cerrarCelda();
    if (fila.some((c) => c.trim() !== '')) filas.push(fila);
    fila = [];
  };

  for (let i = 0; i < texto.length; i++) {
    const ch = texto[i];
    if (entreComillas) {
      if (ch === '"') {
        if (texto[i + 1] === '"') {
          celda += '"';
          i++;
        } else {
          entreComillas = false;
        }
      } else {
        celda += ch;
      }
    } else if (ch === '"') {
      entreComillas = true;
    } else if (ch === sep) {
      cerrarCelda();
    } else if (ch === '\n') {
      cerrarFila();
    } else if (ch === '\r') {
      if (texto[i + 1] !== '\n') cerrarFila();
    } else {
      celda += ch;
    }
  }
  if (celda !== '' || fila.length > 0) cerrarFila();
  return filas;
};

// ---------------------------------------------------------------------------------------------
// XLSX (ZIP + XML)
// ---------------------------------------------------------------------------------------------

interface EntradaZip {
  metodo: number;
  tamComprimido: number;
  desplazamiento: number;
}

const leerZip = (buf: Uint8Array): Map<string, EntradaZip> => {
  const v = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65_557); i--) {
    if (v.getUint32(i, true) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error('El archivo no es un Excel (.xlsx) válido.');
  const total = v.getUint16(eocd + 10, true);
  let p = v.getUint32(eocd + 16, true);
  const entradas = new Map<string, EntradaZip>();
  const dec = new TextDecoder('utf-8');
  for (let n = 0; n < total; n++) {
    if (v.getUint32(p, true) !== 0x02014b50) throw new Error('El archivo Excel está dañado.');
    const metodo = v.getUint16(p + 10, true);
    const tamComprimido = v.getUint32(p + 20, true);
    const largoNombre = v.getUint16(p + 28, true);
    const largoExtra = v.getUint16(p + 30, true);
    const largoComentario = v.getUint16(p + 32, true);
    const desplazamiento = v.getUint32(p + 42, true);
    const nombre = dec.decode(buf.subarray(p + 46, p + 46 + largoNombre));
    entradas.set(nombre, { metodo, tamComprimido, desplazamiento });
    p += 46 + largoNombre + largoExtra + largoComentario;
  }
  return entradas;
};

type ConstructorDescompresion = new (formato: string) => {
  readable: ReadableStream<Uint8Array>;
  writable: WritableStream<Uint8Array>;
};

const inflar = async (datos: Uint8Array): Promise<Uint8Array> => {
  const DS = (globalThis as unknown as { DecompressionStream?: ConstructorDescompresion }).DecompressionStream;
  if (!DS) throw new Error('Tu navegador no puede abrir archivos Excel. Guarda el archivo como CSV, o actualiza el navegador.');
  const ds = new DS('deflate-raw');
  const escritor = ds.writable.getWriter();
  escritor.write(datos).catch(() => undefined);
  escritor.close().catch(() => undefined);
  return new Uint8Array(await new Response(ds.readable).arrayBuffer());
};

const leerEntrada = async (buf: Uint8Array, zip: Map<string, EntradaZip>, nombre: string): Promise<string | null> => {
  const e = zip.get(nombre);
  if (!e) return null;
  const v = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  if (v.getUint32(e.desplazamiento, true) !== 0x04034b50) throw new Error('El archivo Excel está dañado.');
  const inicio = e.desplazamiento + 30 + v.getUint16(e.desplazamiento + 26, true) + v.getUint16(e.desplazamiento + 28, true);
  const bytes = buf.subarray(inicio, inicio + e.tamComprimido);
  let crudo: Uint8Array;
  if (e.metodo === 0) crudo = bytes;
  else if (e.metodo === 8) crudo = await inflar(bytes);
  else throw new Error('El archivo Excel usa un formato de compresión no soportado.');
  return new TextDecoder('utf-8').decode(crudo);
};

const entidades = (s: string): string =>
  s
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h: string) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d: string) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');

const atributos = (etiqueta: string): Record<string, string> => {
  const r: Record<string, string> = {};
  for (const m of etiqueta.matchAll(/([\w:.-]+)="([^"]*)"/g)) r[m[1]] = m[2];
  return r;
};

const textoDe = (xml: string): string => {
  const sinFonetica = xml.replace(/<rPh\b[\s\S]*?<\/rPh>/g, '');
  let t = '';
  for (const m of sinFonetica.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)) t += m[1];
  return entidades(t);
};

const columnaDe = (ref: string): number => {
  const letras = /^[A-Z]+/i.exec(ref)?.[0].toUpperCase() ?? 'A';
  let n = 0;
  for (const ch of letras) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
};

export const leerXlsx = async (buffer: ArrayBuffer): Promise<Tabla> => {
  const buf = new Uint8Array(buffer);
  const zip = leerZip(buf);

  // Primera hoja según el libro (no siempre es sheet1.xml)
  let rutaHoja = 'xl/worksheets/sheet1.xml';
  const libro = await leerEntrada(buf, zip, 'xl/workbook.xml');
  const rels = await leerEntrada(buf, zip, 'xl/_rels/workbook.xml.rels');
  if (libro && rels) {
    const hoja = /<sheet\b[^>]*>/.exec(libro)?.[0];
    const rid = hoja ? atributos(hoja)['r:id'] : undefined;
    if (rid) {
      for (const m of rels.matchAll(/<Relationship\b[^>]*>/g)) {
        const a = atributos(m[0]);
        if (a.Id === rid && a.Target) {
          rutaHoja = a.Target.startsWith('/') ? a.Target.slice(1) : `xl/${a.Target}`;
          break;
        }
      }
    }
  }
  const xmlHoja = await leerEntrada(buf, zip, rutaHoja);
  if (!xmlHoja) throw new Error('No se encontró la hoja de datos en el Excel.');

  const compartidas: string[] = [];
  const xmlCompartidas = await leerEntrada(buf, zip, 'xl/sharedStrings.xml');
  if (xmlCompartidas) {
    for (const m of xmlCompartidas.matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g)) compartidas.push(textoDe(m[1]));
  }

  const filas: Tabla = [];
  for (const mf of xmlHoja.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)) {
    const fila: string[] = [];
    for (const mc of mf[1].matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const a = atributos(mc[1]);
      const cuerpo = mc[2] ?? '';
      const col = a.r ? columnaDe(a.r) : fila.length;
      const v = /<v\b[^>]*>([\s\S]*?)<\/v>/.exec(cuerpo)?.[1];
      let valor = '';
      if (a.t === 's') valor = v !== undefined ? (compartidas[Number(v)] ?? '') : '';
      else if (a.t === 'inlineStr') valor = textoDe(cuerpo);
      else if (a.t === 'str') valor = v !== undefined ? entidades(v) : '';
      else if (a.t === 'b') valor = v === '1' ? 'true' : 'false';
      else if (a.t === 'e') valor = '';
      else valor = v ?? '';
      while (fila.length < col) fila.push('');
      fila[col] = valor;
    }
    if (fila.some((c) => c.trim() !== '')) filas.push(fila);
  }
  return filas;
};

// ---------------------------------------------------------------------------------------------

/** Lee un archivo del usuario (.xlsx o .csv/.txt) y devuelve su primera hoja como tabla de texto. */
export const leerArchivoTabla = async (archivo: File): Promise<Tabla> => {
  const nombre = archivo.name.toLowerCase();
  if (archivo.size > 15 * 1024 * 1024) throw new Error('El archivo es demasiado grande (máximo 15 MB).');
  const buffer = await archivo.arrayBuffer();
  if (nombre.endsWith('.xlsx') || nombre.endsWith('.xlsm')) return leerXlsx(buffer);
  if (nombre.endsWith('.xls')) {
    throw new Error('Los archivos .xls (Excel antiguo) no se pueden leer. Ábrelo en Excel y guárdalo como .xlsx o como CSV.');
  }
  return parsearCsv(decodificarTexto(buffer));
};
