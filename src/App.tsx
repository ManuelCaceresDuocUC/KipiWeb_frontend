import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LandingKIPI } from './pages/LandingKIPI'; // ✨ Importación de tu nueva portada
import { Planes } from './pages/Planes';
import { Terminos } from './pages/Terminos';
import { Privacidad } from './pages/Privacidad';
import { GuiaDte } from './pages/GuiaDte';
import { Contacto } from './pages/Contacto';
import { RecuperarClave } from './pages/RecuperarClave';
import { RestablecerClave } from './pages/RestablecerClave';
import { Login } from './pages/Login';
import { Home } from './pages/Home';
import { Ventas } from './pages/Ventas';
import { Inventario } from './pages/Inventario';
import { Movimientos } from './pages/Movimientos';
import { Compras } from './pages/Compras';
import { Recetas } from './pages/Recetas';
import { Administracion } from './pages/Administracion';
import { DashboardLayout } from './components/DashboardLayout';
import { ProtectedRoute } from './components/ProtectedRoute'; 
import { RegistroEmpresa } from './pages/RegistroEmpresa';
import { RegistroExitoso } from './pages/RegistroExitoso';
import { ConfiguracionDTE } from './pages/ConfiguracionDTE';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ScrollToTop } from './components/ScrollToTop';

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <ErrorBoundary>
      <Routes>
        {/* 🔓 Rutas Públicas */}
        <Route path="/" element={<LandingKIPI />} /> {/* ✨ Portada pública de KIPI */}
        <Route path="/planes" element={<Planes />} />
        <Route path="/contacto" element={<Contacto />} />
        <Route path="/terminos" element={<Terminos />} />
        <Route path="/privacidad" element={<Privacidad />} />
        <Route path="/guia-dte" element={<GuiaDte />} />
        <Route path="/recuperar" element={<RecuperarClave />} />
        <Route path="/restablecer" element={<RestablecerClave />} />
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
            <Route path="/compras" element={<Compras />} />
            <Route path="/recetas" element={<Recetas />} />
            <Route path="/administracion" element={<Administracion />} />
            <Route path="/configuracion-dte" element={<ConfiguracionDTE />} />
          </Route>
        </Route>

        {/* Redirección de seguridad para cualquier ruta que no exista */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;