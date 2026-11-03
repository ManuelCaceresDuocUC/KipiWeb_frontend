/* Service worker de KIPI: permite abrir la aplicación sin conexión.
 * - Solo toca peticiones GET del propio sitio. La API (otro dominio) nunca pasa por aquí.
 * - Páginas: red primero (con tiempo máximo si ya hay copia) y, si falla, la copia guardada de la app.
 * - /assets/* (archivos con hash en el nombre): se guardan al usarse y se sirven desde el dispositivo.
 * Para forzar que todos los dispositivos renueven sus copias, cambiar VERSION.
 */
const VERSION = 'v1';
const CACHE_APP = `kipi-app-${VERSION}`;
const CACHE_ASSETS = `kipi-assets-${VERSION}`;
const ESPERA_PAGINA_MS = 3500;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_APP)
      .then((c) => c.addAll(['/index.html', '/manifest.webmanifest', '/kipi.png', '/icon-192.png']))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((nombres) =>
        Promise.all(
          nombres
            .filter((n) => n.startsWith('kipi-') && n !== CACHE_APP && n !== CACHE_ASSETS)
            .map((n) => caches.delete(n)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

const conTiempo = (request, ms) => {
  if (!ms) return fetch(request);
  const control = new AbortController();
  const corte = setTimeout(() => control.abort(), ms);
  return fetch(request, { signal: control.signal }).finally(() => clearTimeout(corte));
};

const pagina = async (request) => {
  const cache = await caches.open(CACHE_APP);
  const guardada = await cache.match('/index.html');
  try {
    // Con copia guardada no vale la pena esperar a una red lenta: se abre la app y ella avisa del estado
    const resp = await conTiempo(request, guardada ? ESPERA_PAGINA_MS : 0);
    const tipo = resp.headers.get('content-type') || '';
    if (resp.ok && tipo.includes('text/html')) cache.put('/index.html', resp.clone());
    return resp;
  } catch {
    return guardada || Response.error();
  }
};

const archivoConHash = async (request) => {
  const cache = await caches.open(CACHE_ASSETS);
  const guardado = await cache.match(request);
  if (guardado) return guardado;
  const resp = await fetch(request);
  if (resp.ok) cache.put(request, resp.clone());
  return resp;
};

const rapidoYRenueva = async (request) => {
  const cache = await caches.open(CACHE_APP);
  const guardado = await cache.match(request);
  const red = fetch(request)
    .then((resp) => {
      if (resp.ok) cache.put(request, resp.clone());
      return resp;
    })
    .catch(() => null);
  return guardado || (await red) || Response.error();
};

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || request.headers.has('range')) return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname === '/sw.js') return;

  if (request.mode === 'navigate') {
    event.respondWith(pagina(request));
  } else if (url.pathname.startsWith('/assets/')) {
    event.respondWith(archivoConHash(request));
  } else {
    event.respondWith(rapidoYRenueva(request));
  }
});
