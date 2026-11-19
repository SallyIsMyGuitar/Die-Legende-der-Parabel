// platten.js: Platten-Raeetsel vor dem Boss des Sandtempels (Dungeon 4)
// Im Boden des Plattenraums liegt eine x-Achse mit sieben beschrifteten
// Druckplatten bei x = -3 ... 3. Die Steintafel nennt die feste Parabel
// y = x² − 2x − 3. Tritt man auf eine falsche Platte, sinken alle Platten
// zurueck (kein Herzverlust). Sind die beiden Platten auf den Nullstellen
// x = -1 und x = 3 gedrueckt, hebt sich das Gitter zum Boss.
var Platten = (function () {
  'use strict';

  var TILE = 16;
  var XS = [-3, -2, -1, 0, 1, 2, 3];   // x-Werte der Platten (von links)
  var PLATTE_TY = 6;                   // Kachelzeile der Platten
  var FORMEL = 'y = x\u00b2 \u2212 2x \u2212 3';

  // Feste Parabel (von der Lehrkraft geprueft), Nullstellen x = -1 und x = 3
  function f(x) { return x * x - 2 * x - 3; }

  // Kachel einer Platte: Spalten 2 bis 8 (x = Spalte - 5)
  function tileOf(x) { return { tx: x + 5, ty: PLATTE_TY }; }

  var pressed = {};        // 'x' -> true (Platte ist gedrueckt)
  var solved = false;
  var flash = 0;           // Zeitpunkt des Zuruecksinkens (kurzer Sandstoss)

  // Platte betreten. Rueckgabe: 'pressed' | 'wrong' | 'already' | 'solved'
  function press(x) {
    if (solved || pressed[x]) return 'already';
    if (f(x) !== 0) {
      pressed = {};
      flash = performance.now();
      return 'wrong';
    }
    pressed[x] = true;
    if (pressed[-1] && pressed[3]) {
      solved = true;
      return 'solved';
    }
    return 'pressed';
  }

  // Geloest laden: beide Platten der Nullstellen sind gedrueckt
  function setSolved() {
    solved = true;
    pressed = { '-1': true, '3': true };
  }

  // Liegt an Kachel (tx | ty) eine Platte? Rueckgabe: x-Wert oder null
  function plateAt(tx, ty) {
    if (ty !== PLATTE_TY) return null;
    for (var i = 0; i < XS.length; i++) {
      if (tileOf(XS[i]).tx === tx) return XS[i];
    }
    return null;
  }

  // Objekte fuer den Raum (nur die Platten; sie werden durch Betreten gedrueckt)
  function objects() {
    var list = [];
    for (var i = 0; i < XS.length; i++) {
      var t = tileOf(XS[i]);
      list.push({
        tiles: [[t.tx, t.ty]], x: t.tx * TILE, y: t.ty * TILE,
        name: 'Druckplatte', texts: [], plates: true
      });
    }
    return list;
  }

  // --- Zeichnen ---------------------------------------------------------------

  // x-Achse und Beschriftung einritzen (vorberechnet, unter den Platten)
  function bakeGrid(r) {
    var ctx = r.getCtx();
    var y0 = PLATTE_TY * TILE + 7;
    r.px(2 * TILE, y0, 7 * TILE, 1, '#8a6434');
    r.px(2 * TILE, y0 + 1, 7 * TILE, 1, '#a8834e');
    for (var i = 0; i < XS.length; i++) {
      var t = tileOf(XS[i]);
      var label = String(XS[i]).replace('-', '\u2212');
      Font.draw(ctx, label, t.tx * TILE + 8 - Math.floor(Font.width(label) / 2),
        (PLATTE_TY + 1) * TILE + 4, '#6a4a24');
    }
    Font.draw(ctx, 'x', 9 * TILE + 4, y0 - 8, '#6a4a24');
  }

  // Druckplatte (ruht oder gedrueckt einen Pixel tiefer)
  function bakePlate(r, x, depth) {
    var t = tileOf(x);
    var px = t.tx * TILE, py = t.ty * TILE + depth;
    r.ellipse(px + 8, py + 13, 6, 2, 'rgba(60,40,10,0.3)');
    r.px(px + 2, py + 3, 12, 10, '#a8834e');
    r.px(px + 3, py + 4, 10, 8, '#c8a468');
    r.px(px + 3, py + 4, 10, 1, '#e0c088');
    r.px(px + 3, py + 11, 10, 1, '#8a6434');
    r.px(px + 7, py + 6, 2, 2, '#8a6434');
  }

  // Platten im Laufbild: gedrueckte sinken ab und glimmen, kurzer Sandstoss
  // nach einem Fehler
  function drawPlates(r, t) {
    var ctx = r.getCtx();
    for (var i = 0; i < XS.length; i++) {
      var x = XS[i];
      bakePlate(r, x, pressed[x] ? 2 : 0);
      if (pressed[x]) {
        ctx.globalAlpha = 0.18 + 0.07 * (Math.floor(t / 250) % 2);
        r.ellipse(tileOf(x).tx * TILE + 8, tileOf(x).ty * TILE + 8, 7, 5, '#f8e0a0');
        ctx.globalAlpha = 1;
      }
    }
    var dt = performance.now() - flash;
    if (flash && dt < 600) {
      ctx.globalAlpha = 1 - dt / 600;
      for (var k = 0; k < 7; k++) {
        var t2 = tileOf(XS[k]);
        r.px(t2.tx * TILE + 2, t2.ty * TILE + 1 - Math.round(dt / 80), 12, 1, '#e8cf98');
      }
      ctx.globalAlpha = 1;
    }
  }

  return {
    FORMEL: FORMEL,
    press: press,
    setSolved: setSolved,
    isSolved: function () { return solved; },
    plateAt: plateAt,
    objects: objects,
    bakeGrid: bakeGrid,
    bakePlate: bakePlate,
    drawPlates: drawPlates,
    PLATTE_TY: PLATTE_TY,
    XS: XS
  };
})();
