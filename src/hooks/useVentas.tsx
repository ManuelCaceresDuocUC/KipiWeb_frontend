import { useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";
import { apiFetch, leerError } from "../helpers/apiFetch";
import type { LineaPago } from "../types/ventas.types";
import { imprimirDocumentos } from "../helpers/impresion";
import { adjuntarComprobante } from "../helpers/documentosVenta";

export interface Producto {
  id: number;
  descripcion: string;
  precio: number;
  stock: number;
  codigoBarras?: string;
  esInsumo?: boolean;
}

export interface ItemCarrito extends Producto {
  cantidad: number;
  subtotal: number;
}

const nuevaClave = () =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export const useVentas = (onVentaExitosa?: () => void) => {
  const [pagos, setPagos] = useState<LineaPago[]>([]);
  const [clienteId, setClienteId] = useState<number | null>(null);
  const [showModalPago, setShowModalPago] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [permiteFiado, setPermiteFiado] = useState(false);

  // Clave del intento de cobro: si la respuesta se pierde y el cajero reintenta, el servidor
  // devuelve la venta ya registrada en vez de cobrarla dos veces. Cambia si cambia el carrito.
  const claveRef = useRef<string | null>(null);
  useEffect(() => { claveRef.current = null; }, [carrito]);

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
  const agregarAlCarrito = (producto: Producto) => {
    setCarrito(prev => {
      const existe = prev.find(p => p.id === producto.id);
      if (existe) {
        return prev.map(p =>
          p.id === producto.id
            ? { ...p, cantidad: p.cantidad + 1, subtotal: (p.cantidad + 1) * p.precio }
            : p
        );
      }
      return [...prev, { ...producto, cantidad: 1, subtotal: producto.precio }];
    });
  };

  // ELIMINAR DEL CARRITO
  const eliminarDelCarrito = (id: number) => {
    setCarrito(prev => prev.filter(p => p.id !== id));
  };

  // ACTUALIZAR CANTIDAD
  const actualizarCantidad = (id: number, nuevaCantidad: number) => {
    setCarrito(prev => prev.map(p => {
      if (p.id === id) {
        if (nuevaCantidad >= 1) {
          return { ...p, cantidad: nuevaCantidad, subtotal: nuevaCantidad * p.precio };
        }
      }
      return p;
    }));
  };

  // TOTAL DE LA VENTA Y VACIADO
  const totalVenta = carrito.reduce((acc, p) => acc + p.subtotal, 0);
  const vaciarCarrito = () => setCarrito([]);

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
    if (tarjeta && !tarjeta.proveedorTarjeta) {
      Swal.fire('Atención', 'Selecciona la terminal (Getnet, Mercado Pago o Transbank)', 'warning');
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
      items: carrito.map(p => ({ productoId: p.id, cantidad: p.cantidad })),
      pagos: pagos.map(l => ({
        metodo: l.metodo,
        monto: l.monto,
        proveedorTarjeta: l.metodo === 'TARJETA' ? l.proveedorTarjeta : null,
        referencia: l.referencia?.trim() || null,
        confirmado: l.metodo === 'TRANSFERENCIA' ? true : undefined,
      })),
    };

    try {
      if (tarjeta) {
        // Espera de confirmación manual del cobro en la máquina física
        const confirmacionPOS = await Swal.fire({
          title: `Cobro en Máquina (${tarjeta.proveedorTarjeta})`,
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
      }

      Swal.fire({
        title: 'Procesando Venta...',
        text: 'Guardando registro y emitiendo boleta',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      const res = await apiFetch(`${import.meta.env.VITE_API_URL}/pagos/venta`, {
        method: 'POST',
        body: JSON.stringify(datosVenta)
      });
      if (!res.ok) throw new Error(await leerError(res, "Error al procesar el pago"));
      const respuestaBackend = await res.json();

      const duplicada = respuestaBackend?.status === 'duplicate';
      const hayCredito = pagos.some(l => l.metodo === 'CREDITO');

      // Ticket 80 mm (y vale de crédito si corresponde): se imprime desde el navegador sin abrir el PDF.
      // No se espera: la caja queda libre mientras sale el ticket.
      if (!duplicada) {
        void imprimirDocumentos([respuestaBackend?.boletaPdf, respuestaBackend?.valePdf], `Venta_${respuestaBackend?.ventaId ?? ''}`);
      }

      // Transferencia: se ofrece adjuntar el comprobante recién recibido (opcional; se puede hacer luego en Movimientos).
      // Si no, aviso breve de venta lista. Ninguno de los dos bloquea la limpieza de la caja.
      if (!duplicada && respuestaBackend?.tieneTransferencia && respuestaBackend?.ventaId) {
        void adjuntarComprobante(respuestaBackend.ventaId);
      } else {
        void Swal.fire({
          title: duplicada ? 'Venta ya registrada' : (hayCredito ? '¡Venta a Crédito Registrada!' : '¡Venta Completada!'),
          text: duplicada ? respuestaBackend.message : '',
          icon: duplicada ? 'info' : 'success',
          timer: duplicada ? undefined : 2500
        });
      }

      // Limpieza de estados
      claveRef.current = null;
      setCarrito([]);
      setShowModalPago(false);
      setPagos([]);
      setClienteId(null);
      setBusqueda("");

      if (onVentaExitosa) onVentaExitosa();

    } catch (err: unknown) {
      // La clave se conserva a propósito: si la venta sí se guardó y solo se perdió la respuesta, el reintento no cobra doble
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
    clienteId,
    setClienteId
  };
};
