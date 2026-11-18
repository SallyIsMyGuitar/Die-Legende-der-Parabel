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
- **Lehrkräfte mit echtem Namen** (z. B. Herr Späth): Legt der Nutzer eine Lehrkraft mit Namen an, bleiben ihre Texte, ihr Aussehen und ihre Eigenheiten genau so, wie der Nutzer sie festgelegt hat. Nicht umschreiben, nicht „glätten“, nicht anonymisieren – auch nicht bei Überarbeitungen der übrigen Dialoge.
- **Git:** Gearbeitet wird direkt auf `main` (keine Arbeitszweige). Nach jedem freigegebenen Schritt wird auf `main` gepusht; GitHub Pages veröffentlicht von `main` automatisch neu. Springt der Pages-Build nicht an, wird ein Neu-Deploy ausgelöst.
- Halte diese Datei aktuell: Wenn der Nutzer neue Regeln, Texte oder Entscheidungen freigibt, schlage eine passende Ergänzung von `AGENTS.md` vor.

## Ziel und Rahmen

Ein Mathe-Übungsspiel als Top-Down-Abenteuer im Stil eines modernen 2D-Zelda (Optik) mit Bildschirmaufbau wie im klassischen NES-Zelda, für die 9. Klasse der Realschule Bayern (WPF I, LehrplanPLUS M9, Lernbereich 7: Quadratische Funktionen und quadratische Gleichungen). Das Spiel dient zum Üben und Vertiefen, nicht zum Einführen. Die Lehrkraft führt jedes Thema im Unterricht ein, die NPCs im Spiel liefern nur kurze Merksätze. Alle Dungeons drehen sich ausschließlich um das Thema Parabeln.

## Story

- Die Schule im Startdorf ist zerstört und gesperrt. Die Lehrerinnen und Lehrer werden im Schloss gefangen gehalten.
- Wer oder was dahintersteckt, erfährt man nach und nach durch die besiegten Bosse in den Dungeons.
- **Gegenspieler (vorläufig): Graf Gerade.** Er duldet nichts, was sich krümmt, und hasst Parabeln am meisten. Deshalb ließ er die Schule zerstören und die Lehrkräfte ins Schloss bringen. Sein Bann aus starren, geraden Linien verzaubert die Wesen der Oberwelt und die Dungeon-Wächter; eine richtige Antwort erlöst sie. Der Name kann später noch geändert werden.
- Erzählbogen bisher: Mama (Schule zerstört, Lehrkräfte im Schloss) → Wanderin (Bann über dem Land) → Förster (ein Graf mit einem Heer aus Linealen) → Einsiedler (Wächter im Bann des Grafen) → Forscherin → Wächter (stellt sich im Namen von Graf Gerade vor; nach dem Sieg: der Graf hasst Parabeln, hat weitere Wächter und ein Schloss) → Dorfbewohner reagieren nach dem ersten Wappen mit einer Zusatzseite.
- Wer alle Dungeons löst und das Schloss befreit, befreit die Lehrkräfte. Danach wird die Schule wieder aufgebaut (sichtbar im Dorf, Teil des Finales bzw. Abspanns).
- Die Spielfigur ist ein Schüler ohne Namen und wird immer nur mit „du“ angesprochen.

## Plattform und Technik

