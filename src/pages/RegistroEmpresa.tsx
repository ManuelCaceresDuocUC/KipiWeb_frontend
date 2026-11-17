import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, User, Plus, Trash2, ShieldAlert, ArrowLeft, Loader2, Store, MapPin } from 'lucide-react';
import Swal from 'sweetalert2'; 
import {
  errorContrasena, errorCorreo, errorRut, errorTexto, errorUsuario, filtrarUsuario, formatearRutEnVivo,
  limpiarTexto, nombrePropio, normalizarCorreo, primerError, rutParaEnviar, sugerirCorreo,
} from '../helpers/validaciones';
import { apiFetch, leerError } from '../helpers/apiFetch';
import { LEGAL } from '../config/legal';
import { Turnstile, turnstileActivo } from '../components/publico/Turnstile';
import { DIAS_PRUEBA, PLAN_PRINCIPAL, formatoPrecio } from '../config/planes';
import { Logo } from '../components/publico/Logo';

interface SucursalItem {
  id: string; // Identificador temporal para relacionar en el formulario
  nombre: string;
  direccion: string;
  comuna: string;
}

interface EmpleadoInmediato {
  usuario: string;
  contrasena: string;
  rol: 'vendedor' | 'administrador';
  sucursalId: string; // ID de la sucursal asignada
  correo: string; // opcional: permite recuperar la contraseña por correo
}

const ErrorCampo = ({ msg }: { msg?: string | null }) =>
  msg ? <p role="alert" className="text-xs text-red-600 mt-1">{msg}</p> : null;

const borde = (msg?: string | null) => (msg ? 'border-red-400 focus:border-red-500' : 'border-slate-300 focus:border-slate-500');

