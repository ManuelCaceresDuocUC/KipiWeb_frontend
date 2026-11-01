# KIPIPOS · Etapa 3B (frontend) — Impresión automática, correo y comprobantes

**Estado de verificación:** NO fue compilado con las dependencias reales (sin acceso a npm); solo revisión de tipos con un reemplazo de las librerías, sin errores propios. Corre `npm run build` y pásame lo que salga. **No pude probar la impresión en un navegador real.**

## Qué hace
- Al vender se imprime el ticket 80 mm (y el vale si hay crédito) desde el navegador, **sin descargar ni abrir el PDF**. Si el navegador no deja imprimir, descarga el PDF como respaldo.
- Interruptor "🖨️ Imprimir ticket al vender" en *Opciones Operativas* (se recuerda por equipo).
- Venta con transferencia: se ofrece adjuntar la foto/PDF del comprobante (opcional, se puede hacer después).
- *Movimientos → detalle de venta:* reimprimir ticket, enviar por correo, reimprimir vale, adjuntar/reemplazar/ver comprobante.
- Abono de cliente: imprime el comprobante de abono.
- Estado de cuenta: botón "Enviar por correo".

## IMPORTANTE: impresión sin diálogo
Un sitio web **no puede** saltarse el diálogo de impresión por seguridad. Para que el ticket salga directo hay que iniciar Chrome/Edge del equipo de caja con `--kiosk-printing` y dejar la impresora térmica como **predeterminada**:
1. Clic derecho en el acceso directo de Chrome → Propiedades.
2. En "Destino" agrega al final, tras un espacio: `--kiosk-printing`
3. Cierra todas las ventanas de Chrome y ábrelo desde ese acceso directo.
4. En Windows: Configuración → Impresoras → impresora térmica 80 mm → "Establecer como predeterminada". En sus preferencias, tamaño de papel 80 mm y márgenes en 0.

Sin ese parámetro funciona igual, pero aparece el diálogo de impresión en cada venta (un clic en "Imprimir"). Probado solo en teoría: Firefox y Safari son menos confiables imprimiendo desde PDF embebido (usará la descarga de respaldo).

## Orden de despliegue
Primero el backend (3B), después este frontend.
