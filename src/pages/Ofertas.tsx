import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { apiFetch, leerError } from '../helpers/apiFetch';
import { clp } from '../helpers/compras';

const API_URL = import.meta.env.VITE_API_URL as string;

type Tipo = 'SIN_MOVIMIENTO' | 'MARGEN_BAJO' | 'MAS_VENDIDO' | 'STOCK_ALTO';

interface Sugerencia {
  tipo: Tipo;
  productoId: number;
  descripcion: string;
  codigoBarras?: string | null;
  unidadMedida?: string | null;
  precio: number;
  costo: number | null;
  margen: number | null;
  stock: number;
  unidadesVendidas: number;
  ingresos: number;
  diasCobertura: number | null;
  precioSugerido: number | null;
  mensaje: string;
}

interface Analisis {
  dias: number;
  margenMinimo: number;
  productosEvaluados: number;
  productosSinCosto: number;
  sinMovimiento: Sugerencia[];
  margenBajo: Sugerencia[];
  masVendidos: Sugerencia[];
  stockAlto: Sugerencia[];
  totales: { sinMovimiento: number; margenBajo: number; stockAlto: number };
}

const SECCIONES: { id: 'sinMovimiento' | 'margenBajo' | 'masVendidos' | 'stockAlto'; nombre: string; ayuda: string }[] = [
  { id: 'sinMovimiento', nombre: 'Sin movimiento', ayuda: 'Tienen stock y no se vendieron en el período. Una oferta puede liberarlos.' },
  { id: 'margenBajo', nombre: 'Margen bajo', ayuda: 'Su precio deja poco sobre el costo. Subirlo mejora tu ganancia.' },
  { id: 'masVendidos', nombre: 'Más vendidos', ayuda: 'Lo que más mueve tu negocio: cuida que no se agote.' },
  { id: 'stockAlto', nombre: 'Stock alto', ayuda: 'Tienes mucho más de lo que vendes. Una promoción ayuda a rotarlo.' },
];

const leerMargen = () => {
  try {
    const v = Number(localStorage.getItem('margenMinimo'));
    return Number.isFinite(v) && v > 0 ? v : 20;
  } catch {
    return 20;
  }
};

