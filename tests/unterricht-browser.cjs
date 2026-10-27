const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),{chromium}=require('playwright');
(async()=>{
 const root=process.cwd(),shots=path.join(require('node:os').tmpdir(),'grammatik-unterricht');fs.mkdirSync(shots,{recursive:true});
 const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.woff':'font/woff'};
 const server=http.createServer((req,res)=>{let file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(file===root)file=path.join(root,'index.html');if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}fs.readFile(file,(e,b)=>{if(e){res.writeHead(404).end();return;}res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(b);});});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://localhost:'+server.address().port;let browser;const errors=[],missing=[];
 try{
  browser=await chromium.launch({headless:true,...(process.env.BROWSER_CHANNEL?{channel:process.env.BROWSER_CHANNEL}:{})});
  const c=await browser.newContext({viewport:{width:1024,height:768},hasTouch:true,reducedMotion:'reduce',serviceWorkers:'block'});
  c.on('page',p=>p.on('pageerror',e=>errors.push(e.message)));c.on('response',r=>{if(r.status()>=400)missing.push(r.url());});
  const p=await c.newPage();p.setDefaultTimeout(8000);
  const loaded=()=>p.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})));});
  const shot=async name=>{await loaded();await p.screenshot({path:path.join(shots,name+'.png'),fullPage:true});};
  await p.goto(base+'/insel.html');
  for(const size of [{width:1024,height:768},{width:1180,height:820}]){
   await p.setViewportSize(size);let anchors;
   for(let stage=0;stage<=11;stage++){
    await p.evaluate(stage=>{localStorage.setItem('zi-grammatik-insel',JSON.stringify({version:1,klassengroesse:1,zwerge:{},lieferungen:stage?{1:{id:1,zwerg:2,material:stage,schritte:0,kronen:0}}:{},tage:{}}));},stage);await p.reload();await loaded();
    const state=await p.evaluate(()=>{const panel=document.querySelector('.tafel').getBoundingClientRect(),nav=document.querySelector('.insel-knoepfe').getBoundingClientRect();return [...document.querySelectorAll('.insel-buehne .bau')].map(el=>{const img=el.querySelector(el.classList.contains('gebaut')?'.fertig img':'.ruine img'),r=img.getBoundingClientRect(),b=el.getBoundingClientRect(),overlap=a=>r.left<a.right&&r.right>a.left&&r.top<a.bottom&&r.bottom>a.top;return {id:el.dataset.building,built:el.classList.contains('gebaut'),asset:img.getAttribute('src'),valid:img.naturalWidth>0&&r.width>20&&r.height>10,inside:r.left>=-1&&r.top>=-1&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1,covered:overlap(panel)||overlap(nav),x:b.x+b.width/2,y:b.bottom};});});
    assert.equal(state.length,12);assert.equal(new Set(state.map(x=>x.id)).size,12);
    const plan=await p.evaluate(()=>ZI.BAU.map(b=>({id:b.id,ab:b.ab,ruin:ZI.BILD(b.ruinenAsset),done:ZI.BILD(b.fertigAsset)})));
    for(const b of plan){const el=state.find(e=>e.id===b.id);assert.ok(el.valid,b.id+' Bild');assert.ok(el.inside,b.id+' außerhalb des Bildschirms');assert.equal(el.covered,false,b.id+' von Oberfläche verdeckt');assert.equal(el.built,stage>=b.ab,b.id);assert.equal(el.asset,stage>=b.ab?b.done:b.ruin);}
    if(!anchors)anchors=state;else for(const el of state){const a=anchors.find(a=>a.id===el.id);assert.ok(Math.abs(a.x-el.x)<1&&Math.abs(a.y-el.y)<1,el.id+' Bauplatz wandert');}
    if(stage===0||stage===11)await shot('insel-'+size.width+'-stufe-'+stage);
    if(stage===0){assert.equal(await p.locator('.bau-rest').textContent(),'Noch 1 Material');await p.getByRole('button',{name:'Gebäude & Funktionen',exact:true}).click();assert.equal(await p.locator('.g-building-list [data-building]').count(),12);await p.getByRole('button',{name:'Schließen',exact:true}).click();}
   }
  }
  await p.evaluate(()=>{const board=JSON.parse(localStorage.getItem('zi-grammatik-insel'));board.klassengroesse=27;board.lieferungen={};localStorage.setItem('zi-grammatik-insel',JSON.stringify(board));});await p.reload();assert.equal(await p.locator('.bau-rest').textContent(),'Noch 27 Materialien');await p.getByRole('button',{name:'Gebäude & Funktionen',exact:true}).click();assert.ok(await p.getByText('Baustufe 2 · 54 Materialien insgesamt',{exact:true}).isVisible());await p.getByRole('button',{name:'Schließen',exact:true}).click();
  console.log('Insel: alle 12 Bauplätze in allen 12 Baustufen bei zwei iPad-Größen sichtbar; kein Versatz und keine verdeckten Gebäude.');
  await p.goto(base+'/index.html');await p.evaluate(()=>{ZI.sitzung.schreiben('zi-grammatik-aktiv',new ZI.Stand({id:1,zwerg:2,t:Array(11).fill(5)}).code());});await p.goto(base+'/index.html?ort=halle');await p.locator('.rang-knopf').click();assert.ok(await p.getByText('Du hast den höchsten Rang erreicht!',{exact:true}).isVisible());assert.equal(await p.locator('.rang-leiter .stufe.erreicht').count(),7);await shot('rang-hoechste-stufe');await p.getByRole('button',{name:'Schließen',exact:true}).click();await p.getByRole('button',{name:'Mein Fortschritt',exact:true}).click();assert.equal(await p.locator('[data-progress-stollen]').count(),11);assert.equal(await p.locator('.insel-buehne').count(),0);
  const oldBoard=await p.evaluate(()=>localStorage.getItem('zi-grammatik-insel'));await p.goto(base+'/insel.html?eigen=1');await p.waitForURL('**/index.html?ort=fortschritt');assert.equal(await p.evaluate(()=>localStorage.getItem('zi-grammatik-insel')),oldBoard);
  await p.evaluate(()=>{const {h}=ZI;const check=h('div',{id:'focus-check'},...ZI.fokusText('nah nahe a+b <img>',['nah','a+b','<img>']));document.body.append(check);});assert.equal(await p.locator('#focus-check strong').count(),3);assert.equal(await p.locator('#focus-check img').count(),0);await p.locator('#focus-check').evaluate(e=>e.remove());
  for(const [topic,d,word] of [['nomen',2,'Stuhl'],['verben',2,'trinken'],['adjektive',2,'nah'],['nomen',3,'Schaukel']]){
   await p.evaluate(({topic,d,word})=>{const q=ZI.POOLS[topic][d].find(q=>q.focusWords?.includes(word)),v=ZI.aufgabeAnsicht(q),card=ZI.h('article',{class:'pergament auf-pergament aufgabe',style:{maxWidth:'560px',margin:'20px'}},ZI.h('h2',null,q.prompt),v.el);document.getElementById('app').replaceChildren(card);}, {topic,d,word});
   assert.ok(await p.locator('.g-zielwort').count());assert.ok(await p.locator('.g-zielwort').evaluateAll(es=>es.every(e=>Number(getComputedStyle(e).fontWeight)>=700)));if(topic==='adjektive')await shot('zielwort-adjektiv');
  }
  await p.goto(base+'/karten.html');await loaded();assert.equal(await p.locator('.karte').count(),30);assert.equal(await p.locator('.passzeile').first().textContent(),'G2-______-______-______');assert.equal(await p.locator('.passzeile').count(),120);
  const cut=await p.locator('.karte').evaluateAll(cards=>cards.flatMap(card=>{const r=card.getBoundingClientRect();return [...card.children].filter(e=>{const b=e.getBoundingClientRect();return b.bottom>r.bottom+1||b.right>r.right+1;}).map(e=>e.className);}));assert.deepEqual(cut,[]);assert.equal(await p.locator('.passzeile').evaluateAll(es=>es.some(e=>e.scrollWidth>e.clientWidth+1)),false);await shot('passkarten');
  await p.goto(base+'/lehrkraft.html');await loaded();assert.equal(await p.locator('#bauten tr').count(),12);assert.equal(await p.locator('#zwerge li').count(),8);assert.equal(await p.locator('#passformat').textContent(),'G2-XXXXXX-XXXXXX-XXXXXX');await shot('spickzettel-bildschirm');
  await p.setViewportSize({width:703,height:1032});await p.emulateMedia({media:'print'});await loaded();await shot('spickzettel-druck');const height=await p.locator('#spick').evaluate(e=>e.getBoundingClientRect().height);console.log('Spickzettel Druckhöhe: '+Math.round(height)+' / 1032 px');assert.ok(height<=1032,'Spickzettel passt nicht auf eine A4-Seite');
  assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);console.log('Ränge, Fokuswörter, Passkarten, Navigation und einseitiger Lehrer-Spickzettel geprüft.');console.log('Vorschaubilder: '+shots);
 }finally{if(browser)await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
