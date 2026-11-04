import { useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import type { Producto } from '../hooks/useInventario';
import { FORMATOS, formatoPesos, imprimirEtiquetas } from '../helpers/etiquetas';

interface Props { abierto: boolean; productos: Producto[]; onCerrar: () => void }

/** Elegir productos y cuántas etiquetas de cada uno, y mandarlas a imprimir (térmica o una hoja A4). */
export const ModalEtiquetas = ({ abierto, productos, onCerrar }: Props) => {
  const [copias, setCopias] = useState<Record<number, number>>({});
  const [busqueda, setBusqueda] = useState('');
  const [formatoId, setFormatoId] = useState(FORMATOS[0].id);
  const [conPrecio, setConPrecio] = useState(true);

  const lista = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return productos.filter((p) => !p.esInsumo && (!q || p.descripcion.toLowerCase().includes(q) || (p.codigoBarras ?? '').includes(q)));
  }, [productos, busqueda]);

  const total = Object.values(copias).reduce<number>((a, b) => a + b, 0);
  const poner = (id: number, n: number) => setCopias((c) => ({ ...c, [id]: Math.max(0, Math.min(500, Math.floor(n) || 0)) }));

  const imprimir = () => {
    const formato = FORMATOS.find((f) => f.id === formatoId) ?? FORMATOS[0];
    const items = productos
      .filter((p) => (copias[p.id] ?? 0) > 0)
      .map((p) => ({ codigo: p.codigoBarras ?? '', nombre: p.descripcion, precio: p.precio, copias: copias[p.id] }));
    const sinCodigo = items.filter((i) => !i.codigo);
    if (sinCodigo.length) {
      Swal.fire('Productos sin código', `Estos productos no tienen código y no se pueden etiquetar: ${sinCodigo.map((i) => i.nombre).join(', ')}. Usa "Asignar códigos" en Inventario.`, 'warning');
      return;
    }
    if (!imprimirEtiquetas(items, formato, conPrecio)) Swal.fire('Nada que imprimir', 'Indica cuántas etiquetas quieres de al menos un producto.', 'info');
  };

  if (!abierto) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && onCerrar()}>
      <div className="bg-white rounded shadow-xl w-full max-w-2xl max-h-[92vh] flex flex-col p-6 gap-4">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Imprimir etiquetas</h2>
            <p className="text-sm text-slate-500">Código de barras, nombre y precio. Ideal para productos de elaboración propia.</p>
          </div>
          <button onClick={onCerrar} className="text-slate-400 hover:text-slate-700 text-xl leading-none">×</button>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <select value={formatoId} onChange={(e) => setFormatoId(e.target.value)} className="p-2 border border-slate-300 rounded text-sm bg-white">
            {FORMATOS.map((f) => <option key={f.id} value={f.id}>{f.nombre}</option>)}
          </select>
          <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={conPrecio} onChange={(e) => setConPrecio(e.target.checked)} /> Mostrar precio</label>
        </div>

        <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar por nombre o código…" className="p-2 border border-slate-300 rounded text-sm" />

        <div className="flex-1 overflow-y-auto border border-slate-200 rounded divide-y divide-slate-100 min-h-[160px]">
          {lista.length === 0 && <p className="p-4 text-sm text-slate-500">No hay productos para mostrar.</p>}
          {lista.slice(0, 300).map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-3 p-2.5 text-sm">
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-800">{p.descripcion}</p>
                <p className="text-xs text-slate-500">{p.codigoBarras || 'Sin código'} · {formatoPesos(p.precio)}</p>
              </div>
              <input type="number" min={0} max={500} value={copias[p.id] ?? 0} onChange={(e) => poner(p.id, Number(e.target.value))}
                className="w-20 p-1.5 border border-slate-300 rounded text-right" aria-label={`Etiquetas de ${p.descripcion}`} />
            </div>
          ))}
        </div>
        {lista.length > 300 && <p className="text-xs text-slate-500">Se muestran 300 de {lista.length}. Usa el buscador para acotar.</p>}

        <div className="flex justify-between items-center gap-3">
          <span className="text-sm text-slate-600">{total} etiquetas</span>
          <div className="flex gap-2">
            <button onClick={() => setCopias({})} className="px-3 py-2 text-sm text-slate-600 hover:text-slate-900">Limpiar</button>
            <button onClick={imprimir} disabled={total === 0} className="px-4 py-2 text-sm rounded bg-slate-800 hover:bg-slate-900 text-white disabled:opacity-50">Imprimir</button>
          </div>
        </div>
      </div>
    </div>
  );
};
