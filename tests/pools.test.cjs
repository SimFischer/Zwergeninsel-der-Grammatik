const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const mem=new Map(),storage={getItem:k=>mem.get(k)||null,setItem:(k,v)=>mem.set(k,v),removeItem:k=>mem.delete(k)};
const ctx=vm.createContext({window:{},localStorage:storage,sessionStorage:storage});
for(const f of ['data','data-bau','data-grammatik','grammatik/wortschmiede','grammatik/satzwerkstatt','grammatik/satzbaumeister','pass','gemeinsam','engines'])vm.runInContext(fs.readFileSync('js/'+f+'.js','utf8'),ctx,{filename:f});
const Z=ctx.window.ZI,all=Object.values(Z.POOLS).flatMap(ds=>Object.values(ds).flat());
const answer=q=>q.fields?q.fields.map(f=>f.solutions[0]):q.type==='order'?q.answers[0]:q.type==='repair'?{mark:q.answer,text:q.solutions[0]}:q.solutions?q.solutions[0]:q.answer;
test('1980 Aufgaben: 36 je Tiefe, Quellen, eindeutige IDs, keine leeren Daten',()=>{
 assert.equal(all.length,1980);assert.equal(new Set(all.map(q=>q.id)).size,1980);
 for(const s of Z.STOLLEN)for(let d=1;d<=5;d++){
  const pool=Z.POOLS[s.id][d];assert.equal(pool.length,36);assert.equal(new Set(pool.map(q=>q.family)).size,12);
  assert.ok(new Set(pool.map(q=>q.type)).size>=2);
  for(const band of ['sicherung','kern','transfer'])assert.equal(pool.filter(q=>q.band===band).length,12);
  const unique=pool.map(q=>JSON.stringify([q.type,q.prompt,q.context,q.tokens,q.items,q.fields,q.parts,q.options]));assert.equal(new Set(unique).size,36,s.id+' '+d);
 }
 for(const q of all){
  assert.match(q.id,/^[A-Z]+_T[1-5]_[A-Z]+_A\d{2}_\d{3}$/);assert.ok(q.prompt);assert.ok(q.hints.every(h=>h.length>20));assert.ok(q.explanation);
  assert.ok(q.source.quellen.length);for(const source of q.source.quellen)assert.ok(Z.QUELLEN[source],source);
  assert.equal(Z.ENGINES[q.type].check(q,answer(q)),true,q.id);assert.doesNotMatch([q.prompt,q.context,...(q.tokens||[]),...q.hints].filter(Boolean).join(' '),/undefined|[{}]/,q.id);
 }
});
test('alle angebotenen Lösungen existieren, Mehrfachlösungen sind markiert und werden akzeptiert',()=>{
 for(const q of all){
  if(q.type==='choice'){
   const accepted=q.acceptedAnswers||[q.answer];assert.equal(new Set(q.options).size,q.options.length,q.id);
   assert.ok(q.options.some(o=>!accepted.includes(o)),q.id+' braucht einen fachlichen Distraktor');
   for(const a of accepted){assert.ok(q.options.includes(a),q.id);assert.equal(Z.ENGINES.choice.check(q,a),true,q.id);}
   if(accepted.length>1)assert.equal(q.multipleSolutions,true,q.id);
  }
  if(q.fields)for(let i=0;i<q.fields.length;i++){
   const f=q.fields[i];assert.ok(f.label&&f.solutions.length&&f.solutions.every(s=>s.length));
   if(f.options){assert.equal(new Set(f.options).size,f.options.length,q.id);for(const a of f.solutions)assert.ok(f.options.includes(a),q.id+' '+a);}
   for(const a of f.solutions){const r=answer(q);r[i]=a;assert.ok(Z.ENGINES[q.type].check(q,r),q.id+' '+a);}
   const wrong=answer(q);wrong[i]='???';assert.equal(Z.ENGINES[q.type].check(q,wrong),false,q.id+' einzelnes falsches Feld');
   if(f.solutions.length>1)assert.equal(q.multipleSolutions,true,q.id);
  }
  if(q.answers){if(q.answers.length>1)assert.equal(q.multipleSolutions,true,q.id);for(const a of q.answers)assert.equal(new Set(a).size,q.parts.length,q.id);}
  if(q.solutions?.length>1)assert.equal(q.multipleSolutions,true,q.id);
 }
});
test('jede Fehlerjagd nennt exakt die tatsächlich veränderten Wörter',()=>{
 for(const q of all.filter(q=>q.type==='repair')){
  assert.equal(q.answer.length,q.errorCount,q.id);assert.ok(q.prompt.includes(q.errorCount+' Wortfehler'));
  const correct=Z.G.tok(q.solutions[0]);assert.equal(correct.length,q.tokens.length,q.id);
  const changed=correct.flatMap((w,i)=>w!==q.tokens[i]?[i]:[]);assert.deepEqual(Array.from(q.answer),Array.from(changed),q.id);
  assert.equal(q.corrections.length,q.errorCount,q.id);
 }
});
test('Runden enthalten 3 Sicherungen, 4 Kernaufgaben, 2 Transfers und neun unterschiedliche Kontexte',()=>{
 for(const s of Z.STOLLEN)for(let d=1;d<=5;d++)for(let r=0;r<4;r++){
  const pool=Z.POOLS[s.id][d],demo=pool[0],round=Z.rundeZiehen(pool.filter(q=>q.family!==demo.family),s.id+'-'+d);
  assert.equal(round.length,9);assert.equal(new Set(round.map(q=>q.family)).size,9,s.id+' '+d);
  assert.ok(round.every(q=>q.family!==demo.family));assert.ok(new Set(round.map(q=>q.type)).size>=2);
  assert.deepEqual(['sicherung','kern','transfer'].map(b=>round.filter(q=>q.band===b).length),[3,4,2]);
 }
});
test('fachliche Grenzfälle: ganze Gruppen, Partizipien, Partikeln, Kasus und mehrere Lösungen',()=>{
 const predicates=Z.POOLS.praedikat[3];assert.ok(predicates.some(q=>q.type==='groups'&&q.answer.length===3));
 const particle=predicates.find(q=>q.items?.includes('auf'));assert.equal(particle.answer[particle.items.indexOf('auf')],'abgetrennte Verbpartikel');
 const participle=predicates.find(q=>q.items?.includes('gefunden'));assert.equal(participle.answer[participle.items.indexOf('gefunden')],'Partizip II (infinit)');
 const subject=Z.POOLS.subjekt[4].find(q=>q.tokens?.includes('roten'));assert.equal(subject.answer.length,7);
 const passive=Z.POOLS.subjekt[2].find(q=>q.tokens?.includes('abgepfiffen'));assert.equal(passive.answer.map(i=>passive.tokens[i]).join(' '),'das spannende Spiel');
 const declension=Z.POOLS.faelle[2].find(q=>q.fields?.some(f=>f.solutions.includes('des Schiffs')));assert.ok(declension.fields.some(f=>f.solutions.includes('des Schiffes')));
 assert.ok(Z.POOLS.adjektive[5].filter(q=>q.type==='transfer').every(q=>q.multipleSolutions));
 assert.ok(Z.POOLS.pronomen[1].some(q=>q.acceptedAnswers?.includes('Der Bezug ist unklar.')));
});