export const RegistroEmpresa = () => {
  const navigate = useNavigate();

  // 1. Datos legales de la Empresa
  const [empresa, setEmpresa] = useState({
    rut_empresa: '',
    razon_social: '',
    giro: ''
  });

  // 2. Lista de Sucursales (Inicia con Casa Matriz por defecto)
  const [sucursales, setSucursales] = useState<SucursalItem[]>([
    { id: '1', nombre: 'Casa Matriz', direccion: '', comuna: '' }
  ]);

  // 3. Datos del Admin Principal
  const [admin, setAdmin] = useState({
    usuario: '',
    correo: '',
    correoConfirmacion: '',
    contrasena: '',
    contrasenaConfirmacion: ''
  });

  // 4. Empleados iniciales
  const [empleados, setEmpleados] = useState<EmpleadoInmediato[]>([]);
  
  // Verificación de correo + consentimiento
  const [captcha, setCaptcha] = useState('');
  const [reinicioCaptcha, setReinicioCaptcha] = useState(0);
  const [codigoEnviado, setCodigoEnviado] = useState(false);
  const [codigo, setCodigo] = useState('');
  const [tokenVerif, setTokenVerif] = useState('');
  const [correoVerificado, setCorreoVerificado] = useState('');
  const [procesandoCodigo, setProcesandoCodigo] = useState(false);
  const [aceptaTerminos, setAceptaTerminos] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // Los errores de un campo solo se muestran después de que el usuario pasó por él (o al intentar enviar)
  const [tocados, setTocados] = useState<Record<string, boolean>>({});
  const tocar = (k: string) => setTocados((t) => (t[k] ? t : { ...t, [k]: true }));

  const formStateRef = useRef({ empresa, sucursales, admin, empleados, tokenVerif, correoVerificado, aceptaTerminos });
  formStateRef.current = { empresa, sucursales, admin, empleados, tokenVerif, correoVerificado, aceptaTerminos };

  const API = import.meta.env.VITE_API_URL as string;
  const correoActual = normalizarCorreo(admin.correo);
  const correoOk = Boolean(tokenVerif) && correoVerificado === correoActual;
  const formatoCorreoOk = !errorCorreo(admin.correo);

  // Todas las reglas de formato en un solo lugar (mismas que valida el servidor)
  const errores: Record<string, string | null> = {
    rut: errorRut(empresa.rut_empresa, true, 'El RUT de la empresa'),
    razon: errorTexto(empresa.razon_social, 'La razón social', 2, 150),
    giro: errorTexto(empresa.giro, 'El giro comercial', 2, 80),
    usuario: errorUsuario(admin.usuario),
    correo: errorCorreo(admin.correo),
    correoConfirmacion: !admin.correoConfirmacion ? 'Repite el correo para confirmarlo.'
      : normalizarCorreo(admin.correo) !== normalizarCorreo(admin.correoConfirmacion) ? 'Los correos electrónicos no coinciden.' : null,
    contrasena: errorContrasena(admin.contrasena),
    contrasenaConfirmacion: !admin.contrasenaConfirmacion ? 'Repite la contraseña para confirmarla.'
      : admin.contrasena !== admin.contrasenaConfirmacion ? 'Las contraseñas no coinciden.' : null,
  };
  const nombresSucursal = sucursales.map((x) => nombrePropio(x.nombre).toLowerCase());
  sucursales.forEach((x, i) => {
    errores[`suc${x.id}n`] = primerError(
      errorTexto(x.nombre, 'El nombre de la sucursal', 2, 80),
      nombresSucursal.indexOf(nombrePropio(x.nombre).toLowerCase()) !== i ? 'Hay sucursales con el mismo nombre.' : null,
    );
    // La casa matriz es la dirección de la empresa: se exige completa. En las demás es opcional.
    errores[`suc${x.id}d`] = errorTexto(x.direccion, 'La dirección', 3, 100, i === 0);
    errores[`suc${x.id}c`] = errorTexto(x.comuna, 'La comuna', 2, 60, i === 0);
  });
  const usuariosUsados = [admin.usuario, ...empleados.map((x) => x.usuario)].map((u) => u.trim().toLowerCase());
  empleados.forEach((x, i) => {
    errores[`emp${i}u`] = primerError(
      errorUsuario(x.usuario),
      usuariosUsados.indexOf(x.usuario.trim().toLowerCase()) !== i + 1 ? 'Ese usuario está repetido.' : null,
    );
    errores[`emp${i}p`] = errorContrasena(x.contrasena);
    errores[`emp${i}c`] = errorCorreo(x.correo, false, 'El correo');
  });
  const ver = (k: string) => (tocados[k] ? errores[k] : null);

  const pedirCodigo = async () => {
    setError('');
    if (errores.correo) { tocar('correo'); return setError(errores.correo); }
    if (errores.correoConfirmacion) { tocar('correoConfirmacion'); return setError(errores.correoConfirmacion); }
    if (turnstileActivo && !captcha) return setError('Confirma que no eres un robot para recibir el código.');
    setProcesandoCodigo(true);
    try {
      const r = await apiFetch(`${API}/auth/registro/codigo`, { method: 'POST', body: JSON.stringify({ correo: normalizarCorreo(admin.correo), turnstile: captcha }) });
      if (!r.ok) throw new Error(await leerError(r, 'No pudimos enviar el código.'));
      setCodigoEnviado(true);
      Swal.fire({ icon: 'success', title: 'Código enviado', text: `Revisa ${normalizarCorreo(admin.correo)} (y la carpeta de spam).`, confirmButtonColor: '#1E293B', timer: 3500 });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos enviar el código.');
    } finally {
      setReinicioCaptcha((n) => n + 1); // el token del captcha es de un solo uso
      setProcesandoCodigo(false);
    }
  };

  const verificarCodigo = async () => {
    setError('');
    if (!/^\d{6}$/.test(codigo.trim())) return setError('El código tiene 6 dígitos.');
    setProcesandoCodigo(true);
    try {
      const r = await apiFetch(`${API}/auth/registro/verificar`, { method: 'POST', body: JSON.stringify({ correo: normalizarCorreo(admin.correo), codigo: codigo.trim() }) });
      if (!r.ok) throw new Error(await leerError(r, 'No pudimos verificar el código.'));
      const data = await r.json();
      setTokenVerif(data.tokenVerificacion);
      setCorreoVerificado(correoActual);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos verificar el código.');
    } finally {
      setProcesandoCodigo(false);
    }
  };

  // Handlers para Empresa
  const handleEmpresaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEmpresa((prev) => ({ ...prev, [name]: name === 'rut_empresa' ? formatearRutEnVivo(value) : value }));
  };

  // Al salir del campo se corrige: sin espacios de más, con formato
  const handleEmpresaBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target;
    tocar(name === 'rut_empresa' ? 'rut' : name === 'razon_social' ? 'razon' : 'giro');
    if (name !== 'rut_empresa') setEmpresa((prev) => ({ ...prev, [name]: limpiarTexto(prev[name as 'razon_social' | 'giro']) }));
  };

  // Handlers para Sucursales
  const agregarSucursal = () => {
    const nuevoId = Date.now().toString();
    const nuevaSucursal: SucursalItem = {
      id: nuevoId,
      nombre: `Sucursal ${sucursales.length + 1}`,
      direccion: '',
      comuna: ''
    };
    setSucursales((prev) => [...prev, nuevaSucursal]);
  };

  const eliminarSucursal = (id: string) => {
    if (sucursales.length <= 1) {
      Swal.fire('Atención', 'Debes registrar al menos una sucursal principal.', 'warning');
      return;
    }

    const filtradas = sucursales.filter((s) => s.id !== id);
    setSucursales(filtradas);

    // Reasignar empleados que pertenecían a la sucursal eliminada hacia la primera disponible
    const primeraDisponible = filtradas[0].id;
    setEmpleados((prev) =>
      prev.map((emp) => (emp.sucursalId === id ? { ...emp, sucursalId: primeraDisponible } : emp))
    );
  };

  const corregirSucursal = (id: string, field: 'nombre' | 'direccion' | 'comuna') => {
    tocar(`suc${id}${field[0]}`);
    setSucursales((prev) => prev.map((suc) => (suc.id === id
      ? { ...suc, [field]: field === 'direccion' ? limpiarTexto(suc[field]) : nombrePropio(suc[field]) }
      : suc)));
  };

  const handleSucursalChange = (id: string, field: keyof SucursalItem, value: string) => {
    setSucursales((prev) =>
      prev.map((suc) => (suc.id === id ? { ...suc, [field]: value } : suc))
    );
  };

  // Handlers para Admin
  const handleAdminChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const v = name === 'usuario' ? filtrarUsuario(value)
      : name === 'correo' || name === 'correoConfirmacion' ? normalizarCorreo(value)
      : value;
    setAdmin((prev) => ({ ...prev, [name]: v }));
  };

  // Handlers para Empleados
  const agregarFilaEmpleado = () => {
    setEmpleados((prev) => [
      ...prev,
      { 
        usuario: '', 
        contrasena: '', 
        rol: 'vendedor', 
        sucursalId: sucursales[0]?.id || '1', // Por defecto asignado a la primera sucursal
        correo: ''
      }
    ]);
  };

  const eliminarEmpleado = (index: number) => {
    setEmpleados((prev) => prev.filter((_, i) => i !== index));
  };

  const handleEmpleadoChange = (index: number, field: keyof EmpleadoInmediato, value: string) => {
    if (field === 'usuario') value = filtrarUsuario(value);
    if (field === 'correo') value = normalizarCorreo(value);
    setEmpleados((prev) => {
      const nuevos = [...prev];
      nuevos[index] = { ...nuevos[index], [field]: value };
      return nuevos;
    });
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

  const handleRegistroSubmit = async () => {
    setError('');
    const { empresa: currentEmpresa, sucursales: currentSucursales, admin: currentAdmin, empleados: currentEmpleados, tokenVerif: tokenActual, correoVerificado: correoOkActual, aceptaTerminos: acepta } = formStateRef.current;

    // Todos los campos con error se marcan para que el usuario los vea en rojo
    const marcas: Record<string, boolean> = {};
    Object.keys(errores).forEach((k) => { marcas[k] = true; });
    setTocados(marcas);
    const filasEmpleado = currentEmpleados.filter((emp) => emp.usuario || emp.contrasena || emp.correo);
    const primero = primerError(
      errores.rut, errores.razon, errores.giro,
      ...currentSucursales.flatMap((x) => [errores[`suc${x.id}n`], errores[`suc${x.id}d`], errores[`suc${x.id}c`]]),
      errores.usuario, errores.correo, errores.correoConfirmacion, errores.contrasena, errores.contrasenaConfirmacion,
      ...currentEmpleados.flatMap((_, i) => (filasEmpleado.includes(currentEmpleados[i])
        ? [errores[`emp${i}u`], errores[`emp${i}p`], errores[`emp${i}c`]] : [])),
    );
    if (primero) {
      setError(primero);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!tokenActual || correoOkActual !== normalizarCorreo(currentAdmin.correo)) {
      setError('Verifica el correo del administrador con el código que te enviamos antes de continuar.');
      return;
    }
    if (!acepta) {
      setError('Debes aceptar los Términos y Condiciones y la Política de Privacidad para continuar.');
      return;
    }

    // Confirmación explícita de lo que se está contratando
    const confirmacion = await Swal.fire({
      icon: 'question',
      title: `Comienza tu prueba gratuita de ${DIAS_PRUEBA} días`,
      html: `<div style="text-align:left;font-size:14px;line-height:1.5">
        <p><b>${limpiarTexto(currentEmpresa.razon_social).replace(/</g, '&lt;')}</b> (${(rutParaEnviar(currentEmpresa.rut_empresa) ?? '').replace(/</g, '&lt;')})</p>
        <p style="margin-top:8px">Pruebas el <b>${PLAN_PRINCIPAL.nombre}</b> <b>${DIAS_PRUEBA} días gratis, sin ingresar tarjeta</b>.</p>
        <ul style="margin-top:8px;padding-left:18px;list-style:disc">
          <li>Te avisaremos por correo antes de que termine la prueba.</li>
          <li>Para seguir después, activas tu suscripción de <b>${formatoPrecio(PLAN_PRINCIPAL.precioMensual)} al mes</b>${LEGAL.precioIncluyeIva ? ' (IVA incluido)' : ' (más IVA)'} inscribiendo tu tarjeta; el cobro mensual parte al activarla.</li>
          <li>Si no activas, tu cuenta queda en solo lectura y no se te cobra nada. También puedes dar de baja tu cuenta cuando quieras.</li>
        </ul></div>`,
      showCancelButton: true,
      confirmButtonText: 'Crear mi cuenta',
      cancelButtonText: 'Revisar',
      confirmButtonColor: '#0F172A',
    });
    if (!confirmacion.isConfirmed) return;

    try {
      setLoading(true);

      const payloadCompleto = {
        tokenVerificacion: tokenActual,
        aceptaTerminos: true,
        terminosVersion: LEGAL.version,
        empresa: {
          rut_empresa: rutParaEnviar(currentEmpresa.rut_empresa) ?? currentEmpresa.rut_empresa,
          razon_social: limpiarTexto(currentEmpresa.razon_social),
          giro: limpiarTexto(currentEmpresa.giro),
        },
        sucursales: currentSucursales.map(s => ({
          nombre: nombrePropio(s.nombre),
          direccion: limpiarTexto(s.direccion) !== '' ? limpiarTexto(s.direccion) : 'Sin dirección registrada',
          comuna: nombrePropio(s.comuna) !== '' ? nombrePropio(s.comuna) : 'Sin comuna registrada'
        })),
        admin: {
          usuario: currentAdmin.usuario.trim(),
          correo: normalizarCorreo(currentAdmin.correo),
          contrasena: currentAdmin.contrasena,
          rol: 'admin'
        },
        empleados: currentEmpleados
          .filter(emp => emp.usuario && emp.contrasena)
          .map(emp => {
            const sucEncontrada = currentSucursales.find(s => s.id === emp.sucursalId);
            return {
              usuario: emp.usuario.trim(),
              contrasena: emp.contrasena,
              rol: emp.rol === 'administrador' ? 'admin' : 'vendedor',
              sucursalNombre: nombrePropio(sucEncontrada ? sucEncontrada.nombre : currentSucursales[0].nombre),
              correo: normalizarCorreo(emp.correo)
            };
          })
      };

      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/registrar-empresa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadCompleto)
      });

      if (!response.ok) {
        throw new Error(await leerError(response, 'Error en el servidor al registrar la empresa'));
      }

      await Swal.fire({
        icon: 'success',
        title: '¡Tu cuenta está lista!',
        html: `Tu prueba gratuita de <b>${DIAS_PRUEBA} días</b> ya comenzó. Inicia sesión con el usuario y la contraseña que creaste.`,
        confirmButtonText: 'Ir a iniciar sesión',
        confirmButtonColor: '#0F172A',
      });
      navigate('/login');

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
          <p className="font-semibold text-sm">Creando tu cuenta…</p>
        </div>
      )}

      <div className="w-full max-w-4xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4 mb-6">
          <div>
            <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors mb-1">
              <ArrowLeft className="w-4 h-4" />
              <span>Volver al Inicio</span>
            </Link>
            <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">Crea tu cuenta KIPI</h1>
            <p className="text-slate-500 text-sm mt-0.5">Completa los datos de tu empresa y empieza tu prueba gratuita. No necesitas tarjeta.</p>
          </div>
          <Logo />
        </div>

        {/* Resumen del plan (monto desde config/planes.ts: debe coincidir con el plan de Flow) */}
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Tu plan</p>
            <p className="font-semibold text-slate-900">{PLAN_PRINCIPAL.nombre} · todo incluido</p>
            <Link to="/planes" target="_blank" className="text-xs text-slate-500 underline underline-offset-2 hover:text-slate-800">Ver qué incluye</Link>
          </div>
          <div className="sm:text-right">
            <p className="text-2xl font-bold text-slate-900">{DIAS_PRUEBA} días gratis</p>
            <p className="text-xs text-slate-500">Sin tarjeta. Después, {formatoPrecio(PLAN_PRINCIPAL.precioMensual)} / mes al activar tu suscripción</p>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">RUT Empresa *</label>
                <input required type="text" name="rut_empresa" inputMode="text" maxLength={12} placeholder="Ej: 76.123.456-7" autoComplete="off" value={empresa.rut_empresa} onChange={handleEmpresaChange} onBlur={handleEmpresaBlur} className={`w-full p-2.5 rounded border shadow-sm outline-none text-sm bg-white ${borde(ver('rut'))}`} />
                <ErrorCampo msg={ver('rut')} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Razón Social *</label>
                <input required type="text" name="razon_social" maxLength={150} value={empresa.razon_social} onChange={handleEmpresaChange} onBlur={handleEmpresaBlur} className={`w-full p-2.5 rounded border shadow-sm outline-none text-sm bg-white ${borde(ver('razon'))}`} />
                <ErrorCampo msg={ver('razon')} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Giro Comercial *</label>
              <input required type="text" name="giro" maxLength={80} placeholder="Ej: Venta de abarrotes" value={empresa.giro} onChange={handleEmpresaChange} onBlur={handleEmpresaBlur} className={`w-full p-2.5 rounded border shadow-sm outline-none text-sm bg-white ${borde(ver('giro'))}`} />
              <ErrorCampo msg={ver('giro')} />
            </div>
          </div>

          {/* 2. SUCURSALES (DINÁMICAS) */}
          <div className="bg-white p-6 rounded shadow-sm border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-2">
              <div>
                <h3 className="text-base font-semibold text-slate-900">2. Sucursales de la Empresa</h3>
                <p className="text-xs text-slate-500">Puedes agregar varias sucursales y asignarles personal más abajo.</p>
              </div>
              <button type="button" onClick={agregarSucursal} className="bg-slate-800 hover:bg-slate-900 text-white px-3 py-1.5 rounded font-medium text-xs transition-colors flex items-center gap-1.5 shadow-sm">
                <Plus className="w-3.5 h-3.5" /> Agregar Sucursal
              </button>
            </div>

            <div className="space-y-4">
              {sucursales.map((suc, index) => (
                <div key={suc.id} className="p-4 bg-slate-50 rounded border border-slate-200 space-y-3 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                      <Store className="w-3.5 h-3.5 text-slate-500" />
                      Sucursal #{index + 1} {index === 0 && '(Principal)'}
                    </span>
                    {sucursales.length > 1 && (
                      <button type="button" onClick={() => eliminarSucursal(suc.id)} className="text-slate-400 hover:text-red-600 text-xs flex items-center gap-1 transition-colors" title="Eliminar sucursal">
                        <Trash2 className="w-3.5 h-3.5" /> Quitar
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Nombre Sucursal *</label>
                      <input required type="text" maxLength={80} value={suc.nombre} onChange={(e) => handleSucursalChange(suc.id, 'nombre', e.target.value)} onBlur={() => corregirSucursal(suc.id, 'nombre')} className={`w-full p-2 rounded border shadow-sm outline-none text-sm bg-white ${borde(ver(`suc${suc.id}n`))}`} placeholder="Ej: Casa Matriz, Local Centro" />
                      <ErrorCampo msg={ver(`suc${suc.id}n`)} />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Dirección{index === 0 && ' *'}</label>
                      <input type="text" maxLength={100} value={suc.direccion} onChange={(e) => handleSucursalChange(suc.id, 'direccion', e.target.value)} onBlur={() => corregirSucursal(suc.id, 'direccion')} className={`w-full p-2 rounded border shadow-sm outline-none text-sm bg-white ${borde(ver(`suc${suc.id}d`))}`} placeholder="Ej: Av. Providencia 1234" />
                      <ErrorCampo msg={ver(`suc${suc.id}d`)} />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Comuna{index === 0 && ' *'}</label>
                      <input type="text" maxLength={60} value={suc.comuna} onChange={(e) => handleSucursalChange(suc.id, 'comuna', e.target.value)} onBlur={() => corregirSucursal(suc.id, 'comuna')} className={`w-full p-2 rounded border shadow-sm outline-none text-sm bg-white ${borde(ver(`suc${suc.id}c`))}`} placeholder="Ej: Providencia" />
                      <ErrorCampo msg={ver(`suc${suc.id}c`)} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. ADMIN */}
          <div className="bg-white p-6 rounded shadow-sm border border-slate-200 space-y-4">
            <div className="border-b border-slate-100 pb-3 mb-2 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">3. Cuenta de Administrador Principal</h3>
              <User className="w-4 h-4 text-slate-400" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Usuario administrador *</label>
                <input required type="text" name="usuario" autoComplete="username" autoCapitalize="none" spellCheck={false} maxLength={50} value={admin.usuario} onChange={handleAdminChange} onBlur={() => tocar('usuario')} className={`w-full p-2.5 rounded border shadow-sm outline-none text-sm bg-white ${borde(ver('usuario'))}`} />
                {ver('usuario') ? <ErrorCampo msg={ver('usuario')} /> : <p className="text-[11px] text-slate-400 mt-1">Letras, números, punto, guion o guion bajo. Sin espacios.</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Correo electrónico *</label>
                <input required type="email" name="correo" autoComplete="email" autoCapitalize="none" spellCheck={false} maxLength={150} value={admin.correo} onChange={handleAdminChange} onBlur={() => tocar('correo')} className={`w-full p-2.5 rounded border shadow-sm outline-none text-sm bg-white ${borde(ver('correo'))}`} />
                <ErrorCampo msg={ver('correo')} />
                {sugerirCorreo(admin.correo) && (
                  <button type="button" onClick={() => setAdmin((prev) => ({ ...prev, correo: sugerirCorreo(prev.correo) ?? prev.correo }))} className="text-xs text-slate-700 underline mt-1">
                    Usar {sugerirCorreo(admin.correo)}
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Confirmar correo *</label>
                <input required type="email" name="correoConfirmacion" autoComplete="off" autoCapitalize="none" spellCheck={false} maxLength={150} value={admin.correoConfirmacion} onChange={handleAdminChange} onBlur={() => tocar('correoConfirmacion')} onPaste={(e) => e.preventDefault()} className={`w-full p-2.5 rounded border shadow-sm outline-none text-sm bg-white ${borde(ver('correoConfirmacion'))}`} />
                <ErrorCampo msg={ver('correoConfirmacion')} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Contraseña *</label>
                <input required type="password" name="contrasena" autoComplete="new-password" maxLength={100} value={admin.contrasena} onChange={handleAdminChange} onBlur={() => tocar('contrasena')} className={`w-full p-2.5 rounded border shadow-sm outline-none text-sm bg-white ${borde(ver('contrasena'))}`} />
                {ver('contrasena') ? <ErrorCampo msg={ver('contrasena')} /> : <p className="text-[11px] text-slate-400 mt-1">Mínimo 8 caracteres, con letras y números.</p>}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Confirmar contraseña *</label>
              <input required type="password" name="contrasenaConfirmacion" autoComplete="new-password" maxLength={100} value={admin.contrasenaConfirmacion} onChange={handleAdminChange} onBlur={() => tocar('contrasenaConfirmacion')} className={`w-full p-2.5 rounded border shadow-sm outline-none text-sm bg-white ${borde(ver('contrasenaConfirmacion'))}`} />
              <ErrorCampo msg={ver('contrasenaConfirmacion')} />
            </div>

            {admin.contrasena && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-medium text-slate-600">
                  <span>Seguridad de contraseña</span>
                  <span>{textoFuerza}</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-slate-200 overflow-hidden">
                  <div className={`h-full rounded-full ${colorFuerza}`} style={{ width: `${Math.min((fuerza / 5) * 100, 100)}%` }} />
                </div>
              </div>
            )}
          </div>

          {/* Verificación del correo del administrador (evita registros falsos) */}
          <div className="bg-white p-6 rounded shadow-sm border border-slate-200 space-y-3">
            <h3 className="text-base font-semibold text-slate-900">Verifica tu correo</h3>
            {correoOk ? (
              <p className="text-sm text-emerald-700 font-medium">✓ Correo verificado: {admin.correo.trim()}</p>
            ) : (
              <>
                <p className="text-xs text-slate-500">Te enviaremos un código de 6 dígitos al correo del administrador. Es necesario para crear tu cuenta.</p>
                {!codigoEnviado && <Turnstile onToken={setCaptcha} reinicio={reinicioCaptcha} />}
                <div className="flex flex-col sm:flex-row gap-2">
                  <button type="button" onClick={pedirCodigo} disabled={procesandoCodigo || !formatoCorreoOk} className="px-4 py-2.5 rounded border border-slate-300 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50">
                    {codigoEnviado ? 'Reenviar código' : 'Enviar código'}
                  </button>
                  {codigoEnviado && (
                    <>
                      <input inputMode="numeric" maxLength={6} placeholder="Código de 6 dígitos" value={codigo} onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ''))} className="p-2.5 rounded border border-slate-300 text-sm tracking-widest outline-none focus:border-slate-500 sm:w-48" />
                      <button type="button" onClick={verificarCodigo} disabled={procesandoCodigo || codigo.length !== 6} className="px-4 py-2.5 rounded bg-slate-800 text-white text-sm font-semibold hover:bg-slate-900 disabled:opacity-50">
                        Verificar
                      </button>
                    </>
                  )}
                </div>
                {tokenVerif && correoVerificado !== correoActual && (
                  <p className="text-xs text-amber-700">Cambiaste el correo después de verificarlo: debes verificarlo de nuevo.</p>
                )}
              </>
            )}
          </div>

          {/* 4. COLABORADORES CON ASIGNACIÓN DE SUCURSAL */}
          <div className="bg-white p-6 rounded shadow-sm border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-2">
              <div>
                <h3 className="text-base font-semibold text-slate-900">4. Cuentas para Colaboradores</h3>
                <p className="text-xs text-slate-500">Asigna cada colaborador a una sucursal. Con correo (opcional) podrá recuperar su contraseña solo; si no, lo hará tu administrador.</p>
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
                    
                    <div className="w-full md:flex-1">
                      <input required type="text" placeholder="Usuario empleado" autoCapitalize="none" spellCheck={false} maxLength={50} value={emp.usuario} onChange={(e) => handleEmpleadoChange(index, 'usuario', e.target.value)} onBlur={() => tocar(`emp${index}u`)} className={`w-full p-2 rounded border shadow-sm outline-none text-sm bg-white ${borde(ver(`emp${index}u`))}`} />
                      <ErrorCampo msg={ver(`emp${index}u`)} />
                    </div>
                    <div className="w-full md:flex-1">
                      <input required type="password" placeholder="Contraseña" autoComplete="new-password" maxLength={100} value={emp.contrasena} onChange={(e) => handleEmpleadoChange(index, 'contrasena', e.target.value)} onBlur={() => tocar(`emp${index}p`)} className={`w-full p-2 rounded border shadow-sm outline-none text-sm bg-white ${borde(ver(`emp${index}p`))}`} />
                      <ErrorCampo msg={ver(`emp${index}p`)} />
                    </div>
                    <div className="w-full md:flex-1">
                      <input type="email" placeholder="Correo (opcional)" title="Con correo, el empleado puede recuperar su contraseña solo" value={emp.correo} onChange={(e) => handleEmpleadoChange(index, 'correo', e.target.value)} onBlur={() => tocar(`emp${index}c`)} autoComplete="off" autoCapitalize="none" spellCheck={false} maxLength={150} className={`w-full p-2 rounded border shadow-sm outline-none text-sm bg-white ${borde(ver(`emp${index}c`))}`} />
                      <ErrorCampo msg={ver(`emp${index}c`)} />
                    </div>
                    <div className="w-full md:w-44">
                      <select value={emp.rol} onChange={(e) => handleEmpleadoChange(index, 'rol', e.target.value as 'vendedor' | 'administrador')} className="w-full p-2 rounded border border-slate-300 shadow-sm outline-none text-sm focus:border-slate-500 bg-white cursor-pointer">
                        <option value="vendedor">Vendedor / Cajero</option>
                        <option value="administrador">Admin secundario</option>
                      </select>
                    </div>

                    {/* SELECTOR DINÁMICO DE SUCURSAL */}
                    <div className="w-full md:w-52 flex items-center gap-1.5 bg-white p-1 rounded border border-slate-300">
                      <MapPin className="w-4 h-4 text-slate-400 ml-1 shrink-0" />
                      <select value={emp.sucursalId} onChange={(e) => handleEmpleadoChange(index, 'sucursalId', e.target.value)} className="w-full p-1 text-xs font-medium text-slate-700 bg-transparent outline-none cursor-pointer truncate">
                        {sucursales.map((suc) => (
                          <option key={suc.id} value={suc.id}>
                            {suc.nombre || 'Sin nombre'}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button type="button" onClick={() => eliminarEmpleado(index)} className="p-2 text-slate-400 hover:text-red-600 rounded transition-colors self-end md:self-center" title="Eliminar usuario">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <label className="flex items-start gap-3 bg-white p-4 rounded border border-slate-200 text-sm text-slate-700 cursor-pointer">
            <input type="checkbox" checked={aceptaTerminos} onChange={(e) => setAceptaTerminos(e.target.checked)} className="mt-0.5 w-4 h-4 accent-slate-900" />
            <span>
              He leído y acepto los{' '}
              <Link to="/terminos" target="_blank" className="font-semibold underline underline-offset-2">Términos y Condiciones</Link> y la{' '}
              <Link to="/privacidad" target="_blank" className="font-semibold underline underline-offset-2">Política de Privacidad</Link>, incluido el{' '}
              <Link to="/encargo-datos" target="_blank" className="font-semibold underline underline-offset-2">Anexo de Encargo de Tratamiento de Datos</Link>,
              y que, terminada la prueba de {DIAS_PRUEBA} días, para seguir usando KIPI debo activar la suscripción de {formatoPrecio(PLAN_PRINCIPAL.precioMensual)} mensuales inscribiendo mi tarjeta. Declaro tener facultades para contratar en nombre de la empresa.
            </span>
          </label>

          <div className="mt-6">
            <button 
              onClick={handleRegistroSubmit}
              disabled={loading}
              className="w-full bg-slate-900 text-white font-bold py-3 rounded hover:bg-slate-800 transition flex items-center justify-center gap-2 shadow-md disabled:opacity-60"
            >
              Crear mi cuenta gratis
            </button>
            <p className="text-center text-xs text-slate-500 mt-3">
              No te pediremos tarjeta ahora. Cuando decidas activar tu suscripción, la inscribirás en el sitio seguro de Flow; KIPI no almacena los datos de tu tarjeta.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};