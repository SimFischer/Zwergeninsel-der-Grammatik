const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const ctx=vm.createContext({window:{}});
for(const f of ['data.js','data-bau.js','data-grammatik.js','pass.js','engines.js'])vm.runInContext(fs.readFileSync('js/'+f,'utf8'),ctx,{filename:f});
const Z=ctx.window.ZI;
const plain=x=>JSON.parse(JSON.stringify(x));
test('11 Stollen, 55 Tiefen, zehn Engines und konsistente Beispielpools',()=>{
 assert.equal(Z.STOLLEN.length,11);assert.equal(Object.keys(Z.ENGINES).length,10);const types=new Set();
 for(const s of Z.STOLLEN)for(let d=1;d<=5;d++){
  const pool=Z.POOLS[s.id][d];assert.ok(pool.length>=10);assert.equal(new Set(pool.map(q=>q.id)).size,pool.length);
  for(const q of pool){types.add(q.type);const e=Z.ENGINES[q.type];assert.ok(e,q.type);assert.equal(q.hints.length,3);assert.ok(q.explanation);
   const answer=q.type==='repair'?{mark:q.answer,text:q.solutions[0]}:q.type==='order'?q.answers[0]:q.solutions?q.solutions[0]:q.answer;
   assert.equal(e.check(q,answer),true,q.id+' Musterlösung');
   const wrong=['mark','groups','order','sort','match'].includes(q.type)?[]:q.type==='repair'?{mark:[],text:'???'}:'???';
   assert.equal(e.check(q,wrong),false,q.id+' Fehlantwort');
   if(q.tokens){assert.ok(q.answer.every(i=>i>=0&&i<q.tokens.length));assert.ok(q.answer.every(i=>!/^\W+$/.test(q.tokens[i])));}
   if(q.type==='order')for(const a of q.answers){assert.equal(new Set(a).size,q.parts.length);assert.equal(e.check(q,a),true);}
   if(['match','sort'].includes(q.type)){assert.equal(q.items.length,q.answer.length);assert.ok(q.answer.every(a=>q.categories.includes(a)));}
  }
 }
 assert.equal(types.size,10);
});
test('Freischaltungen sind ohne freiwillige Tiefen vollständig erreichbar',()=>{
 const s=new Z.Stand({id:1});assert.deepEqual(plain(Z.STOLLEN.filter(t=>Z.stollenFrei(s,t.index)).map(t=>t.index)),[0,1,2]);
 assert.equal(s.abschliessen(10,1),false);assert.equal(s.abschliessen(0,3),false);
 for(let i=0;i<11;i++){
  assert.ok(Z.stollenFrei(s,i),'Stollen '+i+' erreichbar');assert.ok(s.abschliessen(i,1));
  assert.equal(s.coreTotal(),i+1);assert.equal(s.gems(),0);assert.equal(s.abschliessen(i,1),false);
 }
 assert.equal(Z.gebaute(s.coreTotal()).length,12);for(let k=0;k<3;k++)assert.ok(s.kapitelFertig(k));
});
test('Tiefen bringen einmalige Edelsteine, Tiefe 5 eine Krone und kein Material',()=>{
 const s=new Z.Stand({id:32});s.abschliessen(0,1);
 for(let d=2;d<=5;d++){assert.ok(s.abschliessen(0,d));assert.equal(s.coreTotal(),1);assert.equal(s.abschliessen(0,d),false);}
 assert.equal(s.gems(),15);assert.equal(s.kronenTotal(),1);assert.equal(s.t[1],0);
});
test('Passcodes sind verlustfrei, versioniert und erkennen einzelne Tippfehler',()=>{
 const alphabet='23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
 for(let j=0;j<500;j++){
  const s=new Z.Stand({id:j%33,zwerg:j%12+1,welt:j%12,t:Array.from({length:11},(_,i)=>(j*7+i*3)%6)});
  const code=s.code();assert.equal(Z.Stand.ausCode(code).code(),code);
  const flat=code.replace(/-/g,'');for(let i=2;i<flat.length;i++){const bad=flat.slice(0,i)+alphabet[(alphabet.indexOf(flat[i])+1)%32]+flat.slice(i+1);assert.equal(Z.Stand.ausCode(bad),null,bad);}
 }
 assert.equal(Z.Stand.ausCode('ABCD-EFGH-JKLM'),null);assert.equal(Z.Stand.ausCode('G1-OOOO-OOOO-OOOO'),null);
});
test('Lieferungen werden monoton zusammengeführt, Botschaften übertragen keine Kompetenzen',()=>{
 const a=new Z.Stand({id:3,t:[3,1,0],welt:2}),b=new Z.Stand({id:3,t:[1,2,1],welt:1});
 const s=Z.Stand.zusammen(a,b);assert.deepEqual(plain(s.t.slice(0,3)),[3,2,1]);assert.equal(s.welt,2);
 assert.equal(Z.Stand.zusammen(s,b).code(),s.code());
 for(let i=0;i<12;i++)assert.equal(Z.botschaft.lese(Z.botschaft.kodiere(i)),i);
 assert.equal(Z.botschaft.lese(a.code()),null);
});
test('Alle zwölf Zwerge besitzen erreichbare Grammatikbedingungen',()=>{
 const s=new Z.Stand({id:1,t:Array(11).fill(5)});assert.equal(s.freieZwerge().length,12);
 assert.equal(new Z.Stand().freieZwerge().length,4);
});

