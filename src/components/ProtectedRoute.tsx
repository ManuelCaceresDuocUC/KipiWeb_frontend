import { Navigate, Outlet } from 'react-router-dom';

export const ProtectedRoute = () => {
    const session = localStorage.getItem('user_session');

    // Si no hay sesión, redirigimos al login
    if (!session) {
        return <Navigate to="/login" replace />;
    }

    // Si hay sesión, renderizamos los componentes hijos (Outlet)
    return <Outlet />;
};