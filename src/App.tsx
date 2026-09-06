import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LandingKIPI } from './pages/LandingKIPI'; // ✨ Importación de tu nueva portada
import { Login } from './pages/Login';
import { Home } from './pages/Home';
import { Ventas } from './pages/Ventas';
import { Inventario } from './pages/Inventario';
import { Movimientos } from './pages/Movimientos';
import { Recetas } from './pages/Recetas';
import { Administracion } from './pages/Administracion';
import { DashboardLayout } from './components/DashboardLayout';
import { ProtectedRoute } from './components/ProtectedRoute'; 
import { RegistroEmpresa } from './pages/RegistroEmpresa';
import { RegistroExitoso } from './pages/RegistroExitoso';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 🔓 Rutas Públicas */}
        <Route path="/" element={<LandingKIPI />} /> {/* ✨ Portada pública de KIPI */}
        <Route path="/login" element={<Login />} />
        <Route path="/registroempresa" element={<RegistroEmpresa />} />
        <Route path="/registro-exitoso" element={<RegistroExitoso />} />

        {/* 🔒 Rutas Protegidas envueltas en el Layout */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/home" element={<Home />} /> {/* ✨ Tu caja POS ahora vive en /pos */}
            <Route path="/ventas" element={<Ventas />} />
            <Route path="/inventario" element={<Inventario />} />
            <Route path="/movimientos" element={<Movimientos />} />
            <Route path="/recetas" element={<Recetas />} />
            <Route path="/administracion" element={<Administracion />} />
          </Route>
        </Route>

        {/* Redirección de seguridad para cualquier ruta que no exista */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;