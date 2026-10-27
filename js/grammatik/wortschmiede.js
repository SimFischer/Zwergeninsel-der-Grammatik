/* Wortschmiede: Aufgabenideen Q001, Q035, Q037, Q043 und Q050, mit geprüften
   neuen Inselkontexten. Keine bloßen Namenswechsel als Aufgabenvarianten. */
(function(){
  const Z=window.ZI,G=Z.G,{add,mc,mark,fields,input,assign,repair,sol}=G;
  const nomen=[
    ['Schiff','das','Schiffe','Das {Schiff} liegt im {Hafen}.','Nach dem {Sturm} prüfen die {Seeräuber} das {Segel} des {Schiffes}.',['Segel','Schiff'],'Segelschiff','das','Das Schiff wird nur vom Wind in seinen Segeln angetrieben. Welches Nomen ist genauer?','Segelschiff',['Ruderboot','Dampfschiff']],
    ['Tisch','der','Tische','Der {Tisch} steht in der {Werkstatt}.','Auf dem {Tisch} des {Schmieds} liegen ein {Hammer} und mehrere {Nägel}.',['Holz','Tisch'],'Holztisch','der','An diesem Tisch essen die Zwerge ihre Mahlzeiten. Welche Bezeichnung ist genauer?','Esstisch',['Schreibtisch','Werktisch']],
    ['Blume','die','Blumen','Die {Blume} wächst neben dem {Brunnen}.','Zwischen den {Steinen} am {Brunnen} blühen im {Frühling} gelbe {Blumen}.',['Sonne','Blume'],'Sonnenblume','die','Diese Blume hat einen großen gelben Blütenkorb und dunkle Kerne. Welches Nomen passt genauer?','Sonnenblume',['Tulpe','Rose']],
    ['Seeräuber','der','Seeräuber','Der {Seeräuber} sucht seinen {Hut}.','Der {Hut} des {Seeräubers} liegt zwischen den {Fässern} auf dem {Schiff}.',['See','Räuber'],'Seeräuber','der','Dieser Seeräuber befehligt das ganze Piratenschiff. Welches Nomen bezeichnet ihn genauer?','Piratenkapitän',['Schiffsjunge','Steuermann']],
    ['Insel','die','Inseln','Die {Insel} liegt hinter dem {Riff}.','Auf der {Insel} entdecken die {Zwerge} einen {Wald} voller alter {Eichen}.',['Schatz','Insel'],'Schatzinsel','die','Die Insel besteht aus einem Vulkan, der aus dem Meer ragt. Welche Bezeichnung ist genauer?','Vulkaninsel',['Koralleninsel','Flussinsel']],
    ['Seeungeheuer','das','Seeungeheuer','Das {Seeungeheuer} bewacht den {Schatz}.','Die {Spuren} des {Seeungeheuers} enden vor dem {Eingang} einer dunklen {Höhle}.',['See','Ungeheuer'],'Seeungeheuer','das','Das vermeintliche Seeungeheuer ist ein Tier mit acht Armen. Welches Nomen benennt das Tier genauer?','Krake',['Wal','Hai']],
    ['Baum','der','Bäume','Der {Baum} steht auf der {Wiese}.','Im {Schatten} des {Baumes} finden die {Kinder} einen {Brief}.',['Apfel','Baum'],'Apfelbaum','der','Dieser Baum trägt Eicheln. Welches Nomen ist genauer?','Eiche',['Buche','Birke']],
    ['Haus','das','Häuser','Das {Haus} steht an der {Straße}.','Hinter dem {Haus} führt ein schmaler {Weg} über eine morsche {Brücke}.',['Baum','Haus'],'Baumhaus','das','Das Haus ist klein und einfach aus Holz gebaut. Welche genauere Bezeichnung passt?','Hütte',['Villa','Palast']],
    ['Mann','der','Männer','Der {Mann} trägt einen {Rucksack}.','Am {Waldrand} betrachtet der {Mann} die {Karte} seiner langen {Reise}.',['See','Mann'],'Seemann','der','Der Mann ist zu Fuß mit Wanderschuhen und Rucksack im Gebirge unterwegs. Welches Nomen ist genauer?','Wanderer',['Taucher','Seemann']],
    ['Kind','das','Kinder','Das {Kind} öffnet seine {Schultasche}.','Vor dem {Unterricht} legt das {Kind} seine {Hefte} auf den {Tisch}.',['König','Kind'],'Königskind','das','Das Kind besucht die Schule. Wähle eine genauere Bezeichnung, die das sicher ausdrückt.','Schulkind',['Kleinkind','Königskind']],
    ['Stuhl','der','Stühle','Der {Stuhl} gehört dem {König}.','Im großen {Saal} des {Schlosses} steht der prächtige {Stuhl} des {Königs}.',['Schaukel','Stuhl'],'Schaukelstuhl','der','Der König sitzt bei einer feierlichen Krönung auf seinem Herrschersitz. Welches Nomen ist genauer als Stuhl?','Thron',['Hocker','Liegestuhl']],
    ['Traum','der','Träume','Der {Traum} handelt von einem {Zauberring}.','Nach dem {Traum} zeichnet {Leo} das {Raumschiff} und den magischen {Ring}.',['Traum','Reise'],'Traumreise','die','Der Traum ist so beängstigend, dass Leo erschrocken aufwacht. Welche Bezeichnung ist genauer?','Albtraum',['Tagtraum','Wunschtraum']],
  ].map(([n,a,p,s,l,parts,c,ca,frage,genau,falsch])=>({n,a,p,s,l,parts,c,ca,frage,genau,falsch}));
  const nominal=['Segeln','Hämmern','Pflanzen','Suchen','Wandern','Schwimmen','Lesen','Bauen','Lachen','Lernen','Sitzen','Träumen'];
  const kurz=[
    '{Schiffe} ankern.','Heute steht ein {Tisch} hier.','{Blumen} blühen am {Brunnen}.','Im {Hafen} suchen {Seeräuber} ihren {Hut}.',
    'Hinter dem {Riff} liegt unsere {Insel}.','Plötzlich taucht ein {Seeungeheuer} auf.','Unter dem {Baum} lesen wir.',
    'Ein {Haus}, ein {Garten} und ein {Brunnen} fehlen.','{Männer} und {Frauen} wandern gemeinsam zum {Hafen}.','{Kinder} lachen.',
    'Bitte stell den {Stuhl} neben den {Tisch}.','Von einem {Traum} erzählt {Leo} beim {Frühstück}.',
  ];
  const lang=[
    '{Seeräuber} verstauen {Seile}, {Segel} und {Kisten}.','Den {Tisch} trägt heute niemand.','Im {Garten} wachsen {Blumen}.',
    'Morgen finden die {Seeräuber} unter {Brettern} einen {Hut}.','{Inseln} bleiben im {Nebel} verborgen.','Dieses {Seeungeheuer} ist sehr scheu.',
    'Zwischen {Baum} und {Haus} wartet ein {Kind} mit einer {Karte}.','Heute schlafen wir alle im {Haus}.',
    'Der {Mann} folgt einer {Spur} über die alte {Brücke}.','Ohne {Werkzeug} bauen die {Kinder} keine {Brücke}.',
    '{Hilda} stellt {Stühle} und {Tische} bereit.','Nach dem {Traum} zeichnet {Leo} das {Raumschiff} und den magischen {Ring}.',
  ];
  const anspruchsvoll=[
    'Beim {Segeln} bleiben wir still.','Zum {Hämmern} braucht {Hilda} einen {Hammer}.','Beim {Pflanzen} hilft das {Kind}.',
    'Das {Suchen} kostet viel {Zeit}.','{Wandern} macht uns glücklich.','Nach dem {Schwimmen} liegt das {Handtuch} am {Strand}.',
    'Zum {Lesen} öffnet {Leo} sein {Buch}.','Beim {Bauen} helfen {Männer}, {Frauen} und {Kinder}.','Ihr {Lachen} steckt alle an.',
    'Ohne {Lernen} lösen wir dieses {Rätsel} nicht.','Beim {Sitzen} auf dem {Stuhl} erzählt die {Meisterin} eine {Geschichte}.',
    'Vom {Träumen} möchte {Leo} seinem {Freund} berichten.',
  ];
  const kompositumPlural=['Segelschiffe','Holztische','Sonnenblumen','Seeräuber','Schatzinseln','Seeungeheuer','Apfelbäume','Baumhäuser','Seemänner','Königskinder','Schaukelstühle','Traumreisen'];
  nomen.forEach((n,j)=>{n.s=kurz[j];n.l=lang[j];});
  for(let d=1;d<=5;d++)nomen.forEach((n,j)=>{
    const family='nomen-'+j;
    let q;
    if(d===5){
      const v=G.annotation(n.s),broken=v.tokens.map((w,i)=>v.answer.includes(i)?'{'+w.toLowerCase()+'}':w).join(' '),correct=v.tokens.join(' ').replace(/\s+([.,!?])/g,'$1');
      q=repair(broken,correct,v.answer.length,'Prüfe die Großschreibung der Nomen. Markiere alle Fehlerwörter und verbessere den Satz.');
    }else if(d===2)q=mark('Markiere alle Nomen. Der Satz enthält auch Begleiter und Tätigkeitswörter.',n.l);
    else if(d===4)q=mark('Markiere alle Nomen, auch Tätigkeiten, die hier als Nomen gebraucht werden.',anspruchsvoll[j]);
    else q=mark('Markiere alle Nomen im Satz.',d===1?n.s:n.l);
    if(d===3||d===4){q.letterCase='lower';q.context='Hier sind alle Wörter absichtlich kleingeschrieben. Nutze Satzkontext und Artikelprobe.';}
    add('nomen',d,'sicherung',d===5?'A19':'A18',['Q001','Q047'],family,q,
      ['Prüfe die Bezeichnungen für Dinge, Lebewesen oder Vorstellungen.','Setze probeweise einen Artikel davor. Bei „beim“ steckt „bei dem“ darin.','Suche unter anderem die Bezeichnung „'+n.n+'“ und ihre Formen.'],
      '„'+n.n+'“ ist ein Nomen. Auch Nomen mitten im Satz werden großgeschrieben.');
    if(d===1)q=fields('gap','Ergänze den passenden bestimmten Artikel und die Mehrzahl.',[['bestimmter Artikel Singular',n.a,['der','die','das']],['Plural mit Artikel','die '+n.p]],G.ausgang('Nomen',n.n));
    else if(d===2)q=fields('form','Vervollständige die kleine Nomentabelle.',[['bestimmter Artikel Singular',n.a],['Plural mit Artikel','die '+n.p]],G.ausgang('Nomen',n.n));
    else if(d===3)q=fields('form','Bilde das zusammengesetzte Nomen und ergänze seinen bestimmten Artikel.',[['zusammengesetztes Nomen',n.c],['Artikel zum neuen Nomen',n.ca]],G.ausgang('Ausgangswörter',n.parts));
    else if(d===4)q=fields('form','Ergänze die Formen und prüfe das Grundwort.',[['Nomen aus der Tätigkeit '+nominal[j].toLowerCase(),nominal[j]],['Plural von '+n.n+' mit Artikel','die '+n.p],['Artikel zu '+n.c,n.ca]]);
    else q=fields('form','Überprüfe die Wörter für das Inselbuch.',[['Kompositum aus '+n.parts.join(' + '),n.c],['Plural des Kompositums mit Artikel','die '+kompositumPlural[j]],['Artikel des Kompositums',n.ca]],G.ausgang('Ausgangswörter',n.parts));
    if(d===4)q.focusWords=[nominal[j].toLowerCase(),n.n,n.c];
    add('nomen',d,'kern',d>=3?'A07':'A02',['Q001','Q050'],family,q,
      d<=2?['Lies, ob der Artikel, die Einzahl oder die Mehrzahl gefragt ist.','Die Mehrzahl hat den bestimmten Artikel „die“. In der Einzahl bleibt das Geschlecht des Nomens erhalten.','Vergleiche die Formen: '+n.a+' '+n.n+' – die '+n.p+'.']:['Achte auf Artikel, Anzahl und Wortbildung.','Bei einem zusammengesetzten Nomen bestimmt das letzte Nomen den Artikel.','Das Grundwort ist „'+n.parts[1]+'“. Vergleiche außerdem '+n.a+' '+n.n+' mit die '+n.p+'.'],
      'Die Mehrzahl lautet „'+n.p+'“. „'+n.c+'“ hat den Artikel „'+n.ca+'“, weil sein Grundwort „'+n.parts[1]+'“ ist.');
    if(d===1)q=mc('Welches Wort passt NICHT in die Reihe der Nomen?',['segeln','leise','hämmern','sonnig'][j%4],[n.n,nomen[(j+3)%12].n,nomen[(j+5)%12].n].map(w=>w.toLowerCase()),'Alle Wörter sind hier absichtlich kleingeschrieben. Nutze die Artikelprobe.');
    else if(d===2)q=assign('match','Ordne den Nomen ihr grammatisches Geschlecht zu.',[n.n,n.c,'Kind'],[n.a==='der'?'maskulin':n.a==='die'?'feminin':'neutral',n.ca==='der'?'maskulin':n.ca==='die'?'feminin':'neutral','neutral'],['maskulin','feminin','neutral']);
    else if(d===4)q=assign('sort','Ordne die Ausdrücke: Wo steht ein Nomen, wo ein Verb im Infinitiv?',[n.n,n.p,'das '+nominal[j],nominal[j].toLowerCase()],['Nomen','Nomen','Nomen','Verb im Infinitiv'],['Nomen','Verb im Infinitiv']);
    else q=mc(n.frage,n.genau,n.falsch);
    add('nomen',d,'transfer',d===1?'A05':d===2?'A38':d===4?'A18':'A09',d>=3?['Q035','Q001']:['Q001'],family,q,
      d===2?['Setze vor jedes Nomen seinen bestimmten Artikel in der Einzahl.','„der“ steht für maskulin, „die“ für feminin, „das“ für neutral.','Vergleiche: '+n.a+' '+n.n+', '+n.ca+' '+n.c+' und das Kind.']:d===4?['Prüfe den Begleiter der Tätigkeit.','Mit dem Artikel „das“ wird die Tätigkeit hier als Nomen gebraucht und großgeschrieben.','„das '+nominal[j]+'“ ist ein Nomen; „'+nominal[j].toLowerCase()+'“ ist hier der Infinitiv.']:[d===1?'Achte auf die Wortart, nicht auf die Bedeutung.':'Welche Information gibt der Zusammenhang vor?',d===1?'Nomen können einen Artikel haben. Das Tätigkeits- oder Eigenschaftswort gehört in dieser Verwendung nicht dazu.':'Eine genauere Bezeichnung ergänzt eine Eigenschaft. Sie muss nicht mit dem allgemeinen Nomen gleichbedeutend sein.',d===1?'Die Schreibweise hilft hier nicht: Überlege, welches Wort ein Ding oder Lebewesen bezeichnet.':'Beziehe dich auf die genaue Beschreibung; prüfe auch das letzte Nomen im Kompositum.'],
      d===1?'Das unpassende Wort gehört nicht zu den Nomen.':d===2?'Der Artikel hilft beim grammatischen Geschlecht: der – maskulin, die – feminin, das – neutral.':d===4?'Ein Infinitiv kann mit einem Artikel als Nomen gebraucht werden: das '+nominal[j]+'.':'Hier ist „'+n.genau+'“ die genauere Bezeichnung für den beschriebenen Zusammenhang.');
  });
  G.nomen=nomen;
})();
/* Verbkarten und Formwechsel nach Q001, Q059, Q077, Q082 und Q084. */
(function(){
  const Z=window.ZI,G=Z.G,{add,mc,mark,fields,input,assign,repair,sol}=G;
  const verben=[
    ['lachen','lachst','lacht','lachte','gelacht','hat','schwach','Brumm','über den Scherz'],
    ['kochen','kochst','kocht','kochte','gekocht','hat','schwach','Hilda','eine Suppe'],
    ['spielen','spielst','spielt','spielte','gespielt','hat','schwach','Die Mannschaft','im Hof'],
    ['kneifen','kneifst','kneift','kniff','gekniffen','hat','stark','Die Krabbe','den Seeräuber'],
    ['greifen','greifst','greift','griff','gegriffen','hat','stark','Hilda','nach dem Seil'],
    ['pfeifen','pfeifst','pfeift','pfiff','gepfiffen','hat','stark','Der Seeräuber','eine Melodie'],
    ['binden','bindest','bindet','band','gebunden','hat','stark','Brumm','einen Knoten'],
    ['singen','singst','singt','sang','gesungen','hat','stark','Svea','ein Lied'],
    ['finden','findest','findet','fand','gefunden','hat','stark','Kira','den Zauberring'],
    ['trinken','trinkst','trinkt','trank','getrunken','hat','stark','Der Wanderer','Wasser'],
    ['sinken','sinkst','sinkt','sank','gesunken','ist','stark','Das Schiff','langsam'],
    ['springen','springst','springt','sprang','gesprungen','ist','stark','Das Kind','über den Bach'],
    ['nennen','nennst','nennt','nannte','genannt','hat','gemischt','Der Kapitän','den Namen'],
    ['rennen','rennst','rennt','rannte','gerannt','ist','gemischt','Ole','zum Steg'],
    ['kennen','kennst','kennt','kannte','gekannt','hat','gemischt','Hilda','den Weg'],
    ['brennen','brennst','brennt','brannte','gebrannt','hat','gemischt','Das Lagerfeuer','ruhig'],
    ['bringen','bringst','bringt','brachte','gebracht','hat','gemischt','Brumm','das Werkzeug'],
    ['denken','denkst','denkt','dachte','gedacht','hat','gemischt','Svea','an die Reise'],
    ['vordringen','dringst','dringt','drang','vorgedrungen','ist','stark','Das Team','in die Höhle','vor'],
    ['austrinken','trinkst','trinkt','trank','ausgetrunken','hat','stark','Ole','den Becher','aus'],
    ['auswringen','wringst','wringt','wrang','ausgewrungen','hat','stark','Kira','das Tuch','aus'],
    ['hinabsinken','sinkst','sinkt','sank','hinabgesunken','ist','stark','Der Anker','in die Tiefe','hinab'],
    ['aufspringen','springst','springt','sprang','aufgesprungen','ist','stark','Hilda','erschrocken','auf'],
    ['verbinden','verbindest','verbindet','verband','verbunden','hat','stark','Brumm','die Bretter'],
    ['besingen','besingst','besingt','besang','besungen','hat','stark','Svea','die Insel'],
    ['erfinden','erfindest','erfindet','erfand','erfunden','hat','stark','Tarek','ein Werkzeug'],
    ['verschwinden','verschwindest','verschwindet','verschwand','verschwunden','ist','stark','Der Nebel','langsam'],
    ['zerspringen','zerspringst','zerspringt','zersprang','zersprungen','ist','stark','Der Krug','auf dem Boden'],
    ['backen',['backst','bäckst'],['backt','bäckt'],['backte','buk'],'gebacken','hat','stark','Hilda','ein Brot'],
  ].map(([inf,du,er,past,part,aux,klasse,s,rest,partikel=''])=>({inf,du,er,past,part,aux,klasse,s,rest,partikel}));
  const zeiten=['Präsens','Präteritum','Perfekt','Futur I'];
  function satz(v,t,annotiert=false,variante=0){
    const f=w=>annotiert?'{'+w+'}':w, er=sol(v.er)[variante]||sol(v.er)[0],past=sol(v.past)[variante]||sol(v.past)[0];
    if(t===0||t===1)return v.s+' '+f(t===0?er:past)+' '+v.rest+(v.partikel?' '+f(v.partikel):'')+'.';
    return v.s+' '+f(t===2?v.aux:'wird')+' '+v.rest+' '+f(t===2?v.part:v.inf)+'.';
  }
  G.verben=verben;G.verbSatz=satz;G.zeiten=zeiten;
  for(let d=1;d<=5;d++)for(let j=0;j<12;j++){
    const v=verben[((d-1)*5+j)%verben.length],t=j%4,family='verb-'+v.inf;
    const forms=t===0?sol(v.er):t===1?sol(v.past):[t===2?v.part:v.inf];
    let q;
    if(d===1)q=mc('Welche Zeitform hat dieser Satz?',zeiten[t],zeiten,satz(v,t));
    else if(d===2)q=mc('Wähle eine passende finite Form für „du“.',sol(v.du),[sol(v.er)[0],v.inf],v.inf+(v.partikel?' (trennbar)':''));
    else if(d===3)q=mark('Markiere alle Teile der Verbform.',satz(v,t,true),'groups');
    else if(d===4)q=assign('sort','Ordne die Verbformen. Beachte auch das Partizip II.',[v.aux,v.part,v.inf],['finite Form','Partizip II (infinit)','Infinitiv (infinit)'],['finite Form','Partizip II (infinit)','Infinitiv (infinit)'],satz(v,2));
    else q=repair(v.s+' {haben} '+v.rest+' {'+v.inf+'}.',satz(v,2),2,'Repariere die beiden Verbformen im Perfekt.');
    add('verben',d,'sicherung',d===5?'A19':d===4?'A26':d===3?'A25':'A01',['Q001','Q022','Q082'],family,q,
      d===1?['Betrachte alle Verbteile im Satz.','Präteritum ist hier eine einzelne Vergangenheitsform. Perfekt enthält haben oder sein mit Partizip II. Futur I enthält werden mit Infinitiv.','Die Zeitform lautet hier '+zeiten[t]+'.']:d===2?['Beziehe die Form auf „du“.','Die finite Form verändert sich mit der Person. Eine trennbare Partikel ist selbst keine Personalendung.','Für „du“ passt „'+sol(v.du).join('“ oder „')+'“.']:d===3?['Suche zuerst den finiten Teil der Verbform.','Prüfe, ob eine Partikel, ein Infinitiv oder ein Partizip zum Satzkern gehört.','Hier gehören diese Teile zusammen: '+G.annotation(satz(v,t,true)).answer.map(i=>G.annotation(satz(v,t,true)).tokens[i]).join(' … ')+'.']:['Untersuche die Verbform und ihren Zusammenhang mit dem Satz.','Im Perfekt gehören eine Form von haben oder sein und das Partizip II zusammen. Das Partizip ist ebenfalls infinit.','Der Infinitiv lautet „'+v.inf+'“. Die passende Perfektform ist „'+v.aux+' … '+v.part+'“.'],
      'Bei „'+v.inf+'“ lautet das Partizip II „'+v.part+'“. '+zeiten[t]+' und andere Zeitformen bleiben Formen desselben Verbs.');
    if(d===1){
      const rows=t<2?[['finite Verbform',forms,[...forms,v.inf,t===0?sol(v.past)[0]:sol(v.er)[0]]],...(v.partikel?[['abgetrennter Verbteil',v.partikel,[v.partikel,...['vor','aus','auf'].filter(p=>p!==v.partikel)]]]:[])]:[['finite Verbform',t===2?v.aux:'wird',['hat','ist','wird','haben']],['weiterer Verbteil',t===2?v.part:v.inf,[v.part,v.inf,sol(v.er)[0]]]];
      q=G.lueckensatz(fields('gap','Ergänze die vorgegebene Zeitform: '+zeiten[t]+'.',rows),satz(v,t,true));
    }else if(d===2)q=fields('form','Ergänze die Formtabelle. Das Subjekt bleibt gleich.',[['Präsens',sol(v.er)],['Präteritum',sol(v.past)],['Partizip II',v.part]],G.ausgang('Verb',v.inf,' · Subjekt: '+v.s+(v.partikel?' · Die Partikel '+v.partikel+' bleibt bei Präsens und Präteritum abgetrennt.':'')));
    else if(d===3||d===4){
      const ziel=(t+1)%4,variants=ziel===1?sol(v.past).map((_,i)=>satz(v,ziel,false,i)):ziel===0?sol(v.er).map((_,i)=>satz(v,ziel,false,i)):[satz(v,ziel)];
      q=input('transfer','Übertrage den ganzen Satz ins '+zeiten[ziel]+'.',variants,satz(v,t));
    }else q=fields('form','Vervollständige die Stammformen und den Zeitformwechsel.',[['Infinitiv',v.inf],['Präteritum für '+v.s,sol(v.past)],['Perfektsatz',satz(v,2)]],satz(v,0));
    if(!q.focusWords)q.focusWords=[...sol(v.er),...sol(v.past),v.part,v.inf,v.partikel].filter(Boolean);
    add('verben',d,'kern',d===2||d===5?'A02':d===1?'A04':'A03',['Q001','Q059','Q077'],family,q,
      ['Lies zuerst, welche Zeitform gefordert ist.','Die Person bleibt gleich. Für Perfekt und Futur I musst du alle Verbteile berücksichtigen.','Präsens: '+sol(v.er).join(' oder ')+'. Präteritum: '+sol(v.past).join(' oder ')+'. Partizip II: '+v.part+'.'],
      'Der Infinitiv „'+v.inf+'“ gehört zu den '+(v.klasse==='schwach'?'schwachen':v.klasse==='gemischt'?'gemischten':'starken')+' Verben. Passender Beispielsatz: '+satz(v,t));
    if(d<=2)q=assign('match','Verbinde jede Verbform mit der richtigen Zeitform.',zeiten.map((_,t)=>satz(v,t)),zeiten,zeiten);
    else if(d===3)q=mc('Welche Form kann als Infinitiv in einer Verbklammer stehen?',v.inf,[v.part,sol(v.er)[0]],'Gesucht ist eine ungebeugte Grundform.');
    else if(d===4){
      const items=[v.aux,v.part,v.inf,...(v.partikel?[v.partikel]:[])],answer=['finite Form','Partizip II','Infinitiv',...(v.partikel?['abgetrennte Verbpartikel']:[])];
      q=assign('match','Unterscheide finite Form, infinite Formen und gegebenenfalls die Verbpartikel.',items,answer,['finite Form','Partizip II','Infinitiv','abgetrennte Verbpartikel'],satz(v,0)+' '+satz(v,2));
    }else q=input('transfer','Gestalte den Satz als Ankündigung im Futur I. Schreibe alle Verbteile.',satz(v,3),satz(v,0));
    add('verben',d,'transfer',d<=2?'A02':d===4?'A26':'A03',['Q001','Q061','Q084'],family,q,
      ['Prüfe zuerst die Stellung und die Form des Verbs.','Eine finite Form ist an Person und Zahl angepasst. Infinitiv und Partizip II sind infinite Formen; eine Verbpartikel ist etwas anderes.','Im Futur I steht hier „wird … '+v.inf+'“. Im Perfekt steht „'+v.aux+' … '+v.part+'“.'],
      'Eine mehrteilige Verbform muss vollständig sein. Bei trennbaren Verben kann die Partikel im Präsens und Präteritum getrennt stehen.');
  }
})();
/* Adjektivwerkstatt: Formen, Steigerung und kontextabhängige Wirkung. */
(function(){
  const Z=window.ZI,G=Z.G,{add,mc,mark,fields,assign,repair}=G;
  const formen=[
    ['kalt','kälter','am kältesten','Der {kalte} Wind weht über die Insel.','Die {kalten} Tropfen treffen das {warme} Deck.','kalte'],
    ['warm','wärmer','am wärmsten','Das Wasser ist {warm}.','Am {warmen} Feuer trocknen die Zwerge ihre {nassen} Mäntel.','warme'],
    ['groß','größer','am größten','Vor uns liegt eine {große} Insel.','Die {großen} Segel werfen einen {dunklen} Schatten.','große'],
    ['gut','besser','am besten','Die Idee ist {gut}.','Ein {guter} Plan hilft auf dem {langen} Weg.','gute'],
    ['mutig','mutiger','am mutigsten','Die {mutige} Zwergin geht voran.','Die {mutigen} Kinder betreten die {schmale} Brücke.','mutige'],
    ['freundlich','freundlicher','am freundlichsten','Der Kapitän begrüßt uns {freundlich}.','Eine {freundliche} Stimme ruft aus dem {hellen} Haus.','freundliche'],
    ['leise','leiser','am leisesten','Im Haus ist ein {leises} Knarren zu hören.','Durch das {offene} Fenster dringt ein {leises} Lachen.','leise'],
    ['heiter','heiterer','am heitersten','Die Stimmung ist {heiter}.','Ein {heiteres} Lied klingt über das {ruhige} Meer.','heitere'],
    ['neblig','nebliger','am nebligsten','Der Morgen ist {neblig}.','Am {nebligen} Morgen wirkt der {verlassene} Steg {geheimnisvoll}.','neblige'],
    ['düster','düsterer','am düstersten','Der Wald wirkt {düster}.','Die {düsteren} Wolken verdecken das {helle} Mondlicht.','düstere'],
    ['alt','älter','am ältesten','Am Weg steht ein {altes} Haus.','In dem {alten} Haus knarrt eine {morsche} Treppe.','alte'],
    ['nah','näher','am nächsten','Die Insel ist schon {nah}.','Am {nahen} Ufer warten die {aufgeregten} Freunde.','nahe'],
  ];
  const stimmung=[
    ['Weg','Lasse und Jana folgen einem ___ Weg.',['sonnigen','hellen'],['düsteren','bedrohlichen']],
    ['Brücke','Die Kinder überqueren eine ___ Brücke.',['einladende','freundlich beleuchtete'],['morsche','unheimliche']],
    ['Garten','Hinter dem Tor liegt ein ___ Garten.',['blühender','sonniger'],['trostloser','gespenstischer']],
    ['Haus','Vor ihnen steht ein ___ Haus.',['einladendes','freundliches'],['verlassenes','unheimliches']],
    ['Fenster','Jana blickt durch das ___ Fenster.',['helle','strahlend beleuchtete'],['düstere','gespenstische']],
    ['Meer','Hinter den Bäumen glitzert das ___ Meer.',['sonnige','warme'],['bedrohliche','düstere']],
    ['Wald','Die Wanderer erreichen einen ___ Wald.',['freundlichen','sonnigen'],['gespenstischen','bedrohlichen']],
    ['Schiff','Am Steg wartet ein ___ Schiff.',['einladendes','freundlich geschmücktes'],['gespenstisches','verwittertes']],
    ['Insel','Am Horizont entdecken sie eine ___ Insel.',['sonnige','blühende'],['trostlose','bedrohliche']],
    ['Tor','Die Kinder gehen durch ein ___ Tor.',['freundlich geschmücktes','einladendes'],['rostiges','unheimliches']],
    ['Stimme','Aus dem Haus klingt eine ___ Stimme.',['heitere','freundliche'],['bedrohliche','gespenstische']],
    ['Nachbargarten','Der Ball landet in einem ___ Nachbargarten.',['sonnigen','blühenden'],['düsteren','trostlosen']],
  ];
  const fehler=[
    ['Der {kalt} Wind trifft die {warm} Hütte.','Der kalte Wind trifft die warme Hütte.'],
    ['Im {düster} Wald stehen {alt} Bäume.','Im düsteren Wald stehen alte Bäume.'],
    ['Die {mutig} Zwerge betreten die {morsch} Brücke.','Die mutigen Zwerge betreten die morsche Brücke.'],
    ['Ein {heiter} Lied klingt aus dem {klein} Haus.','Ein heiteres Lied klingt aus dem kleinen Haus.'],
    ['Der {freundlich} Wanderer hebt den {schwer} Sack.','Der freundliche Wanderer hebt den schweren Sack.'],
    ['Eine {leiser} Stimme kommt aus dem {offen} Fenster.','Eine leise Stimme kommt aus dem offenen Fenster.'],
    ['Wir hören ein {leise} Geräusch hinter der {alt} Tür.','Wir hören ein leises Geräusch hinter der alten Tür.'],
    ['Bei {warm} Wetter suchen wir einen {schattig} Platz.','Bei warmem Wetter suchen wir einen schattigen Platz.'],
    ['Am {neblig} Morgen ist die {klein} Insel kaum zu sehen.','Am nebligen Morgen ist die kleine Insel kaum zu sehen.'],
    ['Die {düster} Wolken ziehen über das {ruhig} Meer.','Die düsteren Wolken ziehen über das ruhige Meer.'],
    ['Das {alt} Haus hat eine {knarrend} Treppe.','Das alte Haus hat eine knarrende Treppe.'],
    ['Am {nah} Ufer steht eine {groß} Eiche.','Am nahen Ufer steht eine große Eiche.'],
  ];
  for(let d=1;d<=5;d++)for(let j=0;j<12;j++){
    const [pos,kom,sup,satz,lang,form]=formen[j],m=stimmung[j],zweite=stimmung[(j+4)%12],family='adjektiv-'+j;
    let q=d===5?repair(fehler[j][0],fehler[j][1],2,'Prüfe die Endungen der beiden Adjektive.'):mark('Markiere alle Adjektive.',d<=2?satz:lang);
    add('adjektive',d,'sicherung',d===5?'A19':'A37',['Q001','Q037'],family,q,
      ['Suche die Wörter, die Eigenschaften oder eine Wahrnehmung beschreiben.','Prüfe die Verbindung mit dem Nomen. Nach dem Artikel kann eine Endung nötig sein.','Vergleiche die Grundform „'+pos+'“ mit einer passenden Form wie „'+form+'“.'],
      'Adjektive können vor einem Nomen stehen oder anders verwendet werden. Die Endung richtet sich nach dem Zusammenhang.');
    if(d===1)q=fields('form','Ergänze die erste Steigerungsform.',[['Komparativ',kom]],G.ausgang('Adjektiv',pos));
    else if(d===2)q=fields('form','Vervollständige die Steigerungsreihe.',[['Komparativ',kom],['Superlativ mit am',sup]],G.ausgang('Adjektiv',pos));
    else if(d===3)q=fields('form','Ergänze die Adjektivformen.',[['Komparativ von '+pos,kom],['Superlativ mit am',sup],['Adjektiv vor dem Nomen',m[2],m[2].concat(m[3])]],'Die erste Textfassung soll freundlich wirken: '+m[1]);
    else if(d===4)q=fields('transfer','Gestalte eine freundlich erwartungsvolle Textfassung. Wähle in beiden Lücken eine passende Form.',[[m[0],m[2],m[2].concat(m[3])],[zweite[0],zweite[2],zweite[2].concat(zweite[3])]],m[1]+' '+zweite[1]+' Die Kinder freuen sich auf den Besuch.');
    else q=fields('form','Prüfe die Formen für die überarbeitete Beschreibung.',[['Komparativ',kom],['Superlativ mit am',sup]],G.ausgang('Adjektiv',pos));
    if(d===3)q.focusWords=[pos];
    if(d!==4)q.degreeExample=pos==='schnell'?['hell','heller','am hellsten']:['schnell','schneller','am schnellsten'];
    add('adjektive',d,'kern',d===4?'A10':'A08',['Q001','Q037','Q041'],family,q,
      ['Lies die ganze Beschreibung, bevor du ein Wort auswählst.','Vergleiche Eigenschaften mit dem Komparativ. Bei Textwirkung zählt der gesamte Zusammenhang; es gibt oft mehrere passende Wörter.','Die Steigerung von „'+pos+'“ lautet „'+kom+'“ und „'+sup+'“. Für eine freundliche Fassung passen hier zum Beispiel „'+m[2][0]+'“ oder „'+m[2][1]+'“.'],
      'Die Formenreihe lautet '+pos+' – '+kom+' – '+sup+'. Die Wirkung einzelner Adjektive ist nicht für jeden Text gleich.');
    if(d===2)q=assign('match','Ordne die drei Formen der Steigerung zu.',[pos,kom,sup],['Positiv','Komparativ','Superlativ'],['Positiv','Komparativ','Superlativ']);
    else if(d===3||d===5)q=fields('transfer','Verändere den Text gezielt: Hier soll der Besuch eher unheimlich wirken. Mehrere Auswahlen sind möglich.',[[m[0],m[3],m[2].concat(m[3])],[zweite[0],zweite[3],zweite[2].concat(zweite[3])]],m[1]+' '+zweite[1]+' Die Kinder zögern vor dem fremden Haus.');
    else q=mc('Welche Formulierung passt hier eher zur freundlich erwartungsvollen Fassung? Wähle eine passende Möglichkeit.',m[2],m[3],m[1]+' Die Kinder freuen sich und sehen sich neugierig um.');
    add('adjektive',d,'transfer',d===2?'A08':d>=3?'A12':'A10',['Q036','Q037','Q038','Q041'],family,q,
      d===2?['Vergleiche die Formen mit der Grundform „'+pos+'“.','Der Komparativ wird zum Vergleichen mit „als“ benutzt. Der Superlativ steht hier mit „am“.','Die Reihe lautet: '+pos+' – '+kom+' – '+sup+'.']:['Vergleiche die möglichen Wörter im vollständigen Zusammenhang.','Eine Stimmung entsteht durch mehrere sprachliche Entscheidungen. „Still“ oder „geheimnisvoll“ wäre für sich allein noch keine eindeutige Stimmung.','Für die hier gewünschte Fassung kannst du zwischen den angebotenen passenden Wörtern wählen. Prüfe bei Steigerung auf „als“ und „am“.'],
      'In dieser Beschreibung passen mehrere Wörter. Eine andere Umgebung könnte die Wirkung derselben Wörter verändern.');
  }
})();
/* Pronomen: Q043 Folienbilder 4–5; zusätzliche materialnahe Expeditionen. */
(function(){
  const Z=window.ZI,G=Z.G,{add,mc,mark,fields,input,repair}=G;
  const bezuege=[
    ['Leo möchte {den Traum} erzählen.','ihn','Akkusativ','Leo hat {einen Traum}. Er erzählt ihn.'],
    ['{Das Raumschiff} steht auf der Straße.','Es','Nominativ','Leo entdeckt {ein Raumschiff}. Es steht am Weg.'],
    ['Leo nähert sich {dem Raumschiff}.','ihm','Dativ','Neben dem Tor steht {ein Raumschiff}. Hilda nähert sich ihm.'],
    ['{Die drei Männer} winken Leo zu.','Sie','Nominativ','Aus dem Schiff steigen {drei Männer}. Sie winken.'],
    ['Die Männer bitten {Leo} um Hilfe.','ihn','Akkusativ','Die Männer begrüßen {Leo}. Sie brauchen ihn als Piloten.'],
    ['Die Crew sucht {den Ring}.','ihn','Akkusativ','Die Crew sucht {den Ring}. Später findet Hilda ihn.'],
    ['{Der Schlüssel} öffnet die Truhe.','Er','Nominativ','Auf dem Deck liegt {der Schlüssel}. Er öffnet die Truhe.'],
    ['Der Kapitän zeichnet {die Karte}.','sie','Akkusativ','Der Kapitän zeichnet {eine Karte}. Er rollt sie auf.'],
    ['Brumm hilft {der Technikerin}.','ihr','Dativ','Brumm ruft {die Technikerin}. Der Kapitän hilft ihr.'],
    ['Leo begegnet {den Weltraumzwergen}.','ihnen','Dativ','Leo begegnet {den Weltraumzwergen}. Er winkt ihnen zu.'],
    ['Hilda begrüßt {das Kind}.','es','Akkusativ','Hilda begrüßt {das Kind}. Sie nimmt es mit.'],
    ['{Die Zwergenschrift} enthält fremde Zeichen.','Sie','Nominativ','Auf dem Blatt steht {die Zwergenschrift}. Sie enthält fremde Zeichen.'],
  ];
  const possessiv=[
    ['Meine Träume spielen nicht auf {unsere} Planeten Erde.','Meine Träume spielen nicht auf unserem Planeten Erde.'],
    ['Das würde {meine} Fantasie schaden.','Das würde meiner Fantasie schaden.'],
    ['Unsere Lehrerin reist in {ihren} Traum zum Mond.','Unsere Lehrerin reist in ihrem Traum zum Mond.'],
    ['{Ihrem} Stimmung ist heute gut.','Ihre Stimmung ist heute gut.'],
    ['{Ihrer} Schüler fehlen ihr.','Ihre Schüler fehlen ihr.'],
    ['Leo zeigt den Ring {seine} Mutter.','Leo zeigt den Ring seiner Mutter.'],
    ['Die Technikerin traut {ihr} Gerät.','Die Technikerin traut ihrem Gerät.'],
    ['Kira schützt {ihre} Raumschiff.','Kira schützt ihr Raumschiff.'],
    ['Die Crew folgt {ihren} Kapitän.','Die Crew folgt ihrem Kapitän.'],
    ['Wir prüfen {unseren} Karte.','Wir prüfen unsere Karte.'],
    ['Die Karten liegen in {unsere} Tasche.','Die Karten liegen in unserer Tasche.'],
    ['Der Kapitän dankt {seinen} Helferin.','Der Kapitän dankt seiner Helferin.'],
  ];
  const possessivfragen=['Wo spielen die Träume? Auf welchem Planeten?','Wem würde das schaden?','Wo findet die Reise statt?','Wer oder was ist gut?','Wer oder was fehlt ihr?','Wem zeigt Leo den Ring?','Wem oder was traut die Technikerin?','Wen oder was schützt Kira?','Wem folgt die Crew?','Wen oder was prüfen wir?','Wo liegen die Karten?','Wem dankt der Kapitän?'];
  const unklar=[
    ['Mia','Lea','Mia spricht mit Lea.','Danach geht # nach Hause.'],
    ['Hilda','Svea','Hilda arbeitet mit Svea an der Werkbank.','# prüft den Bauplan.'],
    ['Brumm','Tarek','Brumm trifft Tarek in der Schmiede.','# hebt den Hammer.'],
    ['Leo','Ole','Leo winkt Ole vom Raumschiff aus zu.','Danach nimmt # den Ring.'],
    ['Nora','Kira','Nora gibt Kira einen Brief.','# öffnet die Tür.'],
    ['Lasse','Leo','Lasse hilft Leo beim Packen.','Dann zeigt # die Karte.'],
    ['Mira','Ada','Mira sitzt neben Ada im Boot.','# bemerkt den Riss im Segel.'],
    ['Ben','Paul','Ben rätselt mit Paul über die Inschrift.','# kennt die richtige Antwort.'],
    ['Jana','Lea','Jana sucht mit Lea im Nachbargarten.','# holt den Ball zurück.'],
    ['Tarek','Brumm','Tarek hat Brumm auf dem Weg begleitet.','# hat den schweren Sack getragen.'],
    ['Svea','Hilda','Svea stand neben Hilda im Turm.','Dann hat # die Truhe geöffnet.'],
    ['Lina','Nora','Lina wartet mit Nora vor dem Stollen.','# wird morgen weitergraben.'],
  ];
  for(let d=1;d<=5;d++)for(let j=0;j<12;j++){
    const [s,pron,kasus,ref]=bezuege[j],family='pronomen-'+j,group=s.match(/\{([^}]+)\}/)[1],blank=s.replace(/\{[^}]+\}/,'___');
    const p=possessiv[j],person=unklar[j],anrede=['Mia','Hilda','Nora','Mira','Jana','Svea','Lina'].includes(person[0])?'sie':'er';
    const weiter=name=>person[3].replace('#',name),unbestimmt=person[3].startsWith('#')?G.upper(anrede):anrede;
    const context=person[2]+' '+weiter(unbestimmt);
    let q=d===5?repair(p[0],p[1],1,'Prüfe die Possessivform im Zusammenhang.'):d>=2?mark('Markiere die vollständige Bezugsgruppe des letzten Personalpronomens.',ref,'groups'):mc('Ersetze „'+group+'“ durch ein passendes Personalpronomen.',pron,['er','sie','es','ihn','ihm','ihr','ihnen'].filter(x=>x!==pron.toLowerCase()).slice(0,3),s.replace(/[{}]/g,''));
    if(d===5&&j===2)q.context='Die Reise findet im Traum statt; der Traum ist hier kein Reiseziel.';
    add('pronomen',d,'sicherung',d===5?'A17':'A16','Q043',family,q,
      d===5?['Lies die ganze Nomengruppe mit der Possessivform.','Prüfe ihren Kasus und ihre Zahl im Satz.','Die verbesserte Fassung lautet: '+p[1]]:['Prüfe, auf wen oder was sich das Pronomen bezieht.','Ein Personalpronomen muss zur Zahl, zum Geschlecht und zum Kasus der ersetzten Gruppe passen.','Die hier zu ersetzende Gruppe lautet „'+group+'“. Prüfe, ob „'+pron+'“ dazu passt.'],
      d===5?'Die richtige Possessivform steht in dieser Fassung: '+p[1]:'Die Gruppe „'+group+'“ steht hier im '+kasus+'. Als Ersatz passt „'+pron+'“.',j<6?'Vorlage gekürzt und fachlich geprüft':'materialnah entwickelt');
    if(d===1)q=fields('gap','Ergänze das passende Personalpronomen.',[['Ersatz für „'+group+'“',pron,[pron,'er','sie','es','ihn','ihm','ihr','ihnen'].filter((x,i,a)=>a.indexOf(x)===i)]],blank);
    else if(d===2)q=fields('form','Ergänze Pronomen und Kasus für „'+group+'“.',[['Personalpronomen',pron],['Kasus der ersetzten Gruppe',kasus,['Nominativ','Dativ','Akkusativ']]],s.replace(/[{}]/g,''));
    else if(d===3){const r=repair(p[0],p[1],1);q=fields('form','Verbessere die fehlerhafte Possessivform.',[['richtige Possessivform',r.corrections[0].to]],p[0].replace(/[{}]/g,'')+(j===2?' Die Reise findet im Traum statt.':''));}
    else if(d===4)q=fields('transfer','Mache den Bezug eindeutig: Gemeint ist '+person[0]+'. Wähle den passenden zweiten Satz.',[['eindeutige Fortsetzung',weiter(person[0]),[weiter(person[0]),weiter(person[1]),weiter(unbestimmt)]]],context);
    else {const r=repair(p[0],p[1],1);q=fields('transfer','Überarbeite die Expedition: Ersetze die Nomengruppe und verbessere die Possessivform.',[['Ersatz für '+group,pron],['richtige Possessivform',r.corrections[0].to]],blank+' '+p[0].replace(/[{}]/g,''));}
    add('pronomen',d,'kern',d===3||d===5?'A17':d===4?'A24':'A16','Q043',family,q,
      d===3||d===5?['Lies die Nomengruppe mit der Possessivform im vollständigen Satz.',possessivfragen[j]+' Beachte den dadurch geforderten Kasus.','Die korrekte Possessivform steht in dieser Fassung: '+p[1]]:d===4?['Lies beide möglichen Bezugsnamen.','Die Fortsetzung soll ausdrücklich '+person[0]+' meinen; das Pronomen allein ist hier nicht eindeutig.','Schreibe den Namen in die Fortsetzung: '+weiter(person[0])]:['Suche das Bezugswort und die Stelle, an der die Form gebraucht wird.','Bei einem unklaren Bezug hilft ein eindeutiger Name. Bei Possessivformen beachtest du die umgebende Wortgruppe und den Kasus.','Lies beide Sätze zusammen. Für die ersetzte Gruppe ist „'+pron+'“ die passende Form; bei der Possessivform hilft die Frage zum Satz.'],
      'Pronomen vermeiden Wiederholungen, sollen aber keine unklaren Bezüge erzeugen. Die Form hängt von ihrem Gebrauch im Satz ab.');
    if(d<=2||d===4)q=mc('Wen meint das Personalpronomen im zweiten Satz sicher?', 'Der Bezug ist unklar.',[person[0]+' ist sicher gemeint.',person[1]+' ist sicher gemeint.'],context);
    else if(d===3)q=input('transfer','Ersetze nur die Nomengruppe „'+group+'“ durch das passende Personalpronomen. Schreibe den ganzen Satz.',s.replace(/\{[^}]+\}/,pron),s.replace(/[{}]/g,''));
    else q=fields('transfer','In dieser kleinen Geschichte sind beide Bezüge gemeint. Wähle je eine eindeutige Fortsetzung.',[['Gemeint ist '+person[0],weiter(person[0]),[weiter(person[0]),weiter(unbestimmt)]],['Gemeint ist '+person[1],weiter(person[1]),[weiter(person[1]),weiter(unbestimmt)]]],context);
    add('pronomen',d,'transfer',d===3?'A24':'A16','Q043',family,q,
      d===3?['Suche die im Auftrag genannte Nomengruppe „'+group+'“.','Ihr Kasus ist '+kasus+'. Nur die Nomengruppe wird ersetzt.','Als Ersatz passt „'+pron+'“. Alle übrigen Wörter bleiben stehen.']:['Prüfe, ob es mehr als ein mögliches Bezugswort gibt.','Wenn zwei passende Personen genannt werden, legt „er“ oder „sie“ die Person nicht von selbst fest.','Ein Name statt des mehrdeutigen Pronomens macht klar, welche Person gemeint ist.'],
      d===3?'Beim Ersetzen bleibt der Kasus erhalten: „'+group+'“ wird hier zu „'+pron+'“.':'Ein mehrdeutiger Bezug wird nicht dadurch richtig, dass man eine Person errät. Eine eindeutige Formulierung nennt die gemeinte Person.');
  }
})();
/* Kasus: Frageprobe und Flexion aus Q025, Q042, Q043, Q050 und Q051.
   Formen werden im Satz geprüft; ein Kasus ist keine Satzgliedfunktion. */
