import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom'; 
import { Building2, User, Plus, Trash2, ShieldAlert, ArrowLeft, Loader2, Store, MapPin } from 'lucide-react';
import Swal from 'sweetalert2'; 

interface EmpleadoInmediato {
  usuario: string;
  contrasena: string;
  rol: 'vendedor' | 'administrador';
}

export const RegistroEmpresa = () => {

  // 1. Datos legales de la Empresa
  const [empresa, setEmpresa] = useState({
    rut_empresa: '',
    razon_social: '',
    giro: ''
  });

  // 2. Datos de la primera Sucursal (Casa Matriz)
  const [sucursal, setSucursal] = useState({
    nombre: 'Casa Matriz',
    direccion: '',
    comuna: ''
  });

  // 3. Datos del Admin
  const [admin, setAdmin] = useState({
    usuario: '',
    correo: '',
    correoConfirmacion: '',
    contrasena: '',
    contrasenaConfirmacion: ''
  });

  // 4. Empleados iniciales
  const [empleados, setEmpleados] = useState<EmpleadoInmediato[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const formStateRef = useRef({ empresa, sucursal, admin, empleados });
  formStateRef.current = { empresa, sucursal, admin, empleados };

  const handleEmpresaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmpresa((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSucursalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSucursal((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAdminChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAdmin((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const calcularFuerzaClave = (clave: string) => {
    let fuerza = 0;
    if (clave.length >= 8) fuerza += 1;
    if (/[A-Z]/.test(clave)) fuerza += 1;
    if (/[a-z]/.test(clave)) fuerza += 1;
    if (/[0-9]/.test(clave)) fuerza += 1;
    if (/[^A-Za-z0-9]/.test(clave)) fuerza += 1;
    return fuerza;
  };

  const fuerza = calcularFuerzaClave(admin.contrasena);
  const colorFuerza = fuerza === 0 ? 'bg-slate-200' : fuerza <= 2 ? 'bg-red-500' : fuerza <= 4 ? 'bg-yellow-500' : 'bg-green-500';
  const textoFuerza = fuerza === 0 ? '' : fuerza <= 2 ? 'Débil' : fuerza <= 4 ? 'Aceptable' : 'Fuerte';

  const agregarFilaEmpleado = () => {
    setEmpleados((prev) => [...prev, { usuario: '', contrasena: '', rol: 'vendedor' }]);
  };

  const eliminarEmpleado = (index: number) => {
    setEmpleados((prev) => prev.filter((_, i) => i !== index));
  };

  const handleEmpleadoChange = (index: number, field: keyof EmpleadoInmediato, value: string) => {
    setEmpleados((prev) => {
      const nuevos = [...prev];
      nuevos[index] = { ...nuevos[index], [field]: value };
      return nuevos;
    });
  };

  const handleRegistroSubmit = async () => {
    setError('');
    const { empresa: currentEmpresa, sucursal: currentSucursal, admin: currentAdmin, empleados: currentEmpleados } = formStateRef.current;

    if (!currentEmpresa.rut_empresa || !currentEmpresa.razon_social || !currentEmpresa.giro || !currentSucursal.nombre || !currentAdmin.usuario || !currentAdmin.contrasena || !currentAdmin.correo) {
      setError('Por favor completa todos los campos obligatorios de la empresa, sucursal y administrador.');
      return;
    }

    const regexCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regexCorreo.test(currentAdmin.correo)) {
      setError('El formato del correo electrónico no es válido.');
      return;
    }
    if (currentAdmin.correo !== currentAdmin.correoConfirmacion) {
      setError('Los correos electrónicos no coinciden.');
      return;
    }
    if (currentAdmin.contrasena !== currentAdmin.contrasenaConfirmacion) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    try {
      setLoading(true);

      const payloadCompleto = {
        empresa: {
          ...currentEmpresa
        },
        sucursal: {
          nombre: currentSucursal.nombre,
          direccion: currentSucursal.direccion.trim() !== '' ? currentSucursal.direccion : 'Sin dirección registrada',
          comuna: currentSucursal.comuna.trim() !== '' ? currentSucursal.comuna : 'Sin comuna registrada'
        },
        admin: {
          usuario: currentAdmin.usuario,
          correo: currentAdmin.correo,
          contrasena: currentAdmin.contrasena,
          rol: 'admin'
        },
        // Filtramos empleados válidos
        empleados: currentEmpleados.filter(emp => emp.usuario && emp.contrasena)
      };

      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/registrar-empresa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadCompleto)
      });

      if (!response.ok) {
        const errorMsg = await response.text();
        throw new Error(errorMsg || 'Error en el servidor al registrar la empresa');
      }

      const data = await response.json();
      window.location.href = data.url_pago;

    } catch (err: unknown) {
      const mensaje = err instanceof Error ? err.message : String(err);
      setError(mensaje || 'Ocurrió un error al procesar el registro.');
      Swal.fire('Error', mensaje || 'No se pudo procesar el registro', 'error');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center p-8 font-sans text-slate-800 relative">
      {loading && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex flex-col items-center justify-center text-white">
          <Loader2 className="w-10 h-10 animate-spin mb-2" />
          <p className="font-semibold text-sm">Conectando con Flow (Webpay)...</p>
        </div>
      )}

      <div className="w-full max-w-4xl">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-8">
          <div>
            <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors mb-1">
              <ArrowLeft className="w-4 h-4" />
              <span>Volver al Inicio</span>
            </Link>
            <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">Registro de Empresa</h1>
            <p className="text-slate-500 text-sm mt-0.5">Plan Mensual SaaS - $30.000 CLP / mes</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-slate-800 rounded flex items-center justify-center text-white font-bold tracking-tighter text-sm shadow-sm">KP</div>
            <span className="text-xl font-bold tracking-tight text-slate-900">KIPI<span className="text-slate-400">.</span></span>
          </div>
        </div>

        <div className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 p-4 rounded text-sm text-red-700 font-medium flex items-center gap-3">
              <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {/* 1. EMPRESA */}
          <div className="bg-white p-6 rounded shadow-sm border border-slate-200 space-y-4">
            <div className="border-b border-slate-100 pb-3 mb-2 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">1. Información Legal de la Empresa</h3>
              <Building2 className="w-4 h-4 text-slate-400" />
            </div>
            {/* ... Inputs de Empresa (sin cambios) ... */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">RUT Empresa *</label>
                <input required type="text" name="rut_empresa" value={empresa.rut_empresa} onChange={handleEmpresaChange} className="w-full p-2.5 rounded border border-slate-300 shadow-sm outline-none text-sm focus:border-slate-500 bg-white" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Razón Social *</label>
                <input required type="text" name="razon_social" value={empresa.razon_social} onChange={handleEmpresaChange} className="w-full p-2.5 rounded border border-slate-300 shadow-sm outline-none text-sm focus:border-slate-500 bg-white" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Giro Comercial *</label>
              <input required type="text" name="giro" value={empresa.giro} onChange={handleEmpresaChange} className="w-full p-2.5 rounded border border-slate-300 shadow-sm outline-none text-sm focus:border-slate-500 bg-white" />
            </div>
          </div>

          {/* 2. SUCURSAL MATRIZ */}
          <div className="bg-white p-6 rounded shadow-sm border border-slate-200 space-y-4">
            <div className="border-b border-slate-100 pb-3 mb-2 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">2. Sucursal Principal (Casa Matriz)</h3>
              <Store className="w-4 h-4 text-slate-400" />
            </div>
            {/* ... Inputs de Sucursal (sin cambios) ... */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Nombre Sucursal *</label>
                <input required type="text" name="nombre" value={sucursal.nombre} onChange={handleSucursalChange} className="w-full p-2.5 rounded border border-slate-300 shadow-sm outline-none text-sm focus:border-slate-500 bg-white" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Dirección</label>
                <input type="text" name="direccion" value={sucursal.direccion} onChange={handleSucursalChange} className="w-full p-2.5 rounded border border-slate-300 shadow-sm outline-none text-sm focus:border-slate-500 bg-white" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Comuna *</label>
                <input required type="text" name="comuna" value={sucursal.comuna} onChange={handleSucursalChange} className="w-full p-2.5 rounded border border-slate-300 shadow-sm outline-none text-sm focus:border-slate-500 bg-white" />
              </div>
            </div>
          </div>

          {/* 3. ADMIN (sin cambios) */}
          <div className="bg-white p-6 rounded shadow-sm border border-slate-200 space-y-4">
            {/* ... Oculto para resumir, es exactamente el mismo que antes ... */}
             <div className="border-b border-slate-100 pb-3 mb-2 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">3. Cuenta de Administrador Principal</h3>
              <User className="w-4 h-4 text-slate-400" />
            </div>
            {/* Resto de campos admin */}
          </div>

          {/* ✨ 4. COLABORADORES (ACTUALIZADO) */}
          <div className="bg-white p-6 rounded shadow-sm border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-2">
              <div>
                <h3 className="text-base font-semibold text-slate-900">4. Cuentas para Colaboradores</h3>
                <p className="text-xs text-slate-500">
                  Estos empleados quedarán asignados automáticamente a la sucursal <strong className="text-slate-700">{sucursal.nombre || 'que crees arriba'}</strong>.
                </p>
              </div>
              <button type="button" onClick={agregarFilaEmpleado} className="bg-slate-800 hover:bg-slate-900 text-white px-3 py-1.5 rounded font-medium text-xs transition-colors flex items-center gap-1.5 shadow-sm">
                <Plus className="w-3.5 h-3.5" /> Agregar Cuenta
              </button>
            </div>

            {empleados.length === 0 ? (
              <div className="text-sm text-slate-500 text-center py-6 bg-slate-50/50 rounded border border-slate-200">
                No se han agregado colaboradores iniciales.
              </div>
            ) : (
              <div className="space-y-3">
                {empleados.map((emp, index) => (
                  <div key={index} className="flex flex-col md:flex-row gap-3 items-center bg-slate-50 p-3 rounded border border-slate-200">
                    
                    {/* Campos de ingreso */}
                    <div className="w-full md:flex-1">
                      <input required type="text" placeholder="Usuario empleado" value={emp.usuario} onChange={(e) => handleEmpleadoChange(index, 'usuario', e.target.value)} className="w-full p-2 rounded border border-slate-300 shadow-sm outline-none text-sm focus:border-slate-500 bg-white" />
                    </div>
                    <div className="w-full md:flex-1">
                      <input required type="password" placeholder="Contraseña" value={emp.contrasena} onChange={(e) => handleEmpleadoChange(index, 'contrasena', e.target.value)} className="w-full p-2 rounded border border-slate-300 shadow-sm outline-none text-sm focus:border-slate-500 bg-white" />
                    </div>
                    <div className="w-full md:w-48">
                      <select value={emp.rol} onChange={(e) => handleEmpleadoChange(index, 'rol', e.target.value as 'vendedor' | 'administrador')} className="w-full p-2 rounded border border-slate-300 shadow-sm outline-none text-sm focus:border-slate-500 bg-white cursor-pointer">
                        <option value="vendedor">Vendedor / Cajero</option>
                        <option value="administrador">Admin secundario</option>
                      </select>
                    </div>

                    {/* ✨ INDICADOR DE SUCURSAL ASIGNADA (Solo lectura) */}
                    <div className="w-full md:w-auto flex items-center gap-1.5 bg-slate-200 text-slate-600 px-3 py-2 rounded border border-slate-300 text-xs font-medium cursor-not-allowed" title="Asignado a la sucursal actual">
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="truncate max-w-[120px]">{sucursal.nombre || 'Sin nombre'}</span>
                    </div>

                    <button type="button" onClick={() => eliminarEmpleado(index)} className="p-2 text-slate-400 hover:text-red-600 rounded transition-colors self-end md:self-center" title="Eliminar usuario">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-8">
            <button 
              onClick={handleRegistroSubmit}
              disabled={loading}
              className="w-full bg-slate-900 text-white font-bold py-3 rounded hover:bg-slate-800 transition flex items-center justify-center gap-2 shadow-md"
            >
              Continuar al Pago con Flow
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};