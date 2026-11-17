// enemies.js: Gegner auf dem Weg zum ersten Dungeon
// Je Bildschirm eigene Gegner mit passendem Aussehen und festem Aufgabentyp
// (von leicht nach schwer). Beruehrt die Spielfigur ein Gegner, startet der
// Kampf: Das Spiel pausiert und zeigt genau eine Aufgabe (taskui.js).
// Richtig geloest = Gegner dauerhaft besiegt, sonst bleibt er stehen und
// die Aufgabe kommt spaeter mit neuen Zahlen wieder.
var Enemies = (function () {
  'use strict';

  var TILE = 16;
  var SIZE = 16;
  var SPEED = 18;            // Pixel pro Sekunde, langsamer als die Spielfigur
  var TURN_MIN = 0.8;        // Sekunden bis zur moeglichen Richtungsaenderung
  var TURN_MAX = 2.0;
  var COOLDOWN = 1.5;        // Sekunden nach einem Kampf ohne neue Beruehrung
  var TOUCH = 13;            // Ueberlappung in Pixeln, die als Beruehrung zaehlt

  // Feste Aufgabentypen je Bildschirm, von leicht zu schwer
  var TYPES = {
    wiese: 'scheitelAblesen',
    wald: 'scheitelAllgemein',
    ruine: 'spfAufstellen'
  };

  // --- Sprites (16x16, ein Frame; Bewegung ueber Wippen) ---------------------

  // Pilzwesen (Wiese): roter Hut mit Punkten, cremefarbener Stiel
  var MUSHROOM = [
    '................',
    '.....oooooo.....',
    '...oorrrrrroo...',
    '..orrwrrrrwrro..',
    '.orrwrrrrrrwrro.',
    '.oRRrrrrrrrrRRo.',
    '..oRRRRRRRRRRo..',
    '...oooooooooo...',
    '....osssssso....',
    '....osesseso....',
    '....osssssso....',
    '....osssssso....',
    '....oSSSSSSo....',
    '.....oooooo.....',
    '................',
    '................'
  ];
  var MUSHROOM_COLORS = {
    o: '#2a1420', r: '#d8443c', R: '#a02c34', w: '#f6f0e2',
    s: '#f0dcc0', S: '#cfae86', e: '#2a1420'
  };

  // Moosgeist (Wald): grüner Buckel mit Blatt auf dem Kopf
  var MOSS = [
    '................',
    '.......L........',
    '......oLo.......',
    '.....oLLo.......',
    '...oogggoo......',
    '..oggggggggo....',
    '.ogghggggghgo...',
    '.oggggggggggo...',
    '.ogweggggweggo..',
    '.oggggggggggo...',
    '.ogghgggghggo...',
    '..oggggggggo....',
    '...ooggoo.......',
    '....oo..oo......',
    '................',
    '................'
  ];
  var MOSS_COLORS = {
    o: '#16301c', g: '#3f7c34', h: '#7cb854', L: '#a8d878',
    w: '#ffffff', e: '#16301c'
  };

  // Steingolem (Ruine): bröckelnder Steinblock mit leuchtenden Augen
  var GOLEM = [
    '................',
    '..oooooooo......',
    '.ogggggggo......',
    '.oghggghgo......',
    '.oggggggggo.....',
    '.owegggwego.....',
    '.oggggggggo.....',
    '..oggddggo......',
    '...ooooooo......',
    '..ogggggggo.....',
    '.oggghgggggo....',
    '.oghgggghgggo...',
    '.ogggggggggo....',
    '..ogggggggo.....',
    '...oooooooo.....',
    '................'
  ];
  var GOLEM_COLORS = {
    o: '#2e2a34', g: '#8a8496', h: '#b4aec2', d: '#4a4452',
    w: '#ffd858', e: '#7a2a20'
  };

  var SPRITES = {
    wiese: { rows: MUSHROOM, colors: MUSHROOM_COLORS },
    wald: { rows: MOSS, colors: MOSS_COLORS },
    ruine: { rows: GOLEM, colors: GOLEM_COLORS }
  };
  var spriteCache = {};

  function spriteOf(screen) {
    if (!spriteCache[screen]) {
      var s = SPRITES[screen];
      spriteCache[screen] = Render.sprite(s.rows, s.colors, false);
    }
    return spriteCache[screen];
  }

  // --- Gegner-Definition je Bildschirm ---------------------------------------
  // Startposition in Kacheln; Bewegung passiert nur auf freien Kacheln.

  var DEFS = {
    wiese: [
      { x: 4, y: 8 },
      { x: 11, y: 10 }
    ],
    wald: [
      { x: 4, y: 5 },
      { x: 12, y: 7 }
    ],
    ruine: [
      { x: 4, y: 8 },
      { x: 12, y: 10 },
      { x: 8, y: 12 }
    ]
  };

  // Zustand: einmalig angelegt, ueberlebt Bildschirmwechsel
  var enemies = [];
  var defeated = {};   // 'screen:index' -> true, dauerhaft besiegt

  Object.keys(DEFS).forEach(function (screen) {
    DEFS[screen].forEach(function (d, i) {
      enemies.push({
        screen: screen, index: i,
        x: d.x * TILE, y: d.y * TILE,
        dirX: 0, dirY: 0,
        turnTime: Math.random() * TURN_MAX,
        cooldown: 0,
        attempts: 0
      });
    });
  });

  // --- Bewegung ---------------------------------------------------------------

  // Prueft, ob das 16x16-Feld des Gegners an (px, py) frei ist
  function canBeAt(world, px, py) {
    var tx1 = Math.floor(px / TILE);
    var ty1 = Math.floor(py / TILE);
    var tx2 = Math.floor((px + SIZE - 1) / TILE);
    var ty2 = Math.floor((py + SIZE - 1) / TILE);
    for (var ty = ty1; ty <= ty2; ty++) {
      for (var tx = tx1; tx <= tx2; tx++) {
        if (world.isBlocked(tx, ty)) return false;
      }
    }
    return true;
  }

  // Neue zufaellige Richtung (auch Stillstand moeglich)
  function turn(e) {
    var r = Math.random();
    if (r < 0.3) { e.dirX = 0; e.dirY = 0; }
    else if (r < 0.55) { e.dirX = -1; e.dirY = 0; }
    else if (r < 0.8) { e.dirX = 1; e.dirY = 0; }
    else if (r < 0.9) { e.dirX = 0; e.dirY = -1; }
    else { e.dirX = 0; e.dirY = 1; }
    e.turnTime = TURN_MIN + Math.random() * (TURN_MAX - TURN_MIN);
  }

  function update(world, dt, playerX, playerY, onBattle) {
    var active = [];
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (e.screen !== world.getScreen()) continue;
      if (defeated[e.screen + ':' + e.index]) continue;
      active.push(e);
    }

    for (var j = 0; j < active.length; j++) {
      var en = active[j];
      if (en.cooldown > 0) en.cooldown -= dt;

      // langsames Umherwandern
      en.turnTime -= dt;
      if (en.turnTime <= 0) turn(en);
      var dx = en.dirX * SPEED * dt;
      var dy = en.dirY * SPEED * dt;
      if (dx !== 0 && !canBeAt(world, en.x + dx, en.y)) turn(en);
      else en.x += dx;
      if (dy !== 0 && !canBeAt(world, en.x, en.y + dy)) turn(en);
      else en.y += dy;

      // Beruehrung mit der Spielfigur startet den Kampf
      if (en.cooldown <= 0 &&
          Math.abs(playerX - en.x) < TOUCH &&
          Math.abs(playerY - en.y) < TOUCH) {
        en.cooldown = COOLDOWN;
        en.attempts++;
        onBattle(en);
        return;   // nur ein Kampf gleichzeitig
      }
    }
  }

  // --- Kampf-Ergebnis -----------------------------------------------------------

  // Samen fuer die Aufgabe: Gegner + Versuchzaehler => neue Zahlen pro Versuch
  function seedOf(e) {
    var screenNo = { wiese: 1, wald: 2, ruine: 3 }[e.screen] || 1;
    return screenNo * 100 + e.index * 10 + e.attempts;
  }

  function typeIdOf(e) { return TYPES[e.screen]; }

  // Richtig geloest: Gegner dauerhaft besiegt
  function defeat(e) {
    defeated[e.screen + ':' + e.index] = true;
  }

  // --- Zeichnen ----------------------------------------------------------------

  function draw(r, time, screen) {
    var ctx = r.getCtx();
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (e.screen !== screen) continue;
      if (defeated[e.screen + ':' + e.index]) continue;
      var bob = Math.floor(time / 300 + e.index) % 2;
      ctx.globalAlpha = 0.3;
      r.ellipse(e.x + 8, e.y + 15, 6, 2, '#2a140a');
      ctx.globalAlpha = 1;
      r.image(spriteOf(e.screen), Math.round(e.x), Math.round(e.y - bob));
    }
  }

  return {
    update: update,
    draw: draw,
    defeat: defeat,
    seedOf: seedOf,
    typeIdOf: typeIdOf
  };
})();
