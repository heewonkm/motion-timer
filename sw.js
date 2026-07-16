const CACHE = 'motion-timer-v6';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-180.png',
  './icon-512.png',
  './fox.png',
  './pdf.min.js',
  './pdf.worker.min.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// HTML(페이지 진입)은 네트워크 우선 → 항상 최신, 오프라인이면 캐시.
// 나머지(라이브러리, 아이콘)는 캐시 우선 → 빠르고 오프라인 안전.
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  // 외부 요청(구글 스크립트, 설문 등)은 절대 캐시하지 않고 항상 네트워크로
  if (new URL(e.request.url).origin !== self.location.origin) return;
  const isNavigation = e.request.mode === 'navigate';

  if (isNavigation) {
    e.respondWith(
      fetch(e.request)
        .then((resp) => {
          const copy = resp.clone();
          caches.open(CACHE).then((c) => { c.put('./', copy.clone()); c.put('./index.html', copy); });
          return resp;
        })
        .catch(() => caches.match('./index.html', { ignoreSearch: true }))
    );
    return;
  }

  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(
      (cached) =>
        cached ||
        fetch(e.request).then((resp) => {
          const copy = resp.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
          return resp;
        })
    )
  );
});
