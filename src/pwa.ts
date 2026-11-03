/** Registra el service worker (solo en producción) para que la app abra sin conexión. */
export const registrarServiceWorker = (): void => {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .catch((e) => console.warn('No se pudo activar el modo sin conexión', e));

    // Pide al navegador que no borre los datos guardados (ventas en espera) si falta espacio
    void navigator.storage?.persist?.().catch(() => undefined);
  });
};