test('Formtabellen und Pronomenlücken nennen das zu bearbeitende Wort',()=>{
 for(const q of Z.POOLS.nomen[2].filter(q=>q.type==='form'))assert.ok(q.context?.startsWith('Nomen: '),q.id);
 for(const d of [2,5])for(const q of Z.POOLS.adjektive[d].filter(q=>q.type==='form'))assert.ok(q.context?.startsWith('Adjektiv: '),q.id);
 for(const q of Z.POOLS.pronomen[1].filter(q=>q.type==='gap'))assert.match(q.fields[0].label,/Ersatz für „.+“/,q.id);
});

test('Nomenformulare trennen Numerus und Artikel und fragen gegebene Formen nicht nochmals ab',()=>{
 for(const ds of [Z.POOLS.nomen])for(const pool of Object.values(ds))for(const q of pool.filter(q=>q.fields)){
  assert.ok(!q.fields.some(f=>/^Singular/.test(f.label)),q.id+' Einzahl ist bereits gegeben');
  for(const f of q.fields){
   if(/Plural/.test(f.label)){assert.ok(f.solutions.every(s=>s.startsWith('die ')),q.id+' vollständiger Plural');assert.ok(!/Singular/.test(f.label));}
   for(const solution of f.solutions)assert.ok(!(q.context||'').split(/\s*[–·:]\s*/).includes(solution),q.id+' kopierte Form');
  }
 }
 for(const d of [1,2])for(const q of Z.POOLS.nomen[d].filter(q=>q.fields)){
  assert.ok(q.context.startsWith('Nomen: '));assert.equal(q.fields.length,2);
  assert.match(q.fields[0].label,/Singular \(Einzahl\)/);assert.match(q.fields[1].label,/Plural \(Mehrzahl\).*mit Artikel/);
 }
});
test('Nomen-Markierpools variieren Anzahl, Positionen und Satzanfänge',()=>{
 for(const d of [1,2,3,4]){
  const qs=Z.POOLS.nomen[d].filter(q=>q.type==='mark'),counts=new Set(qs.map(q=>q.answer.length)),patterns=new Set(qs.map(q=>q.answer.join(',')));
  assert.ok(counts.size>=3,'Tiefe '+d);assert.ok(patterns.size>=8,'Tiefe '+d);
  assert.ok(qs.some(q=>q.answer.includes(0)));assert.ok(qs.some(q=>!q.answer.includes(0)));
  assert.ok(qs.some(q=>q.answer.length===1));assert.ok(qs.some(q=>q.answer.length>=3));
  assert.ok(qs.some(q=>q.answer.some(i=>i>2&&i<q.tokens.length-2)));
  if(d>=3)for(const q of qs){assert.equal(q.letterCase,'lower');assert.ok(q.tokens.every((_,i)=>Z.wortAnzeige(q,i)===q.tokens[i].toLowerCase()));}
 }
 for(const q of Z.POOLS.nomen[1].filter(q=>q.type==='choice'))assert.ok(q.options.every(w=>w===w.toLowerCase()));
});
test('Mehrteilige Verbformen haben genau die benötigten, eindeutig zugeordneten Satzlücken',()=>{
 const qs=all.filter(q=>['verben','praedikat'].includes(q.stollen)&&q.type==='gap');assert.ok(qs.length>=30);
 for(const q of qs){const slots=q.gapTemplate.filter(p=>typeof p!=='string');assert.equal(slots.length,q.fields.length,q.id);assert.equal(new Set(slots.map(p=>p.field)).size,q.fields.length);
  assert.equal((q.context.match(/___/g)||[]).length,q.fields.length,q.id);
  assert.ok(slots.every((p,i)=>p.field===i&&q.fields[i].slot===i+1));
  assert.equal(Z.ENGINES.gap.check(q,q.fields.map(f=>f.solutions[0])),true);
 }
 const modal=qs.find(q=>q.context.includes('Ole')&&q.fields.some(f=>f.solutions.includes('austrinken')));assert.equal(modal.fields.length,2);
 const particle=qs.find(q=>q.fields.some(f=>f.solutions.includes('auf')));assert.equal(particle.fields.length,2);
 assert.ok(qs.some(q=>q.fields.length===3));
});
test('Adjektivbeispiele erklären die Formen ohne aktuelle Lösungen vorzugeben',()=>{
 for(const q of all.filter(q=>q.stollen==='adjektive'&&q.degreeExample)){
  assert.equal(q.degreeExample.length,3);assert.ok(q.fields.every(f=>!/^Grundform|^Positiv/.test(f.label)));
  for(const f of q.fields){assert.ok(f.solutions.every(s=>!q.degreeExample.includes(s)),q.id);if(/Komparativ|Superlativ/.test(f.label))assert.match(Z.feldLabel(q,f),/z\. B\./);}
 }
 for(const text of ['Singular','Plural','Infinitiv','bestimmter Artikel','Komparativ','Superlativ']){const label=Z.fachLabel(text);assert.notEqual(label,text);assert.equal(Z.fachLabel(label),label);}
});
test('Die Intro-Ruinen sind offline verfügbar und fehlende Bild-Fallbacks nennen keine Assetnamen',()=>{
 const c=vm.createContext({self:{addEventListener(){}}});vm.runInContext(fs.readFileSync('sw.js','utf8')+'\nglobalThis.files=KERN;',c);
 assert.ok(c.files.includes('bilder/insel-grund.jpg'));for(const g of Z.GEBAEUDE)assert.ok(c.files.includes('bilder/'+g.id+'-ruine.png'));
 assert.ok(fs.readFileSync('index.html','utf8').includes('js/insel-szene.js'));
 assert.doesNotMatch(fs.readFileSync('js/gemeinsam.js','utf8'),/alt \|\| liste\[0\]/);
});

