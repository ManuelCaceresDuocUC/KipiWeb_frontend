import { useState } from 'react';
import { CheckCircle2, Loader2, Mail, MessageCircle, Phone } from 'lucide-react';
import { NavbarPublico } from '../components/publico/NavbarPublico';
import { FooterPublico } from '../components/publico/FooterPublico';
import { Turnstile, turnstileActivo } from '../components/publico/Turnstile';
import { apiFetch, leerError } from '../helpers/apiFetch';
import { CONTACTO, enlaceWhatsApp } from '../config/contacto';

const API = import.meta.env.VITE_API_URL as string;
const campo = 'w-full p-3 rounded-lg border border-slate-300 bg-white text-sm outline-none focus:border-slate-600';

/** Formulario de contacto: avisa al equipo de KIPI y envía una copia de confirmación al consultante. */
export const Contacto = () => {

  const [form, setForm] = useState({ nombre: '', correo: '', telefono: '', asunto: '', mensaje: '', sitioWeb: '' });
  const [captcha, setCaptcha] = useState('');
  const [reinicio, setReinicio] = useState(0);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState('');

  const cambiar = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (turnstileActivo && !captcha) {
      setError('Confirma que no eres un robot para enviar el mensaje.');
      return;
    }
    setEnviando(true);
    try {
      const r = await apiFetch(`${API}/auth/contacto`, {
        method: 'POST',
        body: JSON.stringify({ ...form, turnstile: captcha }),
      });
      if (!r.ok) throw new Error(await leerError(r, 'No pudimos enviar tu mensaje.'));
      setEnviado(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos enviar tu mensaje.');
      setReinicio((n) => n + 1); // el token del captcha es de un solo uso
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-800">
      <NavbarPublico />
      <main className="pt-28 pb-16 md:pt-36">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 grid grid-cols-1 md:grid-cols-5 gap-10">
          <div className="md:col-span-2 space-y-5">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Contáctanos</h1>
            <p className="text-slate-600 leading-relaxed">
              Cuéntanos qué necesitas. Te respondemos al correo que nos indiques y recibirás una copia de tu mensaje.
            </p>
            <ul className="space-y-3 text-sm text-slate-700">
              <li className="flex items-center gap-2.5"><Mail className="w-4 h-4 text-slate-400" /> {CONTACTO.correo}</li>
              <li className="flex items-center gap-2.5"><Phone className="w-4 h-4 text-slate-400" /> {CONTACTO.telefono}</li>
              <li>
                <a href={enlaceWhatsApp('Hola, quiero información sobre KIPI')} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 hover:underline">
                  <MessageCircle className="w-4 h-4 text-slate-400" /> Escríbenos por WhatsApp
                </a>
              </li>
            </ul>
          </div>

          <div className="md:col-span-3">
            {enviado ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
                <h2 className="text-xl font-semibold text-slate-900">¡Mensaje enviado!</h2>
                <p className="text-sm text-slate-600 mt-2">Te enviamos una copia a <strong>{form.correo}</strong> y te responderemos a la brevedad.</p>
              </div>
            ) : (
              <form onSubmit={enviar} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                {error && <div role="alert" className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm p-3">{error}</div>}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">Nombre *
                    <input required name="nombre" maxLength={100} value={form.nombre} onChange={cambiar} autoComplete="name" className={`${campo} mt-1 normal-case tracking-normal font-normal`} />
                  </label>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">Correo *
                    <input required type="email" name="correo" maxLength={150} value={form.correo} onChange={cambiar} autoComplete="email" className={`${campo} mt-1 normal-case tracking-normal font-normal`} />
                  </label>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">Teléfono
                    <input name="telefono" maxLength={30} value={form.telefono} onChange={cambiar} autoComplete="tel" className={`${campo} mt-1 normal-case tracking-normal font-normal`} />
                  </label>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">Asunto
                    <input name="asunto" maxLength={120} value={form.asunto} onChange={cambiar} className={`${campo} mt-1 normal-case tracking-normal font-normal`} />
                  </label>
                </div>

                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">Mensaje *
                  <textarea required name="mensaje" rows={6} minLength={10} maxLength={3000} value={form.mensaje} onChange={cambiar} className={`${campo} mt-1 normal-case tracking-normal font-normal`} />
                </label>

                {/* Campo trampa anti-bots: invisible para personas */}
                <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                  <label>No completar este campo
                    <input tabIndex={-1} autoComplete="off" name="sitioWeb" value={form.sitioWeb} onChange={cambiar} />
                  </label>
                </div>

                <Turnstile onToken={setCaptcha} reinicio={reinicio} />

                <button type="submit" disabled={enviando} className="w-full bg-slate-900 hover:bg-slate-700 text-white font-semibold py-3 rounded-lg text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                  {enviando && <Loader2 className="w-4 h-4 animate-spin" />} {enviando ? 'Enviando…' : 'Enviar mensaje'}
                </button>
                <p className="text-xs text-slate-500">Usaremos tus datos solo para responderte. Más información en nuestra Política de Privacidad.</p>
              </form>
            )}
          </div>
        </div>
      </main>
      <FooterPublico />
    </div>
  );
};
