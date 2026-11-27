// schaltwarte.js: Raetsel "Schaltwarte" vor dem Boss des Wasserkraftwerks
// (Dungeon 3, allgemeine Form). Zwei Turbinen muessen nacheinander laufen:
//  Turbine 1: Parabel durch drei Anschluesse P1, P2, P3. Die Punkte stehen
//             nicht von Anfang an auf dem Bildschirm, sondern werden an drei
//             Manometern am Druckrohr abgelesen (dann erscheinen sie).
//             Loesung: y = −x² + 2x + 2.
//  Turbine 2: Vorgabe Scheitel S(−1|−1) und a = 2; umformen in die
//             allgemeine Form. Loesung: y = 2x² + 4x + 1.
// Drei Hebel stellen a, b und c ein. Die Parabel zeigt der Bildschirm erst
// beim Testlauf (Startschalter), danach stehen Haken bzw. Kreuz an den
// Punkten, bis ein Hebel bewegt wird. Nach drei Fehlstarts springen alle
// Hebel zurueck (Druckabfall). Kein Herzverlust, keine Fehlerstatistik.
// Erst wenn beide Turbinen laufen, hebt sich das Gitter zum Boss.
var Schaltwarte = (function () {
  'use strict';

  var TILE = 16;

  // Feste Loesungen (von der Lehrkraft zu pruefen)
  // lx/ly: Lage der Beschriftung neben dem Punkt
  var PUNKTE = [{ x: 0, y: 2, lx: 4, ly: -9 }, { x: -1, y: -1, lx: 4, ly: 2 }, { x: 2, y: 2, lx: 5, ly: 2 }];
  var LOESUNG1 = { a: -1, b: 2, c: 2 };
  var SCHEITEL2 = { x: -1, y: -1, a: 2 };
  var LOESUNG2 = { a: 2, b: 4, c: 1 };
  var MAX_FEHL = 3;              // Fehlstarts bis zum Druckabfall

  // Werte der Hebel (A schaltet weiter, am Ende wieder von vorn)
  var WERTE = {
    a: [-2, -1, 1, 2],
    b: [-4, -3, -2, -1, 0, 1, 2, 3, 4],
    c: [-3, -2, -1, 0, 1, 2, 3]
  };
  var START = { a: 1, b: 0, c: 0 };

  // Lage im Raum: Hebel a, b, c in Reihe 9, Startschalter (10,9),
  // Manometer am Druckrohr (Spalte 12, Reihen 3, 5, 7)
  var HEBEL = { a: [3, 9], b: [5, 9], c: [7, 9] };
  var SCHALTER = [10, 9];
  var MANO = [[12, 3], [12, 5], [12, 7]];

  // Bildschirm: Kacheln 2-7 / 2-7 (96 x 96 Pixel), Koordinatensystem
  // x = -2 ... 4, y = -3 ... 4, 12 Pixel je Einheit
  var SCR = { x: 2 * TILE, y: 2 * TILE, w: 6 * TILE, h: 6 * TILE };
  var U = 12;
  var OX = SCR.x + 6 + 2 * U;   // Pixel von x = 0
  var OY = SCR.y + 6 + 4 * U;   // Pixel von y = 0

  var wert = { a: START.a, b: START.b, c: START.c };
  var stufe = 1;                 // 1 = Turbine 1, 2 = Turbine 2, 3 = beide laufen
  var gelesen = [false, false, false];
  var test = null;               // Hebelwerte des letzten Testlaufs (oder null)
  var fehl = 0;                  // Fehlstarts seit dem letzten Druckabfall
  var stotter = 0;               // Zeitpunkt des letzten Fehlstarts

  function f(x) { return wert.a * x * x + wert.b * x + wert.c; }

  function trifft(p) { return f(p.x) === p.y; }

  function gleich(l) { return wert.a === l.a && wert.b === l.b && wert.c === l.c; }

  // Parabel und Haken/Kreuz nur nach dem Testlauf, solange kein Hebel bewegt wurde
  function zeigeTest() {
    if (stufe === 3) return true;
    return !!test && test.a === wert.a && test.b === wert.b && test.c === wert.c;
  }

  // Hebel weiterschalten; Rueckgabe: neuer Wert
  function schalte(k) {
    if (stufe === 3) return wert[k];
    var list = WERTE[k];
    var i = list.indexOf(wert[k]);
    wert[k] = list[(i + 1) % list.length];
    return wert[k];
  }

  // Manometer n ablesen (0 ... 2); Rueckgabe: Text fuer den Dialog
  function lies(n) {
    var p = PUNKTE[n];
    gelesen[n] = true;
    return 'Manometer ' + (n + 1) + ': Anschluss P' + (n + 1) + ' liegt bei x = ' + Tasks.fmt(p.x) +
      ' und y = ' + Tasks.fmt(p.y) + '. Auf dem Bildschirm erscheint P' + (n + 1) + '(' +
      Tasks.fmt(p.x) + '|' + Tasks.fmt(p.y) + ').';
  }

  // Startschalter; Rueckgabe: 'already' | 'unread' | 'stage1' | 'solved' | 'wrong' | 'reset'
  function starte() {
    if (stufe === 3) return 'already';
    if (stufe === 1 && gelesen.indexOf(false) >= 0) return 'unread';
    test = { a: wert.a, b: wert.b, c: wert.c };
    if (stufe === 1 && gleich(LOESUNG1)) { stufe = 2; fehl = 0; return 'stage1'; }
    if (stufe === 2 && gleich(LOESUNG2)) { stufe = 3; return 'solved'; }
    stotter = performance.now();
    fehl++;
    if (fehl >= MAX_FEHL) {
      // Druckabfall: Hebel zurueck auf die Startwerte, Bildschirm leer
      fehl = 0;
      test = null;
      wert = { a: START.a, b: START.b, c: START.c };
      return 'reset';
    }
    return 'wrong';
  }

  // Turbine 1 laeuft schon (aus dem Spielstand)
  function setStage1() {
    if (stufe >= 2) return;
    stufe = 2;
    gelesen = [true, true, true];
    wert = { a: LOESUNG1.a, b: LOESUNG1.b, c: LOESUNG1.c };
  }

  function setSolved() {
    stufe = 3;
    gelesen = [true, true, true];
    wert = { a: LOESUNG2.a, b: LOESUNG2.b, c: LOESUNG2.c };
  }

  // Gleichung als Text, z. B. "y = −x² + 2x + 2"
  function termVon(a, b, c) {
    var s = a === 1 ? 'x²' : (a === -1 ? '−x²' : (a < 0 ? '−' + (-a) : a) + 'x²');
    if (b) s += (b > 0 ? ' + ' : ' − ') + (Math.abs(b) === 1 ? '' : Math.abs(b)) + 'x';
    if (c) s += (c > 0 ? ' + ' : ' − ') + Math.abs(c);
    return 'y = ' + s;
  }

  function term() { return termVon(wert.a, wert.b, wert.c); }

  // Gespraechsziele: drei Hebel, Startschalter und drei Manometer
  function objects() {
    var list = [];
    ['a', 'b', 'c'].forEach(function (k) {
      var t = HEBEL[k];
      list.push({ tiles: [t], x: t[0] * TILE, y: t[1] * TILE, name: 'Hebel ' + k, texts: [], action: 'hebel', hebel: k });
    });
    list.push({ tiles: [SCHALTER], x: SCHALTER[0] * TILE, y: SCHALTER[1] * TILE, name: 'Startschalter', texts: [], action: 'start' });
    MANO.forEach(function (t, n) {
      list.push({ tiles: [t], x: t[0] * TILE, y: t[1] * TILE, name: 'Manometer ' + (n + 1), texts: [], action: 'mano', mano: n });
    });
    return list;
  }

  // --- Zeichnen ---------------------------------------------------------------

  // Gehaeuse von Bildschirm, Hebeln, Schalter und Manometern (vorberechnet)
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
    // Manometer: Abzweig vom Druckrohr mit runder Messuhr
    MANO.forEach(function (t, n) {
      var x = t[0] * TILE, y = t[1] * TILE;
      r.ellipse(x + 8, y + 15, 6, 2, 'rgba(10,14,20,0.45)');
      r.px(x + 8, y + 6, 8, 3, '#5a6a7a');          // Rohrstutzen zum Druckrohr
      r.px(x + 8, y + 6, 8, 1, '#8a9aac');
      r.px(x + 7, y + 9, 2, 6, '#4a5260');          // Standfuss
      r.ellipse(x + 8, y + 7, 6, 6, '#c8a850');     // Messingring
      r.ellipse(x + 8, y + 7, 5, 5, '#f0ece0');     // Zifferblatt
      r.px(x + 4, y + 7, 1, 1, '#3a4250');
      r.px(x + 12, y + 7, 1, 1, '#3a4250');
      r.px(x + 8, y + 3, 1, 1, '#3a4250');
      Font.draw(r.getCtx(), String(n + 1), x + 1, y + 10, '#c8f0d0');
    });
  }

  function hebelSockel(r, tx, ty) {
    var x = tx * TILE, y = ty * TILE;
    r.ellipse(x + 8, y + 15, 6, 2, 'rgba(10,14,20,0.45)');
    r.px(x + 3, y + 9, 10, 6, '#4a5260');
    r.px(x + 3, y + 9, 10, 1, '#7a8494');
  }

  // kleiner Haken bzw. Kreuz (Form und Farbe, nie nur Farbe)
  function marke(r, x, y, ok) {
    r.px(x - 1, y - 1, 7, 7, '#0e1a14');
    if (ok) {
      r.px(x, y + 2, 1, 1, '#8af0a0'); r.px(x + 1, y + 3, 1, 1, '#8af0a0');
      r.px(x + 2, y + 4, 1, 1, '#8af0a0'); r.px(x + 3, y + 2, 1, 2, '#8af0a0');
      r.px(x + 4, y, 1, 2, '#8af0a0');
    } else {
      for (var i = 0; i < 5; i++) {
        r.px(x + i, y + i, 1, 1, '#f07a6a');
        r.px(x + 4 - i, y + i, 1, 1, '#f07a6a');
      }
    }
  }

  // Punktmarke auf dem Bildschirm (Kreuz-Ring)
  function punkt(r, cx, cy, col) {
    r.px(cx - 3, cy - 1, 7, 3, col);
    r.px(cx - 1, cy - 3, 3, 7, col);
    r.px(cx - 1, cy - 1, 3, 3, '#0e1a14');
  }

  // Laufbild: Achsen, Punkte, Parabel (nur im Testlauf), Hebel, Anzeigen
  function draw(r, t) {
    var ctx = r.getCtx(), i, k;
    var ix = SCR.x + 3, iy = SCR.y + 3, iw = SCR.w - 6, ih = SCR.h - 6;
    var zeig = zeigeTest();
    // Gitter und Achsen
    for (k = -2; k <= 4; k++) r.px(OX + k * U, iy, 1, ih, '#173226');
    for (k = -3; k <= 4; k++) r.px(ix, OY - k * U, iw, 1, '#173226');
    r.px(ix, OY, iw, 1, '#3e8a5e');
    r.px(OX, iy, 1, ih, '#3e8a5e');
    // Parabel (gruen) erst beim Testlauf, nur innerhalb des Bildschirms
    // (benachbarte Pixel werden senkrecht verbunden, damit auch steile
    // Stellen als durchgehende Linie erscheinen)
    if (zeig) {
      ctx.fillStyle = stufe === 3 ? '#9af0b0' : '#5ae08a';
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
    }
    var cx, cy;
    if (stufe === 1) {
      // Turbine 1: abgelesene Anschluesse, nach dem Testlauf mit Haken/Kreuz
      PUNKTE.forEach(function (p, n) {
        if (!gelesen[n]) return;
        cx = OX + p.x * U; cy = OY - p.y * U;
        punkt(r, cx, cy, '#e8c060');
        Font.draw(ctx, 'P' + (n + 1), cx + p.lx, cy + p.ly, '#8ad0a8');
        if (zeig) marke(r, cx - 9, cy - 9, trifft(p));
      });
    } else {
      // Turbine 2: Vorgabe Scheitel S und a
      cx = OX + SCHEITEL2.x * U; cy = OY - SCHEITEL2.y * U;
      punkt(r, cx, cy, '#e8c060');
      Font.draw(ctx, 'S', cx + 4, cy + 2, '#8ad0a8');
      if (zeig) marke(r, cx - 9, cy - 9, stufe === 3 || gleich(LOESUNG2));
      var ziel = 'Ziel: S(' + Tasks.fmt(SCHEITEL2.x) + '|' + Tasks.fmt(SCHEITEL2.y) + '), a = ' + Tasks.fmt(SCHEITEL2.a);
      r.px(ix + 1, iy + ih - 10, Font.width(ziel) + 4, 9, '#0e1a14');
      Font.draw(ctx, ziel, ix + 3, iy + ih - 9, '#f8e070');
    }
    // Gleichung oben im Bildschirm, darunter die Turbine
    var s = term();
    r.px(ix + 1, iy + 1, Font.width(s) + 4, 9, '#0e1a14');
    Font.draw(ctx, s, ix + 3, iy + 2, '#c8f0d0');
    if (stufe === 1) {
      r.px(ix + 1, iy + ih - 10, Font.width('Turbine 1') + 4, 9, '#0e1a14');
      Font.draw(ctx, 'Turbine 1', ix + 3, iy + ih - 9, '#f8e070');
    }
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
    // Startschalter: Knopf leuchtet gruen, wenn beide Turbinen laufen, sonst rot;
    // darueber drei Drucklampen (verbleibende Fehlstarts bis zum Druckabfall)
    var sx = SCHALTER[0] * TILE, sy = SCHALTER[1] * TILE;
    r.ellipse(sx + 8, sy + 7, 3, 2, stufe === 3 ? '#5ae08a' : '#e8443a');
    r.px(sx + 7, sy + 5, 2, 1, '#ffffff');
    if (stufe < 3) {
      r.px(sx + 1, sy - 4, 14, 5, '#1c2230');
      for (i = 0; i < MAX_FEHL; i++) {
        r.px(sx + 3 + i * 4, sy - 3, 2, 3, i < MAX_FEHL - fehl ? '#f0c030' : '#3a3a40');
      }
    }
    // Manometer: Zeiger (abgelesen: gruene Kappe)
    MANO.forEach(function (m, n) {
      var x = m[0] * TILE + 8, y = m[1] * TILE + 7;
      var wa = stufe >= 2 ? Math.sin(t / 300 + n) * 0.2 : 0;
      var ang = -2.2 + n * 0.9 + wa;
      for (var j = 1; j <= 3; j++) r.px(Math.round(x + Math.cos(ang) * j), Math.round(y + Math.sin(ang) * j), 1, 1, '#c83a2a');
      r.px(x, y, 1, 1, gelesen[n] ? '#3aa860' : '#3a4250');
    });
  }

  // Druckrohr an der rechten Wand (Spalte 13, Reihen 2-10): Turbine 1 fuellt
  // das Schauglas zur Haelfte, beide Turbinen lassen Wasser stroemen; ein
  // Fehlstart laesst das Rohr kurz ruckeln
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
    var von = stufe === 3 ? 0 : (stufe === 2 ? 14 : 22);
    if (stufe >= 2) {
      for (var k = von; k < 28; k += 4) {
        var ph = (k + Math.floor(t / (stufe === 3 ? 60 : 160))) % 8;
        r.px(x + 3 + wackel, gy + k + (ph > 3 ? 1 : 0), 4, 2, ph > 3 ? '#8ad8f0' : '#4aa8d8');
      }
    } else {
      r.px(x + 3 + wackel, gy + 22, 4, 6, '#2a5a7a');   // nur ein Rest Wasser
    }
  }

  return {
    FORMEL1: termVon(LOESUNG1.a, LOESUNG1.b, LOESUNG1.c),
    FORMEL2: termVon(LOESUNG2.a, LOESUNG2.b, LOESUNG2.c),
    objects: objects,
    schalte: schalte,
    lies: lies,
    starte: starte,
    term: term,
    bake: bake,
    draw: draw,
    drawRohr: drawRohr,
    stufe: function () { return stufe; },
    isStage1: function () { return stufe >= 2; },
    isSolved: function () { return stufe === 3; },
    setStage1: setStage1,
    setSolved: setSolved
  };
})();