/** Ofertas y sugerencias de precio a partir de lo que se vende. Solo sugiere: tú decides qué aplicar. */
export const Ofertas = () => {
  const navigate = useNavigate();
  const esAdmin = (localStorage.getItem('usuarioRol') || '').toLowerCase().trim() === 'admin';
  useEffect(() => { if (!esAdmin) navigate('/home', { replace: true }); }, [esAdmin, navigate]);

  const [dias, setDias] = useState(30);
  const [margen, setMargen] = useState(leerMargen());
  const [datos, setDatos] = useState<Analisis | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [seccion, setSeccion] = useState<(typeof SECCIONES)[number]['id']>('sinMovimiento');
  const [aplicando, setAplicando] = useState<number | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const res = await apiFetch(`${API_URL}/sugerencias?dias=${dias}&margen=${margen}`, { timeoutMs: 60_000 });
      if (!res.ok) throw new Error(await leerError(res, 'No se pudo analizar tu catálogo.'));
      setDatos((await res.json()) as Analisis);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo analizar tu catálogo.');
    } finally {
      setCargando(false);
    }
  }, [dias, margen]);

  useEffect(() => { if (esAdmin) void cargar(); }, [cargar, esAdmin]);

  const cambiarMargen = (v: number) => {
    const m = Math.max(1, Math.min(v || 1, 300));
    setMargen(m);
    try { localStorage.setItem('margenMinimo', String(m)); } catch { /* sin almacenamiento */ }
  };

  const aplicar = async (s: Sugerencia) => {
    if (s.precioSugerido === null) return;
    const subiendo = s.precioSugerido > s.precio;
    const r = await Swal.fire({
      icon: 'question',
      title: subiendo ? 'Subir precio' : 'Poner en oferta',
      html: `<div style="font-size:14px"><b>${s.descripcion.replace(/</g, '&lt;')}</b><br>${clp(s.precio)} → <b>${clp(s.precioSugerido)}</b>` +
        `<p style="font-size:12px;color:#64748B;margin-top:8px">El precio cambia en caja de inmediato.${subiendo ? '' : ' Cuando termine la oferta, tendrás que volver a ponerlo en su precio normal.'}</p></div>`,
      showCancelButton: true, confirmButtonText: 'Aplicar precio', cancelButtonText: 'Volver',
    });
    if (!r.isConfirmed) return;
    setAplicando(s.productoId);
    try {
      const res = await apiFetch(`${API_URL}/sugerencias/aplicar-precio`, {
        method: 'POST', body: JSON.stringify({ productoId: s.productoId, precio: s.precioSugerido }),
      });
      if (!res.ok) throw new Error(await leerError(res, 'No se pudo cambiar el precio.'));
      // Se saca la sugerencia aplicada de la lista, sin volver a analizar todo
      setDatos((d) => d && ({
        ...d,
        sinMovimiento: d.sinMovimiento.filter((x) => x.productoId !== s.productoId),
        margenBajo: d.margenBajo.filter((x) => x.productoId !== s.productoId),
        stockAlto: d.stockAlto.filter((x) => x.productoId !== s.productoId),
      }));
      Swal.fire({ icon: 'success', title: 'Precio actualizado', timer: 1500, showConfirmButton: false });
    } catch (e) {
      Swal.fire('No se cambió', e instanceof Error ? e.message : 'Error inesperado.', 'error');
    } finally {
      setAplicando(null);
    }
  };

  if (!esAdmin) return null;
  const lista = datos ? datos[seccion] : [];
  const conteo = (id: (typeof SECCIONES)[number]['id']) => (datos ? datos[id].length : 0);
  const info = SECCIONES.find((s) => s.id === seccion)!;

  return (
    <div className="font-sans text-slate-800 max-w-5xl">
      <div className="mb-6 border-b border-slate-200 pb-4">
        <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">Ofertas y precios</h1>
        <p className="text-slate-500 text-sm mt-1">Sugerencias según lo que realmente vendes. Nada cambia solo: tú decides qué aplicar.</p>
      </div>

      <div className="bg-white p-3 rounded border border-slate-200 mb-4 flex flex-wrap gap-4 items-end text-sm">
        <label className="text-xs font-semibold uppercase text-slate-600">Analizar los últimos
          <select value={dias} onChange={(e) => setDias(Number(e.target.value))} className="mt-1 block border border-slate-300 rounded p-2 bg-white font-normal normal-case text-sm">
            <option value={15}>15 días</option><option value={30}>30 días</option><option value={60}>60 días</option><option value={90}>90 días</option>
          </select>
        </label>
        <label className="text-xs font-semibold uppercase text-slate-600">Margen mínimo sobre el costo (%)
          <input type="number" min={1} max={300} value={margen} onChange={(e) => cambiarMargen(Number(e.target.value))}
            className="mt-1 block w-28 border border-slate-300 rounded p-2 bg-white font-normal text-sm" />
        </label>
        {datos && <p className="text-slate-500 ml-auto">{datos.productosEvaluados} productos analizados</p>}
      </div>

      {datos && datos.productosSinCosto > 0 && (
        <p className="mb-4 p-3 text-sm bg-amber-50 border border-amber-200 text-amber-900 rounded">
          {datos.productosSinCosto} productos no tienen costo, así que no se puede revisar su margen. El costo se completa solo cuando registras compras.
        </p>
      )}
      {error && <p className="mb-4 p-3 text-sm bg-red-50 border border-red-200 text-red-700 rounded">{error}</p>}

      <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded mb-3 text-sm">
        {SECCIONES.map((s) => (
          <button key={s.id} onClick={() => setSeccion(s.id)}
            className={`flex-1 min-w-[130px] px-3 py-1.5 rounded font-medium ${seccion === s.id ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}>
            {s.nombre} ({conteo(s.id)})
          </button>
        ))}
      </div>
      <p className="text-sm text-slate-500 mb-3">{info.ayuda}</p>

      {cargando ? <p className="p-8 text-center text-slate-500">Analizando tus ventas…</p> : lista.length === 0 ? (
        <p className="p-8 text-center text-slate-400 bg-white border border-slate-200 rounded">
          {datos && datos.productosEvaluados === 0 ? 'Aún no hay productos para analizar.' : 'No hay sugerencias en esta categoría. ¡Buena señal!'}
        </p>
      ) : (
        <ul className="space-y-2">
          {lista.map((s) => (
            <li key={s.productoId} className="bg-white border border-slate-200 rounded p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 truncate">{s.descripcion}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Precio {clp(s.precio)}{s.costo !== null ? ` · costo ${clp(s.costo)}` : ''}{s.margen !== null ? ` · margen ${s.margen.toLocaleString('es-CL')} %` : ''}
                  {' · '}stock {s.stock.toLocaleString('es-CL', { maximumFractionDigits: 3 })}{s.unidadesVendidas > 0 ? ` · vendió ${s.unidadesVendidas.toLocaleString('es-CL', { maximumFractionDigits: 3 })}` : ''}
                </p>
                <p className="text-sm text-slate-700 mt-1">{s.mensaje}</p>
              </div>
              {s.precioSugerido !== null && (
                <div className="sm:text-right shrink-0">
                  <p className="text-[11px] uppercase tracking-wider text-slate-500">Precio sugerido</p>
                  <p className={`text-xl font-mono font-bold ${s.precioSugerido > s.precio ? 'text-emerald-700' : 'text-amber-700'}`}>{clp(s.precioSugerido)}</p>
                  <button onClick={() => aplicar(s)} disabled={aplicando === s.productoId}
                    className="mt-1 px-4 py-1.5 text-sm rounded bg-slate-800 hover:bg-slate-900 text-white disabled:opacity-60">
                    {aplicando === s.productoId ? 'Aplicando…' : 'Aplicar precio'}
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
