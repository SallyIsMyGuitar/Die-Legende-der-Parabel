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

  // Deterministischer "Zufall" pro Kachelposition: abwechslungsreich,
  // aber bei jedem Frame identisch.
  function hash(tx, ty) {
    var h = (tx * 73856093) ^ (ty * 19349663);
    h = (h ^ (h >> 13)) * 3266489917;
    return ((h >>> 0) % 1000) / 1000;
  }

  // Sanfter Übergang zwischen zwei Farben (Farbrampe für Verläufe)
  function mix(c1, c2, t) {
    t = Math.max(0, Math.min(1, t));
    var r1 = parseInt(c1.slice(1, 3), 16), g1 = parseInt(c1.slice(3, 5), 16), b1 = parseInt(c1.slice(5, 7), 16);
    var r2 = parseInt(c2.slice(1, 3), 16), g2 = parseInt(c2.slice(3, 5), 16), b2 = parseInt(c2.slice(5, 7), 16);
    var r = Math.round(r1 + (r2 - r1) * t);
    var g = Math.round(g1 + (g2 - g1) * t);
    var b = Math.round(b1 + (b2 - b1) * t);
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }

  // Wiese als Grundlage: grüner Verlauf mit Streifen, Büscheln, Blümchen
  function drawGrass(r, x, y, tx, ty) {
    var top = '#5aa84e', bottom = '#3f8836';
    for (var i = 0; i < TILE; i++) {
      r.px(x, y + i, TILE, 1, mix(top, bottom, i / (TILE - 1)));
    }
    // sanfte Streifen quer über die Kachel
    r.px(x, y + ((tx + ty) % 2) * 8, TILE, 8, mix(top, bottom, 0.18));
    // Grasbüschel
    var h = hash(tx, ty);
    if (h < 0.65) {
      var gx = x + 2 + Math.floor(hash(tx + 1, ty) * 11);
      var gy = y + 3 + Math.floor(hash(tx, ty + 1) * 10);
      r.px(gx, gy, 1, 3, '#74c464');
      r.px(gx + 2, gy + 1, 1, 2, '#74c464');
      r.px(gx + 1, gy + 2, 1, 1, '#6cb45a');
    }
    // Blümchen, sehr selten
    if (h > 0.9) {
      var fx = x + 3 + Math.floor(hash(ty, tx) * 9);
      var fy = y + 3 + Math.floor(hash(ty + 1, tx) * 9);
      r.px(fx, fy, 2, 2, '#f4ec6a');
      r.px(fx - 1, fy + 1, 1, 1, '#f4ec6a');
      r.px(fx + 2, fy + 1, 1, 1, '#f4ec6a');
      r.px(fx, fy + 2, 2, 1, '#e05c74');
    }
  }

  // Weg: Sand-Verlauf mit weichen Rändern zur Wiese hin
  function drawPath(r, x, y, tx, ty) {
    drawGrass(r, x, y, tx, ty); // Wiese als Untergrund für die weichen Ränder

    var top = '#e8d8a8', bottom = '#cdb476';
    for (var i = 2; i < TILE - 2; i++) {
      r.px(x + 2, y + i, TILE - 4, 1, mix(top, bottom, i / (TILE - 1)));
    }
    // weiche Kanten: einzelne Randpixel lassen den Weg organisch wirken
    var edge = '#d9c48c';
    r.px(x + 1, y + 4, 1, 9, edge);
    r.px(x + TILE - 2, y + 3, 1, 10, edge);
    r.px(x + 3, y + 1, 9, 1, edge);
    r.px(x + 4, y + TILE - 2, 8, 1, edge);
    // Kieselsteine
    var n = 1 + Math.floor(hash(tx, ty) * 2);
    for (var k = 0; k < n; k++) {
      var sx = x + 4 + Math.floor(hash(tx + k, ty) * 9);
      var sy = y + 3 + Math.floor(hash(tx, ty + k) * 10);
      r.px(sx, sy, 2, 1, '#b8a068');
      r.px(sx + 1, sy + 1, 1, 1, '#b8a068');
    }
  }

  // Baum: Wiese, weicher Schatten, Stamm, runde Krone mit Verlauf und Glanz
  function drawTree(r, x, y, tx, ty) {
    drawGrass(r, x, y, tx, ty);

    // weicher Schatten am Boden
    r.px(x + 3, y + 12, 10, 3, 'rgba(20,40,16,0.35)');
    r.px(x + 5, y + 15, 6, 1, 'rgba(20,40,16,0.35)');

    // Stamm mit Verlauf
    r.px(x + 6, y + 10, 4, 6, '#6a4426');
    r.px(x + 6, y + 10, 1, 6, '#8a5c34');
    r.px(x + 9, y + 10, 1, 6, '#4c2e18');
    r.px(x + 4, y + 14, 2, 2, '#5c3a20'); // Wurzeln
    r.px(x + 10, y + 14, 2, 2, '#5c3a20');

    // runde Krone: drei Ellipsen-Töne, von dunkel nach hell
    r.px(x + 2, y + 3, 12, 9, '#1e5a24');   // Schattenkante
    r.px(x + 2, y + 2, 12, 2, '#1e5a24');   // runde Oberkante
    r.px(x + 3, y + 1, 10, 2, '#2a6e2c');
    r.px(x + 3, y + 3, 10, 7, '#348a34');   // Mittelton
    r.px(x + 4, y + 3, 8, 4, '#48a644');    // Licht
    r.px(x + 5, y + 2, 5, 2, '#5cba54');    // Glanz oben
    r.px(x + 9, y + 8, 4, 3, '#2a6e2c');    // Schatten unten rechts
    r.px(x + 3, y + 9, 3, 2, '#2a6e2c');    // Schatten unten links
  }

  // Wasser: Tiefen-Verlauf, helle Oberfläche, animierter Glanz
  function drawWater(r, x, y, tx, ty, time) {
    var top = '#4a84d8', bottom = '#1c4898';
    for (var i = 0; i < TILE; i++) {
      r.px(x, y + i, TILE, 1, mix(top, bottom, i / (TILE - 1)));
    }
    // Uferkante oben leicht aufgehellt
    r.px(x, y, TILE, 2, mix(top, '#ffffff', 0.2));
    // animierte Glanzwellen: wandern langsam nach rechts
    var t = time || 0;
    var off = Math.floor((t / 400 + hash(tx, ty) * 16)) % 16;
    var wy = 4 + ((tx + ty) % 2) * 4;
    r.px(x + ((2 + off) % 16), y + wy, 4, 1, '#9cc8f0');
    r.px(x + ((9 + off) % 16), y + wy + 5, 3, 1, '#9cc8f0');
    r.px(x + ((13 + off) % 16), y + 11, 2, 1, '#6c9ce8');
  }

  // Haus: Dach mit Verlauf und weicher Kante, Wand, Tür, Fenster
  // (Zeile 2 = Dach, Zeile 3 = Wand mit Tür und Fenster)
  function drawHouse(r, x, y, tx, ty) {
    if (ty === 2) {
      var cTop = '#c05858', cBot = '#8c3434';
      for (var i = 0; i < TILE; i++) {
        r.px(x, y + i, TILE, 1, mix(cTop, cBot, i / (TILE - 1)));
      }
      // Ziegelreihen
      for (var j = 1; j < TILE; j += 4) {
        r.px(x, y + j, TILE, 1, 'rgba(60,20,20,0.35)');
        r.px(x + ((j * 3 + tx * 2) % 8), y + j - 1, 1, 2, '#d4746c');
      }
      r.px(x, y, TILE, 1, '#e09088');              // First-Kante
      r.px(x, y + 14, TILE, 2, '#6c2020');         // Traufe
    } else {
      // Wand mit sanftem Verlauf
      var wTop = '#f0e4c4', wBot = '#d4c49c';
      for (var k = 0; k < TILE; k++) {
        r.px(x, y + k, TILE, 1, mix(wTop, wBot, k / (TILE - 1)));
      }
      r.px(x, y, TILE, 1, '#a08058');              // Schatten der Traufe
      if (tx === 9) {
        // Tür mit rundem Bogen
        r.px(x + 3, y + 2, 10, 13, '#4c2e18');
        r.px(x + 4, y + 3, 8, 11, '#7a4e2a');
        r.px(x + 5, y + 2, 6, 1, '#7a4e2a');
        r.px(x + 5, y + 4, 1, 9, '#946035');       // Lichtkante
        r.px(x + 10, y + 9, 1, 2, '#f0d060');      // Klinke
      } else if (tx === 11) {
        // Fenster mit hellem Glas und Rahmen
        r.px(x + 2, y + 3, 12, 9, '#4c2e18');
        r.px(x + 3, y + 4, 10, 7, '#a8d8f0');
        r.px(x + 3, y + 4, 4, 3, '#d0ecfc');       // Himmel-Reflex
        r.px(x + 7, y + 4, 1, 7, '#4c2e18');
        r.px(x + 3, y + 7, 10, 1, '#4c2e18');
        r.px(x + 2, y + 12, 12, 1, '#b09870');     // Fensterbank
      } else {
        // schmale Balken als Fachwerk
        if (tx === 8 || tx === 12) r.px(x + (tx === 8 ? 13 : 2), y + 1, 3, 14, '#b09870');
      }
    }
  }

  // Kacheltypen per Code zeichnen
  function drawTile(r, tx, ty, id, time) {
    var x = tx * TILE;
    var y = ty * TILE;

    if (id === 1) drawPath(r, x, y, tx, ty);
    else if (id === 2) drawTree(r, x, y, tx, ty);
    else if (id === 3) drawWater(r, x, y, tx, ty, time);
    else if (id === 4) drawHouse(r, x, y, tx, ty);
    else drawGrass(r, x, y, tx, ty);
  }

  function draw(r, time) {
    for (var ty = 0; ty < ROWS; ty++) {
      for (var tx = 0; tx < COLS; tx++) {
        drawTile(r, tx, ty, currentScreen[ty][tx], time);
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
