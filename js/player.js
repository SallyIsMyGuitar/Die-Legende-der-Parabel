// player.js: Spielfigur mit 4 Blickrichtungen, Laufanimation und Kollision
var Player = (function () {
  'use strict';

  var TILE = 16;
  var SPEED = 60; // Pixel pro Sekunde

  // --- Kollisionsbox für Wandkollision (nur fürs Laufen, nicht für Treffer) ---
  // Die Box ist deutlich kleiner als das 16x16-Sprite und sitzt im Fußbereich,
  // damit die Figur an Ecken, Türen und Durchgängen nicht hängen bleibt
  // (wie bei Top-Down-Zelda-Spielen). Zum Nachjustieren nur diese Werte ändern.
  var HITBOX_WIDTH = 10;    // Breite der Kollisionsbox in Pixeln (ca. 60 % der Sprite-Breite)
  var HITBOX_HEIGHT = 7;     // Höhe der Kollisionsbox in Pixeln (nur der Fußbereich)
  var HITBOX_OFFSET_X = 3;   // horizontal am Sprite zentriert
  var HITBOX_OFFSET_Y = 8;   // Box sitzt in der unteren Sprite-Hälfte, unten bündig
  var CORNER_ASSIST = 4;     // maximales automatisches Anschieben an Ecken in Pixeln (25 % Kachel)

  // Position in Pixeln (logische Auflösung), Figur ist 16x16
  var x = 9 * TILE;
  var y = 5 * TILE;
  var facing = 'down';
  var animTime = 0; // für Laufanimation
  var blinkUntil = 0; // Zeitpunkt (ms), bis zu dem die Figur blinkt

  function getX() { return x; }
  function getY() { return y; }
  function getFacing() { return facing; }

  // Prüft, ob die kleine Kollisionsbox (unterer Fußbereich) an Position (px, py) frei ist
  function canBeAt(world, px, py) {
    var bx = px + HITBOX_OFFSET_X;
    var by = py + HITBOX_OFFSET_Y;
    var tx1 = Math.floor(bx / TILE);
    var ty1 = Math.floor(by / TILE);
    var tx2 = Math.floor((bx + HITBOX_WIDTH - 1) / TILE);
    var ty2 = Math.floor((by + HITBOX_HEIGHT - 1) / TILE);
    for (var ty = ty1; ty <= ty2; ty++) {
      for (var tx = tx1; tx <= tx2; tx++) {
        if (world.isBlocked(tx, ty)) return false;
      }
    }
    return true;
  }

  // Sucht eine seitliche Verschiebung um höchstens CORNER_ASSIST Pixel, nach der
  // die Kollisionsbox an der Zielposition frei wäre (Eck-Assist für Türen und
  // Durchgänge). axis 'x': Bewegung in X, Anschieben in Y; axis 'y' umgekehrt.
  function cornerNudge(world, nx, ny, axis) {
    for (var n = 1; n <= CORNER_ASSIST; n++) {
      var minusFrei = axis === 'x' ? canBeAt(world, nx, ny - n) : canBeAt(world, nx - n, ny);
      var plusFrei = axis === 'x' ? canBeAt(world, nx, ny + n) : canBeAt(world, nx + n, ny);
      if (minusFrei || plusFrei) {
        if (minusFrei && plusFrei) {
          // beide Seiten frei: zur Seite schieben, auf der die Ecke überlappt
          return kanteOben(world, nx, ny, axis) ? n : -n;
        }
        return minusFrei ? -n : n;
      }
    }
    return 0;
  }

  // Liegt die blockierte Kachel eher am oberen/linken Rand der Box?
  function kanteOben(world, nx, ny, axis) {
    var bx = nx + HITBOX_OFFSET_X;
    var by = ny + HITBOX_OFFSET_Y;
    var tx1 = Math.floor(bx / TILE);
    var ty1 = Math.floor(by / TILE);
    var tx2 = Math.floor((bx + HITBOX_WIDTH - 1) / TILE);
    var ty2 = Math.floor((by + HITBOX_HEIGHT - 1) / TILE);
    var mitte = axis === 'x' ? (ty1 + ty2) / 2 : (tx1 + tx2) / 2;
    for (var ty = ty1; ty <= ty2; ty++) {
      for (var tx = tx1; tx <= tx2; tx++) {
        if (world.isBlocked(tx, ty)) {
          if (axis === 'x') { if (ty <= mitte) return true; }
          else if (tx <= mitte) return true;
        }
      }
    }
    return false;
  }

  // Bewegung mit Kollision, Achsen getrennt, damit man an Wänden entlanggleiten
  // kann. Blockiert eine Achse nur an einer Ecke, schiebt der Eck-Assist die
  // Figur automatisch seitlich um die Ecke (höchstens CORNER_ASSIST Pixel).
  function move(world, dx, dy) {
    var movedX = dx === 0 || canBeAt(world, x + dx, y);
    if (dx !== 0 && movedX) x += dx;
    var movedY = dy === 0 || canBeAt(world, x, y + dy);
    if (dy !== 0 && movedY) y += dy;

    if (dx !== 0 && !movedX) {
      if (canBeAt(world, x + dx, y)) x += dx;
      else {
        var n = cornerNudge(world, x + dx, y, 'x');
        if (n !== 0) { y += n; x += dx; }
      }
    }
    if (dy !== 0 && !movedY) {
      if (canBeAt(world, x, y + dy)) y += dy;
      else {
        var m = cornerNudge(world, x, y + dy, 'y');
        if (m !== 0) { x += m; y += dy; }
      }
    }
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

  // Gescriptete Bewegung ohne Kollision (z. B. durch die Tür gehen)
  function scriptMove(dx, dy, dt, dir) {
    x += dx;
    y += dy;
    if (dir) facing = dir;
    animTime += dt;
  }

  // ox/oy: optionale Verschiebung beim Zeichnen (Bildschirmwechsel)
  function draw(r, ox, oy) {
    if (!sprites) buildSprites();
    var px = Math.round(x + (ox || 0));
    var py = Math.round(y + (oy || 0));
    var phase = animTime > 0 ? CYCLE[Math.floor(animTime * 9) % 4] : 0;
    var bob = phase === 0 && animTime > 0 ? 1 : 0;

    // weicher Schatten am Boden
    var ctx = r.getCtx();
    ctx.globalAlpha = 0.3;
    r.ellipse(px + 8, py + 15, 6, 2, '#0c2a12');
    ctx.globalAlpha = 1;

    // Nach einem Fehler blinkt die Figur (jedes zweite Bild unsichtbar)
    var now = performance.now();
    if (now < blinkUntil && Math.floor(now / 70) % 2 === 1) return;

    r.image(sprites[facing][phase], px, py - bob);
  }

  // Blinken starten (Sekunden); 0 beendet es sofort
  function blink(dur) { blinkUntil = performance.now() + dur * 1000; }
  function isBlinking() { return performance.now() < blinkUntil; }

  // Figur an neue Position setzen (z. B. beim Betreten eines Raums)
  function setPosition(nx, ny, dir) {
    x = nx;
    y = ny;
    facing = dir || facing;
    animTime = 0;
  }

  // Verschieben mit Kollision, ohne Laufanimation (z. B. Rückstoß)
  function push(world, dx, dy) {
    move(world, dx, dy);
  }

  return {
    update: update,
    push: push,
    setPosition: setPosition,
    scriptMove: scriptMove,
    draw: draw,
    blink: blink,
    isBlinking: isBlinking,
    getX: getX,
    getY: getY,
    getFacing: getFacing
  };
})();
