// dungeon.js: Die Hoehle der Parabeln - Dungeon 1 (Normalparabel und Parameter)
// Drei Raeume: Eingangshalle, Mittelraum mit Quelle (Rastquelle auf halber
// Strecke), Vorraum zum Boss (Tor verschlossen, Steintafel als Hinweis).
// Aufbau wie Innenraeume: 16 x 14 Kacheln, angemeldet per Interior.register().
// Zeichen: '#' ausserhalb, 'W' Hoehlenwand, '.' Boden, 'x' Felsbrocken,
//          'Q' Wasser der Quelle, 'M' Hoehlenoeffnung (Uebergang)
(function () {
  'use strict';

  var TILE = 16;
  var hash = Render.hash;

  // --- Hoehlen-Optik ---------------------------------------------------------

  // Steiniger Boden mit Sprenkeln und Rissen
  function caveFloor(r, tx, ty) {
    var x = tx * TILE, y = ty * TILE;
    r.px(x, y, TILE, TILE, '#2a2634');
    for (var i = 0; i < 14; i++) {
      var gx = x + Math.floor(hash(tx * 31 + i, ty * 17 + i) * 16);
      var gy = y + Math.floor(hash(tx + i * 7, ty * 3 + i) * 16);
      var h = hash(tx * 5 + i, ty * 13 - i);
      r.px(gx, gy, 1 + Math.floor(h * 2), 1, h > 0.72 ? '#3a3546' : '#221e2a');
    }
    if (hash(tx * 3, ty * 7) > 0.8) {
      r.px(x + 3 + Math.floor(hash(tx, ty) * 8), y + 5, 4, 1, '#1c1926');
      r.px(x + 5 + Math.floor(hash(ty, tx) * 6), y + 6, 3, 1, '#1c1926');
    }
  }

  // Hoehlenwand: grobe Steinquader mit Moosflecken
  function caveWall(r, tx, ty) {
    var x = tx * TILE, y = ty * TILE;
    r.px(x, y, TILE, TILE, '#3e3a4a');
    r.px(x, y, TILE, 1, '#524c60');
    r.px(x, y + 15, TILE, 1, '#2c2838');
    r.px(x, y, 1, TILE, '#4a4456');
    r.px(x + 15, y, 1, TILE, '#332f40');
    var j1 = (ty % 2) ? 4 : 10, j2 = (ty % 2) ? 12 : 6;
    r.px(x + j1, y, 1, 8, '#332f40');
    r.px(x + j2, y + 8, 1, 8, '#332f40');
    r.px(x, y + 7, TILE, 1, '#332f40');
    if (hash(tx * 5, ty * 3) > 0.6) {
      r.px(x + 2 + Math.floor(hash(tx, ty) * 6), y + 3, 3, 2, '#4c6a44');
      r.px(x + 8 + Math.floor(hash(ty, tx) * 5), y + 10, 2, 2, '#3c5a38');
    }
    r.px(x + 3, y + 2, 2, 1, '#5a5468');
    r.px(x + 11, y + 11, 2, 1, '#5a5468');
  }

  // Felsbrocken (blockiert)
  function rock(r, tx, ty) {
    var x = tx * TILE, y = ty * TILE;
    r.ellipse(x + 8, y + 12, 7, 4, 'rgba(0,0,0,0.35)');
    r.ellipse(x + 8, y + 9, 7, 6, '#3a3546');
    r.ellipse(x + 7, y + 8, 5, 4, '#4c4658');
    r.ellipse(x + 6, y + 7, 2, 2, '#5e5870');
    r.px(x + 10, y + 11, 3, 2, '#2e2a3a');
  }

  // Stalagmit: kleiner Felz, auf dem ein Hoehlen-Bewohner steht (blockiert)
  function stalagmite(r, tx, ty) {
    var x = tx * TILE, y = ty * TILE;
    r.px(x + 6, y + 12, 4, 3, '#3a3546');
    r.px(x + 5, y + 8, 6, 5, '#4c4658');
    r.px(x + 7, y + 5, 2, 4, '#5e5870');
  }

  // Hoehlenoeffnung (Uebergang): dunkles Loch mit Steinsim
  function caveOpening(r, tx, ty, top) {
    var x = tx * TILE, y = ty * TILE;
    r.px(x, y, TILE, TILE, '#0e0c14');
    r.px(x + 1, y + (top ? 12 : 1), 14, 3, '#4a4456');
    r.px(x + 1, y + (top ? 12 : 1), 14, 1, '#5e5870');
  }

  // Fackelhalter an der Wand (Flamme animiert in anim)
  function torch(r, tx, ty) {
    var x = tx * TILE, y = ty * TILE;
    r.px(x + 7, y + 8, 2, 6, '#5a4630');
    r.px(x + 6, y + 13, 4, 2, '#3e3226');
    r.px(x + 6, y + 7, 4, 2, '#2a2634');
  }

  // Flammen flackern, dazu ein warmer Lichtschein auf Boden und Wand
  function flames(r, t, torches) {
    var ctx = r.getCtx();
    for (var i = 0; i < torches.length; i++) {
      var x = torches[i][0] * TILE, y = torches[i][1] * TILE;
      var f = Math.floor(t / 90 + i * 3) % 3;
      var h = 4 + f;
      r.px(x + 6, y + 8 - h, 4, h, '#e8943a');
      r.px(x + 7, y + 9 - h, 2, h - 1, '#f6c04a');
      r.px(x + 7, y + 8 - h, 1, 2, '#f8e88a');
      ctx.globalAlpha = 0.08 + 0.02 * f;
      r.ellipse(x + 8, y + 18, 14, 6, '#f0b050');
      ctx.globalAlpha = 1;
    }
  }

  // Quelle im Mittelraum: steinernes Becken mit klarem Wasser
  function poolBake(r) {
    var x = 7 * TILE, y = 4 * TILE, w = 2 * TILE, h = 4 * TILE;
    r.px(x - 2, y - 2, w + 4, h + 4, '#4a4456');
    r.px(x - 2, y - 2, w + 4, 1, '#5e5870');
    r.px(x - 2, y + h + 1, w + 4, 1, '#332f40');
  }

  // Wasserschimmer (animiert)
  function poolShimmer(r, t) {
    var x = 7 * TILE, y = 4 * TILE, w = 2 * TILE, h = 4 * TILE;
    var ctx = r.getCtx();
    ctx.globalAlpha = 0.5;
    for (var i = 0; i < 6; i++) {
      var p = (t / 900 + i / 6) % 1;
      var wy = y + 2 + Math.floor(p * (h - 6));
      ctx.globalAlpha = 0.35 * (1 - p);
      r.px(x + 3 + (i % 3) * 5, wy, 4, 1, '#dcf2fb');
    }
    ctx.globalAlpha = 1;
  }

  // Verschluss-Tor im Vorraum (oeffnet sich erst nach dem Boss-Sieg)
  function gate(r) {
    var x = 6 * TILE, y = TILE;
    r.px(x - 2, y - 2, 36, 50, '#4a4456');
    r.px(x - 2, y - 2, 36, 1, '#5e5870');
    r.px(x, y, 32, 48, '#14121c');
    r.px(x + 2, y + 2, 12, 44, '#2e2a3a');
    r.px(x + 18, y + 2, 12, 44, '#2e2a3a');
    r.px(x + 2, y + 2, 12, 1, '#4a4456');
    r.px(x + 18, y + 2, 12, 1, '#4a4456');
    for (var i = 0; i < 8; i++) r.px(x + 2 + i * 4, y + 20, 2, 2, '#8a8496');
    r.px(x + 14, y + 18, 4, 5, '#e8c04a');
    r.px(x + 15, y + 20, 2, 2, '#b8863a');
  }

  // Offenes Boss-Tor (nach dem Sieg): dunkler Durchgang, Fluegel angeschlagen
  function drawGateOpen(r) {
    r.px(6 * TILE - 2, 1 * TILE - 2, 36, 2, '#5e5870');
    r.px(6 * TILE, 1 * TILE, 32, 48, '#0a0812');
    r.px(6 * TILE, 1 * TILE, 32, 1, '#3e3a4a');
    r.px(6 * TILE, 1 * TILE, 5, 48, '#2e2a3a');
    r.px(6 * TILE + 27, 1 * TILE, 5, 48, '#2e2a3a');
    // schwaches Licht im Durchgang
    r.px(6 * TILE + 13, 1 * TILE + 34, 6, 12, '#141a26');
    r.px(6 * TILE + 14, 1 * TILE + 38, 4, 8, '#1e2e40');
  }

  // Steintafel vor dem Tor (Hinweis, dass der Boss noch fehlt)
  function tablet(r) {
    var x = 6 * TILE, y = 3 * TILE;
    r.ellipse(x + 16, y + 15, 14, 3, 'rgba(0,0,0,0.35)');
    r.px(x + 6, y + 6, 20, 10, '#5a5468');
    r.px(x + 7, y + 7, 18, 8, '#6a6478');
    r.px(x + 8, y + 9, 14, 1, '#4a4456');
    r.px(x + 8, y + 11, 10, 1, '#4a4456');
  }

  // Dunkler Rand (Vignette), ueber der Spielfigur
  function vignette(r) {
    var ctx = r.getCtx();
    for (var i = 0; i < 3; i++) {
      ctx.globalAlpha = 0.22 - i * 0.06;
      var m = i * 8;
      r.px(m, m, 256 - 2 * m, 8, '#0a0812');
      r.px(m, 224 - m - 8, 256 - 2 * m, 8, '#0a0812');
      r.px(m, m, 8, 224 - 2 * m, '#0a0812');
      r.px(256 - m - 8, m, 8, 224 - 2 * m, '#0a0812');
    }
    ctx.globalAlpha = 1;
  }

  // --- Raumbilder aus der Karte vorberechnen ---------------------------------

  function bakeCave(r, def) {
    r.px(0, 0, 256, 224, '#0e0c14');
    for (var ty = 0; ty < 14; ty++) {
      for (var tx = 0; tx < 16; tx++) {
        var c = def.map[ty].charAt(tx);
        if (c === '#') continue;
        if (c === 'W') {
          caveWall(r, tx, ty);
          continue;
        }
        caveFloor(r, tx, ty);
        if (c === 'x') rock(r, tx, ty);
        else if (c === 'N') stalagmite(r, tx, ty);
        else if (c === 'Q') r.px(tx * TILE, ty * TILE, TILE, TILE, '#1c3a5e');
        else if (c === 'M') caveOpening(r, tx, ty, ty < 7);
      }
    }
    if (def.torches) {
      for (var i = 0; i < def.torches.length; i++) torch(r, def.torches[i][0], def.torches[i][1]);
    }
    if (def.bakeExtra) def.bakeExtra(r);
  }

  // --- Die drei Raeume --------------------------------------------------------

  // Eingangshalle: vom Ruinen-Eingang nach oben in den Mittelraum
  var HALLE = {
    map: [
      '################',
      '#WWWWWWWMWWWWWW#',
      '#W..N.........W#',
      '#W............W#',
      '#W....x....x..W#',
      '#W............W#',
      '#W..x.......x.W#',
      '#W............W#',
      '#W......x.....W#',
      '#W............W#',
      '#W...x......x.W#',
      '#W............W#',
      '#WWWWWWWMWWWWWW#',
      '################'
    ],
    // Oeffnungen: oben in den Mittelraum, unten zurueck zur Ruine
    mats: {
      '8,1': { room: 'dmittel', x: 8 * TILE, y: 11 * TILE, facing: 'up' },
      '8,12': { screen: 'ruine', x: 6 * TILE, y: 5 * TILE, facing: 'down' }
    },
    torches: [[4, 1], [11, 1], [4, 12], [11, 12]],
    // Erklaer-NPC der Hoehle: Merksatz zur Scheitelform
    npc: {
      x: 3 * TILE, y: 2 * TILE,
      sprites: function () { return People.wanderer(); },
      talk: {
        name: 'Forscherin',
        texts: [
          'Ich erforsche die Parabeln dieser H\u00f6hle. Merke dir: Aus dem Scheitel S(xs|ys) und einem weiteren Punkt P stellst du die Scheitelform auf.',
          'Die Flederm\u00e4use und Kristallgeister pr\u00fcen genau das. Besiegst du sie alle, wartet vor dem verschlossenen Tor der W\u00e4chter des Bosses.'
        ],
        merk: { id: 'scheitelform', name: 'Scheitelform aufstellen', text: 'Aus S(xs|ys) und Punkt P ergibt sich die Scheitelform: Setze beide Punkte in y = a(x \u2212 xs)\u00b2 + ys ein.' }
      },
      frame: function (t) { return { i: 0, dx: 0, dy: 0 }; }
    }
  };

  // Mittelraum: Quelle als Rastquelle auf halber Strecke
  var MITTEL = {
    map: [
      '################',
      '#WWWWWWWMWWWWWW#',
      '#W............W#',
      '#W............W#',
      '#W.....QQ.....W#',
      '#W.....QQ.....W#',
      '#W.....QQ.....W#',
      '#W.....QQ.....W#',
      '#W............W#',
      '#W............W#',
      '#W....x....x..W#',
      '#W............W#',
      '#WWWWWWWMWWWWWW#',
      '################'
    ],
    mats: {
      '8,1': { room: 'dboss', x: 8 * TILE, y: 11 * TILE, facing: 'up' },
      '8,12': { room: 'dhalle', x: 8 * TILE, y: 2 * TILE, facing: 'down' }
    },
    torches: [[4, 1], [11, 1], [4, 12], [11, 12]],
    bakeExtra: poolBake,
    objects: [
      {
        // Rastquelle: heilt alle Herzen, speichert die Ruecksprung-Stelle
        tiles: [[7, 3], [8, 3], [6, 4], [6, 5], [6, 6], [6, 7],
               [9, 4], [9, 5], [9, 6], [9, 7], [7, 8], [8, 8]],
        x: 8 * TILE, y: 4 * TILE,
        name: 'Quelle',
        texts: ['Du trinkst vom klaren Wasser. Deine Herzen sind wieder voll.'],
        action: 'rest',
        spawn: { x: 7 * TILE, y: 9 * TILE, facing: 'up' }
      }
    ]
  };

  // Vorraum: verschlossenes Boss-Tor mit Steintafel
  var BOSS = {
    map: [
      '################',
      '#WWWWWTTWWWWWWW#',
      '#WWWWWTTWWWWWWW#',
      '#W....xx......W#',
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
      '8,12': { room: 'dmittel', x: 8 * TILE, y: 2 * TILE, facing: 'down' }
    },
    torches: [[3, 1], [12, 1], [3, 12], [12, 12]],
    bakeExtra: function (r) {
      gate(r);
      tablet(r);
    },
    objects: [
      {
        tiles: [[6, 3], [7, 3]],
        x: 7 * TILE, y: 3 * TILE,
        name: 'Steintafel',
        texts: ['Verschlossen. Erst wenn der W\u00e4chter der H\u00f6hle der Parabeln besiegt ist, \u00f6ffnet sich dieses Tor.']
      }
    ]
  };

  // Raumdefinitionen fertigstellen (Bake, Animation, Vignette)
  [HALLE, MITTEL, BOSS].forEach(function (R) {
    R.bakeFull = function (r) { bakeCave(r, R); };
    R.anim = function (r, t) {
      flames(r, t, R.torches);
      if (R === MITTEL) poolShimmer(r, t);
    };
    R.overlay = vignette;
  });

  // Vorraum: oeffnet das Tor im Laufbild, sobald der Boss besiegt ist
  BOSS.anim = function (r, t) {
    flames(r, t, BOSS.torches);
    if (typeof Boss !== 'undefined' && Boss.isDefeated()) drawGateOpen(r);
  };

  Interior.register('dhalle', HALLE);
  Interior.register('dmittel', MITTEL);
  Interior.register('dboss', BOSS);
})();
