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
- Wer alle Dungeons löst, betritt im Finale die zerstörte Schule und befreit dort die Lehrkräfte: drei Räume lösen, dann den Endboss besiegen. Danach wird die Schule wieder aufgebaut (sichtbar im Dorf, Teil des Finales bzw. Abspanns). Einzelne Lehrkräfte können auch woanders versteckt oder auf der Flucht sein (z. B. Herr Späth am Dorfplatz, Herr Dietl im Versteck an der Ruine).
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
  - `world.js`: Bildschirme der Oberwelt, Kollision, Übergänge, Gesprächsziele (inkl. Rätsel-Truhe und Quelle an der Ruine, Tiefensortierung von Objekten und Figuren)
  - `tasks.js`: Aufgabenvorlagen und feste Boss-Aufgaben
  - `taskui.js`: Aufgabenbox (Zahlenblock, Graph-Modus mit live gezeichneter Parabel, Fehlerstufen)
  - `testpage.js`: Testseite für die Lehrkraft
  - `enemies.js`: Gegner auf dem Weg zum Dungeon und im Dungeon
  - `dungeon.js`: Höhle der Parabeln (vier Räume, Höhlen-Optik, Quelle)
  - `raetsel.js`: Fackel-Rätsel vor dem Boss (Zustand, Prüfung, Zeichnen)
  - `spiegel.js`: Spiegel-Rätsel vor dem Boss des Leuchtturms (Zustand, Prüfung, Zeichnen)
  - `gezeiten.js`: Gezeiten-Rätsel vor dem Boss des Wasserreichs (Zustand, Prüfung, Zeichnen)
  - `turm.js`: Leuchtturm-Dungeon (Dungeon 2, vier Räume, Turm-Optik, Quelle)
  - `wasser.js`: Versunkenes Wasserreich (Dungeon 3, vier Räume, Grotten-Optik, Quelle)
  - `wueste.js`: Steppe, Dünen und Oase (Weg zu Dungeon 4) mit Sandtempel-Fassade
  - `platten.js`: Platten-Rätsel vor dem Boss des Sandtempels (Druckplatten auf der x-Achse)
  - `sandtempel.js`: Sandtempel (Dungeon 4, vier Räume, Sandstein-Optik, Quelle)
  - `schule.js`: Schulhof (Außenwelt-Bildschirm) und zerstörte Schulräume (Dungeon 5: Klassenzimmer, Physiksaal, Turnhalle, Aula)
  - `dietl.js`: Versteck von Herrn Dietl (Bildschirm `dietl` östlich der Ruine), Fragen zur Spielwelt und Texte; Ablauf in `main.js` (`talkDietl`)
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
  - *Start:* Elternhaus (rotes Dach), kleiner Teich, verwilderte und gesperrte Schule mit Zaun, verschlossenem Tor (Kette, Schloss, Schild „GESPERRT“). Die Schule ist nicht betretbar. Im Finale (Dungeon 5) wird das zerstörte Schulgebäude betreten (drei Räume, Endboss); danach wird sie im Abspann wiederaufgebaut und ist begehbar.
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
- **Versteck von Herrn Dietl (an der Ruine):** Auf dem Bildschirm beim ersten Dungeon gibt es rechts eine Lücke in der Baumreihe, durch die man hindurchgehen kann. Dahinter liegt das Versteck des Lehrers Herr Dietl. Beantwortet man ihm Fragen zum Spiel, kann man sich entweder ein Schwert oder ein Herz erspielen. – **gebaut**, Details unter „Überarbeitung nach der Story- und Mathe-Prüfung“.
- Auf dem Weg zu jedem Dungeon stehen Erklär-NPCs mit kurzen Dialogen, je ein Gedanke pro Dialog. Dort gibt es Pflicht-Rätsel, leicht und direkt an die Erklärung gekoppelt, als Verständnis-Check.
- Alles Gehörte (Merksätze der Erklär-NPCs) landet automatisch in einem Merkbuch, das jederzeit geöffnet werden kann, auch mitten in einer Aufgabe.
- Die Dungeons sind strikt linear. Der Sieg über den Dungeon-Boss öffnet das nächste Tor (Felsen, Wasser, Sandsturm, Schultor), gibt ein Wappen als reine Trophäe ohne Funktion und enthüllt einen weiteren Teil der Geschichte.
- Der letzte Dungeon ist kein Ort, sondern die zerstörte Schule selbst: Nach Dungeon 4 öffnet sich das Schultor. Man betritt das zerstörte Schulgebäude, löst dort drei Räume und kämpft dann gegen den Endboss, um die Lehrkräfte zu befreien. Nach seinem Sieg wird die Schule wieder aufgebaut.
- Nach dem Finale gibt es einen kurzen Abspann mit Wappen-Übersicht und Fehlerstatistik. Danach ist die Welt frei begehbar, alle Dungeons lassen sich mit neu generierten Aufgaben wiederholen. Die Boss-Aufgaben bleiben fest.
- Die Struktur muss so offen sein, dass sich später ein Bonus-Dungeon 6 (Trägergraph der Scheitelpunkte, Parameterverfahren) ohne Umbau anhängen lässt.

