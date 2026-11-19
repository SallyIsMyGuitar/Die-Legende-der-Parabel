// sandtempel.js: Der Sandtempel - Dungeon 4 (Nullstellen und quadratische
// Gleichungen)
// Vier Raeume, strikt linear: Eingang (Alte Wandinschrift erklaert die Regel
// "erst D, dann die Formel"), Mittelraum mit steinerner Waage und Quelle
// (Rastquelle auf halber Strecke), Plattenraum (Platten-Raeetsel, platten.js),
// Sanduhrraum (Boss "Waechter des Sandtempels", boss.js).
// Aufbau wie Hoehle, Turm und Wasserreich: 16 x 14 Kacheln, angemeldet per
// Interior.register(), Uebergaenge ueber mats.
// Zeichen: '#' ausserhalb, 'W' Sandsteinwand, '.' Boden, 'S' Saeule (blockiert),
//          'x' Steinschutt (blockiert), 'Q' Quelle (blockiert), 'M' Oeffnung
(function () {
  'use strict';

  var TILE = 16;
  var hash = Render.hash;

  // ---Sandtempel-Optik -----------------------------------------------------

  // Sandsteinboden mit Fugen und feinen Kornsprenkeln
  function sandFloor(r, tx, ty) {
    var x = tx * TILE, y = ty * TILE;
    var even = (tx + ty) % 2 === 0;
    r.px(x, y, TILE, TILE, even ? '#d2ae72' : '#c8a266');
    r.px(x, y, TILE, 1, '#ba9257');
    r.px(x, y + 15, TILE, 1, '#b0884c');
    r.px(x, y, 1, TILE, '#ba9257');
    r.px(x + 15, y, 1, TILE, '#b0884c');
    if (hash(tx * 5, ty * 3) > 0.7) {
      r.px(x + 3 + Math.floor(hash(tx, ty) * 9), y + 5, 2, 1, '#e0c088');
      r.px(x + 8, y + 9 + Math.floor(hash(ty, tx) * 4), 2, 1, '#e0c088');
    }
  }

  // Sandsteinwand mit Blockfugen und hieroglyphenartigen Parabel-Linien
  function sandWall(r, tx, ty) {
    var x = tx * TILE, y = ty * TILE;
    r.px(x, y, TILE, TILE, '#c09656');
    r.px(x, y, TILE, 1, '#d8b47a');
    r.px(x, y + 15, TILE, 1, '#a07840');
    // Blockfugen im Versatz
    var j = (ty % 2) ? 5 : 11;
    r.px(x + j, y, 1, 8, '#a87e44');
    r.px(x + ((ty % 2) ? 12 : 4), y + 8, 1, 8, '#a87e44');
    r.px(x, y + 7, TILE, 1, '#a87e44');
    // eingeritzte Parabel-Ornamente (nur auf manchen Bloecken)
    var seed = hash(tx * 7 + 3, ty * 11 + 5);
    if (seed > 0.55) {
      var oy = 2 + Math.floor(hash(tx, ty * 3) * 5);
      for (var o = -4; o <= 4; o++) {
        var dy = Math.round(o * o / 6);
        if (dy < 6) r.px(x + 8 + o, y + oy + dy, 1, 1, '#7a5a2e');
      }
    }
  }

  // Saeule mit Kapitell und Kanneluren (blockiert)
  function column(r, tx, ty) {
    var x = tx * TILE, y = ty * TILE;
    r.ellipse(x + 8, y + 15, 6, 2, 'rgba(60,40,10,0.35)');
    r.px(x + 6, y, 4, 15, '#b8945a');
    r.px(x + 7, y, 1, 15, '#d8b880');
    r.px(x + 9, y, 1, 15, '#987038');
    r.px(x + 4, y, 8, 2, '#d0aa70');
    r.px(x + 4, y, 8, 1, '#e8c88e');
    r.px(x + 4, y + 13, 8, 2, '#d0aa70');
  }

  // Steinschutt und verstaürzte Bloecke (blockieren)
  function rubble(r, tx, ty) {
    var x = tx * TILE, y = ty * TILE;
    r.ellipse(x + 8, y + 14, 7, 2, 'rgba(60,40,10,0.35)');
    r.px(x + 2, y + 7, 9, 7, '#a8834e');
    r.px(x + 3, y + 8, 7, 5, '#c0985c');
    r.px(x + 9, y + 5, 6, 8, '#987038');
    r.px(x + 10, y + 6, 4, 6, '#b08a50');
    r.px(x + 4, y + 9, 4, 1, '#8a6434');
  }

  // Oeffnung im Sandstein (Uebergang): dunkler Gang mit Sturz
  function sandOpening(r, tx, ty, top) {
    var x = tx * TILE, y = ty * TILE;
    r.px(x, y, TILE, TILE, '#1c1410');
    r.px(x + 1, y + (top ? 3 : 1), 14, 3, '#b8945a');
    r.px(x + 1, y + (top ? 3 : 1), 14, 1, '#d8b47a');
  }

  // Wandszene mit Fackeln (Fackeln animiert in anim)
  function wallTorch(r, tx, ty) {
    var x = tx * TILE, y = ty * TILE;
    r.px(x + 6, y + 4, 4, 7, '#7a5a2e');     // Halter
    r.px(x + 6, y + 4, 4, 1, '#987038');
    r.px(x + 7, y, 2, 5, '#5a3e20');          // Holz
    r.px(x + 7, y, 1, 5, '#7a5230');
  }

  // Flackern der Fackeln (im Laufbild), Positionen aus def.torches
  function flames(r, t, torches) {
    var ctx = r.getCtx();
    for (var i = 0; i < torches.length; i++) {
      var x = torches[i][0] * TILE, y = torches[i][1] * TILE;
      var f = Math.floor(t / 110 + i) % 2;
      r.px(x + 7, y - 3 - f, 2, 3 + f, '#f2a83a');
      r.px(x + 7, y - 4 - f, 2, 2, '#f8e088');
      ctx.globalAlpha = 0.10 + f * 0.04;
      r.ellipse(x + 8, y, 6, 7, '#f2a83a');
      ctx.globalAlpha = 1;
    }
  }

  // Alte Wandinschrift (Eingang): eingeritzte Zeilen in der Wand
  function wandinschrift(r) {
    var x = 6 * TILE, y = 1 * TILE;
    r.px(x + 2, y + 3, 12, 11, '#a87e44');
    r.px(x + 3, y + 4, 10, 9, '#c0985c');
    r.px(x + 4, y + 6, 8, 1, '#6a4a24');
    r.px(x + 4, y + 8, 6, 1, '#6a4a24');
    r.px(x + 4, y + 10, 7, 1, '#6a4a24');
    // eingeritzte Parabel als Sieben fehlerhafter Meister
    r.px(x + 8, y + 5, 1, 1, '#f0c040');
  }

  // Steinerne Waage (Mittelraum): Balkenwaage mit zwei Schalen
  function steinerneWaage(r) {
    var x = 6 * TILE, y = 1 * TILE;
    r.px(x + 7, y + 3, 2, 7, '#8a6434');      // Ständer
    r.px(x + 3, y + 3, 10, 1, '#a8834e');     // Balken
    r.px(x + 8, y + 2, 1, 9, '#a8834e');
    r.px(x + 1, y + 6, 4, 3, '#a8834e');      // Schalen
    r.px(x + 11, y + 6, 4, 3, '#a8834e');
    r.px(x + 4, y + 4, 1, 2, '#6a4a24');
    r.px(x + 11, y + 4, 1, 2, '#6a4a24');
    r.px(x + 3, y + 7, 2, 1, '#6a4a24');
  }

  // Sandstein-Vignette, ueber der Spielfigur
  function vignette(r) {
    var ctx = r.getCtx();
    for (var i = 0; i < 2; i++) {
      ctx.globalAlpha = 0.16 - i * 0.05;
      var m = 8 + i * 8;
      r.px(m, m, 256 - 2 * m, 8, '#3c2c14');
      r.px(m, 224 - m - 8, 256 - 2 * m, 8, '#3c2c14');
      r.px(m, m, 8, 224 - 2 * m, '#3c2c14');
      r.px(256 - m - 8, m, 8, 224 - 2 * m, '#3c2c14');
    }
    ctx.globalAlpha = 1;
  }

  // ---Raumbilder aus der Karte vorberechnen ---------------------------------

  function bakeSand(r, def) {
    r.px(0, 0, 256, 224, '#1c1410');
    for (var ty = 0; ty < 14; ty++) {
      for (var tx = 0; tx < 16; tx++) {
        var c = def.map[ty].charAt(tx);
        if (c === '#') continue;
        if (c === 'W') {
          sandWall(r, tx, ty);
          continue;
        }
        sandFloor(r, tx, ty);
        if (c === 'S') column(r, tx, ty);
        else if (c === 'x') rubble(r, tx, ty);
        else if (c === 'M') sandOpening(r, tx, ty, ty < 7);
      }
    }
    if (def.torches) {
      for (var i = 0; i < def.torches.length; i++) wallTorch(r, def.torches[i][0], def.torches[i][1]);
    }
    if (def.bakeExtra) def.bakeExtra(r);
  }

  // ---Die vier Raeume --------------------------------------------------------

  // Eingang: Fackeln, Saeulen, Alte Wandinschrift (Mumienkaefer in enemies.js)
  var EINGANG = {
    map: [
      '################',
      '#WWWWWWWMWWWWWW#',
      '#W............W#',
      '#W....S....S..W#',
      '#W............W#',
      '#W............W#',
      '#W..S.......S.W#',
      '#W............W#',
      '#W............W#',
      '#W.....S..x...W#',
      '#W............W#',
      '#W...x......x.W#',
      '#WWWWWWWMWWWWWW#',
      '################'
    ],
    mats: {
      '8,1': { room: 'smitte', x: 8 * TILE, y: 11 * TILE, facing: 'up' },
      '8,12': { screen: 'oase', x: 8 * TILE, y: 4 * TILE, facing: 'down' }
    },
    torches: [[4, 1], [11, 1], [4, 12], [11, 12]],
    bakeExtra: function (r) { wandinschrift(r); },
    objects: [
      {
        // Erklaer-Objekt: Regel des Tempels
        tiles: [[6, 1]], x: 6 * TILE, y: 1 * TILE,
        name: 'Alte Wandinschrift',
        texts: [
          'Die alten Zeichen sagen: Erst D berechnen, dann die Lösungsformel anwenden.',
          'So entscheidet die Diskriminante über zwei, eine oder keine Lösung – erst dann verrät die Formel die Zahlen.'
        ],
        merk: { id: 'erstD', name: 'Erst D, dann die Formel', text: 'Erst D = b² − 4ac berechnen, dann die Lösungsformel x1,2 = (−b ± √D) : (2a) anwenden.' }
      }
    ]
  };

  // Mittelraum: Quelle als Rastquelle auf halber Strecke, Steinerne Waage
  var MITTE = {
    map: [
      '################',
      '#WWWWWWWMWWWWWW#',
      '#W............W#',
      '#W............W#',
      '#W..S.......S.W#',
      '#W........Q...W#',
      '#W............W#',
      '#W............W#',
      '#W............W#',
      '#W............W#',
      '#W....S...x...W#',
      '#W............W#',
      '#WWWWWWWMWWWWWW#',
      '################'
    ],
    mats: {
      '8,1': { room: 'splatten', x: 10 * TILE, y: 11 * TILE, facing: 'up' },
      '8,12': { room: 'seingang', x: 8 * TILE, y: 2 * TILE, facing: 'down' }
    },
    torches: [[4, 1], [11, 1], [4, 12], [11, 12]],
    bakeExtra: function (r) {
      steinerneWaage(r);
      Buildings.well(r, 10, 5);   // Quelle sieht aus wie der Dorfbrunnen
    },
    objects: [
      {
        // Erklaer-Objekt: Nullstellen als Schnittpunkte mit der x-Achse
        tiles: [[6, 1]], x: 6 * TILE, y: 1 * TILE,
        name: 'Steinerne Waage',
        texts: [
          'Die Waage des Tempels ist immer im Gleichgewicht, wenn man y = 0 setzt.',
          'Nullstellen sind die x-Werte, an denen die Parabel die x-Achse schneidet (y = 0).'
        ],
        merk: { id: 'nullstellen', name: 'Nullstellen', text: 'Nullstellen sind die x-Werte, an denen die Parabel die x-Achse schneidet (y = 0).' }
      },
      {
        // Rastquelle: heilt alle Herzen, speichert die Ruecksprung-Stelle
        tiles: [[10, 5]], x: 10 * TILE, y: 5 * TILE,
        name: 'Quelle',
        texts: ['Du trinkst vom klaren Wasser. Deine Herzen sind wieder voll.'],
        action: 'rest',
        spawn: { x: 10 * TILE, y: 6 * TILE, facing: 'up' }
      }
    ]
  };

  // Kleine Steintafel auf dem Boden (Kartenzeichen 'k')
  function floorTablet(r, tx, ty) {
    var x = tx * TILE, y = ty * TILE;
    r.ellipse(x + 8, y + 14, 7, 2, 'rgba(40,20,10,0.3)');
    r.px(x + 2, y + 3, 12, 11, '#987038');
    r.px(x + 3, y + 4, 10, 9, '#c0985c');
    r.px(x + 3, y + 4, 10, 1, '#d8b47a');
    r.px(x + 5, y + 7, 6, 1, '#6a4a24');
    r.px(x + 5, y + 9, 5, 1, '#6a4a24');
  }

  // Gitter vor der Oeffnung zum Boss (bis das Platten-Raeetsel geloest ist)
  function bars(r) {
    var x = 12 * TILE, y = 1 * TILE;
    r.px(x, y + 2, TILE, 1, '#987038');
    for (var i = 1; i < 16; i += 3) {
      r.px(x + i, y + 2, 2, 14, '#8a6434');
      r.px(x + i, y + 2, 1, 14, '#b8945a');
    }
  }

  // Plattenraum: x-Achse mit sieben Druckplatten (platten.js)
  var PLATTEN = {
    map: [
      '################',
      '#WWWWWWWWWWWMWW#',
      '#W............W#',
      '#W............W#',
      '#W............W#',
      '#W............W#',
      '#W............W#',
      '#W............W#',
      '#W............W#',
      '#W..S.......S.W#',
      '#W............W#',
      '#W........k...W#',
      '#WWWWWWWWWMWWWW#',
      '################'
    ],
    mats: {
      '12,1': { room: 'sboss', x: 12 * TILE, y: 11 * TILE, facing: 'up' },
      '10,12': { room: 'smitte', x: 8 * TILE, y: 2 * TILE, facing: 'down' }
    },
    torches: [[4, 1], [14, 1], [4, 12], [11, 12]],
    bakeExtra: function (r) {
      Platten.bakeGrid(r);
      for (var ty = 0; ty < 14; ty++) {
        for (var tx = 0; tx < 16; tx++) {
          if (PLATTEN.map[ty].charAt(tx) === 'k') floorTablet(r, tx, ty);
        }
      }
    },
    objects: [
      {
        tiles: [[10, 11]], x: 10 * TILE, y: 11 * TILE,
        name: 'Steintafel',
        texts: [
          'Tritt auf die Druckplatten der beiden Nullstellen der Parabel ' + Platten.FORMEL + '. Dann hebt sich das Gitter.',
          'Unten liegt die x-Achse: Die Platten liegen bei x = −3 bis 3. Eine falsche Platte lässt alle zurücksinken.'
        ],
        later: { platten: true, replace: true, texts: ['Beide Platten der Nullstellen sind gedrückt. Das Gitter ist offen.'] }
      }
    ]
  };

  // Sanduhrraum: der Boss folgt in boss.js ('sboss')
  var BOSSRAUM = {
    map: [
      '################',
      '#WWWWWWWWWWWWWW#',
      '#W............W#',
      '#W............W#',
      '#W............W#',
      '#W............W#',
      '#W............W#',
      '#W............W#',
      '#W............W#',
      '#W............W#',
      '#W............W#',
      '#W............W#',
      '#WWWWWWWWWWWMWW#',
      '################'
    ],
    mats: {
      '12,12': { room: 'splatten', x: 12 * TILE, y: 2 * TILE, facing: 'down' }
    },
    torches: [[4, 1], [11, 1], [4, 12]]
  };

  // Raumdefinitionen fertigstellen (Bake, Fackeln, Vignette)
  [EINGANG, MITTE, PLATTEN, BOSSRAUM].forEach(function (R) {
    R.bakeFull = function (r) { bakeSand(r, R); };
    R.overlay = vignette;
    R.anim = function (r, t) { flames(r, t, R.torches || []); };
  });

  // Plattenraum: Platten im Laufbild, Gitter bis das Raeetsel geloest ist
  PLATTEN.anim = function (r, t) {
    flames(r, t, PLATTEN.torches);
    Platten.drawPlates(r, t);
    if (!Platten.isSolved()) bars(r);
  };

  // Bossraum: nach dem Sieg rieselt der Sand in sanften Boegen (der Waechter
  // ist verschwunden, nur eine kleine goldene Sanduhr bleibt)
  BOSSRAUM.anim = function (r, t) {
    flames(r, t, BOSSRAUM.torches);
    if (typeof Boss === 'undefined' || !Boss.of('sboss') || !Boss.of('sboss').isDefeated()) return;
    var ctx = r.getCtx();
    ctx.globalAlpha = 0.12 + 0.05 * (Math.floor(t / 260) % 2);
    r.ellipse(112, 74, 20, 24, '#f8e0a0');
    ctx.globalAlpha = 1;
    r.px(106, 82, 12, 4, '#b8945a');
    r.px(107, 79, 10, 1, '#d8b47a');
  };

  Interior.register('seingang', EINGANG);
  Interior.register('smitte', MITTE);
  Interior.register('splatten', PLATTEN);
  Interior.register('sboss', BOSSRAUM);
})();
