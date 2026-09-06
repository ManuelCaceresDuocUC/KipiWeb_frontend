import type { ResumenCaja } from '../../../types/ventas.types'; // Ajusta la ruta a tus types

interface Props {
  show: boolean;
  onClose: () => void;
  cargandoResumen: boolean;
  datosResumen: ResumenCaja | null;
}

export const ModalResumen = ({ show, onClose, cargandoResumen, datosResumen }: Props) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className='w-full max-w-md bg-white p-6 rounded shadow-lg border border-slate-200 text-sm'>
        <h2 className='text-lg font-semibold mb-4 text-slate-900 border-b border-slate-100 pb-2'>Resumen Financiero del Turno</h2>
        
        {cargandoResumen ? (
          <div className="py-8 text-center text-slate-500 font-mono text-xs uppercase tracking-wider">Cargando datos contables...</div>
        ) : datosResumen ? (
          <div className="space-y-2 font-mono text-xs text-slate-600">
            
            <h3 className="font-sans font-semibold text-slate-700 mb-2 mt-1 uppercase tracking-wider text-[11px]">Movimientos de Efectivo</h3>
            
            <div className="flex justify-between border-b border-slate-100 pb-1.5">
              <span className="font-sans">Fondo Inicial:</span>
              <span className="font-semibold text-slate-800">${(datosResumen.fondoInicial || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-1.5">
              <span className="font-sans">Ventas en Efectivo:</span>
              <span className="font-semibold text-slate-800">+ ${(datosResumen.ventasEfectivo || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-1.5">
              <span className="font-sans">Ingresos Extra:</span>
              <span className="font-semibold text-slate-800">+ ${(datosResumen.ingresosExtra || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-1.5">
              <span className="font-sans">Abonos Crédito (Efectivo):</span>
              <span className="font-semibold text-slate-800">+ ${(datosResumen.abonosCredito || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-1.5">
              <span className="font-sans">Retiros Operativos:</span>
              <span className="font-semibold text-red-700">- ${(datosResumen.retiros || 0).toLocaleString()}</span>
            </div>
            
            <div className="flex justify-between border-t border-slate-300 pt-2.5 mt-2 mb-4 text-sm">
              <span className="font-sans font-bold text-slate-900">Total Físico en Caja:</span>
              <span className="font-bold text-slate-900">${(datosResumen.totalEnCaja || 0).toLocaleString()}</span>
            </div>

            <h3 className="font-sans font-semibold text-slate-700 mb-2 mt-4 uppercase tracking-wider text-[11px]">Otros Medios y Totales</h3>
            
            <div className="flex justify-between border-b border-slate-100 pb-1.5">
              <span className="font-sans">Transacciones con Tarjeta:</span>
              <span className="font-semibold text-slate-800">+ ${(datosResumen.ventasTarjeta || 0).toLocaleString()}</span>
            </div>

            <div className="flex justify-between border-b border-slate-100 pb-1.5 mt-1">
              <span className="font-sans">Ventas a Crédito (Vales Emitidos):</span>
              <span className="font-semibold text-slate-800">+ ${(datosResumen.ventasCredito || 0).toLocaleString()}</span>
            </div>

            <div className="flex justify-between bg-slate-100 p-3 rounded border border-slate-200 mt-4 text-sm">
              <span className="font-sans font-bold text-slate-900 uppercase tracking-wide">
                Venta Total Acumulada
              </span>
              <span className="font-bold text-slate-900">
                ${((datosResumen.ventasEfectivo || 0) + (datosResumen.ventasTarjeta || 0) + (datosResumen.ventasCredito || 0)).toLocaleString()}
              </span>
            </div>

          </div>
        ) : null}
        
        <button 
          onClick={onClose} 
          className="w-full bg-slate-800 hover:bg-slate-900 text-white font-medium py-2.5 rounded shadow-sm mt-6 transition-colors text-sm uppercase tracking-wider"
        >
          Cerrar Ventana
        </button>
      </div>
    </div>
  );
};