## Die fünf Dungeons (alle zum Thema Parabeln)

1. **Normalparabel und Parameter:** y = x², Wirkung von a und Scheitelpunkt.
2. **Scheitelpunktsform:** Scheitelpunkt ablesen, Gleichung aus Scheitelpunkt plus einem Punkt aufstellen, Definitions- und Wertemenge.
3. **Allgemeine Form:** Umformen zwischen beiden Formen, Scheitelpunkt aus y = ax² + bx + c, Gleichung aus mehreren Punkten.
4. **Nullstellen und quadratische Gleichungen:** Lösungsformel, Diskriminante, Anzahl der Lösungen.
5. **Schnittpunkte und Anwendungen (Finale in der Schule):** Parabel und Gerade schneiden, Wurfparabeln, Extremwertprobleme. Der letzte Dungeon ist kein Ort, sondern die Schule selbst: betreten, drei Räume lösen, dann der Endboss.

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
5. Die weiteren vier Dungeons einzeln (Dungeon 5 ist das Finale in der Schule: betreten, drei Räume lösen, Endboss besiegen). – **erledigt bis auf Dungeon 6:** Dungeon 2 (Leuchtturm), Dungeon 3 (Wasserreich), Dungeon 4 (Sandtempel/Wüste) und Dungeon 5 (Finale in der zerstörten Schule mit Endboss Graf Gerade) sind gebaut und vollständig begehbar. Der Bonus-Dungeon 6 ist kein Teil von Meilenstein 5.
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
- **Wege ohne Hindernisse:** Auf den Wegen zu den Dungeons gibt es keinen Bann und keine Sperren. Die Gegner dort sind freiwillige Übung für den Dungeon; falsche Antworten kosten weiterhin Herzen. Der Bann mit geraden Lichtlinien gilt nur noch innerhalb der Dungeons (Öffnung nach vorn in Halle und Mittelraum, bis alle Wesen des Raums erlöst sind; zurück geht es immer, beim letzten Wesen erscheint „Der Bann löst sich auf“). Das Felsentor am Dorfplatz-Südausgang bleibt (öffnet nach dem Sieg über Dungeon 1).
- **Weg zum Dungeon 2 (Süd-Route):** Drei Bildschirme mit festem Aufgabentyp je Bildschirm (leicht → schwer): „Scheitelform aus S und a“ (Felder, Strohgolems), „Scheitelform aus S und P“ (Klippenweg, Klippengeister), „Wertemenge am Scheitel“ (Küste, Krabbengeister). Bildschirmwechsel funktioniert jetzt auch nach Norden/Süden (vertikal weitergeschoben wie NES-Zelda). Rätsel-Truhe auf dem Klippenweg (Plus-Rätsel „Scheitel aus allgemeiner Form“, abbrechbar mit B, Belohnung Schwert); Truhen werden je Bildschirm verwaltet und gespeichert (`chests`, ältere Spielstände mit `chest` werden weiter gelesen).
- **Dungeon 2: Leuchtturm.** Der Weg endet an der Küste am Leuchtturm (Motiv: parabolischer Spiegel, seit dem Bann erloschen). Solange der Dungeon nicht gebaut ist, bleibt die Tür verschlossen (Hinweistext); danach wird sie zum Dungeon-Eingang.
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
- **Tiefensortierung (Oberwelt):** Häuser, Laden, Schule, Brunnen/Quellen, Zaun, Tor, Schild, Truhe und Ruinenmauer werden nach ihrer Unterkante (Grundzeile) sortiert, zusammen mit Spielfigur, Gegnern und Herrn Späth: Eine Figur steht vor allem, was weiter oben endet, und hinter allem ab ihrer eigenen Kachelzeile. Baumkronen liegen immer über allen Figuren (Effekt „unter dem Baum“). Umsetzung in `world.js` (`drawSorted`), Aufruf in `main.js` (`drawScene`).
- **Weg zum Dungeon 2 (nach Süden):** Vom Dorfplatz nach Süden. Ein Felsen versperrt den Südausgang, bis der Wächter der Höhle besiegt ist (dann löst er sich auf; Schild davor). Drei Bildschirme: *Felder* (Gärtnerin, Strohgolems, eingezäunte Beete), *Klippenweg* (Fischer, Klippengeister, Rätsel-Truhe mit Schwert), *Küste* (Turmwärter, Krabbengeister, Leuchtturm mit Tür, Rastquelle vor dem Eingang). Auf dem Weg gibt es keine Hindernisse (siehe „Wege ohne Hindernisse“); die Leuchtturm-Tür ist zu und öffnet sich erst, wenn Dungeon 2 gebaut ist (Hinweistext).
- **Rastquellen bisher:** Brunnen im Dorfplatz, Quelle vor dem Dungeon-Eingang an der Ruine, Quelle im Dungeon-Mittelraum, Quelle an der Küste vor dem Leuchtturm. Alle Quellen sehen aus wie der Dorfbrunnen. Alle speichern automatisch und füllen die Herzen auf.
- **Dungeon 2 (Leuchtturm, 5a) – gebaut:** vier Räume in `turm.js` (leingang → lmitte → lraetsel → lboss), Die Tür an der Küste ist seit dem Bau offen; der frühere Verschlossen-Hinweis entfiel. Merksatz-Quellen: Türmerin (Eingang, „Scheitelform: y = a(x − xs)² + ys mit S(xs|ys)") und Alte Turmuhr (Maschinenraum, „Scheitel als Randpunkt"). Gegner: Möwengeister im Eingang (Typ „Scheitelform aus S und P"), Dampfgeister im Maschinenraum (Typ „Wertemenge als Auswahl"); Bann in beiden Räumen. Quelle im Maschinenraum (halbe Strecke), Rastquellen-Set unverändert.
- **Neuer Aufgabentyp „Wertemenge als Auswahl" (`wertemengeAuswahl`, 5a):** Frage nach W der Parabel in Scheitelform, vier Optionen (richtig; Oeffnung verkehrt; Grenze um 1 daneben; W = ℝ), Reihenfolge gemischt. Auswahl-Modus in `taskui.js` (A–D, hoch/runter oder Tippen, A prüft). Zahlen: a ∈ {0,5; 1; 2; −0,5; −1; −2}, xs/ys ganzzahlig. Neue Schriftzeichen `{ } ≥ ≤ ℝ` in `font.js`; Zeilenumbruch trennt nie an ≥ ≤ und |.
- **Spiegel-Rätsel (Turm, 5a):** in `spiegel.js`, Parabel y = −(x − 1)² + 2 (nach unten geöffnet); richtige Spiegel: (−1|−2), (0|1), (1|2), (2|1), (3|−2). Ein richtiger Spiegel je Spalte, falscher dunkelt alle (kein Herzverlust), Gitter zum Boss danach offen; gespeichert als `spiegel`. Das Fackel-Rätsel der Höhle blieb unverändert.
- **Boss-Fabrik (5a):** `boss.js` hält eine Instanz je Boss-Raum (`Boss.register/Boss.of`), Höhlen-Wächter unverändert als 'dboss'. `main.js` verwaltet Texte je Boss in der Tabelle `BOSSES` (name, kontext, intro, victory, onWin). Spielstand: `bosses` je Raum und `bossIntro` als Map; alte Stände mit `boss: true` / booleanem `bossIntro` bleiben ladbar.
- **Wächter des Turms (Boss des Leuchtturms, 5a):** schwebende Laterne, drei feste Aufgaben (S aus y = 1,5(x − 2)² − 3 → S(2|−3); a aus S(2|−1), P(4|5) → a = 1,5; Graph S(−1|4), P(1|0) → y = −(x + 1)² + 4). Intro- und Sieg-Texte freigegeben (Wortlaut in `main.js`; Sieg enthüllt: Wasser im Osten trägt das Siegel des Grafen — Tor zu Dungeon 3). Belohnung: **Wappen der Scheitelform**. Nach dem Sieg leuchtet der Leuchtturm in der Außenansicht (gespeichert als `leuchtturm`).
- **Probeaufgabe (Testseite):** zeigt den Herzverlust nur zur Übung der Fehlerstufen; beim Schließen wird der Herzstand von vorher wiederhergestellt. Sie kostet im Spiel nichts.
- **Gegner:** bleiben im sichtbaren Bildschirm und betreten im Dungeon keine Ausgangsöffnungen.
- **Testseite:** Das Schild bleibt für alle sichtbar auf dem Dorfplatz.

