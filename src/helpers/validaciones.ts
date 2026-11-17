// Validación y corrección de datos de formularios. Mismas reglas que el backend (util/Validaciones.java):
// aquí se corrige mientras el usuario escribe y se avisa antes de enviar; el servidor es la barrera final.

import { esRutValido, limpiarRut } from './rut';

/** Quita espacios repetidos y de los extremos. */
export const limpiarTexto = (v: string): string => v.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();

const PARTICULAS = new Set(['de', 'del', 'la', 'las', 'los', 'el', 'y', 'e', 'en', 'a', 'al', 'con', 'van', 'von']);

/** "JUAN PÉREZ DE LA CRUZ" o "juan pérez" → "Juan Pérez de la Cruz". Si ya mezcló mayúsculas, lo respeta. */
export const nombrePropio = (v: string): string => {
  const t = limpiarTexto(v);
  if (!t || (t !== t.toLowerCase() && t !== t.toUpperCase())) return t;
  return t
    .toLowerCase()
    .split(' ')
    .map((w, i) => (i > 0 && PARTICULAS.has(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' ');
};

/** RUT en vivo: 12345678k → 12.345.678-K (máximo 9 caracteres). */
export const formatearRutEnVivo = (v: string): string => {
  const l = limpiarRut(v).slice(0, 9);
  if (l.length <= 1) return l;
  return `${l.slice(0, -1).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}-${l.slice(-1)}`;
};

/** Formato que se envía al servidor ("12.345.678-5"), o null si el RUT es inválido. */
export const rutParaEnviar = (v: string): string | null => (esRutValido(v) ? formatearRutEnVivo(v) : null);

export const errorRut = (v: string, obligatorio = true, nombre = 'El RUT'): string | null => {
  if (!limpiarRut(v)) return obligatorio ? `${nombre} es obligatorio.` : null;
  return esRutValido(v) ? null : `${nombre} no es válido. Revisa los números y el dígito verificador.`;
};

// ---------------------------------------------------------------------------------------------- correo

const CORREO = /^[a-z0-9](?:[a-z0-9._%+'-]*[a-z0-9])?@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/;

export const normalizarCorreo = (v: string): string => v.replace(/\s+/g, '').toLowerCase();

const ERRORES_DOMINIO: Record<string, string> = {
  'gmial.com': 'gmail.com', 'gmai.com': 'gmail.com', 'gmail.con': 'gmail.com', 'gamil.com': 'gmail.com',
  'gmail.cl': 'gmail.com', 'gnail.com': 'gmail.com', 'gmail.co': 'gmail.com', 'gmaill.com': 'gmail.com',
  'hotmial.com': 'hotmail.com', 'hotmai.com': 'hotmail.com', 'hotmail.con': 'hotmail.com', 'hotmal.com': 'hotmail.com',
  'outlok.com': 'outlook.com', 'outlook.con': 'outlook.com', 'outloo.com': 'outlook.com',
  'yahooo.com': 'yahoo.com', 'yaho.com': 'yahoo.com', 'yahoo.con': 'yahoo.com',
  'icloud.con': 'icloud.com', 'iclod.com': 'icloud.com',
};

/** Si el dominio parece un error de tipeo común, devuelve el correo corregido sugerido. */
export const sugerirCorreo = (v: string): string | null => {
  const c = normalizarCorreo(v);
  const i = c.lastIndexOf('@');
  if (i < 1) return null;
  const arreglo = ERRORES_DOMINIO[c.slice(i + 1)];
  return arreglo ? `${c.slice(0, i)}@${arreglo}` : null;
};

export const errorCorreo = (v: string, obligatorio = true, nombre = 'El correo'): string | null => {
  const c = normalizarCorreo(v);
  if (!c) return obligatorio ? `${nombre} es obligatorio.` : null;
  if (c.length > 150 || c.includes('..') || !CORREO.test(c)) return `${nombre} no es válido (ejemplo: nombre@correo.cl).`;
  const s = sugerirCorreo(c);
  return s ? `${nombre} parece mal escrito. ¿Quisiste decir ${s}?` : null;
};

// ------------------------------------------------------------------------------------------- teléfono

/** Deja solo dígitos y + mientras escribe (el formato final lo da telefonoParaEnviar). */
export const filtrarTelefono = (v: string): string => v.replace(/[^0-9+\s()-]/g, '').slice(0, 20);

const digitosTelefono = (v: string): string => {
  let d = v.replace(/\D/g, '');
  if (d.startsWith('56') && d.length === 11) d = d.slice(2);
  if (d.length === 10 && d.startsWith('0')) d = d.slice(1);
  return d;
};

/** "+56 9 1234 5678" (celular), "+56 2 2345 6789" (Santiago) o "+56 32 234 5678"; null si no es válido. */
export const telefonoParaEnviar = (v: string): string | null => {
  const d = digitosTelefono(v);
  if (!/^[2-9]\d{8}$/.test(d)) return null;
  if (d.startsWith('9')) return `+56 9 ${d.slice(1, 5)} ${d.slice(5)}`;
  if (d.startsWith('2')) return `+56 2 ${d.slice(1, 5)} ${d.slice(5)}`;
  return `+56 ${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5)}`;
};

export const errorTelefono = (v: string, obligatorio = false, nombre = 'El teléfono'): string | null => {
  if (!v.trim()) return obligatorio ? `${nombre} es obligatorio.` : null;
  return telefonoParaEnviar(v) ? null : `${nombre} no es válido. Usa 9 dígitos, por ejemplo +56 9 1234 5678.`;
};

// --------------------------------------------------------------------------------- usuario y contraseña

export const filtrarUsuario = (v: string): string => v.replace(/[^A-Za-z0-9._-]/g, '').slice(0, 50);

export const errorUsuario = (v: string): string | null =>
  /^[A-Za-z0-9._-]{3,50}$/.test(v.trim())
    ? null
    : 'El usuario debe tener entre 3 y 50 caracteres: letras, números, punto, guion o guion bajo (sin espacios ni tildes).';

export const errorContrasena = (v: string): string | null => {
  if (v.length < 8 || v.length > 100) return 'La contraseña debe tener entre 8 y 100 caracteres.';
  if (v !== v.trim()) return 'La contraseña no puede empezar ni terminar con espacios.';
  if (!/\p{L}/u.test(v) || !/\d/.test(v)) return 'La contraseña debe incluir al menos una letra y un número.';
  return null;
};

// ------------------------------------------------------------------------------------ textos y números

export const errorTexto = (v: string, nombre: string, min: number, max: number, obligatorio = true): string | null => {
  const t = limpiarTexto(v);
  if (!t) return obligatorio ? `${nombre} es obligatorio.` : null;
  if (t.length < min) return `${nombre} debe tener al menos ${min} caracteres.`;
  if (t.length > max) return `${nombre} no puede superar los ${max} caracteres.`;
  return null;
};

/** Código de barras / interno: letras, números y . _ - / */
export const filtrarCodigo = (v: string): string => v.replace(/[^A-Za-z0-9._\-/]/g, '').slice(0, 50);

/** Solo dígitos (montos en pesos, cantidades enteras). */
export const soloDigitos = (v: string, max = 9): string => v.replace(/\D/g, '').slice(0, max);

/** Número con hasta `decimales` decimales; acepta coma o punto. Devuelve texto limpio para el input. */
export const filtrarDecimal = (v: string, decimales = 3): string => {
  const t = v.replace(',', '.').replace(/[^0-9.]/g, '');
  const [entero, ...resto] = t.split('.');
  if (resto.length === 0) return entero.slice(0, 9);
  return `${entero.slice(0, 9)}.${resto.join('').slice(0, decimales)}`;
};

export const MAX_DINERO = 99_999_999;
export const MAX_CANTIDAD = 9_999_999;

export const errorMonto = (v: string | number, nombre: string, obligatorio = true): string | null => {
  if (v === '' || v === null || v === undefined) return obligatorio ? `${nombre} es obligatorio.` : null;
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) return `${nombre} no es válido.`;
  if (n > MAX_DINERO) return `${nombre} es demasiado alto (máximo $99.999.999).`;
  return null;
};

export const errorCantidad = (v: string | number, nombre: string, decimales = true): string | null => {
  if (v === '' || v === null || v === undefined) return null;
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) return `${nombre} no es válido.`;
  if (n > MAX_CANTIDAD) return `${nombre} es demasiado alto.`;
  if (!decimales && !Number.isInteger(n)) return `${nombre} debe ser un número entero.`;
  return null;
};

/** Primer error de la lista (los null se ignoran). */
export const primerError = (...errores: (string | null)[]): string | null => errores.find((e) => e) ?? null;
