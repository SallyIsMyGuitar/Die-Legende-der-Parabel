// hud.js: Anzeige oben – Herzen links, Gegenstandsplätze rechts
// Ein verlorenes Herz blinkt kurz und zerplatzt dann (Animation).
// Anzahl der Herzen kommt aus config.js
var Hud = (function () {
  'use strict';

  var HEART = [
    '.oo.oo.',
    'oHrorro',
    'orrrrro',
    '.orrro.',
    '..oro..',
    '...o...'
  ];
  var COLORS = { o: '#2a1020', r: '#e8344a', H: '#ffb0b8' };
  var EMPTY = { o: '#2a1020', r: '#3a3444', H: '#55506a' };   // leeres Herz

  var MAX = Config.HEARTS_MAX;
  var hearts = MAX;   // aktuelle Herzen
  var lost = null;    // Animation des zuletzt verlorenen Herzens: { i, t0 }
  var LOST_BLINK = 450, LOST_BURST = 400;   // Millisekunden: Blinken, Zerplatzen

  var LETTERS = {
    A: ['.#.', '#.#', '###', '#.#', '#.#'],
    B: ['##.', '#.#', '##.', '#.#', '##.']
  };

  function sprite(r, rows, x, y, colors) {
    for (var j = 0; j < rows.length; j++) {
      for (var i = 0; i < rows[j].length; i++) {
        var c = colors[rows[j].charAt(i)];
        if (c) r.px(x + i, y + j, 1, 1, c);
      }
    }
  }

  function slot(r, x, y, letter) {
    var s = 16;
    r.px(x + 1, y, s - 2, s, 'rgba(14,18,32,0.55)');
    r.px(x, y + 1, s, s - 2, 'rgba(14,18,32,0.55)');
    // heller Rahmen mit runden Ecken
    r.px(x + 2, y, s - 4, 1, '#efe4c4');
    r.px(x + 2, y + s - 1, s - 4, 1, '#efe4c4');
    r.px(x, y + 2, 1, s - 4, '#efe4c4');
    r.px(x + s - 1, y + 2, 1, s - 4, '#efe4c4');
    r.px(x + 1, y + 1, 1, 1, '#efe4c4');
    r.px(x + s - 2, y + 1, 1, 1, '#efe4c4');
    r.px(x + 1, y + s - 2, 1, 1, '#efe4c4');
    r.px(x + s - 2, y + s - 2, 1, 1, '#efe4c4');
    // Tastenbeschriftung in kleinem Kreis unten rechts
    r.ellipse(x + s - 2, y + s - 2, 4, 4, letter === 'A' ? '#d83a3a' : '#3a86cc');
    sprite(r, LETTERS[letter], x + s - 3, y + s - 4, { '#': '#ffffff' });
  }

  function draw(r) {
    var shadow = { o: 'rgba(0,0,0,0.35)', r: 'rgba(0,0,0,0.35)', H: 'rgba(0,0,0,0.35)' };
    for (var i = 0; i < MAX; i++) {
      sprite(r, HEART, 7 + i * 9, 7, shadow);
      var full = i < hearts;
      // Verlorenes Herz blinkt erst zwischen voll und leer
      if (lost && lost.i === i && performance.now() - lost.t0 < LOST_BLINK) {
        full = Math.floor((performance.now() - lost.t0) / 75) % 2 === 0;
      }
      sprite(r, HEART, 6 + i * 9, 6, full ? COLORS : EMPTY);
    }
    drawBurst(r);
    slot(r, Render.WIDTH - 44, 5, 'A');
    slot(r, Render.WIDTH - 24, 5, 'B');
  }

  // Danach zerplatzt es in kleine rote Pixel, die nach außen fliegen
  function drawBurst(r) {
    if (!lost) return;
    var t = performance.now() - lost.t0 - LOST_BLINK;
    if (t < 0) return;
    if (t > LOST_BURST) { lost = null; return; }
    var p = t / LOST_BURST;
    var cx = 9 + lost.i * 9, cy = 8;
    var ctx = r.getCtx();
    ctx.globalAlpha = 1 - p;
    for (var k = 0; k < 8; k++) {
      var w = k / 8 * Math.PI * 2;
      var d = 2 + p * 9;
      r.px(Math.round(cx + Math.cos(w) * d), Math.round(cy + Math.sin(w) * d + p * p * 4), 2, 2, k % 2 ? '#e8344a' : '#ffb0b8');
    }
    ctx.globalAlpha = 1;
  }

  // Einzelnes Herz zeichnen (z. B. fallen gelassenes Herz auf dem Boden)
  function drawHeart(r, x, y) {
    sprite(r, HEART, x + 1, y + 1, { o: 'rgba(0,0,0,0.35)', r: 'rgba(0,0,0,0.35)', H: 'rgba(0,0,0,0.35)' });
    sprite(r, HEART, x, y, COLORS);
  }

  return {
    draw: draw,
    drawHeart: drawHeart,
    heal: function (n) { hearts = Math.min(MAX, hearts + n); },
    fill: function () { hearts = MAX; lost = null; },
    getHearts: function () { return hearts; },
    setHearts: function (n) { hearts = Math.max(0, Math.min(MAX, n)); },
    // Herz abziehen; das Herz blinkt im HUD und zerplatzt
    loseHeart: function () {
      if (hearts === 0) return;
      hearts--;
      lost = { i: hearts, t0: performance.now() };
    }
  };
})();
