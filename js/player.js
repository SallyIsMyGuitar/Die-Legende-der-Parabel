// player.js: Spielfigur mit 4 Blickrichtungen und Kollision
var Player = (function () {
  'use strict';

  var TILE = 16;
  var SPEED = 60; // Pixel pro Sekunde

  // Position in Pixeln (logische Auflösung), Figur ist 16x16
  var x = 8 * TILE;
  var y = 9 * TILE;
  var facing = 'down';
  var animTime = 0; // für leichte Laufanimation

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

  // Pixelfigur mit Umriss, Schattierung und 4 Blickrichtungen.
  // step = 0/1 schaltet beim Laufen zwischen zwei Beinstellungen um.
  function draw(r) {
    var px = Math.round(x);
    var py = Math.round(y);
    var step = (animTime > 0 && Math.floor(animTime * 6) % 2 === 1) ? 1 : 0;

    // Schatten unter der Figur
    r.px(px + 3, py + 14, 10, 2, 'rgba(0,0,0,0.25)');

    // Umriss
    r.px(px + 3, py + 1, 10, 13, '#1c1c28');
    // Kopf
    r.px(px + 4, py + 1, 8, 4, '#f2c894');
    r.px(px + 4, py + 1, 8, 2, '#8c4c1c');              // Haare
    // Körper: grüner Waffenrock mit hellem Kragen
    r.px(px + 4, py + 5, 8, 6, '#2f7a3a');
    r.px(px + 5, py + 5, 6, 1, '#6cc06e');               // Kragen
    r.px(px + 7, py + 6, 2, 4, '#3f9448');               // Mittelstreifen
    // Gürtel
    r.px(px + 4, py + 10, 8, 1, '#5c3820');
    // Beine mit Laufschritt
    if (step === 0) {
      r.px(px + 4, py + 11, 3, 3, '#28486e');
      r.px(px + 9, py + 11, 3, 3, '#28486e');
    } else {
      r.px(px + 3, py + 11, 3, 3, '#28486e');
      r.px(px + 10, py + 11, 3, 3, '#28486e');
    }
    // Schuhe
    r.px(px + 4, py + 13, 3, 1, '#4a2e18');
    r.px(px + 9, py + 13, 3, 1, '#4a2e18');

    if (facing === 'down') {
      r.px(px + 5, py + 3, 2, 1, '#1c1c28');            // beide Augen
      r.px(px + 9, py + 3, 2, 1, '#1c1c28');
    } else if (facing === 'up') {
      r.px(px + 4, py + 1, 8, 4, '#8c4c1c');            // Hinterkopf
      r.px(px + 4, py + 4, 8, 1, '#f2c894');            // Nacken
    } else if (facing === 'left') {
      r.px(px + 4, py + 3, 2, 1, '#1c1c28');            // Auge links
      r.px(px + 3, py + 6, 1, 5, '#2f7a3a');            // Arm angedeutet
    } else {
      r.px(px + 10, py + 3, 2, 1, '#1c1c28');           // Auge rechts
      r.px(px + 12, py + 6, 1, 5, '#2f7a3a');           // Arm angedeutet
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
