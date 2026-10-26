/* Gemeinsame Insel: die vorhandene Bühne mit automatischem Grammatik-Bauplan. */
(function(){
  const Z=window.ZI,{h,bild}=Z,KEY='zi-grammatik-insel',own=new URLSearchParams(location.search).has('eigen');
  const personal=Z.Stand.ausCode(Z.sitzung.lesen('zi-grammatik-aktiv',''));
  let board=readBoard(Z.speicher.lesen(KEY,null)),undo=null;
  function readBoard(raw){
    const out={version:1,klassengroesse:27,zwerge:{}};
    if(!raw||raw.version!==1)return out;
    if(Number.isInteger(raw.klassengroesse)&&raw.klassengroesse>=1&&raw.klassengroesse<=32)out.klassengroesse=raw.klassengroesse;
    for(const code of Object.values(raw.zwerge||{})){const s=Z.Stand.ausCode(code);if(s?.id)out.zwerge[s.id]=s.code();}
    return out;
  }
  const btn=(label,action,attrs={})=>h('button',{class:'knopf',type:'button',onclick:action,...attrs},label);
  const save=()=>{if(!own)Z.speicher.schreiben(KEY,board);};
  const staende=()=>own?(personal?[personal]:[]):Object.values(board.zwerge).map(Z.Stand.ausCode).filter(Boolean);
  const material=()=>staende().reduce((n,s)=>n+s.coreTotal(),0);
  const welt=()=>own?(personal?Math.max(personal.coreTotal(),personal.welt):0):Math.floor(material()/board.klassengroesse);
  const gems=()=>staende().reduce((n,s)=>n+s.gems(),0);
  document.body.classList.add('insel-seite');
  const scene=Z.inselSzene(),screen=h('div',{class:'insel-screen g-island'}),tafel=h('aside',{class:'tafel pergament auf-pergament'});
  const title=h('h1',null,own?'Deine Zwergeninsel':'Unsere Grammatikinsel');let timer;
  title.addEventListener('pointerdown',()=>{timer=setTimeout(settings,5000);});['pointerup','pointerleave','pointercancel'].forEach(e=>title.addEventListener(e,()=>clearTimeout(timer)));title.addEventListener('contextmenu',e=>e.preventDefault());
  const nav=h('nav',{class:'insel-knoepfe'},h('a',{class:'knopf holz',href:'index.html'+(own?'?ort=halle':'')},'Zur Schmiede'),btn('Gebäude & Funktionen',gebaeude));
  if(!own)nav.append(btn('Lieferung eintragen',liefern),btn('Klassenfortschritt',ueberblick));
  if(own)nav.append(btn('Zum Dorfplatz',()=>location.href='index.html?ort=dorfplatz',{disabled:!personal||!Z.hatGebaeude(personal,'ratsplatz')}));
  screen.append(scene.el,h('div',{class:'insel-titel'},title,h('p',null,own?'Deine Grundstollen bauen die Insel auf.':'Jede Karte trägt gleich viel zum Wiederaufbau bei.')),tafel,nav);document.getElementById('app').append(screen);
  let vorher=new Set(),kompakt=true;
  function update(animate=false){
    const gebaut=Z.gebaute(welt());
    Z.GEBAEUDE.forEach(g=>{
      const el=scene.bauEls[g.id],ok=gebaut.includes(g.id);el.classList.toggle('gebaut',ok);el.classList.toggle('mit-rauch',ok);el.querySelector('.fertig').style.display=ok?'':'none';
      if(animate&&ok&&!vorher.has(g.id)){el.classList.remove('wird-gebaut');void el.offsetWidth;el.classList.add('wird-gebaut');staub(el);Z.meldung(g.name+' steht!');}
    });
    if(animate&&gebaut.includes('festhalle')&&!vorher.has('festhalle'))Z.feuerwerk(3000);
    vorher=new Set(gebaut);
    const figures=own&&personal?Z.ZWERGE.filter(z=>personal.zwergFrei(z.nr)):staende().map(s=>Z.ZWERGE.find(z=>z.nr===s.zwerg));
    Z.setze(scene.zwergSchicht,...figures.map((z,i)=>h('div',{class:'mini-zwerg',style:{left:(24+(i%8)*7)+'%',top:(56+Math.floor(i/8)*8)+'%'}},bild(z.datei,z.name))));
    Z.setze(scene.schmuckSchicht,...Z.SCHMUCK.slice(0,Math.floor(gems()/Z.SCHMUCK_PRO)).map(s=>h('div',{class:'schmuck',style:{left:s.x+'%',top:s.y+'%',width:s.w+'%'}},bild(s.id,s.name))));
    const next=Z.BAU.find(b=>b.ab>welt()),n=own?1:board.klassengroesse;
    tafel.classList.toggle('kompakt',kompakt);
    if(kompakt){Z.setze(tafel,btn('Baustand · '+material()+' / '+(11*n),()=>{kompakt=false;update();}));save();return;}
    Z.setze(tafel,btn('Tafel einklappen',()=>{kompakt=true;update();},{class:'knopf holz'}),h('h2',null,'Wiederaufbau'),h('div',{class:'zahl'},material()+' / '+(11*n)),h('p',null,'Baumaterial · '+gems()+' Edelsteine'),h('progress',{max:11*n,value:material(),'aria-label':'Baufortschritt'}),
      h('p',null,next?`Als Nächstes: ${Z.GEBAEUDE.find(g=>g.id===next.id).name} · noch ${Math.max(0,next.ab*n-material())} Material`:'Die Festhalle steht. Zeit für das Inselfest!'),
      !own?btn('Inselbotschaft zeigen',()=>dialog([h('h2',null,'Botschaft für eure iPads'),h('p',null,'Einmal in der Schmiede eingeben. Der Code öffnet Gebäude und Stollen.'),h('strong',{class:'g-code'},Z.botschaft.kodiere(welt()))])):null);
    save();
  }
  function staub(el){const r=el.getBoundingClientRect(),b=scene.el.getBoundingClientRect();for(let i=0;i<16;i++){const sp=h('span',{class:'staub',style:{left:r.left-b.left+r.width/2+'px',top:r.top-b.top+r.height*.75+'px'}});const a=Math.random()*Math.PI*2;sp.style.setProperty('--dx',Math.cos(a)*90+'px');sp.style.setProperty('--dy',Math.sin(a)*40-20+'px');scene.el.append(sp);setTimeout(()=>sp.remove(),1200);}}
  function dialog(contents){let f;f=Z.fenster([...contents,btn('Schließen',()=>f.schliessen())]);return f;}
  function gebaeude(){
    dialog([h('h2',null,'Gebäude und Freischaltungen'),h('div',{class:'g-building-list'},...Z.BAU.map(b=>{
      const g=Z.GEBAEUDE.find(g=>g.id===b.id),ok=welt()>=b.ab;
      let route=b.id==='bibliothek'?'buch':['ratsplatz','festhalle'].includes(b.id)?'dorfplatz':b.id.startsWith('huette')?'sammlung':'halle';
      return h('article',{class:ok?'':'g-locked'},bild(g.id,g.name,'g-icon'),h('div',null,h('h3',null,g.name+(ok?' ✓':'')),h('p',null,b.funktion),h('small',null,`Baustufe ${b.ab} · ${own?b.ab:b.ab*board.klassengroesse} Material`)),own&&ok?btn('Besuchen',()=>location.href='index.html?ort='+route):null);
    }))]);
  }
  function liefern(){
    const field=h('input',{'aria-label':'Grammatikpass',placeholder:'G1-XXXX-XXXX-XXXX',autocapitalize:'characters',autocomplete:'off',autocorrect:'off',spellcheck:'false'}),feedback=h('p',{role:'status'});
    const form=h('form',{onsubmit:e=>{
      e.preventDefault();const s=Z.Stand.ausCode(field.value);if(!s?.id){feedback.textContent='Prüfe den ganzen Grammatikpass mit G1 und der Kartennummer.';return;}
      const alt=Z.Stand.ausCode(board.zwerge[s.id]);undo=JSON.stringify(board);const merged=alt?Z.Stand.zusammen(alt,s):s;board.zwerge[s.id]=merged.code();update(true);
      feedback.textContent=`Karte ${s.id}: ${merged.coreTotal()} Grundstollen geliefert. `+(alt&&alt.coreTotal()===merged.coreTotal()?'Kein doppeltes Baumaterial.':'Danke für die Lieferung!');field.value='';
    }},field,btn('Liefern',()=>form.requestSubmit()),feedback);
    dialog([h('h2',null,'Lieferung eintragen'),h('p',null,'Den vollständigen G1-Zwergenpass übernehmen. Wiederholte Lieferungen zählen keine Materialien doppelt.'),form,btn('Letzte Lieferung zurücknehmen',()=>{if(!undo){feedback.textContent='Keine Lieferung zum Zurücknehmen.';return;}board=readBoard(JSON.parse(undo));undo=null;update();feedback.textContent='Letzte Lieferung zurückgenommen.';})]);
  }
  function ueberblick(){
    dialog([h('h2',null,`Klassenfortschritt · ${staende().length}/${board.klassengroesse} Karten`),h('div',{class:'g-building-list'},...Z.STOLLEN.map(s=>h('p',null,s.name+': '+staende().filter(p=>p.t[s.index]>=1).length+' Grundstufen · '+staende().filter(p=>p.t[s.index]===5).length+' Kronen'))),h('p',null,'Noch ohne Lieferung: '+Array.from({length:board.klassengroesse},(_,i)=>i+1).filter(n=>!board.zwerge[n]).join(', '))]);
  }
  function settings(){
    if(own)return;
    const count=h('input',{type:'number',min:1,max:32,value:board.klassengroesse,'aria-label':'Klassengröße'}),feedback=h('p',{role:'status'});
    const upload=h('input',{type:'file',accept:'application/json','aria-label':'Inselsicherung auswählen',onchange:async()=>{
      try{const raw=JSON.parse(await upload.files[0].text());if(raw.version!==1||!Number.isInteger(raw.klassengroesse)||raw.klassengroesse<1||raw.klassengroesse>32||!raw.zwerge||Array.isArray(raw.zwerge)||typeof raw.zwerge!=='object'||Object.values(raw.zwerge).some(code=>!Z.Stand.ausCode(code)?.id))throw Error();
        const f=dialog([h('h2',null,'Diese Sicherung laden?'),h('p',null,Object.keys(raw.zwerge).length+' Karten · Klasse mit '+raw.klassengroesse+' Kindern'),btn('Sicherung übernehmen',()=>{undo=JSON.stringify(board);board=readBoard(raw);update();f.schliessen();feedback.textContent='Sicherung geladen.';})]);
      }catch(e){feedback.textContent='Diese Datei ist keine gültige Grammatikinsel-Sicherung.';}
    }});
    dialog([h('h2',null,'Lehrkraft · Inselverwaltung'),h('label',null,'Klassengröße',count),btn('Klassengröße übernehmen',()=>{const n=Number(count.value);if(!Number.isInteger(n)||n<1||n>32){feedback.textContent='Bitte 1 bis 32 eingeben.';return;}board.klassengroesse=n;update();feedback.textContent='Klassengröße gespeichert.';}),
      btn('Insel sichern',()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(board,null,2)],{type:'application/json'}));const a=h('a',{href:url,download:'grammatikinsel.json'});a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}),h('label',null,'Sicherung laden',upload),feedback]);
  }
  if('serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost')){navigator.serviceWorker.register('sw.js').catch(()=>{});Z.vorladen(true);}
  update();
})();
