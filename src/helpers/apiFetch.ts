import { getToken, limpiarSesion } from './session';

/** Evento global: el backend respondió 402 (cuenta en solo lectura); el layout refresca el estado. */
export const EVENTO_SUSCRIPCION = 'suscripcion-restringida';

/** El navegador no pudo hablar con el servidor: sin señal, servidor caído o respuesta demasiado lenta. */
export class ErrorConexion extends Error {
  readonly porTiempo: boolean;

  constructor(porTiempo: boolean) {
    super(
      porTiempo
        ? 'El servidor tardó demasiado en responder. Revisa tu conexión.'
        : 'No hay conexión con el servidor. Revisa tu internet.',
    );
    this.name = 'ErrorConexion';
    this.porTiempo = porTiempo;
  }
}

export const esErrorDeConexion = (e: unknown): e is ErrorConexion => e instanceof ErrorConexion;

export interface OpcionesApi extends RequestInit {
  /** Si se indica, la petición se corta pasado este tiempo y lanza ErrorConexion (porTiempo = true). */
  timeoutMs?: number;
}

/**
 * fetch con JWT automático.
 * - 401: sesión vencida o inválida → se limpia y se manda a /login.
 * - 402: suscripción suspendida/solo lectura → se avisa al layout (evento) y lo maneja quien llama.
 * - 403: falta de permiso para esa acción → NO se expulsa; lo maneja quien llama.
 * - Sin conexión o tiempo agotado → lanza ErrorConexion (con un mensaje legible en lugar de "Failed to fetch").
 */
export const apiFetch = async (endpoint: string, opciones: OpcionesApi = {}) => {
  const { timeoutMs, ...resto } = opciones;
  const token = getToken();

  // Con FormData (subida de archivos) el navegador pone solo el Content-Type con su "boundary"
  const esFormData = typeof FormData !== 'undefined' && resto.body instanceof FormData;
  const headers = {
    ...(esFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...resto.headers,
  };

  // Tiempo máximo opcional: se combina con la señal de cancelación que ya traiga quien llama
  let signal: AbortSignal | undefined = resto.signal ?? undefined;
  let temporizador: ReturnType<typeof setTimeout> | undefined;
  let agotado = false;
  if (timeoutMs && timeoutMs > 0) {
    const control = new AbortController();
    const externa = resto.signal;
    if (externa) {
      if (externa.aborted) control.abort();
      else externa.addEventListener('abort', () => control.abort(), { once: true });
    }
    temporizador = setTimeout(() => {
      agotado = true;
      control.abort();
    }, timeoutMs);
    signal = control.signal;
  }

  let respuesta: Response;
  try {
    respuesta = await fetch(endpoint, { ...resto, headers, ...(signal ? { signal } : {}) });
  } catch (e) {
    // Si quien llama canceló a propósito, se respeta; todo lo demás es un problema de conexión
    if (e instanceof DOMException && e.name === 'AbortError' && !agotado) throw e;
    throw new ErrorConexion(agotado);
  } finally {
    if (temporizador) clearTimeout(temporizador);
  }

  if (respuesta.status === 401 && token) {
    limpiarSesion();
    if (window.location.pathname !== '/login') {
      window.location.replace('/login');
    }
  }

  if (respuesta.status === 402) {
    window.dispatchEvent(new CustomEvent(EVENTO_SUSCRIPCION));
  }

  return respuesta;
};

/** Extrae un mensaje legible de una respuesta de error (JSON {message} o texto plano). */
export const leerError = async (respuesta: Response, porDefecto = 'Ocurrió un error inesperado'): Promise<string> => {
  try {
    const texto = await respuesta.text();
    if (!texto) return porDefecto;
    try {
      const json = JSON.parse(texto);
      return json.message || json.mensaje || json.error || porDefecto;
    } catch {
      return texto.length < 300 ? texto : porDefecto;
    }
  } catch {
    return porDefecto;
  }
};
