// testpage.js: Testseite für die Lehrkraft
// Zeigt pro Aufgabentyp zehn Beispielaufgaben mit Lösung.
// Steuerung: Hoch/Runter = auswählen bzw. blättern, A = öffnen bzw. neue Zahlen, B = zurück.
var TestPage = (function () {
  'use strict';

  var active = false;
  var view = 'list';        // 'list' = Typauswahl, 'examples' = Beispielaufgaben
  var sel = 0;              // gewählter Aufgabentyp
  var scroll = 0;           // erste sichtbare Zeile in der Beispielliste
  var lines = [];           // Zeilen der Beispielliste (Frage + Lösung)
  var seed = 1;             // Samen für wiederholbare Beispielaufgaben
  var prevDirs = {};        // vorheriger Zustand der Richtungstasten

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

  function open() {
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
      if (pressedDir(input, 'up')) sel = (sel + Tasks.TYPES.length - 1) % Tasks.TYPES.length;
      if (pressedDir(input, 'down')) sel = (sel + 1) % Tasks.TYPES.length;
      if (input.pressed('b')) { close(); return; }
      if (input.pressed('a')) {
        view = 'examples';
        buildExamples();
      }
    } else {
      if (pressedDir(input, 'up')) scroll = Math.max(0, scroll - 1);
      if (pressedDir(input, 'down')) scroll = Math.min(lines.length - 9, scroll + 1);
      if (input.pressed('b')) { view = 'list'; return; }
      if (input.pressed('a')) { seed++; buildExamples(); }   // neue Zahlen
    }
  }

  function draw(r) {
    if (!active) return;
    var ctx = r.getCtx();
    r.px(0, 0, Render.WIDTH, Render.HEIGHT, '#1c1828');

    // Kopfzeile
    Font.draw(ctx, 'Testseite', 8, 7, '#f0c040');
    Font.draw(ctx, Tasks.TYPES[sel].name, Render.WIDTH - Font.width(Tasks.TYPES[sel].name) - 8, 7, '#f6f0e2');
    r.px(8, 17, Render.WIDTH - 16, 1, '#efe4c4');

    if (view === 'list') {
      for (var i = 0; i < Tasks.TYPES.length; i++) {
        var y = 30 + i * 14;
        if (i === sel) Font.draw(ctx, '>', 12, y, '#f0c040');
        Font.draw(ctx, Tasks.TYPES[i].name, 24, y, i === sel ? '#f0c040' : '#f6f0e2');
      }
      Font.draw(ctx, 'A: zeigen  B: schließen', 8, Render.HEIGHT - 22, '#8a8496');
      Font.draw(ctx, 'Für die Lehrkraft', 8, Render.HEIGHT - 12, '#8a8496');
    } else {
      var max = Math.min(lines.length, scroll + 9);
      for (var k = scroll; k < max; k++) {
        var isLoesung = lines[k].charAt(0) === '>';
        Font.draw(ctx, lines[k], 10, 24 + (k - scroll) * 10, isLoesung ? '#7ec97e' : '#f6f0e2');
      }
      Font.draw(ctx, 'A: neue Zahlen  B: zurück', 8, Render.HEIGHT - 12, '#8a8496');
    }
  }

  return {
    open: open,
    close: close,
    update: update,
    draw: draw,
    isActive: function () { return active; }
  };
})();
