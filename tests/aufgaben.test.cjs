/* Die früheren Argumentationsprüfungen sind durch Grammatik- und Infrastrukturprüfungen ersetzt. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function bank(){
 const data=new Map(),storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};
 const ctx=vm.createContext({window:{},sessionStorage:storage,localStorage:storage});
 for(const f of ['data','data-bau','data-grammatik','pass','gemeinsam','engines'])vm.runInContext(fs.readFileSync('js/'+f+'.js','utf8'),ctx);
 return ctx.window.ZI;
}
test('gemischter Aufgabenvorrat vermeidet Duplikate und zieht unverbrauchte Beispiele zuerst',()=>{
 const Z=bank(),pool=Z.POOLS.nomen[1],a=Z.ziehen(pool,9,'nomen-1'),b=Z.ziehen(pool,9,'nomen-1');
 assert.equal(a.length,9);assert.equal(new Set(a.map(q=>q.id)).size,9);assert.equal(new Set(b.map(q=>q.id)).size,9);
 assert.ok(b.slice(0,3).every(q=>!a.some(p=>p.id===q.id)));
});
test('vollständige mehrteilige Prädikate verlangen alle Verbteile und geben gezielte Hilfe',()=>{
 const Z=bank(),q=Z.POOLS.praedikat[5][0];assert.equal(q.answer.length,3);
 assert.equal(Z.ENGINES.groups.check(q,q.answer.slice(0,2)),false);assert.match(Z.rueckmeldung(q,q.answer.slice(0,2)),/fehlenden Wörter/);
 assert.equal(Z.ENGINES.groups.check(q,[...q.answer,0]),false);
});
test('Formenbildung wahrt Großschreibung; Endungen und Korrekturen sind konsistent',()=>{
 const Z=bank();for(const q of Z.POOLS.adjektive[3])assert.ok(!q.solutions[0].includes('leisee'));
 const q=Z.POOLS.nomen[2][0];assert.equal(Z.ENGINES.form.check(q,'  die   Hunde  '),true);assert.equal(Z.ENGINES.form.check(q,'die hunde'),false);
 const r=Z.POOLS.faelle[5][0];assert.equal(Z.ENGINES.repair.check(r,{mark:r.answer,text:r.solutions[0]}),true);assert.equal(Z.ENGINES.repair.check(r,{mark:[],text:r.solutions[0]}),false);
});
test('Satzbausteine akzeptieren mehrere zulässige Umstellungen',()=>{
 const Z=bank(),q=Z.POOLS.satzbau[2][0];assert.ok(q.answers.length>=3);
 for(const a of q.answers)assert.equal(Z.ENGINES.order.check(q,a),true);
 assert.equal(Z.ENGINES.order.check(q,[1,0,2,3]),false);
});
test('Service Worker und beide Einstiegsseiten referenzieren nur vorhandene Dateien',()=>{
 const ctx=vm.createContext({self:{addEventListener(){}}});vm.runInContext(fs.readFileSync('sw.js','utf8')+'\nglobalThis.files=KERN;',ctx);
 for(const p of ctx.files)assert.ok(fs.existsSync(p),'Offline-Datei fehlt: '+p);
 for(const html of ['index.html','insel.html']){
  const source=fs.readFileSync(html,'utf8');for(const match of source.matchAll(/(?:src|href)="((?:js|css|schrift)\/[^\"]+)"/g))assert.ok(fs.existsSync(match[1]),match[1]);
  assert.ok(!/data-k2|data-klasse|data-spiel/.test(source));
 }
});
test('freiwillige Tiefen und Weltfreischaltungen verändern keine fremden Grundkompetenzen',()=>{
 const Z=bank(),s=new Z.Stand({id:1,welt:11});assert.equal(s.coreTotal(),0);assert.equal(Z.stollenFrei(s,9),true);assert.equal(Z.stollenFrei(s,10),false);
 assert.equal(s.abschliessen(9,1),true);assert.equal(Z.stollenFrei(s,10),true);assert.equal(s.t[0],0);
});
