import { useState } from 'react';
import Swal from 'sweetalert2';
import { apiFetch, leerError } from '../helpers/apiFetch';
import type { Proveedor } from '../helpers/compras';

const API_URL = import.meta.env.VITE_API_URL as string;
const campo = 'w-full p-2.5 rounded border border-slate-300 focus:border-slate-500 outline-none text-sm bg-white';
const etiqueta = 'block text-xs font-semibold uppercase text-slate-600 mb-1';

interface Props {
  proveedor?: Proveedor | null;
  onCerrar: () => void;
  onGuardado: (p: Proveedor) => void;
}

/** Crear o editar un proveedor. */
export const ModalProveedor = ({ proveedor, onCerrar, onGuardado }: Props) => {
  const [f, setF] = useState({
    nombre: proveedor?.nombre ?? '', rut: proveedor?.rut ?? '', telefono: proveedor?.telefono ?? '',
    email: proveedor?.email ?? '', notas: proveedor?.notas ?? '',
  });
  const [guardando, setGuardando] = useState(false);

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (guardando) return;
    if (!f.nombre.trim()) return Swal.fire('Falta el nombre', 'Escribe el nombre del proveedor.', 'warning');
    setGuardando(true);
    try {
      const res = await apiFetch(`${API_URL}/proveedores${proveedor ? `/${proveedor.id}` : ''}`, {
        method: proveedor ? 'PUT' : 'POST',
        body: JSON.stringify(f),
      });
      if (!res.ok) throw new Error(await leerError(res, 'No se pudo guardar el proveedor.'));
      onGuardado((await res.json()) as Proveedor);
    } catch (err) {
      Swal.fire('No se guardó', err instanceof Error ? err.message : 'Error inesperado.', 'error');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && onCerrar()}>
      <form onSubmit={guardar} className="bg-white rounded shadow-xl w-full max-w-md p-6 space-y-3">
        <h2 className="text-lg font-semibold text-slate-800">{proveedor ? 'Editar proveedor' : 'Nuevo proveedor'}</h2>
        <div><label className={etiqueta}>Nombre *</label><input className={campo} maxLength={150} value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} autoFocus /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={etiqueta}>RUT</label><input className={campo} maxLength={12} value={f.rut} onChange={(e) => setF({ ...f, rut: e.target.value })} placeholder="76.123.456-7" /></div>
          <div><label className={etiqueta}>Teléfono</label><input className={campo} maxLength={40} value={f.telefono} onChange={(e) => setF({ ...f, telefono: e.target.value })} /></div>
        </div>
        <div><label className={etiqueta}>Correo</label><input type="email" className={campo} maxLength={120} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
        <div><label className={etiqueta}>Notas</label><textarea className={campo} rows={2} maxLength={300} value={f.notas} onChange={(e) => setF({ ...f, notas: e.target.value })} placeholder="Días de reparto, condiciones de pago…" /></div>
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onCerrar} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900">Cancelar</button>
          <button disabled={guardando} className="px-4 py-2 text-sm rounded bg-slate-800 hover:bg-slate-900 text-white disabled:opacity-60">{guardando ? 'Guardando…' : 'Guardar'}</button>
        </div>
      </form>
    </div>
  );
};
