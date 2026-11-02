import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '../helpers/apiFetch';

interface Evento {
  id: number;
  fecha: string;
  usuario: string | null;
  accion: string;
  detalle: string | null;
  ip: string | null;
}

const ETIQUETAS: Record<string, string> = {
  USUARIO_CREADO: 'Usuario creado',
  USUARIO_EDITADO: 'Rol / sucursal',
  USUARIO_ACTIVADO: 'Usuario activado',
  USUARIO_DESACTIVADO: 'Usuario desactivado',
  USUARIO_CLAVE: 'Contraseña restablecida',
  USUARIO_CORREO: 'Correo cambiado',
  VENTA_ANULADA: 'Venta anulada',
  DTE_CONFIG: 'Facturación electrónica',
};

const formatearFecha = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

/** Últimas acciones sensibles de la empresa: quién hizo qué y cuándo (solo administradores). */
export const RegistroActividad = () => {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [abierto, setAbierto] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const res = await apiFetch(`${import.meta.env.VITE_API_URL}/admin/auditoria`);
      if (!res.ok) throw new Error();
      setEventos(await res.json());
    } catch {
      setError('No se pudo cargar el registro de actividad.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    if (abierto) cargar();
  }, [abierto, cargar]);

  return (
    <div className="bg-white rounded shadow-sm border border-slate-200 p-6">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        className="w-full flex items-center justify-between text-left"
      >
        <h2 className="text-base font-semibold text-slate-800 uppercase tracking-wide">Registro de actividad</h2>
        <span className="text-xs font-semibold text-slate-500">{abierto ? 'Ocultar' : 'Ver últimas acciones'}</span>
      </button>

      {abierto && (
        <div className="mt-4">
          {cargando && <p className="text-sm text-slate-400 py-4 text-center">Cargando…</p>}
          {error && <p role="alert" className="text-sm text-red-600 py-2">{error}</p>}
          {!cargando && !error && eventos.length === 0 && (
            <p className="text-sm text-slate-400 py-4 text-center">Aún no hay acciones registradas.</p>
          )}
          {eventos.length > 0 && (
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium sticky top-0">
                  <tr>
                    <th className="p-2.5">Fecha</th>
                    <th className="p-2.5">Usuario</th>
                    <th className="p-2.5">Acción</th>
                    <th className="p-2.5">Detalle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {eventos.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-50 align-top">
                      <td className="p-2.5 whitespace-nowrap text-xs text-slate-500">{formatearFecha(e.fecha)}</td>
                      <td className="p-2.5 font-medium">{e.usuario ?? '—'}</td>
                      <td className="p-2.5 text-xs font-semibold text-slate-700">{ETIQUETAS[e.accion] ?? e.accion}</td>
                      <td className="p-2.5 text-xs text-slate-600">{e.detalle}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
