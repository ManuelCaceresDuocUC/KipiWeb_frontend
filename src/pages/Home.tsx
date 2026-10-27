import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// ==========================================
// MOCK DATA: FÁCIL DE MODIFICAR Y CONFIGURAR
// ==========================================

// URL del Video de Bienvenida (puedes reemplazarla por tu iframe de YouTube, Vimeo o MP4)
// Dejar vacío hasta tener el video real: mientras esté vacío, el bloque no se muestra.
const VIDEO_BIENVENIDA_URL = "";

interface Novedad {
  id: number;
  version: string;
  fecha: string;
  titulo: string;
  descripcion: string;
  tag: 'Novedad' | 'Mejora' | 'Próximamente';
}

// Se muestra solo si hay entradas reales (antes eran datos de ejemplo que no correspondían a versiones publicadas).
const NOVEDADES: Novedad[] = [];

const MODULOS_KIPI = [
  {
    icono: '⚡',
    titulo: 'Punto de Venta Ágil',
    descripcion: 'Cobros ultra rápidos, soporte para lector de código de barras y múltiples formas de pago.'
  },
  {
    icono: '📦',
    titulo: 'Control de Inventario',
    descripcion: 'Gestión en tiempo real de stock, alertas de reposición y valorización comercial.'
  },
  {
    icono: '🔒',
    titulo: 'Caja & Flujo Financiero',
    descripcion: 'Control estricto de turnos, arqueos ciegos y trazabilidad completa de movimientos.'
  },
  {
    icono: '📊',
    titulo: 'Inteligencia de Negocio',
    descripcion: 'Reportes detallados de ventas, productos más pedidos e impuestos en tiempo real.'
  }
];

interface UsuarioSesion {
  nombre: string;
  rol: string;
  empresaNombre: string;
}

