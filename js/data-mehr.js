/* Zwergeninsel – zusätzliche Aufgaben, Vormach-Beispiele und Wissensbuch
   Jede Station zieht zufällig aus ihrem Pool, damit jedes Spielen anders ist. */

(function () {
  const ZI = window.ZI;

  /* =========================================================
     MEHR AUFGABEN
     ========================================================= */

  /* =========================================================
     MEISTERIN HAMMERLIND MACHT ES VOR
     Lösungsbeispiel vor jeder Station im Hauptstollen.
     art: gut | schlecht | these | begruendung | beispiel | neutral
     ========================================================= */
  ZI.VORMACHEN = {
    k1s1: {
      titel: 'Stumpf oder scharf?',
      kopf: 'Ich finde, dass man Hausaufgaben machen sollte, …',
      schritte: [
        { sagt: 'Ich lese die erste Begründung: „… weil Hausaufgaben wichtig sind.“ Ich frage: Warum sind sie wichtig? Das steht da nicht. Die Begründung dreht sich im Kreis.',
          zeigt: { text: '… weil Hausaufgaben wichtig sind.', art: 'schlecht', marke: 'stumpf' } },
        { sagt: 'Jetzt die zweite: „… weil man den Stoff übt und ihn sich besser merkt.“ Die erklärt, WARUM. Die ist scharf!',
          zeigt: { text: '… weil man den Stoff übt und ihn sich besser merkt.', art: 'gut', marke: 'scharf' } },
        { sagt: 'Mein Trick: Ich frage bei jeder Begründung „Warum?“. Bekomme ich eine echte Antwort, ist sie scharf.' },
      ] },
    k1s2: {
      titel: 'Erz oder Schlacke?',
      kopf: 'Wir sollten einen Kreativtag machen, …',
      schritte: [
        { sagt: '„… weil man beim Basteln Kleber braucht.“ Das stimmt zwar. Aber ist das ein Grund für einen Kreativtag? Nein. Das ist Schlacke.',
          zeigt: { text: '… weil man beim Basteln Kleber braucht.', art: 'schlecht', marke: 'Schlacke' } },
        { sagt: '„… weil jeder zeigen kann, was er gut kann.“ Das passt zur Meinung und erklärt etwas. Das ist Erz!',
          zeigt: { text: '… weil jeder zeigen kann, was er gut kann.', art: 'gut', marke: 'Erz' } },
        { sagt: 'Ich frage mich immer: Hilft dieser Grund der Meinung wirklich weiter?' },
      ] },
    k1s3: {
      titel: 'Weil-Denn-Amboss',
      kopf: 'Ich ziehe mich warm an, …',
      schritte: [
        { sagt: 'Mit „weil“ wandert das gebeugte Verb ganz ans Ende: „weil es draußen schneit“.',
          zeigt: { text: '…, weil es draußen schneit.', art: 'gut', marke: 'Verb am Ende' } },
        { sagt: 'Mit „denn“ bleibt der Satz ganz normal. Das Verb steht an zweiter Stelle: „denn es schneit draußen“.',
          zeigt: { text: '…, denn es schneit draußen.', art: 'gut', marke: 'Verb an 2. Stelle' } },
        { sagt: 'Und vor weil, da und denn kommt immer ein Komma. Zum Schluss lese ich den Satz leise vor – klingt er richtig?' },
      ] },
    k2s1: {
      titel: 'Argument-Puzzle',
      kopf: 'Ich setze ein Argument aus drei Teilen zusammen.',
      schritte: [
        { sagt: 'Zuerst meine Meinung: Was finde ich?', zeigt: { text: 'Ich finde, dass wir einen Klassenrat brauchen,', art: 'these', marke: 'Meinung' } },
        { sagt: 'Dann suche ich die Begründung, die genau dazu passt.', zeigt: { text: '… weil wir dort Streit fair klären können.', art: 'begruendung', marke: 'Begründung' } },
        { sagt: 'Zum Schluss das Beispiel. Es zeigt die Begründung ganz genau.', zeigt: { text: 'Letzte Woche haben wir dort zum Beispiel einen Streit um den Ball gelöst.', art: 'beispiel', marke: 'Beispiel' } },
      ] },
    k2s2: {
      titel: 'Motor oder Bremse?',
      kopf: 'Im Klassenrat wird über einen Ausflug gesprochen.',
      schritte: [
        { sagt: '„Kannst du das noch einmal erklären?“ – Nachfragen hilft, dass wir uns verstehen. Das ist ein Motor.',
          zeigt: { text: '„Kannst du das noch einmal erklären?“', art: 'gut', marke: 'Motor' } },
        { sagt: '„Das ist doch Quatsch!“ – Das macht den anderen schlecht und hat keinen Grund. Das ist eine Bremse.',
          zeigt: { text: '„Das ist doch Quatsch!“', art: 'schlecht', marke: 'Bremse' } },
        { sagt: 'Ich frage mich bei jedem Satz: Bringt er unser Gespräch weiter?' },
      ] },
    k2s3: {
      titel: 'Hör-Stollen',
      kopf: 'So höre ich gut zu:',
      schritte: [
        { sagt: 'Hier arbeitest du mit einem Partner. Er liest vor, du hörst zu. Bei „Ich finde, dass …“ kommt die Meinung.', zeigt: { text: '„Ich finde, dass …“', art: 'these', marke: 'Meinung' } },
        { sagt: 'Bei „weil“ oder „denn“ spitze ich die Ohren. Jetzt kommt die Begründung.', zeigt: { text: '„… weil …“ oder „… denn …“', art: 'begruendung', marke: 'Begründung' } },
        { sagt: 'Bei „zum Beispiel“ kommt das Beispiel. Bin ich unsicher, bitte ich meinen Partner: „Lies es bitte noch einmal vor.“', zeigt: { text: '„Zum Beispiel …“', art: 'beispiel', marke: 'Beispiel' } },
      ] },
    k3s1: {
      titel: 'Ja, und – ja, aber?',
      kopf: 'Lea: „Wir sollten mehr Ausflüge machen, weil wir dabei viel erleben.“',
      schritte: [
        { sagt: 'Tom sagt: „Ja, und wir lernen dabei auch etwas.“ Er stimmt zu und ergänzt. Das ist „Ja, und“.',
          zeigt: { text: 'Tom: „Ja, und wir lernen dabei auch etwas.“', art: 'gut', marke: 'Ja, und' } },
        { sagt: 'Merle sagt: „Das stimmt, aber Ausflüge kosten Geld.“ Sie nimmt Lea ernst und widerspricht. Das ist „Ja, aber“.',
          zeigt: { text: 'Merle: „Das stimmt, aber Ausflüge kosten Geld.“', art: 'begruendung', marke: 'Ja, aber' } },
        { sagt: 'Und wer über etwas ganz anderes redet, wechselt das Thema.' },
      ] },
    k3s2: {
      titel: 'Wer hört zu?',
      kopf: 'Paul: „Ich möchte längere Pausen, weil ich mich danach besser konzentriere.“',
      schritte: [
        { sagt: 'Eine gute Antwort wiederholt zuerst, was Paul wirklich gesagt hat.',
          zeigt: { text: '„Du sagst, dass du dich danach besser konzentrierst …“', art: 'gut', marke: 'hört zu' } },
        { sagt: 'Vorsicht bei „Du willst also …“! Oft wird dann etwas verdreht. Paul hat nicht gesagt, dass er keinen Unterricht will.',
          zeigt: { text: '„Du willst also gar keinen Unterricht mehr?“', art: 'schlecht', marke: 'verdreht' } },
      ] },
    k3s3: {
      titel: 'Überzeug den Inselrat',
      kopf: 'Einwand: „Für eine Brücke brauchen wir viel zu viel Holz.“',
      schritte: [
        { sagt: 'Zuerst nehme ich den Einwand ernst und gebe zu, was stimmt.', zeigt: { text: '„Das stimmt, eine Brücke braucht viel Holz.“', art: 'neutral', marke: 'ernst nehmen' } },
        { sagt: 'Dann zeige ich eine Lösung.', zeigt: { text: '„Aber am Strand liegt genug Treibholz.“', art: 'gut', marke: 'Lösung' } },
        { sagt: 'So überzeuge ich, ohne unfreundlich zu werden.' },
      ] },
  };

  /* =========================================================
     ZWERGEN-WISSENSBUCH
     Jede geschaffte Station schaltet eine Seite frei.
     ========================================================= */
  ZI.WISSEN = [
    { k: 0, art: 'kern', i: 0, titel: 'Scharfe Begründungen',
      text: 'Eine scharfe Begründung erklärt, WARUM du etwas meinst. Eine stumpfe Begründung sagt nur dasselbe noch einmal, zum Beispiel „weil es gut ist“.',
      beispiel: 'Stumpf: … weil Sport wichtig ist.\nScharf: … weil Bewegung das Herz stärkt.' },
    { k: 0, art: 'kern', i: 1, titel: 'Passende Begründungen',
      text: 'Eine Begründung muss zur Meinung passen. Was zwar stimmt, aber nichts mit der Meinung zu tun hat, überzeugt niemanden.',
      beispiel: 'Schulhund? „… weil Hunde gern spielen“ stimmt – ist aber kein Grund für einen Hund in der Klasse.' },
    { k: 0, art: 'kern', i: 2, titel: 'weil, da und denn',
      text: 'Nach weil und da steht das gebeugte Verb am Ende. Nach denn steht es an zweiter Stelle. Vor weil, da und denn steht ein Komma.',
      beispiel: '…, weil es kalt ist.\n…, denn es ist kalt.' },
    { k: 0, art: 'tief', i: 2, n: 3, titel: 'Doppelt prüfen',
      text: 'Prüfe jeden Begründungssatz zweimal: Steht das Komma? Steht das Verb an der richtigen Stelle?',
      beispiel: 'Tom bleibt zu Hause, weil er Fieber hat.' },
    { k: 1, art: 'tief', i: 0, n: 4, titel: 'Gute Beispiele',
      text: 'Ein gutes Beispiel passt genau zur Begründung, und man kann es sich gut vorstellen.',
      beispiel: '… weil wir Verantwortung lernen. Zum Beispiel füllt jeden Tag jemand den Wassernapf auf.' },
    { k: 0, art: 'tief', i: 3, n: 1, titel: 'Laut argumentieren',
      text: 'Sprich in ganzen Sätzen. Schau dein Gegenüber an und sprich deutlich.',
      beispiel: '„Ich finde, dass …, weil …“' },
    { k: 1, art: 'kern', i: 0, titel: 'Meinung, Begründung, Beispiel',
      text: 'Ein vollständiges Argument hat drei Teile: Die Meinung sagt, was du denkst. Die Begründung sagt, warum. Das Beispiel zeigt es ganz genau.',
      beispiel: 'Ich finde, dass … (Meinung),\nweil … (Begründung).\nZum Beispiel … (Beispiel).' },
    { k: 1, art: 'kern', i: 1, titel: 'Gesprächsmotoren',
      text: 'Motoren bringen ein Gespräch weiter: begründen, nachfragen, anknüpfen, zusammenfassen, andere einbeziehen. Bremsen stoppen es: auslachen, dazwischenrufen, abschweifen.',
      beispiel: 'Motor: „Kannst du das genauer erklären?“\nBremse: „Das ist doch Quatsch!“' },
    { k: 1, art: 'kern', i: 2, titel: 'Gut zuhören',
      text: 'Signalwörter helfen beim Zuhören: Nach „weil“ oder „denn“ kommt die Begründung, nach „zum Beispiel“ kommt das Beispiel.',
      beispiel: '„…, weil wir dort lernen. Zum Beispiel …“' },
    { k: 1, art: 'tief', i: 0, n: 2, titel: 'Teile erkennen',
      text: 'Achte auf die Signalwörter: „Ich finde, dass“ für die Meinung, „weil“ oder „denn“ für die Begründung, „zum Beispiel“ für das Beispiel.',
      beispiel: '„Ich bin der Meinung, dass …“ und „Ich bin dafür, dass …“ leiten auch eine Meinung ein.' },
    { k: 1, art: 'tief', i: 0, n: 3, titel: 'Reihe und Kette',
      text: 'Stützen bauen auf einem Argument auf und erklären es genauer (Kette). Mit „außerdem“ beginnt meist ein neues Argument (Reihe).',
      beispiel: '… weil Bewegung gesund ist. Das Herz wird kräftiger.' },
    { k: 1, art: 'tief', i: 3, n: 1, titel: 'Das ganze Argument',
      text: 'Wer Meinung, Begründung und Beispiel sagt, überzeugt am meisten.',
      beispiel: '„Ich finde, dass …, weil … Zum Beispiel …“' },
    { k: 2, art: 'kern', i: 0, titel: 'Ja, und – ja, aber',
      text: 'Mit „Ja, und …“ stimmst du zu und ergänzt. Mit „Ja, aber …“ nimmst du den anderen ernst und widersprichst. Beides bringt ein Gespräch weiter.',
      beispiel: '„Ja, und außerdem …“\n„Das stimmt, aber …“' },
    { k: 2, art: 'kern', i: 1, titel: 'Anknüpfen',
      text: 'Zeig, dass du zugehört hast: Wiederhole, was der andere gesagt hat, bevor du antwortest. Verdrehe nichts und übertreibe nicht.',
      beispiel: '„Du sagst, dass … Dazu denke ich, dass …“' },
    { k: 2, art: 'kern', i: 2, titel: 'Einwände entkräften',
      text: 'Nimm einen Einwand ernst. Gib zu, was stimmt, und zeig dann eine Lösung oder ein Beispiel.',
      beispiel: '„Das stimmt, aber wenn wir …, dann …“' },
    { k: 2, art: 'tief', i: 0, n: 3, titel: 'Gegenargumente',
      text: 'Ein Gegenargument spricht gegen eine Meinung. Wer die Gegenargumente kennt, kann besser antworten – und seine eigene Meinung prüfen.',
      beispiel: '„Aber manche Kinder sind allergisch.“' },
    { k: 2, art: 'tief', i: 1, n: 3, titel: 'Wer überzeugt wen?',
      text: 'Überlege, was deinem Gegenüber wichtig ist. Das beste Argument geht genau auf diese Sorge ein.',
      beispiel: 'Papa sorgt sich ums Gassigehen → „Ich gehe jeden Tag mit dem Hund raus.“' },
    { k: 2, art: 'tief', i: 3, n: 1, titel: 'Das Streitgespräch',
      text: 'Erst zuhören, dann wiederholen, dann widersprechen. Und immer freundlich bleiben.',
      beispiel: '„Du sagst, dass … Aber ich finde, dass …, weil …“' },
  ];
})();
