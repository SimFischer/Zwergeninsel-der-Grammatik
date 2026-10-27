/* Bestehende Inselbühne, Gebäude, Tiere und Wolken. */
(function(){ const ZI=window.ZI; const {h,bild}=ZI;
ZI.inselSzene=function({vorschau=false}={}){
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
  const startGebaut=vorschau?ZI.gebaute(0):[];
  ZI.GEBAEUDE.slice().sort((a, b) => a.y - b.y).forEach((g) => {
    const amStartFertig=startGebaut.includes(g.id);
    const el = h('div', { class: 'bau'+(amStartFertig?' gebaut':''), 'data-building':g.id, style: { left: g.x + '%', top: g.y + '%', width: g.w + '%' } },
      h('div', { class: 'ruine' }, vorschau?h('span',{class:'ruinen-ersatz','aria-hidden':'true'}):null, g.id === 'schiff' ? null : ZI.bildOder(g.ruinenAsset, g.name + ' (Ruine)', null)),
      vorschau&&!amStartFertig?null:h('div', { class: 'fertig', style: { display: amStartFertig?'block':'none' } }, bild(g.fertigAsset, g.name)),
      RAUCH[g.id] ? h('div', { class: 'rauch', style: { left: RAUCH[g.id][0] + '%', top: RAUCH[g.id][1] + '%' }, 'aria-hidden': 'true' }, h('span'), h('span'), h('span')) : null);
    bauEls[g.id] = el;
    buehne.appendChild(el);
  });
  if(vorschau){buehne.classList.add('insel-start');buehne.setAttribute('role','img');buehne.setAttribute('aria-label','Unsere Insel zu Beginn des Wiederaufbaus, mit zerstörten Gebäuden');buehne.querySelectorAll('.ruine img').forEach(img=>{const fertig=()=>img.parentElement.classList.add('geladen');img.addEventListener('load',fertig,{once:true});if(img.complete&&img.naturalWidth)fertig();});return {el:buehne,bauEls};}
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


return {el:buehne,bauEls,zwergSchicht,schmuckSchicht}; }; })();
