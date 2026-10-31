import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { apiFetch, leerError } from '../helpers/apiFetch';

interface SucursalInv {
  id: number;
  nombre: string;
  esCasaMatriz: boolean;
  propia: boolean;
}

interface MovimientoFila {
  id: number;
  fecha: string;
  tipo: string;
  cantidad: number;
  stockResultante: number;
  motivo?: string | null;
  producto: string;
  sucursal: string;
  usuario?: string | null;
}

interface Props {
  sucursalId: number | null;
  onCambiarSucursal: (id: number | null) => void;
}

const API = import.meta.env.VITE_API_URL;

/** Selector de sucursal, política de stock negativo e historial de movimientos (solo admin). */
export const PanelStockSucursal = ({ sucursalId, onCambiarSucursal }: Props) => {
  const [sucursales, setSucursales] = useState<SucursalInv[]>([]);
  const [permiteNegativo, setPermiteNegativo] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [verHistorial, setVerHistorial] = useState(false);
  const [movimientos, setMovimientos] = useState<MovimientoFila[]>([]);
  const [pagina, setPagina] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [cargandoHist, setCargandoHist] = useState(false);

  useEffect(() => {
    const cargar = async () => {
      try {
        const [rs, rc] = await Promise.all([
          apiFetch(`${API}/inventario/sucursales`),
          apiFetch(`${API}/inventario/configuracion`),
        ]);
        if (rs.ok) setSucursales(await rs.json());
        if (rc.ok) setPermiteNegativo((await rc.json()).permiteStockNegativo !== false);
      } catch (e) {
        console.error('No se pudo cargar la configuración de inventario', e);
      }
    };
    cargar();
  }, []);

  const sucursalActual = sucursalId ?? sucursales.find(s => s.propia)?.id ?? null;

  const cambiarPolitica = async (valor: boolean) => {
    setGuardando(true);
    try {
      const res = await apiFetch(`${API}/inventario/configuracion`, {
        method: 'PUT',
        body: JSON.stringify({ permiteStockNegativo: valor }),
      });
      if (!res.ok) throw new Error(await leerError(res, 'No se pudo guardar la configuración'));
      setPermiteNegativo(valor);
    } catch (e) {
      Swal.fire('Error', e instanceof Error ? e.message : 'No se pudo guardar la configuración', 'error');
    } finally {
      setGuardando(false);
    }
  };

  const cargarHistorial = async (pag: number) => {
    setCargandoHist(true);
    try {
      const params = new URLSearchParams({ page: String(pag), size: '30' });
      if (sucursalActual) params.set('sucursalId', String(sucursalActual));
      const res = await apiFetch(`${API}/inventario/movimientos?${params.toString()}`);
      if (!res.ok) throw new Error(await leerError(res, 'No se pudo cargar el historial'));
      const data = await res.json();
      setMovimientos(data.content ?? []);
      setTotalPaginas(data.totalPages ?? 0);
      setPagina(pag);
    } catch (e) {
      Swal.fire('Error', e instanceof Error ? e.message : 'No se pudo cargar el historial', 'error');
    } finally {
      setCargandoHist(false);
    }
  };

  const abrirHistorial = () => {
    setVerHistorial(true);
    cargarHistorial(0);
  };

  const colorTipo = (tipo: string) =>
    tipo === 'VENTA' || tipo === 'MERMA' ? 'text-red-600' : tipo === 'ENTRADA' || tipo === 'INICIAL' ? 'text-green-700' : 'text-slate-700';

  return (
    <>
      <div className="w-full max-w-6xl mb-4 flex flex-col md:flex-row md:items-center gap-3 bg-white p-3 rounded shadow-sm border border-slate-200 text-sm">
        <label className="flex items-center gap-2 text-slate-700 font-medium">
          Sucursal
          <select
            className="p-2 rounded border border-slate-300 bg-white outline-none focus:border-slate-500 cursor-pointer"
            value={sucursalActual ?? ''}
            onChange={(e) => onCambiarSucursal(e.target.value ? Number(e.target.value) : null)}
          >
            {sucursales.map(s => (
              <option key={s.id} value={s.id}>
                {s.nombre}{s.esCasaMatriz ? ' (Casa matriz)' : ''}{s.propia ? ' · mía' : ''}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2 text-slate-700 md:ml-auto cursor-pointer">
          <input
            type="checkbox"
            className="w-4 h-4"
            checked={permiteNegativo}
            disabled={guardando}
            onChange={(e) => cambiarPolitica(e.target.checked)}
          />
          Permitir vender sin stock (stock negativo)
        </label>

        <button
          onClick={abrirHistorial}
          className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded font-medium text-xs border border-slate-300 transition-colors"
        >
          Historial de movimientos
        </button>
      </div>

      {verHistorial && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-4xl bg-white p-5 rounded shadow-lg border border-slate-200 max-h-[90vh] overflow-y-auto text-sm">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-3">
              <h2 className="text-lg font-semibold text-slate-900">Historial de movimientos</h2>
              <button onClick={() => setVerHistorial(false)} className="text-slate-500 hover:text-slate-800 text-xl leading-none">×</button>
            </div>
            {cargandoHist ? (
              <p className="py-6 text-center text-slate-400">Cargando…</p>
            ) : movimientos.length === 0 ? (
              <p className="py-6 text-center text-slate-400">Sin movimientos registrados.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="text-xs uppercase text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="py-2 pr-3">Fecha</th>
                      <th className="py-2 pr-3">Producto</th>
                      <th className="py-2 pr-3">Tipo</th>
                      <th className="py-2 pr-3">Cantidad</th>
                      <th className="py-2 pr-3">Stock result.</th>
                      <th className="py-2 pr-3">Motivo</th>
                      <th className="py-2">Usuario</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {movimientos.map(m => (
                      <tr key={m.id}>
                        <td className="py-2 pr-3 whitespace-nowrap text-slate-500">{m.fecha}</td>
                        <td className="py-2 pr-3 font-medium text-slate-800">{m.producto}</td>
                        <td className={`py-2 pr-3 font-semibold ${colorTipo(m.tipo)}`}>{m.tipo}</td>
                        <td className={`py-2 pr-3 ${m.cantidad < 0 ? 'text-red-600' : 'text-green-700'}`}>{m.cantidad > 0 ? `+${m.cantidad}` : m.cantidad}</td>
                        <td className="py-2 pr-3">{m.stockResultante}</td>
                        <td className="py-2 pr-3 text-slate-600">{m.motivo || '—'}</td>
                        <td className="py-2 text-slate-600">{m.usuario || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {totalPaginas > 1 && (
              <div className="flex justify-between items-center mt-4">
                <button disabled={pagina === 0} onClick={() => cargarHistorial(pagina - 1)} className="px-3 py-1.5 rounded border border-slate-300 disabled:opacity-40">Anterior</button>
                <span className="text-slate-500">Página {pagina + 1} de {totalPaginas}</span>
                <button disabled={pagina + 1 >= totalPaginas} onClick={() => cargarHistorial(pagina + 1)} className="px-3 py-1.5 rounded border border-slate-300 disabled:opacity-40">Siguiente</button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
