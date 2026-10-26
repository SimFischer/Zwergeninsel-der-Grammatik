/* Zwergeninsel – Inhalte und Spieldaten
   Alle Texte für die Kinder stehen hier, damit sie leicht angepasst werden können. */

const ZI = window.ZI || (window.ZI = {});

/* ---------- Bilder ---------- */
ZI.JPG = ['transition-schmiede', 'transition-stollen', 'transition-gemeinschaftsstollen', 'titel-hintergrund', 'schmiede-hintergrund', 'stollen-hintergrund', 'zwergenrat-hintergrund', 'vulkan-hintergrund', 'fest-szene', 'insel-grund'];
ZI.BILD = (name) => 'bilder/' + name + (ZI.JPG.includes(name) ? '.jpg' : '.png');
/* Alle Bilder – werden nach dem Start gestaffelt in den Offline-Speicher geladen (ZI.vorladen) */
/* Bildplätze, deren Dateien noch kommen: werden nicht geladen, es greift der Ersatz.
   Ist eine Datei da, den Namen hier streichen und in ALLE_BILDER eintragen. */
ZI.BILD_KOMMT = [];
ZI.ALLE_BILDER = [
  'rolle-pro', 'rolle-contra', 'argumenttafel', 'stollen-tiefer', 'tiefe-1', 'tiefe-2', 'tiefe-3', 'tiefe-4', 'tiefe-5', 'tiefe-krone',
  'zwerg-01-brumm', 'zwerg-02-hilda', 'zwerg-03-tarek', 'zwerg-04-svea', 'zwerg-05-kira', 'zwerg-06-ole',
  'zwerg-07-fenno', 'zwerg-08-smaragda', 'zwerg-09-bodo', 'zwerg-10-amara', 'zwerg-11-grimbart', 'zwerg-12-rubina',
  'meisterin-erklaert', 'meisterin-jubelt', 'meisterin-tipp', 'meisterin-ermutigt', 'kobold-frech', 'kobold-chaos',
  'kobold-besiegt', 'schmiede-hintergrund', 'amboss', 'hammer', 'eisen-roh', 'eisen-gluehend',
  'axt-stumpf', 'axt-scharf', 'schleifstein', 'runenplatte', 'truhe-zu', 'truhe-offen',
  'titel-hintergrund', 'stollen-hintergrund', 'zwergenrat-hintergrund', 'vulkan-hintergrund', 'fest-szene', 'insel-grund',
  'lagerfeuer', 'lagerfeuer-ruine', 'huette1', 'huette1-ruine', 'huette2', 'huette2-ruine',
  'huette3', 'huette3-ruine', 'werkstatt', 'werkstatt-ruine', 'steg', 'steg-ruine',
  'bibliothek', 'bibliothek-ruine', 'ratsplatz', 'ratsplatz-ruine', 'brunnen', 'brunnen-ruine',
  'muehle', 'muehle-ruine', 'leuchtturm', 'leuchtturm-ruine', 'festhalle', 'festhalle-ruine',
  'schiff', 'fahne', 'laterne', 'kristall-laterne', 'blumenbeet',
  'bank', 'faesser', 'statue', 'wegweiser', 'gemuesegarten', 'ziegen',
  'holz', 'stein', 'eisen', 'edelstein', 'stern',
  'zwergenpass-karte',
  'moewe-oben', 'moewe-unten', 'moewe-geschenk', 'krabbe', 'delfin', 'huhn', 'hase', 'schildkroete', 'schmetterling',
  'wolke-1', 'wolke-2', 'wolke-3', 'sonder-pavillon', 'sonder-blumenbogen', 'sonder-amboss-denkmal', 'sonder-aussichtsturm',
  'sonder-baumhaus', 'sonder-festbaum', 'krone', 'geschenk', 'auftrag-rolle', 'buch-offen', 'flamme',
  'rang-1', 'rang-2', 'rang-3', 'rang-4', 'rang-5', 'rang-6', 'rang-7',
  ...['funke', 'k1', 'k2', 'k3', 'fehler', 'kobold', 'rede', 'ohr', 'rat', 'krone1', 'krone5', 'krone9', 'stern3', 'stern9', 'gems', 'buch', 'freunde', 'clan'].map((a) => 'abzeichen-' + a),
  'icon-beispiel', 'icon-beispielregen', 'icon-erz-schlacke', 'icon-fehlerjagd', 'icon-funkenregen', 'icon-gegenargument', 'icon-hoeren', 'icon-inselrat', 'icon-ja-und', 'icon-kette', 'icon-kobold-kampf', 'icon-meisterstueck', 'icon-meisterstueck2', 'icon-motor-bremse', 'icon-puzzle', 'icon-situation', 'icon-sprecherwechsel', 'icon-streitgespraech', 'icon-stumpf-scharf', 'icon-weil-denn', 'icon-zuhoeren',
  'gemeinschaftsstollen-icon', 'schmiede-axt-werkstueck', 'zwerg-freigeschaltet-glanz',
  'transition-schmiede', 'transition-stollen', 'transition-gemeinschaftsstollen',
  ...['01-brumm', '02-hilda', '03-tarek', '04-svea', '05-kira', '06-ole', '07-fenno', '08-smaragda', '09-bodo', '10-amara', '11-grimbart', '12-rubina'].map((z) => 'zwerg-' + z + '-jubel'),
];
/* Nur das Board braucht diese; die iPads laden sie nicht */
ZI.NUR_BOARD = (n) => /-ruine$|^(insel-grund|fest-szene|schiff|fahne|laterne|kristall-laterne|blumenbeet|bank|faesser|statue|wegweiser|gemuesegarten|ziegen|moewe-|krabbe|delfin|huhn|hase|schildkroete|schmetterling|wolke-|sonder-)/.test(n);

