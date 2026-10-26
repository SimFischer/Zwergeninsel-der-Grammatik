/* Zwergeninsel – Offline-Speicher
   Beim Start werden Seiten, Code und Schriften gespeichert (gut 600 KB); die Bilder lädt die Seite danach
   gestaffelt nach. Danach läuft die App auch ohne WLAN.
   Nach jeder Änderung an der App die Versionsnummer erhöhen. */
const VERSION = 'zwergeninsel-grammatik-v3';
const KERN = [
  './', 'index.html', 'insel.html', 'karten.html', 'lehrkraft.html', 'manifest.webmanifest',
  'css/spiel.css', 'css/insel.css', 'css/grammatik.css',
  'schrift/schrift.css', 'schrift/insel-text-400.woff', 'schrift/insel-text-700.woff', 'schrift/insel-titel-400.woff',
  'js/data.js', 'js/data-bau.js', 'js/data-grammatik.js', 'js/grammatik/wortschmiede.js', 'js/grammatik/satzwerkstatt.js', 'js/grammatik/satzbaumeister.js', 'js/pass.js', 'js/gemeinsam.js', 'js/engines.js', 'js/spielwelt.js', 'js/app.js', 'js/insel-szene.js', 'js/insel.js',
  'bilder/app-icon.png', 'bilder/app-icon-192.png',
];


self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION)
    .then((c) => c.addAll(KERN)) // Bilder lädt die Seite selbst nach und nach (ZI.vorladen)
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

/* Erst das Netz fragen (damit Updates ankommen), sonst den Zwischenspeicher nehmen.
   Bilder und Schriften: erst Zwischenspeicher, das spart Datenvolumen. */
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const statisch = url.pathname.includes('/bilder/') || url.pathname.includes('/schrift/');
  if (statisch) {
    e.respondWith(caches.match(req).then((treffer) => treffer || fetch(req).then((res) => {
      if (res && (res.ok || res.type === 'opaque')) { const kopie = res.clone(); caches.open(VERSION).then((c) => c.put(req, kopie)); }
      return res;
    })));
    return;
  }
  // Seiten und Code: erst das Netz (für Updates) – aber höchstens 3 Sekunden warten.
  // Bei schwachem Schul-WLAN kommt dann sofort die gespeicherte Fassung.
  const ausNetz = fetch(req).then((res) => {
    if (res && res.ok && url.origin === location.origin) { const kopie = res.clone(); caches.open(VERSION).then((c) => c.put(req, kopie)); }
    return res;
  });
  const ausSpeicher = () => caches.match(req, { ignoreSearch: true });
  e.respondWith(new Promise((fertig) => {
    let erledigt = false;
    const nimm = (r) => { if (!erledigt && r) { erledigt = true; fertig(r); return true; } return false; };
    const uhr = setTimeout(() => ausSpeicher().then(nimm), 3000);
    ausNetz.then((r) => { clearTimeout(uhr); nimm(r); })
      .catch(() => { clearTimeout(uhr); ausSpeicher().then((r) => nimm(r) || nimm(Response.error())); });
  }));
});
