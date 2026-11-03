// Cola de ventas hechas sin conexión. Cada venta queda guardada en el equipo (IndexedDB) hasta que el servidor
// la acepta. Dinero ya cobrado: nada se borra salvo que el servidor confirme la venta o el usuario la descarte
// a propósito. Enviar la misma venta dos veces es seguro porque lleva su clave de idempotencia.

import { apiFetch, esErrorDeConexion, leerError } from './apiFetch';
import { operacion, STORE_VENTAS } from './almacenOffline';
import { EVENTO_COLA_VENTAS, EVENTO_VENTAS_SINCRONIZADAS } from './conexion';
import { getSesion } from './session';

export interface VentaPendiente {
  /** Clave de idempotencia de la venta (también es la llave en el almacén). */
  clave: string;
  numeroLocal: number;
  creadaEn: string;
  usuarioId: number;
  usuarioNombre: string;
  empresaId: number;
  total: number;
  metodos: string[];
  items: { descripcion: string; cantidad: number; precio: number }[];
  /** Cuerpo exacto que se envía a /pagos/venta. */
  payload: Record<string, unknown>;
  /** pendiente: se enviará sola. rechazada: el servidor la rechazó y requiere decisión de una persona. */
  estado: 'pendiente' | 'rechazada';
  intentos: number;
  ultimoError?: string;
}

const avisarCambio = () => window.dispatchEvent(new CustomEvent(EVENTO_COLA_VENTAS));

const CLAVE_CORRELATIVO = 'kipi_correlativo_local';

/** Número de comprobante interno de este equipo (1, 2, 3…). Sirve para cuadrar con el papel si hace falta. */
export const siguienteNumeroLocal = (): number => {
  try {
    const n = Number(localStorage.getItem(CLAVE_CORRELATIVO) || '0') + 1;
    localStorage.setItem(CLAVE_CORRELATIVO, String(n));
    return n;
  } catch {
    return Date.now() % 100000;
  }
};

/** Guarda la venta. Si no se puede guardar, FALLA a propósito: nunca se debe decir "guardada" sin estarlo. */
export const agregarVentaPendiente = async (v: VentaPendiente): Promise<void> => {
  await operacion(STORE_VENTAS, 'readwrite', (s) => s.put(v));
  avisarCambio();
};

export const listarVentasPendientes = async (): Promise<VentaPendiente[]> => {
  try {
    const todas = await operacion<VentaPendiente[]>(STORE_VENTAS, 'readonly', (s) => s.getAll());
    return todas.sort((a, b) => a.creadaEn.localeCompare(b.creadaEn));
  } catch {
    return [];
  }
};

/** Ventas pendientes que pertenecen a la sesión actual (misma empresa y mismo usuario). */
export const pendientesDeMiSesion = async (): Promise<VentaPendiente[]> => {
  const s = getSesion();
  if (!s) return [];
  return (await listarVentasPendientes()).filter((v) => v.usuarioId === s.id && v.empresaId === s.empresa.id);
};

export const quitarVentaPendiente = async (clave: string): Promise<void> => {
  await operacion(STORE_VENTAS, 'readwrite', (s) => s.delete(clave));
  avisarCambio();
};

const guardarCambios = async (v: VentaPendiente): Promise<void> => {
  await operacion(STORE_VENTAS, 'readwrite', (s) => s.put(v));
  avisarCambio();
};

/** Devuelve a "pendiente" una venta rechazada para que se intente de nuevo. */
export const reintentarVenta = async (clave: string): Promise<void> => {
  const todas = await listarVentasPendientes();
  const v = todas.find((x) => x.clave === clave);
  if (v) await guardarCambios({ ...v, estado: 'pendiente', ultimoError: undefined });
};

export interface ResultadoSync {
  enviadas: number;
  rechazadas: number;
  restantes: number;
  /** El envío se cortó por falta de conexión o servidor caído: se reintentará solo. */
  cortadoPorConexion: boolean;
}

const TIEMPO_MAX_ENVIO_MS = 40_000;
let enCurso: Promise<ResultadoSync> | null = null;

/** Envía en orden las ventas pendientes de la sesión actual. Si ya hay un envío en curso, se une a ese. */
export const sincronizarCola = (): Promise<ResultadoSync> => {
  if (enCurso) return enCurso;
  enCurso = ejecutar().finally(() => {
    enCurso = null;
  });
  return enCurso;
};

const ejecutar = async (): Promise<ResultadoSync> => {
  const lista = (await pendientesDeMiSesion()).filter((v) => v.estado === 'pendiente');
  const resultado: ResultadoSync = { enviadas: 0, rechazadas: 0, restantes: lista.length, cortadoPorConexion: false };

  for (const v of lista) {
    try {
      const res = await apiFetch(`${import.meta.env.VITE_API_URL}/pagos/venta`, {
        method: 'POST',
        body: JSON.stringify(v.payload),
        timeoutMs: TIEMPO_MAX_ENVIO_MS,
      });

      if (res.ok) {
        await quitarVentaPendiente(v.clave);
        resultado.enviadas++;
        resultado.restantes--;
        continue;
      }
      if (res.status === 401) break; // sesión vencida: apiFetch ya mandó a /login; las ventas siguen guardadas
      const msg = await leerError(res, 'El servidor no pudo registrar la venta');
      if (res.status >= 500) {
        // Falla del servidor, no de la venta: se reintenta más tarde sin marcarla
        await guardarCambios({ ...v, intentos: v.intentos + 1, ultimoError: msg });
        resultado.cortadoPorConexion = true;
        break;
      }
      // 4xx: el servidor entendió la venta y no la acepta (p. ej. caja cerrada, cuenta en solo lectura)
      await guardarCambios({ ...v, estado: 'rechazada', intentos: v.intentos + 1, ultimoError: msg });
      resultado.rechazadas++;
      resultado.restantes--;
      if (res.status === 402) break;
    } catch (e) {
      if (esErrorDeConexion(e)) {
        resultado.cortadoPorConexion = true;
        break;
      }
      throw e;
    }
  }

  if (resultado.enviadas > 0) window.dispatchEvent(new CustomEvent(EVENTO_VENTAS_SINCRONIZADAS));
  return resultado;
};