ZI.ZWERGE = [
  { nr: 1, name: 'Brumm', datei: 'zwerg-01-brumm', rolle: 'Schmied', start: true },
  { nr: 2, name: 'Hilda', datei: 'zwerg-02-hilda', rolle: 'Schmiedin', start: true },
  { nr: 3, name: 'Tarek', datei: 'zwerg-03-tarek', rolle: 'Baumeister', start: true },
  { nr: 4, name: 'Svea', datei: 'zwerg-04-svea', rolle: 'Schreiberin', start: true },
  { nr: 5, name: 'Kira', datei: 'zwerg-05-kira', rolle: 'Bergfrau' },
  { nr: 6, name: 'Ole', datei: 'zwerg-06-ole', rolle: 'Fischer' },
  { nr: 7, name: 'Fenno', datei: 'zwerg-07-fenno', rolle: 'Koch' },
  { nr: 8, name: 'Smaragda', datei: 'zwerg-08-smaragda', rolle: 'Edelsteinschleiferin' },
  { nr: 9, name: 'Bodo', datei: 'zwerg-09-bodo', rolle: 'Musikant' },
  { nr: 10, name: 'Amara', datei: 'zwerg-10-amara', rolle: 'Wächterin' },
  { nr: 11, name: 'Grimbart', datei: 'zwerg-11-grimbart', rolle: 'Weiser' },
  { nr: 12, name: 'Rubina Goldhammer', datei: 'zwerg-12-rubina', rolle: 'Legendäre Meisterschmiedin' },
];

/* Edelsteine pro geschafftem Tiefen Stollen */
ZI.GEMS_PRO_STOLLEN = 5;

/* ---------- Kapitel ---------- */
ZI.GEBAEUDE = [
  { id: 'lagerfeuer', name: 'Lagerfeuerplatz', kapitel: 1, x: 39, y: 53.7, w: 9 },
  { id: 'huette1', name: 'Runde Hütte', kapitel: 1, x: 24, y: 65.0, w: 11 },
  { id: 'huette2', name: 'Ziegelhütte', kapitel: 1, x: 40, y: 72.1, w: 11 },
  { id: 'werkstatt', name: 'Werkstatt', kapitel: 1, x: 21, y: 47.2, w: 12 },
  { id: 'huette3', name: 'Hügelhütte', kapitel: 1, x: 62, y: 64.5, w: 12 },
  { id: 'steg', name: 'Steg', kapitel: 1, x: 78, y: 88, w: 11 },
  { id: 'bibliothek', name: 'Bibliothek', kapitel: 2, x: 29, y: 29.4, w: 11 },
  { id: 'ratsplatz', name: 'Dorfplatz', kapitel: 2, x: 50, y: 46.7, w: 13 },
  { id: 'brunnen', name: 'Brunnen', kapitel: 2, x: 54, y: 84.7, w: 8 },
  { id: 'muehle', name: 'Mühle', kapitel: 2, x: 69, y: 38.6, w: 11 },
  { id: 'leuchtturm', name: 'Leuchtturm', kapitel: 3, x: 70, y: 15.1, w: 9 },
  { id: 'festhalle', name: 'Festhalle', kapitel: 3, x: 82, y: 68.6, w: 14 },
];

ZI.SCHMUCK_PRO = 15;
ZI.SCHMUCK = [
  { id: 'fahne', name: 'Fahne', x: 45, y: 47, w: 3.5 },
  { id: 'laterne', name: 'Laterne', x: 34, y: 56, w: 3 },
  { id: 'blumenbeet', name: 'Blumenbeet', x: 30, y: 66, w: 5 },
  { id: 'bank', name: 'Bank', x: 47, y: 73, w: 4.5 },
  { id: 'faesser', name: 'Fässer', x: 14, y: 48, w: 4.5 },
  { id: 'kristall-laterne', name: 'Kristall-Laterne', x: 57, y: 66, w: 3 },
  { id: 'gemuesegarten', name: 'Gemüsegarten', x: 87, y: 51, w: 7 },
  { id: 'ziegen', name: 'Ziegen', x: 47, y: 22, w: 6 },
  { id: 'statue', name: 'Zwergenstatue', x: 56, y: 47, w: 3.5 },
  { id: 'wegweiser', name: 'Wegweiser', x: 51, y: 58, w: 3.5 },
  { id: 'fahne', name: 'Fahne', x: 76, y: 40, w: 3.5 },
  { id: 'laterne', name: 'Laterne', x: 36, y: 30, w: 3 },
];
