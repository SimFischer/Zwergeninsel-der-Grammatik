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
