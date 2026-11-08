import { useEffect, useRef, useState, useCallback } from 'react';
import Swal from 'sweetalert2';

// Hooks
import { useInventario } from '../hooks/useInventario';
import { useVentas } from '../hooks/useVentas';
import { copiasTicket, guardarCopiasTicket, guardarImpresionAutomatica, impresionAutomaticaActiva } from '../helpers/impresion';
import { estadoPuente, gavetaPorEvento, GUIA_DRIVER_HTML, guardarModoGaveta, modoGaveta, type ModoGaveta } from '../helpers/gaveta';
import { apiFetch, leerError } from '../helpers/apiFetch';
import { useCaja } from '../hooks/useCaja';
import { useClientesPos } from '../hooks/useClientesPos';

// Componentes y Modales
import { LectorCamara } from '../components/LectorCamara';
import { PantallaCargando, PantallaApertura } from '../components/Ventas/PantallasCaja';
import { ModalMovimiento } from '../components/Ventas/Modales/ModalMovimiento';
import { ModalPago } from '../components/Ventas/Modales/ModalPago';
import { ModalConsultaCliente } from '../components/Ventas/Modales/ModalConsultaCliente';
import { ModalNuevoCliente } from '../components/Ventas/Modales/ModalNuevoCliente';
import { ModalCierre } from '../components/Ventas/Modales/ModalCierre';
import { ModalResumen } from '../components/Ventas/Modales/ModalResumen';
import { ModalFiadoManual } from '../components/Ventas/Modales/ModalFiadoManual';
import { imprimirValesManuales } from '../helpers/valeManual';
import { useEstadoConexion } from '../hooks/useEstadoConexion';

// UI de Ventas
import { BuscadorVentas } from '../components/Ventas/UI/BuscadorVentas';
import { DetalleCarrito } from '../components/Ventas/UI/DetalleCarrito';
import { DesglosePago } from '../components/Ventas/UI/DesglosePago';

