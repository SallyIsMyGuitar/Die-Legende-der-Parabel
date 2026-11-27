// turm.js: Der Leuchtturm - Dungeon 2 (Scheitelform)
// Fuenf Raeume, strikt linear: Eingang (Tuermerin erklaert die Scheitelform),
// Maschinenraum mit Quelle (Rastquelle auf halber Strecke), Linsenkammer
// (Schiebe-Raetsel, Logik in linse.js), Spiegelraum (Raetsel, spiegel.js),
// Laternenzimmer (Boss). Aufbau wie die Hoehle: 16 x 14 Kacheln, angemeldet per
// Interior.register(), Uebergaenge ueber mats.
// Zeichen: '#' ausserhalb, 'W' Turmwand, '.' Boden, 'M' Tuermeingang,
//          'x' Kisten (blockieren), 'Q' Quelle (blockiert, wie Hoehle),
//          'p' Linsenstativ (blockiert, Linsenkammer)
(function () {
  'use strict';

  var TILE = 16;
  var hash = Render.hash;

  // --- Turm-Optik ------------------------------------------------------------
  // Runder Turm: Ecken als Rundung, Holzdielen, Fenster mit Meerblick und
  // Lichtflecken. Jeder Raum hat ein eigenes Thema (def.art):
  // 'eingang' Seemanns-Eingang, 'maschine' Maschinenraum mit Zahnraedern,
  // 'linse' Linsenkammer (naechtlich, Messing und Glas),
  // 'nacht' Spiegelraum unter dem Sternenhimmel, 'laterne' Laternenzimmer.
  var mix = Render.mix;
  // Naechtliche Raeume: gedaempfte Waende, Sterne in den Fenstern, keine Lichtflecken
  function dunkel(art) { return art === 'nacht' || art === 'linse'; }
  var DIELE = {
    eingang: ['#b0804c', '#9a6c3e', '#7a5430'],
    maschine: ['#8e7a62', '#7a6852', '#5e5040'],
    linse: ['#4a4252', '#3e3848', '#2c2836'],
    nacht: ['#3a4058', '#323750', '#262a3e'],
    laterne: ['#4a5260', '#3a414e', '#2a303a']
  };

  function isWall(def, tx, ty) {
    var c = def.map[ty] ? def.map[ty].charAt(tx) : '#';
    return c === 'W' || c === '#' || c === '';
  }

  // Holzdielen (waagerecht, versetzte Stoesse); Laternenzimmer: Gitterboden
  function towerFloor(r, tx, ty, art) {
    var c = DIELE[art] || DIELE.eingang;
    var x = tx * TILE, y = ty * TILE;
    if (art === 'laterne') {
      r.px(x, y, TILE, TILE, c[1]);
      for (var i = 0; i < TILE; i += 4) {
        r.px(x + i, y, 1, TILE, c[2]);
        r.px(x, y + i, TILE, 1, c[2]);
      }
      r.px(x + 1, y + 1, 2, 1, c[0]);
      return;
    }
    for (var row = 0; row < 4; row++) {
      var py = y + row * 4;
      r.px(x, py, TILE, 4, (row + ty) % 2 ? c[0] : mix(c[0], c[1], 0.5));
      r.px(x, py + 3, TILE, 1, c[2]);                    // Fuge
      var st = (Math.floor(hash(tx * 3 + row, ty * 7) * 12) + 2);
      r.px(x + st, py, 1, 3, c[2]);                       // Stoss
      if (hash(tx + row * 5, ty * 11) > 0.8) r.px(x + 3, py + 1, 4, 1, c[1]);   // Maserung
    }
  }

  // Turmwand: weisser Putz mit rotem Band; Ecken werden rund gezeichnet
  function towerWall(r, tx, ty, def) {
    var x = tx * TILE, y = ty * TILE;
    var nacht = dunkel(def.art);
    var putz = nacht ? '#a8a6b8' : '#ece7da';
    r.px(x, y, TILE, TILE, putz);
    r.px(x, y, TILE, 1, mix(putz, '#ffffff', 0.4));
    r.px(x, y + 11, TILE, 5, nacht ? '#8a3a40' : '#d8443c');   // rotes Band
    r.px(x, y + 11, TILE, 1, nacht ? '#a85258' : '#ea6a5e');
    r.px(x, y + 15, TILE, 1, '#a89e90');
    var j = (ty % 2) ? 5 : 11;
    r.px(x + j, y, 1, 2, mix(putz, '#000000', 0.08));
  }

  // Rundung in einer Raumecke (Ecke ist eine Wandkachel, an die zwei
  // Bodenkacheln grenzen): Viertelkreis aus Wand, Rest Boden
  function rundeEcke(r, tx, ty, def) {
    var x = tx * TILE, y = ty * TILE;
    // Durchgaenge ('M') zaehlen hier als Wand, damit neben ihnen keine Rundung entsteht
    function frei(x, y) { return !isWall(def, x, y) && def.map[y].charAt(x) !== 'M'; }
    var fx = frei(tx + 1, ty) ? 1 : (frei(tx - 1, ty) ? -1 : 0);
    var fy = frei(tx, ty + 1) ? 1 : (frei(tx, ty - 1) ? -1 : 0);
    if (!fx || !fy) return false;
    towerFloor(r, tx, ty, def.art);
    // Mittelpunkt des Viertelkreises in der Ecke, die zur Wand zeigt
    var cx = fx > 0 ? x : x + TILE, cy = fy > 0 ? y : y + TILE;
    var putz = dunkel(def.art) ? '#a8a6b8' : '#ece7da';
    for (var py = 0; py < TILE; py++) {
      for (var px = 0; px < TILE; px++) {
        var d = Math.sqrt(Math.pow(x + px + 0.5 - cx, 2) + Math.pow(y + py + 0.5 - cy, 2));
        if (d < 14) r.px(x + px, y + py, 1, 1, d > 12.5 ? '#a89e90' : (d > 9 ? (dunkel(def.art) ? '#8a3a40' : '#d8443c') : putz));
      }
    }
    return true;
  }

  // Schatten der Waende auf den Boden
  function wallShadows(r, def) {
    var ctx = r.getCtx();
    ctx.globalAlpha = 0.18;
    for (var ty = 0; ty < 14; ty++) {
      for (var tx = 0; tx < 16; tx++) {
        if (isWall(def, tx, ty)) continue;
        if (isWall(def, tx, ty - 1)) r.px(tx * TILE, ty * TILE, TILE, 3, '#000000');
        if (isWall(def, tx - 1, ty)) r.px(tx * TILE, ty * TILE, 2, TILE, '#000000');
      }
    }
    ctx.globalAlpha = 1;
  }

  // Kisten (Eingang) bzw. Oelfaesser (Maschinenraum), blockieren
  function crate(r, tx, ty, art) {
    var x = tx * TILE, y = ty * TILE;
    r.ellipse(x + 8, y + 14, 7, 2, 'rgba(40,20,10,0.3)');
    if (art === 'maschine') {
      r.px(x + 3, y + 2, 10, 12, '#3e6a8a');
      r.px(x + 3, y + 2, 10, 2, '#5a8aaa');
      r.px(x + 3, y + 6, 10, 1, '#2a4a62');
      r.px(x + 3, y + 10, 10, 1, '#2a4a62');
      r.px(x + 5, y + 3, 2, 1, '#c8a040');
      return;
    }
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

  // Fenster: tags Himmel und Meer, nachts Sternenhimmel (Sterne im Laufbild)
  function seaWindow(r, tx, ty, nacht) {
    var x = tx * TILE, y = ty * TILE;
    r.px(x + 3, y + 1, 10, 12, '#6e4a2c');
    if (nacht) {
      r.px(x + 4, y + 2, 8, 10, '#0e1430');
      r.px(x + 4, y + 9, 8, 3, '#141c3e');
    } else {
      r.px(x + 4, y + 2, 8, 6, '#8ac8f0');        // Himmel
      r.px(x + 4, y + 2, 8, 2, '#b4dcf6');
      r.px(x + 4, y + 8, 8, 4, '#2e6aa8');        // Meer
      r.px(x + 5, y + 9, 2, 1, '#8ac8f0');
      r.px(x + 9, y + 10, 2, 1, '#8ac8f0');
    }
    r.px(x + 7, y + 2, 2, 10, '#6e4a2c');         // Sprosse
    r.px(x + 4, y + 7, 8, 1, '#6e4a2c');
    r.px(x + 2, y + 13, 12, 2, '#a89e90');        // Sims
  }

  // Lichtflecken der Fenster auf dem Boden (tags), leicht schimmernd
  function lichtflecken(r, t, def) {
    if (dunkel(def.art) || !def.windows) return;
    var ctx = r.getCtx();
    def.windows.forEach(function (w, i) {
      ctx.globalAlpha = 0.1 + 0.02 * Math.sin(t / 800 + i);
      for (var k = 0; k < 40; k += 2) r.px(w[0] * TILE + 3 + k / 3, 2 * TILE + k, 10, 2, '#fff8d8');
    });
    ctx.globalAlpha = 1;
  }

  // Sterne in den Fenstern (Spiegelraum)
  function sterne(r, t, def) {
    def.windows.forEach(function (w, i) {
      for (var k = 0; k < 4; k++) {
        if ((Math.floor(t / 400) + k + i) % 5 === 0) continue;
        r.px(w[0] * TILE + 5 + (k * 5 + i * 3) % 7, w[1] * TILE + 3 + (k * 3 + i) % 6, 1, 1, '#f8f4d0');
      }
    });
  }

  // Laternen an der Wand (seit dem Bann erloschen)
  function wallLamp(r, tx, ty) {
    var x = tx * TILE, y = ty * TILE;
    r.px(x + 6, y + 8, 4, 6, '#5a5468');
    r.px(x + 5, y + 14, 6, 2, '#8a8496');
    r.px(x + 5, y + 5, 6, 4, '#3e3a4a');
    r.px(x + 6, y + 6, 4, 2, '#2a2634');
  }

  // --- Deko je Raum ---------------------------------------------------------

  // Eingang: Seilrolle, Rettungsring und Fischernetz an der Wand,
  // Wendeltreppe in der rechten oberen Rundung
  function seemannsDeko(r) {
    // Rettungsring (Wand, Kachel 6,1)
    var rx = 6 * TILE + 8, ry = 1 * TILE + 7;
    r.ellipse(rx, ry, 6, 6, '#e8443a');
    r.ellipse(rx, ry, 3, 3, '#ece7da');
    r.px(rx - 6, ry - 1, 3, 2, '#ffffff');
    r.px(rx + 4, ry - 1, 3, 2, '#ffffff');
    // Fischernetz (Wand, Kachel 10,1)
    var nx = 10 * TILE + 1, ny = 1 * TILE + 1;
    for (var i = 0; i < 14; i += 3) {
      r.px(nx + i, ny, 1, 10, '#8a7a5a');
      r.px(nx, ny + i * 0.7, 14, 1, '#8a7a5a');
    }
    // Seilrolle (Boden, flach, Kachel 11,11)
    var sx = 11 * TILE + 8, sy = 11 * TILE + 8;
    r.ellipse(sx, sy, 6, 4, '#a88a5a');
    r.ellipse(sx, sy, 4, 2, '#c8a870');
    r.ellipse(sx, sy, 1, 1, '#7a6040');
    // Wendeltreppe in der Rundung oben rechts (Kachel 13,2)
    var tx = 13 * TILE + 8, ty = 2 * TILE + 8;
    for (var k = 0; k < 6; k++) {
      var a = k / 6 * Math.PI * 1.5 + Math.PI;
      r.px(tx + Math.round(Math.cos(a) * 5) - 2, ty + Math.round(Math.sin(a) * 5) - 1, 5, 2, k % 2 ? '#9a6c3e' : '#b0804c');
    }
    r.ellipse(tx, ty, 1, 1, '#5a4030');
  }

  // Maschinenraum: Messingrohre an den Seitenwaenden
  function messingrohre(r) {
    [1 * TILE + 10, 14 * TILE + 2].forEach(function (x) {
      r.px(x, 2 * TILE, 4, 10 * TILE, '#b8903a');
      r.px(x, 2 * TILE, 1, 10 * TILE, '#e8c060');
      for (var y = 3 * TILE; y < 12 * TILE; y += 32) r.px(x - 1, y, 6, 2, '#7a5a20');
    });
  }

  // Zahnrad (Laufbild): dreht sich langsam an der Wand
  function zahnrad(r, cx, cy, rad, t, dir) {
    var ang = t / 900 * dir;
    r.ellipse(cx, cy, rad, rad, '#8a6a2a');
    r.ellipse(cx, cy, rad - 2, rad - 2, '#c8a040');
    for (var k = 0; k < 8; k++) {
      var a = ang + k / 8 * Math.PI * 2;
      r.px(Math.round(cx + Math.cos(a) * (rad + 1)) - 1, Math.round(cy + Math.sin(a) * (rad + 1)) - 1, 3, 3, '#8a6a2a');
    }
    r.ellipse(cx, cy, 2, 2, '#5a4418');
  }

  // Laternenzimmer: grosser Linsenring um die Raummitte (unter dem Boss)
  function linsenring(r) {
    var cx = 112, cy = 84;
    r.ellipse(cx, cy, 40, 18, '#3a414e');
    r.ellipse(cx, cy, 38, 16, '#8a94a4');
    r.ellipse(cx, cy, 34, 14, '#2a303a');
    for (var k = 0; k < 12; k++) {
      var a = k / 12 * Math.PI * 2;
      r.px(Math.round(cx + Math.cos(a) * 36) - 1, Math.round(cy + Math.sin(a) * 15) - 1, 3, 2, '#c8d4e0');
    }
  }

  // Moewen ziehen vor den Fenstern des Laternenzimmers vorbei
  function moewen(r, t, def) {
    def.windows.forEach(function (w, i) {
      var ph = (t / 3000 + i * 0.37) % 1;
      var x = w[0] * TILE + 4 + Math.floor(ph * 8);
      var y = w[1] * TILE + 4 + (i % 2);
      r.px(x, y, 1, 1, '#ffffff');
      r.px(x + 1, y + (Math.floor(t / 200) % 2), 1, 1, '#ffffff');
      r.px(x - 1, y + (Math.floor(t / 200) % 2), 1, 1, '#ffffff');
    });
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
    var ty, tx, c;
    for (ty = 0; ty < 14; ty++) {
      for (tx = 0; tx < 16; tx++) {
        c = def.map[ty].charAt(tx);
        if (c === '#') continue;
        if (c === 'W') {
          if (!rundeEcke(r, tx, ty, def)) towerWall(r, tx, ty, def);
          continue;
        }
        towerFloor(r, tx, ty, def.art);
      }
    }
    wallShadows(r, def);
    for (ty = 0; ty < 14; ty++) {
      for (tx = 0; tx < 16; tx++) {
        c = def.map[ty].charAt(tx);
        if (c === 'x') crate(r, tx, ty, def.art);
        else if (c === 'M') towerOpening(r, tx, ty, ty < 7);
      }
    }
    var i;
    if (def.windows) {
      for (i = 0; i < def.windows.length; i++) seaWindow(r, def.windows[i][0], def.windows[i][1], dunkel(def.art));
    }
    if (def.lamps) {
      for (i = 0; i < def.lamps.length; i++) wallLamp(r, def.lamps[i][0], def.lamps[i][1]);
    }
    if (def.bakeExtra) def.bakeExtra(r);
  }

  // --- Die vier Raeume --------------------------------------------------------

  // Eingang: von der Kueste nach oben in den Maschinenraum
  // Thema: Seemanns-Eingang mit Rettungsring, Netz, Seilrolle, Wendeltreppe
  var EINGANG = {
    art: 'eingang',
    map: [
      '################',
      '#WWWWWWWMWWWWWW#',
      '#WW..........WW#',
      '#W....x.......W#',
      '#W............W#',
      '#W..x.......x.W#',
      '#W............W#',
      '#W............W#',
      '#W.....x......W#',
      '#W............W#',
      '#W..x.......x.W#',
      '#WW..........WW#',
      '#WWWWWWWMWWWWWW#',
      '################'
    ],
    mats: {
      '8,1': { room: 'lmitte', x: 8 * TILE, y: 11 * TILE, facing: 'up' },
      '8,12': { screen: 'kueste', x: 8.5 * TILE, y: 12 * TILE, facing: 'down' }
    },
    windows: [[3, 1], [12, 1]],
    lamps: [[5, 12], [10, 12]],
    bakeExtra: function (r) { seemannsDeko(r); },
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
  // Thema: Maschinenraum mit Zahnraedern, Messingrohren und Oelfaessern
  var MASCHINEN = {
    art: 'maschine',
    map: [
      '################',
      '#WWWWWWWMWWWWWW#',
      '#WW..........WW#',
      '#W............W#',
      '#W............W#',
      '#W........Q...W#',
      '#W............W#',
      '#W............W#',
      '#W....x.......W#',
      '#W............W#',
      '#W........x...W#',
      '#WW..........WW#',
      '#WWWWWWWMWWWWWW#',
      '################'
    ],
    mats: {
      '8,1': { room: 'llinse', x: 8 * TILE, y: 11 * TILE, facing: 'up' },
      '8,12': { room: 'leingang', x: 8 * TILE, y: 2 * TILE, facing: 'down' }
    },
    windows: [[3, 1], [12, 1]],
    lamps: [[5, 12], [10, 12]],
    bakeExtra: function (r) {
      messingrohre(r);
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
  // Thema: Nacht – Sternenhimmel in den Fenstern, dunkle Dielen
  var SPIEGEL = {
    art: 'nacht',
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
      '8,12': { room: 'llinse', x: 8 * TILE, y: 2 * TILE, facing: 'down' }
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

  // Linsenkammer: Messingschild mit Merksatz an der Wand (Kachel 5,1)
  function messingschild(r) {
    var x = 5 * TILE, y = 1 * TILE;
    r.px(x + 1, y + 2, 14, 10, '#7a5a20');
    r.px(x + 2, y + 3, 12, 8, '#c8a040');
    r.px(x + 2, y + 3, 12, 1, '#e8c060');
    // eingravierte Parabel mit verschobenem Scheitel
    r.px(x + 4, y + 5, 1, 1, '#6a4a18');
    r.px(x + 5, y + 7, 1, 1, '#6a4a18');
    r.px(x + 6, y + 8, 2, 1, '#6a4a18');
    r.px(x + 8, y + 7, 1, 1, '#6a4a18');
    r.px(x + 9, y + 5, 1, 1, '#6a4a18');
    r.px(x + 11, y + 4, 1, 6, '#8a6a28');   // kleine y-Achse
  }

  // Linsenkammer: Regal mit Glaslinsen an der Wand (Kachel 10,1)
  function linsenregal(r) {
    var x = 10 * TILE, y = 1 * TILE;
    r.px(x + 1, y + 12, 14, 2, '#6e4a2c');
    r.px(x + 1, y + 6, 14, 1, '#6e4a2c');
    [[4, 3, 3], [10, 3, 2], [4, 9, 2], [10, 9, 3]].forEach(function (l) {
      r.ellipse(x + l[0], y + l[1], l[2], l[2], '#b8903a');
      r.ellipse(x + l[0], y + l[1], l[2] - 1, l[2] - 1, '#8ab4d8');
    });
  }

  // Linsenkammer: Schiebe-Raetsel zwischen Maschinenraum und Spiegelraum
  // (Logik in linse.js). Der Linsenstein muss auf den Scheitel der Parabel
  // der Steintafel; zwei Linsenstative ('p') erzwingen einen Umweg.
  // Thema: naechtliche Linsenkammer mit Messing und Glas
  var LINSE = {
    art: 'linse',
    map: [
      '################',
      '#WWWWWWWMWWWWWW#',
      '#WW..........WW#',
      '#W............W#',
      '#W............W#',
      '#W...p........W#',
      '#W....p.......W#',
      '#W............W#',
      '#W............W#',
      '#W............W#',
      '#W............W#',
      '#WW.........kWW#',
      '#WWWWWWWMWWWWWW#',
      '################'
    ],
    mats: {
      '8,1': { room: 'lraetsel', x: 8 * TILE, y: 11 * TILE, facing: 'up' },
      '8,12': { room: 'lmitte', x: 8 * TILE, y: 2 * TILE, facing: 'down' }
    },
    windows: [[3, 1], [12, 1]],
    lamps: [[5, 12], [10, 12]],
    // der Linsenstein blockiert seine Kachel
    blockedAt: function (tx, ty) { return Linse.blockedAt(tx, ty); },
    bakeExtra: function (r) {
      Linse.bakeGrid(r);
      Linse.bakePlate(r);
      for (var ty = 0; ty < 14; ty++) {
        for (var tx = 0; tx < 16; tx++) {
          var c = LINSE.map[ty].charAt(tx);
          if (c === 'p') Linse.bakeStativ(r, tx, ty);
          else if (c === 'k') floorTablet(r, tx, ty);
        }
      }
      messingschild(r);
      linsenregal(r);
    },
    objects: [
      {
        // Erklaer-Objekt: Merksatz zur Verschiebung der Normalparabel
        tiles: [[5, 1]],
        x: 5 * TILE, y: 1 * TILE,
        name: 'Messingschild',
        texts: [
          'Auf dem Messingschild steht: Die Parabel y = (x − xs)² + ys ist die Normalparabel y = x², verschoben um xs in x-Richtung und um ys in y-Richtung.',
          'Ihr Scheitel S(xs|ys) wandert mit. Ist xs positiv, geht es nach rechts, ist ys positiv, nach oben.'
        ],
        merk: { id: 'verschiebungTurm', name: 'Verschobene Normalparabel', text: 'y = (x − xs)² + ys ist die Normalparabel, verschoben um xs in x-Richtung und um ys in y-Richtung. Scheitel S(xs|ys).' }
      },
      {
        tiles: [[12, 11]],
        x: 12 * TILE, y: 11 * TILE,
        name: 'Steintafel',
        texts: [
          'Schiebe den Linsenstein auf den Scheitel der Parabel ' + Linse.FORMEL + '. Sein Licht zeichnet eine Parabel, deren Scheitel immer der Stein ist.',
          'Lauf kurz gegen den Stein, dann rutscht er ein Feld weiter. Ziehen geht nicht. Steckt er fest, bringt ihn die Druckplatte links unten zurück.'
        ],
        later: { linse: true, replace: true, texts: ['Der Linsenstein ruht im Scheitel der Parabel ' + Linse.FORMEL + '. Das Gitter ist offen.'] }
      }
    ]
  };

  // Laternenzimmer: der Boss folgt in einem spaeteren Schritt
  // Thema: Laternenzimmer mit Fensterband, Gitterboden und Linsenring
  var LATERNE = {
    art: 'laterne',
    map: [
      '################',
      '#WWWWWWWWWWWWWW#',   // keine Oeffnung nach oben (Ende des Dungeons)
      '#WW..........WW#',
      '#W............W#',
      '#W............W#',
      '#W............W#',
      '#W............W#',
      '#W............W#',
      '#W............W#',
      '#W............W#',
      '#W............W#',
      '#WW..........WW#',
      '#WWWWWWWMWWWWWW#',
      '################'
    ],
    mats: {
      '8,12': { room: 'lraetsel', x: 8 * TILE, y: 2 * TILE, facing: 'down' }
    },
    windows: [[3, 1], [4, 1], [5, 1], [6, 1], [10, 1], [11, 1], [12, 1]],
    bakeExtra: function (r) { linsenring(r); }
  };

  // Raumdefinitionen fertigstellen (Bake und Vignette)
  [EINGANG, MASCHINEN, LINSE, SPIEGEL, LATERNE].forEach(function (R) {
    R.bakeFull = function (r) { bakeTower(r, R); };
    R.overlay = vignette;
  });

  // Laternenzimmer: nach dem Sieg des Bosses haengt die Laterne leuchtend
  // ueber der Raummitte (der Waechter selbst ist verschwunden)
  LATERNE.anim = function (r, t) {
    lichtflecken(r, t, LATERNE);
    moewen(r, t, LATERNE);
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
    sterne(r, t, SPIEGEL);
    Spiegel.drawLight(r, t);
    if (!Spiegel.isSolved()) bars(r);
  };

  // Linsenkammer: Sterne, Lichtparabel und Stein im Laufbild, Gitter bis
  // der Stein im Scheitel ruht
  LINSE.anim = function (r, t) {
    sterne(r, t, LINSE);
    Linse.draw(r, t);
    if (!Linse.isSolved()) bars(r);
  };

  // Eingang: Lichtflecken der Fenster; Maschinenraum: Zahnraeder drehen sich
  EINGANG.anim = function (r, t) { lichtflecken(r, t, EINGANG); };
  MASCHINEN.anim = function (r, t) {
    lichtflecken(r, t, MASCHINEN);
    zahnrad(r, 10 * TILE + 8, 1 * TILE + 7, 6, t, 1);
    zahnrad(r, 11 * TILE + 9, 1 * TILE + 11, 4, t * 1.5, -1);
  };

  Interior.register('leingang', EINGANG);
  Interior.register('lmitte', MASCHINEN);
  Interior.register('llinse', LINSE);
  Interior.register('lraetsel', SPIEGEL);
  Interior.register('lboss', LATERNE);
})();
