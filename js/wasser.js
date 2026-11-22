// wasser.js: Das Wasserkraftwerk - Dungeon 3 (Allgemeine Form)
// Vier Raeume, strikt linear: Vorhalle (Maschinistin erklaert das Umformen
// in die Scheitelform), Pumpenkammer mit Quelle (Rastquelle auf halber
// Strecke), Alter Schalttafel und Messtafel, Schaltwarte (Raetsel in
// schaltwarte.js) und Turbinenhalle (Boss: das Turbinenrad, boss.js).
// Aufbau wie Hoehle und Turm: 16 x 14 Kacheln, angemeldet per
// Interior.register(), Uebergaenge ueber mats.
// Zeichen: '#' ausserhalb, 'W' Betonwand, '.' Boden, 'M' Schott (Uebergang),
//          'x' Maschine/Kiste (blockiert, je Raum anders gezeichnet),
//          'Q' Quelle, Schaltwarte: 'd' Bildschirm, 'h' Hebel,
//          's' Startschalter, 'p' Druckrohr, 'k' Tafel (alle blockieren)
// Jeder Raum hat ein eigenes Thema (Boden, Deko, Licht), damit sich die
// Raeume deutlich unterscheiden.
(function () {
  'use strict';

  var TILE = 16;
  var hash = Render.hash;
  var mix = Render.mix;

  // --- Kraftwerk-Optik -----------------------------------------------------

  // Boeden je Raum: Beton mit Laufweg, Riffelblech, Schaltwarten-Fliesen,
  // Stahlgitter der Turbinenhalle
  function floor(r, tx, ty, art) {
    var x = tx * TILE, y = ty * TILE, i;
    if (art === 'beton') {
      r.px(x, y, TILE, TILE, '#6e7278');
      for (i = 0; i < 6; i++) {
        r.px(x + Math.floor(hash(tx * 9 + i, ty * 5) * 15), y + Math.floor(hash(tx + i, ty * 11) * 15), 1, 1,
          i % 2 ? '#7c8086' : '#62666c');
      }
      r.px(x, y + 15, TILE, 1, '#5e6268');
      r.px(x + 15, y, 1, TILE, '#5e6268');
      // gelbe Laufweg-Markierung in den Spalten 7 und 9 (Weg zum Schott)
      if (tx === 7) r.px(x + 12, y, 2, TILE, '#c8a030');
      if (tx === 9) r.px(x + 2, y, 2, TILE, '#c8a030');
    } else if (art === 'blech') {
      // Riffelblech: diagonale Rauten
      r.px(x, y, TILE, TILE, '#5a6470');
      for (var dy = 0; dy < TILE; dy += 4) {
        for (var dx = (dy / 4) % 2 ? 2 : 0; dx < TILE; dx += 4) {
          r.px(x + dx, y + dy, 2, 1, '#76808c');
          r.px(x + dx + 1, y + dy + 1, 1, 1, '#48505a');
        }
      }
      r.px(x, y, TILE, 1, '#48505a');
      r.px(x, y, 1, TILE, '#48505a');
    } else if (art === 'warte') {
      // Schaltwarte: dunkelgruene Kunststofffliesen
      var even = (tx + ty) % 2 === 0;
      r.px(x, y, TILE, TILE, even ? '#3e5248' : '#384a42');
      r.px(x, y, TILE, 1, '#2c3a34');
      r.px(x, y, 1, TILE, '#2c3a34');
      r.px(x + 2, y + 2, 3, 1, '#4a6056');
    } else {
      // Turbinenhalle: Stahlgitter ueber dunklem Grund
      r.px(x, y, TILE, TILE, '#22282e');
      for (i = 0; i < TILE; i += 4) {
        r.px(x + i, y, 1, TILE, '#4a525c');
        r.px(x, y + i, TILE, 1, '#4a525c');
      }
      r.px(x, y, TILE, 1, '#6a7480');
    }
  }

  // Betonwand mit Fugen, Schrauben und einem Rohr oben entlang
  function wall(r, tx, ty, art) {
    var x = tx * TILE, y = ty * TILE;
    var base = art === 'warte' ? '#7a8478' : (art === 'halle' ? '#5e646c' : '#868a90');
    r.px(x, y, TILE, TILE, base);
    r.px(x, y, TILE, 1, mix(base, '#ffffff', 0.25));
    r.px(x, y + 15, TILE, 1, mix(base, '#000000', 0.35));
    r.px(x + 15, y, 1, TILE, mix(base, '#000000', 0.25));
    r.px(x + 2, y + 2, 1, 1, '#4a4e56');      // Schrauben
    r.px(x + 13, y + 2, 1, 1, '#4a4e56');
    r.px(x + 2, y + 13, 1, 1, '#4a4e56');
    r.px(x + 13, y + 13, 1, 1, '#4a4e56');
    if (hash(tx * 7, ty * 3) > 0.7) r.px(x + 4, y + 6, 5, 1, mix(base, '#000000', 0.15));   // Fleck
  }

  // Schott (Uebergang): Stahlrahmen mit Warnstreifen, dunkler Durchgang
  function schott(r, tx, ty, top) {
    var x = tx * TILE, y = ty * TILE;
    r.px(x, y, TILE, TILE, '#0e1218');
    r.px(x, y, 2, TILE, '#3a4048');
    r.px(x + 14, y, 2, TILE, '#3a4048');
    for (var i = 0; i < TILE; i += 4) {
      r.px(x, y + i, 2, 2, '#f0c030');
      r.px(x + 14, y + i + 2, 2, 2, '#f0c030');
    }
    r.px(x + 2, y + (top ? 13 : 0), 12, 3, '#4a525c');   // Schwelle
  }

  // Rohrleitung oben an der Wand (Reihe 1) quer durch den Raum, mit
  // Ventilrad; laesst die Oeffnung in Spalte 8 frei
  function wandRohr(r, farbe) {
    var y = 1 * TILE + 9;
    [[2 * TILE, 8 * TILE - 2], [9 * TILE + 2, 14 * TILE]].forEach(function (s) {
      r.px(s[0], y, s[1] - s[0], 5, farbe);
      r.px(s[0], y, s[1] - s[0], 1, mix(farbe, '#ffffff', 0.35));
      r.px(s[0], y + 4, s[1] - s[0], 1, mix(farbe, '#000000', 0.4));
      for (var x = s[0] + 10; x < s[1] - 4; x += 22) r.px(x, y - 1, 2, 7, '#3a4048');   // Halter
    });
  }

  function ventilrad(r, x, y) {
    r.ellipse(x, y, 4, 4, '#a8302a');
    r.ellipse(x, y, 2, 2, '#5a6470');
    r.px(x - 4, y, 9, 1, '#a8302a');
    r.px(x, y - 4, 1, 9, '#a8302a');
  }

  // Warnstreifen am Fuss der oberen Wand
  function warnKante(r) {
    for (var x = 2 * TILE; x < 14 * TILE; x += 8) {
      if (x >= 8 * TILE - 4 && x < 9 * TILE + 4) continue;
      r.px(x, 2 * TILE, 4, 2, '#f0c030');
      r.px(x + 4, 2 * TILE, 4, 2, '#2a2a30');
    }
  }

  // Maschinen und Kisten ('x'), je Raum anders
  function maschine(r, tx, ty, art) {
    var x = tx * TILE, y = ty * TILE;
    r.ellipse(x + 8, y + 15, 7, 2, 'rgba(10,14,20,0.5)');
    if (art === 'beton') {
      // Kabeltrommel oder Werkzeugkiste
      if ((tx + ty) % 2) {
        r.ellipse(x + 8, y + 8, 7, 7, '#7a5232');
        r.ellipse(x + 8, y + 8, 5, 5, '#2a2a30');
        r.ellipse(x + 8, y + 8, 2, 2, '#7a5232');
        r.px(x + 3, y + 7, 10, 1, '#e8443a');
      } else {
        r.px(x + 2, y + 5, 12, 9, '#c84a32');
        r.px(x + 2, y + 5, 12, 2, '#e86a4a');
        r.px(x + 6, y + 3, 4, 2, '#3a3a40');
        r.px(x + 7, y + 9, 2, 2, '#f0d060');
      }
    } else {
      // Pumpe: blaues Gehaeuse mit Motor und Anschlussrohr
      r.px(x + 1, y + 4, 14, 10, '#2e5a9a');
      r.px(x + 1, y + 4, 14, 2, '#4a7ac0');
      r.ellipse(x + 6, y + 9, 3, 3, '#1e3e70');
      r.px(x + 10, y + 6, 4, 7, '#3a4250');
      for (var i = 0; i < 6; i += 2) r.px(x + 10, y + 7 + i, 4, 1, '#5a6270');   // Kuehlrippen
      r.px(x + 6, y + 1, 3, 4, '#5a6a7a');   // Anschlussrohr nach oben
    }
  }

  // Schalttafel mit Anzeigen (Merksatz Scheitel aus allgemeiner Form, 6,1)
  function schalttafel(r) {
    var x = 6 * TILE, y = 1 * TILE;
    r.px(x + 1, y + 1, 14, 14, '#3a4250');
    r.px(x + 2, y + 2, 12, 12, '#d8dcd0');
    r.ellipse(x + 5, y + 6, 2, 2, '#ffffff');      // Rundinstrument
    r.px(x + 5, y + 5, 1, 2, '#2a2e36');
    r.px(x + 9, y + 4, 4, 1, '#3a4250');          // Schrift
    r.px(x + 9, y + 6, 3, 1, '#3a4250');
    r.px(x + 4, y + 10, 2, 2, '#5ae08a');         // Kontrolllampen
    r.px(x + 8, y + 10, 2, 2, '#f0c030');
    r.px(x + 11, y + 10, 2, 2, '#e8443a');
  }

  // Messtafel mit drei Punkten auf einem Bogen (Merksatz drei Punkte, 3,1)
  function messtafel(r) {
    var x = 3 * TILE, y = 1 * TILE;
    r.px(x + 1, y + 1, 14, 14, '#3a4250');
    r.px(x + 2, y + 2, 12, 12, '#0e1a14');
    r.px(x + 3, y + 10, 10, 1, '#2a5a3a');        // Achse
    r.px(x + 4, y + 5, 2, 2, '#f8e070');
    r.px(x + 7, y + 9, 2, 2, '#f8e070');
    r.px(x + 10, y + 5, 2, 2, '#f8e070');
    r.px(x + 5, y + 7, 1, 1, '#5ae08a');
    r.px(x + 6, y + 8, 1, 1, '#5ae08a');
    r.px(x + 9, y + 8, 1, 1, '#5ae08a');
    r.px(x + 10, y + 7, 1, 1, '#5ae08a');
  }

  // Tafel auf dem Boden ('k'): Anleitung neben dem Leitstand
  function bodenTafel(r, tx, ty) {
    var x = tx * TILE, y = ty * TILE;
    r.ellipse(x + 8, y + 14, 7, 2, 'rgba(10,14,20,0.5)');
    r.px(x + 2, y + 3, 12, 11, '#3a4250');
    r.px(x + 3, y + 4, 10, 9, '#e4e2d4');
    r.px(x + 5, y + 7, 6, 1, '#3a4250');
    r.px(x + 5, y + 9, 5, 1, '#3a4250');
  }

  // Turbinenschacht im Boden der Turbinenhalle (unter dem Boss)
  function turbinenSchacht(r) {
    var cx = 112, cy = 86;
    r.ellipse(cx, cy, 34, 14, '#3a4048');
    r.ellipse(cx, cy, 31, 12, '#0e141a');
    r.ellipse(cx, cy + 2, 26, 9, '#123448');
    for (var i = 0; i < 8; i++) r.px(cx - 30 + i * 8, cy - 1, 4, 2, '#f0c030');   // Warnring
  }

  // Deckenlampen: helle Kegel auf dem Boden (Laufbild, leicht flackernd)
  function lampen(r, t, xs, flacker) {
    var ctx = r.getCtx();
    xs.forEach(function (lx, i) {
      var an = !(flacker === i && Math.floor(t / 90) % 17 === 0);
      if (!an) return;
      ctx.globalAlpha = 0.07;
      r.ellipse(lx, 112, 30, 70, '#fff4d0');
      ctx.globalAlpha = 1;
    });
  }

  // Dampfwolke an einem Ventil
  function dampf(r, t, x, y) {
    var ctx = r.getCtx();
    for (var i = 0; i < 3; i++) {
      var p = ((t / 1200) + i / 3) % 1;
      ctx.globalAlpha = 0.35 * (1 - p);
      r.ellipse(x + Math.round(Math.sin(p * 6 + i) * 3), y - p * 18, 2 + p * 4, 2 + p * 3, '#e8eef2');
    }
    ctx.globalAlpha = 1;
  }

  // Dunkle Vignette ueber der Spielfigur (Hallenlicht)
  function vignette(r) {
    var ctx = r.getCtx();
    for (var i = 0; i < 3; i++) {
      ctx.globalAlpha = 0.18 - i * 0.05;
      var m = 8 + i * 8;
      r.px(m, m, 256 - 2 * m, 8, '#0a0e14');
      r.px(m, 224 - m - 8, 256 - 2 * m, 8, '#0a0e14');
      r.px(m, m, 8, 224 - 2 * m, '#0a0e14');
      r.px(256 - m - 8, m, 8, 224 - 2 * m, '#0a0e14');
    }
    ctx.globalAlpha = 1;
  }

  // --- Raumbilder aus der Karte vorberechnen ---------------------------------

  function bakeRoom(r, def) {
    r.px(0, 0, 256, 224, '#0a0e14');
    for (var ty = 0; ty < 14; ty++) {
      for (var tx = 0; tx < 16; tx++) {
        var c = def.map[ty].charAt(tx);
        if (c === '#') continue;
        if (c === 'W') { wall(r, tx, ty, def.art); continue; }
        floor(r, tx, ty, def.art);
        if (c === 'x') maschine(r, tx, ty, def.art);
        else if (c === 'M') schott(r, tx, ty, ty < 7);
        else if (c === 'k') bodenTafel(r, tx, ty);
      }
    }
    wandRohr(r, def.rohr);
    warnKante(r);
    if (def.bakeExtra) def.bakeExtra(r);
  }

  // --- Die vier Raeume --------------------------------------------------------

  // Vorhalle: Beton mit gelbem Laufweg, Kabeltrommeln und Werkzeugkisten
  var EINGANG = {
    art: 'beton', rohr: '#5a8a5a',
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
      '8,12': { screen: 'lagune', x: 7.5 * TILE, y: 6 * TILE, facing: 'down' }
    },
    bakeExtra: function (r) {
      ventilrad(r, 12 * TILE + 8, 1 * TILE + 11);
      // Hinweisschild "Zutritt nur fuer Personal" als Piktogramm
      r.px(11 * TILE + 2, 1 * TILE + 1, 10, 7, '#2e5a9a');
      r.px(11 * TILE + 4, 1 * TILE + 3, 6, 1, '#ffffff');
      r.px(11 * TILE + 4, 1 * TILE + 5, 4, 1, '#ffffff');
    },
    // Erklaer-NPC: Merksatz zum Umformen in die Scheitelform
    npc: {
      x: 3 * TILE, y: 2 * TILE,
      sprites: function () { return People.maschinistin(); },
      talk: {
        name: 'Maschinistin',
        texts: [
          'Willkommen im Kraftwerk! Seit dem Bann laufen alle Leitungen so gerade wie Lineale – und keine Turbine dreht sich mehr.',
          'Forme y = ax² + bx + c in die Scheitelform y = a(x − xs)² + ys um. Dann liest du den Scheitel direkt ab.',
          'Beispiel: y = x² − 4x + 5 = (x − 2)² + 1 mit dem Scheitel S(2|1).'
        ],
        merk: { id: 'umformen', name: 'Umformen in die Scheitelform', text: 'y = ax² + bx + c in die Scheitelform umformen: y = a(x − xs)² + ys. Beispiel: y = x² − 4x + 5 = (x − 2)² + 1 mit S(2|1).' }
      },
      frame: function (t) { var f = Math.floor(t / 400) % 2; return { i: 0, dx: 0, dy: f }; }
    }
  };

  // Pumpenkammer: Riffelblech, blaue Pumpen, Quelle als Rastquelle,
  // Alte Schalttafel und Messtafel an der Wand
  var PUMPE = {
    art: 'blech', rohr: '#2e6aa8',
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
      schalttafel(r);
      messtafel(r);
      ventilrad(r, 12 * TILE + 8, 1 * TILE + 11);
      Buildings.well(r, 9, 5);   // Quelle sieht aus wie der Dorfbrunnen
    },
    objects: [
      {
        // Erklaer-Objekt: Merksatz zum Scheitel aus der allgemeinen Form
        tiles: [[6, 1]],
        x: 6 * TILE, y: 1 * TILE,
        name: 'Alte Schalttafel',
        texts: [
          'Auf der Tafel steht: Bei y = ax² + bx + c liegt der Scheitel bei xs = −b : (2a). Dann ys ausrechnen.',
          'Darunter ein Beispiel: y = x² − 6x + 8. Hier ist xs = 3, und ys = 8 − 9 = −1, also S(3|−1).'
        ],
        merk: { id: 'scheitelallgemein', name: 'Scheitel aus der allgemeinen Form', text: 'Bei y = ax² + bx + c gilt xs = −b : (2a), dann ys einsetzen. Beispiel: y = x² − 6x + 8 mit S(3|−1).' }
      },
      {
        // Erklaer-Objekt: Merksatz zur Parabel durch drei Punkte
        tiles: [[3, 1]],
        x: 3 * TILE, y: 1 * TILE,
        name: 'Messtafel',
        texts: [
          'Auf der Messtafel steht: Geht eine Parabel durch drei Punkte, setze jeden Punkt in y = ax² + bx + c ein.',
          'Liegt ein Punkt auf der y-Achse, kennst du c sofort. Aus den beiden anderen Punkten berechnest du a und b.',
          'Beispiel: P1(0|1), P2(1|2), P3(−1|2). Aus P1 folgt c = 1. Dann gilt a + b = 1 und a − b = 1, also a = 1, b = 0 und y = x² + 1.'
        ],
        merk: { id: 'dreiPunkte', name: 'Parabel durch drei Punkte', text: 'Jeden Punkt in y = ax² + bx + c einsetzen. Ein Punkt auf der y-Achse liefert c sofort, die anderen beiden a und b.' }
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

  // Gitter vor der Oeffnung zur Turbinenhalle (bis die Schaltwarte geloest ist)
  function bars(r) {
    var x = 8 * TILE, y = 1 * TILE;
    r.px(x, y + 2, TILE, 1, '#b8c0c8');
    for (var i = 1; i < 16; i += 3) {
      r.px(x + i, y + 2, 2, 14, '#5a6470');
      r.px(x + i, y + 2, 1, 14, '#9aa4b0');
    }
  }

  // Schaltwarte: Leitstand mit Bildschirm, drei Hebel, Startschalter,
  // Druckrohr an der rechten Wand (schaltwarte.js)
  var RAETSEL = {
    art: 'warte', rohr: '#7a5a3a',
    map: [
      '################',
      '#WWWWWWWMWWWWWW#',
      '#Wdddddd.....pW#',
      '#Wdddddd.....pW#',
      '#Wdddddd.....pW#',
      '#Wdddddd.....pW#',
      '#Wdddddd.....pW#',
      '#Wdddddd.....pW#',
      '#W...........pW#',
      '#W.h.h.h..s..pW#',
      '#W...........pW#',
      '#W........k...W#',
      '#WWWWWWWMWWWWWW#',
      '################'
    ],
    mats: {
      '8,1': { room: 'wboss', x: 8 * TILE, y: 11 * TILE, facing: 'up' },
      '8,12': { room: 'wmitte', x: 8 * TILE, y: 2 * TILE, facing: 'down' }
    },
    bakeExtra: function (r) { Schaltwarte.bake(r); },
    objects: Schaltwarte.objects().concat([
      {
        tiles: [[10, 11]],
        x: 10 * TILE, y: 11 * TILE,
        name: 'Tafel',
        texts: [
          'Bringe die Turbine zum Laufen: Stelle mit den Hebeln a, b und c die Parabel y = ax² + bx + c ein, die durch alle drei Anschlüsse P1, P2 und P3 geht.',
          'P1 liegt auf der y-Achse – denk an die Messtafel. Dann drücke den Startschalter.'
        ],
        later: { schaltwarte: true, replace: true, texts: ['Die Parabel ' + Schaltwarte.FORMEL + ' trifft alle drei Anschlüsse. Die Turbine läuft, das Gitter ist offen.'] }
      }
    ])
  };

  // Turbinenhalle: Stahlgitter, Turbinenschacht im Boden, Boss darueber
  var BOSSRAUM = {
    art: 'halle', rohr: '#5a6a7a',
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
    },
    bakeExtra: function (r) {
      turbinenSchacht(r);
      ventilrad(r, 3 * TILE + 8, 1 * TILE + 11);
      ventilrad(r, 12 * TILE + 8, 1 * TILE + 11);
    }
  };

  // Raumdefinitionen fertigstellen (Bake, Licht, Vignette)
  [EINGANG, PUMPE, RAETSEL, BOSSRAUM].forEach(function (R) {
    R.bakeFull = function (r) { bakeRoom(r, R); };
    R.overlay = vignette;
  });

  // Vorhalle: drei Deckenlampen, eine flackert
  EINGANG.anim = function (r, t) { lampen(r, t, [64, 128, 192], 2); };

  // Pumpenkammer: Lampen und Dampf am Ventil
  PUMPE.anim = function (r, t) {
    lampen(r, t, [80, 176], -1);
    dampf(r, t, 12 * TILE + 8, 1 * TILE + 8);
  };

  // Schaltwarte: Bildschirm, Hebel, Druckrohr live; Gitter bis geloest
  RAETSEL.anim = function (r, t) {
    Schaltwarte.draw(r, t);
    Schaltwarte.drawRohr(r, t);
    if (!Schaltwarte.isSolved()) bars(r);
  };

  // Turbinenhalle: Wasser im Schacht; nach dem Sieg schaeumt es kraeftig
  BOSSRAUM.anim = function (r, t) {
    var ctx = r.getCtx();
    var frei = typeof Boss !== 'undefined' && Boss.of('wboss') && Boss.of('wboss').isDefeated();
    for (var i = 0; i < (frei ? 14 : 5); i++) {
      var a = (t / (frei ? 300 : 1400) + i / (frei ? 14 : 5)) * Math.PI * 2;
      ctx.globalAlpha = frei ? 0.7 : 0.4;
      r.px(112 + Math.round(Math.cos(a) * 22), 88 + Math.round(Math.sin(a) * 7), 2, 1, '#bfe6f8');
    }
    ctx.globalAlpha = 1;
    lampen(r, t, [48, 208], -1);
  };

  Interior.register('weingang', EINGANG);
  Interior.register('wmitte', PUMPE);
  Interior.register('wraetsel', RAETSEL);
  Interior.register('wboss', BOSSRAUM);
})();
