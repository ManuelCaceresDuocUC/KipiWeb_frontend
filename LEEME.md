# Etapa 6B – Revisión de pantallas internas (solo frontend)
Copia sobre `kipiweb_frontend`. No requiere backend. Sin `npm run build` (sin registro npm); tipos revisados con tsc parcial.

## Corregido
- **Menú lateral:** la página *Recetas* no tenía enlace (quedaba huérfana) → ahora aparece para administradores. Inventario, Recetas y Administración solo se muestran a admin (antes el vendedor veía Inventario y rebotaba). Logo del menú arreglado (estaba mal anidado), usuario y empresa visibles abajo, etiquetas de accesibilidad.
- **Doble relleno / doble scroll:** casi todas las pantallas se envolvían en `min-h-screen + padding` dentro del layout, que ya lo trae. Corregido en Inicio, Caja, Inventario, Movimientos, Recetas, Administración y Configuración DTE.
- **Celular:** tablas de Inventario, Movimientos y Recetas con scroll horizontal; filtros que se apilan; botones de acciones ya no rompen la fila.
- **Inventario:** validación de números negativos/vacíos, evita doble envío (botón "Guardando…"), Escape o clic fuera cierra el formulario.
- **Montos:** formato chileno ($1.234.567) en todas las pantallas (había mezcla con `$1,234,567`).
- **Errores:** al eliminar/editar productos y recetas ahora se muestra el motivo real del servidor (p. ej. "tiene ventas asociadas") en lugar de un mensaje genérico.
- **Accesibilidad:** diálogos con rol y cierre con clic fuera, acordeón de Recetas usable con teclado, `console.log` de depuración eliminados.

## No tocado (pendiente)
Pantalla para crear usuarios después del registro; edición de recetas desde Inventario (se hace en Recetas).
