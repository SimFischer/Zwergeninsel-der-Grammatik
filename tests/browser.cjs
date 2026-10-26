const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{
 const root=process.cwd();const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.webmanifest':'application/manifest+json','.png':'image/png','.jpg':'image/jpeg','.woff':'font/woff'};
 const server=http.createServer((req,res)=>{let file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(file===root)file=path.join(root,'index.html');if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}fs.readFile(file,(e,b)=>{if(e){res.writeHead(404).end();return;}res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(b);});});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://localhost:'+server.address().port;
 let browser;const errors=[];
 try{
  console.log('Starte isolierten Testbrowser …');
  browser=await chromium.launch({timeout:20000,headless:true,...(process.env.BROWSER_CHANNEL?{channel:process.env.BROWSER_CHANNEL}:{})});
  const context=await browser.newContext({viewport:{width:1024,height:768},hasTouch:true,isMobile:true,reducedMotion:'reduce',serviceWorkers:'block'});
  console.log('Testbrowser läuft.');
  const page=await context.newPage();page.setDefaultTimeout(8000);page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/index.html');await page.getByRole('button',{name:'Neuer Zwerg',exact:true}).click();await page.getByRole('button',{name:'Zur Schmiede',exact:true}).click();
  assert.equal(await page.locator('.g-depth:not([disabled])').count(),3);
  await page.evaluate(()=>{const orig=ZI.aufgabeAnsicht;ZI.aufgabeAnsicht=q=>{window.testQuestion=q;return orig(q);};});
  async function answer(correct=true){
   await page.evaluate(correct=>{
    const q=window.testQuestion,el=document.querySelector('.g-engine');
    if(!correct)return;
    if(q.type==='choice'){[...el.querySelectorAll('button')].find(b=>b.textContent===q.answer).click();}
    else if(['mark','groups','repair'].includes(q.type)){
     const children=[...el.querySelector('.g-tokens').children];q.answer.forEach(i=>children[i].click());
     if(q.type==='repair')el.querySelector('textarea').value=q.solutions[0];
    }else if(['sort','match'].includes(q.type)){el.querySelectorAll('select').forEach((s,i)=>s.value=q.answer[i]);}
    else if(q.type==='order'){for(const i of q.answers[0]){[...el.querySelectorAll('.g-tokens button')].find(b=>b.textContent===q.parts[i]).click();}}
    else el.querySelector('input,textarea').value=q.solutions[0];
   },correct);
   await page.getByRole('button',{name:'Prüfen',exact:true}).evaluate(b=>b.click());
   if(!correct)await page.getByRole('button',{name:'Mit Lösung abschließen',exact:true}).evaluate(b=>b.click());
   await page.getByRole('button',{name:'Nächste Aufgabe',exact:true}).evaluate(b=>b.click());
  }
  async function round(index,depth,correctCount){
   const chapter=await page.evaluate(i=>ZI.STOLLEN[i].kapitel,index);
   await page.locator('.g-tabs button').nth(chapter).click();
   const chapterIndex=await page.evaluate(i=>ZI.STOLLEN.filter(s=>s.kapitel===ZI.STOLLEN[i].kapitel).findIndex(s=>s.index===i),index);
   await page.locator('.g-card').nth(chapterIndex).locator('.g-depth').nth(depth-1).click();
   await page.getByRole('button',{name:'In den Stollen',exact:true}).click();
   for(let j=0;j<9;j++)await answer(j<correctCount);
   await page.getByRole('button',{name:'Zur Schmiede',exact:true}).click();
  }
  for(let i=0;i<11;i++){await round(i,1,7);console.log('Grundstollen '+(i+1)+' geprüft.');}
  let saved=await page.evaluate(()=>ZI.Stand.ausCode(ZI.sitzung.lesen('zi-grammatik-aktiv','')));
  assert.equal(saved.t.filter(t=>t>=1).length,11);console.log('UI: alle elf Grundstollen mit 7/9 bestanden, gesamte Freischaltkette erreichbar.');
  await round(0,2,7);await round(0,3,7);await round(0,4,7);await round(0,5,7);
  assert.equal(await page.evaluate(()=>ZI.Stand.ausCode(ZI.sitzung.lesen('zi-grammatik-aktiv','')).t[0]),4);
  await round(0,5,8);
  const code=await page.evaluate(()=>ZI.sitzung.lesen('zi-grammatik-aktiv',''));
  assert.equal(await page.evaluate(()=>ZI.Stand.ausCode(ZI.sitzung.lesen('zi-grammatik-aktiv','')).kronenTotal()),1);
  await page.reload();await page.getByRole('button',{name:/Weiterspielen/}).click();assert.equal(await page.evaluate(()=>ZI.sitzung.lesen('zi-grammatik-aktiv','')),code);
  console.log('UI: Meisterstufe 7/9 abgelehnt, 8/9 bestanden; Pass nach Neuladen erhalten.');
  // Jede Beispielaufgabe durch die echte Engine rendern und deren Eingabewert prüfen.
  const rendered=await page.evaluate(()=>{
   let n=0;for(const pool of Object.values(ZI.POOLS))for(const qs of Object.values(pool))for(const q of qs){
    const v=ZI.aufgabeAnsicht(q),el=v.el;document.body.append(el);
    if(q.type==='choice')[...el.querySelectorAll('button')].find(b=>b.textContent===q.answer).click();
    else if(['mark','groups','repair'].includes(q.type)){const children=[...el.querySelector('.g-tokens').children];q.answer.forEach(i=>children[i].click());if(q.type==='repair')el.querySelector('textarea').value=q.solutions[0];}
    else if(['sort','match'].includes(q.type))el.querySelectorAll('select').forEach((s,i)=>s.value=q.answer[i]);
    else if(q.type==='order')for(const i of q.answers[0])[...el.querySelectorAll('.g-tokens button')].find(b=>b.textContent===q.parts[i]).click();
    else el.querySelector('input,textarea').value=q.solutions[0];
    if(!ZI.ENGINES[q.type].check(q,v.read()))throw Error('Engine-Eingabe '+q.id);v.disable();el.remove();n++;
   }return n;
  });assert.equal(rendered,660);console.log('UI: alle 660 vorläufigen Varianten in zehn Engines gerendert und bedient.');
  const over=await page.evaluate(()=>[...document.querySelectorAll('.g-main,.g-card')].some(e=>e.scrollWidth>e.clientWidth+2));assert.equal(over,false,'Kein horizontaler Überlauf bei 1024×768');
  await page.getByRole('button',{name:'Meine Insel',exact:true}).click();await page.waitForURL('**/insel.html?eigen=1');
  assert.equal(await page.locator('.bau.gebaut').count(),12);
  assert.equal(await page.locator('.bau.gebaut .fertig img').count(),12);
  fs.mkdirSync(path.join(require('node:os').tmpdir(),'grammatik-qa'),{recursive:true});
  await page.evaluate(()=>Promise.all([...document.images].map(i=>i.decode().catch(()=>{}))));
  await page.screenshot({path:path.join(require('node:os').tmpdir(),'grammatik-qa','insel.png')});
  await page.goto(base+'/insel.html');
  // Board-Einstellungen über den vorhandenen versteckten Langdruck.
  await page.getByRole('heading',{name:'Unsere Grammatikinsel'}).dispatchEvent('pointerdown');await page.waitForTimeout(5100);await page.getByRole('heading',{name:'Unsere Grammatikinsel'}).dispatchEvent('pointerup');
  await page.getByRole('spinbutton',{name:'Klassengröße',exact:true}).fill('1');await page.getByRole('button',{name:'Klassengröße übernehmen',exact:true}).click();await page.getByRole('button',{name:'Schließen',exact:true}).click();
  await page.getByRole('button',{name:'Lieferung eintragen',exact:true}).click();await page.getByRole('textbox',{name:'Grammatikpass',exact:true}).fill(code);await page.getByRole('button',{name:'Liefern',exact:true}).click();
  await page.getByRole('textbox',{name:'Grammatikpass',exact:true}).fill(code);await page.getByRole('button',{name:'Liefern',exact:true}).click();
  assert.ok(await page.getByText('Kein doppeltes Baumaterial.',{exact:false}).isVisible());
  await page.getByRole('button',{name:'Schließen',exact:true}).click();await page.reload();assert.equal(await page.locator('.bau.gebaut').count(),12);
  console.log('UI: persönliche Insel, verdeckte Verwaltung, Klassengröße und doppelte Lieferungen geprüft.');
  await page.goto(base+'/index.html');await page.getByRole('button',{name:/Weiterspielen/}).click();
  await page.evaluate(()=>Promise.all([...document.images].map(i=>i.decode().catch(()=>{}))));
  await page.screenshot({path:path.join(require('node:os').tmpdir(),'grammatik-qa','schmiede.png')});
  await page.getByRole('button',{name:'Zwergenpass / Lieferung',exact:true}).click();await page.getByRole('button',{name:'Fertig für heute',exact:true}).click();
  assert.equal(await page.evaluate(()=>sessionStorage.getItem('zi-grammatik-aktiv')),null);
  assert.deepEqual(errors,[],'Keine Browserfehler');console.log('UI: Abmelden löscht aktiven Schülerstand. Keine Browserfehler.');
  await page.getByRole('button',{name:'Zum Start',exact:true}).click();
  await page.locator('.logo').dispatchEvent('pointerdown');await page.waitForTimeout(5100);
  await page.getByRole('button',{name:'Testmodus einschalten',exact:true}).click();await page.getByRole('button',{name:'← Zurück',exact:true}).click();
  await page.getByRole('button',{name:'Neuer Zwerg',exact:true}).click();await page.getByRole('button',{name:'Zur Schmiede',exact:true}).click();
  await page.evaluate(()=>{const orig=ZI.aufgabeAnsicht;ZI.aufgabeAnsicht=q=>{window.testQuestion=q;return orig(q);};});
  const beforeTest=await page.evaluate(()=>ZI.sitzung.lesen('zi-grammatik-aktiv',''));
  await round(0,5,9);assert.equal(await page.evaluate(()=>ZI.sitzung.lesen('zi-grammatik-aktiv','')),beforeTest);
  console.log('UI: versteckter Testmodus öffnet Meistertiefe und speichert keine Testleistung.');
  // Echte Service-Worker-Installation und Offline-Neuladen in einem frischen Profil.
  const offline=await browser.newContext({viewport:{width:1024,height:768},serviceWorkers:'allow',reducedMotion:'reduce'});
  const op=await offline.newPage();op.on('pageerror',e=>errors.push(e.message));
  await op.goto(base+'/index.html');await op.evaluate(()=>navigator.serviceWorker.ready);
  await op.reload();await op.waitForFunction(()=>!!navigator.serviceWorker.controller);
  const cacheOk=await op.evaluate(async()=>{
    const sw=await fetch('sw.js').then(r=>r.text());const src=sw.match(/const KERN = (\[[\s\S]*?\]);/)[1];
    const paths=Function('return '+src)();for(const p of paths)if(!await caches.match(p))return false;return true;
  });assert.equal(cacheOk,true,'Alle Offline-Kerndateien gespeichert');
  await offline.setOffline(true);await op.reload();
  await op.getByRole('button',{name:'Neuer Zwerg',exact:true}).click();await op.getByRole('button',{name:'Zur Schmiede',exact:true}).click();
  assert.equal(await op.locator('.g-depth:not([disabled])').count(),3);
  await op.goto(base+'/insel.html');assert.equal(await op.locator('.bau.gebaut').count(),1);
  assert.deepEqual(errors,[]);await offline.close();console.log('Offline: Kern vollständig gespeichert; Schmiede und Insel ohne Netzwerk startfähig.');
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.locator('.g-tabs button').first().click();await page.locator('.g-card').first().locator('.g-depth').first().click();
  await page.getByRole('button',{name:'In den Stollen',exact:true}).click();
  await page.locator('.uebergang').waitFor({state:'visible'});await page.locator('.uebergang').waitFor({state:'detached'});
  assert.ok(await page.getByRole('heading',{name:/Aufgabe 1 \/ 9/}).isVisible());
  await page.evaluate(()=>Promise.all([...document.images].map(i=>i.decode().catch(()=>{}))));
  await page.screenshot({path:path.join(require('node:os').tmpdir(),'grammatik-qa','aufgabe.png')});
  assert.deepEqual(errors,[]);console.log('UI: vorhandene Ortswechsel-Animation ohne reduzierte Bewegung geprüft.');
 }finally{if(browser)await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
