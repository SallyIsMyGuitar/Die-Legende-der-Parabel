// world.js: Bildschirm-Daten, Kollision und Zeichnen der Welt
// Ein Bildschirm ist ein Array aus 14 Zeilen (y) zu 16 Kacheln (x).
// Kachel-IDs: 0 = Wiese, 1 = Weg, 2 = Baum (blockiert), 3 = Wasser (blockiert), 4 = Haus (blockiert)
//
// Gezeichnet wird in drei Ebenen:
//  - Boden (einmal vorberechnet): Wiese, Weg, Ufer, Schatten, Baumstämme, Grasbüschel
//  - Animation (jedes Bild): Wasser, wippende Blumen
//  - Überlagerung (vorberechnet, liegt über der Spielfigur): Baumkronen, Haus
var World = (function () {
  'use strict';

  var TILE = 16;
  var COLS = 16;
  var ROWS = 14;
  var W = COLS * TILE;
  var H = ROWS * TILE;
  var PATH = 1, TREE = 2, WATER = 3, HOUSE = 4;

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

  var rgb = Render.rgb, lerp = Render.lerp, mix = Render.mix;
  var hash = Render.hash, noise = Render.noise;

  // Vorberechnete Daten
  var groundLayer = null, overlayLayer = null;
  var pathMask, waterMask, bankMask, waterDepth;
  var wavePixels = [];  // tiefere Wasserpixel für Wellenlicht: [x, y]
  var foamPixels = [];  // Uferschaum: [x, y]
  var flowers = [];
  var chimney = null;   // Austrittspunkt für Rauch

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
    return t === -1 || t === TREE || t === WATER || t === HOUSE;
  }

  // --- Masken: welche Pixel gehören zu Weg bzw. Wasser? -----------------
  // Kanten zu fremden Kacheln werden eingerückt und Außenecken abgerundet,
  // so entstehen durchgehende Flächen statt einzelner Quadrate (Autotiling).
  function shapeMask(id, top, side, round, roundTop) {
    var m = new Uint8Array(W * H);
    for (var ty = 0; ty < ROWS; ty++) {
      for (var tx = 0; tx < COLS; tx++) {
        if (tileAt(tx, ty) !== id) continue;
        var n = tileAt(tx, ty - 1) !== id, s = tileAt(tx, ty + 1) !== id;
        var w = tileAt(tx - 1, ty) !== id, e = tileAt(tx + 1, ty) !== id;
        var t0 = n ? top : 0, b0 = s ? side : 0;
        var l0 = w ? side : 0, r0 = e ? side : 0;
        for (var i = t0; i < TILE - b0; i++) {
          var cut = 0;
          if (n && roundTop && i - t0 < round) cut = round - (i - t0);
          var fromBottom = TILE - b0 - 1 - i;
          if (s && fromBottom < round) cut = Math.max(cut, round - fromBottom);
          var l = l0 + (w ? cut : 0), r = TILE - r0 - (e ? cut : 0);
          for (var j = l; j < r; j++) m[(ty * TILE + i) * W + tx * TILE + j] = 1;
        }
      }
    }
    return m;
  }

  // Erdkante oberhalb des Wassers (Zeilen 1–3 der oberen Wasserkacheln)
  function buildBank() {
    var m = new Uint8Array(W * H);
    var cuts = [0, 2, 1, 0];
    for (var ty = 0; ty < ROWS; ty++) {
      for (var tx = 0; tx < COLS; tx++) {
        if (tileAt(tx, ty) !== WATER || tileAt(tx, ty - 1) === WATER) continue;
        var w = tileAt(tx - 1, ty) !== WATER, e = tileAt(tx + 1, ty) !== WATER;
        for (var i = 1; i < 4; i++) {
          var l = (w ? 1 + cuts[i] : 0), r = TILE - (e ? 1 + cuts[i] : 0);
          for (var j = l; j < r; j++) m[(ty * TILE + i) * W + tx * TILE + j] = i;
        }
      }
    }
    return m;
  }

  // Abstand jedes Wasserpixels zum Ufer (für Tiefenfarbe und Schaum)
  function buildDepth() {
    var d = new Uint8Array(W * H);
    var queue = [];
    for (var k = 0; k < W * H; k++) {
      if (!waterMask[k]) continue;
      if (!waterMask[k - 1] || !waterMask[k + 1] || !waterMask[k - W] || !waterMask[k + W]) {
        d[k] = 1;
        queue.push(k);
      }
    }
    for (var q = 0; q < queue.length; q++) {
      var c = queue[q];
      var nb = [c - 1, c + 1, c - W, c + W];
      for (var i = 0; i < 4; i++) {
        var nk = nb[i];
        if (waterMask[nk] && !d[nk]) {
          d[nk] = d[c] + 1;
          queue.push(nk);
        }
      }
    }
    return d;
  }

  function adjacent(mask, k) {
    return mask[k - 1] || mask[k + 1] || mask[k - W] || mask[k + W];
  }

  // --- Farben für den Boden --------------------------------------------
  var C = {
    grassA: rgb('#4a9a3e'), grassB: rgb('#7cc85e'),
    grassDark: rgb('#2c6a2a'), grassLight: rgb('#b0e888'),
    sandA: rgb('#d6b97c'), sandB: rgb('#f0dcaa'), sandShade: rgb('#b08c56'),
    bankLip: rgb('#356e2e'), bankA: rgb('#7c5636'), bankB: rgb('#55391f'),
    foam: rgb('#dcf2fb'), shallow: rgb('#78bdea'), mid: rgb('#3d88d6'),
    deep: rgb('#2154aa'), bankShadow: rgb('#1c3f78')
  };

  function grassColor(x, y) {
    var n = 0.65 * noise(x, y, 26, 1) + 0.35 * noise(x, y, 8, 2);
    var c = lerp(C.grassA, C.grassB, 0.2 + n * 0.6);
    var h = hash(x, y);
    if (h > 0.94) c = lerp(c, C.grassDark, 0.25);
    else if (h < 0.035) c = lerp(c, C.grassLight, 0.25);
    return c;
  }

  function sandColor(x, y, k) {
    var c = lerp(C.sandA, C.sandB, 0.35 + noise(x, y, 6, 7) * 0.55);
    if (!pathMask[k - W]) c = lerp(c, C.sandShade, 0.65);          // Graskante wirft Schatten
    else if (!pathMask[k - 2 * W]) c = lerp(c, C.sandShade, 0.3);
    if (!pathMask[k - 1]) c = lerp(c, C.sandShade, 0.3);
    var h = hash(x * 3, y * 5);
    if (h > 0.985) c = lerp(c, C.sandShade, 0.8);                   // Kiesel
    else if (h < 0.02) c = lerp(c, [255, 250, 225], 0.5);
    return c;
  }

  function waterColor(x, y, k) {
    // Schatten der Erdkante auf dem Wasser
    for (var s = 1; s <= 3; s++) {
      if (bankMask[k - s * W]) return lerp(C.mid, C.bankShadow, 0.75 - 0.18 * (s - 1));
    }
    var d = waterDepth[k];
    if (d <= 1) return C.foam;
    if (d === 2) return lerp(C.foam, C.shallow, 0.65);
    if (d <= 5) return lerp(C.shallow, C.mid, (d - 2) / 3);
    return lerp(C.mid, C.deep, Math.min(1, (d - 5) / 12));
  }

  function bankColor(x, y, row) {
    if (row === 1) return C.bankLip;
    var c = lerp(C.bankA, C.bankB, (row - 2) * 0.9);
    if (hash(x * 7, y * 3) > 0.8) c = lerp(c, C.bankB, 0.5);
    return c;
  }

  // --- Objekte ---------------------------------------------------------
  var CANOPY = [
    { dark: '#143a20', shade: '#22602c', mid: '#338838', light: '#50a646', hi: '#88d066' },
    { dark: '#103628', shade: '#1c5a3e', mid: '#2b7d4c', light: '#459e5f', hi: '#80cc86' },
    { dark: '#183c1c', shade: '#2e6628', mid: '#448a34', light: '#64a846', hi: '#9ad46a' }
  ];

  function canopyInfo(tx, ty) {
    return {
      cx: tx * TILE + 8 + Math.round((hash(tx, ty + 99) - 0.5) * 2),
      cy: ty * TILE + 6,
      big: hash(tx + 1, ty + 5) > 0.5 ? 1 : 0,
      pal: CANOPY[Math.floor(hash(tx + 7, ty + 3) * 3)]
    };
  }

  // Runde, buschige Baumkrone aus mehreren Blätterballen
  function drawCanopy(r, tx, ty) {
    var c = canopyInfo(tx, ty), P = c.pal;
    var bumps = [[0, 1, 10 + c.big, 8 + c.big], [-5, -3, 6, 5], [5, -3, 6, 5], [0, -6, 6, 5]];
    var i, b;
    for (i = 0; i < bumps.length; i++) { b = bumps[i]; r.ellipse(c.cx + b[0], c.cy + b[1], b[2] + 1, b[3] + 1, P.dark); }
    for (i = 0; i < bumps.length; i++) { b = bumps[i]; r.ellipse(c.cx + b[0], c.cy + b[1], b[2], b[3], P.shade); }
    for (i = 0; i < bumps.length; i++) { b = bumps[i]; r.ellipse(c.cx + b[0] - 1, c.cy + b[1] - 1, b[2] - 1, b[3] - 1, P.mid); }
    for (i = 1; i < bumps.length; i++) { b = bumps[i]; r.ellipse(c.cx + b[0] - 1, c.cy + b[1] - 2, b[2] - 3, b[3] - 3, P.light); }
    r.ellipse(c.cx - 3, c.cy - 4, 4, 3, P.light);
    r.ellipse(c.cx - 3, c.cy - 8, 2, 1, P.hi);
    r.ellipse(c.cx + 3, c.cy - 5, 2, 1, P.hi);
    // Blätterstruktur
    for (i = 0; i < 7; i++) {
      var lx = c.cx - 7 + Math.floor(hash(tx * 11 + i, ty) * 14);
      var ly = c.cy - 6 + Math.floor(hash(tx, ty * 13 + i) * 12);
      r.px(lx, ly, 2, 1, P.shade);
      r.px(lx + 1, ly + 1, 1, 1, P.shade);
    }
    r.px(c.cx - 1, c.cy - 2, 1, 1, P.hi);
  }

  // Stamm nur sichtbar, wenn unterhalb kein weiterer Baum steht
  function drawTrunk(r, tx, ty) {
    var x = tx * TILE, y = ty * TILE;
    r.px(x + 5, y + 9, 6, 7, '#2a1a10');
    r.px(x + 6, y + 9, 4, 7, '#6b4428');
    r.px(x + 6, y + 9, 1, 7, '#8c5e36');
    r.px(x + 9, y + 9, 1, 7, '#4a2c18');
    r.px(x + 3, y + 14, 3, 2, '#2a1a10');
    r.px(x + 4, y + 14, 2, 1, '#5a3820');
    r.px(x + 10, y + 14, 3, 2, '#2a1a10');
    r.px(x + 10, y + 14, 2, 1, '#5a3820');
  }

  // Grasbüschel
  function drawTuft(r, x, y) {
    r.px(x, y + 1, 1, 3, '#357a30');
    r.px(x + 2, y, 1, 4, '#357a30');
    r.px(x + 4, y + 2, 1, 2, '#357a30');
    r.px(x + 1, y + 2, 1, 2, '#3f8a38');
    r.px(x + 3, y + 1, 1, 3, '#3f8a38');
    r.px(x + 2, y, 1, 1, '#a4e07c');
    r.px(x, y + 1, 1, 1, '#94d470');
  }

  function drawStone(r, x, y) {
    r.px(x, y + 2, 5, 1, 'rgba(20,50,20,0.45)');
    r.px(x, y, 4, 2, '#8f9692');
    r.px(x + 1, y, 2, 1, '#c6ccc6');
    r.px(x + 3, y + 1, 1, 1, '#646c68');
  }

  // Bereich frei von Weg-, Wasser- und Uferpixeln (inkl. Rand)?
  function areaClear(x, y, w, h) {
    for (var yy = y - 1; yy <= y + h; yy++) {
      for (var xx = x - 1; xx <= x + w; xx++) {
        var k = yy * W + xx;
        if (pathMask[k] || waterMask[k] || bankMask[k]) return false;
      }
    }
    return true;
  }

  function houseBounds() {
    var minX = COLS, minY = ROWS, maxX = -1, maxY = -1;
    for (var ty = 0; ty < ROWS; ty++) {
      for (var tx = 0; tx < COLS; tx++) {
        if (tileAt(tx, ty) !== HOUSE) continue;
        minX = Math.min(minX, tx); maxX = Math.max(maxX, tx);
        minY = Math.min(minY, ty); maxY = Math.max(maxY, ty);
      }
    }
    if (maxX < 0) return null;
    return { x: minX * TILE, y: minY * TILE, w: (maxX - minX + 1) * TILE, h: (maxY - minY + 1) * TILE };
  }

  // Haus: Ziegeldach mit Schornstein, Fachwerkwand, Tür, Fenster mit Blumenkasten
  function drawHouse(r, b) {
    var x0 = b.x, y0 = b.y, w = b.w;
    var wy0 = y0 + 16, wy1 = y0 + b.h;      // Wand oben/unten
    var i;

    // Schornstein (hinter dem Dach)
    r.px(x0 + 43, y0 - 13, 10, 11, '#3a2222');
    r.px(x0 + 44, y0 - 12, 8, 10, '#9a5a4e');
    r.px(x0 + 44, y0 - 12, 2, 10, '#bc786a');
    r.px(x0 + 50, y0 - 12, 2, 10, '#7a4038');
    r.px(x0 + 44, y0 - 9, 8, 1, '#7a4038');
    r.px(x0 + 44, y0 - 5, 8, 1, '#7a4038');
    r.px(x0 + 42, y0 - 15, 12, 3, '#3a2222');
    r.px(x0 + 43, y0 - 14, 10, 1, '#6a4040');
    chimney = { x: x0 + 48, y: y0 - 16 };

    // Dach: leicht trapezförmig, Ziegelreihen mit Schuppenmuster
    var rTop = y0 - 6, rows = 22;
    for (i = 0; i < rows; i++) {
      var inset = Math.round((rows - 1 - i) / (rows - 1) * 4);
      var l = x0 - 3 + inset, rr = x0 + w + 3 - inset;
      var y = rTop + i;
      r.px(l - 1, y, rr - l + 2, 1, '#3a1414');
      r.px(l, y, rr - l, 1, mix('#d8604c', '#9a2e2e', i / (rows - 1)));
      if (i % 4 === 3) r.px(l, y, rr - l, 1, mix('#8a2828', '#6a1c1c', i / rows));
      if (i % 4 === 0 && i > 1) {
        var off = ((i >> 2) % 2) * 3;
        for (var xx = l + off; xx < rr - 3; xx += 6) r.px(xx + 1, y, 3, 1, mix('#f0907a', '#c05a4a', i / rows));
      }
    }
    // First mit Glanz
    r.px(x0 + 1, rTop - 1, w - 2, 2, '#3a1414');
    r.px(x0 + 2, rTop, w - 4, 1, '#f4a088');
    // Traufe
    r.px(x0 - 4, rTop + rows, w + 8, 2, '#3a1414');
    r.px(x0 - 3, rTop + rows, w + 6, 1, '#6a2020');

    // Wand mit Verlauf
    for (i = wy0; i < wy1; i++) {
      r.px(x0 + 2, i, w - 4, 1, mix('#f6ead0', '#d6c194', (i - wy0) / (wy1 - wy0)));
    }
    r.px(x0 + 1, wy0, 1, wy1 - wy0, '#2e2018');
    r.px(x0 + w - 2, wy0, 1, wy1 - wy0, '#2e2018');
    r.px(x0 + 2, wy0, w - 4, 3, 'rgba(80,40,20,0.35)');   // Schatten unter der Traufe

    // Fachwerkbalken
    var beams = [x0 + 2, x0 + 37, x0 + w - 5];
    for (i = 0; i < beams.length; i++) {
      r.px(beams[i], wy0, 3, wy1 - wy0 - 3, '#6e4a2c');
      r.px(beams[i], wy0, 1, wy1 - wy0 - 3, '#946a42');
    }

    // Steinsockel
    r.px(x0 + 2, wy1 - 3, w - 4, 3, '#8c8478');
    r.px(x0 + 2, wy1 - 3, w - 4, 1, '#b0a898');
    for (i = x0 + 4; i < x0 + w - 4; i += 5) r.px(i + ((i >> 2) % 2), wy1 - 2, 1, 2, '#625c52');

    // Tür mit Rundbogen
    var dcx = x0 + 24;
    r.px(dcx - 6, wy0 + 4, 12, wy1 - wy0 - 4, '#2e2018');
    r.px(dcx - 4, wy0 + 3, 8, 1, '#2e2018');
    r.px(dcx - 5, wy0 + 5, 10, wy1 - wy0 - 6, '#8a5a32');
    r.px(dcx - 3, wy0 + 4, 6, 1, '#8a5a32');
    r.px(dcx - 2, wy0 + 5, 1, wy1 - wy0 - 6, '#6a4224');
    r.px(dcx + 1, wy0 + 5, 1, wy1 - wy0 - 6, '#6a4224');
    r.px(dcx - 5, wy0 + 5, 1, wy1 - wy0 - 6, '#a87444');
    r.px(dcx + 3, wy0 + 10, 1, 2, '#f2c84a');
    r.px(dcx - 7, wy1 - 1, 14, 1, '#c4bcac');

    // Laterne neben der Tür
    r.px(dcx + 8, wy0 + 4, 4, 1, '#2e2018');
    r.px(dcx + 8, wy0 + 5, 3, 5, '#2e2018');
    r.px(dcx + 9, wy0 + 6, 1, 3, '#ffe27a');

    // Fenster mit Spiegelung und Blumenkasten
    var wcx = x0 + 53;
    r.px(wcx - 6, wy0 + 3, 12, 9, '#4a3020');
    for (i = 0; i < 7; i++) r.px(wcx - 5, wy0 + 4 + i, 10, 1, mix('#d4f0fa', '#78b4dc', i / 6));
    r.px(wcx - 4, wy0 + 5, 2, 1, '#ffffff');
    r.px(wcx - 4, wy0 + 6, 1, 1, '#ffffff');
    r.px(wcx, wy0 + 4, 1, 7, '#4a3020');
    r.px(wcx - 5, wy0 + 7, 10, 1, '#4a3020');
    r.px(wcx - 7, wy0 + 12, 14, 2, '#6e4a2c');
    r.px(wcx - 7, wy0 + 12, 14, 1, '#946a42');
    var fc = ['#e8506a', '#f6d64a', '#e8506a', '#f4f0f0', '#e8506a', '#f6d64a'];
    for (i = 0; i < fc.length; i++) {
      r.px(wcx - 6 + i * 2, wy0 + 10, 2, 2, '#4a9a3e');
      r.px(wcx - 6 + i * 2 + (i % 2), wy0 + 10, 1, 1, fc[i]);
    }

    // Fass links neben dem Haus
    var bx = x0 + 6, by = wy1 - 10;
    r.px(bx - 1, by, 9, 10, '#2e2018');
    r.px(bx, by + 1, 7, 8, '#8a5a32');
    r.px(bx + 1, by + 1, 1, 8, '#b07a46');
    r.px(bx, by + 3, 7, 1, '#4a4a52');
    r.px(bx, by + 7, 7, 1, '#4a4a52');
    r.px(bx, by, 7, 1, '#5a3a20');
  }

  // Schatten (einfarbig auf eigener Ebene, später halbtransparent eingeblendet)
  function drawShadows(r, b) {
    var col = '#0c2a12';
    for (var ty = 0; ty < ROWS; ty++) {
      for (var tx = 0; tx < COLS; tx++) {
        if (tileAt(tx, ty) !== TREE) continue;
        var c = canopyInfo(tx, ty);
        r.ellipse(c.cx + 2, c.cy + 6, 11 + c.big, 7, col);
      }
    }
    if (b) {
      r.px(b.x + b.w - 2, b.y - 4, 6, b.h + 4, col);
      r.px(b.x + 2, b.y + b.h, b.w + 2, 3, col);
    }
  }

  // --- Vorberechnung ---------------------------------------------------
  function bake() {
    pathMask = shapeMask(PATH, 2, 2, 2, true);
    waterMask = shapeMask(WATER, 4, 1, 3, false);
    bankMask = buildBank();
    waterDepth = buildDepth();
    var house = houseBounds();

    // 1) Bodenpixel direkt ins Bildpuffer schreiben
    groundLayer = Render.createLayer(W, H);
    var img = groundLayer.ctx.createImageData(W, H);
    var data = img.data;
    wavePixels = [];
    foamPixels = [];
    for (var y = 0; y < H; y++) {
      for (var x = 0; x < W; x++) {
        var k = y * W + x;
        var id = currentScreen[y >> 4][x >> 4];
        var c;
        if (pathMask[k]) {
          c = sandColor(x, y, k);
        } else if (waterMask[k]) {
          c = waterColor(x, y, k);
          var shaded = bankMask[k - W] || bankMask[k - 2 * W] || bankMask[k - 3 * W];
          if (waterDepth[k] === 1 && !shaded) foamPixels.push([x, y]);
          else if (waterDepth[k] >= 3) wavePixels.push([x, y]);
        } else if (bankMask[k]) {
          c = bankColor(x, y, bankMask[k]);
        } else {
          c = grassColor(x, y);
          if (id === TREE) c = lerp(c, C.grassDark, 0.25);
          if (adjacent(pathMask, k) || adjacent(waterMask, k) || adjacent(bankMask, k)) {
            c = lerp(c, C.grassDark, 0.55);   // dunkle Kante am Übergang
          }
        }
        var o = k * 4;
        data[o] = c[0]; data[o + 1] = c[1]; data[o + 2] = c[2]; data[o + 3] = 255;
      }
    }
    groundLayer.ctx.putImageData(img, 0, 0);

    // 2) Schatten von Bäumen und Haus
    var shadow = Render.createLayer(W, H);
    Render.setTarget(shadow.ctx);
    drawShadows(Render, house);
    Render.setTarget(groundLayer.ctx);
    Render.image(shadow.canvas, 0, 0, 0.3);

    // 3) Grasbüschel, Steine, Baumstämme; Blumen für die Animation merken
    flowers = [];
    var flowerColors = ['#ffffff', '#f6d64a', '#f08cb4', '#9cc8ff'];
    for (var ty = 0; ty < ROWS; ty++) {
      for (var tx = 0; tx < COLS; tx++) {
        var t = tileAt(tx, ty);
        if (t === TREE && tileAt(tx, ty + 1) !== TREE) drawTrunk(Render, tx, ty);
        if (t !== 0) continue;
        for (var n = 0; n < 2; n++) {
          if (hash(tx * 3 + n, ty * 7) < 0.55) {
            var gx = tx * TILE + 1 + Math.floor(hash(tx + n * 5, ty + 11) * 10);
            var gy = ty * TILE + 1 + Math.floor(hash(tx + 13, ty + n * 3) * 10);
            if (areaClear(gx, gy, 5, 4)) drawTuft(Render, gx, gy);
          }
        }
        if (hash(tx * 17, ty * 5) > 0.93) {
          var sx = tx * TILE + 3 + Math.floor(hash(tx, ty * 2) * 8);
          var sy = ty * TILE + 4 + Math.floor(hash(tx * 2, ty) * 8);
          if (areaClear(sx, sy, 5, 3)) drawStone(Render, sx, sy);
        }
        if (hash(tx * 5, ty * 9) > 0.62) {
          var fx = tx * TILE + 3 + Math.floor(hash(tx * 9, ty) * 10);
          var fy = ty * TILE + 3 + Math.floor(hash(tx, ty * 9) * 9);
          if (areaClear(fx - 1, fy - 1, 4, 5)) {
            flowers.push({
              x: fx, y: fy,
              color: flowerColors[Math.floor(hash(tx + 3, ty + 8) * flowerColors.length)],
              phase: hash(tx, ty) * 6.28
            });
          }
        }
      }
    }

    // 4) Überlagerung: Baumkronen von oben nach unten, dann das Haus
    overlayLayer = Render.createLayer(W, H);
    Render.setTarget(overlayLayer.ctx);
    for (var cy = 0; cy < ROWS; cy++) {
      for (var cx = 0; cx < COLS; cx++) {
        if (tileAt(cx, cy) === TREE) drawCanopy(Render, cx, cy);
      }
    }
    if (house) drawHouse(Render, house);
    Render.setTarget(null);
  }

  // --- Zeichnen pro Bild -------------------------------------------------
  function drawWater(ctx, t) {
    var i, p;
    // Uferschaum flimmert
    ctx.fillStyle = '#ffffff';
    for (i = 0; i < foamPixels.length; i++) {
      p = foamPixels[i];
      if (Math.sin(t * 0.003 + p[0] * 0.9 + p[1] * 1.3) > 0.25) ctx.fillRect(p[0], p[1], 1, 1);
    }
    // wandernde Lichtwellen
    var light = [], dark = [];
    for (i = 0; i < wavePixels.length; i++) {
      p = wavePixels[i];
      var v = Math.sin(p[0] * 0.38 + p[1] * 0.85 - t * 0.0022) + Math.sin(p[0] * 0.12 - p[1] * 0.5 + t * 0.0013);
      if (v > 1.6) light.push(p);
      else if (v < -1.75) dark.push(p);
    }
    ctx.fillStyle = 'rgba(160,214,250,0.75)';
    for (i = 0; i < light.length; i++) ctx.fillRect(light[i][0], light[i][1], 1, 1);
    ctx.fillStyle = 'rgba(20,60,140,0.35)';
    for (i = 0; i < dark.length; i++) ctx.fillRect(dark[i][0], dark[i][1], 1, 1);
    // Glitzern
    for (i = 0; i < 4; i++) {
      var cycle = t / 1100 + i * 0.37;
      var idx = Math.floor(hash(i, Math.floor(cycle)) * wavePixels.length);
      p = wavePixels[idx];
      var phase = cycle - Math.floor(cycle);
      if (!p || phase > 0.5) continue;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(p[0], p[1], 1, 1);
      if (phase > 0.12 && phase < 0.38) {
        ctx.fillRect(p[0] - 1, p[1], 3, 1);
        ctx.fillRect(p[0], p[1] - 1, 1, 3);
      }
    }
  }

  function drawFlowers(r, t) {
    for (var i = 0; i < flowers.length; i++) {
      var f = flowers[i];
      var sway = Math.round(Math.sin(t * 0.0016 + f.phase) * 0.8);
      r.px(f.x + 1, f.y + 2, 1, 2, '#2f7a2c');
      var x = f.x + sway, y = f.y;
      r.px(x + 1, y - 1, 1, 1, f.color);
      r.px(x, y, 3, 1, f.color);
      r.px(x + 1, y + 1, 1, 1, f.color);
      r.px(x + 1, y, 1, 1, f.color === '#f6d64a' ? '#f08040' : '#f6d64a');
    }
  }

  // Boden inkl. Animationen (unter der Spielfigur)
  function drawGround(r, time) {
    if (!groundLayer) bake();
    var t = time || 0;
    r.image(groundLayer.canvas, 0, 0);
    drawWater(r.getCtx(), t);
    drawFlowers(r, t);
  }

  // Baumkronen, Haus und Rauch (über der Spielfigur)
  function drawOverlay(r, time) {
    if (!overlayLayer) bake();
    var t = time || 0;
    r.image(overlayLayer.canvas, 0, 0);
    if (chimney) {
      var ctx = r.getCtx();
      for (var i = 0; i < 4; i++) {
        var p = (t / 1000 * 0.35 + i / 4) % 1;
        ctx.globalAlpha = 0.55 * (1 - p);
        var rad = 2 + Math.round(p * 4);
        r.ellipse(chimney.x + Math.round(Math.sin(p * 5 + i) * 2 + p * 8), chimney.y - Math.round(p * 28), rad, rad, '#f2f2f2');
      }
      ctx.globalAlpha = 1;
    }
  }

  return {
    drawGround: drawGround,
    drawOverlay: drawOverlay,
    tileAt: tileAt,
    isBlocked: isBlocked,
    COLS: COLS,
    ROWS: ROWS,
    TILE: TILE
  };
})();
