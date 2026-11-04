import { useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";
import { apiFetch, ErrorConexion, esErrorDeConexion, leerError } from "../helpers/apiFetch";
import type { ComprobanteVenta, LineaPago } from "../types/ventas.types";
import { pedirCantidadGranel, subtotalLinea } from "../helpers/granel";
import { copiasTicket, imprimirDocumentos, imprimirTicketLocal } from "../helpers/impresion";
import { agregarVentaPendiente, siguienteNumeroLocal, type VentaPendiente } from "../helpers/colaVentas";
import { sinConexionSegura } from "../helpers/conexion";
import { getSesion } from "../helpers/session";
import { adjuntarComprobante } from "../helpers/documentosVenta";

export interface Producto {
  id: number;
  descripcion: string;
  precio: number;
  stock: number;
  codigoBarras?: string;
  esInsumo?: boolean;
  unidadMedida?: string;
  pesable?: boolean;
}

const correoValido = (c: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(c.trim());

export interface ItemCarrito extends Producto {
  cantidad: number;
  subtotal: number;
}

/** Envía el comprobante de una venta ya registrada. Nunca interrumpe la caja: el resultado sale como aviso breve. */
const enviarComprobanteCorreo = async (ventaId: number, email: string) => {
  const aviso = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 4000, timerProgressBar: true });
  try {
    const res = await apiFetch(`${import.meta.env.VITE_API_URL}/ventas/${ventaId}/ticket/enviar`, {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    if (!res.ok) throw new Error(await leerError(res, 'No se pudo enviar el correo'));
    void aviso.fire({ icon: 'success', title: `Comprobante enviado a ${email}` });
  } catch (e) {
    void Swal.fire({
      icon: 'warning',
      title: `Venta N° ${ventaId} registrada`,
      text: `No se pudo enviar el comprobante a ${email}: ${e instanceof Error ? e.message : 'error de envío'}. Puedes reenviarlo desde Movimientos.`,
    });
  }
};

const nuevaClave = () =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

/** Espera máxima de la venta: incluye la emisión de la boleta con el proveedor, por eso es generosa. */
const TIEMPO_MAX_VENTA_MS = 40_000;

export const useVentas = (
  onVentaExitosa?: () => void,
  /** Se llama cuando una venta queda guardada en el equipo (sin conexión), para bajar el stock mostrado. */
  onVentaEnCola?: (items: { id: number; cantidad: number }[]) => void,
) => {
  const [pagos, setPagos] = useState<LineaPago[]>([]);
  const [clienteId, setClienteId] = useState<number | null>(null);
  const [showModalPago, setShowModalPago] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [permiteFiado, setPermiteFiado] = useState(false);
  // Qué recibe el cliente: ticket impreso, correo (se pide la dirección) o nada
  const [comprobante, setComprobante] = useState<ComprobanteVenta>('IMPRIMIR');
  const [correoComprobante, setCorreoComprobante] = useState('');

  // Clave del intento de cobro: si la respuesta se pierde y el cajero reintenta, el servidor
  // devuelve la venta ya registrada en vez de cobrarla dos veces. Cambia si cambia el carrito.
  const claveRef = useRef<string | null>(null);
  useEffect(() => { claveRef.current = null; }, [carrito]);

  // Cobro con tarjeta ya aprobado en la máquina para este intento (clave + terminal + monto): si hay que reintentar
  // por un corte de conexión, NO se vuelve a pedir pasar la tarjeta.
  const tarjetaAprobadaRef = useRef<string | null>(null);

  useEffect(() => {
    const cargarConfig = async () => {
      try {
        const res = await apiFetch(`${import.meta.env.VITE_API_URL}/empresa/config-ventas`);
        if (res.ok) setPermiteFiado(Boolean((await res.json()).permiteFiado));
      } catch {
        // Sin configuración se asume fiado apagado
      }
    };
    cargarConfig();
  }, []);

  // AGREGAR AL CARRITO
  const sumarAlCarrito = (producto: Producto, cantidad: number) => {
    setCarrito(prev => {
      const existe = prev.find(p => p.id === producto.id);
      if (existe) {
        const nueva = Math.round((existe.cantidad + cantidad) * 1000) / 1000;
        return prev.map(p =>
          p.id === producto.id ? { ...p, cantidad: nueva, subtotal: subtotalLinea(p.precio, nueva) } : p
        );
      }
      return [...prev, { ...producto, cantidad, subtotal: subtotalLinea(producto.precio, cantidad) }];
    });
  };

  // Producto a granel: se pide el peso o la cantidad; el resto se agrega de a una unidad
  const agregarAlCarrito = (producto: Producto) => {
    if (producto.pesable) {
      void pedirCantidadGranel(producto.descripcion, producto.unidadMedida ?? 'UN', producto.precio).then(c => {
        if (c) sumarAlCarrito(producto, c);
      });
      return;
    }
    sumarAlCarrito(producto, 1);
  };

  // ELIMINAR DEL CARRITO
  const eliminarDelCarrito = (id: number) => {
    setCarrito(prev => prev.filter(p => p.id !== id));
  };

  // ACTUALIZAR CANTIDAD (unidades enteras; los productos a granel usan editarCantidadGranel)
  const actualizarCantidad = (id: number, nuevaCantidad: number) => {
    setCarrito(prev => prev.map(p => {
      if (p.id === id && !p.pesable && nuevaCantidad >= 1) {
        return { ...p, cantidad: nuevaCantidad, subtotal: subtotalLinea(p.precio, nuevaCantidad) };
      }
      return p;
    }));
  };

  // Cambia el peso o la cantidad de un producto a granel que ya está en el carrito
  const editarCantidadGranel = (id: number) => {
    const item = carrito.find(p => p.id === id);
    if (!item) return;
    void pedirCantidadGranel(item.descripcion, item.unidadMedida ?? 'UN', item.precio, item.cantidad).then(c => {
      if (c) setCarrito(prev => prev.map(p => (p.id === id ? { ...p, cantidad: c, subtotal: subtotalLinea(p.precio, c) } : p)));
    });
  };

  // TOTAL DE LA VENTA Y VACIADO
  const totalVenta = carrito.reduce((acc, p) => acc + p.subtotal, 0);
  const vaciarCarrito = () => setCarrito([]);

  const limpiarVenta = () => {
    claveRef.current = null;
    tarjetaAprobadaRef.current = null;
    setCarrito([]);
    setShowModalPago(false);
    setPagos([]);
    setClienteId(null);
    setBusqueda("");
    setComprobante('IMPRIMIR');
    setCorreoComprobante('');
  };

  // Guarda la venta en el equipo para enviarla cuando vuelva la conexión (nunca fiado)
  const guardarParaDespues = async () => {
    const sesion = getSesion();
    if (!sesion || !claveRef.current || pagos.some(l => l.metodo === 'CREDITO')) return;
    const total = Math.round(totalVenta);
    const ahora = new Date();
    const venta: VentaPendiente = {
      clave: claveRef.current,
      numeroLocal: siguienteNumeroLocal(),
      creadaEn: ahora.toISOString(),
      usuarioId: sesion.id,
      usuarioNombre: sesion.usuario,
      empresaId: sesion.empresa.id,
      total,
      metodos: pagos.map(l => l.metodo),
      items: carrito.map(p => ({ descripcion: p.descripcion, cantidad: p.cantidad, precio: p.precio })),
      payload: {
        monto: total,
        clienteId: clienteId ? Number(clienteId) : null,
        idempotencyKey: claveRef.current,
        diferida: true,
        ocurrioEn: ahora.toISOString(),
        // Precio con el que se cobró: el servidor lo respeta en ventas guardadas sin conexión
        items: carrito.map(p => ({ productoId: p.id, cantidad: p.cantidad, precioUnitario: p.precio })),
        pagos: pagos.map(l => ({
          metodo: l.metodo,
          monto: l.monto,
          referencia: l.referencia?.trim() || null,
          confirmado: l.metodo === 'TRANSFERENCIA' ? true : undefined,
        })),
      },
      estado: 'pendiente',
      intentos: 0,
    };

    try {
      await agregarVentaPendiente(venta);
    } catch {
      Swal.fire('No se pudo guardar', 'Este equipo no permitió guardar la venta. Anótala a mano y regístrala cuando vuelva la conexión.', 'error');
      return;
    }

    // Sin conexión no hay cómo enviar correo: se imprime el comprobante local si el cliente lo quiere, o si el local guarda copia
    if (comprobante === 'IMPRIMIR' || copiasTicket() === 2) void imprimirTicketLocal({
      numeroLocal: venta.numeroLocal,
      fecha: ahora,
      empresa: sesion.empresa.razonSocial,
      items: venta.items,
      total,
      metodos: venta.metodos,
    });
    onVentaEnCola?.(carrito.map(p => ({ id: p.id, cantidad: p.cantidad })));
    limpiarVenta();
    void Swal.fire({
      icon: 'success',
      title: `Venta guardada (N° local ${venta.numeroLocal})`,
      text: 'Se enviará sola cuando vuelva la conexión y ahí se emitirá la boleta.',
      timer: 3500,
      showConfirmButton: false,
    });
  };

  // CONFIRMAR VENTA FINAL
  const confirmarVentaFinal = async () => {
    const total = Math.round(totalVenta);
    const suma = pagos.reduce((acc, l) => acc + l.monto, 0);

    if (pagos.length === 0) {
      Swal.fire('Atención', 'Selecciona al menos una forma de pago', 'warning');
      return;
    }
    if (pagos.some(l => !(l.monto > 0)) || suma !== total) {
      Swal.fire('Atención', `Los pagos suman $${suma.toLocaleString('es-CL')} y el total es $${total.toLocaleString('es-CL')}`, 'warning');
      return;
    }
    const tarjeta = pagos.find(l => l.metodo === 'TARJETA');
    if (comprobante === 'CORREO' && !correoValido(correoComprobante)) {
      Swal.fire('Atención', 'Escribe un correo válido para enviar el comprobante, o elige otra opción.', 'warning');
      return;
    }
    const transferencia = pagos.find(l => l.metodo === 'TRANSFERENCIA');
    if (transferencia && !transferencia.confirmado) {
      Swal.fire('Atención', 'Confirma que recibiste la transferencia', 'warning');
      return;
    }
    if (pagos.some(l => l.metodo === 'CREDITO') && !clienteId) {
      Swal.fire('Atención', 'Debes seleccionar un cliente para vender a crédito', 'warning');
      return;
    }

    // El servidor toma empresa, cajero y sucursal del token y recalcula el total con sus precios.
    // Solo se envía qué se vende, cuánto, cómo se paga y el total que el cajero está viendo.
    if (!claveRef.current) claveRef.current = nuevaClave();
    const datosVenta = {
      monto: total,
      clienteId: clienteId ? Number(clienteId) : null,
      idempotencyKey: claveRef.current,
      copiasTicket: copiasTicket(),
      // Cliente sin papel (correo o nada) pero el local tiene 2 copias activadas: se imprime solo la del local
      soloCopiaLocal: comprobante !== 'IMPRIMIR' && copiasTicket() === 2,
      items: carrito.map(p => ({ productoId: p.id, cantidad: p.cantidad })),
      pagos: pagos.map(l => ({
        metodo: l.metodo,
        monto: l.monto,
        referencia: l.referencia?.trim() || null,
        confirmado: l.metodo === 'TRANSFERENCIA' ? true : undefined,
      })),
    };
    const comprobanteElegido = comprobante;
    const soloLocalElegido = comprobante !== 'IMPRIMIR' && copiasTicket() === 2;
    const correoElegido = correoComprobante.trim();

    const conCredito = pagos.some(l => l.metodo === 'CREDITO');
    const marcaTarjeta = tarjeta ? `${claveRef.current}|${tarjeta.monto}` : null;

    try {
      if (tarjeta && tarjetaAprobadaRef.current !== marcaTarjeta) {
        // Espera de confirmación manual del cobro en la máquina física
        const confirmacionPOS = await Swal.fire({
          title: 'Cobro con tarjeta',
          html: `
            <p style="font-size: 1.2rem; font-weight: bold; margin-bottom: 10px;">
              Monto a cobrar: $${tarjeta.monto.toLocaleString('es-CL')}
            </p>
            <p style="color: #64748b;">
              Pase la tarjeta en la máquina física. Cuando la pantalla de la máquina indique <b>APROBADO</b>, confirme la operación aquí abajo.
            </p>
          `,
          icon: 'info',
          showCancelButton: true,
          confirmButtonColor: '#10B981',
          cancelButtonColor: '#EF4444',
          confirmButtonText: '✓ Pago Aprobado en Máquina',
          cancelButtonText: '✕ Cancelar / Rechazado',
          allowOutsideClick: false
        });
        if (!confirmacionPOS.isConfirmed) {
          Swal.fire('Venta no registrada', 'El cobro no fue confirmado.', 'info');
          return;
        }
        tarjetaAprobadaRef.current = marcaTarjeta;
      }

      // Si ya se sabe que no hay conexión, no se espera a que el envío falle por tiempo
      if (sinConexionSegura()) throw new ErrorConexion(false);

      Swal.fire({
        title: 'Procesando Venta...',
        text: 'Guardando registro y emitiendo boleta',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      const res = await apiFetch(`${import.meta.env.VITE_API_URL}/pagos/venta`, {
        method: 'POST',
        body: JSON.stringify(datosVenta),
        timeoutMs: TIEMPO_MAX_VENTA_MS
      });
      if (!res.ok) throw new Error(await leerError(res, "Error al procesar el pago"));
      const respuestaBackend = await res.json();

      const duplicada = respuestaBackend?.status === 'duplicate';
      const hayCredito = pagos.some(l => l.metodo === 'CREDITO');

      // Ticket 80 mm (y vale de crédito si corresponde): se imprime desde el navegador sin abrir el PDF.
      // No se espera: la caja queda libre mientras sale el ticket.
      // El vale de crédito para firmar siempre se imprime; el resto según lo que pidió el cliente
      if (!duplicada && (hayCredito || comprobanteElegido === 'IMPRIMIR' || soloLocalElegido)) {
        // Si hay vale, el servidor entrega ticket + vale ya unidos: un solo trabajo de impresión
        void imprimirDocumentos(
          respuestaBackend?.impresionPdf ? [respuestaBackend.impresionPdf] : [respuestaBackend?.boletaPdf, respuestaBackend?.valePdf],
          `Venta_${respuestaBackend?.ventaId ?? ''}`,
        );
      }

      // Comprobante por correo: la venta ya está registrada; si el envío falla, se avisa y se puede reenviar desde Movimientos
      if (!duplicada && comprobanteElegido === 'CORREO' && respuestaBackend?.ventaId) {
        void enviarComprobanteCorreo(respuestaBackend.ventaId, correoElegido);
      }

      // Boleta electrónica que no salió (la venta SÍ quedó registrada y se imprimió el comprobante interno)
      const avisoDte: string = respuestaBackend?.dteAviso || '';
      const hayTransferencia = !duplicada && respuestaBackend?.tieneTransferencia && respuestaBackend?.ventaId;

      if (!duplicada && avisoDte && ['PENDIENTE', 'REVISAR'].includes(respuestaBackend?.dteEstado)) {
        // No se bloquea la caja: el aviso es no modal para el flujo y luego, si corresponde, se ofrece el comprobante
        void Swal.fire({
          icon: 'warning',
          title: `Venta N° ${respuestaBackend.ventaId} registrada`,
          text: avisoDte,
          confirmButtonText: 'Entendido',
        }).then(() => { if (hayTransferencia) void adjuntarComprobante(respuestaBackend.ventaId); });
      } else if (hayTransferencia) {
        // Transferencia: se ofrece adjuntar el comprobante recién recibido (opcional; se puede hacer luego en Movimientos)
        void adjuntarComprobante(respuestaBackend.ventaId);
      } else {
        // Fiado sin vale generado: la venta quedó, pero no hay papel para firmar; se avisa para no dejarlo pasar
        const faltaVale = !duplicada && hayCredito && !respuestaBackend?.valePdf;
        void Swal.fire({
          title: duplicada ? 'Venta ya registrada' : (hayCredito ? '¡Venta a Crédito Registrada!' : '¡Venta Completada!'),
          text: duplicada
            ? respuestaBackend.message
            : faltaVale
              ? 'No se pudo generar el vale para firmar. Reimprímelo desde Movimientos antes de despachar.'
              : (hayCredito && respuestaBackend?.correoFiadoEnviado ? 'Se envió el comprobante al correo del cliente.' : ''),
          icon: duplicada ? 'info' : (faltaVale ? 'warning' : 'success'),
          timer: duplicada || faltaVale ? undefined : (hayCredito ? 4000 : 2500)
        });
      }

      limpiarVenta();

      if (onVentaExitosa) onVentaExitosa();

    } catch (err: unknown) {
      // La clave se conserva a propósito: si la venta sí se guardó y solo se perdió la respuesta, el reintento no cobra doble
      if (esErrorDeConexion(err)) {
        const decision = await Swal.fire({
          icon: 'warning',
          title: 'No pudimos confirmar la venta',
          html: `<div style="text-align:left;font-size:14px;line-height:1.5">
            <p>${err.porTiempo ? 'El servidor tardó demasiado en responder.' : 'Se cortó la conexión con el servidor.'}
            Es posible que la venta <b>sí</b> haya quedado registrada.</p>
            <p style="margin-top:8px"><b>Reintentar</b>: el sistema reconoce la misma venta y <b>no la cobra dos veces</b>.
            ${tarjeta ? 'El cobro en la máquina ya está aprobado: <b>no lo repitas</b>.' : ''}</p>
            ${conCredito
              ? `<p style="margin-top:8px;color:#b45309"><b>Venta a crédito (fiado):</b> no se puede guardar sin conexión. Anota los datos en el vale manual y regístralo cuando vuelva la conexión.</p>`
              : `<p style="margin-top:8px"><b>Guardar y enviar después</b>: la venta queda en este equipo y se registra sola (con su boleta) al volver la conexión.</p>`}
            <p style="margin-top:8px;color:#64748b">Con <b>Esperar</b> no se guarda nada: revisa Movimientos antes de cobrar de nuevo.</p></div>`,
          showCancelButton: true,
          showDenyButton: !conCredito,
          confirmButtonText: 'Reintentar',
          denyButtonText: 'Guardar y enviar después',
          cancelButtonText: 'Esperar',
          confirmButtonColor: '#0F172A',
          denyButtonColor: '#16A34A',
          allowOutsideClick: false,
        });
        if (decision.isConfirmed) await confirmarVentaFinal();
        else if (decision.isDenied) await guardarParaDespues();
        return;
      }
      const msg = err instanceof Error ? err.message : "Error inesperado";
      Swal.fire('Error en la venta', msg, 'error');
    }
  };

  return {
    carrito,
    setCarrito,
    agregarAlCarrito,
    eliminarDelCarrito,
    actualizarCantidad,
    totalVenta,
    vaciarCarrito,
    confirmarVentaFinal,
    showModalPago,
    setShowModalPago,
    busqueda,
    setBusqueda,
    pagos,
    setPagos,
    permiteFiado,
    editarCantidadGranel,
    comprobante,
    setComprobante,
    correoComprobante,
    setCorreoComprobante,
    clienteId,
    setClienteId
  };
};
