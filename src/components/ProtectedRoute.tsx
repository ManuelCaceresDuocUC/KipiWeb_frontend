import { Navigate, Outlet } from 'react-router-dom';
import { haySesionValida, limpiarSesion } from '../helpers/session';

export const ProtectedRoute = () => {
  // Sin sesión, o con token vencido/ilegible → al login
  if (!haySesionValida()) {
    limpiarSesion();
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
};