(function(){
 const Z=window.ZI,G=Z.G,{add,mc,mark,fields,assign,repair,sol}=G;
 const namen=['Nominativ','Genitiv','Dativ','Akkusativ'],fragen=['Wer oder was?','Wessen?','Wem?','Wen oder was?'];
 const bank=[
  ['Schiff',['das Schiff',['des Schiffs','des Schiffes'],'dem Schiff','das Schiff'],['{Das Schiff} liegt im Hafen.','Das Segel {des Schiffes} ist gerissen.','Der Kapitän nähert sich {dem Schiff}.','Die Mannschaft repariert {das Schiff}.'],['das alte Schiff','des alten Schiffes','dem alten Schiff','das alte Schiff']],
  ['Tisch',['der Tisch','des Tisches','dem Tisch','den Tisch'],['{Der Tisch} wackelt.','Die Beine {des Tisches} sind kurz.','Hilda nähert sich {dem Tisch}.','Brumm baut {den Tisch}.'],['der schwere Tisch','des schweren Tisches','dem schweren Tisch','den schweren Tisch']],
  ['Blume',['die Blume','der Blume','der Blume','die Blume'],['{Die Blume} blüht.','Die Blätter {der Blume} sind gelb.','Das Kind gibt {der Blume} Wasser.','Svea pflückt {die Blume}.'],['die gelbe Blume','der gelben Blume','der gelben Blume','die gelbe Blume']],
  ['Seeräuber',['der Seeräuber','des Seeräubers','dem Seeräuber','den Seeräuber'],['{Der Seeräuber} setzt die Segel.','Der Hut {des Seeräubers} ist nass.','Die Crew hilft {dem Seeräuber}.','Leo sieht {den Seeräuber}.'],['der mutige Seeräuber','des mutigen Seeräubers','dem mutigen Seeräuber','den mutigen Seeräuber']],
  ['Insel',['die Insel','der Insel','der Insel','die Insel'],['{Die Insel} liegt hinter dem Riff.','Die Küste {der Insel} ist steil.','Die Flut schadet {der Insel}.','Die Reisenden erreichen {die Insel}.'],['die kleine Insel','der kleinen Insel','der kleinen Insel','die kleine Insel']],
  ['Seeungeheuer',['das Seeungeheuer','des Seeungeheuers','dem Seeungeheuer','das Seeungeheuer'],['{Das Seeungeheuer} schläft.','Der Schwanz {des Seeungeheuers} ist lang.','Die Fische folgen {dem Seeungeheuer}.','Die Crew beobachtet {das Seeungeheuer}.'],['das riesige Seeungeheuer','des riesigen Seeungeheuers','dem riesigen Seeungeheuer','das riesige Seeungeheuer']],
  ['Ring',['der Ring',['des Rings','des Ringes'],'dem Ring','den Ring'],['{Der Ring} glänzt.','Die Kraft {des Ringes} überrascht Leo.','Leo traut {dem Ring}.','Hilda findet {den Ring}.'],['der magische Ring','des magischen Ringes','dem magischen Ring','den magischen Ring']],
  ['Raumschiff',['das Raumschiff',['des Raumschiffs','des Raumschiffes'],'dem Raumschiff','das Raumschiff'],['{Das Raumschiff} landet.','Die Tür {des Raumschiffes} öffnet sich.','Die Technikerin nähert sich {dem Raumschiff}.','Die Crew prüft {das Raumschiff}.'],['das silberne Raumschiff','des silbernen Raumschiffes','dem silbernen Raumschiff','das silberne Raumschiff']],
  ['Mann',['der Mann','des Mannes','dem Mann','den Mann'],['{Der Mann} trägt einen Rucksack.','Die Schuhe {des Mannes} sind schmutzig.','Die Wirtin antwortet {dem Mann}.','Das Kind grüßt {den Mann}.'],['der müde Mann','des müden Mannes','dem müden Mann','den müden Mann']],
  ['Schiffe',['die Schiffe','der Schiffe','den Schiffen','die Schiffe'],['{Die Schiffe} ankern.','Die Segel {der Schiffe} flattern.','Die Crew folgt {den Schiffen}.','Hilda zählt {die Schiffe}.'],['die alten Schiffe','der alten Schiffe','den alten Schiffen','die alten Schiffe']],
  ['Blumen',['die Blumen','der Blumen','den Blumen','die Blumen'],['{Die Blumen} duften.','Die Farben {der Blumen} leuchten.','Das Kind gibt {den Blumen} Wasser.','Svea gießt {die Blumen}.'],['die roten Blumen','der roten Blumen','den roten Blumen','die roten Blumen']],
  ['Seeräuber',['die Seeräuber','der Seeräuber','den Seeräubern','die Seeräuber'],['{Die Seeräuber} singen.','Die Hüte {der Seeräuber} sind nass.','Die Crew hilft {den Seeräubern}.','Leo beobachtet {die Seeräuber}.'],['die mutigen Seeräuber','der mutigen Seeräuber','den mutigen Seeräubern','die mutigen Seeräuber']],
 ];
 for(let d=1;d<=5;d++)bank.forEach(([n,formen,saetze,erweitert],j)=>{
  const k=j%4,s=saetze[k],gruppe=s.match(/{([^}]+)}/)[1],family='kasus-'+j,context=s.replace(/[{}]/g,'');let q;
  if(d===5){const falsch=k===0?erweitert[3]:erweitert[(k+1)%4],richtig=erweitert[k];const a=falsch.split(' '),b=richtig.split(' '),broken=a.map((w,i)=>w!==b[i]?'{'+w+'}':w).join(' ');if(a.join(' ')===b.join(' '))q=mark('Markiere die vollständige Nomengruppe, die im Nominativ steht.',s.replace('{'+gruppe+'}','{'+erweitert[k]+'}'));else q=repair(s.replace('{'+gruppe+'}',broken),s.replace('{'+gruppe+'}',richtig),a.filter((w,i)=>w!==b[i]).length,'Verbessere die Formen innerhalb der Nomengruppe.');}
  else if(d===1)q=mc('In welchem Fall steht „'+gruppe+'“?',namen[k],namen,context);
  else q=mark('Markiere die vollständige Nomengruppe im '+namen[k]+'.',d>=3?s.replace('{'+gruppe+'}','{'+erweitert[k]+'}'):s);
  add('faelle',d,'sicherung',d===5?'A19':'A13',['Q025','Q042'],family,q,
   ['Frage im vollständigen Satz nach der gesuchten Wortgruppe.','Die Frage „'+fragen[k]+'“ führt hier zur gesuchten Gruppe.','Die Form „'+(d>=3?erweitert[k]:gruppe)+'“ steht hier im '+namen[k]+'.'],
   'Die Frage „'+fragen[k]+'“ bestimmt hier den '+namen[k]+'. Artikel und gegebenenfalls Adjektiv gehören zur Nomengruppe.');
  const ks=d===1?[k,(k+2)%4]:d===2?[0,1,2,3]:[k,(k+1)%4,(k+2)%4];
  q=fields('form',d>=3?'Setze die ganze Nomengruppe mit Adjektiv in die verlangten Fälle.':'Ergänze die Kasustabelle. Schreibe Artikel und Nomen.',ks.map(i=>[namen[i]+' – '+fragen[i],d>=3?erweitert[i]:formen[i]]),G.ausgang('Nomen',n,(j>=9?' (Mehrzahl)':' (Einzahl)')+(d>=3?' · Eigenschaft: '+['alt','schwer','gelb','mutig','klein','riesig','magisch','silbern','müde','alt','rot','mutig'][j]:'')));
  add('faelle',d,'kern','A02',['Q050','Q042'],family,q,
   ['Lies für jede Tabellenzeile die Kasusfrage.','Artikel und gegebenenfalls Endungen müssen zum gefragten Fall passen.','Vergleiche: '+erweitert.join(' – ')+'.'],
   'Die Formen lauten: '+formen.map(v=>sol(v).join(' / ')).join(' – ')+'. Auch bei gleich aussehenden Formen entscheidet die Frage im Satz.');
  if(d===1)q=assign('match','Bestimme den Fall der jeweils genannten Gruppe im Satz.',saetze.map(x=>x.replace(/\{([^}]+)\}/,'„$1“')),namen,namen);
  else if(d===2)q=fields('gap','Ergänze die Formen im Satz.',[[fragen[k],formen[k]],[fragen[(k+1)%4],formen[(k+1)%4]]],s.replace('{'+gruppe+'}','___')+' '+saetze[(k+1)%4].replace(/\{[^}]+\}/,'___'));
  else if(d===3)q=fields('transfer','Vergleiche die Fälle in beiden Sätzen. Ähnliche Formen können verschiedene Fälle haben.',[['Fall von „'+sol(formen[0])[0]+'“ im ersten Satz','Nominativ',namen],['Fall von „'+sol(formen[3])[0]+'“ im zweiten Satz','Akkusativ',namen]],saetze[0].replace(/[{}]/g,'')+' '+saetze[3].replace(/[{}]/g,''));
  else if(d===4)q=fields('transfer','Bestimme den Fall der Gruppe mit Präposition und den Fall der Gruppe im Beispielsatz.',[['„mit '+erweitert[2]+'“','Dativ',namen],['„'+erweitert[k]+'“ im Beispielsatz',namen[k],namen]],s.replace('{'+gruppe+'}',erweitert[k])+' Zusatzgruppe: mit '+erweitert[2]+'.');
  else q=fields('transfer','Prüfe beide Aussagen zum Satz.',[['Fall von „'+erweitert[k]+'“',namen[k],namen],['Kasus und Satzgliedfunktion','sind verschiedene Beschreibungen',['sind immer dasselbe','sind verschiedene Beschreibungen']]],s.replace('{'+gruppe+'}',erweitert[k]));
  add('faelle',d,'transfer',d<=2?'A14':'A15',['Q050','Q051'],family,q,
   ['Untersuche die Wortgruppe in ihrem Zusammenhang.','Gleich aussehende Formen können verschiedene Fälle haben; „mit“ verlangt den Dativ.','Nutze die Fragen: Wer oder was? Wessen? Wem? Wen oder was?'],
   'Kasus beschreibt eine Form der Nomengruppe. Satzgliedfunktion beschreibt ihre Aufgabe im Satz. Eine Dativform nach „mit“ ist deshalb nicht automatisch ein Dativobjekt.');
 });
 G.kasus=bank;
})();
