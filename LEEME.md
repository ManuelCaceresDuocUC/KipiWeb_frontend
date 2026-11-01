# KIPIPOS · Etapa 4 (frontend) — Facturación electrónica

**Estado de verificación:** NO compilado con las dependencias reales (sin npm); revisión de tipos con reemplazos, sin errores propios. Corre `npm run build` y pásame lo que salga.

## Qué cambia
- Configuración DTE: solo proveedores soportados (OpenFactura y LibreDTE beta); se quitó SimpleFactura/relBase (no están implementados). La prueba de conexión muestra el resultado real del proveedor.
- Al vender, si la boleta no salió, aparece un aviso claro (la venta queda registrada igual y se imprime el comprobante interno).
- Movimientos: etiqueta "BOLETA PENDIENTE/REVISAR" en la lista; en el detalle, reintentar boleta, reimprimir la boleta emitida y, para administradores, consultar/reintentar la nota de crédito de una venta anulada. Al anular se informa si la nota de crédito se emitió.

## Orden de despliegue
Backend primero (con `DTE_ENCRYPTION_KEY` ya cargada en Render), después este frontend.
