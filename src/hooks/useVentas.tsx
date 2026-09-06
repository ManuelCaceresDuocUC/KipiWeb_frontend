import { useState } from "react";
import Swal from "sweetalert2";
import { apiFetch } from "../helpers/apiFetch";

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

export const useVentas = (onVentaExitosa?: () => void) => {
  const [metodoPago, setMetodoPago] = useState<"EFECTIVO" | "TARJETA" | "CREDITO" | "">("");
  const [proveedorTarjeta, setProveedorTarjeta] = useState<"GETNET" | "MERCADOPAGO" | "TRANSBANK" | null>(null);
  const [clienteId, setClienteId] = useState<number | null>(null);
  const [showModalPago, setShowModalPago] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  
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
    if (!metodoPago) return;

    // Validación de tarjeta
    if (metodoPago === 'TARJETA' && !proveedorTarjeta) {
      Swal.fire('Atención', 'Selecciona la terminal (Getnet, Mercado Pago o Transbank)', 'warning');
      return;
    }

    // Validación de crédito
    if (metodoPago === 'CREDITO' && !clienteId) {
      Swal.fire('Atención', 'Debes seleccionar un cliente para generar un Vale de Crédito', 'warning');
      return;
    }

    const usuarioIdLogueado = localStorage.getItem('usuarioId') || "1";
    const empresaIdLogueada = localStorage.getItem('empresaId') || "1";

    const datosVenta = {
      monto: Math.round(totalVenta),
      usuarioId: Number(usuarioIdLogueado),
      empresaId: Number(empresaIdLogueada), 
      clienteId: clienteId ? Number(clienteId) : null,
      items: carrito.map(p => ({
        productoId: p.id,
        descripcion: p.descripcion, 
        precio: p.precio,
        cantidad: p.cantidad,
        subtotal: p.subtotal
      }))
    };

    try {
      let respuestaBackend;

      if (metodoPago === 'TARJETA') {
        // 1️⃣ MODAL DE ESPERA / CONFIRMACIÓN MANUAL
        const confirmacionPOS = await Swal.fire({
          title: `Cobro en Máquina (${proveedorTarjeta})`,
          html: `
            <p style="font-size: 1.2rem; font-weight: bold; margin-bottom: 10px;">
              Monto a cobrar: $${datosVenta.monto.toLocaleString('es-CL')}
            </p>
            <p style="color: #64748b;">
              Pase la tarjeta en la máquina física. Cuando la pantalla de la máquina indique <b>APROBADO</b>, confirme la operación aquí abajo.
            </p>
          `,
          icon: 'info',
          showCancelButton: true,
          confirmButtonColor: '#10B981', // Verde éxito
          cancelButtonColor: '#EF4444',  // Rojo rechazo
          confirmButtonText: '✓ Pago Aprobado en Máquina',
          cancelButtonText: '✕ Cancelar / Rechazado',
          allowOutsideClick: false
        });

        // Si el pago falló en la maquinita o el cajero cancela
        if (!confirmacionPOS.isConfirmed) {
          Swal.fire('Venta no registrada', 'El cobro no fue confirmado.', 'info');
          return;
        }

        // 2️⃣ Muestra el spinner de carga mientras guarda en la nube
        Swal.fire({
          title: 'Procesando Venta...',
          text: 'Guardando registro y emitiendo boleta',
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading()
        });

        // 3️⃣ Guarda directo en AWS
        const urlAws = `${import.meta.env.VITE_API_URL}/pagos/cobrar`; 
        const resAws = await apiFetch(urlAws, {
          method: 'POST',
          body: JSON.stringify(datosVenta)
        });

        if (!resAws.ok) throw new Error("Fallo al guardar en la nube tras confirmación del cobro");
        respuestaBackend = await resAws.json();

      } else if (metodoPago === 'CREDITO') {
        Swal.fire({
          title: 'Procesando...',
          text: 'Generando vale e imprimiendo...',
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading()
        });

        const res = await apiFetch(`${import.meta.env.VITE_API_URL}/pagos/credito`, {
          method: 'POST',
          body: JSON.stringify(datosVenta)
        });

        respuestaBackend = await res.json();
        if (!res.ok) throw new Error(respuestaBackend.message || "Error al registrar el vale de crédito");

      } else {
        // Efectivo
        Swal.fire({
          title: 'Procesando...',
          text: 'Registrando venta...',
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading()
        });

        const res = await apiFetch(`${import.meta.env.VITE_API_URL}/pagos/efectivo`, {
          method: 'POST',
          body: JSON.stringify(datosVenta)
        });

        respuestaBackend = await res.json();
        if (!res.ok) throw new Error(respuestaBackend.message || "Error al procesar el pago en la nube");
      }

      // Si el servidor devuelve un PDF en base64 para descargar localmente en navegador
      if (respuestaBackend?.boletaPdf) {
        const linkSource = `data:application/pdf;base64,${respuestaBackend.boletaPdf}`;
        const downloadLink = document.createElement("a");
        downloadLink.href = linkSource;
        downloadLink.download = `Boleta_${Date.now()}.pdf`;
        downloadLink.click();
      }

      Swal.fire({ 
        title: metodoPago === 'CREDITO' ? '¡Vale de Crédito Emitido!' : '¡Venta Completada!', 
        text: metodoPago === 'CREDITO' ? 'El vale ha sido guardado e imprimiéndose en el terminal.' : '',
        icon: 'success', 
        timer: 2500 
      });

      // Limpieza de estados
      setCarrito([]);
      setShowModalPago(false);
      setMetodoPago("");
      setProveedorTarjeta(null); 
      setClienteId(null);
      setBusqueda("");

      if (onVentaExitosa) onVentaExitosa();

    } catch (err: unknown) {
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
    metodoPago,
    setMetodoPago,
    proveedorTarjeta,
    setProveedorTarjeta,
    clienteId,
    setClienteId
  };
};