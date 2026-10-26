/* Satzwerkstatt: Wettbewerb, Werkzeugdetektive und vollständige Satzglieder.
   Angelehnt an Q013, Q026, Q032, Q063, Q064 und die geprüften Lösungen Q077. */
(function(){
 const Z=window.ZI,G=Z.G,{add,mc,mark,fields,input,assign,repair}=G;
 // Annotierter Satz, kurze Ersatzform, passendes Verb, falsche Verbform, Satzfrage.
 const bank=[
  ['{Der kleine Zwerg mit dem roten Bart} hebt den Hammer.','Er','hebt','heben','Wer oder was hebt den Hammer?'],
  ['Heute gewinnt {die Mannschaft von Felix} das Spiel.','Sie','gewinnt','gewinnen','Wer oder was gewinnt heute das Spiel?'],
  ['Am Abend wird {das spannende Spiel} abgepfiffen.','Es','wird','werden','Wer oder was wird am Abend abgepfiffen?'],
  ['Unter dem Tisch liegt {das verschwundene Werkzeug}.','Es','liegt','liegen','Wer oder was liegt unter dem Tisch?'],
  ['{Die Sanitäter mit den roten Taschen} helfen dem verletzten Zwerg.','Sie','helfen','hilft','Wer oder was hilft dem verletzten Zwerg?'],
  ['Gestern wurde {der alte Computer} von einem Roboter geprüft.','Er','wurde','wurden','Wer oder was wurde gestern von einem Roboter geprüft?'],
  ['{Die Haare der Meerjungfrauen} gefallen den Seeräubern.','Sie','gefallen','gefällt','Wer oder was gefällt den Seeräubern?'],
  ['Hinter dem Tor warten {die beiden Detektive}.','Sie','warten','wartet','Wer oder was wartet hinter dem Tor?'],
  ['{Das Schiff der Seeräuber} wird im Hafen repariert.','Es','wird','werden','Wer oder was wird im Hafen repariert?'],
  ['Auf dem Video erkennt {die aufmerksame Polizistin} eine Spur.','Sie','erkennt','erkennen','Wer oder was erkennt auf dem Video eine Spur?'],
  ['{Niemand} hat das Seil berührt.','Niemand','hat','haben','Wer oder was hat das Seil berührt?'],
  ['Heute darf {ich} das Rätsel lösen.','ich','darf','dürfen','Wer oder was darf heute das Rätsel lösen?'],
 ];
 for(let d=1;d<=5;d++)bank.forEach(([vorlage,pron,verb,falsch,frage],j)=>{
  const einfach=['Der Zwerg','die Mannschaft','das Spiel','das Werkzeug','Die Sanitäter','der Computer','Die Haare','die Detektive','Das Schiff','die Polizistin','Niemand','ich'];
  const original=vorlage.match(/\{([^}]+)\}/)[1],ersatz=vorlage.startsWith('{')?G.upper(pron):pron.toLowerCase();
  const s=d===1?vorlage.replace('{'+original+'}','{'+einfach[j]+'}'):d===3?vorlage.replace('{'+original+'}','{'+ersatz+'}'):vorlage;
  const subject=s.match(/\{([^}]+)\}/)[1],context=s.replace(/[{}]/g,''),family='subjekt-'+j;let q;
  if(d===5)q=repair(s.replace(/[{}]/g,'').replace(new RegExp('\\b'+verb+'\\b'),'{'+falsch+'}'),context,1,'Prüfe, ob Subjekt und finite Verbform zusammenpassen.');
  else q=mark('Markiere das vollständige Subjekt. Auch Begleiter und Erweiterungen gehören dazu.',s,'groups');
  add('subjekt',d,'sicherung',d===5?'A19':'A22',['Q026','Q063'],family,q,
   ['Suche die finite Verbform „'+verb+'“.','Frage: '+frage,'Die Antwort lautet „'+subject+'“. Prüfe die ganze Wortgruppe und die passende Verbform.'],
   '„'+subject+'“ ist das vollständige Subjekt. Ein Subjekt kann auch etwas erleiden oder als Pronomen erscheinen. Es ist nicht einfach „die handelnde Person“.');
  if(d===1)q=mc('Mit welcher Frage findest du das Subjekt?',frage,[frage.replace('Wer oder was','Wen oder was'),frage.replace('Wer oder was','Wem')],context);
  else if(d===2)q=fields('gap','Setze die passende Verbform ein und ersetze das Subjekt.',[['finite Verbform',verb,[verb,falsch]],['Ersatz für „'+subject+'“',pron]],context.replace(new RegExp('\\b'+verb+'\\b'),'___'));
  else if(d===3)q=input('transfer','Ersetze nur das vollständige Subjekt „'+original+'“ durch „'+pron+'“. Behalte alle anderen Wörter bei.',vorlage.replace('{'+original+'}',vorlage.startsWith('{')?G.upper(pron):pron.toLowerCase()),vorlage.replace(/[{}]/g,''));
  else if(d===4)q=fields('form','Untersuche die vollständige Subjektgruppe.',[['vollständiges Subjekt',subject],['passende finite Verbform',verb,[verb,falsch]],['Fragewort','Wer oder was?',['Wer oder was?','Wem?','Wen oder was?']]],context);
  else q=fields('transfer','Überarbeite den Satz: Subjekt erkennen und Verbform prüfen.',[['vollständiges Subjekt',subject],['korrekte finite Verbform',verb]],context.replace(new RegExp('\\b'+verb+'\\b'),falsch));
  add('subjekt',d,'kern',d===3?'A24':'A22',['Q026','Q063'],family,q,
   ['Die Wortgruppe muss als Ganzes zur finiten Verbform passen.','Die Subjektfrage lautet hier: '+frage,'Schreibe die vollständige Antwort „'+subject+'“; die passende Verbform lautet „'+verb+'“.'],
   'Das Subjekt ist „'+subject+'“. Die finite Verbform „'+verb+'“ passt in Person und Zahl dazu.');
  // Rollenwechsel aus Q032: mal aktiv, mal passiv, auch unbelebte Subjekte.
  const aktiv=['Der Roboter prüft den Computer.','Der Computer steuert den Roboter.','Der Computer wird vom Roboter geprüft.','Der Roboter wird vom Computer gesteuert.'];
  const rollen=[['Der Roboter','den Computer'],['Der Computer','den Roboter'],['Der Computer','vom Roboter'],['Der Roboter','vom Computer']];
  const a=j%4;
  q=fields('transfer',d<=2?'Vergleiche den Beispielsatz mit dem Rollentausch. Wer oder was ist jeweils das Subjekt?':'Trenne Subjekt und Handlungsträger. Bestimme beide vollständigen Subjekte.',[['Subjekt im ersten Satz',subject],['Subjekt im zweiten Satz',rollen[a][0]]],context+' '+aktiv[a]);
  add('subjekt',d,'transfer','A15',['Q032','Q026'],family,q,
   ['Frage in jedem Satz neu mit „Wer oder was?“.','Bei „wird geprüft“ ist das Geprüfte das Subjekt, obwohl es nicht selbst prüft.','Im zweiten Satz lautet das Subjekt „'+rollen[a][0]+'“. Im ersten hilft dir die finite Verbform „'+verb+'“.'],
   'Die Satzgliedfunktion folgt aus dem Satzbau. Im Passiv kann das Subjekt die Person oder Sache sein, mit der etwas geschieht.');
 });
})();
(function(){
 const Z=window.ZI,G=Z.G,{add,mark,fields,assign,order}=G;
 // Ein-, zwei- und dreiteilige Satzkerne einschließlich trennbarer Verben.
 const bank=[
  ['Hilda {kocht} eine Suppe.',['kocht'],['finite Verbform'],'kochen'],
  ['Brumm {hat} das Seil {gefunden}.',['hat','gefunden'],['finite Verbform','Partizip II (infinit)'],'finden'],
  ['Die Mannschaft {wird} morgen {spielen}.',['wird','spielen'],['finite Verbform','Infinitiv (infinit)'],'spielen'],
  ['Kira {räumt} die Werkstatt {auf}.',['räumt','auf'],['finite Verbform','abgetrennte Verbpartikel'],'aufräumen'],
  ['Der Wettkampf {findet} heute {statt}.',['findet','statt'],['finite Verbform','abgetrennte Verbpartikel'],'stattfinden'],
  ['Ole {muss} den Becher {austrinken}.',['muss','austrinken'],['finite Verbform','Infinitiv (infinit)'],'austrinken'],
  ['Das Seil {ist} heimlich {angeschnitten} {worden}.',['ist','angeschnitten','worden'],['finite Verbform','Partizip II (infinit)','Partizip II (infinit)'],'anschneiden'],
  ['Die Zwerge {haben} in der Höhle {vordringen} {können}.',['haben','vordringen','können'],['finite Verbform','Infinitiv (infinit)','Infinitiv (infinit)'],'vordringen'],
  ['Der Anker {sank} langsam {hinab}.',['sank','hinab'],['finite Verbform','abgetrennte Verbpartikel'],'hinabsinken'],
  ['Svea {hat} die Insel {besungen}.',['hat','besungen'],['finite Verbform','Partizip II (infinit)'],'besingen'],
  ['Der alte Computer {wird} vom Roboter {geprüft}.',['wird','geprüft'],['finite Verbform','Partizip II (infinit)'],'prüfen'],
  ['Der Krug {zersprang} auf dem Boden.',['zersprang'],['finite Verbform'],'zerspringen'],
 ];
 const cats=['finite Verbform','Partizip II (infinit)','Infinitiv (infinit)','abgetrennte Verbpartikel'];
 for(let d=1;d<=5;d++)bank.forEach(([s,verbs,roles,inf],j)=>{
  // Tiefe verändert Kontext und Selbstständigkeit, nicht die Art des Verbs als neues Thema.
  const base=s.replace(/[{}]/g,''),family='praedikat-'+j;let q;
  const erweitert=d>=3?s.replace(/\.$/,' trotz des starken Sturms.'):s;
  q=mark('Markiere ALLE Teile des Prädikats, auch abgetrennte Verbteile.',erweitert,'groups');
  add('praedikat',d,'sicherung','A25',['Q008','Q026','Q061'],family,q,
   ['Beginne bei der finiten Verbform „'+verbs[0]+'“.','Suche weitere Wörter, die mit ihr den Satzkern bilden. Nicht jeder Prädikatsteil verändert sich mit der Person.','Alle Prädikatsteile sind: '+verbs.join(' … ')+'.'],
   'Das vollständige Prädikat lautet „'+verbs.join(' … ')+'“. Eine abgetrennte Verbpartikel gehört dazu, ist aber selbst keine infinite Verbform.');
  q=assign(d%2?'sort':'match','Ordne die tatsächlichen Prädikatsteile zu.',verbs,roles,cats,base);
  add('praedikat',d,'kern','A26',['Q022','Q059','Q061'],family,q,
   ['Prüfe, welcher Teil Person und Zahl anzeigt.','Ein Partizip wie „gefunden“ und ein Infinitiv sind beide infinit. Ein abgetrennter Verbteil wie „auf“ ist eine Partikel.','Hier ist „'+verbs[0]+'“ finit. Die übrigen Teile: '+verbs.slice(1).map((v,i)=>v+' – '+roles[i+1]).join('; ')+'.'],
   verbs.map((v,i)=>'„'+v+'“: '+roles[i]).join('; ')+'.');
  if(d<=2)q=fields('gap','Ergänze den vollständigen Satzkern. Schreibe in jede Lücke einen Prädikatsteil.',verbs.map((v,i)=>['Prädikatsteil '+(i+1),v]),G.annotation(s).tokens.map((w,i)=>G.annotation(s).answer.includes(i)?'___':w).join(' '));
  else if(d===3)q=fields('form','Untersuche die Satzklammer.',[['finite Verbform',verbs[0]],['übrige Prädikatsteile in Satzreihenfolge',verbs.slice(1).join(' ')||'keine'],['Infinitiv des Vollverbs',inf]],base+' Wenn es keinen weiteren Prädikatsteil gibt, schreibe „keine“.');
  else {
   // Ganze Satzkerne bleiben beim Umstellen zusammengehörig; alle Teile müssen verwendet werden.
   const parts=G.annotation(s).tokens.filter(w=>w!=='.'),valid=parts.map((_,i)=>i);
   q=order('Baue den Satz aus dem Bericht wieder auf. Verwende alle Wörter in der Reihenfolge der Vorlage.',parts,[valid],base);
   if(d===5)q=fields('transfer','Prüfe den Bericht auf übersehene Verbteile.',[['vollständiges Prädikat in Satzreihenfolge',verbs.join(' ')],['finite Verbform',verbs[0]],['Sind abgetrennte Partikeln infinite Verbformen?','nein',['ja','nein']]],base);
  }
  add('praedikat',d,'transfer',d===4?'A23':'A25',['Q026','Q126'],family,q,
   ['Beim vollständigen Prädikat darf kein Verbteil fehlen.','Prüfe die rechte Satzklammer: Dort können Partizip, Infinitiv oder Verbpartikel stehen.','Die Reihenfolge der Prädikatsteile lautet: '+verbs.join(' – ')+'.'],
   'Alle Teile arbeiten zusammen: '+verbs.join(' … ')+'. Das finite Verb ist „'+verbs[0]+'“.');
 });
})();
/* Objekte: Werkzeugdetektive und Bausteinpool nach Q013, Q064 und Q077. */
(function(){
 const Z=window.ZI,G=Z.G,{add,mark,fields,assign,order,repair}=G;
 // Subjekt | Verb | vollständiges Dativobjekt | vollständiges Akkusativobjekt | Pronomen.
 const bank=[
  ['Pavel','zeigt','der aufmerksamen Polizistin','sein kurzes Video','ihr','es'],
  ['Brumm','gibt','dem verletzten Zwerg','einen Verband','ihm','ihn'],
  ['Die Detektivin','bringt','den beiden Sanitätern','den roten Rucksack','ihnen','ihn'],
  ['Hilda','erklärt','dem neuen Lehrling','den schwierigen Bauplan','ihm','ihn'],
  ['Die Zeugin','beschreibt','dem Kapitän','das verschwundene Werkzeug','ihm','es'],
  ['Der Wirt','reicht','den müden Wanderern','eine warme Suppe','ihnen','sie'],
  ['Die Seeräuberin','schenkt','dem kleinen Kind','einen magischen Ring','ihm','ihn'],
  ['Der Schiedsrichter','erklärt','der Mannschaft von Felix','die neue Regel','ihr','sie'],
  ['Svea','erzählt','den neugierigen Kindern','eine spannende Geschichte','ihnen','sie'],
  ['Kira','leiht','der Technikerin','ihren silbernen Hammer','ihr','ihn'],
  ['Leo','schickt','seinen besorgten Eltern','eine kurze Nachricht','ihnen','sie'],
  ['Die Helferin','zeigt','dem alten Seeräuber','den sicheren Weg','ihm','ihn'],
 ];
 for(let d=1;d<=5;d++)bank.forEach(([sub,v,dat,akk,dp,ap],j)=>{
  const k=j%2,target=k?akk:dat,caseName=k?'Akkusativobjekt':'Dativobjekt',frage=k?'Wen oder was?':'Wem?',family='objekt-'+j;
  const s=sub+' '+v+' '+dat+' '+akk+'.',annotated=sub+' '+v+' '+(k?dat:'{'+dat+'}')+' '+(k?'{'+akk+'}':akk)+'.';let q;
  if(d===5){const wrong=k?dp:ap;const p=sub+' '+v+' '+(k?dat+' {'+wrong+'}':'{'+wrong+'} '+akk)+'.',correct=sub+' '+v+' '+(k?dat+' '+ap:dp+' '+akk)+'.';q=repair(p,correct,1,'Im Bericht wurde ein Objekt durch ein Pronomen im falschen Fall ersetzt.');}
  else q=mark('Markiere das vollständige '+caseName+'.',d>=3?sub+' '+v+' '+(k?dat+' {'+akk+'}':'{'+dat+'} '+akk)+' heute.':annotated,'groups');
  add('objekte',d,'sicherung',d===5?'A19':'A28',['Q013','Q064'],family,q,
   ['Gehe von der Verbform „'+v+'“ aus.','Frage nach dem gesuchten Objekt mit „'+frage+'“.','Die vollständige Gruppe lautet „'+target+'“. Das passende Pronomen ist „'+(k?ap:dp)+'“.'],
   '„'+target+'“ ist hier das '+caseName+'. Frage: '+frage+' Auch alle Begleiter und Adjektive gehören zum Objekt.');
  if(d===1)q=fields('gap','Ergänze die beiden Objekte aus dem Bausteinpool.',[['Wem?',dat,[dat,akk]],['Wen oder was?',akk,[dat,akk]]],sub+' '+v+' ___ ___.');
  else if(d===2)q=assign('match','Ordne die beiden vollständigen Objekte zu.',[dat,akk],['Dativobjekt','Akkusativobjekt'],['Dativobjekt','Akkusativobjekt'],s);
  else if(d===3)q=fields('form','Ersetze die Objekte durch passende Personalpronomen.',[['Ersatz für „'+dat+'“',dp],['Ersatz für „'+akk+'“',ap]],s);
  else if(d===4)q=fields('form','Untersuche beide Objekte im Detektivbericht.',[['Dativobjekt vollständig',dat],['Akkusativobjekt vollständig',akk],['Frage nach dem Dativobjekt','Wem?',['Wem?','Wessen?','Wer oder was?']]],s);
  else q=fields('transfer','Ersetze nur das genannte Objekt und übernimm alle anderen Wörter.',[['Satz mit Pronomen statt „'+dat+'“',sub+' '+v+' '+dp+' '+akk+'.'],['Satz mit Pronomen statt „'+akk+'“',[sub+' '+v+' '+ap+' '+dat+'.',sub+' '+v+' '+dat+' '+ap+'.']]],s);
  add('objekte',d,'kern',d===3||d===5?'A24':'A27',['Q013','Q064'],family,q,
   ['Suche erst das Verb und stelle dann die Objektfragen.','„Wem?“ führt zu „'+dat+'“. „Wen oder was?“ führt zu „'+akk+'“.','Die Pronomen lauten „'+dp+'“ für das Dativobjekt und „'+ap+'“ für das Akkusativobjekt.'],
   'Dativobjekt: '+dat+'. Akkusativobjekt: '+akk+'. Beim Ersatz bleibt der Fall erhalten.');
  if(d<=2)q=fields('transfer','In diesem Bericht sind Pronomen die Objekte. Ordne sie zu.',[['Dativobjekt',dp],['Akkusativobjekt',ap]],sub+' '+v+' '+ap+' '+dp+'.');
  else if(d===3||d===4)q=order('Stelle den Satz um. Beginne mit dem Subjekt oder einer vollständigen Objektgruppe.',[sub,v,dat,akk+'.'],[[0,1,2,3],[2,1,0,3]],'Beginne mit dem Subjekt oder dem Dativobjekt. Der Punkt gehört ans Ende.');
  else q=fields('transfer','Trenne die Ortsangabe von den Objekten.',[['Dativobjekt',dat],['Akkusativobjekt',akk],['„in der Werkstatt“ ist hier','eine Ortsangabe',['ein Dativobjekt','eine Ortsangabe']]],sub+' '+v+' '+dat+' '+akk+' in der Werkstatt.');
  // Satzzeichen sind eigene Bausteine, sodass keine Endposition künstlich festgelegt wird.
  if(q.type==='order'){q.parts=[sub,v,dat,akk,'.'];q.answers=[[0,1,2,3,4],[0,1,3,2,4],[2,1,0,3,4],[2,1,3,0,4],[3,1,0,2,4],[3,1,2,0,4]];}
  add('objekte',d,'transfer',d>=3&&d<=4?'A23':'A28',['Q013','Q126'],family,q,
   ['Stelle die Fragen auch nach dem Umstellen neu.','Die Stellung ändert den Fall der Objektgruppen nicht. Eine Ortsangabe beantwortet dagegen „Wo?“.','Hier bleiben „'+dat+'“ das Dativobjekt und „'+akk+'“ das Akkusativobjekt.'],
   'Auch ein Pronomen kann ein Objekt sein. Die Objektfunktion hängt nicht von einer festen Stelle im Satz ab.');
 });
})();
/* Fehlende Angaben, Schatzhinweise und Wikinger-Zeitreise aus Q015, Q017, Q018. */
(function(){
 const Z=window.ZI,G=Z.G,{add,mark,fields,assign,order}=G;
 // Subjekt, Verb, Zeit, Ort, Grund, Art/Weise, übriger Satzteil.
 const bank=[
  ['Die Zwerge','graben','am frühen Morgen','hinter der alten Eiche','wegen eines Hinweises','mit großer Vorsicht','nach dem Schatz'],
  ['Die Wikinger','rudern','vor Sonnenaufgang','auf dem Fjord','wegen des starken Gegenwinds','mit aller Kraft','zum Ufer'],
  ['Die Schatzsucherin','wartet','seit einer Stunde','vor der Höhle','wegen des hohen Wassers','geduldig','auf ihre Freunde'],
  ['Die Crew','landet','am nächsten Tag','auf der kleinen Insel','wegen eines Sturms','mit zitternden Händen','das Boot'],
  ['Der Kapitän','sucht','in der Nacht','unter Deck','wegen des verlorenen Schlüssels','fieberhaft','zwischen den Kisten'],
  ['Die Zeitreisenden','verstecken','am Mittag','hinter dem großen Fass','aus Angst vor Entdeckung','ganz leise','ihre Ausrüstung'],
  ['Hilda','prüft','vor der Abreise','am Hafen','wegen eines Risses','sehr gründlich','das Segel'],
  ['Der Späher','beobachtet','während der Dämmerung','auf dem Hügel','wegen eines unbekannten Schiffs','aufmerksam','das Meer'],
  ['Die Mannschaft','repariert','nach dem Regen','neben der Werft','wegen der beschädigten Bretter','mit viel Geduld','das Boot'],
  ['Die Kinder','lesen','nach dem Frühstück','im alten Turm','aus Neugier','flüsternd','den geheimen Brief'],
  ['Svea','zeichnet','an diesem Abend','in der Werkstatt','zur Vorbereitung der Expedition','sorgfältig','eine Karte'],
  ['Ole','sammelt','vor dem Winter','am Waldrand','wegen der bevorstehenden Kälte','eifrig','trockenes Holz'],
 ];
 const cats=['Zeit','Ort','Grund','Art und Weise'],questions=['Wann?','Wo?','Warum? / Wozu?','Wie?'];
 for(let d=1;d<=5;d++)bank.forEach(([sub,v,zeit,ort,grund,weise,rest],j)=>{
  const infos=[zeit,ort,grund,weise],k=j%4,family='angabe-'+j,parts=[sub,v,...infos,rest],sentence=parts.join(' ')+'.';let q;
  q=mark('Markiere die vollständige Angabe zu '+cats[k]+'.',parts.map((p,i)=>i===k+2?'{'+p+'}':p).join(' ')+'.','groups');
  if(d===1)q=mark('Finde die Angabe: '+questions[k],sub+' '+v+' {'+infos[k]+'} '+rest+'.','groups');
  add('adverbialien',d,'sicherung','A30',['Q015','Q017'],family,q,
   ['Überlege, welche Information die gesuchte Angabe liefert.','Die Frage lautet hier „'+questions[k]+'“.','Die vollständige Angabe lautet „'+infos[k]+'“.'],
   '„'+infos[k]+'“ nennt hier '+cats[k]+'. Die ganze Wortgruppe bildet eine Angabe.');
  if(d===1)q=fields('gap','Vervollständige den Schatzhinweis mit Angaben aus der Auswahl.',[[questions[k],infos[k],infos],[questions[(k+1)%4],infos[(k+1)%4],infos]],sub+' '+v+' ___ ___ '+rest+'.');
  else if(d===2)q=assign('match','Ordne die Informationen im Reisebericht zu.',infos,cats,cats,sentence);
  else if(d===3)q=fields('form','Erfrage die Angaben im Bericht.',[[infos[k],questions[k],questions],[infos[(k+1)%4],questions[(k+1)%4],questions]],sentence);
  else if(d===4)q=fields('transfer','Setze die fehlenden Informationen in den Hinweis ein.',[['Zeit',zeit,infos],['Ort',ort,infos],['Grund',grund,infos],['Art und Weise',weise,infos]],sub+' '+v+' ___ ___ ___ ___ '+rest+'.');
  else q=assign('sort','Überarbeite den Reisebericht: Sortiere alle Angaben nach ihrer Bedeutung.',[weise,grund,ort,zeit],['Art und Weise','Grund','Ort','Zeit'],cats,sentence);
  add('adverbialien',d,'kern',d===4?'A31':'A29',['Q015','Q018'],family,q,
   ['Fehlende Angaben beantworten unterschiedliche Fragen.','Zeit: Wann? Ort: Wo? Grund oder Zweck: Warum oder wozu? Art und Weise: Wie?','Hier gehören „'+zeit+'“ zur Zeit und „'+ort+'“ zum Ort; „'+grund+'“ begründet das Geschehen und „'+weise+'“ beschreibt die Art.'],
   infos.map((x,i)=>x+' → '+cats[i]).join('; ')+'. Die Angaben machen einen Hinweis für die Schatzsuche genauer.');
  if(d<=2)q=fields('transfer','Welche Information fehlt im verkürzten Hinweis? Ergänze sie aus dem Reisebericht.',[['fehlende Angabe',infos[k],infos],['Informationsart',cats[k],cats]],sub+' '+v+' '+infos.filter((_,i)=>i!==k).join(' ')+' '+rest+'. Vollständiger Bericht: '+sentence);
  else if(d===3||d===4)q=order('Baue den Reisehinweis. Beginne mit dem Subjekt, der Zeit oder dem Ort.',[sub,v,zeit,ort,grund,weise,rest,'.'],[[0,1,2,3,4,5,6,7],[2,1,0,3,4,5,6,7],[3,1,0,2,4,5,6,7]],'Behalte hinter dem Subjekt die Reihenfolge der übrigen Angaben aus der Vorlage: '+sentence);
  else q=fields('transfer','Der Bericht soll Ort und Grund eindeutig nennen. Ersetze ungenaue Wörter anhand der Vorlage.',[['genauer Ort statt „dort“',ort,infos],['genauer Grund statt „deshalb“',grund,infos]],sub+' '+v+' dort deshalb '+rest+'. Vorlage: '+sentence);
  add('adverbialien',d,'transfer',d>=3&&d<=4?'A32':'A29',['Q015','Q018'],family,q,
   ['Ein Schatzhinweis braucht die passende Information, nicht möglichst viele Wörter.','Prüfe die Fragen „Wo?“ und „Warum?“; beim Umstellen bleibt das finite Verb an zweiter Satzgliedposition.','Die Ortsangabe lautet „'+ort+'“, die Begründung „'+grund+'“.'],
   'Die verschiedenen Angaben liefern ergänzende Informationen. Sie lassen sich oft umstellen; „zweite Position“ bedeutet nicht „zweites Wort“.');
 });
})();
