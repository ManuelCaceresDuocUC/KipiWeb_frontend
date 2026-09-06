import React from 'react';

// Creamos un tipo específico para los datos del formulario
type DatosNuevoCliente = { 
  nombre: string; 
  rut: string; 
  telefono: string; 
  email: string; 
  limiteCredito: number 
};

interface Props {
  show: boolean;
  onClose: () => void;
  nuevoCliente: DatosNuevoCliente;
  setNuevoCliente: (cliente: DatosNuevoCliente) => void;
  handleCrearCliente: (e: React.FormEvent) => void;
  
  // ✨ 1. AGREGAMOS LA FUNCIÓN AQUÍ EN LOS PROPS:
  handleCambioRutNuevoCliente: (valorStr: string) => void; 
}

// ✨ 2. LA EXTRAEMOS AQUÍ ARRIBA (junto al resto de props):
export const ModalNuevoCliente = ({ 
  show, 
  onClose, 
  nuevoCliente, 
  setNuevoCliente, 
  handleCrearCliente, 
  handleCambioRutNuevoCliente 
}: Props) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className='w-full max-w-md bg-white p-6 rounded shadow-lg border border-slate-200 text-sm'>
        <h2 className="text-lg font-semibold mb-4 text-slate-900 border-b border-slate-100 pb-2">
          Registrar Nuevo Cliente
        </h2>
        <form onSubmit={handleCrearCliente} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">Nombre / Razón Social *</label>
            <input 
              required type="text" placeholder="Ej: Juan Pérez"
              className="w-full p-2 rounded border border-slate-300 outline-none focus:border-slate-500" 
              value={nuevoCliente.nombre} 
              onChange={(e) => setNuevoCliente({...nuevoCliente, nombre: e.target.value})} 
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">RUT / Identificación *</label>
            <input 
              required 
              type="text" 
              placeholder="Ej: 12.345.678-9"
              className="w-full p-2 rounded border border-slate-300 outline-none focus:border-slate-500 font-mono" 
              value={nuevoCliente.rut} 
              onChange={(e) => handleCambioRutNuevoCliente(e.target.value)} 
              maxLength={12}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">Teléfono</label>
              <input 
                type="text" placeholder="+569..."
                className="w-full p-2 rounded border border-slate-300 outline-none focus:border-slate-500 font-mono" 
                value={nuevoCliente.telefono} 
                onChange={(e) => setNuevoCliente({...nuevoCliente, telefono: e.target.value})} 
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">Email</label>
              <input 
                type="email" placeholder="cliente@correo.com"
                className="w-full p-2 rounded border border-slate-300 outline-none focus:border-slate-500" 
                value={nuevoCliente.email} 
                onChange={(e) => setNuevoCliente({...nuevoCliente, email: e.target.value})} 
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">Límite de Crédito ($)</label>
            <input 
              type="number" min="0" placeholder="0"
              className="w-full p-2 rounded border border-slate-300 outline-none focus:border-slate-500 font-mono" 
              value={nuevoCliente.limiteCredito || ''} 
              onChange={(e) => setNuevoCliente({...nuevoCliente, limiteCredito: Number(e.target.value)})} 
            />
          </div>
          <button type="submit" className="w-full text-white font-medium py-2.5 rounded shadow-sm mt-4 bg-slate-800 hover:bg-slate-900 text-sm uppercase tracking-wider transition-colors">
            Guardar y Seleccionar
          </button>
          <button type="button" onClick={onClose} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2 rounded mt-1 text-xs uppercase tracking-wider transition-colors">
            Cancelar
          </button>
        </form>
      </div>
    </div>
  );
};