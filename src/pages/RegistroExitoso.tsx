import React from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle2, XCircle } from 'lucide-react';

export const RegistroExitoso = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const status = searchParams.get('status');

  const esExito = status === 'success';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 font-sans text-slate-800">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-sm border border-slate-200 text-center">
        
        {esExito ? (
          <div className="flex flex-col items-center">
            <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">¡Suscripción Exitosa!</h2>
            <p className="text-slate-600 mb-8">
              Tu tarjeta ha sido registrada correctamente y tu suscripción está activa.
            </p>
            <Link to="/login" className="w-full bg-slate-900 text-white font-bold py-3 rounded hover:bg-slate-800 transition block">
              Ir al Inicio de Sesión
            </Link>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <XCircle className="w-16 h-16 text-red-500 mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Algo salió mal</h2>
            <p className="text-slate-600 mb-8">
              No se pudo confirmar la tarjeta o la suscripción. Intenta nuevamente.
            </p>
            <button 
              onClick={() => navigate('/registroempresa')} 
              className="w-full border border-slate-300 text-slate-700 font-bold py-3 rounded hover:bg-slate-50 transition"
            >
              Volver al registro
            </button>
          </div>
        )}

      </div>
    </div>
  );
};