test('ein vierstelliger Klassenschein codiert alle Gesamtstände kollisionsfrei und monoton',()=>{
 const codes=new Set();
 for(let id=1;id<=32;id++)for(let zwerg=1;zwerg<=12;zwerg++)for(let material=0;material<=11;material++)for(let schritte=0;schritte<=3*material;schritte++)for(let kronen=0;kronen<=Math.floor(schritte/3);kronen++){
  const info={id,zwerg,material,schritte,kronen},code=Z.lieferung.kodiere(info);
  assert.match(code,/^[A-HJ-NP-Z2-9]{4}$/);assert.ok(!codes.has(code));codes.add(code);assert.deepEqual(plain(Z.lieferung.lese(code)),info);
 }
 assert.equal(codes.size,359424);
 const info={id:7,zwerg:2,material:4,schritte:6,kronen:1},a=Z.lieferung.anwenden(null,info);
 assert.deepEqual(plain(Z.lieferung.anwenden(a,info)),plain(a));
 assert.deepEqual(plain(Z.lieferung.anwenden(a,{...info,material:3,schritte:3})),plain(a));
 assert.equal(Z.lieferung.anwenden(a,{...info,schritte:9,kronen:2}).kronen,2);
 for(const bad of ['','ABC','ABCDE','0000','IIII'])assert.equal(Z.lieferung.lese(bad),null);
 assert.equal(Z.lieferung.kodiere({...info,material:'4'}),null);
});
test('bestätigte Lieferstände überstehen den persönlichen Pass, neue Tiefen erzeugen neue Scheine',()=>{
 const s=new Z.Stand({id:3,t:[2,1]});assert.equal(s.offeneLieferungen().length,2);
 s.lieferungBestaetigen();const neu=Z.Stand.ausCode(s.code());
 assert.equal(neu.geliefert[0],2);assert.equal(neu.offeneLieferungen().length,0);
 neu.t[0]=3;assert.equal(neu.offeneLieferungen().length,1);
 const g1=s.code('G1'),alt=Z.Stand.ausCode(g1);assert.deepEqual(plain(alt.t),plain(s.t));assert.equal(alt.offeneLieferungen().length,2);
});
test('Inselbotschaften bestehen aus genau sechs Buchstaben und lesen frühere lange Botschaften',()=>{
 const words=new Set();for(let i=0;i<12;i++){
  const code=Z.botschaft.kodiere(i);assert.match(code,/^[A-Z]{6}$/);words.add(code);assert.equal(Z.botschaft.lese(code.toLowerCase()),i);
  assert.equal(Z.botschaft.lese('INSEL-'+new Z.Stand({welt:i}).code('G1').slice(3)),i);
 }
 assert.equal(words.size,12);assert.equal(Z.botschaft.lese('XXXXXX'),null);
});

test('G2 bewahrt auch gemischte Lieferstände über Gerätewechsel',()=>{
 for(let j=0;j<100;j++){
  const t=Array.from({length:11},(_,i)=>(j+i*7)%6),geliefert=t.map((v,i)=>(j*3+i)%(v+1));
  const s=new Z.Stand({id:j%32+1,zwerg:j%12+1,welt:j%12,t,geliefert}),neu=Z.Stand.ausCode(s.code());
  assert.deepEqual(plain(neu.t),t);assert.deepEqual(plain(neu.geliefert),geliefert);assert.equal(neu.code(),s.code());
 }
});
