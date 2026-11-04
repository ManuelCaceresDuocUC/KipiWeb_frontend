import { useState } from 'react';
import Swal from 'sweetalert2';
import { apiFetch, leerError } from '../helpers/apiFetch';
import { descargarTexto } from '../helpers/importarProductos';

const API_URL = import.meta.env.VITE_API_URL as string;

const TIPOS = [
  { id: 'productos', nombre: 'Productos e inventario', rango: false, ayuda: 'Se puede volver a importar tal cual.' },
  { id: 'clientes', nombre: 'Clientes y deudas', rango: false, ayuda: '' },
  { id: 'ventas', nombre: 'Ventas (una fila por producto vendido)', rango: true, ayuda: 'Máximo 1 año por descarga.' },
  { id: 'devoluciones', nombre: 'Devoluciones y cambios', rango: true, ayuda: '' },
  { id: 'movimientos-inventario', nombre: 'Movimientos de inventario', rango: true, ayuda: '' },
] as const;

const hoy = () => new Date().toISOString().slice(0, 10);
const haceUnMes = () => { const d = new Date(); d.setMonth(d.getMonth() - 1); return d.toISOString().slice(0, 10); };

/** Descarga de datos en CSV (se abre en Excel). Solo administradores. */
export const ExportarDatos = () => {
  const [tipo, setTipo] = useState<(typeof TIPOS)[number]['id']>('productos');
  const [desde, setDesde] = useState(haceUnMes());
  const [hasta, setHasta] = useState(hoy());
  const [descargando, setDescargando] = useState(false);
  const actual = TIPOS.find((t) => t.id === tipo)!;

  const descargar = async () => {
    if (actual.rango && desde > hasta) return Swal.fire('Fechas no válidas', 'La fecha "desde" no puede ser posterior a "hasta".', 'warning');
    setDescargando(true);
    try {
      const qs = actual.rango ? `?desde=${desde}&hasta=${hasta}` : '';
      const res = await apiFetch(`${API_URL}/exportar/${tipo}${qs}`, { timeoutMs: 120_000 });
      if (!res.ok) throw new Error(await leerError(res, 'No se pudo generar el archivo.'));
      const blob = await res.blob();
      descargarTexto(blob, `kipi-${tipo}-${hoy()}.csv`);
    } catch (e) {
      Swal.fire('No se pudo exportar', e instanceof Error ? e.message : 'Error inesperado.', 'error');
    } finally {
      setDescargando(false);
    }
  };

  return (
    <div className="bg-white rounded shadow-sm border border-slate-200 p-6">
      <h2 className="text-base font-semibold text-slate-800 uppercase tracking-wide mb-1">Exportar datos</h2>
      <p className="text-xs text-slate-500 mb-4">Descarga tu información en CSV; se abre directo en Excel.</p>
      <div className="space-y-3">
        <select value={tipo} onChange={(e) => setTipo(e.target.value as typeof tipo)} className="w-full p-2.5 rounded border border-slate-300 text-sm bg-white">
          {TIPOS.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
        </select>
        {actual.rango && (
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs font-semibold uppercase text-slate-600">Desde
              <input type="date" value={desde} max={hasta} onChange={(e) => setDesde(e.target.value)} className="mt-1 w-full p-2 rounded border border-slate-300 text-sm font-normal normal-case" /></label>
            <label className="text-xs font-semibold uppercase text-slate-600">Hasta
              <input type="date" value={hasta} min={desde} max={hoy()} onChange={(e) => setHasta(e.target.value)} className="mt-1 w-full p-2 rounded border border-slate-300 text-sm font-normal normal-case" /></label>
          </div>
        )}
        {actual.ayuda && <p className="text-xs text-slate-500">{actual.ayuda}</p>}
        <button onClick={descargar} disabled={descargando} className="w-full bg-slate-800 hover:bg-slate-900 text-white font-medium py-2.5 rounded text-sm disabled:opacity-60">
          {descargando ? 'Generando…' : 'Descargar CSV'}
        </button>
      </div>
    </div>
  );
};
