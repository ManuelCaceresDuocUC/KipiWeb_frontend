import { useEffect, useRef, useState, useCallback } from 'react';
import Swal from 'sweetalert2';

// Hooks
import { useInventario } from '../hooks/useInventario';
import { useVentas } from '../hooks/useVentas';
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

// UI de Ventas
import { BuscadorVentas } from '../components/Ventas/UI/BuscadorVentas';
import { DetalleCarrito } from '../components/Ventas/UI/DetalleCarrito';
import { DesglosePago } from '../components/Ventas/UI/DesglosePago';

export const Ventas = () => {
  const usuarioId = localStorage.getItem('usuarioId') || "1";
  // ✨ Obtenemos el empresaId desde localStorage
  const empresaId = Number(localStorage.getItem('empresaId')) || 1;
  
  // Refs y estados de UI
  const buscadorRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [pagaCon, setPagaCon] = useState(0);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [mostrarCamara, setMostrarCamara] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);
const [metodoPagoAbono, setMetodoPagoAbono] = useState<'EFECTIVO' | 'TARJETA'>('EFECTIVO');
  // 1. Hooks de Negocio
  const { productos, cargarProductos } = useInventario(); 
  
  const ventasContext = useVentas(cargarProductos); 
  const { 
    carrito, agregarAlCarrito, actualizarCantidad, totalVenta, 
    eliminarDelCarrito, confirmarVentaFinal, showModalPago, 
    busqueda, setBusqueda, setShowModalPago, metodoPago, 
    setMetodoPago, proveedorTarjeta, setProveedorTarjeta, 
    clienteId, setClienteId 
  } = ventasContext;

  // 2. Hook de Caja
  const cajaContext = useCaja(usuarioId);
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
const clientesContext = useClientesPos(usuarioId, empresaId, setClienteId);
  const {
    showModalNuevoCliente, setShowModalNuevoCliente, nuevoCliente, setNuevoCliente,
    showModalConsultaCliente, setShowModalConsultaCliente, terminoBusquedaCliente, setTerminoBusquedaCliente,
    clienteConsultado, setClienteConsultado, montoAbono, setMontoAbono, cargandoConsultaCliente,
    handleCrearCliente, handleBuscarClienteConsulta, handleAbonarDeuda, handleCambioRutNuevoCliente
  } = clientesContext;

  // Cálculos rápidos
  const totalBruto = totalVenta; 
  const neto = Math.round(totalBruto / 1.19);
  const iva = totalBruto - neto;

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
      Toast.fire({ icon: 'success', title: 'Ítem incorporado a la orden' });
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
    <div className='min-h-screen bg-slate-50 flex flex-col items-center p-8 font-sans text-slate-800'>
      
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
              <button onClick={() => { handleVerResumen(); setMenuAbierto(false); }} className="w-full text-left px-4 py-2.5 hover:bg-slate-50 font-medium text-slate-700 border-b border-slate-100">Resumen Financiero</button>
              <button onClick={() => { handleCerrarCaja(); setMenuAbierto(false); }} className="w-full text-left px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-medium">Cierre de Turno</button>
            </div>
          )}
        </div>
      </div>

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
        />
        <DesglosePago 
          neto={neto} 
          iva={iva} 
          totalBruto={totalBruto} 
          carritoVacio={carrito.length === 0}
          onProcesarCobro={() => setShowModalPago(true)} 
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
        onClose={() => { setShowModalPago(false); setPagaCon(0); setClienteId(null); }}
        empresaId={empresaId}
        totalBruto={totalBruto} 
        metodoPago={metodoPago} 
        setMetodoPago={setMetodoPago}
        proveedorTarjeta={proveedorTarjeta} 
        setProveedorTarjeta={setProveedorTarjeta}
        clienteId={clienteId} 
        setClienteId={setClienteId} 
        pagaCon={pagaCon} 
        setPagaCon={setPagaCon}
        onAbrirNuevoCliente={() => setShowModalNuevoCliente(true)} 
        confirmarVentaFinal={confirmarVentaFinal}
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