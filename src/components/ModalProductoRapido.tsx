import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { apiFetch, leerError } from '../helpers/apiFetch';

const API_URL = import.meta.env.VITE_API_URL as string;
const campo = 'w-full p-2.5 rounded border border-slate-300 focus:border-slate-500 outline-none text-sm bg-white';
const etiqueta = 'block text-xs font-semibold uppercase text-slate-600 mb-1';

export interface ProductoNuevo {
  id: number;
  descripcion: string;
  codigoBarras?: string;
  costo?: number | null;
  esInsumo: boolean;
  pesable?: boolean;
  unidadMedida?: string;
}

interface Props {
  nombreInicial: string;
  onCerrar: () => void;
  onCreado: (p: ProductoNuevo) => void;
}

/** Crear un producto desde la compra, sin salir a Inventario. El stock y el costo los pone la propia compra. */
export const ModalProductoRapido = ({ nombreInicial, onCerrar, onCreado }: Props) => {
  const [nombre, setNombre] = useState(nombreInicial);
  const [codigo, setCodigo] = useState('');
  const [esInsumo, setEsInsumo] = useState(false);
  const [precio, setPrecio] = useState('');
  const [pesable, setPesable] = useState(false);
  const [unidad, setUnidad] = useState('KG');
  const [stockCritico, setStockCritico] = useState('5');
  const [categoriaId, setCategoriaId] = useState('');
  const [categorias, setCategorias] = useState<{ id: number; nombre: string }[]>([]);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch(`${API_URL}/categorias`);
        if (res.ok) setCategorias(await res.json());
      } catch { /* sin categorías: queda sin categoría */ }
    })();
  }, []);

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (guardando) return;
    if (!nombre.trim()) return Swal.fire('Falta el nombre', 'Escribe el nombre del producto.', 'warning');
    if (!esInsumo && (precio === '' || Number(precio) < 0)) return Swal.fire('Falta el precio', 'Indica el precio de venta al público.', 'warning');
    setGuardando(true);
    try {
      const cat = categorias.find((c) => String(c.id) === categoriaId);
      const conPeso = !esInsumo && pesable;
      const res = await apiFetch(`${API_URL}/productos`, {
        method: 'POST',
        body: JSON.stringify({
          descripcion: nombre.trim(),
          codigoBarras: codigo.trim(),
          precio: esInsumo ? 0 : Math.round(Number(precio)),
          stock: 0,
          costo: null,
          stockCritico: Number(stockCritico) || 0,
          esInsumo,
          unidadMedida: conPeso ? unidad : 'UN',
          pesable: conPeso,
          categoria: cat ? { id: cat.id, nombre: cat.nombre } : undefined,
        }),
      });
      if (!res.ok) throw new Error(await leerError(res, 'No se pudo crear el producto.'));
      onCreado((await res.json()) as ProductoNuevo);
    } catch (err) {
      Swal.fire('No se creó', err instanceof Error ? err.message : 'Error inesperado.', 'error');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] bg-black/50 flex items-center justify-center p-4 overflow-y-auto" onClick={(e) => e.target === e.currentTarget && !guardando && onCerrar()}>
      <form onSubmit={guardar} className="bg-white rounded shadow-xl w-full max-w-md p-6 space-y-3 my-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Producto nuevo</h2>
          <p className="text-xs text-slate-500">Se crea con stock 0; la compra le sube el stock y le pone el costo.</p>
        </div>
        <div><label className={etiqueta}>Nombre *</label><input className={campo} maxLength={150} value={nombre} onChange={(e) => setNombre(e.target.value)} autoFocus /></div>
        <div>
          <label className={etiqueta}>Código de barras</label>
          <input className={campo} maxLength={50} value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="Escanéalo o déjalo vacío para crear uno interno" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={etiqueta}>Tipo</label>
            <select className={campo} value={esInsumo ? 'insumo' : 'venta'} onChange={(e) => setEsInsumo(e.target.value === 'insumo')}>
              <option value="venta">Producto para vender</option>
              <option value="insumo">Insumo (para recetas)</option>
            </select>
          </div>
          {!esInsumo && (
            <div><label className={etiqueta}>Precio de venta *</label><input type="number" min="0" className={campo} value={precio} onChange={(e) => setPrecio(e.target.value)} /></div>
          )}
        </div>
        {!esInsumo && (
          <label className="flex items-start gap-2 text-sm text-slate-700">
            <input type="checkbox" className="mt-1" checked={pesable} onChange={(e) => setPesable(e.target.checked)} />
            <span>Se vende por peso o medida (se pide la cantidad en caja)</span>
          </label>
        )}
        {!esInsumo && pesable && (
          <div className="max-w-[140px]">
            <label className={etiqueta}>Unidad</label>
            <select className={campo} value={unidad} onChange={(e) => setUnidad(e.target.value)}><option value="KG">KG</option><option value="GR">GR</option><option value="LT">LT</option></select>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={etiqueta}>Categoría</label>
            <select className={campo} value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)}>
              <option value="">Sin categoría</option>
              {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>
          <div><label className={etiqueta}>Avisar con stock bajo</label><input type="number" min="0" className={campo} value={stockCritico} onChange={(e) => setStockCritico(e.target.value)} /></div>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onCerrar} disabled={guardando} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900">Cancelar</button>
          <button disabled={guardando} className="px-4 py-2 text-sm rounded bg-slate-800 hover:bg-slate-900 text-white disabled:opacity-60">{guardando ? 'Creando…' : 'Crear y agregar a la compra'}</button>
        </div>
      </form>
    </div>
  );
};
