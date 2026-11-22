// dungeon.js: Die Hoehle der Parabeln - Dungeon 1 (Normalparabel und Parameter)
// Vier Raeume: Eingangshalle, Mittelraum mit Quelle (Rastquelle auf halber
// Strecke), Raetselraum (Fackeln in Form einer Parabel, siehe raetsel.js),
// Vorraum zum Boss (Tor verschlossen, Steintafel als Hinweis).
// Aufbau wie Innenraeume: 16 x 14 Kacheln, angemeldet per Interior.register().
// Zeichen: '#' ausserhalb, 'W' Hoehlenwand, '.' Boden, 'x' Felsbrocken,
//          'Q' Quelle (Brunnen), 'M' Hoehlenoeffnung (Uebergang),
//          'f' Fackelstaender (Raetsel), 'k' Steintafel auf dem Boden
(function () {
  'use strict';

  var TILE = 16;
  var hash = Render.hash;

  // --- Hoehlen-Optik ---------------------------------------------------------
  // Natuerliche Hoehle: Felswaende mit unregelmaessiger Kante und Schatten,
  // unebener Boden mit Flecken und Geroell. Jeder Raum hat ein eigenes Thema
  // (def.art): 'moos' Eingangshalle, 'wasser' Mittelraum, 'sand' Fackelraum,
  // 'kristall' Kristallgrotte vor dem Boss-Tor.
  var mix = Render.mix;
  var BODEN = {
    moos: ['#2c2a30', '#34363a', '#243024'],
    wasser: ['#262a36', '#2e3444', '#1e2430'],
    sand: ['#4a3e32', '#56483a', '#3e342a'],
    kristall: ['#2a2638', '#342e46', '#221e30']
  };

  // Felsboden: Grundton, weiche Flecken, Geroell, feine Risse
  function caveFloor(r, tx, ty, art) {
    var c = BODEN[art] || BODEN.moos;
    var x = tx * TILE, y = ty * TILE, i;
    r.px(x, y, TILE, TILE, c[0]);
    if (hash(tx * 7, ty * 3) > 0.45) {
      r.ellipse(x + 4 + Math.floor(hash(tx, ty * 5) * 8), y + 4 + Math.floor(hash(ty, tx * 5) * 8), 5, 3, c[1]);
    }
    if (hash(tx * 11, ty * 13) > 0.7) {
      r.ellipse(x + 8, y + 9, 4, 2, c[2]);
    }
    for (i = 0; i < 5; i++) {
      var gx = x + Math.floor(hash(tx * 31 + i, ty * 17 + i) * 15);
      var gy = y + Math.floor(hash(tx + i * 7, ty * 3 + i) * 15);
      r.px(gx, gy, 1, 1, hash(i, tx + ty) > 0.5 ? mix(c[1], '#ffffff', 0.15) : mix(c[0], '#000000', 0.3));
    }
    if (hash(tx * 3, ty * 7) > 0.85) {   // Kiesel mit Schatten
      var kx = x + 3 + Math.floor(hash(tx, ty) * 9), ky = y + 4 + Math.floor(hash(ty, tx) * 8);
      r.px(kx, ky + 1, 3, 1, mix(c[0], '#000000', 0.4));
      r.px(kx, ky, 3, 1, mix(c[1], '#ffffff', 0.2));
    }
  }

  // Felswand: dunkler Fels aus Brocken, zum Boden hin eine helle,
  // unregelmaessige Kante und ein Schatten auf dem Boden davor
  function isWall(def, tx, ty) {
    var c = def.map[ty] ? def.map[ty].charAt(tx) : '#';
    return c === 'W' || c === '#' || c === 'T' || c === '';
  }

  function caveWall(r, tx, ty, def) {
    var x = tx * TILE, y = ty * TILE, i;
    var base = def.art === 'kristall' ? '#302a44' : (def.art === 'sand' ? '#4a3c34' : '#36323e');
    r.px(x, y, TILE, TILE, base);
    for (i = 0; i < 3; i++) {   // Felsbrocken
      var bx = x + 3 + Math.floor(hash(tx * 13 + i, ty * 7) * 10);
      var by = y + 3 + Math.floor(hash(tx * 3, ty * 11 + i) * 10);
      r.ellipse(bx, by, 4 + i % 2, 3, mix(base, '#ffffff', 0.08 + i * 0.03));
      r.px(bx - 2, by - 2, 3, 1, mix(base, '#ffffff', 0.22));
    }
    // Moos an der Halle, Kristallsplitter in der Grotte
    if (def.art === 'moos' && hash(tx * 5, ty * 3) > 0.55) {
      r.ellipse(x + 5 + Math.floor(hash(tx, ty) * 6), y + 11, 3, 2, '#3e5a34');
    }
    if (def.art === 'kristall' && hash(tx * 5, ty * 3) > 0.6) {
      r.px(x + 6, y + 6, 2, 5, '#6ac8e8');
      r.px(x + 8, y + 8, 2, 3, '#4aa0c8');
    }
    // Kante zum Boden: unregelmaessige helle Lippe und Schatten
    if (!isWall(def, tx, ty + 1)) {
      for (i = 0; i < TILE; i += 2) {
        var h = 1 + Math.floor(hash(tx * 16 + i, ty) * 3);
        r.px(x + i, y + TILE - h - 1, 2, 1, mix(base, '#ffffff', 0.3));
        r.px(x + i, y + TILE - h, 2, h, mix(base, '#000000', 0.25));
      }
    }
  }

  // Schatten der Waende auf den Boden (nach dem Boden gezeichnet)
  function wallShadows(r, def) {
    var ctx = r.getCtx();
    ctx.globalAlpha = 0.35;
    for (var ty = 0; ty < 14; ty++) {
      for (var tx = 0; tx < 16; tx++) {
        if (isWall(def, tx, ty)) continue;
        if (isWall(def, tx, ty - 1)) r.px(tx * TILE, ty * TILE, TILE, 3, '#000000');
        if (isWall(def, tx - 1, ty)) r.px(tx * TILE, ty * TILE, 2, TILE, '#000000');
        if (isWall(def, tx + 1, ty)) r.px(tx * TILE + 14, ty * TILE, 2, TILE, '#000000');
      }
    }
    ctx.globalAlpha = 1;
  }

  // Felsbrocken (blockiert); in der Halle als Stalagmit gezeichnet
  function rock(r, tx, ty, art) {
    var x = tx * TILE, y = ty * TILE;
    r.ellipse(x + 8, y + 13, 7, 3, 'rgba(0,0,0,0.4)');
    if (art === 'moos') {
      r.px(x + 4, y + 9, 8, 5, '#4a4654');
      r.px(x + 5, y + 5, 6, 5, '#5a5664');
      r.px(x + 6, y + 2, 4, 4, '#6a6676');
      r.px(x + 7, y, 2, 3, '#7a7686');
      r.px(x + 5, y + 6, 1, 7, '#6e6a7a');
      r.ellipse(x + 10, y + 12, 2, 1, '#3e5a34');   // Moos am Fuss
    } else {
      r.ellipse(x + 8, y + 9, 7, 6, '#3e3a4a');
      r.ellipse(x + 7, y + 8, 5, 4, '#504a5e');
      r.ellipse(x + 6, y + 7, 2, 2, '#645e74');
      r.px(x + 10, y + 11, 3, 2, '#2e2a3a');
    }
  }

  // Stalagmit: kleiner Fels, auf dem ein Hoehlen-Bewohner steht (blockiert)
  function stalagmite(r, tx, ty) {
    var x = tx * TILE, y = ty * TILE;
    r.px(x + 6, y + 12, 4, 3, '#3a3546');
    r.px(x + 5, y + 8, 6, 5, '#4c4658');
    r.px(x + 7, y + 5, 2, 4, '#5e5870');
  }

  // Wurzeln haengen von der oberen Wand herab (Eingangshalle)
  function wurzeln(r) {
    [[3, 5], [6, 3], [10, 6], [13, 4]].forEach(function (w, n) {
      var x = w[0] * TILE + 6, len = 10 + w[1] * 2;
      for (var i = 0; i < len; i++) {
        var dx = Math.round(Math.sin(i / 3 + n) * 1.5);
        r.px(x + dx, 2 * TILE - 6 + i, 1, 1, i % 4 ? '#5a4632' : '#6e5a40');
      }
    });
  }

  // Leuchtpilze (flach auf dem Boden, nicht blockierend); Leuchten im Laufbild
  var PILZE = [[3, 11], [13, 3], [12, 11], [6, 3]];
  function pilze(r) {
    PILZE.forEach(function (p) {
      var x = p[0] * TILE, y = p[1] * TILE;
      [[3, 10], [8, 12], [11, 9]].forEach(function (o) {
        r.px(x + o[0], y + o[1], 1, 2, '#c8c4b0');
        r.px(x + o[0] - 1, y + o[1] - 1, 3, 1, '#4ac8b8');
      });
    });
  }
  function pilzLicht(r, t) {
    var ctx = r.getCtx();
    PILZE.forEach(function (p, i) {
      ctx.globalAlpha = 0.1 + 0.05 * Math.sin(t / 700 + i);
      r.ellipse(p[0] * TILE + 8, p[1] * TILE + 10, 10, 5, '#4ae8d0');
    });
    ctx.globalAlpha = 1;
  }

  // Unterirdischer Wasserlauf (Kartenzeichen '~', blockiert)
  function wasserlauf(r, tx, ty, def) {
    var x = tx * TILE, y = ty * TILE;
    r.px(x, y, TILE, TILE, '#16304a');
    r.px(x + 2, y + 4, 6, 1, '#2a5070');
    r.px(x + 8, y + 10, 5, 1, '#2a5070');
    var c = def.map[ty].charAt(tx - 1);
    if (c !== '~') r.px(x, y, 2, TILE, '#5e5870');   // Uferstein links
  }
  function wasserGlanz(r, t, def) {
    for (var ty = 0; ty < 14; ty++) {
      for (var tx = 0; tx < 16; tx++) {
        if (def.map[ty].charAt(tx) !== '~') continue;
        var ph = Math.floor(t / 250 + tx * 3 + ty * 5) % 6;
        r.px(tx * TILE + 3 + ph * 2, ty * TILE + 6 + (ph % 3) * 2, 3, 1, '#6aa8d0');
      }
    }
  }

  // Kristallgruppen (Kartenzeichen 'c', blockiert) und ihr Leuchten
  function kristalle(r, tx, ty) {
    var x = tx * TILE, y = ty * TILE;
    r.ellipse(x + 8, y + 14, 7, 2, 'rgba(0,0,0,0.4)');
    [[3, 6, 3, 8], [7, 1, 3, 13], [11, 5, 3, 9]].forEach(function (k) {
      r.px(x + k[0], y + k[1], k[2], k[3], '#4aa0c8');
      r.px(x + k[0], y + k[1], 1, k[3], '#9ae0f8');
      r.px(x + k[0] + k[2] - 1, y + k[1], 1, k[3], '#2a6a98');
    });
  }
  function kristallLicht(r, t, def) {
    var ctx = r.getCtx();
    for (var ty = 0; ty < 14; ty++) {
      for (var tx = 0; tx < 16; tx++) {
        if (def.map[ty].charAt(tx) !== 'c') continue;
        ctx.globalAlpha = 0.12 + 0.06 * Math.sin(t / 600 + tx + ty);
        r.ellipse(tx * TILE + 8, ty * TILE + 8, 16, 10, '#6ad0f8');
      }
    }
    ctx.globalAlpha = 1;
  }

  // Glitzernde Kristallsplitter in den Waenden des Mittelraums
  function wandGlitzer(r, t) {
    [[1, 4], [1, 8], [14, 11], [5, 1], [11, 1], [1, 11]].forEach(function (g, i) {
      if (Math.floor(t / 300 + i * 2) % 5 === 0) {
        r.px(g[0] * TILE + 7, g[1] * TILE + 6, 3, 1, '#c8f0ff');
        r.px(g[0] * TILE + 8, g[1] * TILE + 5, 1, 3, '#c8f0ff');
      } else {
        r.px(g[0] * TILE + 8, g[1] * TILE + 6, 1, 1, '#6ac8e8');
      }
    });
  }

  // Lichtschaechte von oben (Kristallgrotte): schraege helle Baender
  function lichtschaechte(r, t) {
    var ctx = r.getCtx();
    [[64, 40], [176, 52]].forEach(function (s, i) {
      ctx.globalAlpha = 0.06 + 0.02 * Math.sin(t / 900 + i);
      for (var k = 0; k < 120; k += 2) r.px(s[0] + k / 4, s[1] + k, s[1] === 40 ? 22 : 18, 2, '#e8f0ff');
    });
    ctx.globalAlpha = 1;
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

  // Alte Inschrift an der Hoehlenwand im Mittelraum (Kachel 6,1)
  function inscription(r) {
    var x = 6 * TILE, y = 1 * TILE;
    r.px(x + 2, y + 2, 12, 12, '#5e5870');
    r.px(x + 3, y + 3, 10, 10, '#8a8496');
    r.px(x + 3, y + 3, 10, 1, '#a8a2b4');
    // eingeritzte Zeilen und eine kleine Parabel
    r.px(x + 5, y + 6, 6, 1, '#3e3a4a');
    r.px(x + 5, y + 8, 5, 1, '#3e3a4a');
    r.px(x + 4, y + 9, 1, 2, '#3e3a4a');
    r.px(x + 5, y + 11, 1, 1, '#3e3a4a');
    r.px(x + 6, y + 12, 4, 1, '#3e3a4a');
    r.px(x + 10, y + 11, 1, 1, '#3e3a4a');
    r.px(x + 11, y + 9, 1, 2, '#3e3a4a');
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
    var ty, tx, c;
    for (ty = 0; ty < 14; ty++) {
      for (tx = 0; tx < 16; tx++) {
        c = def.map[ty].charAt(tx);
        if (c === '#') continue;
        if (c === 'W' || c === 'T') {
          caveWall(r, tx, ty, def);
          continue;
        }
        if (c === '~') { wasserlauf(r, tx, ty, def); continue; }
        caveFloor(r, tx, ty, def.art);
      }
    }
    wallShadows(r, def);
    for (ty = 0; ty < 14; ty++) {
      for (tx = 0; tx < 16; tx++) {
        c = def.map[ty].charAt(tx);
        if (c === 'x') rock(r, tx, ty, def.art);
        else if (c === 'N') stalagmite(r, tx, ty);
        else if (c === 'c') kristalle(r, tx, ty);
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
  // Thema: Moos, Stalagmiten, Wurzeln von oben, Leuchtpilze
  var HALLE = {
    art: 'moos',
    map: [
      '################',
      '#WWWWWWWMWWWWWW#',
      '#WW.N........WW#',
      '#W............W#',
      '#W....x....x..W#',
      '#W............W#',
      '#W..x.......x.W#',
      '#W............W#',
      '#W......x.....W#',
      '#W............W#',
      '#W...x......x.W#',
      '#WW..........WW#',
      '#WWWWWWWMWWWWWW#',
      '################'
    ],
    // Oeffnungen: oben in den Mittelraum, unten zurueck zur Ruine
    mats: {
      '8,1': { room: 'dmittel', x: 8 * TILE, y: 11 * TILE, facing: 'up' },
      '8,12': { screen: 'ruine', x: 6 * TILE, y: 5 * TILE, facing: 'down' }
    },
    torches: [[4, 1], [11, 1], [4, 12], [11, 12]],
    bakeExtra: function (r) { wurzeln(r); pilze(r); },
    // Erklaer-NPC der Hoehle: Merksatz zum Bestimmen von a
    npc: {
      x: 3 * TILE, y: 2 * TILE,
      sprites: function () { return People.researcher(); },
      talk: {
        name: 'Forscherin',
        texts: [
          'Oh, Besuch! Ich erforsche diese Höhle. Seit der Bann wirkt, flattern hier verzauberte Fledermäuse herum.',
          'Sie fragen nach dem Streckfaktor a. Kennst du den Scheitel S und einen Punkt P, setzt du P in y = a(x − xs)² + ys ein und löst nach a auf.',
          'Beispiel: S(1|2) und P(3|10). Dann gilt 10 = a(3 − 1)² + 2, also 10 = 4a + 2, 8 = 4a und a = 2.'
        ],
        merk: { id: 'abestimmen', name: 'Streckfaktor a bestimmen', text: 'Setze P in y = a(x − xs)² + ys ein und löse nach a auf. Beispiel: S(1|2), P(3|10): 10 = 4a + 2, also a = 2.' }
      },
      frame: function (t) { return { i: 0, dx: 0, dy: 0 }; }
    }
  };

  // Mittelraum: Quelle als Rastquelle auf halber Strecke
  // Thema: unterirdischer Wasserlauf am rechten Rand, Kristallglitzern
  var MITTEL = {
    art: 'wasser',
    map: [
      '################',
      '#WWWWWWWMWWWWWW#',
      '#WW..........WW#',
      '#W...........~W#',
      '#W...........~W#',
      '#W......Q....~W#',
      '#W...........~W#',
      '#W...........~W#',
      '#W...........~W#',
      '#W...........~W#',
      '#W....x....x..W#',
      '#WW..........WW#',
      '#WWWWWWWMWWWWWW#',
      '################'
    ],
    mats: {
      '8,1': { room: 'draetsel', x: 8 * TILE, y: 11 * TILE, facing: 'up' },
      '8,12': { room: 'dhalle', x: 8 * TILE, y: 2 * TILE, facing: 'down' }
    },
    torches: [[4, 1], [11, 1], [4, 12], [11, 12]],
    bakeExtra: function (r) {
      inscription(r);
      Buildings.well(r, 8, 5);   // Quelle sieht aus wie der Dorfbrunnen
    },
    objects: [
      {
        // Erklaer-Objekt: Merksatz zum Aufstellen der Scheitelform
        tiles: [[6, 1]],
        x: 6 * TILE, y: 1 * TILE,
        name: 'Alte Inschrift',
        texts: [
          'In den Stein ist geritzt: Wer die Scheitelform aufstellen will, nimmt xs und ys aus dem Scheitel S. Den Streckfaktor a liefert der Punkt P.',
          'Darunter steht kleiner: Die Kristallgeister zeigen P erst, wenn man sich irrt. Also erst rechnen, dann einstellen!'
        ],
        merk: { id: 'spfaufstellen', name: 'Scheitelform aufstellen', text: 'xs und ys aus dem Scheitel S ablesen, dann P einsetzen und a berechnen. Ergebnis: y = a(x − xs)² + ys.' }
      },
      {
        // Rastquelle: heilt alle Herzen, speichert die Ruecksprung-Stelle
        tiles: [[8, 5]],
        x: 8 * TILE, y: 5 * TILE,
        name: 'Quelle',
        texts: ['Du trinkst vom klaren Wasser. Deine Herzen sind wieder voll.'],
        action: 'rest',
        spawn: { x: 8 * TILE, y: 6 * TILE, facing: 'up' }
      }
    ]
  };

  // Vorraum: verschlossenes Boss-Tor mit Steintafel
  // Thema: Kristallgrotte mit Lichtschaechten
  var BOSS = {
    art: 'kristall',
    map: [
      '################',
      '#WWWWWTTWWWWWWW#',
      '#WWWWWTTWWWWWWW#',
      '#Wc...xx.....cW#',
      '#W............W#',
      '#W............W#',
      '#W............W#',
      '#W............W#',
      '#W............W#',
      '#W............W#',
      '#W............W#',
      '#Wc..........cW#',
      '#WWWWWWWMWWWWWW#',
      '################'
    ],
    mats: {
      '8,12': { room: 'draetsel', x: 8 * TILE, y: 2 * TILE, facing: 'down' }
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
        texts: ['Verschlossen. Erst wenn der W\u00e4chter der H\u00f6hle der Parabeln besiegt ist, \u00f6ffnet sich dieses Tor.'],
        // nach dem ersten Wappen ersetzt dieser Text den obigen
        later: { wappen: 1, replace: true, texts: ['Das Tor steht offen, doch dahinter ist der Gang verschüttet. Der Felsen am Dorfplatz ist verschwunden – der Weg nach Süden ist frei.'] }
      }
    ]
  };

  // Kleine Steintafel auf dem Boden (Kartenzeichen 'k')
  function floorTablet(r, tx, ty) {
    var x = tx * TILE, y = ty * TILE;
    r.ellipse(x + 8, y + 14, 7, 2, 'rgba(0,0,0,0.35)');
    r.px(x + 2, y + 3, 12, 11, '#5e5870');
    r.px(x + 3, y + 4, 10, 9, '#8a8496');
    r.px(x + 3, y + 4, 10, 1, '#a8a2b4');
    r.px(x + 5, y + 7, 6, 1, '#3e3a4a');
    r.px(x + 5, y + 9, 5, 1, '#3e3a4a');
  }

  // Gitter vor der Öffnung zum Boss (bis das Fackel-Rätsel gelöst ist)
  function bars(r) {
    var x = 8 * TILE, y = 1 * TILE;
    r.px(x, y + 2, TILE, 1, '#8a8496');
    for (var i = 1; i < 16; i += 3) {
      r.px(x + i, y + 2, 2, 14, '#6a6478');
      r.px(x + i, y + 2, 1, 14, '#9a94a8');
    }
  }

  // Rätselraum: Fackeln in Form der Parabel entzünden (Logik in raetsel.js)
  // Thema: Sandboden mit eingeritztem Koordinatensystem
  var RAETSEL = {
    art: 'sand',
    map: Raetsel.stampMap([
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
      '8,1': { room: 'dboss', x: 8 * TILE, y: 11 * TILE, facing: 'up' },
      '8,12': { room: 'dmittel', x: 8 * TILE, y: 2 * TILE, facing: 'down' }
    },
    torches: [[3, 1], [12, 1], [3, 12], [12, 12]],
    bakeExtra: function (r) {
      Raetsel.bakeGrid(r);
      for (var ty = 0; ty < 14; ty++) {
        for (var tx = 0; tx < 16; tx++) {
          var c = RAETSEL.map[ty].charAt(tx);
          if (c === 'f') Raetsel.bakeStand(r, tx, ty);
          else if (c === 'k') floorTablet(r, tx, ty);
        }
      }
    },
    objects: Raetsel.objects().concat([
      {
        tiles: [[10, 11]],
        x: 10 * TILE, y: 11 * TILE,
        name: 'Steintafel',
        texts: [
          'Entzünde die Fackeln, die auf der Parabel ' + Raetsel.FORMEL + ' liegen. Dann öffnet sich das Gitter.',
          'Unten stehen die x-Werte, links die y-Werte. In jeder Spalte brennt genau eine Fackel richtig.'
        ],
        later: { solved: true, replace: true, texts: ['Alle Fackeln auf der Parabel ' + Raetsel.FORMEL + ' brennen. Das Gitter ist offen.'] }
      }
    ])
  };

  // Raumdefinitionen fertigstellen (Bake, Animation, Vignette)
  [HALLE, MITTEL, RAETSEL, BOSS].forEach(function (R) {
    R.bakeFull = function (r) { bakeCave(r, R); };
    R.anim = function (r, t) {
      flames(r, t, R.torches);
    };
    R.overlay = vignette;
  });

  // Eingangshalle: Leuchtpilze; Mittelraum: Wasser und Kristallglitzer
  HALLE.anim = function (r, t) { flames(r, t, HALLE.torches); pilzLicht(r, t); };
  MITTEL.anim = function (r, t) {
    flames(r, t, MITTEL.torches);
    wasserGlanz(r, t, MITTEL);
    wandGlitzer(r, t);
  };

  // Vorraum: Kristalle, Lichtschaechte; oeffnet das Tor im Laufbild,
  // sobald der Boss besiegt ist
  BOSS.anim = function (r, t) {
    flames(r, t, BOSS.torches);
    kristallLicht(r, t, BOSS);
    lichtschaechte(r, t);
    if (typeof Boss !== 'undefined' && Boss.of('dboss').isDefeated()) drawGateOpen(r);
  };

  Interior.register('dhalle', HALLE);
  Interior.register('dmittel', MITTEL);
  Interior.register('dboss', BOSS);

  // Rätselraum: Flammen und Gitter im Laufbild
  RAETSEL.anim = function (r, t) {
    flames(r, t, RAETSEL.torches);
    Raetsel.drawFlames(r, t);
    if (!Raetsel.isSolved()) bars(r);
  };
  Interior.register('draetsel', RAETSEL);
})();
