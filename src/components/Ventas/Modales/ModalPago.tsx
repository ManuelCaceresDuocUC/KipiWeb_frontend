import { useState, useEffect } from 'react';
import { apiFetch } from '../../../helpers/apiFetch';
import { copiasTicket } from '../../../helpers/impresion';
import type { ClienteInfo, ComprobanteVenta, LineaPago, MetodoPago } from '../../../types/ventas.types';

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
  pagos: LineaPago[];
  setPagos: (pagos: LineaPago[]) => void;
  permiteFiado: boolean;
  clienteId: number | null;
  setClienteId: (id: number | null) => void;
  pagaCon: number;
  setPagaCon: (monto: number) => void;
  onAbrirNuevoCliente: () => void;
  confirmarVentaFinal: () => void;
  comprobante: ComprobanteVenta;
  setComprobante: (c: ComprobanteVenta) => void;
  correoComprobante: string;
  setCorreoComprobante: (c: string) => void;
}

const ETIQUETA: Record<MetodoPago, string> = {
  EFECTIVO: 'Efectivo',
  TARJETA: 'Tarjeta',
  TRANSFERENCIA: 'Transferencia',
  CREDITO: 'Crédito / Vale',
};

export const ModalPago = ({
  show, onClose, empresaId, totalBruto, pagos, setPagos, permiteFiado,
  clienteId, setClienteId, pagaCon, setPagaCon, onAbrirNuevoCliente, confirmarVentaFinal,
  comprobante, setComprobante, correoComprobante, setCorreoComprobante
}: Props) => {

  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [sugerencias, setSugerencias] = useState<ClienteInfo[]>([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<ClienteInfo | null>(null);
  // Por defecto se paga con UN solo método; combinar dos es una opción aparte
  const [mixto, setMixto] = useState(false);

  useEffect(() => {
    if (!show) setMixto(false);
  }, [show]);

  const resetearEstadoCliente = () => {
    setTerminoBusqueda('');
    setSugerencias([]);
    setMostrarSugerencias(false);
    setClienteSeleccionado(null);
  };

  const total = Math.round(totalBruto);
  const suma = pagos.reduce((acc, l) => acc + (l.monto || 0), 0);
  const restante = total - suma;
  const lineaDe = (m: MetodoPago) => pagos.find(l => l.metodo === m);
  const lineaCredito = lineaDe('CREDITO');
  const lineaEfectivo = lineaDe('EFECTIVO');
  const cupo = clienteSeleccionado ? clienteSeleccionado.limiteCredito - clienteSeleccionado.deudaActual : 0;

  const hayCredito = Boolean(lineaCredito);
  useEffect(() => {
    const termino = terminoBusqueda.trim();

    // Solo se busca cuando hay una línea de crédito, el término es útil y no es el cliente ya elegido
    if (!hayCredito || termino.length < 2 || !empresaId || (clienteSeleccionado && termino === clienteSeleccionado.rut)) {
      return;
    }

    let active = true;
    const timer = setTimeout(async () => {
      try {
        const url = `${import.meta.env.VITE_API_URL}/clientes/buscar?termino=${encodeURIComponent(termino)}`;
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
  }, [terminoBusqueda, empresaId, clienteSeleccionado, hayCredito]);

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

  // ---- manejo de las líneas de pago ----
  // Pago con un solo método: reemplaza lo anterior por el total completo
  const elegirUnico = (metodo: MetodoPago) => {
    setPagos([{ metodo, monto: total }]);
    if (metodo !== 'EFECTIVO') setPagaCon(0);
    if (metodo !== 'CREDITO') {
      setClienteId(null);
      resetearEstadoCliente();
    }
  };

  const activarMixto = () => {
    setMixto(true);
  };

  const volverAUnico = () => {
    setMixto(false);
    elegirUnico(pagos[0]?.metodo ?? 'EFECTIVO');
  };

  const agregarMetodo = (metodo: MetodoPago) => {
    if (lineaDe(metodo) || pagos.length >= 2) return; // máximo dos métodos
    setPagos([...pagos, { metodo, monto: Math.max(restante, 0) }]);
  };

  const quitarMetodo = (metodo: MetodoPago) => {
    const quedan = pagos.filter(l => l.metodo !== metodo);
    // Si era la única forma de pago, vuelve a quedar "todo en efectivo" para no dejar la venta sin pago
    setPagos(quedan.length > 0 ? quedan : [{ metodo: 'EFECTIVO', monto: total }]);
    if (metodo === 'CREDITO') {
      setClienteId(null);
      resetearEstadoCliente();
    }
    if (metodo === 'EFECTIVO') setPagaCon(0);
  };

  const cambiarLinea = (metodo: MetodoPago, cambios: Partial<LineaPago>) => {
    // Con dos métodos, al escribir un monto el otro se ajusta solo para sumar el total
    if (mixto && pagos.length === 2 && cambios.monto !== undefined) {
      const monto = Math.min(cambios.monto, total);
      setPagos(pagos.map(l => (l.metodo === metodo ? { ...l, ...cambios, monto } : { ...l, monto: total - monto })));
      return;
    }
    setPagos(pagos.map(l => (l.metodo === metodo ? { ...l, ...cambios } : l)));
  };

  const metodosDisponibles: MetodoPago[] = ['EFECTIVO', 'TARJETA', 'TRANSFERENCIA', ...(permiteFiado ? ['CREDITO' as MetodoPago] : [])];

  const efectivoRecibidoInsuficiente = Boolean(lineaEfectivo) && pagaCon > 0 && pagaCon < (lineaEfectivo?.monto ?? 0);
  const creditoInvalido = Boolean(lineaCredito) && (!clienteId || !clienteSeleccionado || (lineaCredito?.monto ?? 0) > cupo);
  const correoInvalido = comprobante === 'CORREO' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(correoComprobante.trim());
  const transferenciaInvalida = Boolean(lineaDe('TRANSFERENCIA')) && !lineaDe('TRANSFERENCIA')?.confirmado;
  const puedeConfirmar =
    pagos.length > 0 &&
    suma === total &&
    pagos.every(l => l.monto > 0) &&
    !efectivoRecibidoInsuficiente &&
    !creditoInvalido &&
    !correoInvalido &&
    !transferenciaInvalida;

  const claseMetodo = (activo: boolean) =>
    `py-2 rounded border font-medium text-xs uppercase tracking-wider transition-all ${activo ? 'border-slate-800 bg-slate-800 text-white shadow-sm' : 'border-slate-300 text-slate-600 hover:bg-slate-50'}`;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className='w-full max-w-lg bg-white p-6 rounded shadow-lg border border-slate-200 text-sm max-h-[95vh] overflow-y-auto'>
        <h2 className='text-lg font-semibold mb-4 text-slate-900 border-b border-slate-100 pb-2 text-center'>Procesamiento de Pago</h2>

        <div className="text-center mb-4 bg-slate-50 p-4 rounded border border-slate-200">
          <span className="block text-slate-500 text-xs uppercase tracking-wider mb-1 font-semibold">Monto Total de Orden</span>
          <span className="text-3xl font-mono font-bold text-slate-900">${total.toLocaleString('es-CL')}</span>
        </div>

        <p className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">{mixto ? 'Formas de pago (elige las dos que usará)' : 'Forma de pago'}</p>
        <div className={`grid gap-2 mb-4 ${metodosDisponibles.length === 4 ? 'grid-cols-4' : 'grid-cols-3'}`}>
          {metodosDisponibles.map(m => (
            <button key={m} type="button" onClick={() => (mixto ? (lineaDe(m) ? quitarMetodo(m) : agregarMetodo(m)) : elegirUnico(m))} className={claseMetodo(Boolean(lineaDe(m)))}>
              {ETIQUETA[m]}
            </button>
          ))}
        </div>
        <div className="mb-4 -mt-2 text-right">
          {mixto ? (
            <button type="button" onClick={volverAUnico} className="text-xs font-semibold text-slate-600 underline">Volver a un solo método</button>
          ) : (
            <button type="button" onClick={activarMixto} className="text-xs font-semibold text-slate-600 underline">Dividir el pago en dos métodos</button>
          )}
        </div>

        <div className="space-y-3 mb-4">
          {pagos.map(l => (
            <div key={l.metodo} className="border border-slate-200 rounded p-3 bg-white">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-700 w-28">{ETIQUETA[l.metodo]}</span>
                <input
                  type="number" min="1" step="1"
                  className="flex-1 p-2 rounded border border-slate-300 focus:border-slate-500 outline-none font-mono"
                  value={l.monto || ''}
                  readOnly={!mixto}
                  onChange={(e) => cambiarLinea(l.metodo, { monto: Math.max(0, Math.round(Number(e.target.value))) })}
                />
                {mixto && pagos.length > 1 && (
                  <button type="button" onClick={() => quitarMetodo(l.metodo)} className="text-slate-400 hover:text-red-600 font-bold px-1" title="Quitar">✕</button>
                )}
              </div>

              {l.metodo === 'EFECTIVO' && (
                <div className="mt-2">
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Monto recibido (opcional, para calcular el cambio)</label>
                  <input
                    type="number" placeholder="0"
                    className="w-full p-2 rounded border border-slate-300 focus:border-slate-500 outline-none font-mono"
                    value={pagaCon || ''} onChange={(e) => setPagaCon(Number(e.target.value))}
                  />
                  {pagaCon >= l.monto && l.monto > 0 && (
                    <div className="mt-2 p-2 bg-slate-100 rounded border border-slate-200 flex justify-between items-center">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">Cambio:</span>
                      <span className="text-lg font-mono font-bold text-slate-900">${(pagaCon - l.monto).toLocaleString('es-CL')}</span>
                    </div>
                  )}
                  {efectivoRecibidoInsuficiente && (
                    <p className="mt-1 text-xs text-red-600">El monto recibido es menor al efectivo a cobrar.</p>
                  )}
                </div>
              )}

              {l.metodo === 'TRANSFERENCIA' && (
                <div className="mt-2 space-y-2">
                  <input
                    type="text" maxLength={100} placeholder="N° de operación o referencia (opcional)"
                    className="w-full p-2 rounded border border-slate-300 focus:border-slate-500 outline-none text-sm"
                    value={l.referencia || ''} onChange={(e) => cambiarLinea('TRANSFERENCIA', { referencia: e.target.value })}
                  />
                  <label className="flex items-start gap-2 text-xs text-slate-700 cursor-pointer">
                    <input type="checkbox" className="mt-0.5" checked={Boolean(l.confirmado)}
                      onChange={(e) => cambiarLinea('TRANSFERENCIA', { confirmado: e.target.checked })} />
                    <span>Confirmo que revisé mi cuenta y la transferencia por <b>${l.monto.toLocaleString('es-CL')}</b> ya llegó.</span>
                  </label>
                </div>
              )}

              {l.metodo === 'CREDITO' && (
                <div className="mt-2">
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">RUT / Nombre Cliente</label>
                    <button type="button" onClick={onAbrirNuevoCliente} className="text-xs font-semibold text-slate-800 hover:text-black underline">+ Crear Nuevo Cliente</button>
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Ingrese RUT, Nombre o ID..."
                      className="w-full p-2 rounded border border-slate-300 focus:border-slate-500 outline-none text-sm font-mono text-slate-800"
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
                                Cupo: ${(cliente.limiteCredito - cliente.deudaActual).toLocaleString('es-CL')}
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
                        <span className={`text-xs font-bold font-mono ${l.monto > cupo ? 'text-red-600' : 'text-emerald-700'}`}>${cupo.toLocaleString('es-CL')}</span>
                      </div>
                    </div>
                  )}
                  {clienteSeleccionado && l.monto > cupo && (
                    <p className="mt-1 text-xs text-red-600">El monto a crédito supera el cupo del cliente. Reduce el crédito y paga el resto con otro medio.</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        <p className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">Comprobante para el cliente</p>
        <div className="grid grid-cols-3 gap-2 mb-2">
          {([['IMPRIMIR', 'Imprimir'], ['CORREO', 'Por correo'], ['NINGUNO', 'Sin comprobante']] as [ComprobanteVenta, string][]).map(([valor, texto]) => (
            <button key={valor} type="button"
              onClick={() => {
                setComprobante(valor);
                if (valor === 'CORREO' && !correoComprobante && clienteSeleccionado?.email) setCorreoComprobante(clienteSeleccionado.email);
              }}
              className={claseMetodo(comprobante === valor)}>
              {texto}
            </button>
          ))}
        </div>
        {comprobante === 'CORREO' && (
          <div className="mb-3">
            {copiasTicket() === 2 && <p className="mb-1.5 text-xs text-slate-500">Se imprime solo la copia del local; al cliente le llega el correo.</p>}
            <input
              type="email" inputMode="email" autoComplete="off" placeholder="correo@cliente.cl"
              className="w-full p-2 rounded border border-slate-300 focus:border-slate-500 outline-none text-sm"
              value={correoComprobante} onChange={(e) => setCorreoComprobante(e.target.value)}
            />
            {correoInvalido && correoComprobante.length > 0 && <p className="mt-1 text-xs text-red-600">Escribe un correo válido.</p>}
          </div>
        )}
        {comprobante === 'NINGUNO' && (
          <p className="mb-3 text-xs text-slate-500">La venta queda registrada y la boleta (si corresponde) se emite igual; el cliente no recibe comprobante.{copiasTicket() === 2 ? ' Se imprime solo la copia del local.' : ''}</p>
        )}
        {hayCredito && comprobante !== 'IMPRIMIR' && (
          <p className="mb-3 text-xs text-amber-700">El vale de crédito para firmar se imprime siempre.</p>
        )}

        <div className={`flex justify-between items-center mb-4 p-3 rounded border text-sm ${restante === 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
          <span className="font-semibold uppercase tracking-wider text-xs">
            {restante === 0 ? 'Pago completo' : restante > 0 ? 'Falta por cubrir' : 'Excede el total en'}
          </span>
          <span className="font-mono font-bold">${Math.abs(restante).toLocaleString('es-CL')}</span>
        </div>

        <button
          onClick={confirmarVentaFinal}
          disabled={!puedeConfirmar}
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
