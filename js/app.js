/* Originale Zwergeninsel-Screens und Inszenierung mit Grammatiklogik. */
(function () {
  const Z = window.ZI, { h, bild, icon } = Z, app = document.getElementById('app');
  const KEY = 'zi-grammatik-aktiv';
  let stand = null, K = 0, test = Z.sitzung.lesen('zi-test', false), runde = null;
  const btn = (label, action, extra = {}) => h('button', { class: 'knopf', type: 'button', onclick: () => action(), ...extra }, label);
  const text = (tag, value, attrs = {}) => h(tag, attrs, value);
  const save = () => { if (stand) Z.sitzung.schreiben(KEY, stand.code()); };
  const zwerg = () => Z.ZWERGE.find(z => z.nr === stand.zwerg);
  function zeige(screen) { Z.setze(app, screen); window.scrollTo(0, 0); }
  function avatar(n, huepfen = false) {
    const z = Z.ZWERGE.find(z => z.nr === n);
    return h('div', { class: 'avatar' + (huepfen ? ' huepfen' : '') }, bild(z.datei, z.name));
  }
  function zurueck(action, label = 'Zurück') { return btn(icon.zurueck(), action, { class: 'rund', 'aria-label': label }); }
  function shell(title, content, back = halle, bg = 'stollen-hintergrund', untertitel = '') {
    zeige(h('div', { class: 'screen' }, Z.hintergrund(bg, 'hg-ersatz-stollen', 'rgba(20,12,8,.35)'),
      h('div', { class: 'leiste' }, back ? zurueck(back) : null, h('div', null, text('h1', title, { class: 'titel' }), untertitel ? text('div', untertitel, { class: 'untertitel' }) : null)),
      h('div', { class: 'screen-scroll', style: { position: 'relative', zIndex: 2 } }, content)));
  }
  function hold(el, action) {
    let timer; const stop = () => clearTimeout(timer);
    el.addEventListener('pointerdown', () => { stop(); timer = setTimeout(action, 5000); });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(e => el.addEventListener(e, stop));
    el.addEventListener('contextmenu', e => e.preventDefault()); el.style.touchAction = 'none'; return el;
  }
  // Komposition und Kartenoptik des ursprünglichen Starts, ohne Formularrahmen.
  function start() {
    stand = null;
    const old = Z.Stand.ausCode(Z.sitzung.lesen(KEY, ''));
    const resume = old ? btn(h('div', null, text('div', 'Weiterspielen als ' + Z.ZWERGE.find(z => z.nr === old.zwerg).name), text('small', 'Nur, wenn das dein Zwerg ist!')), () => { stand = old; reise('schmiede', halle); }, { class: 'pergament weiter-karte' }) : null;
    if (resume) resume.prepend(avatar(old.zwerg));
    zeige(h('div', { class: 'screen' }, Z.hintergrund('titel-hintergrund', 'hg-ersatz-titel', 'rgba(20,12,8,.15)'),
      h('div', { class: 'vollbild-start' }, Z.vollbildKnopf()), h('div', { class: 'start-mitte' }, hold(text('div', 'Zwergeninsel', { class: 'logo' }), lehrer),
        text('div', 'Entdecke die Sprache – baut gemeinsam euer Dorf!', { class: 'logo-unter' }), resume,
        h('div', { class: 'start-knoepfe' }, btn('Neuer Zwerg', neu), btn('Ich habe einen Zwergenpass', passEingabe, { class: 'knopf holz' })))));
  }
  // Originale Kartennummern-Kacheln mit Bestätigung, jetzt vor der Figurenauswahl.
  function neu() {
    const knoepfe = Array.from({ length: 32 }, (_, i) => btn(String(i + 1), () => {
      const n = i + 1;
      const f = Z.fenster([bild('zwergenpass-karte', 'Deine Zwergenpass-Karte', 'nummer-pass'), text('div', String(n), { class: 'karten-nr-gross' }),
        text('h2', 'Steht die ' + n + ' auf deiner Karte?'), text('p', 'Nimm immer dieselbe Nummer. Dein Material findet damit den Weg zur Insel.'),
        h('div', { class: 'knopf-reihe' }, btn('Nein', () => f.schliessen(), { class: 'knopf holz' }), btn('Ja, das ist meine Nummer', () => { f.schliessen(); zwergenWahl(n); }))]);
    }, { class: 'karten-nr', 'aria-label': 'Karte ' + (i + 1) }));
    shell('Deine Kartennummer', h('div', { class: 'karten-raster pergament auf-pergament' }, knoepfe), start, 'stollen-hintergrund', 'Welche Nummer steht oben auf deiner Zwergenpass-Karte?');
  }
  // Raster, Bildgrößen, Silhouetten und aktive Auswahl aus zeigeWahl der alten App.
  function zwergenWahl(karte = null) {
    const probe = karte ? new Z.Stand({ id: karte }) : stand;
    let gewaehlt = karte ? null : stand.zwerg;
    const weiter = btn(karte ? 'Diesen Zwerg nehmen' : 'Fertig', () => {
      if (!gewaehlt) return;
      if (karte) { stand = new Z.Stand({ id: karte, zwerg: gewaehlt }); save(); story(); }
      else { stand.zwerg = gewaehlt; save(); halle(); }
    }, { disabled: !gewaehlt });
    const cards = Z.ZWERGE.map(z => {
      const frei = probe.zwergFrei(z.nr);
      const card = btn(h('div', { class: 'bild' }, bild(z.datei, z.name)), () => {
        if (!frei) { Z.meldung(z.bedingung); return; }
        gewaehlt = z.nr;
        cards.forEach(c => { c.classList.remove('gewaehlt'); c.setAttribute('aria-pressed', 'false'); });
        card.classList.add('gewaehlt'); card.setAttribute('aria-pressed', 'true'); weiter.disabled = false;
      }, { class: 'zwerg-karte pergament auf-pergament' + (!frei ? ' gesperrt' : '') + (gewaehlt === z.nr ? ' gewaehlt' : ''), 'aria-label': z.name + (frei ? ', ' + z.rolle : ', gesperrt. ' + z.bedingung), 'aria-pressed': String(gewaehlt === z.nr) });
      Z.anhaengen(card, text('div', frei ? z.name : '???', { class: 'name' }), text('div', frei ? z.rolle : z.bedingung, { class: frei ? 'rolle' : 'bedingung' }));
      if (!frei) Z.anhaengen(card, h('div', { class: 'schloss' }, icon.schloss())); return card;
    });
    zeige(h('div', { class: 'screen' }, Z.hintergrund('stollen-hintergrund', 'hg-ersatz-stollen', 'rgba(20,12,8,.45)'),
      h('div', { class: 'leiste' }, zurueck(karte ? neu : halle), h('div', null, text('h1', karte ? 'Wähle deinen Zwerg' : 'Deine Zwergen-Sammlung', { class: 'titel' }), text('div', 'Vier Zwerge warten auf dich. Acht weitere kehren nach und nach zurück.', { class: 'untertitel' })), h('div', { class: 'spacer' }), weiter),
      h('div', { class: 'screen-scroll', style: { position: 'relative', zIndex: 2 } }, h('div', { class: 'zwerg-raster' }, cards))));
  }
  function story() {
    const schritte = [
      ['Willkommen auf der Insel!', 'Ich bin Meisterin Hammerlind. Schön, dass du da bist!', 'meisterin-erklaert', 'insel-start'],
      ['Unser Dorf braucht uns.', 'Viele Gebäude sind noch zerstört. Gemeinsam bauen wir sie wieder auf.', 'meisterin-ermutigt', 'werkstatt-ruine'],
      ['Auf in die Stollen!', 'Dort entdecken wir Wörter und Sätze. Für gemeisterte Grundstollen bekommen wir Baumaterial.', 'meisterin-erklaert', 'stollen-tiefer'],
      ['Jeder Fund hilft.', 'Mit unserem Material wachsen neue Häuser. Bald kehren auch die anderen Zwerge zurück!', 'meisterin-jubelt', 'werkstatt'],
    ];
    let n = 0;
    function zeichne() {
      const [title, line, pose, asset] = schritte[n];
      const dots = h('div', { class: 'fortschritt' }, schritte.map((_, i) => h('span', { class: i < n ? 'voll' : i === n ? 'jetzt' : '' })));
      zeige(h('div', { class: 'screen' }, Z.hintergrund('titel-hintergrund', 'hg-ersatz-titel', 'rgba(20,12,8,.25)'),
        h('div', { class: 'story-mitte' }, h('div', { class: 'pergament auf-pergament story-karte' },
          h('div', { class: 'story-vorschau' }, asset==='insel-start'?Z.inselSzene({vorschau:true}).el:bild(asset, '')), h('div', { class: 'begleiter' }, h('div', { class: 'begleiter-bild story-meisterin' }, bild(pose, 'Meisterin Hammerlind')), h('div', { class: 'begleiter-blase pergament auf-pergament' }, text('h2', title), text('p', line))),
          h('div', { class: 'knopf-reihe' }, dots, btn(n < schritte.length - 1 ? 'Weiter' : 'Los geht’s!', () => { if (++n < schritte.length) zeichne(); else reise('schmiede', halle); }))))));
    }
    zeichne();
  }
  function passEingabe() {
    const field = h('input', { class: 'eingabe', 'aria-label': 'Zwergenpass-Code', autocapitalize: 'characters', autocorrect: 'off', autocomplete: 'off', spellcheck: 'false', placeholder: 'G2-XXXXXX-XXXXXX-XXXXXX' });
    const info = text('div', '', { class: 'rueckmeldung tipp', hidden: true, role: 'status' });
    const pruefen = () => {
      const s = Z.Stand.ausCode(field.value);
      if (!s?.id) { info.hidden = false; info.textContent = 'Prüfe den Code auf deiner Passkarte noch einmal. G1- und G2-Pässe funktionieren.'; return; }
      stand = s; save(); const z = zwerg();
      const f = Z.fenster([h('div', { class: 'gross-bild' }, bild(z.datei, z.name)), text('h2', 'Willkommen zurück, ' + z.name + '!'), text('p', 'Dein Fortschritt ist wieder da.'), btn('Zur Schmiede', () => { f.schliessen(); reise('schmiede', halle); })]);
    };
    field.addEventListener('keydown', e => { if (e.key === 'Enter') pruefen(); });
    shell('Zwergenpass eingeben', h('div', { class: 'pass-mitte' }, h('div', { class: 'pergament pass-karte auf-pergament' },
      h('div', { class: 'pass-hinweis' }, h('div', { class: 'pass-bild' }, bild('zwergenpass-karte', 'Zwergenpass')), text('p', 'Mit deinem Pass kehrt dein Zwerg zurück. Tippe den Code von deiner Karte ein.')),
      field, info, btn('Zwerg zurückholen', pruefen))), start);
  }
  function pass(erneut = false) {
    const offene = stand.offeneLieferungen(), z = zwerg();
    const karte = h('div', { class: 'pergament auf-pergament lieferschein' }, h('div', { class: 'lieferschein-kopf' }, h('div', { class: 'lieferschein-bild' }, bild(z.datei, z.name)), text('h2', 'Deine Lieferung')));
    if (offene.length || erneut) {
      const code = stand.lieferCode();
      Z.anhaengen(karte, text('p', 'Alle deine neuen Funde reisen mit diesen vier Zeichen zur Insel.', { class: 'schein-text' }),
        h('div', { class: 'schein-zeile' }, h('div', { class: 'schein-karte' }, text('span', 'Karte'), text('b', stand.id)), h('div', { class: 'schein-code', 'aria-label': 'Lieferschein ' + code, 'data-liefercode': code }, ...[...code].map(c => text('span', c)))),
        text('p', 'Nenne den Code am Insel-Board.', { class: 'schein-text' }),
        offene.length ? h('details', null, text('summary', 'Deine neuen Funde'), ...offene.map(x => text('p', Z.STOLLEN[x.i].name + ' · Tiefe ' + x.tiefe))) : null,
        btn('Auf der Insel angekommen', () => { stand.lieferungBestaetigen(); save(); pass(); }), text('small', 'Erst antippen, wenn das Board deine Lieferung bestätigt hat.'));
    } else Z.anhaengen(karte, h('div', { class: 'gross-bild' }, bild('truhe-offen', '')), text('p', stand.coreTotal() ? 'Alles abgegeben! Neue Funde ergeben einen neuen Lieferschein.' : 'In den Stollen wartet das erste Baumaterial auf dich.'), stand.coreTotal() ? btn('Lieferschein erneut zeigen', () => pass(true), { class: 'knopf holz' }) : null);
    Z.anhaengen(karte, btn('Persönlichen Zwergenpass ansehen', langpass, { class: 'knopf holz' }), btn('Fertig für heute', langpass));
    shell('Lieferung & Zwergenpass', h('div', { class: 'pass-mitte' }, karte));
  }
  function langpass() {
    shell('Dein persönlicher Zwergenpass', h('div', { class: 'pass-mitte' }, h('div', { class: 'pergament auf-pergament pass-karte' }, h('div', { class: 'pass-hinweis' }, h('div', { class: 'pass-bild' }, bild('zwergenpass-karte', 'Zwergenpass')), text('p', 'Schreibe diesen Pass auf deine Karte. Damit spielst du beim nächsten Mal weiter.')),
      text('strong', stand.code(), { class: 'pass-code langpass-code' }), text('p', 'Für die Lieferung braucht das Insel-Board nur deinen vierstelligen Lieferschein.'),
      btn('Pass notiert – fertig für heute', () => { Z.sitzung.loeschen(KEY); Z.sitzung.loeschen('zi-aufgaben'); Z.sitzung.loeschen('zi-test'); test = false; stand = null; shell('Bis bald!', h('div', { class: 'pass-mitte' }, h('div', { class: 'pergament auf-pergament pass-karte' }, bild('meisterin-jubelt', '', 'abschied-meisterin'), text('p', 'Dein Zwerg wartet im Pass. Schließe jetzt den Tab.'), btn('Zum Start', start))), null); }), btn('Zurück zur Lieferung', pass, { class: 'knopf holz' }))), pass);
  }
  function zaehler(datei, name, wert) { return h('div', { class: 'zaehler', 'aria-label': name + ': ' + wert }, bild(datei, name), String(wert)); }
  // Originale Halle mit Begleiter, Rangbalken, Rohstoffen, Reitern und Stationskarten.
  function halle() {
    runde = null; save(); const z = zwerg(), rang = Z.rang(stand);
    const inhalt = h('div', { class: 'halle-inhalt' });
    const reiter = h('div', { class: 'reiter', role: 'tablist' }, ...Z.KAPITEL.map((name, k) => btn('Kapitel ' + (k + 1) + ' · ' + name, () => { K = k; halle(); }, { class: K === k ? 'aktiv' : '', role: 'tab', 'aria-selected': String(K === k) })));
    const stations = Z.STOLLEN.filter(s => s.kapitel === K).map(s => {
      const n = stand.t[s.index], frei = test || Z.stollenFrei(stand, s.index);
      const sperre = s.index === 10 && !stand.t[9] ? 'Schaffe zuerst Satzbau und Satzarten.' : 'Öffnet mit: ' + Z.GEBAEUDE.find(g => g.id === s.gebaeude).name;
      const card = btn(h('div', { class: 'icon' }, bild(s.icon, s.name)), () => {
        if (!frei) { Z.meldung(sperre); return; }
        if (n || test) eingang(s.index); else vorRunde(s.index, 1);
      }, { class: 'station' + (n ? ' geschafft' : '') + (!frei ? ' gesperrt' : '') + (n === 5 ? ' gekroent' : ''), 'data-stollen': s.index, 'aria-disabled': String(!frei), 'aria-label': s.name });
      Z.anhaengen(card, h('div', { class: 'st-text' }, text('div', s.name, { class: 'st-name' }), text('div', frei ? Z.LERNZIELE[s.id][0] : sperre, { class: 'st-info' }), frei ? text('div', n ? 'Grundstufe geschafft · freiwillig tiefer graben' : 'Bringt: ' + s.rohstoff.name, { class: 'st-info' }) : null, n ? Z.tiefenLeiste(n, true) : null));
      if (n) Z.anhaengen(card, h('div', { class: 'haken' }, icon.haken()));
      if (!frei) Z.anhaengen(card, h('div', { class: 'schloss' }, icon.schloss()));
      if (n === 5) Z.anhaengen(card, h('div', { class: 'krone-marke' }, bild('tiefe-krone', 'Stollenkrone')));
      return card;
    });
    Z.anhaengen(inhalt, h('div', { class: 'begleiter' }, h('div', { class: 'begleiter-bild' }, bild(z.datei, z.name)), h('div', { class: 'begleiter-blase pergament auf-pergament' }, stand.coreTotal() ? 'Unser Dorf wächst! Du kannst einen neuen Stollen entdecken oder freiwillig tiefer graben.' : 'Unser Dorf braucht Baumaterial. Welchen Stollen möchtest du entdecken?')),
      h('div', { class: 'welt-wege' }, btn('Mein Fortschritt', fortschritt, { class: 'knopf holz mit-bild' }), btn('Inselbotschaft', botschaft, { class: 'knopf holz' }), Z.hatGebaeude(stand, 'ratsplatz') ? btn('Zum Dorfplatz', dorfplatz, { class: 'knopf holz' }) : null),
      test ? text('p', 'Testmodus · Alle Stollen offen. Testleistungen bleiben außerhalb deines Passes.', { class: 'g-test' }) : null, reiter,
      h('section', { class: 'pergament stollen auf-pergament' }, text('h2', Z.KAPITEL[K]), text('p', 'Entdecke einen Stollen. Nach der Grundstufe darfst du hier freiwillig weitergraben.', { class: 'erklaer' }), h('div', { class: 'stationen stollen-wahl' }, stations)));
    const counts = Z.ROHSTOFF.map((r, i) => zaehler(r.datei, r.name, stand.t.filter((t, index) => t && index % 3 === i).length));
    zeige(h('div', { class: 'screen' }, Z.hintergrund('stollen-hintergrund', 'hg-ersatz-stollen', 'rgba(20,12,8,.35)'),
      h('div', { class: 'leiste halle-leiste' }, btn(avatar(stand.zwerg, true), () => zwergenWahl(), { class: 'rund avatar-knopf', 'aria-label': 'Zwergen-Sammlung öffnen' }),
        h('button', { class: 'rang-box rang-knopf', type:'button', onclick:ranguebersicht, 'aria-label':'Dein Rang: '+rang.name+' · Details öffnen' }, text('div', z.name, { class: 'titel' }), text('div', rang.name, { class: 'untertitel' }), h('div', { class: 'rang-balken', 'aria-label': 'Rangfortschritt' }, h('div', { style: { width: (rang.next ? (rang.punkte - rang.ab) / (rang.next.ab - rang.ab) * 100 : 100) + '%' } }))),
        h('div', { class: 'spacer' }), h('div', { class: 'rohstoff-reihe' }, counts, zaehler('edelstein', 'Edelsteine', stand.gems())),
        btn(icon.buch(), buch, { class: 'rund', disabled: !Z.hatGebaeude(stand, 'bibliothek'), 'aria-label': 'Buch der Sprachzwerge öffnen' }), btn(icon.album(), sammlung, { class: 'rund', 'aria-label': 'Abzeichen-Album öffnen' }), Z.vollbildKnopf(), btn('Lieferung', pass)),
      h('div', { class: 'screen-scroll', style: { position: 'relative', zIndex: 2 } }, inhalt)));
  }
  // Rangkopf und Leiter aus dem ursprünglichen Album, jetzt direkt antippbar.
  function ranguebersicht(){
    const r=Z.rang(stand),fortschritt=r.next?Math.max(0,r.punkte-r.ab):1,max=r.next?r.next.ab-r.ab:1;
    const f=Z.fenster([h('div',{class:'rang-kopf'},bild('rang-'+(r.index+1),r.name,'rang-emblem'),text('h2','Dein Rang: '+r.name)),
      text('p',r.next?'Noch '+Z.menge(r.next.ab-r.punkte,'Rangpunkt','Rangpunkte')+' bis „'+r.next.name+'“.':'Du hast den höchsten Rang erreicht!'),
      h('progress',{class:'rang-fortschritt',value:fortschritt,max,'aria-label':'Fortschritt im Rang '+r.name}),
      text('p',Z.menge(r.punkte,'Rangpunkt','Rangpunkte')+' gesammelt. Jede erstmals geschaffte Tiefe zählt 1 Punkt, jede Stollenkrone einen zusätzlichen Punkt. Wiederholungen zählen nicht erneut.',{class:'g-small'}),
      h('div',{class:'rang-leiter'},...Z.RAENGE.map(stufe=>h('div',{class:'stufe'+(stufe.index<=r.index?' erreicht':'')+(stufe.index===r.index?' jetzt':''),'aria-current':stufe.index===r.index?'step':null},h('span',{class:'stufe-punkte'},stufe.ab),h('span',null,stufe.name)))),
      btn('Schließen',()=>f.schliessen())]);
  }
  function fortschritt(){
    const freiwillig=stand.t.reduce((n,t)=>n+Math.max(0,t-1),0);
    shell('Mein Fortschritt',h('div',{class:'halle-inhalt'},
      h('section',{class:'pergament auf-pergament stollen'},text('h2','Dein Zwerg lernt dazu!'),text('p','Hier siehst du deinen Lernstand. Unser Dorf bauen wir gemeinsam auf der Klasseninsel.'),
        text('p',stand.coreTotal()+' von '+Z.STOLLEN.length+' Grundstollen · '+Z.menge(freiwillig,'freiwillige Tiefe','freiwillige Tiefen')),
        text('p',Z.materialMenge(stand.coreTotal())+' gefunden · '+Z.menge(stand.gems(),'Edelstein','Edelsteine')+' · '+Z.menge(stand.kronenTotal(),'Krone','Kronen')),
        h('div',{class:'knopf-reihe'},btn('Dein Rang: '+Z.rang(stand).name,ranguebersicht,{class:'knopf holz'}),btn('Persönlichen Zwergenpass ansehen',langpass,{class:'knopf holz'}),btn('Deine Schätze',sammlung,{class:'knopf holz'}))),
      h('section',{class:'pergament auf-pergament stollen'},text('h2','Deine Stollen'),...Z.STOLLEN.map(st=>h('div',{class:'g-fortschritt-stollen','data-progress-stollen':st.id},h('b',null,st.name),Z.tiefenLeiste(stand.t[st.index],true),text('small',stand.t[st.index]?'Tiefste erreichte Tiefe: '+stand.t[st.index]:Z.stollenFrei(stand,st.index)?'Bereit zum Entdecken':'Noch gesperrt'))))));
  }
  function eingang(i) {
    const s = Z.STOLLEN[i], n = stand.t[i], next = Math.min(5, n + 1);
    const f = Z.fenster([text('h2', s.name), Z.tiefenLeiste(n), text('p', n === 5 ? 'Du hast diesen Stollen bis ganz unten erkundet!' : 'Hier kannst du weitergraben oder eine bekannte Tiefe üben.'),
      h('div', { class: 'stufen-wahl' }, btn('Grundstufe üben', () => enter(1), { class: 'knopf holz', 'data-depth': 1 }), n < 5 ? btn(h('span', null, 'Noch tiefer graben', text('small', 'Tiefe ' + next + ' · ' + Z.LERNZIELE[s.id][next - 1], { class: 'knopf-unter' })), () => enter(next), { class: 'knopf mit-bild', 'data-depth': next }) : null),
      h('details', { class: 'tiefen-ueben' }, text('summary', test ? 'Alle Tiefen testen' : 'Andere erreichte Tiefen üben'), h('div', { class: 'tiefen-leiste' }, ...Array.from({ length: 5 }, (_, j) => btn(Z.tiefeMedaille(j + 1, j < n), () => enter(j + 1), { class: 'tiefe-knopf', disabled: !test && j + 1 > n, 'data-depth': j + 1, 'aria-label': 'Tiefe ' + (j + 1) + ' üben' })))),
      btn('Zurück zum Eingang', () => f.schliessen(), { class: 'knopf-link' })]);
    function enter(d) { f.schliessen(); vorRunde(i, d); }
  }
  // Sechs kleine Vormachschritte im ursprünglichen Meisterinnenfenster.
  function vorRunde(i, tiefe) {
    const s = Z.STOLLEN[i], q = Z.ziehen(Z.POOLS[s.id][tiefe].filter(q => q.band === 'sicherung'), 1, 'demo-' + s.id + '-' + tiefe)[0]; let phase = 0;
    const beispiel = h('div'), blase = h('div', { class: 'vormach-blase', role: 'status', 'aria-live': 'polite' });
    const dots = h('div', { class: 'fortschritt tutorial-punkte' });
    const shortRule = q.explanation.split('. ')[0] + (q.explanation.split('. ')[0].endsWith('.') ? '' : '.');
    const lines = ['Ich mache dir ein Beispiel vor.', 'Schau einmal genau hin. Was wird gesucht?', 'Achte auf die hervorgehobene Stelle.', q.type === 'choice' ? 'Prüfe die Antwort an der Regel: ' + shortRule : q.hints[1], 'So sieht eine passende Lösung aus. Schau dir alle Teile an.', 'Merke dir: ' + shortRule];
    const weiter = btn('Weiter', () => { if (++phase < lines.length) draw(); else { f.schliessen(); reise('stollen', () => begin(i, tiefe, q.id), 'Abstieg in Tiefe ' + tiefe + ' · ' + s.name); } });
    const f = Z.fenster([h('div', { class: 'vormach-kopf' }, h('div', { class: 'vormach-bild' }, bild('meisterin-erklaert', 'Meisterin Hammerlind')), h('div', null, text('small', 'Meisterin Hammerlind macht es vor'), text('h2', Z.LERNZIELE[s.id][tiefe - 1]))),
      text('div', q.prompt, { class: 'meinung' }), beispiel, h('div', { class: 'vormach-sagt' }, blase), h('div', { class: 'knopf-reihe' }, dots, weiter),
      h('details', { class: 'runden-info' }, text('summary', 'Über diese Runde'), text('small', `9 Aufgaben · ungefähr 7–10 Minuten. ${tiefe === 5 ? 8 : 7} richtige erste Antworten zum Bestehen. ${tiefe === 1 ? 'Beim ersten Bestehen erhältst du Baumaterial.' : 'Diese Tiefe ist freiwillig.'}`))]);
    f.el.classList.add('vormach');
    function draw() { Z.setze(beispiel, Z.demoDarstellung(q, phase)); blase.textContent = lines[phase]; weiter.textContent = phase === 5 ? 'Jetzt bist du dran!' : 'Weiter'; Z.setze(dots, ...lines.map((_, n) => h('span', { class: n < phase ? 'voll' : n === phase ? 'jetzt' : '' }))); }
    draw();
  }
  // Vorhandene Ortswechsel einschließlich Schmiede und Abstieg, ohne Ton.
  function reise(art, danach, label = 'Auf in die Schmiede!') {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) { danach(); return; }
    const z = zwerg();
    const ov = h('div', { class: 'uebergang ue-' + art, role: 'status', 'aria-live': 'polite' }, h('div', { class: 'ue-hg' }, bild(['transition-' + art, 'stollen-hintergrund'], '')), h('div', { class: 'ue-dunkel' }),
      art === 'schmiede' ? h('div', { class: 'ue-funken' }, ...Array.from({ length: 14 }, (_, i) => h('span', { style: { left: (8 + i * 6.5) + '%', animationDelay: (i % 5) * .15 + 's' } }))) : null,
      h('div', { class: 'ue-figuren' }, h('div', { class: 'ue-zwerg ue-eigen' }, bild(z.datei, z.name))), text('div', label, { class: 'ue-text' }));
    document.body.append(ov); setTimeout(() => { danach(); ov.classList.add('aus'); setTimeout(() => ov.remove(), 400); }, 1800);
  }
  function begin(i, tiefe, beispielId = null) {
    if (!test && (!Z.stollenFrei(stand, i) || tiefe > stand.t[i] + 1)) return halle();
    const s = Z.STOLLEN[i], quelle = Z.POOLS[s.id][tiefe], demo = quelle.find(q => q.id === beispielId), pool = quelle.filter(q => q.id !== beispielId && (!demo || q.family !== demo.family));
    runde = { i, tiefe, pool: Z.rundeZiehen(pool, s.id + '-' + tiefe), n: 0, richtig: 0, kombo: 0, review: [], misch: false };
    frage();
  }
  function frage() {
    const r = runde; if (r.n >= r.pool.length) return ergebnis();
    const q = r.pool[r.n], engine = Z.aufgabeAnsicht(q), bue = Z.weltBuehne('eisen-roh');
    let versuche = 0, hilfe = 0, erledigt = false, weitergedrueckt = false, loesungGesehen = false;
    const feedback = text('div', '', { class: 'rueckmeldung', role: 'status', 'aria-live': 'polite', hidden: true });
    const weiter = btn('Nächste Aufgabe', () => {
      if (!erledigt || weitergedrueckt) return;
      weitergedrueckt = true; r.n++; frage();
    }, { hidden: true });
    function zeigeHilfe() {
      if (hilfe >= 4) { loesungGesehen = true; bue.sage('So geht es: ' + Z.loesung(q) + '. Setze die Lösung jetzt selbst um.', 'tipp'); }
      else bue.sage(q.hints[hilfe - 1], 'tipp');
    }
    const help = btn(h('span', null, icon.laterne(), 'Hilfe'), () => { hilfe = Math.min(4, hilfe + 1); zeigeHilfe(); }, { class: 'knopf holz mit-bild' });
    const pruefen = btn('Prüfen', () => {
      if (erledigt) return;
      const a = engine.read(), ok = Z.ENGINES[q.type].check(q, a);
      if (versuche === 0) { if (ok && !loesungGesehen) { r.richtig++; r.kombo++; } else { r.kombo = 0; r.review.push(q); } }
      versuche++; feedback.hidden = false;
      if (ok) {
        erledigt = true; engine.disable(); pruefen.disabled = true; help.disabled = true;
        feedback.className = 'rueckmeldung gut'; feedback.textContent = versuche === 1 && !loesungGesehen ? 'Gut geschmiedet!' : 'Jetzt passt es. Gut weitergearbeitet!';
        bue.sage(q.explanation, 'jubelt'); bue.schlag(); weiter.hidden = false;
      } else {
        feedback.className = 'rueckmeldung schlecht'; feedback.textContent = Z.rueckmeldung(q, a);
        hilfe = Math.max(hilfe, Math.min(versuche, 4)); zeigeHilfe();
      }
      kombo.hidden = r.kombo < 3; Z.setze(kombo, bild('flamme', '', 'kombo-flamme'), text('span', 'Kombo ×' + r.kombo));
    });
    const pips = h('div', { class: 'fortschritt', 'aria-label': 'Aufgabe ' + (r.n + 1) + ' von 9' }, ...r.pool.map((_, i) => h('span', { class: i < r.n ? 'voll' : i === r.n ? 'jetzt' : '' })));
    const kombo = h('div', { class: 'kombo', hidden: r.kombo < 3, 'aria-live': 'polite' });
    bue.sage('Nimm dir Zeit. Du kannst dir mit der Laterne helfen lassen.');
    const card = h('article', { class: 'pergament auf-pergament aufgabe', 'data-question': q.id }, text('div', r.misch ? 'Am Dorfplatz' : 'Tiefe ' + r.tiefe + ' · ' + Z.LERNZIELE[Z.STOLLEN[r.i].id][r.tiefe - 1], { class: 'frage' }), text('h2', q.prompt, { class: 'meinung' }), engine.el, feedback, h('div', { class: 'knopf-reihe aufgaben-aktionen' }, pruefen, help, weiter));
    zeige(h('div', { class: 'screen' }, Z.hintergrund('schmiede-hintergrund', 'hg-ersatz-schmiede', 'rgba(20,12,8,.2)'), h('div', { class: 'glut-flackern', 'aria-hidden': 'true' }),
      h('div', { class: 'leiste' }, zurueck(() => { const f = Z.fenster([text('h2', 'Stollen verlassen?'), text('p', 'Du kannst diese Runde später neu beginnen.'), h('div', { class: 'knopf-reihe' }, btn('Weitergraben', () => f.schliessen()), btn('Zur Schmiede', () => { f.schliessen(); halle(); }, { class: 'knopf holz' }))]); }), h('div', null, text('h1', r.misch ? 'Dorfplatz' : Z.STOLLEN[r.i].name, { class: 'titel' }), pips), h('div', { class: 'spacer' }), kombo, !r.misch ? Z.tiefeMedaille(r.tiefe, true) : null, Z.vollbildKnopf()),
      h('div', { class: 'spiel' }, card, bue.el)));
  }
  function ergebnis() {
    const r = runde; if (r.gewertet) return; r.gewertet = true;
    const bestanden = r.richtig >= (r.tiefe === 5 ? Z.REGELN.meister : Z.REGELN.bestehen), vorher = new Z.Stand(stand);
    const neu = bestanden && !test && !r.misch && stand.abschliessen(r.i, r.tiefe); save();
    const z = zwerg(), s = Z.STOLLEN[r.i];
    let titel = bestanden ? 'Gut geübt!' : 'Du bist auf dem richtigen Weg!', message = bestanden ? 'Jeder Versuch macht dich sicherer.' : 'Du hast die Aufgaben mit Hilfe gelöst. Beim nächsten Mal gelingt dir noch mehr allein.';
    let asset = bestanden ? 'meisterin-jubelt' : 'meisterin-ermutigt';
    if (neu) { titel = r.tiefe === 1 ? 'Stollen gemeistert!' : r.tiefe === 5 ? 'Die Stollenkrone gehört dir!' : 'Du hast Tiefe ' + r.tiefe + ' erreicht!'; asset = r.tiefe === 1 ? s.rohstoff.datei : r.tiefe === 5 ? 'tiefe-krone' : 'edelstein'; message = r.tiefe === 1 ? '+' + Z.materialMenge(1) + ' (' + s.rohstoff.name + ') für den Wiederaufbau!' : r.tiefe === 5 ? 'Ganz unten angekommen. Stark!' : '+' + Z.menge(Z.REGELN.edelsteine,'Edelstein','Edelsteine') + ' für deine Sammlung!'; }
    if (test) message = 'Proberunde im Testmodus. Dein Pass bleibt unverändert.';
    if (bestanden) Z.konfetti();
    const queue = neu ? belohnungen(vorher, stand) : [];
    let weiterGeklickt = false;
    const done = action => { if (weiterGeklickt) return; weiterGeklickt = true; f.schliessen(); feiere(queue, action); };
    const f = Z.fenster([h('div', { class: 'geschafft-reihe' }, h('div', { class: 'gross-bild' + (neu ? ' strahlen' : '') }, bild(asset, neu ? 'Erhaltene Belohnung' : '')), h('div', { class: 'huepf-zwerg' }, bild([z.datei + '-jubel', z.datei], z.name))),
      text('h2', titel), text('p', message, { class: 'belohnung-text' }), !r.misch && bestanden ? Z.tiefenLeiste(stand.t[r.i]) : null,
      neu && r.tiefe > 1 && r.tiefe < 5 ? h('div', { class: 'belohnungs-funde' }, Z.tiefeMedaille(r.tiefe, true, 'gross'), bild('edelstein', '', 'fund-asset'), text('b', '+' + Z.REGELN.edelsteine)) : null,
      text('small', r.richtig + ' von 9 beim ersten Versuch gelöst.'),
      h('div', { class: 'fenster-fuss knopf-reihe' }, btn('Zurück zum Eingang', () => done(halle)), bestanden && !r.misch && (test || stand.t[r.i] < 5) ? btn('Noch tiefer graben', () => done(() => vorRunde(r.i, Math.min(5, stand.t[r.i] + 1))), { class: 'knopf holz' }) : btn('Noch eine Runde', () => done(() => r.misch ? misch(r.k) : vorRunde(r.i, r.tiefe)), { class: 'knopf holz' }))]);
    f.el.classList.add('geschafft-fenster');
  }
  function belohnungen(vor, nach) {
    const events = [], alteZwerge = vor.freieZwerge(), alteAbzeichen = Z.abzeichenFrei(vor).map(a => a.id);
    const gebaut = Z.BAU.filter(b => Z.hatGebaeude(nach, b.id) && !Z.hatGebaeude(vor, b.id));
    if (gebaut.length) events.push({ type: 'bau', items: gebaut });
    const stollen = Z.STOLLEN.filter(s => Z.stollenFrei(nach, s.index) && !Z.stollenFrei(vor, s.index));
    if (stollen.length) events.push({ type: 'stollen', items: stollen });
    for (const a of Z.abzeichenFrei(nach).filter(a => !alteAbzeichen.includes(a.id))) events.push({ type: 'abzeichen', item: a });
    for (const nr of nach.freieZwerge().filter(n => !alteZwerge.includes(n))) events.push({ type: 'zwerg', item: Z.ZWERGE.find(z => z.nr === nr) });
    if (Z.rang(nach).index > Z.rang(vor).index) events.push({ type: 'rang', item: Z.rang(nach) });
    for (let k = 0; k < 3; k++) if (nach.kapitelFertig(k) && !vor.kapitelFertig(k)) events.push({ type: 'kapitel', k });
    return events;
  }
  // Truhe, Glanz, Jubelpose und Fortschrittsfenster aus der ursprünglichen App.
  function feiere(events, danach) {
    if (!events.length) { danach(); return; }
    const e = events[0], parts = []; let mitnehmen = null;
    if (e.type === 'zwerg') {
      const z = e.item; parts.push(bild('truhe-offen', '', 'truhe-klein'), text('h2', 'Ein neuer Zwerg ist zurück!'), h('div', { class: 'gross-bild strahlen mit-glanz' }, h('div', { class: 'glanz', 'aria-hidden': 'true' }, bild('zwerg-freigeschaltet-glanz', '')), bild([z.datei + '-jubel', z.datei], z.name)), text('h3', z.name), text('p', '„Danke! Auf unserer Insel fühle ich mich wieder zu Hause.“', { class: 'begleiter-blase pergament auf-pergament' }));
      mitnehmen = btn(z.name + ' kommt mit', () => { stand.zwerg = z.nr; save(); next(); }, { class: 'knopf holz' });
    } else if (e.type === 'bau') {
      parts.push(text('h2', e.items.length === 1 ? 'Ein neues Gebäude ist bereit!' : 'Unser Dorf wächst!'), h('div', { class: 'neue-gebaeude' }, ...e.items.map(b => h('div', null, h('div', { class: 'bau-verwandlung' }, bild(b.ruinenAsset, '', 'vorher'), bild(b.fertigAsset, '', 'nachher')), text('h3', Z.GEBAEUDE.find(g => g.id === b.id).name), text('p', b.funktion)))));
    } else if (e.type === 'stollen') {
      parts.push(text('h2', 'Neue Stollen wurden entdeckt!'), ...e.items.map(s => h('div', { class: 'fund-zeile' }, bild(s.icon, '', 'fund-asset'), text('h3', s.name))));
    } else if (e.type === 'abzeichen') {
      parts.push(text('h2', 'Ein neues Abzeichen!'), h('div', { class: 'gross-bild strahlen' }, bild('abzeichen-' + e.item.id, e.item.name)), text('h3', e.item.name), text('p', e.item.text));
    } else if (e.type === 'rang') {
      parts.push(text('h2', 'Neuer Rang!'), h('div', { class: 'rang-neu' }, bild('rang-' + (e.item.index + 1), '', 'rang-emblem'), text('h2', e.item.name), h('div', { class: 'huepf-zwerg' }, bild([zwerg().datei + '-jubel', zwerg().datei], zwerg().name))));
    } else {
      parts.push(text('h2', e.k === 2 ? 'Die Insel feiert!' : 'Kapitel geschafft!'), h('div', { class: 'gross-bild strahlen' }, bild(e.k === 2 ? 'festhalle' : 'abzeichen-k' + (e.k + 1), '')), text('h3', Z.KAPITEL[e.k]), text('p', e.k === 2 ? 'Alle Grundstollen gemeistert. In der Festhalle wartet eure große Mischrunde!' : 'Ein weiterer Teil unserer Insel ist wieder lebendig.'));
      if (e.k === 2) Z.feuerwerk(3000);
    }
    Z.konfetti(70); let fertig = false;
    function next() { if (fertig) return; fertig = true; f.schliessen(); feiere(events.slice(1), danach); }
    const f = Z.fenster([...parts, h('div', { class: 'fenster-fuss knopf-reihe' }, mitnehmen, btn('Weiter', next))]); f.el.classList.add('freischaltung-fenster');
  }
  function buch() {
    if (!Z.hatGebaeude(stand, 'bibliothek')) return halle();
    shell('Buch der Sprachzwerge', h('div', { class: 'halle-inhalt' }, h('section', { class: 'pergament auf-pergament stollen seiten' }, ...Z.STOLLEN.map(s => h('article', { class: 'seite' }, h('div', { class: 'seite-kopf' }, icon.buch(), text('h3', s.name)), text('p', Z.WISSEN[s.id][0]), text('div', Z.WISSEN[s.id][1], { class: 'seite-beispiel' }))))));
  }
  function sammlung() {
    shell('Dein Abzeichen-Album', h('div', { class: 'halle-inhalt' }, h('section', { class: 'pergament auf-pergament stollen' }, text('h2', 'Deine Schätze'), h('div', { class: 'medaillen' }, ...Z.ABZEICHEN.map(a => {const frei=a.test(stand);return h('article', { class: 'medaille ' + (frei ? 'gold schatz-entdeckt' : 'gesperrt'), 'data-award':a.id,'aria-label':frei?a.name:'Unentdeckter Schatz' }, h('div', { class: 'medaille-rund '+(frei?'mit-bild':'medaille-symbol'), 'aria-hidden':!frei?'true':null }, frei?bild('abzeichen-' + a.id, a.name):icon.schloss()), text('div', frei?a.name:'???', { class: 'medaille-name' }), text('div', a.text, { class: 'medaille-text' }));}))), btn('Zur Zwergen-Sammlung', () => zwergenWahl())));
  }
  function botschaft() {
    const field = h('input', { class: 'eingabe runen-eingabe', maxlength: 6, placeholder: 'BOKAMI', 'aria-label': 'Inselbotschaft', autocomplete: 'off', autocorrect: 'off', autocapitalize: 'characters', spellcheck: 'false' });
    const feedback = text('p', '', { role: 'status' });
    const apply = () => { const welt = Z.botschaft.lese(field.value); if (welt === null) { feedback.textContent = 'Prüfe die sechs Buchstaben vom Insel-Board.'; return; } const vorher = new Z.Stand(stand); stand.welt = Math.max(stand.welt, welt); save(); f.schliessen(); feiere(belohnungen(vorher, stand), halle); };
    const f = Z.fenster([bild('runenplatte', '', 'runen-bild'), text('h2', 'Botschaft von der Insel'), text('p', 'Welche sechs Buchstaben stehen am Board?'), field, feedback, h('div', { class: 'knopf-reihe' }, btn('Runen lesen', apply), btn('Zurück', () => f.schliessen(), { class: 'knopf holz' }))]);
    field.addEventListener('keydown', e => { if (e.key === 'Enter') apply(); });
  }
  function dorfplatz() {
    if (!Z.hatGebaeude(stand, 'ratsplatz')) return halle();
    shell('Dorfplatz', h('div', { class: 'halle-inhalt' }, h('section', { class: 'pergament auf-pergament stollen' }, h('div', { class: 'begleiter' }, h('div', { class: 'begleiter-bild' }, bild('meisterin-erklaert', 'Meisterin Hammerlind')), h('div', { class: 'begleiter-blase pergament auf-pergament' }, 'Hier kommen die Funde aus deinen Stollen zusammen. Welches Kapitel möchtest du noch einmal erkunden?')), ...Z.KAPITEL.map((name, k) => btn(name + ' wiederholen', () => misch(k), { disabled: !stand.kapitelFertig(k) })), Z.hatGebaeude(stand, 'festhalle') ? btn('Inselfest: große Mischrunde', () => misch(null), { disabled: stand.coreTotal() < 11 }) : null)));
  }
  function misch(k) {
    const pool = Z.STOLLEN.filter(s => (k === null || s.kapitel === k) && stand.t[s.index] >= 1).flatMap(s => Z.POOLS[s.id][1]);
    runde = { i: 0, k, tiefe: 1, pool: Z.rundeZiehen(pool, 'misch-' + k), n: 0, richtig: 0, kombo: 0, review: [], misch: true }; frage();
  }
  function lehrer() {
    shell('Lehrkraftbereich', h('div', { class: 'lk-raster' },
      h('a', { class: 'lk-kachel pergament auf-pergament', href: 'insel.html' }, text('b', 'Zur Klasseninsel'), text('span', 'Lieferungen und Wiederaufbau')),
      h('a', { class: 'lk-kachel pergament auf-pergament', href: 'karten.html' }, text('b', 'Passkarten drucken'), text('span', 'Eine feste Karte pro Kind')),
      h('a', { class: 'lk-kachel pergament auf-pergament', href: 'lehrkraft.html' }, text('b', 'Lehrer-Spickzettel')),
      h('div', { class: 'lk-kachel pergament auf-pergament' }, btn(test ? 'Testmodus ausschalten' : 'Testmodus einschalten', () => { test = !test; Z.sitzung.schreiben('zi-test', test); lehrer(); }), text('p', 'Im Testmodus sind alle Tiefen offen. Testleistungen werden nicht gespeichert.'))), start, 'titel-hintergrund');
  }
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) { navigator.serviceWorker.register('sw.js').catch(() => {}); Z.vorladen(false); }
  const route = new URLSearchParams(location.search).get('ort'), saved = Z.Stand.ausCode(Z.sitzung.lesen(KEY, ''));
  if (route && saved) { stand = saved; ({ buch, dorfplatz, sammlung, halle, fortschritt }[route] || halle)(); } else start();
})();
