# Etapa 6 – Pulido de UI (solo frontend)
Copia sobre `kipiweb_frontend` (mismas rutas). No requiere cambios de backend. No se pudo ejecutar `npm run build` aquí (sin npm registry): solo revisé tipos con tsc parcial.

- **Portada** rehecha: navbar fijo (Funciones, Cómo funciona, Planes, Preguntas, Contacto + Iniciar sesión / Crear cuenta, menú móvil), hero con maqueta del POS en código, funciones, 3 pasos, sección de boletas, card de plan, FAQ y footer con contacto. Se quitaron los testimonios inventados y la imagen externa.
- **/planes** (nueva): card + tabla comparativa. Se ajusta sola si agregas planes en `src/config/planes.ts`.
- **Precio**: única fuente en `src/config/planes.ts` ($25.000/mes). Si cambias el plan en Flow, cámbialo ahí.
- **Contacto**: única fuente en `src/config/contacto.ts` (correo y +56 9 9381 5620).
- **Registro**: resumen del plan y precio correcto, aviso de pago seguro, autocompletado. **Login**: logo corregido, enlace a crear cuenta.
- **Home**: sin `alert()`; accesos rápidos a rutas que existen (antes /productos y /caja/cierre llevaban a la portada); soporte por WhatsApp/correo reales.
- **ConfiguracionDTE**: WhatsApp real.
