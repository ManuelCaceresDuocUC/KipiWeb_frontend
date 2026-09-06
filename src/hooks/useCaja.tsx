import { useState, useEffect } from 'react';
import { apiFetch } from '../helpers/apiFetch';
import Swal from 'sweetalert2';
import type { ResumenCaja } from '../types/ventas.types';

export const useCaja = (usuarioId: string) => {
  const [cargandoCaja, setCargandoCaja] = useState(true); 
  const [cajaAbierta, setCajaAbierta] = useState(false); 
  const [montoApertura, setMontoApertura] = useState('');

  const [showModalMovimiento, setShowModalMovimiento] = useState(false);
  const [tipoMovimiento, setTipoMovimiento] = useState<'ingreso' | 'retiro'>('retiro');
  const [montoMovimiento, setMontoMovimiento] = useState('');
  const [motivoMovimiento, setMotivoMovimiento] = useState('');

  const [showModalResumen, setShowModalResumen] = useState(false);
  const [datosResumen, setDatosResumen] = useState<ResumenCaja | null>(null);
  const [cargandoResumen, setCargandoResumen] = useState(false);

  const [showModalCierre, setShowModalCierre] = useState(false);
  const [efectivoFisicoDeclarado, setEfectivoFisicoDeclarado] = useState('');
  const [faseCierre, setFaseCierre] = useState<'declaracion' | 'resultado'>('declaracion');
  const [datosCierreCalculados, setDatosCierreCalculados] = useState<ResumenCaja | null>(null);
  const [cargandoCierre, setCargandoCierre] = useState(false);

  useEffect(() => {
    const verificarEstadoCaja = async () => {
      try {
        const response = await apiFetch(`${import.meta.env.VITE_API_URL}/caja/estado?usuarioId=${usuarioId}`);
        if (response.ok) {
          const data = await response.json();
          setCajaAbierta(data.abierta); 
        }
      } catch (error) {
        console.error("Error de conexión con el servidor:", error);
      } finally {
        setCargandoCaja(false);
      }
    };
    if (usuarioId) verificarEstadoCaja();
  }, [usuarioId]); 

  useEffect(() => {
    const cierrePendienteStr = localStorage.getItem('cierrePendiente');
    if (cierrePendienteStr) {
      try {
        const cierrePendiente = JSON.parse(cierrePendienteStr);
        setEfectivoFisicoDeclarado(cierrePendiente.efectivoFisicoDeclarado);
        setDatosCierreCalculados(cierrePendiente.datosCierreCalculados);
        setFaseCierre(cierrePendiente.faseCierre);
        setShowModalCierre(true);
      } catch (error) {
        console.error("Error al leer el cierre pendiente", error);
      }
    }
  }, []);

  const handleAbrirCaja = async (e: React.FormEvent) => {
    e.preventDefault();
    if (montoApertura.trim() === '') return;
    
    setCargandoCaja(true);
    try {
      const response = await apiFetch(`${import.meta.env.VITE_API_URL}/caja/abrir?usuarioId=${usuarioId}`, {
        method: 'POST',
        body: JSON.stringify({ montoInicial: Number(montoApertura) })
      });
      if (!response.ok) throw new Error(await response.text() || 'Error al procesar la apertura de caja');
      setCajaAbierta(true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      Swal.fire('Error', 'No fue posible abrir la caja: ' + errorMessage, 'error');
    } finally {
      setCargandoCaja(false);
    }
  };

  const handleCerrarCaja = async () => {
    setCargandoCierre(true);
    try {
      const response = await apiFetch(`${import.meta.env.VITE_API_URL}/caja/resumen?usuarioId=${usuarioId}`);
      if (!response.ok) throw new Error("No fue posible obtener la información financiera para el cierre");
      
      const data = await response.json();
      setDatosCierreCalculados(data);
      setEfectivoFisicoDeclarado('');
      setFaseCierre('declaracion');
      setShowModalCierre(true);
    } catch (error) {
      Swal.fire('Error', 'No se pudo iniciar el proceso de cierre de turno: ' + (error instanceof Error ? error.message : ''), 'error');
    } finally {
      setCargandoCierre(false);
    }
  };

  const handleRegistrarMovimiento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!montoMovimiento || !motivoMovimiento) return;

    try {
      const response = await apiFetch(`${import.meta.env.VITE_API_URL}/caja/movimiento?usuarioId=${usuarioId}`, {
        method: 'POST',
        body: JSON.stringify({ tipo: tipoMovimiento, monto: Number(montoMovimiento), motivo: motivoMovimiento })
      });

      if (!response.ok) throw new Error("Error en la comunicación al registrar el movimiento");
      
      Swal.fire('Operación Registrada', `El ${tipoMovimiento === 'ingreso' ? 'ingreso' : 'retiro'} ha sido registrado correctamente en el sistema.`, 'success');
      setShowModalMovimiento(false);
      setMontoMovimiento('');
      setMotivoMovimiento('');
    } catch (error) {
      Swal.fire('Error', error instanceof Error ? error.message : "Error desconocido al procesar la solicitud", 'error');
    }
  };

  const handleVerResumen = async () => {
    setShowModalResumen(true);
    setCargandoResumen(true);
    try {
      const response = await apiFetch(`${import.meta.env.VITE_API_URL}/caja/resumen?usuarioId=${usuarioId}`);
      if (response.ok) {
        const data = await response.json();
        setDatosResumen(data);
      } else {
        throw new Error("No fue posible consultar el resumen financiero");
      }
    } catch {
      // Tu fallback actual
      setDatosResumen({
        fondoInicial: 50000, ventasEfectivo: 125000, ventasTarjeta: 85000, ingresosExtra: 10000,
        abonosCredito: 25000, retiros: 5000, totalEnCaja: 205000 
      });
    } finally {
      setCargandoResumen(false);
    }
  };

  const handleProcesarDeclaracion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (efectivoFisicoDeclarado.trim() === '' || Number(efectivoFisicoDeclarado) < 0) return;
    
    const confirmacion = await Swal.fire({
      title: '¿Confirmar declaración de caja?',
      html: `Ha declarado un monto físico en efectivo de <b>$${Number(efectivoFisicoDeclarado).toLocaleString()}</b>.<br/><br/>Esta cifra no podrá ser editada posteriormente para efectos de auditoría.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#1E293B',
      cancelButtonColor: '#64748B',
      confirmButtonText: 'Confirmar Monto',
      cancelButtonText: 'Revisar'
    });

    if (confirmacion.isConfirmed) {
      setFaseCierre('resultado');
      localStorage.setItem('cierrePendiente', JSON.stringify({
        faseCierre: 'resultado', efectivoFisicoDeclarado, datosCierreCalculados
      }));
    }
  };

  const handleConfirmarCierreFinal = async () => {
    if (!datosCierreCalculados) return;

    const confirmacion = await Swal.fire({
      title: '¿Finalizar y Cerrar Turno?',
      text: 'Al confirmar, se guardará el registro de cuadratura y se cerrará su sesión operativa de caja.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#1E293B',
      cancelButtonColor: '#64748B',
      confirmButtonText: 'Finalizar Turno',
      cancelButtonText: 'Cancelar'
    });

    if (!confirmacion.isConfirmed) return;

    const totalEsperado = datosCierreCalculados.totalEnCaja;
    const fisicoDeclarado = Number(efectivoFisicoDeclarado);
    const diferencia = fisicoDeclarado - totalEsperado;

    setCargandoCaja(true);
    setShowModalCierre(false);

    try {
      const response = await apiFetch(`${import.meta.env.VITE_API_URL}/caja/cerrar?usuarioId=${usuarioId}`, {
        method: 'POST',
        body: JSON.stringify({
          fondoInicial: datosCierreCalculados.fondoInicial,
          ventasEfectivo: datosCierreCalculados.ventasEfectivo,
          ventasTarjeta: datosCierreCalculados.ventasTarjeta,
          ingresosExtra: datosCierreCalculados.ingresosExtra,
          abonosCredito: datosCierreCalculados.abonosCredito || 0,
          retiros: datosCierreCalculados.retiros,
          totalSistema: totalEsperado,
          totalRealFisico: fisicoDeclarado,
          diferencia: diferencia
        })
      });

      if (!response.ok) throw new Error(await response.text() || 'Error en la respuesta del servidor');
      
      setCajaAbierta(false);
      setMontoApertura('');
      localStorage.removeItem('cierrePendiente');
      Swal.fire('Turno Finalizado', 'El cierre operativo y la respectiva cuadratura han sido almacenados correctamente.', 'success');
    } catch (error) {
      Swal.fire('Error en Cierre Operativo', error instanceof Error ? error.message : 'Error desconocido al registrar el cierre', 'error');
      setShowModalCierre(true);
    } finally {
      setCargandoCaja(false);
    }
  };

  return {
    cargandoCaja, cajaAbierta, montoApertura, setMontoApertura,
    showModalMovimiento, setShowModalMovimiento, tipoMovimiento, setTipoMovimiento,
    montoMovimiento, setMontoMovimiento, motivoMovimiento, setMotivoMovimiento,
    showModalResumen, setShowModalResumen, datosResumen, cargandoResumen,
    showModalCierre, setShowModalCierre, efectivoFisicoDeclarado, setEfectivoFisicoDeclarado,
    faseCierre, setFaseCierre, datosCierreCalculados, cargandoCierre,
    handleAbrirCaja, handleCerrarCaja, handleRegistrarMovimiento, handleVerResumen,
    handleProcesarDeclaracion, handleConfirmarCierreFinal
  };
};