## Getroffene Entscheidungen zu Meilenstein 5 (Dungeon 4 und 5, vorläufig freigegeben)

- **Weg nach Westen (Dungeon 4):** `start` hat einen West-Ausgang über eine Lücke in der Baumreihe (Kacheln 0/5–11). Solange der Sandsturm steht, blockieren die Kacheln `Z` mit Sandschleier, wirbelnden Körnern und goldenem Runen-Siegel plus Schild („Ein Sandsturm versperrt den Weg nach Westen. Er trägt das Siegel des Grafen.“). Der Sieg über `wboss` ruft `World.setSandstormOpen(true)`: alle `Z` werden zu Wegkacheln neu gebacken und der Sturm verschwindet (gespeichert als `sandsturm`).
- **Wüsten-Bildschirme (Steppe, Dünen, Oase) in `wueste.js`:** Sandfläche aus Wegkacheln (wie bisheriger Sandweg), Felsen `V`, Kakteen `K` und trockene Büsche `B` (alle blockierend, gezeichnet in `world.js`). Kein Bann, keine Sperren auf dem Weg. Die Oase hat Teich, Rastquelle vor dem Tempel, Rätsel-Truhe (Typ `nullstellenSF`, Belohnung Schwert, abbrechbar mit B) und den Sandtempel-Eingang (Sandsteinfassade als `bakeExtra`, Tür `E`).
- **Neue Aufgabentypen Dungeon 4 (`tasks.js`):** `diskriminante` (D = b² − 4ac, ein Feld), `anzahlLoesungen` (Auswahl: zwei/genau eine/keine Lösung; die drei Fälle gleich oft), `loesungsformel` (L = {x1; x2} mit x1 < x2 aus a(x − x1)(x − x2) = 0 ausmultipliziert), `nullstellenSF` (Nullstellen aus y = a(x − xs)² + ys mit ys = −a · d², Nullstellen xs ± d). Jeder Typ mit Hinweis ab dem 2. Versuch und Schritt-für-Schritt-Lösung.
- **Erklär-NPCs der Wüste (Merksätze, Texte vorläufig freigegeben):** Karawanenführerin („Die Diskriminante D = b² − 4ac entscheidet über die Anzahl der Lösungen von ax² + bx + c = 0.“), Sterndeuter („D > 0: zwei Lösungen. D = 0: genau eine Lösung. D < 0: keine Lösung.“), Brunnenhüterin („Lösungsformel: x1,2 = (−b ± √D) : (2a).“, Beispiel x² − 2x − 8 = 0). Gegner: Sandkäfer, Staubgeister, Sandschlangen; jeder Aufgabentext nennt im kurzem Kontext das Wesen und die Regel des Bildschirms.
- **Sandtempel (`sandtempel.js`):** vier Räume `seingang → smitte → splatten → sboss`, Sandstein-Optik mit Säulen, Fackeln, Steinschutt und hieroglyphenartigen Parabel-Ornamenten in den Wänden. Merksatz-Quellen: Alte Wandinschrift („Erst D berechnen, dann die Lösungsformel anwenden.“) und Steinerne Waage („Nullstellen sind die x-Werte, an denen die Parabel die x-Achse schneidet (y = 0).“). Gegner: Mumienkäfer (`loesungsformel`) und Wüstengeister (`nullstellenSF`), Bann in beiden Räumen (Öffnung nach vorn, Rückweg immer offen). Quelle in der Mitte (halbe Strecke).
- **Platten-Rätsel (`platten.js`, Raum `splatten`):** Im Boden liegt eine x-Achse mit sieben beschrifteten Druckplatten bei x = −3 … 3. Die Steintafel nennt die feste Parabel y = x² − 2x − 3; richtig sind die Platten der Nullstellen x = −1 und x = 3. Platten werden durch Betreten gedrückt: Eine falsche Platte lässt alle zurücksinken (kein Herzverlust), beide richtigen heben das Gitter zum Boss (gespeichert als `platten`). Der Laufweg umgeht die Plattenzeile, damit nichts versehentlich auslöst.
- **Wächter des Sandtempels (`sboss`, `boss.js`/`main.js`):** schwebende goldene Sanduhr, drei feste Aufgaben (D von x² − 6x + 5 = 0 → 16; Anzahl Lösungen 2x² + 4x + 2 = 0 → genau eine; L von x² + 2x − 8 = 0 → L = {−4; 2}). Intro im Namen von Graf Gerade („Im Sand verweht alles, was gerade ist …“), Siegtext löst den Bann („Der Sand rieselt in sanften Bögen“), enthüllt die zerstörte Schule im Norden und vergibt das Wappen der Nullstellen. `onWin` öffnet das Schultor (`World.setSchoolGateOpen(true)`, gespeichert als `schultor`).
- **Schultor und Nord-Ausgang am `start`:** Das Süd-Tor (`G`) wird nach dem Sieg offen und begehbar gezeichnet (`O`, ohne Kette, Schloss und GESPERRT-Schild); das Schild am Schultor bekommt eine zweite Seite („Das Tor steht offen. Der Weg zur zerstörten Schule im Norden ist frei.“), solange das Tor zu bleibt der freigegebene GESPERRT-Text unverändert. Der Nord-Ausgang liegt am oberen Rand auf Höhe des Weges (Kacheln 5/6) hinter einem Schultor-Gitter (`N`, mit Kette und Schloss), das mit dem Schultor gleichzeitig weicht. Ohne offenes Tor ist `schulhof` nicht erreichbar.
- **Schulhof (`schule.js`):** verwilderter Schulhof mit Grasschutt, Ruine des Schulgebäudes (Ruinmauer-Kacheln `R` mit Tür `E`), Mülltonnen und starren geraden Lichtlinien des Grafen (bis der Endboss besiegt ist). Hausmeister versteckt sich hinter den Mülltonnen („Schnittpunkte von Parabel und Gerade: beide Terme gleichsetzen und die quadratische Gleichung lösen.“), Rastquelle vor dem Eingang, keine Gegner, Schild „Zerstörte Schule. Graf Gerade hält die Lehrkräfte gefangen.“
- **Zerstörte Schulräume (`schule.js`):** Klassenzimmer (umgekippte Tische, Zerbrochene Tafel: „Gleichsetzen, auf eine Seite bringen, Lösungsformel anwenden.“; Lineal-Soldaten, Typ `schnittGerade`), Physiksaal (Alte Wurfmaschine: „Der Scheitel einer Wurfparabel ist der höchste Punkt der Flugbahn.“; Kreide-Geister, Typ `wurfparabel`; Rastquelle), Turnhalle (Anzeigetafel: „Größter oder kleinster Wert einer quadratischen Funktion: am Scheitel ablesen.“; Geodreieck-Wächter, Typ `extremwert`), Aula (Endboss). Bann in den drei Räumen mit Gegnern, Öffnung nach vorn, Rückweg immer offen. Optik: Linoleum mit Rissen, Putzabplatzungen, Schutt.
- **Neue Aufgabentypen Dungeon 5:** `schnittGerade` (Parabel aus (x − x1)(x − x2) + mx + t ausmultipliziert; x1 < x2 aus −4 … 4, m/t aus −3 … 3), `wurfparabel` (y = a(x − d)² + ys, a ∈ {−0,5; −1; −2}, Start im Ursprung, zufällig maximale Höhe ymax = ys oder Wurfweite 2d, Sachkontext Ball/Speer/Wasserstrahl), `extremwert` (Rechteck am Zaun, U ∈ {8; 12; …; 40}, x = U : 4, A = x², Angaben in m/m²).
- **Endboss Graf Gerade (`aula`, `boss.js`):** hagere Gestalt aus kantigen, geraden Linien (Lineal-Mantel, eckige Krone), nur Treppenstufen und Kanten, kein Kreis. `boss.js` ist generisch über `maxHp` pro Boss – der Graf bekommt `maxHp: 4` und damit vier feste Fragen, die anderen Bosse blieben unverändert: (1) Schnittpunkte von y = x² − 1 und y = x + 1 → x1 = −1, x2 = 2, (2) Wurfweite von y = −0,5(x − 3)² + 4,5 → 6 m, (3) 24 m Zaun ringsum um ein rechteckiges Beet → x = 6 m, A = 36 m², (4) gemeinsame Punkte von y = x² und y = 2x − 1 (Auswahl: zwei/genau einer/keiner) → genau einer, B(1|1). Sieganimation: Seine Linien biegen sich zu Parabeln, der Graf zersplittert und verschwindet; die Aula zeigt danach Parabelbögen statt Lichtlinien.
- **Texte des Grafen (vorläufig freigegeben):** Intro („Ich dulde nichts, was sich krümmt – und Parabeln hasse ich am meisten … Vier Fragen – dein Schwert hilft dir nicht.“), Sieg (Bann zerbricht, Lehrerinnen und Lehrer sind frei, „Du erhältst das Wappen der Anwendungen.“). Vollständige Texte in `main.js` (`BOSSES.aula`). Der Rückweg aus der Aula bleibt offen, die Figur steht nach dem Sieg in der Aula.
- **Speichern (Meilenstein 5):** neue Felder `sandsturm`, `platten`, `schultor`, `finale`; Gegner-Zustände der neuen Bildschirme und Räume laufen über das bestehende `defeated`-Schema, Truhen über `chests` (Oase), Bosse `sboss`/`aula` über `bosses`, die Vorstellung über `bossIntro`. Ältere Spielstände laden unverändert weiter (fehlende Felder gelten als „offen/ungelöst“).
- **Rastquellen neu:** Oase (vor dem Sandtempel), Sandtempel-Mitte, Schulhof (vor der Ruine), Physiksaal (halbe Strecke). Alle sehen aus wie der Dorfbrunnen, speichern automatisch und füllen die Herzen auf.
- **Schrift (`font.js`):** neue Zeichen `;`, `·`, `±`, `√`; der Zeilenumbruch trennt zusätzlich nie an `±` und `√` (Formeln wie x1,2 = (−b ± √D) : (2a) bleiben in einer Zeile). L = {x1; x2} mit Semikolon, Dezimalkomma wie bisher.
- **Boss-Zugänge über `swapTiles`:** Sandsturm `Z → P`, Schultor `G → O` und `N → P` tauschen die Kacheln im Bildschirm und backen ihn neu (wie das Felsentor). `world.js` unterstützt jetzt `World.addScreen` (Bildschirme aus eigenen Dateien), `st.def.bakeExtra` (gebackene Extras wie Tempelfassade/Mülltonnen) und `st.def.anim` (Laufbild wie Lichtlinien).

