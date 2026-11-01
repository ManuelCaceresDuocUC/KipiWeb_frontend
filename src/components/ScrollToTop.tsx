import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/** Al cambiar de ruta vuelve arriba, salvo que la URL traiga #ancla (la pantalla de destino la maneja). */
export const ScrollToTop = () => {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
};
