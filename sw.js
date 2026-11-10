// Bichos Amigos — funciona sem internet depois da primeira visita
const APP = 'bichos-app-v7';
const SONS = 'bichos-sons-v1';
const FONTES = 'bichos-fontes-v1';
const ARQUIVOS = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(APP).then(c => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => ![APP, SONS, FONTES].includes(k)).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // páginas do app: tenta a rede (para pegar atualizações) e cai no cache sem internet
  if (url.origin === location.origin) {
    e.respondWith(fetch(req, {cache:'no-cache'}).then(r => { const c = r.clone(); caches.open(APP).then(k => k.put(req, c)); return r; })
      .catch(() => caches.match(req).then(r => r || caches.match('./index.html'))));
    return;
  }
  // fontes (letras e desenhos dos bichos): cache primeiro
  if (/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    e.respondWith(caches.open(FONTES).then(c => c.match(req).then(r => r || fetch(req).then(res => { c.put(req, res.clone()); return res; }))));
  }
  // sons do Wikimedia: a própria página guarda no cache 'bichos-sons-v1'
});
