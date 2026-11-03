import { useSyncExternalStore } from 'react';
import { EVENTO_ESTADO_CONEXION, getEstadoConexion, type EstadoConexion } from '../helpers/conexion';

const suscribir = (aviso: () => void) => {
  window.addEventListener(EVENTO_ESTADO_CONEXION, aviso);
  window.addEventListener('online', aviso);
  window.addEventListener('offline', aviso);
  return () => {
    window.removeEventListener(EVENTO_ESTADO_CONEXION, aviso);
    window.removeEventListener('online', aviso);
    window.removeEventListener('offline', aviso);
  };
};

/** Estado actual de la conexión con el servidor; el componente se vuelve a dibujar cuando cambia. */
export const useEstadoConexion = (): EstadoConexion => {
  const estado = useSyncExternalStore(suscribir, getEstadoConexion);
  // El navegador sabe con certeza cuando no hay red, aunque el chequeo periódico aún no lo haya notado
  return typeof navigator !== 'undefined' && navigator.onLine === false ? 'sin-conexion' : estado;
};
