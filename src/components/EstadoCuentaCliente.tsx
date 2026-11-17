import { useEffect, useState } from 'react';
import { apiFetch, leerError } from '../helpers/apiFetch';
import type { MovimientoCuenta } from '../types/ventas.types';
import { enviarEstadoCuentaPorCorreo } from '../helpers/documentosVenta';
import { esAdmin } from '../helpers/session';

interface ResumenCliente {
  id: number;
  nombre: string;
  rut: string;
  email?: string | null;
  limiteCredito: number;
  deudaActual: number;
  disponible: number;
}

interface Props {
  clienteId: number;
  onClose: () => void;
}

const ETIQUETA_TIPO: Record<MovimientoCuenta['tipo'], string> = {
  CARGO: 'Venta a crédito',
  ABONO: 'Abono',
  ANULACION: 'Anulación de venta',
  AJUSTE: 'Ajuste',
};

const clp = (n: number) => `$${Math.round(n).toLocaleString('es-CL')}`;

/** Estado de cuenta del cliente: resumen de crédito y cada cargo, abono o ajuste con su saldo. */
export const EstadoCuentaCliente = ({ clienteId, onClose }: Props) => {
  const [cliente, setCliente] = useState<ResumenCliente | null>(null);
  const [movimientos, setMovimientos] = useState<MovimientoCuenta[]>([]);
  const [pagina, setPagina] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);
  const [trabajando, setTrabajando] = useState(false);

  /** Derecho de acceso/portabilidad: baja un archivo con todos los datos que se guardan de este cliente. */
  const descargarDatos = async () => {
    setAviso(null);
    setTrabajando(true);
    try {
      const res = await apiFetch(`${import.meta.env.VITE_API_URL}/clientes/${clienteId}/exportar`);
      if (!res.ok) throw new Error(await leerError(res, 'No se pudieron exportar los datos'));
      const blob = new Blob([JSON.stringify(await res.json(), null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `datos-cliente-${clienteId}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setAviso({ tipo: 'ok', texto: 'Archivo descargado. Entrégalo a la persona que lo pidió.' });
    } catch (e) {
      setAviso({ tipo: 'error', texto: e instanceof Error ? e.message : 'No se pudieron exportar los datos' });
    } finally {
      setTrabajando(false);
    }
  };

  /** Derecho de supresión: borra nombre, RUT, teléfono y correo, pero conserva ventas y movimientos. */
  const eliminarDatosPersonales = async () => {
    if (!window.confirm('Se borrarán el nombre, RUT, teléfono y correo de este cliente. Las ventas y movimientos se conservan sin su identidad. Esta acción no se puede deshacer. ¿Continuar?')) return;
    setAviso(null);
    setTrabajando(true);
    try {
      const res = await apiFetch(`${import.meta.env.VITE_API_URL}/clientes/${clienteId}/anonimizar`, { method: 'POST' });
      if (!res.ok) throw new Error(await leerError(res, 'No se pudieron eliminar los datos'));
      setAviso({ tipo: 'ok', texto: 'Datos personales eliminados.' });
      setPagina(0);
      setCliente((c) => (c ? { ...c, nombre: `Cliente eliminado N° ${c.id}`, rut: '', email: null } : c));
    } catch (e) {
      setAviso({ tipo: 'error', texto: e instanceof Error ? e.message : 'No se pudieron eliminar los datos' });
    } finally {
      setTrabajando(false);
    }
  };

  useEffect(() => {
    let activo = true;
    const cargar = async () => {
      setCargando(true);
      setError(null);
      try {
        const res = await apiFetch(`${import.meta.env.VITE_API_URL}/clientes/${clienteId}/movimientos?page=${pagina}&size=15`);
        if (!res.ok) throw new Error(await leerError(res, 'No se pudo cargar el estado de cuenta'));
        const data = await res.json();
        if (!activo) return;
        setCliente(data.cliente);
        setMovimientos(data.content ?? []);
        setTotalPaginas(data.totalPages ?? 0);
      } catch (e) {
        if (activo) setError(e instanceof Error ? e.message : 'No se pudo cargar el estado de cuenta');
      } finally {
        if (activo) setCargando(false);
      }
    };
    cargar();
    return () => { activo = false; };
  }, [clienteId, pagina]);

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-[60] flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-white rounded shadow-lg border border-slate-200 max-h-[90vh] overflow-y-auto text-sm">
        <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Estado de cuenta</h2>
            {cliente && <p className="text-xs text-slate-500 font-mono">{cliente.nombre} · {cliente.rut}</p>}
          </div>
          <div className="flex items-center gap-3">
            {cliente && (
              <button
                onClick={() => enviarEstadoCuentaPorCorreo(cliente.id, cliente.email)}
                className="text-xs font-medium text-teal-700 border border-teal-300 bg-white hover:bg-teal-50 px-3 py-1.5 rounded"
              >
                Enviar por correo
              </button>
            )}
            <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-2xl leading-none">&times;</button>
          </div>
        </div>

        <div className="p-4">
          {aviso && (
            <p role="status" className={`mb-3 rounded border px-3 py-2 text-xs ${aviso.tipo === 'ok' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-700'}`}>
              {aviso.texto}
            </p>
          )}
          {cliente && (
            <div className="grid grid-cols-3 gap-2 mb-4 text-center font-mono">
              <div className="bg-white p-2 rounded border border-slate-200">
                <span className="block text-[10px] font-sans font-semibold uppercase text-slate-500">Límite</span>
                <span className="font-bold text-slate-800">{clp(cliente.limiteCredito)}</span>
              </div>
              <div className="bg-red-50 p-2 rounded border border-red-200">
                <span className="block text-[10px] font-sans font-semibold uppercase text-red-600">Deuda</span>
                <span className="font-bold text-red-700">{clp(cliente.deudaActual)}</span>
              </div>
              <div className="bg-emerald-50 p-2 rounded border border-emerald-200">
                <span className="block text-[10px] font-sans font-semibold uppercase text-emerald-600">Disponible</span>
                <span className="font-bold text-emerald-700">{clp(cliente.disponible)}</span>
              </div>
            </div>
          )}

          {cargando ? (
            <p className="py-8 text-center text-slate-400">Cargando…</p>
          ) : error ? (
            <p className="py-8 text-center text-red-600">{error}</p>
          ) : movimientos.length === 0 ? (
            <p className="py-8 text-center text-slate-400">Este cliente aún no tiene movimientos de cuenta.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="text-xs uppercase text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-2 pr-3">Fecha</th>
                    <th className="py-2 pr-3">Movimiento</th>
                    <th className="py-2 pr-3 text-right">Monto</th>
                    <th className="py-2 pr-3 text-right">Saldo</th>
                    <th className="py-2">Detalle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {movimientos.map(m => (
                    <tr key={m.id}>
                      <td className="py-2 pr-3 whitespace-nowrap text-slate-500">{new Date(m.fecha).toLocaleString('es-CL')}</td>
                      <td className="py-2 pr-3 font-medium text-slate-800">
                        {ETIQUETA_TIPO[m.tipo] ?? m.tipo}
                        {m.ventaId ? <span className="ml-1 text-xs text-slate-400 font-mono">#{m.ventaId}</span> : null}
                      </td>
                      <td className={`py-2 pr-3 text-right font-mono ${m.monto > 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                        {m.monto > 0 ? '+' : '−'}{clp(Math.abs(m.monto))}
                      </td>
                      <td className="py-2 pr-3 text-right font-mono font-semibold">{clp(m.saldoResultante)}</td>
                      <td className="py-2 text-xs text-slate-500">
                        {[m.metodoPago, m.motivo, m.usuario].filter(Boolean).join(' · ') || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPaginas > 1 && (
            <div className="flex justify-between items-center mt-4">
              <button disabled={pagina === 0} onClick={() => setPagina(pagina - 1)} className="px-3 py-1.5 rounded border border-slate-300 disabled:opacity-40">Anterior</button>
              <span className="text-slate-500">Página {pagina + 1} de {totalPaginas}</span>
              <button disabled={pagina + 1 >= totalPaginas} onClick={() => setPagina(pagina + 1)} className="px-3 py-1.5 rounded border border-slate-300 disabled:opacity-40">Siguiente</button>
            </div>
          )}

          {cliente && esAdmin() && (
            <div className="mt-6 border-t border-slate-100 pt-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Datos personales de este cliente</h3>
              <p className="mt-1 text-xs text-slate-500">
                Si esta persona te pide una copia de sus datos o que los elimines, puedes atenderla desde aquí. Los documentos tributarios ya emitidos se conservan por ley.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  onClick={descargarDatos}
                  disabled={trabajando}
                  className="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Descargar sus datos
                </button>
                <button
                  onClick={eliminarDatosPersonales}
                  disabled={trabajando}
                  className="rounded border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                >
                  Eliminar sus datos personales
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
