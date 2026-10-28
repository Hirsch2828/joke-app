const CACHE = 'joke-v1';
const PRECACHE = [
  '/',
  '/manifest.webmanifest',
  '/assets/logo.svg',
  '/assets/mascot-idle.svg',
  '/assets/mascot-think.svg',
  '/assets/mascot-joke.svg',
  '/assets/mascot-error.svg',
  '/assets/bg-dots.svg',
  '/assets/bg-doodles.svg',
  '/assets/icon-192.png',
  '/assets/icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  // Never touch non-GET, other origins, or the API
  if (req.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api')) return;

  // Network first, keep a copy; fall back to cache when offline
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req))
  );
});
