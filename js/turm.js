// turm.js: Der Leuchtturm - Dungeon 2 (Scheitelform)
// Vier Raeume, strikt linear: Eingang (Tuermerin erklaert die Scheitelform),
// Maschinenraum mit Quelle (Rastquelle auf halber Strecke), Spiegelraum
// (Raetsel, folgt in einem spaeteren Schritt), Laternenzimmer (Boss, folgt
// ebenfalls). Aufbau wie die Hoehle: 16 x 14 Kacheln, angemeldet per
// Interior.register(), Uebergaenge ueber mats.
// Zeichen: '#' ausserhalb, 'W' Turmwand, '.' Boden, 'M' Tuermeingang,
//          'x' Kisten (blockieren), 'Q' Quelle (blockiert, wie Hoehle)
(function () {
  'use strict';

  var TILE = 16;
  var hash = Render.hash;

  // --- Turm-Optik ------------------------------------------------------------

  // Heller Steinboden mit Fugen und leichten Abnutzungen
  function towerFloor(r, tx, ty) {
    var x = tx * TILE, y = ty * TILE;
    var even = (tx + ty) % 2 === 0;
    r.px(x, y, TILE, TILE, even ? '#cbc6b8' : '#c2bdaf');
    r.px(x, y, TILE, 1, '#b4afa0');      // Fuge oben
    r.px(x, y + 15, TILE, 1, '#a8a294'); // Fuge unten
    r.px(x, y, 1, TILE, '#b4afa0');      // Fuge links
    r.px(x + 15, y, 1, TILE, '#a8a294');
    if (hash(tx * 3, ty * 5) > 0.75) {
      r.px(x + 3 + Math.floor(hash(tx, ty) * 9), y + 5, 4, 1, '#b8b2a4');
      r.px(x + 8, y + 10 + Math.floor(hash(ty, tx) * 4), 3, 1, '#b8b2a4');
    }
  }

  // Turmwand: hellgrauer Putz, unten ein rotes Band (wie der Turm aussen)
  function towerWall(r, tx, ty) {
    var x = tx * TILE, y = ty * TILE;
    r.px(x, y, TILE, TILE, '#ece7da');
    r.px(x, y, TILE, 1, '#f6f2e8');
    r.px(x, y + 11, TILE, 5, '#d8443c');   // rotes Band
    r.px(x, y + 11, TILE, 1, '#ea6a5e');
    r.px(x, y + 15, TILE, 1, '#a89e90');
    var j = (ty % 2) ? 5 : 11;
    r.px(x + j, y, 1, 2, '#dccfb9');       // Putznaht
    if (hash(tx * 7, ty * 3) > 0.85) r.px(x + 2, y + 6, 2, 1, '#dccfb9');
  }

  // Kisten und Seilrollen (blockieren)
  function crate(r, tx, ty) {
    var x = tx * TILE, y = ty * TILE;
    r.ellipse(x + 8, y + 14, 7, 2, 'rgba(40,20,10,0.3)');
    r.px(x + 2, y + 3, 12, 11, '#8a5a32');
    r.px(x + 3, y + 4, 10, 9, '#b07a46');
    r.px(x + 3, y + 8, 10, 1, '#8a5a32');
    r.px(x + 8, y + 4, 1, 9, '#8a5a32');
    r.px(x + 3, y + 4, 10, 1, '#d09a62');
  }

  // Turmeingang (Uebergang): Rundbogen mit dunklem Durchgang
  function towerOpening(r, tx, ty, top) {
    var x = tx * TILE, y = ty * TILE;
    r.px(x, y, TILE, TILE, '#16141c');
    r.px(x + 1, y + (top ? 3 : 1), 14, 3, '#a89e90');
    r.px(x + 1, y + (top ? 3 : 1), 14, 1, '#c4baa8');
  }

  // Fenster in der Turmwand mit Blick auf die dunkle See (Licht ist erloschen)
  function seaWindow(r, tx, ty) {
    var x = tx * TILE, y = ty * TILE;
    r.px(x + 3, y + 2, 10, 11, '#6e4a2c');
    r.px(x + 4, y + 3, 8, 9, '#1a2436');
    r.px(x + 4, y + 6, 8, 1, '#2c3a52');   // Horizont
    r.px(x + 5, y + 8, 2, 1, '#31435e');
    r.px(x + 9, y + 10, 2, 1, '#31435e');
    r.px(x + 7, y + 3, 2, 9, '#6e4a2c');   // Sprosse
    r.px(x + 4, y + 7, 8, 1, '#6e4a2c');
    r.px(x + 2, y + 13, 12, 2, '#a89e90'); // Sims
  }

  // Waerterin am Fenster (Laternen sind seit dem Bann erloschen)
  function wallLamp(r, tx, ty) {
    var x = tx * TILE, y = ty * TILE;
    r.px(x + 6, y + 8, 4, 6, '#5a5468');
    r.px(x + 5, y + 14, 6, 2, '#8a8496');
    r.px(x + 5, y + 5, 6, 4, '#3e3a4a');   // dunkle Laternen
    r.px(x + 6, y + 6, 4, 2, '#2a2634');   // keine Flamme
  }

  // Alte Turmuhr an der Wand des Maschinenraums (Kachel 6,1)
  function turmuhr(r) {
    var x = 6 * TILE, y = 1 * TILE;
    r.px(x + 2, y + 2, 12, 12, '#8a8496');
    r.px(x + 3, y + 3, 10, 10, '#f8f4ea');
    r.px(x + 3, y + 3, 10, 1, '#ffffff');
    r.px(x + 8, y + 5, 1, 4, '#2a2030');   // Zeiger
    r.px(x + 8, y + 8, 4, 1, '#2a2030');
    // kleine Parabel auf dem Rand der Uhr, mit Scheitel unten
    r.px(x + 5, y + 11, 1, 1, '#b8946a');
    r.px(x + 6, y + 12, 1, 1, '#b8946a');
    r.px(x + 7, y + 13, 2, 1, '#b8946a');
    r.px(x + 9, y + 12, 1, 1, '#b8946a');
    r.px(x + 10, y + 11, 1, 1, '#b8946a');
  }

  // Seichte Vignette, ueber der Spielfigur (Turm ist heller als die Hoehle)
  function vignette(r) {
    var ctx = r.getCtx();
    for (var i = 0; i < 2; i++) {
      ctx.globalAlpha = 0.14 - i * 0.05;
      var m = 8 + i * 8;
      r.px(m, m, 256 - 2 * m, 8, '#3a3630');
      r.px(m, 224 - m - 8, 256 - 2 * m, 8, '#3a3630');
      r.px(m, m, 8, 224 - 2 * m, '#3a3630');
      r.px(256 - m - 8, m, 8, 224 - 2 * m, '#3a3630');
    }
    ctx.globalAlpha = 1;
  }

  // --- Raumbilder aus der Karte vorberechnen ---------------------------------

  function bakeTower(r, def) {
    r.px(0, 0, 256, 224, '#16141c');
    for (var ty = 0; ty < 14; ty++) {
      for (var tx = 0; tx < 16; tx++) {
        var c = def.map[ty].charAt(tx);
        if (c === '#') continue;
        if (c === 'W') {
          towerWall(r, tx, ty);
          continue;
        }
        towerFloor(r, tx, ty);
        if (c === 'x') crate(r, tx, ty);
        else if (c === 'M') towerOpening(r, tx, ty, ty < 7);
      }
    }
    if (def.windows) {
      for (var i = 0; i < def.windows.length; i++) seaWindow(r, def.windows[i][0], def.windows[i][1]);
    }
    if (def.lamps) {
      for (var j = 0; j < def.lamps.length; j++) wallLamp(r, def.lamps[j][0], def.lamps[j][1]);
    }
    if (def.bakeExtra) def.bakeExtra(r);
  }

  // --- Die vier Raeume --------------------------------------------------------

  // Eingang: von der Kueste nach oben in den Maschinenraum
  var EINGANG = {
    map: [
      '################',
      '#WWWWWWWMWWWWWW#',
      '#W............W#',
      '#W....x.......W#',
      '#W............W#',
      '#W..x.......x.W#',
      '#W............W#',
      '#W............W#',
      '#W.....x......W#',
      '#W............W#',
      '#W..x.......x.W#',
      '#W............W#',
      '#WWWWWWWMWWWWWW#',
      '################'
    ],
    mats: {
      '8,1': { room: 'lmitte', x: 8 * TILE, y: 11 * TILE, facing: 'up' },
      '8,12': { screen: 'kueste', x: 8.5 * TILE, y: 12 * TILE, facing: 'down' }
    },
    windows: [[3, 1], [12, 1]],
    lamps: [[5, 1], [10, 1], [5, 12], [10, 12]],
    // Erklaer-NPC des Turms: Merksatz zur Scheitelform
    npc: {
      x: 3 * TILE, y: 3 * TILE,
      sprites: function () { return People.tuemerin(); },
      talk: {
        name: 'Türmerin',
        texts: [
          'Endlich jemand! Ich hüte diesen Turm, seit das Licht erloschen ist. Alles hier drin folgt der Scheitelform.',
          'Sie lautet: y = a(x − xs)² + ys. Darin ist S(xs|ys) der Scheitel – der Punkt, um den die Parabel symmetrisch ist.'
        ],
        merk: { id: 'scheitelformTurm', name: 'Scheitelform (Turm)', text: 'Scheitelform: y = a(x − xs)² + ys mit dem Scheitel S(xs|ys).' }
      },
      frame: function (t) { var f = Math.floor(t / 400) % 2; return { i: 0, dx: 0, dy: f }; }
    }
  };

  // Maschinenraum: Quelle als Rastquelle auf halber Strecke, Alte Turmuhr
  var MASCHINEN = {
    map: [
      '################',
      '#WWWWWWWMWWWWWW#',
      '#W............W#',
      '#W............W#',
      '#W............W#',
      '#W........Q...W#',
      '#W............W#',
      '#W............W#',
      '#W....x.......W#',
      '#W............W#',
      '#W........x...W#',
      '#W............W#',
      '#WWWWWWWMWWWWWW#',
      '################'
    ],
    mats: {
      '8,1': { room: 'lraetsel', x: 8 * TILE, y: 11 * TILE, facing: 'up' },
      '8,12': { room: 'leingang', x: 8 * TILE, y: 2 * TILE, facing: 'down' }
    },
    windows: [[3, 1], [12, 1]],
    lamps: [[5, 1], [10, 1], [5, 12], [10, 12]],
    bakeExtra: function (r) {
      turmuhr(r);
      Buildings.well(r, 9, 5);   // Quelle sieht aus wie der Dorfbrunnen
    },
    objects: [
      {
        // Erklaer-Objekt: Merksatz zum Scheitel als Randpunkt
        tiles: [[6, 1]],
        x: 6 * TILE, y: 1 * TILE,
        name: 'Alte Turmuhr',
        texts: [
          'Auf dem Zifferblatt ist eine Parabel eingraviert: Bei a > 0 ist ihr Scheitel der tiefste Punkt, bei a < 0 der höchste.'
        ],
        merk: { id: 'scheitelrand', name: 'Scheitel als Randpunkt', text: 'Bei a > 0 ist der Scheitel der tiefste Punkt der Parabel, bei a < 0 der höchste.' }
      },
      {
        // Rastquelle: heilt alle Herzen, speichert die Ruecksprung-Stelle
        tiles: [[9, 5]],
        x: 9 * TILE, y: 5 * TILE,
        name: 'Quelle',
        texts: ['Du trinkst vom klaren Wasser. Deine Herzen sind wieder voll.'],
        action: 'rest',
        spawn: { x: 9 * TILE, y: 6 * TILE, facing: 'up' }
      }
    ]
  };

  // Kleine Steintafel auf dem Boden (Kartenzeichen 'k'), wie in der Hoehle
  function floorTablet(r, tx, ty) {
    var x = tx * TILE, y = ty * TILE;
    r.ellipse(x + 8, y + 14, 7, 2, 'rgba(40,20,10,0.3)');
    r.px(x + 2, y + 3, 12, 11, '#8a8496');
    r.px(x + 3, y + 4, 10, 9, '#b4aec2');
    r.px(x + 3, y + 4, 10, 1, '#c8c2d4');
    r.px(x + 5, y + 7, 6, 1, '#6a6458');
    r.px(x + 5, y + 9, 5, 1, '#6a6458');
  }

  // Gitter vor der Oeffnung zum Boss (bis das Spiegel-Raetsel geloest ist)
  function bars(r) {
    var x = 8 * TILE, y = 1 * TILE;
    r.px(x, y + 2, TILE, 1, '#8a8496');
    for (var i = 1; i < 16; i += 3) {
      r.px(x + i, y + 2, 2, 14, '#6a6478');
      r.px(x + i, y + 2, 1, 14, '#9a94a8');
    }
  }

  // Spiegelraum: Licht auf die Spiegel lenken, die auf der Parabel stehen
  // (Logik in spiegel.js, Gitter zum Boss oeffnet sich erst danach)
  var SPIEGEL = {
    map: Spiegel.stampMap([
      '################',
      '#WWWWWWWMWWWWWW#',
      '#W............W#',
      '#W............W#',
      '#W............W#',
      '#W............W#',
      '#W............W#',
      '#W............W#',
      '#W............W#',
      '#W............W#',
      '#W............W#',
      '#W........k...W#',
      '#WWWWWWWMWWWWWW#',
      '################'
    ]),
    mats: {
      '8,1': { room: 'lboss', x: 8 * TILE, y: 11 * TILE, facing: 'up' },
      '8,12': { room: 'lmitte', x: 8 * TILE, y: 2 * TILE, facing: 'down' }
    },
    windows: [[3, 1], [12, 1]],
    lamps: [[5, 1], [10, 1], [5, 12], [10, 12]],
    bakeExtra: function (r) {
      Spiegel.bakeGrid(r);
      for (var ty = 0; ty < 14; ty++) {
        for (var tx = 0; tx < 16; tx++) {
          var c = SPIEGEL.map[ty].charAt(tx);
          if (c === 'm') Spiegel.bakeStand(r, tx, ty);
          else if (c === 'k') floorTablet(r, tx, ty);
        }
      }
    },
    objects: Spiegel.objects().concat([
      {
        tiles: [[10, 11]],
        x: 10 * TILE, y: 11 * TILE,
        name: 'Steintafel',
        texts: [
          'Lenke das Licht auf die Spiegel, die auf der Parabel ' + Spiegel.FORMEL + ' stehen. Dann \u00f6ffnet sich das Gitter.',
          'Unten stehen die x-Werte, links die y-Werte. In jeder Spalte steht genau ein Spiegel richtig.'
        ],
        later: { spiegel: true, replace: true, texts: ['Alle Spiegel auf der Parabel ' + Spiegel.FORMEL + ' stehen im Licht. Das Gitter ist offen.'] }
      }
    ])
  };

  // Laternenzimmer: der Boss folgt in einem spaeteren Schritt
  var LATERNE = {
    map: [
      '################',
      '#WWWWWWWMWWWWWW#',
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
      '#WWWWWWWMWWWWWW#',
      '################'
    ],
    mats: {
      '8,12': { room: 'lraetsel', x: 8 * TILE, y: 2 * TILE, facing: 'down' }
    },
    windows: [[3, 1], [12, 1]],
    lamps: [[5, 1], [10, 1], [5, 12], [10, 12]]
  };

  // Raumdefinitionen fertigstellen (Bake und Vignette)
  [EINGANG, MASCHINEN, SPIEGEL, LATERNE].forEach(function (R) {
    R.bakeFull = function (r) { bakeTower(r, R); };
    R.overlay = vignette;
  });

  // Laternenzimmer: nach dem Sieg des Bosses haengt die Laterne leuchtend
  // ueber der Raummitte (der Waechter selbst ist verschwunden)
  LATERNE.anim = function (r, t) {
    if (typeof Boss === 'undefined' || !Boss.of('lboss') || !Boss.of('lboss').isDefeated()) return;
    var ctx = r.getCtx();
    ctx.globalAlpha = 0.16 + 0.04 * (Math.floor(t / 260) % 2);
    r.ellipse(112, 74, 22, 26, '#f8e88a');
    ctx.globalAlpha = 1;
    // kleine leuchtende Laterne an der Decke
    r.px(111, 40, 1, 8, '#3a3644');
    r.px(107, 48, 12, 16, '#f0c048');
    r.px(109, 50, 8, 12, '#f8e88a');
    r.px(107, 48, 12, 1, '#4a4456');
    r.px(107, 64, 12, 1, '#4a4456');
    r.px(107, 55, 12, 1, '#3a3644');
  };

  // Spiegelraum: Licht im Laufbild, Gitter bis das Raetsel geloest ist
  SPIEGEL.anim = function (r, t) {
    Spiegel.drawLight(r, t);
    if (!Spiegel.isSolved()) bars(r);
  };

  Interior.register('leingang', EINGANG);
  Interior.register('lmitte', MASCHINEN);
  Interior.register('lraetsel', SPIEGEL);
  Interior.register('lboss', LATERNE);
})();
