/* Gemeinsame Insel: die vorhandene Bühne mit automatischem Grammatik-Bauplan. */
(function(){
  const Z=window.ZI,{h,bild}=Z,KEY='zi-grammatik-insel',own=new URLSearchParams(location.search).has('eigen');
  const personal=Z.Stand.ausCode(Z.sitzung.lesen('zi-grammatik-aktiv',''));
  let board=readBoard(Z.speicher.lesen(KEY,null)),undo=null;
  function readBoard(raw){
    const out={version:1,klassengroesse:27,zwerge:{},lieferungen:{},tage:{}};
    if(!raw||raw.version!==1)return out;
    if(Number.isInteger(raw.klassengroesse)&&raw.klassengroesse>=1&&raw.klassengroesse<=32)out.klassengroesse=raw.klassengroesse;
    for(const code of Object.values(raw.zwerge||{})){const s=Z.Stand.ausCode(code);if(s?.id){out.zwerge[s.id]=s.code();out.lieferungen[s.id]=Z.lieferung.ausStand(s);}}
    for(const info of Object.values(raw.lieferungen||{}))if(info&&Z.lieferung.kodiere(info))out.lieferungen[info.id]=Z.lieferung.anwenden(out.lieferungen[info.id],info);
    for(const [id,tag] of Object.entries(raw.tage||{}))if(/^\d{4}-\d{2}-\d{2}$/.test(tag)&&out.lieferungen[id])out.tage[id]=tag;
    return out;
  }
  const btn=(label,action,attrs={})=>h('button',{class:'knopf',type:'button',onclick:action,...attrs},label);
  const save=()=>{if(!own)Z.speicher.schreiben(KEY,board);};
  const beitraege=()=>own?(personal?[Z.lieferung.ausStand(personal)]:[]):Object.values(board.lieferungen);
  const material=()=>beitraege().reduce((n,s)=>n+s.material,0);
  const welt=()=>own?(personal?Math.max(personal.coreTotal(),personal.welt):0):Math.floor(material()/board.klassengroesse);
  const gems=()=>beitraege().reduce((n,s)=>n+s.schritte*Z.REGELN.edelsteine,0);
  document.body.classList.add('insel-seite');
  const scene=Z.inselSzene(),screen=h('div',{class:'insel-screen g-island'}),tafel=h('aside',{class:'tafel pergament auf-pergament'});
  // Versteckter Zugang bleibt auf der freien Inselgrafik, ohne sichtbaren Admin-Knopf.
  let timer;
  const grund=scene.el.querySelector('.insel-grund');
  grund.addEventListener('pointerdown',()=>{clearTimeout(timer);timer=setTimeout(settings,5000);});
  ['pointerup','pointerleave','pointercancel'].forEach(e=>grund.addEventListener(e,()=>clearTimeout(timer)));
  grund.addEventListener('contextmenu',e=>e.preventDefault());
  const nav=h('nav',{class:'insel-knoepfe'},h('a',{class:'knopf holz',href:'index.html'+(own?'?ort=halle':'')},'Zur Schmiede'),btn('Gebäude & Funktionen',gebaeude));
  if(!own)nav.append(btn('Lieferung eintragen',liefern),btn('Klassenfortschritt',ueberblick));
  if(own)nav.append(btn('Zum Dorfplatz',()=>location.href='index.html?ort=dorfplatz',{disabled:!personal||!Z.hatGebaeude(personal,'ratsplatz')}));
  screen.append(scene.el,tafel,nav);document.getElementById('app').append(screen);
  let vorher=new Set(),kompakt=false;
  function update(animate=false){
    const gebaut=Z.gebaute(welt());
    Z.GEBAEUDE.forEach(g=>{
      const el=scene.bauEls[g.id],ok=gebaut.includes(g.id);el.classList.toggle('gebaut',ok);el.classList.toggle('mit-rauch',ok);el.querySelector('.fertig').style.display=ok?'':'none';
      if(animate&&ok&&!vorher.has(g.id)){el.classList.remove('wird-gebaut');void el.offsetWidth;el.classList.add('wird-gebaut');staub(el);Z.meldung(g.name+' steht!');}
    });
    if(animate&&gebaut.includes('festhalle')&&!vorher.has('festhalle'))Z.feuerwerk(3000);
    vorher=new Set(gebaut);
    const figures=own&&personal?Z.ZWERGE.filter(z=>personal.zwergFrei(z.nr)):beitraege().map(s=>Z.ZWERGE.find(z=>z.nr===s.zwerg));
    Z.setze(scene.zwergSchicht,...figures.map((z,i)=>h('div',{class:'mini-zwerg',style:{left:(24+(i%8)*7)+'%',top:(56+Math.floor(i/8)*8)+'%'}},bild(z.datei,z.name))));
    Z.setze(scene.schmuckSchicht,...Z.SCHMUCK.slice(0,Math.floor(gems()/Z.SCHMUCK_PRO)).map(s=>h('div',{class:'schmuck',style:{left:s.x+'%',top:s.y+'%',width:s.w+'%'}},bild(s.id,s.name))));
    const next=Z.BAU.find(b=>b.ab>welt()),n=own?1:board.klassengroesse;
    tafel.classList.toggle('kompakt',kompakt);
    if(next){
      const g=Z.GEBAEUDE.find(g=>g.id===next.id);
      const letzte=Math.max(0,...Z.BAU.filter(b=>b.ab<next.ab).map(b=>b.ab))*n;
      const ziel=next.ab*n,wert=Math.max(0,Math.min(ziel-letzte,material()-letzte));
      Z.setze(tafel,h('div',{class:'tafel-kopf'},h('h2',null,g.name),btn(kompakt?'▾':'▴',()=>{kompakt=!kompakt;update();},{class:'tafel-klapp','aria-label':kompakt?'Bauziel ausklappen':'Bauziel einklappen'})),
        !kompakt?h('div',{class:'bau-vorschau'},bild(g.id+'-ruine',g.name+' als Ruine'),h('span',{'aria-hidden':'true'},'→'),bild(g.id,g.name+' fertig')):null,
        h('strong',{class:'bau-rest'},'Noch '+Math.max(0,ziel-material())+' Material'),
        h('progress',{max:ziel-letzte,value:wert,'aria-label':'Fortschritt bis '+g.name}),
        !kompakt?h('small',null,next.funktion):null);
    }else Z.setze(tafel,bild('festhalle','Festhalle','fest-vorschau'),h('h2',null,'Zeit für das Inselfest!'));
    if(!own)Z.anhaengen(tafel, btn('Inselbotschaft',()=>dialog([bild('runenplatte','','runen-bild'),h('h2',null,'Botschaft für eure Zwerge'),h('strong',{class:'inselwort'},Z.botschaft.kodiere(welt())),h('p',null,'Diese sechs Buchstaben öffnen eure neuen Stollen.')])),!kompakt?h('div',{class:'zeile'},bild('edelstein',''),String(gems())+' Edelsteine'):null);

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
  // Bildschirmtastatur, vier Kästen und Klassenraster aus der ursprünglichen Insel.
  function liefern(){
    const ZEICHEN='23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let puffer='',fertig=false;
    const tag=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');};
    const kaesten=Array.from({length:4},()=>h('div',{class:'schein-kasten'}));
    const anzeige=h('div',{class:'schein-eingabe','aria-label':'Vierstelliger Lieferschein','aria-live':'polite'},...kaesten);
    const rueck=h('div',{class:'liefer-rueck',role:'status','aria-live':'polite'},'Tippt die vier Zeichen ein. Nach dem vierten Zeichen kommt die Lieferung an.');
    const raster=h('div',{class:'liefer-raster'}),zaehler=h('div',{class:'liefer-zaehler'});
    const tasten=h('div',{class:'schein-tasten'},...ZEICHEN.split('').map(c=>btn(c,()=>tippe(c),{class:'schein-taste','aria-label':'Zeichen '+c})),btn('⌫',()=>{puffer=puffer.slice(0,-1);zeigePuffer();},{class:'schein-taste breit','aria-label':'Löschen'}));
    function zeigePuffer(){kaesten.forEach((k,i)=>{k.textContent=puffer[i]||'';k.classList.toggle('voll',!!puffer[i]);});}
    function zeigeRaster(){
      Z.setze(raster,...Array.from({length:board.klassengroesse},(_,i)=>h('div',{class:'liefer-zelle'+(board.tage[i+1]===tag()?' da':board.lieferungen[i+1]?' frueher':''),'aria-label':'Karte '+(i+1)+(board.tage[i+1]===tag()?' heute geliefert':'')},String(i+1))));
      zaehler.textContent=Object.entries(board.tage).filter(([id,t])=>Number(id)<=board.klassengroesse&&t===tag()).length+' von '+board.klassengroesse+' Karten heute';
    }
    function tippe(c){
      c=String(c).toUpperCase();if(!ZEICHEN.includes(c))return;
      puffer+=c;zeigePuffer();if(puffer.length!==4)return;
      const code=puffer,info=Z.lieferung.lese(code);puffer='';
      if(!info){Z.setze(rueck,h('div',{class:'rueckmeldung schlecht'},'„'+code+'“ stimmt noch nicht. Lass dir die Zeichen noch einmal nennen.'));anzeige.classList.add('wackeln');zeigePuffer();return;}
      const alt=board.lieferungen[info.id],nach=Z.lieferung.anwenden(alt,info);
      undo=JSON.stringify(board);board.lieferungen[info.id]=nach;board.tage[info.id]=tag();save();
      const neuMaterial=nach.material-(alt?.material||0),neuGems=(nach.schritte-(alt?.schritte||0))*Z.REGELN.edelsteine,neuKronen=nach.kronen-(alt?.kronen||0);
      const z=Z.ZWERGE.find(z=>z.nr===info.zwerg);
      const fund=[neuMaterial?'+'+neuMaterial+' Material':null,neuGems?'+'+neuGems+' Edelsteine':null,neuKronen?'+'+neuKronen+' Stollenkronen':null].filter(Boolean).join(' · ');
      Z.setze(rueck,h('div',{class:'liefer-ok'},h('div',{class:'liefer-ok-bild'},bild(z.datei,z.name)),h('div',null,h('div',{class:'liefer-ok-titel'},'Karte '+info.id+' · '+z.name),h('strong',null,fund||'Schon angekommen – nichts doppelt gezählt.')),btn('Rückgängig',rueckgaengig,{class:'knopf holz klein'})));
      zeigePuffer();zeigeRaster();
    }
    function rueckgaengig(){if(!undo)return;board=readBoard(JSON.parse(undo));undo=null;save();zeigeRaster();Z.setze(rueck,h('div',null,'Letzte Lieferung zurückgenommen.'));}
    function taste(e){
      if(document.querySelectorAll('.fenster').length!==1||e.ctrlKey||e.metaKey||e.altKey)return;
      if(e.key==='Backspace'){e.preventDefault();puffer=puffer.slice(0,-1);zeigePuffer();}
      else if(e.key==='Escape'){e.preventDefault();schliessen();}
      else if(e.key.length===1&&ZEICHEN.includes(e.key.toUpperCase())){e.preventDefault();tippe(e.key);}
    }
    function paste(e){
      const value=e.clipboardData?.getData('text')||'';
      const codes=value.toUpperCase().trim().split(/\s+/);if(!codes.every(c=>c.length===4&&[...c].every(ch=>ZEICHEN.includes(ch))))return;
      e.preventDefault();puffer='';for(const code of codes)for(const c of code)tippe(c);
    }
    function schliessen(){if(fertig)return;fertig=true;document.removeEventListener('keydown',taste);document.removeEventListener('paste',paste);f.schliessen();update(true);}
    const f=Z.fenster([h('div',{class:'liefer-kopf'},h('h2',null,'Lieferungen'),zaehler),h('div',{class:'liefer-fenster'},h('div',{class:'liefer-links'},anzeige,rueck,tasten),h('div',{class:'liefer-rechts'},h('small',null,'Grün: heute angekommen'),raster)),btn('Fertig – Dorf bauen!',schliessen)]);
    f.el.classList.add('breit','liefer-dialog');document.addEventListener('keydown',taste);document.addEventListener('paste',paste);zeigeRaster();zeigePuffer();
  }
  function ueberblick(){
    dialog([h('h2',null,'Klassenfortschritt · '+beitraege().length+' Karten'),h('div',{class:'g-building-list'},...beitraege().sort((a,b)=>a.id-b.id).map(s=>h('p',null,'Karte '+s.id+': '+s.material+' Material · '+s.schritte*Z.REGELN.edelsteine+' Edelsteine · '+s.kronen+' Kronen'))),h('p',null,'Noch ohne Lieferung: '+Array.from({length:board.klassengroesse},(_,i)=>i+1).filter(n=>!board.lieferungen[n]).join(', '))]);
  }
  function settings(){
    if(own)return;
    const count=h('input',{type:'number',min:1,max:32,value:board.klassengroesse,'aria-label':'Klassengröße'}),feedback=h('p',{role:'status'});
    const upload=h('input',{type:'file',accept:'application/json','aria-label':'Inselsicherung auswählen',onchange:async()=>{
      try{const raw=JSON.parse(await upload.files[0].text());if(raw.version!==1||!Number.isInteger(raw.klassengroesse)||raw.klassengroesse<1||raw.klassengroesse>32||!raw.zwerge||Array.isArray(raw.zwerge)||typeof raw.zwerge!=='object'||Object.values(raw.zwerge).some(code=>!Z.Stand.ausCode(code)?.id)||(raw.lieferungen&&(!raw.lieferungen||Array.isArray(raw.lieferungen)||typeof raw.lieferungen!=='object'||Object.values(raw.lieferungen).some(info=>!info||!Z.lieferung.kodiere(info)))))throw Error();
        const f=dialog([h('h2',null,'Diese Sicherung laden?'),h('p',null,Object.keys(readBoard(raw).lieferungen).length+' Karten · Klasse mit '+raw.klassengroesse+' Kindern'),btn('Sicherung übernehmen',()=>{undo=JSON.stringify(board);board=readBoard(raw);update();f.schliessen();feedback.textContent='Sicherung geladen.';})]);
      }catch(e){feedback.textContent='Diese Datei ist keine gültige Grammatikinsel-Sicherung.';}
    }});
    dialog([h('h2',null,'Lehrkraft · Inselverwaltung'),h('label',null,'Klassengröße',count),btn('Klassengröße übernehmen',()=>{const n=Number(count.value);if(!Number.isInteger(n)||n<1||n>32){feedback.textContent='Bitte 1 bis 32 eingeben.';return;}board.klassengroesse=n;update();feedback.textContent='Klassengröße gespeichert.';}),
      btn('Insel sichern',()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(board,null,2)],{type:'application/json'}));const a=h('a',{href:url,download:'grammatikinsel.json'});a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}),h('label',null,'Sicherung laden',upload),feedback]);
  }
  if('serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost')){navigator.serviceWorker.register('sw.js').catch(()=>{});Z.vorladen(true);}
  update();
})();
