import { useInventario, type Producto } from '../hooks/useInventario';
import { useCallback, useEffect, useRef, useState } from 'react';
import Swal from 'sweetalert2';
import { LectorCamara } from '../components/LectorCamara';
import { useNavigate } from 'react-router-dom'; 
import { apiFetch } from '../helpers/apiFetch';

interface ItemRecetaLocal {
  insumoId: number;
  cantidad: number;
  descripcion?: string;
}

interface Categoria {
  id: number;
  nombre: string;
}

export const Inventario = () => {
  const navigate = useNavigate(); 
  const usuarioRol = (localStorage.getItem('usuarioRol') || 'vendedor').toLowerCase().trim(); 

  useEffect(() => {
    if (usuarioRol !== 'admin') {
      Swal.fire({
        icon: 'info',
        title: 'Acceso Restringido',
        text: 'Esta sección contiene información confidencial y es de acceso exclusivo para administradores. Será redirigido al panel principal.',
        confirmButtonColor: '#1E293B',
        confirmButtonText: 'Entendido',
        allowOutsideClick: false,
        allowEscapeKey: false
      }).then(() => {
        navigate('/home'); 
      });
    }
  }, [usuarioRol, navigate]);

  const { 
    productos,
    eliminarProducto,
    agregarProducto,
    editarProducto,
    obtenerStockVisual,
    productosFiltrados,
    busqueda,
    setBusqueda,
  } = useInventario();

  const productosRef = useRef<Producto[]>([]);

  // Refs para capturar el lector de código de barras físico
  const bufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);

  useEffect(() => {
    productosRef.current = productos;
  }, [productos]);

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  
  useEffect(() => {
    if (usuarioRol !== 'admin') return; 

    const cargarCategorias = async () => {
      try {
        const empresaId = localStorage.getItem('empresaId') || "1";
        const response = await apiFetch(`${import.meta.env.VITE_API_URL}/categorias?empresaId=${empresaId}`);
        
        if (response.ok) {
          const data = await response.json();
          const listaCategorias = Array.isArray(data) ? data : (data.content || []);
          setCategorias(listaCategorias);
        }
      } catch (error) {
        console.error("Error al cargar las categorías:", error);
      }
    };

    cargarCategorias();
  }, [usuarioRol]);

  const [showModalProducto, setShowModalProducto] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  
  const [mostrarCamaraBusqueda, setMostrarCamaraBusqueda] = useState(false);
  const [mostrarCamaraFormulario, setMostrarCamaraFormulario] = useState(false);
  
  const [form, setForm] = useState({
    codigoBarras: '',
    descripcion: '',
    precio: '',
    stock: '',
    stockCritico: '',
    esInsumo: true,
    unidadMedida: 'UN',
    categoriaId: '' as number | '' 
  });

  const [listaIngredientesSeleccionados, setListaIngredientesSeleccionados] = useState<ItemRecetaLocal[]>([]);
  const [nuevoIngrediente, setNuevoIngrediente] = useState({ insumoId: 0, cantidad: 0, descripcion: '' });

  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'venta' | 'insumos'>('todos');
  const [soloCritico, setSoloCritico] = useState(false);
  const [filtroCategoria, setFiltroCategoria] = useState<number | 'todas'>('todas');

  const productosFinales = productosFiltrados.filter(producto => {
    if (filtroTipo === 'venta' && producto.esInsumo) return false;
    if (filtroTipo === 'insumos' && !producto.esInsumo) return false;
    if (soloCritico) {
      const stockVisual = obtenerStockVisual(producto);
      if (stockVisual > producto.stockCritico) return false;
    }
    if (filtroCategoria !== 'todas') {
      if (producto.categoria?.id !== filtroCategoria) return false;
    }
    return true;
  });

  // 1. Manejo de stock declarado ANTES de ser referenciado
  const manejarEntradaStock = useCallback(async (producto: Producto) => {
    const { value: cantidad } = await Swal.fire({
      title: `Ajuste de Stock: ${producto.descripcion}`,
      input: 'number',
      inputLabel: `Ingrese la cantidad a ajustar (use signo "-" para restar). Unidad: ${producto.unidadMedida}`,
      inputPlaceholder: 'Ej: 10 o -5',
      showCancelButton: true,
      confirmButtonColor: '#1E293B',
      cancelButtonColor: '#64748B',
      confirmButtonText: 'Aplicar ajuste',
      cancelButtonText: 'Cancelar',
      inputAttributes: { step: '0.01' },
      inputValidator: (value) => {
        if (!value || Number(value) === 0 || isNaN(Number(value))) {
          return 'Debe ingresar un valor numérico distinto de cero.';
        }
      }
    });

    if (cantidad) {
      try {
        const numCantidad = Number(cantidad);
        const nuevoStock = producto.stock + numCantidad;

        await editarProducto(producto.id, { ...producto, stock: nuevoStock });

        const accion = numCantidad > 0 ? 'adicionado' : 'descontado';
        const cantidadAbsoluta = Math.abs(numCantidad);

        Swal.fire(
          'Registro Actualizado',
          `Se han ${accion} ${cantidadAbsoluta} unidades en el inventario de ${producto.descripcion}.`,
          'success'
        );
      } catch {
        Swal.fire('Error', 'No se pudo actualizar el registro en el inventario.', 'error');
      }
    }
  }, [editarProducto]);

  // 2. Procesador envuelto en useCallback para mantener la referencia estable
  const procesarCodigoEscaneadoBusqueda = useCallback((codigo: string) => {
    setMostrarCamaraBusqueda(false);
    setBusqueda(''); 

    const productoEncontrado = productosRef.current.find(
      p => p.codigoBarras === codigo || p.id.toString() === codigo
    );
    
    if (productoEncontrado) {
      manejarEntradaStock(productoEncontrado);
    } else {
      setEditandoId(null);
      setListaIngredientesSeleccionados([]);

      setForm({
        codigoBarras: codigo,
        descripcion: '',
        precio: '',
        stock: '',
        stockCritico: '',
        esInsumo: false,
        unidadMedida: 'UN',
        categoriaId: ''
      });

      setShowModalProducto(true);

      const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 2000 });
      Toast.fire({ icon: 'info', title: 'Código no registrado: Abriendo nuevo producto' });
    }
  }, [manejarEntradaStock, setBusqueda]);

  // 3. Listener global con sus dependencias completas
  useEffect(() => {
    const manejarEscaneoGlobal = (e: KeyboardEvent) => {
      if (showModalProducto || mostrarCamaraBusqueda || mostrarCamaraFormulario) return;

      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
        return;
      }

      const ahora = Date.now();
      if (ahora - lastKeyTimeRef.current > 100) {
        bufferRef.current = '';
      }
      lastKeyTimeRef.current = ahora;

      if (e.key === 'Enter') {
        if (bufferRef.current.trim().length > 0) {
          e.preventDefault();
          procesarCodigoEscaneadoBusqueda(bufferRef.current.trim());
          bufferRef.current = '';
        }
      } else if (e.key.length === 1) {
        bufferRef.current += e.key;
      }
    };

    window.addEventListener('keydown', manejarEscaneoGlobal);
    return () => window.removeEventListener('keydown', manejarEscaneoGlobal);
  }, [showModalProducto, mostrarCamaraBusqueda, mostrarCamaraFormulario, procesarCodigoEscaneadoBusqueda]);

  const procesarCodigoEscaneadoFormulario = (codigo: string) => {
    setMostrarCamaraFormulario(false);
    setForm(prev => ({ ...prev, codigoBarras: codigo }));
    
    const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 1200 });
    Toast.fire({ icon: 'success', title: 'Código capturado correctamente' });
  };

  const agregarIngredienteALista = () => {
    if (nuevoIngrediente.insumoId === 0 || nuevoIngrediente.cantidad <= 0) {
      return Swal.fire("Atención", "Debe seleccionar un insumo e ingresar una cantidad válida.", "warning");
    }
    setListaIngredientesSeleccionados(prev => [...prev, { ...nuevoIngrediente }]);
    setNuevoIngrediente({ insumoId: 0, cantidad: 0, descripcion: '' });
  };

  const quitarIngredienteDeLista = (id: number) => {
    setListaIngredientesSeleccionados(prev => prev.filter(item => item.insumoId !== id));
  };

  const abrirEdicion = (producto: Producto) => {
    setForm({
      codigoBarras: producto.codigoBarras || '',
      descripcion: producto.descripcion,
      precio: producto.precio.toString(),
      stock: producto.stock.toString(),
      stockCritico: producto.stockCritico.toString(),
      esInsumo: producto.esInsumo ?? true,
      unidadMedida: producto.unidadMedida,
      categoriaId: producto.categoria?.id || ''
    });
    
    if (producto.receta) {
      setListaIngredientesSeleccionados(producto.receta.map(r => ({
        insumoId: r.insumo.id,
        cantidad: r.cantidadUsada,
        descripcion: r.insumo.descripcion
      })));
    }
    setEditandoId(producto.id);
    setShowModalProducto(true);
  };

  const cerrarModal = () => {
    setShowModalProducto(false);
    setEditandoId(null);
    setListaIngredientesSeleccionados([]);
    setForm({ 
      codigoBarras: '', descripcion: '', precio: '', stock: '', 
      stockCritico: '', esInsumo: true, unidadMedida: 'UN', categoriaId: ''
    });
  };

  const generarCodigoProvisional = () => `PROV-${Date.now()}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.descripcion || !form.precio || !form.stockCritico) {
      return Swal.fire("Información incompleta", "Por favor, complete los campos obligatorios del formulario.", "warning");
    }

    const codigoFinal = form.codigoBarras.trim() === "" ? generarCodigoProvisional() : form.codigoBarras;

    const categoriaSeleccionada = form.categoriaId 
      ? categorias.find(c => Number(c.id) === Number(form.categoriaId))
      : null;

    const datosProducto = {
      descripcion: form.descripcion,
      precio: Number(form.precio),
      stock: Number(form.stock),
      stockCritico: Number(form.stockCritico),
      esInsumo: form.esInsumo,
      unidadMedida: form.unidadMedida,
      codigoBarras: codigoFinal,
      categoria: categoriaSeleccionada ? { id: categoriaSeleccionada.id, nombre: categoriaSeleccionada.nombre } : undefined
    };

    if (editandoId) {
      await editarProducto(editandoId, datosProducto);
    } else {
      const ingredientesParaEnviar = !form.esInsumo 
        ? listaIngredientesSeleccionados.map(i => ({ insumoId: i.insumoId, cantidad: i.cantidad })) 
        : [];
      await agregarProducto(datosProducto, ingredientesParaEnviar);
    }
    cerrarModal();
  };

  if (usuarioRol !== 'admin') return null;

  return (
    <div className='min-h-screen bg-slate-50 flex flex-col items-center p-8 font-sans text-slate-800'>
      <div className="w-full max-w-6xl mb-8 border-b border-slate-200 pb-4">
        <h1 className='text-3xl font-semibold text-slate-900 tracking-tight'>Gestión de Inventario</h1>
        <p className="text-slate-500 text-sm mt-1">Control de stock, insumos y productos para venta.</p>
      </div>

      <div className='w-full max-w-6xl mb-6 space-y-4'>
        <div className="flex gap-3">
          <input 
            type="text"
            placeholder='Buscar por código o descripción...'
            className='w-full p-2.5 rounded border border-slate-300 shadow-sm outline-none text-sm focus:border-slate-500 bg-white'
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (busqueda.trim() !== '') procesarCodigoEscaneadoBusqueda(busqueda.trim());
              }
            }}
          />
          
          <button 
            onClick={() => setMostrarCamaraBusqueda(true)}
            className="bg-slate-800 hover:bg-slate-900 text-white px-5 rounded font-medium text-sm transition-colors whitespace-nowrap shadow-sm"
          >
             Escanear
          </button>
          
          <select 
            className="w-64 p-2.5 rounded border border-slate-300 shadow-sm outline-none text-sm focus:border-slate-500 bg-white cursor-pointer"
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value === 'todas' ? 'todas' : Number(e.target.value))}
          >
            <option value="todas">Todas las Categorías</option>
            {categorias.map(c => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </div>
        
        <div className='flex flex-col md:flex-row justify-between items-center bg-white p-2.5 rounded shadow-sm border border-slate-200'>
          <div className="flex bg-slate-100 p-1 rounded w-full md:w-auto text-sm">
            <button onClick={() => setFiltroTipo('todos')} className={`flex-1 md:flex-none px-5 py-1.5 rounded font-medium transition-all ${filtroTipo === 'todos' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}>Todos</button>
            <button onClick={() => setFiltroTipo('venta')} className={`flex-1 md:flex-none px-5 py-1.5 rounded font-medium transition-all ${filtroTipo === 'venta' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}>Productos</button>
            <button onClick={() => setFiltroTipo('insumos')} className={`flex-1 md:flex-none px-5 py-1.5 rounded font-medium transition-all ${filtroTipo === 'insumos' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}>Insumos</button>
          </div>

          <button
            onClick={() => setSoloCritico(!soloCritico)}
            className={`mt-3 md:mt-0 flex items-center justify-center gap-2 px-4 py-1.5 w-full md:w-auto rounded text-sm font-medium border transition-all ${soloCritico ? 'bg-red-50 border-red-300 text-red-700 font-semibold shadow-sm' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'}`}
          >
            <span className={`w-2.5 h-2.5 rounded-full ${soloCritico ? 'bg-red-600' : 'bg-slate-300'}`}></span>
            Stock Crítico
          </button>
        </div>
      </div>
      
      <div className='w-full max-w-6xl bg-white rounded shadow-sm border border-slate-200 overflow-hidden'>
        <div className='p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center'>
          <h2 className='text-sm font-semibold text-slate-700 uppercase tracking-wide'>Registros ({productosFinales.length})</h2>
          <button onClick={() => setShowModalProducto(true)} className="bg-slate-800 hover:bg-slate-900 transition-colors text-white font-medium py-1.5 px-4 rounded text-sm shadow-sm">
            Nuevo Registro
          </button>
        </div>
        
        <table className='w-full text-left text-sm'>
          <thead className='bg-slate-100 uppercase text-xs font-semibold text-slate-600 border-b border-slate-200'>
            <tr>
              <th className='px-6 py-3'>ID</th>
              <th className='px-6 py-3'>Descripción</th>
              <th className='px-6 py-3'>Categoría</th>
              <th className='px-6 py-3'>Precio</th>
              <th className='px-6 py-3'>Stock (Real/Virtual)</th>
              <th className='px-6 py-3 text-center'>Acciones</th>
            </tr>
          </thead>
          <tbody className='divide-y divide-slate-100'>
            {productosFinales.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-slate-400 font-medium">No se encontraron productos que coincidan con los filtros aplicados.</td>
              </tr>
            ) : (
              productosFinales.map((producto) => {
                const stockVisual = obtenerStockVisual(producto);
                const esCritico = stockVisual <= producto.stockCritico;
                return (
                  <tr key={producto.id} className={`hover:bg-slate-50 transition-colors ${esCritico ? 'bg-red-50/40' : ''}`}>
                    <td className='px-6 py-3.5 text-slate-500 font-mono'>#{producto.id}</td>
                    <td className='px-6 py-3.5 font-medium text-slate-800'>
                      {producto.descripcion}
                      {!producto.esInsumo && (producto.receta?.length || 0) > 0 && <span className="ml-2 bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wider">RECETA</span>}
                      {producto.esInsumo && <span className="ml-2 bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wider">INSUMO</span>}
                    </td>
                    <td className='px-6 py-3.5 text-slate-600'>{producto.categoria?.nombre || <span className="italic text-slate-400">Sin categoría</span>}</td>
                    <td className='px-6 py-3.5 font-medium text-slate-900'>${producto.precio.toLocaleString()}</td>
                    <td className={`px-6 py-3.5 font-semibold ${esCritico ? 'text-red-600' : 'text-slate-800'}`}>
                      {stockVisual} <span className='text-xs font-normal text-slate-500'>{producto.unidadMedida}</span>
                    </td>
                    <td className='px-6 py-3.5 flex justify-center gap-2'>
                      <button onClick={() => manejarEntradaStock(producto)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded font-medium text-xs transition-colors border border-slate-300" title="Ingresar Stock">Ajustar Stock</button>
                      <button onClick={() => abrirEdicion(producto)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded font-medium text-xs transition-colors border border-slate-300">Editar</button>
                      <button onClick={() => eliminarProducto(producto.id)} className="text-red-600 hover:text-red-800 px-2 py-1 font-medium text-xs transition-colors underline">Eliminar</button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {showModalProducto && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className='w-full max-w-md bg-white p-6 rounded shadow-lg border border-slate-200 max-h-[90vh] overflow-y-auto text-sm'>
            <h2 className='text-lg font-semibold mb-4 text-slate-900 border-b border-slate-100 pb-2'>{editandoId ? 'Modificar Registro' : 'Nuevo Registro'}</h2>
            
            <form className='flex flex-col gap-3' onSubmit={handleSubmit}>
              <div className="flex gap-2 p-1 bg-slate-100 rounded">
                <button type="button" onClick={() => setForm({...form, esInsumo: true})} className={`flex-1 py-1.5 rounded text-xs font-semibold uppercase tracking-wider transition-colors ${form.esInsumo ? 'bg-slate-800 text-white shadow-sm' : 'bg-transparent text-slate-600'}`}>Insumo</button>
                <button type="button" onClick={() => setForm({...form, esInsumo: false})} className={`flex-1 py-1.5 rounded text-xs font-semibold uppercase tracking-wider transition-colors ${!form.esInsumo ? 'bg-slate-800 text-white shadow-sm' : 'bg-transparent text-slate-600'}`}>Producto para Venta</button>
              </div>

              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Código de barras o referencia" 
                  className='flex-1 p-2.5 border border-slate-300 rounded focus:border-slate-500 outline-none' 
                  value={form.codigoBarras} 
                  onChange={(e) => setForm({...form, codigoBarras: e.target.value})} 
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault(); 
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => setMostrarCamaraFormulario(true)}
                  className="bg-slate-100 border border-slate-300 hover:bg-slate-200 px-3 rounded font-medium text-xs text-slate-700 transition-colors"
                  title="Escanear con Cámara"
                >
                  Escanear
                </button>
              </div>

              <input type="text" placeholder="Descripción / Nombre del ítem" className='p-2.5 border border-slate-300 rounded focus:border-slate-500 outline-none' value={form.descripcion} onChange={(e) => setForm({...form, descripcion: e.target.value})} />
              
              <select 
                className='p-2.5 border border-slate-300 rounded focus:border-slate-500 outline-none bg-white'
                value={form.categoriaId}
                onChange={(e) => setForm({...form, categoriaId: e.target.value === '' ? '' : Number(e.target.value)})}
              >
                <option value="">Seleccionar categoría...</option>
                {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>

              <div className='grid grid-cols-2 gap-2'>
                <div className='flex border border-slate-300 rounded overflow-hidden focus-within:border-slate-500'>
                  <input type="number" step="0.01" className='w-full p-2.5 outline-none' placeholder="Stock Inicial" value={form.stock} onChange={(e)=> setForm({...form, stock: e.target.value})} />
                  <select className='bg-slate-100 px-2 text-xs font-semibold outline-none cursor-pointer border-l border-slate-300 text-slate-700' value={form.unidadMedida || ""} onChange={(e) => setForm({ ...form, unidadMedida: e.target.value })}>
                    <option value="UN">UN</option>
                    <option value="KG">KG</option>
                    <option value="LT">LT</option>
                  </select>
                </div>
                <input type="number" placeholder="Precio ($)" className='p-2.5 border border-slate-300 rounded focus:border-slate-500 outline-none' value={form.precio} onChange={(e)=> setForm({...form, precio: e.target.value})} />
              </div>

              <input type="number" placeholder="Límite de Stock Crítico" className='p-2.5 border border-slate-300 rounded focus:border-slate-500 outline-none' value={form.stockCritico} onChange={(e)=> setForm({...form, stockCritico: e.target.value})} />

              {!form.esInsumo && (
                <div className="p-3 bg-slate-50 rounded border border-slate-200">
                  <p className="text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wide">Composición de Receta / Ingredientes</p>
                  <div className="flex flex-col gap-2">
                    <select 
                      className="p-2 border border-slate-300 rounded text-sm outline-none focus:border-slate-500 bg-white"
                      value={nuevoIngrediente.insumoId}
                      onChange={(e) => {
                        const insumo = productos.find(p => p.id === Number(e.target.value));
                        setNuevoIngrediente({...nuevoIngrediente, insumoId: Number(e.target.value), descripcion: insumo?.descripcion || ''});
                      }}
                    >
                      <option value={0}>Seleccionar insumo...</option>
                      {productos.filter(p => p.esInsumo).map(i => <option key={i.id} value={i.id}>{i.descripcion}</option>)}
                    </select>
                    <div className="flex gap-2">
                      <input type="number" step="0.001" placeholder="Cantidad" className="w-24 p-2 text-sm border border-slate-300 rounded outline-none focus:border-slate-500" value={nuevoIngrediente.cantidad || ''} onChange={(e)=>setNuevoIngrediente({...nuevoIngrediente, cantidad: Number(e.target.value)})} />
                      <button type="button" onClick={agregarIngredienteALista} className="flex-1 bg-slate-800 hover:bg-slate-900 transition-colors text-white rounded font-medium text-xs">Añadir Insumo</button>
                    </div>
                  </div>
                  
                  {listaIngredientesSeleccionados.length > 0 && (
                    <div className="mt-3 space-y-1.5">
                      {listaIngredientesSeleccionados.map(item => (
                        <div key={item.insumoId} className="flex justify-between items-center bg-white p-2 rounded border border-slate-200 text-xs">
                          <span className="font-medium text-slate-700">{item.descripcion}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">{item.cantidad}</span>
                            <button type="button" onClick={() => quitarIngredienteDeLista(item.insumoId)} className="text-red-600 font-mono font-bold hover:underline">X</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <button type='submit' className="bg-slate-800 hover:bg-slate-900 transition-colors text-white font-medium py-2.5 rounded shadow-sm mt-2 text-sm">
                {editandoId ? 'Guardar Cambios' : 'Confirmar Registro'}
              </button>
              <button type="button" onClick={cerrarModal} className="text-slate-500 hover:text-slate-800 transition-colors text-xs font-medium py-1 text-center">Cancelar</button>
            </form>
          </div>
        </div>
      )}

      {mostrarCamaraBusqueda && (
        <LectorCamara 
          onScan={procesarCodigoEscaneadoBusqueda} 
          onClose={() => setMostrarCamaraBusqueda(false)} 
        />
      )}

      {mostrarCamaraFormulario && (
        <LectorCamara 
          onScan={procesarCodigoEscaneadoFormulario} 
          onClose={() => setMostrarCamaraFormulario(false)} 
        />
      )}
    </div>
  );
};