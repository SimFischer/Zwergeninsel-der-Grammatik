const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
function bank(stored = new Map()) {
  const storage = { getItem: (key) => stored.get(key) ?? null, setItem: (key, value) => stored.set(key, value) };
  let seed = 42;
  const math = Object.create(Math);
  math.random = () => ((seed = (1664525 * seed + 1013904223) >>> 0) / 2 ** 32);
  const ctx = vm.createContext({ window: {}, Math: math, sessionStorage: storage, localStorage: storage });
  for (const name of ['data', 'data-k2', 'data-k3', 'data-mehr', 'data-spiel', 'data-bau', 'data-klasse', 'data-vielfalt', 'gemeinsam']) {
    vm.runInContext(fs.readFileSync(path.join(root, 'js', name + '.js'), 'utf8'), ctx);
  }
  return ctx.window.ZI;
}
const names = ['STUMPF_SCHARF', 'ERZ_SCHLACKE', 'WEIL_DENN', 'FEHLERJAGD', 'BEISPIELE', 'PUZZLE',
  'MOTOR_BREMSE', 'HOEREN', 'KETTEN', 'TEIL_ERKENNEN', 'JA_UND', 'ZUHOEREN', 'INSELRAT',
  'GEGENARGUMENTE', 'SITUATIONEN', 'STAERKER', 'VERBESSERN', 'DAFUER_DAGEGEN', 'BREMSE_MOTOR',
  'BEGRUENDET_RUNDEN', 'STAERKER_BELEGT', 'ABWAEGEN', 'ERZ_BELEGT', 'AMBOSS_BELEGT',
  'MOTOR_BELEGT', 'GEGEN_BELEGT', 'ZUHOEREN_BELEGT', 'INSELRAT_ABWAEGEN'];
function choices(value, result = []) {
  if (!value || typeof value !== 'object') return result;
  if (Array.isArray(value) && value.length > 1 && value.every((x) => typeof x?.text === 'string' && typeof x.ok === 'boolean')) result.push(value);
  else for (const child of Object.values(value)) choices(child, result);
  return result;
}

test('jeder Aufgabentyp hat mindestens 30 eindeutige Varianten und gültige Antworten', () => {
  const z = bank();
  for (const name of names) {
    assert.ok(z[name].length >= 30, name);
    assert.equal(new Set(z[name].map((x) => x.id)).size, z[name].length, name + ': doppelte ID');
    for (const set of choices(z[name])) {
      assert.equal(new Set(set.map((x) => x.text.trim())).size, set.length, name + ': doppelte Antwort');
      assert.ok(set.some((x) => x.ok) && set.some((x) => !x.ok), name);
    }
  }
  for (const u of z.BAU_UEBUNGEN.filter((x) => x.typ !== 'sortier')) assert.ok(u.items.length >= 30, u.id);
  for (const item of z.KETTEN) assert.equal(item.stuetzen.filter((x) => x.ok).length, 2);
});

test('Vorrat verhindert Wiederholung, auch beim Überqueren einer Mischgrenze und nach einem erneuten Aufruf', () => {
  const z = bank();
  let previous = new Set();
  const firstCycle = [];
  for (let i = 0; i < 25; i++) {
    const next = z.ziehen(z.STUMPF_SCHARF, 6).map((x) => x.id);
    assert.equal(new Set(next).size, 6);
    assert.ok(next.every((id) => !previous.has(id)));
    if (i < 5) firstCycle.push(...next);
    previous = new Set(next);
  }
  assert.equal(new Set(firstCycle).size, 30);
  // Ein anderer Pool mit denselben Fällen setzt unmittelbar danach andere Themen ein.
  const next = z.ziehen(z.STAERKER, 6).map((x) => x.id.split(':')[1]);
  assert.ok(next.every((id) => ![...previous].some((x) => x.split(':')[1] === id)));
  const seven = z.ziehen(z.PUZZLE, 7);
  const after = z.ziehen(z.PUZZLE, 7);
  assert.ok(after.every((x) => !seven.some((y) => y.id === x.id)));
  assert.equal(new Set(z.ziehen(z.JA_UND, 6).map((x) => x.vorher)).size, 6);
  assert.equal(z.ziehen([], 5).length, 0);
  assert.equal(z.ziehen(z.PUZZLE, 99).length, 30);
});

test('Neuladen desselben Tabs erhält den Vorrat, einschließlich ungleich großer Durchgänge', () => {
  const storage = new Map();
  let z = bank(storage);
  let previous = [];
  for (let i = 0; i < 20; i++) {
    const next = z.ziehen(z.PUZZLE, 7).map((x) => x.id);
    assert.equal(new Set(next).size, 7);
    assert.ok(next.every((id) => !previous.includes(id)));
    previous = next;
    z = bank(storage);
  }
});

test('Grammatiklösungen verwenden alle Bausteine und markieren das gebeugte Verb korrekt', () => {
  const z = bank();
  for (const item of z.WEIL_DENN) {
    for (const solution of item.loesungen) assert.equal([...solution].sort().join('|'), [...item.kacheln].sort().join('|'));
    const solution = item.loesungen[0];
    assert.equal(solution.indexOf(item.verb), item.bindewort === 'denn' ? 1 : solution.length - 1, item.haupt);
  }
  for (const item of z.FEHLERJAGD) assert.equal(item.saetze.filter((x) => x.ok).length, 1);
});

