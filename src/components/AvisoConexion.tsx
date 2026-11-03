import { useEffect, useRef, useState } from 'react';
import { EVENTO_CONEXION_RESTABLECIDA } from '../helpers/conexion';

type Estado = 'ok' | 'lenta' | 'sin-conexion';

const API = import.meta.env.VITE_API_URL as string;
const CADA_MS = 30_000; // con todo bien
const CADA_MS_PROBLEMA = 10_000; // mientras hay problema, se revisa más seguido para avisar apenas vuelva
const LENTA_MS = 4_000; // más de esto = "conexión lenta"
const LIMITE_MS = 8_000; // sin respuesta en este tiempo = "sin conexión"
const MENSAJE_RECUPERADA_MS = 4_000;

/** Mide el estado de la conexión con el servidor con una consulta liviana (/auth/salud: público, solo un SELECT 1). */
const medir = async (): Promise<Estado> => {
  const control = new AbortController();
  const corte = setTimeout(() => control.abort(), LIMITE_MS);
  const inicio = performance.now();
  try {
    const r = await fetch(`${API}/auth/salud`, { signal: control.signal, cache: 'no-store' });
    if (!r.ok) return 'sin-conexion';
    return performance.now() - inicio > LENTA_MS ? 'lenta' : 'ok';
  } catch {
    return 'sin-conexion';
  } finally {
    clearTimeout(corte);
  }
};

/**
 * Barra de aviso cuando la conexión con KIPI falla o va lenta. Importante en caja: sin esto, el cajero
 * puede creer que una venta quedó registrada cuando no llegó al servidor.
 */
export const AvisoConexion = () => {
  const [estado, setEstado] = useState<Estado>('ok');
  const [recuperada, setRecuperada] = useState(false);
  const previo = useRef<Estado>('ok');

  useEffect(() => {
    let vivo = true;
    let temporizador: ReturnType<typeof setTimeout> | undefined;
    let aviso: ReturnType<typeof setTimeout> | undefined;

    const aplicar = (nuevo: Estado) => {
      if (!vivo) return;
      if (previo.current !== 'ok' && nuevo === 'ok') {
        setRecuperada(true);
        window.dispatchEvent(new CustomEvent(EVENTO_CONEXION_RESTABLECIDA));
        clearTimeout(aviso);
        aviso = setTimeout(() => vivo && setRecuperada(false), MENSAJE_RECUPERADA_MS);
      } else if (nuevo !== 'ok') {
        setRecuperada(false);
      }
      previo.current = nuevo;
      setEstado(nuevo);
    };

    const ciclo = async () => {
      clearTimeout(temporizador);
      if (document.visibilityState === 'visible') {
        aplicar(await medir());
      }
      if (!vivo) return;
      temporizador = setTimeout(ciclo, previo.current === 'ok' ? CADA_MS : CADA_MS_PROBLEMA);
    };

    const alPerderRed = () => aplicar('sin-conexion');
    const alVolverRed = () => void ciclo();
    const alVolverAVer = () => {
      if (document.visibilityState === 'visible') void ciclo();
    };

    window.addEventListener('offline', alPerderRed);
    window.addEventListener('online', alVolverRed);
    document.addEventListener('visibilitychange', alVolverAVer);
    void ciclo();

    return () => {
      vivo = false;
      clearTimeout(temporizador);
      clearTimeout(aviso);
      window.removeEventListener('offline', alPerderRed);
      window.removeEventListener('online', alVolverRed);
      document.removeEventListener('visibilitychange', alVolverAVer);
    };
  }, []);

  if (estado === 'ok' && !recuperada) return null;

  const [clases, texto] =
    recuperada && estado === 'ok'
      ? ['bg-emerald-50 border-emerald-300 text-emerald-900', 'Conexión restablecida.']
      : estado === 'lenta'
        ? [
            'bg-amber-50 border-amber-300 text-amber-900',
            'Conexión lenta: las ventas pueden tardar en confirmarse. Si una venta no responde, reintenta: el sistema no la cobra dos veces.',
          ]
        : [
            'bg-red-50 border-red-300 text-red-800',
            'Sin conexión con KIPI. Las ventas NO se están guardando: anótalas y regístralas cuando vuelva la conexión. No des por registrada una venta que no mostró confirmación.',
          ];

  return (
    <div role="status" aria-live="polite" className={`sticky top-0 z-30 mb-4 rounded-xl border p-3 text-sm font-semibold shadow-sm ${clases}`}>
      {texto}
    </div>
  );
};
