/* Grammatik-Schmiede. Die bestehende Bildwelt, UI-Bausteine und Effekte bleiben erhalten. */
(function(){
  const Z=window.ZI,{h,bild}=Z,app=document.getElementById('app');
  const KEY='zi-grammatik-aktiv';let stand=null,K=0,test=Z.sitzung.lesen('zi-test',false),runde=null;
  const btn=(text,action,extra={})=>h('button',{class:'knopf',type:'button',onclick:action,...extra},text);
  const text=(tag,s,attrs={})=>h(tag,attrs,s);
  function save(){if(stand)Z.sitzung.schreiben(KEY,stand.code());}
  function shell(title,content,back=halle,bg='schmiede-hintergrund'){
    Z.setze(app,h('div',{class:'screen g-screen'},Z.hintergrund(bg,'hg-ersatz-schmiede','rgba(20,12,8,.48)'),
      h('header',{class:'g-header'},back?btn('← Zurück',back,{class:'knopf holz'}):null,h('div',null,text('h1',title),stand?text('p',`Karte ${stand.id} · ${stand.coreTotal()}/11 Baumaterial · ${stand.gems()} Edelsteine · ${stand.kronenTotal()} Kronen`):null)),
      h('main',{class:'g-main'},content)));
    window.scrollTo(0,0);
  }
  function hold(el,action){let timer;const stop=()=>clearTimeout(timer);el.addEventListener('pointerdown',()=>{timer=setTimeout(action,5000);});['pointerup','pointerleave','pointercancel'].forEach(e=>el.addEventListener(e,stop));el.addEventListener('contextmenu',e=>e.preventDefault());return el;}
  function start(){
    stand=null;const old=Z.Stand.ausCode(Z.sitzung.lesen(KEY,''));
    const title=hold(text('h2','Zwergeninsel',{class:'logo',tabindex:'0'}),lehrer);
    shell('Willkommen auf der Grammatikinsel',h('div',{class:'g-start pergament auf-pergament'},title,text('p','Grammatik entdecken – gemeinsam die Insel wiederaufbauen.'),
      old?btn('Weiterspielen · Karte '+old.id,()=>{stand=old;halle();}):null,
      btn('Neuer Zwerg',neu),btn('Zwergenpass eingeben',passEingabe)),null,'titel-hintergrund');
  }
  function neu(){
    const nr=h('select',{'aria-label':'Kartennummer'},...Array.from({length:32},(_,i)=>h('option',{value:i+1},'Karte '+(i+1))));
    let figur=1;const cards=Z.ZWERGE.filter(z=>z.start).map(z=>{
      const b=btn(z.name,()=>{figur=z.nr;cards.forEach(c=>c.classList.toggle('aktiv',c===b));},{class:'g-figur'+(z.nr===1?' aktiv':'')});b.prepend(bild(z.datei,z.name));return b;
    });
    shell('Wähle deinen Zwerg',h('section',{class:'g-card pergament auf-pergament'},text('p','Wähle die Nummer auf deiner Zwergenpass-Karte.'),nr,h('div',{class:'g-grid'},cards),btn('Zur Schmiede',()=>{stand=new Z.Stand({id:Number(nr.value),zwerg:figur});save();halle();})),start);
  }
  function codeForm(title,prompt,action,back=halle){
    const field=h('input',{'aria-label':prompt,type:'text',autocapitalize:'characters',autocorrect:'off',autocomplete:'off',spellcheck:'false',placeholder:'G1-XXXX-XXXX-XXXX'});
    const feedback=text('p','',{role:'status'});const form=h('form',{class:'g-card pergament auf-pergament',onsubmit:e=>{e.preventDefault();const error=action(field.value);if(error)feedback.textContent=error;}},text('label',prompt),field,btn('Übernehmen',()=>form.requestSubmit()),feedback);
    shell(title,form,back);
  }
  function passEingabe(){codeForm('Zwergenpass','Dein Grammatikpass',value=>{
    const s=Z.Stand.ausCode(value);if(!s)return 'Dieser Grammatikpass ist nicht gültig. Prüfe alle Zeichen und den Anfang G1. Alte Argumentationspässe bleiben getrennt.';
    if(!s.id)return 'Das ist eine Inselbotschaft. Wähle zuerst deine Karte.';
    stand=s;save();halle();
  },start);}
  function pass(){
    shell('Dein Zwergenpass',h('section',{class:'g-card pergament auf-pergament'},text('p','Schreibe diesen Code auf deine Karte. Er enthält deine elf Stollentiefen und deine Figur.'),text('strong',stand.code(),{class:'g-code'}),
      text('p','Gib für eine gemeinsame Lieferung diesen ganzen Pass am Insel-Board ein. Jede Karte zählt einmal; spätere Lieferungen ergänzen nur neue Fortschritte.'),
      btn('Zurück zur Schmiede',halle),btn('Fertig für heute',()=>{Z.sitzung.loeschen(KEY);Z.sitzung.loeschen('zi-aufgaben');Z.sitzung.loeschen('zi-test');test=false;stand=null;shell('Bis bald!',h('section',{class:'g-card pergament auf-pergament'},text('p','Dein Pass sichert deinen Fortschritt. Schließe jetzt den Tab.'),btn('Zum Start',start)),null);})),halle);
  }
  function halle(){
    runde=null;save();
    const z=Z.ZWERGE.find(z=>z.nr===stand.zwerg);
    const punkte=stand.t.reduce((n,t)=>n+t,0)+stand.kronenTotal();
    const rang=Z.RAENGE.filter(r=>punkte>=r.ab).slice(-1)[0];
    const menu=h('nav',{class:'g-actions'},btn('Meine Insel',()=>location.href='insel.html?eigen=1'),btn('Zwergenpass / Lieferung',pass),btn('Sprachzwerge & Abzeichen',sammlung),btn('Inselbotschaft',botschaft));
    if(Z.hatGebaeude(stand,'bibliothek'))menu.append(btn('Buch der Sprachzwerge',buch));
    if(Z.hatGebaeude(stand,'ratsplatz'))menu.append(btn('Dorfplatz',dorfplatz));
    const tabs=h('div',{class:'g-tabs'},...Z.KAPITEL.map((name,k)=>btn((k+1)+'. '+name,()=>{K=k;halle();},{class:'knopf'+(K===k?'':' holz'),'aria-pressed':String(K===k)})));
    const cards=Z.STOLLEN.filter(s=>s.kapitel===K).map(s=>{
      const frei=test||Z.stollenFrei(stand,s.index),done=stand.t[s.index];
      const depths=h('div',{class:'g-depths'},...Array.from({length:5},(_,j)=>{
        const n=j+1,open=frei&&(test||n<=done+1);
        return btn(String(n)+(n<=done?' ✓':''),()=>vorRunde(s.index,n),{disabled:!open,class:'g-depth'+(n<=done?' geschafft':''),'aria-label':s.name+': Tiefe '+n+(n<=done?' bestanden':'')});
      }));
      return h('article',{class:'g-card pergament auf-pergament'+(!frei?' g-locked':'')},h('div',{class:'g-card-head'},bild(done===5?'tiefe-krone':done?'tiefe-'+done:'stollen-tiefer','', 'g-icon'),text('h2',s.name)),
        text('p',frei?`Tiefe ${done}/5 · Grundstufe ${done?'geschafft':'offen'}`:`Öffnet mit ${Z.GEBAEUDE.find(g=>g.id===s.gebaeude).name}`),!frei&&s.index===10?text('p','Schaffe außerdem „Satzbau und Satzarten“, Tiefe 1.'):null,depths,
        text('small','1: Baumaterial · 2–4: freiwillig, Edelsteine · 5: Krone'));
    });
    shell('Die Grammatik-Schmiede',h('div',null,h('div',{class:'g-welcome'},bild(z.datei,z.name),text('p',`${z.name} begleitet dich · ${rang.name}. Jeder Stollen hat seine eigenen fünf Tiefen.`)),menu,test?text('p','Testmodus: alle Stollen und Tiefen sind zum Prüfen offen. Testleistungen werden nicht gespeichert.',{class:'g-test'}):null,tabs,h('div',{class:'g-grid'},cards)),start);
  }
  function vorRunde(i,tiefe){
    const s=Z.STOLLEN[i],ziel=Z.LERNZIELE[s.id][tiefe-1];
    shell(s.name+' · Tiefe '+tiefe,h('section',{class:'g-card pergament auf-pergament'},bild('meisterin-erklaert','Meisterin Hammerlind','g-mentor'),text('h2',ziel),text('p',Z.WISSEN[s.id][0]),text('p','Beispiel: '+Z.WISSEN[s.id][1]),
      text('p',`9 Aufgaben · etwa 7–10 Minuten · ${tiefe===5?8:7} richtige erste Antworten zum Bestehen. Nach einem Fehler kannst du mit Hilfe weiterüben.`),
      text('p',tiefe===1?'Diese Grundstufe liefert beim ersten Bestehen ein Baumaterial.':'Diese Tiefe ist freiwillig. Du bleibst beim selben Grammatikthema.'),btn('In den Stollen',()=>betreten(i,tiefe))));
  }
  /* Bestehende Ortswechsel-Animation mit derselben Figur und Bildwelt. */
  function betreten(i,tiefe){
    if(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)return begin(i,tiefe);
    const z=Z.ZWERGE.find(z=>z.nr===stand.zwerg);
    const overlay=h('div',{class:'uebergang ue-stollen',role:'status','aria-live':'polite'},
      h('div',{class:'ue-hg'},bild(['transition-stollen','stollen-hintergrund'],'')),h('div',{class:'ue-dunkel'}),
      h('div',{class:'ue-figuren'},h('div',{class:'ue-zwerg ue-eigen'},bild(z.datei,z.name))),h('div',{class:'ue-text'},'Abstieg in Tiefe '+tiefe+' · '+Z.STOLLEN[i].name));
    document.body.append(overlay);setTimeout(()=>{begin(i,tiefe);overlay.classList.add('aus');setTimeout(()=>overlay.remove(),400);},1200);
  }
  function begin(i,tiefe){
    if(!test&&(!Z.stollenFrei(stand,i)||tiefe>stand.t[i]+1))return halle();
    const s=Z.STOLLEN[i],pool=Z.POOLS[s.id][tiefe].filter(q=>q.type!=='repair'||test||Z.hatGebaeude(stand,'werkstatt'));
    runde={i,tiefe,pool:Z.ziehen(pool,Z.REGELN.aufgaben,s.id+'-'+tiefe),n:0,richtig:0,kombo:0,review:[],misch:false};
    frage();
  }
  function frage(){
    const r=runde;if(r.n>=r.pool.length)return ergebnis();
    const q=r.pool[r.n],engine=Z.aufgabeAnsicht(q);let versuche=0,hilfe=0,erledigt=false,weitergedrueckt=false;
    const feedback=text('p','Tippe deine Lösung an oder trage sie ein.',{role:'status','aria-live':'polite',class:'g-feedback'});
    const hint=text('p','',{role:'status',class:'g-hint'});
    const weiter=btn('Nächste Aufgabe',()=>{if(weitergedrueckt)return;weitergedrueckt=true;r.n++;frage();},{hidden:true});
    const pruefen=btn('Prüfen',()=>{
      if(erledigt)return;const a=engine.read(),ok=Z.ENGINES[q.type].check(q,a);
      if(versuche===0){if(ok){r.richtig++;r.kombo++;}else{r.kombo=0;r.review.push(q);}}
      versuche++;
      if(ok){erledigt=true;engine.disable();pruefen.disabled=true;help.disabled=true;feedback.textContent=(versuche===1?'Gut gelöst! ':'Jetzt stimmt es. ')+q.explanation;weiter.hidden=false;if(r.kombo>=3)Z.funken(engine.el,50,25,8);}
      else {feedback.textContent=Z.rueckmeldung(q,a);hilfe=Math.max(hilfe,Math.min(versuche,4));zeigeHilfe();if(versuche>=3)weiter.hidden=false;}
      score.textContent=`${r.richtig} richtige erste Antworten · Kombo ${r.kombo}`;
    });
    function zeigeHilfe(){hint.textContent=hilfe<=3?q.hints[hilfe-1]:'Lösungshilfe: '+Z.loesung(q);}
    const help=btn('Hilfe',()=>{hilfe=Math.min(4,hilfe+1);zeigeHilfe();});
    const score=text('p',`${r.richtig} richtige erste Antworten · Kombo ${r.kombo}`,{class:'g-small'});
    const skip=btn('Mit Lösung abschließen',()=>{
      if(erledigt)return;if(!versuche){r.review.push(q);r.kombo=0;}erledigt=true;engine.disable();pruefen.disabled=true;help.disabled=true;
      feedback.textContent='Lösung: '+Z.loesung(q)+'. '+q.explanation;weiter.hidden=false;skip.disabled=true;
    },{class:'knopf holz'});
    shell((r.misch?'Dorfplatz':Z.STOLLEN[r.i].name)+' · Aufgabe '+(r.n+1)+' / '+r.pool.length,h('article',{class:'g-card pergament auf-pergament g-question'},text('p',r.misch?'Gemischte Übung':`Tiefe ${r.tiefe} · ${Z.LERNZIELE[Z.STOLLEN[r.i].id][r.tiefe-1]}`,{class:'g-eyebrow'}),h('progress',{max:r.pool.length,value:r.n,'aria-label':'Rundenfortschritt'}),text('h2',q.prompt),engine.el,score,feedback,hint,h('div',{class:'g-actions'},pruefen,help,weiter,skip)),()=>{
      const f=Z.fenster([text('h2','Runde verlassen?'),text('p','Diese Runde wird dann nicht gewertet. Dein bisheriger Pass bleibt erhalten.'),btn('Weiterüben',()=>f.schliessen()),btn('Zur Schmiede',()=>{f.schliessen();halle();})]);
    },'stollen-hintergrund');
  }
  function ergebnis(){
    const r=runde,bestanden=r.richtig>=(r.tiefe===5?Z.REGELN.meister:Z.REGELN.bestehen),vor=stand.freieZwerge(),old=stand.t[r.i];let reward='';
    if(bestanden&&!test&&!r.misch){const neu=stand.abschliessen(r.i,r.tiefe);save();reward=neu?(r.tiefe===1?'Ein neues Baumaterial für die Insel!':r.tiefe===5?'Die Stollenkrone gehört dir!':`${Z.REGELN.edelsteine} neue Edelsteine!`):'Du hast die Tiefe erneut bestanden. Deine Belohnung ist bereits im Pass.';if(neu)Z.konfetti(45);}
    if(r.misch&&bestanden)reward='Gut wiederholt! Mischrunden bringen kein zusätzliches Baumaterial.';
    if(test)reward='Testmodus: Diese Runde verändert deinen Pass nicht.';
    const neu=stand.freieZwerge().filter(n=>!vor.includes(n));
    shell(bestanden?'Stollen geschafft!':'Weiterüben lohnt sich',h('section',{class:'g-card pergament auf-pergament'},bild(bestanden?(r.tiefe===5?'tiefe-krone':'meisterin-jubelt'):'meisterin-ermutigt','', 'g-mentor'),text('h2',`${r.richtig} von ${r.pool.length} richtig`),text('p',reward||'Nutze die Hilfen und probiere die Runde noch einmal.'),neu.length?text('p','Neue Sprachzwerge: '+neu.map(n=>Z.ZWERGE.find(z=>z.nr===n).name).join(', ')):null,
      r.review.length?h('details',null,text('summary','Diese Regeln noch einmal ansehen'),...r.review.map(q=>h('div',null,text('p',q.prompt),text('p',Z.loesung(q)),text('small',q.explanation)))):null,
      btn('Zur Schmiede',halle),!r.misch?btn('Noch eine Runde',()=>begin(r.i,r.tiefe)):btn('Zum Dorfplatz',dorfplatz)));
  }
  function buch(){
    if(!Z.hatGebaeude(stand,'bibliothek'))return halle();
    shell('Buch der Sprachzwerge',h('div',{class:'g-grid'},...Z.STOLLEN.map(s=>h('article',{class:'g-card pergament auf-pergament'},text('h2',s.name),text('p',Z.WISSEN[s.id][0]),text('p',Z.WISSEN[s.id][1])))));
  }
  function sammlung(){
    const awards=[['Erster Funke',stand.coreTotal()>=1,'abzeichen-funke'],...Z.KAPITEL.map((k,i)=>[k,stand.kapitelFertig(i),'abzeichen-k'+(i+1)]),['Tiefenforscher',stand.t.some(t=>t>=3),'tiefe-3'],['Kronensammler',stand.kronenTotal()>=3,'abzeichen-krone1']];
    shell('Sprachzwerge & Abzeichen',h('div',null,text('h2','Deine Abzeichen'),h('div',{class:'g-grid'},awards.map(([name,ok,image])=>h('article',{class:'g-card pergament auf-pergament'+(!ok?' g-locked':'')},bild(image,'','g-icon'),text('h3',name),text('p',ok?'Erhalten':'Noch nicht erreicht')))),text('h2','Die zwölf Sprachzwerge'),h('div',{class:'g-grid'},...Z.ZWERGE.map(z=>{
      const frei=stand.zwergFrei(z.nr);return h('article',{class:'g-card pergament auf-pergament'},bild(z.datei,z.name,'g-portrait'),text('h3',z.name),text('p',frei?'Zurück auf der Insel!':z.bedingung),btn(stand.zwerg===z.nr?'Dein Begleiter':'Mitnehmen',()=>{stand.zwerg=z.nr;save();sammlung();},{disabled:!frei}));
    }))));
  }
  function botschaft(){codeForm('Inselbotschaft','Code vom gemeinsamen Insel-Board',value=>{const welt=Z.botschaft.lese(value);if(welt===null)return 'Prüfe den Insel-Code vom Board.';stand.welt=Math.max(stand.welt,welt);save();halle();});}
  function dorfplatz(){
    if(!Z.hatGebaeude(stand,'ratsplatz'))return halle();
    shell('Dorfplatz',h('section',{class:'g-card pergament auf-pergament'},text('h2','Gemeinsam wiederholen'),text('p','Mischrunden wiederholen abgeschlossene Kapitel. Sie verändern den Materialstand nicht.'),...Z.KAPITEL.map((name,k)=>btn(name+' wiederholen',()=>misch(k),{disabled:!stand.kapitelFertig(k)})),Z.hatGebaeude(stand,'festhalle')?btn('Inselfest: große Mischrunde',()=>misch(null),{disabled:stand.coreTotal()<11}):null));
  }
  function misch(k){
    const pool=Z.STOLLEN.filter(s=>(k===null||s.kapitel===k)&&stand.t[s.index]>=1).flatMap(s=>Z.POOLS[s.id][1]);
    runde={i:0,tiefe:1,pool:Z.ziehen(pool,9,'misch-'+k),n:0,richtig:0,kombo:0,review:[],misch:true};frage();
  }
  function lehrer(){
    shell('Lehrkraftbereich',h('section',{class:'g-card pergament auf-pergament'},text('h2','Versteckter Lehrer- und Testzugang'),h('a',{class:'knopf',href:'insel.html'},'Gemeinsame Insel öffnen'),h('a',{class:'knopf',href:'karten.html'},'Passkarten drucken'),h('a',{class:'knopf',href:'lehrkraft.html'},'Hinweise zur Grammatikinsel'),btn(test?'Testmodus ausschalten':'Testmodus einschalten',()=>{test=!test;Z.sitzung.schreiben('zi-test',test);lehrer();}),text('p','Der Testmodus öffnet alle Stollen und Tiefen. Testleistungen werden nicht gespeichert.')),start);
  }
  if('serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost')){navigator.serviceWorker.register('sw.js').catch(()=>{});Z.vorladen(false);}
  const route=new URLSearchParams(location.search).get('ort');
  const saved=Z.Stand.ausCode(Z.sitzung.lesen(KEY,''));
  if(route&&saved){stand=saved;({buch,dorfplatz,sammlung,halle}[route]||halle)();}else start();
})();