import { getSesion } from '../helpers/session';
import { EVENTO_CONEXION_RESTABLECIDA, EVENTO_VENTAS_SINCRONIZADAS } from '../helpers/conexion';
export const Ventas = () => {
  // Para la UI solamente: el servidor identifica empresa y usuario por el token
  const empresaId = getSesion()?.empresa.id ?? 0;
  
  // Refs y estados de UI
  const buscadorRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [pagaCon, setPagaCon] = useState(0);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [mostrarCamara, setMostrarCamara] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [showModalFiadoManual, setShowModalFiadoManual] = useState(false);
  // Sin conexión no se puede dar fiado: se anota en un vale de papel y se registra después
  const sinRed = useEstadoConexion() === 'sin-conexion';

  // 1. Hooks de Negocio
  const { productos, cargarProductos, catalogoGuardadoEn, descontarLocal } = useInventario({ copiaSinConexion: true }); 
  
  const ventasContext = useVentas(cargarProductos, descontarLocal); 
  const { 
    carrito, agregarAlCarrito, actualizarCantidad, totalVenta, 
    eliminarDelCarrito, confirmarVentaFinal, showModalPago, 
    busqueda, setBusqueda, setShowModalPago, pagos, setPagos, permiteFiado,
    clienteId, setClienteId, editarCantidadGranel,
    comprobante, setComprobante, correoComprobante, setCorreoComprobante
  } = ventasContext;

  const [imprimirAuto, setImprimirAuto] = useState(impresionAutomaticaActiva());
  const [copias, setCopias] = useState<1 | 2>(copiasTicket());
  const [gaveta, setGaveta] = useState<ModoGaveta>(modoGaveta());
  const esAdmin = (localStorage.getItem('usuarioRol') || '').toLowerCase().trim() === 'admin';

  // 2. Hook de Caja
  const cajaContext = useCaja();
  const { 
    cargandoCaja, cajaAbierta, montoApertura, setMontoApertura,
    showModalMovimiento, setShowModalMovimiento, tipoMovimiento, setTipoMovimiento,
    montoMovimiento, setMontoMovimiento, motivoMovimiento, setMotivoMovimiento,
    showModalResumen, setShowModalResumen, datosResumen, cargandoResumen,
    showModalCierre, efectivoFisicoDeclarado, setEfectivoFisicoDeclarado,
    faseCierre, datosCierreCalculados,
    handleAbrirCaja, handleCerrarCaja, handleRegistrarMovimiento, handleVerResumen,
    handleProcesarDeclaracion, handleConfirmarCierreFinal
  } = cajaContext;

  // 3. Hook de Clientes
const clientesContext = useClientesPos(setClienteId);
  const {
    showModalNuevoCliente, setShowModalNuevoCliente, nuevoCliente, setNuevoCliente,
    showModalConsultaCliente, setShowModalConsultaCliente, terminoBusquedaCliente, setTerminoBusquedaCliente,
    clienteConsultado, setClienteConsultado, montoAbono, setMontoAbono, cargandoConsultaCliente,
    metodoPagoAbono, setMetodoPagoAbono,
    handleCrearCliente, handleBuscarClienteConsulta, handleAbonarDeuda, handleCambioRutNuevoCliente
  } = clientesContext;

  // Cálculos rápidos
  const totalBruto = totalVenta; 
  const neto = Math.round(totalBruto / 1.19);
  const iva = totalBruto - neto;

  // Al volver la conexión se reemplaza el catálogo guardado por el actual del servidor
  useEffect(() => {
    const alVolver = () => { void cargarProductos(); };
    window.addEventListener(EVENTO_CONEXION_RESTABLECIDA, alVolver);
    window.addEventListener(EVENTO_VENTAS_SINCRONIZADAS, alVolver);
    return () => {
      window.removeEventListener(EVENTO_CONEXION_RESTABLECIDA, alVolver);
      window.removeEventListener(EVENTO_VENTAS_SINCRONIZADAS, alVolver);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Efecto para cerrar menús al clickear afuera
  useEffect(() => {
    const handleClickAfuera = (event: MouseEvent) => {
      if (buscadorRef.current && !buscadorRef.current.contains(event.target as Node)) setMostrarSugerencias(false);
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuAbierto(false);
    };
    document.addEventListener("mousedown", handleClickAfuera);
    return () => document.removeEventListener("mousedown", handleClickAfuera);
  }, []);

  const procesarCodigoEscaneado = useCallback((codigo: string) => {
    setBusqueda('');
    setMostrarSugerencias(false);

    const productoEncontrado = productos.find(
      p => p.codigoBarras === codigo || p.id.toString() === codigo
    );
    
    if (productoEncontrado) {
      if (productoEncontrado.esInsumo) {
         Swal.fire('Restricción de Operación', 'El ítem escaneado está categorizado como insumo y no está habilitado para venta directa.', 'warning');
         return;
      }
      agregarAlCarrito(productoEncontrado);
      const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 1000 });
      if (!productoEncontrado.pesable) Toast.fire({ icon: 'success', title: 'Ítem incorporado a la orden' });
    } else {
      Swal.fire('Código no Registrado', `No existe un producto vinculado al código: ${codigo}`, 'warning');
    }
  }, [productos, agregarAlCarrito, setBusqueda]);

  useEffect(() => {
    let barcodeBuffer = '';
    let typingTimer: ReturnType<typeof setTimeout>;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toUpperCase();
      if (activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT') return;

      if (e.key === 'Enter') {
        if (barcodeBuffer.length > 0) {
          e.preventDefault();
          procesarCodigoEscaneado(barcodeBuffer);
          barcodeBuffer = ''; 
        }
        return;
      }

      if (e.key.length === 1) {
        barcodeBuffer += e.key;
        clearTimeout(typingTimer);
        typingTimer = setTimeout(() => { barcodeBuffer = ''; }, 100);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
      clearTimeout(typingTimer);
    };
  }, [procesarCodigoEscaneado]);

  const sugerencias = busqueda.trim() === '' 
    ? [] 
    : productos.filter(p => 
        p.descripcion.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.codigoBarras?.includes(busqueda) ||
        p.id.toString().includes(busqueda)
      ).slice(0, 5);

  if (cargandoCaja) return <PantallaCargando />;
  if (!cajaAbierta) return (
    <PantallaApertura 
      montoApertura={montoApertura} 
      setMontoApertura={setMontoApertura} 
      handleAbrirCaja={handleAbrirCaja} 
    />
  );

  return (
    <div className='flex flex-col items-center font-sans text-slate-800'>
      
      {/* 1. CABECERA Y MENÚ OPERATIVO */}
      <div className="w-full max-w-6xl flex justify-between items-center mb-8 border-b border-slate-200 pb-4">
        <div>
          <h1 className='text-3xl font-semibold text-slate-900 tracking-tight'>Terminal de Punto de Venta</h1>
          <p className="text-slate-500 text-sm mt-0.5">Operación de caja y procesamiento de transacciones.</p>
        </div>
        
        <div className="relative" ref={menuRef}>
          <button 
            onClick={() => setMenuAbierto(!menuAbierto)}
            className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 font-medium py-2 px-4 rounded text-sm transition-colors shadow-sm"
          >
             Opciones Operativas
          </button>
          {menuAbierto && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded shadow-md border border-slate-200 overflow-hidden z-20 text-sm">
              <button onClick={() => { setShowModalNuevoCliente(true); setMenuAbierto(false); }} className="w-full text-left px-4 py-2.5 hover:bg-slate-50 font-medium text-slate-700 border-b border-slate-100">+ Crear Nuevo Cliente</button>
              <button onClick={() => { setShowModalConsultaCliente(true); setMenuAbierto(false); }} className="w-full text-left px-4 py-2.5 hover:bg-slate-50 font-medium text-slate-700 border-b border-slate-100">🔍 Consultar / Abonar Cliente</button>
              <button onClick={() => { setTipoMovimiento('ingreso'); setShowModalMovimiento(true); setMenuAbierto(false); }} className="w-full text-left px-4 py-2.5 hover:bg-slate-50 font-medium text-slate-700 border-b border-slate-100">Registrar Ingreso</button>
              <button onClick={() => { setTipoMovimiento('retiro'); setShowModalMovimiento(true); setMenuAbierto(false); }} className="w-full text-left px-4 py-2.5 hover:bg-slate-50 font-medium text-slate-700 border-b border-slate-100">Registrar Retiro</button>
              <button onClick={() => { setMenuAbierto(false); void (async () => {
                const r = await Swal.fire({
                  title: 'Vales de fiado en papel',
                  html: 'Para dar fiado cuando no hay conexión. Cada hoja trae un vale numerado con copia para el local y copia para el cliente.<br><br>¿Cuántas hojas imprimir?',
                  input: 'number', inputValue: 5, inputAttributes: { min: '1', max: '20' },
                  showCancelButton: true, confirmButtonText: 'Imprimir', cancelButtonText: 'Cancelar',
                });
                if (!r.isConfirmed) return;
                const numeros = await imprimirValesManuales(Number(r.value));
                void Swal.fire('Vales listos', `Numeración impresa: ${numeros[0]} a ${numeros[numeros.length - 1]}. Guárdalos para cuando no haya conexión.`, 'success');
              })(); }} className="w-full text-left px-4 py-2.5 hover:bg-slate-50 font-medium text-slate-700 border-b border-slate-100">🧾 Imprimir vales de fiado (papel)</button>
              <button onClick={() => { setShowModalFiadoManual(true); setMenuAbierto(false); }} className="w-full text-left px-4 py-2.5 hover:bg-slate-50 font-medium text-slate-700 border-b border-slate-100">✍️ Registrar fiado desde vale</button>
              <label className="flex items-center justify-between gap-3 w-full px-4 py-2.5 hover:bg-slate-50 font-medium text-slate-700 border-b border-slate-100 cursor-pointer">
                <span>🖨️ Imprimir ticket al vender</span>
                <input
                  type="checkbox"
                  checked={imprimirAuto}
                  onChange={(e) => { setImprimirAuto(e.target.checked); guardarImpresionAutomatica(e.target.checked); }}
                />
              </label>
              <label className="flex items-center justify-between gap-3 w-full px-4 py-2.5 border-b border-slate-100 font-medium text-slate-700">
                <span>Copias del comprobante</span>
                <select
                  value={copias}
                  onChange={(e) => { const v = e.target.value === '2' ? 2 : 1; setCopias(v); guardarCopiasTicket(v); }}
                  className="rounded border border-slate-300 bg-white px-1 py-0.5 text-sm"
                >
                  <option value={1}>1 (cliente)</option>
                  <option value={2}>2 (cliente y local)</option>
                </select>
              </label>
              <label className="flex items-center justify-between gap-3 w-full px-4 py-2.5 border-b border-slate-100 font-medium text-slate-700">
                <span>💵 Gaveta de efectivo</span>
                <select
                  value={gaveta}
                  onChange={(e) => { const v = e.target.value as ModoGaveta; setGaveta(v); guardarModoGaveta(v); if (v === 'IMPRESION') { setImprimirAuto(true); } }}
                  className="rounded border border-slate-300 bg-white px-1 py-0.5 text-sm"
                >
                  <option value="NINGUNA">No usar</option>
                  <option value="IMPRESION">Al imprimir (sin instalar)</option>
                  <option value="PUENTE">Programa local</option>
                </select>
              </label>
              {gaveta === 'IMPRESION' && (
                <button onClick={() => { setMenuAbierto(false); void Swal.fire({ title: 'Configurar la gaveta', html: GUIA_DRIVER_HTML, confirmButtonText: 'Entendido' }); }} className="w-full text-left px-4 py-2.5 hover:bg-slate-50 font-medium text-slate-700 border-b border-slate-100">❓ Cómo configurar la gaveta</button>
              )}
              {gaveta !== 'NINGUNA' && (
                <button onClick={() => { setMenuAbierto(false); void (async () => {
                  if (gaveta === 'PUENTE') {
                    const est = await estadoPuente();
                    if (!est.ok) {
                      void Swal.fire('Gaveta sin conexión', `${est.error} Instala o inicia el programa de la gaveta (carpeta gaveta-puente, archivo LEEME.md).`, 'warning');
                      return;
                    }
                  }
                  const ok = await gavetaPorEvento({ tipo: 'prueba' });
                  void Swal.fire(ok ? 'Orden enviada' : 'No se pudo enviar', ok ? '¿Se abrió la gaveta? Si no, revisa el cable y la opción de gaveta en la impresora (botón "Cómo configurar").' : 'Revisa la impresora y vuelve a intentar.', ok ? 'success' : 'error');
                })(); }} className="w-full text-left px-4 py-2.5 hover:bg-slate-50 font-medium text-slate-700 border-b border-slate-100">🔌 Probar gaveta</button>
              )}
              {gaveta !== 'NINGUNA' && esAdmin && (
                <button onClick={() => { setMenuAbierto(false); void (async () => {
                  const r = await Swal.fire({
                    title: 'Abrir gaveta sin venta',
                    input: 'text', inputPlaceholder: 'Motivo (obligatorio)',
                    inputValidator: (v) => (v && v.trim().length >= 3 ? null : 'Escribe el motivo'),
                    showCancelButton: true, confirmButtonText: 'Abrir', cancelButtonText: 'Cancelar',
                  });
                  if (!r.isConfirmed) return;
                  try {
                    const motivo = String(r.value).trim();
                    const res = await apiFetch(`${import.meta.env.VITE_API_URL}/caja/gaveta/abrir`, { method: 'POST', body: JSON.stringify({ motivo }) });
                    if (!res.ok) throw new Error(await leerError(res, 'No se pudo registrar la apertura'));
                    await gavetaPorEvento({ tipo: 'sin_venta', motivo });
                  } catch (e) {
                    void Swal.fire('No se abrió', e instanceof Error ? e.message : 'Error al registrar la apertura', 'error');
                  }
                })(); }} className="w-full text-left px-4 py-2.5 hover:bg-slate-50 font-medium text-slate-700 border-b border-slate-100">🔓 Abrir gaveta sin venta (queda registrado)</button>
              )}
              <button onClick={() => { handleVerResumen(); setMenuAbierto(false); }} className="w-full text-left px-4 py-2.5 hover:bg-slate-50 font-medium text-slate-700 border-b border-slate-100">Resumen Financiero</button>
              <button onClick={() => { handleCerrarCaja(); setMenuAbierto(false); }} className="w-full text-left px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-medium">Cierre de Turno</button>
            </div>
          )}
        </div>
      </div>

      {sinRed && (
        <div role="note" className="w-full max-w-6xl mb-4 rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-700">
          <b>Fiado sin conexión:</b> no está disponible en pantalla. Anótalo en un vale de papel (se imprimen desde <i>Opciones Operativas</i>) con el cliente firmando, y regístralo después con <i>Registrar fiado desde vale</i>.
        </div>
      )}

      {catalogoGuardadoEn && (
        <div role="status" className="w-full max-w-6xl mb-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm font-semibold text-amber-900">
          Sin conexión: se usa el catálogo guardado en este equipo a las {new Date(catalogoGuardadoEn).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}. Precios y stock pueden no estar al día.
        </div>
      )}

      {/* 2. BUSCADOR DE PRODUCTOS */}
      <BuscadorVentas 
        busqueda={busqueda} 
        setBusqueda={setBusqueda} 
        mostrarSugerencias={mostrarSugerencias} 
        setMostrarSugerencias={setMostrarSugerencias}
        sugerencias={sugerencias} 
        procesarCodigoEscaneado={procesarCodigoEscaneado}
        onAbrirCamara={() => setMostrarCamara(true)} 
        buscadorRef={buscadorRef}
      />

      {/* 3. GRILLA CENTRAL: CARRITO Y DESGLOSE */}
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-6">
        <DetalleCarrito 
          carrito={carrito} 
          actualizarCantidad={actualizarCantidad} 
          eliminarDelCarrito={eliminarDelCarrito} 
          editarCantidadGranel={editarCantidadGranel}
        />
        <DesglosePago 
          neto={neto} 
          iva={iva} 
          totalBruto={totalBruto} 
          carritoVacio={carrito.length === 0}
          onProcesarCobro={() => { setPagos([{ metodo: 'EFECTIVO', monto: Math.round(totalBruto) }]); setShowModalPago(true); }} 
        />
      </div>

      {/* 4. ZONA DE MODALES */}
      <ModalMovimiento 
        show={showModalMovimiento}
        onClose={() => setShowModalMovimiento(false)}
        tipoMovimiento={tipoMovimiento}
        montoMovimiento={montoMovimiento}
        setMontoMovimiento={setMontoMovimiento}
        motivoMovimiento={motivoMovimiento}
        setMotivoMovimiento={setMotivoMovimiento}
        handleRegistrarMovimiento={handleRegistrarMovimiento}
      />
      
      <ModalPago 
        show={showModalPago} 
        onClose={() => { setShowModalPago(false); setPagaCon(0); setClienteId(null); setPagos([]); }}
        empresaId={empresaId}
        totalBruto={totalBruto} 
        pagos={pagos}
        setPagos={setPagos}
        permiteFiado={permiteFiado && !sinRed}
        clienteId={clienteId} 
        setClienteId={setClienteId} 
        pagaCon={pagaCon} 
        setPagaCon={setPagaCon}
        onAbrirNuevoCliente={() => setShowModalNuevoCliente(true)} 
        confirmarVentaFinal={confirmarVentaFinal}
        comprobante={comprobante}
        setComprobante={setComprobante}
        correoComprobante={correoComprobante}
        setCorreoComprobante={setCorreoComprobante}
      />

      <ModalFiadoManual
        show={showModalFiadoManual}
        onClose={() => setShowModalFiadoManual(false)}
        productos={productos}
        onRegistrado={() => { void cargarProductos(); }}
      />

      <ModalConsultaCliente 
        show={showModalConsultaCliente} 
        onClose={() => setShowModalConsultaCliente(false)}
        empresaId={empresaId}
        terminoBusquedaCliente={terminoBusquedaCliente} 
        setTerminoBusquedaCliente={setTerminoBusquedaCliente}
        cargandoConsultaCliente={cargandoConsultaCliente} 
        handleBuscarClienteConsulta={handleBuscarClienteConsulta}
        clienteConsultado={clienteConsultado} 
        setClienteConsultado={setClienteConsultado}
        montoAbono={montoAbono} 
        setMontoAbono={setMontoAbono} 
        metodoPagoAbono={metodoPagoAbono}            // ✨ NUEVO PROP
        setMetodoPagoAbono={setMetodoPagoAbono}      // ✨ NUEVO PROP
        handleAbonarDeuda={(e) => handleAbonarDeuda(e, metodoPagoAbono)} // ✨ Pásale el método de pago a tu función
      />

      <ModalNuevoCliente 
        show={showModalNuevoCliente} 
        onClose={() => setShowModalNuevoCliente(false)} 
        nuevoCliente={nuevoCliente} 
        setNuevoCliente={setNuevoCliente} 
        handleCrearCliente={handleCrearCliente} 
        handleCambioRutNuevoCliente={handleCambioRutNuevoCliente} 
      />

      <ModalCierre 
        show={showModalCierre} 
        faseCierre={faseCierre} 
        datosCierreCalculados={datosCierreCalculados}
        efectivoFisicoDeclarado={efectivoFisicoDeclarado} 
        setEfectivoFisicoDeclarado={setEfectivoFisicoDeclarado}
        handleProcesarDeclaracion={handleProcesarDeclaracion} 
        handleConfirmarCierreFinal={handleConfirmarCierreFinal}
      />

      <ModalResumen 
        show={showModalResumen}
        onClose={() => setShowModalResumen(false)}
        cargandoResumen={cargandoResumen}
        datosResumen={datosResumen}
      />

      {mostrarCamara && (
        <LectorCamara 
          onScan={procesarCodigoEscaneado} 
          onClose={() => setMostrarCamara(false)} 
        />
      )}
    </div>
  );
};