- **Zielgerät:** Schul-iPads mit Safari, Touch-Steuerung, Querformat (im Hochformat erscheint ein Hinweis zum Drehen). Zusätzlich Tastatursteuerung am PC.
- **Hosting:** GitHub Pages. Die Seite wird als Ordner mit mehreren Dateien ausgeliefert und ist auch als Verknüpfung auf dem Home-Bildschirm nutzbar (Vollbild).
- **Aufbau:** `index.html`, `css/style.css` und getrennte JavaScript-Dateien, eingebunden per Script-Tags. Kein Build-Schritt, kein Bundler. Aktueller Stand:
  - `config.js`: Spielwerte an einer Stelle (Herzen, Herz-Drop-Rate, Kampf-Cooldown, Rückstoß)
  - `save.js`: Spielstand im Local Storage (lesen, schreiben, löschen)
  - `boss.js`: Wächter der Höhle (Herzen, Besiegt-Animation)
  - `merkbuch.js`: Merkbuch (Sammlung und Ansicht)
  - `render.js`: Canvas-Skalierung (ganzzahlig, scharfe Pixel), Zeichenhilfen, Ebenen, Sprites, Farbhilfen
  - `font.js`: eigene Pixelschrift für Dialoge (Groß-/Kleinbuchstaben, ä, ö, ü, ß, Ziffern, Satzzeichen)
  - `people.js`: Sprites der Dorfbewohner und Erklär-NPCs (Wanderin, Förster, Einsiedler, Forscherin, Herr Späth)
  - `buildings.js`: Häuser, Laden, Schule, Zaun, Tor, Brunnen, Tür-Animation
  - `interior.js`: Raum-Rahmen für Innenräume, gemeinsame Möbel, Elternhaus
  - `rooms.js`: weitere Innenräume (Nachbarin, Freund, Laden)
  - `world.js`: Bildschirme der Oberwelt, Kollision, Übergänge, Gesprächsziele (inkl. Rätsel-Truhe und Quelle an der Ruine)
  - `tasks.js`: Aufgabenvorlagen und feste Boss-Aufgaben
  - `taskui.js`: Aufgabenbox (Zahlenblock, Graph-Modus mit live gezeichneter Parabel, Fehlerstufen)
  - `testpage.js`: Testseite für die Lehrkraft
  - `enemies.js`: Gegner auf dem Weg zum Dungeon und im Dungeon
  - `dungeon.js`: Höhle der Parabeln (vier Räume, Höhlen-Optik, Quelle)
  - `raetsel.js`: Fackel-Rätsel vor dem Boss (Zustand, Prüfung, Zeichnen)
  - `input.js`: Tastatur und Touch (Multitouch), einmalige Tastendrücke für A/B
  - `player.js`: Spielfigur, Bewegung, Laufanimation; Wand-Kollisionsbox als Konstanten (`HITBOX_*`, `CORNER_ASSIST`), getrennt von Treffer-/Interaktions-Checks
  - `dialog.js`: Textbox und Sprechblasen-Hinweis
  - `fx.js`: Atmosphäre (Wolkenschatten, Schmetterlinge, Vignette)
  - `hud.js`: Herzen (mit Animation beim Herzverlust) und Gegenstandsplätze
  - `enemies.js`: Gegner, Bewegung, Besiegt-Animation, Herz-Drops
  - `taskui.js`: Aufgabenbox mit Zahlenblock bzw. Graph-Modus, Ausblenden beim Schließen
  - `tasks.js`, `testpage.js`: Aufgabenvorlagen und Testseite
  - `sword.js`: Schwert-Joker und sein HUD-Slot
  - `main.js`: Spielschleife, Abläufe (Tür-Animation, Bildschirmwechsel, Abblenden, Kampf-Ausgang, Truhe)
  - Später kommen Dateien für Kampf, Aufgaben, Dungeons, Merkbuch, Speicherung und Ton dazu.
- Logische Auflösung 256 × 224 Pixel, Kacheln 16 × 16, ein Bildschirm = 16 × 14 Kacheln. Karten werden als Textzeilen (ein Zeichen pro Kachel) definiert.
- **Grafik:** komplett per Code gezeichnete Pixelgrafik (Canvas), Optik eines modernen 2D-Zelda: weiche Farbverläufe, Autotiling (durchgehende Wege, Ufer mit Schaum), Schatten, buschige Baumkronen über der Spielfigur, animiertes Wasser, wippende Blumen, Rauch aus Schornsteinen, Wolkenschatten, Schmetterlinge, leichte Vignette. Statische Teile werden einmal vorberechnet, nur Animationen werden pro Bild gezeichnet. Grafik bleibt sauber vom Spielcode getrennt, damit einzelne Grafiken später durch ein freies Tileset ersetzt werden können.
- **Ton:** kurze Soundeffekte per Code (Web Audio) für richtig, falsch, Schwert und Boss-Sieg. Keine Hintergrundmusik. Ton ist standardmäßig aus, die Kinder schalten ihn selbst ein.
- **Lesbarkeit:** große, klare Schrift. Richtig und falsch nie nur über Farbe, sondern zusätzlich mit Haken und Kreuz.

