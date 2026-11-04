import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { apiFetch, leerError } from '../helpers/apiFetch';
import { actualizarRazonSocialEnSesion } from '../helpers/session';

const API_URL = import.meta.env.VITE_API_URL as string;

interface Datos {
  rutEmpresa: string;
  razonSocial: string;
  giro: string;
  direccion: string;
  comuna: string;
}

const VACIO: Datos = { rutEmpresa: '', razonSocial: '', giro: '', direccion: '', comuna: '' };

const campo =
  'w-full p-2.5 rounded border border-slate-300 focus:border-slate-500 outline-none text-sm bg-white';
const etiqueta = 'block text-xs font-semibold uppercase text-slate-600 mb-1';

/**
 * Datos de la empresa tal como se registraron. Salen en los tickets y se envían al proveedor de facturación como
 * datos del emisor, por eso conviene que estén correctos. El RUT no se edita aquí.
 */
export const DatosEmpresa = () => {
  const [datos, setDatos] = useState<Datos>(VACIO);
  const [original, setOriginal] = useState<Datos>(VACIO);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const res = await apiFetch(`${API_URL}/empresa/datos`);
        if (!res.ok) throw new Error(await leerError(res, 'No se pudieron cargar los datos.'));
        const d = (await res.json()) as Datos;
        if (vivo) {
          setDatos(d);
          setOriginal(d);
        }
      } catch (e) {
        if (vivo) setError(e instanceof Error ? e.message : 'No se pudieron cargar los datos.');
      } finally {
        if (vivo) setCargando(false);
      }
    })();
    return () => {
      vivo = false;
    };
  }, []);

  const cambio =
    datos.razonSocial !== original.razonSocial ||
    datos.giro !== original.giro ||
    datos.direccion !== original.direccion ||
    datos.comuna !== original.comuna;

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cambio || guardando) return;
    setGuardando(true);
    try {
      const res = await apiFetch(`${API_URL}/empresa/datos`, {
        method: 'PUT',
        body: JSON.stringify({
          razonSocial: datos.razonSocial,
          giro: datos.giro,
          direccion: datos.direccion,
          comuna: datos.comuna,
        }),
      });
      if (!res.ok) throw new Error(await leerError(res, 'No se pudieron guardar los datos.'));
      const nuevo = (await res.json()) as Datos;
      setDatos(nuevo);
      setOriginal(nuevo);
      actualizarRazonSocialEnSesion(nuevo.razonSocial);
      Swal.fire({
        icon: 'success',
        title: 'Datos actualizados',
        text: 'Se usarán en los próximos tickets y boletas.',
        timer: 2200,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire('No se guardó', err instanceof Error ? err.message : 'Error inesperado', 'error');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="bg-white rounded shadow-sm border border-slate-200 p-6">
      <h2 className="text-base font-semibold text-slate-800 uppercase tracking-wide mb-1">Datos de la empresa</h2>
      <p className="text-slate-500 text-xs mb-4 border-b border-slate-100 pb-3">
        Aparecen en tus tickets y se envían a tu proveedor de facturación como datos del emisor. Revisa que coincidan con
        los de tu inicio de actividades en el SII.
      </p>

      {cargando ? (
        <p className="text-sm text-slate-500">Cargando…</p>
      ) : error ? (
        <p className="text-sm text-red-700">{error}</p>
      ) : (
        <form onSubmit={guardar} className="space-y-3">
          <div>
            <label className={etiqueta} htmlFor="emp-rut">RUT</label>
            <input id="emp-rut" className={`${campo} bg-slate-100 text-slate-500 font-mono`} value={datos.rutEmpresa} disabled readOnly />
            <p className="text-[11px] text-slate-500 mt-1">
              El RUT no se puede cambiar desde aquí. Si necesitas corregirlo, escríbenos a kipisofts@gmail.com.
            </p>
          </div>
          <div>
            <label className={etiqueta} htmlFor="emp-razon">Razón social o nombre del negocio</label>
            <input id="emp-razon" className={campo} value={datos.razonSocial} maxLength={150} required
              onChange={(e) => setDatos({ ...datos, razonSocial: e.target.value })} />
          </div>
          <div>
            <label className={etiqueta} htmlFor="emp-giro">Giro</label>
            <input id="emp-giro" className={campo} value={datos.giro} maxLength={80} placeholder="Ej: Venta al por menor de lácteos"
              onChange={(e) => setDatos({ ...datos, giro: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={etiqueta} htmlFor="emp-dir">Dirección</label>
              <input id="emp-dir" className={campo} value={datos.direccion} maxLength={100}
                onChange={(e) => setDatos({ ...datos, direccion: e.target.value })} />
            </div>
            <div>
              <label className={etiqueta} htmlFor="emp-com">Comuna</label>
              <input id="emp-com" className={campo} value={datos.comuna} maxLength={60}
                onChange={(e) => setDatos({ ...datos, comuna: e.target.value })} />
            </div>
          </div>
          <button type="submit" disabled={!cambio || guardando}
            className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded text-xs uppercase tracking-wider transition-colors">
            {guardando ? 'Guardando…' : 'Guardar cambios'}
          </button>
          <p className="text-[11px] text-slate-500">
            Los cambios quedan en el registro de actividad. Los documentos ya emitidos no cambian.
          </p>
        </form>
      )}
    </div>
  );
};
