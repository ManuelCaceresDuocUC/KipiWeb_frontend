import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';
import { Logo } from '../components/publico/Logo';
import { Turnstile, turnstileActivo } from '../components/publico/Turnstile';
import { apiFetch, leerError } from '../helpers/apiFetch';

const API = import.meta.env.VITE_API_URL as string;

export const RecuperarClave = () => {
  const [usuario, setUsuario] = useState('');
  const [captcha, setCaptcha] = useState('');
  const [reinicio, setReinicio] = useState(0);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!usuario.trim()) return setError('Ingresa tu nombre de usuario.');
    if (turnstileActivo && !captcha) return setError('Confirma que no eres un robot.');
    setCargando(true);
    try {
      const r = await apiFetch(`${API}/auth/recuperar`, { method: 'POST', body: JSON.stringify({ usuario: usuario.trim(), turnstile: captcha }) });
      if (!r.ok) throw new Error(await leerError(r, 'No pudimos procesar la solicitud.'));
      const data = await r.json();
      setMensaje(data.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos procesar la solicitud.');
      setReinicio((n) => n + 1);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans text-slate-800">
      <div className="bg-white w-full max-w-md p-8 rounded shadow-sm border border-slate-200">
        <Link to="/login" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 mb-4">
          <ArrowLeft className="w-3.5 h-3.5" /> Volver a iniciar sesión
        </Link>
        <div className="flex justify-center mb-4"><Logo /></div>
        <h1 className="text-xl font-semibold text-center text-slate-900">Recupera tu contraseña</h1>

        {mensaje ? (
          <div className="mt-6 text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <p className="text-sm text-slate-600 leading-relaxed">{mensaje}</p>
          </div>
        ) : (
          <form onSubmit={enviar} className="mt-6 space-y-4 text-sm">
            <p className="text-slate-500 text-center">Ingresa tu nombre de usuario y te enviaremos un enlace al correo registrado en tu cuenta.</p>
            {error && <div role="alert" className="rounded bg-red-50 border border-red-200 text-red-700 p-3">{error}</div>}
            <input value={usuario} onChange={(e) => setUsuario(e.target.value)} autoComplete="username" autoFocus placeholder="Nombre de usuario"
              className="w-full p-3 bg-slate-50 border border-slate-300 rounded focus:bg-white focus:border-slate-500 outline-none" />
            <Turnstile onToken={setCaptcha} reinicio={reinicio} />
            <button type="submit" disabled={cargando} className="w-full bg-slate-800 hover:bg-slate-900 text-white font-medium py-3 rounded flex justify-center items-center gap-2 disabled:opacity-60">
              {cargando && <Loader2 className="w-4 h-4 animate-spin" />} Enviar enlace
            </button>
            <p className="text-xs text-slate-500 text-center">
              ¿Eres empleado y no tienes correo en tu cuenta? Pide a tu administrador que restablezca tu contraseña desde Administración.
            </p>
          </form>
        )}
      </div>
    </div>
  );
};
