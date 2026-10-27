const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const ctx=vm.createContext({window:{}});for(const f of ['data','data-bau','data-grammatik','grammatik/wortschmiede','grammatik/satzwerkstatt','grammatik/satzbaumeister','pass'])vm.runInContext(fs.readFileSync('js/'+f+'.js','utf8'),ctx);const Z=ctx.window.ZI;
test('Materialmengen und andere Zähler verwenden Singular und Plural',()=>{
 for(const [n,text] of [[0,'0 Materialien'],[1,'1 Material'],[2,'2 Materialien'],[27,'27 Materialien'],[54,'54 Materialien']])assert.equal(Z.materialMenge(n),text);
 assert.equal(Z.menge(1,'Krone','Kronen'),'1 Krone');assert.equal(Z.menge(2,'Krone','Kronen'),'2 Kronen');
 const source=fs.readFileSync('js/insel.js','utf8');assert.doesNotMatch(source,/\+\s*['"`] Material['"`]/);
});
test('Alle zwölf Gebäude besitzen denselben Bauplan für Insel, Übersicht und Freischaltung',()=>{
 assert.equal(Z.BAU,Z.GEBAEUDE);assert.equal(Z.BAU.length,12);assert.equal(new Set(Z.BAU.map(b=>b.id)).size,12);
 for(const b of Z.BAU){assert.ok(b.name&&b.funktion);assert.ok(b.x>0&&b.x<100&&b.y>0&&b.y<100&&b.w>0&&b.w<100);assert.ok(Number.isInteger(b.ab)&&b.ab>=0&&b.ab<=11);
  for(const asset of [b.ruinenAsset,b.fertigAsset])assert.ok(fs.existsSync(Z.BILD(asset)),asset);
  for(const n of [1,27,32])assert.equal(Z.baukosten(b,n),b.ab*n);
  for(let w=0;w<=11;w++)assert.equal(Z.gebaute(w).includes(b.id),w>=b.ab,b.id);
 }
 for(const st of Z.STOLLEN)assert.ok(Z.BAU.some(b=>b.id===st.gebaeude));
});
test('Persönlicher G2-Pass und vierstelliger Lieferschein bleiben getrennt',()=>{
 const s=new Z.Stand({id:7,t:[5,2,1],zwerg:2});assert.match(s.code(),/^G2-(?:[A-Z2-9]{6}-){2}[A-Z2-9]{6}$/);assert.equal(Z.PASS_FORMAT.muster,s.code().replace(/[A-Z2-9]/g,(c,i)=>i<2?c:'X'));
 assert.equal(Z.PASS_FORMAT.zeichen,18);assert.equal(s.lieferCode().length,4);assert.equal(Z.Stand.ausCode(s.lieferCode()),null);
 const cards=fs.readFileSync('karten.html','utf8');assert.ok(cards.includes('ZI.PASS_FORMAT.muster'));assert.ok(!cards.includes('12 Zeichen'));
});
test('Ranggrenzen sind erreichbar und folgen neuen Tiefen sowie zusätzlichen Kronenpunkten',()=>{
 const a=new Z.Stand({id:1});assert.equal(Z.rang(a).name,'Lehrling');assert.equal(Z.rang(a).next.ab,3);
 a.abschliessen(0,1);assert.equal(Z.rang(a).next.ab-Z.rang(a).punkte,2);
 const b=new Z.Stand({id:1,t:[5]});assert.equal(Z.rang(b).punkte,6);assert.equal(Z.rang(b).next.name,'Geselle');
 const max=new Z.Stand({id:1,t:Array(11).fill(5)});assert.equal(Z.rang(max).name,'Großmeister');assert.equal(Z.rang(max).next,undefined);
 const before=Z.rang(b).punkte;b.abschliessen(0,5);assert.equal(Z.rang(b).punkte,before);
});
test('Formaufgaben kennzeichnen gegebene Zielwörter und Wortbildungsbausteine',()=>{
 for(const [id,depths] of [['nomen',[1,2,3,5]],['verben',[2]],['adjektive',[1,2,5]],['faelle',[1,2,3,4,5]]])for(const d of depths)for(const q of Z.POOLS[id][d].filter(q=>q.band==='kern')){
  assert.ok(q.focusWords?.length,q.id);assert.ok(q.focusWords.some(w=>q.context?.includes(w)),q.id);
 }
});
test('Die Navigation enthält nur noch die Klasseninsel und persönlichen Lernfortschritt',()=>{
 const app=fs.readFileSync('js/app.js','utf8'),island=fs.readFileSync('js/insel.js','utf8');assert.ok(app.includes("btn('Mein Fortschritt', fortschritt"));assert.ok(app.includes('rang-knopf'));assert.ok(!app.includes('Meine Insel'));assert.ok(island.includes("location.replace('index.html?ort=fortschritt')"));assert.ok(!island.includes('const personal='));
 const teacher=fs.readFileSync('lehrkraft.html','utf8');assert.ok(teacher.includes('class="spalten"'));assert.ok(teacher.includes('Z.BAU.map'));assert.ok(teacher.includes('Z.STOLLEN.filter'));
 assert.doesNotMatch(teacher,/Pro\/Contra|Streitfrage|Stammescode|mündliches Argumentieren/);
});
