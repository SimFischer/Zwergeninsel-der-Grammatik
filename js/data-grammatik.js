/* Unterrichtsbasierte Grammatikpools. Q-Kennungen entsprechen dem Quellenverzeichnis
   der Materialbasis vom 26.10.2026. Quellen bleiben außerhalb des Repositories.
   Jede Aufgabe nennt Muster A01–A42, Quelle, Bearbeitungsart und Aufgabenfamilie.
   Die Kapiteldateien füllen die bestehenden POOLS; es gibt keine Sonderfälle in app.js. */
(function(){
  const Z=window.ZI;
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
  Z.LERNZIELE={};
  Z.WISSEN=rules;
  Z.POOLS=Object.fromEntries(Z.STOLLEN.map(s=>[s.id,Object.fromEntries([1,2,3,4,5].map(d=>[d,[]]))]));
  Z.QUELLEN={
    Q001:'Wortarten sicher unterscheiden und verwenden · Aufgaben 1–9',
    Q003:'Haupt- und Nebensatz · Aufgaben 1–3',
    Q005:'Satzarten · Satzschlusszeichen und Fragen',
    Q006:'Satzglieder · Limonade und Umstellprobe',
    Q008:'Das Prädikat als Satzkern',
    Q011:'Ferienbericht mit grammatischen Vorgaben',
    Q013:'Das Objekt · Kletterwettkampf und Junior-Detektive',
    Q015:'Adverbialien · fehlende Angaben bei der Schatzsuche',
    Q017:'Genaue Angaben · Zeitreise zu den Wikingern',
    Q018:'Auf den Spuren von Ivar · Wortspeicher',
    Q022:'Finite und infinite Verbformen · fachlich berichtigt',
    Q025:'Wir üben die vier Fälle · Seeräuber, Insel, Seeungeheuer',
    Q026:'Mini-Übungsheft Subjekt und Prädikat · Lösung fachlich geprüft',
    Q028:'Grammatiktest · sechs Aufgabenbereiche',
    Q032:'Der Roboter baut einen Computer · Rollenwechsel',
    Q035:'Passende Nomen verwenden · Präzisierung statt bloßer Synonymie',
    Q036:'Wirkung von Adjektiven · Lasse und Jana',
    Q037:'Adjektive verändern · Stimmung, Formen und Steigerung',
    Q038:'Ball im Nachbargarten · Stimmung überarbeiten',
    Q041:'Wortspeicher Adjektive',
    Q042:'Die vier Fälle · Frageprobe und Einsetzen',
    Q043:'Kasus und Pronomen · Folienbilder 2–5, Weltraum und Zauberring',
    Q045:'Sherlock-Holmes-Fehlerjagd mit Fehlerzahl',
    Q047:'Die Stadt im Mittelalter · Nomen großschreiben',
    Q049:'Wortarten-/Kasus-Stadt-Land-Fluss',
    Q050:'Deklinationstabelle Schiff, Tisch und Blume',
    Q051:'Kasusbeispiel Hund/Mann · Bedeutung durch Formen',
    Q052:'Satzfragmente vervollständigen',
    Q056:'Umstellprobe und Satzklammer',
    Q059:'Schwache, starke und gemischte Verben',
    Q061:'Trennbare und nicht trennbare starke Verben',
    Q063:'Das Subjekt · Grammatikwerkstatt',
    Q064:'Das Akkusativobjekt · Grammatikwerkstatt',
    Q077:'Lösungen Grammatikwerkstatt · fachlich geprüft',
    Q082:'Verbkarten: lachen, kneifen, nennen und weitere',
    Q084:'Verbkarten: trennbare und nicht trennbare Verben',
    Q126:'Feldermodell, Umstellprobe und Ersatzprobe · Folien 2–15',
  };
  const prefix={nomen:'NOM',verben:'VER',adjektive:'ADJ',pronomen:'PRO',faelle:'KAS',subjekt:'SUB',praedikat:'PRA',objekte:'OBJ',adverbialien:'ADV',satzbau:'SAT',verbinden:'VERBIND'};
  const tok=s=>s.match(/[^\s,.;:!?]+|[,.;:!?]/gu)||[];
  function annotation(s){
    const tokens=[],answer=[],groups=[];
    for(const part of s.split(/(\{[^{}]+\})/g)){
      const selected=part.startsWith('{')&&part.endsWith('}'),group=[];
      for(const word of tok(selected?part.slice(1,-1):part)){
        if(selected&&!/^[,.;:!?]$/.test(word)){answer.push(tokens.length);group.push(tokens.length);}
        tokens.push(word);
      }
      if(group.length)groups.push(group);
    }
    return {tokens,answer,targetGroups:groups};
  }
  Z.fachLabel=s=>String(s).replace(/\bSingular\b(?! \(Einzahl\))/g,'Singular (Einzahl)').replace(/\bPlural\b(?! \(Mehrzahl\))/g,'Plural (Mehrzahl)').replace(/\bInfinitiv\b(?! \(Grundform\))/g,'Infinitiv (Grundform)').replace(/\bbestimmter Artikel\b(?! \(der)/gi,'bestimmter Artikel (der, die, das)').replace(/\bKomparativ\b(?! \(1\.)/g,'Komparativ (1. Steigerungsform)').replace(/\bSuperlativ\b(?! \(höchste)/g,'Superlativ (höchste Steigerungsform)');
  Z.feldLabel=(q,f)=>{let label=f.label;if(q.degreeExample){const ex=/Komparativ/.test(label)?q.degreeExample[1]:/Superlativ/.test(label)?q.degreeExample[2]:null;if(ex)label+=' · z. B. '+ex;}return (f.slot?'('+f.slot+') ':'')+label;};
  Z.wortAnzeige=(q,i)=>q.letterCase==='lower'?q.tokens[i].toLowerCase():q.tokens[i];
  function lueckensatz(q,s,feldIndices=q.fields.map((_,i)=>i)){
    if(new Set(feldIndices).size!==feldIndices.length||feldIndices.some(i=>!Number.isInteger(i)||i<0||i>=q.fields.length))throw Error('Ungültige Zuordnung zwischen Satzlücken und Feldern');
    let index=0;q.gapTemplate=s.split(/(\{[^{}]+\})/g).filter(Boolean).map(p=>p.startsWith('{')?{field:feldIndices[index++]}:p);
    if(index!==feldIndices.length)throw Error('Lücken und Felder passen nicht: '+s);
    q.context=q.gapTemplate.map(p=>typeof p==='string'?p:'___ ('+(p.field+1)+')').join('');feldIndices.forEach((f,i)=>q.fields[f].slot=i+1);return q;
  }
  const sol=v=>Array.isArray(v)?v:[v];
  const mc=(prompt,answer,options,context)=>({type:'choice',prompt,context,answer:sol(answer)[0],acceptedAnswers:sol(answer),options:[...new Set([...sol(answer),...options])],multipleSolutions:sol(answer).length>1});
  const mark=(prompt,s,type='mark')=>({type,prompt,...annotation(s)});
  const fields=(type,prompt,rows,context)=>({type,prompt,context,fields:rows.map(r=>({label:Z.fachLabel(r[0]),solutions:sol(r[1]),...(r[2]?{options:r[2]}:{})})),multipleSolutions:rows.some(r=>sol(r[1]).length>1)});
  const input=(type,prompt,solutions,context)=>({type,prompt,context,solutions:sol(solutions),multipleSolutions:sol(solutions).length>1});
  const assign=(type,prompt,items,answer,categories=[...new Set(answer)],context)=>({type,prompt,items,answer:answer.map(Z.fachLabel),categories:categories.map(Z.fachLabel),context});
  const order=(prompt,parts,answers,context)=>({type:'order',prompt,parts,answers,context,multipleSolutions:answers.length>1});
  function repair(s,solution,count,prompt='Markiere die fehlerhaften Wörter und schreibe den Satz richtig.'){
    const data=annotation(s);if(data.answer.length!==count)throw Error('Fehlerzahl passt nicht: '+s);
    const correct=tok(solution);if(correct.length!==data.tokens.length)throw Error('Reparatur verändert Tokenzahl: '+s);
    const changed=correct.flatMap((word,i)=>word!==data.tokens[i]?[i]:[]);
    if(JSON.stringify(changed)!==JSON.stringify(data.answer))throw Error('Fehlerstellen passen nicht zur Verbesserung: '+s);
    return {type:'repair',prompt:'Fehlerjagd: '+count+' Wortfehler. '+prompt,...data,solutions:[solution],errorCount:count,corrections:changed.map(i=>({index:i,from:data.tokens[i],to:correct[i]}))};
  }
  function add(stollen,tiefe,band,muster,quellen,family,q,hints,explanation,art='materialnah entwickelt'){
    if(q.type==='gap'&&q.fields&&!q.gapTemplate&&q.context?.includes('___')){
      let n=0;const annotated=q.context.replace(/___/g,()=>'{'+(n++)+'}');lueckensatz(q,annotated,q.fields.slice(0,n).map((_,i)=>i));
    }
    const pool=Z.POOLS[stollen][tiefe];
    q.id=prefix[stollen]+'_T'+tiefe+'_'+q.type.toUpperCase()+'_'+muster+'_'+String(pool.length+1).padStart(3,'0');
    if(q.type==='order')q.lowercaseParts=q.parts.flatMap((p,i)=>/^(Der|Die|Das|Den|Dem|Ein|Eine|Einen|Einem)( |$)/.test(p)?[i]:[]);
    q.stollen=stollen;q.tiefe=tiefe;q.band=band;q.pattern=muster;q.family=stollen+':'+family;
    q.source={quellen:sol(quellen),muster,bearbeitung:art};q.hints=hints;q.explanation=explanation;
    if(hints.length!==3||hints.some(h=>!h))throw Error('Drei fachliche Hilfen fehlen: '+q.id);
    pool.push(q);return q;
  }
  Z.G={tok,annotation,mc,mark,fields,input,assign,order,repair,add,sol,lueckensatz,upper:s=>s.charAt(0).toUpperCase()+s.slice(1)};
  // Innerhalb jeder Tiefe bleibt derselbe Kompetenzkern erhalten.
  for(const s of Z.STOLLEN)Z.LERNZIELE[s.id]=[
    'Mit klaren Beispielen erkennen und anwenden',
    'Formen und Varianten sicher unterscheiden',
    'Selbstständig im Satz anwenden',
    'Größere Zusammenhänge untersuchen',
    'Fehler aufspüren und Sprache überarbeiten',
  ];
})();
