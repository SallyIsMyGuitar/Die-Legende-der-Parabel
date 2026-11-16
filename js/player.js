// player.js: Spielfigur mit 4 Blickrichtungen, Laufanimation und Kollision
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

  // --- Sprites als Pixelraster (16x16) ----------------------------------
  // Jedes Zeichen steht für eine Farbe, '.' ist durchsichtig.
  var PALETTE = {
    o: '#22202e', // Umriss
    h: '#3f9e4a', H: '#7fd36a', d: '#25683a',  // Mütze
    y: '#f2c14e', Y: '#c8862a',                // Haare
    s: '#f8d0a4', S: '#d9a074',                // Haut
    w: '#ffffff', e: '#22202e',                // Augen
    t: '#3f9e4a', T: '#7fd36a', D: '#25683a',  // Waffenrock
    b: '#6e4226', k: '#f5cf4a',                // Gürtel, Schnalle
    p: '#efe6cc', B: '#7a4a26'                 // Hose, Stiefel
  };

  var HEAD_DOWN = [
    '....oooooooo....',
    '...ohHHhhhhdo...',
    '..ohHhhhhhhhdo..',
    '..odhhhhhhhhdo..',
    '..oYyyyyyyyyYo..',
    '..oyssssssssyo..',
    '..oswessssewso..',
    '..oSsessssesSo..',
    '...oSSssssSSo...'
  ];
  var HEAD_UP = [
    '....oooooooo....',
    '...ohhhhhhHdo...',
    '..ohhhhhhhHhdo..',
    '..odhhhhhhhhdo..',
    '..oYyyyyyyyyYo..',
    '..oyyyyYyyyyyo..',
    '..oYyyyyyyyyYo..',
    '..oSYyyyyyyYSo..',
    '...oSSSSSSSSo...'
  ];
  var HEAD_RIGHT = [
    '....oooooooo....',
    '...ohHHhhhhdo...',
    '..ohHhhhhhhhdo..',
    '..odhhhhhhhhhdo.',
    '..oYyyyyysssso..',
    '..oyyyyssssweo..',
    '..oYyysssssseo..',
    '..oSYsssssssssso',
    '...oSSssssSSo...'
  ];
  var BODY = [
    '..odtTTttTTtdo..',
    '.osdttttttttdso.',
    '.osdbbbkkbbbdso.',
    '..oDDDDDDDDDDo..'
  ];
  var BODY_BACK = [
    '..odttttttttdo..',
    '.osdttttttttdso.',
    '.osdbbbbbbbbdso.',
    '..oDDDDDDDDDDo..'
  ];
  var LEGS = [
    ['...oppo..oppo...', '...oBBo..oBBo...', '...oooo..oooo...'],  // Stand
    ['...oppo..oppo...', '...oBBo..oooo...', '...oooo.........'],  // Schritt links
    ['...oppo..oppo...', '...oooo..oBBo...', '.........oooo...']   // Schritt rechts
  ];

  var sprites = null;

  function makeSprite(rows, flip) {
    var layer = Render.createLayer(16, 16);
    var ctx = layer.ctx;
    for (var j = 0; j < rows.length; j++) {
      for (var i = 0; i < 16; i++) {
        var ch = rows[j].charAt(flip ? 15 - i : i);
        if (ch === '.' || !PALETTE[ch]) continue;
        ctx.fillStyle = PALETTE[ch];
        ctx.fillRect(i, j, 1, 1);
      }
    }
    return layer.canvas;
  }

  function buildSprites() {
    sprites = {};
    var dirs = {
      down: [HEAD_DOWN, BODY, false],
      up: [HEAD_UP, BODY_BACK, false],
      right: [HEAD_RIGHT, BODY_BACK, false],
      left: [HEAD_RIGHT, BODY_BACK, true]
    };
    for (var d in dirs) {
      sprites[d] = [];
      for (var f = 0; f < LEGS.length; f++) {
        var rows = dirs[d][0].concat(dirs[d][1]).slice(0, 13).concat(LEGS[f]);
        sprites[d].push(makeSprite(rows, dirs[d][2]));
      }
    }
  }

  // Laufzyklus: Stand – links – Stand – rechts
  var CYCLE = [0, 1, 0, 2];

  function draw(r) {
    if (!sprites) buildSprites();
    var px = Math.round(x);
    var py = Math.round(y);
    var phase = animTime > 0 ? CYCLE[Math.floor(animTime * 9) % 4] : 0;
    var bob = phase === 0 && animTime > 0 ? 1 : 0;

    // weicher Schatten am Boden
    var ctx = r.getCtx();
    ctx.globalAlpha = 0.3;
    r.ellipse(px + 8, py + 15, 6, 2, '#0c2a12');
    ctx.globalAlpha = 1;

    r.image(sprites[facing][phase], px, py - bob);
  }

  return {
    update: update,
    draw: draw,
    getX: getX,
    getY: getY,
    getFacing: getFacing
  };
})();
