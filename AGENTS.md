# Projektanweisung: Die Legende der Parabel

Diese Anweisung gilt dauerhaft für alle Arbeiten in diesem Projekt. Lies sie vor jedem Schritt.

## Arbeitsregeln

- **Nichts ohne Go:** Baue nur das, was der Nutzer ausdrücklich für den aktuellen Meilenstein freigegeben hat. Entscheide nichts auf Verdacht.
- Bei Unklarheiten fragst du nach, statt Annahmen zu treffen. Vor größeren Änderungen legst du zuerst ein kurzes Konzept mit konkreten Fragen vor.
- Arbeite in kleinen Schritten. Nach jedem Schritt erklärst du kurz, was geändert wurde und wie der Nutzer es testet. Weiter geht es erst nach seiner Rückmeldung.
- Ändere nur, was für den aktuellen Schritt nötig ist. Bestehende, getestete Teile bleiben unberührt. Freigegebene Dialogtexte und Grafiken änderst du nur nach Go.
- Schreibe klaren, gut kommentierten Code (Kommentare auf Deutsch) ohne unnötige Komplexität. Keine externen Bibliotheken, keine externen Schriften, keine Build-Werkzeuge, kein Server.
- Kommuniziere auf Deutsch, knapp und direkt.
- Erfinde keine personenbezogenen Daten. Das Spiel sammelt und sendet keine Daten. Figuren im Spiel tragen Rollenbezeichnungen (Mama, Nachbarin, Freund, Verkäufer), keine echten Namen.
- **Git:** Entwickelt wird auf einem eigenen Arbeitszweig. Nach Freigabe durch den Nutzer wird auf `main` zusammengeführt (GitHub Pages veröffentlicht von `main`).
- Halte diese Datei aktuell: Wenn der Nutzer neue Regeln, Texte oder Entscheidungen freigibt, schlage eine passende Ergänzung von `AGENTS.md` vor.

## Ziel und Rahmen

Ein Mathe-Übungsspiel als Top-Down-Abenteuer im Stil eines modernen 2D-Zelda (Optik) mit Bildschirmaufbau wie im klassischen NES-Zelda, für die 9. Klasse der Realschule Bayern (WPF I, LehrplanPLUS M9, Lernbereich 7: Quadratische Funktionen und quadratische Gleichungen). Das Spiel dient zum Üben und Vertiefen, nicht zum Einführen. Die Lehrkraft führt jedes Thema im Unterricht ein, die NPCs im Spiel liefern nur kurze Merksätze. Alle Dungeons drehen sich ausschließlich um das Thema Parabeln.

## Story

- Die Schule im Startdorf ist zerstört und gesperrt. Die Lehrerinnen und Lehrer werden im Schloss gefangen gehalten.
- Wer oder was dahintersteckt, erfährt man nach und nach durch die besiegten Bosse in den Dungeons.
- Wer alle Dungeons löst und das Schloss befreit, befreit die Lehrkräfte. Danach wird die Schule wieder aufgebaut (sichtbar im Dorf, Teil des Finales bzw. Abspanns).
- Die Spielfigur ist ein Schüler ohne Namen und wird immer nur mit „du“ angesprochen.

## Plattform und Technik

- **Zielgerät:** Schul-iPads mit Safari, Touch-Steuerung, Querformat (im Hochformat erscheint ein Hinweis zum Drehen). Zusätzlich Tastatursteuerung am PC.
- **Hosting:** GitHub Pages. Die Seite wird als Ordner mit mehreren Dateien ausgeliefert und ist auch als Verknüpfung auf dem Home-Bildschirm nutzbar (Vollbild).
- **Aufbau:** `index.html`, `css/style.css` und getrennte JavaScript-Dateien, eingebunden per Script-Tags. Kein Build-Schritt, kein Bundler. Aktueller Stand:
  - `render.js`: Canvas-Skalierung (ganzzahlig, scharfe Pixel), Zeichenhilfen, Ebenen, Sprites, Farbhilfen
  - `font.js`: eigene Pixelschrift für Dialoge (Groß-/Kleinbuchstaben, ä, ö, ü, ß, Ziffern, Satzzeichen)
  - `people.js`: Sprites der Dorfbewohner
  - `buildings.js`: Häuser, Laden, Schule, Zaun, Tor, Brunnen, Tür-Animation
  - `interior.js`: Raum-Rahmen für Innenräume, gemeinsame Möbel, Elternhaus
  - `rooms.js`: weitere Innenräume (Nachbarin, Freund, Laden)
  - `world.js`: Bildschirme der Oberwelt, Kollision, Übergänge, Gesprächsziele
  - `input.js`: Tastatur und Touch (Multitouch), einmalige Tastendrücke für A/B
  - `player.js`: Spielfigur, Bewegung, Laufanimation
  - `dialog.js`: Textbox und Sprechblasen-Hinweis
  - `fx.js`: Atmosphäre (Wolkenschatten, Schmetterlinge, Vignette)
  - `hud.js`: Herzen und Gegenstandsplätze
  - `main.js`: Spielschleife, Abläufe (Tür-Animation, Bildschirmwechsel, Abblenden)
  - Später kommen Dateien für Kampf, Aufgaben, Dungeons, Merkbuch, Speicherung und Ton dazu.
