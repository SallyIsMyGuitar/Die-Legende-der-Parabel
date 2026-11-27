// linse.js: Schiebe-Raetsel "Linsenkammer" im Leuchtturm (Dungeon 2)
// Zwischen Maschinenraum und Spiegelraum. Im Boden ist ein Koordinatensystem
// eingraviert (x = -4 ... 3, y = -3 ... 2). Ein schwerer Linsenstein liegt
// zu Beginn im Ursprung; sein Licht zeichnet eine Parabel auf den Boden,
// deren Scheitel immer der Stein ist (zu Beginn also die Normalparabel
// y = x²). Die Steintafel nennt die feste Parabel y = (x + 2)² - 1. Wer den
// Stein auf ihren Scheitel S(-2|-1) schiebt, oeffnet das Gitter.
// Schieben wie im klassischen Zelda: kurz gegen den Stein laufen, dann rutscht
// er eine Kachel weiter. Ziehen geht nicht. Eine Druckplatte am Eingang setzt
// den Stein zurueck (kein Festfahren). Kein Herzverlust.
var Linse = (function () {
  'use strict';

  var TILE = 16;
  var ROOM = 'llinse';
  var FORMEL = 'y = (x + 2)² − 1';
  var ZIEL = { x: -2, y: -1 };            // Scheitel der Tafel-Parabel

  // Raster: x-Werte -4 ... 3 liegen in den Spalten 3 ... 10,
  // y-Werte 2 ... -3 in den Zeilen 3 ... 8 (Ursprung auf Kachel 7/5)
  var X_MIN = -4, X_MAX = 3, Y_MIN = -3, Y_MAX = 2;
  var OX = 7, OY = 5;
  function tileOf(x, y) { return { tx: OX + x, ty: OY - y }; }
  function coordOf(tx, ty) { return { x: tx - OX, y: OY - ty }; }
  function onGrid(tx, ty) {
    var c = coordOf(tx, ty);
    return c.x >= X_MIN && c.x <= X_MAX && c.y >= Y_MIN && c.y <= Y_MAX;
  }

  var START = tileOf(0, 0);               // Stein beginnt im Ursprung
  var PLATTE = { tx: 3, ty: 11 };         // Druckplatte zum Zuruecksetzen

  // Kacheln, auf die der Stein nie rutschen darf: vor den beiden Durchgaengen
  // (sonst waeren sie versperrt) und die Druckplatte
  var VERBOTEN = { '8,2': true, '8,11': true };
  VERBOTEN[PLATTE.tx + ',' + PLATTE.ty] = true;

  // Werte fuers Schieben (zum Nachjustieren)
  var PUSH_TIME = 0.3;    // so lange (s) gegen den Stein laufen, bis er rutscht
  var SLIDE_TIME = 0.25;  // Dauer des Rutschens (s)
  var NAH = 2;            // Abstand (px) zwischen Fuss und Stein, der als "anliegen" zaehlt
                          // (bis -1 px, weil die Figur in Bruchteilen von Pixeln laeuft)

  var stone = { tx: START.tx, ty: START.ty };
  var slide = null;       // { fx, fy, tx, ty, t } waehrend der Stein rutscht
  var pushT = 0;          // wie lange schon gegen den Stein gelaufen wird
  var solved = false;
  var lastPlate = false;  // stand die Figur im letzten Bild auf der Platte?

  // Stein zurueck an den Start (beim Betreten des Raums und per Druckplatte)
  function reset() {
    if (solved) return;
    stone = { tx: START.tx, ty: START.ty };
    slide = null;
    pushT = 0;
  }

  function setSolved() {
    solved = true;
    var z = tileOf(ZIEL.x, ZIEL.y);
    stone = { tx: z.tx, ty: z.ty };
    slide = null;
  }

  // Blockiert der Stein die Kachel? (waehrend des Rutschens Start und Ziel)
  function blockedAt(tx, ty) {
    if (stone.tx === tx && stone.ty === ty) return true;
    return !!slide && slide.fx === tx && slide.fy === ty;
  }

  // Liegt die Spielfigur (Kollisionsbox wie in player.js: x+3 ... x+12,
  // y+8 ... y+14) in Richtung 'dir' direkt am Stein an?
  function anliegen(px, py, dir) {
    var sx = stone.tx * TILE, sy = stone.ty * TILE;
    var l = px + 3, r = px + 13, o = py + 8, u = py + 15;
    var cx = Math.floor((px + 8) / TILE), cy = Math.floor((py + 11) / TILE);
    function nah(d) { return d >= -1 && d <= NAH; }
    if (dir === 'left') return cy === stone.ty && nah(l - (sx + TILE));
    if (dir === 'right') return cy === stone.ty && nah(sx - r);
    if (dir === 'up') return cx === stone.tx && nah(o - (sy + TILE));
    if (dir === 'down') return cx === stone.tx && nah(sy - u);
    return false;
  }

  var DIR = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] };

  // Pro Bild aufrufen, solange die Figur sich frei bewegen kann.
  // Rueckgabe: 'solved' (Stein rastet ein), 'reset' (Druckplatte), sonst null
  function update(dt, px, py, facing, input, isBlocked) {
    if (solved) return null;
    // Rutschen fortsetzen
    if (slide) {
      slide.t += dt;
      if (slide.t >= SLIDE_TIME) {
        slide = null;
        var c = coordOf(stone.tx, stone.ty);
        if (c.x === ZIEL.x && c.y === ZIEL.y) { solved = true; return 'solved'; }
      }
      return null;
    }
    // Druckplatte: setzt den Stein zurueck (nur beim Betreten der Platte)
    var ftx = Math.floor((px + 8) / TILE), fty = Math.floor((py + 11) / TILE);
    var onPlate = ftx === PLATTE.tx && fty === PLATTE.ty;
    var res = null;
    if (onPlate && !lastPlate && (stone.tx !== START.tx || stone.ty !== START.ty)) {
      reset();
      res = 'reset';
    }
    lastPlate = onPlate;
    if (res) return res;
    // Gegen den Stein laufen
    if (input.isDown(facing) && anliegen(px, py, facing)) {
      pushT += dt;
      if (pushT >= PUSH_TIME) {
        pushT = 0;
        var d = DIR[facing];
        var nx = stone.tx + d[0], ny = stone.ty + d[1];
        if (!VERBOTEN[nx + ',' + ny] && !isBlocked(nx, ny)) {
          slide = { fx: stone.tx, fy: stone.ty, t: 0 };
          stone = { tx: nx, ty: ny };
        }
      }
    } else {
      pushT = 0;
    }
    return null;
  }

  // Aktuelle Pixelposition des Steins (beim Rutschen dazwischen)
  function stonePos() {
    if (!slide) return { x: stone.tx * TILE, y: stone.ty * TILE };
    var p = Math.min(1, slide.t / SLIDE_TIME);
    return {
      x: (slide.fx + (stone.tx - slide.fx) * p) * TILE,
      y: (slide.fy + (stone.ty - slide.fy) * p) * TILE
    };
  }

  // --- Zeichnen ---------------------------------------------------------------

  // Eingeritzte Achsen, Rasterpunkte und Beschriftung (vorberechnet)
  function bakeGrid(r) {
    var ctx = r.getCtx();
    var a = tileOf(X_MIN, 0), b = tileOf(0, Y_MAX);
    var x0 = OX * TILE + 8, y0 = OY * TILE + 8;
    var breite = (X_MAX - X_MIN + 1) * TILE, hoehe = (Y_MAX - Y_MIN + 1) * TILE;
    // Rasterpunkte in jeder Kachelmitte
    for (var gx = X_MIN; gx <= X_MAX; gx++) {
      for (var gy = Y_MIN; gy <= Y_MAX; gy++) {
        var t = tileOf(gx, gy);
        r.px(t.tx * TILE + 7, t.ty * TILE + 7, 2, 2, '#5a5674');
      }
    }
    // Achsen
    r.px(a.tx * TILE, y0, breite, 1, '#7a7492');
    r.px(a.tx * TILE, y0 + 1, breite, 1, '#9a94b0');
    r.px(x0, b.ty * TILE, 1, hoehe, '#7a7492');
    r.px(x0 + 1, b.ty * TILE, 1, hoehe, '#9a94b0');
    // x-Werte unten (Zeile 9), y-Werte links (Spalte 2)
    for (var i = X_MIN; i <= X_MAX; i++) {
      var s = String(i).replace('-', '−'), u = tileOf(i, 0);
      Font.draw(ctx, s, u.tx * TILE + 8 - Math.floor(Font.width(s) / 2), 9 * TILE + 3, '#9a94b0');
    }
    for (var j = Y_MIN; j <= Y_MAX; j++) {
      var v = String(j).replace('-', '−'), w = tileOf(0, j);
      Font.draw(ctx, v, 2 * TILE + 13 - Font.width(v), w.ty * TILE + 4, '#9a94b0');
    }
    Font.draw(ctx, 'x', 11 * TILE + 3, OY * TILE + 2, '#9a94b0');
    Font.draw(ctx, 'y', OX * TILE + 11, 2 * TILE + 2, '#9a94b0');
  }

  // Druckplatte zum Zuruecksetzen (vorberechnet)
  function bakePlate(r) {
    var x = PLATTE.tx * TILE, y = PLATTE.ty * TILE;
    r.px(x + 2, y + 3, 12, 11, '#2a2838');
    r.px(x + 3, y + 4, 10, 9, '#8a7a5a');
    r.px(x + 3, y + 4, 10, 1, '#b8a070');
    // kleiner Pfeil im Kreis: "zurueck"
    r.px(x + 5, y + 7, 6, 1, '#4a4030');
    r.px(x + 5, y + 6, 1, 3, '#4a4030');
    r.px(x + 4, y + 7, 1, 1, '#4a4030');
    r.px(x + 10, y + 8, 1, 2, '#4a4030');
    r.px(x + 6, y + 10, 5, 1, '#4a4030');
  }

  // Linsenstativ aus Messing (Kartenzeichen 'p', blockiert)
  function bakeStativ(r, tx, ty) {
    var x = tx * TILE, y = ty * TILE;
    r.ellipse(x + 8, y + 14, 6, 2, 'rgba(10,10,20,0.4)');
    r.px(x + 4, y + 13, 8, 2, '#7a5a20');      // Fuss
    r.px(x + 7, y + 6, 2, 8, '#b8903a');       // Stange
    r.px(x + 7, y + 6, 1, 8, '#e8c060');
    r.ellipse(x + 8, y + 5, 5, 5, '#7a5a20');  // Fassung
    r.ellipse(x + 8, y + 5, 4, 4, '#8ab4d8');  // Glas
    r.px(x + 6, y + 3, 2, 1, '#e0f0ff');       // Schimmer
  }

  // Lichtparabel: Scheitel liegt immer im Stein, y = (x - xs)² + ys
  function drawParabola(r, t, sx, sy) {
    var ctx = r.getCtx();
    var x0 = OX * TILE + 8, y0 = OY * TILE + 8;   // Ursprung in Pixeln
    var xs = (sx - x0) / TILE, ys = (y0 - sy) / TILE;
    var left = (OX + X_MIN) * TILE, right = (OX + X_MAX + 1) * TILE;
    var top = (OY - Y_MAX) * TILE, bottom = (OY - Y_MIN + 1) * TILE;
    var farbe = solved ? '#ffe070' : '#f8e88a';
    ctx.globalAlpha = solved ? 0.85 : 0.45 + 0.15 * Math.sin(t / 220);
    var prev = null;
    for (var px = left; px < right; px++) {
      var xv = (px + 0.5 - x0) / TILE;
      var yv = (xv - xs) * (xv - xs) + ys;
      var py = Math.round(y0 - yv * TILE);
      if (prev !== null) {
        // senkrechte Luecken schliessen, damit die Kurve durchgehend ist;
        // nur innerhalb des Rasters zeichnen
        var a = Math.max(top, Math.min(py, prev)), b = Math.min(bottom - 1, Math.max(py, prev));
        if (b >= a) r.px(px, a, solved ? 2 : 1, b - a + 1, farbe);
      }
      prev = py;
    }
    ctx.globalAlpha = 1;
  }

  // Linsenstein: Steinblock mit Messingring und Glaslinse obenauf
  function drawStone(r, t, x, y) {
    var ctx = r.getCtx();
    ctx.globalAlpha = 0.35;
    r.px(x + 2, y + 13, 13, 3, '#0a0a14');      // Schatten
    ctx.globalAlpha = 1;
    r.px(x + 1, y + 1, 14, 14, '#4a4658');
    r.px(x + 2, y + 2, 12, 11, '#8a8498');
    r.px(x + 2, y + 2, 12, 1, '#b4aec4');
    r.px(x + 2, y + 13, 12, 2, '#5e5a6e');
    r.ellipse(x + 8, y + 7, 5, 4, '#b8903a');   // Messingring
    r.ellipse(x + 8, y + 7, 4, 3, solved ? '#fff2a0' : '#8ab4d8');
    r.px(x + 6, y + 5, 2, 1, '#ffffff');
    if (solved || Math.floor(t / 500) % 2) r.px(x + 9, y + 8, 1, 1, '#e0f0ff');
  }

  // Laufbild: Lichtparabel (nur, solange der Stein im Raster liegt) und Stein
  function draw(r, t) {
    var p = stonePos();
    var gx = Math.round(p.x / TILE), gy = Math.round(p.y / TILE);
    if (onGrid(gx, gy)) drawParabola(r, t, p.x + 8, p.y + 8);
    drawStone(r, t, p.x, p.y);
  }

  return {
    ROOM: ROOM,
    FORMEL: FORMEL,
    PLATTE: PLATTE,
    reset: reset,
    setSolved: setSolved,
    isSolved: function () { return solved; },
    blockedAt: blockedAt,
    update: update,
    bakeGrid: bakeGrid,
    bakePlate: bakePlate,
    bakeStativ: bakeStativ,
    draw: draw
  };
})();
