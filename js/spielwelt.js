/* Visuelle Bausteine aus der ursprünglichen Zwergeninsel (5cd126d).
   Bühne, Amboss, Hammer und Figureninszenierung unverändert; ohne Audio. */
(function(){
  const ZI=window.ZI, Z=ZI, {h,bild,icon}=ZI;
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
        ZI.setze(ws, bild(datei, 'Begleiter'));
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


  Z.weltBuehne=buehne;
  Z.vollbildKnopf=function(){
    if(!document.documentElement.requestFullscreen&&!document.documentElement.webkitRequestFullscreen)return null;
    const b=h('button',{class:'rund vollbild-knopf','aria-label':'Vollbild'},icon.vollbild());
    b.addEventListener('click',()=>{
      const el=document.documentElement,aktiv=document.fullscreenElement||document.webkitFullscreenElement;
      try{const p=aktiv?(document.exitFullscreen||document.webkitExitFullscreen).call(document):(el.requestFullscreen||el.webkitRequestFullscreen).call(el);p?.catch(()=>ZI.meldung('Vollbild ist auf diesem Gerät nicht verfügbar.'));}catch(e){ZI.meldung('Vollbild ist auf diesem Gerät nicht verfügbar.');}
    });return b;
  };
  Z.tiefeMedaille=function(n,an,extra=''){
    return h('span',{class:'tiefen-abzeichen'+(an?' an':'')+' '+extra,'aria-label':'Tiefe '+n+(an?' erreicht':'')},Z.bildOder('tiefe-'+n,'',null,'medaille-bild'),h('b',null,String(n)));
  };
  Z.tiefenLeiste=function(n,klein=false){
    return h('div',{class:'tiefen-leiste'+(klein?' klein':''),'aria-label':'Tiefste Stufe: '+n+' von 5'},...Array.from({length:5},(_,i)=>Z.tiefeMedaille(i+1,i<n)),h('span',{class:'tiefen-abzeichen krone'+(n>=5?' an':''),'aria-label':'Stollenkrone'},bild('tiefe-krone','')));
  };
  Z.demoDarstellung=function(q,phase){
    const el=h('div',{class:'vormach-liste demo-beispiel','aria-label':'Vorgemachtes Beispiel'});
    if(q.context)el.append(h('p',{class:'g-context'},q.context));
    if(q.fields){q.fields.forEach(f=>el.append(h('div',{class:'vormach-zeile'+(phase>=4?' gut':'')},Z.feldLabel(q,f)+': ',phase>=4?f.solutions.join(' / '):'…')));
    }else if(q.tokens){
      el.append(h('div',{class:'demo-satz'},...q.tokens.map((word,i)=>h('span',{class:phase>=2&&q.answer.includes(i)?(phase>=4?(q.type==='repair'?'demo-fehler':'demo-richtig'):'demo-fokus'):''},phase>=4?word:Z.wortAnzeige(q,i)))));
      if(q.type==='repair'&&phase>=4)el.append(h('div',{class:'vormach-zeile gut'},q.solutions[0]));
    }else if(q.type==='choice'){
      const wrong=q.options.find(a=>!(q.acceptedAnswers||[q.answer]).includes(a));
      q.options.forEach(option=>el.append(h('div',{class:'vormach-zeile'+(phase>=4&&(q.acceptedAnswers||[q.answer]).includes(option)?' gut':phase===2&&option===wrong?' schlecht':'')},option,phase>=4&&(q.acceptedAnswers||[q.answer]).includes(option)?icon.haken():null)));
    }else if(q.items){
      q.items.forEach((item,i)=>el.append(h('div',{class:'vormach-zeile'+(phase===2&&i===0?' demo-fokus':'')+(phase>=4?' gut':'')},h('span',null,item),phase>=4?h('b',null,q.answer[i]):null)));
    }else if(q.type==='order'){
      const indices=phase>=4?q.answers[0]:q.parts.map((_,i)=>i).reverse();
      el.append(h('div',{class:'demo-satz'+(phase>=4?' demo-richtig':phase===2?' demo-fokus':'')},...indices.map((i,pos)=>h('span',null,phase>=4&&pos===0?q.parts[i][0].toUpperCase()+q.parts[i].slice(1):phase>=4&&q.lowercaseParts?.includes(i)?q.parts[i][0].toLowerCase()+q.parts[i].slice(1):q.parts[i]))));
    }else el.append(h('div',{class:'vormach-zeile'+(phase>=4?' gut':phase===2?' demo-fokus':'')},phase>=4?q.solutions[0]:'…'));
    return el;
  };
})();
