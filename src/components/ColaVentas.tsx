import { useCallback, useEffect, useRef, useState } from 'react';
import Swal from 'sweetalert2';
import {
  listarVentasPendientes,
  quitarVentaPendiente,
  reintentarVenta,
  sincronizarCola,
  type VentaPendiente,
} from '../helpers/colaVentas';
import { EVENTO_COLA_VENTAS, EVENTO_CONEXION_RESTABLECIDA, sinConexionSegura } from '../helpers/conexion';
import { getSesion } from '../helpers/session';

const REVISAR_CADA_MS = 45_000;
const clp = (n: number) => '$' + Math.round(n).toLocaleString('es-CL');
const hora = (iso: string) => new Date(iso).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });

/**
 * Barra con las ventas guardadas en este equipo que aún no llegan al servidor. Las envía sola al volver la
 * conexión y deja a la vista cualquier venta que el servidor haya rechazado, para que no se pierda dinero de vista.
 */
export const ColaVentas = () => {
  const [ventas, setVentas] = useState<VentaPendiente[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [abierto, setAbierto] = useState(false);
  const vivo = useRef(true);

  const recargar = useCallback(async () => {
    const lista = await listarVentasPendientes();
    if (vivo.current) setVentas(lista);
  }, []);

  const enviar = useCallback(
    async (manual: boolean) => {
      if (!manual && sinConexionSegura()) return;
      setEnviando(true);
      try {
        const r = await sincronizarCola();
        if (manual || r.enviadas > 0) {
          void Swal.fire({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3500,
            icon: r.cortadoPorConexion ? 'warning' : r.rechazadas > 0 ? 'warning' : 'success',
            title: r.cortadoPorConexion
              ? 'Aún sin conexión estable. Se reintentará.'
              : r.enviadas > 0
                ? `${r.enviadas} venta(s) enviada(s) y registrada(s)`
                : r.rechazadas > 0
                  ? 'Hay ventas que el servidor rechazó'
                  : 'No hay ventas por enviar',
          });
        }
      } finally {
        if (vivo.current) setEnviando(false);
        await recargar();
      }
    },
    [recargar],
  );

  useEffect(() => {
    vivo.current = true;
    void recargar();
    void enviar(false); // por si quedaron ventas de una sesión anterior

    const alCambiar = () => void recargar();
    const alVolver = () => void enviar(false);
    window.addEventListener(EVENTO_COLA_VENTAS, alCambiar);
    window.addEventListener(EVENTO_CONEXION_RESTABLECIDA, alVolver);
    window.addEventListener('online', alVolver);
    const reloj = setInterval(() => void enviar(false), REVISAR_CADA_MS);

    return () => {
      vivo.current = false;
      window.removeEventListener(EVENTO_COLA_VENTAS, alCambiar);
      window.removeEventListener(EVENTO_CONEXION_RESTABLECIDA, alVolver);
      window.removeEventListener('online', alVolver);
      clearInterval(reloj);
    };
  }, [recargar, enviar]);

  if (ventas.length === 0) return null;

  const sesion = getSesion();
  const mias = ventas.filter((v) => v.usuarioId === sesion?.id && v.empresaId === sesion?.empresa.id);
  const ajenas = ventas.filter((v) => !mias.includes(v));
  const rechazadas = mias.filter((v) => v.estado === 'rechazada');
  const enEspera = mias.filter((v) => v.estado === 'pendiente');
  const totalEspera = enEspera.reduce((a, v) => a + v.total, 0);

  const descartar = async (v: VentaPendiente) => {
    const r = await Swal.fire({
      icon: 'warning',
      title: '¿Descartar esta venta?',
      html: `Se borrará del equipo y <b>no quedará registrada en KIPI</b>. Hazlo solo si ya la registraste de otra forma.<br><br>Venta N° local ${v.numeroLocal} · ${clp(v.total)}`,
      showCancelButton: true,
      confirmButtonText: 'Sí, descartar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#DC2626',
    });
    if (r.isConfirmed) await quitarVentaPendiente(v.clave);
  };

  const reintentar = async (v: VentaPendiente) => {
    await reintentarVenta(v.clave);
    await enviar(true);
  };

  const clases = rechazadas.length > 0 ? 'bg-red-50 border-red-300 text-red-900' : 'bg-amber-50 border-amber-300 text-amber-900';

  return (
    <div className={`mb-4 rounded-xl border p-3 text-sm shadow-sm ${clases}`}>
      <div className="flex flex-wrap items-center gap-3">
        <p className="flex-1 min-w-[16rem] font-semibold">
          {enEspera.length > 0 && (
            <>
              {enEspera.length} venta(s) guardada(s) en este equipo por {clp(totalEspera)}, esperando envío. Se enviarán solas al volver la conexión.{' '}
            </>
          )}
          {rechazadas.length > 0 && <>{rechazadas.length} venta(s) fueron rechazadas por el servidor: requieren tu revisión. </>}
          {ajenas.length > 0 && (
            <>Hay {ajenas.length} venta(s) de {[...new Set(ajenas.map((v) => v.usuarioNombre))].join(', ')} en este equipo: se enviarán cuando esa persona inicie sesión.</>
          )}
        </p>
        {enEspera.length > 0 && (
          <button
            onClick={() => void enviar(true)}
            disabled={enviando}
            className="rounded-lg bg-slate-900 px-3 py-1.5 font-semibold text-white disabled:opacity-60"
          >
            {enviando ? 'Enviando…' : 'Enviar ahora'}
          </button>
        )}
        <button onClick={() => setAbierto(!abierto)} className="rounded-lg border border-current px-3 py-1.5 font-semibold">
          {abierto ? 'Ocultar detalle' : 'Ver detalle'}
        </button>
      </div>

      {abierto && (
        <ul className="mt-3 space-y-2">
          {ventas.map((v) => {
            const propia = mias.includes(v);
            return (
              <li key={v.clave} className="rounded-lg bg-white/70 p-2 text-slate-800">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold">
                    N° local {v.numeroLocal} · {hora(v.creadaEn)} · {clp(v.total)} · {v.metodos.join(' + ')}
                  </span>
                  <span className="text-xs text-slate-500">{v.usuarioNombre}</span>
                </div>
                <p className="text-xs text-slate-600">
                  {v.items.map((i) => `${i.cantidad} x ${i.descripcion}`).join(', ')}
                </p>
                {v.ultimoError && <p className="mt-1 text-xs font-semibold text-red-700">{v.ultimoError}</p>}
                {propia && v.estado === 'rechazada' && (
                  <div className="mt-2 flex gap-2">
                    <button onClick={() => void reintentar(v)} className="rounded bg-slate-900 px-2 py-1 text-xs font-semibold text-white">
                      Reintentar
                    </button>
                    <button onClick={() => void descartar(v)} className="rounded border border-red-400 px-2 py-1 text-xs font-semibold text-red-700">
                      Descartar
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
