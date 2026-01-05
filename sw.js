// Nombre de la caché (cambiar versión si modificas la app)
const CACHE_NAME = 'ipv-gestion-v1';

// Archivos y Librerías externas a guardar para uso OFFLINE
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './img/Logo.png',
  // Fuentes de Google
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
  'https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;700&display=swap',
  'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&display=swap',
  // Librerías JS
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js',
  'https://cdn.jsdelivr.net/npm/sweetalert2@11'
];

// INSTALACIÓN: Descargar y guardar todo
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Cacheando archivos de la app y librerías externas');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// ACTIVACIÓN: Limpiar cachés viejas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Borrando caché antigua:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// INTERCEPTAR PETICIONES: Servir desde caché si no hay internet
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Si existe en caché, lo devolvemos (OFFLINE MODE)
      if (cachedResponse) {
        return cachedResponse;
      }

      // Si no, intentamos buscarlo en internet
      return fetch(event.request).then((networkResponse) => {
        // Si es una petición válida, la guardamos en caché dinámicamente para la próxima vez
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        
        // Clonar respuesta para guardarla
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // Aquí podrías retornar una página "offline.html" si quisieras
        console.log("Fallo al recuperar recurso y no está en caché.");
      });
    })
  );
});