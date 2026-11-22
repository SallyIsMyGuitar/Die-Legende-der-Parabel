// sandtempel.js: Der Sandtempel - Dungeon 4 (Nullstellen und quadratische
// Gleichungen)
// Vier Raeume, strikt linear: Eingang (Alte Wandinschrift erklaert die Regel
// "erst D, dann die Formel"), Mittelraum mit steinerner Waage und Quelle
// (Rastquelle auf halber Strecke), Plattenraum (Platten-Raeetsel, platten.js),
// Sanduhrraum (Boss "Waechter des Sandtempels", boss.js).
// Aufbau wie Hoehle, Turm und Wasserkraftwerk: 16 x 14 Kacheln, angemeldet per
// Interior.register(), Uebergaenge ueber mats.
// Zeichen: '#' ausserhalb, 'W' Sandsteinwand, '.' Boden, 'S' Saeule (blockiert),
//          'x' Steinschutt (blockiert), 'Q' Quelle (blockiert), 'M' Oeffnung
(function () {
  'use strict';

  var TILE = 16;
  var hash = Render.hash;

  // ---Sandtempel-Optik -----------------------------------------------------
  // Grosse Sandsteinplatten mit Sandverwehungen an den Waenden, Waende mit
  // bemaltem Fries, Lichtstrahlen aus Deckenoeffnungen mit tanzendem Staub.
  // Jeder Raum hat ein eigenes Thema (def.art): 'halle' Saeulenhalle,
  // 'grab' Grabkammer, 'fries' Plattenraum, 'thron' Thronsaal des Waechters.
  var mix = Render.mix;

  function isWall(def, tx, ty) {
    var c = def.map[ty] ? def.map[ty].charAt(tx) : '#';
    return c === 'W' || c === '#' || c === '';
  }

  // Sandsteinplatten im 2x2-Raster (grosse Platten), Kornsprenkel
  function sandFloor(r, tx, ty, art) {
    var x = tx * TILE, y = ty * TILE;
    var base = art === 'grab' ? '#b8915a' : (art === 'thron' ? '#c49a5c' : '#d2ae72');
    var plate = (Math.floor(tx / 2) + Math.floor(ty / 2)) % 2;
    r.px(x, y, TILE, TILE, plate ? base : mix(base, '#000000', 0.06));
    if (tx % 2 === 0) r.px(x, y, 1, TILE, mix(base, '#000000', 0.2));
    if (ty % 2 === 0) r.px(x, y, TILE, 1, mix(base, '#000000', 0.2));
    for (var i = 0; i < 4; i++) {
      r.px(x + Math.floor(hash(tx * 9 + i, ty * 3) * 15), y + Math.floor(hash(tx + i, ty * 7) * 15), 1, 1,
        i % 2 ? mix(base, '#ffffff', 0.2) : mix(base, '#000000', 0.15));
    }
    if (hash(tx * 3, ty * 5) > 0.88) r.px(x + 4, y + 9, 6, 1, mix(base, '#000000', 0.25));   // Riss
  }

  // Sandverwehungen an den Waenden (weiche helle Haufen auf dem Boden)
  function verwehungen(r, def) {
    var ctx = r.getCtx();
    for (var ty = 0; ty < 14; ty++) {
      for (var tx = 0; tx < 16; tx++) {
        if (isWall(def, tx, ty) || def.map[ty].charAt(tx) !== '.') continue;
        var nah = isWall(def, tx - 1, ty) || isWall(def, tx + 1, ty) || isWall(def, tx, ty - 1) || isWall(def, tx, ty + 1);
        if (!nah || hash(tx * 13, ty * 7) < 0.45) continue;
        ctx.globalAlpha = 0.55;
        r.ellipse(tx * TILE + 8 + (isWall(def, tx - 1, ty) ? -4 : (isWall(def, tx + 1, ty) ? 4 : 0)),
          ty * TILE + 8 + (isWall(def, tx, ty - 1) ? -4 : (isWall(def, tx, ty + 1) ? 4 : 0)), 8, 5, '#e8cc90');
        ctx.globalAlpha = 1;
      }
    }
  }

  // Schatten der Waende auf den Boden
  function wallShadows(r, def) {
    var ctx = r.getCtx();
    ctx.globalAlpha = 0.22;
    for (var ty = 0; ty < 14; ty++) {
      for (var tx = 0; tx < 16; tx++) {
        if (isWall(def, tx, ty)) continue;
        if (isWall(def, tx, ty - 1)) r.px(tx * TILE, ty * TILE, TILE, 4, '#3c2c14');
        if (isWall(def, tx - 1, ty)) r.px(tx * TILE, ty * TILE, 2, TILE, '#3c2c14');
      }
    }
    ctx.globalAlpha = 1;
  }

  // Sandsteinwand aus grossen Quadern; die obere Wand traegt einen
  // bemalten Fries (Baender in Blau, Rot und Gold mit Parabelboegen)
  function sandWall(r, tx, ty, def) {
    var x = tx * TILE, y = ty * TILE;
    var base = def.art === 'grab' ? '#a8814a' : '#c09656';
    r.px(x, y, TILE, TILE, base);
    r.px(x, y, TILE, 1, mix(base, '#ffffff', 0.25));
    r.px(x, y + 15, TILE, 1, mix(base, '#000000', 0.3));
    r.px(x + ((tx + ty) % 2 ? 4 : 12), y, 1, TILE, mix(base, '#000000', 0.18));
    if (ty === 1 && !isWall(def, tx, 2)) {
      // Fries: drei Farbbaender, im mittleren ein Parabelbogen
      r.px(x, y + 8, TILE, 2, '#2e6aa8');
      r.px(x, y + 10, TILE, 3, '#e8c04a');
      r.px(x, y + 13, TILE, 2, '#b8443a');
      for (var o = -4; o <= 4; o++) r.px(x + 8 + o, y + 10 + Math.round(o * o / 8), 1, 1, '#6a4a24');
    } else if (hash(tx * 7 + 3, ty * 11 + 5) > 0.6) {
      var oy = 3 + Math.floor(hash(tx, ty * 3) * 5);
      for (var p = -4; p <= 4; p++) {
        var dy = Math.round(p * p / 6);
        if (dy < 6) r.px(x + 8 + p, y + oy + dy, 1, 1, '#7a5a2e');
      }
    }
  }

  // Saeule mit Lotuskapitell (blockiert); in der Grabkammer eine Waechterstatue
  function column(r, tx, ty, art) {
    var x = tx * TILE, y = ty * TILE;
    r.ellipse(x + 8, y + 15, 6, 2, 'rgba(60,40,10,0.35)');
    if (art === 'grab') {
      r.px(x + 4, y + 12, 8, 3, '#8a6434');            // Sockel
      r.px(x + 5, y + 4, 6, 9, '#b8945a');             // Koerper
      r.px(x + 5, y + 4, 2, 9, '#d0aa70');
      r.px(x + 4, y, 8, 5, '#2e6aa8');                 // Kopftuch blau-gold
      r.px(x + 4, y + 1, 8, 1, '#e8c04a');
      r.px(x + 4, y + 3, 8, 1, '#e8c04a');
      r.px(x + 6, y + 2, 4, 3, '#b8945a');             // Gesicht
      return;
    }
    r.px(x + 5, y + 2, 6, 13, '#b8945a');
    r.px(x + 6, y + 2, 1, 13, '#d8b880');
    r.px(x + 9, y + 2, 1, 13, '#987038');
    r.px(x + 7, y + 2, 1, 13, '#c8a468');
    r.px(x + 3, y, 10, 3, '#d0aa70');                  // Lotuskapitell
    r.px(x + 3, y, 2, 1, '#5aa070');
    r.px(x + 11, y, 2, 1, '#5aa070');
    r.px(x + 7, y, 2, 1, '#5aa070');
    r.px(x + 4, y + 13, 8, 2, '#d0aa70');
  }

  // Steinschutt (blockiert); in der Grabkammer Tonkruege
  function rubble(r, tx, ty, art) {
    var x = tx * TILE, y = ty * TILE;
    r.ellipse(x + 8, y + 14, 7, 2, 'rgba(60,40,10,0.35)');
    if (art === 'grab') {
      [[5, 8, '#b8643a'], [11, 9, '#a85a34'], [8, 11, '#c8743e']].forEach(function (k) {
        r.ellipse(x + k[0], y + k[1], 3, 4, k[2]);
        r.px(x + k[0] - 1, y + k[1] - 5, 3, 2, k[2]);
        r.px(x + k[0] - 2, y + k[1] - 1, 4, 1, '#e8c04a');
      });
      return;
    }
    r.px(x + 2, y + 7, 9, 7, '#a8834e');
    r.px(x + 3, y + 8, 7, 5, '#c0985c');
    r.px(x + 9, y + 5, 6, 8, '#987038');
    r.px(x + 10, y + 6, 4, 6, '#b08a50');
    r.px(x + 4, y + 9, 4, 1, '#8a6434');
  }

  // Feuerschale (Kartenzeichen 'F', blockiert; Flamme im Laufbild)
  function feuerschale(r, tx, ty) {
    var x = tx * TILE, y = ty * TILE;
    r.ellipse(x + 8, y + 15, 6, 2, 'rgba(60,40,10,0.35)');
    r.px(x + 7, y + 8, 2, 7, '#8a6434');
    r.px(x + 4, y + 13, 8, 2, '#8a6434');
    r.px(x + 3, y + 5, 10, 4, '#c8a040');
    r.px(x + 3, y + 5, 10, 1, '#e8c860');
  }
  function feuer(r, t, def) {
    var ctx = r.getCtx();
    for (var ty = 0; ty < 14; ty++) {
      for (var tx = 0; tx < 16; tx++) {
        if (def.map[ty].charAt(tx) !== 'F') continue;
        var x = tx * TILE, y = ty * TILE, f = Math.floor(t / 100 + tx) % 3;
        r.px(x + 5, y + 1 - f, 6, 4 + f, '#f2a83a');
        r.px(x + 6, y - f, 4, 3, '#f8e088');
        ctx.globalAlpha = 0.12;
        r.ellipse(x + 8, y + 6, 18, 12, '#f2a83a');
        ctx.globalAlpha = 1;
      }
    }
  }

  // Lichtstrahlen aus Deckenoeffnungen mit tanzendem Staub
  function lichtstrahlen(r, t, xs) {
    var ctx = r.getCtx();
    xs.forEach(function (sx, i) {
      ctx.globalAlpha = 0.09 + 0.02 * Math.sin(t / 1100 + i);
      for (var k = 0; k < 150; k += 2) r.px(sx + k / 3, 32 + k, 20, 2, '#fff0c0');
      ctx.globalAlpha = 0.6;
      for (var d = 0; d < 5; d++) {
        var ph = (t / 4000 + d / 5 + i * 0.3) % 1;
        r.px(Math.round(sx + 6 + d * 3 + ph * 20 + Math.sin(t / 700 + d) * 3), Math.round(40 + ph * 140), 1, 1, '#fff8e0');
      }
    });
    ctx.globalAlpha = 1;
  }

  // Thronsaal: Podest mit Stufen unter dem Waechter, roter Laeufer zum Ausgang
  function thronPodest(r) {
    // Podest mit drei Stufen
    for (var k = 0; k < 3; k++) {
      var w = 96 - k * 16, h = 52 - k * 12;
      var x = 112 - w / 2, y = 88 - h + k * 4;
      r.px(x, y, w, h, mix('#c8a468', '#e0c088', k / 2));
      r.px(x, y + h - 2, w, 2, '#8a6434');
      r.px(x, y, w, 1, '#f0d8a0');
      // Laeufer von der Tuer (Spalte 12) nach oben, quer zur Mitte und
    // hinauf bis an die unterste Stufe des Podests
    var rot = '#8a2a2a', gold = '#e8c04a';
    r.px(12 * TILE + 2, 7 * TILE, 12, 5 * TILE, rot);         // senkrecht an der Tuer
    r.px(106, 7 * TILE, 12 * TILE + 14 - 106, 12, rot);       // quer
    r.px(106, 88, 12, 7 * TILE + 12 - 88, rot);               // hinauf zum Podest
    r.px(106, 88, 1, 7 * TILE + 12 - 88, gold);
    r.px(117, 88, 1, 7 * TILE - 88, gold);
    r.px(117, 7 * TILE, 12 * TILE + 13 - 117, 1, gold);
    r.px(106, 7 * TILE + 11, 12 * TILE + 2 - 106, 1, gold);
    r.px(12 * TILE + 2, 7 * TILE + 11, 1, 5 * TILE - 11, gold);
    r.px(12 * TILE + 13, 7 * TILE, 1, 5 * TILE, gold);
  }
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
    var ty, tx, c;
    for (ty = 0; ty < 14; ty++) {
      for (tx = 0; tx < 16; tx++) {
        c = def.map[ty].charAt(tx);
        if (c === '#') continue;
        if (c === 'W') { sandWall(r, tx, ty, def); continue; }
        sandFloor(r, tx, ty, def.art);
      }
    }
    if (def.art === 'thron') thronPodest(r);
    wallShadows(r, def);
    verwehungen(r, def);
    for (ty = 0; ty < 14; ty++) {
      for (tx = 0; tx < 16; tx++) {
        c = def.map[ty].charAt(tx);
        if (c === 'S') column(r, tx, ty, def.art);
        else if (c === 'x') rubble(r, tx, ty, def.art);
        else if (c === 'F') feuerschale(r, tx, ty);
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
  // Thema: Saeulenhalle mit Lotussaeulen und Lichtstrahlen
  var EINGANG = {
    art: 'halle',
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
  // Thema: Grabkammer mit Waechterstatuen und Tonkruegen
  var MITTE = {
    art: 'grab',
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
      // Ankunft links neben der Steintafel ('k' blockiert, siehe PLATTEN)
      '8,1': { room: 'splatten', x: 8 * TILE, y: 11 * TILE, facing: 'up' },
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
  // Thema: Fries-Raum, aus Deckenritzen rieselt Sand
  var PLATTEN = {
    art: 'fries',
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
      '#W..........k.W#',   // Tafel rechts neben dem Ausgang (10,12), nicht davor
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
        tiles: [[12, 11]], x: 12 * TILE, y: 11 * TILE,
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
  // Thema: Thronsaal mit Podest, Feuerschalen und rotem Laeufer
  var BOSSRAUM = {
    art: 'thron',
    map: [
      '################',
      '#WWWWWWWWWWWWWW#',
      '#W............W#',
      '#W............W#',
      '#W.F........F.W#',
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

  // Saeulenhalle und Grabkammer: Lichtstrahlen aus der Decke
  EINGANG.anim = function (r, t) { flames(r, t, EINGANG.torches); lichtstrahlen(r, t, [36, 148]); };
  MITTE.anim = function (r, t) { flames(r, t, MITTE.torches); lichtstrahlen(r, t, [84]); };

  // Rieselnder Sand aus Deckenritzen (Plattenraum)
  function rieselSand(r, t) {
    [[10 * TILE + 6, 2 * TILE], [3 * TILE + 4, 9 * TILE + 4]].forEach(function (q, i) {
      for (var k = 0; k < 6; k++) {
        var ph = ((t / 500) + k / 6 + i * 0.5) % 1;
        r.px(q[0] + (k % 2), q[1] + Math.round(ph * 20), 1, 2, '#e8cc90');
      }
      r.ellipse(q[0], q[1] + 22, 4, 2, '#e0c080');
    });
  }

  // Plattenraum: Platten im Laufbild, Gitter bis das Raeetsel geloest ist
  PLATTEN.anim = function (r, t) {
    flames(r, t, PLATTEN.torches);
    rieselSand(r, t);
    Platten.drawPlates(r, t);
    if (!Platten.isSolved()) bars(r);
  };

  // Bossraum: nach dem Sieg rieselt der Sand in sanften Boegen (der Waechter
  // ist verschwunden, nur eine kleine goldene Sanduhr bleibt)
  BOSSRAUM.anim = function (r, t) {
    flames(r, t, BOSSRAUM.torches);
    feuer(r, t, BOSSRAUM);
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