## Steuerung

- **Bewegen:** Pfeiltasten oder WASD; auf dem iPad halbtransparentes Steuerkreuz links unten.
- **A = Enter oder Leertaste**, auf dem iPad rote runde Taste (links unten in der Tastengruppe rechts). A spricht Figuren an, blättert im Dialog weiter und bestätigt.
- **B = Esc oder Rücktaste**, auf dem iPad blaue runde Taste (rechts oben in der Tastengruppe). B bricht ab bzw. schließt. Die Rücktaste löscht in Aufgaben zusätzlich eine Ziffer.
- **M = Merkbuch, E = Schwert**; auf dem iPad eigene runde Tasten „Buch“ und „Schwert“ über A/B (zusätzlich lassen sich die HUD-Plätze antippen).
- **Tastenbelegung sichtbar:** Am PC tragen Buch- und Schwert-Platz im HUD die Schilder „M“ und „E“, darunter steht rechts die aktuelle Aktion („Enter: Reden“, „Esc: Schließen“ …). Auf dem iPad steht die aktuelle Aktion unter den Tasten A und B.
- **Steuerkreuz (iPad):** Ecken = schräg laufen. Während Aufgabe, Dialog, Merkbuch, Testseite und Titelbild ist es ausgeblendet.
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
  - *Nachbarin, 3. und 4. Seite (freigegeben):* „Übrigens: Ein Schluck aus dem Brunnen auf dem Dorfplatz füllt deine Herzen wieder auf.“ / „Und solltest du einmal alle Herzen verlieren, kommst du an der Quelle wieder zu dir, an der du zuletzt getrunken hast.“
  - *Weitere freigegebene Texte:* Brunnen/Quellen, Rücksprung bei null Herzen, Rätsel-Truhe, Schwert-Zerbrechen und Schwert-Verlust beim Rücksprung (`main.js`, `world.js`, `dungeon.js`).
  - *Überarbeitung Story (freigegeben):* Texte von Wanderin, Förster und Einsiedler (`world.js`), Schild an der Ruine, Forscherin, Alte Inschrift und Steintafel nach dem Sieg (`dungeon.js`), Bann-Texte sowie Vorstellung und Sieg des Wächters (`main.js`), Zusatzseiten nach dem ersten Wappen für Mama, Nachbarin, Freund und Verkäufer (`interior.js`, `rooms.js`). Der Wortlaut steht im Code und wird nur nach Go geändert.
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
- Fehlerbehandlung gestuft über die Versuche am selben Gegner (bzw. an derselben Truhe): Jede falsche Antwort beendet die Aufgabe und kostet ein Herz. Ab dem 2. Versuch steht der Hinweis gleich mit in der Aufgabe. Ist der 3. Versuch (oder die Antwort beim letzten Herz) falsch, wird vor dem Schließen kurz die Lösung gezeigt. Jeder neue Versuch kommt mit neuen Zahlen.
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
- **Schreibweisen folgen den Merkkästen des Lehrbuchs:** Scheitelform „y = a(x − xs)² + ys“, Scheitel „S(xs|ys)“, allgemeine Form „y = ax² + bx + c“, Diskriminante „D = b² − 4ac“, Lösungsmenge „L = {…}“, Dezimalzahlen mit Komma. Bezeichnung „Scheitelform“ (nicht „Scheitelpunktsform“).

## Speichern