test('Morphologische Formaufgaben enthalten keine bereits vorgegebene Lösungsform im Satz',()=>{
 const words=s=>(s||'').match(/\p{L}+/gu)||[];
 for(const q of all.filter(q=>q.fields&&['form','gap'].includes(q.type)&&['nomen','verben','adjektive','faelle'].includes(q.stollen))){
  const given=words(q.context);
  for(const f of q.fields)for(const solution of f.solutions){
   const target=words(solution);if(!target.length)continue;
   const article=/^(der|die|das)$/.test(solution);
   const present=given.some((_,i)=>target.every((w,j)=>article?given[i+j]?.toLowerCase()===w:given[i+j]===w));
   assert.equal(present,false,q.id+' fragt die bereits sichtbare Form „'+solution+'“ nochmals ab');
  }
 }
});

test('Der Lückensatz-Baustein verwirft fehlende oder doppelt zugeordnete Felder',()=>{
 const q=()=>({fields:[{label:'Verb',solutions:['hat']},{label:'Partizip',solutions:['gespielt']}]});
 assert.throws(()=>Z.G.lueckensatz(q(),'Die Mannschaft {hat} im Hof.'),/Lücken und Felder/);
 assert.throws(()=>Z.G.lueckensatz(q(),'Die Mannschaft {hat} im Hof {gespielt}.',[0,0]),/Ungültige Zuordnung/);
 assert.throws(()=>Z.G.lueckensatz(q(),'Die Mannschaft {hat} im Hof {gespielt}.',[0,2]),/Ungültige Zuordnung/);
});
