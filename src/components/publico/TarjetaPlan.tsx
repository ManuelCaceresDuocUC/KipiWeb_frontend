import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { CARACTERISTICAS, DIAS_PRUEBA, formatoPrecio, type Plan } from '../../config/planes';

/** Card de un plan con botón de contratar → registro. `resumida` muestra solo las primeras características. */
export const TarjetaPlan = ({ plan, resumida = false }: { plan: Plan; resumida?: boolean }) => {
  const lista = CARACTERISTICAS.filter((c) => plan.incluye.includes(c.id));
  const visibles = resumida ? lista.slice(0, 8) : lista;

  return (
    <div
      className={`relative flex flex-col rounded-2xl border bg-white p-7 shadow-sm ${
        plan.destacado ? 'border-slate-900 ring-1 ring-slate-900 shadow-lg' : 'border-slate-200'
      }`}
    >
      {plan.destacado && (
        <span className="absolute -top-3 left-7 bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
          Todo incluido
        </span>
      )}
      <h3 className="text-lg font-semibold text-slate-900">{plan.nombre}</h3>
      <p className="text-sm text-slate-500 mt-1 min-h-[2.5rem]">{plan.descripcion}</p>

      <p className="mt-5 flex items-baseline gap-1.5">
        <span className="text-4xl font-bold tracking-tight text-slate-900">{formatoPrecio(plan.precioMensual)}</span>
        <span className="text-sm text-slate-500">/ mes</span>
      </p>
      <p className="text-xs text-slate-400 mt-1">{DIAS_PRUEBA} días gratis, sin tarjeta. Después, cobro mensual con tarjeta a través de Flow.</p>

      <Link
        to="/registroempresa"
        className={`mt-6 text-center rounded-lg py-3 text-sm font-semibold transition-colors ${
          plan.destacado ? 'bg-slate-900 text-white hover:bg-slate-700' : 'border border-slate-300 text-slate-800 hover:bg-slate-50'
        }`}
      >
        Probar gratis {DIAS_PRUEBA} días
      </Link>

      <ul className="mt-6 space-y-2.5 text-sm text-slate-700">
        {visibles.map((c) => (
          <li key={c.id} className="flex items-start gap-2.5">
            <Check className="w-4 h-4 mt-0.5 text-emerald-600 shrink-0" />
            <span>{c.nombre}</span>
          </li>
        ))}
        {resumida && lista.length > visibles.length && (
          <li className="text-slate-500 pl-6">y {lista.length - visibles.length} funciones más…</li>
        )}
      </ul>

      {resumida && (
        <Link to="/planes" className="mt-5 text-sm font-semibold text-slate-700 hover:text-slate-900 underline underline-offset-4 text-center">
          Ver todo lo que incluye
        </Link>
      )}
    </div>
  );
};
