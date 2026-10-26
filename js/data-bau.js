/* Zentrale Spielregeln. Material zählt nur erstmalig bestandene Grundstollen. */
(function () {
  const Z = window.ZI;
  Z.RAENGE = [
    [0,'Lehrling'],[3,'Funkenschmied'],[7,'Geselle'],[12,'Erzkenner'],[20,'Sprachschmied'],[35,'Meisterschmied'],[50,'Großmeister']
  ].map(([ab,name],index)=>({ab,name,index}));
  Z.REGELN = { aufgaben: 9, bestehen: 7, meister: 8, edelsteine: 5 };
  Z.BAU = [
    ['lagerfeuer',0,'Nomen, Verben und Adjektive erkunden'],
    ['werkstatt',1,'Fehler markieren und reparieren'],
    ['huette1',1,'Ein Zuhause für neue Sprachzwerge'],
    ['bibliothek',2,'Buch der Sprachzwerge und Pronomen'],
    ['brunnen',3,'Die vier Fälle'],
    ['huette2',4,'Weitere Bewohner kehren zurück'],
    ['steg',5,'Satzwerkstatt: Subjekt und Prädikat'],
    ['ratsplatz',5,'Dorfplatz: Kapitel abschließen und gemischt üben'],
    ['muehle',6,'Objekte und Adverbialien'],
    ['huette3',8,'Ein Zuhause für Meisterzwerge'],
    ['leuchtturm',9,'Die Satzbaumeister'],
    ['festhalle',11,'Inselfest und große Grammatik-Mischrunde'],
  ].map(([id,ab,funktion])=>({id,ab,funktion}));
  Z.gebaute = m => Z.BAU.filter(b => m >= b.ab).map(b => b.id);
  Z.hatGebaeude = (s,id) => Z.gebaute(Math.max(s.coreTotal(),s.welt)).includes(id);
  Z.KAPITEL = ['Die Wortschmiede','Die Satzwerkstatt','Die Satzbaumeister'];
  Z.STOLLEN = [
    ['nomen','Nomen und Artikel',0,'lagerfeuer'],
    ['verben','Verben und Zeitformen',0,'lagerfeuer'],
    ['adjektive','Adjektive und ihre Wirkung',0,'lagerfeuer'],
    ['pronomen','Pronomen und ihre Bezüge',0,'bibliothek'],
    ['faelle','Die vier Fälle',0,'brunnen'],
    ['subjekt','Das Subjekt',1,'steg'],
    ['praedikat','Das Prädikat',1,'steg'],
    ['objekte','Die Objekte',1,'muehle'],
    ['adverbialien','Die Adverbialien',1,'muehle'],
    ['satzbau','Satzbau und Satzarten',2,'leuchtturm'],
    ['verbinden','Sätze verbinden',2,'leuchtturm'],
  ].map(([id,name,kapitel,gebaeude],index)=>({id,name,kapitel,gebaeude,index}));
  Z.stollenFrei = (s,i) => Z.hatGebaeude(s,Z.STOLLEN[i].gebaeude) && (i!==10 || s.t[9]>=1);
  Z.ZWERG_REGELN = [
    ['Schaffe drei Grundstollen.',s=>s.coreTotal()>=3 && Z.hatGebaeude(s,'huette1')],
    ['Erreiche Tiefe 2.',s=>s.t.some(t=>t>=2)],
    ['Sammle 10 Edelsteine.',s=>s.gems()>=10 && Z.hatGebaeude(s,'huette1')],
    ['Erreiche Tiefe 3.',s=>s.t.some(t=>t>=3)],
    ['Schließe die Wortschmiede ab.',s=>s.kapitelFertig(0) && Z.hatGebaeude(s,'huette2')],
    ['Schließe die Satzwerkstatt ab.',s=>s.kapitelFertig(1)],
    ['Sammle drei Kronen.',s=>s.kronenTotal()>=3 && Z.hatGebaeude(s,'huette3')],
    ['Schließe alle elf Grundstollen ab.',s=>s.coreTotal()===11],
  ];
  Z.ZWERGE.forEach((z,i)=>{ if(i>=4){ z.bedingung=Z.ZWERG_REGELN[i-4][0]; z.unlock=Z.ZWERG_REGELN[i-4][1]; } });
})();
/* Gemeinsame Fortschrittsbilder für Halle, Erfolg und Album. */
(function(){
  const Z=window.ZI;
  Z.ROHSTOFF=[{datei:'holz',name:'Holz'},{datei:'stein',name:'Stein'},{datei:'eisen',name:'Eisen'}];
  const icons=['buch-offen','hammer','schleifstein','runenplatte','runenplatte','laterne','amboss','eisen-roh','wegweiser','runenplatte','schmiede-axt-werkstueck'];
  Z.STOLLEN.forEach((s,i)=>{s.icon=icons[i];s.rohstoff=Z.ROHSTOFF[i%3];});
  Z.rang=s=>{
    const punkte=s.t.reduce((n,t)=>n+t,0)+s.kronenTotal();
    const r=Z.RAENGE.filter(r=>punkte>=r.ab).slice(-1)[0],next=Z.RAENGE[r.index+1];
    return {...r,punkte,next};
  };
  Z.ABZEICHEN=[
    {id:'funke',name:'Erster Funke',text:'Dein erster Grundstollen.',test:s=>s.coreTotal()>=1},
    ...Z.KAPITEL.map((name,k)=>({id:'k'+(k+1),name,text:'Alle Grundstollen des Kapitels geschafft.',test:s=>s.kapitelFertig(k)})),
    {id:'gems',name:'Edelsteinfinder',text:'Zehn Edelsteine gesammelt.',test:s=>s.gems()>=10},
    {id:'fehler',name:'Tiefenforscher',text:'In einem Stollen Tiefe 3 erreicht.',test:s=>s.t.some(t=>t>=3)},
    {id:'krone1',name:'Erste Stollenkrone',text:'Einen Stollen bis Tiefe 5 gemeistert.',test:s=>s.kronenTotal()>=1},
    {id:'krone5',name:'Kronensammler',text:'Fünf Stollenkronen gesammelt.',test:s=>s.kronenTotal()>=5},
    {id:'freunde',name:'Willkommen zu Hause',text:'Acht Zwerge sind zurück.',test:s=>s.freieZwerge().length>=8},
    {id:'clan',name:'Der Clan ist zurück',text:'Alle zwölf Zwerge sind zurück.',test:s=>s.freieZwerge().length===12},
  ];
  Z.abzeichenFrei=s=>Z.ABZEICHEN.filter(a=>a.test(s));
})();
