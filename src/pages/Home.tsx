import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
 // Ajusta la ruta a tu componente

export const Home = () => {
  const navigate = useNavigate();

  const [nombreParaMostrar] = useState(() => {
    const sesion = localStorage.getItem('user_session');
    if (!sesion) return 'Usuario'; 
    
    try {
      const usuarioObj = JSON.parse(sesion);
      return usuarioObj.usuario || usuarioObj.nombre || 'Usuario';
    } catch (e) {
      console.log(e);
      return sesion; 
    }
  });

  useEffect(() => {
    const sesion = localStorage.getItem('user_session');
    if (!sesion) {
      navigate('/login'); 
    }
  }, [navigate]);

  return (
    <div className="p-8 flex flex-col gap-8 bg-slate-50 min-h-screen font-sans text-slate-800">
      <div className="bg-white p-8 rounded shadow-sm border border-slate-200">
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
          Bienvenido {nombreParaMostrar} ! 
        </h1>
        
      </div>

      <div className="w-full flex flex-col bg-white rounded shadow-sm border border-slate-200 overflow-hidden h-[600px]">
        <div className="bg-slate-100 border-b border-slate-200 px-6 py-3 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Panel de pedidos
          </span>
          <span className="text-xs text-slate-500 font-mono">ESTADO: CONECTADO</span>
        </div>

        <iframe 
          src="https://panel-local.vercel.app/" 
          width="100%" 
          height="100%" 
          title="Panel de Pedidos Externo"
          className="border-none flex-grow"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
      </div>
    </div>
  );
};