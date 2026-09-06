import type { ItemCarrito } from '../../../types/ventas.types'; // Ajusta la ruta a tus types

interface Props {
  carrito: ItemCarrito[];
  actualizarCantidad: (id: number, cant: number) => void;
  eliminarDelCarrito: (id: number) => void;
}

export const DetalleCarrito = ({ carrito, actualizarCantidad, eliminarDelCarrito }: Props) => {
  return (
    <div className="lg:col-span-2 bg-white rounded shadow-sm border border-slate-200 p-6 min-h-112.5 flex flex-col justify-between">
      <div>
        <h2 className="text-sm font-semibold mb-4 border-b border-slate-200 pb-2 text-slate-700 uppercase tracking-wider">Detalle de Ítems en Orden</h2>
        {carrito.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400 text-sm">
            <p>No hay ítems seleccionados para la transacción actual.</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1 text-sm">
            {carrito.map((item: ItemCarrito) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded border border-slate-200">
                <div className="flex-1">
                  <h3 className="font-medium text-slate-900">{item.descripcion}</h3>
                  <p className="text-xs text-slate-500 font-mono">${item.precio} unitario</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center bg-white border border-slate-300 rounded overflow-hidden shadow-sm text-xs">
                    <button onClick={() => actualizarCantidad(item.id, item.cantidad - 1)} className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 font-bold transition-colors">-</button>
                    <span className="w-8 text-center font-mono font-semibold">{item.cantidad}</span>
                    <button onClick={() => actualizarCantidad(item.id, item.cantidad + 1)} className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 font-bold transition-colors">+</button>
                  </div>
                  <span className="font-mono font-semibold w-20 text-right text-slate-900">${item.subtotal}</span>
                  <button onClick={() => eliminarDelCarrito(item.id)} className="text-slate-400 hover:text-red-600 font-mono font-bold px-2 py-1 rounded transition-colors text-xs">X</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};