interface Producto {
  id: number;
  descripcion: string;
  precio: number;
  codigoBarras?: string;
  esInsumo?: boolean;
}

interface Props {
  busqueda: string;
  setBusqueda: (v: string) => void;
  mostrarSugerencias: boolean;
  setMostrarSugerencias: (v: boolean) => void;
  sugerencias: Producto[];
  procesarCodigoEscaneado: (codigo: string) => void;
  onAbrirCamara: () => void;
  buscadorRef: React.RefObject<HTMLDivElement | null>;
}

export const BuscadorVentas = ({ 
  busqueda, setBusqueda, mostrarSugerencias, setMostrarSugerencias, 
  sugerencias, procesarCodigoEscaneado, onAbrirCamara, buscadorRef 
}: Props) => {
  return (
    <div className='w-full max-w-6xl mb-6 flex gap-3'>
      <div ref={buscadorRef} className='flex-1 relative'>
        <input 
          type="text"
          placeholder='Buscar producto por código o descripción...'
          className='w-full p-2.5 rounded border border-slate-300 shadow-sm focus:border-slate-500 outline-none transition-all text-sm bg-white'
          value={busqueda}
          onFocus={()=> setMostrarSugerencias(true)}
          onChange={(e) => {
            setBusqueda(e.target.value);
            setMostrarSugerencias(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              if (busqueda.trim() !== '') procesarCodigoEscaneado(busqueda.trim());
            }
          }}
        />
        {mostrarSugerencias && sugerencias.length > 0 && (
          <ul className='absolute z-10 w-full bg-white mt-1 border border-slate-200 rounded shadow-lg overflow-hidden text-sm'>
            {sugerencias.map((p) => (
              <li 
                key={p.id} 
                className={`p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-b-0 flex justify-between items-center ${p.esInsumo ? 'opacity-50' : ''}`}
                onClick={() => { 
                  if(!p.esInsumo) procesarCodigoEscaneado(p.codigoBarras || p.id.toString()); 
                }}
              >
                <span className="font-medium text-slate-700">{p.descripcion} {p.esInsumo && '(Insumo No Vendible)'}</span>
                <span className="font-mono font-semibold text-slate-900">${p.precio}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      
      <button 
        onClick={onAbrirCamara}
        className="bg-slate-800 hover:bg-slate-900 text-white px-5 rounded font-medium text-sm transition-colors shadow-sm whitespace-nowrap"
      >
        Escanear
      </button>
    </div>
  );
};