# Zwergeninsel der Grammatik

Grammatik-Lernspiel für Deutsch, Klasse 5. Die bestehende Inselwelt, zwölf Figuren, Gebäude, Bilder, lokale Schriften und Animationen werden weiterverwendet. Reines HTML/CSS/JavaScript, ohne Server oder externe Bibliotheken.

- `index.html`: Schmiede, elf Stollen in drei Kapiteln, jeweils fünf unabhängige Tiefen.
- `insel.html`: gemeinsames Klassen-Board. „Mein Fortschritt“ in der Schmiede zeigt den persönlichen Lernstand; frühere persönliche Insellinks führen dorthin.
- `karten.html`: vorhandene druckbare Passkarten mit festen Kartennummern.
- `lehrkraft.html`: kompakter, druckbarer Lehrer-Spickzettel im ursprünglichen Zweispalten-Layout.

## Lernen und Fortschritt

Start, Kartenraster, Zwergenauswahl, Hallenlayout, Meisterinnenbühne, Ortswechsel und Erfolgsfenster verwenden die ursprünglichen Kompositionen und CSS-Klassen. Die visuellen Bausteine sind in `js/spielwelt.js` wiederverwendet. Eine kurze Story führt ins Spiel ein; sechs Vormachschritte zeigen vor jeder Tiefe ein separates Beispiel. Material, Edelsteine, Abzeichen, Ränge, Kronen, neue Bewohner, Gebäude und Stollen werden sichtbar gefeiert.

Neun Aufgaben pro Runde. Tiefe 1–4: mindestens sieben richtige erste Antworten, Tiefe 5: mindestens acht. Korrekturen und gestufte Hilfen ermöglichen das Weiterüben, erhöhen aber die erste Antwortwertung nicht nachträglich. Es gibt kein Überspringen: Auch nach angezeigter Lösung muss das Kind selbst eine korrekte Antwort eingeben und prüfen. Eine vor dem ersten Versuch eingeblendete vollständige Lösung gibt keinen Erstversuchspunkt. Direkte Wiederholungen werden durch einen gemischten Vorrat pro Stollen und Tiefe vermindert.

Jeder erstmalig bestandene Grundstollen bringt ein Material. Tiefe 2–4 bringt je fünf Edelsteine, Tiefe 5 eine Krone. Wiederholungen belohnen nicht erneut. Alle regulären Freischaltungen sind ausschließlich mit Tiefe 1 erreichbar.

`js/data-bau.js` enthält Baugrenzen, Belohnungen, Stollen und leicht änderbare Zwergenbedingungen. Die gemeinsame Insel verwendet Material pro eingestelltem Kind. Persönliche Grundstollen erlauben auch selbstständiges Weiterspielen; Inselbotschaften können gemeinsame Freischaltungen übertragen.

`js/data-grammatik.js` enthält Regeln, Quellenkennungen und das gemeinsame Datenschema. Die drei Kapiteldateien unter `js/grammatik/` liefern **1.980 Aufgaben/Varianten: 36 pro Tiefe, 180 pro Stollen**. Grundlage sind die analysierten Unterrichtsmaterialien (Wortschmiede, Raumfahrt, Wettbewerb/Detektive, Schatzsuche/Wikinger und Satzbau). Jede Aufgabe trägt Quelle, Aufgabenmuster, Bearbeitungsart und Kontextfamilie. Die Quellen selbst bleiben außerhalb des öffentlichen Repositories. Beim kleineren Pronomenbereich wurden zusätzliche materialnahe Beispiele entwickelt.

Eine Runde mischt drei Sicherungen, vier Kernaufgaben und zwei Transfers ohne doppelte Kontextfamilien; das vorgeführte Beispiel bleibt außerhalb der Runde. Die zehn Engines bleiben erhalten. Formenbildung, Lücken und Transfer unterstützen mehrere beschriftete Eingabefelder sowie geführte Auswahl. Zulässige Formvarianten und Wortstellungen werden ausdrücklich hinterlegt. Offene Textwirkung wird durch begrenzte Auswahl mit mehreren Lösungen geprüft. Fehlerjagden nennen die exakt geprüfte Fehlerzahl. Es gibt keine automatische Bewertung beliebiger freier Texte.

