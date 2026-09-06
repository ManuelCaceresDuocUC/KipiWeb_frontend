import { useState } from 'react';
import Swal from 'sweetalert2';
import { apiFetch } from '../helpers/apiFetch';
import type { ClienteInfo } from '../types/admin.types';

// Función para formatear RUT dinámicamente sin escapes innecesarios
const formatearInputBusqueda = (valor: string): string => {
  const sinFormato = valor.replace(/[.-]/g, '');
  const esRut = /^[0-9]+[0-9kK]?$/i.test(sinFormato);

  if (esRut && sinFormato.length > 1) {
    const cuerpo = sinFormato.slice(0, -1).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    const dv = sinFormato.slice(-1).toUpperCase();
    return `${cuerpo}-${dv}`;
  }

  return valor;
};

export const useClientes = (API_URL: string, empresaId: string) => {
  const [mostrarModalClientes, setMostrarModalClientes] = useState(false);
  const [clientes, setClientes] = useState<ClienteInfo[]>([]);
  const [cargandoClientes, setCargandoClientes] = useState(false);
  const [busquedaCliente, setBusquedaEstado] = useState('');
  const [cargandoCierreMes, setCargandoCierreMes] = useState(false);

  // Wrapper que aplica el formato al RUT antes de guardar en el estado
  const setBusquedaCliente = (valor: string) => {
    setBusquedaEstado(formatearInputBusqueda(valor));
  };

  const abrirModalClientes = async () => {
    setMostrarModalClientes(true);
    setCargandoClientes(true);
    setBusquedaEstado('');
    try {
      const response = await apiFetch(`${API_URL}/clientes?empresaId=${empresaId}`);
      if (response.ok) {
        const data = await response.json();
        // Garantiza que la respuesta sea un array válido
        setClientes(Array.isArray(data) ? data : data.clientes || []);
      } else {
        throw new Error('No se pudo obtener la lista de clientes');
      }
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'No se pudo cargar el directorio de clientes.', 'error');
      setMostrarModalClientes(false);
    } finally {
      setCargandoClientes(false);
    }
  };

  // Filtrado a prueba de nulos y adaptable a búsquedas con o sin formato
  const clientesFiltrados = Array.isArray(clientes)
    ? clientes.filter(c => {
        const termino = busquedaCliente.trim().toLowerCase();
        const terminoLimpio = termino.replace(/[^0-9k]/g, '');

        const nombre = (c?.nombre || '').toLowerCase();
        const rutOriginal = (c?.rut || '').toLowerCase();
        const rutLimpio = rutOriginal.replace(/[^0-9k]/g, '');

        return (
          nombre.includes(termino) ||
          rutOriginal.includes(termino) ||
          (terminoLimpio.length > 0 && rutLimpio.includes(terminoLimpio))
        );
      })
    : [];

  const handleCierreMesCreditos = async () => {
    const confirmacion = await Swal.fire({
      title: '¿Generar Cierre de Créditos?',
      text: 'Se descargará un archivo Excel con las deudas y luego se reiniciarán los créditos a $0. Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#059669',
      cancelButtonColor: '#64748B',
      confirmButtonText: 'Sí, generar y reiniciar',
      cancelButtonText: 'Cancelar'
    });

    if (!confirmacion.isConfirmed) return;

    setCargandoCierreMes(true);
    try {
      // 1. Obtener la lista actual de clientes de forma segura
      const response = await apiFetch(`${API_URL}/clientes?empresaId=${empresaId}`);
      if (!response.ok) throw new Error('Error al obtener clientes');

      const rawData = await response.json();
      const data: ClienteInfo[] = Array.isArray(rawData) ? rawData : rawData.clientes || [];
      const deudores = data.filter(cliente => (cliente?.deudaActual || 0) > 0);

      if (deudores.length === 0) {
        Swal.fire('Información', 'No hay clientes con deudas pendientes.', 'info');
        return;
      }

      // 2. Generar y descargar el CSV resguardando propiedades vacías
      const cabeceras = ['ID Cliente', 'Nombre o Razón Social', 'RUT', 'Teléfono', 'Límite de Crédito', 'Deuda Actual Pendiente'];
      let contenidoCSV = cabeceras.join(';') + '\n';

      deudores.forEach(cliente => {
        const fila = [
          cliente.id,
          `"${cliente.nombre || ''}"`,
          `"${cliente.rut || ''}"`,
          `"${cliente.telefono || 'No registrado'}"`,
          cliente.limiteCredito || 0,
          cliente.deudaActual || 0
        ];
        contenidoCSV += fila.join(';') + '\n';
      });

      const blob = new Blob(['\uFEFF' + contenidoCSV], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const enlace = document.createElement('a');
      const fechaActual = new Date().toISOString().split('T')[0];

      enlace.href = url;
      enlace.setAttribute('download', `Cierre_Creditos_${fechaActual}.csv`);
      document.body.appendChild(enlace);
      enlace.click();
      document.body.removeChild(enlace);

      // 3. Reiniciar deudas en el backend
      const resetResponse = await apiFetch(`${API_URL}/clientes/reiniciar-creditos?empresaId=${empresaId}`, {
        method: 'POST',
      });

      if (!resetResponse.ok) {
        throw new Error('El reporte se descargó, pero hubo un error al reiniciar las deudas en el servidor.');
      }

      // 4. Recargar el listado actualizado
      await abrirModalClientes();

      Swal.fire('Éxito', 'El reporte se generó y las deudas fueron reiniciadas a $0.', 'success');

    } catch (error) {
      console.error(error);
      Swal.fire('Error', error instanceof Error ? error.message : 'Hubo un problema al procesar el cierre.', 'error');
    } finally {
      setCargandoCierreMes(false);
    }
  };

  return {
    mostrarModalClientes, setMostrarModalClientes,
    cargandoClientes,
    busquedaCliente, setBusquedaCliente,
    clientesFiltrados,
    cargandoCierreMes,
    abrirModalClientes, handleCierreMesCreditos
  };
};