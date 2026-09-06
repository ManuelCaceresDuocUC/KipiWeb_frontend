import { useState } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { QRCodeModal } from './QRCodeModal';

export const DashboardLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Estado para controlar el menú en móvil

  const handleLogout = () => {
    // 🟢 Opción recomendada: Limpia todo el almacenamiento local al salir
    localStorage.clear(); 
    
    // Si prefieres borrar claves específicas en lugar de todo:
    // localStorage.removeItem('user_session');
    // localStorage.removeItem('usuarioRol');
    // localStorage.removeItem('empresaId');

    navigate('/login', { replace: true });
  };

  const menuOptions = [
    { name: 'Inicio', path: '/home' },
    { name: 'Caja', path: '/ventas' },
    { name: 'Inventario', path: '/inventario' },
    { name: 'Movimientos', path: '/movimientos' },
    { name: 'Recetas', path: '/recetas' },
    { name: 'Administración', path: '/administracion' },
  ];

  return (
    <div className="flex flex-col md:flex-row h-screen bg-slate-50 overflow-hidden font-sans">
      
      {/* 📱 TOPBAR EXCLUSIVA PARA MÓVILES (Oculta en computadoras) */}
      <header className="md:hidden bg-slate-900 text-white h-16 px-4 flex items-center justify-between shadow-md z-30">
        <h2 className="text-xl font-black tracking-wider">
          <span className="text-blue-500">KIPI</span>
        </h2>
        <button 
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
          <h2 className="text-2xl font-black text-white tracking-wider">
            
            <div className="w-8 h-8 bg-slate-800 rounded flex items-center justify-center text-white font-bold tracking-tighter text-sm shadow-sm">
              KP
            </div>
            <span className="text-xl font-bold tracking-tight text-blue-600">
              KIPI<span className="text-slate-400">.</span>
            </span>
          </h2>
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
        <QRCodeModal />
        {/* Botón de Cerrar Sesión al fondo */}
        <div className="p-4 border-t border-slate-700">
          <button 
            onClick={handleLogout}
            className="w-full flex justify-center items-center gap-2 bg-slate-800 hover:bg-red-600 hover:text-white text-slate-400 py-3 rounded-lg transition-colors font-bold text-sm"
          >
            Cerrar Sesión
          </button>
        </div>
        
      </aside>

      {/* 🖥️ ÁREA DE CONTENIDO PRINCIPAL */}
      <main className="flex-1 overflow-y-auto relative p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
      
    </div>
  );
};