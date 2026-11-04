import { useEffect, useRef, useState } from 'react';
import Swal from 'sweetalert2';
import { apiFetch, leerError } from '../helpers/apiFetch';
import {
  ETIQUETA_ESTADO, clp, fechaCorta, hoyISO, nombreTipo, subirAdjunto, verAdjunto, type CompraDetalle,
} from '../helpers/compras';

const API_URL = import.meta.env.VITE_API_URL as string;

interface Props {
  compraId: number;
  adjuntosHabilitados: boolean;
  onCerrar: () => void;
  onCambio: () => void;
}

/** Detalle de una compra: productos, pagos, documento adjunto; registrar pagos y anular. */
export const ModalDetalleCompra = ({ compraId, adjuntosHabilitados, onCerrar, onCambio }: Props) => {
  const [c, setC] = useState<CompraDetalle | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const entrada = useRef<HTMLInputElement>(null);

  const cargar = async () => {
    try {
      const res = await apiFetch(`${API_URL}/compras/${compraId}`);
      if (!res.ok) throw new Error(await leerError(res, 'No se pudo abrir la compra.'));
      setC((await res.json()) as CompraDetalle);
    } catch (e) {
      await Swal.fire('Error', e instanceof Error ? e.message : 'No se pudo abrir la compra.', 'error');
      onCerrar();
    }
  };
  useEffect(() => { void cargar(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [compraId]);

  const llamar = async (ruta: string, cuerpo: unknown, fallo: string) => {
    setOcupado(true);
    try {
      const res = await apiFetch(`${API_URL}/compras/${compraId}/${ruta}`, { method: 'POST', body: JSON.stringify(cuerpo) });
      if (!res.ok) throw new Error(await leerError(res, fallo));
      setC((await res.json()) as CompraDetalle);
      onCambio();
      return true;
    } catch (e) {
      Swal.fire('No se pudo', e instanceof Error ? e.message : fallo, 'error');
      return false;
    } finally {
      setOcupado(false);
    }
  };

  const pagar = async () => {
    if (!c) return;
    const r = await Swal.fire({
      title: 'Registrar pago al proveedor',
      html: `<div style="text-align:left;font-size:13px;color:#475569;margin-bottom:6px">Saldo pendiente: <b>${clp(c.saldo)}</b></div>` +
        `<input id="pg-monto" type="number" min="1" max="${c.saldo}" class="swal2-input" placeholder="Monto" value="${c.saldo}">` +
        `<select id="pg-metodo" class="swal2-select" style="display:flex;width:80%"><option value="TRANSFERENCIA">Transferencia</option><option value="EFECTIVO">Efectivo</option><option value="OTRO">Otro</option></select>` +
        `<input id="pg-nota" class="swal2-input" maxlength="255" placeholder="Nota (opcional)">`,
      showCancelButton: true, confirmButtonText: 'Registrar pago', cancelButtonText: 'Volver',
      preConfirm: () => {
        const monto = Math.round(Number((document.getElementById('pg-monto') as HTMLInputElement).value));
        if (!(monto > 0) || monto > c.saldo) { Swal.showValidationMessage(`El monto debe estar entre $1 y ${clp(c.saldo)}.`); return false; }
        return {
          monto, metodo: (document.getElementById('pg-metodo') as HTMLSelectElement).value,
          nota: (document.getElementById('pg-nota') as HTMLInputElement).value.trim() || null, fecha: hoyISO(),
        };
      },
    });
    if (r.isConfirmed && r.value) await llamar('pagos', r.value, 'No se pudo registrar el pago.');
  };

  const anular = async () => {
    if (!c) return;
    const r = await Swal.fire({
      title: `Anular compra #${c.id}`,
      html: `<p style="font-size:13px;color:#64748B">${c.ingresoStock ? 'Se descontará del stock lo que había ingresado esta compra. ' : ''}El costo de los productos no se revierte. No se puede deshacer.</p>`,
      input: 'text', inputPlaceholder: 'Motivo (obligatorio)', showCancelButton: true,
      confirmButtonColor: '#B91C1C', confirmButtonText: 'Anular compra', cancelButtonText: 'Volver',
      inputValidator: (v) => (!v || v.trim().length < 3 ? 'Escribe el motivo (mínimo 3 letras).' : undefined),
    });
    if (r.isConfirmed) await llamar('anular', { motivo: String(r.value).trim() }, 'No se pudo anular la compra.');
  };

  const adjuntar = async (f?: File) => {
    if (!f) return;
    setOcupado(true);
    const ok = await subirAdjunto(compraId, f);
    setOcupado(false);
    if (ok) { await cargar(); onCambio(); }
    if (entrada.current) entrada.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-start justify-center p-3 overflow-y-auto" onClick={(e) => e.target === e.currentTarget && onCerrar()}>
      <div className="bg-white rounded shadow-xl w-full max-w-2xl my-4 text-sm">
        <div className="bg-slate-800 text-white p-4 flex justify-between items-center rounded-t">
          <h3 className="font-semibold text-base">Compra #{compraId}</h3>
          <button onClick={onCerrar} aria-label="Cerrar" className="font-mono text-lg font-bold leading-none">&times;</button>
        </div>
        {!c ? <p className="p-8 text-center text-slate-500">Cargando…</p> : (
          <div className="p-5 space-y-4">
            <div className="flex flex-wrap justify-between gap-2">
              <div>
                <p className="font-semibold text-slate-900 text-base">{c.proveedor}</p>
                <p className="text-slate-500">{nombreTipo(c.tipoDocumento)}{c.folio ? ` N° ${c.folio}` : ''} · {fechaCorta(c.fechaDocumento)}</p>
                {c.vencimiento && c.estado !== 'PAGADA' && c.estado !== 'ANULADA' && <p className="text-slate-500">Vence el {fechaCorta(c.vencimiento)}</p>}
              </div>
              <span className={`self-start px-2 py-1 rounded text-[11px] font-semibold uppercase tracking-wider ${ETIQUETA_ESTADO[c.estado].clase}`}>{ETIQUETA_ESTADO[c.estado].texto}</span>
            </div>

            {c.estado === 'ANULADA' && <p className="p-3 rounded border border-slate-200 bg-slate-50 text-xs text-slate-600">Anulada: {c.motivoAnulacion}</p>}

            <div className="border border-slate-200 rounded divide-y divide-slate-100">
              {c.items.map((i) => (
                <div key={i.productoId} className="flex justify-between gap-3 p-2.5">
                  <div className="min-w-0"><p className="font-medium text-slate-800 truncate">{i.descripcion}</p>
                    <p className="text-xs text-slate-500 font-mono">{i.cantidad.toLocaleString('es-CL', { maximumFractionDigits: 3 })} × {clp(i.costoUnitario)}</p></div>
                  <p className="font-mono font-semibold">{clp(i.subtotal)}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500">
              {c.ingresoStock ? 'Ingresó al stock. ' : 'No tocó el stock. '}{c.actualizoCostos ? 'Actualizó el costo de los productos. ' : ''}{c.preciosNetos ? 'Valores netos (+ IVA).' : ''}
            </p>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-slate-50 border border-slate-200 rounded p-2"><p className="text-[10px] uppercase tracking-wider text-slate-500">Total</p><p className="font-mono font-bold">{clp(c.total)}</p></div>
              <div className="bg-slate-50 border border-slate-200 rounded p-2"><p className="text-[10px] uppercase tracking-wider text-slate-500">Pagado</p><p className="font-mono font-bold text-emerald-700">{clp(c.pagado)}</p></div>
              <div className="bg-slate-50 border border-slate-200 rounded p-2"><p className="text-[10px] uppercase tracking-wider text-slate-500">Falta</p><p className="font-mono font-bold text-amber-700">{clp(c.saldo)}</p></div>
            </div>

            {c.pagos.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Pagos</p>
                {c.pagos.map((p) => (
                  <div key={p.id} className="flex justify-between text-slate-700 py-0.5">
                    <span>{fechaCorta(p.fecha)} · {p.metodo.charAt(0) + p.metodo.slice(1).toLowerCase()}{p.nota ? ` · ${p.nota}` : ''}</span>
                    <span className="font-mono">{clp(p.monto)}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-1">
              {c.estado !== 'ANULADA' && c.saldo > 0 && (
                <button disabled={ocupado} onClick={pagar} className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-900 text-white font-medium disabled:opacity-60">Registrar pago</button>
              )}
              {c.tieneAdjunto && <button onClick={() => verAdjunto(compraId)} className="px-4 py-2 rounded border border-slate-300 bg-white hover:bg-slate-50 font-medium">Ver documento</button>}
              {adjuntosHabilitados && c.estado !== 'ANULADA' && (
                <>
                  <input ref={entrada} type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => adjuntar(e.target.files?.[0])} />
                  <button disabled={ocupado} onClick={() => entrada.current?.click()} className="px-4 py-2 rounded border border-slate-300 bg-white hover:bg-slate-50 font-medium disabled:opacity-60">
                    {c.tieneAdjunto ? 'Reemplazar documento' : 'Adjuntar foto o PDF'}
                  </button>
                </>
              )}
              {c.estado !== 'ANULADA' && (
                <button disabled={ocupado} onClick={anular} className="ml-auto px-4 py-2 rounded border border-red-300 bg-white hover:bg-red-50 text-red-700 font-medium disabled:opacity-60">Anular compra</button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
