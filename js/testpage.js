// testpage.js: Testseite für die Lehrkraft
// Zeigt pro Aufgabentyp zehn Beispielaufgaben mit Lösung.
// Steuerung: Hoch/Runter = auswählen bzw. blättern, A = öffnen bzw. neue Zahlen, B = zurück.
var TestPage = (function () {
  'use strict';

  var active = false;
  var view = 'list';        // 'list' = Typauswahl, 'examples' = Beispielaufgaben
  var sel = 0;              // gewählter Aufgabentyp (0 bis Anzahl Typen - 1)
  var scroll = 0;           // erste sichtbare Zeile in der Beispielliste
  var lines = [];           // Zeilen der Beispielliste (Frage + Lösung)
  var seed = 1;             // Samen für wiederholbare Beispielaufgaben
  var prevDirs = {};        // vorheriger Zustand der Richtungstasten

  // Eintraege der Liste: Aufgabentypen und ganz unten die Probeaufgabe
  function entries() {
    var e = Tasks.TYPES.map(function (t) { return t.name; });
    e.push('Probeaufgabe spielen');
    return e;
  }

  // Hoch/Runter wie A/B genau einmal pro Tastendruck auswerten
  function pressedDir(input, dir) {
    var now = input.isDown(dir);
    var once = now && !prevDirs[dir];
    prevDirs[dir] = now;
    return once;
  }

  // Zehn Beispielaufgaben des gewählten Typs in Zeilen umwandeln
  function buildExamples() {
    var type = Tasks.TYPES[sel];
    lines = [];
    for (var i = 1; i <= 10; i++) {
      var t = Tasks.make(type.id, seed * 10 + i);
      var frage = i + '. ' + t.frage;
      var frageLines = Font.wrap(frage, 234);
      for (var j = 0; j < frageLines.length; j++) lines.push(frageLines[j]);
      lines.push('> ' + t.loesungstext);
      lines.push('');
    }
    scroll = 0;
  }

  // Tippen (iPad): Eintrag der Liste antippen = auswählen und öffnen,
  // in den Beispielen obere bzw. untere Hälfte = zurück- bzw. weiterblättern.
  // Das Steuerkreuz ist auf der Testseite ausgeblendet.
  var tapOpen = -1;         // angetippter Eintrag, wird in update() geöffnet
  var tapScroll = 0;        // angetippte Blätterrichtung (-1, 0, 1)
  var listening = false;
  function onPointerDown(e) {
    if (!active) return;
    var rect = Render.getCanvas().getBoundingClientRect();
    var ly = (e.clientY - rect.top) / rect.height * Render.HEIGHT;
    if (view === 'list') {
      var i = Math.floor((ly - 30 + 3) / 14);
      if (i >= 0 && i < entries().length) tapOpen = i;
    } else {
      tapScroll = ly < Render.HEIGHT / 2 ? -1 : 1;
    }
    e.preventDefault();
  }

  function open() {
    if (!listening) {
      Render.getCanvas().addEventListener('pointerdown', onPointerDown);
      listening = true;
    }
    tapOpen = -1;
    tapScroll = 0;
    active = true;
    view = 'list';
    prevDirs = {};
  }

  function close() {
    active = false;
  }

  function update(input) {
    if (!active) return;
    if (view === 'list') {
      var n = entries().length;
      if (pressedDir(input, 'up')) sel = (sel + n - 1) % n;
      if (pressedDir(input, 'down')) sel = (sel + 1) % n;
      if (input.pressed('b')) { close(); return; }
      var tapped = tapOpen >= 0;
      if (tapped) { sel = tapOpen; tapOpen = -1; }
      if (input.pressed('a') || tapped) {
        if (sel >= Tasks.TYPES.length) {
          // Probeaufgabe: zufaelliger Typ, neue Zahlen; Herzverlust uebt die Stufen
          var type = Tasks.TYPES[Math.floor(Math.random() * Tasks.TYPES.length)];
          close();
          TaskUi.open(type.id, Math.floor(Math.random() * 99999) + 1);
          return;
        }
        view = 'examples';
        buildExamples();
      }
    } else {
      if (pressedDir(input, 'up') || tapScroll < 0) scroll = Math.max(0, scroll - (tapScroll ? 4 : 1));
      if (pressedDir(input, 'down') || tapScroll > 0) scroll = Math.min(lines.length - 9, scroll + (tapScroll ? 4 : 1));
      tapScroll = 0;
      tapOpen = -1;
      if (input.pressed('b')) { view = 'list'; return; }
      if (input.pressed('a')) { seed++; buildExamples(); }   // neue Zahlen
    }
  }

  function draw(r) {
    if (!active) return;
    var ctx = r.getCtx();
    r.px(0, 0, Render.WIDTH, Render.HEIGHT, '#1c1828');

    // Kopfzeile (in der Liste steht hier der Seitentitel)
    var kopf = view === 'list' ? 'Testseite' : Tasks.TYPES[sel].name;
    Font.draw(ctx, 'Testseite', 8, 7, '#f0c040');
    Font.draw(ctx, kopf, Render.WIDTH - Font.width(kopf) - 8, 7, '#f6f0e2');
    r.px(8, 17, Render.WIDTH - 16, 1, '#efe4c4');

    if (view === 'list') {
      var list = entries();
      for (var i = 0; i < list.length; i++) {
        var y = 30 + i * 14;
        if (i === sel) Font.draw(ctx, '>', 12, y, '#f0c040');
        Font.draw(ctx, list[i], 24, y, i === sel ? '#f0c040' : '#f6f0e2');
      }
      Font.draw(ctx, Input.isTouch() ? 'Antippen: zeigen  B: schließen' : 'A: zeigen  B: schließen', 8, Render.HEIGHT - 22, '#8a8496');
      Font.draw(ctx, 'Für die Lehrkraft', 8, Render.HEIGHT - 12, '#8a8496');
    } else {
      var max = Math.min(lines.length, scroll + 9);
      for (var k = scroll; k < max; k++) {
        var isLoesung = lines[k].charAt(0) === '>';
        Font.draw(ctx, lines[k], 10, 24 + (k - scroll) * 10, isLoesung ? '#7ec97e' : '#f6f0e2');
      }
      if (Input.isTouch()) Font.draw(ctx, 'Oben/unten tippen: blättern', 8, Render.HEIGHT - 22, '#8a8496');
      Font.draw(ctx, 'A: neue Zahlen  B: zurück', 8, Render.HEIGHT - 12, '#8a8496');
    }
  }

  return {
    open: open,
    close: close,
    update: update,
    draw: draw,
    isActive: function () { return active; },
    // Beispielansicht offen? (A = neue Zahlen statt Öffnen)
    isExamples: function () { return active && view === 'examples'; }
  };
})();
