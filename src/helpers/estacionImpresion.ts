/**
 * Impresión remota: un celular (u otro equipo sin impresora) manda el ticket a la "estación de impresión", que es el PC
 * con la impresora y KIPIPOS abierto. Cada equipo tiene UN rol: imprimir aquí, enviar a la caja, o ser la estación.
 */
import { apiFetch, leerError } from './apiFetch';
import type { EventoCaja } from './gaveta';

const K_REMOTO = 'kipipos_imprimir_remoto';
const K_ESTACION = 'kipipos_estacion_impresion';
export const EVENTO_ROL_IMPRESION = 'kipipos-rol-impresion';

export type RolImpresion = 'LOCAL' | 'REMOTA' | 'ESTACION';

const leer = (k: string) => {
  try {
    return localStorage.getItem(k) === '1';
  } catch {
    return false;
  }
};

export const impresionRemotaActiva = (): boolean => leer(K_REMOTO);
export const esEstacionImpresion = (): boolean => leer(K_ESTACION);

export const rolImpresion = (): RolImpresion => (esEstacionImpresion() ? 'ESTACION' : impresionRemotaActiva() ? 'REMOTA' : 'LOCAL');

export const guardarRolImpresion = (rol: RolImpresion) => {
  try {
    localStorage.setItem(K_REMOTO, rol === 'REMOTA' ? '1' : '0');
    localStorage.setItem(K_ESTACION, rol === 'ESTACION' ? '1' : '0');
  } catch {
    /* sin almacenamiento: queda en LOCAL */
  }
  window.dispatchEvent(new Event(EVENTO_ROL_IMPRESION));
};

/** Aviso liviano que no interfiere con los diálogos de la caja. */
export const avisoImpresion = (texto: string) => {
  const el = document.createElement('div');
  el.setAttribute('role', 'status');
  el.className = 'fixed top-4 right-4 z-[9999] max-w-xs rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-lg';
  el.textContent = texto;
  document.body.appendChild(el);
  window.setTimeout(() => el.remove(), 8000);
};

const API = () => `${import.meta.env.VITE_API_URL}/impresion`;

export interface TrabajoImpresion {
  id: string;
  tipo: 'PDF' | 'CAJA';
  documentos: string[];
  evento: EventoCaja | null;
  abrirGaveta: boolean;
  origen: string;
}

export const estacionConectada = async (): Promise<boolean | null> => {
  try {
    const r = await apiFetch(`${API()}/estacion`);
    if (!r.ok) return null;
    return Boolean((await r.json())?.conectada);
  } catch {
    return null;
  }
};

export type EnvioTrabajo =
  | { tipo: 'PDF'; documentos: string[]; abrirGaveta?: boolean }
  | { tipo: 'CAJA'; evento: EventoCaja };

/** Deja el trabajo en la cola de la sucursal. Si no hay estación conectada o falla, avisa y devuelve false. */
export const enviarAEstacion = async (t: EnvioTrabajo): Promise<boolean> => {
  try {
    const r = await apiFetch(`${API()}/trabajos`, { method: 'POST', body: JSON.stringify(t), timeoutMs: 15000 });
    if (!r.ok) throw new Error(await leerError(r, 'No se pudo enviar a la caja de impresión'));
    return true;
  } catch (e) {
    avisoImpresion(
      `${e instanceof Error ? e.message : 'No se pudo enviar a imprimir.'} El ticket NO se imprimió; puedes reimprimirlo desde Movimientos cuando la caja de impresión esté conectada.`,
    );
    return false;
  }
};

export const buscarPendientes = async (): Promise<TrabajoImpresion[] | null> => {
  try {
    const r = await apiFetch(`${API()}/pendientes`, { timeoutMs: 10000 });
    if (!r.ok) return null;
    return (await r.json()) as TrabajoImpresion[];
  } catch {
    return null;
  }
};