- Automatisches Speichern im Local Storage an Rastquellen und nach Dungeons.
- Zusätzlich ein Spielstand-Code als kompakter Text ohne Prüfsumme zum Kopieren und Einfügen. Er enthält Fortschritt und Fehlerstatistik, damit die Lehrkraft sich den Stand zeigen lassen kann. Kein Server, keine Übertragung von Daten.

## Meilensteine

Gebaut wird immer nur der Meilenstein, den der Nutzer freigibt, mit Test nach jedem Schritt.

1. Grundgerüst mit Spielfigur, Touch-Steuerung und einem Bildschirm. – **erledigt**
2. Startdorf und Oberwelt mit Bildschirmwechsel. – **erledigt:** Startdorf (2 Bildschirme), Bildschirmwechsel, 4 betretbare Häuser mit Tür-Animation, Dialogsystem mit NPC-Texten, Spielstart im Elternhaus, Rastquelle am Brunnen (speichert automatisch), drei weitere Bildschirme mit Weg zum ersten Dungeon (Ruine), Szene am Ost-Ausgang mit Herrn Späth (hält die Spielfigur an, gibt einen Tipp, dreht sich beim Gespräch zur Spielfigur).
3. Kampf- und Aufgabensystem mit Aufgabenvorlagen und Testseite. – **erledigt:** 4 Aufgabentypen, Aufgabenbox mit Zahlenblock und Graph-Modus (Parabel Live einstellen; Punkt P erst nach dem ersten Fehler sichtbar), gestufte Fehler (Herz, Hinweis, Lösung), Besiegt-Animation mit Herz-Drops, Schwert als Joker (E bzw. Slot-Antippen, kein Herz-Drop, Sperre bei Boss/Truhe/Probe), Testseite mit 10 Beispielen je Typ und Probeaufgabe.
4. Erster kompletter Dungeon mit Erklär-NPCs, Merkbuch und Boss. – **erledigt** (überarbeitet: Speichern, Lernpfad, Bann, Story, siehe „Getroffene Entscheidungen“): Höhle der Parabeln mit drei Räumen (Eingangshalle, Mittelraum mit Quelle, Vorraum), Höhlen-Optik mit Fackeln, Gegner (Fledermäuse, Kristallgeister), Forscherin als Erklär-NPC, Merkbuch (M bzw. HUD-Symbol, jederzeit öffnen), Wächter-Boss mit 3 festen Aufgaben, Tor-Öffnung nach dem Sieg, Wappenzähler. Rastquellen: Brunnen (Dorf), Quelle vor der Ruine, Quelle im Mittelraum.
5. Die weiteren vier Dungeons einzeln.
6. Abspann (inkl. Befreiung der Lehrkräfte und Wiederaufbau der Schule), Wiederholungsmodus, Feinschliff.

## Offene Fragen (vor der Umsetzung mit dem Nutzer klären)

- Derzeit keine.

## Getroffene Entscheidungen

- **Laden:** bleibt rein dekorativ mit Dialog, es gibt kein Kaufsystem. Das Schwert ist das einzige Item.
- **Rastquelle im Startdorf:** Brunnen im Dorfplatz (Ost-Bildschirm), speichert automatisch.
- **Wiederaufbau der Schule:** wird im Abspann gezeigt; danach ist die Schule begehbar, mit den befreiten Lehrkräften (passt zum frei begehbaren Endspiel-Zustand).
- **HUD:** Das Schwert bekommt einen eigenen Slot links neben den A/B-Plätzen (A rot, B blau bleiben in der bisherigen Anordnung oben rechts).
- **Herzverlust (Variante A):** Jede falsche Antwort in Kampf oder Truhen-Rätsel schließt die Aufgabe und kostet ein Herz. 2. Versuch: Hinweis von Anfang an sichtbar. 3. Versuch falsch oder letztes Herz verloren: kurz die Lösung, dann schließt die Aufgabe. Ein Abbruch mit B (nur Truhe) kostet nichts und zählt nicht als Versuch. Die Probeaufgabe auf der Testseite behält die Stufen innerhalb der Box (2. Fehler Hinweis, 3. Fehler Lösung).
- **Kampf-Animationen** (Werte in `config.js` bzw. als Konstanten oben in den Dateien):
  - *Antwort richtig:* Haken, dann blendet die Aufgabenbox aus (`TASK_CLOSE_TIME`). Danach blitzt der Gegner weiß auf, zittert und zerfällt in eine Rauchwolke mit Funken. Ein Herz-Drop springt in einem Bogen aus der Wolke.
  - *Antwort falsch:* Kreuz (bzw. Lösung), dann blendet die Aufgabenbox aus. Danach blinkt oben im HUD das verlorene Herz, zerplatzt in Pixel und wird leer; die Spielfigur weicht zurück und blinkt (`PLAYER_BLINK`). Solange sie blinkt, startet kein neuer Kampf. Bei null Herzen folgt danach Abblende und Rücksprung zur Quelle.
  - *Schwert-Joker:* Aufgabe blendet aus, Besiegt-Animation, danach der Text „Dein Schwert zerbricht …“.
