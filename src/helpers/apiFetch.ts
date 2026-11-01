import { getToken, limpiarSesion } from './session';

/** Evento global: el backend respondió 402 (cuenta en solo lectura); el layout refresca el estado. */
export const EVENTO_SUSCRIPCION = 'suscripcion-restringida';

/**
 * fetch con JWT automático.
 * - 401: sesión vencida o inválida → se limpia y se manda a /login.
 * - 402: suscripción suspendida/solo lectura → se avisa al layout (evento) y lo maneja quien llama.
 * - 403: falta de permiso para esa acción → NO se expulsa; lo maneja quien llama.
 */
export const apiFetch = async (endpoint: string, opciones: RequestInit = {}) => {
  const token = getToken();

  // Con FormData (subida de archivos) el navegador pone solo el Content-Type con su "boundary"
  const esFormData = typeof FormData !== 'undefined' && opciones.body instanceof FormData;
  const headers = {
    ...(esFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...opciones.headers,
  };

  const respuesta = await fetch(endpoint, { ...opciones, headers });

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
