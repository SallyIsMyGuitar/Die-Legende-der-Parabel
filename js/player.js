// player.js: Spielfigur mit 4 Blickrichtungen und Kollision
var Player = (function () {
  'use strict';

  var TILE = 16;
  var SPEED = 60; // Pixel pro Sekunde

  // Position in Pixeln (logische Auflösung), Figur ist 16x16
  var x = 8 * TILE;
  var y = 9 * TILE;
  var facing = 'down';

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
    if (dx !== 0 || dy !== 0) move(world, dx, dy);
  }

  // Einfache Pixelfigur, je nach Blickrichtung anders gezeichnet
  function draw(r) {
    var px = Math.round(x);
    var py = Math.round(y);

    r.px(px + 4, py, 8, 3, '#f0c090');        // Kopf
    r.px(px + 4, py, 8, 1, '#7c4c1c');        // Haar
    r.px(px + 3, py + 3, 10, 6, '#2c5aa0');   // Körper
    r.px(px + 2, py + 4, 1, 4, '#f0c090');    // Arme
    r.px(px + 13, py + 4, 1, 4, '#f0c090');
    r.px(px + 4, py + 9, 3, 5, '#1c3a70');    // Beine
    r.px(px + 9, py + 9, 3, 5, '#1c3a70');
    r.px(px + 4, py + 14, 3, 1, '#5c3820');   // Schuhe
    r.px(px + 9, py + 14, 3, 1, '#5c3820');

    if (facing === 'down') {
      r.px(px + 5, py + 2, 2, 1, '#000');     // Augen
      r.px(px + 9, py + 2, 2, 1, '#000');
    } else if (facing === 'up') {
      r.px(px + 4, py, 8, 2, '#7c4c1c');      // Hinterkopf
    } else if (facing === 'left') {
      r.px(px + 4, py + 2, 2, 1, '#000');     // ein Auge links
    } else {
      r.px(px + 10, py + 2, 2, 1, '#000');    // ein Auge rechts
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
