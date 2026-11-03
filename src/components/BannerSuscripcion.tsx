import { useCallback, useEffect, useState } from 'react';
import { apiFetch, EVENTO_SUSCRIPCION, leerError } from '../helpers/apiFetch';
import { activarSuscripcion } from '../helpers/suscripcion';
import { esAdmin } from '../helpers/session';

interface EstadoSuscripcion {
  estado: string;
  modo: 'PLENO' | 'SOLO_LECTURA' | 'DENEGADO';
  mensaje: string | null;
  cancelada: boolean;
  moraDesde: string | null;
  enlacePago: string | null;
  diasPrueba: number | null;
  puedeActivar: boolean;
}

const API = import.meta.env.VITE_API_URL as string;
const REFRESCO_MS = 10 * 60 * 1000;

/** Aviso de estado de la suscripción: mora (ámbar), solo lectura (rojo) o cancelada (azul). Sin aviso si todo está al día. */
export const BannerSuscripcion = () => {
  const [estado, setEstado] = useState<EstadoSuscripcion | null>(null);
  const [revisando, setRevisando] = useState(false);
  const [aviso, setAviso] = useState('');
  const [activando, setActivando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const r = await apiFetch(`${API}/empresa/suscripcion?conLink=true`);
      if (r.ok) setEstado(await r.json());
    } catch {
      /* sin red: se conserva el último estado conocido */
    }
  }, []);

  useEffect(() => {
    cargar();
    const intervalo = window.setInterval(cargar, REFRESCO_MS);
    window.addEventListener(EVENTO_SUSCRIPCION, cargar);
    return () => {
      window.clearInterval(intervalo);
      window.removeEventListener(EVENTO_SUSCRIPCION, cargar);
    };
  }, [cargar]);

  const yaPague = async () => {
    setRevisando(true);
    setAviso('');
    try {
      const r = await apiFetch(`${API}/empresa/suscripcion/sincronizar`, { method: 'POST' });
      if (r.ok) {
        const nuevo: EstadoSuscripcion = await r.json();
        setEstado(nuevo);
        if (nuevo.modo === 'PLENO' && !nuevo.moraDesde) setAviso('¡Listo! Tu pago quedó registrado.');
        else setAviso('Todavía no vemos el pago. Puede tardar unos minutos en reflejarse.');
      } else {
        setAviso(await leerError(r, 'No pudimos revisar tu pago ahora.'));
      }
    } catch {
      setAviso('No pudimos conectar. Inténtalo en unos segundos.');
    } finally {
      setRevisando(false);
    }
  };

  const activar = async () => {
    setActivando(true);
    setAviso('');
    try {
      await activarSuscripcion(estado?.diasPrueba ?? null);
    } catch (e) {
      setAviso(e instanceof Error ? e.message : 'No pudimos iniciar la activación.');
    } finally {
      setActivando(false);
    }
  };

  if (!estado || !estado.mensaje) {
    return aviso ? <p className="mb-4 text-sm text-emerald-700 font-semibold">{aviso}</p> : null;
  }

  const soloLectura = estado.modo !== 'PLENO';
  const enMora = !soloLectura && !!estado.moraDesde;
  const enPrueba = estado.puedeActivar;
  const estilo = soloLectura
    ? 'bg-red-50 border-red-300 text-red-800'
    : enMora
      ? 'bg-amber-50 border-amber-300 text-amber-900'
      : 'bg-blue-50 border-blue-300 text-blue-900';

  return (
    <div role="alert" className={`mb-4 rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center gap-3 ${estilo}`}>
      <p className="flex-1 text-sm font-semibold">{estado.mensaje}</p>
      {enPrueba && (
        esAdmin() ? (
          <button
            onClick={activar}
            disabled={activando}
            className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-bold hover:bg-slate-700 disabled:opacity-50 transition-colors"
          >
            {activando ? 'Conectando…' : 'Activar suscripción'}
          </button>
        ) : (
          <p className="text-xs font-semibold">Pídele a tu administrador que active la suscripción.</p>
        )
      )}
      {!enPrueba && (soloLectura || enMora) && (
        <div className="flex flex-wrap gap-2">
          {estado.enlacePago && (
            <a
              href={estado.enlacePago}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-bold hover:bg-slate-700 transition-colors"
            >
              Pagar ahora
            </a>
          )}
          <button
            onClick={yaPague}
            disabled={revisando}
            className="px-4 py-2 rounded-lg bg-white border border-current text-sm font-bold hover:opacity-80 disabled:opacity-50 transition-opacity"
          >
            {revisando ? 'Revisando…' : 'Ya pagué'}
          </button>
        </div>
      )}
      {aviso && <p className="text-xs font-semibold w-full">{aviso}</p>}
    </div>
  );
};
