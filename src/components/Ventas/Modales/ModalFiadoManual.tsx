import { useEffect, useMemo, useRef, useState } from 'react';
import Swal from 'sweetalert2';
import { apiFetch, esErrorDeConexion, leerError } from '../../../helpers/apiFetch';
import type { ClienteInfo } from '../../../types/ventas.types';

interface ProductoVendible {
  id: number;
  descripcion: string;
  precio: number;
  codigoBarras?: string;
  esInsumo?: boolean;
}

interface Linea {
  id: number;
  descripcion: string;
  cantidad: number;
  precio: number;
}

interface Props {
  show: boolean;
  onClose: () => void;
  productos: ProductoVendible[];
  /** Tras registrar: refresca catálogo y stock. */
  onRegistrado: () => void;
}

const clp = (n: number) => '$' + Math.round(n).toLocaleString('es-CL');

/** Fecha local en formato del input datetime-local (YYYY-MM-DDTHH:mm). */
const ahoraLocal = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

const nuevaClave = () =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

/**
 * Registra en KIPI un fiado que se anotó a mano en un vale de papel (porque no había conexión).
 * Conserva el N° del vale y la fecha real de la compra; el cliente recibe el comprobante por correo.
 */
export const ModalFiadoManual = ({ show, onClose, productos, onRegistrado }: Props) => {
  const [numeroVale, setNumeroVale] = useState('');
  const [fecha, setFecha] = useState(ahoraLocal());
  const [termino, setTermino] = useState('');
  const [sugerencias, setSugerencias] = useState<ClienteInfo[]>([]);
  const [cliente, setCliente] = useState<ClienteInfo | null>(null);
  const [busquedaProducto, setBusquedaProducto] = useState('');
  const [lineas, setLineas] = useState<Linea[]>([]);
  const [enviando, setEnviando] = useState(false);
  // Misma clave en cada reintento del mismo vale: si la respuesta se pierde, no se duplica
  const clave = useRef<string>(nuevaClave());

  const total = useMemo(() => Math.round(lineas.reduce((a, l) => a + l.cantidad * l.precio, 0)), [lineas]);

  useEffect(() => {
    const t = termino.trim();
    if (!show || t.length < 2 || (cliente && t === cliente.rut)) {
      setSugerencias([]);
      return;
    }
    let activo = true;
    const timer = setTimeout(async () => {
      try {
        const res = await apiFetch(`${import.meta.env.VITE_API_URL}/clientes/buscar?termino=${encodeURIComponent(t)}`);
        if (!activo) return;
        if (res.ok) {
          const data = await res.json();
          setSugerencias(Array.isArray(data) ? data : [data]);
        } else {
          setSugerencias([]);
        }
      } catch {
        if (activo) setSugerencias([]);
      }
    }, 300);
    return () => {
      activo = false;
      clearTimeout(timer);
    };
  }, [termino, cliente, show]);

  const resultadosProducto = useMemo(() => {
    const b = busquedaProducto.trim().toLowerCase();
    if (!b) return [];
    return productos
      .filter((p) => !p.esInsumo && (p.descripcion.toLowerCase().includes(b) || p.codigoBarras?.includes(b)))
      .slice(0, 6);
  }, [busquedaProducto, productos]);

  if (!show) return null;

  const agregar = (p: ProductoVendible) => {
    setLineas((prev) => {
      const existe = prev.find((l) => l.id === p.id);
      if (existe) return prev.map((l) => (l.id === p.id ? { ...l, cantidad: l.cantidad + 1 } : l));
      return [...prev, { id: p.id, descripcion: p.descripcion, cantidad: 1, precio: p.precio }];
    });
    setBusquedaProducto('');
  };

  const cambiar = (id: number, campo: 'cantidad' | 'precio', valor: number) =>
    setLineas((prev) => prev.map((l) => (l.id === id ? { ...l, [campo]: valor } : l)));

  const reiniciar = () => {
    setNumeroVale('');
    setFecha(ahoraLocal());
    setTermino('');
    setSugerencias([]);
    setCliente(null);
    setBusquedaProducto('');
    setLineas([]);
    clave.current = nuevaClave();
  };

  const registrar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!numeroVale.trim()) return void Swal.fire('Falta el N° del vale', 'Escribe el número que trae impreso el vale de papel.', 'warning');
    if (!cliente) return void Swal.fire('Falta el cliente', 'Busca y selecciona al cliente que firmó el vale.', 'warning');
    if (lineas.length === 0 || total <= 0) return void Swal.fire('Falta el detalle', 'Agrega los productos que anotaron en el vale.', 'warning');
    if (lineas.some((l) => !(l.cantidad > 0) || !(l.precio > 0))) {
      return void Swal.fire('Revisa el detalle', 'Cada producto necesita cantidad y precio mayores a cero.', 'warning');
    }
    const cuando = new Date(fecha);
    if (isNaN(cuando.getTime()) || cuando.getTime() > Date.now() + 5 * 60_000) {
      return void Swal.fire('Fecha inválida', 'La fecha del vale no puede ser futura.', 'warning');
    }

    const confirmar = await Swal.fire({
      icon: 'question',
      title: 'Registrar fiado desde vale',
      html: `Vale <b>${numeroVale.trim().toUpperCase()}</b><br>Cliente: <b>${cliente.nombre}</b><br>Total a su cuenta: <b>${clp(total)}</b><br><br><span style="color:#64748b">Compara estos datos con el papel firmado. ${cliente.email ? 'Se enviará un comprobante al correo del cliente.' : 'El cliente no tiene correo registrado: no recibirá comprobante.'}</span>`,
      showCancelButton: true,
      confirmButtonText: 'Registrar',
      cancelButtonText: 'Revisar',
    });
    if (!confirmar.isConfirmed) return;

    setEnviando(true);
    try {
      const res = await apiFetch(`${import.meta.env.VITE_API_URL}/pagos/venta`, {
        method: 'POST',
        timeoutMs: 40_000,
        body: JSON.stringify({
          monto: total,
          clienteId: cliente.id,
          idempotencyKey: clave.current,
          fiadoManual: true,
          numeroVale: numeroVale.trim(),
          ocurrioEn: cuando.toISOString(),
          items: lineas.map((l) => ({ productoId: l.id, cantidad: l.cantidad, precioUnitario: l.precio })),
          pagos: [{ metodo: 'CREDITO', monto: total }],
        }),
      });
      if (!res.ok) throw new Error(await leerError(res, 'No se pudo registrar el fiado'));
      const r = await res.json();
      void Swal.fire({
        icon: 'success',
        title: r?.status === 'duplicate' ? 'Vale ya registrado' : 'Fiado registrado',
        text: r?.status === 'duplicate'
          ? r.message
          : `Quedó a nombre de ${cliente.nombre}.${r?.correoFiadoEnviado ? ' Se envió el comprobante a su correo.' : ''}`,
      });
      reiniciar();
      onRegistrado();
      onClose();
    } catch (err) {
      const msg = esErrorDeConexion(err)
        ? 'No hay conexión estable. El vale NO se registró (puedes reintentar: no se duplica).'
        : err instanceof Error ? err.message : 'Error inesperado';
      Swal.fire('No se pudo registrar', msg, 'error');
    } finally {
      setEnviando(false);
    }
  };

  const cupo = cliente ? cliente.limiteCredito - cliente.deudaActual : 0;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <form onSubmit={registrar} className="w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-white p-6 rounded shadow-lg border border-slate-200 text-sm space-y-4">
        <div className="border-b border-slate-100 pb-2">
          <h2 className="text-lg font-semibold text-slate-900">Registrar fiado desde vale de papel</h2>
          <p className="text-xs text-slate-500">Copia aquí lo que se anotó a mano cuando no había conexión. Se guarda el N° del vale y la fecha real de la compra.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">N° del vale</label>
            <input required value={numeroVale} onChange={(e) => setNumeroVale(e.target.value)} placeholder="FM-AB-0007" className="w-full p-2 rounded border border-slate-300 outline-none focus:border-slate-500 font-mono uppercase" />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">Fecha y hora de la compra</label>
            <input required type="datetime-local" value={fecha} max={ahoraLocal()} onChange={(e) => setFecha(e.target.value)} className="w-full p-2 rounded border border-slate-300 outline-none focus:border-slate-500" />
          </div>
        </div>

        <div className="relative">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">Cliente (RUT o nombre)</label>
          <input
            value={termino}
            onChange={(e) => { setTermino(e.target.value); if (cliente && e.target.value !== cliente.rut) setCliente(null); }}
            placeholder="Buscar cliente…"
            className="w-full p-2 rounded border border-slate-300 outline-none focus:border-slate-500"
          />
          {!cliente && sugerencias.length > 0 && (
            <ul className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded shadow-md max-h-48 overflow-y-auto">
              {sugerencias.map((c) => (
                <li key={c.id}>
                  <button type="button" onClick={() => { setCliente(c); setTermino(c.rut); setSugerencias([]); }} className="w-full text-left px-3 py-2 hover:bg-slate-50">
                    <span className="font-semibold">{c.nombre}</span> <span className="text-xs text-slate-500 font-mono">{c.rut}</span>
                    <span className="block text-xs text-slate-500">Cupo disponible: {clp(c.limiteCredito - c.deudaActual)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {cliente && (
            <p className={`mt-1 text-xs ${total > cupo ? 'text-red-600 font-semibold' : 'text-slate-500'}`}>
              {cliente.nombre} · cupo disponible {clp(cupo)}{total > cupo ? ' · el vale supera el cupo (el servidor lo rechazará)' : ''}
            </p>
          )}
        </div>

        <div className="relative">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">Agregar producto del vale</label>
          <input value={busquedaProducto} onChange={(e) => setBusquedaProducto(e.target.value)} placeholder="Nombre o código de barras…" className="w-full p-2 rounded border border-slate-300 outline-none focus:border-slate-500" />
          {resultadosProducto.length > 0 && (
            <ul className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded shadow-md">
              {resultadosProducto.map((p) => (
                <li key={p.id}>
                  <button type="button" onClick={() => agregar(p)} className="w-full text-left px-3 py-2 hover:bg-slate-50 flex justify-between">
                    <span>{p.descripcion}</span><span className="font-mono text-slate-500">{clp(p.precio)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {lineas.length > 0 && (
          <table className="w-full text-left">
            <thead><tr className="text-xs uppercase text-slate-500"><th>Producto</th><th className="w-20">Cant.</th><th className="w-28">Precio</th><th className="w-24 text-right">Subtotal</th><th /></tr></thead>
            <tbody>
              {lineas.map((l) => (
                <tr key={l.id} className="border-t border-slate-100">
                  <td className="py-1 pr-2">{l.descripcion}</td>
                  <td><input type="number" min="0.001" step="any" value={l.cantidad} onChange={(e) => cambiar(l.id, 'cantidad', Number(e.target.value))} className="w-16 p-1 rounded border border-slate-300 font-mono" /></td>
                  <td><input type="number" min="1" value={l.precio} onChange={(e) => cambiar(l.id, 'precio', Number(e.target.value))} className="w-24 p-1 rounded border border-slate-300 font-mono" /></td>
                  <td className="text-right font-mono">{clp(l.cantidad * l.precio)}</td>
                  <td className="text-right"><button type="button" aria-label={`Quitar ${l.descripcion}`} onClick={() => setLineas((prev) => prev.filter((x) => x.id !== l.id))} className="text-red-600 px-2">✕</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="flex items-center justify-between border-t border-slate-100 pt-3">
          <span className="text-xs uppercase tracking-wider text-slate-500">Total del vale</span>
          <span className="text-xl font-bold font-mono">{clp(total)}</span>
        </div>

        <div className="flex gap-2">
          <button type="button" onClick={onClose} disabled={enviando} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2.5 rounded text-xs uppercase tracking-wider">Cancelar</button>
          <button type="submit" disabled={enviando} className="flex-1 bg-slate-800 hover:bg-slate-900 disabled:opacity-60 text-white font-medium py-2.5 rounded text-xs uppercase tracking-wider">{enviando ? 'Registrando…' : 'Registrar fiado'}</button>
        </div>
      </form>
    </div>
  );
};
