// merkbuch.js: Merksaetze der Erklaer-NPCs sammeln und nachblaettern
// Alles Gehoerte landet automatisch hier (je Eintrag genau einmal).
// Das Buch laesst sich jederzeit oeffnen, auch mitten in einer Aufgabe:
// Taste M, Buch-Symbol im HUD (links neben dem Schwert-Platz), B schliesst.
var Merkbuch = (function () {
  'use strict';

  var BOX = { x: 6, y: 24, w: 244, h: 194 };

  var entries = [];   // { id, name, text }, Reihenfolge des Hoerens
  var standLines = null;   // Funktion: Zeilen der Spielstand-Seite (Schritt 4)
  var standAction = null;  // Funktion: A ganz unten startet diese Aktion
  var active = false;
  var scroll = 0;          // erste sichtbare Zeile
  var prevDirs = {};       // vorheriger Zustand der Richtungstasten

  // Neuer Eintrag, falls die Kennung noch nicht bekannt ist
  function add(merk) {
    for (var i = 0; i < entries.length; i++) {
      if (entries[i].id === merk.id) return false;
    }
    entries.push({ id: merk.id, name: merk.name, text: merk.text });
    return true;
  }

  function open() { active = true; scroll = 0; }
  function close() { active = false; }

  function pressedDir(input, dir) {
    var now = input.isDown(dir);
    var once = now && !prevDirs[dir];
    prevDirs[dir] = now;
    return once;
  }

  function update(input) {
    if (!active) return;
    if (input.pressed('b')) { close(); return; }
    if (input.pressed('a')) {
      // ganz unten: A zeigt den Spielstand-Code (statt zu schliessen)
      if (atStand()) { standAction(); return; }
      close(); return;
    }
    var lines = pageLines();
    var view = viewLines();
    if (pressedDir(input, 'up')) scroll = Math.max(0, scroll - 1);
    if (pressedDir(input, 'down')) scroll = Math.min(Math.max(0, lines.length - view), scroll + 1);
  }

  // Eintraege in Zeilen umsetzen: Name gelb, darunter der Merksatz
  function pageLines() {
    var lines = [];
    for (var i = 0; i < entries.length; i++) {
      lines.push({ t: entries[i].name, c: '#f0c040' });
      var wrapped = Font.wrap(entries[i].text, BOX.w - 30);
      for (var j = 0; j < wrapped.length; j++) {
        lines.push({ t: wrapped[j], c: '#f6f0e2' });
      }
      lines.push({ t: ' ', c: '#f6f0e2' });   // Abstand zwischen Eintraegen
    }
    // Spielstand-Seite (Schritt 4): Statistik und Hinweis zum Code
    if (standLines) {
      lines.push({ t: 'Spielstand', c: '#f0c040' });
      var sl = standLines();
      for (var k = 0; k < sl.length; k++) lines.push({ t: sl[k], c: '#f6f0e2' });
    }
    return lines;
  }

  // Steht das Bluettern ganz unten auf der Spielstand-Seite?
  function atStand() {
    if (!active || !standLines || !standAction) return false;
    return scroll + viewLines() >= pageLines().length;
  }

  function viewLines() { return 13; }

  // --- Zeichnen -------------------------------------------------------------

  // Kleines geschlossenes Buch als HUD-Symbol (16x16-Slot)
  var BOOK = [
    '................',
    '................',
    '...rBBBBBBBBr...',
    '..rPppppppPPr...',
    '..rPppppppPPr...',
    '..rPppppppPPr...',
    '..rPppppppPPr...',
    '..rPppppppPPr...',
    '..rPppppppPPr...',
    '..rPppppppPPr...',
    '..rPppppppPPr...',
    '..rPppppppPPr...',
    '...rBBBBBBBBr...',
    '................',
    '................',
    '................'
  ];
  var BOOK_COLORS = { r: '#4a2418', B: '#7a3a2a', P: '#9a5a3a', p: '#e8dcc0' };

  function slotFrame(r, x, y) {
    var s = 16;
    r.px(x + 1, y, s - 2, s, 'rgba(14,18,32,0.55)');
    r.px(x, y + 1, s, s - 2, 'rgba(14,18,32,0.55)');
    r.px(x + 2, y, s - 4, 1, '#efe4c4');
    r.px(x + 2, y + s - 1, s - 4, 1, '#efe4c4');
    r.px(x, y + 2, 1, s - 4, '#efe4c4');
    r.px(x + s - 1, y + 2, 1, s - 4, '#efe4c4');
    r.px(x + 1, y + 1, 1, 1, '#efe4c4');
    r.px(x + s - 2, y + 1, 1, 1, '#efe4c4');
    r.px(x + 1, y + s - 2, 1, 1, '#efe4c4');
    r.px(x + s - 2, y + s - 2, 1, 1, '#efe4c4');
  }

  function rect() { return { x: Render.WIDTH - 84, y: 5, w: 16, h: 16 }; }

  // Buch-Platz im HUD (links neben dem Schwert-Platz)
  function drawHud(r) {
    var b = rect();
    slotFrame(r, b.x, b.y);
    for (var j = 0; j < BOOK.length; j++) {
      for (var i = 0; i < BOOK[j].length; i++) {
        var c = BOOK_COLORS[BOOK[j].charAt(i)];
        if (c) r.px(b.x + i, b.y + j, 1, 1, c);
      }
    }
  }

  function draw(r) {
    if (!active) return;
    var ctx = r.getCtx();

    // Abblenden und Box mit Rahmen (wie die Aufgabenbox)
    r.px(0, 0, Render.WIDTH, Render.HEIGHT, 'rgba(10,8,16,0.55)');
    r.px(BOX.x + 2, BOX.y, BOX.w - 4, BOX.h, '#1c1828');
    r.px(BOX.x, BOX.y + 2, BOX.w, BOX.h - 4, '#1c1828');
    r.px(BOX.x + 1, BOX.y + 1, BOX.w - 2, BOX.h - 2, '#1c1828');
    r.px(BOX.x + 3, BOX.y + 1, BOX.w - 6, 1, '#efe4c4');
    r.px(BOX.x + 3, BOX.y + BOX.h - 2, BOX.w - 6, 1, '#efe4c4');
    r.px(BOX.x + 1, BOX.y + 3, 1, BOX.h - 6, '#efe4c4');
    r.px(BOX.x + BOX.w - 2, BOX.y + 3, 1, BOX.h - 6, '#efe4c4');
    Font.draw(ctx, 'Merkbuch', BOX.x + 10, BOX.y + 7, '#f0c040');

    if (entries.length === 0 && !standLines) {
      Font.draw(ctx, 'Noch keine Merks\u00e4tze geh\u00f6rt.', BOX.x + 10, BOX.y + 24, '#f6f0e2');
      Font.draw(ctx, 'Sprich mit den Erkl\u00e4rerinnen und Erkl\u00e4rern', BOX.x + 10, BOX.y + 36, '#8a8496');
      Font.draw(ctx, 'auf dem Weg zu den Dungeons!', BOX.x + 10, BOX.y + 46, '#8a8496');
    } else {
      var lines = pageLines();
      var last = Math.min(lines.length, scroll + viewLines());
      for (var i = scroll; i < last; i++) {
        Font.draw(ctx, lines[i].t, BOX.x + 10, BOX.y + 20 + (i - scroll) * Font.LINE, lines[i].c);
      }
      // Balken rechts, wenn weiter geblaettert werden kann
      var view = viewLines();
      if (lines.length > view) {
        var trackH = view * Font.LINE;
        var barH = Math.max(6, Math.round(trackH * view / lines.length));
        var barY = BOX.y + 20 + Math.round((trackH - barH) * scroll / Math.max(1, lines.length - view));
        r.px(BOX.x + BOX.w - 8, BOX.y + 20, 2, trackH, '#2e2a3e');
        r.px(BOX.x + BOX.w - 8, barY, 2, barH, '#f0c040');
      }
    }

    // Bedienhinweis passend zum Gerät (iPad: Tippen statt Tasten M und Hoch/Runter)
    var fuss = Input.isTouch()
      ? 'Oben/unten tippen: bl\u00e4ttern  B: schlie\u00dfen'
      : 'M: auf/zu  Hoch/Runter: bl\u00e4ttern  B: schlie\u00dfen';
    Font.draw(ctx, fuss, BOX.x + 10, BOX.y + BOX.h - 12, '#8a8496');
  }

  // Tippen auf das Buch-Symbol oeffnet bzw. schliesst das Merkbuch
  function init() {
    Render.getCanvas().addEventListener('pointerdown', function (e) {
      var rectEl = Render.getCanvas().getBoundingClientRect();
      var lx = (e.clientX - rectEl.left) / rectEl.width * Render.WIDTH;
      var ly = (e.clientY - rectEl.top) / rectEl.height * Render.HEIGHT;
      var b = rect();
      if (lx >= b.x && lx < b.x + b.w && ly >= b.y && ly < b.y + b.h) {
        active ? close() : open();
        e.preventDefault();
        return;
      }
      // Offenes Buch antippen: obere Hälfte blättert zurück, untere weiter
      // (auf dem iPad ist das Steuerkreuz im Merkbuch ausgeblendet)
      if (active && lx >= BOX.x && lx < BOX.x + BOX.w && ly >= BOX.y && ly < BOX.y + BOX.h) {
        var max = Math.max(0, pageLines().length - viewLines());
        if (ly < BOX.y + BOX.h / 2) scroll = Math.max(0, scroll - 3);
        else scroll = Math.min(max, scroll + 3);
        e.preventDefault();
      }
    });
  }

  return {
    init: init,
    add: add,
    open: open,
    close: close,
    update: update,
    draw: draw,
    drawHud: drawHud,
    all: function () { return entries.slice(); },
    // Spielstand laden: gespeicherte Eintraege uebernehmen
    load: function (list) { entries = (list || []).slice(); },
    count: function () { return entries.length; },
    // Spielstand-Seite einrichten (Schritt 4)
    setStand: function (lines, action) { standLines = lines; standAction = action; },
    atStand: atStand,
    isActive: function () { return active; }
  };
})();
