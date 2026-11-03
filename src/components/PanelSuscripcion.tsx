import { useCallback, useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { apiFetch, EVENTO_SUSCRIPCION, leerError } from '../helpers/apiFetch';
import { activarSuscripcion } from '../helpers/suscripcion';
import { limpiarSesion, getSesion } from '../helpers/session';
import { esRutValido } from '../helpers/rut';
import { DIAS_PRUEBA, PLAN_PRINCIPAL, formatoPrecio } from '../config/planes';
import { CONTACTO } from '../config/contacto';

interface EstadoSuscripcion {
  estado: string;
  modo: 'PLENO' | 'SOLO_LECTURA' | 'DENEGADO';
  mensaje: string | null;
  cancelada: boolean;
  accesoHasta: string | null;
  pruebaHasta: string | null;
  diasPrueba: number | null;
  puedeActivar: boolean;
}

const API = import.meta.env.VITE_API_URL as string;

const fecha = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';

/** Resumen según el estado: título corto, detalle y color. */
const describir = (e: EstadoSuscripcion): { titulo: string; detalle: string; clases: string } => {
  switch (e.estado) {
    case 'PRUEBA':
      return {
        titulo: 'Prueba gratuita',
        detalle: `Te ${e.diasPrueba === 1 ? 'queda 1 día' : `quedan ${e.diasPrueba ?? ''} días`} (hasta el ${fecha(e.pruebaHasta)}). No se te ha cobrado nada.`,
        clases: 'bg-blue-50 border-blue-200 text-blue-900',
      };
    case 'PRUEBA_VENCIDA':
      return {
        titulo: 'Prueba terminada',
        detalle: 'Tu cuenta está en solo lectura. Activa tu suscripción para volver a vender, o da de baja tu cuenta.',
        clases: 'bg-red-50 border-red-200 text-red-800',
      };
    case 'ACTIVA':
      return {
        titulo: 'Suscripción activa',
        detalle: e.cancelada && e.accesoHasta ? `Cancelada: puedes usar KIPI hasta el ${fecha(e.accesoHasta)}.` : `Plan KIPI · ${formatoPrecio(PLAN_PRINCIPAL.precioMensual)} al mes.`,
        clases: 'bg-emerald-50 border-emerald-200 text-emerald-900',
      };
    case 'EN_MORA':
      return { titulo: 'Pago pendiente', detalle: e.mensaje ?? 'No pudimos cobrar tu suscripción.', clases: 'bg-amber-50 border-amber-200 text-amber-900' };
    default:
      return { titulo: 'Suscripción suspendida', detalle: e.mensaje ?? 'Regulariza el pago para volver a vender.', clases: 'bg-red-50 border-red-200 text-red-800' };
  }
};

/** Estado de la suscripción de la empresa, activación con tarjeta y baja de la cuenta. Solo para administradores. */
export const PanelSuscripcion = () => {
  const [estado, setEstado] = useState<EstadoSuscripcion | null>(null);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [bajaAbierta, setBajaAbierta] = useState(false);
  const [rut, setRut] = useState('');

  const cargar = useCallback(async () => {
    try {
      const r = await apiFetch(`${API}/empresa/suscripcion`);
      if (r.ok) setEstado(await r.json());
    } catch {
      /* sin red: se conserva lo último */
    }
  }, []);

  useEffect(() => {
    cargar();
    window.addEventListener(EVENTO_SUSCRIPCION, cargar);
    return () => window.removeEventListener(EVENTO_SUSCRIPCION, cargar);
  }, [cargar]);

  const activar = async () => {
    setOcupado(true);
    setError('');
    try {
      await activarSuscripcion(estado?.diasPrueba ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos iniciar la activación.');
    } finally {
      setOcupado(false);
    }
  };

  /** Para quien inscribió su tarjeta en Flow pero volvió sin ver la cuenta activa: revisa Flow ahora mismo. */
  const revisarActivacion = async () => {
    setOcupado(true);
    setError('');
    setAviso('');
    try {
      const r = await apiFetch(`${API}/empresa/suscripcion/sincronizar`, { method: 'POST' });
      if (!r.ok) {
        setError(await leerError(r, 'No pudimos revisar tu activación ahora.'));
        return;
      }
      const nuevo = (await r.json()) as EstadoSuscripcion;
      setEstado(nuevo);
      if (nuevo.puedeActivar) {
        setAviso('Todavía no vemos tu tarjeta inscrita. Si ya la inscribiste, espera un minuto e inténtalo de nuevo.');
      } else {
        setAviso('¡Listo! Tu suscripción quedó activa.');
        window.dispatchEvent(new Event(EVENTO_SUSCRIPCION)); // refresca también el aviso superior
      }
    } catch {
      setError('No pudimos conectar. Inténtalo en unos segundos.');
    } finally {
      setOcupado(false);
    }
  };

  const darDeBaja = async () => {
    setError('');
    if (!esRutValido(rut)) {
      setError('Escribe el RUT de tu empresa tal como está registrado.');
      return;
    }
    const sesion = getSesion();
    const confirmacion = await Swal.fire({
      icon: 'warning',
      title: '¿Dar de baja tu cuenta?',
      html: `<div style="text-align:left;font-size:14px;line-height:1.5">
        <p>Se cancelará el cobro y <b>nadie de ${sesion?.empresa.razonSocial ? sesion.empresa.razonSocial.replace(/</g, '&lt;') : 'tu empresa'} podrá entrar</b>.</p>
        <p style="margin-top:8px">Tus datos (ventas, productos, clientes, usuarios) se <b>eliminarán definitivamente</b> pasado un plazo de gracia de 30 días. Hasta entonces, si fue un error, escríbenos y la reactivamos.</p></div>`,
      showCancelButton: true,
      confirmButtonText: 'Sí, dar de baja',
      cancelButtonText: 'No, volver',
      confirmButtonColor: '#B91C1C',
    });
    if (!confirmacion.isConfirmed) return;

    setOcupado(true);
    try {
      const r = await apiFetch(`${API}/empresa/suscripcion/baja`, { method: 'POST', body: JSON.stringify({ rut }) });
      if (!r.ok) {
        setError(await leerError(r, 'No pudimos dar de baja tu cuenta. Inténtalo nuevamente.'));
        return;
      }
      const data = (await r.json()) as { eliminacionDefinitiva?: string };
      await Swal.fire({
        icon: 'success',
        title: 'Cuenta dada de baja',
        text: `Tus datos se eliminarán definitivamente el ${fecha(data.eliminacionDefinitiva ?? null)}. Te enviamos la confirmación por correo.`,
        confirmButtonColor: '#0F172A',
      });
      limpiarSesion();
      window.location.replace('/login');
    } catch {
      setError('No pudimos conectar. Inténtalo en unos segundos.');
    } finally {
      setOcupado(false);
    }
  };

  if (!estado) return null;
  const info = describir(estado);

  return (
    <div className="bg-white rounded shadow-sm border border-slate-200 p-6">
      <h2 className="text-base font-semibold text-slate-800 uppercase tracking-wide mb-4 border-b border-slate-100 pb-3">Tu suscripción</h2>

      <div className={`rounded-lg border p-4 ${info.clases}`}>
        <p className="text-sm font-bold">{info.titulo}</p>
        <p className="text-sm mt-1">{info.detalle}</p>
      </div>

      {estado.puedeActivar && (
        <div className="mt-4">
          <button
            type="button"
            onClick={activar}
            disabled={ocupado}
            className="w-full bg-slate-900 text-white font-bold py-2.5 rounded hover:bg-slate-700 transition-colors disabled:opacity-60 text-sm"
          >
            {ocupado ? 'Conectando con Flow…' : 'Activar suscripción con mi tarjeta'}
          </button>
          <p className="text-xs text-slate-500 mt-2">
            Plan KIPI · {formatoPrecio(PLAN_PRINCIPAL.precioMensual)} al mes. Inscribes la tarjeta en el sitio seguro de Flow y el cobro mensual parte al activarla.
            {estado.estado === 'PRUEBA' && ` Tienes ${DIAS_PRUEBA} días de prueba desde tu registro; puedes esperar hasta el último día.`}
          </p>
        </div>
      )}

      {estado.puedeActivar && (
        <button
          type="button"
          onClick={revisarActivacion}
          disabled={ocupado}
          className="mt-3 text-xs font-semibold text-slate-500 hover:text-slate-800 underline underline-offset-2 disabled:opacity-50"
        >
          ¿Ya inscribiste tu tarjeta y no se activó? Revisar ahora
        </button>
      )}

      {aviso && <p role="status" className="mt-3 text-sm font-semibold text-emerald-700">{aviso}</p>}
      {error && <p role="alert" className="mt-3 text-sm font-semibold text-red-700">{error}</p>}

      {!estado.puedeActivar && (
        <p className="mt-6 border-t border-slate-100 pt-4 text-xs text-slate-500">
          Para cancelar tu suscripción o cerrar tu cuenta, escríbenos a {CONTACTO.correo} y lo hacemos contigo.
        </p>
      )}

      {estado.puedeActivar && (
      <div className="mt-6 border-t border-slate-100 pt-4">
        <button
          type="button"
          onClick={() => setBajaAbierta((v) => !v)}
          aria-expanded={bajaAbierta}
          className="text-xs font-semibold text-slate-500 hover:text-red-700 underline underline-offset-2"
        >
          {bajaAbierta ? 'Cancelar' : 'Dar de baja mi cuenta'}
        </button>

        {bajaAbierta && (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-4 space-y-3">
            <p className="text-sm text-red-900">
              Esto cierra la cuenta, cancela el cobro y programa la <b>eliminación definitiva de todos tus datos</b> (30 días de gracia).
              Para confirmar, escribe el RUT de tu empresa.
            </p>
            <input
              type="text"
              value={rut}
              onChange={(e) => setRut(e.target.value)}
              placeholder="RUT de la empresa, ej: 76123456-7"
              autoComplete="off"
              className="w-full p-2.5 rounded border border-red-300 bg-white focus:outline-none focus:border-red-500 text-sm font-mono"
            />
            <button
              type="button"
              onClick={darDeBaja}
              disabled={ocupado || !rut.trim()}
              className="w-full bg-red-700 text-white font-bold py-2.5 rounded hover:bg-red-800 transition-colors disabled:opacity-50 text-sm"
            >
              {ocupado ? 'Procesando…' : 'Dar de baja mi cuenta'}
            </button>
          </div>
        )}
      </div>
      )}
    </div>
  );
};
