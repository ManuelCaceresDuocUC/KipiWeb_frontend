import { useCallback, useEffect, useState, type FormEvent } from 'react';
import Swal from 'sweetalert2';
import { apiFetch, leerError } from '../helpers/apiFetch';
import { getSesion } from '../helpers/session';

interface UsuarioFila {
  id: number;
  usuario: string;
  correo?: string | null;
  rol: 'admin' | 'vendedor';
  activo: boolean;
  sucursal?: { id: number; nombre: string };
}
interface SucursalOpc { id: number; nombre: string }

type Modal = { modo: 'crear' } | { modo: 'editar'; usuario: UsuarioFila } | null;

const API = import.meta.env.VITE_API_URL as string;
const esCorreoReal = (c?: string | null) => Boolean(c) && !String(c).toLowerCase().endsWith('.local');
const campo = 'w-full p-2.5 rounded border border-slate-300 outline-none text-sm focus:border-slate-500 bg-white';
const enlace = 'text-xs font-semibold text-slate-600 hover:text-slate-900 underline underline-offset-2 disabled:opacity-40 disabled:no-underline';

/** Cuentas del equipo: crear, cambiar rol/sucursal, restablecer contraseña, registrar correo y desactivar. */
export const GestionEquipo = () => {
  const yoId = getSesion()?.id;
  const [usuarios, setUsuarios] = useState<UsuarioFila[]>([]);
  const [sucursales, setSucursales] = useState<SucursalOpc[]>([]);
  const [cargando, setCargando] = useState(true);
  const [modal, setModal] = useState<Modal>(null);
  const [guardando, setGuardando] = useState(false);
  const [form, setForm] = useState({ usuario: '', contrasena: '', correo: '', rol: 'vendedor', sucursalId: '' });
  const [errorForm, setErrorForm] = useState('');

  const cargar = useCallback(async () => {
    try {
      const [ru, rs] = await Promise.all([apiFetch(`${API}/usuarios`), apiFetch(`${API}/inventario/sucursales`)]);
      if (ru.ok) setUsuarios(await ru.json());
      if (rs.ok) setSucursales(await rs.json());
    } catch (e) {
      console.error('No se pudo cargar el equipo', e);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const abrirCrear = () => {
    setForm({ usuario: '', contrasena: '', correo: '', rol: 'vendedor', sucursalId: sucursales[0] ? String(sucursales[0].id) : '' });
    setErrorForm('');
    setModal({ modo: 'crear' });
  };

  const abrirEditar = (u: UsuarioFila) => {
    setForm({ usuario: u.usuario, contrasena: '', correo: '', rol: u.rol, sucursalId: u.sucursal ? String(u.sucursal.id) : '' });
    setErrorForm('');
    setModal({ modo: 'editar', usuario: u });
  };

  const guardar = async (e: FormEvent) => {
    e.preventDefault();
    if (!modal || guardando) return;
    setErrorForm('');
    if (!form.sucursalId) return setErrorForm('Selecciona una sucursal.');
    if (modal.modo === 'crear') {
      if (!/^[\p{L}0-9._-]{3,50}$/u.test(form.usuario.trim())) return setErrorForm('Usuario de 3 a 50 caracteres: letras, números, punto, guion o guion bajo (sin espacios).');
      if (form.contrasena.length < 8) return setErrorForm('La contraseña debe tener al menos 8 caracteres.');
      if (form.correo.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo.trim())) return setErrorForm('El correo no es válido (puedes dejarlo vacío).');
    }
    setGuardando(true);
    try {
      const r = modal.modo === 'crear'
        ? await apiFetch(`${API}/usuarios`, { method: 'POST', body: JSON.stringify({ usuario: form.usuario.trim(), contrasena: form.contrasena, correo: form.correo.trim(), rol: form.rol, sucursalId: Number(form.sucursalId) }) })
        : await apiFetch(`${API}/usuarios/${modal.usuario.id}`, { method: 'PUT', body: JSON.stringify({ rol: form.rol, sucursalId: Number(form.sucursalId) }) });
      if (!r.ok) throw new Error(await leerError(r, 'No se pudo guardar.'));
      setModal(null);
      await cargar();
      Swal.fire({ icon: 'success', title: modal.modo === 'crear' ? 'Usuario creado' : 'Usuario actualizado', timer: 1800, showConfirmButton: false });
    } catch (err) {
      setErrorForm(err instanceof Error ? err.message : 'No se pudo guardar.');
    } finally {
      setGuardando(false);
    }
  };

  const cambiarClave = async (u: UsuarioFila) => {
    const { value: nueva } = await Swal.fire({
      title: `Nueva contraseña para "${u.usuario}"`,
      input: 'password',
      inputLabel: 'Mínimo 8 caracteres. Entrégasela al usuario por un canal seguro.',
      inputAttributes: { autocomplete: 'new-password' },
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#1E293B',
      inputValidator: (v) => (!v || v.length < 8 ? 'La contraseña debe tener al menos 8 caracteres.' : undefined),
    });
    if (!nueva) return;
    const r = await apiFetch(`${API}/usuarios/${u.id}/contrasena`, { method: 'PUT', body: JSON.stringify({ contrasena: nueva }) });
    if (r.ok) Swal.fire({ icon: 'success', title: 'Contraseña actualizada', confirmButtonColor: '#1E293B' });
    else Swal.fire('Error', await leerError(r, 'No se pudo actualizar la contraseña.'), 'error');
  };

  const cambiarCorreo = async (u: UsuarioFila) => {
    const { value: correo } = await Swal.fire({
      title: `Correo de "${u.usuario}"`,
      input: 'email',
      inputValue: esCorreoReal(u.correo) ? u.correo ?? '' : '',
      inputLabel: 'Con un correo real, el usuario podrá recuperar su contraseña por sí mismo.',
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#1E293B',
    });
    if (!correo) return;
    const r = await apiFetch(`${API}/usuarios/${u.id}/correo`, { method: 'PUT', body: JSON.stringify({ correo }) });
    if (r.ok) setUsuarios((prev) => prev.map((x) => (x.id === u.id ? { ...x, correo } : x)));
    else Swal.fire('Error', await leerError(r, 'No se pudo actualizar el correo.'), 'error');
  };

  const cambiarEstado = async (u: UsuarioFila) => {
    const desactivar = u.activo;
    const c = await Swal.fire({
      icon: 'warning',
      title: desactivar ? `¿Desactivar a "${u.usuario}"?` : `¿Activar a "${u.usuario}"?`,
      text: desactivar
        ? 'No podrá iniciar sesión y perderá el acceso en unos segundos. Su historial de ventas y cajas se conserva.'
        : 'Podrá volver a iniciar sesión con su contraseña actual.',
      showCancelButton: true,
      confirmButtonText: desactivar ? 'Sí, desactivar' : 'Sí, activar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: desactivar ? '#B91C1C' : '#1E293B',
    });
    if (!c.isConfirmed) return;
    const r = await apiFetch(`${API}/usuarios/${u.id}/estado`, { method: 'PATCH', body: JSON.stringify({ activo: !u.activo }) });
    if (r.ok) await cargar();
    else Swal.fire('Error', await leerError(r, 'No se pudo cambiar el estado.'), 'error');
  };

  return (
    <div className="bg-white rounded shadow-sm border border-slate-200 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-slate-100 pb-3">
        <h2 className="text-base font-semibold text-slate-800 uppercase tracking-wide">Personal del Sistema</h2>
        <button onClick={abrirCrear} className="bg-slate-800 hover:bg-slate-900 text-white px-3 py-1.5 rounded font-medium text-xs shadow-sm">
          + Nuevo usuario
        </button>
      </div>

      {cargando ? (
        <p className="text-sm text-slate-400 py-6 text-center">Cargando…</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
              <tr>
                <th className="p-3">Usuario</th>
                <th className="p-3">Rol</th>
                <th className="p-3">Sucursal</th>
                <th className="p-3">Correo</th>
                <th className="p-3">Estado</th>
                <th className="p-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {usuarios.map((u) => {
                const soyYo = u.id === yoId;
                return (
                  <tr key={u.id} className={`hover:bg-slate-50 ${u.activo ? '' : 'bg-slate-50 text-slate-400'}`}>
                    <td className="p-3 font-medium">{u.usuario}{soyYo && <span className="ml-2 text-[10px] font-semibold text-slate-400">(tú)</span>}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${u.rol === 'admin' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'}`}>
                        {u.rol === 'admin' ? 'ADMIN' : 'VENDEDOR'}
                      </span>
                    </td>
                    <td className="p-3 text-xs">{u.sucursal?.nombre ?? '—'}</td>
                    <td className="p-3 text-xs">{esCorreoReal(u.correo) ? u.correo : <span className="text-slate-400">Sin correo</span>}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${u.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {u.activo ? 'Activo' : 'Desactivado'}
                      </span>
                    </td>
                    <td className="p-3 text-right whitespace-nowrap space-x-3">
                      <button onClick={() => abrirEditar(u)} disabled={soyYo} className={enlace} title={soyYo ? 'No puedes editar tu propio rol' : ''}>Rol / sucursal</button>
                      <button onClick={() => cambiarCorreo(u)} className={enlace}>Correo</button>
                      <button onClick={() => cambiarClave(u)} className={enlace}>Contraseña</button>
                      <button onClick={() => cambiarEstado(u)} disabled={soyYo} className={`${enlace} ${u.activo ? 'text-red-600' : ''}`}>{u.activo ? 'Desactivar' : 'Activar'}</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) setModal(null); }}>
          <form onSubmit={guardar} role="dialog" aria-modal="true" aria-label={modal.modo === 'crear' ? 'Nuevo usuario' : 'Editar usuario'} className="w-full max-w-md bg-white p-6 rounded shadow-lg border border-slate-200 space-y-3 text-sm">
            <h3 className="text-lg font-semibold text-slate-900 border-b border-slate-100 pb-2">
              {modal.modo === 'crear' ? 'Nuevo usuario' : `Editar "${modal.usuario.usuario}"`}
            </h3>
            {errorForm && <div role="alert" className="rounded bg-red-50 border border-red-200 text-red-700 p-2.5 text-xs">{errorForm}</div>}

            {modal.modo === 'crear' && (
              <>
                <input className={campo} placeholder="Nombre de usuario" autoComplete="off" value={form.usuario} onChange={(e) => setForm({ ...form, usuario: e.target.value })} />
                <input className={campo} type="password" placeholder="Contraseña (mín. 8 caracteres)" autoComplete="new-password" value={form.contrasena} onChange={(e) => setForm({ ...form, contrasena: e.target.value })} />
                <input className={campo} type="email" placeholder="Correo (opcional, para recuperar su contraseña)" autoComplete="off" value={form.correo} onChange={(e) => setForm({ ...form, correo: e.target.value })} />
              </>
            )}

            <select className={campo} value={form.rol} onChange={(e) => setForm({ ...form, rol: e.target.value })}>
              <option value="vendedor">Vendedor / Cajero</option>
              <option value="admin">Administrador</option>
            </select>
            <select className={campo} value={form.sucursalId} onChange={(e) => setForm({ ...form, sucursalId: e.target.value })}>
              <option value="">Selecciona sucursal…</option>
              {sucursales.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
            </select>
            {modal.modo === 'editar' && <p className="text-xs text-slate-500">Los cambios de rol y sucursal aplican en el próximo inicio de sesión del usuario.</p>}

            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setModal(null)} className="flex-1 border border-slate-300 text-slate-700 py-2.5 rounded font-medium hover:bg-slate-50">Cancelar</button>
              <button type="submit" disabled={guardando} className="flex-1 bg-slate-800 hover:bg-slate-900 text-white py-2.5 rounded font-medium disabled:opacity-60">
                {guardando ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
