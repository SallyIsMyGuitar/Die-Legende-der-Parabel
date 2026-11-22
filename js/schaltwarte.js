// schaltwarte.js: Raetsel "Schaltwarte" vor dem Boss des Wasserkraftwerks
// (Dungeon 3, allgemeine Form, Parabel durch drei Punkte).
// Auf einem grossen Bildschirm (Kacheln 2-7, Reihen 2-7) sind drei
// Anschluesse markiert: P1(0|-1), P2(1|-2), P3(3|2). Drei Hebel stellen a, b
// und c von y = ax² + bx + c ein, der Bildschirm zeichnet die Parabel live mit.
// Der Startschalter prueft: Nur y = x² - 2x - 1 trifft alle drei Anschluesse.
// Dann stroemt Wasser durch das Druckrohr und das Gitter zum Boss hebt sich.
// Eine falsche Einstellung laesst die Turbine nur stottern (kein Herzverlust).
var Schaltwarte = (function () {
  'use strict';

  var TILE = 16;

  // Feste Loesung (von der Lehrkraft geprueft): y = x² - 2x - 1
  // lx/ly: Lage der Beschriftung, so dass sie die Kurve nicht verdeckt
  var PUNKTE = [{ x: 0, y: -1, lx: -14, ly: 3 }, { x: 1, y: -2, lx: 4, ly: 2 }, { x: 3, y: 2, lx: 5, ly: -4 }];
  var LOESUNG = { a: 1, b: -2, c: -1 };

  // Werte der Hebel (A schaltet weiter, am Ende wieder von vorn)
  var WERTE = {
    a: [-2, -1, 1, 2],
    b: [-3, -2, -1, 0, 1, 2, 3],
    c: [-3, -2, -1, 0, 1, 2, 3]
  };
  var START = { a: -1, b: 0, c: 0 };

  // Lage im Raum: Hebel a, b, c in Reihe 9, Startschalter (10,9)
  var HEBEL = { a: [3, 9], b: [5, 9], c: [7, 9] };
  var SCHALTER = [10, 9];

  // Bildschirm: Kacheln 2-7 / 2-7 (96 x 96 Pixel), Koordinatensystem
  // x = -2 ... 4, y = -3 ... 4, 12 Pixel je Einheit
  var SCR = { x: 2 * TILE, y: 2 * TILE, w: 6 * TILE, h: 6 * TILE };
  var U = 12;
  var OX = SCR.x + 6 + 2 * U;   // Pixel von x = 0
  var OY = SCR.y + 6 + 4 * U;   // Pixel von y = 0

  var wert = { a: START.a, b: START.b, c: START.c };
  var solved = false;
  var stotter = 0;               // Zeitpunkt des letzten Fehlstarts

  function f(x) { return wert.a * x * x + wert.b * x + wert.c; }

  function trifft(p) { return f(p.x) === p.y; }

  // Hebel weiterschalten; Rueckgabe: neuer Wert
  function schalte(k) {
    if (solved) return wert[k];
    var list = WERTE[k];
    var i = list.indexOf(wert[k]);
    wert[k] = list[(i + 1) % list.length];
    return wert[k];
  }

  // Startschalter; Rueckgabe: 'solved' | 'wrong' | 'already'
  function starte() {
    if (solved) return 'already';
    if (wert.a === LOESUNG.a && wert.b === LOESUNG.b && wert.c === LOESUNG.c) {
      solved = true;
      return 'solved';
    }
    stotter = performance.now();
    return 'wrong';
  }

  function setSolved() {
    solved = true;
    wert = { a: LOESUNG.a, b: LOESUNG.b, c: LOESUNG.c };
  }

  // Aktuelle Gleichung als Text, z. B. "y = x² − 2x − 1"
  function term() {
    var s = '';
    var a = wert.a, b = wert.b, c = wert.c;
    s += a === 1 ? 'x²' : (a === -1 ? '−x²' : (a < 0 ? '−' + (-a) : a) + 'x²');
    if (b) s += (b > 0 ? ' + ' : ' − ') + (Math.abs(b) === 1 ? '' : Math.abs(b)) + 'x';
    if (c) s += (c > 0 ? ' + ' : ' − ') + Math.abs(c);
    return 'y = ' + s;
  }

  // Gespraechsziele: drei Hebel und der Startschalter
  function objects() {
    var list = [];
    ['a', 'b', 'c'].forEach(function (k) {
      var t = HEBEL[k];
      list.push({ tiles: [t], x: t[0] * TILE, y: t[1] * TILE, name: 'Hebel ' + k, texts: [], action: 'hebel', hebel: k });
    });
    list.push({ tiles: [SCHALTER], x: SCHALTER[0] * TILE, y: SCHALTER[1] * TILE, name: 'Startschalter', texts: [], action: 'start' });
    return list;
  }

  // --- Zeichnen ---------------------------------------------------------------

  // Gehaeuse von Bildschirm, Hebeln und Schalter (vorberechnet)
  function bake(r) {
    // Leitstand-Gehaeuse mit Bildschirm
    r.ellipse(SCR.x + SCR.w / 2, SCR.y + SCR.h + 1, 50, 4, 'rgba(10,14,20,0.45)');
    r.px(SCR.x, SCR.y, SCR.w, SCR.h, '#3a4250');
    r.px(SCR.x, SCR.y, SCR.w, 2, '#6a7484');
    r.px(SCR.x + 3, SCR.y + 3, SCR.w - 6, SCR.h - 6, '#0e1a14');
    ['a', 'b', 'c'].forEach(function (k) { hebelSockel(r, HEBEL[k][0], HEBEL[k][1]); });
    // Startschalter: Pult mit grossem Knopf
    var sx = SCHALTER[0] * TILE, sy = SCHALTER[1] * TILE;
    r.ellipse(sx + 8, sy + 15, 7, 2, 'rgba(10,14,20,0.45)');
    r.px(sx + 2, sy + 4, 12, 11, '#4a5260');
    r.px(sx + 2, sy + 4, 12, 2, '#7a8494');
    for (var i = 0; i < 12; i += 4) {
      r.px(sx + 2 + i, sy + 12, 2, 3, '#f0c030');
      r.px(sx + 4 + i, sy + 12, 2, 3, '#2a2a30');
    }
  }

  function hebelSockel(r, tx, ty) {
    var x = tx * TILE, y = ty * TILE;
    r.ellipse(x + 8, y + 15, 6, 2, 'rgba(10,14,20,0.45)');
    r.px(x + 3, y + 9, 10, 6, '#4a5260');
    r.px(x + 3, y + 9, 10, 1, '#7a8494');
  }

  // Laufbild: Achsen, Anschluesse, Parabel, Hebelstellungen, Anzeige
  function draw(r, t) {
    var ctx = r.getCtx(), i, k;
    var ix = SCR.x + 3, iy = SCR.y + 3, iw = SCR.w - 6, ih = SCR.h - 6;
    // Gitter und Achsen
    for (k = -2; k <= 4; k++) r.px(OX + k * U, iy, 1, ih, '#173226');
    for (k = -3; k <= 4; k++) r.px(ix, OY - k * U, iw, 1, '#173226');
    r.px(ix, OY, iw, 1, '#3e8a5e');
    r.px(OX, iy, 1, ih, '#3e8a5e');
    // Parabel live (gruen), nur innerhalb des Bildschirms
    // (benachbarte Pixel werden senkrecht verbunden, damit auch steile
    // Stellen als durchgehende Linie erscheinen)
    ctx.fillStyle = solved ? '#9af0b0' : '#5ae08a';
    var prev = null;
    for (var px = ix; px < ix + iw; px++) {
      var py = Math.round(OY - f((px - OX) / U) * U);
      var lo = prev === null ? py : Math.min(py, prev + 1);
      var hi = prev === null ? py : Math.max(py, prev - 1);
      lo = Math.max(lo, iy);
      hi = Math.min(hi, iy + ih - 1);
      if (hi >= lo) ctx.fillRect(px, lo, 1, hi - lo + 1);
      prev = py;
    }
    // Anschluesse: Ring, der leuchtet, wenn die Parabel ihn trifft
    PUNKTE.forEach(function (p, n) {
      var cx = OX + p.x * U, cy = OY - p.y * U;
      var hit = trifft(p);
      var col = hit ? '#f8e070' : '#c85a4a';
      r.px(cx - 3, cy - 1, 7, 3, col);
      r.px(cx - 1, cy - 3, 3, 7, col);
      r.px(cx - 1, cy - 1, 3, 3, '#0e1a14');
      if (hit) r.px(cx, cy, 1, 1, '#ffffff');
      Font.draw(ctx, 'P' + (n + 1), cx + p.lx, cy + p.ly, '#8ad0a8');
    });
    // Gleichung oben im Bildschirm
    var s = term();
    r.px(ix + 1, iy + 1, Font.width(s) + 4, 9, '#0e1a14');
    Font.draw(ctx, s, ix + 3, iy + 2, '#c8f0d0');
    // Hebel: Stange nach links (kleiner Wert) bis rechts (grosser Wert), Wert darueber
    ['a', 'b', 'c'].forEach(function (key) {
      var hx = HEBEL[key][0] * TILE, hy = HEBEL[key][1] * TILE;
      var list = WERTE[key];
      var pos = list.indexOf(wert[key]) / (list.length - 1);   // 0 ... 1
      var tip = hx + 3 + Math.round(pos * 10);
      r.px(hx + 7, hy + 9, 2, 1, '#2a2e36');
      for (var j = 0; j < 7; j++) {
        r.px(Math.round(hx + 8 + (tip - hx - 8) * j / 6), hy + 9 - j, 1, 1, '#9aa4b4');
      }
      r.ellipse(tip, hy + 2, 2, 2, '#e8443a');
      var lab = key + ' = ' + Tasks.fmt(wert[key]);
      var lw = Font.width(lab);
      r.px(hx + 8 - Math.round(lw / 2) - 2, hy - 11, lw + 4, 9, '#1c2230');
      Font.draw(ctx, lab, hx + 8 - Math.round(lw / 2), hy - 10, '#f4f0e2');
    });
    // Startschalter: Knopf leuchtet gruen, wenn geloest, sonst rot
    var sx = SCHALTER[0] * TILE, sy = SCHALTER[1] * TILE;
    r.ellipse(sx + 8, sy + 7, 3, 2, solved ? '#5ae08a' : '#e8443a');
    r.px(sx + 7, sy + 5, 2, 1, '#ffffff');
  }

  // Druckrohr an der rechten Wand (Spalte 13, Reihen 2-10): nach dem Loesen
  // stroemt Wasser hindurch, ein Fehlstart laesst es kurz ruckeln
  function drawRohr(r, t) {
    var x = 13 * TILE + 3, y0 = 2 * TILE, y1 = 11 * TILE;
    var wackel = (performance.now() - stotter < 700) ? Math.round(Math.sin(t / 30) * 1) : 0;
    r.px(x + wackel, y0, 10, y1 - y0, '#5a6a7a');
    r.px(x + 1 + wackel, y0, 2, y1 - y0, '#8a9aac');
    r.px(x + 8 + wackel, y0, 2, y1 - y0, '#3e4a58');
    for (var y = y0 + 8; y < y1; y += 24) r.px(x - 1 + wackel, y, 12, 2, '#3e4a58');   // Flansche
    // Schauglas mit Wasserstand
    var gy = 5 * TILE;
    r.px(x + 2 + wackel, gy, 6, 28, '#1a2430');
    if (solved) {
      for (var k = 0; k < 28; k += 4) {
        var ph = (k + Math.floor(t / 60)) % 8;
        r.px(x + 3 + wackel, gy + k + (ph > 3 ? 1 : 0), 4, 2, ph > 3 ? '#8ad8f0' : '#4aa8d8');
      }
    } else {
      r.px(x + 3 + wackel, gy + 22, 4, 6, '#2a5a7a');   // nur ein Rest Wasser
    }
  }

  return {
    FORMEL: 'y = x² − 2x − 1',
    objects: objects,
    schalte: schalte,
    starte: starte,
    term: term,
    bake: bake,
    draw: draw,
    drawRohr: drawRohr,
    isSolved: function () { return solved; },
    setSolved: setSolved
  };
})();
