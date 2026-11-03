import Swal from 'sweetalert2';
import { apiFetch, leerError } from './apiFetch';
import { PLAN_PRINCIPAL, formatoPrecio } from '../config/planes';

const API = import.meta.env.VITE_API_URL as string;

/**
 * Lleva al administrador a Flow para inscribir su tarjeta y activar la suscripción.
 * Si aún le quedan días de prueba, antes pide confirmación: activar ahora significa que el cobro parte hoy.
 * Lanza Error con un mensaje legible si algo falla. Si el cliente se arrepiente no hace nada.
 */
export const activarSuscripcion = async (diasPrueba: number | null): Promise<void> => {
  if (diasPrueba && diasPrueba > 0) {
    const confirmacion = await Swal.fire({
      icon: 'question',
      title: '¿Activar tu suscripción ahora?',
      html: `Aún te ${diasPrueba === 1 ? 'queda <b>1 día</b>' : `quedan <b>${diasPrueba} días</b>`} de prueba gratuita.
        Si activas ahora, el cobro de <b>${formatoPrecio(PLAN_PRINCIPAL.precioMensual)}</b> parte <b>hoy</b> y se renueva cada mes.
        Si prefieres aprovechar la prueba completa, puedes activar el último día.`,
      showCancelButton: true,
      confirmButtonText: 'Sí, inscribir mi tarjeta',
      cancelButtonText: 'Esperar',
      confirmButtonColor: '#0F172A',
    });
    if (!confirmacion.isConfirmed) return;
  }

  const r = await apiFetch(`${API}/empresa/suscripcion/activar`, { method: 'POST' });
  if (!r.ok) {
    throw new Error(await leerError(r, 'No pudimos iniciar la activación. Inténtalo en unos minutos.'));
  }
  const { urlPago } = (await r.json()) as { urlPago?: string };
  if (!urlPago) throw new Error('No recibimos el enlace de pago. Inténtalo nuevamente.');
  window.location.href = urlPago;
};
