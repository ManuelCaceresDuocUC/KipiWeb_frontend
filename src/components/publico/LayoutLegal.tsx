import type { ReactNode } from 'react';
import { NavbarPublico } from './NavbarPublico';
import { FooterPublico } from './FooterPublico';

export interface SeccionLegal {
  titulo: string;
  parrafos: string[];
}

/** Estructura común de las páginas legales: título, vigencia e índice de cláusulas numeradas. */
export const LayoutLegal = ({
  titulo, vigencia, intro, secciones, children,
}: { titulo: string; vigencia: string; intro?: string; secciones: SeccionLegal[]; children?: ReactNode }) => {

  return (
    <div className="min-h-screen bg-white font-sans text-slate-800">
      <NavbarPublico />
      <main className="pt-28 pb-16 md:pt-36">
        <div className="max-w-3xl mx-auto px-4 sm:px-8">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">{titulo}</h1>
          <p className="text-sm text-slate-500 mt-2">Vigente desde el {vigencia}</p>
          {intro && <p className="mt-6 text-slate-600 leading-relaxed">{intro}</p>}

          <nav className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-5" aria-label="Contenido">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Contenido</p>
            <ol className="columns-1 sm:columns-2 gap-6 text-sm space-y-1 list-decimal list-inside text-slate-700">
              {secciones.map((s, i) => (
                <li key={s.titulo}>
                  <a href={`#c${i + 1}`} className="hover:underline">{s.titulo}</a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="mt-10 space-y-10">
            {secciones.map((s, i) => (
              <section key={s.titulo} id={`c${i + 1}`} className="scroll-mt-24">
                <h2 className="text-xl font-semibold text-slate-900 mb-3">{i + 1}. {s.titulo}</h2>
                <div className="space-y-3 text-[15px] text-slate-700 leading-relaxed">
                  {s.parrafos.map((p, j) => <p key={j}>{p}</p>)}
                </div>
              </section>
            ))}
          </div>
          {children}
        </div>
      </main>
      <FooterPublico />
    </div>
  );
};
