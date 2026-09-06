import { useInventario } from '../hooks/useInventario'; 
import { useRecetas, type Receta } from '../hooks/useRecetas'; 
import { useState, useMemo } from 'react';
import Swal from 'sweetalert2';

interface IngredienteReceta {
  insumoId: number;
  nombre: string;
  cantidad: number;
}

interface RecetaAgrupada {
  productoId: string;
  productoNombre: string;
  ingredientes: {
    recetaId: number;
    insumoId: number | string;
    insumoNombre: string;
    cantidadUsada: number;
  }[];
}

// 🛡️ Tipos auxiliares para satisfacer a TypeScript y ESLint sin usar 'any'
interface EntidadFlexible {
  id?: string | number;
  descripcion?: string;
  nombre?: string;
  stock?: number;
  [key: string]: unknown; // Permite propiedades adicionales de forma segura
}

type RecetaFlexible = Receta & {
  productoPrincipal?: EntidadFlexible;
  producto?: EntidadFlexible;
  productoPadre?: EntidadFlexible;
  insumo?: EntidadFlexible;
  ingrediente?: EntidadFlexible;
  productoPadreId?: string | number;
  productoPadreNombre?: string;
  productoNombre?: string;
  insumoNombre?: string;
  [key: string]: unknown;
};

// 🛡️ Extractor Universal Blindado para el ID del Producto Padre
const getIdProducto = (r: Receta): string | number => {
  const rec = r as RecetaFlexible;
  return rec.productoPrincipal?.id || rec.productoPadreId || rec.producto?.id || rec.productoPadre?.id || 'sin-id';
};

// 🛡️ Extractor Universal para el Nombre (100% compatible con cualquier catálogo o interfaz)
const getNombreProducto = (r: Receta, catalogoProductos: unknown[] = []): string => {
  const rec = r as RecetaFlexible;

  // 1. Intentar obtener el nombre directamente del objeto de la receta
  const nombreDirecto = 
    rec.productoPrincipal?.descripcion || 
    rec.productoPrincipal?.nombre ||
    rec.productoPadreNombre || 
    rec.productoNombre || 
    rec.producto?.descripcion ||
    rec.producto?.nombre ||
    rec.productoPadre?.descripcion ||
    rec.productoPadre?.nombre;

  if (nombreDirecto) return nombreDirecto;

  // 2. Plan de Rescate: Si el backend solo mandó el ID, lo buscamos en el inventario cargado
  const id = getIdProducto(r);
  if (id !== 'sin-id' && catalogoProductos.length > 0) {
    const catalogo = catalogoProductos as EntidadFlexible[];
    const productoEncontrado = catalogo.find(p => String(p?.id) === String(id));
    if (productoEncontrado) {
      return productoEncontrado.descripcion || productoEncontrado.nombre || `Producto ID: ${id}`;
    }
  }

  // 3. Último recurso si el producto fue borrado del inventario pero la receta sigue ahí
  return id !== 'sin-id' ? `Producto ID: ${id}` : 'Formulación sin identificar';
};

// 🛡️ Extractor para el Insumo
const getNombreInsumo = (r: Receta): string => {
  const rec = r as RecetaFlexible;
  return rec.insumo?.descripcion || rec.insumo?.nombre || rec.insumoNombre || rec.ingrediente?.descripcion || rec.ingrediente?.nombre || 'Insumo sin nombre';
};

