// sword.js: Das Schwert - einstelliger Joker gegen Monster-Aufgaben
// Es ueberspringt eine Aufgabe und zerbricht danach. Man traegt hoechstens
// eines, es gibt nur Belohnungen aus freiwilligen Raetsel-Truhen.
// Bei null Herzen geht ein getragenes Schwert verloren.
var Sword = (function () {
  'use strict';

  var carried = false;

  // Kleines Pixel-Schwert (diagonale Klinge, goldener Griff)
  var SPRITE = [
    '..........wW...',
    '.........wW....',
    '........wW.....',
    '.......wW......',
    '......wW.......',
    '.....wW........',
    '....wW.........',
    '.g.wW..........',
    '..gW...........',
    '.ggg...........',
    'g..g...........',
    'g..............'
  ];
  var COLORS = { w: '#c8ccd8', W: '#eef2f8', g: '#b8863a' };

  // Slot im HUD, links neben den A/B-Plaetzen, im gleichen Stil
  function drawSlotFrame(r, x, y) {
    var s = 16;
    r.px(x + 1, y, s - 2, s, 'rgba(14,18,32,0.55)');
    r.px(x, y + 1, s, s - 2, 'rgba(14,18,32,0.55)');
    r.px(x + 2, y, s - 4, 1, '#efe4c4');
    r.px(x + 2, y + s - 1, s - 4, 1, '#efe4c4');
    r.px(x, y + 2, 1, s - 4, '#efe4c4');
    r.px(x + s - 1, y + 2, 1, s - 4, '#efe4c4');
    r.px(x + 1, y + 1, 1, 1, '#efe4c4');
    r.px(x + s - 2, y + 1, 1, 1, '#efe4c4');
    r.px(x + 1, y + s - 2, 1, 1, '#efe4c4');
    r.px(x + s - 2, y + s - 2, 1, 1, '#efe4c4');
  }

  // Schwert-Symbol an beliebiger Stelle (HUD-Slot, Truhe)
  function drawIcon(r, x, y) {
    for (var j = 0; j < SPRITE.length; j++) {
      for (var i = 0; i < SPRITE[j].length; i++) {
        var c = COLORS[SPRITE[j].charAt(i)];
        if (c) r.px(x + i, y + j, 1, 1, c);
      }
    }
  }

  function draw(r) {
    var x = Render.WIDTH - 64, y = 5;
    drawSlotFrame(r, x, y);
    if (carried) drawIcon(r, x + 2, y + 2);
  }

  return {
    draw: draw,
    drawIcon: drawIcon,
    has: function () { return carried; },
    give: function () { carried = true; },
    breakSword: function () { carried = false; },
    // Kachel des Schwert-Slots (Trefferbereich fuer Touch)
    rect: function () { return { x: Render.WIDTH - 64, y: 5, w: 16, h: 16 }; }
  };
})();
