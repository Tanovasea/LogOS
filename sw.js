/* Logos — paznicul offline
   După prima vizită, Logos trăiește în telefon/tabletă.
   Poți scoate fișierele de pe GitHub; Logos rămâne al tău. */

const CACHE = 'logos-v2';   // ↑ crește numărul de fiecare dată când urcă un index.html nou

// tot ce trebuie ca Logos să pornească fără internet
const FISIERE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-180.png',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable.png'
];

// La instalare: pune totul în cămară
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(FISIERE))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())   // chiar dacă un fișier lipsește, mergem mai departe
  );
});

// La activare: curăță versiunile vechi
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(chei => Promise.all(chei.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// La orice cerere:
//  - pagina Logos însăși (navigare) → ÎNTÂI internetul, ca actualizările să
//    ajungă imediat cât ești online; offline, cade pe ce avem în cămară.
//    (înainte mergea cămara întâi mereu — de-asta o versiune nouă putea
//    rămâne "ascunsă" în spatele uneia vechi, memorate din prima vizită)
//  - restul (iconițe, manifest) → cămara întâi, mai rapid, se schimbă rar
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then(raspuns => {
          const copie = raspuns.clone();
          caches.open(CACHE).then(c => c.put(e.request, copie));
          return raspuns;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then(raspunsCache => {
      if (raspunsCache) return raspunsCache;   // avem în cămară → offline merge

      return fetch(e.request)
        .then(raspuns => {
          if (raspuns && raspuns.status === 200 && raspuns.type === 'basic') {
            const copie = raspuns.clone();
            caches.open(CACHE).then(c => c.put(e.request, copie));
          }
          return raspuns;
        })
        .catch(() => new Response('', { status: 408 }));
    })
  );
});
