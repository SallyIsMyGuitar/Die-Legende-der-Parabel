// gezeiten.js: Gezeiten-Raetsel vor dem Boss des Wasserreichs (Dungeon 3)
// Auf dem Boden ist ein Koordinatensystem eingraviert, darauf stehen 5 x 5
// Gezeitenbrunnen (x = -2 ... 2, y = -2 ... 2). Die Steintafel nennt die
// feste Parabel y = x² - 2. Ein Brunnen sprudelt nur im Takt der Gezeiten,
// wenn er auf der Parabel steht (einer je Spalte). Wer alle fuenf Brunnen
// angeregt hat, oeffnet das Gitter zum Boss. Ein falscher Brunnen laesst
// alle wieder versiegen (kein Herzverlust).
var Gezeiten = (function () {
  'use strict';

  var TILE = 16;
  var XS = [-2, -1, 0, 1, 2];      // x-Werte der Spalten
  var YS = [2, 1, 0, -1, -2];      // y-Werte der Zeilen (von oben nach unten)
  var FORMEL = 'y = x\u00b2 \u2212 2';

  // Feste Parabel (von der Lehrkraft geprueft), Normalparabel nach unten verschoben
  function f(x) { return x * x - 2; }

  // Kachel eines Brunnens: Spalten 3, 5, 7, 9, 11 und Zeilen 2, 4, 6, 8, 10
  function tileOf(x, y) { return { tx: 7 + 2 * x, ty: 6 - 2 * y }; }

  var lit = {};           // 'x,y' -> true (Brunnen sprudelt)
  var solved = false;
  var flash = 0;          // Zeitpunkt des Versiegens (kurzer Schaumschauer)

  function isOnParabola(x, y) { return f(x) === y; }

  // Brunnen an (x|y) anregen. Rueckgabe: 'lit' | 'wrong' | 'already' | 'solved'
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

  // Geloest laden: alle richtigen Brunnen sprudeln
  function setSolved() {
    solved = true;
    lit = {};
    for (var i = 0; i < XS.length; i++) lit[XS[i] + ',' + f(XS[i])] = true;
  }

  // Objekte fuer den Raum (Gespraechsziele mit Aktion 'torch', wie die Fackeln)
  function objects() {
    var list = [];
    for (var i = 0; i < XS.length; i++) {
      for (var j = 0; j < YS.length; j++) {
        var t = tileOf(XS[i], YS[j]);
        list.push({
          tiles: [[t.tx, t.ty]], x: t.tx * TILE, y: t.ty * TILE,
          name: 'Brunnen', texts: [], action: 'torch', torch: { x: XS[i], y: YS[j] }
        });
      }
    }
    return list;
  }

  // Kartenzeichen 'g' an allen Brunnen setzen (blockiert, wie die Fackeln)
  function stampMap(map) {
    var rows = map.map(function (r) { return r.split(''); });
    for (var i = 0; i < XS.length; i++) {
      for (var j = 0; j < YS.length; j++) {
        var t = tileOf(XS[i], YS[j]);
        rows[t.ty][t.tx] = 'g';
      }
    }
    return rows.map(function (r) { return r.join(''); });
  }

  // --- Zeichnen ---------------------------------------------------------------

  // Eingeritzte Achsen und Beschriftung (vorberechnet, unter den Brunnen)
  function bakeGrid(r) {
    var ctx = r.getCtx();
    var ox = tileOf(0, 0), x0 = ox.tx * TILE + 8, y0 = ox.ty * TILE + 8;
    r.px(tileOf(-2, 0).tx * TILE, y0, (XS.length * 2 - 1) * TILE, 1, '#1e3246');
    r.px(tileOf(-2, 0).tx * TILE, y0 + 1, (XS.length * 2 - 1) * TILE, 1, '#35506a');
    r.px(x0, tileOf(0, 2).ty * TILE, 1, (YS.length * 2 - 1) * TILE, '#1e3246');
    r.px(x0 + 1, tileOf(0, 2).ty * TILE, 1, (YS.length * 2 - 1) * TILE, '#35506a');
    // Zahlen: x-Werte unten (Zeile 11), y-Werte links (Spalte 2)
    for (var i = 0; i < XS.length; i++) {
      var t = tileOf(XS[i], -2), s = String(XS[i]);
      Font.draw(ctx, s, t.tx * TILE + 8 - Math.floor(Font.width(s) / 2), 11 * TILE + 4, '#8ac4cc');
    }
    for (var j = 0; j < YS.length; j++) {
      var u = tileOf(-2, YS[j]), v = String(YS[j]);
      Font.draw(ctx, v, 2 * TILE + 12 - Font.width(v), u.ty * TILE + 4, '#8ac4cc');
    }
    Font.draw(ctx, 'x', 12 * TILE + 4, ox.ty * TILE + 4, '#8ac4cc');
    Font.draw(ctx, 'y', ox.tx * TILE + 17, 2 * TILE + 1, '#8ac4cc');
  }

  // Gezeitenbrunnen: steinernes Becken mit dunklem Wasserspiegel
  function bakeStand(r, tx, ty) {
    var x = tx * TILE, y = ty * TILE;
    r.ellipse(x + 8, y + 14, 7, 2, 'rgba(10,25,40,0.5)');
    r.px(x + 4, y + 7, 8, 7, '#3e5e7a');
    r.px(x + 3, y + 10, 10, 4, '#2e4c66');
    r.px(x + 5, y + 11, 6, 2, '#12314a');   // dunkler Wasserspiegel
    r.px(x + 4, y + 7, 8, 1, '#8ac4cc');
    r.px(x + 4, y + 12, 8, 1, '#1e3246');
  }

  // Sprudelnde Brunnen (animiert) und kurzer Schaumschauer nach einem
  // Fehler: Das Wasser gischt zurueck, gerade wie es Graf Gerade liebt.
  function drawWater(r, t) {
    var ctx = r.getCtx();
    for (var k in lit) {
      var p = k.split(','), tt = tileOf(+p[0], +p[1]);
      var x = tt.tx * TILE + 8, y = tt.ty * TILE + 11;
      var w = Math.floor(t / 110) % 2;
      // Fontaene: helle Tropfen steigen und fallen im Gezeitentakt
      ctx.globalAlpha = 0.5;
      for (var i = 0; i < 3; i++) {
        var h = 4 + w + i;
        r.px(x - 2 + i, y - h, 1, h, '#b8e0f0');
        r.px(x, y - h - 2, 1, 2, '#e0f4fc');
      }
      ctx.globalAlpha = 1;
      // leuchtender Wasserspiegel
      r.px(tt.tx * TILE + 5, tt.ty * TILE + 11, 6, 2, '#8ad8e8');
      ctx.globalAlpha = 0.18;
      r.ellipse(x, y + 1, 8, 3, '#8ad8e8');
      ctx.globalAlpha = 1;
    }
    // nach einem Fehler: Schaumgische ueber allen Brunnen
    var dt = performance.now() - flash;
    if (flash && dt < 700) {
      ctx.globalAlpha = 1 - dt / 700;
      for (var i2 = 0; i2 < XS.length; i2++) {
        for (var j2 = 0; j2 < YS.length; j2++) {
          var s = tileOf(XS[i2], YS[j2]);
          r.ellipse(s.tx * TILE + 8, s.ty * TILE + 6 - Math.round(dt / 100), 4, 2, '#e0f4fc');
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
    drawWater: drawWater
  };
})();