- Logische Auflösung 256 × 224 Pixel, Kacheln 16 × 16, ein Bildschirm = 16 × 14 Kacheln. Karten werden als Textzeilen (ein Zeichen pro Kachel) definiert.
- **Grafik:** komplett per Code gezeichnete Pixelgrafik (Canvas), Optik eines modernen 2D-Zelda: weiche Farbverläufe, Autotiling (durchgehende Wege, Ufer mit Schaum), Schatten, buschige Baumkronen über der Spielfigur, animiertes Wasser, wippende Blumen, Rauch aus Schornsteinen, Wolkenschatten, Schmetterlinge, leichte Vignette. Statische Teile werden einmal vorberechnet, nur Animationen werden pro Bild gezeichnet. Grafik bleibt sauber vom Spielcode getrennt, damit einzelne Grafiken später durch ein freies Tileset ersetzt werden können.
- **Ton:** kurze Soundeffekte per Code (Web Audio) für richtig, falsch, Schwert und Boss-Sieg. Keine Hintergrundmusik. Ton ist standardmäßig aus, die Kinder schalten ihn selbst ein.
- **Lesbarkeit:** große, klare Schrift. Richtig und falsch nie nur über Farbe, sondern zusätzlich mit Haken und Kreuz.

## Steuerung

- **Bewegen:** Pfeiltasten oder WASD; auf dem iPad halbtransparentes Steuerkreuz links unten.
- **A = Enter**, auf dem iPad rote runde Taste (links unten in der Tastengruppe rechts). A spricht Figuren an, blättert im Dialog weiter und dient später zum Bestätigen.
- **B = Rücktaste**, auf dem iPad blaue runde Taste (rechts oben in der Tastengruppe). B bricht ab bzw. schließt.
- Touch-Tasten großzügig und touchfreundlich, Safe-Area beachten. Gegenstandsplätze oben rechts im HUD in derselben Anordnung (A rot, B blau).

## Spielwelt und Ablauf

- Spielstart im Elternhaus, direkt vor der Mutter, die am Herd kocht.
- **Startdorf** (bisher zwei Bildschirme):
  - *Start:* Elternhaus (rotes Dach), kleiner Teich, verwilderte und gesperrte Schule mit Zaun, verschlossenem Tor (Kette, Schloss, Schild „GESPERRT“). Die Schule ist nicht betretbar und bleibt optisch so, bis sie im Finale wieder aufgebaut wird.
  - *Ost:* Dorfplatz mit Brunnen, Haus der Nachbarin (blaues Dach), Haus des Freundes (grünes Dach), Schreibwarenladen (Hefte, Stifte, Bücher).
  - Die Rastquelle im Startdorf ist der Brunnen auf dem Dorfplatz (Ost-Bildschirm), speichert automatisch.
