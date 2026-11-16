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
  // Schüler: braune Haare, grauer Hoodie, blaue Jeans, schwarzer Rucksack,
  // weiße Sneaker. Jedes Zeichen steht für eine Farbe, '.' ist durchsichtig.
  var PALETTE = {
    o: '#22202e',                              // Umriss
    y: '#8a5a32', Y: '#5e3a1e', L: '#b8824e',  // Haare
    s: '#f8d0a4', S: '#d9a074',                // Haut
    w: '#ffffff', e: '#22202e',                // Augen
    t: '#a9adb5', T: '#d2d5da', D: '#73777f',  // Hoodie
    k: '#f4f4f4',                              // Kordeln
    r: '#2a2a32', R: '#4c4c58',                // Rucksack
    p: '#3e64a8', P: '#2c4a80',                // Jeans
    n: '#f6f6f6', N: '#c4c8cc'                 // Sneaker
  };

  var HEAD_DOWN = [
    '....oooooooo....',
    '...oyLLyyyyyo...',
    '..oyLyyyyyyyyo..',
    '..oyyyyyyyyyYo..',
    '..oYyysyysyyYo..',
    '..oyssssssssyo..',
    '..oswessssewso..',
    '..oSsessssesSo..',
    '...oSSssssSSo...'
  ];
  var HEAD_UP = [
    '....oooooooo....',
    '...oyyyyyLLyo...',
    '..oyyyyyyyLyyo..',
    '..oyyyyyyyyyyo..',
    '..oYyyyyyyyyYo..',
    '..oyYyyyyyyYyo..',
    '..oYyyyyyyyyYo..',
    '..oSYyyyyyyYSo..',
    '...oDttttttDo...'
  ];
  var HEAD_RIGHT = [
    '....oooooooo....',
    '...oyyyyLLyyo...',
    '..oyyyyyyLyyyo..',
    '..oyyyyyyyyyyyo.',
    '..oYyyyyssssso..',
    '..oyyyyssssweo..',
    '..oYyysssssseo..',
    '..oSYsssssssssso',
    '...oSSssssSSo...'
  ];
  var BODY_DOWN = [
    '..oDrtkttktrDo..',
    '.osDrttttttrDso.',
    '.osDtDttttDtDso.',
    '..oDDDDDDDDDDo..'
  ];
  var BODY_UP = [
    '..oDoRRRRRRoDo..',
    '.osDorrrrrroDso.',
    '.osDorRRRRroDso.',
    '..oDDorrrroDDo..'
  ];
  var BODY_SIDE = [
    '..orrDttttttDo..',
    '.orrDtttttttDso.',
    '.orRDtttttttDso.',
    '..orrDDDDDDDDo..'
  ];
  var LEGS = [
    ['...oppo..oppo...', '...onno..onno...', '...oNNo..oNNo...'],  // Stand
    ['...oppo..oppo...', '...onno..oNNo...', '...oNNo..oooo...'],  // Schritt links
    ['...oppo..oppo...', '...oNNo..onno...', '...oooo..oNNo...']   // Schritt rechts
  ];

  var sprites = null;

  function buildSprites() {
    sprites = {};
    var dirs = {
      down: [HEAD_DOWN, BODY_DOWN, false],
      up: [HEAD_UP, BODY_UP, false],
      right: [HEAD_RIGHT, BODY_SIDE, false],
      left: [HEAD_RIGHT, BODY_SIDE, true]
    };
    for (var d in dirs) {
      sprites[d] = [];
      for (var f = 0; f < LEGS.length; f++) {
        var rows = dirs[d][0].concat(dirs[d][1], LEGS[f]);
        sprites[d].push(Render.sprite(rows, PALETTE, dirs[d][2]));
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

  // Figur an neue Position setzen (z. B. beim Betreten eines Raums)
  function setPosition(nx, ny, dir) {
    x = nx;
    y = ny;
    facing = dir || facing;
    animTime = 0;
  }

  return {
    update: update,
    setPosition: setPosition,
    draw: draw,
    getX: getX,
    getY: getY,
    getFacing: getFacing
  };
})();