export const Home = () => {
  const navigate = useNavigate();

  // 1. Obtención de datos de sesión sin llamadas de API
  const [usuario] = useState<UsuarioSesion>(() => {
    const sesionStr = localStorage.getItem('user_session');
    if (!sesionStr) {
      return { nombre: 'Usuario', rol: 'CAJERO', empresaNombre: 'Mi Empresa' };
    }

    try {
      const obj = JSON.parse(sesionStr);
      return {
        nombre: obj.nombre || obj.usuario || 'Usuario',
        rol: (obj.rol || obj.role || 'CAJERO').toUpperCase(),
        empresaNombre: obj.empresa?.razonSocial || obj.empresaNombre || 'Mi Empresa'
      };
    } catch (e) {
      console.error('Error al parsear sesión:', e);
      return { nombre: 'Usuario', rol: 'CAJERO', empresaNombre: 'Mi Empresa' };
    }
  });

  useEffect(() => {
    const sesionStr = localStorage.getItem('user_session');
    if (!sesionStr) {
      navigate('/login');
      return;
    }

  }, [navigate]);

  const esAdmin = usuario.rol === 'ADMIN' || usuario.rol === 'ROLE_ADMIN' || usuario.rol === 'ADMINISTRADOR';

  const getTagColor = (tag: Novedad['tag']) => {
    switch (tag) {
      case 'Novedad':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Mejora':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Próximamente':
        return 'bg-amber-100 text-amber-700 border-amber-200';
    }
  };

  return (
    <div className="p-8 flex flex-col gap-8 bg-slate-50 min-h-screen font-sans text-slate-800">
      
      {/* 1. ENCABEZADO DE BIENVENIDA */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-blue-600 text-white font-black text-xs px-2 py-0.5 rounded tracking-wider">
              KIPI POS
            </span>
            <span className="text-xs font-semibold text-slate-400">|</span>
            <span className="text-xs font-medium text-slate-500">Sistema Operativo Comercial</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            ¡Bienvenido(a), {usuario.nombre}! 👋
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Empresa activa: <strong className="text-slate-700">{usuario.empresaNombre}</strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`px-3 py-1 text-xs font-bold rounded-full border ${
              esAdmin
                ? 'bg-purple-100 text-purple-700 border-purple-200'
                : 'bg-emerald-100 text-emerald-700 border-emerald-200'
            }`}
          >
            ROL: {usuario.rol}
          </span>
        </div>
      </div>

      {/* 2. ACCESOS RÁPIDOS PRINCIPALES */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <button
          onClick={() => navigate('/ventas')}
          className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl shadow-sm font-semibold text-sm flex flex-col items-center justify-center gap-2 transition-all cursor-pointer group"
        >
          <span className="text-3xl group-hover:scale-110 transition-transform">🛒</span>
          Punto de Venta
        </button>

        <button
          onClick={() => navigate('/productos')}
          className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 p-4 rounded-xl shadow-sm font-semibold text-sm flex flex-col items-center justify-center gap-2 transition-all cursor-pointer group"
        >
          <span className="text-3xl group-hover:scale-110 transition-transform">🔍</span>
          Consultar Stock
        </button>

        <button
          onClick={() => navigate('/caja/cierre')}
          className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 p-4 rounded-xl shadow-sm font-semibold text-sm flex flex-col items-center justify-center gap-2 transition-all cursor-pointer group"
        >
          <span className="text-3xl group-hover:scale-110 transition-transform">🔒</span>
          Cierre de Caja
        </button>

        <button
          onClick={() => alert('Abriendo centro de ayuda KIPI...')}
          className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 p-4 rounded-xl shadow-sm font-semibold text-sm flex flex-col items-center justify-center gap-2 transition-all cursor-pointer group"
        >
          <span className="text-3xl group-hover:scale-110 transition-transform">🎧</span>
          Soporte KIPI
        </button>
      </div>

      {/* 3. SECCIÓN PRINCIPAL: VIDEO + NOVEDADES (solo con contenido real) */}
      {(VIDEO_BIENVENIDA_URL || NOVEDADES.length > 0) && (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* VIDEO DE BIENVENIDA / CAPACITACIÓN */}
        {VIDEO_BIENVENIDA_URL && (
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-4">
          <div className="flex justify-between items-center border-b pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                🎬 Tour Rápido e Inducción a KIPI
              </h2>
              <p className="text-xs text-slate-500">
                Aprende en 3 minutos a realizar ventas, aperturas y cierres de turno de forma rápida.
              </p>
            </div>
            <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-medium">
              Video Tutorial
            </span>
          </div>

          {/* REPRODUCTOR DE VIDEO EMBEBIDO */}
          <div className="relative w-full aspect-video bg-slate-900 rounded-lg overflow-hidden shadow-inner flex items-center justify-center group">
            <iframe
              className="w-full h-full"
              src={VIDEO_BIENVENIDA_URL}
              title="Video de Bienvenida KIPI"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>

          <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg flex items-start gap-3">
            <span className="text-xl">💡</span>
            <p className="text-xs text-blue-900 leading-relaxed">
              <strong>Consejo Pro:</strong> Puedes usar atajos de teclado en la pantalla de ventas presionando <kbd className="bg-white px-1.5 py-0.5 rounded border border-blue-200 font-mono text-[10px]">F2</kbd> para buscar productos o <kbd className="bg-white px-1.5 py-0.5 rounded border border-blue-200 font-mono text-[10px]">Espacio</kbd> para ir al cobro rápido.
            </p>
          </div>
        </div>

        )}

        {/* NOVEDADES Y NOTAS DE VERSIÓN */}
        {NOVEDADES.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-4">
          <div className="flex justify-between items-center border-b pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              🚀 Novedades del Sistema
            </h2>
            <span className="text-xs text-blue-600 font-bold">{NOVEDADES[0]?.version}</span>
          </div>

          <div className="flex flex-col gap-4 divide-y divide-slate-100">
            {NOVEDADES.map((item) => (
              <div key={item.id} className="pt-3 first:pt-0 flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getTagColor(item.tag)}`}>
                    {item.tag}
                  </span>
                  <span className="text-[11px] font-medium text-slate-400">{item.fecha}</span>
                </div>
                <h3 className="text-xs font-bold text-slate-800 leading-snug">
                  {item.titulo}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {item.descripcion}
                </p>
              </div>
            ))}
          </div>
        </div>
        )}

      </div>
      )}

      {/* 4. MODULOS Y ECOSISTEMA KIPI */}
      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-extrabold text-slate-900">
          ✨ Todo lo que puedes hacer con KIPI
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {MODULOS_KIPI.map((mod, idx) => (
            <div key={idx} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-2 hover:border-blue-300 transition-all">
              <span className="text-3xl mb-1">{mod.icono}</span>
              <h3 className="text-sm font-bold text-slate-900">{mod.titulo}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{mod.descripcion}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 5. FOOTER / SOPORTE */}
      <div className="bg-slate-900 text-white p-6 rounded-xl flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h3 className="text-sm font-bold">¿Tienes dudas o necesitas asistencia técnica?</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Nuestro equipo de soporte KIPI está disponible para ayudarte en tu operación diaria.
          </p>
        </div>
        <div className="flex gap-3">
          <a
            href="mailto:soporte@kipi.cl"
            className="bg-slate-800 hover:bg-slate-700 text-xs font-semibold px-4 py-2.5 rounded-lg border border-slate-700 transition-all"
          >
            ✉️ Contactar Soporte
          </a>
          <button
            onClick={() => alert('Atención Telefónica: +56 9 1234 5678')}
            className="bg-blue-600 hover:bg-blue-500 text-xs font-semibold px-4 py-2.5 rounded-lg transition-all cursor-pointer"
          >
            📞 Mesa de Ayuda
          </button>
        </div>
      </div>

    </div>
  );
};