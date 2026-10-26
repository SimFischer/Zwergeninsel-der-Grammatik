/* Kleine, bewusst vorläufige Beispielpools: 12 lexikalische Varianten je Tiefe.
   Aufgaben sind reine Daten. Weitere Aufgaben können an POOLS[id][tiefe] angehängt werden.
   answer bei Markieraufgaben = vollständige Liste der Token-Indizes (ab 0).
   answers bei Satzpuzzles = alle akzeptierten Reihenfolgen der Baustein-Indizes. */
(function(){
  const Z=window.ZI;
  const lex=[
    ['Hund','Hunde','der','er','schnell','schneller','läuft','lief','gelaufen','laufen'],
    ['Katze','Katzen','die','sie','leise','leiser','schleicht','schlich','geschlichen','schleichen'],
    ['Kind','Kinder','das','es','fröhlich','fröhlicher','singt','sang','gesungen','singen'],
    ['Vogel','Vögel','der','er','laut','lauter','ruft','rief','gerufen','rufen'],
    ['Maus','Mäuse','die','sie','klein','kleiner','sitzt','saß','gesessen','sitzen'],
    ['Pferd','Pferde','das','es','ruhig','ruhiger','steht','stand','gestanden','stehen'],
    ['Fuchs','Füchse','der','er','flink','flinker','springt','sprang','gesprungen','springen'],
    ['Ente','Enten','die','sie','langsam','langsamer','schwimmt','schwamm','geschwommen','schwimmen'],
    ['Schaf','Schafe','das','es','weich','weicher','schläft','schlief','geschlafen','schlafen'],
    ['Wolf','Wölfe','der','er','wild','wilder','rennt','rannte','gerannt','rennen'],
    ['Eule','Eulen','die','sie','wach','wacher','sieht','sah','gesehen','sehen'],
    ['Schwein','Schweine','das','es','munter','munterer','frisst','fraß','gefressen','fressen'],
  ].map(([n,pl,art,pro,adj,kom,v,past,part,inf])=>({n,pl,art,pro,adj,kom,v,past,part,inf}));
  const freundinnen=['Mila','Nora','Lina','Ada','Nele','Ida','Emma','Lea','Sara','Ayla','Thea','Clara'];
  const namen=['Mila','Ben','Nora','Emil','Lina','Omar','Ada','Paul','Nele','Tarek','Ida','Leon'];
  const upper=s=>s[0].toUpperCase()+s.slice(1);
  const adjForm=x=>x.adj.endsWith('e')?x.adj:x.adj+'e';
  const compounds=['Hundehütte','Katzenhütte','Kinderhütte','Vogelhütte','Mäusehütte','Pferdehütte','Fuchshütte','Entenhütte','Schafhütte','Wolfshütte','Eulenhütte','Schweinehütte'];
  const mc=(prompt,answer,options)=>({type:'choice',prompt,answer,options:[...new Set([answer,...options])]});
  const mark=(prompt,text,answer,type='mark')=>({type,prompt,tokens:text.split(' '),answer});
  const input=(type,prompt,answer)=>({type,prompt,solutions:Array.isArray(answer)?answer:[answer]});
  const repair=(prompt,text,answer,solutions)=>({type:'repair',prompt,tokens:text.split(' '),answer,solutions:Array.isArray(solutions)?solutions:[solutions]});
  const order=(prompt,parts,answers)=>({type:'order',prompt,parts,answers});
  const rules={
    nomen:['Nomen bezeichnen zum Beispiel Dinge, Lebewesen und Gefühle. Man schreibt sie groß. Ein Artikel kann helfen: der Mut.','der Hund – die Hunde'],
    verben:['Verben haben einen Infinitiv und Personalformen. Zeitformen bestehen manchmal aus mehreren Wörtern.','laufen – er läuft – er lief – er ist gelaufen – er wird laufen'],
    adjektive:['Adjektive beschreiben Eigenschaften. Viele kann man steigern. Vor einem Nomen passen sie ihre Endung an.','klein – kleiner – am kleinsten; ein kleiner Hund'],
    pronomen:['Pronomen können Nomen oder Nomengruppen ersetzen. Ihr Bezug muss klar sein. Possessivformen zeigen eine Zugehörigkeit.','Mila findet die Tasche. Sie hebt sie auf. Milas Buch → ihr Buch.'],
    faelle:['Die vier Fälle heißen Nominativ, Genitiv, Dativ und Akkusativ. Frage nach der ganzen Wortgruppe. Ein Fall ist keine Satzgliedfunktion.','Wer oder was? Wessen? Wem? Wen oder was?'],
    subjekt:['Das Subjekt steht im Nominativ. Frage: Wer oder was? Das gebeugte Verb passt in Person und Zahl zum Subjekt. Es muss keine handelnde Person sein.','Heute fehlt der kleine Hund. → Wer oder was fehlt? Der kleine Hund.'],
    praedikat:['Zum Prädikat gehören alle Verbteile. Bei trennbaren Verben und zusammengesetzten Zeitformen stehen die Teile oft auseinander.','Mila räumt die Kiste auf. → räumt … auf; Sie hat sie aufgeräumt. → hat … aufgeräumt'],
    objekte:['Objekte ergänzen ein Verb. Frage zum Verb: Wem? (Dativobjekt), Wen oder was? (Akkusativobjekt). Nicht jede Wortgruppe im Dativ ist ein Objekt.','Mila gibt dem Kind einen Ball. → Wem gibt sie einen Ball? Dem Kind.'],
    adverbialien:['Adverbialien geben Ort, Zeit, Grund oder Art und Weise an. Frage: Wo? Wann? Warum? Wie?','Heute (Zeit) spielt Mila im Garten (Ort).'],
    satzbau:['Im Aussagesatz steht das gebeugte Verb an zweiter Satzgliedstelle. Wortgruppen können dabei aus mehreren Wörtern bestehen. Die Umstellprobe hilft.','Heute | baut | Mila | eine Hütte. Mila | baut | heute | eine Hütte.'],
    verbinden:['Und und aber verbinden zum Beispiel Hauptsätze. Weil leitet einen Nebensatz ein. Dort steht das gebeugte Verb am Ende. Ein Komma trennt Haupt- und Nebensatz.','Mila bleibt drinnen, weil es regnet. Weil es regnet, bleibt Mila drinnen.'],
  };
  Z.LERNZIELE={
    nomen:['Nomen erkennen','Plural und Artikel','Zusammensetzungen','Großschreibung und Wortbildung','Fehlerjagd und Transfer'],
    verben:['Verben und Infinitiv','Personalformen','Vier Zeitformen','Unregelmäßige und mehrteilige Formen','Verbformen reparieren'],
    adjektive:['Adjektive erkennen','Steigerung','Passende Endungen','Wortwahl und Wirkung','Texte überarbeiten'],
    pronomen:['Nomen ersetzen','Bezüge finden','Possessivformen','Unklare Bezüge','Textüberarbeitung'],
    faelle:['Fälle und Fragen','Formen verändern','Vollständige Wortgruppen','Kasus im Kontext','Kasus reparieren'],
    subjekt:['Einfache Subjekte','Vollständige Gruppen','Wechselnde Positionen','Kongruenz','Transfer'],
    praedikat:['Einteiliges Prädikat','Trennbare Verben','Mehrteilige Prädikate','Satzklammer','Vollständige Prädikate'],
    objekte:['Dativ und Akkusativ','Vollständige Gruppen','Mehrere Objekte','Ergänzungen zum Verb','Objekte unterscheiden'],
    adverbialien:['Ort, Zeit, Grund, Art und Weise','Genaue Angaben','Mehrere Angaben','Sinnvoll ergänzen','Textgestaltung'],
    satzbau:['Satzarten und Satzbau','Umstellprobe','Feldermodell','Varianten und Wirkung','Satzpuzzles reparieren'],
    verbinden:['Hauptsätze verbinden','Haupt- und Nebensatz','Nebensatz umstellen','Passende Verknüpfung','Textüberarbeitung'],
  };
  const templates={
    nomen:[
      x=>mark('Markiere alle Nomen.',`${upper(x.art)} ${x.n} ist ${x.adj} .`,[1]),
      x=>input('form',`Bilde den Plural mit Artikel: ${x.art} ${x.n} → …`,['die '+x.pl]),
      (x,j)=>mc(`Welches zusammengesetzte Nomen bezeichnet eine Hütte für ${x.pl}?`,compounds[j],[x.n+' Hütte',compounds[j].toLowerCase()]),
      x=>mark('Markiere alle Nomen. Auch eine Tätigkeit kann als Nomen gebraucht sein.',`Beim ${upper(x.inf)} ist ${x.art} ${x.n} ${x.adj} .`,[1,4],'groups'),
      x=>repair('Markiere die falsch geschriebenen Nomen. Schreibe den ganzen Satz richtig.',`${upper(x.art)} ${x.n.toLowerCase()} findet eine kiste .`,[1,4],`${upper(x.art)} ${x.n} findet eine Kiste.`),
    ],
    verben:[
      x=>mc(`Wie lautet der Infinitiv zu „${x.v}“?`,x.inf,[x.past,x.part]),
      x=>input('form',`Setze das Verb in die passende Personalform: ${upper(x.art)} ${x.n} … (${x.inf}).`,x.v),
      (x,j)=>{const aux=[0,1,6,7,9].includes(j)?'ist':'hat'; const s=[`${upper(x.art)} ${x.n} ${x.v}.`,`${upper(x.art)} ${x.n} ${x.past}.`,`${upper(x.art)} ${x.n} ${aux} ${x.part}.`,`${upper(x.art)} ${x.n} wird ${x.inf}.`];return {type:'match',prompt:'Verbinde die Sätze mit ihren Zeitformen.',items:s,categories:['Präsens','Präteritum','Perfekt','Futur I'],answer:['Präsens','Präteritum','Perfekt','Futur I']};},
      x=>mark('Markiere die ganze Verbform im Futur I.',`${upper(x.art)} ${x.n} wird morgen ${x.inf} .`,[2,4],'groups'),
      x=>repair('Markiere die falsche Verbform. Schreibe den Satz im Präteritum richtig.',`${upper(x.art)} ${x.n} ${x.inf} gestern .`,[2],`${upper(x.art)} ${x.n} ${x.past} gestern.`),
    ],
    adjektive:[
      x=>mark('Markiere das Adjektiv.',`${upper(x.art)} ${x.n} ist ${x.adj} .`,[3]),
      x=>input('form',`Steigere: ${x.adj} → … → am …sten. Schreibe nur den Komparativ.`,x.kom),
      x=>input('gap',`Ergänze die Form von „${x.adj}“: das … Tier`,adjForm(x)),
      x=>mc(`„${upper(x.art)} ${x.n} ist ${x.adj}.“ Vergleiche: „… ist ${x.kom}.“ Was drückt die zweite Form aus?`,'einen Vergleich',['die Vergangenheit','eine Mehrzahl']),
      x=>input('transfer',`Überarbeite die Wortgruppe „das Tier“ mit „${x.adj}“. Schreibe die ganze Wortgruppe.`,`das ${adjForm(x)} Tier`),
    ],
    pronomen:[
      x=>mc(`Ersetze „${x.art} ${x.n}“: ${upper(x.art)} ${x.n} ${x.v}.`,x.pro,['er','sie','es']),
      (x,j)=>mark('Markiere das Bezugswort von „Es“.',`${namen[j]} sieht das Kind . Es winkt .`,[3]),
      (x,j)=>input('gap',`Die Kiste gehört ${namen[j]}. ${namen[j]} sagt: „Das ist … Kiste.“`,'meine'),
      (x,j)=>mc(`${freundinnen[j]} trifft Hilda. Sie trägt eine Tasche. Welcher Satz zeigt eindeutig, dass Hilda die Tasche trägt?`,'Hilda trägt eine Tasche.',[`${freundinnen[j]} trägt eine Tasche.`,'Sie trägt sie.']),
      (x,j)=>input('transfer',`Mache den Bezug eindeutig. Ersetze nur „Sie“ durch Hilda: „${freundinnen[j]} sieht Hilda. Sie trägt das Buch.“`,`${freundinnen[j]} sieht Hilda. Hilda trägt das Buch.`),
    ],
    faelle:[
      (x,j)=>{const pairs=[['Wer oder was?','Nominativ'],['Wessen?','Genitiv'],['Wem?','Dativ'],['Wen oder was?','Akkusativ']];const p=pairs[j%4];return mc(`Welcher Fall passt zur Frage „${p[0]}“? Beispielwort: ${x.art} ${x.n}.`,p[1],['Nominativ','Genitiv','Dativ','Akkusativ']);},
      (x,j)=>input('form',`Setze „der Hund“ in den Dativ: ${namen[j]} hilft … .`,'dem Hund'),
      (x,j)=>mark('Markiere die vollständige Wortgruppe im Dativ.',`${namen[j]} hilft dem kleinen Kind .`,[2,3,4],'groups'),
      (x,j)=>mc(`„${namen[j]} sucht den kleinen Hund.“ In welchem Fall steht „den kleinen Hund“?`,'Akkusativ',['Dativ','Nominativ','Genitiv']),
      (x,j)=>repair('Markiere das falsche Wort. „Helfen“ verlangt hier den Dativ. Schreibe den Satz richtig.',`${namen[j]} hilft den Kind .`,[2],`${namen[j]} hilft dem Kind.`),
    ],
    subjekt:[
      (x,j)=>mark('Markiere das Subjekt. Frage: Wer oder was?',`${namen[j]} findet eine Kiste .`,[0]),
      x=>mark('Markiere das vollständige Subjekt.',`Das kleine Tier ${x.v} .`,[0,1,2],'groups'),
      (x,j)=>mark('Markiere das Subjekt, auch wenn es hinten steht.',`Heute fehlt ${namen[j]} .`,[2]),
      x=>input('gap',`Achte auf die Zahl: Die ${x.pl} … (${x.inf}).`,x.inf),
      (x,j)=>input('transfer',`Ersetze das Subjekt und passe das Verb an: „${namen[j]} findet die Kiste.“ Beginne mit „Die Kinder“.`,'Die Kinder finden die Kiste.'),
    ],
    praedikat:[
      x=>mark('Markiere das Prädikat.',`${upper(x.art)} ${x.n} ${x.v} .`,[2]),
      (x,j)=>mark('Markiere beide Teile des Prädikats.',`${namen[j]} räumt die Kiste auf .`,[1,4],'groups'),
      (x,j)=>mark('Markiere das vollständige Prädikat im Perfekt.',`${namen[j]} hat die Kiste geöffnet .`,[1,4],'groups'),
      (x,j)=>({type:'sort',prompt:`Satzklammer: ${namen[j]} wird morgen die Kiste öffnen. Ordne die Bausteine.`,items:['wird','morgen','die Kiste','öffnen'],categories:['linke Klammer','Mittelfeld','rechte Klammer'],answer:['linke Klammer','Mittelfeld','Mittelfeld','rechte Klammer']}),
      (x,j)=>mark('Markiere alle Verbteile. Es sind drei.',`${namen[j]} wird die Kiste öffnen können .`,[1,4,5],'groups'),
    ],
    objekte:[
      (x,j)=>mc(`„${namen[j]} hilft dem Kind.“ Welche Frage findet das Objekt?`,'Wem hilft '+namen[j]+'?',['Wer hilft?','Wann hilft '+namen[j]+'?']),
      (x,j)=>mark('Markiere das vollständige Akkusativobjekt.',`${namen[j]} sucht den kleinen Hund .`,[2,3,4],'groups'),
      (x,j)=>mark('Markiere beide vollständigen Objekte.',`${namen[j]} gibt dem Kind einen Ball .`,[2,3,4,5],'groups'),
      (x,j)=>input('gap',`Ergänze das Dativobjekt „das Kind“: ${namen[j]} schenkt … ein Buch.`,'dem Kind'),
      (x,j)=>({type:'match',prompt:`${namen[j]} gibt dem Kind im Garten einen Ball. Verbinde die Gruppen mit ihrer Funktion.`,items:['dem Kind','im Garten','einen Ball'],categories:['Dativobjekt','Ortsangabe','Akkusativobjekt'],answer:['Dativobjekt','Ortsangabe','Akkusativobjekt']}),
    ],
    adverbialien:[
      (x,j)=>{const a=[['im Garten','Ort'],['am Morgen','Zeit'],['wegen des Regens','Grund'],['mit großer Sorgfalt','Art und Weise']][j%4];return mc(`„${namen[j]} arbeitet ${a[0]}.“ Was gibt „${a[0]}“ an?`,a[1],['Ort','Zeit','Grund','Art und Weise']);},
      (x,j)=>mark('Markiere die vollständige Zeitangabe.',`${namen[j]} liest am frühen Morgen .`,[2,3,4],'groups'),
      (x,j)=>mark('Markiere die Ortsangabe und die Zeitangabe.',`Heute liest ${namen[j]} im Garten .`,[0,3,4],'groups'),
      (x,j)=>input('gap',`Ergänze die Ortsangabe. Nutze genau „im Garten“: ${namen[j]} arbeitet … .`,'im Garten'),
      (x,j)=>input('transfer',`Baue einen Satz mit diesen Angaben: ${namen[j]} / liest / heute / im Garten. Beginne mit „Heute“.`,`Heute liest ${namen[j]} im Garten.`),
    ],
    satzbau:[
      (x,j)=>mc(`„Findet ${namen[j]} die Kiste?“ Welche Satzart ist das?`,'Fragesatz',['Aussagesatz','Aufforderungssatz']),
      (x,j)=>order('Baue einen Aussagesatz. Es gibt mehrere richtige Reihenfolgen.',[namen[j],'findet','heute','die Kiste'],[[0,1,2,3],[0,1,3,2],[2,1,0,3],[2,1,3,0],[3,1,0,2],[3,1,2,0]]),
      (x,j)=>({type:'match',prompt:`Heute wird ${namen[j]} die Kiste öffnen. Ordne im Feldermodell zu.`,items:['Heute','wird',namen[j]+' die Kiste','öffnen'],categories:['Vorfeld','linke Klammer','Mittelfeld','rechte Klammer'],answer:['Vorfeld','linke Klammer','Mittelfeld','rechte Klammer']}),
      (x,j)=>input('transfer',`Betone die Zeitangabe. Stelle „${namen[j]} liest heute im Garten.“ so um, dass „Heute“ am Anfang steht.`,`Heute liest ${namen[j]} im Garten.`),
      (x,j)=>repair('Die Verbposition stimmt nicht. Markiere das gebeugte Verb und schreibe den Satz richtig. Beginne mit „Heute“.',`Heute ${namen[j]} die Kiste öffnet .`,[4],`Heute öffnet ${namen[j]} die Kiste.`),
    ],
    verbinden:[
      (x,j)=>input('gap',`Verbinde mit „und“: ${namen[j]} liest … Hilda malt.`,'und'),
      (x,j)=>order('Baue Hauptsatz und weil-Nebensatz.',[namen[j]+' bleibt drinnen,','weil','es','regnet.'],[[0,1,2,3]]),
      (x,j)=>order('Stelle den weil-Nebensatz nach vorn. Achte auf das Verb direkt nach dem Nebensatz.', ['Weil es regnet,','bleibt',namen[j],'drinnen.'],[[0,1,2,3]]),
      (x,j)=>mc(`Welcher Satz nennt einen Grund dafür, dass ${namen[j]} drinnen bleibt?`,`${namen[j]} bleibt drinnen, weil es regnet.`,[`${namen[j]} bleibt drinnen, obwohl die Sonne scheint.`,`${namen[j]} bleibt drinnen und liest.`]),
      (x,j)=>repair('Markiere das Verb im weil-Nebensatz. Schreibe den ganzen Satz mit richtiger Verbstellung.',`${namen[j]} bleibt drinnen, weil regnet es .`,[4],`${namen[j]} bleibt drinnen, weil es regnet.`),
    ],
  };
  Z.WISSEN=rules;
  Z.POOLS={};
  Z.STOLLEN.forEach(s=>{
    Z.POOLS[s.id]={};
    for(let tiefe=1;tiefe<=5;tiefe++){
      Z.POOLS[s.id][tiefe]=lex.map((x,j)=>{
        const q=templates[s.id][tiefe-1](x,j);
        q.id=`${s.id}-${tiefe}:${j}`;
        q.hints=[`Achte auf „${Z.LERNZIELE[s.id][tiefe-1]}“.`,rules[s.id][0],q.type==='groups'?'Suche die vollständige Gruppe oder alle getrennten Teile.':`Nutze dieses Beispiel als Muster: ${rules[s.id][1]}`];
        if(['mark','groups'].includes(q.type))q.hints[2]='Gesucht sind '+q.answer.length+' Wörter. Eines davon ist „'+q.tokens[q.answer[0]]+'“.';
        if(q.type==='repair')q.hints[2]='Markiere '+q.answer.length+' Fehlerstelle(n). Deine Verbesserung beginnt mit „'+q.solutions[0].split(' ').slice(0,2).join(' ')+'“.';
        if(q.type==='order')q.hints[2]='Eine mögliche Reihenfolge beginnt so: '+q.answers[0].slice(0,2).map(i=>q.parts[i]).join(' ');
        if(q.solutions&&q.type!=='repair')q.hints[2]='Die gesuchte Formulierung beginnt mit „'+q.solutions[0].split(' ')[0]+'“. Prüfe die Regel noch einmal.';
        q.explanation=rules[s.id][0]; return q;
      });
    }
  });
})();
