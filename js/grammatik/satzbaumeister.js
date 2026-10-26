/* Satzbaumeister: Fragmente, Umstell-/Ersatzprobe und Feldermodell aus Q005,
   Q006, Q052, Q056 und Q126. Mehrere Wortstellungen sind ausdrücklich zulässig. */
(function(){
 const Z=window.ZI,G=Z.G,{add,mc,mark,fields,order,repair}=G;
 const bank=[
  ['Der kleine Zwerg','trägt','am Morgen','den schweren Sack','','tragen','Wer trägt am Morgen den schweren Sack?','Trage den schweren Sack!'],
  ['Die Mannschaft','gewinnt','heute','den Wettkampf','','gewinnen','Gewinnt die Mannschaft heute den Wettkampf?','Gewinnt heute den Wettkampf!'],
  ['Hilda','hat','gestern','den alten Bauplan','gefunden','haben','Hat Hilda gestern den alten Bauplan gefunden?','Finde den alten Bauplan!'],
  ['Die Schatzsucher','öffnen','nach dem Regen','die schwere Truhe','','öffnet','Wann öffnen die Schatzsucher die schwere Truhe?','Öffnet die schwere Truhe!'],
  ['Kira','räumt','vor dem Fest','die Werkstatt','auf','räumen','Räumt Kira vor dem Fest die Werkstatt auf?','Räume die Werkstatt auf!'],
  ['Die Helfer','müssen','am Abend','das Holz','stapeln','muss','Was müssen die Helfer am Abend stapeln?','Stapelt das Holz!'],
  ['Leo','wird','morgen','den Schlüssel','bringen','werden','Wird Leo morgen den Schlüssel bringen?','Bring den Schlüssel!'],
  ['Die Detektivin','untersucht','nach der Pause','das beschädigte Seil','','untersuchen','Was untersucht die Detektivin nach der Pause?','Untersuche das beschädigte Seil!'],
  ['Die Seeräuber','haben','in der Nacht','das Schiff','verlassen','hat','Wann haben die Seeräuber das Schiff verlassen?','Verlasst das Schiff!'],
  ['Der Kapitän','holt','vor der Abfahrt','die Karte','heraus','holen','Holt der Kapitän vor der Abfahrt die Karte heraus?','Hole die Karte heraus!'],
  ['Die Kinder','lesen','nach dem Essen','den geheimen Brief','','liest','Was lesen die Kinder nach dem Essen?','Lest den geheimen Brief!'],
  ['Brumm','kann','seit gestern','die Maschine','bedienen','können','Kann Brumm seit gestern die Maschine bedienen?','Bediene die Maschine!'],
 ];
 for(let d=1;d<=5;d++)bank.forEach(([sub,v,zeit,obj,end,falsch,frage,befehl],j)=>{
  const family='satzbau-'+j,parts=[sub,v,zeit,obj,...(end?[end]:[]),'.'],a=parts.map((_,i)=>i),s=parts.slice(0,-1).join(' ')+'.',right=end||'leer';let q;
  if(d===1){const texts=[s,frage,befehl,['Wie schwer ist dieser Sack!','Was für ein spannender Wettkampf!','Wie alt ist dieser Bauplan!','Wie schwer ist diese Truhe!','Wie ordentlich ist diese Werkstatt!','Was für ein hoher Holzstapel!','Wie klein ist dieser Schlüssel!','Wie stark ist dieses Seil beschädigt!','Was für ein riesiges Schiff!','Wie genau ist diese Karte!','Was für ein geheimnisvoller Brief!','Wie laut ist diese Maschine!'][j]],typ=['Aussagesatz','Fragesatz','Aufforderung','Ausruf'],k=j%4;q=mc('Welche Satzart erkennst du?',typ[k],typ,texts[k]);}
  else if(d===2)q=mark('Markiere die Wortgruppe, die als Ganzes die Zeit nennt.',sub+' '+v+' {'+zeit+'} '+obj+(end?' '+end:'')+'.','groups');
  else if(d===3)q=mark('Markiere die vollständige Wortgruppe, die durch „ihn“, „sie“ oder „es“ ersetzt werden kann.',sub+' '+v+' '+zeit+' {'+obj+'}'+(end?' '+end:'')+'.','groups');
  else if(d===4){q=order('Beginne mit der Zeitangabe. Halte die übrigen Satzglieder zusammen.',parts,[[2,1,0,3,...(end?[4]:[]),parts.length-1]],s);}
  else {const broken=parts.slice(0,-1).map((p,i)=>i===1?'{'+falsch+'}':p).join(' ')+'.';q=repair(broken,s,1,'Prüfe die finite Verbform beim Subjekt.');}
  add('satzbau',d,'sicherung',d===1?'A20':d===5?'A19':'A22',['Q005','Q056'],family,q,
   ['Prüfe die Satzglieder und die finite Verbform.','Eine Wortgruppe kann mehrere Wörter lang sein. Im Aussagesatz steht die finite Verbform an zweiter Satzgliedposition.','Finite Verbform: „'+v+'“. Zeitangabe: „'+zeit+'“. Fragezeichen stehen bei direkten Fragen.'],
   'Der Satz hat die finite Verbform „'+v+'“. Die vollständige Zeitangabe „'+zeit+'“ kann gemeinsam verschoben werden.');
  if(d===1)q=fields('gap','Vervollständige das Satzfragment mit einem passenden Baustein.',[['fehlendes Satzglied',obj,[obj,zeit]],['Satzschlusszeichen','.' ,['.','?','!']]],sub+' '+v+' '+zeit+' ___'+(end?' '+end:'')+' (sachliche Aussage)');
  else if(d===2)q=fields('form','Nutze das Feldermodell. Trage die Bausteine der Vorlage ein.',[['Vorfeld',sub],['linke Satzklammer (finite Form)',v],['Mittelfeld',zeit+' '+obj],['rechte Satzklammer',right]],s+' Wenn die rechte Klammer leer ist, schreibe „leer“.');
  else if(d===3)q=fields('form','Stelle die Zeit ins Vorfeld. Welche Bausteine stehen dann in den Feldern?', [['Vorfeld',zeit],['linke Satzklammer',v],['Mittelfeld',sub.charAt(0).toLowerCase()+sub.slice(1)+' '+obj],['rechte Satzklammer',right]],s+' Behalte Namen groß. Eine leere rechte Klammer heißt „leer“.');
  else if(d===4)q=fields('transfer','Baue aus der Aussage eine Entscheidungsfrage. Wähle den Satz und das Schlusszeichen.',[['Fragesatz',v.charAt(0).toUpperCase()+v.slice(1)+' '+sub.charAt(0).toLowerCase()+sub.slice(1)+' '+zeit+' '+obj+(end?' '+end:'')+'?', [s,v.charAt(0).toUpperCase()+v.slice(1)+' '+sub.charAt(0).toLowerCase()+sub.slice(1)+' '+zeit+' '+obj+(end?' '+end:'')+'?']],['Satzschlusszeichen','?',['.','?','!']]],s);
  else q=fields('transfer','Überprüfe das Feldermodell nach dem Umstellen.',[['Vorfeld',obj],['finite Verbform',v],['vollständiges Subjekt',sub],['rechte Satzklammer',right]],G.upper(obj)+' '+v+' '+sub.charAt(0).toLowerCase()+sub.slice(1)+' '+zeit+(end?' '+end:'')+'.');
  // Namen werden auch nach dem Umstellen großgeschrieben.
  const midSub=/^(Der|Die|Das) /.test(sub)?sub.charAt(0).toLowerCase()+sub.slice(1):sub;
  if(d===3)q.fields[2].solutions=[midSub+' '+obj];
  if(d===4){const f=G.upper(v)+' '+midSub+' '+zeit+' '+obj+(end?' '+end:'')+'?';q.fields[0].solutions=[f];q.fields[0].options=[s,f];}
  if(d===5)q.context=G.upper(obj)+' '+v+' '+midSub+' '+zeit+(end?' '+end:'')+'.';
  add('satzbau',d,'kern',d===1?'A21':'A23',['Q052','Q126'],family,q,
   ['Zerlege den Satz in zusammengehörige Bausteine.','Im Aussagesatz steht genau ein Satzglied im Vorfeld. Danach kommt die finite Verbform. Eine Entscheidungsfrage beginnt mit dem finiten Verb.','Die finite Form ist „'+v+'“. '+(end?'Die rechte Klammer ist „'+end+'“.':'Die rechte Klammer bleibt leer.')],
   'Beim Umstellen wandert ein vollständiges Satzglied ins Vorfeld. Die finite Verbform bleibt im Aussagesatz an zweiter Position.');
  if(d===5)q=fields('transfer','Setze den kurzen Bericht zusammen: Aussage, Frage und Aufforderung.',[['sachliche Aussage',s,[s,frage,befehl]],['Frage',frage,[s,frage,befehl]],['Aufforderung',befehl,[s,frage,befehl]]],'Der Bericht braucht drei unterschiedliche Satzarten.');
  else q=order('Baue einen Aussagesatz. Beginne mit dem Subjekt, der Zeit oder dem Objekt. Auch danach kannst du ganze Satzglieder umstellen.',parts,[[0,2,3],[0,3,2],[2,0,3],[2,3,0],[3,0,2],[3,2,0]].map(ids=>[ids[0],1,ids[1],ids[2],...(end?[4]:[]),parts.length-1]));
  add('satzbau',d,'transfer',d===5?'A36':'A23',['Q005','Q056','Q126'],family,q,
   ['Verschiebe ganze Satzglieder und prüfe den Sinn.','Im Aussagesatz steht vor dem finiten Verb genau ein Satzglied, das auch mehrere Wörter lang sein kann.','Zeitangabe „'+zeit+'“ und Objekt „'+obj+'“ bleiben beim Verschieben zusammen.'],
   'Es gibt mehrere richtige Wortstellungen. Im Aussagesatz hält die zweite Satzgliedposition die finite Verbform; ein weiterer Verbteil kann die rechte Klammer bilden.');
 });
})();
/* Verknüpfen statt Konjunktionen raten: Beziehungen und Verbposition aus Q003. */
(function(){
 const Z=window.ZI,G=Z.G,{add,mc,mark,fields,order}=G;
 // Hauptsatzbausteine; Nebensatzbausteine; Beziehung.
 const bank=[
  ['Hilda','bleibt','in der Werkstatt','weil','der Sturm','zu stark','ist','Grund'],
  ['Brumm','holt','einen Verband','weil','das Seil','eine Wunde verursacht','hat','Grund'],
  ['Die Mannschaft','jubelt','laut','als','der Schiedsrichter','das Spiel','abpfeift','Zeitpunkt'],
  ['Die Crew','prüft','das Segel','bevor','das Schiff','den Hafen','verlässt','Reihenfolge'],
  ['Die Wikinger','rudern','zum Ufer','während','die Sonne','über dem Meer','aufgeht','Gleichzeitigkeit'],
  ['Die Schatzsucher','öffnen','die Truhe','nachdem','Kira','den Schlüssel gefunden','hat','Reihenfolge'],
  ['Leo','nimmt','den Ring mit','obwohl','der Kapitän','ihn davor','warnt','Gegensatz'],
  ['Die Detektivin','betrachtet','das Video','weil','sie','die Spur genauer sehen','möchte','Grund'],
  ['Die Kinder','bleiben','im Haus','bis','der Regen','','aufhört','Zeitgrenze'],
  ['Svea','zeichnet','eine neue Karte','während','Hilda','die Expedition','vorbereitet','Gleichzeitigkeit'],
  ['Die Seeräuber','verlassen','das Schiff','bevor','es','im Hafen','sinkt','Reihenfolge'],
  ['Die Zwerge','suchen','weiter','obwohl','sie','schon müde','sind','Gegensatz'],
 ];
 for(let d=1;d<=5;d++)bank.forEach(([sub,v,rest,kon,ns,nrest,nv,relation],j)=>{
  const family='verbinden-'+j,lower=/^(Der|Die|Das) /.test(sub)?sub.charAt(0).toLowerCase()+sub.slice(1):sub;
  const hs=sub+' '+v+' '+rest,neb=[kon,ns,nrest,nv].filter(Boolean).join(' '),s=hs+', '+neb+'.',front=G.upper(neb)+', '+v+' '+lower+' '+rest+'.';let q;
  if(d===1||d===2)q=mark('Markiere den vollständigen Nebensatz, ohne Komma und Punkt.',hs+', {'+neb+'}.','groups');
  else if(d===3||d===4)q=mark('Markiere den vollständigen Hauptsatz, ohne Komma und Punkt. Der Nebensatz steht vorn.',G.upper(neb)+', {'+v+' '+lower+' '+rest+'}.','groups');
  else q=fields('gap','Im Satz fehlen genau ein Komma und die passende Verbindung. Ergänze die beiden Lücken.',[['Verbindung',kon,[kon,'und','aber']],['Trennzeichen',',',[',',';',':']]],hs+' ___ ___ '+[ns,nrest,nv].filter(Boolean).join(' ')+'. Beziehung: '+relation+'.');
  add('verbinden',d,'sicherung',d===5?'A19':'A33','Q003',family,q,
   ['Suche die Verbindung und die zugehörige finite Verbform.','Im Nebensatz steht die finite Verbform am Ende. Vor dem vorangestellten Hauptsatzteil steht ein Komma.','Der Nebensatz lautet „'+neb+'“; seine finite Form ist „'+nv+'“.'],
   '„'+neb+'“ ist der Nebensatz. Sein finites Verb „'+nv+'“ steht am Ende. Haupt- und Nebensatz werden durch ein Komma getrennt.');
  if(d===1)q=fields('gap','Verbinde die Bausteine. Nutze den Nebensatz mit der genannten Beziehung.',[['Verbindung',kon,[kon,'und','aber']],['letztes Wort im Nebensatz',nv]],hs+', ___ '+ns+' '+nrest+' ___. Beziehung: '+relation+'.');
  else if(d===2)q=fields('form','Vergleiche die Satzklammern.',[['finite Verbform im Hauptsatz',v],['finite Verbform im Nebensatz',nv],['Position der finiten Form im Nebensatz','am Ende',['am Ende','an zweiter Satzgliedposition']]],s);
  else if(d===3||d===4)q=order('Stelle den Nebensatz voran. Ordne die Bausteine so, dass die Verbpositionen stimmen.',[G.upper(neb),',',v,lower,rest,'.'],[[0,1,2,3,4,5]],s);
  else q=fields('transfer','Überarbeite den Satz nach drei Vorgaben: Nebensatz zuerst, korrekte Verbposition, Komma.',[['überarbeiteter Satz',front,[front,G.upper(neb)+', '+lower+' '+v+' '+rest+'.']],['finite Form am Ende des Nebensatzes',nv],['Verbindung',kon]],s);
  add('verbinden',d,'kern',d>=3?'A34':'A33','Q003',family,q,
   ['Der ganze Nebensatz kann vor den Hauptsatz wandern.','Nach einem vorangestellten Nebensatz folgt direkt die finite Verbform des Hauptsatzes.','Die Fassung mit Nebensatz zuerst lautet: '+front],
   'Richtig umgestellt: '+front+' Der gesamte Nebensatz besetzt die erste Position vor „'+v+'“.');
  if(d<=2)q=fields('transfer','Vergleiche zwei Satzverbindungen.',[['„'+s+'“','Satzgefüge',['Satzreihe','Satzgefüge']],['„'+hs+', und die Crew wartet am Hafen.“','Satzreihe',['Satzreihe','Satzgefüge']]],'Satzreihe: zwei Hauptsätze. Satzgefüge: Hauptsatz und Nebensatz.');
  else if(d===3)q=mc('Welche Fassung zeigt die Beziehung „'+relation+'“ und eine korrekte Verbposition?',s,[hs+', '+kon+' '+nv+' '+ns+(nrest?' '+nrest:'')+'.',hs+' '+neb+'.']);
  else if(d===4)q=mc('Welche umgestellte Fassung ist ebenfalls richtig?',front,[G.upper(neb)+', '+lower+' '+v+' '+rest+'.',hs+' '+neb+'.'],s);
  else q=fields('transfer','Prüfe den kleinen Bericht. Wähle die passende Überarbeitung.',[['Satz mit korrektem Komma und Verbposition',s,[s,hs+' '+neb+'.',hs+', '+kon+' '+nv+' '+ns+(nrest?' '+nrest:'')+'.']],['Beziehung',relation,[relation,'bloße Aufzählung']],['Satzverbindung','Satzgefüge',['Satzreihe','Satzgefüge']]],hs+' '+kon+' '+ns+' '+nv+' '+nrest+'.');
  add('verbinden',d,'transfer',d<=2?'A35':d===5?'A36':'A34','Q003',family,q,
   ['Prüfe die Verbindung, das Komma und die Stellung der finiten Verbform.','„und“ verbindet hier zwei Hauptsätze. „'+kon+'“ leitet in diesem Beispiel einen Nebensatz ein.','Im Satzgefüge endet der Nebensatz mit „'+nv+'“. Die korrekte Fassung lautet: '+s],
   'Das Satzgefüge verbindet eine Aussage mit '+relation+'. Die Verbposition macht den Unterschied sichtbar; ein fehlendes Komma muss ergänzt werden.');
 });
})();
