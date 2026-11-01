# Etapa 7 – Frontend

Copia sobre `kipiweb_frontend`. No pude ejecutar `npm run build` (sin npm registry); revisé tipos con tsc parcial.

## Variable en Vercel
`VITE_TURNSTILE_SITE_KEY` = Site key de Cloudflare Turnstile (pública). Sin ella no se muestra el captcha (si el backend sí tiene `TURNSTILE_SECRET`, rechazará los envíos: configura ambas o ninguna).

### Crear el widget de Turnstile (gratis)
Cloudflare → Turnstile → Add widget → dominios: `kipipos.cl`, `www.kipipos.cl` y `localhost` → modo *Managed* → copia **Site key** (Vercel) y **Secret key** (Render).

## Páginas nuevas
`/terminos`, `/privacidad`, `/contacto`, `/recuperar`, `/restablecer`. Footer con enlaces a las tres primeras. Login con "¿Olvidaste tu contraseña?".

## Registro
Verificación de correo con código → casilla de aceptación (con enlaces) → ventana de confirmación con precio, renovación automática, cancelación y reembolsos → Flow. Empleados con correo opcional.

## Administración
Tabla "Personal del Sistema": botones para cambiar la contraseña y el correo de cada usuario.

## ⚠ Legal: revisar antes de publicar
Los textos de Términos y Privacidad son un **borrador**; un abogado debe revisarlos. Completa en `src/config/legal.ts`: razón social, RUT, domicilio y ciudad de tribunales de la SpA, y confirma: días de conservación (90), si el precio incluye IVA, y el tope de responsabilidad (3 meses de pagos). Cada vez que cambies los textos, sube `LEGAL.version` y `LEGAL_TERMINOS_VERSION` en Render.
