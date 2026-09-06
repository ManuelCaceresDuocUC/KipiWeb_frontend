import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../../helpers/apiFetch';
import type { ClienteInfo } from '../../../types/ventas.types';

const formatearRutBusqueda = (termino: string) => {
  if (/[^0-9kK.\-\s]/i.test(termino)) {
    return termino;
  }

  const valorLimpio = termino.replace(/[^0-9kK]/g, '').toUpperCase();
  if (!valorLimpio) return '';

  if (valorLimpio.length >= 8 || valorLimpio.includes('K')) {
    const cuerpo = valorLimpio.slice(0, -1);
    const dv = valorLimpio.slice(-1);
    const cuerpoFormateado = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${cuerpoFormateado}-${dv}`;
  }

  return valorLimpio;
};

interface Props {
  show: boolean;
  onClose: () => void;
  empresaId: number;
  terminoBusquedaCliente: string;
  setTerminoBusquedaCliente: (val: string) => void;
  cargandoConsultaCliente: boolean;
  handleBuscarClienteConsulta: (e: React.FormEvent) => void;
  clienteConsultado: ClienteInfo | null;
  setClienteConsultado: (cliente: ClienteInfo | null) => void;
  montoAbono: string;
  setMontoAbono: (val: string) => void;
  metodoPagoAbono: 'EFECTIVO' | 'TARJETA';
  setMetodoPagoAbono: (val: 'EFECTIVO' | 'TARJETA') => void;
  handleAbonarDeuda: (e: React.FormEvent) => void;
}

export const ModalConsultaCliente = ({ 
  show, 
  onClose, 
  empresaId,
  terminoBusquedaCliente, 
  setTerminoBusquedaCliente, 
  cargandoConsultaCliente, 
  handleBuscarClienteConsulta, 
  clienteConsultado, 
  setClienteConsultado, 
  montoAbono, 
  setMontoAbono, 
  metodoPagoAbono,
  setMetodoPagoAbono,
  handleAbonarDeuda 
}: Props) => {
  const [sugerencias, setSugerencias] = useState<ClienteInfo[]>([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);

  useEffect(() => {
    const termino = terminoBusquedaCliente.trim();
    
    if (termino.length < 2 || !empresaId) return;

    let active = true;
    const timer = setTimeout(async () => {
      try {
        const url = `${import.meta.env.VITE_API_URL}/clientes/buscar?termino=${encodeURIComponent(termino)}&empresaId=${empresaId}`;
        const res = await apiFetch(url);
        if (res.ok && active) {
          const data = await res.json();
          const listaResultados = Array.isArray(data) ? data : [data];
          setSugerencias(listaResultados);
          setMostrarSugerencias(true);
        } else if (active) {
          setSugerencias([]);
          setMostrarSugerencias(false);
        }
      } catch {
        if (active) {
          setSugerencias([]);
          setMostrarSugerencias(false);
        }
      }
    }, 300);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [terminoBusquedaCliente, empresaId]);

  if (!show) return null;

  const seleccionarCliente = (cliente: ClienteInfo) => {
    setClienteConsultado(cliente);
    setTerminoBusquedaCliente(cliente.rut);
    setSugerencias([]);
    setMostrarSugerencias(false);
  };

  const handleCerrarModal = () => {
    onClose();
    setClienteConsultado(null);
    setTerminoBusquedaCliente('');
    setSugerencias([]);
    setMostrarSugerencias(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className='w-full max-w-lg bg-white p-6 rounded shadow-lg border border-slate-200 text-sm'>
        <h2 className="text-lg font-semibold mb-4 text-slate-900 border-b border-slate-100 pb-2 flex justify-between items-center">
          <span>Consultar y Abonar Cliente</span>
          <button onClick={handleCerrarModal} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
        </h2>

        <div className="relative mb-6">
          <form 
            onSubmit={(e) => {
              setMostrarSugerencias(false);
              handleBuscarClienteConsulta(e);
            }} 
            className="flex gap-2"
          >
            <input 
              type="text" 
              placeholder="Ingrese Nombre, RUT o ID de cliente..."
              className="flex-1 p-2.5 rounded border border-slate-300 outline-none focus:border-slate-500 font-mono text-sm"
              value={terminoBusquedaCliente} 
              onChange={(e) => {
                const valorFormateado = formatearRutBusqueda(e.target.value);
                setTerminoBusquedaCliente(valorFormateado);
                
                if (valorFormateado.trim().length < 2) {
                  setSugerencias([]);
                  setMostrarSugerencias(false);
                }
              }}
              onFocus={() => {
                if (sugerencias.length > 0) setMostrarSugerencias(true);
              }}
            />
            <button type="submit" disabled={cargandoConsultaCliente} className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2.5 rounded font-medium text-xs uppercase tracking-wider">
              {cargandoConsultaCliente ? 'Buscando...' : 'Buscar'}
            </button>
          </form>

          {mostrarSugerencias && sugerencias.length > 0 && (
            <ul className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-52 overflow-y-auto z-20 divide-y divide-slate-100">
              {sugerencias.map((cliente) => (
                <li 
                  key={cliente.id}
                  onClick={() => seleccionarCliente(cliente)}
                  className="p-3 hover:bg-slate-50 cursor-pointer flex justify-between items-center transition-colors"
                >
                  <div>
                    <p className="font-semibold text-slate-900">{cliente.nombre}</p>
                    <p className="text-xs text-slate-500 font-mono">RUT: {cliente.rut}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono block">
                      ID: {cliente.id}
                    </span>
                    {cliente.deudaActual > 0 && (
                      <span className="text-[10px] text-red-600 font-semibold block mt-0.5">
                        Deuda: ${cliente.deudaActual.toLocaleString()}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {clienteConsultado && (
          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded border border-slate-200">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{clienteConsultado.nombre}</h3>
                  <p className="text-xs text-slate-500 font-mono">RUT: {clienteConsultado.rut} | ID: {clienteConsultado.id}</p>
                </div>
                <span className="text-xs bg-slate-200 text-slate-700 px-2 py-1 rounded font-semibold">Cliente Registrado</span>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-200 text-center font-mono">
                <div className="bg-white p-2 rounded border border-slate-200">
                  <span className="block text-[10px] font-sans font-semibold uppercase text-slate-500">Límite</span>
                  <span className="font-bold text-slate-800">${clienteConsultado.limiteCredito.toLocaleString()}</span>
                </div>
                <div className="bg-red-50 p-2 rounded border border-red-200">
                  <span className="block text-[10px] font-sans font-semibold uppercase text-red-600">Deuda Actual</span>
                  <span className="font-bold text-red-700">${clienteConsultado.deudaActual.toLocaleString()}</span>
                </div>
                <div className="bg-emerald-50 p-2 rounded border border-emerald-200">
                  <span className="block text-[10px] font-sans font-semibold uppercase text-emerald-600">Disponible</span>
                  <span className="font-bold text-emerald-700">${(clienteConsultado.limiteCredito - clienteConsultado.deudaActual).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {clienteConsultado.deudaActual > 0 ? (
              <form onSubmit={handleAbonarDeuda} className="space-y-3 bg-white p-4 rounded border border-slate-200 shadow-sm">
                <h4 className="font-semibold text-slate-800 text-xs uppercase tracking-wide">Registrar Abono</h4>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Monto a Abonar ($)</label>
                    <input 
                      type="number" required min="1" max={clienteConsultado.deudaActual} placeholder="Monto..."
                      className="w-full p-2.5 rounded border border-slate-300 focus:border-slate-500 font-mono outline-none text-base"
                      value={montoAbono} onChange={(e) => setMontoAbono(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Método de Pago</label>
                    <select
                      className="w-full p-2.5 rounded border border-slate-300 focus:border-slate-500 text-sm font-medium bg-white outline-none"
                      value={metodoPagoAbono}
                      onChange={(e) => setMetodoPagoAbono(e.target.value as 'EFECTIVO' | 'TARJETA')}
                    >
                      <option value="EFECTIVO">EFECTIVO</option>
                      <option value="TARJETA">TARJETA</option>
                    </select>
                  </div>
                </div>

                <button type="submit" className="w-full bg-slate-800 hover:bg-slate-900 text-white font-medium py-2.5 rounded text-xs uppercase tracking-wider transition-colors">
                  Procesar Abono y Entregar Comprobante
                </button>
              </form>
            ) : (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-center rounded text-xs font-semibold">
                El cliente se encuentra al día y no presenta deudas pendientes.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};