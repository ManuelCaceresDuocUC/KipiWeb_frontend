import { Link } from 'react-router-dom';

export const Logo = ({ claro = false }: { claro?: boolean }) => (
  <Link to="/" className="flex items-center gap-2" aria-label="KIPI, ir al inicio">
    <span className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white font-bold tracking-tighter text-sm shadow-sm">
      KP
    </span>
    <span className={`text-xl font-bold tracking-tight ${claro ? 'text-white' : 'text-slate-900'}`}>
      KIPI<span className="text-blue-500">.</span>
    </span>
  </Link>
);
