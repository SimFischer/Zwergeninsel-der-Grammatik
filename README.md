# Zwergeninsel der Grammatik

Grammatik-Lernspiel für Deutsch, Klasse 5. Die bestehende Inselwelt, zwölf Figuren, Gebäude, Bilder, lokale Schriften und Animationen werden weiterverwendet. Reines HTML/CSS/JavaScript, ohne Server oder externe Bibliotheken.

- `index.html`: Schmiede, elf Stollen in drei Kapiteln, jeweils fünf unabhängige Tiefen.
- `insel.html`: gemeinsames Insel-Board; `insel.html?eigen=1`: persönliche Insel aus dem aktiven Tab.
- `karten.html`: vorhandene druckbare Passkarten mit festen Kartennummern.
- `lehrkraft.html`: Unterrichtsablauf und Bedienhinweise.

## Lernen und Fortschritt

Neun Aufgaben pro Runde. Tiefe 1–4: mindestens sieben richtige erste Antworten, Tiefe 5: mindestens acht. Korrekturen und gestufte Hilfen ermöglichen das Weiterüben, erhöhen aber die erste Antwortwertung nicht nachträglich. Direkte Wiederholungen werden durch einen gemischten Vorrat pro Stollen und Tiefe vermindert.

Jeder erstmalig bestandene Grundstollen bringt ein Material. Tiefe 2–4 bringt je fünf Edelsteine, Tiefe 5 eine Krone. Wiederholungen belohnen nicht erneut. Alle regulären Freischaltungen sind ausschließlich mit Tiefe 1 erreichbar.

`js/data-bau.js` enthält Baugrenzen, Belohnungen, Stollen und leicht änderbare Zwergenbedingungen. Die gemeinsame Insel verwendet Material pro eingestelltem Kind. Persönliche Grundstollen erlauben auch selbstständiges Weiterspielen; Inselbotschaften können gemeinsame Freischaltungen übertragen.

`js/data-grammatik.js` enthält Regeln, Tiefenziele und kleine **vorläufige Beispielvorlagen**, aus denen zwölf Varianten pro Tiefe entstehen. Dies sind keine endgültigen Aufgabenpools. Zusätzliche Aufgaben lassen sich an `ZI.POOLS[stollenId][tiefe]` anhängen. Schema und Lösungstypen stehen im Dateikopf und in `js/engines.js`. Die zehn Engines sind Auswahl, Wortmarkierung, Gruppenmarkierung, Sortieren, Zuordnen, Lücke, Formenbildung, Satzbausteine, Fehlerreparatur und geführter Transfer. Transfer ist ausdrücklich geführt und hat hinterlegte zulässige Lösungen, keine automatische Freitextbewertung.

## Pässe und Geräte

Grammatikpässe beginnen mit `G1-` und enthalten alle elf Tiefen, Kartennummer, Figur und gemeinsame Baustufe mit 16-Bit-Prüfung. Für Lieferungen wird zunächst der gesamte Pass eingegeben. Die alten vierstelligen Lieferscheine können elf Stollen nicht abbilden. Mehrere Lieferungen derselben Kartennummer werden pro Stollen mit dem höchsten Stand zusammengeführt. Die letzte Lieferung lässt sich zurücknehmen.

Alte Argumentationspässe und alte lokale Inselstände bleiben getrennt und unverändert. Sie werden nicht als Grammatikkompetenzen importiert. Der Schülerstand liegt wie bisher nur im Tab (`sessionStorage`); der aktuelle Pass bleibt die geräteunabhängige Sicherung. Das gemeinsame Board nutzt einen eigenen `localStorage`-Schlüssel und kann als JSON-Datei gesichert werden.

Versteckter Lehrkraftzugang: Titel auf dem Startbildschirm fünf Sekunden halten. Testmodus öffnet alle Tiefen, verändert den Lernstand aber nicht. Inselverwaltung: Titel auf dem gemeinsamen Board fünf Sekunden halten. Dort Klassengröße und Sicherung verwalten. Es gibt keinen sichtbaren Admin-Button, keinen Ton und keinen Nachtmodus.

## Entwicklung und Prüfung

Mit einem lokalen statischen HTTP-Server öffnen oder auf GitHub Pages hosten. Der versionierte Service Worker speichert die Anwendung; vorhandene Bilder werden gestaffelt nachgeladen. Nach Änderungen die Version in `sw.js` erhöhen.

```sh
node --test tests/*.test.cjs
node tests/browser.cjs
```

Die Browserprüfung benötigt Playwright mit Chromium. Sie startet ihren eigenen lokalen HTTP-Server und prüft Bedienung und Speicherung im iPad-Landscape-Format. Die Logiktests benötigen nur Node.js.

Später anpassbar: Baugrenzen und Klassengröße, Zwergenbedingungen, Umfang und Vielfalt der Pools, akzeptierte Transferformulierungen sowie Rundenzeit nach Erprobung mit Kindern. Der bisherige Zwergenrat und die Argumentationsmodule wurden aus dem aktiven Spiel entfernt.
