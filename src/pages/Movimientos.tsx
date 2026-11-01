import { useState } from "react";
import Swal from "sweetalert2";
import { useMovimiento, type Movimiento } from "../hooks/useMovimiento"; 
import { apiFetch, leerError } from "../helpers/apiFetch";
import {
    adjuntarComprobante, enviarTicketPorCorreo, reimprimirBoleta, reimprimirTicket, reimprimirVale, reintentarBoleta,
    reintentarNotaCredito, verComprobantes, ETIQUETA_DTE,
} from "../helpers/documentosVenta";

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

    const esAdmin = (localStorage.getItem('usuarioRol') || '').toLowerCase().trim() === 'admin';

    const anularVenta = async (venta: Movimiento) => {
        const { value: motivo } = await Swal.fire({
            title: `Anular venta #${venta.id}`,
            html: `<p style="font-size:13px;color:#64748B">Se repondrá el stock y se revertirá la deuda del cliente si fue a crédito. Esta acción no se puede deshacer.</p>`,
            input: 'text',
            inputPlaceholder: 'Motivo de la anulación (obligatorio)',
            showCancelButton: true,
            confirmButtonColor: '#B91C1C',
            cancelButtonColor: '#64748B',
            confirmButtonText: 'Anular venta',
            cancelButtonText: 'Volver',
            inputValidator: (v) => (!v || v.trim().length < 3 ? 'Escribe el motivo (mínimo 3 letras).' : undefined),
        });
        if (!motivo) return;

        try {
            const res = await apiFetch(`${import.meta.env.VITE_API_URL}/ventas/${venta.id}/anular`, {
                method: 'POST',
                body: JSON.stringify({ motivo: motivo.trim() }),
            });
            if (!res.ok) throw new Error(await leerError(res, 'No se pudo anular la venta'));
            const r = await res.json();
            setVentaSeleccionada(null);
            aplicarFiltro();
            const nc = r.notaCredito as { estado?: string; folio?: number | null; aviso?: string } | undefined;
            const lineaNc = nc?.estado === 'EMITIDO'
                ? `Nota de crédito emitida${nc.folio ? ` (N° ${nc.folio})` : ''}.`
                : (nc?.aviso || '');
            const hayProblemaNc = nc && ['PENDIENTE', 'REVISAR'].includes(nc.estado || '');
            Swal.fire({
                icon: hayProblemaNc ? 'warning' : 'success',
                title: `Venta #${venta.id} anulada`,
                text: [r.aviso, lineaNc].filter(Boolean).join(' '),
            });
        } catch (e) {
            Swal.fire('Error', e instanceof Error ? e.message : 'No se pudo anular la venta', 'error');
        }
    };

    const aplicarFiltro = () => {
        if (tipoFiltro === 'hoy') {
            cargarMovimientos();
        } else if (tipoFiltro === 'dia') {
            if (!fecha1) return Swal.fire('Atención', 'Debe seleccionar una fecha válida.', 'warning');
            cargarMovimientos(fecha1);
        } else if (tipoFiltro === 'periodo') {
            if (!fecha1 || !fecha2) return Swal.fire('Atención', 'Debe seleccionar la fecha de inicio y de término.', 'warning');
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
        <div className="font-sans text-slate-800">
            <div className="mb-8 border-b border-slate-200 pb-4">
              <h1 className='text-3xl font-semibold text-slate-900 tracking-tight'>Registro de Movimientos y Ventas</h1>
              <p className="text-slate-500 text-sm mt-1">Histórico general y análisis de transacciones.</p>
            </div>

            <div className="bg-white p-4 rounded shadow-sm border border-slate-200 mb-8 flex flex-col md:flex-row md:flex-wrap gap-4 md:items-end max-w-6xl text-sm">
                
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
                    <div className="flex-1 overflow-x-auto rounded shadow-sm border border-slate-200 bg-white w-full">
                        {movimientos.length === 0 ? (
                            <div className="p-10 text-center text-slate-400 font-medium text-sm">No existen transacciones registradas en el período seleccionado.</div>
                        ) : (
                            <table className='w-full min-w-[640px] text-left text-sm'>
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
                                        <tr key={mov.id} className={`hover:bg-slate-50 transition-colors ${mov.estado === 'ANULADA' ? 'bg-red-50/40 text-slate-400' : ''}`}>
                                            <td className='px-6 py-3.5 font-mono text-slate-500'>#{mov.id}</td>
                                            <td className={`px-6 py-3.5 font-semibold ${mov.estado === 'ANULADA' ? 'line-through text-slate-400' : 'text-slate-900'}`}>${mov.total.toLocaleString('es-CL')}</td>
                                            <td className='px-6 py-3.5 font-medium text-slate-700'>
                                                {mov.metodoPago}
                                                {mov.estado === 'ANULADA' && <span className="ml-2 bg-red-100 text-red-700 px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wider">ANULADA</span>}
                                                {mov.dteEstado === 'PENDIENTE' && mov.estado !== 'ANULADA' && <span className="ml-2 bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wider">BOLETA PENDIENTE</span>}
                                                {mov.dteEstado === 'REVISAR' && mov.estado !== 'ANULADA' && <span className="ml-2 bg-orange-100 text-orange-800 px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wider">BOLETA: REVISAR</span>}
                                            </td>
                                            <td className='px-6 py-3.5 text-slate-500'>
                                                {new Date(mov.fechaHora).toLocaleString('es-CL')}
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
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={(e) => { if (e.target === e.currentTarget) setVentaSeleccionada(null); }}>
                    <div role="dialog" aria-modal="true" aria-label="Detalle de la transacción" className="bg-white rounded shadow-lg border border-slate-200 w-full max-w-md overflow-hidden text-sm">
                        <div className="bg-slate-800 p-4 text-white flex justify-between items-center">
                            <h3 className="font-semibold text-base">Detalle de Transacción #{ventaSeleccionada.id}</h3>
                            <button onClick={() => setVentaSeleccionada(null)} aria-label="Cerrar" className="font-mono text-lg font-bold leading-none">&times;</button>
                        </div>
                        
                        <div className="p-6">
                            {ventaSeleccionada.estado === 'ANULADA' && (
                                <div className="mb-4 p-3 rounded border border-red-200 bg-red-50 text-xs text-red-800">
                                    <p className="font-semibold uppercase tracking-wider">Venta anulada</p>
                                    <p className="mt-1">{ventaSeleccionada.motivoAnulacion || 'Sin motivo registrado'}{ventaSeleccionada.anuladaPor ? ` · por ${ventaSeleccionada.anuladaPor}` : ''}</p>
                                </div>
                            )}
                            <div className="space-y-3 max-h-[60vh] overflow-y-auto divide-y divide-slate-100 pr-1">
                                {ventaSeleccionada.detalles.map((det) => {
                                    // ✨ NUEVO: Calculamos el precio real buscando en las propiedades más comunes
                                    const precioReal = det.precioUnitario || det.precio || det.producto?.precio || 0;
                                    
                                    return (
                                        <div key={det.id} className="flex justify-between items-center pt-2 first:pt-0">
                                            <div className="text-left">
                                                <p className="font-medium text-slate-800">{det.producto.descripcion}</p>
                                                <p className="text-xs text-slate-500 font-mono mt-0.5">
                                                    {det.cantidad} und. &times; ${precioReal.toLocaleString('es-CL')}
                                                </p>
                                            </div>
                                            <p className="font-semibold text-slate-900">
                                                ${(det.cantidad * precioReal).toLocaleString('es-CL')}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                            {ventaSeleccionada.pagos && ventaSeleccionada.pagos.length > 0 && (
                                <div className="mt-4 pt-3 border-t border-slate-200">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Formas de pago</p>
                                    {ventaSeleccionada.pagos.map(pg => (
                                        <div key={pg.id} className="flex justify-between text-slate-700">
                                            <span>{pg.metodo}{pg.proveedorTarjeta ? ` (${pg.proveedorTarjeta})` : ''}{pg.referencia ? ` · ${pg.referencia}` : ''}</span>
                                            <span className="font-mono font-semibold">${pg.monto.toLocaleString('es-CL')}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {ventaSeleccionada.dteEstado && ventaSeleccionada.dteEstado !== 'CANCELADO' && (
                                <div className={`mt-4 p-3 rounded border text-xs ${
                                    ventaSeleccionada.dteEstado === 'EMITIDO' ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                        : ventaSeleccionada.dteEstado === 'PENDIENTE' ? 'bg-amber-50 border-amber-200 text-amber-900'
                                        : 'bg-orange-50 border-orange-200 text-orange-900'}`}>
                                    <p className="font-semibold uppercase tracking-wider">
                                        {ETIQUETA_DTE[ventaSeleccionada.dteEstado] || ventaSeleccionada.dteEstado}
                                        {ventaSeleccionada.dteFolio ? ` · N° ${ventaSeleccionada.dteFolio}` : ''}
                                    </p>
                                    {ventaSeleccionada.dteEstado === 'PENDIENTE' && ventaSeleccionada.estado !== 'ANULADA' && (
                                        <>
                                            <p className="mt-1">La venta está registrada, pero la boleta electrónica aún no se emitió.</p>
                                            <button
                                                onClick={async () => {
                                                    const r = await reintentarBoleta(ventaSeleccionada.id);
                                                    if (r) { setVentaSeleccionada(null); aplicarFiltro(); }
                                                }}
                                                className="mt-2 bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded font-medium"
                                            >
                                                Reintentar boleta
                                            </button>
                                        </>
                                    )}
                                    {ventaSeleccionada.dteEstado === 'REVISAR' && ventaSeleccionada.estado !== 'ANULADA' && (
                                        <>
                                            <p className="mt-1">No se sabe si el proveedor alcanzó a emitirla. Verifica en su portal antes de reintentar para no duplicar la boleta.</p>
                                            {esAdmin && (
                                                <button
                                                    onClick={async () => {
                                                        const c = await Swal.fire({
                                                            icon: 'warning', title: '¿Ya verificaste en el portal?',
                                                            text: 'Solo reintenta si confirmaste que la boleta NO fue emitida.',
                                                            showCancelButton: true, confirmButtonText: 'Sí, reintentar', cancelButtonText: 'Volver',
                                                        });
                                                        if (!c.isConfirmed) return;
                                                        const r = await reintentarBoleta(ventaSeleccionada.id, true);
                                                        if (r) { setVentaSeleccionada(null); aplicarFiltro(); }
                                                    }}
                                                    className="mt-2 bg-orange-600 hover:bg-orange-700 text-white px-3 py-1.5 rounded font-medium"
                                                >
                                                    Ya verifiqué: reintentar
                                                </button>
                                            )}
                                        </>
                                    )}
                                    {ventaSeleccionada.dteEstado === 'EMITIDO' && ventaSeleccionada.estado !== 'ANULADA' && (
                                        <button
                                            onClick={() => reimprimirBoleta(ventaSeleccionada.id)}
                                            className="mt-2 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-1.5 rounded font-medium"
                                        >
                                            Reimprimir boleta
                                        </button>
                                    )}
                                    {ventaSeleccionada.dteEstado === 'EMITIDO' && ventaSeleccionada.estado === 'ANULADA' && esAdmin && (
                                        <button
                                            onClick={() => reintentarNotaCredito(ventaSeleccionada.id)}
                                            className="mt-2 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-1.5 rounded font-medium"
                                        >
                                            Nota de crédito: ver estado / reintentar
                                        </button>
                                    )}
                                </div>
                            )}
                            {ventaSeleccionada.estado !== 'ANULADA' && (
                                <div className="mt-4 pt-3 border-t border-slate-200 grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => reimprimirTicket(ventaSeleccionada.id)}
                                        className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 py-2 rounded text-sm font-medium"
                                    >
                                        Reimprimir ticket
                                    </button>
                                    <button
                                        onClick={() => enviarTicketPorCorreo(ventaSeleccionada.id)}
                                        className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 py-2 rounded text-sm font-medium"
                                    >
                                        Enviar por correo
                                    </button>
                                    {ventaSeleccionada.pagos?.some(pg => pg.metodo === 'CREDITO') && (
                                        <button
                                            onClick={() => reimprimirVale(ventaSeleccionada.id)}
                                            className="col-span-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 py-2 rounded text-sm font-medium"
                                        >
                                            Reimprimir vale de crédito
                                        </button>
                                    )}
                                    {ventaSeleccionada.pagos?.filter(pg => pg.metodo === 'TRANSFERENCIA').map(pg => (
                                        <div key={pg.id} className="col-span-2 flex gap-2">
                                            {pg.tieneComprobante && (
                                                <button
                                                    onClick={() => verComprobantes(ventaSeleccionada.id)}
                                                    className="flex-1 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-300 py-2 rounded text-sm font-medium"
                                                >
                                                    Ver comprobante
                                                </button>
                                            )}
                                            <button
                                                onClick={async () => {
                                                    if (await adjuntarComprobante(ventaSeleccionada.id, pg.id)) {
                                                        setVentaSeleccionada({
                                                            ...ventaSeleccionada,
                                                            pagos: ventaSeleccionada.pagos?.map(x => x.id === pg.id ? { ...x, tieneComprobante: true } : x),
                                                        });
                                                        aplicarFiltro();
                                                    }
                                                }}
                                                className="flex-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 py-2 rounded text-sm font-medium"
                                            >
                                                {pg.tieneComprobante ? 'Reemplazar comprobante' : 'Adjuntar comprobante'}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {esAdmin && ventaSeleccionada.estado !== 'ANULADA' && (
                                <button
                                    onClick={() => anularVenta(ventaSeleccionada)}
                                    className="w-full mt-4 bg-white hover:bg-red-50 text-red-700 border border-red-300 py-2 rounded font-medium transition-colors text-sm"
                                >
                                    Anular venta
                                </button>
                            )}
                            <button 
                                onClick={() => setVentaSeleccionada(null)}
                                className="w-full mt-3 bg-slate-800 hover:bg-slate-900 text-white py-2.5 rounded font-medium transition-colors"
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