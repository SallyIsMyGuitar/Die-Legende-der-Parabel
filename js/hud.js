// hud.js: Anzeige oben – Herzen links, Gegenstandsplätze rechts (noch ohne Funktion)
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

  var hearts = 3;   // aktuelle Herzen (voll = 3)

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
    for (var i = 0; i < 3; i++) {
      sprite(r, HEART, 7 + i * 9, 7, shadow);
      sprite(r, HEART, 6 + i * 9, 6, i < hearts ? COLORS : EMPTY);
    }
    slot(r, Render.WIDTH - 44, 5, 'A');
    slot(r, Render.WIDTH - 24, 5, 'B');
  }

  return {
    draw: draw,
    getHearts: function () { return hearts; },
    setHearts: function (n) { hearts = Math.max(0, Math.min(3, n)); },
    loseHeart: function () { hearts = Math.max(0, hearts - 1); }
  };
})();