- **Häuser sind betretbar:** Tür berühren (nach oben gegen die Tür laufen) → Tür schwingt auf, Figur geht hinein, Abblende. Hinaus über die Fußmatte; die Figur tritt aus der Tür, die Tür schließt sich. Alle Innenräume haben denselben Grundriss.
- **Innenräume:** Elternhaus (Küche, Essplatz, Mutter), Nachbarin (Wohnzimmer mit Kamin, sitzt im Schaukelstuhl), Freund (Kinderzimmer mit Parabel-Poster), Laden (Verkäufer hinter der Theke). Der Laden bleibt rein dekorativ, es gibt kein Kaufsystem.
- Zusammenhängende Oberwelt mit Bildschirmwechsel wie im NES-Zelda: Am Rand schiebt sich der Bildschirm seitlich weiter, kein freies Scrollen. Etwa 12 bis 15 Bildschirme insgesamt. Wiesen, Wüsten, Höhlen, kleine Häuser zum Betreten.
- **Gespräche:** Steht man vor einer Figur (oder einem Schild) und schaut sie an, erscheint eine Sprechblase. A startet das Gespräch. Textbox unten mit Namensschild, Text läuft Buchstabe für Buchstabe ein, mehrere Seiten mit blinkendem Pfeil. A = weiter bzw. Text sofort ganz zeigen, B = abbrechen. Während des Gesprächs ist die Figur gesperrt.
- **Freigegebene Dialogtexte** (nur nach Go ändern):
  - *Mama:* „Ach, du bist wach! Seit die Schule zerstört wurde, ist es im Dorf so still …“ / „Man sagt, die Lehrerinnen und Lehrer werden im Schloss gefangen gehalten.“ / „Nur wer alle Dungeons löst, kann das Schloss befreien. Pass auf dich auf!“
  - *Nachbarin:* „Früher hat man die Schulglocke bis hierher gehört.“ / „Ich habe da so ein Gefühl, dass gerade du die Schule wieder aufbauen kannst.“
  - *Freund:* „Keine Schule – klingt erst mal super, oder?“ / „Na ja … ehrlich gesagt vermisse ich sogar Mathe. Schau mal, mein Parabel-Poster!“
  - *Verkäufer:* „Willkommen! Hefte, Stifte, Bücher – alles da.“ / „Ohne Schule kauft leider kaum jemand etwas. Kaufen geht noch nicht.“
  - *Schild am Schultor:* „GESPERRT. Die Schule bleibt geschlossen, bis die Lehrkräfte zurück sind.“
- Auf dem Weg zu jedem Dungeon stehen Erklär-NPCs mit kurzen Dialogen, je ein Gedanke pro Dialog. Dort gibt es Pflicht-Rätsel, leicht und direkt an die Erklärung gekoppelt, als Verständnis-Check.
- Alles Gehörte (Merksätze der Erklär-NPCs) landet automatisch in einem Merkbuch, das jederzeit geöffnet werden kann, auch mitten in einer Aufgabe.
- Die Dungeons sind strikt linear. Der Sieg über den Dungeon-Boss öffnet das nächste Tor (Felsen, Wasser, Sandsturm, Burgtor), gibt ein Wappen als reine Trophäe ohne Funktion und enthüllt einen weiteren Teil der Geschichte.
- Der letzte Dungeon ist ein Schloss. Nach seinem Sieg werden die Lehrkräfte befreit und die Schule wird wieder aufgebaut.
- Nach dem Finale gibt es einen kurzen Abspann mit Wappen-Übersicht und Fehlerstatistik. Danach ist die Welt frei begehbar, alle Dungeons lassen sich mit neu generierten Aufgaben wiederholen. Die Boss-Aufgaben bleiben fest.
- Die Struktur muss so offen sein, dass sich später ein Bonus-Dungeon 6 (Trägergraph der Scheitelpunkte, Parameterverfahren) ohne Umbau anhängen lässt.

## Die fünf Dungeons (alle zum Thema Parabeln)

1. **Normalparabel und Parameter:** y = x², Wirkung von a und Scheitelpunkt.
2. **Scheitelpunktsform:** Scheitelpunkt ablesen, Gleichung aus Scheitelpunkt plus einem Punkt aufstellen, Definitions- und Wertemenge.
3. **Allgemeine Form:** Umformen zwischen beiden Formen, Scheitelpunkt aus y = ax² + bx + c, Gleichung aus mehreren Punkten.
4. **Nullstellen und quadratische Gleichungen:** Lösungsformel, Diskriminante, Anzahl der Lösungen.
5. **Schnittpunkte und Anwendungen (Schloss):** Parabel und Gerade schneiden, Wurfparabeln, Extremwertprobleme als Finale.

## Kampf, Herzen, Schwert

- Kein Echtzeit-Schwertkampf. Berührt der Spieler ein Monster, pausiert das Spiel und zeigt genau eine Aufgabe. Richtig heißt Monster besiegt.
- Bosse stellen mehrere feste, von der Lehrkraft geprüfte Aufgaben nacheinander. Bei Bossen nimmt der Boss pro richtiger Antwort Schaden.
- Das Schwert ist das einzige Item: ein Joker für einen Einsatz. Es überspringt eine Aufgabe und zerbricht danach. Bei Bossen wirkt es nicht. Man trägt höchstens eines. Es gibt es nur als Belohnung aus freiwilligen Rätsel-Truhen.
- Fehlerbehandlung gestuft: erster Fehler kostet ein Herz, zweiter Fehler zeigt einen Hinweis, dritter Fehler zeigt kurz die Lösung. Die Aufgabe kommt später mit neuen Zahlen wieder.
- Herzen bleiben knapp: Besiegte Monster lassen nur manchmal ein Herz fallen (etwa jedes dritte Mal, nur bei richtiger Antwort im ersten Versuch). Rastquellen füllen alle Herzen auf. Die genauen Werte werden beim Testen festgelegt und stehen daher als Konstanten an einer Stelle.
- Bei null Herzen geht es im Dungeon zum Eingang und in der Oberwelt zur letzten Rastquelle. Gelöste Türen und Rätsel bleiben gelöst, nur ein getragenes Schwert geht verloren.
- Rastquellen sind unbegrenzt nutzbar: im Startdorf, vor jedem Dungeon-Eingang und in jedem Dungeon auf halber Strecke. Sie speichern automatisch.