## Pässe und Geräte

Persönliche Pässe beginnen jetzt mit `G2-` und enthalten alle elf Tiefen, Kartennummer, Figur, Baustufe und bestätigte Lieferstände mit 16-Bit-Prüfung. Vorhandene G1-Pässe bleiben lesbar.

Die tägliche Lieferung verwendet wieder **einen einzigen vierstelligen Code pro Kind**. Das ursprüngliche 20-Bit-Lieferscheinverfahren mit Verwürfelung und Prüfbit wurde adaptiert. Eine feste Tabelle komprimiert alle zulässigen Kombinationen von Material, Tiefenschritten und Kronen auf 936 Gesamtstände. Zusammen mit 32 Kartennummern und zwölf Figuren ergeben sich 359.424 mögliche Lieferungen, die mit Prüfbit in vier Zeichen passen.

Das Board übernimmt je Karte die höchsten Gesamtstände; wiederholte oder ältere Codes geben kein doppeltes Material, keine doppelten Edelsteine und keine doppelte Krone. Ein Code umfasst auch mehrere neue Stollen. Nach vier Zeichen wird automatisch angenommen; Bildschirmtastatur, physische Tastatur, Serieneingabe, Tagesraster und Rückgängig stehen bereit. Stollenspezifische Lernstände bleiben im persönlichen Pass; das Klassen-Board zeigt die gelieferten Summen pro Karte und erfindet keine Einzelkompetenzen aus dem kompakten Code. Bestehende Board-Sicherungen mit vollständigen G1-Pässen werden übernommen.

Nach der Bestätigung am Board markiert das Kind seine Lieferung als angekommen. Diese Bestätigung wird im persönlichen Pass gespeichert; neue Grundstollen oder Tiefen erzeugen wieder eine offene Lieferung. Der Schein lässt sich bei Bedarf erneut zeigen. Die Lehrkraft braucht den langen Pass nicht für die täglichen Lieferungen.

Inselbotschaften sind stabile Fantasiewörter mit **sechs Buchstaben** für die zwölf Baustufen. Die lange frühere Botschaft bleibt als Eingabe lesbar. Die sichtbare Bautafel zeigt das nächste konkrete Gebäude, dessen Ruine und fertiges Bild sowie den Fortschritt bis zu diesem Gebäude.

Alte Argumentationspässe und alte lokale Inselstände bleiben getrennt und unverändert. Sie werden nicht als Grammatikkompetenzen importiert. Der Schülerstand liegt wie bisher nur im Tab (`sessionStorage`); der aktuelle Pass bleibt die geräteunabhängige Sicherung. Das gemeinsame Board nutzt einen eigenen `localStorage`-Schlüssel und kann als JSON-Datei gesichert werden.

Versteckter Lehrkraftzugang: Titel auf dem Startbildschirm fünf Sekunden halten. Testmodus öffnet alle Tiefen, verändert den Lernstand aber nicht. Inselverwaltung: eine freie Stelle der Inselgrafik (z. B. das Wasser) fünf Sekunden halten. Dort Klassengröße und Sicherung verwalten. Es gibt keinen sichtbaren Admin-Button, keinen Ton und keinen Nachtmodus.

## Entwicklung und Prüfung

Mit einem lokalen statischen HTTP-Server öffnen oder auf GitHub Pages hosten. Der versionierte Service Worker speichert die Anwendung; vorhandene Bilder werden gestaffelt nachgeladen. Nach Änderungen die Version in `sw.js` erhöhen.

```sh
node --test tests/*.test.cjs
node tests/browser.cjs
node tests/unterricht-browser.cjs
```

Die Browserprüfung benötigt Playwright mit Chromium. Sie startet ihren eigenen lokalen HTTP-Server und prüft Bedienung und Speicherung im iPad-Landscape-Format. Die Logiktests benötigen nur Node.js.

Später anpassbar: Baugrenzen und Klassengröße, Zwergenbedingungen, Umfang und Vielfalt der Pools, akzeptierte Transferformulierungen sowie Rundenzeit nach Erprobung mit Kindern. Der bisherige Zwergenrat und die Argumentationsmodule wurden aus dem aktiven Spiel entfernt.