test('Satzbau erkennt natürliche Alternativen nach weil, denn und da an', () => {
  const z = bank();
  const accepts = (id, order) => z.WEIL_DENN.find((x) => x.id === id).loesungen.some((x) => x.join(' ') === order);
  for (const order of ['niemand mehr im Raum ist', 'im Raum niemand mehr ist']) {
    assert.ok(accepts('WEIL_DENN:umwelt', order));
  }
  for (const order of ['nach dem Sport ist sie leer', 'sie ist nach dem Sport leer']) {
    assert.ok(accepts('WEIL_DENN:trinken', order));
  }
  for (const order of ['das Tier jeden Tag Futter braucht', 'jeden Tag das Tier Futter braucht']) {
    assert.ok(accepts('WEIL_DENN:haustiere', order));
  }
  assert.ok(!accepts('WEIL_DENN:umwelt', 'ist niemand mehr im Raum'));
  assert.ok(!accepts('WEIL_DENN:trinken', 'sie nach dem Sport ist leer'));
  for (const it of z.WEIL_DENN) {
    const unique = new Set(it.loesungen.map((x) => x.join('|')));
    assert.equal(unique.size, it.loesungen.length, it.id);
    for (const order of it.loesungen) {
      assert.notEqual(z.mischenSatz(it.kacheln, it.loesungen).join('|'), order.join('|'), it.id);
    }
  }
});

test('inhaltliche Regressionen sind ersetzt, klare Alltagssätze bleiben erhalten', () => {
  const z = bank();
  const sport = z.PUZZLE.find((x) => x.id === 'PUZZLE:sport');
  assert.match(sport.begruendung, /mehr Kinder.*Stärken/);
  assert.match(sport.beispiel, /Sam.*Fangen.*langsam.*Zielwerfen/);
  const paper = z.WEIL_DENN.find((x) => x.id === 'WEIL_DENN:muell');
  assert.equal(paper.haupt, 'Wir sammeln Altpapier in einem eigenen Eimer,');
  assert.equal(paper.loesungen[0].join(' '), 'Essensreste würden das Papier verschmutzen');
  const invite = z.WEIL_DENN.find((x) => x.id === 'WEIL_DENN:klassenfest');
  assert.equal(invite.loesungen[0].join(' '), 'sie gern zeichnet');
  assert.equal(z.WEIL_DENN.find((x) => x.id === 'WEIL_DENN:trinken').haupt, 'Ravi füllt seine Flasche,');
  const gaps = z.bauUebung('huette2').items;
  assert.equal(gaps.find((x) => x.id === 'LUECKE:schulbeginn').kopf, 'Der Bus braucht lange, ___ geht Nora früher los.');
  assert.equal(gaps.find((x) => x.id === 'LUECKE:lesezeit').kopf, 'Maja möchte ihr Buch in Ruhe lesen, ___ setzt sie sich in die Leseecke.');
  const content = JSON.stringify(names.map((name) => z[name]).concat(z.BAU_UEBUNGEN));
  assert.doesNotMatch(content, /Ziel:|Kriterium:|Behauptung:|die Reste es verschmutzen|Wer langsam läuft, kann bei einer anderen Aufgabe trotzdem helfen/);
  const rounds = z.bauUebung('huette3').runden;
  assert.equal(new Set(rounds.map((r) => JSON.stringify(r.karten))).size, rounds.length);
});

test('Antwortlängen variieren natürlich, ohne die richtige Antwort immer gleich zu verraten', () => {
  const z = bank();
  for (const [name, values] of [...names.map((name) => [name, z[name]]), ...z.BAU_UEBUNGEN.map((u) => [u.id, u.items || []])]) {
    const sets = choices(values).filter((s) => s.filter((x) => x.ok).length === 1);
    let long = 0, short = 0;
    for (const set of sets) {
      const right = set.find((x) => x.ok).text.length;
      const wrong = set.filter((x) => !x.ok).map((x) => x.text.length);
      if (set.some((x) => x.text.length < 15)) continue;
      long += right > Math.max(...wrong);
      short += right < Math.min(...wrong);
    }
    if (sets.length >= 20) {
      // Flag a near-universal shortcut, never force individual sentences into a length band.
      assert.ok(long / sets.length < 0.9, name + ': fast immer längste Antwort');
      assert.ok(short / sets.length < 0.9, name + ': fast immer kürzeste Antwort');
    }
  }
});

test('Antwortpositionen werden unabhängig vom Aufgaben-Vorrat gemischt', () => {
  const z = bank();
  const positions = [0, 0, 0];
  for (let i = 0; i < 3000; i++) {
    const opts = z.mischen(z.STUMPF_SCHARF[i % 30].optionen);
    positions[opts.findIndex((x) => x.ok)]++;
  }
  assert.ok(positions.every((n) => n > 850 && n < 1150), positions.join('/'));
});

test('Zwergenrat teilt ausschließlich Pro/Contra zu und hält Dreier-/Vierergruppen ausgeglichen', () => {
  const z = bank();
  for (let n = 3; n <= 40; n++) for (let seed = 0; seed < 8; seed++) {
    const groups = z.stammesEinteilung(n, seed);
    assert.equal(JSON.stringify(groups), JSON.stringify(z.stammesEinteilung(n, seed)));
    const numbers = groups.flatMap((g) => g.mitglieder.map((m) => m.karte));
    assert.equal(new Set(numbers).size, n);
    for (const group of groups) {
      const members = z.mitSeiten(group, seed);
      for (const member of members) {
        assert.equal(Object.keys(member).sort().join('/'), 'karte/seite');
        assert.ok(['pro', 'contra'].includes(member.seite));
      }
      const pro = members.filter((m) => m.seite === 'pro').length;
      if (members.length === 4) assert.equal(pro, 2);
      if (members.length === 3) assert.ok(pro === 1 || pro === 2);
    }
  }
  assert.equal(z.RATS_REISE[7], 'Ergebnis melden');
});