## Aufgaben und Eingabe

- Aufgaben entstehen aus Vorlagen mit Zahlenbereichen und Regeln, die nur schöne Lösungen erzeugen (zum Beispiel keine krummen Diskriminanten). Bosse haben feste Aufgaben.
- Jeder Aufgabentyp liegt in einem eigenen Abschnitt oder einer eigenen Datei. Eine Testseite im Spiel gibt pro Typ zehn Beispielaufgaben mit Lösung aus, damit die Lehrkraft die Zahlen schnell prüfen kann.
- Jede Aufgabe fragt eindeutig nach einer Form (zum Beispiel Scheitelpunktsform), sodass es genau eine richtige Antwort gibt. Es wird nicht auf mathematische Äquivalenz geprüft.
- Eingabe über strukturierte Felder (zum Beispiel a, d und e), keine freien Terme. Die Bildschirmtastatur im Spiel ist ein einfacher Zahlenblock.
- Zahlen: nur ganze Zahlen und Dezimalzahlen mit höchstens einer Nachkommastelle. Komma und Punkt werden gleichermaßen akzeptiert. Keine Brüche.
- Parabel einstellen über Plus- und Minus-Tasten mit festen Schritten (0,5 bei a, 1 bei d und e). Die Parabel zeichnet sich live im Koordinatensystem mit. Keine freien Schieberegler.
- Die Mathematik muss fachlich korrekt und im Stil der bayerischen Realschule formuliert sein. Verwende „Schülerinnen und Schüler“ bzw. „Lehrerinnen und Lehrer“ / „Lehrkräfte“, wo Personen angesprochen werden.

## Speichern

- Automatisches Speichern im Local Storage an Rastquellen und nach Dungeons.
- Zusätzlich ein Spielstand-Code als kompakter Text ohne Prüfsumme zum Kopieren und Einfügen. Er enthält Fortschritt und Fehlerstatistik, damit die Lehrkraft sich den Stand zeigen lassen kann. Kein Server, keine Übertragung von Daten.

## Meilensteine

Gebaut wird immer nur der Meilenstein, den der Nutzer freigibt, mit Test nach jedem Schritt.

1. Grundgerüst mit Spielfigur, Touch-Steuerung und einem Bildschirm. – **erledigt**
2. Startdorf und Oberwelt mit Bildschirmwechsel. – **erledigt:** Startdorf (2 Bildschirme), Bildschirmwechsel, 4 betretbare Häuser mit Tür-Animation, Dialogsystem mit NPC-Texten, Spielstart im Elternhaus, Rastquelle am Brunnen (speichert automatisch), drei weitere Bildschirme mit Weg zum ersten Dungeon (Ruine), Szene am Ost-Ausgang mit Herrn Späth (hält die Spielfigur an, gibt einen Tipp, dreht sich beim Gespräch zur Spielfigur).
3. Kampf- und Aufgabensystem mit Aufgabenvorlagen und Testseite.
4. Erster kompletter Dungeon mit Erklär-NPCs, Merkbuch und Boss.
5. Die weiteren vier Dungeons einzeln.
6. Abspann (inkl. Befreiung der Lehrkräfte und Wiederaufbau der Schule), Wiederholungsmodus, Feinschliff.

## Offene Fragen (vor der Umsetzung mit dem Nutzer klären)

- Schriftgröße der Dialoge: Die Pixelschrift ist auf 256 × 224 ausgelegt; auf dem iPad prüfen, ob sie groß genug ist.

## Getroffene Entscheidungen

- **Laden:** bleibt rein dekorativ mit Dialog, es gibt kein Kaufsystem. Das Schwert ist das einzige Item.
- **Rastquelle im Startdorf:** Brunnen im Dorfplatz (Ost-Bildschirm), speichert automatisch.
- **Wiederaufbau der Schule:** wird im Abspann gezeigt; danach ist die Schule begehbar, mit den befreiten Lehrkräften (passt zum frei begehbaren Endspiel-Zustand).
- **HUD:** Das Schwert bekommt einen eigenen Slot links neben den A/B-Plätzen (A rot, B blau bleiben in der bisherigen Anordnung oben rechts).
