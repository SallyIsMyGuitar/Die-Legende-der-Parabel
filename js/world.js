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

  // Deterministischer "Zufall" pro Kachelposition, damit die Wiese
  // abwechslungsreich, aber bei jedem Frame identisch aussieht.
  function hash(tx, ty) {
    var h = (tx * 73856093) ^ (ty * 19349663);
    h = (h ^ (h >> 13)) * 3266489917;
    return ((h >>> 0) % 100) / 100;
  }

  // Kacheltypen per Code zeichnen (einfache Pixelgrafik)
  function drawTile(r, tx, ty, id) {
    var x = tx * TILE;
    var y = ty * TILE;
    var i, j;

    if (id === 1) {
      drawPath(r, x, y, tx, ty);
    } else if (id === 2) {
      drawTree(r, x, y, tx, ty);
    } else if (id === 3) {
      drawWater(r, x, y, tx, ty);
    } else if (id === 4) {
      drawHouse(r, x, y, tx, ty);
    } else {
      drawGrass(r, x, y, tx, ty);
    }
  }

  // Wiese: Grünton mit Streifen, Grasbüscheln und selten Blümchen
  function drawGrass(r, x, y, tx, ty) {
    r.px(x, y, TILE, TILE, '#4e9440');
    r.px(x, y + ((tx + ty) % 2) * 8, TILE, 8, '#549c46'); // sanfte Streifen

    var h = hash(tx, ty);
    if (h < 0.6) {
      var gx = x + 2 + Math.floor(hash(tx + 1, ty) * 11);
      var gy = y + 2 + Math.floor(hash(tx, ty + 1) * 11);
      r.px(gx, gy, 1, 3, '#6cb45a');
      r.px(gx + 2, gy + 1, 1, 2, '#6cb45a');
    }
    if (h > 0.85) {
      var fx = x + 3 + Math.floor(hash(ty, tx) * 9);
      var fy = y + 3 + Math.floor(hash(ty + 1, tx) * 9);
      r.px(fx, fy, 2, 2, '#f0e858');   // Blümchen gelb
      r.px(fx - 1, fy + 1, 1, 1, '#f0e858');
      r.px(fx + 2, fy + 1, 1, 1, '#f0e858');
    }
  }

  // Weg: Sandboden mit Kieselsteinen und dunklerem Rand
  function drawPath(r, x, y, tx, ty) {
    r.px(x, y, TILE, TILE, '#d9c58a');
    r.px(x, y + 1 + ((tx * 3 + ty) % 5), TILE, 1, '#cbb478'); // leichte Spuren

    var n = 1 + Math.floor(hash(tx, ty) * 2);
    for (var i = 0; i < n; i++) {
      var sx = x + 2 + Math.floor(hash(tx + i, ty) * 11);
      var sy = y + 2 + Math.floor(hash(tx, ty + i) * 11);
      r.px(sx, sy, 2, 1, '#b8a060');
      r.px(sx + 1, sy + 1, 1, 1, '#b8a060');
    }
  }

  // Baum: Baumrand außen, dichte Krone mit Licht- und Schattenseite, Stamm mit Wurzel
  function drawTree(r, x, y, tx, ty) {
    r.px(x, y, TILE, TILE, '#3e7c34');                    // Waldboden
    r.px(x + 2, y + 1, 12, 11, '#1e5a20');                // Kronenschatten
    r.px(x + 2, y + 1, 9, 8, '#2f7a2a');                  // Krone
    r.px(x + 3, y + 2, 6, 4, '#3f9438');                  // Lichtseite
    r.px(x + 4, y + 3, 3, 2, '#55ac48');                  // Glanzpunkt
    r.px(x + 10, y + 8, 4, 3, '#245c22');                 // Schattenseite unten
    r.px(x + 6, y + 12, 4, 3, '#5c3a1e');                 // Stamm
    r.px(x + 6, y + 12, 1, 3, '#7a4e2a');                 // Stamm-Lichtkante
    r.px(x + 4, y + 14, 2, 2, '#4a2e18');                 // Wurzeln
    r.px(x + 10, y + 14, 2, 2, '#4a2e18');
  }

  // Wasser: Tiefblau mit Uferkante und zwei Wellenlinien
  function drawWater(r, x, y, tx, ty) {
    r.px(x, y, TILE, TILE, '#2858b8');
    r.px(x, y, TILE, 2, '#3c74cc');                       // Oberfläche heller
    var wy = 4 + ((tx + ty) % 2) * 3;
    r.px(x + 2, y + wy, 5, 1, '#6c9ce8');                 // Wellen glänzend
    r.px(x + 9, y + wy + 4, 5, 1, '#6c9ce8');
    r.px(x + 6, y + 12, 4, 1, '#1c4494');                 // dunkle Tiefe
  }

  // Haus: rotes Ziegeldach, helle Wand, Tür und Fenster
  // (Zeile 2 = Dach, Zeile 3 = Wand mit Tür)
  function drawHouse(r, x, y, tx, ty) {
    if (ty === 2) {
      r.px(x, y, TILE, TILE, '#8c3030');                  // Dachfläche
      for (var i = 0; i < TILE; i += 4) {                 // Ziegelmuster
        r.px(x, y + i + 3, TILE, 1, '#6c2020');
        r.px(x + ((i + tx * 2) % 8), y + i, 1, 3, '#a04848');
      }
      r.px(x, y + 13, TILE, 3, '#6c2020');                // Traufe
    } else {
      r.px(x, y, TILE, TILE, '#e0d0a8');                  // Wand
      r.px(x, y, TILE, 1, '#b8a880');                     // schattige Dachkante
      for (var j = 4; j < TILE; j += 5) {                 // Fachwerk-Balken
        r.px(x, y + j, TILE, 1, '#a88860');
      }
      if (tx === 9) {                                     // Tür im mittleren Segment
        r.px(x + 3, y + 3, 9, 13, '#5c3820');
        r.px(x + 4, y + 4, 7, 11, '#7a4e2a');
        r.px(x + 9, y + 9, 1, 2, '#f0d060');              // Klinke
      } else if (tx === 11) {                             // Fenster mit Kreuz
        r.px(x + 2, y + 3, 12, 9, '#5c3820');
        r.px(x + 3, y + 4, 10, 7, '#9cd0e8');
        r.px(x + 7, y + 4, 1, 7, '#5c3820');
        r.px(x + 3, y + 7, 10, 1, '#5c3820');
      }
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
