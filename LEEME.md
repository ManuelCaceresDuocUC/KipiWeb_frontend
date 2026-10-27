# KIPIPOS · Etapa 1 · Frontend

> **Importante: este código NO fue compilado ni ejecutado.** No tuve acceso a npm. Solo hice una revisión de tipos
> parcial con TypeScript. Antes de subir, prueba en tu equipo: `npm ci && npm run build` y un recorrido manual
> (login → abrir caja → vender → cerrar caja).

Se despliega **junto con el backend de la etapa 1** (cambió el formato de la respuesta del login).

## Cómo aplicarlo
Copia `src/` de este ZIP sobre tu repo, o `git apply etapa1.patch`. Borra lo de `ELIMINAR.txt`.

## Qué cambió
- `helpers/session.ts` (nuevo): única fuente de la sesión. Se acabaron los valores de relleno `|| "1"` (si faltaba el dato, el sistema operaba como la empresa 1).
- `apiFetch`: si el servidor responde 401 se cierra la sesión y se manda a `/login`; 403 solo avisa (no expulsa). Nuevo `leerError()` para mostrar el mensaje real del servidor.
- `ProtectedRoute`: exige token válido **y no vencido**.
- Login: ya no descarga la lista de usuarios al abrir la pantalla; muestra el motivo real (clave incorrecta, empresa sin pago, demasiados intentos).
- Ventas: solo se envía qué se vende (producto y cantidad) y el total mostrado; el servidor decide empresa, cajero y precios. El POS ahora carga hasta 2.000 productos (antes solo los primeros 20).
- Caja: el cierre envía solo el efectivo contado. Se eliminó el resumen con cifras inventadas que aparecía cuando fallaba el servidor.
- Configuración DTE: la API Key guardada se muestra enmascarada y no se reenvía; "Probar conexión" muestra lo que realmente verificó el servidor.
- Registro de empresa: valida RUT (módulo 11), usuario ≥ 3 y contraseña ≥ 8 (también empleados) y muestra los mensajes del servidor.
- Recetas: ahora usa la sesión (antes el POST no enviaba el token) y no fuerza la categoría `id: 1` (era de otra empresa).
- Menú: el vendedor no ve "Administración". El cierre de sesión ya no borra un cierre de caja pendiente.
- Home: el video de bienvenida (era un enlace de ejemplo) y las "novedades" (datos de ejemplo) solo se muestran si hay contenido real.

## Pendiente para la Etapa 6 (UI/UX)
En `Home.tsx` hay botones de ejemplo (`alert('Abriendo centro de ayuda…')`, teléfono `+56 9 1234 5678`) y rutas (`/productos`, `/caja/cierre`) que probablemente no existen; el WhatsApp de soporte en Configuración DTE es `56900000000`. Reemplazar por datos reales antes del lanzamiento.
