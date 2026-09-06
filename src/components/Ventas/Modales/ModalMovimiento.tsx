import React from 'react';

interface Props {
  show: boolean;
  onClose: () => void;
  tipoMovimiento: 'ingreso' | 'retiro';
  montoMovimiento: string;
  setMontoMovimiento: (val: string) => void;
  motivoMovimiento: string;
  setMotivoMovimiento: (val: string) => void;
  handleRegistrarMovimiento: (e: React.FormEvent) => void;
}

export const ModalMovimiento = ({ show, onClose, tipoMovimiento, montoMovimiento, setMontoMovimiento, motivoMovimiento, setMotivoMovimiento, handleRegistrarMovimiento }: Props) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className='w-full max-w-md bg-white p-6 rounded shadow-lg border border-slate-200 text-sm'>
        <h2 className="text-lg font-semibold mb-4 text-slate-900 border-b border-slate-100 pb-2">
          {tipoMovimiento === 'ingreso' ? 'Registro de Ingreso de Efectivo' : 'Registro de Retiro de Efectivo'}
        </h2>
        <form onSubmit={handleRegistrarMovimiento} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">Monto de Operación ($)</label>
            <input required type="number" min="1" className="w-full p-2 rounded border border-slate-300 outline-none focus:border-slate-500 font-mono" value={montoMovimiento} onChange={(e) => setMontoMovimiento(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">Motivo / Justificación Contable</label>
            <input required type="text" placeholder="Ej: Pago a proveedor, retiro de caja chica..." className="w-full p-2 rounded border border-slate-300 outline-none focus:border-slate-500" value={motivoMovimiento} onChange={(e) => setMotivoMovimiento(e.target.value)} />
          </div>
          <button type="submit" className="w-full text-white font-medium py-2.5 rounded shadow-sm mt-4 bg-slate-800 hover:bg-slate-900 text-sm uppercase tracking-wider transition-colors">
            Registrar Operación
          </button>
          <button type="button" onClick={onClose} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2 rounded mt-1 text-xs uppercase tracking-wider transition-colors">Cancelar</button>
        </form>
      </div>
    </div>
  );
};