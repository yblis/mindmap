const CACHE_NAME = 'mindmap-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/static/css/style.css',
  '/static/js/main.js',
  '/static/manifest.json',
  'https://d3js.org/d3.v7.min.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600&display=swap'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Cache hit - return response
      if (response) {
        return response;
      }
      return fetch(event.request).then((response) => {
        // Check if valid response
        if(!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Clone response to cache it
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
            // Only cache valid static requests, avoid caching API calls if needed strictly or handle separately
            if (event.request.url.startsWith('http')) {
               cache.put(event.request, responseToCache);
            }
        });

        return response;
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
