// taskui.js: Aufgabenbox - pausiert das Spiel und stellt eine Aufgabe
// Strukturierte Eingabefelder, Zahlenblock für Touch und Maus, gestufte Fehler:
// Jeder Fehler kostet ein Herz; 2. Fehler = Hinweis, 3. Fehler = Lösung zeigen.
// Sind alle Herzen weg, wird sofort die Lösung gezeigt und die Aufgabe beendet.
// Richtig/falsch nie nur über Farbe: grüner Haken bzw. rotes Kreuz.
var TaskUi = (function () {
  'use strict';

  var BOX = { x: 6, y: 24, w: 244, h: 194 };
  var FEEDBACK_TIME = 1.2;    // Sekunden für Haken/Kreuz
  var SOLUTION_TIME = 3.0;    // Sekunden, die die Lösung steht bleibt

  var active = false;
  var task = null;            // aktuelle Aufgabe (aus tasks.js)
  var values = [];            // Eingabe je Feld als Zeichenkette
  var fieldIndex = 0;         // aktives Eingabefeld
  var graphVals = { a: 1, xs: 0, ys: 0 }; // eingestellte Parabel (Graph-Modus)
  var graphSel = 0;           // gewählter Parameter im Graph-Modus
  var errors = 0;             // Fehlerzähler für die Stufen
  var hintShown = false;
  var phase = 'input';        // 'input' | 'right' | 'wrong' | 'solution'
  var phaseTime = 0;
  var onResult = null;        // Rueckmeldung fuer den Kampf: (geloest, fehler)
  var prevDirs = {};          // vorheriger Zustand der Richtungstasten

  // Links/Rechts wie A/B genau einmal pro Tastendruck auswerten
  function pressedDir(input, dir) {
    var now = input.isDown(dir);
    var once = now && !prevDirs[dir];
    prevDirs[dir] = now;
    return once;
  }

  // Zahlenblock: 4 Spalten, letzte Spalte mit Sondertasten
  var KEYS = [
    ['7', '8', '9', 'C'],
    ['4', '5', '6', '-'],
    ['1', '2', '3', ','],
    ['0', '<', 'OK', '']
  ];
  var KEY_W = 30, KEY_H = 16, GAP = 2;
  var PAD_X = Math.floor((Render.WIDTH - (KEY_W * 4 + GAP * 3)) / 2);
  var PAD_Y = 128;

  function keyRect(row, col) {
    return {
      x: PAD_X + col * (KEY_W + GAP),
      y: PAD_Y + row * (KEY_H + GAP),
      w: KEY_W, h: KEY_H
    };
  }

  function fieldRect(i) {
    var n = task.felder.length;
    var w = 42, gap = 10;
    var total = n * w + (n - 1) * gap;
    var x = Math.floor((Render.WIDTH - total) / 2) + i * (w + gap);
    return { x: x, y: 84, w: w, h: 18 };
  }

  // --- Graph-Modus: Parabel mit Plus/Minus-Tasten einstellen ---------------
  var GRAPH = { x: 14, y: 66, w: 148, h: 68, sx: 16, sy: 6 };
  var BTN = { w: 18, h: 14 };   // Größe der Plus/Minus-Tasten

  // Tasten neben dem Koordinatensystem: eine Zeile je einstellbarem Parameter
  function graphBtnRect(row, plus) {
    return {
      x: plus ? 222 : 170,
      y: GRAPH.y + 2 + row * (BTN.h + 8),
      w: BTN.w, h: BTN.h
    };
  }

  function okRect() {
    return { x: 170, y: GRAPH.y + 64, w: 70, h: 16 };
  }

  // Fester Wert aus der Aufgabe oder aktuelle Einstellung
  function graphVal(key) {
    return task.graphFix && task.graphFix[key] !== undefined ? task.graphFix[key] : graphVals[key];
  }

  // Schrittweiten und Bereiche: a in 0,5er-Schritten, xs/ys in 1er-Schritten
  function graphAdjust(key, dir) {
    var step = key === 'a' ? 0.5 : 1;
    var min = key === 'a' ? -3 : key === 'xs' ? -4 : -5;
    var max = key === 'a' ? 3 : key === 'xs' ? 4 : 5;
    var v = Math.round((graphVals[key] + dir * step) * 2) / 2;
    graphVals[key] = Math.max(min, Math.min(max, v));
  }

  // --- Aufgabe oeffnen -----------------------------------------------------
  function open(typeId, seed, resultCallback, kontext) {
    // Ohne Kampf (Probeaufgabe): leere Herzen wie an einer Rastquelle auffuellen
    if (!resultCallback && Hud.getHearts() === 0) Hud.fill();
    task = Tasks.make(typeId, seed, kontext);
    values = task.felder.map(function () { return ''; });
    fieldIndex = 0;
    graphVals = { a: 1, xs: 0, ys: 0 };
    graphSel = 0;
    errors = 0;
    hintShown = false;
    phase = 'input';
    phaseTime = 0;
    onResult = resultCallback || null;
    active = true;
  }

  function finish(solved) {
    active = false;
    task = null;
    if (onResult) onResult(solved, errors);
  }

  function allEmpty() {
    for (var i = 0; i < values.length; i++) if (values[i] !== '') return false;
    return true;
  }

  // --- Eingabe in das aktive Feld ------------------------------------------
  function typeChar(ch) {
    var v = values[fieldIndex];
    if (ch === 'C') { values[fieldIndex] = ''; return; }
    if (ch === '<') { values[fieldIndex] = v.slice(0, -1); return; }
    if (ch === '-') {                          // Vorzeichen umschalten
      values[fieldIndex] = v.charAt(0) === '-' ? v.slice(1) : '-' + v;
      return;
    }
    if (ch === ',') {
      if (v.indexOf(',') < 0 && v.length > 0) values[fieldIndex] = v + ',';
      return;
    }
    if (v.replace('-', '').replace(',', '').length < 4) values[fieldIndex] = v + ch;
  }

  // Eingabe pruefen: Komma und Punkt gleichwertig; im Graph-Modus
  // werden die eingestellten Werte direkt verglichen
  function checkAnswer() {
    if (task.graph) {
      for (var g = 0; g < task.felder.length; g++) {
        if (Math.abs(graphVals[task.felder[g].key] - task.loesung[g]) > 1e-6) {
          onWrong();
          return;
        }
      }
      phase = 'right';
      phaseTime = 0;
      return;
    }
    for (var i = 0; i < values.length; i++) {
      if (values[i] === '' || values[i] === '-' || values[i] === ',') return;
    }
    for (var j = 0; j < values.length; j++) {
      var eingabe = parseFloat(values[j].replace(',', '.'));
      if (Math.abs(eingabe - task.loesung[j]) > 1e-6) {
        onWrong();
        return;
      }
    }
    phase = 'right';
    phaseTime = 0;
  }

  function onWrong() {
    errors++;
    Hud.loseHeart();
    // dritter Fehler oder keine Herzen mehr: Lösung zeigen, Aufgabe endet
    if (errors >= 3 || (onResult && Hud.getHearts() === 0)) {
      phase = 'solution';
    } else {
      phase = 'wrong';
      if (errors === 2) hintShown = true;
    }
    phaseTime = 0;
  }

  // --- Tastatur (Ziffern direkt, A = pruefen, B = abbrechen) ---------------
  function onKeyDown(e) {
    if (!active || phase !== 'input' || task.graph) return;
    if (e.key >= '0' && e.key <= '9') { typeChar(e.key); e.preventDefault(); }
    else if (e.key === ',' || e.key === '.') { typeChar(','); e.preventDefault(); }
    else if (e.key === '-') { typeChar('-'); e.preventDefault(); }
  }

  // Tippen/klicken in die Box: Felder, Zahlenblock und Graph-Tasten treffen
  function onPointerDown(e) {
    if (!active || phase !== 'input') return;
    var rect = Render.getCanvas().getBoundingClientRect();
    var lx = (e.clientX - rect.left) / rect.width * Render.WIDTH;
    var ly = (e.clientY - rect.top) / rect.height * Render.HEIGHT;
    if (task.graph) {
      for (var b = 0; b < task.felder.length; b++) {
        var minus = graphBtnRect(b, false);
        var plus = graphBtnRect(b, true);
        if (lx >= minus.x && lx < minus.x + minus.w && ly >= minus.y && ly < minus.y + minus.h) {
          graphAdjust(task.felder[b].key, -1);
          e.preventDefault();
          return;
        }
        if (lx >= plus.x && lx < plus.x + plus.w && ly >= plus.y && ly < plus.y + plus.h) {
          graphAdjust(task.felder[b].key, 1);
          e.preventDefault();
          return;
        }
      }
      var ok = okRect();
      if (lx >= ok.x && lx < ok.x + ok.w && ly >= ok.y && ly < ok.y + ok.h) {
        checkAnswer();
        e.preventDefault();
      }
      return;
    }
    for (var i = 0; i < task.felder.length; i++) {
      var f = fieldRect(i);
      if (lx >= f.x && lx < f.x + f.w && ly >= f.y && ly < f.y + f.h) fieldIndex = i;
    }
    for (var row = 0; row < KEYS.length; row++) {
      for (var col = 0; col < KEYS[row].length; col++) {
        var k = KEYS[row][col];
        if (!k) continue;
        var r = keyRect(row, col);
        if (lx >= r.x && lx < r.x + r.w && ly >= r.y && ly < r.y + r.h) {
          pressKey(k);
          e.preventDefault();
          return;
        }
      }
    }
  }

  function pressKey(k) {
    if (k === 'OK') { checkAnswer(); return; }
    typeChar(k);
  }

  function init() {
    window.addEventListener('keydown', onKeyDown);
    Render.getCanvas().addEventListener('pointerdown', onPointerDown);
  }

  // --- Ablauf ---------------------------------------------------------------
  function update(dt, input) {
    if (!active) return;
    if (phase === 'input') {
      // Ein Kampf laesst sich nicht abbrechen; nur die Probeaufgabe
      // auf der Testseite kann mit B abgebrochen werden.
      // Ruecktaste (Tastatur) loescht eine Ziffer; sind alle Felder leer,
      // bricht sie die Probeaufgabe ab wie B.
      if (task.graph) {
        // Graph-Modus: links/rechts Parameter waehlen, hoch/runter einstellen
        if (pressedDir(input, 'left')) graphSel = (graphSel + task.felder.length - 1) % task.felder.length;
        if (pressedDir(input, 'right')) graphSel = (graphSel + 1) % task.felder.length;
        if (pressedDir(input, 'up')) graphAdjust(task.felder[graphSel].key, 1);
        if (pressedDir(input, 'down')) graphAdjust(task.felder[graphSel].key, -1);
        if (input.pressed('b') && !onResult) { finish(false); return; }
        if (input.pressed('a')) checkAnswer();
        return;
      }
      var del = input.pressed('del');
      var b = input.pressed('b');
      if (del) {
        if (!onResult && allEmpty()) { finish(false); return; }
        typeChar('<');
      } else if (b && !onResult) { finish(false); return; }
      if (input.pressed('a')) checkAnswer();
      if (pressedDir(input, 'left')) fieldIndex = (fieldIndex + task.felder.length - 1) % task.felder.length;
      if (pressedDir(input, 'right')) fieldIndex = (fieldIndex + 1) % task.felder.length;
      return;
    }
    phaseTime += dt;
    var dauer = phase === 'solution' ? SOLUTION_TIME : FEEDBACK_TIME;
    if (phaseTime >= dauer) {
      if (phase === 'right') finish(true);
      else if (phase === 'solution') finish(false);
      else {
        phase = 'input';
        values = task.felder.map(function () { return ''; });
      }
    }
  }

  // --- Zeichnen ---------------------------------------------------------------
  function draw(r) {
    if (!active) return;
    var ctx = r.getCtx();

    // Abblenden und Box mit Rahmen (wie die Dialogbox)
    r.px(0, 0, Render.WIDTH, Render.HEIGHT, 'rgba(10,8,16,0.55)');
    r.px(BOX.x + 2, BOX.y, BOX.w - 4, BOX.h, '#1c1828');
    r.px(BOX.x, BOX.y + 2, BOX.w, BOX.h - 4, '#1c1828');
    r.px(BOX.x + 1, BOX.y + 1, BOX.w - 2, BOX.h - 2, '#1c1828');
    r.px(BOX.x + 3, BOX.y + 1, BOX.w - 6, 1, '#efe4c4');
    r.px(BOX.x + 3, BOX.y + BOX.h - 2, BOX.w - 6, 1, '#efe4c4');
    r.px(BOX.x + 1, BOX.y + 3, 1, BOX.h - 6, '#efe4c4');
    r.px(BOX.x + BOX.w - 2, BOX.y + 3, 1, BOX.h - 6, '#efe4c4');

    Font.draw(ctx, 'Aufgabe', BOX.x + 10, BOX.y + 7, '#f0c040');

    // Fragetext (maximal drei Zeilen, im Graph-Modus zwei)
    var lines = Font.wrap(task.frage, BOX.w - 20).slice(0, task.graph ? 2 : 3);
    for (var i = 0; i < lines.length; i++) {
      Font.draw(ctx, lines[i], BOX.x + 10, BOX.y + 20 + i * Font.LINE, '#f6f0e2');
    }

    // Graph-Modus: Koordinatensystem, live gezeichnete Parabel, Tasten
    if (task.graph) {
      Font.draw(ctx, Tasks.spfText(graphVals.a, graphVal('xs'), graphVal('ys')),
        BOX.x + 10, BOX.y + 20 + lines.length * Font.LINE, '#f0c040');
      drawGraph(r, ctx);
      if (phase === 'right') drawCheck(r, 200, 150);
      if (phase === 'wrong') drawCross(r, 200, 150);
      if (hintShown && phase !== 'solution') {
        var ghl = Font.wrap(task.hinweis, 180);
        for (var gh = 0; gh < ghl.length && gh < 2; gh++) {
          Font.draw(ctx, ghl[gh], BOX.x + 10, 152 + gh * Font.LINE, '#f0c040');
        }
      }
      if (phase === 'solution') {
        Font.draw(ctx, 'L\u00f6sung:', BOX.x + 10, 152, '#e8344a');
        Font.draw(ctx, task.loesungstext, BOX.x + 10, 164, '#f6f0e2');
      }
      var gfuss = onResult ? 'A/OK: pr\u00fcfen' : 'A/OK: pr\u00fcfen  B: abbrechen';
      Font.draw(ctx, gfuss, BOX.x + 10, BOX.y + BOX.h - 12, '#8a8496');
      return;
    }

    // Eingabefelder mit Beschriftung
    for (var f = 0; f < task.felder.length; f++) {
      var fr = fieldRect(f);
      r.px(fr.x, fr.y, fr.w, fr.h, '#0e0c14');
      var ramen = f === fieldIndex && phase === 'input' ? '#f0c040' : '#efe4c4';
      r.px(fr.x, fr.y, fr.w, 1, ramen);
      r.px(fr.x, fr.y + fr.h - 1, fr.w, 1, ramen);
      r.px(fr.x, fr.y, 1, fr.h, ramen);
      r.px(fr.x + fr.w - 1, fr.y, 1, fr.h, ramen);
      Font.draw(ctx, task.felder[f].label, fr.x, fr.y - 10, '#8a8496');
      var text = values[f] || ' ';
      Font.draw(ctx, text, fr.x + 6, fr.y + 5, '#f6f0e2');
    }

    // Rueckmeldung: Haken, Kreuz, Hinweis oder Loesung
    if (phase === 'right') drawCheck(r, 212, 106);
    if (phase === 'wrong') drawCross(r, 212, 106);
    if (hintShown && phase !== 'solution') {
      var hl = Font.wrap(task.hinweis, BOX.w - 20);
      for (var h = 0; h < hl.length && h < 2; h++) {
        Font.draw(ctx, hl[h], BOX.x + 10, 108 + h * Font.LINE, '#f0c040');
      }
    }
    if (phase === 'solution') {
      Font.draw(ctx, 'Lösung:', BOX.x + 10, 108, '#e8344a');
      Font.draw(ctx, task.loesungstext, BOX.x + 10, 120, '#f6f0e2');
    }

    // Zahlenblock
    for (var row = 0; row < KEYS.length; row++) {
      for (var col = 0; col < KEYS[row].length; col++) {
        var k = KEYS[row][col];
        if (!k) continue;
        var kr = keyRect(row, col);
        var farbe = k === 'OK' ? '#3a6a3a' : k === 'C' || k === '<' ? '#4a3a5a' : '#2e2a3e';
        r.px(kr.x, kr.y, kr.w, kr.h, farbe);
        r.px(kr.x, kr.y, kr.w, 1, '#efe4c4');
        r.px(kr.x, kr.y + kr.h - 1, kr.w, 1, '#efe4c4');
        r.px(kr.x, kr.y, 1, kr.h, '#efe4c4');
        r.px(kr.x + kr.w - 1, kr.y, 1, kr.h, '#efe4c4');
        var label = k === 'OK' ? 'OK' : k === 'C' ? 'C' : k;
        Font.draw(ctx, label, kr.x + Math.floor((kr.w - Font.width(label)) / 2), kr.y + 5, '#f6f0e2');
      }
    }
    var fuss = onResult ? 'A/OK: prüfen  <: löschen' : 'A/OK: prüfen  B: abbrechen';
    Font.draw(ctx, fuss, BOX.x + 10, BOX.y + BOX.h - 12, '#8a8496');
  }

  // Koordinatensystem mit live gezeichneter Parabel und S/P-Marken
  // S ist ein kleines Quadrat, P ein Kreuz (Form statt nur Farbe)
  function drawGraph(r, ctx) {
    var cx = GRAPH.x + GRAPH.w / 2;
    var cy = GRAPH.y + GRAPH.h / 2;

    r.px(GRAPH.x, GRAPH.y, GRAPH.w, GRAPH.h, '#0e0c14');
    r.px(GRAPH.x, GRAPH.y, GRAPH.w, 1, '#efe4c4');
    r.px(GRAPH.x, GRAPH.y + GRAPH.h - 1, GRAPH.w, 1, '#efe4c4');
    r.px(GRAPH.x, GRAPH.y, 1, GRAPH.h, '#efe4c4');
    r.px(GRAPH.x + GRAPH.w - 1, GRAPH.y, 1, GRAPH.h, '#efe4c4');

    // Gitter (1 Einheit) und Achsen
    for (var g = -4; g <= 4; g++) {
      r.px(cx + g * GRAPH.sx, GRAPH.y + 1, 1, GRAPH.h - 2, '#221e30');
    }
    for (var h = -4; h <= 4; h++) {
      r.px(GRAPH.x + 1, cy + h * GRAPH.sy, GRAPH.w - 2, 1, '#221e30');
    }
    r.px(cx, GRAPH.y + 1, 1, GRAPH.h - 2, '#8a8496');
    r.px(GRAPH.x + 1, cy, GRAPH.w - 2, 1, '#8a8496');

    // Parabel aus der aktuellen Einstellung, auf das Panel begrenzt
    var a = graphVals.a;
    var xs = graphVal('xs');
    var ys = graphVal('ys');
    ctx.save();
    ctx.beginPath();
    ctx.rect(GRAPH.x + 1, GRAPH.y + 1, GRAPH.w - 2, GRAPH.h - 2);
    ctx.clip();
    var prev = null;
    for (var col = 0; col < GRAPH.w; col++) {
      var wx = (col - GRAPH.w / 2) / GRAPH.sx;
      var wy = a * (wx - xs) * (wx - xs) + ys;
      var py = GRAPH.h / 2 - wy * GRAPH.sy;
      if (prev !== null) {
        var y0 = Math.min(py, prev);
        ctx.fillStyle = '#f0c040';
        ctx.fillRect(GRAPH.x + col, GRAPH.y + y0, 1, Math.abs(py - prev) + 1);
      }
      prev = py;
    }

    // Punkt S (folgt der Einstellung bzw. der Aufgabe), ebenfalls begrenzt.
    // Punkt P ist zunaechst versteckt: Ohne ihn laesst sich a nicht visuell
    // einpassen, sondern muss gerechnet werden. Nach dem ersten Fehler
    // (oder in der Loesung) erscheint P als visuelle Kontrolle.
    var sxp = cx + xs * GRAPH.sx;
    var syp = cy - ys * GRAPH.sy;
    r.px(sxp - 2, syp - 2, 4, 4, '#f6f0e2');
    Font.draw(ctx, 'S', sxp + 4, syp - 3, '#f6f0e2');
    if (errors > 0 || phase !== 'input') {
      var pxp = cx + task.graphFix.xp * GRAPH.sx;
      var pyp = cy - task.graphFix.yp * GRAPH.sy;
      for (var c = -2; c <= 2; c++) {
        r.px(pxp + c, pyp + c, 1, 1, '#7ec97e');
        r.px(pxp + c, pyp - c, 1, 1, '#7ec97e');
      }
      Font.draw(ctx, 'P', pxp + 4, pyp - 3, '#7ec97e');
    }
    ctx.restore();

    // Eine Zeile je einstellbarem Parameter: Minus, Wert, Plus
    for (var f = 0; f < task.felder.length; f++) {
      var key = task.felder[f].key;
      var minus = graphBtnRect(f, false);
      var plus = graphBtnRect(f, true);
      var sel = f === graphSel && phase === 'input';
      var ramen = sel ? '#f0c040' : '#efe4c4';
      var farbe = sel ? '#3a3450' : '#2e2a3e';
      r.px(minus.x, minus.y, minus.w, minus.h, farbe);
      r.px(minus.x, minus.y, minus.w, 1, ramen);
      r.px(minus.x, minus.y + minus.h - 1, minus.w, 1, ramen);
      r.px(minus.x, minus.y, 1, minus.h, ramen);
      r.px(minus.x + minus.w - 1, minus.y, 1, minus.h, ramen);
      r.px(plus.x, plus.y, plus.w, plus.h, farbe);
      r.px(plus.x, plus.y, plus.w, 1, ramen);
      r.px(plus.x, plus.y + plus.h - 1, plus.w, 1, ramen);
      r.px(plus.x, plus.y, 1, plus.h, ramen);
      r.px(plus.x + plus.w - 1, plus.y, 1, plus.h, ramen);
      Font.draw(ctx, '-', minus.x + Math.floor((minus.w - Font.width('-')) / 2), minus.y + 4, '#f6f0e2');
      Font.draw(ctx, '+', plus.x + Math.floor((plus.w - Font.width('+')) / 2), plus.y + 4, '#f6f0e2');
      var wert = key + '=' + Tasks.fmt(graphVals[key]);
      Font.draw(ctx, wert, 190 + Math.floor((30 - Font.width(wert)) / 2), minus.y + 4, sel ? '#f0c040' : '#f6f0e2');
    }

    // OK-Taste
    var ok = okRect();
    r.px(ok.x, ok.y, ok.w, ok.h, '#3a6a3a');
    r.px(ok.x, ok.y, ok.w, 1, '#efe4c4');
    r.px(ok.x, ok.y + ok.h - 1, ok.w, 1, '#efe4c4');
    r.px(ok.x, ok.y, 1, ok.h, '#efe4c4');
    r.px(ok.x + ok.w - 1, ok.y, 1, ok.h, '#efe4c4');
    Font.draw(ctx, 'OK', ok.x + Math.floor((ok.w - Font.width('OK')) / 2), ok.y + 5, '#f6f0e2');
  }

  // Kleiner grüner Haken (Form, nicht nur Farbe)
  function drawCheck(r, x, y) {
    for (var i = 0; i < 4; i++) r.px(x + i, y + 6 - i, 2, 2, '#7ec97e');
    for (var j = 0; j < 5; j++) r.px(x + 4 + j, y + 2 + j, 2, 2, '#7ec97e');
  }

  // Kleines rotes Kreuz (Form, nicht nur Farbe)
  function drawCross(r, x, y) {
    for (var i = 0; i < 9; i++) {
      r.px(x + i, y + i, 2, 2, '#e8344a');
      r.px(x + 8 - i, y + i, 2, 2, '#e8344a');
    }
  }

  return {
    init: init,
    open: open,
    update: update,
    draw: draw,
    isActive: function () { return active; }
  };
})();
