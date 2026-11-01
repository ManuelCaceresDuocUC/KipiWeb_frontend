import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { ArrowRight, Menu, X } from 'lucide-react';
import { Logo } from './Logo';

const ENLACES = [
  { texto: 'Funciones', to: '/#funciones' },
  { texto: 'Cómo funciona', to: '/#como-funciona' },
  { texto: 'Planes', to: '/planes' },
  { texto: 'Preguntas', to: '/#preguntas' },
  { texto: 'Contacto', to: '/#contacto' },
];

/** Barra superior pública: queda fija al hacer scroll y se pliega en un menú en móvil. */
export const NavbarPublico = () => {
  const [abierto, setAbierto] = useState(false);
  const [conSombra, setConSombra] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    const onScroll = () => setConSombra(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setAbierto(false), [pathname]);

  const claseEnlace = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive && pathname === '/planes' ? 'text-slate-900 bg-slate-100' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
    }`;

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 bg-white/90 backdrop-blur border-b transition-shadow ${
        conSombra ? 'border-slate-200 shadow-sm' : 'border-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-4">
        <Logo />

        <nav className="hidden lg:flex items-center gap-1" aria-label="Principal">
          {ENLACES.map((e) => (
            <NavLink key={e.to} to={e.to} className={claseEnlace}>
              {e.texto}
            </NavLink>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-2">
          <Link to="/login" className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors">
            Iniciar sesión
          </Link>
          <Link
            to="/registroempresa"
            className="bg-slate-900 hover:bg-slate-700 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors shadow-sm flex items-center gap-1.5"
          >
            Crear cuenta <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <button
          type="button"
          className="lg:hidden p-2 rounded-lg text-slate-700 hover:bg-slate-100"
          onClick={() => setAbierto((v) => !v)}
          aria-label={abierto ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={abierto}
        >
          {abierto ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {abierto && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pb-4 pt-2 flex flex-col gap-1">
          {ENLACES.map((e) => (
            <Link key={e.to} to={e.to} className="px-3 py-3 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100">
              {e.texto}
            </Link>
          ))}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <Link to="/login" className="text-center px-4 py-2.5 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700">
              Iniciar sesión
            </Link>
            <Link to="/registroempresa" className="text-center px-4 py-2.5 rounded-lg bg-slate-900 text-white text-sm font-semibold">
              Crear cuenta
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
