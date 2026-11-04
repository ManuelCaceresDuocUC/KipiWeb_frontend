import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { apiFetch, leerError } from '../helpers/apiFetch';
import {
  ETIQUETA_ESTADO, clp, fechaCorta, nombreTipo, type CompraResumen, type Proveedor,
} from '../helpers/compras';
import { ModalNuevaCompra } from '../components/ModalNuevaCompra';
import { ModalDetalleCompra } from '../components/ModalDetalleCompra';
import { ModalProveedor } from '../components/ModalProveedor';

const API_URL = import.meta.env.VITE_API_URL as string;

interface Resumen { porPagar: number; vencido: number; comprasDelMes: number; adjuntosHabilitados: boolean }
type Pestana = 'compras' | 'proveedores';

const PERIODOS = [
  { id: '1', nombre: 'Último mes', meses: 1 },
  { id: '3', nombre: 'Últimos 3 meses', meses: 3 },
  { id: '12', nombre: 'Último año', meses: 12 },
];

const desdeISO = (meses: number) => {
  const d = new Date();
  d.setMonth(d.getMonth() - meses);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

/** Compras a proveedores y cuentas por pagar. Solo administradores. */
export const Compras = () => {
  const navigate = useNavigate();
  const esAdmin = (localStorage.getItem('usuarioRol') || '').toLowerCase().trim() === 'admin';
  useEffect(() => { if (!esAdmin) navigate('/home', { replace: true }); }, [esAdmin, navigate]);

  const [pestana, setPestana] = useState<Pestana>('compras');
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [compras, setCompras] = useState<CompraResumen[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [filtroProv, setFiltroProv] = useState<number | ''>('');
  const [filtroEstado, setFiltroEstado] = useState('TODAS');
  const [periodo, setPeriodo] = useState('3');

  const [nueva, setNueva] = useState<{ proveedorId?: number | null } | null>(null);
  const [detalleId, setDetalleId] = useState<number | null>(null);
  const [editando, setEditando] = useState<Proveedor | 'nuevo' | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const meses = PERIODOS.find((p) => p.id === periodo)?.meses ?? 3;
      const q = new URLSearchParams({ desde: desdeISO(meses), estado: filtroEstado });
      if (filtroProv !== '') q.set('proveedorId', String(filtroProv));
      const [rr, rp, rc] = await Promise.all([
        apiFetch(`${API_URL}/compras/resumen`),
        apiFetch(`${API_URL}/proveedores`),
        apiFetch(`${API_URL}/compras?${q.toString()}`),
      ]);
      if (!rr.ok || !rp.ok || !rc.ok) throw new Error(await leerError(!rc.ok ? rc : !rp.ok ? rp : rr, 'No se pudieron cargar las compras.'));
      setResumen((await rr.json()) as Resumen);
      setProveedores((await rp.json()) as Proveedor[]);
      setCompras((await rc.json()) as CompraResumen[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron cargar las compras.');
    } finally {
      setCargando(false);
    }
  }, [periodo, filtroEstado, filtroProv]);

  useEffect(() => { if (esAdmin) void cargar(); }, [cargar, esAdmin]);

  const desactivar = async (p: Proveedor) => {
    const r = await Swal.fire({
      icon: 'question', title: `¿Quitar a ${p.nombre}?`,
      text: 'Dejará de aparecer para nuevas compras. Sus compras anteriores se conservan.',
      showCancelButton: true, confirmButtonText: 'Quitar', cancelButtonText: 'Volver',
    });
    if (!r.isConfirmed) return;
    try {
      const res = await apiFetch(`${API_URL}/proveedores/${p.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(await leerError(res, 'No se pudo quitar el proveedor.'));
      void cargar();
    } catch (e) {
      Swal.fire('Error', e instanceof Error ? e.message : 'No se pudo quitar el proveedor.', 'error');
    }
  };

  const totalPeriodo = useMemo(() => compras.filter((c) => c.estado !== 'ANULADA').reduce((a, c) => a + c.total, 0), [compras]);

  if (!esAdmin) return null;
  const tarjeta = 'bg-white border border-slate-200 rounded shadow-sm p-4';

  return (
    <div className="font-sans text-slate-800 max-w-6xl">
      <div className="mb-6 border-b border-slate-200 pb-4 flex flex-wrap justify-between items-end gap-3">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">Compras y proveedores</h1>
          <p className="text-slate-500 text-sm mt-1">Lo que compras, lo que debes y a quién.</p>
        </div>
        <button onClick={() => setNueva({})} className="bg-slate-800 hover:bg-slate-900 text-white font-medium py-2 px-5 rounded text-sm shadow-sm">Nueva compra</button>
      </div>

      <div className="grid sm:grid-cols-3 gap-3 mb-6">
        <div className={tarjeta}><p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Por pagar</p><p className="text-2xl font-mono font-bold text-slate-900">{resumen ? clp(resumen.porPagar) : '—'}</p></div>
        <div className={tarjeta}><p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Vencido</p><p className={`text-2xl font-mono font-bold ${resumen && resumen.vencido > 0 ? 'text-red-600' : 'text-slate-900'}`}>{resumen ? clp(resumen.vencido) : '—'}</p></div>
        <div className={tarjeta}><p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Comprado este mes</p><p className="text-2xl font-mono font-bold text-slate-900">{resumen ? clp(resumen.comprasDelMes) : '—'}</p></div>
      </div>

      <div className="flex gap-1 bg-slate-100 p-1 rounded w-full sm:w-auto sm:inline-flex mb-4 text-sm">
        {(['compras', 'proveedores'] as Pestana[]).map((t) => (
          <button key={t} onClick={() => setPestana(t)} className={`flex-1 sm:flex-none px-6 py-1.5 rounded font-medium ${pestana === t ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}>
            {t === 'compras' ? 'Compras' : `Proveedores (${proveedores.length})`}
          </button>
        ))}
      </div>

      {error && <p className="p-4 mb-4 bg-red-50 border border-red-200 text-red-700 rounded text-sm">{error}</p>}

      {pestana === 'compras' && (
        <>
          <div className="bg-white p-3 rounded border border-slate-200 mb-3 flex flex-wrap gap-3 items-end text-sm">
            <select className="border border-slate-300 rounded p-2 bg-white" value={filtroProv} onChange={(e) => setFiltroProv(e.target.value ? Number(e.target.value) : '')}>
              <option value="">Todos los proveedores</option>
              {proveedores.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
            <select className="border border-slate-300 rounded p-2 bg-white" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
              <option value="TODAS">Todos los estados</option><option value="POR_PAGAR">Por pagar</option><option value="VENCIDA">Vencidas</option><option value="PAGADA">Pagadas</option><option value="ANULADA">Anuladas</option>
            </select>
            <select className="border border-slate-300 rounded p-2 bg-white" value={periodo} onChange={(e) => setPeriodo(e.target.value)}>
              {PERIODOS.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
            <span className="ml-auto text-slate-500">{compras.length} compras · {clp(totalPeriodo)}</span>
          </div>

          <div className="bg-white rounded border border-slate-200 overflow-x-auto">
            {cargando ? <p className="p-8 text-center text-slate-500">Cargando…</p> : compras.length === 0 ? (
              <p className="p-8 text-center text-slate-400">No hay compras con esos filtros.</p>
            ) : (
              <table className="w-full min-w-[680px] text-sm text-left">
                <thead className="bg-slate-100 text-xs uppercase tracking-wider text-slate-600">
                  <tr><th className="px-4 py-3">Fecha</th><th className="px-4 py-3">Proveedor</th><th className="px-4 py-3">Documento</th><th className="px-4 py-3 text-right">Total</th><th className="px-4 py-3 text-right">Falta</th><th className="px-4 py-3">Estado</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {compras.map((c) => (
                    <tr key={c.id} onClick={() => setDetalleId(c.id)} className={`cursor-pointer hover:bg-slate-50 ${c.estado === 'ANULADA' ? 'text-slate-400' : ''}`}>
                      <td className="px-4 py-3 whitespace-nowrap">{fechaCorta(c.fechaDocumento)}</td>
                      <td className="px-4 py-3 font-medium">{c.proveedor}</td>
                      <td className="px-4 py-3">{nombreTipo(c.tipoDocumento)}{c.folio ? ` ${c.folio}` : ''}{c.tieneAdjunto ? ' 📎' : ''}</td>
                      <td className="px-4 py-3 text-right font-mono">{clp(c.total)}</td>
                      <td className="px-4 py-3 text-right font-mono">{c.saldo > 0 ? clp(c.saldo) : '—'}</td>
                      <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${ETIQUETA_ESTADO[c.estado].clase}`}>{ETIQUETA_ESTADO[c.estado].texto}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {pestana === 'proveedores' && (
        <>
          <div className="flex justify-end mb-3"><button onClick={() => setEditando('nuevo')} className="bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-medium py-1.5 px-4 rounded text-sm">+ Nuevo proveedor</button></div>
          <div className="bg-white rounded border border-slate-200 overflow-x-auto">
            {proveedores.length === 0 ? <p className="p-8 text-center text-slate-400">Aún no tienes proveedores. Crea el primero para registrar compras.</p> : (
              <table className="w-full min-w-[600px] text-sm text-left">
                <thead className="bg-slate-100 text-xs uppercase tracking-wider text-slate-600">
                  <tr><th className="px-4 py-3">Proveedor</th><th className="px-4 py-3">Contacto</th><th className="px-4 py-3 text-right">Comprado</th><th className="px-4 py-3 text-right">Se le debe</th><th className="px-4 py-3" /></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {proveedores.map((p) => (
                    <tr key={p.id}>
                      <td className="px-4 py-3"><p className="font-medium">{p.nombre}</p>{p.rut && <p className="text-xs text-slate-500">{p.rut}</p>}</td>
                      <td className="px-4 py-3 text-slate-600">{[p.telefono, p.email].filter(Boolean).join(' · ') || '—'}</td>
                      <td className="px-4 py-3 text-right font-mono">{clp(p.totalComprado ?? 0)}</td>
                      <td className={`px-4 py-3 text-right font-mono ${(p.adeudado ?? 0) > 0 ? 'text-amber-700 font-semibold' : ''}`}>{clp(p.adeudado ?? 0)}</td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button onClick={() => setNueva({ proveedorId: p.id })} className="text-xs font-semibold text-slate-700 underline mr-3">Comprar</button>
                        <button onClick={() => { setFiltroProv(p.id); setPestana('compras'); }} className="text-xs font-semibold text-slate-700 underline mr-3">Ver compras</button>
                        <button onClick={() => setEditando(p)} className="text-xs font-semibold text-slate-700 underline mr-3">Editar</button>
                        <button onClick={() => desactivar(p)} className="text-xs font-semibold text-red-600 underline">Quitar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {nueva && (
        <ModalNuevaCompra
          proveedores={proveedores}
          adjuntosHabilitados={Boolean(resumen?.adjuntosHabilitados)}
          proveedorInicial={nueva.proveedorId}
          onCerrar={() => setNueva(null)}
          onRegistrada={() => { setNueva(null); void cargar(); }}
          onProveedorCreado={(p) => setProveedores((ps) => [...ps, p].sort((a, b) => a.nombre.localeCompare(b.nombre)))}
        />
      )}
      {detalleId !== null && (
        <ModalDetalleCompra compraId={detalleId} adjuntosHabilitados={Boolean(resumen?.adjuntosHabilitados)} onCerrar={() => setDetalleId(null)} onCambio={() => void cargar()} />
      )}
      {editando && (
        <ModalProveedor proveedor={editando === 'nuevo' ? null : editando} onCerrar={() => setEditando(null)} onGuardado={() => { setEditando(null); void cargar(); }} />
      )}
    </div>
  );
};
