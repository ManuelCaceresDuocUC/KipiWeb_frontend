import { useEffect, useRef, useState } from 'react';
import { buscarPendientes, esEstacionImpresion, EVENTO_ROL_IMPRESION, type TrabajoImpresion } from '../helpers/estacionImpresion';
import { imprimirDocumentos } from '../helpers/impresion';
import { abrirGaveta, gavetaPorEvento, modoGaveta } from '../helpers/gaveta';

const INTERVALO_MS = 4000;

/**
 * Si este equipo es la "estación de impresión", consulta cada pocos segundos si hay tickets enviados desde otros equipos
 * (por ejemplo, un celular) y los imprime aquí. Debe haber una sesión iniciada y la ventana abierta (no minimizada).
 * El reloj corre en un Worker para que el navegador no lo frene cuando la pestaña queda detrás de otras ventanas.
 */
export const EstacionImpresion = () => {
  const [activa, setActiva] = useState(esEstacionImpresion());
  const [ultimo, setUltimo] = useState<Date | null>(null);
  const [sinRed, setSinRed] = useState(false);
  const ocupado = useRef(false);

  useEffect(() => {
    const alCambiar = () => setActiva(esEstacionImpresion());
    window.addEventListener(EVENTO_ROL_IMPRESION, alCambiar);
    return () => window.removeEventListener(EVENTO_ROL_IMPRESION, alCambiar);
  }, []);

  useEffect(() => {
    if (!activa) return;

    const ejecutar = async (t: TrabajoImpresion) => {
      if (t.tipo === 'PDF') {
        await imprimirDocumentos(t.documentos, 'Remoto', { forzar: true });
        if (t.abrirGaveta && modoGaveta() === 'PUENTE') await abrirGaveta(true);
      } else if (t.tipo === 'CAJA' && t.evento) {
        await gavetaPorEvento(t.evento, { local: true });
      }
    };

    const revisar = async () => {
      if (ocupado.current) return;
      ocupado.current = true;
      try {
        const lista = await buscarPendientes();
        setSinRed(lista === null);
        if (lista) {
          setUltimo(new Date());
          for (const t of lista) {
            await ejecutar(t);
            await new Promise((r) => setTimeout(r, 800));
          }
        }
      } finally {
        ocupado.current = false;
      }
    };

    void revisar();
    let worker: Worker | null = null;
    let url: string | null = null;
    let intervalo: number | null = null;
    try {
      url = URL.createObjectURL(new Blob([`setInterval(function(){postMessage(1)},${INTERVALO_MS})`], { type: 'text/javascript' }));
      worker = new Worker(url);
      worker.onmessage = () => void revisar();
    } catch {
      intervalo = window.setInterval(() => void revisar(), INTERVALO_MS); // sin Worker: se usa el reloj normal
    }
    return () => {
      worker?.terminate();
      if (url) URL.revokeObjectURL(url);
      if (intervalo !== null) window.clearInterval(intervalo);
    };
  }, [activa]);

  if (!activa) return null;
  return (
    <div
      role="status"
      className={`fixed bottom-3 left-3 z-40 rounded-full px-3 py-1.5 text-xs font-medium shadow ${sinRed ? 'bg-red-100 text-red-800 border border-red-300' : 'bg-emerald-100 text-emerald-800 border border-emerald-300'}`}
    >
      🖨️ Caja de impresión {sinRed ? 'sin conexión' : 'activa'}
      {ultimo && !sinRed ? ` · ${ultimo.toLocaleTimeString('es-CL')}` : ''}
    </div>
  );
};
