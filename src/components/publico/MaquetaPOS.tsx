/** Ilustración del punto de venta hecha en HTML/CSS (no depende de imágenes externas). Los datos son de ejemplo. */
export const MaquetaPOS = () => (
  <div className="rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden" aria-hidden="true">
    <div className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 border-b border-slate-200">
      <span className="w-2.5 h-2.5 rounded-full bg-red-300" />
      <span className="w-2.5 h-2.5 rounded-full bg-amber-300" />
      <span className="w-2.5 h-2.5 rounded-full bg-emerald-300" />
      <span className="ml-3 text-[11px] text-slate-500 font-medium">KIPI · Punto de venta</span>
    </div>

    <div className="grid grid-cols-5 text-[11px]">
      <div className="col-span-3 p-4 space-y-3 border-r border-slate-100">
        <div className="h-8 rounded-md bg-slate-100 border border-slate-200 flex items-center px-3 text-slate-400">
          Buscar producto o escanear código…
        </div>
        <div className="grid grid-cols-3 gap-2">
          {['Leche entera 1L', 'Pan amasado', 'Queso gauda', 'Yogurt frutilla', 'Mantequilla', 'Huevos x12'].map((n, i) => (
            <div key={n} className="rounded-lg border border-slate-200 p-2 space-y-1">
              <div className={`h-9 rounded ${['bg-blue-100', 'bg-amber-100', 'bg-yellow-100', 'bg-rose-100', 'bg-orange-100', 'bg-stone-100'][i]}`} />
              <p className="font-semibold text-slate-700 leading-tight">{n}</p>
              <p className="text-slate-400">Stock {[24, 18, 9, 31, 12, 40][i]}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="col-span-2 p-4 bg-slate-50 flex flex-col gap-2">
        <p className="font-semibold text-slate-700 uppercase tracking-wider text-[10px]">Venta actual</p>
        {[['Leche entera 1L ×2', '$2.600'], ['Pan amasado ×4', '$3.200'], ['Queso gauda ×1', '$4.500']].map(([a, b]) => (
          <div key={a} className="flex justify-between border-b border-slate-200 pb-1.5 text-slate-600">
            <span>{a}</span>
            <span className="font-semibold">{b}</span>
          </div>
        ))}
        <div className="mt-auto pt-2 flex justify-between items-baseline">
          <span className="text-slate-500">Total</span>
          <span className="text-lg font-bold text-slate-900">$10.300</span>
        </div>
        <div className="rounded-md bg-slate-900 text-white text-center py-2 font-semibold">Cobrar</div>
      </div>
    </div>
  </div>
);
