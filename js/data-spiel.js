/* Zwergeninsel – Ränge, Abzeichen und Inselrätsel */

(function () {
  const ZI = window.ZI;

  /* Zwerginnen bekommen weibliche Rangbezeichnungen */
  [2, 4, 5, 8, 10, 12].forEach((nr) => { const z = ZI.ZWERGE.find((d) => d.nr === nr); if (z) z.w = true; });

  /* =========================================================
     RÄNGE
     Punkte: jede geschaffte Station, jede erreichte Tiefe, jeder Bonusstern
     jede goldene Krone und jeder Gebäude-Stollen zählt 1 Punkt (höchstens 46).
     ========================================================= */
  ZI.RAENGE = [
    { ab: 0, m: 'Lehrling', w: 'Lehrling' },
    { ab: 3, m: 'Funkenschläger', w: 'Funkenschlägerin' },
    { ab: 7, m: 'Geselle', w: 'Gesellin' },
    { ab: 12, m: 'Erzkenner', w: 'Erzkennerin' },
    { ab: 18, m: 'Altgeselle', w: 'Altgesellin' },
    { ab: 25, m: 'Meisterschmied', w: 'Meisterschmiedin' },
    { ab: 32, m: 'Großmeister', w: 'Großmeisterin' },
  ];
  ZI.rangPunkte = (s) => s.coreTotal() + s.deepTotal() + s.bonusTotal() + s.kronenTotal() + (s.bauTotal ? s.bauTotal() : 0);
  ZI.rang = function (s) {
    const p = ZI.rangPunkte(s);
    let nr = 0;
    ZI.RAENGE.forEach((r, i) => { if (p >= r.ab) nr = i; });
    const z = ZI.ZWERGE.find((d) => d.nr === s.zwerg);
    const r = ZI.RAENGE[nr]; const naechster = ZI.RAENGE[nr + 1];
    return { nr, name: z && z.w ? r.w : r.m, punkte: p, ab: r.ab, naechsterAb: naechster ? naechster.ab : null,
      naechsterName: naechster ? (z && z.w ? naechster.w : naechster.m) : null };
  };

  /* =========================================================
     ABZEICHEN
     stufe: bronze | silber | gold · symbol: siehe ZI.abzeichenSymbol
     ========================================================= */
  ZI.ABZEICHEN = [
    { id: 'funke', name: 'Erster Funke', text: 'Die erste Station geschafft.', stufe: 'bronze', symbol: 'flamme',
      test: (s) => s.coreTotal() + s.deepTotal() >= 1 },
    { id: 'k1', name: 'Gestrandet', text: 'Alle drei Hauptstollen in Kapitel 1 geschafft.', stufe: 'bronze', symbol: 'hammer',
      test: (s) => s.coreCount(0) === 3 },
    { id: 'k2', name: 'Dorfbaumeister', nameW: 'Dorfbaumeisterin', text: 'Alle drei Hauptstollen in Kapitel 2 geschafft.', stufe: 'silber', symbol: 'hammer',
      test: (s) => s.coreCount(1) === 3 },
    { id: 'k3', name: 'Festredner', nameW: 'Festrednerin', text: 'Alle drei Hauptstollen in Kapitel 3 geschafft.', stufe: 'gold', symbol: 'hammer',
      test: (s) => s.coreCount(2) === 3 },
    { id: 'fehler', name: 'Fehlerjäger', nameW: 'Fehlerjägerin', text: 'Am Weil-Denn-Amboss bis Tiefe 3 gegraben (Fehlerjagd).', stufe: 'bronze', symbol: 'lupe',
      test: (s) => s.tiefe(0, 2) >= 3 },
    { id: 'kobold', name: 'Kobold-Bezwinger', nameW: 'Kobold-Bezwingerin', text: 'Im Argument-Puzzle bis Tiefe 5 gegraben und den Fehlerkobold besiegt.', stufe: 'silber', symbol: 'schild',
      test: (s) => s.tiefe(1, 0) >= 5 },
    { id: 'rede', name: 'Redemeister', nameW: 'Redemeisterin', text: 'Alle drei Gemeinschaftsstollen zu zweit gemeistert.', stufe: 'gold', symbol: 'sprechblase',
      test: (s) => [0, 1, 2].every((k) => s.hatGemeinschaft(k)) },
    { id: 'ohr', name: 'Zuhör-Profi', text: 'Hör-Stollen und „Wer hört zu?“ geschafft.', stufe: 'silber', symbol: 'ohr',
      test: (s) => s.hatKern(1, 2) && s.hatKern(2, 1) },
    { id: 'rat', name: 'Ratsüberzeuger', nameW: 'Ratsüberzeugerin', text: 'Den Inselrat überzeugt.', stufe: 'silber', symbol: 'sprechblase',
      test: (s) => s.hatKern(2, 2) },
    { id: 'krone1', name: 'Tiefen-Krone', text: 'In einem Stollen ganz unten angekommen.', stufe: 'bronze', symbol: 'krone',
      test: (s) => s.kronenTotal() >= 1 },
    { id: 'krone5', name: 'Kronenschmied', nameW: 'Kronenschmiedin', text: 'Fünf Tiefen-Kronen gesammelt.', stufe: 'silber', symbol: 'krone',
      test: (s) => s.kronenTotal() >= 5 },
    { id: 'krone9', name: 'Goldene Hand', text: 'Neun Tiefen-Kronen gesammelt.', stufe: 'gold', symbol: 'krone',
      test: (s) => s.kronenTotal() >= 9 },
    { id: 'stern3', name: 'Sternenfänger', nameW: 'Sternenfängerin', text: '3 Sterne in einem Bonusspiel.', stufe: 'silber', symbol: 'stern',
      test: (s) => s.bonusMax() === 3 },
    { id: 'stern9', name: 'Sternenhimmel', text: 'In allen drei Bonusspielen 3 Sterne.', stufe: 'gold', symbol: 'stern',
      test: (s) => s.bonusTotal() === 9 },
    { id: 'gems', name: 'Edelstein-Schatz', text: '30 Edelsteine gesammelt.', stufe: 'silber', symbol: 'edelstein',
      test: (s) => s.gems() >= 30 },
    { id: 'buch', name: 'Bücherwurm', text: 'Alle Seiten im Wissensbuch gefunden.', stufe: 'gold', symbol: 'buch',
      test: (s, x) => x.wissen === ZI.WISSEN.length },
    { id: 'freunde', name: 'Zwergenfreund', nameW: 'Zwergenfreundin', text: 'Acht Zwerge freigeschaltet.', stufe: 'silber', symbol: 'helm',
      test: (s) => s.freieZwerge().length >= 8 },
    { id: 'clan', name: 'Der ganze Clan', text: 'Alle zwölf Zwerge freigeschaltet.', stufe: 'gold', symbol: 'helm',
      test: (s) => s.freieZwerge().length === 12 },
  ];

  /* Name eines Abzeichens passend zum Zwerg (Zwerginnen bekommen die weibliche Form) */
  ZI.abzeichenName = (a, s) => {
    const z = s && ZI.ZWERGE.find((d) => d.nr === s.zwerg);
    return z && z.w && a.nameW ? a.nameW : a.name;
  };

  /* =========================================================
     INSELRÄTSEL – Wiederholung zum Stundenbeginn am Board
     Fragen werden aus den Aufgaben der bisherigen Kapitel gezogen.
     ========================================================= */
  ZI.raetselFragen = function (bisKapitel, anzahl) {
    const pool = [];
    const mische = ZI.mischen;
    const nimm = (arr, n, f) => mische(arr).slice(0, n).forEach((x) => pool.push(f(x)));
    // Kapitel 1
    nimm(ZI.STUMPF_SCHARF, 3, (it) => ({ frage: 'Welche Begründung ist scharf?', kopf: it.meinung,
      optionen: it.optionen.map((o) => ({ text: o.text, ok: o.scharf })), info: 'Eine scharfe Begründung erklärt, WARUM.' }));
    nimm(ZI.FEHLERJAGD, 3, (it) => ({ frage: 'Welcher Satz ist richtig geschmiedet?', kopf: '',
      optionen: it.saetze.map((o) => ({ text: o.text, ok: o.ok })), info: 'Komma vor weil, da, denn – und das Verb an die richtige Stelle.' }));
    nimm(ZI.BEISPIELE, 2, (it) => ({ frage: 'Welches Beispiel passt?', kopf: it.argument,
      optionen: it.optionen.map((o) => ({ text: o.text, ok: o.ok })), info: 'Ein gutes Beispiel zeigt, dass die Begründung stimmt.' }));
    if (bisKapitel >= 1) {
      nimm(ZI.TEIL_ERKENNEN, 3, (it) => ({ frage: 'Welcher Teil des Arguments ist das?', kopf: it.satz,
        optionen: ['Meinung', 'Begründung', 'Beispiel'].map((t) => ({ text: t, ok: t === it.teil })), info: ZI.TEIL_INFO[it.teil] }));
      const beitraege = [];
      ZI.MOTOR_BREMSE.forEach((g) => g.beitraege.forEach((b) => beitraege.push(b)));
      nimm(beitraege, 3, (b) => ({ frage: 'Gesprächsmotor oder Gesprächsbremse?', kopf: b.text,
        optionen: [{ text: 'Motor', ok: b.motor }, { text: 'Bremse', ok: !b.motor }], info: b.info, fest: true }));
    }
    if (bisKapitel >= 2) {
      nimm(ZI.JA_UND, 3, (it) => ({ frage: 'Wie reagiert die zweite Person?', kopf: it.vorher + '\n' + it.antwort,
        optionen: ZI.ARTEN.map((a) => ({ text: a, ok: a === it.art })), info: ZI.ARTEN_INFO[it.art], fest: true }));
      nimm(ZI.GEGENARGUMENTE, 2, (it) => ({ frage: 'Welcher Satz ist ein Gegenargument?', kopf: it.argument,
        optionen: it.optionen.map((o) => ({ text: o.text, ok: o.ok })), info: 'Ein Gegenargument spricht gegen die Meinung.' }));
    }
    // aktuelle Kapitel stärker gewichten: die letzten Einträge zuerst mischen, dann auffüllen
    return mische(pool).slice(0, anzahl).map((f) => (f.fest ? f : Object.assign(f, { optionen: mische(f.optionen) })));
  };

  /* =========================================================
     AUFTRAG DES TAGES – ein Klassenziel für die Stunde
     wert(staende): aktueller Gesamtwert der Klasse; Ziel = Zuwachs seit Start
     ========================================================= */
  ZI.AUFTRAEGE = [
    { id: 'liefern', text: (z) => 'Heute liefern mindestens ' + z + ' Zwerge ihr Material ab.', ziel: (n) => Math.max(5, Math.round(n * 0.75)),
      einheit: 'Lieferungen', liefernZaehlen: true },
    { id: 'tief', text: (z) => 'Heute graben wir zusammen ' + z + ' Tiefen tiefer.', ziel: (n) => Math.max(4, Math.round(n * 0.4)),
      einheit: 'Tiefen', wert: (st) => st.reduce((a, s) => a + s.deepTotal(), 0) },
    { id: 'meister', text: (z) => 'Heute zeigen wir ' + z + ' Meisterstücke.', ziel: (n) => Math.max(3, Math.round(n * 0.25)),
      einheit: 'Meisterstücke', wert: (st) => st.reduce((a, s) => a + [0, 1, 2].filter((k) => s.hatGemeinschaft(k)).length, 0) },
    { id: 'kronen', text: (z) => 'Heute holen wir ' + z + ' Tiefen-Kronen.', ziel: (n) => Math.max(2, Math.round(n * 0.15)),
      einheit: 'Kronen', wert: (st) => st.reduce((a, s) => a + s.kronenTotal(), 0) },
    { id: 'gems', text: (z) => 'Heute sammeln wir ' + z + ' Edelsteine.', ziel: (n) => Math.max(15, Math.round(n * 1.5)),
      einheit: 'Edelsteine', wert: (st) => st.reduce((a, s) => a + s.gems(), 0) },
  ];
  /* Sonder-Schmuck für erfüllte Aufträge */
  ZI.SONDERSCHMUCK = [
    { id: 'sonder-amboss-denkmal', alt: 'statue', name: 'Amboss-Denkmal', x: 41, y: 57, w: 5 },
    { id: 'sonder-pavillon', alt: 'kristall-laterne', name: 'Musikpavillon', x: 47, y: 24, w: 8 },
    { id: 'sonder-blumenbogen', alt: 'fahne', name: 'Blumenbogen', x: 56, y: 63, w: 5 },
    { id: 'sonder-baumhaus', alt: 'gemuesegarten', name: 'Baumhaus', x: 10, y: 47, w: 8 },
    { id: 'sonder-festbaum', alt: 'ziegen', name: 'Festbaum', x: 88, y: 72, w: 6 },
    { id: 'sonder-aussichtsturm', alt: 'wegweiser', name: 'Aussichtsturm', x: 84, y: 50, w: 6 },
  ];
})();
