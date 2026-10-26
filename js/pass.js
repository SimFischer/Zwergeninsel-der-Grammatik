/* Zwergeninsel – Spielstand und Zwergenpass
   Der ganze Spielstand eines Kindes passt in einen 12-stelligen Code (XXXX-XXXX-XXXX).
   So kann jedes Kind auf jedem Koffer-iPad weiterspielen, ganz ohne Server.

   Jeder Stollen hat seine eigene Tiefe: 0 = noch nicht gespielt, 1 = Grundstufe geschafft,
   2–5 = freiwillig tiefer gegraben. Je Kapitel gibt es 3 Hauptstollen (Tiefe 0–5) und
   einen Gemeinschaftsstollen (Tiefe 0–3).
   Code (gemischte Basis, < 2^60): karte 0–32 | zwerg | offen | bonus 3×(0–3) | Tiefen 3×(6·6·6·4) | bau 10 | prüf 16 */

(function () {
  const ZI = window.ZI || (window.ZI = {});
  const ALPHA = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // ohne 0, 1, I, O
  const GEM = 3;                                // Index des Gemeinschaftsstollens
  const MAXT = [5, 5, 5, 3];                    // tiefste Stufe je Stollen

  class Stand {
    constructor(o = {}) {
      this.id = o.id ?? 0;                  // Kartennummer 1–32 (0 = noch keine)
      this.zwerg = o.zwerg ?? 1;            // 1–12
      this.t = o.t ? o.t.map((r) => r.slice()) : [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]; // Tiefe je Kapitel und Stollen
      this.bonus = o.bonus ?? [0, 0, 0];    // je Kapitel beste Sterne im Bonusspiel (0–3)
      this.offen = o.offen ?? 0;            // höchstes freigeschaltetes Kapitel (0 = Kapitel 1)
      this.bau = o.bau ?? 0;                // Bitmaske der geschafften Gebäude-Übungen (10 Bit)
      this.liefer = o.liefer ? o.liefer.slice() : [0, 0, 0]; // nur am Board: Tiefen-Schritte aus dem Lieferschein
    }
    static bits(m) { let n = 0; for (let i = 0; i < 3; i++) if (m & (1 << i)) n++; return n; }
    static maxTiefe(i) { return MAXT[i]; }
    /* Tiefe eines Stollens (i = 0–2 Hauptstollen, 3 = Gemeinschaftsstollen) */
    tiefe(k, i) { return Math.min(MAXT[i], this.t[k][i] || 0); }
    setzeTiefe(k, i, n) { this.t[k][i] = Math.max(this.tiefe(k, i), Math.min(MAXT[i], n)); }
    /* Grundstufe der Hauptstollen = Baumaterial für das Dorf */
    get kern() { return this.t.map((r) => (r[0] ? 1 : 0) | (r[1] ? 2 : 0) | (r[2] ? 4 : 0)); }
    hatKern(k, i) { return this.tiefe(k, i) >= 1; }
    setzeKern(k, i) { this.setzeTiefe(k, i, 1); }
    setzeKernBits(k, m) { for (let i = 0; i < 3; i++) if (m & (1 << i)) this.setzeKern(k, i); }
    coreCount(k) { return [0, 1, 2].filter((i) => this.hatKern(k, i)).length; }
    coreTotal() { return [0, 1, 2].reduce((a, k) => a + this.coreCount(k), 0); }
    gemeinschaftOffen(k) { return [0, 1, 2].filter((i) => this.tiefe(k, i) >= 2).length >= 2; }
    hatGemeinschaft(k) { return this.tiefe(k, GEM) >= 1; }
    /* freiwillige Schritte eines Kapitels: jede Zusatztiefe + der Gemeinschaftsstollen (je 5 Edelsteine) */
    extra(k) { return [0, 1, 2].reduce((a, i) => a + Math.max(0, this.tiefe(k, i) - 1), 0) + this.tiefe(k, GEM); }
    tiefer(k) { return [0, 1, 2, 3].reduce((a, i) => a + Math.max(0, this.tiefe(k, i) - 1), 0); }
    tieferTotal() { return [0, 1, 2].reduce((a, k) => a + this.tiefer(k), 0); }
    tiefsteIn(k) { return Math.max(...[0, 1, 2, 3].map((i) => this.tiefe(k, i))); }
    deepTotal() { return [0, 1, 2].reduce((a, k) => a + Math.max(this.extra(k), this.liefer[k] || 0), 0); }
    /* Tiefen-Krone: tiefste Stufe eines Stollens erreicht */
    hatKrone(k, i) { return this.tiefe(k, i) >= MAXT[i]; }
    kronenTotal() { let n = 0; for (let k = 0; k < 3; k++) for (let i = 0; i < 4; i++) if (this.hatKrone(k, i)) n++; return n; }
    bonusMax() { return Math.max(...this.bonus); }
    bonusTotal() { return this.bonus.reduce((a, b) => a + b, 0); }
    gems() { return this.deepTotal() * (ZI.GEMS_PRO_STOLLEN || 5) + this.bonusTotal(); }
    hatBau(bit) { return !!(this.bau & (1 << bit)); }
    setzeBau(bit) { this.bau |= (1 << bit); }
    bauTotal() { let n = 0; for (let i = 0; i < 10; i++) if (this.bau & (1 << i)) n++; return n; }
    zwergFrei(nr) {
      const z = ZI.ZWERGE.find((d) => d.nr === nr);
      return !!z && (z.start || (z.unlock && z.unlock(this)));
    }
    freieZwerge() { return ZI.ZWERGE.filter((z) => this.zwergFrei(z.nr)).map((z) => z.nr); }

    /* ---------- Zwergenpass: gemischte Basis, Prüfzahl, Verwürfelung ---------- */
    static basen() {
      const b = [33n, 12n, 3n, 4n, 4n, 4n];
      for (let k = 0; k < 3; k++) b.push(6n, 6n, 6n, 4n);
      b.push(1024n, 16n);
      return b;
    }
    werte() {
      const w = [this.karte || 0, this.zwerg - 1, Math.min(2, this.offen), ...this.bonus.map((x) => x & 3)];
      for (let k = 0; k < 3; k++) for (let i = 0; i < 4; i++) w.push(this.tiefe(k, i));
      w.push(this.bau & 0x3ff);
      return w;
    }
    static pruef(w) { let h = 11; w.forEach((x, i) => { h = (h * 31 + x * (i + 7)) % 32719; }); return h & 15; }
    code() {
      const w = this.werte(); w.push(Stand.pruef(w));
      let v = 0n;
      Stand.basen().forEach((b, i) => { v = v * b + BigInt(w[i]); });
      let all = Stand.verschluesseln(v);
      let s = '';
      for (let i = 0; i < 12; i++) { s = ALPHA[Number(all & 31n)] + s; all >>= 5n; }
      return s.slice(0, 4) + '-' + s.slice(4, 8) + '-' + s.slice(8);
    }
    static ausCode(text) {
      const clean = String(text || '').toUpperCase().replace(/[^0-9A-Z]/g, '');
      if (clean.length !== 12) return null;
      let all = 0n;
      for (const ch of clean) { const n = ALPHA.indexOf(ch); if (n < 0) return null; all = (all << 5n) | BigInt(n); }
      let v = Stand.entschluesseln(all);
      const basen = Stand.basen(); const w = new Array(basen.length);
      for (let i = basen.length - 1; i >= 0; i--) { w[i] = Number(v % basen[i]); v /= basen[i]; }
      if (v !== 0n) return null;                       // außerhalb des gültigen Bereichs = Tippfehler
      const p = w.pop();
      if (Stand.pruef(w) !== p) return null;
      const s = new Stand({ id: w[0], zwerg: w[1] + 1, offen: w[2], bonus: w.slice(3, 6), bau: w[w.length - 1] });
      for (let k = 0; k < 3; k++) for (let i = 0; i < 4; i++) s.t[k][i] = w[6 + k * 4 + i];
      return s;
    }
    /* umkehrbare Verwürfelung auf 60 Bit: Multiplikation mit ungerader Zahl, XOR, Rotation */
    static verschluesseln(v) {
      const M = (1n << 60n) - 1n;
      v = (v * 0x5DEECE66Dn) & M;
      v ^= 0x2A5F3C91B7E4D1n;
      v = ((v << 17n) | (v >> 43n)) & M;
      v = (v * 0x9E3779B1n) & M;
      return v;
    }
    static entschluesseln(v) {
      const M = (1n << 60n) - 1n;
      v = (v * Stand.inverse(0x9E3779B1n)) & M;
      v = ((v >> 17n) | (v << 43n)) & M;
      v ^= 0x2A5F3C91B7E4D1n;
      v = (v * Stand.inverse(0x5DEECE66Dn)) & M;
      return v;
    }
    static inverse(a) { // Inverses von a modulo 2^60 (Newton)
      const M = (1n << 60n) - 1n;
      let x = a;
      for (let i = 0; i < 7; i++) x = (x * (2n - a * x)) & M;
      return x;
    }
  }
  Stand.GEM = GEM;

  /* =========================================================
     LIEFERSCHEIN – 4 Zeichen, die die Lehrkraft am Board eintippt.
     Er trägt nur, was die Insel braucht (20 Bit):
     karte 5 | zwerg 4 | kapitel 2 | kern 3 | tief 3 | bonus 2 | prüfbit 1
     Die Bits werden gemischt, damit ein Tippfehler fast immer auffällt
     (ungültiger Zwerg, ungültiges Kapitel oder falsches Prüfbit).
     ========================================================= */
  const RUNDEN = [0x2B7, 0x1C3, 0x3A9, 0x0F5];
  const rundenF = (x, k) => (((x * 0x2F) ^ k) + (x >> 3)) & 0x3FF;
  function mischVor(v) {
    let l = v >> 10; let r = v & 0x3FF;
    for (const k of RUNDEN) { const t = r; r = l ^ rundenF(r, k); l = t; }
    return (l << 10) | r;
  }
  function mischZurueck(v) {
    let l = v >> 10; let r = v & 0x3FF;
    for (let i = RUNDEN.length - 1; i >= 0; i--) { const t = l; l = r ^ rundenF(l, RUNDEN[i]); r = t; }
    return (l << 10) | r;
  }
  const paritaet = (v) => { let p = 0; while (v) { p ^= v & 1; v >>= 1; } return p; };

  Object.defineProperty(Stand.prototype, 'karte', {
    get() { return this.id >= 1 && this.id <= 32 ? this.id : null; },
  });
  /* Lieferschein für das Kapitel k (Standard: das höchste offene Kapitel) */
  Stand.prototype.lieferCode = function (k) {
    if (!this.karte) return null;
    if (k === undefined) k = this.offen;
    let v = this.karte - 1;
    v = (v << 4) | ((this.zwerg - 1) & 15);
    v = (v << 2) | (k & 3);
    v = (v << 3) | (this.kern[k] & 7);
    v = (v << 3) | Math.min(7, this.extra(k));
    v = (v << 2) | (this.bonus[k] & 3);
    v = (v << 1) | paritaet(v);
    v = mischVor(v);
    let t = '';
    for (let i = 0; i < 4; i++) { t = ALPHA[v & 31] + t; v >>= 5; }
    return t;
  };
  Stand.ausLieferCode = function (text) {
    const clean = String(text || '').toUpperCase().replace(/[^0-9A-Z]/g, '');
    if (clean.length !== 4) return null;
    let v = 0;
    for (const ch of clean) { const n = ALPHA.indexOf(ch); if (n < 0) return null; v = (v << 5) | n; }
    v = mischZurueck(v);
    const p = v & 1; v >>= 1;
    if (paritaet(v) !== p) return null;
    const bonus = v & 3; v >>= 2;
    const tief = v & 7; v >>= 3;
    const kern = v & 7; v >>= 3;
    const kapitel = v & 3; v >>= 2;
    const zwerg = (v & 15) + 1; v >>= 4;
    const karte = (v & 31) + 1;
    if (zwerg > 12 || kapitel > 2) return null;
    return { karte, zwerg, kapitel, kern, tief, bonus };
  };

  /* =========================================================
     INSELBOTSCHAFT – drei Silben, die das Board zeigt (z. B. „BOKAMI“).
     Sie sagt der Schmiede, welches Kapitel offen ist und welche Gebäude stehen.
     kapitel 2 | gebäude 10 | prüfbits 3  = 15 Bit = 3 Silben à 5 Bit
     ========================================================= */
  const SILBEN = ['BA', 'BE', 'BI', 'BO', 'BU', 'DA', 'DE', 'DI', 'DO', 'DU', 'FA', 'FE', 'FI', 'FO', 'FU', 'GA',
    'GO', 'GU', 'KA', 'KE', 'KI', 'KO', 'KU', 'LA', 'LE', 'LI', 'LO', 'LU', 'MA', 'MI', 'MO', 'MU'];
  const B_MUL = 0x5A3B; const B_INV = (() => { let x = B_MUL; for (let i = 0; i < 5; i++) x = (x * (2 - B_MUL * x)) & 0x7fff; return x & 0x7fff; })();
  const bPruef = (d) => ((d & 7) * 3 + ((d >> 3) & 7) * 5 + ((d >> 6) & 7) * 7 + ((d >> 9) & 7) + 5) & 7;
  ZI.botschaft = {
    kodiere(kapitel, bau) {
      const d = ((kapitel & 3) << 10) | (bau & 0x3ff);
      let v = ((d << 3) | bPruef(d)) & 0x7fff;
      v = Math.imul(v ^ 0x2D4B, B_MUL) & 0x7fff;
      return SILBEN[(v >> 10) & 31] + SILBEN[(v >> 5) & 31] + SILBEN[v & 31];
    },
    lese(text) {
      const t = String(text || '').toUpperCase().replace(/[^A-Z]/g, '');
      if (t.length !== 6) return null;
      let v = 0;
      for (let i = 0; i < 6; i += 2) { const n = SILBEN.indexOf(t.slice(i, i + 2)); if (n < 0) return null; v = (v << 5) | n; }
      v = (Math.imul(v, B_INV) & 0x7fff) ^ 0x2D4B;
      const d = v >> 3;
      if (bPruef(d) !== (v & 7)) return null;
      const kapitel = d >> 10;
      if (kapitel > 2) return null;
      return { kapitel, bau: d & 0x3ff };
    },
  };

  /* STAMMESCODE – drei Silben: Klassengröße 5 | Mischung 3 | Thema 3 | Prüfung 4 */
  const sPruef = (d) => ((d & 15) * 7 + ((d >> 4) & 15) * 11 + ((d >> 8) & 7) * 13 + 9) & 15;
  ZI.stammescode = {
    kodiere(n, seed, thema) {
      const d = (((n - 1) & 31) << 6) | ((seed & 7) << 3) | (thema & 7);
      let v = ((d << 4) | sPruef(d)) & 0x7fff;
      v = Math.imul(v ^ 0x1A77, B_MUL) & 0x7fff;
      return SILBEN[(v >> 10) & 31] + SILBEN[(v >> 5) & 31] + SILBEN[v & 31];
    },
    lese(text) {
      const t = String(text || '').toUpperCase().replace(/[^A-Z]/g, '');
      if (t.length !== 6) return null;
      let v = 0;
      for (let i = 0; i < 6; i += 2) { const n = SILBEN.indexOf(t.slice(i, i + 2)); if (n < 0) return null; v = (v << 5) | n; }
      v = (Math.imul(v, B_INV) & 0x7fff) ^ 0x1A77;
      const d = v >> 4;
      if (sPruef(d) !== (v & 15)) return null;
      const n = (d >> 6) + 1;
      if (n < 2) return null;
      return { n, seed: (d >> 3) & 7, thema: d & 7 };
    },
  };

  /* Eingabefeld formatieren: 10 Zeichen als XXXXX-XXXXX, sonst XXXX-XXXX-XXXX */
  ZI.formatiereCode = function (roh) {
    const v = String(roh || '').toUpperCase().replace(/[^0-9A-Z]/g, '').slice(0, 12);
    return v.replace(/(.{4})(?=.)/g, '$1-');
  };

  ZI.Stand = Stand;
  })();
