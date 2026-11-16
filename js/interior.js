// interior.js: Das Innere des Hauses – Wohnraum mit Küche und Essplatz
// Raster wie draußen: 16 Spalten x 14 Zeilen zu 16 Pixeln.
// Zeichen: '#' = außerhalb (schwarz), 'W' = Wand, '.' = Boden,
//          'x' = Möbel/Person (blockiert), 'M' = Fußmatte (Ausgang)
var Interior = (function () {
  'use strict';

  var TILE = 16;
  var COLS = 16;
  var ROWS = 14;
  var W = COLS * TILE;
  var H = ROWS * TILE;

  var MAP = [
    '################',
    '##WWWWWWWWWWWW##',
    '##WWWWWWWWWWWW##',
    '##xxxxx.....xx##',   // Kühlschrank, Küchenzeile, Regal
    '##..x.........##',   // Mutter vor dem Herd
    '##.......x....##',   // Stuhl oben
    '##......xxx...##',   // Esstisch
    '##......xxx...##',
    '##......x.x...##',   // Stühle unten
    '##............##',
    '##............##',
    '##x..........x##',   // Pflanzen
    '#######MM#######',   // Ausgang
    '################'
  ];

  // Startpunkt beim Betreten: direkt über der Fußmatte
  var SPAWN = { x: 7 * TILE + 8, y: 11 * TILE };

  var hash = Render.hash, mix = Render.mix;
  var layer = null;
  var motherSprites = null;
  var MOTHER = { x: 4 * TILE, y: 4 * TILE };
  var POT = { x: 72, y: 34 };

  function cell(tx, ty) {
    if (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS) return '#';
    return MAP[ty].charAt(tx);
  }

  function isBlocked(tx, ty) {
    var c = cell(tx, ty);
    return c !== '.' && c !== 'M';
  }

  function isExit(tx, ty) {
    return cell(tx, ty) === 'M';
  }

  // --- Raum ------------------------------------------------------------
  function drawFloor(r) {
    var x0 = 2 * TILE, x1 = 14 * TILE, y0 = 3 * TILE, y1 = 12 * TILE;
    for (var row = 0; row < (y1 - y0) / 4; row++) {
      var y = y0 + row * 4;
      r.px(x0, y, x1 - x0, 4, hash(row, 3) > 0.5 ? '#c99a60' : '#c08f58');
      r.px(x0, y, x1 - x0, 1, '#d8ac72');
      r.px(x0, y + 3, x1 - x0, 1, '#8e6038');
      // Stoßfugen versetzt
      var x = x0 + Math.floor(hash(row, 7) * 24);
      while (x < x1) {
        r.px(x, y, 1, 3, '#8e6038');
        x += 26 + Math.floor(hash(row, x) * 22);
      }
      // Maserung
      for (var k = 0; k < 6; k++) {
        var gx = x0 + Math.floor(hash(row * 13 + k, 5) * (x1 - x0 - 6));
        r.px(gx, y + 1 + (k % 2), 3 + (k % 3), 1, '#b2834c');
      }
    }
    // Schatten unter der Wand, Lichtfleck vom Fenster
    r.px(x0, y0, x1 - x0, 3, 'rgba(60,30,10,0.3)');
    var ctx = r.getCtx();
    ctx.fillStyle = 'rgba(255,244,210,0.16)';
    for (var i = 0; i < 26; i++) {
      var spread = Math.floor(i / 3);
      ctx.fillRect(146 - spread, y0 + i, 28 + spread * 2, 1);
    }
  }

  function drawWalls(r) {
    var x0 = 2 * TILE, x1 = 14 * TILE, y0 = TILE, y1 = 3 * TILE;
    r.px(x0, y0, x1 - x0, y1 - y0, '#efe2c4');
    for (var x = x0; x < x1; x += 6) r.px(x, y0, 2, 22, '#e5d4ae');   // Tapetenstreifen
    r.px(x0, y0, x1 - x0, 2, '#5a3a2a');                                // Deckenleiste
    r.px(x0, y0 + 2, x1 - x0, 1, '#8a6a4e');
    r.px(x0, y0 + 22, x1 - x0, 10, '#a87446');                          // Holzvertäfelung
    r.px(x0, y0 + 22, x1 - x0, 1, '#c8955e');
    for (x = x0 + 6; x < x1; x += 12) r.px(x, y0 + 24, 1, 6, '#7e5230');
    r.px(x0, y1 - 2, x1 - x0, 2, '#5a3a22');                            // Sockelleiste

    // Seitenwände und untere Wand als dunkle Holzkante
    r.px(x0 - 4, y0 - 4, x1 - x0 + 8, 4, '#3a2418');
    r.px(x0 - 4, y0 - 4, x1 - x0 + 8, 1, '#6a4a32');
    r.px(x0 - 4, y0, 4, 12 * TILE - y0 + 6, '#3a2418');
    r.px(x1, y0, 4, 12 * TILE - y0 + 6, '#3a2418');
    r.px(x0 - 1, y0, 1, 12 * TILE - y0, '#6a4a32');
    r.px(x1, y0, 1, 12 * TILE - y0, '#6a4a32');
    var by = 12 * TILE;
    r.px(x0 - 4, by, 7 * TILE - x0 + 4, 6, '#3a2418');
    r.px(9 * TILE, by, x1 - 9 * TILE + 4, 6, '#3a2418');
    r.px(x0, by, 7 * TILE - x0, 1, '#6a4a32');
    r.px(9 * TILE, by, x1 - 9 * TILE, 1, '#6a4a32');
  }

  function drawWindow(r) {
    var x = 9 * TILE + 2, y = 20;
    r.px(x, y, 28, 16, '#6e4a2c');
    for (var i = 0; i < 12; i++) r.px(x + 2, y + 2 + i, 24, 1, mix('#8ccdf2', '#dcf2fc', i / 11));
    r.px(x + 4, y + 9, 8, 3, '#7cc06a');                 // Baumwipfel draußen
    r.px(x + 16, y + 10, 10, 2, '#6ab05a');
    r.px(x + 13, y + 2, 2, 12, '#6e4a2c');
    r.px(x + 2, y + 7, 24, 1, '#6e4a2c');
    r.px(x + 4, y + 3, 3, 1, '#ffffff');
    r.px(x - 1, y + 16, 30, 2, '#8a6040');                // Fensterbank
    // Vorhänge
    r.px(x - 4, y - 1, 5, 18, '#d85a5a');
    r.px(x + 27, y - 1, 5, 18, '#d85a5a');
    r.px(x - 2, y - 1, 1, 18, '#a83c44');
    r.px(x + 29, y - 1, 1, 18, '#a83c44');
    r.px(x - 5, y - 2, 38, 1, '#5a3a2a');                 // Vorhangstange
  }

  function drawWallDecor(r) {
    // Bild mit Landschaft
    var px = 12 * TILE + 2, py = 21;
    r.px(px, py, 13, 10, '#8a6040');
    r.px(px + 1, py + 1, 11, 4, '#a8d8f0');
    r.px(px + 1, py + 5, 11, 4, '#5aa84e');
    r.px(px + 3, py + 4, 5, 2, '#4a9a40');
    r.px(px + 9, py + 2, 2, 2, '#f6d64a');
    // Wanduhr
    r.ellipse(120, 26, 5, 5, '#5a3a2a');
    r.ellipse(120, 26, 4, 4, '#f8f4ea');
    r.px(120, 23, 1, 3, '#2a2030');
    r.px(120, 26, 2, 1, '#2a2030');
    // Hängeschränke über der Küche
    var cx = 3 * TILE, cw = 4 * TILE;
    r.px(cx, 18, cw, 13, '#3a2418');
    r.px(cx + 1, 19, cw - 2, 11, '#b47a48');
    r.px(cx + 1, 19, cw - 2, 1, '#cc955e');
    for (var i = 0; i < 4; i++) {
      r.px(cx + i * 16 + 2, 21, 12, 7, '#a06a3c');
      r.px(cx + i * 16 + (i % 2 ? 3 : 12), 25, 1, 2, '#f0d080');
      if (i > 0) r.px(cx + i * 16, 19, 1, 11, '#7a4e2a');
    }
    r.px(cx, 31, cw, 2, 'rgba(60,30,10,0.25)');
  }

  function drawKitchen(r) {
    // Schatten auf dem Boden
    r.px(2 * TILE, 4 * TILE, 5 * TILE + 2, 3, 'rgba(50,25,10,0.3)');

    // Kühlschrank
    r.px(33, 20, 14, 44, '#3a3a44');
    r.px(34, 21, 12, 42, '#eef2f4');
    r.px(43, 21, 3, 42, '#c8d0d6');
    r.px(34, 21, 12, 1, '#ffffff');
    r.px(34, 36, 12, 1, '#8a949c');
    r.px(42, 25, 1, 7, '#8a949c');
    r.px(42, 40, 1, 9, '#8a949c');
    r.px(36, 27, 3, 3, '#f0c040');                       // Magnet/Zettel
    r.px(37, 42, 4, 4, '#ffffff');
    r.px(37, 43, 4, 1, '#d0d6dc');

    // Unterschränke mit Arbeitsplatte (Spalten 3 bis 6)
    var x0 = 3 * TILE, x1 = 7 * TILE;
    r.px(x0, 39, x1 - x0 + 1, 25, '#3a2418');
    r.px(x0, 40, x1 - x0, 7, '#e6e0d4');                 // Arbeitsplatte
    r.px(x0, 40, x1 - x0, 1, '#ffffff');
    r.px(x0, 46, x1 - x0, 2, '#b4ac9e');
    r.px(x0, 48, x1 - x0, 14, '#c08a56');
    r.px(x0, 62, x1 - x0, 2, '#5a3a22');
    for (var i = 0; i < 4; i++) {
      var dx = x0 + i * 16;
      if (i === 1) continue;                               // Herd
      r.px(dx + 2, 50, 12, 10, '#b07a48');
      r.px(dx + 2, 50, 12, 1, '#d4a06a');
      r.px(dx + (i % 2 ? 4 : 11), 54, 1, 2, '#f0d080');
      r.px(dx, 48, 1, 14, '#8a5a32');
    }

    // Herd mit Backofen
    var sx = 4 * TILE;
    r.px(sx, 40, 16, 7, '#3a3a42');
    r.ellipse(sx + 4, 43, 3, 2, '#55555f');
    r.ellipse(sx + 12, 43, 3, 2, '#55555f');
    r.px(sx, 48, 16, 14, '#d8dcdf');
    r.px(sx + 2, 51, 12, 7, '#3a3a42');
    r.px(sx + 3, 52, 4, 1, '#6a6a74');
    r.px(sx + 2, 49, 12, 1, '#8a949c');
    r.px(sx + 15, 48, 1, 14, '#a8b0b6');

    // Topf auf dem Herd
    r.px(sx + 2, 34, 12, 9, '#2a2030');
    r.px(sx + 3, 35, 10, 7, '#c8503c');
    r.px(sx + 3, 35, 10, 1, '#e8806a');
    r.px(sx + 4, 36, 2, 5, '#e06a54');
    r.px(sx + 1, 36, 2, 2, '#2a2030');
    r.px(sx + 13, 36, 2, 2, '#2a2030');
    r.px(sx + 3, 34, 10, 1, '#9aa4ae');

    // Spüle mit Wasserhahn
    var kx = 5 * TILE;
    r.px(kx + 2, 41, 12, 5, '#7a8692');
    r.px(kx + 3, 42, 10, 3, '#c4d0d8');
    r.px(kx + 3, 42, 10, 1, '#e8f0f4');
    r.px(kx + 7, 36, 2, 6, '#9aa4ae');
    r.px(kx + 7, 36, 5, 1, '#c8d0d6');

    // Schneidebrett mit Gemüse
    var bx = 6 * TILE;
    r.px(bx + 3, 41, 10, 4, '#d8a868');
    r.px(bx + 3, 44, 10, 1, '#b08048');
    r.px(bx + 5, 42, 3, 1, '#f08a30');
    r.px(bx + 9, 42, 2, 2, '#5ab04a');
  }

  function drawShelf(r) {
    var x = 12 * TILE + 1, y = 22, w = 30, h = 42;
    r.px(x + 2, y + h, w, 3, 'rgba(50,25,10,0.3)');
    r.px(x, y, w, h, '#3a2418');
    r.px(x + 1, y + 1, w - 2, h - 2, '#8a5a32');
    var colors = ['#c84a4a', '#4a7ac8', '#e0b040', '#5aa84e', '#9a5ac0', '#e8e0d0', '#d8703a'];
    for (var s = 0; s < 2; s++) {
      var sy = y + 2 + s * 12;
      r.px(x + 2, sy, w - 4, 10, '#5a3a20');
      var bx = x + 3, n = 0;
      while (bx < x + w - 5) {
        var bw = 2 + Math.floor(hash(s * 7 + n, 3) * 2);
        var bh = 6 + Math.floor(hash(s, n * 5) * 3);
        r.px(bx, sy + 10 - bh, bw, bh, colors[(s * 3 + n) % colors.length]);
        r.px(bx, sy + 10 - bh, bw, 1, 'rgba(255,255,255,0.35)');
        bx += bw + 1;
        n++;
      }
      r.px(x + 1, sy + 10, w - 2, 2, '#a8723e');
    }
    // Schranktüren unten
    r.px(x + 2, y + 27, 12, 13, '#a06a3c');
    r.px(x + 16, y + 27, 12, 13, '#a06a3c');
    r.px(x + 12, y + 32, 1, 2, '#f0d080');
    r.px(x + 17, y + 32, 1, 2, '#f0d080');
  }

  function drawRug(r) {
    var x = 7 * TILE + 2, y = 5 * TILE + 4, w = 5 * TILE - 4, h = 4 * TILE - 8;
    r.px(x, y, w, h, '#e0b860');
    r.px(x + 2, y + 2, w - 4, h - 4, '#b03c3c');
    r.px(x + 5, y + 5, w - 10, h - 10, '#e0b860');
    r.px(x + 6, y + 6, w - 12, h - 12, '#c24848');
    for (var i = x + 4; i < x + w - 4; i += 6) {
      r.px(i, y - 1, 1, 1, '#e0b860');
      r.px(i, y + h, 1, 1, '#e0b860');
    }
  }

  function drawChairTop(r, x, y) {        // Stuhl hinter dem Tisch, Lehne oben
    r.px(x + 3, y + 1, 10, 9, '#3a2418');
    r.px(x + 4, y + 2, 8, 7, '#8a5a32');
    r.px(x + 5, y + 3, 1, 5, '#6a4224');
    r.px(x + 10, y + 3, 1, 5, '#6a4224');
    r.px(x + 2, y + 9, 12, 6, '#3a2418');
    r.px(x + 3, y + 10, 10, 4, '#b07a46');
    r.px(x + 3, y + 10, 10, 1, '#d09a62');
  }

  function drawChairBottom(r, x, y) {     // Stuhl vor dem Tisch, Lehne vorne
    r.px(x + 4, y + 14, 10, 2, 'rgba(50,25,10,0.3)');
    r.px(x + 2, y, 12, 6, '#3a2418');
    r.px(x + 3, y + 1, 10, 4, '#b07a46');
    r.px(x + 3, y + 1, 10, 1, '#d09a62');
    r.px(x + 3, y + 5, 10, 9, '#3a2418');
    r.px(x + 4, y + 6, 8, 7, '#8a5a32');
    r.px(x + 4, y + 6, 8, 1, '#a8723e');
    r.px(x + 7, y + 7, 2, 5, '#6a4224');
  }

  function drawTable(r) {
    var x = 8 * TILE + 1, y = 6 * TILE, w = 3 * TILE - 2;
    r.ellipse(x + w / 2 + 2, y + 29, 24, 4, 'rgba(50,20,10,0.3)');
    r.px(x + 2, y + 20, 3, 10, '#4a2c18');
    r.px(x + w - 5, y + 20, 3, 10, '#4a2c18');
    r.px(x, y, w, 23, '#3a2418');
    r.px(x + 1, y + 1, w - 2, 18, '#b07a46');
    r.px(x + 1, y + 1, w - 2, 1, '#d09a62');
    r.px(x + 1, y + 19, w - 2, 3, '#7a4e2a');
    // Tischläufer, Teller, Obstschale
    r.px(x + 16, y + 1, 14, 18, '#f2ede0');
    r.px(x + 16, y + 1, 1, 18, '#d8d0bc');
    r.px(x + 29, y + 1, 1, 18, '#d8d0bc');
    r.ellipse(x + 8, y + 9, 5, 3, '#c8c4bc');
    r.ellipse(x + 8, y + 9, 4, 2, '#ffffff');
    r.ellipse(x + w - 8, y + 9, 5, 3, '#c8c4bc');
    r.ellipse(x + w - 8, y + 9, 4, 2, '#ffffff');
    r.ellipse(x + 23, y + 11, 5, 3, '#8a5a32');
    r.px(x + 20, y + 8, 3, 3, '#e8443a');
    r.px(x + 23, y + 7, 3, 3, '#f0c040');
    r.px(x + 25, y + 9, 2, 2, '#5ab04a');
    r.px(x + 21, y + 8, 1, 1, '#ff9a8a');
  }

  function drawPlant(r, tx, ty) {
    var x = tx * TILE, y = ty * TILE;
    r.px(x + 4, y + 15, 10, 1, 'rgba(50,25,10,0.3)');
    r.px(x + 3, y + 8, 10, 8, '#2a1a10');
    r.px(x + 4, y + 9, 8, 6, '#c06a3a');
    r.px(x + 3, y + 8, 10, 2, '#d88a52');
    r.ellipse(x + 8, y + 5, 6, 4, '#1e5a2a');
    r.ellipse(x + 5, y + 3, 3, 3, '#2f7d36');
    r.ellipse(x + 11, y + 4, 3, 3, '#2f7d36');
    r.ellipse(x + 8, y + 1, 3, 3, '#3f9a44');
    r.px(x + 7, y - 1, 2, 1, '#7cc85e');
  }

  function drawMat(r) {
    var x = 7 * TILE + 2, y = 12 * TILE + 1, w = 2 * TILE - 4;
    r.px(x, y, w, 11, '#5a3a22');
    r.px(x + 1, y + 1, w - 2, 9, '#8a5a3a');
    for (var i = 0; i < 3; i++) r.px(x + 3, y + 3 + i * 2, w - 6, 1, '#a87446');
  }

  // --- Mutter: von hinten, am Herd ---------------------------------------
  function buildMother() {
    var pal = {
      o: '#22202e', m: '#5a3420', M: '#7e4c2c',
      s: '#f8d0a4', S: '#d9a074',
      c: '#c0506a', C: '#8e3450',
      a: '#f4f0e6', A: '#d8d2c4', B: '#5a3a2a'
    };
    var rows = [
      '.....oooooo.....',
      '....oMmmmmmo....',
      '...ommmmMmmmo...',
      '..ommmmmmmmmmo..',
      '..oMmmmmmmmmMo..',
      '..ommmmmmmmmmo..',
      '..oMmmmmmmmmMo..',
      '..oSmmmmmmmmSo..',
      '...oSSSSSSSSo...',
      '..occaccccacco..',
      '.oscaccccccacso.',
      '.oscaAaaaaAacso.',
      '..occccccccccco.',
      '..oCCCCCCCCCCo..',
      '...oCCCCCCCCo...',
      '....oBBoooBBo...'
    ];
    var stir = rows.slice();
    stir[10] = '.oscaccccccacsso';     // Arm rührt im Topf
    stir[11] = '.oscaAaaaaAacoo.';
    motherSprites = [Render.sprite(rows, pal), Render.sprite(stir, pal)];
  }

  // --- Vorberechnung und Zeichnen ----------------------------------------
  function bake() {
    layer = Render.createLayer(W, H);
    Render.setTarget(layer.ctx);
    Render.px(0, 0, W, H, '#0e0b12');
    drawFloor(Render);
    drawWalls(Render);
    drawWindow(Render);
    drawWallDecor(Render);
    drawRug(Render);
    drawKitchen(Render);
    drawShelf(Render);
    drawChairTop(Render, 9 * TILE, 5 * TILE);
    drawTable(Render);
    drawChairBottom(Render, 8 * TILE, 8 * TILE);
    drawChairBottom(Render, 10 * TILE, 8 * TILE);
    drawPlant(Render, 2, 11);
    drawPlant(Render, 13, 11);
    drawMat(Render);
    Render.setTarget(null);
    buildMother();
  }

  function drawGround(r, t) {
    if (!layer) bake();
    r.image(layer.canvas, 0, 0);
    // Mutter wiegt sich beim Rühren leicht hin und her
    var ctx = r.getCtx();
    ctx.globalAlpha = 0.3;
    r.ellipse(MOTHER.x + 8, MOTHER.y + 15, 6, 2, '#2a140a');
    ctx.globalAlpha = 1;
    var frame = Math.floor(t / 350) % 2;
    r.image(motherSprites[frame], MOTHER.x + (frame ? 1 : 0), MOTHER.y);
  }

  // Dampf aus dem Topf (über allem anderen)
  function drawOverlay(r, t) {
    var ctx = r.getCtx();
    for (var i = 0; i < 3; i++) {
      var p = (t / 1000 * 0.5 + i / 3) % 1;
      ctx.globalAlpha = 0.6 * (1 - p);
      var rad = 1 + Math.round(p * 3);
      r.ellipse(POT.x + Math.round(Math.sin(p * 6 + i * 2) * 2), POT.y - 2 - Math.round(p * 18), rad, rad, '#ffffff');
    }
    ctx.globalAlpha = 1;
  }

  return {
    isBlocked: isBlocked,
    isExit: isExit,
    drawGround: drawGround,
    drawOverlay: drawOverlay,
    SPAWN: SPAWN
  };
})();
