# KIPIPOS · Etapa 3A (frontend) — Ventas y caja

**Verificación:** no pude hacer `npm run build` (sin acceso a npm); solo un chequeo de tipos con shims, sin errores reales en lo mío. Corre `npm run build` y pásame lo que salga.

- **Cobro mixto** (`ModalPago`): combina efectivo, tarjeta, transferencia y crédito; muestra lo que falta por cubrir y bloquea confirmar hasta que los pagos sumen el total. Transferencia exige marcar "ya llegó". Crédito valida el cupo del cliente. El botón "Crédito" solo aparece si la empresa tiene el fiado activo.
- **Reintento seguro:** cada cobro lleva una clave; si se pierde la respuesta y se reintenta, el servidor devuelve la venta ya registrada.
- **Movimientos:** ventas anuladas marcadas, desglose de pagos y botón "Anular venta" (solo admin, con motivo).
- **Administración:** interruptor de fiado, edición del límite por cliente y estado de cuenta desde el directorio.
- **Consultar/Abonar cliente:** botón "Estado de cuenta" y abono por transferencia.
- **Resumen de caja:** muestra transferencias.

Despliega este frontend **después** del backend y del SQL 05.
