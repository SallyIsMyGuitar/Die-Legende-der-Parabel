// taskui.js: Aufgabenbox - pausiert das Spiel und stellt eine Aufgabe
// Strukturierte Eingabefelder, Zahlenblock für Touch und Maus, gestufte Fehler:
// 1. Fehler = Herzverlust, 2. Fehler = Hinweis, 3. Fehler = Lösung zeigen.
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
  var errors = 0;             // Fehlerzähler für die Stufen
  var hintShown = false;
  var phase = 'input';        // 'input' | 'right' | 'wrong' | 'solution'
  var phaseTime = 0;
  var onResult = null;        // Rueckmeldung fuer den Kampf: true = geloest
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

  // --- Aufgabe oeffnen -----------------------------------------------------
  function open(typeId, seed, resultCallback) {
    // Ohne Kampf (Probeaufgabe): leere Herzen wie an einer Rastquelle auffuellen
    if (!resultCallback && Hud.getHearts() === 0) Hud.setHearts(3);
    task = Tasks.make(typeId, seed);
    values = task.felder.map(function () { return ''; });
    fieldIndex = 0;
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
    if (onResult) onResult(solved);
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

  // Eingabe pruefen: Komma und Punkt gleichwertig
  function checkAnswer() {
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
    if (errors >= 3) {
      phase = 'solution';
    } else {
      phase = 'wrong';
      if (errors === 2) hintShown = true;
    }
    phaseTime = 0;
  }

  // --- Tastatur (Ziffern direkt, A = pruefen, B = abbrechen) ---------------
  function onKeyDown(e) {
    if (!active || phase !== 'input') return;
    if (e.key >= '0' && e.key <= '9') { typeChar(e.key); e.preventDefault(); }
    else if (e.key === ',' || e.key === '.') { typeChar(','); e.preventDefault(); }
    else if (e.key === '-') { typeChar('-'); e.preventDefault(); }
  }

  // Tippen/klicken in die Box: Felder und Zahlenblock treffen
  function onPointerDown(e) {
    if (!active || phase !== 'input') return;
    var rect = Render.getCanvas().getBoundingClientRect();
    var lx = (e.clientX - rect.left) / rect.width * Render.WIDTH;
    var ly = (e.clientY - rect.top) / rect.height * Render.HEIGHT;
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
      if (input.pressed('b')) { finish(false); return; }   // abbrechen
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

    // Fragetext (maximal drei Zeilen)
    var lines = Font.wrap(task.frage, BOX.w - 20).slice(0, 3);
    for (var i = 0; i < lines.length; i++) {
      Font.draw(ctx, lines[i], BOX.x + 10, BOX.y + 20 + i * Font.LINE, '#f6f0e2');
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
      Font.draw(ctx, 'Loesung:', BOX.x + 10, 108, '#e8344a');
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
    Font.draw(ctx, 'A: pruefen  B: abbrechen', BOX.x + 10, BOX.y + BOX.h - 12, '#8a8496');
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
