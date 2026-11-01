import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { Logo } from '../components/publico/Logo';
import { apiFetch, leerError } from '../helpers/apiFetch';

const API = import.meta.env.VITE_API_URL as string;

export const RestablecerClave = () => {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [clave, setClave] = useState('');
  const [confirma, setConfirma] = useState('');
  const [cargando, setCargando] = useState(false);
  const [listo, setListo] = useState(false);
  const [error, setError] = useState('');

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (clave.length < 8) return setError('La contraseña debe tener al menos 8 caracteres.');
    if (clave !== confirma) return setError('Las contraseñas no coinciden.');
    setCargando(true);
    try {
      const r = await apiFetch(`${API}/auth/restablecer`, { method: 'POST', body: JSON.stringify({ token, contrasena: clave }) });
      if (!r.ok) throw new Error(await leerError(r, 'No pudimos actualizar la contraseña.'));
      setListo(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos actualizar la contraseña.');
    } finally {
      setCargando(false);
    }
  };

  const input = 'w-full p-3 bg-slate-50 border border-slate-300 rounded focus:bg-white focus:border-slate-500 outline-none';

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans text-slate-800">
      <div className="bg-white w-full max-w-md p-8 rounded shadow-sm border border-slate-200">
        <div className="flex justify-center mb-4"><Logo /></div>
        <h1 className="text-xl font-semibold text-center text-slate-900">Nueva contraseña</h1>

        {listo ? (
          <div className="mt-6 text-center space-y-4">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <p className="text-sm text-slate-600">Tu contraseña fue actualizada.</p>
            <Link to="/login" className="block w-full bg-slate-800 text-white font-medium py-3 rounded text-sm">Iniciar sesión</Link>
          </div>
        ) : !token ? (
          <div className="mt-6 text-center space-y-3 text-sm text-slate-600">
            <p>El enlace no es válido.</p>
            <Link to="/recuperar" className="underline font-semibold text-slate-800">Solicitar uno nuevo</Link>
          </div>
        ) : (
          <form onSubmit={enviar} className="mt-6 space-y-4 text-sm">
            {error && <div role="alert" className="rounded bg-red-50 border border-red-200 text-red-700 p-3">{error}</div>}
            <input type="password" value={clave} onChange={(e) => setClave(e.target.value)} autoComplete="new-password" placeholder="Nueva contraseña (mín. 8 caracteres)" className={input} />
            <input type="password" value={confirma} onChange={(e) => setConfirma(e.target.value)} autoComplete="new-password" placeholder="Repite la contraseña" className={input} />
            <button type="submit" disabled={cargando} className="w-full bg-slate-800 hover:bg-slate-900 text-white font-medium py-3 rounded flex justify-center items-center gap-2 disabled:opacity-60">
              {cargando && <Loader2 className="w-4 h-4 animate-spin" />} Guardar contraseña
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
