import React from 'react';
import type { ResumenCaja } from '../../../types/ventas.types'; 

interface Props {
  show: boolean;
  onClose?: () => void;
  faseCierre: 'declaracion' | 'resultado';
  datosCierreCalculados: ResumenCaja | null;
  efectivoFisicoDeclarado: string;
  setEfectivoFisicoDeclarado: (val: string) => void;
  handleProcesarDeclaracion: (e: React.FormEvent) => void;
  handleConfirmarCierreFinal: () => void;
}

export const ModalCierre = ({ 
  show, faseCierre, datosCierreCalculados, efectivoFisicoDeclarado, 
  setEfectivoFisicoDeclarado, handleProcesarDeclaracion, handleConfirmarCierreFinal 
}: Props) => {
  if (!show || !datosCierreCalculados) return null;

  const totalEsperado = datosCierreCalculados.totalEnCaja;
  const fisicoDeclarado = Number(efectivoFisicoDeclarado) || 0;
  const diferencia = fisicoDeclarado - totalEsperado;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white p-6 rounded shadow-lg border border-slate-200 text-sm">
        
        {faseCierre === 'declaracion' && (
          <>
            <div className="text-center mb-6 border-b border-slate-100 pb-4">
              <h2 className="text-lg font-semibold text-slate-900">Cuadratura Operativa de Cierre</h2>
              <p className="text-slate-500 mt-1 text-xs">Realice el conteo físico del dinero en caja antes de visualizar los montos calculados por el sistema.</p>
            </div>
            <form onSubmit={handleProcesarDeclaracion} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5 text-center">Monto Físico Total en Efectivo</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">$</span>
                  <input 
                    type="number" required min="0" autoFocus placeholder="0.00"
                    className="w-full pl-8 p-2.5 rounded border border-slate-300 focus:border-slate-500 outline-none text-base font-mono text-center font-semibold text-slate-800"
                    value={efectivoFisicoDeclarado} onChange={(e) => setEfectivoFisicoDeclarado(e.target.value)}
                  />
                </div>
              </div>
              <button type="submit" className="w-full bg-slate-800 hover:bg-slate-900 text-white font-medium py-2.5 rounded shadow-sm transition-colors text-sm uppercase tracking-wider mt-2">
                Procesar Cuadratura
              </button>
            </form>
          </>
        )}

        {faseCierre === 'resultado' && (
          <>
            <h2 className="text-lg font-semibold mb-4 text-slate-900 border-b border-slate-100 pb-2 text-center">Resultado de Cuadratura</h2>
            <div className="space-y-3 font-mono">
               <div className="flex justify-between text-slate-600"><span className="font-sans">Fondo Inicial:</span><span>${datosCierreCalculados.fondoInicial.toLocaleString()}</span></div>
               <div className="flex justify-between text-slate-600"><span className="font-sans">Ventas Efectivo:</span><span>+ ${datosCierreCalculados.ventasEfectivo.toLocaleString()}</span></div>
               <div className="flex justify-between text-slate-600"><span className="font-sans">Abonos a Deuda:</span><span>+ ${(datosCierreCalculados.abonosCredito || 0).toLocaleString()}</span></div>
               <div className="flex justify-between text-slate-600"><span className="font-sans">Ingresos Extra:</span><span>+ ${datosCierreCalculados.ingresosExtra.toLocaleString()}</span></div>
               <div className="flex justify-between text-slate-600"><span className="font-sans">Retiros:</span><span>- ${datosCierreCalculados.retiros.toLocaleString()}</span></div>
               <div className="border-t border-slate-200 my-2 pt-2 flex justify-between font-bold text-slate-800"><span className="font-sans uppercase">Total Sistema (Esperado):</span><span>${totalEsperado.toLocaleString()}</span></div>
               <div className="flex justify-between font-bold text-blue-700"><span className="font-sans uppercase">Total Físico (Declarado):</span><span>${fisicoDeclarado.toLocaleString()}</span></div>
               <div className={`flex justify-between font-bold p-3 rounded mt-4 ${diferencia === 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : diferencia > 0 ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                 <span className="font-sans uppercase">{diferencia === 0 ? 'Caja Cuadrada' : diferencia > 0 ? 'Sobrante detectado' : 'Faltante detectado'}</span>
                 <span>${Math.abs(diferencia).toLocaleString()}</span>
               </div>
            </div>
            <button onClick={handleConfirmarCierreFinal} className="w-full bg-slate-800 hover:bg-slate-900 text-white font-medium py-2.5 rounded shadow-sm mt-6 transition-colors text-sm uppercase tracking-wider">
              Confirmar y Cerrar Turno
            </button>
          </>
        )}
      </div>
    </div>
  );
};