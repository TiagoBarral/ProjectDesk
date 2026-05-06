const STATIC_CACHE = 'projectdesk-static-v8';
const RUNTIME_CACHE = 'projectdesk-runtime-v8';

const isSupportedRequest = (requestUrl) => ['http:', 'https:'].includes(requestUrl.protocol);

const isNavigationRequest = (request) =>
  request.mode === 'navigate' || request.destination === 'document';

const isStaticAssetRequest = (request, requestUrl) =>
  requestUrl.pathname.startsWith('/assets/') ||
  ['script', 'style', 'font', 'image'].includes(request.destination);

self.addEventListener('install', () => {
  // Do not call skipWaiting here. The app asks the waiting worker to activate
  // after the user confirms the update.
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => ![STATIC_CACHE, RUNTIME_CACHE].includes(key))
          .map((key) => caches.delete(key)),
      ),
    ).then(() => self.clients.claim()),
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const requestUrl = new URL(request.url);
  if (!isSupportedRequest(requestUrl)) return;

  if (isNavigationRequest(request)) {
    event.respondWith(networkFirst(request));
    return;
  }

  if (isStaticAssetRequest(request, requestUrl)) {
    event.respondWith(cacheFirst(request));
  }
});

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response?.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || caches.match('/');
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response?.ok) {
    const cache = await caches.open(STATIC_CACHE);
    await cache.put(request, response.clone());
  }
  return response;
}
