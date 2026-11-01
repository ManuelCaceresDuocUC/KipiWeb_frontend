import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { apiFetch } from '../helpers/apiFetch';
import type { Metricas, Empleado, Cuadratura, ProductoMasVendido } from '../types/admin.types';

export const useAdminPanel = (API_URL: string, empresaId: string) => {
  const navigate = useNavigate();
  const usuarioRol = (localStorage.getItem('usuarioRol') || 'vendedor').toLowerCase().trim();
  
  const [metricas, setMetricas] = useState<Metricas>({ ventasHoy: 0, ivaMes: 0, ticketPromedio: 0, costoInventario: 0 });
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [cuadraturas, setCuadraturas] = useState<Cuadratura[]>([]);
  const [cargando, setCargando] = useState(true);

  const [masVendidos, setMasVendidos] = useState<ProductoMasVendido[]>([]);
  const [periodo, setPeriodo] = useState<'dia' | 'semana' | 'mes'>('dia');

  // Validación de seguridad
  useEffect(() => {
    if (usuarioRol !== 'admin') {
      Swal.fire({
        icon: 'info',
        title: 'Acceso Restringido',
        text: 'Esta sección contiene información confidencial y es de acceso exclusivo para administradores.',
        confirmButtonColor: '#1E293B',
        allowOutsideClick: false,
        allowEscapeKey: false
      }).then(() => {
        navigate('/home'); 
      });
    }
  }, [usuarioRol, navigate]);

  // Carga de datos generales
  useEffect(() => {
    if (usuarioRol !== 'admin') return;

    const cargarDatosPanel = async () => {
      try {
        setCargando(true);
        const [resMetricas, resEmpleados, resCuadraturas] = await Promise.all([
          apiFetch(`${API_URL}/admin/metricas?empresaId=${empresaId}`),
          apiFetch(`${API_URL}/usuarios?empresaId=${empresaId}`),
          apiFetch(`${API_URL}/caja/historial?empresaId=${empresaId}`)
        ]);

        if (resMetricas.ok) setMetricas(await resMetricas.json());
        if (resEmpleados.ok) setEmpleados(await resEmpleados.json());
        if (resCuadraturas?.ok) setCuadraturas(await resCuadraturas.json());
      } catch (error) {
        console.error("Error al cargar los datos del panel", error);
      } finally {
        setCargando(false);
      }
    };

    cargarDatosPanel();
  }, [API_URL, usuarioRol, empresaId]);

  // Carga de productos más vendidos según periodo
  useEffect(() => {
    if (usuarioRol !== 'admin') return;

    const cargarMasVendidos = async () => {
      try {
        const res = await apiFetch(`${API_URL}/admin/productos-mas-vendidos?periodo=${periodo}&empresaId=${empresaId}`);
        if (res.ok) setMasVendidos(await res.json());
      } catch (error) {
        console.error("Error al cargar los productos más vendidos", error);
      }
    };

    cargarMasVendidos();
  }, [API_URL, periodo, usuarioRol, empresaId]);
  return { 
    usuarioRol,  // <- Faltaba retornar esto para solucionar el error 4
    cargando, 
    metricas, 
    empleados, 
    cuadraturas, 
    masVendidos, // <- Soluciona error 1
    periodo,     // <- Soluciona error 2
    setPeriodo   // <- Soluciona error 3
  };
};