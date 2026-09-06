import { useState, useEffect } from 'react';
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
  totalBruto: number;
  metodoPago: "EFECTIVO" | "TARJETA" | "CREDITO" | "";
  setMetodoPago: (metodo: "EFECTIVO" | "TARJETA" | "CREDITO" | "") => void;
  proveedorTarjeta: "GETNET" | "MERCADOPAGO" | "TRANSBANK" | null;
  setProveedorTarjeta: (proveedor: "GETNET" | "MERCADOPAGO" | "TRANSBANK" | null) => void;
  clienteId: number | null;
  setClienteId: (id: number | null) => void;
  pagaCon: number;
  setPagaCon: (monto: number) => void;
  onAbrirNuevoCliente: () => void;
  confirmarVentaFinal: () => void;
}

export const ModalPago = ({
  show, onClose, empresaId, totalBruto, metodoPago, setMetodoPago, proveedorTarjeta, setProveedorTarjeta,
  clienteId, setClienteId, pagaCon, setPagaCon, onAbrirNuevoCliente, confirmarVentaFinal
}: Props) => {
  
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [sugerencias, setSugerencias] = useState<ClienteInfo[]>([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<ClienteInfo | null>(null);

  const resetearEstadoCliente = () => {
    setTerminoBusqueda('');
    setSugerencias([]);
    setMostrarSugerencias(false);
    setClienteSeleccionado(null);
  };

  useEffect(() => {
    const termino = terminoBusqueda.trim();
    
    // Si ya seleccionó un cliente o el término es muy corto, no buscamos en API
    if (termino.length < 2 || !empresaId || (clienteSeleccionado && termino === clienteSeleccionado.rut)) {
      return;
    }

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
  }, [terminoBusqueda, empresaId, clienteSeleccionado]);

  if (!show) return null;

  const seleccionarCliente = (cliente: ClienteInfo) => {
    setClienteSeleccionado(cliente);
    setClienteId(cliente.id);
    setTerminoBusqueda(cliente.rut); // Conserva el RUT escrito en el input
    setSugerencias([]);
    setMostrarSugerencias(false);
  };

  const handleClose = () => {
    resetearEstadoCliente();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className='w-full max-w-md bg-white p-6 rounded shadow-lg border border-slate-200 text-sm'>
        <h2 className='text-lg font-semibold mb-4 text-slate-900 border-b border-slate-100 pb-2 text-center'>Procesamiento de Pago</h2>
        
        <div className="text-center mb-6 bg-slate-50 p-4 rounded border border-slate-200">
          <span className="block text-slate-500 text-xs uppercase tracking-wider mb-1 font-semibold">Monto Total de Orden</span>
          <span className="text-3xl font-mono font-bold text-slate-900">${totalBruto.toLocaleString()}</span>
        </div>
        
        <div className="grid grid-cols-3 gap-2 mb-6">
          <button 
            onClick={() => { 
              setMetodoPago('EFECTIVO'); 
              setProveedorTarjeta(null); 
              setClienteId(null); 
              resetearEstadoCliente(); 
            }}
            className={`py-2.5 rounded border font-medium text-xs uppercase tracking-wider transition-all ${metodoPago === 'EFECTIVO' ? 'border-slate-800 bg-slate-800 text-white shadow-sm' : 'border-slate-300 text-slate-600 hover:bg-slate-50'}`}
          > Efectivo </button>
          
          <button 
            onClick={() => { 
              setMetodoPago('TARJETA'); 
              setClienteId(null); 
              resetearEstadoCliente(); 
            }}
            className={`py-2.5 rounded border font-medium text-xs uppercase tracking-wider transition-all ${metodoPago === 'TARJETA' ? 'border-slate-800 bg-slate-800 text-white shadow-sm' : 'border-slate-300 text-slate-600 hover:bg-slate-50'}`}
          > Tarjeta </button>
          
          <button 
            onClick={() => { 
              setMetodoPago('CREDITO'); 
              setProveedorTarjeta(null); 
            }}
            className={`py-2.5 rounded border font-medium text-xs uppercase tracking-wider transition-all ${metodoPago === 'CREDITO' ? 'border-slate-800 bg-slate-800 text-white shadow-sm' : 'border-slate-300 text-slate-600 hover:bg-slate-50'}`}
          > Crédito / Vale </button>
        </div>

        {metodoPago === 'TARJETA' && (
          <div className="mb-6">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">Seleccione Terminal de Pago:</label>
            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => setProveedorTarjeta('GETNET')} className={`py-2 rounded border text-xs font-medium transition-all ${proveedorTarjeta === 'GETNET' ? 'bg-slate-100 border-slate-500 text-slate-900 font-semibold' : 'border-slate-300 text-slate-600 hover:bg-slate-50'}`}>Getnet</button>
              <button onClick={() => setProveedorTarjeta('MERCADOPAGO')} className={`py-2 rounded border text-xs font-medium transition-all ${proveedorTarjeta === 'MERCADOPAGO' ? 'bg-slate-100 border-slate-500 text-slate-900 font-semibold' : 'border-slate-300 text-slate-600 hover:bg-slate-50'}`}>Mercado Pago</button>
              <button onClick={() => setProveedorTarjeta('TRANSBANK')} className={`py-2 rounded border text-xs font-medium transition-all ${proveedorTarjeta === 'TRANSBANK' ? 'bg-slate-100 border-slate-500 text-slate-900 font-semibold' : 'border-slate-300 text-slate-600 hover:bg-slate-50'}`}>Transbank</button>
            </div>
          </div>
        )}

        {metodoPago === 'CREDITO' && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">RUT / Nombre Cliente</label>
              <button type="button" onClick={onAbrirNuevoCliente} className="text-xs font-semibold text-slate-800 hover:text-black underline">+ Crear Nuevo Cliente</button>
            </div>
            
            <div className="relative">
              <input 
                type="text" 
                placeholder="Ingrese RUT, Nombre o ID..."
                className="w-full p-2.5 rounded border border-slate-300 focus:border-slate-500 outline-none text-sm font-mono text-slate-800"
                value={terminoBusqueda} 
                onChange={(e) => {
                  const valorFormateado = formatearRutBusqueda(e.target.value);
                  setTerminoBusqueda(valorFormateado);
                  
                  // Si modifica el texto tras seleccionar un cliente, desvincula la selección
                  if (clienteSeleccionado && valorFormateado !== clienteSeleccionado.rut) {
                    setClienteSeleccionado(null);
                    setClienteId(null);
                  }

                  if (valorFormateado.trim().length < 2) {
                    setSugerencias([]);
                    setMostrarSugerencias(false);
                  }
                }}
                onFocus={() => {
                  if (sugerencias.length > 0 && !clienteSeleccionado) setMostrarSugerencias(true);
                }}
              />
              
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
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono block mb-1">
                          ID: {cliente.id}
                        </span>
                        <span className="text-[10px] font-semibold text-emerald-600 block">
                          Cupo: ${(cliente.limiteCredito - cliente.deudaActual).toLocaleString()}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {clienteSeleccionado && (
              <div className="mt-2 bg-slate-50 p-2.5 rounded border border-slate-200 flex justify-between items-center">
                <div>
                  <p className="font-bold text-slate-900 text-xs">{clienteSeleccionado.nombre}</p>
                  <p className="text-[11px] text-slate-500 font-mono">ID: {clienteSeleccionado.id}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-semibold text-slate-500 block">Cupo Disponible</span>
                  <span className="text-xs font-bold font-mono text-emerald-700">${(clienteSeleccionado.limiteCredito - clienteSeleccionado.deudaActual).toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {metodoPago === 'EFECTIVO' && (
          <div className="mb-6">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Monto Recibido</label>
            <input 
              type="number" placeholder="0.00"
              className="w-full p-2.5 rounded border border-slate-300 focus:border-slate-500 outline-none text-base font-mono text-slate-800"
              value={pagaCon || ''} onChange={(e) => setPagaCon(Number(e.target.value))}
            />
            {pagaCon >= totalBruto && (
              <div className="mt-3 p-3 bg-slate-100 rounded border border-slate-200 text-center flex justify-between items-center">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">Cambio:</span>
                <span className="text-lg font-mono font-bold text-slate-900">${(pagaCon - totalBruto).toLocaleString()}</span>
              </div>
            )}
          </div>
        )}

        <button 
          onClick={confirmarVentaFinal}
          disabled={!metodoPago || (metodoPago === 'EFECTIVO' && pagaCon < totalBruto) || (metodoPago === 'CREDITO' && !clienteId) || (metodoPago === 'TARJETA' && !proveedorTarjeta)}
          className="w-full bg-slate-800 hover:bg-slate-900 disabled:bg-slate-200 disabled:text-slate-400 text-white font-medium py-2.5 rounded shadow-sm transition-colors text-sm uppercase tracking-wider mb-2"
        > Confirmar Transacción </button>
        
        <button 
          onClick={handleClose} 
          className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2 rounded transition-colors text-xs uppercase tracking-wider"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
};