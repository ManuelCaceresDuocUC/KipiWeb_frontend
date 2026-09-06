import { useEffect } from 'react'; // 🟢 Agregamos useEffect
import { Link, useNavigate } from 'react-router-dom'; // 🟢 Agregamos useNavigate
import { 
  ArrowRight, 
  CheckCircle2, 
  Zap, 
  ShieldCheck, 
  Users, 
  ChevronRight 
} from 'lucide-react';

export const LandingKIPI = () => {
  const navigate = useNavigate(); // 🟢 Inicializamos el hook de navegación

  // 🟢 EFECTO PARA REDIRIGIR SI YA HAY SESIÓN
  useEffect(() => {
    // Aquí validas tu sesión. Asegúrate de usar la misma key que usas al hacer el login
    const sesionActiva = localStorage.getItem('usuarioRol'); 

    if (sesionActiva) {
      navigate('/home', { replace: true });
    }
  }, [navigate]);

  return (
  <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col justify-between">
    
    <div>
      {/* 1. BARRA DE NAVEGACIÓN SUPERIOR */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-8 h-16 flex items-center justify-between">
          
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-slate-800 rounded flex items-center justify-center text-white font-bold tracking-tighter text-sm shadow-sm">
              KP
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              KIPI<span className="text-slate-400">.</span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link 
              to="/login" 
              className="px-4 py-2 rounded text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              Iniciar Sesión
            </Link>
            <Link 
              to="/registroempresa" 
              className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded font-medium text-sm transition-colors shadow-sm flex items-center gap-1.5"
            >
              <span>Crear Cuenta</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* 2. SECCIÓN PRINCIPAL (HERO) */}
      <section className="py-16 md:py-24 border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold uppercase tracking-wider">
                Sistema POS y Gestión de Inventario
              </div>
              
              <h1 className="text-4xl sm:text-5xl font-semibold text-slate-900 tracking-tight leading-tight">
                Control de stock y punto de venta para el comercio moderno.
              </h1>
              
              <p className="text-base text-slate-600 max-w-xl leading-relaxed">
                Centraliza las operaciones en caja, el control de inventario en tiempo real y la gestión de colaboradores en una plataforma rápida, estable y enfocada en la productividad.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Link 
                  to="/registroempresa" 
                  className="bg-slate-800 hover:bg-slate-900 text-white px-6 py-3 rounded font-medium text-sm transition-colors shadow-sm text-center flex items-center justify-center gap-2"
                >
                  <span>Comenzar Ahora</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </Link>
                <Link 
                  to="/login" 
                  className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-6 py-3 rounded font-medium text-sm transition-colors shadow-sm text-center"
                >
                  Ya tengo cuenta Kipi
                </Link>
              </div>

              <div className="pt-4 flex flex-wrap gap-6 text-xs font-medium text-slate-500 border-t border-slate-100">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-slate-700" /> Configuración inmediata
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-slate-700" /> Múltiples usuarios y roles
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-slate-700" /> Operación 100% web
                </span>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="border border-slate-200 p-2 rounded bg-slate-50 shadow-sm">
                <img 
                  src="https://3875530.fs1.hubspotusercontent-na1.net/hub/3875530/hubfs/Blog/que-es-un-sistema-pos-y-como-funciona.png?width=1920&height=600&length=1920&upsize=true&upscale=true&name=que-es-un-sistema-pos-y-como-funciona.png" 
                  alt="Sistema POS" 
                  className="rounded border border-slate-200 object-cover w-full h-80 grayscale-[20%]"
                />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. GRILLA DE CARACTERÍSTICAS */}
      <section className="py-16 bg-slate-50 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-8">
          <div className="max-w-2xl mb-10">
            <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">
              Módulos del Sistema
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              Herramientas diseñadas para reducir errores operativos y optimizar el tiempo de atención.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded bg-white border border-slate-200 shadow-sm">
              <div className="w-10 h-10 bg-slate-100 text-slate-800 rounded flex items-center justify-center mb-4 font-bold">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-2">Punto de Venta Ágil</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Interfaz optimizada para lectura de código de barras y búsqueda rápida. Procesa transacciones y emite comprobantes sin demoras.
              </p>
            </div>

            <div className="p-6 rounded bg-white border border-slate-200 shadow-sm">
              <div className="w-10 h-10 bg-slate-100 text-slate-800 rounded flex items-center justify-center mb-4">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-2">Control de Colaboradores</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Administración de accesos mediante roles (Cajero / Administrador), protegiendo la información financiera y métricas sensibles del negocio.
              </p>
            </div>

            <div className="p-6 rounded bg-white border border-slate-200 shadow-sm">
              <div className="w-10 h-10 bg-slate-100 text-slate-800 rounded flex items-center justify-center mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-2">Stock en Tiempo Real</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Descuento automático de existencias por venta. Visualización directa de productos con stock crítico para reposición oportuna.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SECCIÓN DE CLIENTES / TESTIMONIOS (Estilo corporativo sobrio) */}
      <section className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-8">
          <div className="max-w-2xl mb-10">
            <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">
              Experiencia en Terreno
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              Implementaciones activas en comercios locales y empresas de retail.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border border-slate-200 p-6 rounded bg-slate-50/50 flex flex-col justify-between">
              <p className="text-slate-600 text-sm leading-relaxed mb-6">
                "La transición del registro manual al control automatizado redujo nuestras diferencias de inventario a casi cero durante el primer mes."
              </p>
              <div className="border-t border-slate-200 pt-3">
                <h4 className="font-semibold text-slate-900 text-sm">Manuel Cáceres</h4>
                <p className="text-slate-500 text-xs">Comercial Los Cáceres</p>
              </div>
            </div>

            <div className="border border-slate-200 p-6 rounded bg-slate-50/50 flex flex-col justify-between">
              <p className="text-slate-600 text-sm leading-relaxed mb-6">
                "El sistema de roles nos permite delegar la apertura y cierre de cajas con total tranquilidad, manteniendo el control de los reportes generales."
              </p>
              <div className="border-t border-slate-200 pt-3">
                <h4 className="font-semibold text-slate-900 text-sm">Carolina Rojas</h4>
                <p className="text-slate-500 text-xs">Minimarket El Sol</p>
              </div>
            </div>

            <div className="border border-slate-200 p-6 rounded bg-slate-50/50 flex flex-col justify-between">
              <p className="text-slate-600 text-sm leading-relaxed mb-6">
                "Destaco la estabilidad de la interfaz en las horas de mayor flujo de clientes. La búsqueda por código de barras es instantánea."
              </p>
              <div className="border-t border-slate-200 pt-3">
                <h4 className="font-semibold text-slate-900 text-sm">Felipe Morales</h4>
                <p className="text-slate-500 text-xs">Panadería La Estación</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. BANNER FINAL SOBRIO */}
      <section className="py-12 bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              ¿Listo para configurar tu punto de venta?
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Despliega tu entorno de inventario y caja en pocos minutos.
            </p>
          </div>
          <Link 
            to="/registroempresa" 
            className="bg-white hover:bg-slate-100 text-slate-900 px-6 py-2.5 rounded font-medium text-sm transition-colors shadow-sm whitespace-nowrap"
          >
            Registrar Empresa
          </Link>
        </div>
      </section>
    </div>

    {/* 6. PIE DE PÁGINA */}
    <footer className="py-6 bg-white border-t border-slate-200 text-slate-500 text-xs">
      <div className="max-w-6xl mx-auto px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2 font-semibold text-slate-700">
          <span>KIPI POS</span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-500 font-normal">Sistema de Gestión Comercial</span>
        </div>
        <p>© {new Date().getFullYear()} KIPI. Todos los derechos reservados.</p>
        <div className="flex gap-4 font-medium">
          <Link to="/login" className="hover:text-slate-900 transition-colors">Login</Link>
          <Link to="/registroempresa" className="hover:text-slate-900 transition-colors">Registro</Link>
        </div>
      </div>
    </footer>

  </div>
);};