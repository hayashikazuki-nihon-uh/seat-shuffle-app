const CACHE_NAME = 'seat-shuffle-app-v23';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './js/id.js',
  './js/storage.js',
  './js/store.js',
  './js/deskGrid.js',
  './js/shuffle.js',
  './js/animation.js',
  './js/toast.js',
  './js/imageExport.js',
  './js/seatChart.js',
  './js/roster.js',
  './js/layout.js',
  './js/conditions.js',
  './js/history.js',
  './js/projection.js',
  './js/main.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      // cache: 'reload' でブラウザのHTTPキャッシュを使わず、必ず最新のファイルを取得して保存する。
      // (GitHub Pages は最大10分キャッシュさせるため、指定しないと古いファイルを新バージョンとして保存してしまう)
      .then((cache) => Promise.all(ASSETS.map((url) => cache.add(new Request(url, { cache: 'reload' })))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => cached);
    })
  );
});
