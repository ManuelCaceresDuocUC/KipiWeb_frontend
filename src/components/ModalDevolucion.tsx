import { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import { apiFetch, leerError } from '../helpers/apiFetch';
import { formatoCantidad, leerCantidad } from '../helpers/granel';
import type { Movimiento } from '../hooks/useMovimiento';

const API_URL = import.meta.env.VITE_API_URL as string;

interface ItemRegistrado {
  productoId: number;
  descripcion: string;
  cantidad: number;
}

interface DevolucionRegistrada {
  id: number;
  tipo: 'DEVOLUCION' | 'CAMBIO';
  motivo: string;
  nota?: string | null;
  reponeStock?: boolean;
  montoReferencial?: number;
  usuario?: string;
  fechaHora: string;
  items: ItemRegistrado[];
}

interface Props {
  venta: Movimiento;
  esAdmin: boolean;
  onClose: () => void;
  /** Abre el flujo de anulación de la venta (solo administradores). */
  onAnular?: (venta: Movimiento) => void;
}

/**
 * Registro de una devolución o cambio de una venta. Es un registro de control: NO mueve la caja ni la deuda del
 * cliente ni emite documentos. El administrador puede, además, reponer el stock.
 */
export const ModalDevolucion = ({ venta, esAdmin, onClose, onAnular }: Props) => {
  const [previas, setPrevias] = useState<DevolucionRegistrada[]>([]);
  const [cargando, setCargando] = useState(true);
  const [tipo, setTipo] = useState<'DEVOLUCION' | 'CAMBIO'>('DEVOLUCION');
  const [cantidades, setCantidades] = useState<Record<number, string>>({});
  const [motivo, setMotivo] = useState('');
  const [nota, setNota] = useState('');
  const [reponer, setReponer] = useState(false);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const res = await apiFetch(`${API_URL}/devoluciones?ventaId=${venta.id}`);
        if (res.ok && vivo) setPrevias((await res.json()) as DevolucionRegistrada[]);
      } catch {
        /* sin historial: se valida igual en el servidor */
      } finally {
        if (vivo) setCargando(false);
      }
    })();
    return () => {
      vivo = false;
    };
  }, [venta.id]);

  // Por producto: cuánto se vendió, cuánto ya volvió y cuánto queda por devolver
  const lineas = useMemo(() => {
    const devuelto = new Map<number, number>();
    previas.forEach((d) => d.items.forEach((i) => devuelto.set(i.productoId, (devuelto.get(i.productoId) ?? 0) + i.cantidad)));
    const vendido = new Map<number, { descripcion: string; cantidad: number; unidad: string; precio: number }>();
    venta.detalles.forEach((d) => {
      const prev = vendido.get(d.producto.id);
      vendido.set(d.producto.id, {
        descripcion: d.producto.descripcion,
        cantidad: (prev?.cantidad ?? 0) + d.cantidad,
        unidad: d.producto.unidadMedida && d.producto.unidadMedida !== 'UN' ? d.producto.unidadMedida.toLowerCase() : 'und.',
        precio: d.precioUnitario || d.precio || d.producto.precio || 0,
      });
    });
    return [...vendido.entries()].map(([productoId, v]) => ({
      productoId,
      ...v,
      disponible: Math.max(Math.round((v.cantidad - (devuelto.get(productoId) ?? 0)) * 1000) / 1000, 0),
    }));
  }, [previas, venta.detalles]);

  const seleccion = lineas
    .map((l) => ({ l, c: leerCantidad(cantidades[l.productoId] ?? '') }))
    .filter((x): x is { l: (typeof lineas)[number]; c: number } => x.c !== null);
  const excede = seleccion.some((x) => x.c > x.l.disponible + 1e-9);
  const montoRef = seleccion.reduce((a, x) => a + Math.round(x.l.precio * x.c), 0);
  const puede = seleccion.length > 0 && !excede && motivo.trim().length >= 3 && !guardando;

  // Se devuelve TODO lo vendido y nada se había devuelto antes: lo que corresponde es anular la venta
  const devuelveTodo =
    tipo === 'DEVOLUCION' && previas.length === 0 && lineas.length > 0 && lineas.every((l) => {
      const c = seleccion.find((x) => x.l.productoId === l.productoId)?.c ?? 0;
      return c >= l.cantidad - 1e-9;
    });

  const guardar = async () => {
    if (!puede) return;
    if (devuelveTodo && venta.estado !== 'ANULADA') {
      const r = await Swal.fire({
        icon: 'question',
        title: 'Estás devolviendo toda la venta',
        html: '<div style="text-align:left;font-size:13px">Si el cliente devuelve todo y se le reembolsa, lo correcto es <b>anular la venta</b>: repone el stock, corrige la caja y la deuda, y emite la nota de crédito si había boleta.<br><br>Registrar la devolución solo deja una anotación y <b>no mueve la caja</b>.</div>',
        showDenyButton: esAdmin && Boolean(onAnular),
        showCancelButton: true,
        confirmButtonText: 'Solo registrar',
        denyButtonText: 'Anular la venta',
        cancelButtonText: 'Volver',
        denyButtonColor: '#B91C1C',
      });
      if (r.isDenied && onAnular) {
        onClose();
        onAnular(venta);
        return;
      }
      if (!r.isConfirmed) return;
    }
    setGuardando(true);
    try {
      const res = await apiFetch(`${API_URL}/devoluciones`, {
        method: 'POST',
        body: JSON.stringify({
          ventaId: venta.id,
          tipo,
          motivo: motivo.trim(),
          nota: tipo === 'CAMBIO' ? nota.trim() : '',
          reponerStock: esAdmin && reponer,
          items: seleccion.map((x) => ({ productoId: x.l.productoId, cantidad: x.c })),
        }),
      });
      if (!res.ok) throw new Error(await leerError(res, 'No se pudo registrar.'));
      await Swal.fire({
        icon: 'success',
        title: tipo === 'CAMBIO' ? 'Cambio registrado' : 'Devolución registrada',
        text: reponer && esAdmin ? 'Quedó anotado y el stock fue repuesto.' : 'Quedó anotado. No se movió la caja.',
        timer: 2400,
        showConfirmButton: false,
      });
      onClose();
    } catch (e) {
      Swal.fire('No se registró', e instanceof Error ? e.message : 'Error inesperado', 'error');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-label="Devolución o cambio"
        className="bg-white rounded shadow-lg border border-slate-200 w-full max-w-lg max-h-[92vh] overflow-y-auto text-sm">
        <div className="bg-slate-800 p-4 text-white flex justify-between items-center">
          <h3 className="font-semibold text-base">Devolución o cambio · venta #{venta.id}</h3>
          <button onClick={onClose} aria-label="Cerrar" className="font-mono text-lg font-bold leading-none">&times;</button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-xs text-slate-500">
            Esto deja un registro de lo que volvió. <b>No modifica la caja</b> ni la deuda del cliente, y no emite documentos
            tributarios (si la venta tenía boleta, la nota de crédito se gestiona aparte).
          </p>

          {devuelveTodo && (
            <p className="text-xs bg-amber-50 border border-amber-200 text-amber-800 rounded p-2">
              Estás devolviendo toda la venta. Si se reembolsa al cliente, conviene <b>anular la venta</b> en lugar de solo registrar.
            </p>
          )}

          <div className="grid grid-cols-2 gap-2">
            {(['DEVOLUCION', 'CAMBIO'] as const).map((t) => (
              <button key={t} type="button" onClick={() => setTipo(t)}
                className={`py-2 rounded border text-xs font-semibold uppercase tracking-wider ${tipo === t ? 'bg-slate-800 text-white border-slate-800' : 'border-slate-300 text-slate-600 hover:bg-slate-50'}`}>
                {t === 'DEVOLUCION' ? 'Devolución' : 'Cambio'}
              </button>
            ))}
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">Qué vuelve</p>
            {cargando ? (
              <p className="text-slate-500">Cargando…</p>
            ) : (
              <div className="space-y-2">
                {lineas.map((l) => (
                  <div key={l.productoId} className="flex items-center gap-3 border border-slate-200 rounded p-2.5">
                    <div className="flex-1">
                      <p className="font-medium text-slate-800">{l.descripcion}</p>
                      <p className="text-xs text-slate-500">
                        Vendido: {formatoCantidad(l.cantidad)} {l.unidad} · por devolver: {formatoCantidad(l.disponible)}
                      </p>
                    </div>
                    <input
                      type="text" inputMode="decimal" placeholder="0" disabled={l.disponible <= 0}
                      className="w-20 p-2 rounded border border-slate-300 focus:border-slate-500 outline-none font-mono text-right disabled:bg-slate-100"
                      value={cantidades[l.productoId] ?? ''}
                      onChange={(e) => setCantidades({ ...cantidades, [l.productoId]: e.target.value })}
                    />
                  </div>
                ))}
              </div>
            )}
            {excede && <p className="mt-1 text-xs text-red-600">Una cantidad supera lo que queda por devolver.</p>}
            {montoRef > 0 && !excede && (
              <p className="mt-2 text-xs text-slate-600">Valor de lo devuelto (referencial): <b>${montoRef.toLocaleString('es-CL')}</b></p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1" htmlFor="dev-motivo">Motivo</label>
            <input id="dev-motivo" maxLength={255} placeholder="Ej: producto vencido, cliente se arrepintió…"
              className="w-full p-2.5 rounded border border-slate-300 focus:border-slate-500 outline-none"
              value={motivo} onChange={(e) => setMotivo(e.target.value)} />
          </div>

          {tipo === 'CAMBIO' && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1" htmlFor="dev-nota">Qué se entregó a cambio</label>
              <input id="dev-nota" maxLength={255} placeholder="Ej: 1 yogurt frutilla (la diferencia se cobra como una venta aparte)"
                className="w-full p-2.5 rounded border border-slate-300 focus:border-slate-500 outline-none"
                value={nota} onChange={(e) => setNota(e.target.value)} />
            </div>
          )}

          {esAdmin && (
            <label className="flex items-start gap-2 p-3 bg-slate-50 rounded border border-slate-200 cursor-pointer">
              <input type="checkbox" className="mt-0.5" checked={reponer} onChange={(e) => setReponer(e.target.checked)} />
              <span className="text-slate-700">
                Reponer el stock
                <span className="block text-xs text-slate-500">Márcalo solo si la mercadería está en buen estado y vuelve a la venta.</span>
              </span>
            </label>
          )}

          {previas.length > 0 && (
            <div className="pt-3 border-t border-slate-200">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Ya registradas en esta venta</p>
              <ul className="space-y-1.5 text-xs text-slate-600">
                {previas.map((d) => (
                  <li key={d.id}>
                    <b>{d.tipo === 'CAMBIO' ? 'Cambio' : 'Devolución'}</b> · {new Date(d.fechaHora).toLocaleString('es-CL')} ·{' '}
                    {d.items.map((i) => `${formatoCantidad(i.cantidad)} x ${i.descripcion}`).join(', ')} — {d.motivo}
                    {d.usuario ? ` (${d.usuario})` : ''}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button onClick={onClose} className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded font-medium">Cancelar</button>
            <button onClick={guardar} disabled={!puede}
              className="bg-slate-800 hover:bg-slate-900 disabled:bg-slate-200 disabled:text-slate-400 text-white py-2.5 rounded font-medium">
              {guardando ? 'Guardando…' : 'Registrar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
