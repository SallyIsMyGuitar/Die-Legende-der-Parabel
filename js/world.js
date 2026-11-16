// world.js: Bildschirm-Daten und Zeichnen
// Ein Bildschirm ist ein Array aus 14 Zeilen (y) zu 16 Kacheln (x).
// Kachel-IDs: 0 = Wiese, 1 = Weg, 2 = Baum (blockiert), 3 = Wasser (blockiert), 4 = Haus (blockiert)
var World = (function () {
  'use strict';

  var TILE = 16;
  var COLS = 16;
  var ROWS = 14;

  // Startdorf-Ausschnitt (Meilenstein 1). Weitere Bildschirme werden später
  // als weitere Datenarrays ergänzt.
  var startScreen = [
    [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
    [2, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 2],
    [2, 0, 0, 2, 2, 0, 2, 0, 4, 4, 4, 4, 0, 0, 0, 2],
    [2, 0, 0, 2, 0, 0, 0, 0, 4, 4, 4, 4, 0, 0, 0, 2],
    [2, 0, 0, 2, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 2],
    [2, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 2],
    [2, 0, 0, 0, 0, 1, 0, 3, 3, 3, 0, 0, 1, 0, 0, 2],
    [2, 0, 0, 0, 0, 1, 0, 3, 3, 3, 0, 0, 1, 0, 0, 2],
    [2, 0, 0, 0, 0, 1, 0, 3, 3, 3, 0, 0, 1, 0, 0, 2],
    [2, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 2],
    [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
    [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
    [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
    [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2]
  ];

  var currentScreen = startScreen;

  // Kachel-ID an Kachelposition abfragen
  function tileAt(tx, ty) {
    if (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS) {
      return -1; // außerhalb des Bildschirms: blockiert
    }
    return currentScreen[ty][tx];
  }

  // Ist die Kachel blockiert?
  function isBlocked(tx, ty) {
    var t = tileAt(tx, ty);
    return t === -1 || t === 2 || t === 3 || t === 4;
  }

  // Kacheltypen per Code zeichnen (einfache Pixelgrafik)
  function drawTile(r, tx, ty, id) {
    var x = tx * TILE;
    var y = ty * TILE;
    var i;

    if (id === 1) {
      // Weg: heller Sandboden mit Punkten
      r.px(x, y, TILE, TILE, '#d8c088');
      r.px(x + 3, y + 5, 2, 2, '#c4a868');
      r.px(x + 10, y + 11, 2, 2, '#c4a868');
    } else if (id === 2) {
      // Baum: Krone und Stamm
      r.px(x, y, TILE, TILE, '#4a8c3c');
      r.px(x + 2, y + 2, 12, 8, '#2c6828');
      r.px(x + 4, y + 4, 8, 4, '#3d7c32');
      r.px(x + 6, y + 10, 4, 5, '#6b4226');
    } else if (id === 3) {
      // Wasser: blaue Fläche mit Wellenlinien
      r.px(x, y, TILE, TILE, '#3060c0');
      r.px(x + 2, y + 4, 6, 1, '#5a8ce0');
      r.px(x + 9, y + 10, 5, 1, '#5a8ce0');
    } else if (id === 4) {
      // Haus: Wand und Dach (2 Kacheln breit, hier nur Mauerwerk)
      r.px(x, y, TILE, TILE, '#b08050');
      r.px(x, y, TILE, 5, '#8c3030');
      r.px(x + 2, y + 8, 3, 4, '#5c3820');
      r.px(x + 11, y + 8, 3, 4, '#5c3820');
    } else {
      // Wiese: Gras mit hellen Grashalm-Punkten
      r.px(x, y, TILE, TILE, '#4a8c3c');
      r.px(x + 4, y + 3, 1, 3, '#5ea04a');
      r.px(x + 11, y + 9, 1, 3, '#5ea04a');
    }
  }

  function draw(r) {
    for (var ty = 0; ty < ROWS; ty++) {
      for (var tx = 0; tx < COLS; tx++) {
        drawTile(r, tx, ty, currentScreen[ty][tx]);
      }
    }
  }

  return {
    draw: draw,
    tileAt: tileAt,
    isBlocked: isBlocked,
    COLS: COLS,
    ROWS: ROWS,
    TILE: TILE
  };
})();
