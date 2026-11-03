/** Eventos y estado compartido de la conexión con el servidor. */

/** Se recuperó la conexión con el servidor (lo emite AvisoConexion). */
export const EVENTO_CONEXION_RESTABLECIDA = 'kipi-conexion-restablecida';
/** Cambió la cola de ventas pendientes de envío (se agregó, envió o quitó alguna). */
export const EVENTO_COLA_VENTAS = 'kipi-cola-ventas';
/** Se enviaron ventas pendientes al servidor: conviene refrescar catálogo y listados. */
export const EVENTO_VENTAS_SINCRONIZADAS = 'kipi-ventas-sincronizadas';

export type EstadoConexion = 'ok' | 'lenta' | 'sin-conexion';

let estadoActual: EstadoConexion = 'ok';

/** Último estado medido por AvisoConexion. */
export const getEstadoConexion = (): EstadoConexion => estadoActual;
export const setEstadoConexion = (e: EstadoConexion): void => {
  estadoActual = e;
};

/** true si ya se sabe que no hay conexión: no vale la pena esperar a que un envío falle por tiempo. */
export const sinConexionSegura = (): boolean =>
  estadoActual === 'sin-conexion' || (typeof navigator !== 'undefined' && navigator.onLine === false);
