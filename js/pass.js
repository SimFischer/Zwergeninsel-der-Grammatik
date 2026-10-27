/* Persönlicher Pass und kurze Klassenlieferung sind getrennte Formate.
   G1 wird weiterhin gelesen. G2 bewahrt zusätzlich die bestätigten Lieferstände.
   Ein Lieferschein überträgt die kumulativen Material-, Edelstein- und Kronenstände; Wiederholungen
   sind dadurch unschädlich. Keine Tageszähler, kein Server und keine Gerätebindung. */
(function () {
  const Z = window.ZI;
  Z.PASS_FORMAT=Object.freeze({version:"G2",muster:"G2-XXXXXX-XXXXXX-XXXXXX",zeichen:18,gruppen:3});
  const A = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  const integer = (v, min, max, fallback) => Number.isInteger(v) && v >= min && v <= max ? v : fallback;
  const checksum = n => {
    let h = 0x4a31;
    while (n) { h = ((h * 31) ^ Number(n & 255n)) & 65535; n >>= 8n; }
    return h;
  };
  class Stand {
    constructor(o = {}) {
      this.id = integer(o.id, 1, 32, 0);
      this.zwerg = integer(o.zwerg, 1, 12, 1);
      this.welt = integer(o.welt, 0, 11, 0);
      this.t = Array.from({ length: 11 }, (_, i) => integer(o.t?.[i], 0, 5, 0));
      this.geliefert = this.t.map((t, i) => integer(o.geliefert?.[i], 0, t, 0));
    }
    tiefe(i) { return this.t[i] || 0; }
    coreTotal() { return this.t.filter(t => t >= 1).length; }
    coreCount(k) { return Z.STOLLEN.filter(s => s.kapitel === k && this.t[s.index] >= 1).length; }
    kapitelFertig(k) { return Z.STOLLEN.filter(s => s.kapitel === k).every(s => this.t[s.index] >= 1); }
    gems() { return this.t.reduce((n, t) => n + Math.max(0, Math.min(t, 4) - 1) * Z.REGELN.edelsteine, 0); }
    kronenTotal() { return this.t.filter(t => t === 5).length; }
    zwergFrei(n) { const z = Z.ZWERGE.find(z => z.nr === n); return !!z && (!!z.start || z.unlock(this)); }
    freieZwerge() { return Z.ZWERGE.filter(z => this.zwergFrei(z.nr)).map(z => z.nr); }
    abschliessen(i, tiefe) {
      if (!Number.isInteger(i) || i < 0 || i > 10 || !Z.stollenFrei(this, i) || !Number.isInteger(tiefe) || tiefe < 1 || tiefe > 5 || tiefe > this.t[i] + 1) return false;
      const neu = tiefe > this.t[i]; this.t[i] = Math.max(this.t[i], tiefe); return neu;
    }
    code(version = 'G2') {
      let n = BigInt(this.id);
      n = n * 12n + BigInt(this.zwerg - 1); n = n * 12n + BigInt(this.welt);
      this.t.forEach(t => { n = n * 6n + BigInt(t); });
      if (version === 'G2') this.geliefert.forEach(t => { n = n * 6n + BigInt(t); });
      n = (n << 16n) | BigInt(checksum(n));
      let s = ''; const length = version === 'G2' ? 18 : 12;
      for (let i = 0; i < length; i++) { s = A[Number(n & 31n)] + s; n >>= 5n; }
      return version + '-' + s.match(version === 'G2' ? /.{6}/g : /.{4}/g).join('-');
    }
    static ausCode(text) {
      const s = String(text || '').toUpperCase().replace(/[\s-]/g, '');
      const version = s.slice(0, 2);
      if (!((version === 'G1' && s.length === 14) || (version === 'G2' && s.length === 20))) return null;
      let n = 0n;
      for (const c of s.slice(2)) { const v = A.indexOf(c); if (v < 0) return null; n = n * 32n + BigInt(v); }
      const check = Number(n & 65535n); n >>= 16n; if (checksum(n) !== check) return null;
      const readDepths = () => { const t = Array(11); for (let i = 10; i >= 0; i--) { t[i] = Number(n % 6n); n /= 6n; } return t; };
      const geliefert = version === 'G2' ? readDepths() : Array(11).fill(0);
      const t = readDepths();
      if (geliefert.some((v, i) => v > t[i])) return null;
      const welt = Number(n % 12n); n /= 12n;
      const zwerg = Number(n % 12n) + 1; n /= 12n; const id = Number(n); if (id > 32) return null;
      const stand = new Stand({ id, zwerg, welt, t, geliefert });
      return stand.code(version).replace(/-/g, '') === s ? stand : null;
    }
    static zusammen(a, b) {
      return new Stand({ id: a.id, zwerg: b.zwerg, welt: Math.max(a.welt, b.welt), t: a.t.map((t, i) => Math.max(t, b.t[i])), geliefert: a.geliefert.map((t, i) => Math.max(t, b.geliefert[i])) });
    }
    lieferCode() { return this.id ? Z.lieferung.kodiere(Z.lieferung.ausStand(this)) : null; }
    offeneLieferungen() { return this.t.map((t, i) => ({ i, tiefe: t, code: this.lieferCode(i) })).filter(x => x.tiefe > this.geliefert[x.i]); }
    lieferungBestaetigen() { this.geliefert = this.t.slice(); }
  }
  Z.Stand = Stand;

  // Dieselbe umkehrbare 20-Bit-Verwürfelung wie im ursprünglichen Lieferschein.
  const RUNDEN = [0x2B7, 0x1C3, 0x3A9, 0x0F5];
  const rundenF = (x, k) => (((x * 0x2F) ^ k) + (x >> 3)) & 0x3FF;
  function mischVor(v) {
    let l = v >> 10, r = v & 0x3FF;
    for (const k of RUNDEN) { const t = r; r = l ^ rundenF(r, k); l = t; }
    return (l << 10) | r;
  }
  function mischZurueck(v) {
    let l = v >> 10, r = v & 0x3FF;
    for (let i = RUNDEN.length - 1; i >= 0; i--) { const t = l; l = r ^ rundenF(l, RUNDEN[i]); r = t; }
    return (l << 10) | r;
  }
  // Kompression über zulässige Gesamtstände: 936 Zustände passen mit Karte,
  // Figur und dem ursprünglichen Prüfbit in die vorhandenen vier Zeichen.
  const ZUSTAENDE = [], INDEX = new Map();
  for (let material = 0; material <= 11; material++) for (let schritte = 0; schritte <= 3 * material; schritte++) for (let kronen = 0; kronen <= Math.floor(schritte / 3); kronen++) {
    INDEX.set(material + ':' + schritte + ':' + kronen, ZUSTAENDE.length);
    ZUSTAENDE.push({ material, schritte, kronen });
  }
  const paritaet = v => { let p = 0; while (v) { p ^= v & 1; v >>= 1; } return p; };
  Z.lieferung = {
    ausStand(s) { return { id: s.id, zwerg: s.zwerg, material: s.coreTotal(), schritte: s.gems() / Z.REGELN.edelsteine, kronen: s.kronenTotal() }; },
    kodiere(info = {}) {
      const { id, zwerg, material, schritte, kronen } = info;
      const index = INDEX.get(material + ':' + schritte + ':' + kronen);
      if (integer(id, 1, 32, null) === null || integer(zwerg, 1, 12, null) === null || integer(material, 0, 11, null) === null || integer(schritte, 0, 33, null) === null || integer(kronen, 0, 11, null) === null || index === undefined) return null;
      const data = ((id - 1) * 12 + zwerg - 1) * ZUSTAENDE.length + index;
      let v = mischVor((data << 1) | paritaet(data)), code = '';
      for (let i = 0; i < 4; i++) { code = A[v & 31] + code; v >>= 5; }
      return code;
    },
    lese(text) {
      const code = String(text || '').toUpperCase().replace(/\s/g, ''); if (code.length !== 4) return null;
      let v = 0; for (const c of code) { const n = A.indexOf(c); if (n < 0) return null; v = (v << 5) | n; }
      v = mischZurueck(v); const data = v >> 1;
      if (data >= 32 * 12 * ZUSTAENDE.length || paritaet(data) !== (v & 1)) return null;
      const person = Math.floor(data / ZUSTAENDE.length);
      return { id: Math.floor(person / 12) + 1, zwerg: person % 12 + 1, ...ZUSTAENDE[data % ZUSTAENDE.length] };
    },
    anwenden(alt, info) {
      if (!info || !this.kodiere(info) || (alt && alt.id !== info.id)) return null;
      if (alt instanceof Stand) alt = this.ausStand(alt);
      return { id: info.id, zwerg: info.zwerg, material: Math.max(alt?.material || 0, info.material), schritte: Math.max(alt?.schritte || 0, info.schritte), kronen: Math.max(alt?.kronen || 0, info.kronen) };
    },
  };
  // Stabile Zuordnung der zwölf möglichen Baustufen. Niemals umsortieren.
  const WOERTER = ['BAMALO', 'BEKARO', 'BOKAMI', 'DALUMI', 'FALORA', 'GABULO', 'KALIMO', 'KOBALT', 'LAMORA', 'MOLUKA', 'RUBINA', 'AMBOSS'];
  Z.botschaft = {
    kodiere(welt) { return WOERTER[integer(welt, 0, 11, 0)]; },
    lese(text) {
      const code = String(text || '').toUpperCase().replace(/[\s-]/g, '');
      const index = WOERTER.indexOf(code); if (index >= 0) return index;
      // Bestehende, schon notierte lange Botschaften bleiben lesbar.
      const alt = Stand.ausCode(String(text).toUpperCase().replace(/^INSEL[\s-]*/, 'G1-'));
      return alt && alt.id === 0 && alt.t.every(t => t === 0) ? alt.welt : null;
    },
  };
})();
