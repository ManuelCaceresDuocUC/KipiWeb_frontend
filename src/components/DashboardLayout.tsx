import { useState } from 'react';
import Swal from 'sweetalert2';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { esAdmin, getSesion, limpiarSesion } from '../helpers/session';
import { AvisoConexion } from './AvisoConexion';
import { BannerSuscripcion } from './BannerSuscripcion';
import { ColaVentas } from './ColaVentas';
import { listarVentasPendientes } from '../helpers/colaVentas';

export const DashboardLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Estado para controlar el menú en móvil

  const handleLogout = async () => {
    // Ventas cobradas sin conexión que aún no llegan al servidor: no se pierden, pero hay que avisar
    const pendientes = await listarVentasPendientes();
    if (pendientes.length > 0) {
      const r = await Swal.fire({
        icon: 'warning',
        title: 'Hay ventas sin enviar',
        html: `Hay <b>${pendientes.length}</b> venta(s) guardadas en este equipo que aún no llegan a KIPI. Seguirán guardadas, pero solo se enviarán cuando <b>${[...new Set(pendientes.map((v) => v.usuarioNombre))].join(', ')}</b> inicie sesión de nuevo con conexión.`,
        showCancelButton: true,
        confirmButtonText: 'Cerrar sesión igual',
        cancelButtonText: 'Quedarme',
      });
      if (!r.isConfirmed) return;
    }
    // Solo se borra la sesión (no 'cierrePendiente', que protege un cierre de caja sin enviar)
    limpiarSesion();
    navigate('/login', { replace: true });
  };

  const todasLasOpciones = [
    { name: 'Inicio', path: '/home' },
    { name: 'Caja', path: '/ventas' },
    { name: 'Inventario', path: '/inventario', soloAdmin: true },
    { name: 'Compras', path: '/compras', soloAdmin: true },
    { name: 'Recetas', path: '/recetas', soloAdmin: true },
    { name: 'Movimientos', path: '/movimientos' },
    { name: 'Administración', path: '/administracion', soloAdmin: true },
  ];
  // El vendedor solo ve lo que puede usar (el backend igualmente bloquea el resto)
  const menuOptions = todasLasOpciones.filter((o) => !('soloAdmin' in o && o.soloAdmin) || esAdmin());
  const sesion = getSesion();

  return (
    <div className="flex flex-col md:flex-row h-screen bg-slate-50 overflow-hidden font-sans">
      
      {/* 📱 TOPBAR EXCLUSIVA PARA MÓVILES (Oculta en computadoras) */}
      <header className="md:hidden bg-slate-900 text-white h-16 px-4 flex items-center justify-between shadow-md z-30">
        <Link to="/home" className="flex items-center gap-2" aria-label="KIPI, ir al inicio">
          <span className="w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center text-white font-bold tracking-tighter text-sm">KP</span>
          <span className="text-xl font-bold tracking-tight text-white">KIPI<span className="text-blue-500">.</span></span>
        </Link>
        <button 
          aria-label={isSidebarOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={isSidebarOpen}
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 focus:outline-none transition-colors"
        >
          {isSidebarOpen ? (
            // Icono de X (Cerrar)
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            // Icono de Hamburguesa (Abrir)
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </header>

      {/* 🪵 OVERLAY OSCURO EN MÓVIL (Cierra el menú si el usuario toca fuera de él) */}
      {isSidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-20 transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* 🧭 SIDEBAR DINÁMICO (Se adapta según la pantalla) */}
      <aside className={`
        fixed md:static inset-y-0 left-0 w-64 bg-slate-900 text-slate-300 flex flex-col shadow-xl z-40
        transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0 pt-16 md:pt-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Título/Logo del sistema (Sólo visible en escritorios) */}
        <div className="hidden md:h-20 md:flex items-center justify-center border-b border-slate-700">
          <Link to="/home" className="flex items-center gap-2" aria-label="KIPI, ir al inicio">
            <span className="w-9 h-9 bg-slate-700 rounded-lg flex items-center justify-center text-white font-bold tracking-tighter text-sm shadow-sm">KP</span>
            <span className="text-2xl font-bold tracking-tight text-white">KIPI<span className="text-blue-500">.</span></span>
          </Link>
        </div>

        {/* Lista de Navegación */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {menuOptions.map((opcion) => {
            const isActive = location.pathname === opcion.path || 
                             (opcion.path !== '/' && location.pathname.startsWith(opcion.path));
            
            return (
              <Link 
                key={opcion.name} 
                to={opcion.path}
                onClick={() => setIsSidebarOpen(false)} // Escondemos la barra al elegir una ruta
                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'hover:bg-slate-800 hover:text-white'
                }`}
              >
                {opcion.name}
              </Link>
            );
          })}
        </nav>
        
        {/* Botón de Cerrar Sesión al fondo */}
        <div className="p-4 border-t border-slate-700 space-y-3">
          {sesion && (
            <div className="px-1 text-xs leading-tight">
              <p className="font-semibold text-slate-200 truncate">{sesion.usuario}</p>
              <p className="text-slate-500 truncate">{sesion.empresa?.razonSocial}</p>
            </div>
          )}
          <button 
            onClick={handleLogout}
            className="w-full flex justify-center items-center gap-2 bg-slate-800 hover:bg-red-600 hover:text-white text-slate-400 py-3 rounded-lg transition-colors font-bold text-sm"
          >
            Cerrar Sesión
          </button>
        </div>
        
      </aside>

      {/* 🖥️ ÁREA DE CONTENIDO PRINCIPAL */}
      <main id="contenido" className="flex-1 overflow-y-auto relative p-4 sm:p-6 lg:p-8 bg-slate-50">
        <AvisoConexion />
        <ColaVentas />
        <BannerSuscripcion />
        <Outlet />
      </main>
      
    </div>
  );
};