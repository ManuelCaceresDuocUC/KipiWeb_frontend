import { useState } from 'react';
import { Link } from 'react-router-dom';

// Importación de los Custom Hooks
import { useAdminPanel } from '../hooks/useAdminPanel';
import { useClientes } from '../hooks/useClientes';
import { useCategorias } from '../hooks/useCategorias';
import { useNotas } from '../hooks/useNotas';

export const Administracion = () => {
  // 1. Variables de entorno y almacenamiento local
  const API_URL = import.meta.env.VITE_API_URL;
  const empresaId = localStorage.getItem('empresaId') || '1';
  const usuarioNombre = localStorage.getItem('usuarioNombre') || 'Usuario';

  // 2. Consumo de Hooks
  const { usuarioRol,
    cargando, metricas, empleados, cuadraturas, 
    masVendidos, periodo, setPeriodo 
  } = useAdminPanel(API_URL, empresaId);

  const { 
    mostrarModalClientes, setMostrarModalClientes, cargandoClientes, 
    busquedaCliente, setBusquedaCliente, clientesFiltrados, 
    cargandoCierreMes, abrirModalClientes, handleCierreMesCreditos 
  } = useClientes(API_URL, empresaId);

  const { 
    categorias, nuevaCategoria, setNuevaCategoria, 
    editandoCategoriaId,setEditandoCategoriaId, editandoNombre, setEditandoNombre, 
    agregarCategoria, iniciarEdicion, guardarEdicion, eliminarCategoria 
  } = useCategorias(API_URL, empresaId);

  const { 
    notas, nuevaNota, setNuevaNota, 
    agregarNota, eliminarNota 
  } = useNotas(API_URL, empresaId);

  // 3. Estados y lógica específica de la vista que depende de los hooks
  const [filtroCuad, setFiltroCuad] = useState<'semana' | 'mes' | 'todas'>('semana');

  const cuadraturasFiltradas = cuadraturas.filter(c => {
    if (filtroCuad === 'todas') return true;
    
    if (!c.fechaApertura) return false;

    // 1. Creamos las fechas
    const fechaApertura = new Date(c.fechaApertura);
    const ahora = new Date();
    
    // 2. MAGIA: Reseteamos las horas a la medianoche (00:00:00) 
    // para que la comparación sea solo de "días calendario"
    fechaApertura.setHours(0, 0, 0, 0);
    ahora.setHours(0, 0, 0, 0);
    
    // 3. Calculamos la diferencia exacta en días cerrados
    const diasDiferencia = (ahora.getTime() - fechaApertura.getTime()) / (1000 * 3600 * 24);
    
    if (filtroCuad === 'semana') return diasDiferencia <= 7;
    if (filtroCuad === 'mes') return diasDiferencia <= 30;
    
    return true;
  }).sort((a, b) => new Date(b.fechaApertura).getTime() - new Date(a.fechaApertura).getTime());

  if (usuarioRol !== 'admin') return null; 
  if (cargando) return <div className="text-center mt-20 font-medium text-slate-600 text-sm tracking-wide uppercase">Cargando panel de control...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans text-slate-800 relative">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center mb-8 gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">Panel de Administración</h1>
          <p className="text-slate-500 text-sm mt-1">Usuario: {usuarioNombre} | Resumen de gestión comercial</p>
        </div>
        <Link to="/home">
          <button className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 font-medium py-2 px-5 rounded text-sm transition-colors shadow-sm">
            Volver al Punto de Venta
          </button>
        </Link>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUMNA PRINCIPAL (IZQUIERDA) */}
        <div className="lg:col-span-2 space-y-8">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white p-6 rounded shadow-sm border border-slate-200">
              <h3 className="text-slate-500 font-medium text-xs uppercase tracking-wider mb-1">Ventas del Día</h3>
              <p className="text-2xl font-semibold text-slate-900">${metricas.ventasHoy.toLocaleString('es-CL')}</p>
            </div>
            <div className="bg-white p-6 rounded shadow-sm border border-slate-200">
              <h3 className="text-slate-500 font-medium text-xs uppercase tracking-wider mb-1">IVA Acumulado (Mes)</h3>
              <p className="text-2xl font-semibold text-slate-900">${metricas.ivaMes.toLocaleString('es-CL')}</p>
            </div>
            <div className="bg-white p-6 rounded shadow-sm border border-slate-200">
              <h3 className="text-slate-500 font-medium text-xs uppercase tracking-wider mb-1">Ticket Promedio</h3>
              <p className="text-2xl font-semibold text-slate-900">${metricas.ticketPromedio.toLocaleString('es-CL')}</p>
            </div>
            <div className="bg-white p-6 rounded shadow-sm border border-slate-200">
              <h3 className="text-slate-500 font-medium text-xs uppercase tracking-wider mb-1">Capital en Inventario</h3>
              <p className="text-2xl font-semibold text-slate-900">${metricas.costoInventario.toLocaleString('es-CL')}</p>
            </div>
          </div>

          {/* ✨ MONITOREO DE CAJAS EN VIVO ARREGLADO */}
          {cuadraturas.filter(c => c.estado === 'ABIERTA').length > 0 && (
            <div className="bg-slate-900 rounded shadow-md border border-slate-800 p-6 mb-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4">
                <span className="flex items-center gap-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  En Vivo
                </span>
              </div>
              
              <h2 className="text-lg font-semibold text-white uppercase tracking-wide mb-5 flex items-center gap-2">
                Cajas Actualmente Abiertas
              </h2>
              
              {/* Cambiado a maximo 2 columnas para evitar descuadre */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {cuadraturas.filter(c => c.estado === 'ABIERTA').map(cajaAbierta => {
                  const nombreEmpleado = cajaAbierta.cajeroNombre || empleados.find(emp => emp.id === cajaAbierta.cajeroId)?.usuario || `ID: ${cajaAbierta.cajeroId}`;
                  
                  const datosCaja = cajaAbierta as any;
                  
                  const fondoInicial = cajaAbierta.montoApertura || datosCaja.fondoInicial || 0;
                  const ventasEfectivo = datosCaja.ventasEfectivo || 0;
                  const ingresosExtra = datosCaja.ingresosExtra || 0;
                  const abonosCredito = datosCaja.abonosCredito || 0;
                  const retiros = datosCaja.retiros || 0;
                  
                  const totalEnCaja = datosCaja.totalEnCaja || cajaAbierta.totalSistema || (fondoInicial + ventasEfectivo + ingresosExtra + abonosCredito - retiros);
                  
                  const ventasTarjeta = datosCaja.ventasTarjeta || 0;
                  const ventasCredito = datosCaja.ventasCredito || 0;
                  const ventaAcumulada = ventasEfectivo + ventasTarjeta + ventasCredito;

                  return (
                    <div key={cajaAbierta.id} className="bg-white rounded p-5 shadow-lg border border-slate-200 text-sm flex flex-col">
                      
                      <div className="flex justify-between items-start mb-4 border-b border-slate-200 pb-3 gap-2">
                        <div className="min-w-0">
                          <h3 className="text-lg font-bold text-slate-900 uppercase tracking-wide truncate">{nombreEmpleado}</h3>
                          <p className="text-slate-500 text-xs mt-0.5">Turno #{cajaAbierta.id}</p>
                        </div>
                        <div className="text-right text-xs text-slate-500 shrink-0">
                          <p>Apertura:</p>
                          <p className="font-mono text-slate-700 font-semibold mt-0.5">
                            {new Date(cajaAbierta.fechaApertura).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2 font-mono text-xs text-slate-600 flex-1">
                        
                        <h3 className="font-sans font-semibold text-slate-700 mb-2 mt-1 uppercase tracking-wider text-[11px]">Movimientos de Efectivo</h3>
                        
                        {/* Se agrego items-center, gap-2 y shrink-0 a los valores numéricos */}
                        <div className="flex justify-between items-center border-b border-slate-100 pb-1.5 gap-2">
                          <span className="font-sans leading-tight">Fondo Inicial:</span>
                          <span className="font-semibold text-slate-800 whitespace-nowrap shrink-0">${fondoInicial.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-slate-100 pb-1.5 gap-2">
                          <span className="font-sans leading-tight">Ventas en Efectivo:</span>
                          <span className="font-semibold text-slate-800 whitespace-nowrap shrink-0">+ ${ventasEfectivo.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-slate-100 pb-1.5 gap-2">
                          <span className="font-sans leading-tight">Ingresos Extra:</span>
                          <span className="font-semibold text-slate-800 whitespace-nowrap shrink-0">+ ${ingresosExtra.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-slate-100 pb-1.5 gap-2">
                          <span className="font-sans leading-tight">Abonos Crédito (Efectivo):</span>
                          <span className="font-semibold text-slate-800 whitespace-nowrap shrink-0">+ ${abonosCredito.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-slate-100 pb-1.5 gap-2">
                          <span className="font-sans leading-tight">Retiros Operativos:</span>
                          <span className="font-semibold text-red-700 whitespace-nowrap shrink-0">- ${retiros.toLocaleString()}</span>
                        </div>
                        
                        <div className="flex justify-between items-center border-t border-slate-300 pt-2.5 mt-2 mb-4 text-sm gap-2">
                          <span className="font-sans font-bold text-slate-900 leading-tight">Total Físico en Caja:</span>
                          <span className="font-bold text-emerald-600 whitespace-nowrap shrink-0">${totalEnCaja.toLocaleString()}</span>
                        </div>

                        <h3 className="font-sans font-semibold text-slate-700 mb-2 mt-4 uppercase tracking-wider text-[11px]">Otros Medios y Totales</h3>
                        
                        <div className="flex justify-between items-center border-b border-slate-100 pb-1.5 gap-2">
                          <span className="font-sans leading-tight">Transacciones con Tarjeta:</span>
                          <span className="font-semibold text-slate-800 whitespace-nowrap shrink-0">+ ${ventasTarjeta.toLocaleString()}</span>
                        </div>

                        <div className="flex justify-between items-center border-b border-slate-100 pb-1.5 mt-1 gap-2">
                          <span className="font-sans leading-tight">Ventas a Crédito (Vales):</span>
                          <span className="font-semibold text-slate-800 whitespace-nowrap shrink-0">+ ${ventasCredito.toLocaleString()}</span>
                        </div>

                        <div className="flex justify-between items-center bg-slate-100 p-3 rounded border border-slate-200 mt-4 text-sm gap-2">
                          <span className="font-sans font-bold text-slate-900 uppercase tracking-wide leading-tight">
                            Venta Total Acumulada
                          </span>
                          <span className="font-bold text-slate-900 whitespace-nowrap shrink-0">
                            ${ventaAcumulada.toLocaleString()}
                          </span>
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {/* ✨ FIN MONITOREO EN VIVO */}

          <div className="bg-white rounded shadow-sm border border-slate-200 p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 border-b border-slate-100 pb-3 gap-3">
              <div>
                <h2 className="text-base font-semibold text-slate-800 uppercase tracking-wide">Cuadraturas de Caja</h2>
                <p className="text-slate-500 text-xs">Registro y control de diferencias de efectivo por cajero.</p>
              </div>
              <select 
                value={filtroCuad} 
                onChange={(e) => setFiltroCuad(e.target.value as 'semana' | 'mes' | 'todas')}
                className="bg-slate-50 border border-slate-300 text-slate-700 font-medium p-2 rounded text-sm outline-none cursor-pointer focus:border-slate-500"
              >
                <option value="semana">Últimos 7 días</option>
                <option value="mes">Últimos 30 días</option>
                <option value="todas">Histórico Completo</option>
              </select>
            </div>
            
            <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
              <table className="w-full text-left text-sm relative">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium sticky top-0">
                  <tr>
                    <th className="p-3">Turno / Cajero</th>
                    <th className="p-3">Horario</th>
                    <th className="p-3 text-right">Sistema</th>
                    <th className="p-3 text-right">Real Físico</th>
                    <th className="p-3 text-right">Diferencia</th>
                    <th className="p-3 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cuadraturasFiltradas.map(c => {
                    const diferencia = c.diferencia || 0;
                    const esFaltante = diferencia < 0;
                    const esSobrante = diferencia > 0;
                    const nombreEmpleado = c.cajeroNombre || empleados.find(emp => emp.id === c.cajeroId)?.usuario || `ID: ${c.cajeroId}`;

                    return (
                      <tr key={c.id} className="hover:bg-slate-50">
                        <td className="p-3 font-medium text-slate-800">
                          <div>{nombreEmpleado}</div>
                          <span className="text-xs font-mono text-slate-400">Turno #{c.id}</span>
                        </td>
                        <td className="p-3 text-xs text-slate-600 whitespace-nowrap">
                          <div><strong>Abre:</strong> {new Date(c.fechaApertura).toLocaleString('es-CL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</div>
                          <div><strong>Cierra:</strong> {c.fechaCierre ? new Date(c.fechaCierre).toLocaleString('es-CL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '---'}</div>
                        </td>
                        <td className="p-3 text-right text-slate-700 font-mono">
                          ${(c.totalSistema || 0).toLocaleString('es-CL')}
                        </td>
                        <td className="p-3 text-right font-semibold text-slate-900 font-mono">
                          ${(c.totalRealFisico || 0).toLocaleString('es-CL')}
                        </td>
                        <td className={`p-3 text-right font-bold font-mono ${
                          esFaltante ? 'text-red-600' : esSobrante ? 'text-emerald-600' : 'text-slate-500'
                        }`}>
                          {esFaltante && 'Falta: '}
                          {esSobrante && 'Sobra: '}
                          {diferencia === 0 && 'Exacto: '}
                          ${Math.abs(diferencia).toLocaleString('es-CL')}
                        </td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase ${
                            c.estado === 'ABIERTA' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {c.estado}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {cuadraturasFiltradas.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center p-8 text-slate-400 text-sm">No hay registros para el período seleccionado.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded shadow-sm border border-slate-200 p-6">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
              <h2 className="text-base font-semibold text-slate-800 uppercase tracking-wide">Productos Con Mayor Demanda</h2>
              <select 
                value={periodo} 
                onChange={(e) => setPeriodo(e.target.value as 'dia' | 'semana' | 'mes')}
                className="bg-slate-50 border border-slate-300 text-slate-700 font-medium p-2 rounded text-sm outline-none cursor-pointer focus:border-slate-500"
              >
                <option value="dia">Día en curso</option>
                <option value="semana">Últimos 7 días</option>
                <option value="mes">Mes actual</option>
              </select>
            </div>
            
            <div className="space-y-3">
              {masVendidos.map((prod, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded border border-slate-100 text-sm">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 flex items-center justify-center font-semibold text-xs rounded bg-slate-200 text-slate-700">
                      {index + 1}
                    </span>
                    <span className="font-medium text-slate-800">{prod.nombre}</span>
                  </div>
                  <span className="bg-slate-200 text-slate-800 font-semibold px-2.5 py-0.5 rounded text-xs">
                    {prod.total} unds.
                  </span>
                </div>
              ))}
              {masVendidos.length === 0 && (
                <p className="text-center text-slate-400 text-sm my-4">No existen registros para el período seleccionado.</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded shadow-sm border border-slate-200 p-6">
            <h2 className="text-base font-semibold text-slate-800 uppercase tracking-wide mb-4 border-b border-slate-100 pb-3">Personal del Sistema</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
                  <tr>
                    <th className="p-3">ID</th>
                    <th className="p-3">Nombre de Usuario</th>
                    <th className="p-3">Rol Asignado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {empleados.map(emp => (
                    <tr key={emp.id} className="hover:bg-slate-50">
                      <td className="p-3 text-slate-500 font-mono">#{emp.id}</td>
                      <td className="p-3 font-medium text-slate-800">{emp.usuario}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          emp.rol === 'admin' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {emp.rol.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* COLUMNA DERECHA */}
        <div className="space-y-8">
          
          <div className="bg-white rounded shadow-sm border border-slate-200 p-6">
            <h2 className="text-base font-semibold text-slate-800 uppercase tracking-wide mb-1">Gestión de Cartera</h2>
            <p className="text-slate-500 text-xs mb-4 border-b border-slate-100 pb-3">
              Administración del directorio de clientes y reportes de deudores.
            </p>
            
            <div className="space-y-3">
              <button
                onClick={handleCierreMesCreditos}
                disabled={cargandoCierreMes}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 rounded shadow-sm transition-colors text-xs uppercase tracking-wider disabled:opacity-50"
              >
                {cargandoCierreMes ? 'Generando Archivo...' : 'Cerrar Mes y Exportar Excel'}
              </button>

              <button
                onClick={abrirModalClientes}
                className="w-full bg-slate-800 hover:bg-slate-900 text-white font-medium py-3 rounded shadow-sm transition-colors text-xs uppercase tracking-wider"
              >
                Ver Directorio de Clientes
              </button>
            </div>
          </div>

          <div className="bg-white rounded shadow-sm border border-slate-200 p-6 flex flex-col h-full max-h-[500px]">
            <h2 className="text-base font-semibold text-slate-800 uppercase tracking-wide mb-4 border-b border-slate-100 pb-3">Notas Administrativas</h2>
            <form onSubmit={agregarNota} className="mb-4">
              <input 
                type="text" 
                placeholder="Ingresar nuevo registro..." 
                value={nuevaNota}
                onChange={(e) => setNuevaNota(e.target.value)}
                className="w-full p-2.5 rounded border border-slate-300 bg-white focus:outline-none focus:border-slate-500 text-sm"
              />
            </form>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {notas.map(nota => (
                <div key={nota.id} className="bg-slate-50 p-3 rounded border border-slate-200 flex justify-between items-center gap-2 group text-sm">
                  <p className="text-slate-700">{nota.texto}</p>
                  <button 
                    onClick={() => eliminarNota(nota.id)} 
                    className="text-slate-400 hover:text-red-600 font-mono text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    [X]
                  </button>
                </div>
              ))}
              {notas.length === 0 && <p className="text-center text-slate-400 text-sm mt-4">Sin notas registradas.</p>}
            </div>
          </div>

          {/* ✨ GESTIÓN DE CATEGORÍAS MOVIDA ADENTRO DE LA COLUMNA DERECHA */}
          <div className="bg-white rounded shadow-sm border border-slate-200 p-6 flex flex-col h-full max-h-[500px]">
            <h2 className="text-base font-semibold text-slate-800 uppercase tracking-wide mb-4 border-b border-slate-100 pb-3">Gestión de Categorías</h2>
            
            <form onSubmit={agregarCategoria} className="mb-4 flex gap-2">
              <input 
                type="text" 
                placeholder="Nueva categoría..." 
                value={nuevaCategoria}
                onChange={(e) => setNuevaCategoria(e.target.value)}
                className="w-full p-2.5 rounded border border-slate-300 bg-white focus:outline-none focus:border-slate-500 text-sm"
              />
              <button 
                type="submit" 
                className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
              >
                Agregar
              </button>
            </form>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {categorias.map(cat => (
                <div key={cat.id} className="bg-slate-50 p-3 rounded border border-slate-200 flex justify-between items-center gap-2 text-sm">
                  {editandoCategoriaId === cat.id ? (
                    <div className="flex w-full gap-2 items-center">
                      <input
                        type="text"
                        value={editandoNombre}
                        onChange={(e) => setEditandoNombre(e.target.value)}
                        className="w-full p-1.5 border border-slate-300 rounded text-sm focus:outline-none focus:border-slate-500"
                        autoFocus
                      />
                      <button onClick={() => guardarEdicion(cat.id)} className="text-emerald-600 hover:text-emerald-700 font-semibold text-xs transition-colors">
                        Guardar
                      </button>
                      <button onClick={() => setEditandoCategoriaId(null)} className="text-slate-400 hover:text-slate-600 font-semibold text-xs transition-colors">
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="font-medium text-slate-700">{cat.nombre}</span>
                      <div className="flex gap-3">
                        <button onClick={() => iniciarEdicion(cat)} className="text-blue-600 hover:text-blue-800 font-medium text-xs transition-colors">
                          Editar
                        </button>
                        <button onClick={() => eliminarCategoria(cat.id)} className="text-red-500 hover:text-red-700 font-medium text-xs transition-colors">
                          Eliminar
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
              {categorias.length === 0 && <p className="text-center text-slate-400 text-sm mt-4">Sin categorías registradas.</p>}
            </div>
          </div>

        </div>

      </div>

      {/* ✨ MODAL DE DIRECTORIO DE CLIENTES */}
      {mostrarModalClientes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl flex flex-col max-h-[90vh]">
            
            <div className="flex justify-between items-center p-5 border-b border-slate-200 bg-slate-50 rounded-t-lg">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Directorio de Clientes</h2>
                <p className="text-sm text-slate-500">Busca, visualiza y audita la cartera completa de clientes registrados.</p>
              </div>
              <button 
                onClick={() => setMostrarModalClientes(false)}
                className="text-slate-400 hover:text-slate-700 text-2xl font-semibold leading-none focus:outline-none"
              >
                &times;
              </button>
            </div>

            <div className="p-5 border-b border-slate-100">
              <input 
                type="text"
                placeholder="Buscar cliente por nombre o RUT..."
                value={busquedaCliente}
                onChange={(e) => setBusquedaCliente(e.target.value)}
                className="w-full p-3 rounded border border-slate-300 bg-white focus:outline-none focus:border-slate-500 text-sm"
              />
            </div>

            <div className="p-5 overflow-y-auto flex-1 bg-slate-50">
              {cargandoClientes ? (
                <div className="text-center py-10 text-slate-500">Cargando directorio...</div>
              ) : (
                <div className="overflow-x-auto bg-white border border-slate-200 rounded">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-100 border-b border-slate-200 text-slate-600 font-medium sticky top-0">
                      <tr>
                        <th className="p-3">ID / RUT</th>
                        <th className="p-3">Nombre Cliente</th>
                        <th className="p-3">Teléfono</th>
                        <th className="p-3 text-right">Límite Crédito</th>
                        <th className="p-3 text-right">Deuda Actual</th>
                        <th className="p-3 text-center">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {clientesFiltrados.map(cliente => (
                        <tr key={cliente.id} className="hover:bg-slate-50">
                          <td className="p-3 text-slate-500 whitespace-nowrap">
                            <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded mr-2">#{cliente.id}</span>
                            {cliente.rut}
                          </td>
                          <td className="p-3 font-medium text-slate-800">{cliente.nombre}</td>
                          <td className="p-3 text-slate-600">{cliente.telefono || 'N/A'}</td>
                          <td className="p-3 text-right text-slate-700 font-mono">
                            ${cliente.limiteCredito.toLocaleString('es-CL')}
                          </td>
                          <td className={`p-3 text-right font-bold font-mono ${cliente.deudaActual > 0 ? 'text-red-600' : 'text-slate-600'}`}>
                            ${cliente.deudaActual.toLocaleString('es-CL')}
                          </td>
                          <td className="p-3 text-center">
                            {cliente.deudaActual > 0 ? (
                              <span className="px-2 py-1 rounded bg-red-100 text-red-700 text-xs font-semibold">Con Deuda</span>
                            ) : (
                              <span className="px-2 py-1 rounded bg-emerald-100 text-emerald-700 text-xs font-semibold">Al Día</span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {clientesFiltrados.length === 0 && (
                        <tr>
                          <td colSpan={6} className="text-center p-8 text-slate-400">
                            No se encontraron clientes que coincidan con la búsqueda.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );}