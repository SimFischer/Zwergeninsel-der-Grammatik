/* Zwergeninsel – Hilfsfunktionen für beide Seiten */
(function () {
  const ZI = window.ZI || (window.ZI = {});

  /* Element bauen: h('div', {class: 'x', onclick: fn}, kind1, kind2 …) */
  ZI.h = function h(tag, attrs, ...kinder) {
    const el = document.createElement(tag);
    if (attrs) {
      for (const [k, v] of Object.entries(attrs)) {
        if (v === null || v === undefined || v === false) continue;
        if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
        else if (k === 'class') el.className = v;
        else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
        else if (k === 'html') el.innerHTML = v;
        else el.setAttribute(k, v === true ? '' : v);
      }
    }
    for (const k of kinder.flat(Infinity)) {
      if (k === null || k === undefined || k === false) continue;
      el.appendChild(k instanceof Node ? k : document.createTextNode(String(k)));
    }
    return el;
  };
  const h = ZI.h;

  /* Inhalt ersetzen und dabei leere Einträge (null, false) überspringen */
  ZI.setze = function (el, ...kinder) {
    el.replaceChildren(...kinder.flat(Infinity).filter((k) => k !== null && k !== undefined && k !== false));
  };

  /* Bild mit Platzhalter: Fehlt die Datei noch, erscheint ein beschrifteter Rahmen. */
  ZI.bild = function bild(datei, alt, cls) {
    /* datei darf auch eine Liste sein: dann wird das erste vorhandene Bild genommen */
    const liste = (Array.isArray(datei) ? datei.slice() : [datei]).filter((n) => !(ZI.BILD_KOMMT || []).includes(n));
    if (!liste.length) return h('div', { class: 'platzhalter' + (cls ? ' ' + cls : ''), role: 'img', 'aria-label': alt || '' }, alt || '');
    const img = h('img', { src: ZI.BILD(liste[0]), alt: alt || '', class: cls || null, draggable: 'false', decoding: 'async' });
    let n = 0;
    img.addEventListener('error', function weiter() {
      n++;
      if (n < liste.length) { img.src = ZI.BILD(liste[n]); return; }
      img.removeEventListener('error', weiter);
      const ph = h('div', { class: 'platzhalter' + (cls ? ' ' + cls : ''), role: 'img', 'aria-label': alt || liste[0] }, alt || liste[0]);
      img.replaceWith(ph);
    });
    return img;
  };

  /* Bild mit eigenem Ersatz: Fehlt das Bild, erscheint ersatz (ein Element) – oder gar nichts */
  ZI.bildOder = function bildOder(datei, alt, ersatz, cls) {
    const liste = (Array.isArray(datei) ? datei.filter(Boolean) : [datei]).filter((n) => !(ZI.BILD_KOMMT || []).includes(n));
    if (!liste.length) return ersatz || h('span', { hidden: true });
    const img = h('img', { src: ZI.BILD(liste[0]), alt: alt || '', class: cls || null, draggable: 'false', decoding: 'async' });
    let n = 0;
    img.addEventListener('error', function weiter() {
      n++;
      if (n < liste.length) { img.src = ZI.BILD(liste[n]); return; }
      img.removeEventListener('error', weiter);
      if (ersatz) img.replaceWith(ersatz); else img.remove();
    });
    return img;
  };

  /* Hintergrund: Bild, sonst gemalter Ersatz */
  ZI.hintergrund = function hintergrund(datei, ersatzKlasse, abdunkeln) {
    const box = h('div', { class: 'hintergrund ' + ersatzKlasse, 'aria-hidden': 'true' });
    if (abdunkeln !== undefined) box.style.setProperty('--abdunkeln', abdunkeln);
    const img = h('img', { src: ZI.BILD(datei), alt: '' });
    img.addEventListener('error', () => img.remove(), { once: true });
    box.appendChild(img);
    return box;
  };

  /* Kleine Strich-Symbole */
  const svg = (pfad) => {
    const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('fill', 'none'); s.setAttribute('stroke', 'currentColor');
    s.setAttribute('stroke-width', '2.4'); s.setAttribute('stroke-linecap', 'round'); s.setAttribute('stroke-linejoin', 'round');
    s.setAttribute('aria-hidden', 'true');
    s.innerHTML = pfad;
    return s;
  };
  ZI.icon = {
    zurueck: () => svg('<path d="M15 5 L8 12 L15 19"/>'),
    laterne: () => svg('<path d="M9 3 H15"/><path d="M12 3 V5"/><path d="M7 8 Q12 4 17 8 V17 Q12 21 7 17 Z"/><path d="M12 10 Q10 13 12 15 Q14 13 12 10 Z"/>'),
    haken: () => svg('<path d="M5 12.5 L10 17 L19 7"/>'),
    flamme: () => svg('<path d="M12 3 Q17 9 16 14 A4 4 0 0 1 8 14 Q8 11 10 9 Q10 12 12 12 Q11 8 12 3 Z"/>'),
    hammer: () => svg('<rect x="4" y="4" width="11" height="6" rx="1.5"/><path d="M10 10 L10 20"/>'),
    lupe: () => svg('<circle cx="10" cy="10" r="6"/><path d="M14.5 14.5 L20 20"/>'),
    schild: () => svg('<path d="M12 3 L19 6 V11 Q19 17 12 21 Q5 17 5 11 V6 Z"/>'),
    sprechblase: () => svg('<path d="M4 5 H20 V15 H10 L6 19 V15 H4 Z"/>'),
    ohr: () => svg('<path d="M8 9 A5 5 0 0 1 18 9 Q18 13 15 15 Q13 16.5 13 19 A2.5 2.5 0 0 1 8 18.5"/><path d="M11 9.5 A2 2 0 0 1 15 9.5 Q15 11 13.5 12"/>'),
    krone: () => svg('<path d="M4 18 L4 8 L9 12 L12 6 L15 12 L20 8 L20 18 Z"/>'),
    stern: () => svg('<path d="M12 3 L14.6 9 L21 9.4 L16 13.6 L17.6 20 L12 16.6 L6.4 20 L8 13.6 L3 9.4 L9.4 9 Z"/>'),
    edelstein: () => svg('<path d="M7 4 H17 L21 9 L12 20 L3 9 Z"/><path d="M3 9 H21 M9 4 L12 9 L15 4"/>'),
    helm: () => svg('<path d="M4 15 Q4 6 12 6 Q20 6 20 15 Z"/><path d="M3 15 H21 M12 6 V3"/>'),
    vollbild: () => svg('<path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"/>'),
    vollbildAus: () => svg('<path d="M9 4v5H4M20 9h-5V4M15 20v-5h5M4 15h5v5"/>'),
    album: () => svg('<circle cx="12" cy="9" r="5"/><path d="M9 13 L7 21 L12 18.5 L17 21 L15 13"/>'),
    buch: () => svg('<path d="M4 5 Q8 3 12 5 Q16 3 20 5 V19 Q16 17 12 19 Q8 17 4 19 Z"/><path d="M12 5 V19"/>'),
    schloss: () => svg('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11 V8 a4 4 0 0 1 8 0 V11"/>'),
    kamera: () => svg('<path d="M4 8 H8 L10 5 H14 L16 8 H20 V19 H4 Z"/><circle cx="12" cy="13" r="3.5"/>'),
    zahnrad: () => svg('<path d="M9.13 5.07 L9.92 2.22 L14.08 2.22 L14.87 5.07 L14.87 5.07 L17.45 3.61 L20.39 6.55 L18.93 9.13 L18.93 9.13 L21.78 9.92 L21.78 14.08 L18.93 14.87 L18.93 14.87 L20.39 17.45 L17.45 20.39 L14.87 18.93 L14.87 18.93 L14.08 21.78 L9.92 21.78 L9.13 18.93 L9.13 18.93 L6.55 20.39 L3.61 17.45 L5.07 14.87 L5.07 14.87 L2.22 14.08 L2.22 9.92 L5.07 9.13 L5.07 9.13 L3.61 6.55 L6.55 3.61 L9.13 5.07 Z"/><circle cx="12" cy="12" r="3"/>'),
    tastatur: () => svg('<rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10 H6.01 M10 10 H10.01 M14 10 H14.01 M18 10 H18.01 M7 14 H17"/>'),
  };

  /* Zufällig mischen */
  ZI.mischen = function (arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  };
  ZI.zufall = (arr) => arr[Math.floor(Math.random() * arr.length)];
  /* Speicher, der nie abstürzt (privater Modus o. ä.) */
  ZI.speicher = {
    lesen(k, ersatz) { try { const v = localStorage.getItem(k); return v === null ? ersatz : JSON.parse(v); } catch (e) { return ersatz; } },
    schreiben(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* egal */ } },
    loeschen(k) { try { localStorage.removeItem(k); } catch (e) { /* egal */ } },
  };
  /* Nur für diesen Tab: Koffer-iPads werden von vielen Klassen genutzt.
     Wird der Tab geschlossen, ist alles weg – der Spielstand steckt im Zwergenpass. */
  ZI.sitzung = {
    lesen(k, ersatz) { try { const v = sessionStorage.getItem(k); return v === null ? ersatz : JSON.parse(v); } catch (e) { return ersatz; } },
    schreiben(k, v) { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* egal */ } },
    loeschen(k) { try { sessionStorage.removeItem(k); } catch (e) { /* egal */ } },
  };

  /* Aufgaben als gemischten Vorrat ziehen; der Verlauf bleibt nur in diesem Tab. */
  ZI.ziehen = function (pool, anzahl, name) {
    if (!pool.length || anzahl <= 0) return [];
    const id = (x) => x.id || JSON.stringify(x);
    const eindeutig = new Map(pool.map((x) => [id(x), x]));
    const ids = [...eindeutig.keys()];
    const gruppe = name || (pool[0].id ? pool[0].id.split(':')[0] : ids.slice().sort().join('|'));
    const verlauf = ZI.sitzung.lesen('zi-aufgaben', {});
    const alt = verlauf[gruppe] || {};
    let rest = [...new Set(alt.rest || [])].filter((x) => eindeutig.has(x));
    const zuletzt = new Set(alt.zuletzt || []);
    const letzteFaelle = new Set(verlauf.faelle || []);
    const fall = (x) => (eindeutig.get(x).id || '').split(':')[1] || x;
    const gezogen = [];
    while (gezogen.length < Math.min(anzahl, ids.length)) {
      if (!rest.length) rest = ZI.mischen(ids.filter((x) => !gezogen.includes(x)));
      const neu = rest.filter((x) => !gezogen.includes(x));
      if (!neu.length) { rest = []; continue; }
      const dieseFaelle = new Set(gezogen.map(fall));
      const kandidat = neu.find((x) => !zuletzt.has(x) && !letzteFaelle.has(fall(x)) && !dieseFaelle.has(fall(x)))
        || neu.find((x) => !zuletzt.has(x) && !dieseFaelle.has(fall(x)))
        || neu.find((x) => !zuletzt.has(x)) || neu[0];
      gezogen.push(kandidat);
      rest = rest.filter((x) => x !== kandidat);
    }
    verlauf[gruppe] = { rest, zuletzt: gezogen };
    verlauf.faelle = [...(verlauf.faelle || []), ...gezogen.map(fall)].slice(-12);
    ZI.sitzung.schreiben('zi-aufgaben', verlauf);
    return gezogen.map((x) => eindeutig.get(x));
  };

  /* ---------- iPad-Bildschirmtastatur: freie Höhe merken ---------- */
  if (window.visualViewport) {
    const tastatur = () => {
      const verdeckt = Math.max(0, window.innerHeight - window.visualViewport.height - window.visualViewport.offsetTop);
      document.documentElement.style.setProperty('--tastatur', (verdeckt > 80 ? verdeckt : 0) + 'px');
    };
    window.visualViewport.addEventListener('resize', tastatur);
    window.visualViewport.addEventListener('scroll', tastatur);
  }

  /* ---------- Bilder für den Offline-Fall nachladen ----------
     Nicht alle 27 iPads gleichzeitig: jedes wartet zufällig 10–90 Sekunden und lädt dann ein Bild nach dem anderen.
     Schon gespeicherte Bilder kosten kein WLAN (der Offline-Speicher antwortet). */
  ZI.vorladen = function (fuerBoard) {
    try {
      if (!('serviceWorker' in navigator) || (location.protocol !== 'https:' && location.hostname !== 'localhost')) return;
      const liste = (ZI.ALLE_BILDER || []).filter((n) => fuerBoard || !ZI.NUR_BOARD(n)).map(ZI.BILD);
      let i = 0;
      const naechstes = () => {
        if (i >= liste.length) return;
        if (navigator.onLine === false) { setTimeout(naechstes, 30000); return; }
        const img = new Image();
        img.onload = img.onerror = () => setTimeout(naechstes, 120);
        img.src = liste[i++];
      };
      navigator.serviceWorker.ready.then(() => setTimeout(naechstes, (fuerBoard ? 2 : 10 + Math.random() * 80) * 1000));
    } catch (e) { /* egal */ }
  };

  /* ---------- Kurze Meldung unten ---------- */
  /* Meldungen erscheinen in einem Stapel, damit sich gleichzeitige nicht überdecken */
  ZI.meldung = function (text, ms) {
    let stapel = document.querySelector('.meldungen');
    if (!stapel) { stapel = h('div', { class: 'meldungen', 'aria-live': 'polite' }); document.body.appendChild(stapel); }
    const m = h('div', { class: 'meldung pergament', role: 'status' }, text);
    stapel.appendChild(m);
    setTimeout(() => m.remove(), ms || 2600);
  };

  /* ---------- Fenster ---------- */
  ZI.fenster = function (inhalt, opts) {
    const s = h('div', { class: 'schleier', role: 'dialog', 'aria-modal': 'true' });
    const f = h('div', { class: 'fenster pergament auf-pergament' }, inhalt);
    s.appendChild(f);
    if (opts && opts.schliessbar) s.addEventListener('click', (e) => { if (e.target === s) s.remove(); });
    document.body.appendChild(s);
    return { schliessen: () => s.remove(), el: f };
  };


  /* ---------- Konfetti ---------- */
  ZI.konfetti = function (anzahl) {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const farben = ['#e8b23a', '#f28c28', '#6f8f3a', '#2ec4b6', '#c2533a', '#fff4dc', '#9b6bd3'];
    const box = h('div', { class: 'konfetti', 'aria-hidden': 'true' });
    for (let i = 0; i < (anzahl || 90); i++) {
      const k = h('span');
      k.style.left = Math.random() * 100 + 'vw';
      k.style.background = farben[i % farben.length];
      k.style.setProperty('--dx', (Math.random() * 200 - 100) + 'px');
      k.style.setProperty('--rot', (Math.random() * 1080 - 540) + 'deg');
      k.style.animationDuration = 1.8 + Math.random() * 1.6 + 's';
      k.style.animationDelay = Math.random() * 0.4 + 's';
      k.style.width = 6 + Math.random() * 8 + 'px'; k.style.height = 10 + Math.random() * 10 + 'px';
      box.appendChild(k);
    }
    document.body.appendChild(box);
    setTimeout(() => box.remove(), 4200);
  };

  /* ---------- Feuerwerk (für das Board) ---------- */
  ZI.feuerwerk = function (dauer) {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const c = h('canvas', { class: 'feuerwerk', 'aria-hidden': 'true' });
    document.body.appendChild(c);
    const ctx = c.getContext('2d');
    const W = (c.width = window.innerWidth * (window.devicePixelRatio || 1));
    const H = (c.height = window.innerHeight * (window.devicePixelRatio || 1));
    const farben = ['#ffd56e', '#f28c28', '#2ec4b6', '#ff6b6b', '#b57cff', '#ffffff', '#8db04c'];
    const teile = [];
    let ende = Date.now() + (dauer || 6000);
    function rakete() {
      const x = W * (0.15 + Math.random() * 0.7), y = H * (0.15 + Math.random() * 0.35);
      const farbe = farben[Math.floor(Math.random() * farben.length)];
      for (let i = 0; i < 70; i++) {
        const w = Math.random() * Math.PI * 2, v = (2 + Math.random() * 5) * (W / 1400);
        teile.push({ x, y, vx: Math.cos(w) * v, vy: Math.sin(w) * v, life: 60 + Math.random() * 30, farbe });
      }
    }
    let zaehler = 0;
    (function schleife() {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';
      if (Date.now() < ende && zaehler++ % 22 === 0) rakete();
      for (let i = teile.length - 1; i >= 0; i--) {
        const t = teile[i];
        t.x += t.vx; t.y += t.vy; t.vy += 0.05 * (W / 1400); t.vx *= 0.985; t.life--;
        ctx.globalAlpha = Math.max(0, t.life / 90);
        ctx.fillStyle = t.farbe; ctx.beginPath(); ctx.arc(t.x, t.y, 2.4 * (W / 1400), 0, Math.PI * 2); ctx.fill();
        if (t.life <= 0) teile.splice(i, 1);
      }
      ctx.globalAlpha = 1;
      if (Date.now() < ende || teile.length) requestAnimationFrame(schleife); else c.remove();
    })();
  };

  /* ---------- Funken sprühen lassen ---------- */
  ZI.funken = function (behaelter, x, y, anzahl) {
    for (let i = 0; i < (anzahl || 18); i++) {
      const w = Math.random() * Math.PI - Math.PI; // nach oben
      const r = 60 + Math.random() * 110;
      const f = h('span', { class: 'funke' });
      f.style.left = x + 'px'; f.style.top = y + 'px';
      f.style.setProperty('--dx', Math.cos(w) * r + 'px');
      f.style.setProperty('--dy', Math.sin(w) * r + 40 * Math.random() + 'px');
      f.style.animationDuration = 0.5 + Math.random() * 0.6 + 's';
      behaelter.appendChild(f);
      setTimeout(() => f.remove(), 1300);
    }
  };
})();