- **Rätsel-Truhe:** Nach dem gelösten Rätsel blendet die Aufgabe aus, der Deckel klappt auf, das Schwert steigt funkelnd aus der Truhe und wandert in den HUD-Slot. Erst danach öffnet sich der Text mit der Erklärung. Die Truhe bleibt offen. Falsche Antworten kosten ein Herz mit derselben Animation wie im Kampf.
- **Null Herzen:** Die Spielfigur kommt an der zuletzt benutzten Rastquelle wieder zu sich (Start: Brunnen), mit vollen Herzen. Besiegte Gegner bleiben besiegt.
- **Rastquelle:** Der Brunnen füllt die Herzen auf und merkt sich die Stelle für den Rücksprung (Speichern folgt später). Die Nachbarin erklärt das.
- **Rücktaste in Aufgaben:** löscht eine Ziffer (bei der Probeaufgabe auf der Testseite: sind alle Felder leer, bricht sie ab wie B).
- **Gegner-Aufgaben:** Jeder Bildschirm auf dem Weg zum ersten Dungeon hat einen festen Aufgabentyp (Wiese leicht, Wald mittel, Ruine schwer). Der Aufgabentext beginnt mit einem kurzen Kontext, der auf den Tipp des dortigen Erklär-NPCs verweist. Besiegte Gegner bleiben dauerhaft besiegt; bei Nichtlösen kommt die Aufgabe mit neuen Zahlen wieder.
- **Graph-Modus (Variante C):** Nur „Scheitelform aufstellen“ nutzt die Parabel-Eingabe mit live gezeichneter Parabel. Der Punkt P ist versteckt, bis ein Fehler passiert – ohne P muss gerechnet werden. „Streckfaktor a bestimmen“ nutzt Zahleneingabe mit großen Wertebereichen.
- **Schwert:** Taste E oder Antippen des Schwert-Slots im HUD (links neben A und B; davor der Buch-Platz). Ein Einsatz überspringt die Aufgabe ohne Herz-Drop, das Schwert zerbricht. Es wirkt nicht bei Bossen, in der Rätsel-Truhe und in der Probeaufgabe. Bei null Herzen geht es verloren. Die Truhe an der Ruine (freiwilliges Rätsel, abbrechbar mit B) ist die Belohnungsquelle.
- **Merkbuch:** Taste M oder Buch-Symbol im HUD, jederzeit öffnen (pausiert auch Kämpfe), hoch/runter blättern, B schließt. Merksätze der Erklär-NPCs landen beim Ansprechen automatisch darin (Wanderin, Förster, Forscherin).
- **Boss des ersten Dungeons:** Drei feste, freigegebene Aufgaben (siehe Lernpfad Dungeon 1; ersetzen die früheren Aufgaben a = 1, S(0|0) und y = 0,5(x − 3)² − 2). Pro richtiger Antwort verliert der Wächter ein Herz; nach dem Sieg öffnet sich das Tor, ein Story-Dialog enthüllt einen Teil der Geschichte und das erste Wappen wird gezählt (Anzeige im Abspann, später).
- **Speichern:** automatisch im Local Storage (Schlüssel `legende-der-parabel-v1`) an Rastquellen, nach dem Boss und nach jedem Fortschritt (Gegner erlöst, Truhe, neuer Merksatz, Szene). Gespeichert werden: letzte Rastquelle, besiegte Gegner, Truhe, Schwert, Merkbuch, Boss, Wappen, Szene mit Herrn Späth, Fehlerstatistik (richtig/falsch). Geladen wird immer an der letzten Rastquelle mit vollen Herzen.
- **Titelbild:** „A: Spiel starten“ bzw. mit Spielstand „A: Weiterspielen / B: Neues Spiel“ (mit Rückfrage, löscht den Spielstand). Hinweis: Der Spielstand bleibt nur auf diesem Gerät.
- **Balance:** 4 Herzen, Herz-Drop bei jedem 2. Sieg im ersten Versuch (`config.js`).
- **Pflicht-Gegner (Bann):** Ein Bann aus geraden Lichtlinien sperrt den Weg nach vorn (Ostrand von Wiese und Wald, Höhleneingang an der Ruine, Öffnung nach oben in Halle und Mittelraum), bis alle Gegner dieses Bildschirms erlöst sind. Zurück geht es immer. Beim letzten Gegner erscheint „Der Bann löst sich auf“.
- **Lernpfad Dungeon 1** (Merksatz und Aufgabe passen zusammen, von leicht nach schwer; vor dem Boss das Fackel-Rätsel):
  - Wiese – Wanderin: Normalparabel, Punkt auf y = x² → Typ „Punkt auf der Normalparabel“ (y oder x gesucht)
  - Wald – Förster: Streckfaktor und Öffnung → Typ „a aus der Beschreibung“ (z. B. mit dem Faktor 2 gestreckt, nach unten geöffnet)
  - Ruine – Einsiedler: Scheitelform, S(xs|ys), Vorzeichen → „Scheitel ablesen“
  - Höhle, Halle – Forscherin: P einsetzen, a berechnen → „Streckfaktor a bestimmen“
  - Höhle, Mittelraum – Alte Inschrift an der Wand: Scheitelform aufstellen → „Scheitelform aufstellen“ (Graph)
  - Truhe (Plus, freiwillig): „Verschiebung“ (y = ax² wird verschoben, Scheitelform angeben)
  - Boss: drei feste, freigegebene Aufgaben, die alles verbinden (S von y = −0,5(x + 2)² + 3 → S(−2|3); a aus S(1|−4) und P(3|4) → a = 2; Graph mit S(−1|3) und P(1|1) → y = −0,5(x + 1)² + 3); vor der ersten Aufgabe stellt sich der Wächter vor.
- **Rätselraum vor dem Boss:** Zwischen Mittelraum und Boss-Vorraum. Koordinatensystem im Boden (x = −1 … 3, y = −2 … 2), 5 × 5 Fackelständer. Die Steintafel nennt die feste Parabel y = (x − 1)² − 2. Richtig sind (−1|2), (0|−1), (1|−2), (2|−1), (3|2). Eine falsche Fackel löscht alle (kein Herzverlust). Sind alle fünf entzündet, hebt sich das Gitter zum Boss (wird gespeichert).
- **Formeln im Text:** Der Zeilenumbruch trennt nie an Rechenzeichen (=, +, −, <, >), Formeln bleiben in einer Zeile.
- **Schriftgröße:** Auf dem iPad geprüft, passt.
- **Rastquellen bisher:** Brunnen im Dorfplatz, Quelle vor dem Dungeon-Eingang an der Ruine, Quelle im Dungeon-Mittelraum. Alle Quellen sehen aus wie der Dorfbrunnen. Alle speichern automatisch und füllen die Herzen auf.