## Fehlerbehebung nach dem Prüfbericht zu Meilenstein 5 (freigegeben)

Nach der Durchsicht des gesamten Spiels wurden am 13 Funden behoben (Details im Prüfbericht):

- **Ladezeit (kritisch):** Die Script-Tags `wueste.js`, `platten.js`, `sandtempel.js`, `schule.js` stehen jetzt hinter `world.js` in `index.html`, weil beide neue Dateien ihre Bildschirme zur Ladezeit per `World.addScreen` anmelden (zuvor ReferenceError, Wüste und Schule wurden nie registriert).
- **Softlock im Plattenraum (kritisch):** Der Übergang smitte → splatten setzt die Figur jetzt auf Kachel (8,11) neben der Steintafel, nicht mehr auf die blockierende Tafel-Kachel (10,11).
- **Vorzeichen in `schnittGerade` (kritisch):** `geradeText` gibt bei m = 0 und t < 0 korrekt „y = −t“ aus (vorher fehlte das Minus, sodass falsche Antworten als richtig gewertet wurden).
- **Fragetexte in der Aufgabenbox (hoch):** Die Fragen von `schnittGerade`, `wurfparabel`, `extremwert` und `wertemenge` sowie die Graf-Gerade-Aufgabe 3 wurden gekürzt; die Kontexte der Kreide-Geister und Geodreieck-Wächter heißen jetzt „(der Scheitel):“ bzw. „(am Scheitel):“. Damit passen alle 19 Typen mit Kontext in die drei Zeilen der Aufgabenbox (per Skript verifiziert, 800 Stichproben).
- **Schulhof-Schild (mittel):** Sprechziel liegt jetzt auf der sichtbaren `i`-Kachel (11,8).
- **Oasen-Truhe (mittel):** `applyState` öffnet die Oasen-Truhe nach dem Neuladen wie ruine/klippen.
- **Unsichtbare Wände (mittel):** Steppe-Ostrand (Felsen `V` oben/unten), Küste Reihe 7 (Wasser) und Lagune Reihe 12 (Baum) schließen jetzt sichtbar ab.
- **Story-Harmonisierung (freigegeben):** Die Gerüchte der Dorfbewohner („Schloss") lösen sich im Sieg des Sandtempel-Wächters auf: Das Schloss ist die zerstörte Schule im Norden, wo Graf Gerade die Lehrerinnen und Lehrer gefangen hält. Der Wasserwächter spricht mit „du" statt „ihr" (AGENTS-Regel zur Ansrede), im Sandtempel-Intro „verweht alles auf geraden Bahnen" (der Graf hasst Kurven), und die Karawanenführerin verortet den Sandsturm im Osten (Kante zum Dorf).

## Überarbeitung nach der Story- und Mathe-Prüfung (freigegeben)

- **Prüfung:** Alle 19 Aufgabentypen per Skript nachgerechnet (je 2000 Stichproben, Formel aus dem Fragetext gelesen), alle Boss-Aufgaben, Bodenrätsel und NPC-Beispiele von Hand: keine Rechenfehler. Platz-Check der Aufgabenbox (Frage ≤ 3 Zeilen bzw. 2 im Graph-Modus, Hinweis ≤ 2 Zeilen, Lösungstext 1 Zeile, Auswahl-Optionen ≤ 178 px): 0 Überläufe.
- **`spfAusS` (Felder):** zeigt jetzt die Gleichung in Scheitelform und fragt nach a, xs und ys (vorher verriet die Aufgabe die Lösung).
- **Wasserreich:** Aufgabentypen der Räume getauscht, damit sie zur Erklärung passen: Eingang (Netzweber) `umformen`, Pumpenkammer (Alte Bildtafel) `scheitelAllgemein`; Hinweis von `scheitelAllgemein` nennt xs = −b : (2a).
- **Muscheltafel (neu, Pumpenkammer, linke Wand):** Merksatz „Parabel durch drei Punkte“ (jeden Punkt in y = ax² + bx + c einsetzen, Punkt auf der y-Achse liefert c) als Vorbereitung auf Aufgabe 3 des Wasserwächters.
- **Boss-Zahlen geändert** (vorher identisch mit Merkbuch-Beispielen): Wasser 1: y = x² + 4x + 1 → S(−2|−3); Turm 2: S(2|−1), P(4|5) → a = 1,5. Wasser 3 lautet jetzt „Stelle die Parabel durch P1(0|3), P2(−1|2) und P3(2|−1) ein.“ (passt in zwei Zeilen des Graph-Modus).
- **Zaun-Aufgaben eindeutig:** „U m Zaun ringsum um ein rechteckiges Beet“ (Typ `extremwert` und Graf Frage 3).
- **Wurfparabel:** bei a = −2 nur d ≤ 3 (höchstens 18 m hoch).
- **Lösungstexte gekürzt** (passen in eine Zeile): `wertemenge`, `wurfparabel`, `extremwert`, Sandtempel 2 und 3, Graf 2 und 4.
- **Texte:** Wanderin („Wer sie erlösen will, muss die Normalparabel kennen“), Turmwärter (Krabbengeister „treiben sich vor der Tür herum“), Höhlen-Wächter (Lehrkräfte an einem Ort, „den man im Dorf das Schloss nennt“), Sandtempel-Sieg („weht dir den Weg frei“), Graf-Intro („Solange es hier noch jemanden gibt, der Kurven lehrt …“), Netzweber (Umformen klar formuliert), Wurfmaschine (Scheitel in der Mitte nur bei gleicher Start- und Landehöhe), Brunnenhüterin L = {−2; 4}. Tippfehler korrigiert (verschließt, Fälle, löse, größte).
- **Merkbuch:** Die Türmerin hat die eigene Kennung `scheitelformTurm` (vorher gleich wie der Einsiedler, ihr Satz kam nie ins Merkbuch).
- **Minuszeichen:** „-“ und „−“ sehen in der Spielschrift gleich aus; keine Änderung nötig.
- **Dorf nach Fortschritt (Texte vorläufig):** `later` darf eine Liste von Stufen sein; es gilt die letzte erfüllte Stufe (neue Bedingung `finale`). Mama, Nachbarin, Freund und Verkäufer haben Zusatzseiten nach Wappen 1 (unverändert), 2, 3 und 4 sowie nach dem Finale (Mama, Freund und Verkäufer ersetzen dann ihre Grundtexte, die Nachbarin ergänzt). Hausmeister und Schild am Schulhof haben eine Finale-Fassung.
- **Herr Dietl (Texte und Fragen vorläufig):** Bildschirm `dietl` (dichter Wald mit Lichtung) östlich der Ruine, erreichbar durch die Baumlücke in Zeile 5. Aussehen: leicht braune Haut, schwarze Haare, oranger Pullover, blaue Jeans, dunkelbraune Schuhe. Nach dem Gespräch stellt er eine Auswahlfrage (A–C) zur Spielwelt (Wissen bis zur Ruine, zehn Fragen, nie zweimal dieselbe hintereinander). Richtig: zufällig ein Herz (nur wenn eines fehlt) oder ein Schwert (nur ohne Schwert); höchstens 4 Belohnungen (gespeichert als `dietl`). Falsch oder Abbruch mit B: kein Herzverlust, keine Fehlerstatistik, neue Frage beim nächsten Gespräch. Sind die Herzen voll und das Schwert vorhanden, stellt er keine Frage.
