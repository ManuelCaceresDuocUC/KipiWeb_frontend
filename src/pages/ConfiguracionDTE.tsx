import { useState, useEffect, type FormEvent } from 'react';
import { Link } from 'react-router-dom';

interface ConfiguracionDTEData {
  proveedor: 'openfactura' | 'libredte' | 'simplefactura' | 'relbase' | 'ninguno';
  apiKey: string;
  apiSecret?: string;
  rutEmisor: string;
  ambiente: 'produccion' | 'sandbox';
  emitirBoletaEfectivo: boolean;
  emitirBoletaTarjeta: boolean; // Control para evitar doble IVA con vouchers
  emitirBoletaTransferencia: boolean;
}

export const ConfiguracionDTE = () => {
  const API_URL = import.meta.env.VITE_API_URL;
  const empresaId = localStorage.getItem('empresaId') || '1';

  const [guardando, setGuardando] = useState(false);
  const [probandoConexion, setProbandoConexion] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);

  const [config, setConfig] = useState<ConfiguracionDTEData>({
    proveedor: 'openfactura',
    apiKey: '',
    apiSecret: '',
    rutEmisor: '',
    ambiente: 'produccion',
    emitirBoletaEfectivo: true,
    emitirBoletaTarjeta: false, // Por defecto en false para resguardar voucher de Transbank/Getnet
    emitirBoletaTransferencia: true,
  });

  // Cargar configuración existente
  useEffect(() => {
    const cargarConfiguracion = async () => {
      try {
        const token = localStorage.getItem('token'); // <-- Obtener token
        const res = await fetch(`${API_URL}/dte/configuracion/${empresaId}`, {
          headers: {
            'Authorization': `Bearer ${token}` // <-- Enviar token
          }
        });
        if (res.ok) {
          const data = await res.json();
          if (data) setConfig(data);
        }
      } catch {
        console.error('Error al cargar configuración DTE');
      }
    };
    cargarConfiguracion();
  }, [API_URL, empresaId]);

  const handleProbarConexion = async () => {
    setProbandoConexion(true);
    setMensaje(null);
    try {
      const token = localStorage.getItem('token'); // <-- Obtener token
      const res = await fetch(`${API_URL}/dte/probar-conexion`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // <-- Enviar token
        },
        body: JSON.stringify({ ...config, empresaId }),
      });
      
      if (res.status === 403 || res.status === 401) {
        setMensaje({ tipo: 'error', texto: 'Sesión expirada o sin permisos. Por favor, inicia sesión nuevamente.' });
        return;
      }

      const data = await res.json();

      if (res.ok && data.valido) {
        setMensaje({ tipo: 'exito', texto: '¡Conexión exitosa! La API Key y el certificado son válidos.' });
      } else {
        setMensaje({ tipo: 'error', texto: data.mensaje || 'Error de conexión. Verifica la API Key y el RUT.' });
      }
    } catch {
      setMensaje({ tipo: 'error', texto: 'No se pudo conectar con el servidor para probar la API Key.' });
    } finally {
      setProbandoConexion(false);
    }
  };

  const handleGuardar = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setGuardando(true);
    setMensaje(null);

    try {
      const token = localStorage.getItem('token'); // <-- Obtener token
      const res = await fetch(`${API_URL}/dte/configuracion`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // <-- Enviar token
        },
        body: JSON.stringify({ ...config, empresaId }),
      });

      if (res.status === 403 || res.status === 401) {
        setMensaje({ tipo: 'error', texto: 'Tu sesión ha expirado. Recarga la página o inicia sesión.' });
        return;
      }

      if (res.ok) {
        setMensaje({ tipo: 'exito', texto: 'Configuración de facturación guardada correctamente.' });
      } else {
        setMensaje({ tipo: 'error', texto: 'Ocurrió un error al guardar los cambios.' });
      }
    } catch {
      setMensaje({ tipo: 'error', texto: 'Error al conectar con la base de datos.' });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans text-slate-800">
      <div className="max-w-4xl mx-auto mb-8 flex justify-between items-center border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">Facturación Electrónica DTE</h1>
          <p className="text-slate-500 text-sm mt-1">Conecta tu POS con Impuestos Internos (SII) a través de un proveedor API</p>
        </div>
        <Link to="/administracion">
          <button className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 font-medium py-2 px-5 rounded text-sm transition-colors shadow-sm">
            ← Volver al Panel
          </button>
        </Link>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">

        {/* ALERTA / MENSAJE */}
        {mensaje && (
          <div className={`p-4 rounded border text-sm font-medium ${
            mensaje.tipo === 'exito' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            {mensaje.texto}
          </div>
        )}

        <form onSubmit={handleGuardar} className="space-y-6">
          
          {/* SELECCIÓN DE PROVEEDOR */}
          <div className="bg-white rounded p-6 shadow-sm border border-slate-200">
            <h2 className="text-base font-semibold text-slate-900 uppercase tracking-wide mb-4 border-b border-slate-100 pb-2">
              1. Proveedor del Servicio DTE
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Seleccionar Proveedor API</label>
                <select
                  value={config.proveedor}
                  onChange={(e) => setConfig({ ...config, proveedor: e.target.value as ConfiguracionDTEData['proveedor'] })}
                  className="w-full p-2.5 rounded border border-slate-300 bg-white focus:outline-none focus:border-slate-500 text-sm"
                >
                  <option value="openfactura">OpenFactura (Haulmer)</option>
                  <option value="libredte">LibreDTE</option>
                  <option value="simplefactura">SimpleFactura</option>
                  <option value="relbase">relBase API</option>
                  <option value="ninguno">Deshabilitado (Solo boleta informativa)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Entorno de Operación</label>
                <select
                  value={config.ambiente}
                  onChange={(e) => setConfig({ ...config, ambiente: e.target.value as ConfiguracionDTEData['ambiente'] })}
                  className="w-full p-2.5 rounded border border-slate-300 bg-white focus:outline-none focus:border-slate-500 text-sm"
                >
                  <option value="produccion">Producción (Boletas Oficiales SII)</option>
                  <option value="sandbox">Sandbox / Pruebas (Certificación)</option>
                </select>
              </div>
            </div>
          </div>

          {/* CREDENCIALES DE API KEY */}
          <div className="bg-white rounded p-6 shadow-sm border border-slate-200">
            <h2 className="text-base font-semibold text-slate-900 uppercase tracking-wide mb-4 border-b border-slate-100 pb-2">
              2. Credenciales e Identificación
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">RUT Emisor (Empresa)</label>
                <input
                  type="text"
                  placeholder="ej: 76123456-7"
                  value={config.rutEmisor}
                  onChange={(e) => setConfig({ ...config, rutEmisor: e.target.value })}
                  className="w-full p-2.5 rounded border border-slate-300 bg-white focus:outline-none focus:border-slate-500 text-sm font-mono"
                  required={config.proveedor !== 'ninguno'}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">API Key / Token Privado</label>
                <input
                  type="password"
                  placeholder="Pega aquí tu API Key del proveedor..."
                  value={config.apiKey}
                  onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                  className="w-full p-2.5 rounded border border-slate-300 bg-white focus:outline-none focus:border-slate-500 text-sm font-mono"
                  required={config.proveedor !== 'ninguno'}
                />
              </div>

              {/* Secret Key opcional si LibreDTE o SimpleFactura lo exigen */}
              {(config.proveedor === 'libredte' || config.proveedor === 'simplefactura') && (
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">API Secret / Hash adicional (Opcional)</label>
                  <input
                    type="password"
                    placeholder="Secret Key adicional si aplica..."
                    value={config.apiSecret || ''}
                    onChange={(e) => setConfig({ ...config, apiSecret: e.target.value })}
                    className="w-full p-2.5 rounded border border-slate-300 bg-white focus:outline-none focus:border-slate-500 text-sm font-mono"
                  />
                </div>
              )}

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleProbarConexion}
                  disabled={probandoConexion || !config.apiKey}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2 px-4 rounded text-xs uppercase tracking-wider border border-slate-300 transition-colors disabled:opacity-50"
                >
                  {probandoConexion ? 'Verificando con SII...' : '🧪 Probar Conexión con Proveedor'}
                </button>
              </div>
            </div>
          </div>

          {/* REGLAS TRIBUTARIAS POR MEDIO DE PAGO */}
          <div className="bg-white rounded p-6 shadow-sm border border-slate-200">
            <h2 className="text-base font-semibold text-slate-900 uppercase tracking-wide mb-1">
              3. Reglas de Emisión Automática
            </h2>
            <p className="text-slate-500 text-xs mb-4 border-b border-slate-100 pb-2">
              Elige cuándo tu POS emitirá una boleta electrónica válida ante el SII.
            </p>

            <div className="space-y-4 text-sm">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.emitirBoletaEfectivo}
                  onChange={(e) => setConfig({ ...config, emitirBoletaEfectivo: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                />
                <div>
                  <span className="font-medium text-slate-800">Ventas en Efectivo</span>
                  <p className="text-xs text-slate-500">Emitir DTE inmediatamente al cobrar en efectivo.</p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.emitirBoletaTransferencia}
                  onChange={(e) => setConfig({ ...config, emitirBoletaTransferencia: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                />
                <div>
                  <span className="font-medium text-slate-800">Ventas por Transferencia Bancaria</span>
                  <p className="text-xs text-slate-500">Emitir DTE para compras abonadas por transferencia o QR.</p>
                </div>
              </label>

              <div className="bg-amber-50 border border-amber-200 p-4 rounded-md">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.emitirBoletaTarjeta}
                    onChange={(e) => setConfig({ ...config, emitirBoletaTarjeta: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500 mt-0.5"
                  />
                  <div>
                    <span className="font-semibold text-amber-900">Ventas con Tarjeta (Transbank / Getnet / Redelcom)</span>
                    <p className="text-xs text-amber-800 mt-0.5">
                      <strong>¡Atención!:</strong> Si tu máquina de pago está configurada para que <em>el voucher valga como boleta</em>, mantén esta casilla <strong>DESACTIVADA</strong> para evitar duplicar el cobro del IVA ante el SII.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* BOTÓN GUARDAR */}
          <div className="flex justify-end gap-3">
            <button
              type="submit"
              disabled={guardando}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 px-8 rounded shadow-sm transition-colors text-xs uppercase tracking-wider disabled:opacity-50"
            >
              {guardando ? 'Guardando...' : 'Guardar Configuración DTE'}
            </button>
          </div>

        </form>

        {/* BANNER DE SOPORTE / HABILITACIÓN ASISTIDA */}
        <div className="bg-slate-900 text-white p-6 rounded shadow-md border border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h3 className="font-semibold text-base">¿Necesitas ayuda para obtener tu Certificado Digital y CAF?</h3>
            <p className="text-xs text-slate-400 mt-1">
              Si no sabes cómo registrarte en un proveedor DTE o subir tus folios del SII, solicita nuestro servicio de habilitación asistida.
            </p>
          </div>
          <a
            href="https://wa.me/56900000000?text=Hola,%20necesito%20ayuda%20para%20habilitar%20las%20boletas%20electronicas%20en%20mi%20POS"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-2.5 px-5 rounded text-xs uppercase tracking-wider shrink-0 transition-colors"
          >
            Contactar Soporte Técnico
          </a>
        </div>

      </div>
    </div>
  );
};