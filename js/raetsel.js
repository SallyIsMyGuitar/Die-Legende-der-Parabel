// raetsel.js: Fackel-Rätsel vor dem Boss der Höhle der Parabeln
// Auf dem Boden ist ein Koordinatensystem eingeritzt, darauf stehen 5 × 5
// Fackelständer (x = −1 … 3, y = −2 … 2). Die Steintafel nennt die feste
// Parabel y = (x − 1)² − 2. Wer alle Fackeln auf der Parabel entzündet
// (eine je Spalte), öffnet das Gitter zum Boss. Eine falsche Fackel lässt
// alle wieder erlöschen (kein Herzverlust).
var Raetsel = (function () {
  'use strict';

  var TILE = 16;
  var XS = [-1, 0, 1, 2, 3];        // x-Werte der Spalten
  var YS = [2, 1, 0, -1, -2];       // y-Werte der Zeilen (von oben nach unten)
  var FORMEL = 'y = (x − 1)² − 2';

  // Feste Parabel (von der Lehrkraft geprüft)
  function f(x) { return (x - 1) * (x - 1) - 2; }

  // Kachel eines Fackelständers: Spalten 3, 5, 7, 9, 11 und Zeilen 2, 4, 6, 8, 10
  // (dazwischen bleiben Gänge frei, Spalte 8 führt von unten nach oben)
  function tileOf(x, y) { return { tx: 5 + 2 * x, ty: 6 - 2 * y }; }

  var lit = {};           // 'x,y' -> true
  var solved = false;
  var flash = 0;          // Zeitpunkt des Erlöschens (kurzer Rauch)

  function isOnParabola(x, y) { return f(x) === y; }

  // Fackel an (x|y) entzünden. Rückgabe: 'lit' | 'wrong' | 'already' | 'solved'
  function light(x, y) {
    if (solved || lit[x + ',' + y]) return 'already';
    if (!isOnParabola(x, y)) {
      lit = {};
      flash = performance.now();
      return 'wrong';
    }
    lit[x + ',' + y] = true;
    for (var i = 0; i < XS.length; i++) {
      if (!lit[XS[i] + ',' + f(XS[i])]) return 'lit';
    }
    solved = true;
    return 'solved';
  }

  // Gelöst laden: alle richtigen Fackeln brennen
  function setSolved() {
    solved = true;
    lit = {};
    for (var i = 0; i < XS.length; i++) lit[XS[i] + ',' + f(XS[i])] = true;
  }

  // Objekte für den Raum (Gesprächsziele mit Aktion 'torch')
  function objects() {
    var list = [];
    for (var i = 0; i < XS.length; i++) {
      for (var j = 0; j < YS.length; j++) {
        var t = tileOf(XS[i], YS[j]);
        list.push({
          tiles: [[t.tx, t.ty]], x: t.tx * TILE, y: t.ty * TILE,
          name: 'Fackel', texts: [], action: 'torch', torch: { x: XS[i], y: YS[j] }
        });
      }
    }
    return list;
  }

  // Kartenzeichen 'f' an allen Ständern setzen
  function stampMap(map) {
    var rows = map.map(function (r) { return r.split(''); });
    for (var i = 0; i < XS.length; i++) {
      for (var j = 0; j < YS.length; j++) {
        var t = tileOf(XS[i], YS[j]);
        rows[t.ty][t.tx] = 'f';
      }
    }
    return rows.map(function (r) { return r.join(''); });
  }

  // --- Zeichnen ---------------------------------------------------------------

  // Eingeritzte Achsen und Beschriftung (vorberechnet, unter den Ständern)
  function bakeGrid(r) {
    var ctx = r.getCtx();
    var ox = tileOf(0, 0), x0 = ox.tx * TILE + 8, y0 = ox.ty * TILE + 8;
    // x-Achse (y = 0) und y-Achse (x = 0) als Rillen im Boden
    r.px(tileOf(-1, 0).tx * TILE, y0, (XS.length * 2 - 1) * TILE, 1, '#151320');
    r.px(tileOf(-1, 0).tx * TILE, y0 + 1, (XS.length * 2 - 1) * TILE, 1, '#3a3546');
    r.px(x0, tileOf(0, 2).ty * TILE, 1, (YS.length * 2 - 1) * TILE, '#151320');
    r.px(x0 + 1, tileOf(0, 2).ty * TILE, 1, (YS.length * 2 - 1) * TILE, '#3a3546');
    // Zahlen: x-Werte unten (Zeile 11), y-Werte links (Spalte 2)
    for (var i = 0; i < XS.length; i++) {
      var t = tileOf(XS[i], -2), s = String(XS[i]);
      Font.draw(ctx, s, t.tx * TILE + 8 - Math.floor(Font.width(s) / 2), 11 * TILE + 4, '#8a8496');
    }
    for (var j = 0; j < YS.length; j++) {
      var u = tileOf(-1, YS[j]), v = String(YS[j]);
      Font.draw(ctx, v, 2 * TILE + 12 - Font.width(v), u.ty * TILE + 4, '#8a8496');
    }
    Font.draw(ctx, 'x', 12 * TILE + 4, ox.ty * TILE + 4, '#8a8496');
    Font.draw(ctx, 'y', ox.tx * TILE + 17, 2 * TILE + 1, '#8a8496');
  }

  // Fackelständer: Steinsockel mit Schale
  function bakeStand(r, tx, ty) {
    var x = tx * TILE, y = ty * TILE;
    r.ellipse(x + 8, y + 14, 6, 2, 'rgba(0,0,0,0.35)');
    r.px(x + 5, y + 7, 6, 7, '#4c4658');
    r.px(x + 5, y + 7, 6, 1, '#5e5870');
    r.px(x + 3, y + 5, 10, 3, '#5e5870');
    r.px(x + 4, y + 5, 8, 1, '#8a8496');
    r.px(x + 5, y + 6, 6, 1, '#1c1926');   // leere Schale
  }

  // Flammen der brennenden Fackeln (animiert)
  function drawFlames(r, t) {
    var ctx = r.getCtx();
    for (var k in lit) {
      var p = k.split(','), tt = tileOf(+p[0], +p[1]);
      var x = tt.tx * TILE, y = tt.ty * TILE;
      var fr = Math.floor(t / 90 + tt.tx) % 3, h = 5 + fr;
      ctx.globalAlpha = 0.12;
      r.ellipse(x + 8, y + 10, 12, 7, '#f0b050');
      ctx.globalAlpha = 1;
      r.px(x + 5, y + 6 - h, 6, h, '#e8943a');
      r.px(x + 6, y + 7 - h, 4, h - 1, '#f6c04a');
      r.px(x + 7, y + 6 - h, 2, 2, '#f8e88a');
    }
    // nach einem Fehler: kurz Rauch über allen Ständern der falschen Fackel-Reihe
    var dt = performance.now() - flash;
    if (flash && dt < 700) {
      ctx.globalAlpha = 1 - dt / 700;
      for (var i = 0; i < XS.length; i++) {
        for (var j = 0; j < YS.length; j++) {
          var s = tileOf(XS[i], YS[j]);
          r.ellipse(s.tx * TILE + 8, s.ty * TILE + 2 - Math.round(dt / 80), 3, 3, '#8a8496');
        }
      }
      ctx.globalAlpha = 1;
    }
  }

  return {
    FORMEL: FORMEL,
    light: light,
    setSolved: setSolved,
    isSolved: function () { return solved; },
    objects: objects,
    stampMap: stampMap,
    bakeGrid: bakeGrid,
    bakeStand: bakeStand,
    drawFlames: drawFlames
  };
})();
