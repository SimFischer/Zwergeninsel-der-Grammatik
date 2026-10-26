/* Zwergeninsel – Schüler-App (Schmiede) */
(function () {
  const ZI = window.ZI;
  const { h, bild, icon, mischen, zufall, speicher, sitzung } = ZI;
  /* Alte Daten früherer Versionen vom Gerät entfernen (sie lagen dauerhaft im Browser) */
  try { Object.keys(localStorage).filter((k) => /^zi-(aktiv|botschaft|stamm|rueckblick)/.test(k)).forEach((k) => localStorage.removeItem(k)); } catch (e) { /* egal */ }
  const app = document.getElementById('app');

  let stand = null;                 // aktueller Spielstand (ZI.Stand)
  let testmodus = sessionStorage.getItem('zi-test') === '1';
  let K = 0;                        // aktuelles Kapitel (0 = Kapitel 1)
  let aktStation = null;            // { k, art: 'kern' | 'tief' | 'bonus', i }
  let fehlerZaehler = 0;            // Fehler in der laufenden Station
  let kombo = 0;                    // richtige Antworten hintereinander
  /* Antworten zählen unabhängig von visuellen Effekten. */
  function antwortRichtig() { kombo++; zeigeKombo(); }
  function antwortFalsch() { fehlerZaehler++; kombo = 0; zeigeKombo(); }
  function zeigeKombo() {
    const el = document.querySelector('.kombo');
    const glut = document.querySelector('.glut-flackern');
    if (glut) glut.style.setProperty('--glut', String(Math.min(1, kombo / 6)));
    if (!el) return;
    if (kombo >= 3) {
      el.hidden = false;
      ZI.setze(el, ZI.bildOder('flamme', '', null, 'kombo-flamme'), h('span', null, 'Kombo ×' + kombo));
      el.classList.remove('puls'); void el.offsetWidth; el.classList.add('puls');
      if (kombo % 5 === 0) { ZI.konfetti(40); ZI.meldung('Unglaublich! ' + kombo + ' richtig hintereinander!'); }
    } else el.hidden = true;
  }
  const AKTIV_KEY = 'zi-aktiv';
  const MAX_ALTER = 4 * 60 * 60 * 1000; // nach 4 Stunden wird der Stand nicht mehr angeboten

  const ROHSTOFF = [
    { datei: 'holz', name: 'Holz' },
    { datei: 'stein', name: 'Stein' },
    { datei: 'eisen', name: 'Eisen' },
  ];

  /* ---------- Speichern ---------- */
  function speichern() {
    if (stand) sitzung.schreiben(AKTIV_KEY, { code: stand.code(), zeit: Date.now() });
  }
  function gespeicherterStand() {
    const g = sitzung.lesen(AKTIV_KEY, null);
    if (!g || !g.code || Date.now() - g.zeit > MAX_ALTER) return null;
    return ZI.Stand.ausCode(g.code);
  }
  function abmelden() {
    try { sessionStorage.clear(); } catch (e) { /* egal */ }
    testmodus = false;
    stand = null;
    zeigeAbschied();
  }
  function zeigeAbschied() {
    zeige(h('div', { class: 'screen' },
      ZI.hintergrund('titel-hintergrund', 'hg-ersatz-titel', 'rgba(20,12,8,0.35)'),
      h('div', { class: 'start-mitte' },
        h('div', { class: 'pergament auf-pergament abschied' },
          h('h2', null, 'Gut geschmiedet!'),
          h('p', null, 'Dein Spielstand steckt in deinem Zwergenpass auf der Karte. Auf diesem iPad ist nichts mehr von dir gespeichert.'),
          h('p', null, h('b', null, 'Schließe jetzt diesen Tab.'), ' Dann ist das iPad frei für die nächste Klasse.'),
          h('button', { class: 'knopf holz', onclick: zeigeStart }, 'Zurück zum Start')))));
  }

  /* Fortschritt eintragen und neu freigeschaltete Zwerge feiern */
  function fortschritt(aenderung, danach) {
    const vorher = stand.freieZwerge();
    const seitenVorher = wissenFrei(stand);
    const abzeichenVorher = abzeichenFrei(stand);
    const rangVorher = ZI.rang(stand);
    aenderung(stand);
    speichern();
    const neu = stand.freieZwerge().filter((n) => !vorher.includes(n));
    const neueSeiten = wissenFrei(stand).filter((w) => !seitenVorher.includes(w));
    const neueAbzeichen = abzeichenFrei(stand).filter((a) => !abzeichenVorher.includes(a));
    const rangNeu = ZI.rang(stand);
    zeigeErfolge(rangNeu.nr > rangVorher.nr ? rangNeu : null, neueAbzeichen, neueSeiten,
      () => zeigeFreischaltungen(neu, danach));
  }

  /* ---------- Zwergen-Wissensbuch ---------- */
  function wissenFrei(s) {
    return ZI.WISSEN.filter((w) => (w.art === 'bau' ? s.hatBau(w.bit) : w.art === 'kern' ? s.hatKern(w.k, w.i) : s.tiefe(w.k, w.i) >= w.n));
  }
  function seitenKarte(w, frei) {
    if (!frei) {
      const st = w.art === 'bau' ? ZI.bauUebung(w.bau) : INHALT[w.k] && (w.art === 'tief' ? stufenDef(w.k, w.i, w.n) : INHALT[w.k][w.art][w.i]);
      return h('div', { class: 'seite gesperrt' },
        h('div', { class: 'seite-kopf' }, icon.schloss(), h('span', null, '???')),
        h('p', null, 'Schaffe „' + (st ? st.name : '…') + '“, dann erscheint hier ein Merksatz.'));
    }
    return h('div', { class: 'seite' },
      h('div', { class: 'seite-kopf' }, icon.buch(), h('h3', null, w.titel)),
      h('p', null, w.text),
      h('div', { class: 'seite-beispiel' }, w.beispiel),
      null);
  }
  function zeigeWissensbuch() {
    const frei = wissenFrei(stand);
    let k = letzterReiter || 0;
    const reiter = h('div', { class: 'reiter', role: 'tablist' });
    const seiten = h('div', { class: 'seiten' });
    function zeichne() {
      ZI.setze(reiter, ...ZI.KAPITEL.map((kap, i) => {
        const b = h('button', { class: i === k ? 'aktiv' : '', role: 'tab', 'aria-selected': String(i === k) }, 'Kapitel ' + kap.nr);
        b.addEventListener('click', () => { k = i; zeichne(); });
        return b;
      }));
      ZI.setze(seiten, ...ZI.WISSEN.filter((w) => w.k === k).map((w) => seitenKarte(w, frei.includes(w))));
    }
    zeichne();
    zeige(h('div', { class: 'screen' },
      ZI.hintergrund('stollen-hintergrund', 'hg-ersatz-stollen', 'rgba(20,12,8,0.45)'),
      h('div', { class: 'leiste' },
        h('button', { class: 'rund', 'aria-label': 'Zurück zur Halle', onclick: () => zeigeHalle() }, icon.zurueck()),
        h('div', null,
          h('div', { class: 'titel titel-mit-bild' }, ZI.bildOder('buch-offen', '', null, 'titel-bild'), 'Zwergen-Wissensbuch'),
          h('div', { class: 'untertitel' }, frei.length + ' von ' + ZI.WISSEN.length + ' Seiten gefunden'))),
      h('div', { class: 'screen-scroll', style: { position: 'relative', zIndex: 2 } },
        h('div', { class: 'halle-inhalt' }, reiter, h('div', { class: 'pergament auf-pergament stollen' }, seiten)))));
  }

  /* ---------- Meisterin Hammerlind macht es vor ---------- */
  function zeigeVormachen(v, weiter) {
    let n = 0;
    const liste = h('div', { class: 'vormach-liste' });
    const blase = h('div', { class: 'vormach-blase', role: 'status', 'aria-live': 'polite' });
    const knopf = h('button', { class: 'knopf' }, 'Weiter');
    function zeile(z) {
      const istTeil = ['these', 'begruendung', 'beispiel'].includes(z.art);
      if (istTeil) return h('div', { class: 'teil teil-' + z.art }, h('span', { class: 'teil-name' }, z.marke), h('span', null, z.text));
      return h('div', { class: 'vormach-zeile ' + z.art }, h('span', null, z.text), z.marke ? h('span', { class: 'marke-' + z.art }, z.marke) : null);
    }
    function schritt() {
      const st = v.schritte[n];
      blase.textContent = st.sagt;
      if (st.zeigt) liste.appendChild(zeile(st.zeigt));
      knopf.textContent = n + 1 < v.schritte.length ? 'Weiter' : 'Jetzt du!';
    }
    knopf.addEventListener('click', () => {
      n++;
      if (n < v.schritte.length) schritt();
      else { f.schliessen(); weiter(); }
    });
    const f = ZI.fenster([
      h('div', { class: 'vormach-kopf' },
        h('div', { class: 'vormach-bild' }, bild('meisterin-erklaert', 'Meisterin Hammerlind')),
        h('div', null,
          h('div', { style: { fontSize: '16px', color: 'var(--tinte-hell)' } }, 'Meisterin Hammerlind macht es vor'),
          h('h2', { style: { fontSize: '30px' } }, v.titel))),
      h('div', { class: 'meinung', style: { alignSelf: 'stretch', textAlign: 'left' } }, v.kopf),
      liste,
      h('div', { class: 'vormach-sagt' }, blase),
      h('div', { class: 'knopf-reihe' }, knopf),
    ]);
    f.el.classList.add('vormach');
    schritt();
  }

  function zeigeFreischaltungen(liste, danach) {
    if (!liste.length) { danach && danach(); return; }
    const z = ZI.ZWERGE.find((d) => d.nr === liste[0]);
    ZI.konfetti();
    const f = ZI.fenster([
      bild('truhe-offen', 'Offene Schatztruhe', 'truhe-klein'),
      h('h2', null, 'Neuer Zwerg freigeschaltet!'),
      h('div', { class: 'gross-bild strahlen mit-glanz' }, h('div', { class: 'glanz', 'aria-hidden': 'true' }, bild('zwerg-freigeschaltet-glanz', '')), bild([z.datei + '-jubel', z.datei], z.name)),
      h('div', { style: { fontSize: '26px', fontFamily: 'var(--titel)' } }, z.name + ' · ' + z.rolle),
      h('div', { class: 'begleiter-blase pergament auf-pergament', style: { fontSize: '20px' } }, '„Hallo! Ich bin ' + z.name + '. Nimmst du mich mit in die Schmiede?“'),
      h('p', { style: { margin: 0 } }, 'Du kannst auch später in deiner Zwergen-Sammlung zu ' + z.name + ' wechseln.'),
      h('div', { class: 'knopf-reihe' },
        h('button', { class: 'knopf holz', onclick: () => { stand.zwerg = z.nr; speichern(); f.schliessen(); zeigeFreischaltungen(liste.slice(1), danach); } }, 'Ja, ' + z.name + ' kommt mit'),
        h('button', { class: 'knopf', onclick: () => { f.schliessen(); zeigeFreischaltungen(liste.slice(1), danach); } }, 'Weiter')),
    ]);
  }

  function zeige(screen) {
    ZI.setze(app, screen);
    window.scrollTo(0, 0);
  }

  /* Sterne als gemalte Bilder: erreichte leuchten, fehlende sind blass */
  function sterneBild(anzahl, cls) {
    return h('span', { class: 'sterne-bild ' + (cls || ''), role: 'img', 'aria-label': anzahl + ' von 3 Sternen' },
      ...[0, 1, 2].map((i) => h('span', { class: 'stern' + (i < anzahl ? ' an' : '') }, bild('stern', ''))));
  }
  function aktuellerZwerg() { return ZI.ZWERGE.find((z) => z.nr === stand.zwerg); }

  /* =========================================================
     ORTSWECHSEL – kurze Szene beim Betreten wichtiger Orte (ca. 1,8 s, kein Überspringen nötig)
     art: 'schmiede' | 'stollen' | 'gemeinsam' | 'rat'
     ========================================================= */
  const SZENEN = {
    schmiede: { hg: ['transition-schmiede', 'schmiede-hintergrund'], deko: 'funken' },
    stollen: { hg: ['transition-stollen', 'stollen-hintergrund'], deko: null },
    gemeinsam: { hg: ['transition-gemeinschaftsstollen', 'stollen-hintergrund'], deko: null },
    rat: { hg: 'zwergenrat-hintergrund', deko: 'feuer' },
  };
  function partnerZwerg() {
    const z = aktuellerZwerg();
    const andere = ZI.ZWERGE.filter((x) => x.nr !== (z && z.nr) && stand.zwergFrei(x.nr));
    return andere.length ? andere[(z ? z.nr : 0) % andere.length] : ZI.ZWERGE.find((x) => x.nr !== (z && z.nr));
  }
  function schmiedeBetreten(begruessen) {
    const z = aktuellerZwerg();
    uebergang('schmiede', z ? z.name + ' betritt die Schmiede.' : 'Auf in die Schmiede!', () => zeigeHalle(begruessen));
  }
  function uebergang(art, text, danach) {
    const sz = SZENEN[art] || SZENEN.stollen;
    const ruhig = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dauer = ruhig ? 700 : 1800;
    const z = aktuellerZwerg();
    const figuren = [z ? h('div', { class: 'ue-zwerg ue-eigen' }, bild(z.datei, z.name)) : null];
    if (art === 'gemeinsam') { const p = partnerZwerg(); if (p) figuren.push(h('div', { class: 'ue-zwerg ue-partner' }, bild(p.datei, p.name))); }
    const ov = h('div', { class: 'uebergang ue-' + art + (ruhig ? ' ruhig' : ''), 'aria-live': 'polite', role: 'status' },
      h('div', { class: 'ue-hg' }, bild(sz.hg, '')),
      h('div', { class: 'ue-dunkel' }),
      sz.deko === 'laternen' || sz.deko === 'abstieg' ? [h('div', { class: 'ue-laterne links' }, bild('laterne', '')), h('div', { class: 'ue-laterne rechts' }, bild('laterne', ''))] : null,
      sz.deko === 'feuer' ? h('div', { class: 'ue-feuer' }, bild('lagerfeuer', '')) : null,
      sz.deko === 'funken' ? h('div', { class: 'ue-funken' }, ...Array.from({ length: 14 }, (_, i) => h('span', { style: { left: (8 + i * 6.5) + '%', animationDelay: (i % 5) * 0.15 + 's' } }))) : null,
      h('div', { class: 'ue-figuren' }, ...figuren),
      h('div', { class: 'ue-text' }, text));
    document.body.append(ov);
    setTimeout(() => { danach && danach(); ov.classList.add('aus'); setTimeout(() => ov.remove(), 400); }, dauer);
  }

  /* ---------- Gemeinsame Bausteine ---------- */
  /* ---------- Vollbild (iPad-Safari und Laptop) ---------- */
  const kannVollbild = !!(document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen);
  const imVollbild = () => !!(document.fullscreenElement || document.webkitFullscreenElement);
  function vollbildUmschalten() {
    const el = document.documentElement;
    try {
      if (imVollbild()) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      else if (el.requestFullscreen) el.requestFullscreen().catch(() => ZI.meldung('Vollbild ist auf diesem Gerät nicht möglich.'));
      else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    } catch (e) { ZI.meldung('Vollbild ist auf diesem Gerät nicht möglich.'); }
  }
  const vollbildAnzeigen = () => document.querySelectorAll('.vollbild-knopf').forEach((b) => {
    ZI.setze(b, imVollbild() ? icon.vollbildAus() : icon.vollbild());
    b.setAttribute('aria-label', imVollbild() ? 'Vollbild beenden' : 'Vollbild');
  });
  document.addEventListener('fullscreenchange', vollbildAnzeigen);
  document.addEventListener('webkitfullscreenchange', vollbildAnzeigen);
  function vollbildKnopf(extra) {
    if (!kannVollbild) return null;
    return h('button', { class: 'rund vollbild-knopf' + (extra ? ' ' + extra : ''), 'aria-label': imVollbild() ? 'Vollbild beenden' : 'Vollbild', title: 'Vollbild', onclick: vollbildUmschalten },
      imVollbild() ? icon.vollbildAus() : icon.vollbild());
  }
  function zaehler(datei, name, wert) {
    return h('div', { class: 'zaehler', 'aria-label': name + ': ' + wert }, bild(datei, name), String(wert));
  }
  function avatar(nr, huepfen) {
    const z = ZI.ZWERGE.find((d) => d.nr === nr);
    return h('div', { class: 'avatar' + (huepfen ? ' huepfen' : '') }, bild(z.datei, z.name));
  }
  function bestaetigen(text, jaText, ja) {
    const f = ZI.fenster([
      h('h2', null, text),
      h('div', { class: 'knopf-reihe' },
        h('button', { class: 'knopf holz', onclick: () => f.schliessen() }, 'Nein'),
        h('button', { class: 'knopf', onclick: () => { f.schliessen(); ja(); } }, jaText)),
    ]);
  }

  /* =========================================================
     START
     ========================================================= */
  function zeigeStart() {
    const alt = gespeicherterStand();
    const knoepfe = h('div', { class: 'start-knoepfe' },
      h('button', { class: 'knopf', onclick: () => zeigeWahl(true) }, 'Neuer Zwerg'),
      h('button', { class: 'knopf holz', onclick: zeigePassEingabe }, 'Ich habe einen Zwergenpass'));

    let weiter = null;
    if (alt) {
      const z = ZI.ZWERGE.find((d) => d.nr === alt.zwerg);
      weiter = h('button', { class: 'pergament weiter-karte', style: { border: '3px solid #8a6438' },
        onclick: () => { stand = alt; schmiedeBetreten(); } },
        avatar(alt.zwerg),
        h('div', { style: { textAlign: 'left' } },
          h('div', { style: { fontFamily: 'var(--titel)', fontSize: '24px' } }, 'Weiterspielen als ' + z.name),
          h('div', { style: { fontSize: '16px', color: 'var(--tinte-hell)' } }, 'Nur, wenn das dein Zwerg ist!')));
    }

    zeige(h('div', { class: 'screen' },
      ZI.hintergrund('titel-hintergrund', 'hg-ersatz-titel', 'rgba(20,12,8,0.15)'),
      vollbildKnopf('vollbild-start'),
      h('div', { class: 'start-mitte' },
        langDruecken(h('div', { class: 'logo' }, 'Zwergeninsel'), 5000, () => { sitzungLehrkraft(true); zeigeLehrkraft(); }),
        h('div', { class: 'logo-unter' }, 'Schmiede Argumente – baut gemeinsam euer Dorf!'),
        weiter, knoepfe)));
  }

  /* Versteckter Zugang: nur langes Gedrückthalten (Touch und Maus) löst aus, kurzes Tippen nichts */
  function langDruecken(el, ms, aktion) {
    let uhr = null;
    const stopp = () => { if (uhr) { clearTimeout(uhr); uhr = null; } };
    el.addEventListener('pointerdown', (e) => { stopp(); uhr = setTimeout(() => { uhr = null; aktion(); }, ms); });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach((t) => el.addEventListener(t, stopp));
    el.addEventListener('contextmenu', (e) => e.preventDefault());
    el.style.touchAction = 'none';
    return el;
  }
  const sitzungLehrkraft = (an) => { try { if (an) sessionStorage.setItem('zi-lehrkraft', '1'); return sessionStorage.getItem('zi-lehrkraft') === '1'; } catch (e) { return !!an; } };

  /* =========================================================
     LEHRKRAFTBEREICH (nur über den versteckten Zugang erreichbar)
     ========================================================= */
  function zeigeLehrkraft() {
    const kachel = (titel, text, href) => h('a', { class: 'lk-kachel pergament auf-pergament', href }, h('b', null, titel), h('span', null, text));
    const testKnopf = h('button', { class: 'knopf' + (testmodus ? ' holz' : ''), onclick: () => {
      testmodus = !testmodus;
      try { if (testmodus) sessionStorage.setItem('zi-test', '1'); else sessionStorage.removeItem('zi-test'); } catch (e) { /* egal */ }
      zeigeLehrkraft();
    } }, testmodus ? 'Testmodus ausschalten' : 'Testmodus einschalten');
    zeige(h('div', { class: 'screen' },
      ZI.hintergrund('titel-hintergrund', 'hg-ersatz-titel', 'rgba(20,12,8,0.55)'),
      h('div', { class: 'leiste' },
        h('button', { class: 'rund', 'aria-label': 'Zurück zum Start', onclick: zeigeStart }, icon.zurueck()),
        h('div', null, h('div', { class: 'titel' }, 'Lehrkraftbereich'), h('div', { class: 'untertitel' }, 'Nur für Lehrkräfte')),
        h('div', { class: 'spacer' }), vollbildKnopf()),
      h('div', { class: 'screen-scroll', style: { position: 'relative', zIndex: 2 } },
        h('div', { class: 'lk-raster' },
          kachel('Zur Insel (Board)', 'Lieferungen, Stammesräte, Zwergenrat, Inselrätsel', 'insel.html?von=lehrkraft'),
          kachel('Zwergenpass-Karten drucken', 'Eine Karte pro Kind, mit fester Nummer', 'karten.html?von=lehrkraft'),
          kachel('Stundenverlauf & Spickzettel', 'Ablauf der drei Stunden, Hilfe bei Problemen', 'lehrkraft.html?von=lehrkraft'),
          h('div', { class: 'lk-kachel pergament auf-pergament lk-test' + (testmodus ? ' an' : '') },
            h('b', null, 'Testmodus ' + (testmodus ? 'ist an' : 'ist aus')),
            h('span', null, 'Alle Stollen und Bonusspiele sind sofort offen. Gilt nur in diesem Tab.'),
            h('div', { class: 'knopf-reihe', style: { justifyContent: 'flex-start' } }, testKnopf,
              testmodus ? h('button', { class: 'knopf moos', onclick: zeigeStart }, 'Zur Schmiede') : null))))));
  }

  /* =========================================================
     ZWERG WÄHLEN / SAMMLUNG
     ========================================================= */
  function zeigeWahl(neu) {
    const probe = neu ? new ZI.Stand() : stand;
    let gewaehlt = neu ? null : stand.zwerg;
    const weiterKnopf = h('button', { class: 'knopf', disabled: neu ? true : null }, neu ? 'Diesen Zwerg nehmen' : 'Fertig');

    const raster = h('div', { class: 'zwerg-raster' });
    const karten = ZI.ZWERGE.map((z) => {
      const frei = probe.zwergFrei(z.nr);
      const karte = h('button', { class: 'zwerg-karte pergament auf-pergament' + (frei ? '' : ' gesperrt') + (z.nr === gewaehlt ? ' gewaehlt' : ''),
        'aria-label': frei ? z.name + ', ' + z.rolle : z.name + ', gesperrt. ' + z.bedingung },
        h('div', { class: 'bild' }, bild(z.datei, z.name)),
        h('div', { class: 'name' }, frei ? z.name : '???'),
        frei ? h('div', { class: 'rolle' }, z.rolle) : h('div', { class: 'bedingung' }, z.bedingung),
        frei ? null : h('div', { class: 'schloss', style: { color: 'var(--tinte)' } }, icon.schloss()));
      karte.addEventListener('click', () => {
        if (!frei) { ZI.meldung(z.bedingung); antwortFalsch(); return; }
        gewaehlt = z.nr;
        karten.forEach((k) => k.classList.remove('gewaehlt'));
        karte.classList.add('gewaehlt');
        weiterKnopf.disabled = false;
      });
      return karte;
    });
    raster.append(...karten);

    weiterKnopf.addEventListener('click', () => {
      if (!gewaehlt) return;
      if (neu) {
        const nr = gewaehlt;
        waehleKarte(null, (karte) => {
          stand = new ZI.Stand({ zwerg: nr, id: karte });
          speichern();
          schmiedeBetreten(true);
        }, () => zeigeWahl(true));
      } else {
        stand.zwerg = gewaehlt; speichern(); zeigeHalle();
      }
    });

    zeige(h('div', { class: 'screen' },
      ZI.hintergrund('stollen-hintergrund', 'hg-ersatz-stollen', 'rgba(20,12,8,0.45)'),
      h('div', { class: 'leiste' },
        h('button', { class: 'rund', 'aria-label': 'Zurück', onclick: () => (neu ? zeigeStart() : zeigeHalle()) }, icon.zurueck()),
        h('div', null,
          h('div', { class: 'titel' }, neu ? 'Wähle deinen Zwerg' : 'Deine Zwergen-Sammlung'),
          h('div', { class: 'untertitel' }, neu ? 'Vier Zwerge warten auf dich. Acht weitere kannst du freischalten.' : probe.freieZwerge().length + ' von 12 Zwergen freigeschaltet')),
        h('div', { class: 'spacer' }), weiterKnopf),
      h('div', { class: 'screen-scroll', style: { position: 'relative', zIndex: 2 } }, raster)));
  }

  /* =========================================================
     ZWERGENPASS EINGEBEN
     ========================================================= */
  function zeigePassEingabe() {
    const eingabe = h('input', { class: 'eingabe', maxlength: '14', autocomplete: 'off', autocorrect: 'off', autocapitalize: 'characters', spellcheck: 'false', inputmode: 'text', placeholder: 'XXXX-XXXX-XXXX', 'aria-label': 'Zwergenpass-Code' });
    const hinweis = h('div', { class: 'rueckmeldung tipp', style: { display: 'none' } });
    eingabe.addEventListener('input', () => {
      eingabe.value = ZI.formatiereCode(eingabe.value);
      hinweis.style.display = 'none';
    });
    const pruefen = () => {
      const s = ZI.Stand.ausCode(eingabe.value);
      if (!s) {
        antwortFalsch();
        hinweis.style.display = '';
        hinweis.textContent = 'Dieser Code stimmt nicht. Prüfe jedes Zeichen. Im Zwergenpass gibt es keine 0, 1, I oder O.';
        return;
      }
      stand = s; speichern(); antwortRichtig();
      const z = aktuellerZwerg();
      const f = ZI.fenster([
        h('div', { class: 'gross-bild' }, bild(z.datei, z.name)),
        h('h2', null, 'Willkommen zurück, ' + z.name + '!'),
        h('p', { style: { margin: 0 } }, 'Dein Fortschritt ist wieder da.'),
        h('button', { class: 'knopf', onclick: () => { f.schliessen(); schmiedeBetreten(); } }, 'Zur Schmiede'),
      ]);
    };
    eingabe.addEventListener('keydown', (e) => { if (e.key === 'Enter') pruefen(); });

    zeige(h('div', { class: 'screen' },
      ZI.hintergrund('stollen-hintergrund', 'hg-ersatz-stollen', 'rgba(20,12,8,0.45)'),
      h('div', { class: 'leiste' },
        h('button', { class: 'rund', 'aria-label': 'Zurück', onclick: zeigeStart }, icon.zurueck()),
        h('div', { class: 'titel' }, 'Zwergenpass eingeben')),
      h('div', { class: 'start-mitte' },
        h('div', { class: 'pergament pass-karte auf-pergament' },
          h('div', { style: { display: 'flex', gap: '14px', alignItems: 'center' } },
            h('div', { class: 'pass-bild' }, bild('zwergenpass-karte', 'Zwergenpass')),
            h('p', { style: { margin: 0, fontSize: '20px' } }, 'Tippe den Code von deiner Zwergenpass-Karte ein. Groß- oder Kleinschreibung ist egal.')),
          eingabe, hinweis,
          h('button', { class: 'knopf', onclick: pruefen }, 'Zwerg zurückholen')))));
    setTimeout(() => eingabe.focus(), 300);
  }

  /* =========================================================
     HALLE – Übersicht über Kapitel und Stollen
     ========================================================= */
  /* Was in welchem Kapitel zu tun ist. start() setzt vorher das aktuelle Kapitel K.
     Jedes Kapitel hat vier Stollen: drei Hauptstollen (bringen Baumaterial) und einen Gemeinschaftsstollen.
     Jeder Stollen hat seine eigene Tiefe: Grundstufe = spiel, danach freiwillig tiefen[0..] = Tiefe 2, 3, … */
  const tf = (name, info, spiel) => ({ name, info, spiel });
  const INHALT = [
    { // Kapitel 1
      stollen: [
        { name: 'Stumpf oder scharf?', info: 'Finde die Begründung, die wirklich erklärt, warum.', icon: ['icon-stumpf-scharf', 'axt-scharf'], spiel: () => spielStumpfScharf(), vor: 'k1s1',
          tiefen: [
            tf('Welche ist stärker?', 'Beide Begründungen passen. Welche überzeugt mehr?', () => tiefStaerker()),
            tf('Besser begründen', 'Mach aus einer schwachen Begründung eine starke.', () => tiefVerbessern()),
            tf('Stärker – und warum?', 'Prüfe, ob Grund und Beispiel gemeinsam das Ziel stützen.', () => tiefStaerker(true)),
            tf('Meister der Schärfe', 'Gemischte schwere Aufgaben – ohne Hilfe, ohne Laterne.', () => tiefSchaerfe()),
          ] },
        { name: 'Erz oder Schlacke?', info: 'Sortiere: Welche Begründung passt zur Meinung?', icon: ['icon-erz-schlacke', 'eisen-roh'], spiel: () => spielErz(), vor: 'k1s2',
          tiefen: [
            tf('Nur eine passt', 'Zwei Begründungen klingen gut, passen aber nicht.', () => tiefPasst()),
            tf('Dafür oder dagegen?', 'Passt der Satz zur Meinung – oder spricht er dagegen?', () => tiefDafuerDagegen()),
            tf('Nur eine passt – und warum?', 'Finde die passende Begründung und sag, warum sie passt.', () => tiefPasst(true)),
            tf('Echtes Gegenargument?', 'Was spricht wirklich dagegen – und was ist nur Geschmack?', () => tiefGegen(true)),
          ] },
        { name: 'Weil-Denn-Amboss', info: 'Bau Begründungssätze mit weil, da und denn.', icon: ['icon-weil-denn', 'runenplatte'], spiel: () => spielWeilDenn(), vor: 'k1s3',
          tiefen: [
            tf('Welches Wort passt?', 'weil, denn oder deshalb – Grund oder Folge?', () => tiefLuecke()),
            tf('Fehlerjagd', 'Der Kobold hat Sätze verbogen. Komma und Verb prüfen!', () => tiefFehlerjagd()),
            tf('Grund und Beispiel', 'Welcher weil-Satz wird vom Beispiel wirklich gestützt?', () => spielWeilDenn(true)),
            tf('Kobold-Meister', 'Grund, Folge und Einwände prüfen – ohne Hilfe, ohne Laterne.', () => tiefFehlerjagd(true)),
          ] },
        { name: 'Meisterstück', gemeinschaft: true, info: 'Zu zweit: Jeder sagt 3 Argumente. Der andere prüft.', icon: ['icon-meisterstueck', 'meisterin-erklaert'], spiel: () => spielMeisterstueck(1),
          tiefen: [
            tf('Mit Beispiel', 'Jedes Argument bekommt ein Beispiel.', () => spielMeisterstueck(1, 2)),
            tf('Ganz frei', 'Ohne Vorlage: Ihr formuliert Begründung und Beispiel selbst.', () => spielMeisterstueck(1, 3)),
          ] },
      ],
      bonus: { name: 'Funkenregen', info: 'Fang die scharfen Begründungen, bevor sie verglühen! Bis zu 3 Sterne.', icon: ['icon-funkenregen', 'stern'], spiel: () => spielFunkenregen(ZI.FUNKENREGEN, 'Funkenregen', 'Oben steht eine Meinung. Von oben regnen Begründungen. Tippe nur die scharfen Begründungen an! Stumpfe kosten einen Punkt.') },
    },
    { // Kapitel 2
      stollen: [
        { name: 'Argument-Puzzle', info: 'Setz Meinung, Begründung und Beispiel richtig zusammen.', icon: ['icon-puzzle', 'pergament'], spiel: () => spielPuzzle(), vor: 'k2s1',
          tiefen: [
            tf('Welcher Teil ist das?', 'Ein Satz allein: Meinung, Begründung oder Beispiel?', () => tiefTeil()),
            tf('Argument-Kette', 'Welche Sätze stützen das Argument – und welche bringen ein neues?', () => spielKette()),
            tf('Das beste Beispiel – und warum?', 'Wähle das Beispiel, das die Begründung wirklich stützt.', () => tiefBeispiel()),
            tf('Kobold-Kampf', 'Alles gemischt gegen den Fehlerkobold – ohne Hilfe.', () => tiefKobold()),
          ] },
        { name: 'Motor oder Bremse?', info: 'Was bringt ein Gespräch weiter, was stoppt es?', icon: ['icon-motor-bremse', 'schleifstein'], spiel: () => spielMotor(), vor: 'k2s2',
          tiefen: [
            tf('Was bringt weiter?', 'Nur ein Satz bringt das Gespräch weiter. Welcher?', () => tiefMotor()),
            tf('Aus Bremse wird Motor', 'Wie sagt man es besser?', () => tiefBremseMotor()),
            tf('Was bringt weiter – und warum?', 'Wähle den Motor und sag, warum er hilft.', () => tiefMotor(true)),
            tf('Gesprächs-Meister', 'Bremsen umbauen – ohne Hilfe, ohne Laterne.', () => tiefBremseMotor(true)),
          ] },
        { name: 'Hör-Stollen', zuZweit: true, info: 'Dein Partner liest vor, du hörst genau zu.', icon: ['icon-hoeren', 'laterne'], spiel: () => spielHoeren(1), vor: 'k2s3',
          tiefen: [
            tf('Nur einmal hören', 'Dein Partner liest jeden Text nur ein einziges Mal vor.', () => spielHoeren(2)),
            tf('Hören und wiederholen', 'Sag mit eigenen Worten, was du gehört hast.', () => spielHoeren(3)),
            tf('Hören und antworten', 'Wiederholen – und dann mit „Ja, und …“ oder „Ja, aber …“ antworten.', () => spielHoeren(4)),
            tf('Zuhör-Meister', 'Einmal hören, wiederholen, antworten – ohne Hilfe.', () => spielHoeren(5)),
          ] },
        { name: 'Meisterstück II', gemeinschaft: true, info: 'Zu zweit: Jeder sagt 3 Argumente mit Beispiel. Der andere prüft.', icon: ['icon-meisterstueck2', 'meisterin-jubelt'], spiel: () => spielMeisterstueck(2),
          tiefen: [
            tf('Ganz frei', 'Ohne Vorlage: Ihr formuliert Begründung und Beispiel selbst.', () => spielMeisterstueck(2, 2)),
            tf('Mit Gegenargument', 'Frei – und ihr entkräftet ein Gegenargument gleich mit.', () => spielMeisterstueck(2, 3)),
          ] },
      ],
      bonus: { name: 'Beispiel-Regen', info: 'Fang die Beispiele, die wirklich passen! Bis zu 3 Sterne.', icon: ['icon-beispielregen', 'edelstein'], spiel: () => spielFunkenregen(ZI.BEISPIELREGEN, 'Beispiel-Regen', 'Oben stehen eine Meinung und eine Begründung. Von oben regnen Beispiele. Tippe nur die Beispiele an, die zur Begründung passen! Unpassende kosten einen Punkt.') },
    },
    { // Kapitel 3
      stollen: [
        { name: 'Ja, und – ja, aber?', info: 'Wie reagiert jemand auf einen Beitrag?', icon: ['icon-ja-und', 'zwerg-04-svea'], spiel: () => spielJaUnd(), vor: 'k3s1',
          tiefen: [
            tf('Finde das „Ja, aber“', 'Drei Antworten – welche widerspricht mit einem Grund?', () => tiefJaAber()),
            tf('Gegenargument-Schmiede', 'Finde das Argument, das wirklich dagegen spricht.', () => tiefGegen()),
            tf('Gegenargument und Beleg', 'Prüfe ein Argument mit Beispiel und finde einen echten Einwand.', () => tiefGegenBeleg()),
            tf('Gegenargument – und warum?', 'Echtes Gegenargument finden und begründen – ohne Hilfe.', () => tiefGegen(true)),
          ] },
        { name: 'Wer hört zu?', info: 'Finde die Antwort, die wirklich anknüpft.', icon: ['icon-zuhoeren', 'meisterin-tipp'], spiel: () => spielZuhoeren(), vor: 'k3s2',
          tiefen: [
            tf('Wer hört zu – und warum?', 'Finde die Antwort, die anknüpft, und sag, warum.', () => tiefZuhoeren()),
            tf('Wer überzeugt wen?', 'Hör heraus, was der Person wichtig ist.', () => tiefSituation()),
            tf('Wer überzeugt wen – und warum?', 'Das passende Argument wählen und begründen – ohne Hilfe.', () => tiefSituation(true)),
            tf('Zuhör-Profi', 'Anknüpfen und überzeugen gemischt – ohne Hilfe, ohne Laterne.', () => tiefZuhoerProfi()),
          ] },
        { name: 'Überzeug den Inselrat', info: 'Entkräfte die Einwände des Inselrats.', icon: ['icon-inselrat', 'zwerg-11-grimbart'], spiel: () => spielInselrat(), vor: 'k3s3',
          tiefen: [
            tf('Mehr Einwände', 'Drei Vorhaben, viele Einwände hintereinander.', () => tiefEinwaende(2)),
            tf('Einwände – und warum?', 'Antworte und sag, warum deine Antwort überzeugt.', () => tiefEinwaende(3)),
            tf('Ohne Hilfe', 'Der Inselrat bleibt hart: Es gibt keine Hilfe mehr.', () => tiefEinwaende(4)),
            tf('Großer Inselrat', 'Mehrere Vorhaben, je zwei Einwände zugleich – ohne Hilfe.', () => tiefEinwaende(5)),
          ] },
        { name: 'Streitgespräch', gemeinschaft: true, info: 'Zu zweit: Meinung, Zuhören und Gegenargument – mit Rollenwechsel.', icon: ['icon-streitgespraech', 'meisterin-jubelt'], spiel: () => spielMeisterstueck(3),
          tiefen: [
            tf('Ganz frei', 'Ohne Vorlage: Ihr sucht eure Begründungen selbst.', () => spielMeisterstueck(3, 2)),
            tf('Mit Lösung', 'Frei streiten – und am Ende einen Vorschlag finden, mit dem beide leben können.', () => spielMeisterstueck(3, 3)),
          ] },
      ],
      bonus: { name: 'Sprecherwechsel', info: 'Steig im richtigen Moment ein – ohne zu unterbrechen. Bis zu 3 Sterne.', icon: ['icon-sprecherwechsel', 'stern'], spiel: () => spielSprecherwechsel() },
    },
  ];
  INHALT.forEach((inh) => { inh.kern = inh.stollen.slice(0, 3); inh.gem = inh.stollen[3]; });
  const GEM = ZI.Stand.GEM;

  /* Stollen betreten: n = Tiefe (1 = Grundstufe) */
  function betreteStation(def, k, art, idx, n) {
    if (def.gemeinschaft && !stand.gemeinschaftOffen(k)) { ZI.meldung('Schaffe zwei andere Stollen bis Tiefe 2.'); return; }
    n = n || 1;
    K = k; letzterReiter = k; aktStation = { k, art, i: idx, n };
    const stollen = art === 'stollen';
    const spiel = stollen && n > 1 ? def.tiefen[n - 2].spiel : def.spiel;
    const los = () => { if (n === 1 && def.vor && ZI.VORMACHEN[def.vor]) zeigeVormachen(ZI.VORMACHEN[def.vor], spiel); else spiel(); };
    // Ortswechsel: kurze Szene beim Betreten (Gemeinschaftsstollen: zwei Zwerge; tiefer: Abstieg)
    if (def.gemeinschaft) uebergang('gemeinsam', n > 1 ? 'Tiefe ' + n + ' – gemeinsam noch tiefer.' : 'Gemeinsam kommt ihr tiefer.', los);
    else if (n > 1) uebergang('stollen', def.name + ' · Tiefe ' + n, los);
    else los();
  }
  // nächste Tiefe in diesem Stollen (oder null, wenn ganz unten)
  function naechsteTiefe(k, i, s) {
    const n = (s || stand).tiefe(k, i);
    return n >= 1 && n < ZI.Stand.maxTiefe(i) ? n + 1 : null;
  }
  /* Tiefenabzeichen: Plätze für tiefe-1.png … tiefe-5.png und tiefe-krone.png (bis dahin Zahl bzw. Krone) */
  /* Tiefenabzeichen: Steinmedaille (tiefe-1 … tiefe-5) mit der Zahl darauf; nicht erreichte sind blass */
  function tiefeMedaille(i, an, cls) {
    return h('span', { class: 'tiefen-abzeichen' + (an ? ' an' : '') + (cls ? ' ' + cls : ''), 'aria-label': 'Tiefe ' + i + (an ? ' erreicht' : '') },
      ZI.bildOder('tiefe-' + i, '', null, 'medaille-bild'), h('b', null, String(i)));
  }
  function tiefenLeiste(n, max, klein) {
    max = max || 5;
    return h('div', { class: 'tiefen-leiste' + (klein ? ' klein' : ''), 'aria-label': 'Tiefste Stufe: ' + n + ' von ' + max },
      Array.from({ length: max }, (_, j) => j + 1).map((i) => tiefeMedaille(i, i <= n)),
      h('span', { class: 'tiefen-abzeichen krone' + (n >= max ? ' an' : ''), title: 'Tiefen-Krone' },
        ZI.bildOder(['tiefe-krone', 'krone'], 'Tiefen-Krone', icon.krone())));
  }

  function kapitelOffen(k) {
    if (k === 0) return true;
    return !!INHALT[k] && ZI.KAPITEL[k].fertig && stand.offen >= k;
  }
  let letzterReiter = null;

  function zeigeHalle(begruessen) {
    if (!stand.karte) { // alte Pässe ohne Kartennummer: einmal nachfragen
      waehleKarte(null, (n) => { stand.id = n; speichern(); zeigeHalle(begruessen); }, () => zeigeStart());
      return;
    }
    const z = aktuellerZwerg();
    if (letzterReiter === null || !kapitelOffen(letzterReiter)) {
      letzterReiter = 0;
      for (let k = 0; k < ZI.KAPITEL.length; k++) if (kapitelOffen(k)) letzterReiter = k;
    }
    let aktiverReiter = letzterReiter;

    const inhalt = h('div', { class: 'halle-inhalt' });
    const reiter = h('div', { class: 'reiter', role: 'tablist' });
    const kapitelBox = h('div', { style: { display: 'flex', flexDirection: 'column', gap: '18px' } });

    function stationKarte(def, k, geschafft, gesperrt, sperrText, i, rohstoff, art, idx) {
      const stollen = art === 'stollen';
      const tiefe = stollen ? stand.tiefe(k, idx) : 0;
      const max = stollen ? ZI.Stand.maxTiefe(idx) : 0;
      const krone = stollen && stand.hatKrone(k, idx);
      const b = h('button', { 'aria-disabled': String(!!gesperrt), class: 'station' + (geschafft ? ' geschafft' : '') + (gesperrt ? ' gesperrt' : '') + (krone ? ' gekroent' : '') },
        krone ? h('div', { class: 'krone-marke', 'aria-label': 'Tiefen-Krone: ganz unten angekommen' }, ZI.bildOder(['tiefe-krone', 'krone'], 'Tiefen-Krone', icon.krone())) : null,
        h('div', { class: 'icon' }, bild(def.icon, def.name)),
        h('div', { class: 'st-text' },
          def.gemeinschaft ? h('div', { class: 'st-marke gemeinschaft' }, h('span', { class: 'st-marke-bild', 'aria-hidden': 'true' }, bild('gemeinschaftsstollen-icon', '')), 'Gemeinschaftsstollen') : def.zuZweit ? h('div', { class: 'st-marke' }, 'Zu zweit') : null,
          h('div', { class: 'st-name' }, (i !== undefined ? i + 1 + '. ' : '') + def.name),
          h('div', { class: 'st-info' }, gesperrt ? sperrText : def.info),
          def.gemeinschaft && !gesperrt ? h('div', { class: 'st-info st-gemeinsam' }, 'Jeder auf seinem eigenen iPad.') : null,
          rohstoff && !gesperrt ? h('div', { class: 'st-info', style: { fontWeight: 700 } }, 'Bringt: ' + rohstoff) : null,
          stollen && tiefe >= 1 ? h('div', { class: 'st-tiefe' }, h('span', null, tiefe > 1 ? 'Deine tiefste Stufe: ' + tiefe : 'Grundstufe geschafft'), tiefenLeiste(tiefe, max, true)) : null),
        geschafft ? h('div', { class: 'haken' }, icon.haken()) : null,
        gesperrt ? h('div', { class: 'schloss', style: { top: '8px', right: '8px', width: '28px', height: '28px' } }, icon.schloss()) : null);
      b.addEventListener('click', () => {
        if (gesperrt) { ZI.meldung(sperrText); antwortFalsch(); return; }
        if (stollen && tiefe >= 1) { stufeWaehlen(def, k, idx); return; }
        betreteStation(def, k, art, idx, 1);
      });
      return b;
    }
    /* schon geschaffter Stollen: Grundstufe üben oder freiwillig tiefer graben */
    function stufeWaehlen(def, k, idx) {
      const n = naechsteTiefe(k, idx);
      const f = ZI.fenster([
        h('h2', null, def.name),
        h('p', { style: { margin: 0, fontSize: '20px' } }, n ? 'Hier bist du bis Tiefe ' + stand.tiefe(k, idx) + ' gekommen. Was möchtest du?' : 'Du bist hier ganz unten angekommen. Stark!'),
        h('div', { class: 'stufen-wahl' },
          h('button', { class: 'knopf holz', onclick: () => { f.schliessen(); betreteStation(def, k, 'stollen', idx, 1); } }, 'Grundstufe üben'),
          n ? h('button', { class: 'knopf mit-bild', onclick: () => { f.schliessen(); betreteStation(def, k, 'stollen', idx, n); } },
            ZI.bildOder('stollen-tiefer', '', null, 'knopf-bild'), h('span', null, 'Noch tiefer graben', h('small', { class: 'knopf-unter' }, 'Tiefe ' + n + ': ' + def.tiefen[n - 2].name))) : null),
        h('button', { class: 'knopf-link', onclick: () => f.schliessen() }, 'Zurück zum Eingang'),
      ], { schliessbar: true });
    }

    function kapitelInhalt(k) {
      const inh = INHALT[k];
      const tiefOffen = stand.coreCount(k) === 3 || testmodus;
      const sterne = stand.bonus[k];
      return [
        h('section', { class: 'pergament stollen auf-pergament' },
          h('h2', null, 'Stollen'),
          h('p', { class: 'erklaer' }, 'Wähle einen Stollen. Jeder Hauptstollen bringt Baumaterial für unser Dorf. Wer einen Stollen geschafft hat, darf dort freiwillig noch tiefer graben.'),
          h('div', { class: 'stationen stollen-wahl' }, inh.stollen.map((d, i) => stationKarte(d, k, stand.tiefe(k, i) >= 1, d.gemeinschaft && !stand.gemeinschaftOffen(k), 'Schaffe zwei andere Stollen bis Tiefe 2.',
            i < GEM ? i : undefined, i < GEM ? ROHSTOFF[i].name : ZI.GEMS_PRO_STOLLEN + ' Edelsteine', 'stollen', i)))),
        gebaeudeStollen(k),
        h('section', { class: 'pergament stollen auf-pergament' },
          h('h2', null, 'Bonusinsel'),
          h('div', { class: 'stationen' },
            stationKarte(inh.bonus, k, sterne > 0, !tiefOffen, 'Schaffe zuerst die drei Hauptstollen.', undefined, null, 'bonus', 0),
            h('div', { class: 'st-info', style: { alignSelf: 'center', fontSize: '18px' } }, 'Deine Sterne: ', sterneBild(sterne, 'klein')))),
        h('section', { class: 'pergament stollen auf-pergament rueckblick-abschnitt' },
          h('div', null,
            h('h2', null, 'Rückblick: Was kann ich schon?'),
            h('p', { class: 'erklaer' }, tiefOffen ? 'Schätz dich selbst ein. Wo du noch unsicher bist, zeigt dir Meisterin Hammerlind, was du üben kannst.' : 'Öffnet sich, wenn du die drei Hauptstollen geschafft hast.')),
          h('button', { class: 'knopf' + (tiefOffen ? '' : ' holz'), disabled: tiefOffen ? null : true, onclick: () => zeigeRueckblick(k) }, 'Selbst einschätzen')),
      ];
    }

    function gebaeudeStollen(k) {
      const liste = ZI.BAU_UEBUNGEN.filter((u) => u.kapitel === k);
      if (!liste.length) return null;
      const steht = gebauteGebaeude();
      return h('section', { class: 'pergament stollen auf-pergament' },
        h('h2', null, 'Gebäude-Stollen'),
        h('p', { class: 'erklaer' }, 'Jedes Gebäude, das eure Klasse baut, öffnet hier eine neue Übung. Was zuerst gebaut wird, entscheidet der Zwergenrat.'),
        h('div', { class: 'stationen' }, liste.map((u) => {
          const g = ZI.GEBAEUDE.find((x) => x.id === u.id);
          const frei = testmodus || steht.includes(u.id) || stand.hatBau(u.bit);
          const def = { name: u.name, info: u.schwerpunkt, icon: [u.id, u.id + '-ruine'], spiel: () => spielBau(u) };
          return stationKarte(def, k, stand.hatBau(u.bit), !frei,
            'Öffnet sich mit: ' + (g ? g.name : u.id), undefined, null, 'bau', u.bit);
        })));
    }

    function kapitelGesperrt(k) {
      const kap = ZI.KAPITEL[k];
      if (stand.offen >= k) {
        return h('section', { class: 'pergament stollen auf-pergament' },
          h('h2', null, 'Kapitel ' + kap.nr + ': ' + kap.titel),
          h('p', { class: 'erklaer' }, 'Dieses Kapitel wird gerade noch geschmiedet. Bald geht es hier weiter!'));
      }
      return h('section', { class: 'pergament stollen auf-pergament' },
        h('h2', null, icon.schloss(), 'Kapitel ' + kap.nr + ': ' + kap.titel),
        h('p', { class: 'erklaer' }, 'Dieses Kapitel öffnet sich, wenn eure Klasse auf der Insel genug gebaut hat. Dann zeigt das Board eine neue Inselbotschaft.'),
        h('button', { class: 'knopf', style: { marginTop: '6px' }, onclick: () => botschaftEingeben(() => zeigeHalle()) }, 'Inselbotschaft eintippen'));
    }

    function zeichneReiter() {
      ZI.setze(reiter, ...ZI.KAPITEL.map((kap, k) => {
        const b = h('button', { class: k === aktiverReiter ? 'aktiv' : '', role: 'tab', 'aria-selected': String(k === aktiverReiter) },
          kapitelOffen(k) ? null : icon.schloss(), 'Kapitel ' + kap.nr + ' · ' + kap.titel);
        b.addEventListener('click', () => { aktiverReiter = k; letzterReiter = k; zeichneReiter(); });
        return b;
      }));
      ZI.setze(kapitelBox, ...(kapitelOffen(aktiverReiter) ? kapitelInhalt(aktiverReiter) : [kapitelGesperrt(aktiverReiter)]));
    }
    zeichneReiter();
    inhalt.append(begleiter(), botschaftLeiste(), reiter, kapitelBox);

    const rang = ZI.rang(stand);
    const rohstoffe = ROHSTOFF.map((r, i) => zaehler(r.datei, r.name, [0, 1, 2].filter((k) => stand.hatKern(k, i)).length));

    zeige(h('div', { class: 'screen' },
      ZI.hintergrund('stollen-hintergrund', 'hg-ersatz-stollen', 'rgba(20,12,8,0.35)'),
      h('div', { class: 'leiste halle-leiste' },
        h('button', { class: 'rund', style: { width: '64px', height: '64px', padding: 0, background: 'none', boxShadow: 'none' }, 'aria-label': 'Zwergen-Sammlung öffnen', onclick: () => zeigeWahl(false) }, avatar(stand.zwerg, true)),
        h('div', { class: 'rang-box' },
          h('div', { class: 'titel' }, z.name),
          h('div', { class: 'untertitel' }, (testmodus ? 'Testmodus · ' : '') + rang.name),
          h('div', { class: 'rang-balken', 'aria-label': rang.naechsterName ? 'Noch ' + (rang.naechsterAb - rang.punkte) + ' Punkte bis ' + rang.naechsterName : 'Höchster Rang erreicht' },
            h('div', { style: { width: (rang.naechsterAb ? ((rang.punkte - rang.ab) / (rang.naechsterAb - rang.ab)) * 100 : 100) + '%' } }))),
        h('div', { class: 'spacer' }),
        h('div', { class: 'rohstoff-reihe' }, ...rohstoffe, zaehler('edelstein', 'Edelsteine', stand.gems())),
        h('button', { class: 'rund', 'aria-label': 'Zwergen-Wissensbuch öffnen', onclick: zeigeWissensbuch }, icon.buch()),
        h('button', { class: 'rund', 'aria-label': 'Abzeichen-Album öffnen', onclick: zeigeAlbum }, icon.album()),
        vollbildKnopf(),
        h('button', { class: 'knopf', onclick: zeigeLieferung }, 'Lieferung')),
      h('div', { class: 'screen-scroll', style: { position: 'relative', zIndex: 2 } }, inhalt)));

    if (begruessen) {
      const f = ZI.fenster([
        h('div', { class: 'gross-bild' }, bild('meisterin-erklaert', 'Meisterin Hammerlind')),
        h('h2', null, 'Willkommen, ' + z.name + '!'),
        h('p', { style: { margin: 0, fontSize: '21px' } }, 'Ich bin Meisterin Hammerlind. Unser Clan ist auf dieser Insel gestrandet. Hier in der Schmiede schmieden wir Argumente – und mit jedem Argument bekommt die Klasse Baumaterial für unser Dorf.'),
        h('p', { style: { margin: 0, fontSize: '21px' } }, 'Gute Argumente sind wie gutes Werkzeug – sie funktionieren überall. Darum üben wir an Fragen aus eurer Schule. Was ihr hier schmiedet, nehmt ihr mit in eure Klasse.'),
        h('p', { style: { margin: 0, fontSize: '21px' } }, 'Am Ende der Stunde lieferst du dein Material ab und bekommst deinen Zwergenpass.'),
        h('button', { class: 'knopf', onclick: () => f.schliessen() }, 'Los geht’s!'),
      ]);
    }
  }

  /* =========================================================
     SPIEL-RAHMEN mit Bühne (Amboss, Hammer, Meisterin)
     ========================================================= */
  function buehne(werkstueck) {
    const blase = h('div', { class: 'meisterin-blase pergament', role: 'status', 'aria-live': 'polite' });
    const meisterinBox = h('div', { class: 'meisterin' }, bild('meisterin-erklaert', 'Meisterin Hammerlind'));
    let wsDatei = werkstueck;
    const ws = h('div', { class: 'werkstueck' }, bild(werkstueck, 'Werkstück'));
    const hammer = h('div', { class: 'hammer' }, bild('hammer', 'Hammer'));
    // Werkstück und Hammer hängen am Amboss: so passen Größe und Lage auf jedem Bildschirm
    const platz = h('div', { class: 'amboss-platz' },
      h('div', { class: 'amboss' }, bild('amboss', 'Amboss'), ws, hammer));
    const el = h('div', { class: 'buehne' }, blase, h('div', { class: 'meisterin-reihe' }, meisterinBox, platz));
    // Was liegt wo? Metall auf dem Amboss, Werkzeug/Truhe daneben, Figuren neben dem Amboss
    const artVon = (d) => (/^(eisen-|runenplatte|schmiede-)/.test(d) ? 'metall' : /^(kobold|zwerg-|meisterin)/.test(d) ? 'figur' : 'objekt');
    platz.dataset.art = artVon(werkstueck);

    return {
      el,
      sage(text, pose) {
        blase.textContent = text;
        ZI.setze(meisterinBox, bild('meisterin-' + (pose || 'erklaert'), 'Meisterin Hammerlind'));
      },
      person(datei) {
        platz.classList.add('person'); platz.dataset.art = 'figur';
        if (datei === wsDatei) return;
        wsDatei = datei;
        ws.classList.remove('neu'); void ws.offsetWidth;
        ZI.setze(ws, bild(datei, 'Ratsmitglied'));
        ws.classList.add('neu');
      },
      werkstueck(datei) {
        platz.classList.remove('person'); platz.dataset.art = artVon(datei);
        if (datei === wsDatei) return;
        wsDatei = datei;
        ws.classList.remove('neu'); void ws.offsetWidth;
        ZI.setze(ws, bild(datei, 'Werkstück'));
        ws.classList.add('neu');
      },
      schlag(danach) {
        hammer.classList.remove('schlag'); void hammer.offsetWidth;
        hammer.classList.add('schlag');
        setTimeout(() => {
          const r = platz.getBoundingClientRect();
          ZI.funken(platz, r.width / 2, r.height * 0.45, 22);
          const b = h('div', { class: 'blitz' }); platz.appendChild(b); setTimeout(() => b.remove(), 520);
          danach && danach();
        }, 300);
      },
    };
  }

  function spielRahmen({ titel, anzahl, aufgabe, bue }) {
    fehlerZaehler = 0; kombo = 0;
    const pips = h('div', { class: 'fortschritt', 'aria-hidden': 'true' });
    const setze = (fertig) => {
      ZI.setze(pips, ...Array.from({ length: anzahl }, (_, i) => h('span', { class: i < fertig ? 'voll' : i === fertig ? 'jetzt' : '' })));
    };
    setze(0);
    const screen = h('div', { class: 'screen' },
      ZI.hintergrund('schmiede-hintergrund', 'hg-ersatz-schmiede', 'rgba(20,12,8,0.2)'),
      h('div', { class: 'glut-flackern', 'aria-hidden': 'true' }),
      h('div', { class: 'leiste' },
        h('button', { class: 'rund', 'aria-label': 'Zurück zur Halle', onclick: () => bestaetigen('Station verlassen?', 'Ja, verlassen', () => zeigeHalle()) }, icon.zurueck()),
        h('div', null, h('div', { class: 'titel' }, titel), pips),
        h('div', { class: 'spacer' }),
        h('div', { class: 'kombo', hidden: true, 'aria-live': 'polite' }),
        vollbildKnopf()),
      h('div', { class: 'spiel' }, aufgabe, bue.el));
    zeige(screen);
    return { fortschritt: setze };
  }

  function aufgabenKopf(frageText, tippText, bue) {
    return h('div', { class: 'frage' },
      tippText ? h('button', { class: 'rund gold', 'aria-label': 'Laterne: Tipp anzeigen', onclick: () => bue.sage(tippText, 'tipp') }, icon.laterne()) : null,
      h('span', null, frageText));
  }

  /* Station oder Stollen geschafft */
  function geschafft({ titel, text, datei, alt, eintragen }) {
    if (document.querySelector('.fenster.geschafft-fenster')) return; // schon offen (z. B. Doppeltippen)
    ZI.konfetti();
    const st = aktStation;
    const z = aktuellerZwerg();
    // Wie sieht der Stand danach aus? (Kopie, damit nichts doppelt eingetragen wird)
    const nach = new ZI.Stand(JSON.parse(JSON.stringify(stand))); eintragen(nach);
    const stollen = st && st.art === 'stollen';
    const k = st ? st.k : K;
    const i = stollen ? st.i : 0;
    const n = stollen ? st.n : 0;
    const vorher = stollen ? stand.tiefe(k, i) : 0;
    const jetzt = stollen ? nach.tiefe(k, i) : 0;
    const neu = stollen && jetzt > vorher;
    const max = stollen ? ZI.Stand.maxTiefe(i) : 0;
    const def = stollen ? INHALT[k].stollen[i] : null;
    if (stollen && n === 1 && neu) titel = 'Stollen gemeistert!';
    if (stollen && n > 1 && neu) titel = 'Du hast Tiefe ' + jetzt + ' erreicht!';
    // schon erreichte Stufe noch einmal geübt: keine zweite Belohnung
    if (stollen && !neu) { titel = 'Gut geübt!'; text = n > 1 ? 'Diese Tiefe hattest du schon. Edelsteine gibt es nur beim ersten Mal.' : 'Diesen Stollen hattest du schon. Das Material gibt es nur beim ersten Mal.'; }
    const tiefer = stollen && jetzt >= 1 ? naechsteTiefe(k, i, nach) : null;
    let erledigt = false;
    const weiter = (danach) => { if (erledigt) return; erledigt = true; f.schliessen(); fortschritt(eintragen, danach); };
    const f = ZI.fenster([
      h('div', { class: 'geschafft-reihe' },
        stollen && n > 1 && neu ? h('div', { class: 'gross-bild strahlen' }, tiefeMedaille(jetzt, true, 'gross')) : h('div', { class: 'gross-bild strahlen' }, bild(datei, alt)),
        h('div', { class: 'huepf-zwerg' }, bild([z.datei + '-jubel', z.datei], z.name))),
      h('h2', null, titel),
      h('p', { style: { margin: 0, fontSize: '21px' } }, text),
      stollen && neu && jetzt > 1 ? h('div', { class: 'tiefe-info' }, tiefenLeiste(jetzt, max), h('span', null, def.name + ' · Tiefe ' + jetzt + ' von ' + max + ' · +' + ZI.GEMS_PRO_STOLLEN + ' Edelsteine')) : null,
      stollen && neu && jetzt === max && max > 1 ? h('p', { style: { margin: 0, fontSize: '19px' } }, 'Tiefer geht es in diesem Stollen nicht. Dafür bekommst du die Tiefen-Krone!') : null,
      tiefer !== null ? h('p', { class: 'freiwillig' }, 'Du kannst jetzt einen anderen Stollen wählen. Tiefer graben ist freiwillig – in diesem Stollen wird es dann schwerer.') : null,
      h('div', { class: 'fenster-fuss' },
        h('button', { class: 'knopf', onclick: () => weiter(() => zeigeHalle()) }, 'Zurück zum Eingang'),
        tiefer !== null ? h('button', { class: 'knopf holz mit-bild', onclick: () => weiter(() => betreteStation(def, k, 'stollen', i, tiefer)) }, ZI.bildOder('stollen-tiefer', '', null, 'knopf-bild'), 'Noch tiefer graben') : null),
    ]);
    f.el.classList.add('geschafft-fenster');
  }

  /* ---------- Ränge und Abzeichen ---------- */
  function abzeichenFrei(s) {
    const x = { wissen: wissenFrei(s).length };
    return ZI.ABZEICHEN.filter((a) => a.test(s, x));
  }
  function medaille(a, frei) {
    const name = ZI.abzeichenName(a, stand);
    return h('div', { class: 'medaille ' + a.stufe + (frei ? '' : ' gesperrt') },
      h('div', { class: 'medaille-rund' + (frei ? ' mit-bild' : '') }, frei ? ZI.bildOder('abzeichen-' + a.id, name, h('span', { class: 'medaille-symbol' }, icon[a.symbol]())) : h('span', null, '?')),
      h('div', { class: 'medaille-name' }, frei ? name : '???'),
      h('div', { class: 'medaille-text' }, a.text));
  }
  /* Alle Belohnungen einer Station in EINEM Fenster: Wissensbuch, Rang, Abzeichen */
  function zeigeErfolge(neuerRang, abzeichen, seiten, danach) {
    seiten = seiten || [];
    if (!neuerRang && !abzeichen.length && !seiten.length) { danach && danach(); return; }
    if (neuerRang || abzeichen.length) { ZI.konfetti(120); }
    const f = ZI.fenster([
      seiten.length ? h('div', { class: 'belohnung-seiten' },
        h('h2', { style: { fontSize: '26px' } }, seiten.length === 1 ? 'Neue Seite im Wissensbuch!' : seiten.length + ' neue Seiten im Wissensbuch!'),
        ...seiten.map((w) => seitenKarte(w, true))) : null,
      neuerRang ? h('div', { class: 'rang-neu' },
        h('div', { style: { fontSize: '18px', color: 'var(--tinte-hell)' } }, 'Neuer Rang!'),
        h('h2', null, neuerRang.name),
        h('div', { class: 'rang-emblem-reihe' },
          ZI.bildOder('rang-' + (neuerRang.nr + 1), neuerRang.name, null, 'rang-emblem'),
          h('div', { class: 'huepf-zwerg gross' }, bild([aktuellerZwerg().datei + '-jubel', aktuellerZwerg().datei], aktuellerZwerg().name)))) : null,
      abzeichen.length ? h('h2', { style: { fontSize: '28px' } }, abzeichen.length === 1 ? 'Neues Abzeichen!' : abzeichen.length + ' neue Abzeichen!') : null,
      abzeichen.length ? h('div', { class: 'medaillen' }, abzeichen.map((a) => medaille(a, true))) : null,
      h('div', { class: 'fenster-fuss' }, h('button', { class: 'knopf', onclick: () => { f.schliessen(); danach && danach(); } }, 'Weiter')),
    ]);
    const teile = (seiten.length ? 1 : 0) + (neuerRang ? 1 : 0) + (abzeichen.length ? 1 : 0);
    if (teile > 1) f.el.classList.add('erfolge-kompakt');
  }
  function zeigeAlbum() {
    const frei = abzeichenFrei(stand);
    const rang = ZI.rang(stand);
    zeige(h('div', { class: 'screen' },
      ZI.hintergrund('stollen-hintergrund', 'hg-ersatz-stollen', 'rgba(20,12,8,0.45)'),
      h('div', { class: 'leiste' },
        h('button', { class: 'rund', 'aria-label': 'Zurück zur Halle', onclick: () => zeigeHalle() }, icon.zurueck()),
        h('div', null,
          h('div', { class: 'titel' }, 'Abzeichen-Album'),
          h('div', { class: 'untertitel' }, frei.length + ' von ' + ZI.ABZEICHEN.length + ' Abzeichen · Rang: ' + rang.name))),
      h('div', { class: 'screen-scroll', style: { position: 'relative', zIndex: 2 } },
        h('div', { class: 'halle-inhalt' },
          h('section', { class: 'pergament auf-pergament stollen' },
            h('div', { class: 'rang-kopf' }, ZI.bildOder('rang-' + (rang.nr + 1), rang.name, null, 'rang-emblem'), h('h2', null, 'Dein Rang: ' + rang.name)),
            h('p', { class: 'erklaer' }, rang.naechsterName ? 'Noch ' + (rang.naechsterAb - rang.punkte) + ' Punkte bis „' + rang.naechsterName + '“. Punkte gibt es für jede Station, jede erreichte Tiefe, jeden Bonusstern und jede goldene Krone.' : 'Du hast den höchsten Rang erreicht!'),
            h('div', { class: 'rang-leiter' }, ZI.RAENGE.map((r, i) => h('div', { class: 'stufe' + (i <= rang.nr ? ' erreicht' : '') + (i === rang.nr ? ' jetzt' : '') },
              h('span', { class: 'stufe-punkte' }, String(r.ab)), h('span', null, aktuellerZwerg().w ? r.w : r.m))))),
          h('section', { class: 'pergament auf-pergament stollen' },
            h('h2', null, 'Abzeichen'),
            h('div', { class: 'medaillen' }, ZI.ABZEICHEN.map((a) => medaille(a, frei.includes(a)))))))));
  }

  /* =========================================================
     Auswahlspiel: eine richtige Antwort aus mehreren
     (Stumpf oder scharf? · Fehlerjagd · Beispiel-Edelstein)
     ========================================================= */
  function auswahlSpiel({ titel, frageText, items, tipp, wsVorher, wsNachher, start, ende, boss, leiste, hilfe = true, laterne = true, warum = false }) {
    items = [...new Map(items.map((it) => [it.kopf || it.vorher || JSON.stringify(it), it])).values()];
    const L = leiste || (boss ? { text: 'Kobold-Kraft', wachsen: false } : null);
    const breite = (n) => ((L && L.wachsen ? n : items.length - n) / items.length) * 100 + '%';
    const bue = buehne(wsVorher);
    const box = h('div', { class: 'aufgabe pergament auf-pergament' });
    const rahmen = spielRahmen({ titel, anzahl: items.length, aufgabe: box, bue });
    let nr = 0;
    bue.sage(start, 'erklaert');

    function zeigeItem() {
      const it = items[nr];
      if (it.ws) bue.person(it.ws); else if (/^kobold/.test(wsVorher)) bue.person(wsVorher); else bue.werkstueck(wsVorher);
      let fehler = 0;
      let geloest = false;
      const rueck = h('div');
      const optEls = [];
      const weiter = h('button', { class: 'knopf', style: { display: 'none', alignSelf: 'flex-end' } }, nr + 1 < items.length ? 'Weiter' : 'Fertig!');
      weiter.addEventListener('click', () => {
        nr++;
        rahmen.fortschritt(nr);
        if (nr < items.length) zeigeItem(); else ende();
      });
      const opts = mischen(it.optionen);
      opts.forEach((o) => {
        const b = h('button', { class: 'option' }, o.text);
        b.addEventListener('click', () => {
          if (geloest || b.classList.contains('weg')) return;
          if (o.ok) {
            geloest = true;
            b.classList.add('richtig');
            antwortRichtig();
            const lob = zufall(ZI.LOB);
            ZI.setze(rueck, h('div', { class: 'rueckmeldung gut' }, h('b', null, lob + ' '), warum && o.warum ? '' : o.info || ''));
            bue.sage(lob, 'jubelt');
            bue.schlag(() => { if (!it.ws) bue.werkstueck(boss ? (nr + 1 < items.length ? 'kobold-frech' : wsNachher) : wsNachher); });
            if (kraft) kraft.querySelector('.balken div').style.width = breite(nr + 1);
            optEls.forEach((x) => { if (x !== b) x.classList.add('weg'); });
            // „Warum?“: Das eigene Urteil begründen (nur wenn die richtige Antwort eine Erklärung hat)
            if (warum && o.warum) { warumFrage(o); return; }
            weiter.style.display = '';
          } else {
            fehler++;
            b.classList.remove('falsch'); void b.offsetWidth; b.classList.add('falsch');
            antwortFalsch();
            ZI.setze(rueck, h('div', { class: 'rueckmeldung schlecht' }, o.info || zufall(ZI.TROST)));
            bue.sage(boss ? 'Der Kobold kichert! Lass dich nicht ärgern – versuch es noch einmal.' : (L && L.wachsen ? 'Hm, das überzeugt noch nicht. Versuch es anders.' : zufall(ZI.TROST)), 'ermutigt');
            setTimeout(() => b.classList.add('weg'), 450);
            if (hilfe && fehler >= 2) {
              bue.sage('Ich helfe dir: Eine Möglichkeit bleibt übrig. Lies sie dir genau durch.', 'tipp');
              optEls.forEach((x, i) => { if (!opts[i].ok) x.classList.add('weg'); });
            }
          }
        });
        optEls.push(b);
      });
      const kraft = L ? h('div', { class: 'boss-leiste', 'aria-label': L.text },
        h('span', null, L.text), h('div', { class: 'balken ' + (L.wachsen ? 'ueberzeugung' : 'boss') }, h('div', { style: { width: breite(nr) } }))) : null;
      function warumFrage(o) {
        const wahl = mischen(o.warum);
        const box2 = h('div', { class: 'warum' }, h('div', { class: 'frage', style: { fontWeight: 700 } }, 'Und warum ist das die beste Antwort?'));
        const knoepfe = wahl.map((w) => {
          const b = h('button', { class: 'option' }, w.text);
          b.addEventListener('click', () => {
            if (b.classList.contains('weg') || weiter.style.display === '') return;
            if (w.ok) { b.classList.add('richtig'); antwortRichtig(); ZI.setze(rueck, h('div', { class: 'rueckmeldung gut' }, h('b', null, 'Gut begründet! '), o.info || 'Du hast dein Urteil passend erklärt.')); knoepfe.forEach((x) => { if (x !== b) x.classList.add('weg'); }); weiter.style.display = ''; }
            else { antwortFalsch(); b.classList.add('falsch'); setTimeout(() => b.classList.add('weg'), 450); ZI.setze(rueck, h('div', { class: 'rueckmeldung schlecht' }, 'Diese Erklärung passt nicht zur gewählten Antwort. Prüfe noch einmal, wonach die Aufgabe fragt.')); }
          });
          return b;
        });
        box2.append(h('div', { class: 'optionen' }, knoepfe));
        ZI.setze(rueck);
        box.insertBefore(box2, rueck);
      }
      ZI.setze(box,
        kraft,
        aufgabenKopf(it.frage || frageText, laterne ? tipp : null, bue),
        it.vorher ? h('div', { class: 'zitat' }, it.vorher) : null,
        it.kopf ? h('div', { class: 'meinung' }, it.kopf) : null,
        h('div', { class: 'optionen' }, optEls),
        rueck, weiter);
    }
    zeigeItem();
  }

  /* Station 1 */
  function spielStumpfScharf() {
    auswahlSpiel({
      titel: 'Stumpf oder scharf?',
      frageText: 'Welche Begründung erklärt, warum der Vorschlag sinnvoll ist?',
      items: ZI.ziehen(ZI.STUMPF_SCHARF, 6).map((it) => ({ kopf: it.meinung, optionen: it.optionen.map((o) => ({ text: o.text, ok: o.scharf, info: o.info, warum: o.warum })) })),
      tipp: ZI.TIPPS.stumpf,
      wsVorher: 'schmiede-axt-werkstueck', wsNachher: 'axt-scharf',
      start: 'Eine scharfe Begründung erklärt, WARUM. Eine stumpfe sagt nur dasselbe noch einmal.',
      ende: () => geschafft({ titel: 'Station geschafft!', text: 'Du hast alle Äxte geschärft. Dafür bekommt das Dorf Holz.', datei: 'holz', alt: 'Holz',
        eintragen: (s) => s.setzeKern(K, 0) }),
    });
  }

  /* ---------- Bausteine für längere Tiefe Stollen (8–12 Aufgaben, leicht ansteigend) ---------- */
  const TEILE = ['Meinung', 'Begründung', 'Beispiel'];
  const aufgabeTeil = (it, frage) => ({ frage: frage || 'Welcher Teil des Arguments ist das?', kopf: it.satz,
    optionen: TEILE.map((t) => ({ text: t, ok: t === it.teil, info: ZI.TEIL_INFO[t] })) });
  const aufgabeFehler = (it) => ({ frage: 'Welcher Satz ist richtig?', kopf: '', optionen: it.saetze.map((o) => ({ text: o.text, ok: o.ok, info: o.info, warum: o.warum })) });
  const aufgabeBeispiel = (it) => ({ frage: 'Welches Beispiel stützt genau diese Begründung?', kopf: it.argument, optionen: it.optionen });
  const aufgabeScharf = (it) => ({ frage: 'Welche Begründung ist scharf?', kopf: it.meinung, optionen: it.optionen.map((o) => ({ text: o.text, ok: o.scharf, info: o.info, warum: o.warum })) });
  const aufgabeLuecke = (it) => ({ frage: 'Welches Wort passt in die Lücke?', kopf: it.kopf, optionen: it.optionen });
  const aufgabeArt = (it) => ({ frage: 'Wie reagiert die zweite Person?', vorher: it.vorher, kopf: it.antwort,
    optionen: ZI.ARTEN.map((a) => ({ text: a, ok: a === it.art, info: ZI.ARTEN_INFO[a] })) });
  const aufgabeGegen = (it) => ({ frage: 'Welcher Satz ist ein echtes Gegenargument?', kopf: it.argument, optionen: it.optionen });
  const aufgabeSituation = (it) => ({ frage: 'Welches Argument überzeugt diese Person am besten?', kopf: it.situation, optionen: it.optionen });
  const aufgabeEinwand = (fall, e) => ({ frage: e.wer + (tiefeJetzt() >= 5 ? ' haben zwei Einwände. Was antwortest du?' : ' hat einen Einwand. Was antwortest du?'), vorher: fall.meinung + (tiefeJetzt() >= 4 && fall.beispiel ? ' Beispiel: ' + fall.beispiel : ''), kopf: e.wer + ': ' + e.einwand, ws: e.datei, optionen: e.optionen });


  /* =========================================================
     NOCH TIEFER GRABEN – jede Tiefe bleibt im selben Stollen, wird aber anspruchsvoller:
     plausiblere Auswahl, schwerere Beispiele, „Warum?“-Nachfrage, ab Tiefe 4 keine Hilfe nach Fehlern,
     in Tiefe 5 auch keine Laterne.
     ========================================================= */
  const aufgabeVerbessern = (it) => ({ frage: 'Diese Begründung ist schwach. Womit wird sie stärker?', vorher: it.schwach, optionen: it.optionen });
  const tiefeJetzt = () => (aktStation && aktStation.art === 'stollen' ? aktStation.n : 1);
  // nur der nächste Schritt zählt: Tiefen werden nicht übersprungen
  const tiefEintrag = (s) => {
    const st = aktStation; if (!st || st.art !== 'stollen') return;
    if (st.n <= s.tiefe(st.k, st.i) + 1) s.setzeTiefe(st.k, st.i, st.n);
  };
  const tiefGeschafft = (titel, text, datei) => geschafft({ titel, text: text + ' Dafür bekommst du ' + ZI.GEMS_PRO_STOLLEN + ' Edelsteine.', datei: datei || 'edelstein', alt: 'Edelstein', eintragen: tiefEintrag });
  /* gemeinsamer Rahmen für Auswahl-Tiefen */
  function tiefAuswahl(c) {
    const n = tiefeJetzt();
    auswahlSpiel(Object.assign({
      hilfe: n < 4, laterne: n < 5,
      wsVorher: 'schmiede-axt-werkstueck', wsNachher: 'axt-scharf',
      ende: () => tiefGeschafft(c.lob[0], c.lob[1], c.lobBild),
    }, c, { titel: c.titel + ' · Tiefe ' + n, start: c.start + (n >= 5 ? ' In dieser Tiefe gibt es keine Laterne.' : n >= 4 ? ' Ab jetzt hilft dir niemand nach zwei Fehlern.' : '') }));
  }
  const tiefAmbossBeleg = () => tiefAuswahl({
    titel: 'Grund und Beispiel', frageText: 'Welcher weil-Satz erklärt die Meinung und wird vom Beispiel gestützt?', warum: true,
    items: ZI.ziehen(ZI.AMBOSS_BELEGT, 7).map((it) => ({ kopf: it.meinung, optionen: it.optionen })),
    tipp: 'Verbinde Meinung und Grund. Prüfe dann, ob das Beispiel genau diesen Grund zeigt.',
    start: 'Nicht nur die Wörter müssen passen. Jetzt prüfst du auch den Grund und seinen Beleg.',
    lob: ['Gut verknüpft!', 'Deine Gründe und Beispiele passen zusammen.'] });
  const tiefGegenBeleg = () => tiefAuswahl({
    titel: 'Gegenargument und Beleg', frageText: 'Welcher Einwand bleibt trotz des Beispiels zu prüfen?', warum: true,
    items: ZI.ziehen(ZI.GEGEN_BELEGT, 7).map((it) => ({ ...aufgabeGegen(it), frage: 'Welcher Einwand bleibt trotz des Beispiels zu prüfen?' })),
    tipp: 'Ein Beispiel zeigt einen Nutzen. Trotzdem kann es noch einen Nachteil geben.',
    start: 'Prüfe den Nutzen am Beispiel und suche dann einen echten Einwand.',
    lob: ['Beide Seiten geprüft!', 'Du prüfst Belege und Nachteile zusammen.'] });
  const staerkerItem = (it, frage) => ({ frage, kopf: it.meinung, optionen: it.optionen });
  const tiefStaerker = (warum) => tiefAuswahl({
    titel: 'Welche ist stärker?', frageText: warum ? 'Bei welchem Argument passt das Beispiel zum Grund?' : 'Welcher Grund beantwortet die Frage am Anfang?', warum,
    items: ZI.ziehen(warum ? ZI.STAERKER_BELEGT : ZI.STAERKER, 7).map((it) => staerkerItem(it)),
    tipp: 'Beide Sätze können einen Vorteil nennen. Prüfe, welcher die Frage am Anfang beantwortet.',
    start: 'Achte auf die Frage am Anfang. Welcher Grund beantwortet genau diese Frage?' + (warum ? ' Danach sagst du, warum.' : ''),
    lob: ['Scharfer Blick!', 'Du erkennst starke Argumente.'] });
  const tiefVerbessern = () => tiefAuswahl({
    titel: 'Besser begründen', frageText: 'Diese Begründung ist schwach. Womit wird sie stärker?',
    items: ZI.ziehen(ZI.VERBESSERN, 7).map(aufgabeVerbessern),
    tipp: 'Lauter ist nicht besser. Eine starke Begründung erklärt, WARUM – und gilt nicht nur für dich.',
    start: 'Im Rat hört man oft schwache Begründungen. Du machst sie stark!',
    lob: ['Stark begründet!', 'Du machst aus schwachen Begründungen starke.'] });
  const tiefSchaerfe = () => tiefAuswahl({
    titel: 'Meister der Schärfe', frageText: 'Welche Antwort wägt die Einwände ab?', warum: true,
    items: ZI.ziehen(ZI.ABWAEGEN, 8).map((it) => staerkerItem(it, 'Welche Antwort berücksichtigt beide Einwände?')),
    tipp: ZI.TIPPS.stumpf,
    start: 'Zwei Einwände auf einmal: Prüfe, welche Antwort beide berücksichtigt, und begründe dein Urteil.',
    lob: ['Meister der Schärfe!', 'Deine Begründungen sind scharf wie eine Zwergenaxt.'] });
  const tiefPasst = (warum) => tiefAuswahl({
    titel: 'Nur eine passt', frageText: 'Welche Begründung passt wirklich zur Meinung?', warum,
    items: warum ? ZI.ziehen(ZI.ERZ_BELEGT, 7).map((it) => ({ kopf: it.meinung, frage: 'Welche Begründung wird vom Beispiel gestützt?', optionen: it.optionen })) : ZI.ziehen(ZI.ERZ_SCHLACKE.filter((rd) => rd.gruende.filter((g) => !g.erz).length >= 2), 6).map((rd) => {
      const erz = rd.gruende.find((g) => g.erz);
      const schlacke = mischen(rd.gruende.filter((g) => !g.erz)).slice(0, warum ? 3 : 2);
      return { kopf: rd.meinung, optionen: [erz, ...schlacke].map((g) => ({ text: g.text, ok: g.erz, info: g.info, warum: g.warum })) };
    }),
    tipp: ZI.TIPPS.erz, wsVorher: 'eisen-roh', wsNachher: 'eisen-gluehend',
    start: 'Die anderen Begründungen klingen gut, passen aber nicht. Nur eine erklärt die Meinung wirklich.',
    lob: ['Gut sortiert!', 'Du erkennst, welche Begründung wirklich passt.'] });
  const tiefGegen = (warum) => tiefAuswahl({
    titel: warum ? 'Einwände abwägen' : 'Gegenargument', frageText: 'Welcher Satz ist ein echtes Gegenargument?', warum,
    items: warum ? ZI.ziehen(ZI.ABWAEGEN, 8).map((it) => ({ kopf: it.meinung, frage: 'Welche Antwort nimmt beide Einwände ernst?', optionen: it.optionen })) : [...ZI.ziehen(ZI.JA_UND, 2).map(aufgabeArt), ...ZI.ziehen(ZI.GEGENARGUMENTE, 7).map(aufgabeGegen)],
    tipp: ZI.TIPPS.gegen,
    start: 'Ein Gegenargument nennt einen Nachteil der Meinung oder des Vorschlags. „Ich finde das doof“ ist nur Geschmack – kein Gegenargument.',
    lob: ['Starkes Gegenargument!', 'Du erkennst, was wirklich dagegen spricht.'] });
  const tiefLuecke = () => tiefAuswahl({
    titel: 'Welches Wort passt?', frageText: 'Welches Wort passt in die Lücke?',
    items: ZI.ziehen(ZI.bauUebung('huette2').items, 8, 'LUECKE').map(aufgabeLuecke),
    tipp: '„Weil“ und „denn“ nennen den GRUND. „Deshalb“ nennt die FOLGE.', wsVorher: 'eisen-roh', wsNachher: 'runenplatte',
    start: 'Jetzt kommt „deshalb“ dazu: Nennt der Satz einen Grund oder eine Folge?',
    lob: ['Gut verknüpft!', 'Du weißt, wann man weil, denn oder deshalb sagt.'] });
  const tiefFehlerjagd = (meister) => tiefAuswahl({
    titel: meister ? 'Kobold-Meister' : 'Fehlerjagd', frageText: 'Der Fehlerkobold hat Sätze verbogen. Welcher Satz ist richtig?',
    warum: meister,
    items: meister ? ZI.ziehen(ZI.ABWAEGEN, 8).map((it) => ({
      kopf: it.meinung, frage: 'Bei welcher Antwort passt die Folgerung zu beiden Einwänden?',
      optionen: it.optionen.map((o) => ({ ...o, text: o.text + ' Deshalb lässt sich der Plan trotz beider Sorgen erproben.' })),
    })) : ZI.ziehen(ZI.FEHLERJAGD, 8).map(aufgabeFehler),
    tipp: meister ? 'Eine Folgerung muss aus den Gründen folgen. Prüfe beide Sorgen, nicht nur die Satzform.' : ZI.TIPPS.fehler, wsVorher: 'kobold-chaos', wsNachher: 'kobold-besiegt',
    start: meister ? 'Sätze können richtig klingen und trotzdem falsch folgern. Prüfe, ob die Antwort beide Einwände löst.' : 'Achtung, der Fehlerkobold war hier! Prüfe bei jedem Satz das Komma und das Verb.',
    lob: ['Kobold besiegt!', 'Du hast alle verbogenen Sätze gefunden.'], lobBild: 'kobold-besiegt' });
  const tiefTeil = () => tiefAuswahl({
    titel: 'Welcher Teil ist das?', frageText: 'Welcher Teil des Arguments ist das?',
    items: ZI.ziehen(ZI.TEIL_ERKENNEN, 8).map((it) => aufgabeTeil(it)),
    tipp: 'Meinung: Was finde ich? Begründung: Warum? Beispiel: Wie sieht das genau aus?', wsVorher: 'pergament', wsNachher: 'pergament',
    start: 'Jetzt steht jeder Satz allein – ohne die anderen Teile. Erkennst du trotzdem, was er ist?',
    lob: ['Teile erkannt!', 'Du kennst die Teile eines Arguments.'] });
  const tiefBeispiel = () => tiefAuswahl({
    titel: 'Das beste Beispiel', frageText: 'Welches Beispiel stützt genau diese Begründung?', warum: true,
    items: ZI.ziehen(ZI.BEISPIELE, 8).map(aufgabeBeispiel),
    tipp: ZI.TIPPS.beispiel, wsVorher: 'eisen-roh', wsNachher: 'edelstein',
    start: 'Ein gutes Beispiel macht die Begründung anschaulich. Danach sagst du, warum es passt.',
    lob: ['Edles Beispiel!', 'Du findest Beispiele, die wirklich stützen.'] });
  const tiefKobold = () => tiefAuswahl({
    titel: 'Kobold-Kampf', frageText: 'Besiege den Fehlerkobold!', boss: true,
    items: [...ZI.ziehen(ZI.TEIL_ERKENNEN, 2).map((it) => aufgabeTeil(it)), ...ZI.ziehen(ZI.STAERKER, 2).map((it) => staerkerItem(it, 'Welche Begründung ist stärker?')),
      ...ZI.ziehen(ZI.FEHLERJAGD, 2).map(aufgabeFehler), ...ZI.ziehen(ZI.BEISPIELE, 2).map(aufgabeBeispiel), ...ZI.ziehen(ZI.VERBESSERN, 2).map(aufgabeVerbessern)],
    tipp: ZI.TIPPS.boss, wsVorher: 'kobold-chaos', wsNachher: 'kobold-besiegt',
    start: 'Da ist er wieder, der Fehlerkobold – stärker als je zuvor! Nach zehn Treffern gibt er auf.',
    lob: ['Kobold besiegt!', 'Der Fehlerkobold gibt auf.'], lobBild: 'kobold-besiegt' });
  const motorWahl = (anzahlBremsen) => ZI.ziehen(ZI.MOTOR_BREMSE, 6).map((rd) => {
    const m = mischen(rd.beitraege.filter((x) => x.motor))[0];
    const br = mischen(rd.beitraege.filter((x) => !x.motor)).slice(0, anzahlBremsen);
    return { kopf: rd.thema, optionen: [m, ...br].map((x) => ({ text: x.text, ok: x.motor, info: x.info, warum: x.warum })) };
  });
  const tiefMotor = (warum) => tiefAuswahl({
    titel: 'Was bringt weiter?', frageText: 'Welcher Beitrag bringt das Gespräch weiter?', warum,
    items: warum ? ZI.ziehen(ZI.MOTOR_BELEGT, 7).map((it) => ({ kopf: it.meinung, frage: 'Welche Antwort nimmt den Einwand ernst?', optionen: it.optionen })) : motorWahl(2), tipp: ZI.TIPPS.motor,
    wsVorher: 'schleifstein', wsNachher: 'schleifstein',
    start: 'Jetzt stehen mehrere Beiträge nebeneinander. Nur einer bringt das Gespräch weiter.',
    lob: ['Gesprächsmotor!', 'Du erkennst, was ein Gespräch weiterbringt.'] });
  const tiefBremseMotor = (meister) => tiefAuswahl({
    titel: meister ? 'Gesprächs-Meister' : 'Aus Bremse wird Motor', frageText: 'Das bremst. Wie sagt man es besser?', warum: meister,
    items: meister ? ZI.ziehen(ZI.ABWAEGEN, 7).map((it) => ({ kopf: it.meinung, frage: 'Welche Antwort berücksichtigt beide Sorgen?', optionen: it.optionen })) : ZI.ziehen(ZI.BREMSE_MOTOR, 7).map((it) => ({ vorher: it.bremse, optionen: it.optionen })),
    tipp: 'Sag deine Meinung mit Grund, statt andere schlechtzumachen: „Ich sehe das anders, weil …“',
    wsVorher: 'schleifstein', wsNachher: 'schleifstein',
    start: 'Jemand bremst das Gespräch. Finde eine Antwort, die andere einbezieht und das Gespräch weiterbringt.',
    lob: ['Aus Bremse wird Motor!', 'Du kannst Bremsen in Motoren umbauen.'] });
  const tiefJaAber = () => {
    const gruppen = {};
    ZI.JA_UND.forEach((x) => { (gruppen[x.vorher] = gruppen[x.vorher] || []).push(x); });
    const items = ZI.ziehen(Object.values(gruppen).filter((g) => g.some((x) => x.art === 'Ja, aber …') && g.length >= 3).map((g) => ({ id: 'JA_ABER:' + g[0].id.split(':')[1], gruppe: g })), 6).map((x) => x.gruppe)
      .map((g) => ({ vorher: g[0].vorher, optionen: g.map((x) => ({ text: x.antwort, ok: x.art === 'Ja, aber …', info: x.art === 'Ja, aber …' ? 'Genau: Diese Antwort nimmt den Beitrag ernst und widerspricht mit einem Grund.' : ZI.ARTEN_INFO[x.art] })) }));
    tiefAuswahl({ titel: 'Finde das „Ja, aber“', frageText: 'Welche Antwort widerspricht mit einem Grund?', items,
      tipp: ZI.TIPPS.jaund, start: 'Drei Antworten auf denselben Beitrag. Welche sagt „Ja, aber …“ und nennt einen Grund?',
      lob: ['Gut widersprochen!', 'Du erkennst, wie man fair widerspricht.'] });
  };
  const tiefZuhoeren = () => tiefAuswahl({
    titel: 'Wer hört zu?', frageText: 'Welche Antwort zeigt, dass jemand wirklich zugehört hat?', warum: true,
    items: ZI.ziehen(ZI.ZUHOEREN, 7).map((it) => ({ vorher: it.vorher, optionen: it.optionen })),
    tipp: ZI.TIPPS.zuhoeren, wsVorher: 'schmiede-axt-werkstueck', wsNachher: 'axt-scharf',
    start: 'Pass auf Antworten auf, die etwas verdrehen. Danach sagst du, warum deine Antwort zuhört.',
    lob: ['Gut zugehört!', 'Du erkennst echtes Zuhören.'] });
  const tiefSituation = (warum) => tiefAuswahl({
    titel: 'Wer überzeugt wen?', frageText: 'Welches Argument überzeugt diese Person am besten?', warum,
    items: warum ? ZI.ziehen(ZI.ZUHOEREN_BELEGT, 7).map((it) => ({ vorher: it.vorher, frage: 'Was zeigt das Beispiel für die gehörte Begründung?', optionen: it.optionen })) : ZI.ziehen(ZI.SITUATIONEN, 7).map(aufgabeSituation),
    tipp: ZI.TIPPS.situation, wsVorher: 'truhe-zu', wsNachher: 'truhe-offen',
    start: 'Nicht jedes Argument überzeugt jeden. Hör genau hin, was der Person wichtig ist.',
    lob: ['Überzeugt!', 'Du gehst auf das ein, was anderen wichtig ist.'] });
  const tiefZuhoerProfi = () => tiefAuswahl({
    titel: 'Zuhör-Profi', frageText: 'Welche Antwort geht wirklich auf die Person ein?', warum: true,
    items: ZI.ziehen(ZI.ABWAEGEN, 8).map((it) => ({ kopf: it.meinung, frage: 'Welche Antwort geht auf beide Sorgen ein?', optionen: it.optionen })),
    tipp: ZI.TIPPS.zuhoeren, start: 'Anknüpfen und überzeugen gemischt.',
    lob: ['Zuhör-Profi!', 'Du hörst zu und überzeugst.'] });
  const tiefEinwaende = (n) => {
    const items = [];
    ZI.ziehen(n >= 5 ? ZI.INSELRAT_ABWAEGEN : ZI.INSELRAT, n >= 5 ? 6 : 4).forEach((fall) => mischen(fall.einwaende).forEach((e) => items.push(aufgabeEinwand(fall, e))));
    tiefAuswahl({ titel: n >= 5 ? 'Großer Inselrat' : 'Einwände', frageText: 'Was antwortest du?', warum: n >= 3,
      items: items.slice(0, n >= 5 ? 10 : 8), tipp: ZI.TIPPS.inselrat, wsVorher: 'eisen-roh', wsNachher: 'eisen-roh',
      leiste: { text: 'Überzeugung', wachsen: true },
      start: 'Der Inselrat hat noch mehr Einwände. Nimm jeden ernst und antworte mit einem Grund.',
      lob: ['Der Inselrat ist überzeugt!', 'Du antwortest stark auf Einwände.'] });
  };
  function tiefDafuerDagegen() {
    sortierSpiel({
      titel: 'Dafür oder dagegen? · Tiefe ' + tiefeJetzt(),
      runden: ZI.ziehen(ZI.DAFUER_DAGEGEN, 2),
      jaText: 'Dafür', neinText: 'Dagegen', jaUnter: 'stützt die Meinung', neinUnter: 'Gegenargument',
      frageText: 'Spricht der Satz für die Meinung oder dagegen?',
      tipp: 'Frag dich: Würde jemand diesen Satz sagen, der die Meinung gut findet? Dann ist er dafür.',
      start: 'Wer gut diskutiert, kennt auch die Argumente der anderen Seite. Sortiere: dafür oder dagegen?',
      wsVorher: 'eisen-roh', wsNachher: 'eisen-gluehend',
      rundeFertig: 'Jetzt kennst du beide Seiten!',
      falschJa: 'Hm, würde das jemand sagen, der dafür ist?',
      falschNein: 'Schau noch einmal: Stützt der Satz nicht doch die Meinung?',
      ende: () => tiefGeschafft('Beide Seiten erkannt!', 'Du erkennst Argumente dafür und dagegen.'),
    });
  }

  /* =========================================================
     Sortierspiel: jede Karte in eine von zwei Gruppen
     (Erz oder Schlacke? · Motor oder Bremse?)
     ========================================================= */
  function sortierSpiel({ titel, runden, jaText: jaT, neinText: neinT, jaUnter: jaU, neinUnter: neinU, erklaerung: erklT, frageText: frageT, tipp, start, wsVorher, wsNachher, rundeFertig: rundeF, falschJa: falschJ, falschNein: falschN, ende }) {
    const bue = buehne(wsVorher);
    const box = h('div', { class: 'aufgabe pergament auf-pergament' });
    const rahmen = spielRahmen({ titel, anzahl: runden.length, aufgabe: box, bue });
    bue.sage(start, 'erklaert');
    let r = 0;

    function runde() {
      const rd = runden[r];
      // eine Runde darf eigene Beschriftungen haben (z. B. „begründet / nicht begründet“)
      const jaText = rd.jaText || jaT; const neinText = rd.neinText || neinT; const frageText = rd.frage || frageT;
      const falschJa = rd.falschJa || falschJ; const falschNein = rd.falschNein || falschN; const rundeFertig = rd.rundeFertig || rundeF;
      const karten = mischen(rd.karten);
      let i = 0;
      bue.werkstueck(wsVorher);
      const karteBox = h('div');
      const rueck = h('div');
      const koerbe = h('div', { class: 'koerbe' });
      const knoepfe = h('div', { class: 'erz-knoepfe' });
      // eigene Runden-Beschriftung ersetzt auch Unterzeile und Begriffserklärung
      const jaUnter = rd.jaText ? rd.jaUnter : jaU; const neinUnter = rd.jaText ? rd.neinUnter : neinU;
      const erklaerung = rd.jaText ? null : erklT;
      const jaKnopf = h('button', { class: 'knopf' }, jaText, jaUnter ? h('small', { class: 'knopf-unter' }, jaUnter) : null);
      const neinKnopf = h('button', { class: 'knopf schlacke' }, neinText, neinUnter ? h('small', { class: 'knopf-unter' }, neinUnter) : null);
      knoepfe.append(jaKnopf, neinKnopf);
      let sperre = false;

      const zeigeKarte = () => ZI.setze(karteBox, h('div', { class: 'erz-karte' }, karten[i].text));
      function antwort(alsJa) {
        if (sperre) return;
        const g = karten[i];
        const karte = karteBox.firstChild;
        if (alsJa === g.ja) {
          sperre = true;
          antwortRichtig();
          ZI.setze(rueck, h('div', { class: 'rueckmeldung gut' }, g.info));
          bue.sage(zufall(ZI.LOB), 'jubelt');
          koerbe.appendChild(h('span', { class: 'marke' + (g.ja ? '' : ' grau') }, (g.ja ? jaText : neinText) + ': ' + g.text.replace('… ', '').slice(0, 60) + (g.text.length > 62 ? '…' : '')));
          karte.classList.add(g.ja ? 'weg-erz' : 'weg-schlacke');
          if (g.ja) bue.schlag();
          setTimeout(() => {
            sperre = false; i++;
            if (i < karten.length) { zeigeKarte(); ZI.setze(rueck); return; }
            bue.werkstueck(wsNachher);
            bue.sage(rundeFertig, 'jubelt');
            r++; rahmen.fortschritt(r);
            ZI.setze(knoepfe, h('button', { class: 'knopf', style: { gridColumn: 'span 2' }, onclick: () => (r < runden.length ? runde() : ende()) },
              r < runden.length ? 'Weiter' : 'Fertig!'));
          }, 900);
        } else {
          antwortFalsch();
          karte.style.animation = 'wackeln 0.4s';
          setTimeout(() => { karte.style.animation = ''; }, 420);
          ZI.setze(rueck, h('div', { class: 'rueckmeldung schlecht' }, g.info));
          bue.sage(alsJa ? falschJa : falschNein, 'ermutigt');
        }
      }
      jaKnopf.addEventListener('click', () => antwort(true));
      neinKnopf.addEventListener('click', () => antwort(false));

      ZI.setze(box,
        aufgabenKopf(frageText, tipp, bue),
        erklaerung ? h('div', { class: 'begriffe' }, ...erklaerung.map(([wort, satz, art]) => h('div', { class: 'begriff ' + (art || '') }, h('b', null, wort), ' ', satz))) : null,
        h('div', { class: 'meinung' }, rd.kopf),
        karteBox, knoepfe, rueck, koerbe);
      zeigeKarte();
    }
    runde();
  }

  /* Kapitel 1, Station 2 */
  function spielErz() {
    sortierSpiel({
      titel: 'Erz oder Schlacke?',
      runden: ZI.ziehen(ZI.BEGRUENDET_RUNDEN, 1).concat(ZI.ziehen(ZI.ERZ_SCHLACKE, 2).map((rd) => ({ kopf: rd.meinung, karten: rd.gruende.map((g) => ({ text: g.text, ja: g.erz, info: g.info, warum: g.warum })) }))),
      jaText: 'Erz', neinText: 'Schlacke', jaUnter: 'begründet den Vorschlag', neinUnter: 'begründet ihn nicht',
      erklaerung: [
        ['Erz =', 'Der Satz erklärt, warum die Meinung sinnvoll ist.', 'erz'],
        ['Schlacke =', 'Die Begründung passt nicht. Oder sie ist kein richtiger Grund.', 'schlacke'],
        ['', 'Beim Schmieden ist Erz wertvoll. Schlacke ist der Rest.', 'bild'],
      ],
      frageText: 'Erklärt der Satz, warum der Vorschlag sinnvoll ist? Erz oder Schlacke?',
      tipp: ZI.TIPPS.erz,
      start: 'Zuerst prüfen wir: Ist eine Meinung überhaupt begründet? Danach trennen wir Erz – passende Begründungen – von Schlacke.',
      wsVorher: 'eisen-roh', wsNachher: 'eisen-gluehend',
      rundeFertig: 'Das Erz glüht! Diese Meinung ist gut begründet.',
      falschJa: 'Hm, passt dieser Grund wirklich zur Meinung?',
      falschNein: 'Schau noch einmal: Erklärt dieser Grund nicht doch etwas?',
      ende: () => geschafft({ titel: 'Station geschafft!', text: 'Du hast das ganze Erz sortiert. Dafür bekommt das Dorf Stein.', datei: 'stein', alt: 'Stein', eintragen: (s) => s.setzeKern(K, 1) }),
    });
  }

  /* Kapitel 2, Station 2 */
  function spielMotor() {
    sortierSpiel({
      titel: 'Motor oder Bremse?',
      runden: ZI.ziehen(ZI.MOTOR_BREMSE, 2).map((rd) => ({ kopf: rd.thema, karten: rd.beitraege.map((g) => ({ text: g.text, ja: g.motor, info: g.info, warum: g.warum })) })),
      jaText: 'Motor', neinText: 'Bremse',
      frageText: 'Bringt dieser Beitrag das Gespräch weiter (Motor) oder stoppt er es (Bremse)?',
      tipp: ZI.TIPPS.motor,
      start: 'Im Zwergenrat wird viel geredet. Manche Beiträge treiben das Gespräch an wie ein Motor, andere bremsen es.',
      wsVorher: 'schleifstein', wsNachher: 'schleifstein',
      rundeFertig: 'Das Gespräch läuft wieder rund!',
      falschJa: 'Hilft dieser Beitrag dem Gespräch wirklich weiter?',
      falschNein: 'Schau genau: Bringt dieser Beitrag das Gespräch nicht doch voran?',
      ende: () => geschafft({ titel: 'Station geschafft!', text: 'Du erkennst Motoren und Bremsen. Dafür bekommt das Dorf Stein.', datei: 'stein', alt: 'Stein', eintragen: (s) => s.setzeKern(K, 1) }),
    });
  }

  /* =========================================================
     Station 3: Weil-Denn-Amboss
     ========================================================= */
  function spielWeilDenn(schwer) {
    // schwer (Tiefe 4): längere Sätze, das Verb wird nicht markiert, die Lösung erst nach drei Fehlern
    if (schwer) { tiefAmbossBeleg(); return; }
    const items = ZI.ziehen(ZI.WEIL_DENN, 6);
    const bue = buehne('eisen-roh');
    const box = h('div', { class: 'aufgabe pergament auf-pergament' });
    const rahmen = spielRahmen({ titel: 'Weil-Denn-Amboss' + (schwer ? ' · Tiefe ' + tiefeJetzt() : ''), anzahl: items.length, aufgabe: box, bue });
    bue.sage(schwer ? 'Keine Markierung: Jetzt prüfst du selbst, wo das gebeugte Verb steht.' : ZI.TIPPS.weil, 'erklaert');
    let nr = 0;
    let muendlichGesagt = false;

    function item() {
      // Satzzeichen gehören nicht zu einem Baustein – sonst verrät der Punkt das Satzende
      const roh = items[nr];
      const ohne = (w) => w.replace(/[.!?]$/, '');
      const letzter = roh.loesungen[0][roh.loesungen[0].length - 1];
      const punkt = /[.!?]$/.test(letzter) ? letzter.slice(-1) : '.';
      const it = Object.assign({}, roh, { kacheln: roh.kacheln.map(ohne), verb: ohne(roh.verb), loesungen: roh.loesungen.map((l) => l.map(ohne)) });
      let gelegt = [];
      let vorrat = ZI.mischenSatz(it.kacheln, it.loesungen);
      let fehler = 0;
      let fertig = false;
      bue.werkstueck('eisen-roh');
      const zeile = h('div', { class: 'satzzeile', 'aria-label': 'Dein Satz' });
      const vorratBox = h('div', { class: 'vorrat', 'aria-label': 'Wortbausteine' });
      const rueck = h('div');
      const weiter = h('button', { class: 'knopf', style: { display: 'none', alignSelf: 'flex-end' } }, nr + 1 < items.length ? 'Weiter' : 'Fertig!');
      weiter.addEventListener('click', () => {
        nr++; rahmen.fortschritt(nr);
        if (nr < items.length) item();
        else if (schwer) tiefGeschafft('Meister am Amboss!', 'Du baust Begründungssätze ohne Hilfe.', 'runenplatte');
        else geschafft({ titel: 'Station geschafft!', text: 'Deine Begründungssätze sitzen. Dafür bekommt das Dorf Eisen.', datei: 'eisen', alt: 'Eisen', eintragen: (s) => s.setzeKern(K, 2) });
      });

      function zeichne(markiereVerb) {
        ZI.setze(zeile,
          h('div', { class: 'platte fest' }, it.haupt),
          h('div', { class: 'platte bindewort' }, it.bindewort),
          ...gelegt.map((w, i) => {
            const b = h('button', { class: 'platte' + (markiereVerb && w === it.verb ? ' verb-markiert' : '') }, w);
            b.addEventListener('click', () => { if (fertig) return; gelegt.splice(i, 1); vorrat.push(w); ZI.setze(rueck, ); zeichne(); });
            return b;
          }),
          ...vorrat.map(() => h('div', { class: 'platte leer', 'aria-hidden': 'true' })),
          h('div', { class: 'satzpunkt', 'aria-hidden': 'true' }, punkt));
        ZI.setze(vorratBox, ...vorrat.map((w, i) => {
          const b = h('button', { class: 'platte' }, w);
          b.addEventListener('click', () => {
            if (fertig) return;
            vorrat.splice(i, 1); gelegt.push(w); zeichne();
            if (!vorrat.length) pruefen();
          });
          return b;
        }));
        if (!vorrat.length && !fertig) ZI.setze(vorratBox, h('span', { style: { fontSize: '17px', color: 'var(--tinte-hell)' } }, 'Tippe einen Baustein im Satz an, um ihn zurückzulegen.'));
      }

      function pruefen() {
        const ok = it.loesungen.some((l) => l.join('|') === gelegt.join('|'));
        if (ok) {
          fertig = true;
          antwortRichtig();
          const satz = it.haupt + ' ' + it.bindewort + ' ' + gelegt.join(' ') + punkt;
          ZI.setze(rueck, h('div', { class: 'rueckmeldung gut' }, h('b', null, zufall(ZI.LOB) + ' '), satz));
          bue.sage(it.bindewort === 'denn' ? 'Richtig: Nach „denn“ steht das Verb an zweiter Stelle.' : 'Richtig: Nach „' + it.bindewort + '“ steht das Verb am Ende.', 'jubelt');
          bue.werkstueck('eisen-gluehend');
          setTimeout(() => bue.schlag(() => bue.werkstueck('runenplatte')), 400);
          zeichne(true);
          ZI.setze(vorratBox, );
          weiter.style.display = '';
          if (!muendlichGesagt && it.bindewort === 'weil') {
            muendlichGesagt = true;
            setTimeout(() => bue.sage(ZI.TIPPS.weilMuendlich, 'tipp'), 2600);
          }
          return;
        }
        fehler++;
        antwortFalsch();
        const pos = gelegt.indexOf(it.verb);
        let text;
        if (it.bindewort === 'denn' && pos !== 1) text = 'Nach „denn“ kommt ein ganz normaler Satz: Das Verb „' + it.verb.replace('.', '') + '“ steht an zweiter Stelle.';
        else if (it.bindewort !== 'denn' && pos !== gelegt.length - 1) text = 'Nach „' + it.bindewort + '“ wandert das gebeugte Verb „' + it.verb.replace('.', '') + '“ ganz ans Ende.';
        else text = 'Das gebeugte Verb steht richtig. Prüfe jetzt, welche Bausteine zusammengehören: Wer tut etwas, und was tut diese Person?';
        if (fehler >= (schwer ? 3 : 2)) {
          gelegt = it.loesungen[0].slice(); vorrat = [];
          fertig = true;
          ZI.setze(rueck, h('div', { class: 'rueckmeldung tipp' }, 'Eine mögliche Reihenfolge ist: ', h('b', null, it.haupt + ' ' + it.bindewort + ' ' + gelegt.join(' '))));
          bue.sage('Ich zeige dir eine mögliche Reihenfolge. Achte auf das gebeugte Verb.', 'tipp');
          bue.werkstueck('eisen-gluehend');
          zeichne(true); ZI.setze(vorratBox, );
          weiter.style.display = '';
          return;
        }
        ZI.setze(rueck, h('div', { class: 'rueckmeldung schlecht' }, text));
        bue.sage(schwer ? 'Fast! Versuch es noch einmal.' : 'Fast! Das Verb ist leuchtend markiert.', 'ermutigt');
        zeichne(!schwer);
      }

      ZI.setze(box,
        aufgabenKopf('Bau den Begründungssatz. Tippe die Bausteine in der richtigen Reihenfolge an.', schwer ? null : ZI.TIPPS.weil, bue),
        zeile, vorratBox, rueck, weiter);
      zeichne();
    }
    item();
  }

  /* =========================================================
     Tiefer Stollen 3: Meisterstück (mündlich mit Partner)
     ========================================================= */
  /* =========================================================
     GEMEINSCHAFTSSTOLLEN (Meisterstück, Meisterstück II, Streitgespräch)
     Jedes Kind spielt auf seinem EIGENEN iPad. Keine Verbindung zwischen den Geräten nötig:
     Beide öffnen denselben Stollen, wählen ihre Rolle und bekommen den Abschluss jeweils selbst.
     ========================================================= */
  function spielMeisterstueck(stufe, tiefe) {
    tiefe = tiefe || 1;
    const streit = stufe === 3;
    const zwei = stufe === 2 || (stufe === 1 && tiefe >= 2);                       // mit Beispiel
    const frei = (stufe === 1 && tiefe >= 3) || (stufe >= 2 && tiefe >= 2);         // ohne vorgegebenen Satz
    const gegen = stufe === 2 && tiefe >= 3;                                        // Gegenargument vorwegnehmen
    const loesung = streit && tiefe >= 3;                                           // am Ende ein gemeinsamer Vorschlag
    const titel = (streit ? 'Streitgespräch' : stufe === 2 ? 'Meisterstück II' : 'Meisterstück') + (tiefe > 1 ? ' · Tiefe ' + tiefe : '');
    const tippText = streit ? ZI.TIPPS.meister3 : zwei ? ZI.TIPPS.meister2 : ZI.TIPPS.meister;
    const PRO = streit ? 1 : 3; // Argumente pro Person
    const bue = buehne('eisen-roh');
    const box = h('div', { class: 'aufgabe pergament auf-pergament' });
    const rahmen = spielRahmen({ titel, anzahl: PRO * 2, aufgabe: box, bue });
    let rolle = null;     // 'A' spricht zuerst, 'B' prüft zuerst
    let erledigt = 0;     // Schritte (sprechen + prüfen) insgesamt
    const genutzt = new Set();

    const kriterien = streit ? [
      'Die Meinung hatte eine Begründung („…, weil …“).',
      'Die Antwort hat wiederholt, was gesagt wurde („Du sagst, dass …“).',
      'Die Antwort hatte ein Gegenargument („Aber …“).',
      'Wir haben uns ausreden lassen und waren freundlich.',
      ...(loesung ? ['Am Ende gab es einen Vorschlag, mit dem beide leben können.'] : []),
    ] : [
      'Ich habe eine Meinung gehört („Ich finde, dass …“).',
      'Die Begründung passt zur Meinung.',
      'Die Begründung ist verständlich. Sie erklärt, WARUM.',
      ...(zwei ? ['Es gab ein passendes Beispiel („Zum Beispiel …“).'] : []),
      ...(gegen ? ['Ein Gegenargument wurde genannt und entkräftet („Manche sagen …, aber …“).'] : []),
    ];

    function kopfZeile(text, art) {
      return h('div', { class: 'gem-kopf ' + (art || '') }, text);
    }

    /* 1) Vorbereitung: Partner suchen, eigenes iPad, gleicher Stollen */
    function vorbereiten() {
      bue.sage('Dieser Stollen wird nur zu zweit gemeistert.', 'erklaert');
      ZI.setze(box,
        h('div', { class: 'gem-kopfbild' }, bild('gemeinschaftsstollen-icon', 'Gemeinschaftsstollen'), kopfZeile('Gemeinschaftsstollen', 'marke')),
        h('h2', { class: 'gem-titel' }, 'Bevor es losgeht'),
        h('ol', { class: 'gem-liste' },
          h('li', null, 'Such dir einen Partner.'),
          h('li', null, 'Jeder nimmt sein eigenes iPad.'),
          h('li', null, 'Ihr öffnet beide diesen Stollen: „' + titel + '“.')),
        h('p', { class: 'gem-text' }, 'Ihr spielt gemeinsam. Aber jeder bekommt den Stollen auf seinem eigenen iPad.'),
        h('button', { class: 'knopf', style: { alignSelf: 'flex-end' }, onclick: rolleWaehlen }, 'Wir sind bereit'));
    }

    /* 2) Rolle wählen */
    function rolleWaehlen() {
      bue.sage('Macht aus, wer zuerst spricht.', 'erklaert');
      const karte = (r, kopf, text) => h('button', { class: 'gem-rolle pergament auf-pergament', onclick: () => { rolle = r; zusammen(); } },
        h('span', { class: 'gem-rolle-buchstabe' }, r), h('b', null, kopf), h('span', null, text));
      ZI.setze(box,
        kopfZeile('Wer bist du?', 'marke'),
        h('p', { class: 'gem-text' }, streit
          ? 'Person A sagt zuerst eine Meinung. Person B antwortet mit einem Gegenargument. Danach tauscht ihr.'
          : 'Person A spricht zuerst. Person B hört zu und prüft. Danach tauscht ihr.'),
        h('div', { class: 'gem-rollen' },
          karte('A', 'Ich bin Person A', streit ? 'Ich sage zuerst meine Meinung.' : 'Ich spreche zuerst.'),
          karte('B', 'Ich bin Person B', streit ? 'Ich antworte zuerst mit „Aber …“.' : 'Ich höre zuerst zu und prüfe.')),
        h('p', { class: 'gem-hinweis' }, 'Wichtig: Einer ist A, der andere ist B.'));
    }

    /* 3) „Ab jetzt arbeitet ihr zusammen.“ */
    function zusammen() {
      bue.sage('Ab jetzt arbeitet ihr zusammen.', 'jubelt');
      ZI.setze(box,
        h('div', { class: 'gem-ansage' }, 'Ab jetzt arbeitet ihr zusammen.'),
        h('p', { class: 'gem-text' }, streit
          ? 'Ihr führt zwei kurze Streitgespräche. Einmal beginnt A, einmal beginnt B.'
          : 'Jeder sagt ' + PRO + ' Argumente. Der andere hört zu und prüft. Danach tauscht ihr.'),
        h('button', { class: 'knopf', style: { alignSelf: 'flex-end' }, onclick: weiter }, 'Los geht’s'));
    }

    /* Ablauf: A spricht zuerst, B prüft zuerst – danach Rollenwechsel */
    function phase() {
      const ersteHaelfte = erledigt < PRO;
      const ichSpreche = (rolle === 'A') === ersteHaelfte;
      return { ichSpreche, nr: (erledigt % PRO) + 1 };
    }
    function weiter() {
      rahmen.fortschritt(erledigt);
      if (erledigt === PRO * 2) { abschluss(); return; }
      if (erledigt === PRO) { rollenwechsel(); return; }
      const p = phase();
      if (p.ichSpreche) sprechen(p.nr); else pruefen(p.nr);
    }
    let gewechselt = false;
    function rollenwechsel() {
      if (gewechselt) { gewechselt = false; const p = phase(); if (p.ichSpreche) sprechen(p.nr); else pruefen(p.nr); return; }
      gewechselt = true;
      bue.sage('Rollenwechsel!', 'jubelt');
      ZI.setze(box,
        h('div', { class: 'gem-ansage' }, 'Rollenwechsel!'),
        h('p', { class: 'gem-text' }, streit ? 'Jetzt beginnt die andere Person.' : 'Wer gesprochen hat, prüft jetzt. Wer geprüft hat, spricht jetzt.'),
        h('button', { class: 'knopf', style: { alignSelf: 'flex-end' }, onclick: rollenwechsel }, 'Weiter'));
    }

    /* Sprechen: Thema wählen, Seite wählen, laut sagen */
    function sprechen(nr) {
      const zaehler = streit ? '' : ' · Argument ' + nr + ' von ' + PRO;
      bue.sage(streit ? 'Du beginnst das Streitgespräch.' : 'Du sprichst. Dein Partner hört zu und prüft.', 'erklaert');
      const frei = ZI.MEISTER_THEMEN.filter((t) => !genutzt.has(t.frage));
      const angebot = mischen(frei.length >= 3 ? frei : ZI.MEISTER_THEMEN).slice(0, 3);
      ZI.setze(box,
        kopfZeile('Du sprichst' + zaehler, 'sprechen'),
        aufgabenKopf('Wähle ein Thema.', tippText, bue),
        h('div', { class: 'themen' }, angebot.map((t) => h('button', { class: 'option', onclick: () => { genutzt.add(t.frage); seite(t, nr, zaehler); } }, t.frage))));
    }
    function seite(thema, nr, zaehler) {
      ZI.setze(box,
        kopfZeile('Du sprichst' + zaehler, 'sprechen'),
        aufgabenKopf('Bist du dafür oder dagegen?', tippText, bue),
        h('div', { class: 'meinung' }, thema.frage),
        h('div', { class: 'erz-knoepfe' },
          h('button', { class: 'knopf moos', onclick: () => sagen(frei ? thema.frage + ' – Ich bin dafür.' : thema.dafuer, zaehler) }, 'Dafür'),
          h('button', { class: 'knopf holz', onclick: () => sagen(frei ? thema.frage + ' – Ich bin dagegen.' : thema.dagegen, zaehler) }, 'Dagegen')));
    }
    function sagen(satz, zaehler) {
      bue.werkstueck('eisen-gluehend');
      bue.sage(streit ? 'Sag deine Meinung mit Begründung. Dein Partner antwortet: „Du sagst, dass … Aber …“'
        : zwei ? 'Sag alle drei Teile: Meinung, Begründung und ein Beispiel.' : 'Sag deine Meinung und eine Begründung, die erklärt, WARUM.', 'tipp');
      ZI.setze(box,
        kopfZeile('Du sprichst' + zaehler, 'sprechen'),
        aufgabenKopf('Überlege kurz. Dann sag es laut zu deinem Partner.', tippText, bue),
        h('div', { class: 'sprechblase-gross' }, satz,
          frei ? h('div', { class: 'gem-zusatz' }, 'Jetzt ohne Vorlage: „Ich finde, dass …, weil …“') : null,
          zwei ? h('div', { class: 'gem-zusatz' }, 'Zum Beispiel …') : null,
          gegen ? h('div', { class: 'gem-zusatz' }, 'Manche sagen …, aber …') : null,
          streit ? h('div', { class: 'gem-zusatz' }, 'Dein Partner: „Du sagst, dass … Aber …“') : null,
          loesung ? h('div', { class: 'gem-zusatz' }, 'Zum Schluss: „Wie wäre es, wenn wir …?“') : null),
        h('p', { class: 'gem-text' }, 'Sprich in ganzen Sätzen. Dein Partner prüft auf seinem iPad.'),
        h('div', { class: 'knopf-reihe', style: { justifyContent: 'flex-end' } },
          h('button', { class: 'knopf', onclick: () => warten(satz, zaehler) }, 'Ich habe es gesagt')));
    }
    function warten(satz, zaehler) {
      bue.sage('Dein Partner prüft jetzt. Warte kurz.', 'erklaert');
      ZI.setze(box,
        kopfZeile('Du sprichst' + zaehler, 'sprechen'),
        h('p', { class: 'gem-text' }, 'Dein Partner prüft auf seinem iPad. Was sagt er?'),
        h('div', { class: 'knopf-reihe', style: { justifyContent: 'flex-end' } },
          h('button', { class: 'knopf holz', onclick: () => sagen(satz, zaehler) }, 'Noch einmal sagen'),
          h('button', { class: 'knopf', onclick: (e) => { e.currentTarget.disabled = true; erledigt++; antwortRichtig(); weiter(); } }, 'Mein Partner sagt: geschafft!')));
    }

    /* Prüfen: zuhören und Kriterien abhaken */
    function pruefen(nr) {
      const zaehler = streit ? '' : ' · Argument ' + nr + ' von ' + PRO;
      bue.sage('Hör genau zu. Dann prüfe.', 'erklaert');
      const an = kriterien.map(() => false);
      const liste = h('div', { class: 'checkliste' });
      const rueck = h('div');
      function zeichne() {
        ZI.setze(liste, ...kriterien.map((p, i) => h('button', { class: 'check' + (an[i] ? ' an' : ''), 'aria-pressed': String(an[i]),
          onclick: () => { an[i] = !an[i]; zeichne(); } }, h('span', { class: 'kasten' }, an[i] ? icon.haken() : null), p)));
      }
      zeichne();
      let geprueft = false; // nach dem Prüfen wird derselbe Knopf zu „Weiter“ – nur einmal zählen
      const fertig = h('button', { class: 'knopf', style: { alignSelf: 'flex-end' }, onclick: () => {
        if (geprueft) { fertig.disabled = true; weiter(); return; }
        if (an.every(Boolean)) {
          geprueft = true;
          antwortRichtig(); bue.schlag(() => bue.werkstueck('axt-scharf'));
          erledigt++;
          ZI.setze(rueck, h('div', { class: 'rueckmeldung gut' }, 'Super! Sag deinem Partner: „Geschafft!“'));
          fertig.textContent = 'Weiter';
        } else {
          antwortFalsch();
          ZI.setze(rueck, h('div', { class: 'rueckmeldung tipp' }, 'Sag freundlich, was gefehlt hat: „Mir hat noch … gefehlt.“ Dann versucht ihr es noch einmal.'));
          an.fill(false); zeichne();
        }
      } }, 'Fertig geprüft');
      ZI.setze(box,
        kopfZeile(streit ? 'Du antwortest und prüfst' : 'Du prüfst' + zaehler, 'pruefen'),
        streit ? h('div', { class: 'sprechblase-gross' }, 'Hör zu. Dann antwortest du: „Du sagst, dass … Aber ich finde, dass …, weil …“') : null,
        aufgabenKopf(streit ? 'Hört euch zu. Dann tippt an, was geklappt hat.' : 'Hör zu. Tippe an, was du gehört hast.', 'Fehlt etwas, sag es freundlich: „Mir hat noch … gefehlt.“', bue),
        liste, rueck, fertig);
    }

    let abgeschlossen = false;
    function abschluss() {
      if (abgeschlossen) return; // Doppeltippen darf den Abschluss nicht zweimal auslösen
      abgeschlossen = true;
      rahmen.fortschritt(PRO * 2);
      bue.schlag(() => bue.werkstueck('axt-scharf'));
      setTimeout(() => geschafft({
        titel: streit ? 'Starkes Streitgespräch!' : 'Meisterstück!',
        text: (streit ? 'Ihr habt zugehört, angeknüpft und widersprochen – wie echte Ratsmitglieder.' : 'Ihr habt beide ' + PRO + ' Argumente gesagt und geprüft.') + ' Dafür bekommst du ' + ZI.GEMS_PRO_STOLLEN + ' Edelsteine.',
        datei: 'edelstein', alt: 'Edelstein', eintragen: tiefEintrag }), 700);
    }

    vorbereiten();
  }

  /* =========================================================
     KAPITEL 2 – neue Spiele
     ========================================================= */

  /* Hilfe: Auswahl mit Rückmeldung, die sich mehrere Spiele teilen.
     Ruft fertig() auf, sobald die richtige Antwort angetippt wurde. */
  function optionenListe(optionen, { bue, rueck, falschText, fertig, hilfe = true }) {
    const opts = mischen(optionen);
    let fehler = 0; let geloest = false;
    const els = opts.map((o) => {
      const b = h('button', { class: 'option' }, o.text);
      b.addEventListener('click', () => {
        if (geloest || b.classList.contains('weg')) return;
        if (o.ok) {
          geloest = true; b.classList.add('richtig'); antwortRichtig();
          els.forEach((x) => { if (x !== b) x.classList.add('weg'); });
          fertig(o);
        } else {
          fehler++;
          b.classList.remove('falsch'); void b.offsetWidth; b.classList.add('falsch');
          antwortFalsch();
          ZI.setze(rueck, h('div', { class: 'rueckmeldung schlecht' }, o.info || falschText || zufall(ZI.TROST)));
          bue.sage(zufall(ZI.TROST), 'ermutigt');
          setTimeout(() => b.classList.add('weg'), 450);
          if (hilfe && fehler >= 2) { els.forEach((x, i) => { if (!opts[i].ok) x.classList.add('weg'); }); bue.sage('Ich helfe dir: Eine Möglichkeit bleibt übrig.', 'tipp'); }
        }
      });
      return b;
    });
    return { el: h('div', { class: 'optionen' }, els), texte: opts.map((o) => o.text) };
  }

  function teilZeile(art, text) {
    const namen = { these: 'Meinung', begruendung: 'Begründung', beispiel: 'Beispiel' };
    return h('div', { class: 'teil teil-' + art }, h('span', { class: 'teil-name' }, namen[art]), h('span', null, text));
  }

  /* Station 1: Argument-Puzzle */
  function spielPuzzle() {
    const schritte = [];
    const auswahl = ZI.ziehen(ZI.PUZZLE, 6);
    for (let i = 0; i < auswahl.length; i += 3) {
      const puzzle = auswahl.slice(i, i + 3);
      mischen(puzzle).forEach((arg) => schritte.push({ arg, puzzle }));
    }
    const bue = buehne('runenplatte');
    const box = h('div', { class: 'aufgabe pergament auf-pergament' });
    const rahmen = spielRahmen({ titel: 'Argument-Puzzle', anzahl: schritte.length, aufgabe: box, bue });
    bue.sage('Der Fehlerkobold hat drei Argumente auseinandergerissen. Setz sie wieder zusammen: Meinung, Begründung, Beispiel.', 'erklaert');
    let nr = 0;

    function schritt() {
      const { arg, puzzle } = schritte[nr];
      bue.werkstueck('runenplatte');
      const teile = h('div', { class: 'teile' }, teilZeile('these', arg.these));
      const rueck = h('div');
      const bereich = h('div');
      const weiter = h('button', { class: 'knopf', style: { display: 'none', alignSelf: 'flex-end' } }, nr + 1 < schritte.length ? 'Nächstes Argument' : 'Fertig!');
      weiter.addEventListener('click', () => { nr++; rahmen.fortschritt(nr); if (nr < schritte.length) schritt(); else ende(); });

      function waehle(art) {
        const frage = art === 'begruendung' ? 'Welche Begründung gehört zu dieser Meinung?' : 'Welches Beispiel passt dazu?';
        const liste = optionenListe(puzzle.map((a) => ({
          text: a[art], ok: a === arg,
          info: art === 'begruendung' ? 'Diese Begründung gehört zu einer anderen Meinung.' : 'Dieses Beispiel gehört zu einem anderen Argument.',
        })), { bue, rueck, fertig: () => {
          teile.appendChild(teilZeile(art, arg[art]));
          ZI.setze(rueck);
          if (art === 'begruendung') { bue.sage('Richtig! Jetzt fehlt noch das Beispiel.', 'jubelt'); waehle('beispiel'); }
          else {
            bue.sage(zufall(ZI.LOB) + ' Das Argument ist vollständig.', 'jubelt');
            bue.schlag(() => bue.werkstueck('axt-scharf'));
            ZI.setze(bereich);
            weiter.style.display = '';
          }
        } });
        ZI.setze(bereich, h('div', { class: 'frage', style: { fontWeight: 700 } }, frage), liste.el);
      }
      ZI.setze(box, aufgabenKopf('Setz das Argument zusammen.', ZI.TIPPS.puzzle, bue), teile, bereich, rueck, weiter);
      waehle('begruendung');
    }
    function ende() {
      geschafft({ titel: 'Station geschafft!', text: 'Alle Argumente sind wieder ganz. Dafür bekommt das Dorf Holz.', datei: 'holz', alt: 'Holz', eintragen: (s) => s.setzeKern(K, 0) });
    }
    schritt();
  }

  /* Station 3: Hör-Stollen */
  function spielHoeren(n) {
    n = n || 1;
    const einmal = n >= 2; const wiederholen = n >= 3; const antworten = n >= 4; const ohneHilfe = n >= 5;
    const items = ZI.ziehen(ZI.HOEREN, n >= 3 ? 4 : 5).map((it) => ({ ...it, text: n >= 5 ? it.textProfi : it.text, fragen: n >= 5 ? it.fragenProfi : n >= 3 ? it.fragenTief : it.fragen }));
    const bue = buehne('eisen-roh');
    const box = h('div', { class: 'aufgabe pergament auf-pergament' });
    const rahmen = spielRahmen({ titel: 'Hör-Stollen' + (n > 1 ? ' · Tiefe ' + n : ''), anzahl: items.length, aufgabe: box, bue });
    bue.sage('Im Hör-Stollen ist es dunkel. Dein Partner liest dir vor. Du schaust nicht auf den Text – du hörst nur zu.', 'erklaert');
    let nr = 0;

    function item() {
      const it = items[nr];
      let q = 0;
      bue.werkstueck('eisen-roh');
      const rueck = h('div');
      const bereich = h('div', { style: { display: 'flex', flexDirection: 'column', gap: '12px' } });
      const textBox = h('div', { class: 'sprechblase-gross', hidden: true }, it.text);
      const schritt = h('div', { class: 'hoer-schritt' });
      const vorlesenLassen = () => ZI.setze(schritt,
        h('p', { class: 'hoer-hinweis' }, '1. Gib das iPad deinem Partner. 2. Dein Partner liest den Text laut vor. 3. Du hörst zu.'),
        h('button', { class: 'knopf holz', onclick: () => { textBox.hidden = false; ZI.setze(schritt,
          h('p', { class: 'hoer-hinweis' }, 'Partner: Lies langsam und deutlich vor. Danach tippst du auf „Fertig vorgelesen“.'),
          h('button', { class: 'knopf', onclick: () => { textBox.hidden = true;
            ZI.setze(schritt, einmal ? h('p', { class: 'hoer-hinweis' }, 'In dieser Tiefe wird jeder Text nur einmal vorgelesen.')
              : h('button', { class: 'knopf holz klein', onclick: () => { vorlesenLassen(); } }, 'Noch einmal vorlesen lassen'));
            if (wiederholen) wiedergeben(); else frage(); } }, 'Fertig vorgelesen')); } },
          'Text zeigen (nur für den Partner)'));
      const weiter = h('button', { class: 'knopf', style: { display: 'none', alignSelf: 'flex-end' } }, nr + 1 < items.length ? 'Weiter' : 'Fertig!');
      weiter.addEventListener('click', () => { nr++; rahmen.fortschritt(nr); if (nr < items.length) item(); else ende(); });

      // Tiefe 3+: erst mit eigenen Worten wiedergeben, der Partner bestätigt
      function wiedergeben() {
        bue.sage('Sag deinem Partner, was du gehört hast.', 'erklaert');
        ZI.setze(bereich, h('div', { class: 'sprechblase-gross' }, '„Du hast gesagt, dass …, weil …“'),
          h('p', { class: 'gem-text' }, 'Sag es mit eigenen Worten. Dein Partner hört zu und sagt, ob es stimmt.'),
          h('button', { class: 'knopf', style: { alignSelf: 'flex-end' }, onclick: () => { antwortRichtig(); frage(); } }, 'Partner: Das stimmt!'));
      }
      // Tiefe 4+: zum Schluss auf das Gehörte antworten
      function antwort() {
        bue.sage('Jetzt antwortest du deinem Partner.', 'erklaert');
        ZI.setze(bereich, h('div', { class: 'sprechblase-gross' }, '„Ja, und außerdem …“  oder  „Ja, aber …, weil …“'),
          h('p', { class: 'gem-text' }, 'Antworte deinem Partner laut auf das Argument – mit einem Grund.'),
          h('button', { class: 'knopf', style: { alignSelf: 'flex-end' }, onclick: () => { antwortRichtig(); bue.schlag(() => bue.werkstueck('eisen-gluehend')); ZI.setze(bereich); weiter.style.display = ''; } }, 'Ich habe geantwortet'));
      }
      function frage() {
        const f = it.fragen[q];
        const liste = optionenListe(f.optionen, { bue, rueck, hilfe: !ohneHilfe, falschText: einmal ? 'Das hast du so nicht gehört.' : 'Das hast du so nicht gehört. Lass dir den Text noch einmal vorlesen!', fertig: () => {
          ZI.setze(rueck, h('div', { class: 'rueckmeldung gut' }, zufall(ZI.LOB)));
          q++;
          if (q < it.fragen.length) { bue.sage('Gut zugehört! Noch eine Frage.', 'jubelt'); setTimeout(() => { ZI.setze(rueck); frage(); }, 900); }
          else if (antworten) setTimeout(() => { ZI.setze(rueck); antwort(); }, 900);
          else { bue.sage('Du hast genau zugehört!', 'jubelt'); bue.schlag(() => bue.werkstueck('eisen-gluehend')); weiter.style.display = ''; }
        } });
        ZI.setze(bereich, h('div', { class: 'frage', style: { fontWeight: 700, fontSize: '22px' } }, f.frage), liste.el);
      }
      ZI.setze(box,
        aufgabenKopf('Dein Partner liest dir ein Argument vor. Danach beantwortest du Fragen dazu.', ohneHilfe ? null : ZI.TIPPS.hoeren, bue),
        schritt, textBox, bereich, rueck, weiter);
      vorlesenLassen();
    }
    function ende() {
      if (n > 1) { tiefGeschafft('Zuhör-Meister!', 'Du hörst genau zu, auch wenn es schwerer wird.'); return; }
      geschafft({ titel: 'Station geschafft!', text: 'Du bist ein echter Zuhör-Zwerg. Dafür bekommt das Dorf Eisen.', datei: 'eisen', alt: 'Eisen', eintragen: (s) => s.setzeKern(K, 2) });
    }
    item();
  }

  /* Argument-Kette (Puzzle-Stollen, Tiefe 3) */
  function spielKette() {
    const items = ZI.ziehen(ZI.KETTEN, 8);
    const bue = buehne('eisen-roh');
    const box = h('div', { class: 'aufgabe pergament auf-pergament' });
    const rahmen = spielRahmen({ titel: 'Argument-Kette', anzahl: items.length, aufgabe: box, bue });
    bue.sage('Ein starkes Argument hat Stützen – wie Glieder einer Kette. Suche die zwei Sätze, die das Hauptargument stützen.', 'erklaert');
    let nr = 0;

    function item() {
      const it = items[nr];
      const karten = mischen(it.stuetzen);
      const gewaehlt = new Set();
      let versuche = 0; let fertig = false;
      bue.werkstueck('eisen-roh');
      const rueck = h('div');
      const liste = h('div', { class: 'checkliste' });
      const pruefKnopf = h('button', { class: 'knopf', style: { alignSelf: 'flex-end' }, disabled: true }, 'Prüfen');
      const weiter = h('button', { class: 'knopf', style: { display: 'none', alignSelf: 'flex-end' } }, nr + 1 < items.length ? 'Weiter' : 'Fertig!');
      weiter.addEventListener('click', () => { nr++; rahmen.fortschritt(nr); if (nr < items.length) item(); else ende(); });

      function zeichne(markiereLoesung) {
        ZI.setze(liste, ...karten.map((k, i) => {
          const an = gewaehlt.has(i);
          const kl = 'check' + (an ? ' an' : '') + (markiereLoesung && k.ok ? ' an' : '');
          return h('button', { class: kl, 'aria-pressed': String(an), onclick: () => {
            if (fertig) return;
            if (an) gewaehlt.delete(i); else if (gewaehlt.size < 2) gewaehlt.add(i); else { ZI.meldung('Wähle genau zwei Stützen.'); return; }
            pruefKnopf.disabled = gewaehlt.size !== 2; zeichne();
          } }, h('span', { class: 'kasten' }, an || (markiereLoesung && k.ok) ? icon.haken() : null), k.text);
        }));
      }
      pruefKnopf.addEventListener('click', () => {
        const falsche = [...gewaehlt].filter((i) => !karten[i].ok);
        if (!falsche.length) {
          fertig = true; antwortRichtig();
          ZI.setze(rueck, h('div', { class: 'rueckmeldung gut' }, h('b', null, zufall(ZI.LOB) + ' '), 'Beide Sätze stützen das Hauptargument und bauen darauf auf.'));
          bue.sage('Die Kette hält! So wird ein Argument richtig stark.', 'jubelt');
          bue.schlag(() => bue.werkstueck('eisen-gluehend'));
          pruefKnopf.style.display = 'none'; weiter.style.display = '';
          return;
        }
        versuche++; antwortFalsch();
        ZI.setze(rueck, h('div', { class: 'rueckmeldung schlecht' }, falsche.map((i) => h('div', null, '„' + karten[i].text + '“ – ' + karten[i].info))));
        falsche.forEach((i) => gewaehlt.delete(i));
        pruefKnopf.disabled = true;
        if (versuche >= 2) {
          fertig = true;
          bue.sage('Ich zeige dir die beiden Stützen. Lies sie dir genau durch.', 'tipp');
          zeichne(true); pruefKnopf.style.display = 'none'; weiter.style.display = '';
          return;
        }
        bue.sage('Fast! Ein Satz mit „außerdem“ bringt meist ein neues Argument.', 'ermutigt');
        zeichne();
      });
      ZI.setze(box,
        aufgabenKopf('Welche zwei Sätze stützen das Hauptargument?', ZI.TIPPS.kette, bue),
        h('div', { class: 'teile' }, teilZeile('these', it.meinung), teilZeile('begruendung', it.haupt)),
        liste, pruefKnopf, rueck, weiter);
      zeichne();
    }
    function ende() {
      geschafft({ titel: 'Stollen geschafft!', text: 'Deine Argument-Ketten halten. Dafür bekommst du ' + ZI.GEMS_PRO_STOLLEN + ' Edelsteine.', datei: 'edelstein', alt: 'Edelstein', eintragen: tiefEintrag });
    }
    item();
  }

  /* =========================================================
     KAPITEL 3 – neue Spiele
     ========================================================= */

  /* Station 1: Ja, und – ja, aber? */
  function spielJaUnd() {
    auswahlSpiel({
      titel: 'Ja, und – ja, aber?',
      frageText: 'Wie reagiert die zweite Person?',
      items: ZI.ziehen(ZI.JA_UND, 6).map((it) => ({ vorher: it.vorher, kopf: it.antwort,
        optionen: ZI.ARTEN.map((a) => ({ text: a, ok: a === it.art, info: ZI.ARTEN_INFO[a] })) })),
      fest: true,
      tipp: ZI.TIPPS.jaund,
      wsVorher: 'eisen-roh', wsNachher: 'eisen-gluehend',
      start: 'Im Zwergenrat antworten alle aufeinander. Manche stimmen zu und ergänzen, manche widersprechen – und manche reden über etwas ganz anderes.',
      ende: () => geschafft({ titel: 'Station geschafft!', text: 'Du erkennst, wie man auf andere eingeht. Dafür bekommt das Dorf Holz.', datei: 'holz', alt: 'Holz', eintragen: (s) => s.setzeKern(K, 0) }),
    });
  }

  /* Station 2: Wer hört zu? */
  function spielZuhoeren() {
    auswahlSpiel({
      titel: 'Wer hört zu?',
      frageText: 'Welche Antwort zeigt, dass jemand wirklich zugehört hat?',
      items: ZI.ziehen(ZI.ZUHOEREN, 6).map((it) => ({ vorher: it.vorher, optionen: it.optionen })),
      tipp: ZI.TIPPS.zuhoeren,
      wsVorher: 'schmiede-axt-werkstueck', wsNachher: 'axt-scharf',
      start: 'Gute Zuhörer wiederholen richtig, was der andere gesagt hat, und gehen darauf ein. Pass auf Antworten auf, die etwas verdrehen!',
      ende: () => geschafft({ titel: 'Station geschafft!', text: 'Du bist ein echter Zuhör-Profi. Dafür bekommt das Dorf Stein.', datei: 'stein', alt: 'Stein', eintragen: (s) => s.setzeKern(K, 1) }),
    });
  }

  /* Station 3: Überzeug den Inselrat */
  function spielInselrat() {
    const items = [];
    ZI.ziehen(ZI.INSELRAT, 2).forEach((fall) => fall.einwaende.forEach((e) => items.push({
      frage: e.wer + (tiefeJetzt() >= 5 ? ' haben zwei Einwände. Was antwortest du?' : ' hat einen Einwand. Was antwortest du?'), vorher: fall.meinung + (tiefeJetzt() >= 4 && fall.beispiel ? ' Beispiel: ' + fall.beispiel : ''), kopf: e.wer + ': ' + e.einwand, ws: e.datei, optionen: e.optionen })));
    auswahlSpiel({
      titel: 'Überzeug den Inselrat',
      frageText: 'Was antwortest du?',
      items,
      tipp: ZI.TIPPS.inselrat,
      wsVorher: 'eisen-roh', wsNachher: 'eisen-roh',
      leiste: { text: 'Überzeugung', wachsen: true },
      start: 'Der Inselrat muss deinen Vorschlag erst genehmigen. Grimbart und Amara haben Einwände. Antworte so, dass du sie überzeugst!',
      ende: () => geschafft({ titel: 'Der Inselrat ist überzeugt!', text: 'Du hast alle Einwände entkräftet. Dafür bekommt das Dorf Eisen.', datei: 'eisen', alt: 'Eisen', eintragen: (s) => s.setzeKern(K, 2) }),
    });
  }

  /* BONUS Kapitel 3: Sprecherwechsel – im richtigen Moment einsteigen */
  function spielSprecherwechsel() {
    const saetze = (ZI.SPRECHERWECHSEL_RUNDEN ? ZI.zufall(ZI.SPRECHERWECHSEL_RUNDEN) : ZI.SPRECHERWECHSEL).slice();
    const sprecher = ZI.mischen(ZI.ZWERGE.slice(0, 8));
    let nr = 0; let treffer = 0; let laeuft = false;
    let zustand = 'warten'; // spricht | fenster | vorbei
    let timer = null;
    const blase = h('div', { class: 'sw-blase pergament', 'aria-live': 'polite' });
    const sprecherBild = h('div', { class: 'sw-sprecher' });
    const ergebnis = h('div', { class: 'sw-ergebnis' });
    const punktEl = h('span', null, '0');
    const knopf = h('button', { class: 'knopf sw-knopf', disabled: true }, 'Jetzt bin ich dran!');
    const zaehlerEl = h('div', { class: 'punktstand' }, h('span', null, '1'), ' / ' + saetze.length);

    function runde() {
      if (nr >= saetze.length) return ende();
      zaehlerEl.firstChild.textContent = String(nr + 1);
      const z = sprecher[nr % sprecher.length];
      ZI.setze(sprecherBild, bild(z.datei, z.name), h('div', { class: 'sw-name' }, z.name));
      ZI.setze(ergebnis);
      const woerter = saetze[nr].split(' ');
      let i = 0; zustand = 'spricht'; blase.textContent = '';
      knopf.disabled = false;
      const tempo = 520 + Math.random() * 120; // etwa Lesetempo einer 5. Klasse
      const tick = () => {
        if (!laeuft) return;
        if (i < woerter.length) {
          blase.textContent += (i ? ' ' : '') + woerter[i]; i++;
          timer = setTimeout(tick, tempo + (woerter[i - 1].endsWith(',') ? 260 : 0));
        } else {
          zustand = 'fenster';
          blase.classList.add('fertig');
          timer = setTimeout(() => { if (zustand === 'fenster') bewerte('zuspaet'); }, 3000);
        }
      };
      blase.classList.remove('fertig');
      timer = setTimeout(tick, 600);
    }

    function bewerte(art) {
      clearTimeout(timer);
      zustand = 'vorbei'; knopf.disabled = true;
      if (art === 'glatt') { treffer++; punktEl.textContent = String(treffer); antwortRichtig(); ZI.setze(ergebnis, h('div', { class: 'rueckmeldung gut' }, h('b', null, 'Glatter Wechsel! '), 'Du hast gewartet, bis der Satz zu Ende war.')); }
      else if (art === 'frueh') { antwortFalsch(); ZI.setze(ergebnis, h('div', { class: 'rueckmeldung schlecht' }, h('b', null, 'Unterbrochen! '), 'Der Satz war noch nicht fertig.')); }
      else { ZI.setze(ergebnis, h('div', { class: 'rueckmeldung tipp' }, h('b', null, 'Zu lange gewartet. '), 'Das Gespräch ist ins Stocken geraten.')); }
      nr++;
      setTimeout(() => { if (laeuft) runde(); }, 2600);
    }

    knopf.addEventListener('click', () => {
      if (zustand === 'spricht') bewerte('frueh');
      else if (zustand === 'fenster') bewerte('glatt');
    });

    function ende() {
      laeuft = false;
      const sterne = treffer >= 9 ? 3 : treffer >= 7 ? 2 : treffer >= 5 ? 1 : 0;
      const vorher = stand.bonus[K];
      const f = ZI.fenster([
        h('div', { class: 'gross-bild strahlen' }, bild('stern', 'Stern')),
        h('h2', null, treffer + ' von ' + saetze.length + ' glatten Wechseln!'),
        sterneBild(sterne),
        h('p', { style: { margin: 0 } }, 'Im echten Gespräch zeigen wir mit Blicken, Melden oder einem kurzen „Darf ich?“, dass wir etwas sagen möchten.'),
        h('div', { class: 'knopf-reihe' },
          h('button', { class: 'knopf holz', onclick: () => { f.schliessen(); spielSprecherwechsel(); } }, 'Nochmal'),
          h('button', { class: 'knopf', onclick: () => { f.schliessen(); if (sterne > vorher) fortschritt((s) => { s.bonus[K] = sterne; }, () => zeigeHalle()); else zeigeHalle(); } }, 'Zur Halle'))]);
    }

    zeige(h('div', { class: 'screen' },
      ZI.hintergrund('zwergenrat-hintergrund', 'hg-ersatz-stollen', 'rgba(20,12,8,0.35)'),
      h('div', { class: 'leiste' },
        h('button', { class: 'rund', 'aria-label': 'Zurück zur Halle', onclick: () => { laeuft = false; clearTimeout(timer); zeigeHalle(); } }, icon.zurueck()),
        h('div', { class: 'titel' }, 'Sprecherwechsel'),
        h('div', { class: 'spacer' }), zaehlerEl, h('div', { class: 'zaehler', 'aria-label': 'Glatte Wechsel' }, bild('stern', 'Punkte'), punktEl), vollbildKnopf()),
      h('div', { class: 'sw-buehne' }, h('div', { class: 'sw-reihe' }, sprecherBild, blase), ergebnis, knopf)));

    const f = ZI.fenster([
      h('div', { class: 'gross-bild' }, bild('meisterin-erklaert', 'Meisterin Hammerlind')),
      h('h2', null, 'Sprecherwechsel'),
      h('p', { style: { margin: 0, fontSize: '21px' } }, 'Im Zwergenrat spricht immer einer nach dem anderen. Tippe auf „Jetzt bin ich dran!“, sobald der Satz zu Ende ist – aber nicht vorher, sonst unterbrichst du.'),
      h('button', { class: 'knopf', onclick: () => { f.schliessen(); laeuft = true; runde(); } }, 'Start!')]);
  }

  /* =========================================================
     BONUS: Funkenregen
     ========================================================= */
  function spielFunkenregen(pool, titel, intro) {
    // Kindgerecht: Die Schwierigkeit liegt im Entscheiden, nicht im Lesetempo.
    const DAUER = 90;          // Sekunden insgesamt
    const LESEPAUSE = 4;       // so lange steht jede neue Meinung allein da, bevor Funken fallen
    const RUHE = 1.5;          // so lange bleibt jeder Funke oben stehen, bevor er fällt
    const runden = mischen(pool);
    let punkte = 0; let zeit = DAUER; let laeuft = false;
    let timer = null; let spawner = null;
    const punktEl = h('div', { class: 'punktstand' }, '0');
    const zeitEl = h('div', { class: 'punktstand' }, DAUER + ' s');
    const meinungEl = h('div', { class: 'arena-meinung pergament' });
    const arena = h('div', { class: 'arena' }, meinungEl);

    function rundeNr() { return Math.min(runden.length - 1, Math.floor((DAUER - zeit) / (DAUER / runden.length))); }
    let aktuelleRunde = -1;

    function funke() {
      const rd = runden[rundeNr()];
      const scharf = Math.random() < 0.55;
      const sichtbar = [...arena.querySelectorAll('.spark')].map((x) => x.textContent);
      const auswahl = (scharf ? rd.scharf : rd.stumpf).map((t) => '… ' + t).filter((t) => !sichtbar.includes(t));
      if (!auswahl.length) return;
      const text = zufall(auswahl);
      const b = h('button', { class: 'spark' }, text);
      const breite = arena.clientWidth;
      b.style.left = Math.max(8, Math.random() * (breite - 280)) + 'px';
      // längere Texte fallen langsamer; großzügige Mindestzeit
      const fall = Math.min(15, Math.max(10, 7 + text.length * 0.1));
      b.style.animationDuration = fall + 's';
      b.style.animationDelay = RUHE + 's';
      b.addEventListener('animationend', () => b.remove());
      b.addEventListener('click', () => {
        if (!laeuft || b.dataset.weg) return;
        b.dataset.weg = '1';
        const r = b.getBoundingClientRect(); const a = arena.getBoundingClientRect();
        if (scharf) {
          punkte++;
          ZI.funken(arena, r.left - a.left + r.width / 2, r.top - a.top + r.height / 2, 12);
          b.style.top = (r.top - a.top) + 'px'; b.style.transform = 'none';
          b.classList.add('gefangen');
        } else {
          punkte = Math.max(0, punkte - 1); antwortFalsch();
          b.style.top = (r.top - a.top) + 'px'; b.style.transform = 'none';
          b.classList.add('zisch');
        }
        b.style.animationDuration = '0.45s'; b.style.animationDelay = '0s';
        punktEl.textContent = String(punkte);
      });
      arena.appendChild(b);
    }

    function tick() {
      zeit--;
      zeitEl.textContent = zeit + ' s';
      const rn = rundeNr();
      if (rn !== aktuelleRunde) {
        aktuelleRunde = rn;
        arena.querySelectorAll('.spark').forEach((s) => s.remove());
        meinungEl.textContent = runden[rn].meinung;
        lesenBis = Date.now() + LESEPAUSE * 1000;
        meinungEl.classList.add('neu'); setTimeout(() => meinungEl.classList.remove('neu'), LESEPAUSE * 1000);
      }
      if (zeit <= 0) ende();
    }

    let lesenBis = 0;
    function starten() {
      laeuft = true; aktuelleRunde = 0; meinungEl.textContent = runden[0].meinung;
      lesenBis = Date.now() + LESEPAUSE * 1000;
      meinungEl.classList.add('neu'); setTimeout(() => meinungEl.classList.remove('neu'), LESEPAUSE * 1000);
      timer = setInterval(tick, 1000);
      // ruhiger Takt: ein Funke etwa alle 2 Sekunden, in der Lesepause keiner
      const plane = () => { if (!laeuft) return; if (Date.now() >= lesenBis) funke(); spawner = setTimeout(plane, 2000); };
      spawner = setTimeout(plane, 400);
    }

    function ende() {
      laeuft = false; clearInterval(timer); clearTimeout(spawner);
      arena.querySelectorAll('.spark').forEach((s) => s.remove());
      const sterne = punkte >= 14 ? 3 : punkte >= 10 ? 2 : punkte >= 6 ? 1 : 0;
      const vorher = stand.bonus[K];
      const f = ZI.fenster([
        h('div', { class: 'gross-bild strahlen' }, bild('stern', 'Stern')),
        h('h2', null, punkte + ' Funken gefangen!'),
        sterneBild(sterne),
        h('p', { style: { margin: 0 } }, sterne > vorher ? 'Neuer Rekord! Jeder Stern ist ein Edelstein für dein Dorf.' : 'Ab 6 Funken gibt es 1 Stern, ab 10 Funken 2 und ab 14 Funken 3 Sterne.'),
        h('div', { class: 'knopf-reihe' },
          h('button', { class: 'knopf holz', onclick: () => { f.schliessen(); spielFunkenregen(pool, titel, intro); } }, 'Nochmal'),
          h('button', { class: 'knopf', onclick: () => { f.schliessen(); if (sterne > vorher) fortschritt((s) => { s.bonus[K] = sterne; }, () => zeigeHalle()); else zeigeHalle(); } }, 'Zur Halle'))]);
    }

    zeige(h('div', { class: 'screen' },
      ZI.hintergrund('vulkan-hintergrund', 'hg-ersatz-vulkan', 'rgba(20,12,8,0.3)'),
      h('div', { class: 'leiste' },
        h('button', { class: 'rund', 'aria-label': 'Zurück zur Halle', onclick: () => { laeuft = false; clearInterval(timer); clearTimeout(spawner); zeigeHalle(); } }, icon.zurueck()),
        h('div', { class: 'titel' }, titel),
        h('div', { class: 'spacer' }), h('div', { class: 'zaehler', 'aria-label': 'Punkte' }, bild('stern', 'Punkte'), punktEl), zeitEl, vollbildKnopf()),
      arena));

    const f = ZI.fenster([
      h('div', { class: 'gross-bild' }, bild('meisterin-tipp', 'Meisterin Hammerlind')),
      h('h2', null, titel),
      h('p', { style: { margin: 0, fontSize: '21px' } }, intro),
      h('button', { class: 'knopf', onclick: () => { f.schliessen(); starten(); } }, 'Start!')]);
  }

  /* =========================================================
     LIEFERUNG & ZWERGENPASS
     ========================================================= */
  /* =========================================================
     RÜCKBLICK – Selbsteinschätzung mit Übungstipp
     ========================================================= */
  function rueckblickSpeicher() { return 'zi-rueckblick-' + (stand.karte || stand.id); }
  // Stollen oder Stufe als Eintrag {name, …}; n = Tiefe (1 = Grundstufe)
  function stufenDef(k, i, n) {
    const d = INHALT[k] && INHALT[k].stollen[i];
    if (!d) return null;
    return !n || n === 1 ? d : Object.assign({}, d.tiefen[n - 2], { name: d.name + ' · Tiefe ' + n + ': ' + d.tiefen[n - 2].name });
  }
  function uebungDef(k, u) { return u.art === 'stollen' ? stufenDef(k, u.i, u.n) : INHALT[k][u.art][u.i]; }
  // Rückblick: Übung starten – Tiefen nur, wenn man dort schon so tief ist (keine Abkürzung)
  function starteUebung(k, u) {
    const i = u.i; const n = u.art === 'stollen' ? Math.min(u.n || 1, stand.tiefe(k, i) + 1) : 1;
    const d = INHALT[k] && INHALT[k].stollen[i];
    if (!d) return;
    betreteStation(d, k, 'stollen', i, testmodus ? (u.n || 1) : Math.max(1, n));
  }
  function zeigeRueckblick(k) {
    const werte = sitzung.lesen(rueckblickSpeicher(), {});
    const liste = ZI.ICH_KANN[k] || [];
    const box = h('div', { class: 'rueckblick-liste' });
    const ziel = h('div');
    function zeichne() {
      ZI.setze(box, ...liste.map((it, n) => {
        const key = k + '-' + n; const w = werte[key];
        const def = uebungDef(k, it.uebung);
        const offen = true; // alle Stollen sind auswählbar
        return h('div', { class: 'rueckblick-zeile pergament auf-pergament' + (w ? ' w' + w : '') },
          h('div', { class: 'rueckblick-text' }, it.text),
          h('div', { class: 'rueckblick-wahl', role: 'radiogroup', 'aria-label': it.text },
            ZI.EINSCHAETZUNG.map((e) => h('button', { class: 'einschaetzung ' + e.klasse + (w === e.wert ? ' gewaehlt' : ''), role: 'radio', 'aria-checked': String(w === e.wert),
              onclick: () => { werte[key] = e.wert; sitzung.schreiben(rueckblickSpeicher(), werte); zeichne(); } }, e.text))),
          w && w < 3 ? h('div', { class: 'rueckblick-tipp' },
            h('span', null, w === 1 ? 'Übe noch einmal: ' : 'Zum Festigen: ', h('b', null, '„' + def.name + '“')),
            offen ? h('button', { class: 'knopf klein', onclick: () => starteUebung(k, it.uebung) }, 'Jetzt üben') : null) : null);
      }));
      const ueben = liste.map((it, n) => ({ it, w: werte[k + '-' + n] })).filter((x) => x.w === 1);
      const alle = liste.every((it, n) => werte[k + '-' + n]);
      ZI.setze(ziel, alle ? h('div', { class: 'rueckblick-ziel pergament auf-pergament' },
        h('div', { class: 'rueckblick-meisterin' }, bild('meisterin-ermutigt', 'Meisterin Hammerlind')),
        h('div', null,
          h('h3', { style: { margin: '0 0 4px' } }, 'Mein Ziel'),
          h('p', { style: { margin: 0 } }, ueben.length ? 'Als Nächstes übe ich: ' + uebungDef(k, ueben[0].it.uebung).name + '. Dann kann ich bald sagen: „' + ueben[0].it.text + '“'
            : 'Stark! Du fühlst dich überall schon sicher. Hilf doch jemandem, der noch übt.'))) : null);
    }
    zeichne();
    zeige(h('div', { class: 'screen' },
      ZI.hintergrund('stollen-hintergrund', 'hg-ersatz-stollen', 'rgba(20,12,8,0.45)'),
      h('div', { class: 'leiste' },
        h('button', { class: 'rund', 'aria-label': 'Zurück zur Halle', onclick: () => zeigeHalle() }, icon.zurueck()),
        h('div', null, h('div', { class: 'titel' }, 'Rückblick · Kapitel ' + ZI.KAPITEL[k].nr), h('div', { class: 'untertitel' }, 'Wie sicher bist du? Sei ehrlich – niemand sonst sieht das.')),
        h('div', { class: 'spacer' })),
      h('div', { class: 'screen-scroll', style: { position: 'relative', zIndex: 2 } }, h('div', { class: 'rueckblick' }, box, ziel))));
  }

  /* =========================================================
     INSELBOTSCHAFT – vom Board, sagt der Schmiede, was gebaut ist
     ========================================================= */
  const BOTSCHAFT_GILT = 8 * 60 * 60 * 1000; // gilt einen Schultag lang – nicht für die nächste Klasse am nächsten Tag
  function botschaftJetzt() {
    const b = sitzung.lesen('zi-botschaft', null);
    if (!b || !b.zeit || Date.now() - b.zeit > BOTSCHAFT_GILT) return null;
    return b;
  }
  function gebauteGebaeude() {
    const b = botschaftJetzt();
    if (!b) return [];
    return ZI.BAU_UEBUNGEN.filter((u) => b.bau & (1 << u.bit)).map((u) => u.id);
  }
  /* Mein Zwerg begleitet mich: kurzer Satz zum nächsten Ziel (in der Halle) */
  function begleiter() {
    const z = aktuellerZwerg(); if (!z) return null;
    const k = Math.min(stand.offen, ZI.KAPITEL.length - 1);
    const kern = INHALT[k] ? INHALT[k].kern : [];
    const offen = kern.findIndex((d, i) => !stand.hatKern(k, i));
    const gem = INHALT[k] && !stand.hatGemeinschaft(k) ? INHALT[k].gem : null;
    const satz = offen >= 0 ? 'Als Nächstes vielleicht: „' + kern[offen].name + '“. Ich komme mit!'
      : gem ? 'Alle Hauptstollen geschafft! Probier doch „' + gem.name + '“ mit einem Partner – oder grab in einem Stollen noch tiefer.'
        : 'Alle Stollen geschafft! Wer mag, gräbt in einem Stollen noch tiefer.';
    return h('div', { class: 'begleiter' },
      h('div', { class: 'begleiter-bild' }, bild([z.datei + '-jubel', z.datei], z.name)),
      h('div', { class: 'begleiter-blase pergament auf-pergament' }, h('b', null, z.name + ': '), satz));
  }

  function botschaftLeiste() {
    const b = botschaftJetzt();
    const anzahl = b ? ZI.BAU_UEBUNGEN.filter((u) => b.bau & (1 << u.bit)).length : 0;
    return h('div', { class: 'botschaft-leiste pergament auf-pergament' + (b ? ' ok' : '') },
      h('div', { class: 'botschaft-text' },
        b ? h('span', null, 'Inselbotschaft ', h('b', null, b.wort), ' · ' + (anzahl === 1 ? '1 Gebäude-Stollen offen' : anzahl + ' Gebäude-Stollen offen'))
          : h('span', null, h('b', null, 'Inselbotschaft: '), 'Tippe das Silbenwort vom Board ein. Dann öffnen sich die Gebäude-Stollen.')),
      h('button', { class: 'knopf klein' + (b ? ' holz' : ''), onclick: () => botschaftEingeben(() => zeigeHalle()) }, b ? 'Neue Botschaft' : 'Eintippen'),
      h('button', { class: 'knopf holz klein', onclick: stammesratEingeben }, 'Stammesrat'));
  }
  function botschaftEingeben(danach) {
    const eingabe = h('input', { class: 'eingabe botschaft-eingabe', maxlength: '12', autocomplete: 'off', autocorrect: 'off', autocapitalize: 'characters', spellcheck: 'false', placeholder: 'z. B. BOKAMI', 'aria-label': 'Inselbotschaft' });
    const hinweis = h('div');
    const pruefen = () => {
      const roh = eingabe.value.trim().toUpperCase().replace(/[^A-Z]/g, '');
      // alte Runenwörter öffnen weiterhin ihr Kapitel
      const alt = ZI.KAPITEL.findIndex((kap) => kap.runenwort && kap.runenwort === roh);
      const b = ZI.botschaft.lese(roh);
      if (!b && alt < 0) {
        antwortFalsch();
        ZI.setze(hinweis, h('div', { class: 'rueckmeldung schlecht' }, 'Diese Botschaft stimmt nicht. Schau genau aufs Board: drei Silben, zum Beispiel „BO KA MI“.'));
        return;
      }
      const kapitel = b ? b.kapitel : alt;
      if (b) sitzung.schreiben('zi-botschaft', { wort: roh, kapitel: b.kapitel, bau: b.bau, zeit: Date.now() });
      f.schliessen();
      const neuKapitel = kapitel > stand.offen && ZI.KAPITEL[kapitel] && ZI.KAPITEL[kapitel].fertig;
      const gebaut = b ? ZI.BAU_UEBUNGEN.filter((u) => b.bau & (1 << u.bit)) : [];
      const fertig = () => {
        if (neuKapitel) { letzterReiter = kapitel; ZI.meldung('Kapitel ' + ZI.KAPITEL[kapitel].nr + ' ist offen!', 3500); }
        else if (gebaut.length) ZI.meldung('Die Botschaft ist angekommen! ' + gebaut.length + (gebaut.length === 1 ? ' Gebäude-Stollen ist' : ' Gebäude-Stollen sind') + ' offen.', 3500);
        else ZI.meldung('Die Botschaft ist angekommen!', 2500);
        danach && danach();
      };
      if (neuKapitel) fortschritt((s) => { s.offen = Math.max(s.offen, kapitel); }, fertig); else fertig();
    };
    eingabe.addEventListener('keydown', (e) => { if (e.key === 'Enter') pruefen(); });
    const f = ZI.fenster([
      h('h2', null, 'Inselbotschaft'),
      h('p', { style: { margin: 0 } }, 'Auf dem Board steht ein Wort aus drei Silben. Es verrät der Schmiede, was eure Klasse schon gebaut hat.'),
      eingabe, hinweis,
      h('div', { class: 'knopf-reihe' },
        h('button', { class: 'knopf holz', onclick: () => f.schliessen() }, 'Abbrechen'),
        h('button', { class: 'knopf', onclick: pruefen }, 'Prüfen')),
    ]);
    setTimeout(() => eingabe.focus(), 150);
  }

  /* ---------- Stammesrat: Rolle im kleinen Rat ---------- */
  function stammesratEingeben() {
    const alt = sitzung.lesen('zi-stamm', null);
    if (alt && Date.now() - alt.zeit < 90 * 60 * 1000) { zeigeStammesrat(alt); return; }
    const eingabe = h('input', { class: 'eingabe botschaft-eingabe', maxlength: '12', autocomplete: 'off', autocorrect: 'off', autocapitalize: 'characters', spellcheck: 'false', placeholder: 'z. B. KOMIDA', 'aria-label': 'Stammescode' });
    const hinweis = h('div');
    const pruefen = () => {
      const roh = eingabe.value.trim().toUpperCase().replace(/[^A-Z]/g, '');
      const c = ZI.stammescode.lese(roh);
      if (!c) { antwortFalsch(); ZI.setze(hinweis, h('div', { class: 'rueckmeldung schlecht' }, 'Dieser Stammescode stimmt nicht. Er steht am Board bei den Stammesräten.')); return; }
      if (!stand.karte || stand.karte > c.n) { antwortFalsch(); ZI.setze(hinweis, h('div', { class: 'rueckmeldung schlecht' }, 'Deine Kartennummer kommt in diesem Rat nicht vor. Frag deine Lehrkraft.')); return; }
      const daten = { wort: roh, ...c, zeit: Date.now() };
      sitzung.schreiben('zi-stamm', daten);
      f.schliessen();
      uebergang('rat', 'Dein Stamm trifft sich am Feuer.', () => zeigeStammesrat(daten));
    };
    eingabe.addEventListener('keydown', (e) => { if (e.key === 'Enter') pruefen(); });
    const f = ZI.fenster([
      h('h2', null, 'Stammesrat'),
      h('p', { style: { margin: 0 } }, 'Am Board steht der Stammescode aus drei Silben. Damit erfährst du die Streitfrage, deinen Stamm und deine Pro-/Contra-Position.'),
      eingabe, hinweis,
      h('div', { class: 'knopf-reihe' },
        h('button', { class: 'knopf holz', onclick: () => f.schliessen() }, 'Abbrechen'),
        h('button', { class: 'knopf', onclick: pruefen }, 'Prüfen')),
    ]);
    setTimeout(() => eingabe.focus(), 150);
  }
  /* Zwergenrat auf dem iPad: geführter Weg 1–8 (Frage, Seite, Partner, Tafel, Stamm, Diskussion, Abstimmen, Ergebnis melden) */
  function zeigeStammesrat(c, schritt) {
    const staemme = ZI.stammesEinteilung(c.n, c.seed);
    const g = staemme.find((x) => x.mitglieder.some((m) => m.karte === stand.karte));
    if (!g) { sitzung.loeschen('zi-stamm'); stammesratEingeben(); return; }
    const mit = ZI.mitSeiten(g, c.seed);
    const ich = mit.find((m) => m.karte === stand.karte);
    const t = ZI.STREITFRAGEN[c.thema] || ZI.STREITFRAGEN[0];
    const meineSeite = ich.seite === 'pro' ? t.pro : t.contra;
    const partner = mit.filter((m) => m.seite === ich.seite && m.karte !== stand.karte);
    const tafelKey = 'zi-argumente-' + c.wort;
    const tafel = sitzung.lesen(tafelKey, ['', '', '']);
    schritt = schritt || c.schritt || 1;
    c.schritt = schritt; sitzung.schreiben('zi-stamm', c);
    const geh = (n) => { zeigeStammesrat(c, n); };
    const weiterKnopf = (text, n, extra) => h('button', Object.assign({ class: 'knopf', onclick: () => geh(n) }, extra || {}), text);
    const zurueck = schritt > 1 ? h('button', { class: 'knopf holz', onclick: () => geh(schritt - 1) }, 'Zurück') : null;
    const seitenKarte = () => h('div', { class: 'seitenkarte pergament auf-pergament ' + ich.seite },
      ZI.seitenMarke(ich.seite, 'gross'),
      h('div', null, h('div', { class: 'klein' }, 'Deine Rolle: Pro oder Contra'), h('div', { class: 'seiten-titel' }, meineSeite)));
    const tafelAnsicht = () => h('div', { class: 'stamm-box argumenttafel' },
      h('h3', null, 'Eure Argumenttafel · ', meineSeite),
      h('ol', { class: 'saetze' }, tafel.filter((x) => x.trim()).map((x) => h('li', null, x))));
    let inhalt; let fuss;
    if (schritt === 1) {
      inhalt = [h('div', { class: 'pergament auf-pergament stamm-box rat-gross' },
        h('p', { style: { margin: 0 } }, 'Ihr diskutiert jetzt diese Frage in eurem Zwergenstamm.'),
        h('div', { class: 'streitfrage' }, t.frage),
        h('div', { class: 'seiten-zeile' }, h('span', null, ZI.seitenMarke('pro', 'klein'), ' ', t.pro), h('span', null, ZI.seitenMarke('contra', 'klein'), ' ', t.contra)),
        h('p', { class: 'pro-contra-erklaerung' }, h('b', null, 'Pro'), ' heißt: dafür. ', h('b', null, 'Contra'), ' heißt: dagegen.'),
        h('p', { style: { margin: 0 } }, 'Lies die Frage. Noch nicht diskutieren – erst erfährst du deine Seite.'))];
      fuss = weiterKnopf('Welche Seite habe ich?', 2);
    } else if (schritt === 2) {
      inhalt = [seitenKarte(),
        h('p', { class: 'rat-hinweis pergament auf-pergament' }, 'Das ist deine Rolle für die Diskussion. Du musst nicht persönlich dieser Meinung sein.',
          h('span', { class: 'rat-hinweis-klein' }, ich.seite === 'pro' ? 'Du sammelst Argumente dafür.' : 'Du sammelst Argumente dagegen.', ' Deine eigene Meinung zählt erst bei der Stammesentscheidung.'))];
      fuss = weiterKnopf('Weiter', 3);
    } else if (schritt === 3) {
      inhalt = [seitenKarte(), h('div', { class: 'pergament auf-pergament stamm-box rat-gross' },
        partner.length ? [h('p', { style: { margin: 0, fontSize: '22px' } }, 'Trefft euch jetzt mit dem Zwerg aus eurem Stamm, der dieselbe Position hat.'),
          h('p', { style: { margin: '4px 0' } }, 'Ihr seid ein Team. Zu zweit sammelt ihr gleich eure Argumente.'),
          h('div', { class: 'stamm-liste' }, partner.map((m) => h('div', { class: 'stamm-person' }, h('b', null, 'Karte ' + m.karte), ZI.seitenMarke(m.seite, 'klein'))))]
          : h('p', { style: { margin: 0, fontSize: '22px' } }, 'Auf deiner Seite bist du allein. Sammle deine Argumente selbst. Dafür darfst du in der Diskussion als Erste oder Erster sprechen.'))];
      fuss = weiterKnopf(partner.length ? 'Wir haben uns gefunden' : 'Weiter', 4);
    } else if (schritt === 4) {
      const felder = h('div', { class: 'tafel-felder' });
      const los = weiterKnopf('Fertig gesammelt', 5);
      const pruefe = () => { const n = tafel.filter((x) => x.trim().length >= 3).length; los.disabled = n < 3; los.textContent = n < 3 ? 'Noch ' + (3 - n) + ' Argument' + (3 - n === 1 ? '' : 'e') : 'Fertig gesammelt'; };
      const zeichneFelder = () => ZI.setze(felder, ...tafel.map((v, i) => {
        const feld = h('textarea', { class: 'tafel-feld', rows: '3', maxlength: '160', enterkeyhint: 'next', 'aria-label': 'Argument ' + (i + 1), placeholder: i === 0 ? 'z. B. … weil …' : 'Argument ' + (i + 1) });
        feld.value = v;
        feld.addEventListener('input', () => { tafel[i] = feld.value; sitzung.schreiben(tafelKey, tafel); pruefe(); });
        // Bildschirmtastatur: Feld in die Mitte holen, damit es nicht verdeckt wird
        feld.addEventListener('focus', () => setTimeout(() => feld.scrollIntoView({ block: 'center', behavior: 'smooth' }), 350));
        return h('label', { class: 'tafel-zeile' }, h('span', { class: 'tafel-nr' }, String(i + 1)), feld);
      }));
      zeichneFelder();
      inhalt = [h('div', { class: 'stamm-box argumenttafel' },
        h('h3', null, 'Argumenttafel · ', meineSeite),
        h('p', { style: { margin: '0 0 8px' } }, h('b', null, partner.length ? 'Sammelt gemeinsam mindestens 3 Argumente.' : 'Sammle mindestens 3 Argumente.'), ' Ein Argument pro Feld. Stichwörter reichen. Die Tafel bleibt nur auf diesem iPad.'),
        felder,
        tafel.length < 5 ? h('button', { class: 'knopf holz klein', onclick: () => { tafel.push(''); sitzung.schreiben(tafelKey, tafel); zeigeStammesrat(c, 4); } }, '+ noch ein Argument') : null)];
      fuss = los; pruefe();
    } else if (schritt === 5) {
      inhalt = [h('div', { class: 'pergament auf-pergament stamm-box' },
        h('h3', null, 'Euer Stamm: die ' + g.name),
        h('p', { style: { margin: '0 0 8px', fontSize: '20px' } }, h('b', null, 'Die Partnerarbeit ist vorbei.'), ' Setzt euch jetzt alle ' + mit.length + ' als ganzer Stamm zusammen – Pro und Contra an einen Tisch. Nehmt eure iPads mit.'),
        h('div', { class: 'stamm-liste' }, mit.map((m) => h('div', { class: 'stamm-person' + (m.karte === stand.karte ? ' ich' : '') },
          h('b', null, 'Karte ' + m.karte + (m.karte === stand.karte ? ' (du)' : '')), ZI.seitenMarke(m.seite, 'klein')))))];
      fuss = weiterKnopf('Wir sitzen zusammen', 6);
    } else if (schritt === 6) {
      inhalt = [h('div', { class: 'pergament auf-pergament stamm-box rat-gross' }, h('div', { class: 'streitfrage klein-frage' }, t.frage),
        h('p', { style: { margin: 0, fontSize: '22px' } }, h('b', null, 'Jetzt diskutiert ihr als Stamm.'), ' Erst sagt Pro ein Argument, dann Contra. Danach antwortet ihr aufeinander. Eure Argumente stehen links. Achtet gemeinsam darauf, dass alle zu Wort kommen.')),
        h('div', { class: 'stamm-spalten' },
          tafelAnsicht(),
          h('div', { class: 'pergament auf-pergament stamm-box' },
            h('h3', null, 'So kannst du anfangen'),
            h('ul', { class: 'saetze' }, ZI.DISKUSSION_SAETZE.map((x) => h('li', null, x)))))];
      fuss = weiterKnopf('Wir sind fertig – abstimmen', 7);
    } else if (schritt === 7) {
      const wahl = (x) => h('button', { class: 'knopf abstimm-knopf ' + (x === 'a' ? 'pro' : 'contra') + (c.wahl === x ? ' gewaehlt' : c.wahl ? ' holz' : ''), 'aria-pressed': String(c.wahl === x),
        onclick: () => { c.wahl = x; sitzung.schreiben('zi-stamm', c); zeigeStammesrat(c, 7); } },
        ZI.seitenMarke(x === 'a' ? 'pro' : 'contra', 'klein'), h('span', null, x === 'a' ? t.pro : t.contra));
      inhalt = [h('div', { class: 'pergament auf-pergament stamm-box rat-gross' },
        h('div', { class: 'streitfrage klein-frage' }, t.frage),
        h('h3', null, 'Stammesentscheidung'),
        h('p', { style: { margin: '0 0 10px' } }, 'Jetzt zählt eure persönliche Meinung. Welche Seite hat euch nach der Diskussion mehr überzeugt? Stimmt im Stamm ab. Die Mehrheit entscheidet. Bei Gleichstand besprecht eure stärksten Gründe und einigt euch. Tippt danach alle dasselbe Ergebnis.'),
        h('div', { class: 'abstimm-wahl' }, wahl('a'), wahl('b')),
        c.wahl ? h('div', { class: 'rueckmeldung gut', style: { fontSize: '22px' } }, 'Die ' + g.name + ' stimmen für: ', h('b', null, c.wahl === 'a' ? t.pro : t.contra)) : null)];
      fuss = weiterKnopf(c.wahl ? 'Stammesentscheidung bestätigen' : 'Erst eine Seite wählen', 8, { disabled: c.wahl ? null : true });
    } else {
      const ergebnis = c.wahl === 'a' ? t.pro : t.contra;
      inhalt = [h('div', { class: 'pergament auf-pergament stamm-box rat-gross' },
        h('h3', { style: { margin: 0 } }, 'Entscheidung mitteilen'),
        h('p', { style: { margin: '6px 0', fontSize: '22px' } }, 'Bestimmt jetzt eine Person, die eure Entscheidung dem Zwergenrat mitteilt.'),
        h('p', { style: { margin: '6px 0' } }, 'Diese Person sagt im Zwergenrat:'),
        h('div', { class: 'meinung' }, '„Die ' + g.name + ' stimmen für: ' + ergebnis + ', weil …“'),
        h('p', { style: { margin: '8px 0 0' } }, 'Schaut jetzt zum Board. Die Lehrkraft trägt für euren Stamm eine Stimme ein. Die Siegerseite entscheidet, welches Gebäude die Zwerge bauen.')),
        tafelAnsicht()];
      fuss = h('button', { class: 'knopf holz', onclick: () => zeigeHalle() }, 'Zurück zur Halle');
    }
    zeige(h('div', { class: 'screen' },
      ZI.hintergrund('zwergenrat-hintergrund', 'hg-ersatz-stollen', 'rgba(20,12,8,0.45)'),
      h('div', { class: 'leiste' },
        h('button', { class: 'rund', 'aria-label': 'Zurück zur Halle', onclick: () => zeigeHalle() }, icon.zurueck()),
        h('div', null, h('div', { class: 'titel' }, 'Zwergenrat · ' + g.name), h('div', { class: 'untertitel' }, 'Stammescode ' + c.wort.match(/../g).join(' '))),
        h('div', { class: 'spacer' }),
        schritt === 7 ? h('button', { class: 'knopf holz klein', onclick: () => { const f = ZI.fenster([tafelAnsicht(), h('div', { class: 'knopf-reihe' }, h('button', { class: 'knopf', onclick: () => f.schliessen() }, 'Schließen'))]); } }, 'Meine Tafel') : null,
        h('button', { class: 'knopf holz klein', onclick: () => { sitzung.loeschen('zi-stamm'); stammesratEingeben(); } }, 'Neuer Code')),
      h('div', { class: 'screen-scroll', style: { position: 'relative', zIndex: 2 } },
        h('div', { class: 'stammesrat-ipad' }, ZI.ratsReise(schritt), ...inhalt,
          h('div', { class: 'knopf-reihe rat-fuss' }, zurueck, fuss)))));
  }

  /* ---------- Begründungshand: zwei passende Begründungen wählen ---------- */
  function spielHand(u, ende) {
    const items = ZI.ziehen(u.items, 3, 'BAU_' + u.id);
    const bue = buehne('eisen-roh');
    const box = h('div', { class: 'aufgabe pergament auf-pergament' });
    const rahmen = spielRahmen({ titel: u.name, anzahl: items.length, aufgabe: box, bue });
    bue.sage(u.start, 'erklaert');
    let nr = 0;
    function item() {
      const it = items[nr];
      const karten = mischen(it.begruendungen);
      const gewaehlt = new Set();
      let versuche = 0; let fertig = false;
      bue.werkstueck('eisen-roh');
      const rueck = h('div');
      const liste = h('div', { class: 'checkliste hand-liste' });
      const pruefKnopf = h('button', { class: 'knopf', style: { alignSelf: 'flex-end' }, disabled: true }, 'Prüfen');
      const weiter = h('button', { class: 'knopf', style: { display: 'none', alignSelf: 'flex-end' } }, nr + 1 < items.length ? 'Weiter' : 'Fertig!');
      weiter.addEventListener('click', () => { nr++; rahmen.fortschritt(nr); if (nr < items.length) item(); else ende(); });
      function zeichne(loesung) {
        ZI.setze(liste, ...karten.map((k, i) => {
          const an = gewaehlt.has(i) || (loesung && k.ok);
          return h('button', { class: 'check' + (an ? ' an' : ''), 'aria-pressed': String(an), onclick: () => {
            if (fertig) return;
            if (gewaehlt.has(i)) gewaehlt.delete(i); else if (gewaehlt.size < 2) gewaehlt.add(i); else { ZI.meldung('Wähle genau zwei Begründungen.'); return; }
            pruefKnopf.disabled = gewaehlt.size !== 2; zeichne();
          } }, h('span', { class: 'finger', 'aria-hidden': 'true' }, String(i + 1)), h('span', { class: 'kasten' }, an ? icon.haken() : null), k.text);
        }));
      }
      pruefKnopf.addEventListener('click', () => {
        const falsche = [...gewaehlt].filter((i) => !karten[i].ok);
        if (!falsche.length) {
          fertig = true; antwortRichtig();
          ZI.setze(rueck, h('div', { class: 'rueckmeldung gut' }, h('b', null, zufall(ZI.LOB) + ' '), 'Diese beiden Sätze erklären, warum der Vorschlag sinnvoll ist.'));
          bue.sage('Diese zwei Gründe passen zu deinem Vorschlag.', 'jubelt');
          bue.schlag(() => bue.werkstueck('eisen-gluehend'));
          pruefKnopf.style.display = 'none'; weiter.style.display = '';
          return;
        }
        versuche++; antwortFalsch();
        ZI.setze(rueck, h('div', { class: 'rueckmeldung schlecht' }, falsche.map((i) => h('div', null, '„' + karten[i].text + '“ – ' + karten[i].info))));
        falsche.forEach((i) => gewaehlt.delete(i));
        pruefKnopf.disabled = true;
        if (versuche >= 2) {
          fertig = true;
          bue.sage('Ich zeige dir zwei passende Gründe. Lies, warum sie den Vorschlag stützen.', 'tipp');
          zeichne(true); pruefKnopf.style.display = 'none'; weiter.style.display = '';
          return;
        }
        bue.sage('Frag dich: Erklärt der Satz wirklich, warum der Vorschlag hilft?', 'ermutigt');
        zeichne();
      });
      ZI.setze(box,
        aufgabenKopf(u.frage, u.tipp, bue),
        h('div', { class: 'hand-kopf' }, h('span', { class: 'hand-symbol', 'aria-hidden': 'true' }, '✋'), h('div', { class: 'meinung' }, it.meinung)),
        liste, rueck, pruefKnopf, weiter);
      zeichne();
    }
    item();
  }

  /* ---------- Gebäude-Übung spielen ---------- */
  function spielBau(u) {
    const g = ZI.GEBAEUDE.find((x) => x.id === u.id);
    const ende = () => geschafft({ titel: 'Gebäude-Stollen geschafft!', text: 'Du hast „' + u.name + '“ gemeistert. Dafür gibt es einen Rangpunkt und eine neue Seite im Wissensbuch.',
      datei: u.id, alt: g ? g.name : u.name, eintragen: (s) => s.setzeBau(u.bit) });
    if (u.typ === 'hand') { spielHand(u, ende); return; }
    if (u.typ === 'sortier') {
      sortierSpiel({
        titel: u.name, frageText: u.frage, tipp: u.tipp, start: u.start,
        runden: ZI.ziehen(u.runden, 2, 'BAU_' + u.id).map((rd) => ({ kopf: rd.kopf, karten: rd.karten })),
        jaText: u.jaText, neinText: u.neinText,
        wsVorher: 'eisen-roh', wsNachher: 'eisen-gluehend',
        rundeFertig: u.rundeFertig, falschJa: u.falschJa, falschNein: u.falschNein, ende,
      });
      return;
    }
    auswahlSpiel({
      titel: u.name, frageText: u.frage, tipp: u.tipp, start: u.start,
      items: ZI.ziehen(u.items, 5, 'BAU_' + u.id).map((it) => ({ kopf: it.kopf, optionen: it.optionen })),
      wsVorher: 'eisen-roh', wsNachher: 'eisen-gluehend', ende,
    });
  }

  /* ---------- Kartennummer wählen (steht auf der Zwergenpass-Karte) ---------- */
  function waehleKarte(aktuell, fertig, zurueck) {
    const knoepfe = [];
    for (let n = 1; n <= 32; n++) {
      knoepfe.push(h('button', { class: 'karten-nr' + (n === aktuell ? ' gewaehlt' : ''), 'aria-label': 'Karte ' + n,
        onclick: () => {
          const f = ZI.fenster([
            h('div', { class: 'karten-nr-gross' }, String(n)),
            h('h2', null, 'Steht die ' + n + ' auf deiner Karte?'),
            h('p', { style: { margin: 0 } }, 'Mit dieser Nummer kommt dein Material auf die Insel. Nimm immer dieselbe Nummer.'),
            h('div', { class: 'knopf-reihe' },
              h('button', { class: 'knopf holz', onclick: () => f.schliessen() }, 'Nein'),
              h('button', { class: 'knopf', onclick: () => { f.schliessen(); fertig(n); } }, 'Ja, das ist meine Nummer')),
          ]);
        } }, String(n)));
    }
    zeige(h('div', { class: 'screen' },
      ZI.hintergrund('stollen-hintergrund', 'hg-ersatz-stollen', 'rgba(20,12,8,0.45)'),
      h('div', { class: 'leiste' },
        h('button', { class: 'rund', 'aria-label': 'Zurück', onclick: zurueck }, icon.zurueck()),
        h('div', null,
          h('div', { class: 'titel' }, 'Deine Kartennummer'),
          h('div', { class: 'untertitel' }, 'Welche Nummer steht oben auf deiner Zwergenpass-Karte?')),
        h('div', { class: 'spacer' })),
      h('div', { class: 'screen-scroll', style: { position: 'relative', zIndex: 2 } },
        h('div', { class: 'karten-raster pergament auf-pergament' }, knoepfe))));
  }

  /* =========================================================
     LIEFERUNG & ZWERGENPASS
     ========================================================= */
  function zeigeLieferung() {
    if (!stand.karte) {
      waehleKarte(null, (n) => { stand.id = n; speichern(); zeigeLieferung(); }, () => zeigeHalle());
      return;
    }
    const code = stand.code();
    const schein = stand.lieferCode();
    const z = aktuellerZwerg();
    const material = stand.coreCount(stand.offen);
    zeige(h('div', { class: 'screen' },
      ZI.hintergrund('stollen-hintergrund', 'hg-ersatz-stollen', 'rgba(20,12,8,0.45)'),
      h('div', { class: 'leiste' },
        h('button', { class: 'rund', 'aria-label': 'Zurück zur Halle', onclick: () => zeigeHalle() }, icon.zurueck()),
        h('div', null, h('div', { class: 'titel' }, 'Lieferung & Zwergenpass'), h('div', { class: 'untertitel' }, z.name)),
        h('div', { class: 'spacer' })),
      h('div', { class: 'screen-scroll', style: { position: 'relative', zIndex: 2, display: 'flex' } },
        h('div', { class: 'lieferung' },
          h('div', { class: 'pergament lieferschein auf-pergament' },
            h('div', { class: 'lieferschein-kopf' },
              h('div', { class: 'lieferschein-bild' }, bild(z.datei, z.name)),
              h('div', null,
                h('h2', { style: { fontSize: '30px', margin: 0 } }, 'Lieferschein'),
                h('div', { class: 'klein' }, 'Kapitel ' + (stand.offen + 1) + ' · ' + material + ' Material' + (stand.extra(stand.offen) ? ' · ' + stand.extra(stand.offen) + '× tiefer' : '')))),
            h('div', { class: 'schein-zeile' },
              h('div', { class: 'schein-karte' }, h('span', null, 'Karte'), h('b', null, String(stand.karte))),
              h('div', { class: 'schein-code', 'aria-label': 'Lieferschein: ' + schein.split('').join(' ') },
                ...schein.split('').map((c) => h('span', null, c)))),
            h('p', { class: 'schein-text' }, 'Sag deiner Lehrkraft: „Karte ' + stand.karte + ': ' + schein.split('').join(' ') + '“ – oder tipp es selbst an der Insel ein.'),
            h('button', { class: 'knopf-link', onclick: () => waehleKarte(stand.karte, (n) => { stand.id = n; speichern(); zeigeLieferung(); }, () => zeigeLieferung()) }, 'Falsche Kartennummer?')),
          h('div', { class: 'pergament pass-karte auf-pergament' },
            h('h2', { style: { fontSize: '26px' } }, 'Dein Zwergenpass'),
            h('div', { class: 'pass-code', 'aria-label': 'Code: ' + code.split('').join(' ') }, code),
            h('ol', { class: 'schritte' },
              h('li', null, 'Schreib den Code genau ab – auf deine Karte mit der Nummer ' + stand.karte + '.'),
              h('li', null, 'Nächste Stunde tippst du ihn ein und spielst weiter.')),
            h('div', { class: 'knopf-reihe' },
              h('button', { class: 'knopf holz', onclick: () => zeigeHalle() }, 'Weiterschmieden'),
              h('button', { class: 'knopf', onclick: () => bestaetigen('Hast du deinen Code aufgeschrieben?', 'Ja, abmelden', abmelden) }, 'Fertig für heute')))))));
  }

  /* ---------- Los ---------- */
  if (location.hash === '#lehrkraft') {
    history.replaceState(null, '', location.pathname);
    if (sitzungLehrkraft()) zeigeLehrkraft(); else zeigeStart();
  } else zeigeStart();

  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
    ZI.vorladen(false);
  }
})();
