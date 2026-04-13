const CACHE_NAME = 'timetable-v2';

// 1. Use relative paths (./) instead of absolute paths (/)
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './style.css',
    './script.js',
    './manifest.json',
    './assets/icon-192.png',
    './assets/icon-512.png',
    // Cache the external FontAwesome CSS file
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        }).catch(err => {
            console.error('Failed to cache assets during install:', err);
        })
    );
});

// Clean up old caches when a new service worker takes over
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

self.addEventListener('fetch', (event) => {
    // Skip cross-origin requests like browser extensions
    if (!event.request.url.startsWith(self.location.origin) && !event.request.url.includes('cdnjs.cloudflare.com')) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            // Return cached response if found
            if (cachedResponse) {
                return cachedResponse;
            }

            // 2. Dynamic Caching: If not in cache, fetch from network and add to cache
            return fetch(event.request).then((networkResponse) => {
                // Ensure the response is valid before caching
                if (!networkResponse || networkResponse.status !== 200 || networkResponse.type === 'opaque') {
                    return networkResponse;
                }

                // Clone the response because it's a stream and can only be consumed once
                const responseToCache = networkResponse.clone();

                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseToCache);
                });

                return networkResponse;
            }).catch(() => {
                // This catch block executes if both cache and network fail (offline)
                console.log('Resource fetch failed, and not found in cache:', event.request.url);
            });
        })
    );
});
