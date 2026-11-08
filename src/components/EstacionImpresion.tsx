import { useEffect, useState } from 'react';
import { buscarPendientes, esEstacionImpresion, EVENTO_ROL_IMPRESION, type TrabajoImpresion } from '../helpers/estacionImpresion';
import { imprimirDocumentos } from '../helpers/impresion';
import { abrirGaveta, gavetaPorEvento, modoGaveta } from '../helpers/gaveta';

const espera = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Si este equipo es la "estación de impresión", mantiene una consulta abierta al servidor (espera larga): cuando otro equipo,
 * por ejemplo un celular, manda un ticket, llega casi al instante y se imprime aquí. Debe haber una sesión iniciada y la
 * ventana abierta. Para que imprima sin diálogo, abrir el navegador con --kiosk-printing (ver acceso-caja/LEEME.md).
 */
export const EstacionImpresion = () => {
  const [activa, setActiva] = useState(esEstacionImpresion());
  const [ultimo, setUltimo] = useState<Date | null>(null);
  const [sinRed, setSinRed] = useState(false);

  useEffect(() => {
    const alCambiar = () => setActiva(esEstacionImpresion());
    window.addEventListener(EVENTO_ROL_IMPRESION, alCambiar);
    return () => window.removeEventListener(EVENTO_ROL_IMPRESION, alCambiar);
  }, []);

  useEffect(() => {
    if (!activa) return;
    let vigente = true;

    const ejecutar = async (t: TrabajoImpresion) => {
      if (t.tipo === 'PDF') {
        await imprimirDocumentos(t.documentos, 'Remoto', { forzar: true });
        if (t.abrirGaveta && modoGaveta() === 'PUENTE') await abrirGaveta(true);
      } else if (t.tipo === 'CAJA' && t.evento) {
        await gavetaPorEvento(t.evento, { local: true });
      }
    };

    const bucle = async () => {
      while (vigente) {
        const lista = await buscarPendientes(); // queda esperando hasta ~12 s o hasta que llegue un ticket
        if (!vigente) return;
        setSinRed(lista === null);
        if (lista === null) {
          await espera(3000); // sin red o servidor caído: reintenta sin saturar
          continue;
        }
        setUltimo(new Date());
        for (const t of lista) {
          if (!vigente) return;
          await ejecutar(t);
        }
      }
    };
    void bucle();
    return () => {
      vigente = false;
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
