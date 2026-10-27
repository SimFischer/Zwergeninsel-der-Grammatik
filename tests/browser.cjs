const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{
 const root=process.cwd(),shots=path.join(require('node:os').tmpdir(),'grammatik-atmosphaere');fs.mkdirSync(shots,{recursive:true});
 const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.webmanifest':'application/manifest+json','.png':'image/png','.jpg':'image/jpeg','.woff':'font/woff'};
 const server=http.createServer((req,res)=>{let file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(file===root)file=path.join(root,'index.html');if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}fs.readFile(file,(e,b)=>{if(e){res.writeHead(404).end();return;}res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(b);});});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://localhost:'+server.address().port;
 let browser,awardRevealed=false;const errors=[],audioRequests=[];
 try{
  browser=await chromium.launch({timeout:20000,headless:true,...(process.env.BROWSER_CHANNEL?{channel:process.env.BROWSER_CHANNEL}:{})});
  const context=await browser.newContext({viewport:{width:1024,height:768},hasTouch:true,isMobile:true,reducedMotion:'reduce',serviceWorkers:'block'});
  context.on('request',r=>{if(/\.(mp3|wav|ogg|m4a)(\?|$)/i.test(r.url()))audioRequests.push(r.url());});
  await context.addInitScript(()=>{
   window.audioStarts=0;
   for(const key of ['Audio','AudioContext','webkitAudioContext','SpeechSynthesisUtterance','MediaRecorder'])if(window[key])window[key]=new Proxy(window[key],{construct(target,args){window.audioStarts++;return Reflect.construct(target,args);}});
   if(window.speechSynthesis)window.speechSynthesis.speak=()=>window.audioStarts++;
   const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(){window.audioStarts++;return play.call(this);};
  });
  const page=await context.newPage();page.setDefaultTimeout(8000);page.on('pageerror',e=>errors.push(e.message));
  const click=name=>page.getByRole('button',{name,exact:true}).evaluate(b=>b.click());
  async function shot(name){await page.evaluate(()=>Promise.all([...document.images].map(i=>i.decode().catch(()=>{}))));await page.screenshot({path:path.join(shots,name+'.png')});}
  async function capture(){await page.evaluate(()=>{const orig=ZI.aufgabeAnsicht;ZI.aufgabeAnsicht=q=>{window.testQuestion=q;return orig(q);};const draw=ZI.rundeZiehen;ZI.rundeZiehen=(pool,name)=>{const round=draw(pool,name),q=pool.find(q=>q.type===window.forceType);return q?[q,...round.filter(p=>p.family!==q.family)].slice(0,9):round;};});}
  async function drain(){let n=0;while(await page.locator('.freischaltung-fenster').count()){assert.ok(n++<30);if(await page.locator('.freischaltung-fenster img[src*="abzeichen-funke"]').count())awardRevealed=true;await page.locator('.freischaltung-fenster').getByRole('button',{name:'Weiter',exact:true}).evaluate(b=>b.click());}}
  async function tutorial(){
   assert.equal(await page.locator('.vormach').count(),1);
   assert.equal(await page.locator('.vormach .runden-info[open]').count(),0);
   for(let i=0;i<5;i++)await page.locator('.vormach').getByRole('button',{name:'Weiter',exact:true}).evaluate(b=>b.click());
   assert.ok(await page.locator('.vormach .demo-richtig,.vormach .gut').count()>0);
   await click('Jetzt bist du dran!');
  }
  async function enter(i,d){
   const k=await page.evaluate(i=>ZI.STOLLEN[i].kapitel,i);await page.getByRole('tab').nth(k).evaluate(b=>b.click());
   await page.locator('[data-stollen="'+i+'"]').evaluate(b=>b.click());
   if(await page.locator('.stufen-wahl').count()){
    let depth=page.locator('.fenster [data-depth="'+d+'"]:visible').first();
    if(!await depth.count()){await page.locator('.tiefen-ueben summary').evaluate(b=>b.click());depth=page.locator('.fenster [data-depth="'+d+'"]:visible').first();}
    await depth.evaluate(b=>b.click());
   }
   await tutorial();
  }
  async function fill(){await page.evaluate(()=>{
   const q=window.testQuestion,el=document.querySelector('.g-engine');
   if(q.fields)q.fields.forEach((f,i)=>{const row=el.querySelector('[data-field-index="'+i+'"]'),control=row.querySelector('input,select');if(control)control.value=f.solutions[0];else [...row.querySelectorAll('button')].find(b=>b.textContent===f.solutions[0]).click();});
   else if(q.type==='choice')[...el.querySelectorAll('button')].find(b=>b.textContent===q.answer).click();
   else if(['mark','groups','repair'].includes(q.type)){const cs=[...el.querySelector('.g-tokens').children];q.answer.forEach(i=>cs[i].click());if(q.type==='repair')el.querySelector('textarea').value=q.solutions[0];}
   else if(['sort','match'].includes(q.type))el.querySelectorAll('select').forEach((s,i)=>s.value=q.answer[Number(s.dataset.itemIndex)]);
   else if(q.type==='order')for(const i of q.answers[0])[...el.querySelectorAll('.g-tokens button')].find(b=>b.textContent===q.parts[i]).click();
   else el.querySelector('input,textarea').value=q.solutions[0];
  });}
  async function answer(first=true){
   if(!first){await click('Prüfen');assert.equal(await page.getByRole('button',{name:'Nächste Aufgabe',exact:true,includeHidden:true}).isVisible(),false);}
   await fill();await click('Prüfen');assert.ok(await page.getByRole('button',{name:'Nächste Aufgabe',exact:true,includeHidden:true}).isVisible());await click('Nächste Aufgabe');
  }
  async function round(i,d,correct){
   await enter(i,d);for(let j=0;j<9;j++){if(i===8&&d===4&&j===1)await shot('vier-angaben');await answer(j<correct);}
   assert.equal(await page.locator('.geschafft-fenster').count(),1);
   if(i===0&&d===1&&await page.evaluate(()=>!ZI.sitzung.lesen('zi-test',false))){assert.match(await page.locator('.geschafft-fenster .gross-bild img').getAttribute('src'),/holz/);await shot('belohnung');}
   await page.locator('.geschafft-fenster').getByRole('button',{name:'Zurück zum Eingang',exact:true}).evaluate(b=>b.click());await drain();
  }
  await page.goto(base+'/index.html');await shot('start');await click('Neuer Zwerg');
  assert.equal(await page.locator('.karten-nr').count(),32);assert.equal(await page.locator('select').count(),0);await shot('karten');
  await page.getByRole('button',{name:'Karte 1',exact:true}).click();await click('Ja, das ist meine Nummer');
  assert.equal(await page.locator('.zwerg-karte').count(),12);assert.equal(await page.locator('.zwerg-karte:not(.gesperrt)').count(),4);
  await page.getByRole('button',{name:'Hilda, Schmiedin',exact:true}).click();await shot('zwerge');await click('Diesen Zwerg nehmen');
  assert.ok(await page.getByRole('heading',{name:'Willkommen auf der Insel!',exact:true}).isVisible());await page.waitForFunction(()=>[...document.querySelectorAll('.insel-start .ruine img')].length===12&&[...document.querySelectorAll('.insel-start .ruine img')].every(i=>i.complete&&i.naturalWidth>0));assert.equal(await page.locator('.insel-start .bau').count(),12);assert.equal(await page.locator('.insel-start .fertig').count(),await page.evaluate(()=>ZI.gebaute(0).length));assert.deepEqual(await page.locator('.insel-start .bau.gebaut .fertig img').evaluateAll(imgs=>imgs.map(i=>i.getAttribute('src'))),await page.evaluate(()=>ZI.gebaute(0).map(ZI.BILD)));assert.equal(await page.locator('.story-vorschau .platzhalter').count(),0);await shot('story');
  for(let i=0;i<3;i++)await click('Weiter');await click('Los geht’s!');
  assert.equal(await page.locator('.station[aria-disabled="false"]').count(),3);assert.ok(!/\bnull\b/.test(await page.locator('body').innerText()));await shot('halle');await capture();await page.getByRole('button',{name:'Abzeichen-Album öffnen',exact:true}).click();assert.equal(await page.locator('.medaille.gesperrt').count(),10);assert.equal(await page.locator('.medaille.gesperrt img').count(),0);assert.equal(await page.locator('.medaille.gesperrt .medaille-name').first().textContent(),'???');await shot('schaetze-gesperrt');await click('Zurück');
  // Eine ungelöste Aufgabe bleibt nach Fehlern UND nach der Lösungshilfe offen.
  await page.locator('[data-stollen="0"]').click();await shot('tutorial');await tutorial();
  const id=await page.locator('[data-question]').getAttribute('data-question');
  for(let j=0;j<4;j++){await click('Prüfen');assert.equal(await page.getByRole('button',{name:'Nächste Aufgabe',exact:true,includeHidden:true}).isVisible(),false);}
  await click('Hilfe');await page.getByRole('button',{name:'Nächste Aufgabe',exact:true,includeHidden:true}).evaluate(b=>b.click());assert.equal(await page.locator('[data-question]').getAttribute('data-question'),id);
  assert.equal(await page.getByRole('button',{name:'Mit Lösung abschließen',exact:true}).count(),0);
  await shot('hilfe');await fill();await click('Prüfen');await click('Nächste Aufgabe');assert.notEqual(await page.locator('[data-question]').getAttribute('data-question'),id);
  await page.getByRole('button',{name:'Zurück',exact:true}).click();await click('Zur Schmiede');
  console.log('UI: Originalauswahl, Story, sechs Tutorialschritte und kein Überspringen geprüft.');
  for(let i=0;i<11;i++){await round(i,1,7);if(i===0){assert.equal(awardRevealed,true);await page.getByRole('button',{name:'Abzeichen-Album öffnen',exact:true}).click();assert.equal(await page.locator('[data-award=funke].gold img').count(),1);assert.equal(await page.locator('[data-award=k1].gesperrt img').count(),0);await shot('schatz-entdeckt');await click('Zurück');}console.log('Grundstollen '+(i+1)+' samt Freischaltungen geprüft.');}
  assert.equal(await page.evaluate(()=>ZI.Stand.ausCode(ZI.sitzung.lesen('zi-grammatik-aktiv','')).coreTotal()),11);
  await round(0,2,7);await round(0,3,7);await round(0,4,7);await round(0,5,7);
  assert.equal(await page.evaluate(()=>ZI.Stand.ausCode(ZI.sitzung.lesen('zi-grammatik-aktiv','')).t[0]),4);
  await round(0,5,8);assert.equal(await page.evaluate(()=>ZI.Stand.ausCode(ZI.sitzung.lesen('zi-grammatik-aktiv','')).kronenTotal()),1);
  console.log('UI: Material, Edelsteine, Krone, Bestehensgrenzen und Erfolgsfenster geprüft.');
  const codes=await page.evaluate(()=>{const s=ZI.Stand.ausCode(ZI.sitzung.lesen('zi-grammatik-aktiv',''));return Array.from({length:27},(_,i)=>new ZI.Stand({id:i+1,zwerg:s.zwerg,t:s.t}).lieferCode());});
  await click('Lieferung');assert.match(await page.locator('[data-liefercode]').getAttribute('data-liefercode'),/^[A-Z2-9]{4}$/);await shot('lieferschein');
  await click('Auf der Insel angekommen');assert.equal(await page.evaluate(()=>ZI.Stand.ausCode(ZI.sitzung.lesen('zi-grammatik-aktiv','')).geliefert[0]),5);
  await click('Persönlichen Zwergenpass ansehen');const code=await page.locator('.langpass-code').textContent();assert.match(code,/^G2-/);
  await page.goto(base+'/index.html');await page.getByRole('button',{name:/Weiterspielen als/}).click();assert.equal(await page.evaluate(()=>ZI.sitzung.lesen('zi-grammatik-aktiv','')),code);
  for(const size of [{width:1024,height:768},{width:1180,height:820}]){await page.setViewportSize(size);assert.equal(await page.evaluate(()=>[...document.querySelectorAll('.halle-inhalt,.stollen,.leiste')].some(e=>e.scrollWidth>e.clientWidth+2)),false);}
  await page.setViewportSize({width:1024,height:768});await click('Meine Insel');await page.waitForURL('**/insel.html?eigen=1');assert.equal(await page.locator('.bau.gebaut').count(),12);await shot('insel-fertig');
  await page.goto(base+'/insel.html');assert.equal(await page.locator('h1').count(),0);assert.ok(await page.getByText('Noch 27 Material',{exact:true}).isVisible());assert.equal(await page.getByText('0 / 297',{exact:true}).count(),0);await shot('insel-bauziel');
  await page.locator('.insel-grund').dispatchEvent('pointerdown');await page.waitForTimeout(5100);await page.locator('.insel-grund').dispatchEvent('pointerup');
  await page.getByRole('spinbutton',{name:'Klassengröße',exact:true}).fill('27');await click('Klassengröße übernehmen');await click('Schließen');
  await click('Lieferung eintragen');await shot('board-lieferung');
  await page.keyboard.type(codes[0]);assert.ok(await page.getByText('Karte 1 · Hilda',{exact:true}).isVisible());
  await page.keyboard.type(codes[0]);assert.ok(await page.getByText('Schon angekommen – nichts doppelt gezählt.',{exact:true}).isVisible());
  for(const c of codes.slice(1))await page.keyboard.type(c);
  assert.equal(await page.locator('.liefer-zelle.da').count(),27);
  await click('Fertig – Dorf bauen!');assert.equal(await page.locator('.bau.gebaut').count(),12);
  await click('Inselbotschaft');const word=await page.locator('.inselwort').textContent();assert.match(word,/^[A-Z]{6}$/);await shot('inselbotschaft');await click('Schließen');await page.reload();assert.equal(await page.locator('.bau.gebaut').count(),12);
  assert.equal(await page.evaluate(()=>Object.keys(JSON.parse(localStorage.getItem('zi-grammatik-insel')).lieferungen).length),27);
  console.log('UI: nächstes Bauziel, kurze Serieneingabe, Tagesraster, Dubletten und Sechsbuchstaben-Botschaft geprüft.');
  await page.goto(base+'/index.html');await page.getByRole('button',{name:/Weiterspielen als/}).click();await click('Lieferung');await click('Fertig für heute');await click('Pass notiert – fertig für heute');assert.equal(await page.evaluate(()=>sessionStorage.getItem('zi-grammatik-aktiv')),null);
  // In jeder Engine gilt: selbst vier Fehler und eine offene Lösung schalten nicht weiter.
  const specs=await page.evaluate(()=>{const seen=new Set(),r=[];for(const s of ZI.STOLLEN)for(let d=1;d<=5;d++){for(const q of ZI.POOLS[s.id][d]){const type=q.type;if(!seen.has(type)){seen.add(type);r.push({i:s.index,d,type});}}}return r;});
  await page.evaluate(()=>{ZI.sitzung.schreiben('zi-test',true);ZI.sitzung.schreiben('zi-grammatik-aktiv',new ZI.Stand({id:1,welt:11}).code());});
  assert.equal(specs.length,10);
  for(const spec of specs){
   await page.goto(base+'/index.html?ort=halle');await capture();await page.evaluate(t=>window.forceType=t,spec.type);await enter(spec.i,spec.d);assert.equal(await page.evaluate(()=>testQuestion.type),spec.type);if(spec.type==='form')await shot('formtabelle');
   const qid=await page.locator('[data-question]').getAttribute('data-question');
   for(let j=0;j<4;j++)await click('Prüfen');await click('Hilfe');
   assert.equal(await page.getByRole('button',{name:'Nächste Aufgabe',exact:true,includeHidden:true}).isVisible(),false,spec.type);
   await page.getByRole('button',{name:'Nächste Aufgabe',exact:true,includeHidden:true}).evaluate(b=>b.click());assert.equal(await page.locator('[data-question]').getAttribute('data-question'),qid);
   await fill();await click('Prüfen');assert.equal(await page.getByRole('button',{name:'Nächste Aufgabe',exact:true,includeHidden:true}).isVisible(),true,spec.type);
  }
  console.log('UI: alle zehn Engines lassen ausschließlich selbst korrekt gelöste Aufgaben weiter.');
  const rendered=await page.evaluate(()=>{
   let n=0;for(const qs of Object.values(ZI.POOLS))for(const pool of Object.values(qs))for(const q of pool){
    const v=ZI.aufgabeAnsicht(q),el=v.el;document.body.append(el);
    if(q.fields)q.fields.forEach((f,i)=>{const row=el.querySelector('[data-field-index="'+i+'"]');if(!row.textContent.includes(ZI.feldLabel(q,f)))throw Error(q.id+' Beschriftung');});
    if(q.letterCase==='lower'&&[...el.querySelectorAll('.g-token')].some(b=>b.textContent!==b.textContent.toLowerCase()))throw Error(q.id+' Großschreibung verrät Lösung');
    if(q.degreeExample&&!el.querySelector('.g-example'))throw Error(q.id+' unabhängiges Beispiel fehlt');
    if(q.fields)q.fields.forEach((f,i)=>{const row=el.querySelector('[data-field-index="'+i+'"]'),control=row.querySelector('input,select');if(control)control.value=f.solutions[0];else [...row.querySelectorAll('button')].find(b=>b.textContent===f.solutions[0]).click();});
   else if(q.type==='choice')[...el.querySelectorAll('button')].find(b=>b.textContent===q.answer).click();
    else if(['mark','groups','repair'].includes(q.type)){const c=[...el.querySelector('.g-tokens').children];q.answer.forEach(i=>c[i].click());if(q.type==='repair')el.querySelector('textarea').value=q.solutions[0];}
    else if(['sort','match'].includes(q.type))el.querySelectorAll('select').forEach((s,i)=>s.value=q.answer[Number(s.dataset.itemIndex)]);
    else if(q.type==='order')for(const i of q.answers[0])[...el.querySelectorAll('.g-tokens button')].find(b=>b.textContent===q.parts[i]).click();
    else el.querySelector('input,textarea').value=q.solutions[0];
    if(!ZI.ENGINES[q.type].check(q,v.read()))throw Error(q.id);
    for(let phase=0;phase<6;phase++){const demo=ZI.demoDarstellung(q,phase);el.append(demo);demo.remove();}
    v.disable();el.remove();n++;
   }return n;
  });assert.equal(rendered,1980);
  for(let i=0;i<11;i++){
   for(const d of (i===8?[1,3,4,5]:[1,3,5])){await page.goto(base+'/index.html?ort=halle');await capture();await round(i,d,9);}
   console.log('Materialpools: Wiederholung und Tiefen 3/5 für Stollen '+(i+1)+' geprüft.');
  }
  // Vollständige Meisterrunde im Testmodus darf den Pass nicht verändern.
  await page.goto(base+'/index.html?ort=halle');await capture();const before=await page.evaluate(()=>ZI.sitzung.lesen('zi-grammatik-aktiv',''));await round(0,5,9);assert.equal(await page.evaluate(()=>ZI.sitzung.lesen('zi-grammatik-aktiv','')),before);
  await click('Inselbotschaft');await page.getByRole('textbox',{name:'Inselbotschaft',exact:true}).fill(word);await click('Runen lesen');await drain();assert.equal(await page.evaluate(()=>ZI.Stand.ausCode(ZI.sitzung.lesen('zi-grammatik-aktiv','')).coreTotal()),0);
  // Zufällige Antwort- und Zuordnungspositionen ohne Änderung der Lösungsindizes.
  await page.evaluate(()=>{const choice=ZI.POOLS.nomen[1].find(q=>q.type==='choice'),positions=new Set();for(let n=0;n<40;n++){const v=ZI.aufgabeAnsicht(choice);positions.add([...v.el.querySelectorAll('button')].findIndex(b=>b.textContent===choice.answer));}if(positions.size<3)throw Error('Antwortpositionen sind zu gleichförmig');const match=ZI.POOLS.verben[1].find(q=>q.type==='match'),orders=new Set();for(let n=0;n<30;n++)orders.add([...ZI.aufgabeAnsicht(match).el.querySelectorAll('select')].map(s=>s.dataset.itemIndex).join());if(orders.size<3)throw Error('Zuordnungen stehen immer gleich');});
  const broken=await browser.newContext({viewport:{width:1024,height:768},serviceWorkers:'block'}),bp=await broken.newPage();
  await bp.route(/\/bilder\/(insel-grund\.jpg|.*-ruine\.png)/,route=>route.abort());await bp.goto(base+'/index.html');
  await bp.evaluate(()=>{const box=document.createElement('div');box.className='story-vorschau';box.id='broken-preview';box.append(ZI.inselSzene({vorschau:true}).el,ZI.bild('interner-assetname-fehlt',''));document.body.append(box);});
  await bp.waitForSelector('#broken-preview .bild-ersatz');assert.equal(await bp.locator('#broken-preview .ruinen-ersatz').count(),12);assert.ok(!(await bp.locator('#broken-preview').innerText()).includes('interner-assetname'));await broken.close();
  // Echter Offlinebetrieb in einem frischen, kontrollierten Browserprofil.
  const offline=await browser.newContext({viewport:{width:1024,height:768},serviceWorkers:'allow',reducedMotion:'reduce'}),op=await offline.newPage();op.on('pageerror',e=>errors.push(e.message));
  await op.goto(base+'/index.html');await op.evaluate(()=>navigator.serviceWorker.ready);await op.reload();await op.waitForFunction(()=>!!navigator.serviceWorker.controller);
  assert.ok(await op.evaluate(async()=>!!await caches.match('js/spielwelt.js')));
  await offline.setOffline(true);await op.reload();assert.ok(await op.getByRole('button',{name:'Neuer Zwerg',exact:true}).isVisible());await op.getByRole('button',{name:'Neuer Zwerg',exact:true}).click();await op.getByRole('button',{name:'Karte 1',exact:true}).click();await op.getByRole('button',{name:'Ja, das ist meine Nummer',exact:true}).click();await op.getByRole('button',{name:'Hilda, Schmiedin',exact:true}).click();await op.getByRole('button',{name:'Diesen Zwerg nehmen',exact:true}).click();await op.waitForFunction(()=>[...document.querySelectorAll('.insel-start .ruine img')].length===12&&[...document.querySelectorAll('.insel-start .ruine img')].every(i=>i.complete&&i.naturalWidth>0));for(let n=0;n<4;n++){await op.waitForFunction(()=>[...document.querySelectorAll('.story-karte img')].every(i=>i.complete&&i.naturalWidth>0));if(n<3)await op.getByRole('button',{name:'Weiter',exact:true}).click();}await op.goto(base+'/insel.html');assert.equal(await op.locator('.bau.gebaut').count(),1);await offline.close();
  console.log('UI: 1980 Varianten samt Tutorials, Testmodus, Passbestätigung, Botschaft und Offlinebetrieb geprüft.');
  await page.emulateMedia({reducedMotion:'no-preference'});await capture();await enter(0,1);await page.locator('.uebergang').waitFor({state:'visible'});await page.locator('.uebergang').waitFor({state:'detached'});await shot('aufgabe');
  assert.equal(await page.evaluate(()=>window.audioStarts),0);assert.equal(await page.locator('audio,video').count(),0);assert.deepEqual(audioRequests,[]);assert.deepEqual(errors,[]);
  console.log('UI: Ruinenintro mit Bildausfällen und offline, Schatzsperren/Reveal, variable Markierungen, Satzlücken und Fachbegriffshilfen geprüft.');
  console.log('UI: ursprüngliche Stollenanimation, iPad-Querformat und Lautlosigkeit geprüft. Keine Browserfehler.');
  console.log('Vorschaubilder: '+shots);
 }finally{if(browser)await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
