import { useMemo, useRef, useState } from 'react';
import Swal from 'sweetalert2';
import { apiFetch, leerError } from '../helpers/apiFetch';
import { leerArchivoTabla, type Tabla } from '../helpers/lectorTabla';
import {
  CAMPOS, PLANTILLA_CSV, construirFilas, descargarTexto, detectarColumnas,
  type CampoImport, type FilaImport,
} from '../helpers/importarProductos';

const API_URL = import.meta.env.VITE_API_URL as string;
const LOTE = 500;

interface ResultadoFila { fila: number; estado: 'CREADO' | 'ACTUALIZADO' | 'OMITIDO' | 'ERROR'; mensaje?: string; codigo?: string; descripcion?: string }
interface Resumen { creados: number; actualizados: number; omitidos: number; errores: number; filas: ResultadoFila[] }

const COLOR: Record<string, string> = {
  CREADO: 'text-emerald-700', ACTUALIZADO: 'text-blue-700', OMITIDO: 'text-slate-500', ERROR: 'text-red-700',
};

interface Props { abierto: boolean; onCerrar: () => void; onTerminado: () => void }

/** Importa productos desde Excel/CSV: elegir archivo → relacionar columnas → revisar (sin guardar) → importar. */
export const ModalImportarProductos = ({ abierto, onCerrar, onTerminado }: Props) => {
  const [tabla, setTabla] = useState<Tabla>([]);
  const [nombreArchivo, setNombreArchivo] = useState('');
  const [mapeo, setMapeo] = useState<(CampoImport | '')[]>([]);
  const [actualizarExistentes, setActualizarExistentes] = useState(true);
  const [ajustarStock, setAjustarStock] = useState(false);
  const [trabajando, setTrabajando] = useState(false);
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [esSimulacion, setEsSimulacion] = useState(true);
  const entrada = useRef<HTMLInputElement>(null);

  const encabezados = tabla[0] ?? [];
  const datos = useMemo(() => tabla.slice(1), [tabla]);
  const faltantes = CAMPOS.filter((c) => c.obligatorio && !mapeo.includes(c.id));

  const reiniciar = () => {
    setTabla([]); setNombreArchivo(''); setMapeo([]); setResumen(null); setEsSimulacion(true);
    if (entrada.current) entrada.current.value = '';
  };
  const cerrar = () => { reiniciar(); onCerrar(); };

  const elegirArchivo = async (archivo?: File) => {
    if (!archivo) return;
    try {
      const t = await leerArchivoTabla(archivo);
      if (t.length < 2) throw new Error('El archivo no tiene filas de productos (la primera fila debe ser el encabezado).');
      if (t.length - 1 > 20000) throw new Error('El archivo tiene más de 20.000 filas. Divídelo en partes.');
      setTabla(t); setNombreArchivo(archivo.name); setMapeo(detectarColumnas(t[0])); setResumen(null);
    } catch (e) {
      reiniciar();
      Swal.fire('No se pudo leer el archivo', e instanceof Error ? e.message : 'Archivo no válido.', 'error');
    }
  };

  const enviar = async (soloValidar: boolean) => {
    if (faltantes.length) return;
    const { filas, avisos } = construirFilas(datos, mapeo, 2);
    if (avisos.length) {
      const seguir = await Swal.fire({
        icon: 'warning', title: 'Hay valores que no se entienden',
        html: `<div style="text-align:left;font-size:13px">${avisos.map((a) => a.replace(/</g, '&lt;')).join('<br>')}<br><br>Esas celdas se ignorarán.</div>`,
        showCancelButton: true, confirmButtonText: 'Continuar', cancelButtonText: 'Revisar archivo',
      });
      if (!seguir.isConfirmed) return;
    }
    setTrabajando(true);
    const total: Resumen = { creados: 0, actualizados: 0, omitidos: 0, errores: 0, filas: [] };
    try {
      for (let i = 0; i < filas.length; i += LOTE) {
        const lote: FilaImport[] = filas.slice(i, i + LOTE);
        const res = await apiFetch(`${API_URL}/productos/importar`, {
          method: 'POST',
          timeoutMs: 120_000,
          body: JSON.stringify({ soloValidar, actualizarExistentes, ajustarStock, filas: lote }),
        });
        if (!res.ok) throw new Error(await leerError(res, 'No se pudo importar el lote.'));
        const r = (await res.json()) as Resumen;
        total.creados += r.creados; total.actualizados += r.actualizados;
        total.omitidos += r.omitidos; total.errores += r.errores;
        total.filas.push(...r.filas);
      }
      setResumen(total); setEsSimulacion(soloValidar);
      if (!soloValidar) onTerminado();
    } catch (e) {
      Swal.fire('Importación interrumpida', (e instanceof Error ? e.message : 'Error') +
        (soloValidar ? '' : ' Los lotes anteriores ya quedaron guardados; puedes volver a importar el archivo (los productos existentes se actualizan, no se duplican).'), 'error');
      if (!soloValidar) onTerminado();
    } finally {
      setTrabajando(false);
    }
  };

  if (!abierto) return null;
  const problemas = resumen?.filas.filter((f) => f.estado === 'ERROR' || f.estado === 'OMITIDO') ?? [];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && !trabajando && cerrar()}>
      <div className="bg-white rounded shadow-xl w-full max-w-3xl max-h-[92vh] overflow-y-auto p-6 space-y-5">
        <div className="flex justify-between items-start gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Importar productos desde Excel o CSV</h2>
            <p className="text-sm text-slate-500">Sube tu lista de productos y precios. Primero revisas, después se guarda.</p>
          </div>
          <button onClick={cerrar} disabled={trabajando} className="text-slate-400 hover:text-slate-700 text-xl leading-none">×</button>
        </div>

        {tabla.length === 0 ? (
          <div className="space-y-4">
            <label className="block border-2 border-dashed border-slate-300 rounded p-8 text-center cursor-pointer hover:bg-slate-50">
              <input ref={entrada} type="file" accept=".xlsx,.xlsm,.csv,.txt" className="hidden" onChange={(e) => elegirArchivo(e.target.files?.[0])} />
              <span className="text-sm font-medium text-slate-700">Elegir archivo (.xlsx o .csv)</span>
              <span className="block text-xs text-slate-500 mt-1">La primera fila debe tener los nombres de las columnas.</span>
            </label>
            <div className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded p-3 space-y-1">
              <p><b>Obligatorio:</b> Nombre y Precio. Lo demás es opcional.</p>
              <p>Si un producto no trae código de barras, el sistema le asigna un código interno propio.</p>
              <p>Si el nombre o el código ya existe, se actualiza en vez de duplicarse.</p>
            </div>
            <button onClick={() => descargarTexto(PLANTILLA_CSV, 'plantilla-productos-kipipos.csv')} className="text-sm text-blue-700 underline">
              Descargar plantilla de ejemplo
            </button>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-700"><b>{nombreArchivo}</b> · {datos.length} filas</span>
              <button onClick={reiniciar} disabled={trabajando} className="text-blue-700 underline">Cambiar archivo</button>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase text-slate-600 mb-2">1. Relaciona las columnas</h3>
              <div className="overflow-x-auto border border-slate-200 rounded">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50"><tr>
                    {encabezados.map((h, i) => (
                      <th key={i} className="p-2 text-left align-top min-w-[140px]">
                        <div className="font-medium text-slate-700 mb-1 truncate" title={h}>{h || `(columna ${i + 1})`}</div>
                        <select value={mapeo[i] ?? ''} disabled={trabajando}
                          onChange={(e) => { setResumen(null); setMapeo((m) => m.map((v, j) => (j === i ? (e.target.value as CampoImport | '') : v === e.target.value && e.target.value ? '' : v))); }}
                          className="w-full p-1 border border-slate-300 rounded bg-white">
                          <option value="">— Ignorar —</option>
                          {CAMPOS.map((c) => <option key={c.id} value={c.id}>{c.etiqueta}{c.obligatorio ? ' *' : ''}</option>)}
                        </select>
                      </th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {datos.slice(0, 3).map((f, r) => (
                      <tr key={r} className="border-t border-slate-100">
                        {encabezados.map((_, i) => <td key={i} className="p-2 text-slate-600 truncate max-w-[180px]">{f[i] ?? ''}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {faltantes.length > 0 && (
                <p className="text-xs text-red-600 mt-2">Falta relacionar: {faltantes.map((c) => c.etiqueta).join(', ')}.</p>
              )}
            </div>

            <div className="space-y-2 text-sm text-slate-700">
              <label className="flex items-start gap-2"><input type="checkbox" checked={actualizarExistentes} onChange={(e) => { setResumen(null); setActualizarExistentes(e.target.checked); }} className="mt-1" />
                <span>Actualizar los productos que ya existen (precio, costo, categoría…). Si lo desmarcas, se omiten.</span></label>
              <label className="flex items-start gap-2"><input type="checkbox" checked={ajustarStock} onChange={(e) => { setResumen(null); setAjustarStock(e.target.checked); }} className="mt-1" />
                <span>Reemplazar el stock de los productos existentes por el del archivo (queda registrado como ajuste). Los productos nuevos siempre parten con el stock del archivo.</span></label>
            </div>

            {resumen && (
              <div className="border border-slate-200 rounded p-3 space-y-2">
                <h3 className="text-xs font-semibold uppercase text-slate-600">
                  {esSimulacion ? '2. Revisión (todavía no se guardó nada)' : 'Importación terminada'}
                </h3>
                <p className="text-sm">
                  <span className="text-emerald-700 font-medium">{resumen.creados} nuevos</span> ·{' '}
                  <span className="text-blue-700 font-medium">{resumen.actualizados} actualizados</span> ·{' '}
                  <span className="text-slate-500 font-medium">{resumen.omitidos} omitidos</span> ·{' '}
                  <span className="text-red-700 font-medium">{resumen.errores} con error</span>
                </p>
                {problemas.length > 0 && (
                  <div className="max-h-44 overflow-y-auto text-xs border-t border-slate-100 pt-2 space-y-1">
                    {problemas.slice(0, 200).map((f) => (
                      <p key={f.fila} className={COLOR[f.estado]}>Fila {f.fila}{f.descripcion ? ` (${f.descripcion})` : ''}: {f.mensaje}</p>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-1">
              <button onClick={cerrar} disabled={trabajando} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900">
                {resumen && !esSimulacion ? 'Cerrar' : 'Cancelar'}
              </button>
              {!(resumen && !esSimulacion) && (
                <>
                  <button onClick={() => enviar(true)} disabled={trabajando || faltantes.length > 0}
                    className="px-4 py-2 text-sm rounded border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50">
                    {trabajando ? 'Procesando…' : 'Revisar sin guardar'}
                  </button>
                  <button onClick={() => enviar(false)} disabled={trabajando || faltantes.length > 0 || !resumen || !esSimulacion || resumen.errores === datos.length}
                    className="px-4 py-2 text-sm rounded bg-slate-800 hover:bg-slate-900 text-white disabled:opacity-50"
                    title={!resumen ? 'Primero revisa el archivo' : undefined}>
                    Importar {datos.length} filas
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
