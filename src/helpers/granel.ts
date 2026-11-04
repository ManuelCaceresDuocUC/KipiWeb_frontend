import Swal from 'sweetalert2';

/** Cantidad para mostrar: hasta 3 decimales, coma decimal (0,35 / 2 / 1,25). */
export const formatoCantidad = (n: number): string =>
  Number(n).toLocaleString('es-CL', { maximumFractionDigits: 3 });

/** Subtotal de una línea en pesos enteros (igual que el servidor: cada línea se redondea). */
export const subtotalLinea = (precio: number, cantidad: number): number => Math.round(precio * cantidad);

/** Lee una cantidad escrita por una persona ("0,350", "1.5", "2"). null si no es válida. */
export const leerCantidad = (texto: string): number | null => {
  const limpio = texto.trim().replace(/\s/g, '').replace(',', '.');
  if (!/^\d*\.?\d+$|^\d+\.$/.test(limpio)) return null;
  const n = Number(limpio);
  if (!Number.isFinite(n)) return null;
  const redondeado = Math.round(n * 1000) / 1000;
  return redondeado > 0 && redondeado <= 100_000 ? redondeado : null;
};

/**
 * Pide el peso o la cantidad de un producto a granel. Muestra el total en vivo para que el cajero confirme con
 * el cliente. Devuelve null si cancela.
 */
export const pedirCantidadGranel = async (
  nombre: string,
  unidad: string,
  precio: number,
  actual?: number,
): Promise<number | null> => {
  const u = unidad && unidad !== 'UN' ? unidad.toLowerCase() : 'unidades';
  const r = await Swal.fire({
    title: nombre,
    html:
      `<p style="font-size:13px;color:#64748B;margin-bottom:8px">$${Math.round(precio).toLocaleString('es-CL')} por ${u}</p>` +
      `<p id="granel-total" style="font-size:20px;font-weight:700;margin-top:10px">$0</p>`,
    input: 'text',
    inputLabel: `Cantidad en ${u} (ej: 0,350)`,
    inputValue: actual ? String(actual).replace('.', ',') : '',
    inputAttributes: { inputmode: 'decimal', autocomplete: 'off', autofocus: 'true' },
    showCancelButton: true,
    confirmButtonText: 'Agregar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#0F172A',
    didOpen: () => {
      const input = Swal.getInput();
      const total = document.getElementById('granel-total');
      const refrescar = () => {
        const c = leerCantidad(input?.value ?? '');
        if (total) total.textContent = c ? `$${subtotalLinea(precio, c).toLocaleString('es-CL')}` : '$0';
      };
      input?.addEventListener('input', refrescar);
      refrescar();
      input?.focus();
      input?.select();
    },
    inputValidator: (v) => (leerCantidad(v) ? undefined : 'Escribe una cantidad válida mayor a 0 (hasta 3 decimales).'),
  });
  return r.isConfirmed ? leerCantidad(String(r.value)) : null;
};
