import React from 'react';

export const PantallaCargando = () => (
  <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-sans">
    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-slate-800 mb-4"></div>
    <p className="text-slate-600 font-medium text-sm tracking-wide uppercase">Verificando estado de terminal...</p>
  </div>
);

interface PantallaAperturaProps {
  montoApertura: string;
  setMontoApertura: (monto: string) => void;
  handleAbrirCaja: (e: React.FormEvent) => void;
}

export const PantallaApertura = ({ montoApertura, setMontoApertura, handleAbrirCaja }: PantallaAperturaProps) => (
  <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans text-slate-800">
    <div className="bg-white p-8 rounded shadow-sm max-w-md w-full border border-slate-200">
      <div className="text-center mb-6 border-b border-slate-100 pb-4">
        <h2 className="text-xl font-semibold text-slate-900">Apertura Operativa de Caja</h2>
        <p className="text-slate-500 text-xs mt-1">Ingrese el fondo inicial en efectivo para habilitar el terminal.</p>
      </div>
      
      <form onSubmit={handleAbrirCaja} className="space-y-4 text-sm">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Fondo Inicial</label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">$</span>
            <input 
              type="number" required min="0" placeholder="0.00"
              className="w-full pl-8 p-2.5 rounded border border-slate-300 focus:border-slate-500 outline-none text-base font-mono text-slate-800"
              value={montoApertura}
              onChange={(e) => setMontoApertura(e.target.value)}
            />
          </div>
        </div>
        <button type="submit" className="w-full bg-slate-800 hover:bg-slate-900 text-white font-medium py-3 rounded shadow-sm transition-colors text-sm uppercase tracking-wider mt-2">
          Habilitar Terminal
        </button>
      </form>
    </div>
  </div>
);