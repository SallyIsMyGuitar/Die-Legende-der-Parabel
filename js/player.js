// player.js: Spielfigur mit 4 Blickrichtungen und Kollision
var Player = (function () {
  'use strict';

  var TILE = 16;
  var SPEED = 60; // Pixel pro Sekunde

  // Position in Pixeln (logische Auflösung), Figur ist 16x16
  var x = 8 * TILE;
  var y = 9 * TILE;
  var facing = 'down';
  var animTime = 0; // für Laufanimation

  function getX() { return x; }
  function getY() { return y; }
  function getFacing() { return facing; }

  // Prüft, ob das 16x16-Feld der Figur an Position (px, py) frei ist
  function canBeAt(world, px, py) {
    var tx1 = Math.floor(px / TILE);
    var ty1 = Math.floor(py / TILE);
    var tx2 = Math.floor((px + TILE - 1) / TILE);
    var ty2 = Math.floor((py + TILE - 1) / TILE);
    for (var ty = ty1; ty <= ty2; ty++) {
      for (var tx = tx1; tx <= tx2; tx++) {
        if (world.isBlocked(tx, ty)) return false;
      }
    }
    return true;
  }

  // Bewegung mit Kollision, Achsen getrennt, damit man an Wänden entlanggleiten kann
  function move(world, dx, dy) {
    if (dx !== 0 && canBeAt(world, x + dx, y)) x += dx;
    if (dy !== 0 && canBeAt(world, x, y + dy)) y += dy;
  }

  // Zeitunabhängige Aktualisierung
  function update(world, input, dt) {
    var dx = 0, dy = 0;
    if (input.isDown('left')) { dx -= SPEED * dt; facing = 'left'; }
    if (input.isDown('right')) { dx += SPEED * dt; facing = 'right'; }
    if (input.isDown('up')) { dy -= SPEED * dt; facing = 'up'; }
    if (input.isDown('down')) { dy += SPEED * dt; facing = 'down'; }
    if (dx !== 0 || dy !== 0) {
      move(world, dx, dy);
      animTime += dt;
    } else {
      animTime = 0;
    }
  }

  // Sanfter Übergang zwischen zwei Farben
  function mix(c1, c2, t) {
    t = Math.max(0, Math.min(1, t));
    var r1 = parseInt(c1.slice(1, 3), 16), g1 = parseInt(c1.slice(3, 5), 16), b1 = parseInt(c1.slice(5, 7), 16);
    var r2 = parseInt(c2.slice(1, 3), 16), g2 = parseInt(c2.slice(3, 5), 16), b2 = parseInt(c2.slice(5, 7), 16);
    var r = Math.round(r1 + (r2 - r1) * t);
    var g = Math.round(g1 + (g2 - g1) * t);
    var b = Math.round(b1 + (b2 - b1) * t);
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }

  // Figur im modernen Zelda-Stil: runde Formen, weiche Schattierung,
  // Auf-und-ab beim Laufen. step = 0/1 wechselt die Beinstellung.
  function draw(r) {
    var px = Math.round(x);
    var py = Math.round(y);
    var step = (animTime > 0 && Math.floor(animTime * 7) % 2 === 1) ? 1 : 0;
    var bob = (animTime > 0 && step === 1) ? 1 : 0; // leichtes Wippen
    py += bob;

    // weicher Schatten am Boden
    r.px(px + 3, py + 13 + bob, 10, 2, 'rgba(20,40,16,0.35)');
    r.px(px + 5, py + 15 + bob, 6, 1, 'rgba(20,40,16,0.25)');

    // Umriss (dunkel, aber nicht schwarz)
    r.px(px + 3, py + 1, 10, 12, '#2c3444');

    // Kopf: runde Form mit Verlauf, Haare mit Glanz
    r.px(px + 4, py + 1, 8, 4, '#f4cc96');
    r.px(px + 4, py + 4, 8, 1, mix('#f4cc96', '#c89868', 0.6)); // Schattenkinn
    r.px(px + 4, py + 1, 8, 2, '#96501e');
    r.px(px + 5, py + 1, 4, 1, '#c06828');                    // Haar-Glanz

    // Körper: grüner Waffenrock mit Verlauf und Kragen
    r.px(px + 4, py + 5, 8, 6, '#3e9448');
    r.px(px + 4, py + 9, 8, 2, mix('#3e9448', '#1e6428', 0.7)); // dunkler Saum
    r.px(px + 5, py + 5, 6, 1, '#8cd07c');                     // heller Kragen
    r.px(px + 7, py + 6, 2, 4, '#58b458');                     // Mittelstreifen
    r.px(px + 4, py + 10, 8, 1, '#5c3820');                    // Gürtel

    // Beine mit Laufschritt
    if (step === 0) {
      r.px(px + 4, py + 11, 3, 3, '#34507a');
      r.px(px + 9, py + 11, 3, 3, '#34507a');
      r.px(px + 4, py + 13, 3, 1, '#5c3a20');
      r.px(px + 9, py + 13, 3, 1, '#5c3a20');
    } else {
      r.px(px + 3, py + 11, 3, 3, '#34507a');
      r.px(px + 10, py + 11, 3, 3, '#34507a');
      r.px(px + 3, py + 13, 3, 1, '#5c3a20');
      r.px(px + 10, py + 13, 3, 1, '#5c3a20');
    }

    if (facing === 'down') {
      r.px(px + 5, py + 3, 2, 1, '#2c3444');                   // beide Augen
      r.px(px + 9, py + 3, 2, 1, '#2c3444');
    } else if (facing === 'up') {
      r.px(px + 4, py + 1, 8, 4, '#96501e');                  // Hinterkopf
      r.px(px + 5, py + 4, 6, 1, mix('#f4cc96', '#c89868', 0.6));
    } else if (facing === 'left') {
      r.px(px + 4, py + 3, 2, 1, '#2c3444');                   // Auge links
      r.px(px + 3, py + 6, 1, 4, '#3e9448');                   // Arm
      r.px(px + 3, py + 10, 1, 2, '#f4cc96');                  // Hand
    } else {
      r.px(px + 10, py + 3, 2, 1, '#2c3444');                  // Auge rechts
      r.px(px + 12, py + 6, 1, 4, '#3e9448');                   // Arm
      r.px(px + 12, py + 10, 1, 2, '#f4cc96');                 // Hand
    }
  }

  return {
    update: update,
    draw: draw,
    getX: getX,
    getY: getY,
    getFacing: getFacing
  };
})();
