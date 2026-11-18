// spiegel.js: Spiegel-Raetsel vor dem Boss des Leuchtturms (Dungeon 2)
// Auf dem Boden ist ein Koordinatensystem eingraviert, darauf stehen 5 x 5
// Spiegelstaender(x = -1 ... 3, y = -2 ... 2). Die Steintafel nennt die feste
// Parabel y = -(x - 1)² + 2. Der Lichtstrahl vom Fenster oben trifft einen
// Spiegel nur, wenn er auf der Parabel steht (einer je Spalte). Wer alle
// fuenf Spiegel im Licht hat, oeffnet das Gitter zum Boss. Ein falscher
// Spiegel laesst alle wieder dunkel werden (kein Herzverlust).
var Spiegel = (function () {
  'use strict';

  var TILE = 16;
  var XS = [-1, 0, 1, 2, 3];        // x-Werte der Spalten
  var YS = [2, 1, 0, -1, -2];       // y-Werte der Zeilen (von oben nach unten)
  var FORMEL = 'y = \u2212(x \u2212 1)\u00b2 + 2';

  // Feste Parabel (von der Lehrkraft geprueft), nach unten geoeffnet
  function f(x) { return -(x - 1) * (x - 1) + 2; }

  // Kachel eines Spiegelstaenders: Spalten 3, 5, 7, 9, 11 und Zeilen 2, 4, 6, 8, 10
  function tileOf(x, y) { return { tx: 5 + 2 * x, ty: 6 - 2 * y }; }

  var lit = {};           // 'x,y' -> true (Spiegel faengt das Licht)
  var solved = false;
  var flash = 0;          // Zeitpunkt des Verlöschens (kurzer Lichtschauer)

  function isOnParabola(x, y) { return f(x) === y; }

  // Spiegel an (x|y) stellt sich ins Licht. Rueckgabe: 'lit' | 'wrong' | 'already' | 'solved'
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

  // Gelöst laden: alle richtigen Spiegel stehen im Licht
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
          name: 'Spiegel', texts: [], action: 'torch', torch: { x: XS[i], y: YS[j] }
        });
      }
    }
    return list;
  }

  // Kartenzeichen 'm' an allen Staendern setzen (blockiert, wie die Fackeln)
  function stampMap(map) {
    var rows = map.map(function (r) { return r.split(''); });
    for (var i = 0; i < XS.length; i++) {
      for (var j = 0; j < YS.length; j++) {
        var t = tileOf(XS[i], YS[j]);
        rows[t.ty][t.tx] = 'm';
      }
    }
    return rows.map(function (r) { return r.join(''); });
  }

  // --- Zeichnen ---------------------------------------------------------------

  // Eingeritzte Achsen und Beschriftung (vorberechnet, unter den Staendern)
  function bakeGrid(r) {
    var ctx = r.getCtx();
    var ox = tileOf(0, 0), x0 = ox.tx * TILE + 8, y0 = ox.ty * TILE + 8;
    r.px(tileOf(-1, 0).tx * TILE, y0, (XS.length * 2 - 1) * TILE, 1, '#8a8292');
    r.px(tileOf(-1, 0).tx * TILE, y0 + 1, (XS.length * 2 - 1) * TILE, 1, '#a89e90');
    r.px(x0, tileOf(0, 2).ty * TILE, 1, (YS.length * 2 - 1) * TILE, '#8a8292');
    r.px(x0 + 1, tileOf(0, 2).ty * TILE, 1, (YS.length * 2 - 1) * TILE, '#a89e90');
    // Zahlen: x-Werte unten (Zeile 11), y-Werte links (Spalte 2)
    for (var i = 0; i < XS.length; i++) {
      var t = tileOf(XS[i], -2), s = String(XS[i]);
      Font.draw(ctx, s, t.tx * TILE + 8 - Math.floor(Font.width(s) / 2), 11 * TILE + 4, '#6a6458');
    }
    for (var j = 0; j < YS.length; j++) {
      var u = tileOf(-1, YS[j]), v = String(YS[j]);
      Font.draw(ctx, v, 2 * TILE + 12 - Font.width(v), u.ty * TILE + 4, '#6a6458');
    }
    Font.draw(ctx, 'x', 12 * TILE + 4, ox.ty * TILE + 4, '#6a6458');
    Font.draw(ctx, 'y', ox.tx * TILE + 17, 2 * TILE + 1, '#6a6458');
  }

  // Spiegelstaender: Holzgestell mit schraegem Spiegel (der Strahl der von
  // oben kommt, sichtbar erst, wenn der Spiegel im Licht steht)
  function bakeStand(r, tx, ty) {
    var x = tx * TILE, y = ty * TILE;
    r.ellipse(x + 8, y + 14, 6, 2, 'rgba(40,20,10,0.3)');
    r.px(x + 7, y + 8, 2, 6, '#5a4630');     // Stange
    r.px(x + 5, y + 13, 6, 2, '#3e3226');    // Fuss
    r.px(x + 4, y + 4, 8, 6, '#4a4456');     // Fassung
    r.px(x + 5, y + 5, 6, 4, '#6a7484');     // dunkles Glas
    r.px(x + 5, y + 5, 2, 1, '#8a94a4');     // Schimmer
  }

  // Lichtstreifen der Spiegel im Licht (animiert) und kurzer Lichtschauer
  // nach einem Fehler; der Strahl faengt oben am Fenster an
  function drawLight(r, t) {
    var ctx = r.getCtx();
    for (var k in lit) {
      var p = k.split(','), tt = tileOf(+p[0], +p[1]);
      var x = tt.tx * TILE + 8, y = tt.ty * TILE + 6;
      var f2 = Math.floor(t / 130) % 2;
      // Lichtkegel von der Zimmerdecke auf den Spiegel
      ctx.globalAlpha = 0.10 + f2 * 0.03;
      for (var i = 0; i < y - 20; i += 2) {
        var spread = Math.floor((y - 20 - i) / 24);
        r.px(Math.round(x - 1 - spread), 20 + i, 2 + spread, 1, '#f8e88a');
      }
      ctx.globalAlpha = 1;
      // Spiegel glaenzt und wirft einen kleinen Schimmer nach rechts unten
      r.px(tt.tx * TILE + 5, tt.ty * TILE + 5, 6, 2, '#d8e4f0');
      r.px(tt.tx * TILE + 6, tt.ty * TILE + 6, 3, 1, '#ffffff');
      ctx.globalAlpha = 0.25;
      r.ellipse(x + 5, y + 4, 4, 2, '#f8e88a');
      ctx.globalAlpha = 1;
    }
    // nach einem Fehler: kurzer Streiflicht-Schauer ueber allen Staendern
    var dt = performance.now() - flash;
    if (flash && dt < 700) {
      ctx.globalAlpha = 1 - dt / 700;
      for (var i2 = 0; i2 < XS.length; i2++) {
        for (var j2 = 0; j2 < YS.length; j2++) {
          var s = tileOf(XS[i2], YS[j2]);
          r.px(s.tx * TILE + 3, s.ty * TILE + 2 - Math.round(dt / 90), 10, 1, '#fff2a0');
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
    drawLight: drawLight
  };
})();
