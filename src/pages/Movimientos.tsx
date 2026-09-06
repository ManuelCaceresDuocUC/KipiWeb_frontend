import { useState } from "react";
import { useMovimiento, type Movimiento } from "../hooks/useMovimiento"; 

type TipoFiltro = 'hoy' | 'dia' | 'periodo' | 'semana' | 'mes';

const obtenerFechasSemana = () => {
    const hoy = new Date();
    const diaSemana = hoy.getDay() || 7; 
    
    const inicio = new Date(hoy);
    inicio.setDate(hoy.getDate() - diaSemana + 1); 
    
    const fin = new Date(inicio);
    fin.setDate(inicio.getDate() + 6); 

    return {
        inicio: inicio.toISOString().split('T')[0],
        fin: fin.toISOString().split('T')[0]
    };
};

const obtenerFechasMes = () => {
    const hoy = new Date();
    const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1); 
    const fin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0); 

    return {
        inicio: inicio.toISOString().split('T')[0],
        fin: fin.toISOString().split('T')[0]
    };
};

export const Movimientos = () => {
    const { movimientos, loading, error, cargarMovimientos } = useMovimiento();
    const [ventaSeleccionada, setVentaSeleccionada] = useState<Movimiento | null>(null);
    
    const [tipoFiltro, setTipoFiltro] = useState<TipoFiltro>('hoy');
    const [fecha1, setFecha1] = useState('');
    const [fecha2, setFecha2] = useState('');

    const aplicarFiltro = () => {
        if (tipoFiltro === 'hoy') {
            cargarMovimientos();
        } else if (tipoFiltro === 'dia') {
            if (!fecha1) return alert("Debe seleccionar una fecha válida.");
            cargarMovimientos(fecha1);
        } else if (tipoFiltro === 'periodo') {
            if (!fecha1 || !fecha2) return alert("Debe seleccionar la fecha de inicio y de término.");
            cargarMovimientos(fecha1, fecha2);
        } else if (tipoFiltro === 'semana') {
            const { inicio, fin } = obtenerFechasSemana();
            cargarMovimientos(inicio, fin);
        } else if (tipoFiltro === 'mes') {
            const { inicio, fin } = obtenerFechasMes();
            cargarMovimientos(inicio, fin);
        }
    };

    return (
        <div className="p-8 bg-slate-50 min-h-screen font-sans text-slate-800">
            <div className="mb-8 border-b border-slate-200 pb-4">
              <h1 className='text-3xl font-semibold text-slate-900 tracking-tight'>Registro de Movimientos y Ventas</h1>
              <p className="text-slate-500 text-sm mt-1">Histórico general y análisis de transacciones.</p>
            </div>

            <div className="bg-white p-4 rounded shadow-sm border border-slate-200 mb-8 flex flex-col md:flex-row gap-4 items-end max-w-6xl text-sm">
                
                <div className="flex flex-col gap-1">
                    <label className="font-semibold text-slate-700 text-xs uppercase tracking-wider">Criterio de filtro:</label>
                    <select 
                        value={tipoFiltro} 
                        onChange={(e) => setTipoFiltro(e.target.value as TipoFiltro)}
                        className="border border-slate-300 rounded p-2 bg-slate-50 focus:border-slate-500 outline-none"
                    >
                        <option value="hoy">Día en curso</option>
                        <option value="dia">Fecha específica</option>
                        <option value="semana">Semana actual</option> 
                        <option value="mes">Mes en curso</option>       
                        <option value="periodo">Rango de fechas manual</option>
                    </select>
                </div>

                {(tipoFiltro === 'dia' || tipoFiltro === 'periodo') && (
                    <div className="flex flex-col gap-1">
                        <label className="font-semibold text-slate-700 text-xs uppercase tracking-wider">
                            {tipoFiltro === 'periodo' ? 'Fecha Inicio:' : 'Seleccione Fecha:'}
                        </label>
                        <input 
                            type="date" 
                            value={fecha1} 
                            onChange={(e) => setFecha1(e.target.value)}
                            className="border border-slate-300 rounded p-2 bg-slate-50 focus:border-slate-500 outline-none"
                        />
                    </div>
                )}

                {tipoFiltro === 'periodo' && (
                    <div className="flex flex-col gap-1">
                        <label className="font-semibold text-slate-700 text-xs uppercase tracking-wider">Fecha Término:</label>
                        <input 
                            type="date" 
                            value={fecha2} 
                            onChange={(e) => setFecha2(e.target.value)}
                            className="border border-slate-300 rounded p-2 bg-slate-50 focus:border-slate-500 outline-none"
                        />
                    </div>
                )}

                <button 
                    onClick={aplicarFiltro}
                    className="bg-slate-800 hover:bg-slate-900 text-white font-medium py-2 px-6 rounded shadow-sm transition-colors h-9 text-sm"
                >
                    Aplicar Filtro
                </button>
            </div>

            {loading && <div className="p-10 text-center font-medium text-slate-600 text-sm tracking-wide uppercase">Cargando registros de transacciones...</div>}
            
            {error && (
                <div className="p-8 text-center bg-white border border-red-200 rounded max-w-6xl">
                    <p className="text-red-700 font-semibold text-sm uppercase tracking-wide">Error en la consulta de datos:</p>
                    <p className="text-slate-600 text-sm mt-1">{error}</p>
                </div>
            )}

            {!loading && !error && (
                <div className='flex flex-col lg:flex-row gap-8 items-start w-full max-w-6xl'>
                    <div className="flex-1 overflow-hidden rounded shadow-sm border border-slate-200 bg-white w-full">
                        {movimientos.length === 0 ? (
                            <div className="p-10 text-center text-slate-400 font-medium text-sm">No existen transacciones registradas en el período seleccionado.</div>
                        ) : (
                            <table className='w-full text-left text-sm'>
                                <thead className='bg-slate-100 border-b border-slate-200 font-semibold text-slate-600 text-xs uppercase tracking-wider'>
                                    <tr>
                                        <th className="px-6 py-3.5">ID</th>
                                        <th className="px-6 py-3.5">Monto Total</th>
                                        <th className="px-6 py-3.5">Medio de Pago</th>
                                        <th className="px-6 py-3.5">Fecha y Hora</th>
                                        <th className="px-6 py-3.5 text-center">Detalle Operación</th>
                                    </tr>
                                </thead>
                                <tbody className='divide-y divide-slate-100'>
                                    {movimientos.map((mov) => (
                                        <tr key={mov.id} className="hover:bg-slate-50 transition-colors">
                                            <td className='px-6 py-3.5 font-mono text-slate-500'>#{mov.id}</td>
                                            <td className='px-6 py-3.5 font-semibold text-slate-900'>${mov.total.toLocaleString()}</td>
                                            <td className='px-6 py-3.5 font-medium text-slate-700'>{mov.metodoPago}</td>
                                            <td className='px-6 py-3.5 text-slate-500'>
                                                {new Date(mov.fechaHora).toLocaleString()}
                                            </td>
                                            <td className='px-6 py-3.5 text-center'>
                                                <button 
                                                    onClick={() => setVentaSeleccionada(mov)}
                                                    className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-1 rounded border border-slate-300 transition-colors font-medium text-xs"
                                                >
                                                    Visualizar ({mov.detalles?.length || 0} ítems)
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}

            {ventaSeleccionada && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded shadow-lg border border-slate-200 w-full max-w-md overflow-hidden text-sm">
                        <div className="bg-slate-800 p-4 text-white flex justify-between items-center">
                            <h3 className="font-semibold text-base">Detalle de Transacción #{ventaSeleccionada.id}</h3>
                            <button onClick={() => setVentaSeleccionada(null)} className="font-mono text-lg font-bold leading-none">&times;</button>
                        </div>
                        
                        <div className="p-6">
                            <div className="space-y-3 max-h-[60vh] overflow-y-auto divide-y divide-slate-100 pr-1">
                                {ventaSeleccionada.detalles.map((det) => {
                                    // ✨ NUEVO: Calculamos el precio real buscando en las propiedades más comunes
                                    const precioReal = det.precioUnitario || det.precio || det.producto?.precio || 0;
                                    
                                    return (
                                        <div key={det.id} className="flex justify-between items-center pt-2 first:pt-0">
                                            <div className="text-left">
                                                <p className="font-medium text-slate-800">{det.producto.descripcion}</p>
                                                <p className="text-xs text-slate-500 font-mono mt-0.5">
                                                    {det.cantidad} und. &times; ${precioReal}
                                                </p>
                                            </div>
                                            <p className="font-semibold text-slate-900">
                                                ${(det.cantidad * precioReal).toLocaleString()}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                            <button 
                                onClick={() => setVentaSeleccionada(null)}
                                className="w-full mt-6 bg-slate-800 hover:bg-slate-900 text-white py-2.5 rounded font-medium transition-colors"
                            >
                                Cerrar Ventana
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};