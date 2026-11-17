import { useState } from 'react';
import { errorCorreo, errorMonto, errorRut, errorTelefono, errorTexto, formatearRutEnVivo, nombrePropio, normalizarCorreo, telefonoParaEnviar } from '../helpers/validaciones';
import { apiFetch, leerError } from '../helpers/apiFetch';
import Swal from 'sweetalert2';
import { imprimirDocumentos } from '../helpers/impresion';
import { abrirGaveta } from '../helpers/gaveta';
import type { ClienteInfo } from '../types/ventas.types';


export const useClientesPos = (
  setClienteId: (id: number) => void
) => {
  const [showModalNuevoCliente, setShowModalNuevoCliente] = useState(false);
  const [nuevoCliente, setNuevoCliente] = useState({
    nombre: '', rut: '', telefono: '', email: '', limiteCredito: 0
  });

  const [showModalConsultaCliente, setShowModalConsultaCliente] = useState(false);
  const [terminoBusquedaCliente, setTerminoBusquedaCliente] = useState('');
  const [clienteConsultado, setClienteConsultado] = useState<ClienteInfo | null>(null);
  const [montoAbono, setMontoAbono] = useState('');
  const [metodoPagoAbono, setMetodoPagoAbono] = useState<'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA'>('EFECTIVO');
  const [cargandoConsultaCliente, setCargandoConsultaCliente] = useState(false);

  const handleCambioRutNuevoCliente = (valorStr: string) => {
    setNuevoCliente(prev => ({
      ...prev,
      rut: formatearRutEnVivo(valorStr)
    }));
  };

  const handleCrearCliente = async (e: React.FormEvent) => {
    e.preventDefault();
    const problema =
      errorTexto(nuevoCliente.nombre, 'El nombre', 2, 100) ??
      errorRut(nuevoCliente.rut, true, 'El RUT del cliente') ??
      errorTelefono(nuevoCliente.telefono) ??
      errorCorreo(nuevoCliente.email, false, 'El correo') ??
      errorMonto(nuevoCliente.limiteCredito || 0, 'El límite de crédito', false);
    if (problema) {
      Swal.fire('Revisa los datos', problema, 'warning');
      return;
    }
    try {
      const response = await apiFetch(`${import.meta.env.VITE_API_URL}/clientes`, {
        method: 'POST',
        body: JSON.stringify({
          nombre: nombrePropio(nuevoCliente.nombre),
          rut: formatearRutEnVivo(nuevoCliente.rut),
          telefono: nuevoCliente.telefono.trim() ? telefonoParaEnviar(nuevoCliente.telefono) ?? '' : '',
          email: normalizarCorreo(nuevoCliente.email),
          limiteCredito: Math.round(nuevoCliente.limiteCredito || 0),
        })
      });

      if (!response.ok) throw new Error(await leerError(response, "No se pudo registrar el cliente"));

      const clienteCreado = await response.json();
      setClienteId(clienteCreado.id); 
      
      Swal.fire('Cliente Registrado', `Cliente ${clienteCreado.nombre} creado con éxito (ID: ${clienteCreado.id}).`, 'success');
      setNuevoCliente({ nombre: '', rut: '', telefono: '', email: '', limiteCredito: 0 });
      setShowModalNuevoCliente(false);
    } catch (error) {
      Swal.fire('Error', error instanceof Error ? error.message : "Error al registrar cliente", 'error');
    }
  };

  const handleBuscarClienteConsulta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminoBusquedaCliente.trim()) return;

    setCargandoConsultaCliente(true);
    try {
      const terminoLimpio = terminoBusquedaCliente.replace(/[.-]/g, '').trim();
      const url = `${import.meta.env.VITE_API_URL}/clientes/buscar?termino=${encodeURIComponent(terminoLimpio)}`;
      const res = await apiFetch(url);
      
      if (!res.ok) throw new Error("Cliente no encontrado");
      
      const data = await res.json();
      const lista = Array.isArray(data) ? data : [data];
      
      if (lista.length > 0) {
        setClienteConsultado(lista[0]);
      } else {
        throw new Error("Cliente no encontrado");
      }
    } catch {
      Swal.fire('No encontrado', 'No se encontró ningún cliente vinculado al RUT o Nombre ingresado.', 'warning');
      setClienteConsultado(null);
    } finally {
      setCargandoConsultaCliente(false);
    }
  };
  
  const handleAbonarDeuda = async (e: React.FormEvent, metodoPago: string) => {
    e.preventDefault();
    if (!clienteConsultado || !montoAbono) return;

    try {
      const payload = {
        monto: Number(montoAbono),
        metodoPago
      };

      const response = await apiFetch(`${import.meta.env.VITE_API_URL}/clientes/${clienteConsultado.id}/abonar`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

    if (response.ok) {
      if (metodoPago === 'EFECTIVO') void abrirGaveta(); // el abono en efectivo entra a la caja
      // Boleta (si la empresa la emite por pagos de deuda) o, si no, el comprobante de abono (80 mm).
      // Si falla la lectura, el abono igual quedó registrado
      let aviso = '';
      let conBoleta = false;
      try {
        const cuerpo = await response.json();
        conBoleta = Boolean(cuerpo?.boletaPdf);
        const documentos = conBoleta ? [cuerpo.boletaPdf, cuerpo.comprobantePdf] : [cuerpo?.comprobantePdf];
        if (documentos.some(Boolean)) void imprimirDocumentos(documentos, 'Abono', { abrirGaveta: metodoPago === 'EFECTIVO' });
        aviso = cuerpo?.dteAviso || '';
        if (conBoleta && cuerpo?.dteFolio) aviso = `Boleta N° ${cuerpo.dteFolio} emitida.`;
      } catch { /* sin comprobante */ }
      Swal.fire({
        icon: aviso && !conBoleta ? 'warning' : 'success',
        title: 'Abono registrado',
        text: aviso || 'El abono quedó registrado correctamente.',
      });

      // Resetear la vista del modal
      setClienteConsultado(null);
      setTerminoBusquedaCliente('');
      setMontoAbono('');
      setShowModalConsultaCliente(false);
    } else {
      throw new Error(await leerError(response, 'Error al registrar el abono'));
    }
  } catch (error) {
    Swal.fire('Error', error instanceof Error ? error.message : 'No se pudo procesar el abono', 'error');
  }
};

  return {
    showModalNuevoCliente, setShowModalNuevoCliente, nuevoCliente, setNuevoCliente,
    showModalConsultaCliente, setShowModalConsultaCliente, terminoBusquedaCliente, setTerminoBusquedaCliente,
    clienteConsultado, setClienteConsultado, montoAbono, setMontoAbono, 
    metodoPagoAbono, setMetodoPagoAbono, cargandoConsultaCliente,
    handleCrearCliente, handleBuscarClienteConsulta, handleAbonarDeuda,
    handleCambioRutNuevoCliente
  };
};