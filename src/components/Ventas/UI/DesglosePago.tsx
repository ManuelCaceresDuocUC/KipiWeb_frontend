interface Props {
  neto: number;
  iva: number;
  totalBruto: number;
  carritoVacio: boolean;
  onProcesarCobro: () => void;
}

export const DesglosePago = ({ neto, iva, totalBruto, carritoVacio, onProcesarCobro }: Props) => {
  return (
    <div className="bg-white rounded shadow-sm border border-slate-200 p-6 flex flex-col justify-between h-fit text-sm">
      <div>
        <h2 className="text-sm font-semibold mb-4 border-b border-slate-200 pb-2 text-slate-700 uppercase tracking-wider">Desglose Operativo</h2>
        <div className="space-y-3 mb-6 font-mono">
          <div className="flex justify-between text-slate-600">
            <span className="font-sans font-medium text-slate-700">Neto</span>
            <span>${neto.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span className="font-sans font-medium text-slate-700">IVA (19%)</span>
            <span>${iva.toLocaleString()}</span>
          </div>
          <div className="border-t border-slate-200 pt-3 mt-3">
            <div className="flex justify-between items-center text-lg font-bold text-slate-900">
              <span className="font-sans uppercase tracking-wide">Total a Pagar</span>
              <span>${totalBruto.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
      <button 
        disabled={carritoVacio}
        onClick={onProcesarCobro}
        className="w-full bg-slate-800 hover:bg-slate-900 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-medium py-3 rounded shadow-sm transition-colors text-sm uppercase tracking-wider"
      >
        Procesar Cobro
      </button>
    </div>
  );
};