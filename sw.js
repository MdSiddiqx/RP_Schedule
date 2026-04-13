// 1. Version bump: Changing to v2 forces the browser to update the worker
const CACHE_NAME = 'timetable-v2';

// 2. Relative paths (./) ensure it works perfectly on GitHub Pages or subdirectories
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './style.css',
    './script.js',
    './manifest.json',
    './assets/icon-192.png',
    './assets/icon-512.png',
    // Cache the external FontAwesome CSS so icons show offline
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'
];

// Install event: Caches the essential files
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        }).catch(err => {
            console.error('Failed to cache assets during install:', err);
        })
    );
});

// Activate event (NEW): Cleans up old caches (like v1) so your phone doesn't fill up with old data
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Fetch event (UPDATED): Network First, Fallback to Cache
self.addEventListener('fetch', (event) => {
    // Skip cross-origin requests (like browser extensions) to prevent errors
    if (!event.request.url.startsWith(self.location.origin) && !event.request.url.includes('cdnjs.cloudflare.com')) {
        return;
    }

    event.respondWith(
        // 1. Always try the internet first to get the newest timetable
        fetch(event.request).then((networkResponse) => {
            // If the network request is successful, open the cache
            return caches.open(CACHE_NAME).then((cache) => {
                // Save a fresh copy to the cache for the next time you go offline
                cache.put(event.request, networkResponse.clone());
                return networkResponse;
            });
        }).catch(() => {
            // 2. If the network fails (you have no internet), serve the saved offline version
            console.log('Offline mode: serving fallback from cache for', event.request.url);
            return caches.match(event.request);
        })
    );
});
