/* Zwergeninsel – Insel-Ansicht für das Board (Lehrer-iPad oder PC am Smartboard) */
(function () {
  const ZI = window.ZI;
  const { h, bild, icon, speicher } = ZI;
  const KEY = 'zi-insel';

  const leer = () => ({ klassengroesse: 27, kapitel: 0, zwerge: {}, gebaut: [], schmuck: 0, rat: {}, gefeiert: [], geschenke: 0, auftrag: null, sonder: 0 });
  function aufbereiten(roh) {
    const i = Object.assign(leer(), roh || {});
    if (typeof i.rat === 'string') i.rat = { 0: i.rat };          // ältere Speicherstände
    if (!i.rat || typeof i.rat !== 'object') i.rat = {};
    if (i.gefeiert === true) i.gefeiert = [0];
    if (!Array.isArray(i.gefeiert)) i.gefeiert = [];
    return i;
  }
  let insel = aufbereiten(speicher.lesen(KEY, {}));
  const sichern = () => speicher.schreiben(KEY, insel);
  const kap = () => Math.min(insel.kapitel || 0, ZI.BAUPLAN.length - 1);

  /* ---------- Berechnungen ---------- */
  function standVon(e) {
    const s = e && ZI.Stand.ausCode(e.code);
    if (s && e.liefer) s.liefer = e.liefer.slice();
    return s;
  }
  function staende() {
    return Object.values(insel.zwerge).map(standVon).filter(Boolean);
  }
  function material(k = kap()) { return staende().reduce((a, s) => a + s.coreCount(k), 0); }
  function ziel() { return Math.max(1, insel.klassengroesse * 3); }
  function edelsteine() { return staende().reduce((a, s) => a + s.gems(), 0); }

  /* Bauplan auflösen: Ratsentscheidung bestimmt die Reihenfolge */
  function ratsfrage(id) { for (const liste of ZI.RATSFRAGEN) for (const f of liste) if (f.id === id) return f; return null; }
  function ratWahl(f) { return insel.rat[f.id] && f.optionen.includes(insel.rat[f.id]) ? insel.rat[f.id] : f.optionen[0]; }
  function bauplan(k = kap()) {
    return ZI.BAUPLAN[k].map((schritt) => {
      if (!schritt.frage) return { anteil: schritt.anteil, gebaeude: schritt.gebaeude };
      const f = ratsfrage(schritt.frage);
      const erst = ratWahl(f);
      const zweit = f.optionen.find((o) => o !== erst);
      return { anteil: schritt.anteil, gebaeude: schritt.wahl === 0 ? erst : zweit, frage: f.id };
    });
  }
  /* Inselbotschaft: welches Kapitel die Schmiede öffnen darf und welche Gebäude stehen */
  function botschaftDaten() {
    const k = kap() + (kapitelFertig() && ZI.KAPITEL[kap() + 1] && ZI.KAPITEL[kap() + 1].fertig ? 1 : 0);
    let bau = 0;
    ZI.BAU_UEBUNGEN.forEach((u) => { if (insel.gebaut.includes(u.id)) bau |= (1 << u.bit); });
    return { k, bau, wort: ZI.botschaft.kodiere(k, bau) };
  }
  const silbig = (w) => w.match(/../g).join(' ');
  /* Der erste Schritt im Bauplan, der noch auf eine Entscheidung des Zwergenrats wartet */
  function wartetAufRat(k = kap()) {
    const st = bauplan(k).find((x) => x.frage && !insel.rat[x.frage]);
    return st ? ratsfrage(st.frage) : null;
  }
  function sollGebaut() {
    const liste = [];
    for (let k = 0; k < kap(); k++) liste.push(...bauplan(k).map((s) => s.gebaeude)); // frühere Kapitel: alles steht
    const m = material();
    if (m > 0) {
      for (const st of bauplan()) {
        if (m / ziel() < st.anteil - 1e-9) break;
        if (st.frage && !insel.rat[st.frage]) break; // das Dorf wartet auf den Rat
        liste.push(st.gebaeude);
      }
    }
    return liste;
  }
  function kapitelFertig() { return material() / ziel() >= 1 - 1e-9 && !wartetAufRat(); }
  function naechstesKapitelBereit() { const n = kap() + 1; return !!ZI.BAUPLAN[n] && ZI.KAPITEL[n] && ZI.KAPITEL[n].fertig; }
  function naechstes() {
    const m = material(); const anteil = m / ziel();
    const plan = bauplan();
    const n = plan.find((s) => (m === 0 ? true : anteil < s.anteil - 1e-9));
    if (!n) return null;
    const bedarf = Math.max(1, Math.ceil(n.anteil * ziel()) - m);
    if (n.frage && !insel.rat[n.frage]) { // noch nicht entschieden: beide Möglichkeiten nennen
      const f = ratsfrage(n.frage);
      return { gebaeude: { name: f.optionen.map((id) => ZI.GEBAEUDE.find((g) => g.id === id).name).join(' oder ') }, bedarf };
    }
    return { gebaeude: ZI.GEBAEUDE.find((g) => g.id === n.gebaeude), bedarf };
  }

  /* ---------- Code groß zeigen: für die letzte Reihe ---------- */
  function grossZeigen(titel, wort, hinweis) {
    const zu = () => { ov.remove(); document.removeEventListener('keydown', taste); };
    const taste = (e) => { if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); zu(); } };
    const ov = h('div', { class: 'gross-code', role: 'dialog', 'aria-label': titel, onclick: zu },
      h('div', { class: 'gross-code-titel' }, titel),
      h('div', { class: 'gross-code-wort' }, wort),
      hinweis ? h('div', { class: 'gross-code-hinweis' }, hinweis) : null,
      h('div', { class: 'gross-code-zu' }, 'Antippen zum Schließen'));
    document.addEventListener('keydown', taste);
    document.body.append(ov);
  }

  /* ---------- Darstellung ---------- */
  /* Bedienelemente wachsen auf großen Boards mit (Full HD, 4K) */
  function uiGroesse() {
    const f = Math.max(1, Math.min(1.5, Math.min(window.innerWidth / 1440, window.innerHeight / 810)));
    document.documentElement.style.setProperty('--ui', f.toFixed(3));
  }
  uiGroesse();
  window.addEventListener('resize', uiGroesse);
  document.body.classList.add('insel-seite');
  const screen = h('div', { class: 'insel-screen' });
  const buehne = h('div', { class: 'insel-buehne' });
  const grund = h('div', { class: 'insel-grund' }, h('div', { class: 'insel-ersatz' }), h('div', { class: 'wellen' }));
  const grundBild = h('img', { src: ZI.BILD('insel-grund'), alt: '' });
  grundBild.addEventListener('error', () => grundBild.remove(), { once: true });
  grundBild.addEventListener('load', () => grund.classList.add('mit-bild'), { once: true });
  grund.appendChild(grundBild);
  buehne.appendChild(grund);
  const bauEls = {};
  /* Wo Rauch aufsteigt (Position im Gebäudebild in Prozent) */
  const RAUCH = { lagerfeuer: [50, 30], huette1: [74, 8], huette2: [62, 10], huette3: [55, 12], werkstatt: [70, 6], festhalle: [50, 6] };
  ZI.GEBAEUDE.slice().sort((a, b) => a.y - b.y).forEach((g) => {
    const el = h('div', { class: 'bau', style: { left: g.x + '%', top: g.y + '%', width: g.w + '%' } },
      h('div', { class: 'ruine' }, g.id === 'schiff' ? null : ZI.bildOder(g.id + '-ruine', g.name + ' (Ruine)', null)),
      h('div', { class: 'fertig', style: { display: 'none' } }, bild(g.id, g.name)),
      RAUCH[g.id] ? h('div', { class: 'rauch', style: { left: RAUCH[g.id][0] + '%', top: RAUCH[g.id][1] + '%' }, 'aria-hidden': 'true' }, h('span'), h('span'), h('span')) : null);
    bauEls[g.id] = el;
    buehne.appendChild(el);
  });
  const zwergSchicht = h('div');
  const schmuckSchicht = h('div');
  const sonderSchicht = h('div');
  /* Lebendige Insel: Wolken und Möwen */
  const wolken = h('div', { class: 'wolken', 'aria-hidden': 'true' }, [1, 2, 3].map((n) => {
    const sp = h('span');
    const img = h('img', { src: ZI.BILD('wolke-' + n), alt: '' });
    img.addEventListener('load', () => sp.classList.add('mit-bild'), { once: true });
    img.addEventListener('error', () => img.remove(), { once: true });
    sp.appendChild(img);
    return sp;
  }));
  const moewen = h('div', { class: 'moewen', 'aria-hidden': 'true' }, moewe(), moewe(), moewe());
  /* Tiere auf der Insel – erscheinen erst, wenn ihre Bilder da sind */
  const TIERE = [
    { datei: 'krabbe', klasse: 'tier-krabbe', x: 30, y: 89, w: 3 },
    { datei: 'schildkroete', klasse: 'tier-schildkroete', x: 70, y: 90, w: 4 },
    { datei: 'huhn', klasse: 'tier-huhn', x: 44, y: 58, w: 2.4 },
    { datei: 'huhn', klasse: 'tier-huhn zwei', x: 47, y: 60, w: 2.2 },
    { datei: 'hase', klasse: 'tier-hase', x: 63, y: 70, w: 2.6 },
    { datei: 'schmetterling', klasse: 'tier-schmetterling', x: 34, y: 56, w: 2 },
    { datei: 'delfin', klasse: 'tier-delfin', x: 12, y: 82, w: 6 },
    { datei: 'delfin', klasse: 'tier-delfin zwei', x: 92, y: 60, w: 5 },
  ];
  const tiere = h('div', { class: 'tiere', 'aria-hidden': 'true' }, TIERE.map((t) =>
    h('div', { class: 'tier ' + t.klasse, style: { left: t.x + '%', top: t.y + '%', width: t.w + '%' } }, ZI.bildOder(t.datei, '', null))));
  buehne.append(schmuckSchicht, sonderSchicht, tiere, zwergSchicht, moewen, wolken);
  function moeweSvg(geschenk) {
    const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('viewBox', '0 0 60 40'); s.setAttribute('class', 'moewe-svg');
    s.innerHTML = '<path d="M2 18 Q15 4 30 18 Q45 4 58 18" fill="none" stroke="#fffaf0" stroke-width="4" stroke-linecap="round"/>' +
      '<path d="M2 18 Q15 4 30 18 Q45 4 58 18" fill="none" stroke="#3a2617" stroke-width="1.2" stroke-linecap="round" opacity="0.5"/>' +
      (geschenk ? '<line x1="30" y1="18" x2="30" y2="26" stroke="#3a2617" stroke-width="1.5"/><rect x="23" y="26" width="14" height="12" rx="2" fill="#c2533a" stroke="#3a2617" stroke-width="1.5"/><rect x="28.5" y="26" width="3" height="12" fill="#ffd56e"/>' : '');
    return s;
  }
  /* Möwe aus zwei Bildern (Flügel oben/unten); fehlen sie, wird sie gezeichnet */
  function moewe(geschenk) {
    const box = h('div', { class: 'moewe' + (geschenk ? ' mit-geschenk' : '') });
    const ersatz = () => { if (!box.dataset.ersatz) { box.dataset.ersatz = '1'; ZI.setze(box, moeweSvg(geschenk)); } };
    const a = h('img', { src: ZI.BILD(geschenk ? 'moewe-geschenk' : 'moewe-oben'), alt: '', class: 'fluegel-a' });
    a.addEventListener('error', ersatz, { once: true });
    box.appendChild(a);
    if (!geschenk) {
      const b = h('img', { src: ZI.BILD('moewe-unten'), alt: '', class: 'fluegel-b' });
      b.addEventListener('error', () => { b.remove(); box.classList.add('ein-bild'); }, { once: true });
      box.appendChild(b);
    }
    return box;
  }
  /* Möwe bringt ein Geschenk: fliegt von rechts nach links (Blickrichtung gespiegelt),
     lässt das Geschenk über der Insel fallen und fliegt ohne Geschenk weiter */
  function moeweMitGeschenk(behaelter) {
    const ziel = behaelter || buehne;
    const m = h('div', { class: 'moewe-flug', 'aria-hidden': 'true' }, moewe(true));
    ziel.appendChild(m);
    setTimeout(() => {
      const r = m.getBoundingClientRect(); const z = ziel.getBoundingClientRect();
      const g = h('div', { class: 'geschenk-fall', 'aria-hidden': 'true', style: { left: (r.left - z.left + r.width * 0.35) + 'px', top: (r.top - z.top + r.height * 0.6) + 'px', width: (r.width * 0.35) + 'px' } },
        ZI.bildOder('geschenk', '', null));
      ziel.appendChild(g); setTimeout(() => g.remove(), 1600);
      ZI.setze(m, moewe(false));
    }, 2600);
    setTimeout(() => m.remove(), 4200);
  }

  const tafel = h('div', { class: 'tafel pergament auf-pergament' });
  const unterTitel = h('div', { class: 'unter' });
  const titel = h('div', { class: 'insel-titel' }, h('h1', null, 'Die Zwergeninsel'), unterTitel);
  /* Vollbild für das Smartboard */
  const vollbildKnopf = h('button', { class: 'rund', 'aria-label': 'Vollbild', title: 'Vollbild (Taste F)' }, icon.vollbild());
  const imVollbild = () => !!(document.fullscreenElement || document.webkitFullscreenElement);
  function vollbildUmschalten() {
    const el = document.documentElement;
    if (imVollbild()) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    else if (el.requestFullscreen) el.requestFullscreen().catch(() => ZI.meldung('Vollbild ist hier nicht möglich. Am Laptop hilft die Taste F11.'));
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    else ZI.meldung('Vollbild ist hier nicht möglich. Am Laptop hilft die Taste F11.');
  }
  vollbildKnopf.addEventListener('click', vollbildUmschalten);
  const vollbildAnzeigen = () => {
    ZI.setze(vollbildKnopf, imVollbild() ? icon.vollbildAus() : icon.vollbild());
    vollbildKnopf.setAttribute('aria-label', imVollbild() ? 'Vollbild beenden' : 'Vollbild');
  };
  document.addEventListener('fullscreenchange', vollbildAnzeigen);
  document.addEventListener('webkitfullscreenchange', vollbildAnzeigen);
  document.addEventListener('keydown', (e) => {
    if ((e.key === 'f' || e.key === 'F') && !e.ctrlKey && !e.metaKey && !document.querySelector('.schleier, .rat') && !/INPUT|TEXTAREA/.test((document.activeElement || {}).tagName)) vollbildUmschalten();
  });
  const knoepfe = h('div', { class: 'insel-knoepfe' },
    h('button', { class: 'knopf', onclick: oeffneLieferungen }, icon.tastatur(), 'Lieferungen'),
    h('button', { class: 'knopf holz', onclick: () => oeffneStammesraete() }, 'Zwergenrat'),
    h('button', { class: 'knopf holz', onclick: oeffneRaetsel }, 'Inselrätsel'),
    h('button', { class: 'knopf holz', onclick: oeffneAuftrag }, 'Auftrag'),
    vollbildKnopf,
    h('button', { class: 'rund', 'aria-label': 'Einstellungen', onclick: oeffneEinstellungen }, icon.zahnrad()));
  screen.append(buehne, titel, tafel, knoepfe);
  document.getElementById('app').appendChild(screen);

  function zeigeGebaeude(animiert) {
    const soll = sollGebaut();
    const neu = soll.filter((id) => !insel.gebaut.includes(id));
    ZI.GEBAEUDE.forEach((g) => {
      const el = bauEls[g.id];
      const ist = insel.gebaut.includes(g.id) || (!animiert && soll.includes(g.id));
      el.classList.toggle('gebaut', ist);
      el.querySelector('.fertig').style.display = ist ? '' : 'none';
      el.classList.toggle('gesperrt', g.kapitel > kap() + 1);
      el.classList.toggle('mit-rauch', ist);
    });
    if (!animiert) { insel.gebaut = soll.slice(); sichern(); return; }
    neu.forEach((id, i) => setTimeout(() => baue(id), 900 * i + 300));
    if (kapitelFertig() && !insel.gefeiert.includes(kap())) {
      insel.gefeiert.push(kap());
      setTimeout(feiern, 900 * neu.length + 2200);
    }
    insel.gebaut = Array.from(new Set([...insel.gebaut, ...soll]));
    sichern();
  }

  function baue(id) {
    const el = bauEls[id]; const g = ZI.GEBAEUDE.find((x) => x.id === id);
    const r = el.getBoundingClientRect(); const b = buehne.getBoundingClientRect();
    const cx = r.left - b.left + r.width / 2; const cy = r.top - b.top + r.height * 0.75;
    for (let i = 0; i < 16; i++) {
      const s = h('span', { class: 'staub' });
      const w = Math.random() * Math.PI * 2; const d = 40 + Math.random() * 90;
      s.style.left = cx + 'px'; s.style.top = cy + 'px';
      s.style.setProperty('--dx', Math.cos(w) * d + 'px'); s.style.setProperty('--dy', Math.sin(w) * d * 0.5 - 20 + 'px');
      buehne.appendChild(s); setTimeout(() => s.remove(), 1200);
    }
    setTimeout(() => {
      el.classList.add('gebaut');
      el.querySelector('.fertig').style.display = '';
      el.classList.remove('wird-gebaut'); void el.offsetWidth; el.classList.add('wird-gebaut');
      el.classList.add('mit-rauch');
      const u = ZI.bauUebung(id);
      ZI.meldung(g.name + ' steht!' + (u ? ' Neue Übung in der Schmiede: „' + u.name + '“' : ''), u ? 5000 : 3200);
      zeigeTafel();
    }, 450);
  }

  function zeigeSchmuck(animiert) {
    const anzahl = Math.min(ZI.SCHMUCK.length, Math.floor((edelsteine() + (insel.geschenke || 0) * 5) / ZI.SCHMUCK_PRO));
    ZI.setze(sonderSchicht, ...ZI.SONDERSCHMUCK.slice(0, insel.sonder || 0).map((s) =>
      h('div', { class: 'schmuck sonder', style: { left: s.x + '%', top: s.y + '%', width: s.w + '%', animation: 'none' } }, ZI.bildOder([s.id, s.alt], s.name, null))));
    ZI.setze(schmuckSchicht, ...ZI.SCHMUCK.slice(0, anzahl).map((s, i) => {
      const el = h('div', { class: 'schmuck', style: { left: s.x + '%', top: s.y + '%', width: s.w + '%' } }, ZI.bildOder(s.id, s.name, null));
      if (!animiert || i < insel.schmuck) el.style.animation = 'none';
      return el;
    }));
    if (animiert && anzahl > insel.schmuck) ZI.meldung('Neuer Schmuck fürs Dorf: ' + ZI.SCHMUCK[anzahl - 1].name + '!', 3000);
    insel.schmuck = anzahl; sichern();
  }

  /* Gelieferte Zwerge stehen um das Lagerfeuer */
  const PLAETZE = [[34, 55], [44, 55], [37, 59], [42, 59], [31, 52], [47, 52],
    [64, 83], [68, 81], [77, 82], [27, 79], [31, 81], [19, 68], [29, 67], [36, 73], [45, 72],
    [57, 66], [67, 65], [44, 47], [55, 47], [16, 48], [26, 48], [25, 31], [64, 40], [74, 40],
    [79, 52], [89, 54], [43, 24], [52, 24], [72, 19], [85, 69], [60, 85], [22, 84]];
  function platz(i) {
    if (i < PLAETZE.length) return { x: PLAETZE[i][0], y: PLAETZE[i][1] };
    i -= PLAETZE.length;
    const ring = Math.floor(i / 10); const pos = i % 10;
    const winkel = (pos / 10) * Math.PI * 2 + ring * 0.3;
    const rx = 9 + ring * 4.5; const ry = 5 + ring * 2.6;
    return { x: 50 + Math.cos(winkel) * rx, y: 62 + Math.sin(winkel) * ry };
  }
  function zeigeZwerge(neueIds) {
    const liste = Object.entries(insel.zwerge).sort((a, b) => a[1].erst - b[1].erst);
    ZI.setze(zwergSchicht, ...liste.map(([id, e], i) => {
      const s = standVon(e); if (!s) return null;
      const z = ZI.ZWERGE.find((d) => d.nr === s.zwerg);
      const p = platz(i);
      return h('div', { class: 'mini-zwerg' + (neueIds && neueIds.includes(id) ? ' neu' : ''),
        style: { left: p.x + '%', top: p.y + '%', zIndex: String(3 + Math.round(p.y)), animationDelay: (i % 7) * 0.3 + 's' } }, bild(z.datei, z.name));
    }));
  }

  /* Tafel: 'offen' | 'kompakt' | 'versteckt' (nur ein kleiner Reiter am Rand) */
  function tafelZustand() {
    const z = ZI.speicher.lesen('zi-tafel', null);
    if (z === 'offen' || z === 'kompakt' || z === 'versteckt') return z;
    return ZI.speicher.lesen('zi-tafel-zu', true) ? 'kompakt' : 'offen';
  }
  function tafelSetzen(z) { ZI.speicher.schreiben('zi-tafel', z); zeigeTafel(); }
  function tafelZu() { return tafelZustand() !== 'offen'; }
  function zeigeTafel() {
    const k = kap();
    const m = material(); const zl = ziel();
    const n = naechstes();
    const gems = edelsteine();
    const anteil = Math.min(100, Math.round((m / zl) * 100));
    const nk = ZI.KAPITEL[k + 1];
    unterTitel.textContent = 'Kapitel ' + ZI.KAPITEL[k].nr + ' · ' + ZI.KAPITEL[k].titel;
    let status;
    const rf = wartetAufRat();
    const rfFaellig = rf && bauplan().some((x) => x.frage === rf.id && m / zl >= x.anteil - 1e-9);
    if (rfFaellig) status = h('div', { class: 'rat-wartet' },
      h('b', null, 'Der Zwergenrat muss entscheiden!'),
      h('div', null, 'Die Klasse stimmt über eine Streitfrage ab. Davon hängt ab, was gebaut wird: ' + rf.optionen.map((id) => ZI.GEBAEUDE.find((g) => g.id === id).name).join(' oder ') + '.'),
      h('div', { class: 'knopf-reihe', style: { justifyContent: 'flex-start', gap: '6px' } },
        h('button', { class: 'knopf klein', onclick: () => oeffneStammesraete() }, 'Zwergenrat beginnen'),
        h('button', { class: 'knopf holz klein', onclick: () => oeffneRat() }, 'Klassenabstimmung')));
    else if (n) status = h('div', { class: 'klein' }, 'Als Nächstes: ', h('b', null, n.gebaeude.name), ' – noch ' + n.bedarf + ' Lieferung' + (n.bedarf === 1 ? '' : 'en') + '.',
      rf ? h('div', { style: { marginTop: '4px' } }, 'Bald tagt der Zwergenrat. Danach entsteht: ' + rf.optionen.map((id) => ZI.GEBAEUDE.find((g) => g.id === id).name).join(' oder ')) : null);
    else if (nk) status = h('div', { class: 'klein' }, h('b', null, 'Kapitel ' + ZI.KAPITEL[k].nr + ' geschafft! '), 'Mit der Inselbotschaft öffnet sich in der Schmiede Kapitel ' + nk.nr + '.',
      naechstesKapitelBereit() ? h('div', { style: { marginTop: '8px' } }, h('button', { class: 'knopf klein', onclick: kapitelWeiter }, 'Kapitel ' + nk.nr + ' beginnen')) : null);
    else status = h('div', { class: 'klein' }, h('b', null, 'Das ganze Dorf steht!'));
    const zustand = tafelZustand();
    const zu = zustand !== 'offen';
    tafel.classList.toggle('zu', zu);
    tafel.classList.toggle('versteckt', zustand === 'versteckt');
    if (zustand === 'versteckt') {
      // ganz eingeklappt: nur ein kleiner Reiter – die Insel ist frei
      ZI.setze(tafel, h('button', { class: 'tafel-reiter' + (rfFaellig ? ' achtung' : ''), 'aria-label': 'Baumaterial-Tafel öffnen', onclick: () => tafelSetzen('kompakt') },
        h('span', { class: 'tafel-reiter-pfeil', 'aria-hidden': 'true' }, '◂'),
        h('span', null, h('b', null, m + '/' + zl), rfFaellig ? ' · Rat!' : '')));
      return;
    }
    ZI.setze(tafel,
      h('div', { class: 'tafel-kopf' },
        h('h2', { style: { fontSize: '24px' } }, 'Baumaterial'),
        h('div', { class: 'tafel-kopf-knoepfe' },
          h('button', { class: 'tafel-klapp', 'aria-label': zu ? 'Tafel aufklappen' : 'Tafel kleiner machen', 'aria-expanded': String(!zu),
            onclick: () => tafelSetzen(zu ? 'offen' : 'kompakt') }, zu ? '▾' : '▴'),
          h('button', { class: 'tafel-klapp', 'aria-label': 'Tafel ganz einklappen', title: 'Ganz einklappen', onclick: () => tafelSetzen('versteckt') }, '▸'))),
      h('div', null, h('span', { class: 'zahl' }, String(m)), h('span', { style: { fontSize: '22px' } }, ' von ' + zl)),
      h('div', { class: 'balken', role: 'progressbar', 'aria-valuenow': String(anteil), 'aria-valuemin': '0', 'aria-valuemax': '100' }, h('div', { style: { width: anteil + '%' } })),
      status,
      h('button', { class: 'tafel-botschaft', title: 'Groß zeigen – diese Botschaft tippen die Kinder in der Schmiede ein.',
        onclick: () => grossZeigen('Inselbotschaft', silbig(botschaftDaten().wort), 'Schmiede → „Inselbotschaft“ → eintippen') },
        h('span', null, 'Inselbotschaft'), h('b', null, silbig(botschaftDaten().wort)), h('span', { class: 'lupe', 'aria-hidden': 'true' }, '⤢')),
      zu ? null : auftragAnzeige(),
      zu ? null : h('div', { class: 'zeile' }, bild('edelstein', 'Edelsteine'), gems + ' Edelsteine · ' + insel.schmuck + ' Schmuckstücke' + (insel.geschenke ? ' · ' + insel.geschenke + ' Möwengeschenke' : '')),
      zu ? null : h('div', { class: 'zeile' }, bild('zwerg-01-brumm', 'Zwerge'), Object.keys(insel.zwerge).length + ' von ' + insel.klassengroesse + ' Zwergen haben geliefert'),
      m === 0 && !zu ? h('div', { class: 'klein' }, 'Jede geschaffte Station im Hauptstollen ' + (k > 0 ? 'von Kapitel ' + ZI.KAPITEL[k].nr + ' ' : '') + 'bringt 1 Material. Am Ende der Stunde tippt ihr die Lieferscheine ein.') : null);
  }

  function kapitelWeiter() {
    if (!naechstesKapitelBereit()) return;
    insel.kapitel = kap() + 1; sichern();
    ZI.meldung('Kapitel ' + ZI.KAPITEL[kap()].nr + ' beginnt: ' + ZI.KAPITEL[kap()].titel + '!', 3500);
    allesZeigen(false);
  }

  function allesZeigen(animiert, neueIds) {
    zeigeGebaeude(animiert);
    zeigeSchmuck(animiert);
    zeigeZwerge(neueIds);
    pruefeAuftrag(animiert);
    zeigeTafel();
  }

  /* ---------- Auftrag des Tages ---------- */
  const heute = () => new Date().toISOString().slice(0, 10);
  function auftragWert(a) {
    const def = ZI.AUFTRAEGE.find((d) => d.id === a.typ);
    if (!def) return 0;
    if (def.liefernZaehlen) return Object.values(insel.zwerge).filter((e) => e.zeit >= a.start).length;
    return def.wert(staende()) - a.basis;
  }
  function auftragAnzeige() {
    const a = insel.auftrag;
    if (!a || a.tag !== heute()) return null;
    const def = ZI.AUFTRAEGE.find((d) => d.id === a.typ);
    const w = Math.min(a.ziel, Math.max(0, auftragWert(a)));
    return h('div', { class: 'auftrag-box' + (a.erledigt ? ' erledigt' : '') },
      h('div', { class: 'auftrag-titel' }, ZI.bildOder('auftrag-rolle', '', null, 'auftrag-bild'), a.erledigt ? 'Auftrag erfüllt!' : 'Auftrag des Tages'),
      h('div', { class: 'klein' }, def.text(a.ziel)),
      h('div', { class: 'balken' }, h('div', { style: { width: (w / a.ziel) * 100 + '%' } })),
      h('div', { class: 'klein' }, w + ' von ' + a.ziel + ' ' + def.einheit));
  }
  function pruefeAuftrag(animiert) {
    const a = insel.auftrag;
    if (!a || a.erledigt || a.tag !== heute()) return;
    if (auftragWert(a) >= a.ziel) {
      a.erledigt = true;
      insel.sonder = Math.min(ZI.SONDERSCHMUCK.length, (insel.sonder || 0) + 1);
      sichern();
      zeigeSchmuck(false);
      if (animiert) setTimeout(() => {
        ZI.feuerwerk(7000);
        const sonder = ZI.SONDERSCHMUCK[insel.sonder - 1];
        ZI.meldung('Auftrag erfüllt! Als Belohnung steht jetzt ' + (sonder ? sonder.name : 'etwas Besonderes') + ' im Dorf.', 5000);
      }, 1500);
    }
  }
  function oeffneAuftrag() {
    const n = insel.klassengroesse;
    const a = insel.auftrag;
    const laeuft = a && a.tag === heute();
    const vorschlaege = ZI.mischen(ZI.AUFTRAEGE).slice(0, 3);
    const f = ZI.fenster([
      h('h2', null, 'Auftrag des Tages'),
      laeuft ? h('div', { style: { alignSelf: 'stretch' } }, auftragAnzeige()) : null,
      h('p', { style: { margin: 0 } }, laeuft ? 'Ihr könnt den Auftrag auch tauschen:' : 'Wählt ein gemeinsames Ziel für heute. Schafft es die Klasse, gibt es ein Feuerwerk und ein besonderes Stück fürs Dorf.'),
      h('div', { class: 'auftrag-wahl' }, vorschlaege.map((d) => {
        const ziel = d.ziel(n);
        return h('button', { class: 'option', onclick: () => {
          insel.auftrag = { typ: d.id, ziel, tag: heute(), start: Date.now(), basis: d.wert ? d.wert(staende()) : 0, erledigt: false };
          sichern(); f.schliessen(); allesZeigen(false); ZI.meldung('Neuer Auftrag: ' + d.text(ziel), 4000);
        } }, d.text(ziel));
      })),
      h('button', { class: 'knopf holz', onclick: () => f.schliessen() }, 'Schließen'),
    ], { schliessbar: true });
    f.el.classList.add('breit');
  }

  /* ---------- Inselrätsel zum Stundenbeginn ---------- */
  function oeffneRaetsel() {
    const fragen = ZI.raetselFragen(kap(), 5);
    let nr = 0; let treffer = 0;
    const buchst = ['A', 'B', 'C', 'D'];
    const inhalt = h('div', { class: 'raetsel-inhalt' });
    const zaehlerEl = h('div', { class: 'uhr' });
    const ui = h('div', { class: 'rat raetsel' },
      ZI.hintergrund('titel-hintergrund', 'hg-ersatz-titel', 'rgba(20,12,8,0.45)'),
      h('div', { class: 'leiste' },
        h('button', { class: 'rund', 'aria-label': 'Zurück zur Insel', onclick: () => ui.remove() }, icon.zurueck()),
        h('div', { class: 'titel' }, 'Inselrätsel'),
        h('div', { class: 'spacer' }), zaehlerEl),
      inhalt);
    document.body.appendChild(ui);

    function frage() {
      const f = fragen[nr];
      zaehlerEl.textContent = 'Frage ' + (nr + 1) + ' von ' + fragen.length;
      const opts = f.optionen.map((o, i) => h('div', { class: 'raetsel-option' }, h('span', { class: 'buchstabe' }, buchst[i]), h('span', null, o.text)));
      const loesen = h('button', { class: 'knopf' }, 'Auflösen');
      const unten = h('div', { class: 'knopf-reihe' }, loesen);
      loesen.addEventListener('click', () => {
        f.optionen.forEach((o, i) => opts[i].classList.add(o.ok ? 'richtig' : 'weg'));
        ZI.setze(unten,
          h('div', { class: 'rueckmeldung tipp', style: { flexBasis: '100%' } }, f.info || ''),
          h('button', { class: 'knopf moos', onclick: () => { treffer++; insel.geschenke = (insel.geschenke || 0) + 1; sichern(); moewe(); weiter(); } }, 'Die meisten hatten recht'),
          h('button', { class: 'knopf holz', onclick: weiter }, 'Noch nicht ganz'));
      });
      ZI.setze(inhalt,
        h('div', { class: 'raetsel-karte pergament auf-pergament' },
          h('div', { class: 'frage', style: { fontSize: 'clamp(24px, 2vw, 40px)', color: 'var(--tinte-hell)' } },
            h('span', null, f.frage)),
          f.kopf ? h('div', { class: 'meinung', style: { fontSize: 'clamp(24px, 2.4vw, 38px)', whiteSpace: 'pre-line' } }, f.kopf) : null,
          h('div', { class: 'raetsel-optionen' }, opts),
          h('p', { class: 'klein', style: { margin: 0, fontSize: '18px', color: 'var(--tinte-hell)' } }, 'Zeigt mit den Fingern: 1 Finger für A, 2 für B, 3 für C.'),
          unten));
    }
    function moewe() { moeweMitGeschenk(ui); ZI.meldung('Eine Möwe bringt ein Geschenk zur Insel!', 2200); }
    function weiter() {
      nr++;
      if (nr < fragen.length) { setTimeout(frage, 300); return; }
      if (treffer >= 4) ZI.konfetti(120);
      ZI.setze(inhalt, h('div', { class: 'raetsel-karte pergament auf-pergament', style: { alignItems: 'center', textAlign: 'center' } },
        h('h2', { style: { fontSize: '44px' } }, treffer + ' von ' + fragen.length + ' richtig!'),
        h('p', { style: { margin: 0, fontSize: '24px' } }, treffer ? 'Die Möwen haben ' + treffer + ' Geschenk' + (treffer === 1 ? '' : 'e') + ' zur Insel gebracht. Jedes Geschenk hilft beim Schmücken des Dorfs.' : 'Nächstes Mal bringen die Möwen bestimmt Geschenke!'),
        h('button', { class: 'knopf', onclick: () => { ui.remove(); allesZeigen(true); } }, 'Zur Insel')));
    }
    frage();
  }

  /* ---------- Lieferung annehmen ---------- */
  /* Lieferschein (4 Zeichen) in den Stand der Karte einrechnen */
  function annehmenSchein(info, erzwingen) {
    const key = 'karte-' + info.karte;
    const alt = insel.zwerge[key];
    const altStand = alt ? standVon(alt) : null;
    if (altStand && altStand.zwerg !== info.zwerg && !erzwingen) return { konflikt: true, altZwerg: altStand.zwerg, info };
    const s = altStand || new ZI.Stand({ id: info.karte });
    s.id = info.karte; s.zwerg = info.zwerg;
    const k = info.kapitel;
    s.setzeKernBits(k, info.kern); s.liefer[k] = Math.max(s.liefer[k] || 0, info.tief); s.bonus[k] = Math.max(s.bonus[k], info.bonus);
    s.offen = Math.max(s.offen, k);
    insel.zwerge[key] = { code: s.code(), liefer: s.liefer.slice(), erst: alt ? alt.erst : Date.now(), zeit: Date.now(), tag: heute(), karte: info.karte, lang: !!(alt && alt.lang) };
    sichern();
    return { id: key, stand: s, neu: !alt, vorher: alt ? Object.assign({}, alt) : null, info };
  }
  /* ganzer Zwergenpass (12 Zeichen) – falls jemand den langen Code nennt */
  function annehmenPass(text) {
    const s = ZI.Stand.ausCode(text);
    if (!s) return null;
    if (!s.karte) {
      const id = String(s.id); const alt = insel.zwerge[id];
      insel.zwerge[id] = { code: s.code(), erst: alt ? alt.erst : Date.now(), zeit: Date.now(), tag: heute() };
      sichern();
      return { id, stand: s, neu: !alt, vorher: alt ? Object.assign({}, alt) : null };
    }
    let erg = null;
    for (let k = 0; k <= s.offen; k++) {
      erg = annehmenSchein({ karte: s.karte, zwerg: s.zwerg, kapitel: k, kern: s.kern[k], tief: Math.min(7, s.extra(k)), bonus: s.bonus[k] }, true) || erg;
    }
    // Tiefen je Stollen und Gebäude-Übungen stecken nur im langen Code – dazurechnen
    const key = 'karte-' + s.karte;
    const ges = standVon(insel.zwerge[key]);
    for (let k = 0; k < 3; k++) for (let i = 0; i < 4; i++) ges.setzeTiefe(k, i, s.tiefe(k, i));
    ges.bau |= s.bau;
    insel.zwerge[key].code = ges.code(); insel.zwerge[key].lang = true;
    sichern();
    if (erg) erg.stand = ges;
    return erg;
  }
  function kartenNr(id, e) { return e && e.karte ? e.karte : null; }

  /* ---------- Lieferungen eintippen (Tastatur oder Bildschirmtastatur) ---------- */
  const ZEICHEN = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  function oeffneLieferungen() {
    const neueIds = [];
    let puffer = '';
    let letzte = null; // für „Rückgängig“
    const kaesten = [0, 1, 2, 3].map(() => h('div', { class: 'schein-kasten' }));
    const anzeige = h('div', { class: 'schein-eingabe', 'aria-live': 'polite' }, ...kaesten);
    const rueck = h('div', { class: 'liefer-rueck' }, h('div', { class: 'klein' }, 'Tippt die 4 Zeichen vom Lieferschein ein. Nach dem 4. Zeichen wird sofort geliefert.'));
    const raster = h('div', { class: 'liefer-raster' });
    const zaehler = h('div', { class: 'liefer-zaehler' });
    const tasten = h('div', { class: 'schein-tasten' },
      ...ZEICHEN.split('').map((c) => h('button', { class: 'schein-taste', onclick: () => tippe(c) }, c)),
      h('button', { class: 'schein-taste breit', 'aria-label': 'Löschen', onclick: loesche }, '⌫'));

    function zeigePuffer() { kaesten.forEach((k, i) => { k.textContent = puffer[i] || ''; k.classList.toggle('voll', !!puffer[i]); }); }
    function tippe(c) {
      c = String(c).toUpperCase();
      if (!ZEICHEN.includes(c)) { if (/^[01IO]$/.test(c)) ZI.meldung('Im Lieferschein gibt es keine 0, 1, I oder O.', 2000); return; }
      if (puffer.length >= 4) puffer = ''; // offene Rückfrage: neuer Code beginnt
      puffer += c; zeigePuffer();
      if (puffer.length === 4) setTimeout(pruefe, 120);
    }
    function loesche() { puffer = puffer.slice(0, -1); zeigePuffer(); }

    function pruefe() {
      const info = ZI.Stand.ausLieferCode(puffer);
      if (!info) {
        anzeige.classList.remove('wackeln'); void anzeige.offsetWidth; anzeige.classList.add('wackeln');
        ZI.setze(rueck, h('div', { class: 'rueckmeldung schlecht' }, '„' + puffer + '“ ist kein gültiger Lieferschein. Bitte noch einmal vorlesen lassen.'));
        puffer = ''; setTimeout(zeigePuffer, 500);
        return;
      }
      const erg = annehmenSchein(info, false);
      if (erg.konflikt) { frageKonflikt(erg); return; }
      gelungen(erg);
    }
    function frageKonflikt(erg) {
      const alt = ZI.ZWERGE.find((d) => d.nr === erg.altZwerg); const neu = ZI.ZWERGE.find((d) => d.nr === erg.info.zwerg);
      ZI.setze(rueck, h('div', { class: 'rueckmeldung tipp' },
        h('div', null, h('b', null, 'Karte ' + erg.info.karte + ':'), ' Bisher war das ' + alt.name + ', jetzt kommt ' + neu.name + '. Hat das Kind den Zwerg gewechselt?'),
        h('div', { class: 'knopf-reihe', style: { justifyContent: 'flex-start', marginTop: '8px' } },
          h('button', { class: 'knopf klein', onclick: () => gelungen(annehmenSchein(erg.info, true)) }, 'Ja, übernehmen'),
          h('button', { class: 'knopf holz klein', onclick: () => { puffer = ''; zeigePuffer(); ZI.setze(rueck, h('div', { class: 'klein' }, 'Abgebrochen. Bitte die Kartennummer prüfen.')); } }, 'Nein, abbrechen'))));
    }
    function gelungen(erg) {
      if (!neueIds.includes(erg.id)) neueIds.push(erg.id);
      letzte = erg;
      const z = ZI.ZWERGE.find((d) => d.nr === erg.stand.zwerg);
      const i = erg.info;
      const teile = [i.kapitel !== kap() ? 'Kapitel ' + (i.kapitel + 1) : null, ZI.Stand.bits(i.kern) + ' Material', i.tief ? i.tief + '× tiefer gegraben' : null].filter(Boolean);
      ZI.setze(rueck, h('div', { class: 'liefer-ok' },
        h('div', { class: 'liefer-ok-bild' }, bild(z.datei, z.name)),
        h('div', null, h('div', { class: 'liefer-ok-titel' }, 'Karte ' + i.karte + ' · ' + z.name), h('div', null, teile.join(' · '))),
        h('button', { class: 'knopf holz klein', onclick: rueckgaengig }, 'Rückgängig')));
      puffer = ''; zeigePuffer(); zeigeRaster();
    }
    function rueckgaengig() {
      if (!letzte) return;
      if (letzte.vorher) insel.zwerge[letzte.id] = letzte.vorher; else delete insel.zwerge[letzte.id];
      const pos = neueIds.indexOf(letzte.id); if (pos >= 0 && !letzte.vorher) neueIds.splice(pos, 1);
      sichern(); letzte = null; zeigeRaster();
      ZI.setze(rueck, h('div', { class: 'klein' }, 'Rückgängig gemacht.'));
    }
    function zeigeRaster() {
      const max = Math.max(insel.klassengroesse, ...Object.values(insel.zwerge).map((e) => e.karte || 0));
      let heuteZahl = 0;
      const zellen = [];
      for (let n = 1; n <= Math.min(32, max); n++) {
        const e = insel.zwerge['karte-' + n];
        const da = e && e.tag === heute();
        if (da) heuteZahl++;
        zellen.push(h('div', { class: 'liefer-zelle' + (da ? ' da' : e ? ' frueher' : ''), title: da ? 'heute geliefert' : e ? 'früher geliefert' : 'noch nie geliefert' }, String(n)));
      }
      ZI.setze(raster, ...zellen);
      zaehler.textContent = heuteZahl + ' von ' + insel.klassengroesse + ' Karten heute geliefert';
    }
    function langerCode() {
      const eingabe = h('input', { class: 'eingabe', maxlength: '14', autocomplete: 'off', autocorrect: 'off', autocapitalize: 'characters', spellcheck: 'false', placeholder: 'XXXX-XXXX-XXXX', 'aria-label': 'Zwergenpass-Code' });
      eingabe.addEventListener('input', () => { eingabe.value = ZI.formatiereCode(eingabe.value); });
      const hin = h('div');
      const ok = () => {
        const erg = annehmenPass(eingabe.value);
        if (!erg) { ZI.setze(hin, h('div', { class: 'rueckmeldung schlecht' }, 'Der Code stimmt nicht.')); return; }
        g.schliessen(); if (!erg.info) erg.info = { karte: erg.stand.karte || '–', kapitel: kap(), kern: erg.stand.kern[kap()], tief: Math.min(7, erg.stand.extra(kap())) };
        gelungen(erg);
      };
      eingabe.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') ok(); });
      const g = ZI.fenster([h('h2', null, 'Langen Zwergenpass eintippen'), eingabe, hin,
        h('div', { class: 'knopf-reihe' }, h('button', { class: 'knopf holz', onclick: () => g.schliessen() }, 'Abbrechen'), h('button', { class: 'knopf', onclick: ok }, 'Liefern'))]);
      setTimeout(() => eingabe.focus(), 150);
    }
    function taste(e) {
      if (document.querySelectorAll('.fenster').length > 1) return; // anderes Fenster obenauf
      if (e.key === 'Backspace') { e.preventDefault(); loesche(); return; }
      if (e.key === 'Escape') { schliessen(); return; }
      if (e.key.length === 1 && /[0-9a-z]/i.test(e.key)) { e.preventDefault(); tippe(e.key); }
    }
    function schliessen() { document.removeEventListener('keydown', taste); f.schliessen(); allesZeigen(true, neueIds); }

    const f = ZI.fenster([
      h('div', { class: 'liefer-kopf' }, h('h2', { style: { margin: 0 } }, 'Lieferungen'), zaehler),
      h('div', { class: 'liefer-fenster' },
        h('div', { class: 'liefer-links' }, anzeige, rueck, tasten),
        h('div', { class: 'liefer-rechts' },
          h('div', { class: 'klein' }, 'Grün: heute geliefert'),
          raster,
          h('button', { class: 'knopf-link', onclick: langerCode }, 'Langen Zwergenpass-Code eintippen'))),
      h('div', { class: 'knopf-reihe' }, h('button', { class: 'knopf', onclick: schliessen }, 'Fertig – Dorf bauen!')),
    ]);
    f.el.classList.add('breit', 'liefer-dialog');
    document.addEventListener('keydown', taste);
    zeigePuffer(); zeigeRaster();
  }

  /* ---------- Zwergenrat ---------- */
  /* ---------- Kartennummern und Zwerge ---------- */
  function kartenNummern() {
    const max = Math.min(32, Math.max(insel.klassengroesse, ...Object.values(insel.zwerge).map((e) => e.karte || 0)));
    return Array.from({ length: max }, (_, i) => i + 1);
  }
  function zwergDerKarte(n) {
    const e = insel.zwerge['karte-' + n];
    const s = e && standVon(e);
    return s ? ZI.ZWERGE.find((d) => d.nr === s.zwerg) : null;
  }
  function kartenKopf(n) {
    const z = zwergDerKarte(n);
    return h('div', { class: 'karten-kopf' }, z ? bild(z.datei, z.name) : h('div', { class: 'karten-kopf-leer' }), h('b', null, String(n)));
  }

  /* ---------- Zwergenrat, Teil 1: Stämme beraten eine Streitfrage (PRO/CONTRA) ---------- */
  function themaFuerJetzt() {
    const rf = wartetAufRat() || (ZI.RATSFRAGEN[kap()] || []).find((f) => !insel.rat[f.id]);
    const i = rf ? ZI.RATSFRAGEN.flat().indexOf(rf) : -1;
    return (i >= 0 ? i : 0) % ZI.STREITFRAGEN.length;
  }
  function offeneRatsfrage() { return wartetAufRat() || (ZI.RATSFRAGEN[kap()] || []).find((f) => !insel.rat[f.id] && !f.optionen.some((id) => insel.gebaut.includes(id))) || null; }
  function redezeit(min) {
    let sek = min * 60; let timer = null;
    const uhr = h('div', { class: 'uhr' }, min + ':00');
    const knopf = h('button', { class: 'knopf holz klein' }, 'Redezeit starten');
    knopf.addEventListener('click', () => {
      if (timer) { clearInterval(timer); timer = null; knopf.textContent = 'Weiter'; return; }
      knopf.textContent = 'Pause';
      timer = setInterval(() => { sek = Math.max(0, sek - 1); uhr.textContent = Math.floor(sek / 60) + ':' + String(sek % 60).padStart(2, '0');
        if (sek === 60) ZI.meldung('Noch eine Minute!', 3000);
        if (!sek) { clearInterval(timer); timer = null; knopf.textContent = 'Zeit ist um'; } }, 1000);
    });
    return { uhr, knopf, stopp: () => clearInterval(timer) };
  }
  function waehleStreitfrage(danach) {
    const f = ZI.fenster([
      h('h2', null, 'Streitfrage wählen'),
      h('div', { class: 'streitfragen-liste' }, ZI.STREITFRAGEN.map((t, i) => h('button', { class: 'knopf' + (insel.stamm.thema === i ? '' : ' holz'),
        onclick: () => { insel.stamm.thema = i; insel.stamm.stimmen = { a: 0, b: 0 }; sichern(); f.schliessen(); danach(); } }, t.frage))),
      h('div', { class: 'knopf-reihe' }, h('button', { class: 'knopf holz', onclick: () => f.schliessen() }, 'Abbrechen')),
    ]);
    f.el.classList.add('breit');
  }
  function oeffneStammesraete() {
    const st = insel.stamm = insel.stamm || {};
    if (st.seed === undefined) st.seed = Math.floor(Math.random() * 8);
    if (st.thema === undefined || !ZI.STREITFRAGEN[st.thema]) st.thema = themaFuerJetzt();
    const zeit = redezeit(10);
    const kopf = h('div', { class: 'stamm-kopf' });
    const raster = h('div', { class: 'stamm-raster' });
    function zeichne() {
      const n = kartenNummern().length;
      const t = ZI.STREITFRAGEN[st.thema];
      const code = ZI.stammescode.kodiere(n, st.seed, st.thema);
      ZI.setze(kopf,
        h('div', { class: 'stamm-thema pergament' },
          h('div', { class: 'klein' }, 'Streitfrage für alle Stämme'),
          h('div', { class: 'stamm-frage' }, t.frage),
          h('div', { class: 'seiten-zeile' }, h('span', null, ZI.seitenMarke('pro', 'klein'), ' ', t.pro), h('span', null, ZI.seitenMarke('contra', 'klein'), ' ', t.contra)),
          h('div', { class: 'knopf-reihe', style: { justifyContent: 'flex-start', marginTop: '6px' } },
            h('button', { class: 'knopf holz klein', onclick: () => waehleStreitfrage(zeichne) }, 'Andere Streitfrage'))),
        h('button', { class: 'stamm-code pergament', title: 'Groß zeigen', onclick: () => grossZeigen('Stammescode', silbig(code), 'Schmiede → „Stammesrat“ → Code eintippen') },
          h('div', { class: 'klein' }, 'Stammescode für die iPads · antippen = groß'),
          h('b', null, silbig(code)),
          h('div', { class: 'klein' }, 'Dort stehen die Frage und eure Pro-/Contra-Position.')));
      ZI.setze(raster, ...ZI.stammesEinteilung(n, st.seed).map((g) => h('div', { class: 'stamm-karte pergament auf-pergament', style: { borderTopColor: g.farbe } },
        h('h3', { style: { color: g.farbe } }, g.name),
        h('div', { class: 'stamm-mitglieder' }, ZI.mitSeiten(g, st.seed).map((m) => h('div', { class: 'stamm-mitglied' },
          h('b', { class: 'stamm-nummer' }, String(m.karte)), ZI.seitenMarke(m.seite, 'klein')))))));
    }
    const ui = h('div', { class: 'rat stammesrat' },
      ZI.hintergrund('zwergenrat-hintergrund', 'hg-ersatz-stollen', 'rgba(20,12,8,0.45)'),
      h('div', { class: 'leiste' },
        h('button', { class: 'rund', 'aria-label': 'Zurück zur Insel', onclick: () => { zeit.stopp(); ui.remove(); } }, icon.zurueck()),
        h('div', { class: 'titel' }, 'Zwergenrat · Stämme'),
        h('div', { class: 'spacer' }),
        h('button', { class: 'knopf holz klein', onclick: () => { st.seed = (st.seed + 1 + Math.floor(Math.random() * 6)) % 8; sichern(); zeichne(); } }, 'Neu mischen'),
        zeit.uhr, zeit.knopf),
      h('div', { class: 'stamm-inhalt' }, ZI.ratsReise(1), kopf, raster,
        h('div', { class: 'stamm-unten' },
          h('div', null, 'Auf den iPads: Frage → Seite → Partner → Argumenttafel → Diskussion im Stamm → Stammesentscheidung. Danach bestimmt jeder Stamm eine Person, die das Ergebnis mitteilt.'),
          h('button', { class: 'knopf', onclick: () => { zeit.stopp(); ui.remove(); oeffneRat(); } }, 'Zur Klassenabstimmung'))));
    document.body.appendChild(ui);
    sichern(); zeichne();
  }

  /* ---------- Redeliste: wer hat schon gesprochen? ---------- */
  function oeffneRedeliste(frageId) {
    insel.rede = insel.rede || {};
    const liste = insel.rede[frageId] || (insel.rede[frageId] = {});
    let minus = false;
    const raster = h('div', { class: 'rede-raster' });
    const kopf = h('div', { class: 'liefer-zaehler' });
    const minusKnopf = h('button', { class: 'knopf holz klein' }, 'Strich wegnehmen');
    minusKnopf.addEventListener('click', () => { minus = !minus; minusKnopf.classList.toggle('aktiv', minus); minusKnopf.textContent = minus ? 'Fertig mit Wegnehmen' : 'Strich wegnehmen'; });
    function zeichne(hervor) {
      const nummern = kartenNummern();
      const gesprochen = nummern.filter((n) => liste[n] > 0).length;
      kopf.textContent = gesprochen + ' von ' + nummern.length + ' haben schon gesprochen';
      ZI.setze(raster, ...nummern.map((n) => {
        const c = liste[n] || 0;
        const b = h('button', { class: 'rede-zelle stufe-' + Math.min(c, 3) + (hervor === n ? ' hervor' : ''), 'aria-label': 'Karte ' + n + ', ' + c + ' Beiträge' },
          kartenKopf(n), h('span', { class: 'rede-striche' }, c ? '|'.repeat(Math.min(c, 6)) : ''));
        b.addEventListener('click', () => { liste[n] = Math.max(0, c + (minus ? -1 : 1)); sichern(); zeichne(); });
        return b;
      }));
    }
    zeichne();
    const f = ZI.fenster([
      h('div', { class: 'liefer-kopf' }, h('h2', { style: { margin: 0 } }, 'Redeliste'), kopf),
      h('p', { style: { margin: 0 } }, 'Tippt auf eine Karte, wenn jemand etwas beigetragen hat. Grau heißt: war noch nicht dran.'),
      raster,
      h('div', { class: 'knopf-reihe' },
        h('button', { class: 'knopf holz klein', onclick: () => {
          const leise = kartenNummern().filter((n) => !(liste[n] > 0));
          if (!leise.length) { ZI.meldung('Alle waren schon dran!'); return; }
          const n = ZI.zufall(leise); zeichne(n);
          ZI.meldung('Vielleicht möchte Karte ' + n + ' etwas sagen?', 3500);
        } }, 'Wer war noch nicht dran?'),
        minusKnopf,
        h('button', { class: 'knopf holz klein', onclick: () => { Object.keys(liste).forEach((k) => delete liste[k]); sichern(); zeichne(); } }, 'Zurücksetzen'),
        h('button', { class: 'knopf', onclick: () => f.schliessen() }, 'Fertig')),
    ]);
    f.el.classList.add('breit', 'rede-dialog');
  }

  /* ---------- Zwergenrat, Teil 2: Klassenabstimmung → Siegerseite → Gebäude ---------- */
  function oeffneRat() {
    const st = insel.stamm = insel.stamm || {};
    if (st.thema === undefined || !ZI.STREITFRAGEN[st.thema]) st.thema = themaFuerJetzt();
    const t = ZI.STREITFRAGEN[st.thema];
    const RF = offeneRatsfrage();
    const stimmen = st.stimmen = Object.assign({ a: 0, b: 0 }, st.stimmen);
    const zeit = redezeit(5);
    const seite = (x) => {
      const zahl = h('div', { class: 'abstimm-zahl' }, String(stimmen[x]));
      const aendern = (d) => { stimmen[x] = Math.max(0, stimmen[x] + d); zahl.textContent = String(stimmen[x]); sichern(); };
      return h('div', { class: 'abstimm-seite pergament auf-pergament ' + (x === 'a' ? 'pro' : 'contra') },
        ZI.seitenMarke(x === 'a' ? 'pro' : 'contra'),
        h('h3', null, x === 'a' ? t.pro : t.contra),
        zahl, h('div', { class: 'klein' }, 'Stämme'),
        h('div', { class: 'stimmen' },
          h('button', { class: 'rund', 'aria-label': 'Eine Stimme weniger', onclick: () => aendern(-1) }, '−'),
          h('button', { class: 'rund gold', 'aria-label': 'Eine Stimme mehr', onclick: () => aendern(1) }, '+')));
    };
    const zu = () => { zeit.stopp(); rat.remove(); };
    const rat = h('div', { class: 'rat' },
      ZI.hintergrund('zwergenrat-hintergrund', 'hg-ersatz-stollen', 'rgba(20,12,8,0.35)'),
      h('div', { class: 'leiste' },
        h('button', { class: 'rund', 'aria-label': 'Zurück zur Insel', onclick: zu }, icon.zurueck()),
        h('div', { class: 'titel' }, 'Der Zwergenrat stimmt ab'),
        h('div', { class: 'spacer' }),
        h('button', { class: 'knopf holz klein', onclick: () => { zu(); oeffneStammesraete(); } }, 'Zurück zu den Stämmen'),
        h('button', { class: 'knopf holz klein', onclick: () => oeffneRedeliste('streit-' + st.thema) }, 'Redeliste'),
        zeit.uhr, zeit.knopf),
      h('div', { class: 'rat-inhalt abstimmung' },
        ZI.ratsReise(9),
        h('div', { class: 'rat-frage pergament' }, t.frage),
        h('div', { class: 'abstimm-seiten' }, seite('a'), seite('b')),
        h('div', { class: 'knopf-reihe' }, h('button', { class: 'knopf gross', onclick: abschliessen }, 'Abstimmung abschließen')),
        h('div', { class: 'rat-regeln pergament auf-pergament' },
          h('p', { style: { margin: '0 0 8px' } }, h('b', null, 'Eine Person aus jedem Stamm meldet nacheinander: '), '„Die … stimmen für …, weil …“ Lehrkraft: Trage für jeden Stamm eine Stimme mit + ein.'),
          h('h3', null, 'So kannst du antworten'),
          h('ul', null, ZI.DISKUSSION_SAETZE.map((r) => h('li', null, r))))));
    document.body.appendChild(rat);

    function abschliessen() {
      if (!stimmen.a && !stimmen.b) { ZI.meldung('Tragt zuerst ein, wofür die Stämme gestimmt haben.'); return; }
      const anzahl = ZI.stammesEinteilung(kartenNummern().length, st.seed || 0).length;
      const summe = stimmen.a + stimmen.b;
      const gleich = stimmen.a === stimmen.b;
      const f = ZI.fenster([
        h('h2', null, gleich ? 'Gleichstand!' : 'Abstimmung abschließen?'),
        h('p', { class: 'abschluss-stand' }, h('span', null, ZI.seitenMarke('pro', 'klein'), ' ' + t.pro + ': ', h('b', null, String(stimmen.a))), h('span', null, ZI.seitenMarke('contra', 'klein'), ' ' + t.contra + ': ', h('b', null, String(stimmen.b)))),
        summe !== anzahl ? h('p', { class: 'rueckmeldung schlecht', style: { margin: 0 } }, summe + ' Stimmen, aber ' + anzahl + ' Stämme. Bitte prüfen.') : null,
        h('p', { style: { margin: 0, fontSize: '21px' } }, gleich ? 'Stichwahl im Plenum: Alle zeigen per Handzeichen, welche Seite sie überzeugt hat. Welche Seite hat die Mehrheit?' : 'Dann gewinnt: ' + (stimmen.a > stimmen.b ? t.pro : t.contra) + '.'),
        h('div', { class: 'knopf-reihe' },
          h('button', { class: 'knopf holz', onclick: () => f.schliessen() }, 'Noch ändern'),
          ...(gleich ? [h('button', { class: 'knopf', onclick: () => { f.schliessen(); entscheiden('a'); } }, 'Pro: ' + t.pro),
            h('button', { class: 'knopf', onclick: () => { f.schliessen(); entscheiden('b'); } }, 'Contra: ' + t.contra)]
            : [h('button', { class: 'knopf', onclick: () => { f.schliessen(); entscheiden(stimmen.a > stimmen.b ? 'a' : 'b'); } }, 'Ja, abschließen')])),
      ]);
    }
    function entscheiden(x) {
      zu();
      const geb = RF ? ZI.GEBAEUDE.find((g) => g.id === RF.optionen[x === 'a' ? 0 : 1]) : null;
      if (RF) { insel.rat[RF.id] = geb.id; insel.ratStreit = Object.assign(insel.ratStreit || {}, { [RF.id]: st.thema }); }
      st.stimmen = { a: 0, b: 0 };
      sichern();
      ZI.konfetti && ZI.konfetti(140);
      const naechste = offeneRatsfrage();
      const f = ZI.fenster([
        ZI.ratsReise(geb ? 11 : 10),
        h('h2', null, 'Der Zwergenrat hat entschieden!'),
        h('p', { style: { margin: 0, fontSize: '22px' } }, 'Gewonnen hat ', ZI.seitenMarke(x === 'a' ? 'pro' : 'contra', 'klein'), ' ', h('b', null, x === 'a' ? t.pro : t.contra)),
        geb ? h('div', { class: 'rat-ergebnis' }, h('div', { class: 'rat-ergebnis-bild' }, bild(geb.id, geb.name)),
          h('div', null,
            h('p', { style: { margin: 0, fontSize: '22px' } }, 'Darum bauen die Zwerge jetzt: ', h('b', null, geb.name)),
            h('p', { class: 'klein', style: { margin: '6px 0 0' } }, 'Hätte ' + (x === 'a' ? 'Contra' : 'Pro') + ' gewonnen, wäre ' + ZI.GEBAEUDE.find((g) => g.id === RF.optionen[x === 'a' ? 1 : 0]).name + ' zuerst entstanden.'))) : null,
        h('div', { class: 'knopf-reihe' },
          naechste ? h('button', { class: 'knopf holz', onclick: () => { f.schliessen(); st.thema = (st.thema + 1) % ZI.STREITFRAGEN.length; sichern(); oeffneStammesraete(); } }, 'Nächste Streitfrage') : null,
          h('button', { class: 'knopf', onclick: () => { f.schliessen(); allesZeigen(true); } }, geb ? 'Bauen!' : 'Zur Insel'))]);
      f.el.classList.add('rat-entschieden');
    }
  }

  /* ---------- Kapitel geschafft ---------- */
  function feiern() {
    const k = kap();
    ZI.feuerwerk(8000);
    if (!ZI.KAPITEL[k + 1] && bauEls.schiff) { bauEls.schiff.classList.remove('segelt'); void bauEls.schiff.offsetWidth; bauEls.schiff.classList.add('segelt'); }
    const nk = ZI.KAPITEL[k + 1];
    const f = ZI.fenster([
      h('div', { class: 'fest-bild' }, bild('fest-szene', 'Fest im Zwergendorf')),
      h('h2', null, 'Kapitel ' + ZI.KAPITEL[k].nr + ' geschafft!'),
      nk ? h('p', { style: { margin: 0, fontSize: '22px' } }, 'Euer Dorf wächst! Tippt in der Schmiede diese Inselbotschaft ein, dann öffnet sich Kapitel ' + nk.nr + ':') : h('p', { style: { margin: 0, fontSize: '22px' } }, 'Das ganze Dorf steht. Was für eine Leistung!'),
      nk ? h('div', { class: 'runenwort' }, silbig(botschaftDaten().wort)) : null,
      h('div', { class: 'knopf-reihe' },
        h('button', { class: 'knopf holz', onclick: () => f.schliessen() }, 'Hurra!'),
        naechstesKapitelBereit() ? h('button', { class: 'knopf', onclick: () => { f.schliessen(); kapitelWeiter(); } }, 'Kapitel ' + nk.nr + ' beginnen') : null),
    ]);
    f.el.classList.add('breit');
  }

  /* ---------- Einstellungen ---------- */
  /* ---------- Klassenüberblick (nur für die Lehrkraft) ---------- */
  function oeffneUeberblick() {
    let k = kap();
    const inhalt = h('div', { class: 'ueberblick' });
    const reiter = h('div', { class: 'knopf-reihe', style: { justifyContent: 'flex-start' } });
    function zeichne() {
      ZI.setze(reiter, ...ZI.STATIONS_NAMEN.map((_, i) => h('button', { class: 'knopf klein' + (i === k ? '' : ' holz'), onclick: () => { k = i; zeichne(); } }, 'Kapitel ' + (i + 1))));
      const nummern = kartenNummern();
      const st = nummern.map((n) => { const e = insel.zwerge['karte-' + n]; return { n, s: e ? standVon(e) : null, e }; });
      const da = st.filter((x) => x.s);
      const lang = da.filter((x) => x.e.lang);
      const N = ZI.STATIONS_NAMEN[k];
      const balken = (name, zahl, gesamt, schwer) => h('div', { class: 'ue-zeile' + (schwer ? ' schwer' : '') },
        h('div', { class: 'ue-name' }, name),
        h('div', { class: 'ue-balken' }, h('div', { style: { width: (gesamt ? (zahl / gesamt) * 100 : 0) + '%' } })),
        h('div', { class: 'ue-zahl' }, zahl + ' / ' + gesamt));
      const kernZeilen = N.kern.map((name, i) => {
        const geschafft = da.filter((x) => x.s.hatKern(k, i)).length;
        return balken(name, geschafft, nummern.length, geschafft < nummern.length * 0.6);
      });
      // freiwillige Bonus-Tiefen: aus Lieferscheinen nur als Anzahl, aus langen Codes je Stollen
      const tiefZeilen = [
        balken('Mindestens einmal tiefer gegraben', da.filter((x) => Math.max(x.s.extra(k), x.s.liefer[k] || 0) > 0).length, nummern.length, false),
        ...(lang.length ? [balken(N.gem + ' (Gemeinschaftsstollen)', lang.filter((x) => x.s.hatGemeinschaft(k)).length, lang.length, false),
          ...N.kern.map((name, i) => balken(name + ' – ab Tiefe 3', lang.filter((x) => x.s.tiefe(k, i) >= 3).length, lang.length, false))] : []),
      ];
      const bauZeilen = lang.length ? ZI.BAU_UEBUNGEN.filter((u) => u.kapitel === k).map((u) => balken(u.name, lang.filter((x) => x.s.hatBau(u.bit)).length, lang.length, false)) : [];
      const offen = st.filter((x) => !x.s || x.s.coreCount(k) < 3);
      ZI.setze(inhalt,
        h('div', { class: 'ue-spalten' },
          h('div', null,
            h('h3', null, 'Hauptstollen'), ...kernZeilen,
            h('h3', null, 'Freiwillig tiefer gegraben' + (lang.length ? ' (Stollen-Werte aus ' + lang.length + ' langen Codes)' : '')), ...tiefZeilen,
            bauZeilen.length ? h('h3', null, 'Gebäude-Stollen (aus ' + lang.length + ' langen Codes)') : null, ...bauZeilen),
          h('div', null,
            h('h3', null, 'Hauptstollen noch nicht alle fertig (' + offen.length + ')'),
            offen.length ? h('div', { class: 'ue-offen' }, offen.map((x) => h('div', { class: 'ue-karte' + (x.s ? '' : ' nie') },
              kartenKopf(x.n), h('span', null, x.s ? x.s.coreCount(k) + '/3' : 'nie geliefert')))) : h('p', null, 'Alle haben die drei Hauptstollen geschafft!'),
            h('p', { class: 'klein', style: { marginTop: '14px' } }, 'Die 4-stelligen Lieferscheine zeigen, welche Hauptstollen geschafft sind und wie oft ein Kind freiwillig tiefer gegraben hat. Gemeinschaftsstollen, Tiefen je Stollen und Gebäude-Stollen kennt die Insel nur, wenn Kinder ihren langen Zwergenpass eingeben (Lieferungen → „Langen Zwergenpass-Code eintippen“).'))));
    }
    zeichne();
    const f = ZI.fenster([h('h2', null, 'Klassenüberblick'), reiter, inhalt,
      h('div', { class: 'knopf-reihe' },
        h('button', { class: 'knopf holz', onclick: () => { f.schliessen(); oeffneUrkunden(); } }, 'Urkunden drucken'),
        h('button', { class: 'knopf', onclick: () => f.schliessen() }, 'Schließen'))], { schliessbar: true });
    f.el.classList.add('breit', 'ueberblick-dialog');
  }

  /* ---------- Urkunden für alle Kinder ---------- */
  function oeffneUrkunden() {
    const daten = kartenNummern().map((n) => { const e = insel.zwerge['karte-' + n]; const s = e && standVon(e); return s ? { n, s, lang: !!e.lang } : null; }).filter(Boolean);
    if (!daten.length) { ZI.meldung('Noch keine Lieferungen – es gibt noch keine Urkunden.'); return; }
    const w = window.open('', '_blank');
    if (!w) { ZI.meldung('Bitte Pop-ups für diese Seite erlauben.'); return; }
    const basis = location.href.replace(/[^/]*$/, '');
    const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const zahl = (x, ein, mehr) => '<b>' + x + '</b> ' + (x === 1 ? ein : mehr);
    const urkunde = ({ n, s, lang }) => {
      const z = ZI.ZWERGE.find((d) => d.nr === s.zwerg);
      const rang = ZI.rang(s);
      const kapitel = [0, 1, 2].filter((k) => s.coreCount(k) === 3).length;
      const ichKann = ZI.ICH_KANN.slice(0, Math.max(1, kapitel)).flat().slice(0, 8);
      return `<section class="urkunde">
        <div class="kopf"><img src="${basis}bilder/${z.datei}.png" alt=""><div><div class="titel">Urkunde</div><div class="unter">Zwergeninsel · Mündliches Argumentieren</div></div><div class="nr">${n}</div></div>
        <p class="name">Name: <span></span></p>
        <p>hat als <b>${esc(z.name)}</b> den Rang <b>${esc(rang.name)}</b> erreicht.</p>
        <ul class="werte">
          <li>${zahl(s.coreTotal(), 'Hauptstollen', 'Hauptstollen')} geschafft</li>
          <li>${zahl(s.deepTotal(), 'Bonus-Stufe', 'Bonus-Stufen')} (Gemeinschaftsstollen und Tiefen)</li>
          ${lang ? `<li>${zahl(s.bauTotal(), 'Gebäude-Stollen', 'Gebäude-Stollen')}</li><li>${zahl(s.kronenTotal(), 'Tiefen-Krone', 'Tiefen-Kronen')}</li>` : ''}
          <li>${zahl(s.gems(), 'Edelstein', 'Edelsteine')}</li>
        </ul>
        <table class="ichkann"><thead><tr><th>Ich kann …</th><th>sicher</th><th>fast</th><th>üben</th></tr></thead><tbody>
          ${ichKann.map((i) => `<tr><td>${esc(i.text.replace(/^Ich /, '… '))}</td><td></td><td></td><td></td></tr>`).join('')}
        </tbody></table>
        <div class="fuss"><span>Datum: ____________</span><span>Unterschrift: ________________</span></div>
      </section>`;
    };
    w.document.write(`<!doctype html><html lang="de"><head><meta charset="utf-8"><title>Urkunden Zwergeninsel</title>
      <link href="${new URL('schrift/schrift.css', location.href).href}" rel="stylesheet">
      <style>
        @page { size: A4; margin: 12mm; }
        body { font-family: 'Insel Text', sans-serif; color: #3a2617; margin: 0; background: #eee; }
        .hinweis { max-width: 186mm; margin: 12px auto; background: #fff; padding: 12px 16px; border-radius: 10px; }
        .hinweis button { font: inherit; font-weight: 700; padding: 8px 16px; border-radius: 8px; border: 2px solid #8a6438; background: #e8b23a; cursor: pointer; }
        .urkunde { width: 186mm; height: 270mm; box-sizing: border-box; margin: 0 auto 12px; background: #fffaf0; border: 2.5mm double #8a6438; border-radius: 6mm; padding: 12mm 14mm; display: flex; flex-direction: column; gap: 5mm; break-after: page; font-size: 13pt; }
        .kopf { display: flex; align-items: center; gap: 6mm; }
        .kopf img { width: 42mm; height: 42mm; object-fit: contain; }
        .titel { font-family: 'Insel Titel', sans-serif; font-size: 42pt; color: #8a4b1c; line-height: 1; }
        .unter { font-size: 12pt; color: #6b5442; }
        .nr { margin-left: auto; font-family: 'Insel Titel', sans-serif; font-size: 22pt; background: #8a4b1c; color: #fff4dc; border-radius: 4mm; padding: 2mm 5mm; }
        .name { font-size: 15pt; } .name span { display: inline-block; width: 110mm; border-bottom: 0.4mm solid #8a6438; }
        .werte { display: grid; grid-template-columns: 1fr 1fr; gap: 2mm 8mm; padding-left: 6mm; margin: 0; }
        .ichkann { width: 100%; border-collapse: collapse; font-size: 11.5pt; }
        .ichkann th, .ichkann td { border: 0.3mm solid #b08a5a; padding: 2mm 3mm; }
        .ichkann th { background: #f3e6c8; text-align: left; } .ichkann td:not(:first-child), .ichkann th:not(:first-child) { width: 15mm; text-align: center; }
        .fuss { margin-top: auto; display: flex; justify-content: space-between; font-size: 12pt; }
        @media print { body { background: #fff; } .hinweis { display: none; } .urkunde { margin: 0; } }
      </style></head><body>
      <div class="hinweis">${daten.length} Urkunden – eine pro Seite. Die Kinder kreuzen ihre „Ich kann …“-Einschätzung selbst an. <button onclick="window.print()">Drucken</button></div>
      ${daten.map(urkunde).join('')}
      </body></html>`);
    w.document.close();
  }

  function oeffneEinstellungen() {
    const zahl = h('input', { type: 'number', min: '1', max: '40', value: String(insel.klassengroesse), 'aria-label': 'Anzahl Kinder' });
    const tabelle = h('table', { class: 'lieferliste' },
      h('thead', null, h('tr', null, h('th', null, 'Zwerg'), h('th', null, 'Hauptstollen'), h('th', null, 'Edelsteine'), h('th', null, 'Zuletzt'), h('th', null, ''))),
      h('tbody', null, Object.entries(insel.zwerge).sort((x, y) => y[1].zeit - x[1].zeit).map(([id, e]) => {
        const s = standVon(e); if (!s) return null;
        const z = ZI.ZWERGE.find((d) => d.nr === s.zwerg);
        return h('tr', null,
          h('td', null, bild(z.datei, z.name), ' ', z.name),
          h('td', null, s.coreCount(kap()) + ' / 3'),
          h('td', null, String(s.gems())),
          h('td', null, new Date(e.zeit).toLocaleDateString('de-DE') + ' ' + new Date(e.zeit).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })),
          h('td', null, h('button', { class: 'knopf holz klein', onclick: () => { delete insel.zwerge[id]; sichern(); f.schliessen(); allesZeigen(false); oeffneEinstellungen(); } }, 'Entfernen')));
      })));
    const datei = h('input', { type: 'file', accept: 'application/json,.json', style: { display: 'none' } });
    datei.addEventListener('change', () => {
      const d = datei.files && datei.files[0]; if (!d) return;
      d.text().then((t) => {
        try { const neu = JSON.parse(t); if (!neu || typeof neu.zwerge !== 'object') throw new Error(); insel = Object.assign(leer(), neu); sichern(); f.schliessen(); allesZeigen(false); ZI.meldung('Insel geladen.'); }
        catch (e) { ZI.meldung('Diese Datei ist keine Insel-Sicherung.'); }
      });
    });
    const f = ZI.fenster([
      h('h2', null, 'Einstellungen'),
      h('div', { class: 'einstellung' }, 'Kinder in der Klasse:', zahl,
        h('button', { class: 'knopf klein', onclick: () => { const n = parseInt(zahl.value, 10); if (n > 0 && n <= 40) { insel.klassengroesse = n; sichern(); allesZeigen(true); ZI.meldung('Gespeichert.'); } } }, 'Übernehmen')),
      h('p', { style: { margin: 0, fontSize: '16px', color: 'var(--tinte-hell)' } }, 'Ein Kapitel ist geschafft, wenn jedes Kind den Hauptstollen geschafft hat (3 Material pro Kind). Fehlen Kinder länger, die Zahl einfach verkleinern.'),
      h('div', { class: 'einstellung' }, 'Kapitel auf der Insel:',
        ZI.BAUPLAN.map((_, k) => h('button', { class: 'knopf klein' + (k === kap() ? '' : ' holz'), 'aria-pressed': String(k === kap()),
          onclick: () => { insel.kapitel = k; sichern(); f.schliessen(); allesZeigen(false); ZI.meldung('Die Insel zeigt jetzt Kapitel ' + (k + 1) + '.'); } }, 'Kapitel ' + (k + 1)))),
      h('h3', { style: { fontSize: '24px', alignSelf: 'flex-start' } }, 'Lieferungen (' + Object.keys(insel.zwerge).length + ')'),
      Object.keys(insel.zwerge).length ? tabelle : h('p', { style: { margin: 0 } }, 'Noch keine Lieferungen.'),
      h('div', { class: 'knopf-reihe' },
        h('button', { class: 'knopf klein', onclick: () => { f.schliessen(); oeffneUeberblick(); } }, 'Klassenüberblick'),
        h('button', { class: 'knopf klein', onclick: () => { f.schliessen(); oeffneUrkunden(); } }, 'Urkunden drucken'),
        h('a', { class: 'knopf klein', href: 'lehrkraft.html', target: '_blank', style: { textDecoration: 'none' } }, 'Stundenverlauf & Spickzettel'),
        h('a', { class: 'knopf moos klein', href: 'index.html#lehrkraft', style: { textDecoration: 'none' } }, 'Zum Lehrkraftbereich')),
      h('div', { class: 'knopf-reihe' },
        h('button', { class: 'knopf holz klein', onclick: sichernAlsDatei }, 'Insel sichern (Datei)'),
        h('button', { class: 'knopf holz klein', onclick: () => datei.click() }, 'Insel laden'),
        h('button', { class: 'knopf holz klein', onclick: vollbildUmschalten }, 'Vollbild'),
        h('button', { class: 'knopf holz klein', onclick: zuruecksetzen }, 'Insel zurücksetzen')),
      datei,
      h('button', { class: 'knopf', onclick: () => f.schliessen() }, 'Schließen'),
    ], { schliessbar: true });
    f.el.classList.add('breit');

    function zuruecksetzen() {
      const g = ZI.fenster([
        h('h2', null, 'Wirklich alles zurücksetzen?'),
        h('p', { style: { margin: 0 } }, 'Alle Lieferungen und Gebäude werden gelöscht. Sichern Sie die Insel vorher als Datei, wenn Sie sie behalten möchten.'),
        h('div', { class: 'knopf-reihe' },
          h('button', { class: 'knopf', onclick: () => g.schliessen() }, 'Abbrechen'),
          h('button', { class: 'knopf holz', onclick: () => { insel = leer(); sichern(); g.schliessen(); f.schliessen(); allesZeigen(false); } }, 'Ja, zurücksetzen')),
      ]);
    }
  }

  function sichernAlsDatei() {
    const blob = new Blob([JSON.stringify(insel, null, 1)], { type: 'application/json' });
    const a = h('a', { href: URL.createObjectURL(blob), download: 'zwergeninsel-' + new Date().toISOString().slice(0, 10) + '.json' });
    document.body.appendChild(a); a.click(); a.remove();
  }

  allesZeigen(false);
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) { navigator.serviceWorker.register('sw.js').catch(() => {}); ZI.vorladen(true); }
})();
