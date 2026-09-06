import { useState } from "react";
import { useLogin } from "../hooks/useLogin";
import Swal from "sweetalert2";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom"; // ✨ Corrección: Link debe venir de react-router-dom

export const Login = () => {
  const { logearUsuario } = useLogin();

  const [form, setForm] = useState({
    usuario: '',
    contrasena: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.usuario.trim() || !form.contrasena.trim()) {
      return Swal.fire({
        icon: 'warning',
        title: 'Información Requerida',
        text: 'Por favor, ingrese el nombre de usuario y la contraseña para acceder al sistema.',
        confirmButtonColor: '#1E293B',
        confirmButtonText: 'Aceptar',
      });
    }

    logearUsuario({
      usuario: form.usuario.trim(),
      contrasena: form.contrasena.trim()
    });
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 relative font-sans text-slate-800">
      <div className="bg-white w-full max-w-md p-8 rounded shadow-sm border border-slate-200">
        
        <div className="text-center mb-8 border-b border-slate-100 pb-6 relative">
          {/* ✨ Ahora este Link sí te llevará a la ruta raíz (Landing) */}
          <div className="flex justify-start mb-4">
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Volver al Inicio</span>
            </Link>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 mb-1">
            <div className="w-8 h-8 bg-slate-800 rounded flex items-center justify-center text-white font-bold tracking-tighter text-sm shadow-sm">
              KP
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              KIPI<span className="text-slate-400">.</span>
            </span>
          </h1>
          <p className="text-slate-500 font-normal text-xs uppercase tracking-wider">
            Portal de Acceso Corporativo
          </p>
        </div>

        <form className="flex flex-col gap-4 text-sm" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
               Nombre de Usuario
            </label>
            <input
              type="text"
              className="w-full p-3 bg-slate-50 border border-slate-300 rounded focus:bg-white focus:border-slate-500 outline-none transition-all text-slate-800 font-medium"
              placeholder="Ingrese su usuario..."
              value={form.usuario}
              onChange={(e) => setForm({ ...form, usuario: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
               Contraseña
            </label>
            <input
              type="password"
              className="w-full p-3 bg-slate-50 border border-slate-300 rounded focus:bg-white focus:border-slate-500 outline-none transition-all text-slate-800 font-medium"
              placeholder="••••••••"
              value={form.contrasena}
              onChange={(e) => setForm({ ...form, contrasena: e.target.value })}
            />
          </div>

          <button
            type="submit"
            className="w-full mt-4 bg-slate-800 hover:bg-slate-900 text-white font-medium py-3 px-4 rounded shadow-sm transition-all active:scale-[0.99] flex justify-center items-center gap-2 text-sm"
          >
            Iniciar Sesión
          </button>
        </form>
      </div>
    </div>
  );
};