export const Recetas = () => {
  const { productos, cargarProductos } = useInventario(); 
  const { recetas, eliminarReceta, cargarRecetas } = useRecetas(); 
  
  const [showModalReceta, setShowModalReceta] = useState(false);
  const [busqueda, setBusqueda] = useState(''); 
  
  // 🟢 ESTADO PARA CONTROLAR QUÉ PRODUCTOS ESTÁN DESPLEGADOS
  const [expandidos, setExpandidos] = useState<string[]>([]);

  const [productoPrincipal, setProductoPrincipal] = useState({
    descripcion: '',
    precio: '',
    stockCritico: '5',
    codigoBarras: ''
  });
  const [listaIngredientes, setListaIngredientes] = useState<IngredienteReceta[]>([]);
  const [tempInsumoId, setTempInsumoId] = useState('');
  const [tempCantidad, setTempCantidad] = useState('');

  // 🟢 FUNCIÓN PARA ALTERNAR (ABRIR/CERRAR) LOS INSUMOS DE UN PRODUCTO
  const toggleExpandir = (id: string) => {
    setExpandidos(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const stockMaximoPosible = useMemo(() => {
    if (listaIngredientes.length === 0) return 0;
    const limites = listaIngredientes.map(ing => {
      const prod = productos.find(p => p.id === Number(ing.insumoId));
      return prod ? Math.floor(prod.stock / ing.cantidad) : 0;
    });
    return Math.min(...limites);
  }, [listaIngredientes, productos]);

  const agregarIngredienteALista = () => {
    if (!tempInsumoId || !tempCantidad) return;
    
    const insumo = productos.find(p => p.id === Number(tempInsumoId));
    
    const nuevoIngrediente: IngredienteReceta = {
      insumoId: Number(tempInsumoId),
      nombre: insumo?.descripcion || 'Insumo no registrado',
      cantidad: Number(tempCantidad)
    };

    setListaIngredientes([...listaIngredientes, nuevoIngrediente]);
    setTempInsumoId('');
    setTempCantidad('');
  };

  const handleSubmitFinal = async () => {
    if (!productoPrincipal.descripcion || listaIngredientes.length === 0) {
      return Swal.fire('Información Incompleta', 'Debe ingresar el nombre de la formulación y al menos un insumo componente.', 'warning');
    }

    const empresaIdActiva = localStorage.getItem('empresaId') || '1';

    const payload = {
      productoPrincipal: {
        ...productoPrincipal,
        precio: Number(productoPrincipal.precio),
        stockCritico: Number(productoPrincipal.stockCritico),
        esInsumo: false, 
        stock: 0,
        unidadMedida: 'UN', 
        activo: true,
        empresa: { id: Number(empresaIdActiva) },
        categoria: { id: 1 } 
      },
      ingredientes: listaIngredientes.map(ing => ({
        insumoId: ing.insumoId,
        cantidad: ing.cantidad,
      }))
    };

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/productos/con-receta?empresaId=${empresaIdActiva}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        Swal.fire('Registro Completo', 'La formulación del producto y su estructura de insumos han sido registradas en el sistema.', 'success');
        setShowModalReceta(false);
        setListaIngredientes([]);
        setProductoPrincipal({ descripcion: '', precio: '', stockCritico: '5', codigoBarras: '' });
        
        if (cargarProductos) cargarProductos(); 
        if (cargarRecetas) cargarRecetas(); 
      } else {
        const errorMsg = await res.text();
        throw new Error(errorMsg || 'Error al guardar en el servidor');
      }
    } catch (error: unknown) {
      console.error(error);
      const mensaje = error instanceof Error ? error.message : 'No fue posible establecer conexión con el servidor principal.';
      Swal.fire('Error al Guardar', mensaje, 'error');
    }
  };

  const recetasFiltradas = useMemo(() => {
    return recetas.filter(r => {
      // Le pasamos el catálogo de productos para que resuelva el nombre si falta en la receta
      const nombreProducto = getNombreProducto(r, productos);
      const nombreInsumo = getNombreInsumo(r);
      return nombreProducto.toLowerCase().includes(busqueda.toLowerCase()) ||
             nombreInsumo.toLowerCase().includes(busqueda.toLowerCase());
    });
  }, [recetas, busqueda, productos]);

  const recetasAgrupadas = useMemo(() => {
    const grupos: { [key: string]: RecetaAgrupada } = {};

    recetasFiltradas.forEach(r => {
      const rec = r as RecetaFlexible; // 👈 Casteo seguro aplicado para evitar errores TS en el bucle
      const prodId = String(getIdProducto(r));
      const prodNombre = getNombreProducto(r, productos);
      const insNombre = getNombreInsumo(r);
      const insId = rec.insumo?.id || rec.insumoId || rec.ingrediente?.id || 'desconocido';

      if (!grupos[prodId]) {
        grupos[prodId] = {
          productoId: prodId,
          productoNombre: prodNombre,
          ingredientes: []
        };
      }

      if (r.id) {
        grupos[prodId].ingredientes.push({
          recetaId: r.id,
          insumoId: insId,
          insumoNombre: insNombre,
          cantidadUsada: r.cantidadUsada
        });
      }
    });

    return Object.values(grupos);
  }, [recetasFiltradas, productos]);

  return (
    <div className='min-h-screen bg-slate-50 flex flex-col items-center p-8 font-sans text-slate-800'>
        <div className="w-full max-w-6xl mb-8 border-b border-slate-200 pb-4 flex justify-between items-end">
          <div>
            <h1 className='text-3xl font-semibold text-slate-900 tracking-tight'>Gestión de Formulaciones y Recetas</h1>
            <p className="text-slate-500 text-sm mt-1">Selecciona un producto elaborado para visualizar y gestionar sus insumos componentes.</p>
          </div>
          <button 
              onClick={() => setShowModalReceta(true)}
              className="bg-slate-800 text-white py-2 px-5 rounded-lg text-sm font-medium hover:bg-slate-900 transition-all shadow-sm flex items-center gap-2"
          >
              <span>+ Nueva Formulación</span>
          </button>
        </div>

        <div className='w-full max-w-6xl mb-6'>
            <input 
                type="text"
                placeholder='Filtrar por nombre de producto comercial o insumo componente...'
                className='w-full p-3 rounded-lg border border-slate-300 outline-none focus:border-slate-500 text-sm bg-white shadow-sm transition-all'
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
            />
        </div>

        {/* 🟢 LISTA DE PRODUCTOS ACORDEÓN */}
        <div className='w-full max-w-6xl space-y-3'>
            {recetasAgrupadas.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12 text-center text-slate-400 font-medium">
                    No se encontraron formulaciones registradas que coincidan con la búsqueda.
                </div>
            ) : (
                recetasAgrupadas.map((grupo) => {
                    const estaExpandido = expandidos.includes(grupo.productoId);

                    return (
                        <div key={grupo.productoId} className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden transition-all">
                            
                            {/* 🟢 CABECERA CLICKEABLE DEL PRODUCTO */}
                            <div 
                                onClick={() => toggleExpandir(grupo.productoId)}
                                className={`px-6 py-4 flex justify-between items-center cursor-pointer select-none transition-colors ${
                                    estaExpandido ? 'bg-slate-100 border-b border-slate-200' : 'bg-white hover:bg-slate-50'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    {/* Flecha indicadora de apertura */}
                                    <svg 
                                        className={`w-4 h-4 text-slate-500 transform transition-transform duration-200 ${estaExpandido ? 'rotate-180' : ''}`} 
                                        fill="none" 
                                        stroke="currentColor" 
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                    <h3 className="font-bold text-slate-900 text-base tracking-wide uppercase">
                                        {grupo.productoNombre}
                                    </h3>
                                </div>

                                <div className="flex items-center gap-4">
                                    <span className="text-xs bg-slate-100 border border-slate-200 text-slate-700 font-semibold px-3 py-1 rounded-full shadow-2xs">
                                        {grupo.ingredientes.length} {grupo.ingredientes.length === 1 ? 'insumo' : 'insumos'}
                                    </span>
                                    <span className="text-xs font-semibold text-slate-500 hover:text-slate-800 underline w-20 text-right">
                                        {estaExpandido ? 'Ocultar' : 'Ver insumos'}
                                    </span>
                                </div>
                            </div>

                            {/* 🟢 TABLA DESPLEGABLE CON LOS INSUMOS */}
                            {estaExpandido && (
                                <div className="bg-slate-50/50 p-2">
                                    <table className="w-full text-left text-sm bg-white rounded border border-slate-100 overflow-hidden shadow-2xs">
                                        <thead className="bg-slate-100/75 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                            <tr>
                                                <th className="px-6 py-3 w-1/2">Insumo Componente (Descuento de Stock)</th>
                                                <th className="px-6 py-3 w-1/4">Consumo Unitario</th>
                                                <th className="px-6 py-3 w-1/4 text-right">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {grupo.ingredientes.map((ing) => (
                                                <tr key={ing.recetaId} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-3 font-medium text-slate-800 flex items-center gap-2">
                                                        <span className="text-slate-400 font-mono">↳</span> {ing.insumoNombre}
                                                    </td>
                                                    <td className="px-6 py-3 font-mono font-semibold text-slate-700">
                                                        {ing.cantidadUsada} <span className="text-xs font-sans font-normal text-slate-400">unidades/medida</span>
                                                    </td>
                                                    <td className="px-6 py-3 text-right">
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation(); // Evita que al hacer clic en disociar se cierre el acordeón
                                                                eliminarReceta(ing.recetaId);
                                                            }} 
                                                            className="text-red-600 hover:text-red-800 font-medium hover:underline text-xs transition-colors px-2 py-1 rounded hover:bg-red-50"
                                                        >
                                                            Disociar Insumo
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    );
                })
            )}
        </div>

        {/* Modal de Registro */}
        {showModalReceta && (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                <div className='w-full max-w-2xl bg-white p-6 rounded-xl shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto text-sm'>
                    <h2 className='text-lg font-bold mb-6 text-slate-900 border-b border-slate-100 pb-3'>Registro de Nueva Formulación de Producto</h2>
                    
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div>
                            <label className='block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5'>Descripción del Producto</label>
                            <input 
                                placeholder="Ej: Sándwich de Carne Especial"
                                className="w-full p-2.5 border border-slate-300 rounded-lg focus:border-slate-500 outline-none transition-all"
                                value={productoPrincipal.descripcion}
                                onChange={e => setProductoPrincipal({...productoPrincipal, descripcion: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className='block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5'>Precio de Venta ($)</label>
                            <input 
                                type="number" placeholder="Ej: 5500"
                                className="w-full p-2.5 border border-slate-300 rounded-lg focus:border-slate-500 outline-none transition-all"
                                value={productoPrincipal.precio}
                                onChange={e => setProductoPrincipal({...productoPrincipal, precio: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className='bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6'>
                        <h3 className='font-semibold text-xs uppercase tracking-wider text-slate-700 mb-3'>Adición de Componentes / Insumos</h3>
                        <div className='flex gap-2'>
                            <select 
                                className='flex-1 p-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:border-slate-500 bg-white transition-all'
                                value={tempInsumoId}
                                onChange={e => setTempInsumoId(e.target.value)}
                            >
                                <option value="">Seleccione insumo disponible...</option>
                                {productos.filter(p => p.esInsumo).map(p => (
                                    <option key={p.id} value={p.id}>{p.descripcion} (Disponibilidad: {p.stock})</option>
                                ))}
                            </select>
                            <input 
                                type="number" placeholder="Cantidad" className='w-24 p-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:border-slate-500 transition-all'
                                value={tempCantidad}
                                onChange={e => setTempCantidad(e.target.value)}
                            />
                            <button 
                                onClick={agregarIngredienteALista} 
                                className='bg-slate-800 hover:bg-slate-900 text-white px-5 rounded-lg font-medium text-xs transition-colors shadow-xs'
                            >
                                Añadir
                            </button>
                        </div>
                    </div>

                    <table className='w-full text-left mb-6 border border-slate-200 rounded-lg overflow-hidden'>
                        <thead className='border-b border-slate-200 bg-slate-100 text-xs font-semibold uppercase tracking-wider text-slate-600'>
                            <tr>
                                <th className='py-2.5 px-4'>Insumo Seleccionado</th>
                                <th className='py-2.5 px-4'>Consumo</th>
                                <th className='py-2.5 px-4 text-right'>Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {listaIngredientes.map((ing, index) => (
                                <tr key={index}>
                                    <td className='py-2.5 px-4 font-medium text-slate-800'>{ing.nombre}</td>
                                    <td className='py-2.5 px-4 font-mono text-slate-700'>{ing.cantidad}</td>
                                    <td className='py-2.5 px-4 text-right'>
                                        <button 
                                            className='text-red-600 hover:text-red-800 font-medium hover:underline text-xs' 
                                            onClick={() => setListaIngredientes(listaIngredientes.filter((_, i) => i !== index))}
                                        >
                                            Remover
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {listaIngredientes.length === 0 && (
                                <tr>
                                    <td colSpan={3} className="text-center py-6 text-slate-400 text-xs">Sin insumos asignados a la receta actualmente.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    <div className='flex justify-between items-center bg-slate-100 p-4 rounded-lg border border-slate-200'>
                        <span className='font-semibold text-slate-700 uppercase tracking-wider text-xs'>Capacidad de Producción Estimada:</span>
                        <span className='text-xl font-bold font-mono text-slate-900'>{stockMaximoPosible} <span className='text-xs font-normal text-slate-600 uppercase'>unidades</span></span>
                    </div>

                    <div className='flex gap-3 mt-6'>
                        <button 
                            onClick={handleSubmitFinal} 
                            className='flex-1 bg-slate-800 hover:bg-slate-900 text-white font-medium py-3 rounded-lg shadow-sm transition-all text-sm'
                        >
                            Guardar Registro Completo
                        </button>
                        <button 
                            onClick={() => setShowModalReceta(false)} 
                            className='px-6 py-3 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors text-sm border border-slate-300'
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};