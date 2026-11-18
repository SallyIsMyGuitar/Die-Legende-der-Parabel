// wasser.js: Das versunkene Wasserreich - Dungeon 3 (Allgemeine Form)
// Vier Raeume, strikt linear: Eingang (Netzweber erklaert das Umformen in
// die Scheitelform), Pumpenkammer mit Quelle (Rastquelle auf halber
// Strecke) und Alter Bildtafel, Raetselraum (Gezeiten-Raetsel, folgt in
// einem spaeteren Schritt), Vorraum zum Boss (folgt ebenfalls).
// Aufbau wie Hoehle und Turm: 16 x 14 Kacheln, angemeldet per
// Interior.register(), Uebergaenge ueber mats.
// Zeichen: '#' ausserhalb, 'W' Grottenwand, '.' Boden, 'M' Wasserlauf
//          (Uebergang), 'x' Muschelhaufen (blockiert), 'Q' Quelle
(function () {
  'use strict';

  var TILE = 16;
  var hash = Render.hash;

  // --- Wasserreich-Optik -------------------------------------------------------

  // Blaeulicher Steinboden mit Glitzer
  function seaFloor(r, tx, ty) {
    var x = tx * TILE, y = ty * TILE;
    r.px(x, y, TILE, TILE, '#28425a');
    for (var i = 0; i < 8; i++) {
      var gx = x + Math.floor(hash(tx * 13 + i, ty * 7 + i) * 16);
      var gy = y + Math.floor(hash(tx + i * 5, ty * 3 + i) * 16);
      var h = hash(tx * 7 + i, ty * 11 - i);
      r.px(gx, gy, 1 + Math.floor(h * 2), 1, h > 0.75 ? '#3e5e7a' : '#1e3246');
    }
    if (hash(tx * 3, ty * 5) > 0.8) {
      r.px(x + 4 + Math.floor(hash(tx, ty) * 7), y + 6, 4, 1, '#35506a');
    }
  }

  // Grottenwand: blaue Quader mit Muscheln und Anemonen
  function seaWall(r, tx, ty) {
    var x = tx * TILE, y = ty * TILE;
    r.px(x, y, TILE, TILE, '#3a5a74');
    r.px(x, y, TILE, 1, '#4c7090');
    r.px(x, y + 15, TILE, 1, '#28445c');
    r.px(x, y, 1, TILE, '#446480');
    r.px(x + 15, y, 1, TILE, '#2e4c66');
    var j1 = (ty % 2) ? 4 : 10, j2 = (ty % 2) ? 12 : 6;
    r.px(x + j1, y, 1, 8, '#2e4c66');
    r.px(x + j2, y + 8, 1, 8, '#2e4c66');
    r.px(x, y + 7, TILE, 1, '#2e4c66');
    if (hash(tx * 5, ty * 3) > 0.6) {
      r.px(x + 3 + Math.floor(hash(tx, ty) * 6), y + 3, 3, 2, '#7ac0c8');   // Anemone
      r.px(x + 8 + Math.floor(hash(ty, tx) * 5), y + 10, 2, 2, '#6ab0b8');
    }
    r.px(x + 2, y + 2, 2, 1, '#8ac4cc');
    r.px(x + 11, y + 11, 2, 1, '#8ac4cc');
  }

  // Korallen- und Muschelhaufen (blockieren)
  function coralPile(r, tx, ty) {
    var x = tx * TILE, y = ty * TILE;
    r.ellipse(x + 8, y + 14, 7, 2, 'rgba(10,25,40,0.5)');
    r.px(x + 3, y + 8, 10, 6, '#7a5a6a');
    r.px(x + 4, y + 9, 8, 5, '#9a7a8a');
    r.px(x + 5, y + 4, 2, 5, '#8a6a7a');     // Korallenzweig
    r.px(x + 9, y + 5, 2, 4, '#8a6a7a');
    r.px(x + 6, y + 11, 4, 3, '#e8e0d0');   // Muschel
    r.px(x + 7, y + 11, 2, 1, '#c8b8a8');
  }

  // Wasserlauf (Uebergang): dunkler Kanal mit Schaumkante
  function seaOpening(r, tx, ty, top) {
    var x = tx * TILE, y = ty * TILE;
    r.px(x, y, TILE, TILE, '#0c1826');
    r.px(x + 1, y + (top ? 12 : 1), 14, 3, '#3e5e7a');
    r.px(x + 1, y + (top ? 12 : 1), 14, 1, '#7ac0c8');
    for (var i = 2; i < 14; i += 4) {
      r.px(x + i, y + (top ? 11 : 4), 2, 1, '#8ac4cc');
    }
  }

  // Alte Bildtafel an der Wand der Pumpenkammer (Kachel 6,1)
  function bildtafel(r) {
    var x = 6 * TILE, y = 1 * TILE;
    r.px(x + 1, y + 2, 14, 12, '#3a4a5a');
    r.px(x + 2, y + 3, 12, 10, '#8aa8b8');
    r.px(x + 2, y + 3, 12, 1, '#b0ccd8');
    // eingravierte Zeilen und ein kleiner Scheitel-Punkt
    r.px(x + 4, y + 6, 8, 1, '#3a4a5a');
    r.px(x + 4, y + 8, 6, 1, '#3a4a5a');
    r.px(x + 7, y + 10, 2, 2, '#f0c040');   // markierter Scheitel
    r.px(x + 5, y + 5, 2, 1, '#3a4a5a');
    r.px(x + 10, y + 5, 2, 1, '#3a4a5a');
  }

  // Blaue Vignette, ueber der Spielfigur (Unterwasser-Licht)
  function vignette(r) {
    var ctx = r.getCtx();
    for (var i = 0; i < 3; i++) {
      ctx.globalAlpha = 0.2 - i * 0.05;
      var m = 8 + i * 8;
      r.px(m, m, 256 - 2 * m, 8, '#0a1826');
      r.px(m, 224 - m - 8, 256 - 2 * m, 8, '#0a1826');
      r.px(m, m, 8, 224 - 2 * m, '#0a1826');
      r.px(256 - m - 8, m, 8, 224 - 2 * m, '#0a1826');
    }
    ctx.globalAlpha = 1;
  }

  // Aufsteigende Luftblasen (Laufbild ueber dem Raum)
  function bubbles(r, t, seedTx) {
    var ctx = r.getCtx();
    for (var i = 0; i < 6; i++) {
      var ph = (t / 1400 * 0.6 + i / 6 + (seedTx || 0) * 0.13) % 1;
      var bx = 20 + i * 38 + Math.round(Math.sin(t / 400 + i) * 6);
      var by = 210 - ph * 200;
      if (by < 40) continue;
      ctx.globalAlpha = 0.25 * (1 - ph);
      r.ellipse(bx, by, 2, 2, '#b8e0f0');
      r.px(bx, by - 2, 1, 1, '#e0f4fc');
      ctx.globalAlpha = 1;
    }
  }

  // --- Raumbilder aus der Karte vorberechnen ---------------------------------

  function bakeSea(r, def) {
    r.px(0, 0, 256, 224, '#0c1826');
    for (var ty = 0; ty < 14; ty++) {
      for (var tx = 0; tx < 16; tx++) {
        var c = def.map[ty].charAt(tx);
        if (c === '#') continue;
        if (c === 'W') {
          seaWall(r, tx, ty);
          continue;
        }
        seaFloor(r, tx, ty);
        if (c === 'x') coralPile(r, tx, ty);
        else if (c === 'M') seaOpening(r, tx, ty, ty < 7);
      }
    }
    if (def.bakeExtra) def.bakeExtra(r);
  }

  // --- Die vier Raeume --------------------------------------------------------

  // Hafenkaverne: vom Wassertor nach oben in die Pumpenkammer
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
      '8,1': { room: 'wmitte', x: 8 * TILE, y: 11 * TILE, facing: 'up' },
      '8,12': { screen: 'lagune', x: 6 * TILE + 2, y: 5 * TILE, facing: 'down' }
    },
    // Erklaer-NPC: Merksatz zum Umformen in die Scheitelform
    npc: {
      x: 3 * TILE, y: 2 * TILE,
      sprites: function () { return People.netzweber(); },
      talk: {
        name: 'Netzweber',
        texts: [
          'Willkommen in der Tiefe! Ich webe die Netze des Wasserreichs – doch seit dem Bann zittern alle Fäden so gerade wie Lineale.',
          'Zum Umformen einer Parabel y = ax² + bx + c nutze die Scheitelform: y = a(x − xs)² + ys. Darin liest du den Scheitel direkt ab.',
          'Beispiel: y = x² − 4x + 5 = (x − 2)² + 1 mit dem Scheitel S(2|1).'
        ],
        merk: { id: 'umformen', name: 'Umformen in die Scheitelform', text: 'y = ax² + bx + c in die Scheitelform umformen: y = a(x − xs)² + ys. Beispiel: y = x² − 4x + 5 = (x − 2)² + 1 mit S(2|1).' }
      },
      frame: function (t) { var f = Math.floor(t / 400) % 2; return { i: 0, dx: 0, dy: f }; }
    }
  };

  // Pumpenkammer: Quelle als Rastquelle, Alte Bildtafel
  var PUMPE = {
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
      '8,1': { room: 'wraetsel', x: 8 * TILE, y: 11 * TILE, facing: 'up' },
      '8,12': { room: 'weingang', x: 8 * TILE, y: 2 * TILE, facing: 'down' }
    },
    bakeExtra: function (r) {
      bildtafel(r);
      Buildings.well(r, 9, 5);   // Quelle sieht aus wie der Dorfbrunnen
    },
    objects: [
      {
        // Erklaer-Objekt: Merksatz zum Scheitel aus der allgemeinen Form
        tiles: [[6, 1]],
        x: 6 * TILE, y: 1 * TILE,
        name: 'Alte Bildtafel',
        texts: [
          'Auf der Tafel steht: Bei y = ax² + bx + c liegt der Scheitel bei xs = −b : (2a). Dann ys ausrechnen.',
          'Darunter ein Beispiel: y = x² − 6x + 8. Hier ist xs = 3, und ys = 8 − 9 = −1, also S(3|−1).'
        ],
        merk: { id: 'scheitelallgemein', name: 'Scheitel aus der allgemeinen Form', text: 'Bei y = ax² + bx + c gilt xs = −b : (2a), dann ys einsetzen. Beispiel: y = x² − 6x + 8 mit S(3|−1).' }
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

  // Kleine Steintafel auf dem Boden (Kartenzeichen 'k'), wie in Hoehle und Turm
  function floorTablet(r, tx, ty) {
    var x = tx * TILE, y = ty * TILE;
    r.ellipse(x + 8, y + 14, 7, 2, 'rgba(10,25,40,0.5)');
    r.px(x + 2, y + 3, 12, 11, '#3e5e7a');
    r.px(x + 3, y + 4, 10, 9, '#8ac4cc');
    r.px(x + 3, y + 4, 10, 1, '#b0dcc8');
    r.px(x + 5, y + 7, 6, 1, '#28445c');
    r.px(x + 5, y + 9, 5, 1, '#28445c');
  }

  // Gitter vor der Oeffnung zum Boss (bis das Gezeiten-Raetsel geloest ist)
  function bars(r) {
    var x = 8 * TILE, y = 1 * TILE;
    r.px(x, y + 2, TILE, 1, '#8ac4cc');
    for (var i = 1; i < 16; i += 3) {
      r.px(x + i, y + 2, 2, 14, '#3e6a8a');
      r.px(x + i, y + 2, 1, 14, '#8ac4cc');
    }
  }

  // Raetselraum: Gezeitenbrunnen auf der Parabel anregen (gezeiten.js)
  var RAETSEL = {
    map: Gezeiten.stampMap([
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
      '8,1': { room: 'wboss', x: 8 * TILE, y: 11 * TILE, facing: 'up' },
      '8,12': { room: 'wmitte', x: 8 * TILE, y: 2 * TILE, facing: 'down' }
    },
    bakeExtra: function (r) {
      Gezeiten.bakeGrid(r);
      for (var ty = 0; ty < 14; ty++) {
        for (var tx = 0; tx < 16; tx++) {
          var c = RAETSEL.map[ty].charAt(tx);
          if (c === 'g') Gezeiten.bakeStand(r, tx, ty);
          else if (c === 'k') floorTablet(r, tx, ty);
        }
      }
    },
    objects: Gezeiten.objects().concat([
      {
        tiles: [[10, 11]],
        x: 10 * TILE, y: 11 * TILE,
        name: 'Steintafel',
        texts: [
          'Rege die Brunnen an, die auf der Parabel ' + Gezeiten.FORMEL + ' liegen. Dann \u00f6ffnet sich das Gitter.',
          'Unten stehen die x-Werte, links die y-Werte. In jeder Spalte sprudelt genau ein Brunnen richtig.'
        ],
        later: { gezeiten: true, replace: true, texts: ['Alle Brunnen auf der Parabel ' + Gezeiten.FORMEL + ' sprudeln. Das Gitter ist offen.'] }
      }
    ])
  };

  // Vorraum zum Boss: der Boss folgt in einem spaeteren Schritt
  var BOSSRAUM = {
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
      '8,12': { room: 'wraetsel', x: 8 * TILE, y: 2 * TILE, facing: 'down' }
    }
  };

  // Raumdefinitionen fertigstellen (Bake, Blasen, Vignette)
  [EINGANG, PUMPE, RAETSEL, BOSSRAUM].forEach(function (R, i) {
    R.bakeFull = function (r) { bakeSea(r, R); };
    R.anim = function (r, t) { bubbles(r, t, i); };
    R.overlay = vignette;
  });

  // Raetselraum: Blasen und Brunnen im Laufbild, Gitter bis geloest
  RAETSEL.anim = function (r, t) {
    bubbles(r, t, 2);
    Gezeiten.drawWater(r, t);
    if (!Gezeiten.isSolved()) bars(r);
  };

  Interior.register('weingang', EINGANG);
  Interior.register('wmitte', PUMPE);
  Interior.register('wraetsel', RAETSEL);
  Interior.register('wboss', BOSSRAUM);
})();
