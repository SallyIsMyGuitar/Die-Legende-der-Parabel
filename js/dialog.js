// dialog.js: Textbox für Gespräche mit Dorfbewohnern
// A (Enter) = weiter bzw. Text sofort ganz anzeigen. Gespräche lassen sich
// nicht abbrechen: Sie werden immer mit A bis zum Ende durchgeklickt.
var Dialog = (function () {
  'use strict';

  var BOX = { x: 6, y: 158, w: 244, h: 60 };
  var PAD = 9;
  var MAX_LINES = 4;
  var SPEED = 45;          // Zeichen pro Sekunde

  var active = false;
  var name = '';
  var pages = [];          // jede Seite: Array von Zeilen
  var page = 0;
  var shown = 0;           // bereits sichtbare Zeichen der aktuellen Seite
  var time = 0;

  function pageLength(p) {
    return pages[p].join('').length;
  }

  // Gespräch öffnen: speaker = Name, texts = Liste von Absätzen
  function open(speaker, texts) {
    name = speaker || '';
    pages = [];
    var maxW = BOX.w - PAD * 2;
    texts.forEach(function (t) {
      var lines = Font.wrap(t, maxW);
      for (var i = 0; i < lines.length; i += MAX_LINES) pages.push(lines.slice(i, i + MAX_LINES));
    });
    page = 0;
    shown = 0;
    active = pages.length > 0;
  }

  function close() {
    active = false;
  }

  function update(dt, input) {
    if (!active) return;
    time += dt;
    var len = pageLength(page);
    if (shown < len) shown = Math.min(len, shown + SPEED * dt);
    if (input.pressed('a')) {
      if (shown < len) {
        shown = len;
      } else if (page < pages.length - 1) {
        page++;
        shown = 0;
      } else {
        close();
      }
    }
  }

  function draw(r) {
    if (!active) return;
    var ctx = r.getCtx();
    var b = BOX;

    // Box: dunkel, leicht durchscheinend, heller Rahmen mit runden Ecken
    ctx.globalAlpha = 0.92;
    r.px(b.x + 2, b.y, b.w - 4, b.h, '#1c1828');
    r.px(b.x, b.y + 2, b.w, b.h - 4, '#1c1828');
    r.px(b.x + 1, b.y + 1, b.w - 2, b.h - 2, '#1c1828');
    ctx.globalAlpha = 1;
    r.px(b.x + 3, b.y + 1, b.w - 6, 1, '#efe4c4');
    r.px(b.x + 3, b.y + b.h - 2, b.w - 6, 1, '#efe4c4');
    r.px(b.x + 1, b.y + 3, 1, b.h - 6, '#efe4c4');
    r.px(b.x + b.w - 2, b.y + 3, 1, b.h - 6, '#efe4c4');
    r.px(b.x + 2, b.y + 2, 1, 1, '#efe4c4');
    r.px(b.x + b.w - 3, b.y + 2, 1, 1, '#efe4c4');
    r.px(b.x + 2, b.y + b.h - 3, 1, 1, '#efe4c4');
    r.px(b.x + b.w - 3, b.y + b.h - 3, 1, 1, '#efe4c4');

    // Namensschild
    if (name) {
      var nw = Font.width(name) + 10;
      var nx = b.x + 10, ny = b.y - 8;
      r.px(nx, ny, nw, 12, '#3a2418');
      r.px(nx + 1, ny + 1, nw - 2, 10, '#efe4c4');
      Font.draw(ctx, name, nx + 5, ny + 2, '#3a2418');
    }

    // Text mit Schreibmaschinen-Effekt
    var left = Math.floor(shown);
    var lines = pages[page];
    for (var i = 0; i < lines.length && left > 0; i++) {
      var part = lines[i].slice(0, left);
      Font.draw(ctx, part, b.x + PAD, b.y + PAD + i * Font.LINE + (name ? 2 : 0), '#f6f0e2');
      left -= lines[i].length;
    }

    // blinkender Pfeil "weiter"
    if (shown >= pageLength(page) && Math.floor(time * 3) % 2 === 0) {
      var ax = b.x + b.w - 14, ay = b.y + b.h - 10;
      r.px(ax, ay, 7, 1, '#f0c040');
      r.px(ax + 1, ay + 1, 5, 1, '#f0c040');
      r.px(ax + 2, ay + 2, 3, 1, '#f0c040');
      r.px(ax + 3, ay + 3, 1, 1, '#f0c040');
    }
  }

  // Sprechblase über einer Figur, mit der man reden kann
  function drawHint(r, x, y, t) {
    var bob = Math.floor(t / 400) % 2;
    var bx = Math.round(x) - 6, by = Math.round(y) - 12 - bob;
    r.px(bx + 1, by, 11, 8, '#22202e');
    r.px(bx, by + 1, 13, 6, '#22202e');
    r.px(bx + 1, by + 1, 11, 6, '#ffffff');
    r.px(bx + 4, by + 8, 3, 1, '#22202e');
    r.px(bx + 4, by + 7, 2, 1, '#ffffff');
    r.px(bx + 5, by + 9, 1, 1, '#22202e');
    for (var i = 0; i < 3; i++) r.px(bx + 3 + i * 3, by + 4, 1, 1, '#22202e');
  }

  return {
    open: open,
    close: close,
    update: update,
    draw: draw,
    drawHint: drawHint,
    isActive: function () { return active; }
  };
})();
