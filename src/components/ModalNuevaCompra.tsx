import { useEffect, useMemo, useRef, useState } from 'react';
import Swal from 'sweetalert2';
import { apiFetch, leerError } from '../helpers/apiFetch';
import { TIPOS_DOC, clp, hoyISO, subirAdjunto, totalConIva, type Proveedor } from '../helpers/compras';
import { ModalProveedor } from './ModalProveedor';

const API_URL = import.meta.env.VITE_API_URL as string;
const campo = 'w-full p-2 rounded border border-slate-300 focus:border-slate-500 outline-none text-sm bg-white';
const etiqueta = 'block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1';

interface ProductoLista { id: number; descripcion: string; codigoBarras?: string; costo?: number | null; esInsumo: boolean; pesable?: boolean; unidadMedida?: string }
interface Linea { producto: ProductoLista; cantidad: string; costo: string }

interface Props {
  proveedores: Proveedor[];
  adjuntosHabilitados: boolean;
  proveedorInicial?: number | null;
  onCerrar: () => void;
  onRegistrada: () => void;
  onProveedorCreado: (p: Proveedor) => void;
}

const num = (s: string) => {
  const n = Number(s.replace(',', '.'));
  return Number.isFinite(n) ? n : NaN;
};

/** Registrar una compra: proveedor, datos del documento, productos con su costo, y si ya está pagada. */
export const ModalNuevaCompra = ({ proveedores, adjuntosHabilitados, proveedorInicial, onCerrar, onRegistrada, onProveedorCreado }: Props) => {
  const [productos, setProductos] = useState<ProductoLista[]>([]);
  const [proveedorId, setProveedorId] = useState<number | ''>(proveedorInicial ?? '');
  const [tipo, setTipo] = useState('FACTURA');
  const [folio, setFolio] = useState('');
  const [fecha, setFecha] = useState(hoyISO());
  const [vencimiento, setVencimiento] = useState('');
  const [netos, setNetos] = useState(false);
  const [lineas, setLineas] = useState<Linea[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [totalDoc, setTotalDoc] = useState('');
  const [ingresarStock, setIngresarStock] = useState(true);
  const [actualizarCostos, setActualizarCostos] = useState(true);
  const [pagada, setPagada] = useState(false);
  const [metodo, setMetodo] = useState('TRANSFERENCIA');
  const [nota, setNota] = useState('');
  const [archivo, setArchivo] = useState<File | null>(null);
  const [nuevoProv, setNuevoProv] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const entrada = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const res = await apiFetch(`${API_URL}/productos?size=2000`);
        if (!res.ok) return;
        const d = await res.json();
        if (vivo) setProductos((d.content ?? d) as ProductoLista[]);
      } catch { /* sin lista: no se puede agregar productos */ }
    })();
    return () => { vivo = false; };
  }, []);

  const sugerencias = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (q.length < 1) return [];
    const usados = new Set(lineas.map((l) => l.producto.id));
    return productos.filter((p) => !usados.has(p.id) && (p.descripcion.toLowerCase().includes(q) || (p.codigoBarras ?? '').includes(q))).slice(0, 8);
  }, [busqueda, productos, lineas]);

  const agregar = (p: ProductoLista) => {
    setLineas((ls) => [...ls, { producto: p, cantidad: '1', costo: p.costo ? String(Math.round(p.costo)) : '' }]);
    setBusqueda('');
  };
  const cambiar = (i: number, c: Partial<Linea>) => setLineas((ls) => ls.map((l, j) => (j === i ? { ...l, ...c } : l)));

  const suma = lineas.reduce((a, l) => a + Math.round((num(l.cantidad) || 0) * (num(l.costo) || 0)), 0);
  const totalCalculado = totalConIva(suma, netos, tipo);
  const totalFinal = totalDoc.trim() !== '' ? Math.round(num(totalDoc) || 0) : totalCalculado;
  const lineasValidas = lineas.length > 0 && lineas.every((l) => num(l.cantidad) > 0 && num(l.costo) >= 0);
  const puede = proveedorId !== '' && lineasValidas && !guardando;

  const guardar = async () => {
    if (!puede) return;
    setGuardando(true);
    try {
      const res = await apiFetch(`${API_URL}/compras`, {
        method: 'POST',
        body: JSON.stringify({
          proveedorId, tipoDocumento: tipo, folio: folio.trim() || null, fechaDocumento: fecha,
          vencimiento: pagada ? null : (vencimiento || null), preciosNetos: netos,
          totalDocumento: totalDoc.trim() !== '' ? totalFinal : null,
          ingresarStock, actualizarCostos, pagada, metodoPago: metodo, nota: nota.trim() || null,
          items: lineas.map((l) => ({ productoId: l.producto.id, cantidad: num(l.cantidad), costoUnitario: Math.round(num(l.costo)) })),
        }),
      });
      if (!res.ok) throw new Error(await leerError(res, 'No se pudo registrar la compra.'));
      const compra = (await res.json()) as { id: number };
      let avisoAdjunto = '';
      if (archivo) {
        const ok = await subirAdjunto(compra.id, archivo);
        if (!ok) avisoAdjunto = ' La compra quedó registrada, pero el documento no se guardó: puedes adjuntarlo desde el detalle.';
      }
      await Swal.fire({
        icon: 'success', title: 'Compra registrada',
        text: (ingresarStock ? 'El stock ya fue actualizado.' : 'Quedó anotada sin tocar el stock.') + avisoAdjunto,
        timer: avisoAdjunto ? undefined : 2200, showConfirmButton: Boolean(avisoAdjunto),
      });
      onRegistrada();
    } catch (e) {
      Swal.fire('No se registró', e instanceof Error ? e.message : 'Error inesperado.', 'error');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-start justify-center p-3 overflow-y-auto" onClick={(e) => e.target === e.currentTarget && !guardando && onCerrar()}>
      <div className="bg-white rounded shadow-xl w-full max-w-3xl my-4 p-5 space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Nueva compra</h2>
            <p className="text-sm text-slate-500">Registra lo que te entregó el proveedor.</p>
          </div>
          <button onClick={onCerrar} disabled={guardando} className="text-slate-400 hover:text-slate-700 text-xl leading-none">×</button>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <div className="flex justify-between"><label className={etiqueta}>Proveedor *</label>
              <button type="button" onClick={() => setNuevoProv(true)} className="text-[11px] font-semibold text-slate-700 underline">+ Nuevo</button></div>
            <select className={campo} value={proveedorId} onChange={(e) => setProveedorId(e.target.value ? Number(e.target.value) : '')}>
              <option value="">Elige un proveedor…</option>
              {proveedores.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className={etiqueta}>Documento</label>
            <select className={campo} value={tipo} onChange={(e) => setTipo(e.target.value)}>
              {TIPOS_DOC.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
            </select>
          </div>
          <div><label className={etiqueta}>N° / folio</label><input className={campo} maxLength={30} value={folio} onChange={(e) => setFolio(e.target.value)} /></div>
          <div><label className={etiqueta}>Fecha del documento</label><input type="date" className={campo} value={fecha} max={hoyISO()} onChange={(e) => setFecha(e.target.value)} /></div>
        </div>

        <div>
          <label className={etiqueta}>Productos comprados</label>
          <div className="relative">
            <input className={campo} placeholder="Buscar producto por nombre o código…" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
            {sugerencias.length > 0 && (
              <ul className="absolute z-10 left-0 right-0 mt-1 bg-white border border-slate-200 rounded shadow-lg max-h-56 overflow-y-auto divide-y divide-slate-100">
                {sugerencias.map((p) => (
                  <li key={p.id} onClick={() => agregar(p)} className="p-2.5 text-sm hover:bg-slate-50 cursor-pointer flex justify-between gap-2">
                    <span className="truncate">{p.descripcion}</span>
                    <span className="text-xs text-slate-500 shrink-0">{p.codigoBarras ?? ''}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {lineas.length > 0 && (
            <div className="mt-2 border border-slate-200 rounded overflow-x-auto">
              <table className="w-full text-sm min-w-[520px]">
                <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-600">
                  <tr><th className="text-left p-2">Producto</th><th className="p-2 w-24">Cantidad</th><th className="p-2 w-32">Costo unit. {netos ? '(neto)' : ''}</th><th className="p-2 w-24 text-right">Subtotal</th><th className="w-8" /></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lineas.map((l, i) => {
                    const costoAnterior = l.producto.costo ? Math.round(l.producto.costo) : null;
                    const nuevo = Math.round(num(l.costo) || 0);
                    return (
                      <tr key={l.producto.id}>
                        <td className="p-2">
                          <p className="font-medium text-slate-800">{l.producto.descripcion}</p>
                          {costoAnterior !== null && nuevo > 0 && nuevo !== costoAnterior && (
                            <p className={`text-[11px] ${nuevo > costoAnterior ? 'text-red-600' : 'text-emerald-700'}`}>Antes {clp(costoAnterior)} → ahora {clp(nuevo)}</p>
                          )}
                        </td>
                        <td className="p-2"><input type="number" min="0" step={l.producto.pesable ? '0.001' : '1'} className={campo + ' text-right'} value={l.cantidad} onChange={(e) => cambiar(i, { cantidad: e.target.value })} /></td>
                        <td className="p-2"><input type="number" min="0" step="1" className={campo + ' text-right'} value={l.costo} onChange={(e) => cambiar(i, { costo: e.target.value })} /></td>
                        <td className="p-2 text-right font-mono">{clp(Math.round((num(l.cantidad) || 0) * (num(l.costo) || 0)))}</td>
                        <td className="p-2"><button type="button" onClick={() => setLineas((ls) => ls.filter((_, j) => j !== i))} className="text-slate-400 hover:text-red-600 font-bold">✕</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="grid sm:grid-cols-2 gap-3 items-end">
          <label className="flex items-start gap-2 text-sm text-slate-700">
            <input type="checkbox" className="mt-1" checked={netos} disabled={tipo === 'FACTURA_EXENTA'} onChange={(e) => setNetos(e.target.checked)} />
            <span>Los valores unitarios son <b>netos</b> (sin IVA). Se suma el 19 % al total.</span>
          </label>
          <div>
            <label className={etiqueta}>Total según el documento (opcional)</label>
            <input type="number" min="0" className={campo + ' text-right'} placeholder={String(totalCalculado)} value={totalDoc} onChange={(e) => setTotalDoc(e.target.value)} />
          </div>
        </div>

        <div className="flex justify-between items-center bg-slate-50 border border-slate-200 rounded p-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">Total de la compra</span>
          <span className="text-2xl font-mono font-bold text-slate-900">{clp(totalFinal)}</span>
        </div>

        <div className="space-y-2 text-sm text-slate-700">
          <label className="flex items-start gap-2"><input type="checkbox" className="mt-1" checked={ingresarStock} onChange={(e) => setIngresarStock(e.target.checked)} /><span>Subir el stock con estas cantidades (en tu sucursal).</span></label>
          <label className="flex items-start gap-2"><input type="checkbox" className="mt-1" checked={actualizarCostos} onChange={(e) => setActualizarCostos(e.target.checked)} /><span>Actualizar el costo de cada producto con este valor (último costo pagado). Es lo que usa el margen.</span></label>
          <label className="flex items-start gap-2"><input type="checkbox" className="mt-1" checked={pagada} onChange={(e) => setPagada(e.target.checked)} /><span>Ya la pagué.</span></label>
        </div>

        {pagada ? (
          <div className="max-w-xs"><label className={etiqueta}>Forma de pago</label>
            <select className={campo} value={metodo} onChange={(e) => setMetodo(e.target.value)}>
              <option value="TRANSFERENCIA">Transferencia</option><option value="EFECTIVO">Efectivo</option><option value="OTRO">Otro</option>
            </select></div>
        ) : (
          <div className="max-w-xs"><label className={etiqueta}>Vence el (si es a crédito)</label>
            <input type="date" className={campo} value={vencimiento} min={fecha} onChange={(e) => setVencimiento(e.target.value)} /></div>
        )}

        <div className="grid sm:grid-cols-2 gap-3">
          <div><label className={etiqueta}>Nota (opcional)</label><input className={campo} maxLength={255} value={nota} onChange={(e) => setNota(e.target.value)} /></div>
          <div>
            <label className={etiqueta}>Foto o PDF del documento</label>
            {adjuntosHabilitados ? (
              <>
                <input ref={entrada} type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => setArchivo(e.target.files?.[0] ?? null)} />
                <button type="button" onClick={() => entrada.current?.click()} className="w-full p-2 rounded border border-dashed border-slate-300 text-sm text-slate-600 hover:bg-slate-50 truncate">
                  {archivo ? archivo.name : 'Tomar foto o elegir archivo'}
                </button>
              </>
            ) : <p className="text-xs text-slate-500">El almacenamiento de documentos no está configurado en el servidor.</p>}
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-1">
          <button onClick={onCerrar} disabled={guardando} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900">Cancelar</button>
          <button onClick={guardar} disabled={!puede} className="px-5 py-2 text-sm rounded bg-slate-800 hover:bg-slate-900 text-white disabled:opacity-50">{guardando ? 'Guardando…' : 'Registrar compra'}</button>
        </div>
      </div>

      {nuevoProv && (
        <ModalProveedor onCerrar={() => setNuevoProv(false)} onGuardado={(p) => { setNuevoProv(false); onProveedorCreado(p); setProveedorId(p.id); }} />
      )}
    </div>
  );
};
