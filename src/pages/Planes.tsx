import { Link } from 'react-router-dom';
import { Check, Minus } from 'lucide-react';
import { NavbarPublico } from '../components/publico/NavbarPublico';
import { FooterPublico } from '../components/publico/FooterPublico';
import { TarjetaPlan } from '../components/publico/TarjetaPlan';
import { CARACTERISTICAS, PLANES, formatoPrecio } from '../config/planes';
import { enlaceCorreo } from '../config/contacto';

const CATEGORIAS = [...new Set(CARACTERISTICAS.map((c) => c.categoria))];

/** Página pública de planes: cards + tabla comparativa (se ajusta sola si se agregan planes en config/planes.ts). */
export const Planes = () => {

  return (
    <div className="min-h-screen bg-white font-sans text-slate-800">
      <NavbarPublico />

      <section className="pt-28 pb-10 md:pt-36 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-8 text-center">
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Planes y precios</h1>
          <p className="text-slate-600 mt-3 text-lg">
            Un plan con todo incluido por {formatoPrecio(PLANES[0].precioMensual)} al mes. Revisa qué trae cada función antes de contratar.
          </p>
        </div>
      </section>

      <section className="pb-16">
        <div
          className={`max-w-6xl mx-auto px-4 sm:px-8 grid gap-6 ${
            PLANES.length === 1 ? 'max-w-md grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
          }`}
        >
          {PLANES.map((p) => (
            <TarjetaPlan key={p.id} plan={p} resumida />
          ))}
        </div>
      </section>

      {/* TABLA COMPARATIVA */}
      <section className="pb-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-8">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-6">Qué incluye en detalle</h2>
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left font-semibold text-slate-600 px-5 py-4">Función</th>
                  {PLANES.map((p) => (
                    <th key={p.id} className="px-5 py-4 text-center font-semibold text-slate-900 whitespace-nowrap">
                      {p.nombre}
                      <span className="block text-xs font-normal text-slate-500">{formatoPrecio(p.precioMensual)} / mes</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CATEGORIAS.map((cat) => (
                  <FilasCategoria key={cat} categoria={cat} />
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-900">
            <strong>Importante:</strong> las boletas y facturas electrónicas las emite tu proveedor autorizado por el SII (por ejemplo Haulmer/OpenFactura) y su costo se paga aparte, directamente a él. KIPI se conecta con tu API Key.
          </div>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl bg-slate-900 text-white p-8">
            <div>
              <h3 className="text-lg font-semibold">¿Dudas antes de contratar?</h3>
              <p className="text-sm text-slate-400">Escríbenos y te ayudamos a decidir.</p>
            </div>
            <div className="flex gap-3">
              <a href={enlaceCorreo('Consulta sobre planes KIPI')} className="px-5 py-2.5 rounded-lg border border-slate-600 text-sm font-semibold hover:bg-slate-800">
                Escribir
              </a>
              <Link to="/registroempresa" className="px-5 py-2.5 rounded-lg bg-white text-slate-900 text-sm font-semibold hover:bg-slate-100">
                Contratar
              </Link>
            </div>
          </div>
        </div>
      </section>

      <FooterPublico />
    </div>
  );
};

const FilasCategoria = ({ categoria }: { categoria: string }) => (
  <>
    <tr className="bg-slate-50/60">
      <td colSpan={PLANES.length + 1} className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-500">
        {categoria}
      </td>
    </tr>
    {CARACTERISTICAS.filter((c) => c.categoria === categoria).map((c) => (
      <tr key={c.id} className="border-t border-slate-100">
        <td className="px-5 py-3.5">
          <p className="font-medium text-slate-800">{c.nombre}</p>
          <p className="text-xs text-slate-500 mt-0.5">{c.detalle}</p>
        </td>
        {PLANES.map((p) => (
          <td key={p.id} className="px-5 py-3.5 text-center">
            {p.incluye.includes(c.id) ? (
              <Check className="w-5 h-5 text-emerald-600 inline" aria-label="Incluido" />
            ) : (
              <Minus className="w-5 h-5 text-slate-300 inline" aria-label="No incluido" />
            )}
          </td>
        ))}
      </tr>
    ))}
  </>
);
