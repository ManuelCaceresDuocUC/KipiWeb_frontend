import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle2, XCircle } from 'lucide-react';
import { haySesionValida } from '../helpers/session';

export const RegistroExitoso = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const status = searchParams.get('status');

  const esExito = status === 'success';
  // Quien activó su suscripción desde el portal ya tiene sesión iniciada: vuelve a su cuenta, no al login.
  const conSesion = haySesionValida();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 font-sans text-slate-800">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-sm border border-slate-200 text-center">
        
        {esExito ? (
          <div className="flex flex-col items-center">
            <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">¡Suscripción Exitosa!</h2>
            <p className="text-slate-600 mb-8">
              {conSesion
                ? 'Tu tarjeta quedó registrada y tu suscripción está activa. Ya puedes seguir usando KIPI sin restricciones.'
                : 'Tu tarjeta quedó registrada y tu suscripción está activa. Ya puedes iniciar sesión con el usuario y la contraseña que creaste.'}
            </p>
            <Link to={conSesion ? '/home' : '/login'} className="w-full bg-slate-900 text-white font-bold py-3 rounded hover:bg-slate-800 transition block">
              {conSesion ? 'Volver a KIPI' : 'Ir al Inicio de Sesión'}
            </Link>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <XCircle className="w-16 h-16 text-red-500 mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Algo salió mal</h2>
            <p className="text-slate-600 mb-8">
              No pudimos confirmar tu tarjeta o tu suscripción. Si el problema continúa, escríbenos a kipisofts@gmail.com.
            </p>
            <button 
              onClick={() => navigate(conSesion ? '/administracion' : '/registroempresa')} 
              className="w-full border border-slate-300 text-slate-700 font-bold py-3 rounded hover:bg-slate-50 transition"
            >
              {conSesion ? 'Volver a Administración' : 'Volver al registro'}
            </button>
          </div>
        )}

      </div>
    </div>
  );
};