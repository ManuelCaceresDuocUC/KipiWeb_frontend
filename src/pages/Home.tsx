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
        

        
      </div>
    </div>
  );
};