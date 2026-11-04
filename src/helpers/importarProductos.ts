import type { Tabla } from './lectorTabla';

export type CampoImport =
  | 'codigoBarras' | 'descripcion' | 'precio' | 'costo' | 'stock' | 'stockCritico'
  | 'unidadMedida' | 'categoria' | 'pesable' | 'esInsumo';

export const CAMPOS: { id: CampoImport; etiqueta: string; obligatorio?: boolean; alias: string[] }[] = [
  { id: 'descripcion', etiqueta: 'Nombre', obligatorio: true, alias: ['nombre', 'descripcion', 'producto', 'articulo', 'detalle', 'item'] },
  { id: 'precio', etiqueta: 'Precio de venta', obligatorio: true, alias: ['precio', 'precio venta', 'precio de venta', 'pvp', 'valor', 'venta'] },
  { id: 'codigoBarras', etiqueta: 'Código de barras', alias: ['codigo de barras', 'codigo barras', 'codigo', 'sku', 'ean', 'barras', 'cod'] },
  { id: 'costo', etiqueta: 'Costo', alias: ['costo', 'precio costo', 'precio de costo', 'costo neto', 'compra', 'precio compra'] },
  { id: 'stock', etiqueta: 'Stock', alias: ['stock', 'cantidad', 'existencia', 'existencias', 'inventario', 'saldo'] },
  { id: 'stockCritico', etiqueta: 'Stock crítico', alias: ['stock critico', 'critico', 'stock minimo', 'minimo', 'stock min'] },
  { id: 'unidadMedida', etiqueta: 'Unidad', alias: ['unidad', 'unidad de medida', 'medida', 'um'] },
  { id: 'categoria', etiqueta: 'Categoría', alias: ['categoria', 'rubro', 'familia', 'grupo', 'linea'] },
  { id: 'pesable', etiqueta: 'Se vende a granel', alias: ['granel', 'pesable', 'a granel', 'por peso'] },
  { id: 'esInsumo', etiqueta: 'Tipo (insumo / venta)', alias: ['tipo', 'insumo', 'es insumo'] },
];

const normalizar = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();

/** Para cada columna del archivo, el campo que más probablemente es (o '' si no se reconoce). Sin repetir campos. */
export const detectarColumnas = (encabezados: string[]): (CampoImport | "")[] => {
  const usados = new Set<CampoImport>();
  const resultado: (CampoImport | '')[] = encabezados.map(() => '');
  // Primero coincidencia exacta, luego "contiene"
  for (const modo of ['exacto', 'contiene'] as const) {
    encabezados.forEach((h, i) => {
      if (resultado[i]) return;
      const n = normalizar(h);
      if (!n) return;
      for (const c of CAMPOS) {
        if (usados.has(c.id)) continue;
        const ok = modo === 'exacto' ? c.alias.includes(n) : c.alias.some((a) => a.length > 3 && n.includes(a));
        if (ok) {
          resultado[i] = c.id;
          usados.add(c.id);
          break;
        }
      }
    });
  }
  return resultado;
};

/** "1.290", "$ 1.290", "1290,50", "1,290.50" → número (o null si no se entiende; '' → undefined). */
export const leerNumero = (crudo: string): number | null | undefined => {
  let s = (crudo ?? '').trim().replace(/[$\s]/g, '').replace(/clp/i, '');
  if (s === '') return undefined;
  if (!/^-?[\d.,]+$/.test(s)) return null;
  const puntos = (s.match(/\./g) || []).length;
  const comas = (s.match(/,/g) || []).length;
  if (puntos && comas) {
    // El separador que aparece último es el decimal
    s = s.lastIndexOf(',') > s.lastIndexOf('.') ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '');
  } else if (comas) {
    // En Chile la coma es el decimal ("2,5"); varias comas serían separador de miles
    s = comas === 1 ? s.replace(',', '.') : s.replace(/,/g, '');
  } else if (puntos) {
    // "1.290" = mil doscientos noventa; "1.5" = uno coma cinco
    s = puntos > 1 || /\.\d{3}$/.test(s) ? s.replace(/\./g, '') : s;
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

const SI = ['si', 'sí', 's', 'true', '1', 'x', 'yes'];
export const leerBooleano = (crudo: string): boolean | undefined => {
  const s = (crudo ?? '').trim().toLowerCase();
  if (!s) return undefined;
  return SI.includes(s);
};

export interface FilaImport {
  fila: number;
  codigoBarras?: string;
  descripcion?: string;
  precio?: number | null;
  costo?: number | null;
  stock?: number | null;
  stockCritico?: number | null;
  unidadMedida?: string;
  categoria?: string;
  pesable?: boolean;
  esInsumo?: boolean;
}

/** Convierte la tabla (sin la fila de encabezado) en filas para el servidor, según el mapeo elegido. */
export const construirFilas = (tabla: Tabla, mapeo: (CampoImport | '')[], primeraFila: number): { filas: FilaImport[]; avisos: string[] } => {
  const avisos: string[] = [];
  const filas: FilaImport[] = tabla.map((celdas, idx) => {
    const f: FilaImport = { fila: primeraFila + idx };
    mapeo.forEach((campo, col) => {
      if (!campo) return;
      const v = (celdas[col] ?? '').trim();
      switch (campo) {
        case 'precio': case 'costo': case 'stock': case 'stockCritico': {
          const n = leerNumero(v);
          if (n === null) avisos.push(`Fila ${f.fila}: "${v}" no es un número válido en ${campo}.`);
          (f as unknown as Record<string, unknown>)[campo] = n ?? undefined;
          break;
        }
        case 'pesable': f.pesable = leerBooleano(v); break;
        case 'esInsumo': {
          const t = v.toLowerCase();
          f.esInsumo = t === '' ? undefined : t.startsWith('insumo') || SI.includes(t);
          break;
        }
        case 'codigoBarras': f.codigoBarras = v.replace(/\.0+$/, ''); break; // Excel guarda 7801234567890 como número
        default: (f as unknown as Record<string, unknown>)[campo] = v;
      }
    });
    return f;
  });
  return { filas, avisos: avisos.slice(0, 20) };
};

/** Plantilla descargable (mismas columnas que la exportación de productos). */
export const PLANTILLA_CSV =
  '﻿Código de barras;Nombre;Categoría;Precio;Costo;Stock;Stock crítico;Unidad;Granel;Tipo\r\n' +
  '7801234567890;Leche entera 1 L;Lácteos;1290;950;24;5;UN;No;Producto\r\n' +
  ';Queso casero;Lácteos;9990;6500;3,5;1;KG;Sí;Producto\r\n';

export const descargarTexto = (contenido: string | Blob, nombre: string, tipo = 'text/csv;charset=utf-8') => {
  const blob = contenido instanceof Blob ? contenido : new Blob([contenido], { type: tipo });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
};
