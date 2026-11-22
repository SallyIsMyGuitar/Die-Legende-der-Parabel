// interior.js: Innenräume – gemeinsamer Raum-Rahmen, Hilfsfunktionen, Elternhaus
// Raster wie draußen: 16 Spalten x 14 Zeilen zu 16 Pixeln. Alle Räume haben
// denselben Grundriss (Wand oben, Ausgang unten in der Mitte).
// Zeichen: '#' = außerhalb (schwarz), 'W' = Wand, '.' = Boden,
//          'x' = Möbel/Person (blockiert), 'M' = Fußmatte (Ausgang)
// Weitere Räume werden in js/rooms.js mit Interior.register() angemeldet.
var Interior = (function () {
  'use strict';

  var TILE = 16;
  var W = 16 * TILE;
  var H = 14 * TILE;

  // Startpunkt beim Betreten: direkt über der Fußmatte
  var SPAWN = { x: 7 * TILE + 8, y: 11 * TILE };

  var hash = Render.hash, mix = Render.mix;
  var rooms = {};

  function register(name, def) {
    rooms[name] = def;
  }

  function cell(room, tx, ty) {
    var map = rooms[room].map;
    if (tx < 0 || ty < 0 || ty >= map.length || tx >= map[ty].length) return '#';
    return map[ty].charAt(tx);
  }

  function isBlocked(room, tx, ty) {
    var c = cell(room, tx, ty);
    if (guestAt(room, tx, ty)) return true;   // weitere Figuren blockieren ihre Kachel
    return c !== '.' && c !== 'M';
  }

  // Weitere Figuren im Raum (def.guests), z. B. Kundin und Schueler im Laden.
  // Jede: { x, y, facing, sprites, talk } – sie drehen sich beim Gespraech um.
  function guestAt(room, tx, ty) {
    var gs = rooms[room].guests || [];
    for (var i = 0; i < gs.length; i++) {
      if (gs[i].x / TILE === tx && gs[i].y / TILE === ty) return gs[i];
    }
    return null;
  }

  function isExit(room, tx, ty) {
    return cell(room, tx, ty) === 'M';
  }

  // Bewohner, mit dem man an Kachel (tx, ty) reden kann (oder null).
  // npc.talkTiles erlaubt zusätzliche Kacheln, z. B. die Ladentheke.
  // Zusaetzlich koennen Raeume Objekte haben (z. B. Quelle, Steintafel)
  // mit eigener Aktion wie 'rest' (Rastquelle).
  function talkTarget(room, tx, ty) {
    var def = rooms[room];
    var objs = def.objects || [];
    for (var o = 0; o < objs.length; o++) {
      for (var j = 0; j < objs[o].tiles.length; j++) {
        if (objs[o].tiles[j][0] === tx && objs[o].tiles[j][1] === ty) {
          return {
            name: objs[o].name, texts: objs[o].texts, action: objs[o].action,
            spawn: objs[o].spawn, merk: objs[o].merk, later: objs[o].later, torch: objs[o].torch, hebel: objs[o].hebel,
            hintX: objs[o].x, hintY: objs[o].y
          };
        }
      }
    }
    var g = guestAt(room, tx, ty);
    if (g) {
      return { name: g.talk.name, texts: g.talk.texts, later: g.talk.later, hintX: g.x + 8, hintY: g.y, npc: g };
    }
    var npc = def.npc;
    if (!npc || !npc.talk) return null;
    var tiles = [[npc.x / TILE, npc.y / TILE]].concat(npc.talkTiles || []);
    for (var i = 0; i < tiles.length; i++) {
      if (tiles[i][0] === tx && tiles[i][1] === ty) {
        return { name: npc.talk.name, texts: npc.talk.texts, merk: npc.talk.merk, later: npc.talk.later, hintX: npc.x + 8, hintY: npc.y };
      }
    }
    return null;
  }

  // Uebergang einer Hoehlenoeffnung (Kachel 'M') im angegebenen Raum
  function matWarp(room, tx, ty) {
    var m = rooms[room].mats;
    return m ? m[tx + ',' + ty] : null;
  }

  // --- Raum-Rahmen -----------------------------------------------------
  // floor: { type: 'planks'|'tiles', a, b, hi, seam, grain }
  function drawFloor(r, f) {
    var x0 = 2 * TILE, x1 = 14 * TILE, y0 = 3 * TILE, y1 = 12 * TILE;
    var row, y;
    if (f.type === 'tiles') {
      for (y = y0; y < y1; y += 8) {
        for (var x = x0; x < x1; x += 8) {
          var even = ((x - x0) / 8 + (y - y0) / 8) % 2 === 0;
          r.px(x, y, 8, 8, even ? f.a : f.b);
          r.px(x, y, 8, 1, f.hi);
          r.px(x, y + 7, 8, 1, f.seam);
        }
      }
    } else {
      for (row = 0; row < (y1 - y0) / 4; row++) {
        y = y0 + row * 4;
        r.px(x0, y, x1 - x0, 4, hash(row, 3) > 0.5 ? f.a : f.b);
        r.px(x0, y, x1 - x0, 1, f.hi);
        r.px(x0, y + 3, x1 - x0, 1, f.seam);
        var xx = x0 + Math.floor(hash(row, 7) * 24);
        while (xx < x1) {
          r.px(xx, y, 1, 3, f.seam);
          xx += 26 + Math.floor(hash(row, xx) * 22);
        }
        for (var k = 0; k < 6; k++) {
          var gx = x0 + Math.floor(hash(row * 13 + k, 5) * (x1 - x0 - 6));
          r.px(gx, y + 1 + (k % 2), 3 + (k % 3), 1, f.grain);
        }
      }
    }
    r.px(x0, y0, x1 - x0, 3, 'rgba(60,30,10,0.3)');
  }

  // wall: { paper, pattern: 'stripes'|'dots', accent, wain, wainHi, wainLine }
  function drawWalls(r, w) {
    var x0 = 2 * TILE, x1 = 14 * TILE, y0 = TILE, y1 = 3 * TILE, x;
    r.px(x0, y0, x1 - x0, y1 - y0, w.paper);
    if (w.pattern === 'dots') {
      for (x = x0 + 3; x < x1; x += 8) {
        for (var yy = y0 + 5; yy < y0 + 21; yy += 8) {
          var off = ((yy - y0) / 8) % 2 ? 4 : 0;
          r.px(x + off, yy, 2, 2, w.accent);
          r.px(x + off, yy + 2, 1, 1, w.leaf || w.accent);
        }
      }
    } else {
      for (x = x0; x < x1; x += 6) r.px(x, y0, 2, 22, w.accent);
    }
    r.px(x0, y0, x1 - x0, 2, '#5a3a2a');
    r.px(x0, y0 + 2, x1 - x0, 1, '#8a6a4e');
    r.px(x0, y0 + 22, x1 - x0, 10, w.wain);
    r.px(x0, y0 + 22, x1 - x0, 1, w.wainHi);
    for (x = x0 + 6; x < x1; x += 12) r.px(x, y0 + 24, 1, 6, w.wainLine);
    r.px(x0, y1 - 2, x1 - x0, 2, '#5a3a22');

    // Seitenwände und untere Wand als dunkle Holzkante
    r.px(x0 - 4, y0 - 4, x1 - x0 + 8, 4, '#3a2418');
    r.px(x0 - 4, y0 - 4, x1 - x0 + 8, 1, '#6a4a32');
    r.px(x0 - 4, y0, 4, 12 * TILE - y0 + 6, '#3a2418');
    r.px(x1, y0, 4, 12 * TILE - y0 + 6, '#3a2418');
    r.px(x0 - 1, y0, 1, 12 * TILE - y0, '#6a4a32');
    r.px(x1, y0, 1, 12 * TILE - y0, '#6a4a32');
    var by = 12 * TILE;
    r.px(x0 - 4, by, 7 * TILE - x0 + 4, 6, '#3a2418');
    r.px(9 * TILE, by, x1 - 9 * TILE + 4, 6, '#3a2418');
    r.px(x0, by, 7 * TILE - x0, 1, '#6a4a32');
    r.px(9 * TILE, by, x1 - 9 * TILE, 1, '#6a4a32');
  }

  function drawMat(r) {
    var x = 7 * TILE + 2, y = 12 * TILE + 1, w = 2 * TILE - 4;
    r.px(x, y, w, 11, '#5a3a22');
    r.px(x + 1, y + 1, w - 2, 9, '#8a5a3a');
    for (var i = 0; i < 3; i++) r.px(x + 3, y + 3 + i * 2, w - 6, 1, '#a87446');
  }

  // --- Gemeinsame Möbel ----------------------------------------------------
  // Fenster in der Wand, tx = linke von zwei Kacheln
  function windowPane(r, tx, curtain, curtainDark) {
    var x = tx * TILE + 2, y = 20;
    r.px(x, y, 28, 16, '#6e4a2c');
    for (var i = 0; i < 12; i++) r.px(x + 2, y + 2 + i, 24, 1, mix('#8ccdf2', '#dcf2fc', i / 11));
    r.px(x + 4, y + 9, 8, 3, '#7cc06a');
    r.px(x + 16, y + 10, 10, 2, '#6ab05a');
    r.px(x + 13, y + 2, 2, 12, '#6e4a2c');
    r.px(x + 2, y + 7, 24, 1, '#6e4a2c');
    r.px(x + 4, y + 3, 3, 1, '#ffffff');
    r.px(x - 1, y + 16, 30, 2, '#8a6040');
    r.px(x - 4, y - 1, 5, 18, curtain);
    r.px(x + 27, y - 1, 5, 18, curtain);
    r.px(x - 2, y - 1, 1, 18, curtainDark);
    r.px(x + 29, y - 1, 1, 18, curtainDark);
    r.px(x - 5, y - 2, 38, 1, '#5a3a2a');
  }

  // Lichtfleck vom Fenster auf dem Boden
  function windowLight(r, tx) {
    var ctx = r.getCtx(), x = tx * TILE + 2;
    ctx.fillStyle = 'rgba(255,244,210,0.16)';
    for (var i = 0; i < 26; i++) {
      var spread = Math.floor(i / 3);
      ctx.fillRect(x - spread, 3 * TILE + i, 28 + spread * 2, 1);
    }
  }

  function picture(r, x, y) {
    r.px(x, y, 13, 10, '#8a6040');
    r.px(x + 1, y + 1, 11, 4, '#a8d8f0');
    r.px(x + 1, y + 5, 11, 4, '#5aa84e');
    r.px(x + 3, y + 4, 5, 2, '#4a9a40');
    r.px(x + 9, y + 2, 2, 2, '#f6d64a');
  }

  function clock(r, cx, cy) {
    r.ellipse(cx, cy, 5, 5, '#5a3a2a');
    r.ellipse(cx, cy, 4, 4, '#f8f4ea');
    r.px(cx, cy - 3, 1, 3, '#2a2030');
    r.px(cx, cy, 2, 1, '#2a2030');
  }

  function plant(r, tx, ty) {
    var x = tx * TILE, y = ty * TILE;
    r.px(x + 4, y + 15, 10, 1, 'rgba(50,25,10,0.3)');
    r.px(x + 3, y + 8, 10, 8, '#2a1a10');
    r.px(x + 4, y + 9, 8, 6, '#c06a3a');
    r.px(x + 3, y + 8, 10, 2, '#d88a52');
    r.ellipse(x + 8, y + 5, 6, 4, '#1e5a2a');
    r.ellipse(x + 5, y + 3, 3, 3, '#2f7d36');
    r.ellipse(x + 11, y + 4, 3, 3, '#2f7d36');
    r.ellipse(x + 8, y + 1, 3, 3, '#3f9a44');
    r.px(x + 7, y - 1, 2, 1, '#7cc85e');
  }

  // Regal mit Büchern (x in Pixeln, 2 Kacheln breit)
  function shelf(r, x, y, h) {
    var w = 30;
    r.px(x + 2, y + h, w, 3, 'rgba(50,25,10,0.3)');
    r.px(x, y, w, h, '#3a2418');
    r.px(x + 1, y + 1, w - 2, h - 2, '#8a5a32');
    var colors = ['#c84a4a', '#4a7ac8', '#e0b040', '#5aa84e', '#9a5ac0', '#e8e0d0', '#d8703a'];
    var shelves = Math.floor((h - 16) / 12);
    for (var s = 0; s < shelves; s++) {
      var sy = y + 2 + s * 12;
      r.px(x + 2, sy, w - 4, 10, '#5a3a20');
      books(r, x + 3, sy + 10, x + w - 5, s, colors);
      r.px(x + 1, sy + 10, w - 2, 2, '#a8723e');
    }
    var dy = y + 2 + shelves * 12 + 1;
    r.px(x + 2, dy, 12, y + h - dy - 2, '#a06a3c');
    r.px(x + 16, dy, 12, y + h - dy - 2, '#a06a3c');
    r.px(x + 12, dy + 5, 1, 2, '#f0d080');
    r.px(x + 17, dy + 5, 1, 2, '#f0d080');
  }

  // Bücherreihe von x bis x1 mit Unterkante bottom
  function books(r, x, bottom, x1, seed, colors) {
    var bx = x, n = 0;
    while (bx < x1) {
      var bw = 2 + Math.floor(hash(seed * 7 + n, 3) * 2);
      var bh = 6 + Math.floor(hash(seed, n * 5) * 3);
      r.px(bx, bottom - bh, bw, bh, colors[(seed * 3 + n) % colors.length]);
      r.px(bx, bottom - bh, bw, 1, 'rgba(255,255,255,0.35)');
      bx += bw + 1;
      n++;
    }
  }

  function rug(r, x, y, w, h, c1, c2) {
    r.px(x, y, w, h, c2);
    r.px(x + 2, y + 2, w - 4, h - 4, c1);
    r.px(x + 5, y + 5, w - 10, h - 10, c2);
    r.px(x + 6, y + 6, w - 12, h - 12, c1);
    for (var i = x + 4; i < x + w - 4; i += 6) {
      r.px(i, y - 1, 1, 1, c2);
      r.px(i, y + h, 1, 1, c2);
    }
  }

  function chairTop(r, x, y) {        // Stuhl hinter dem Tisch, Lehne oben
    r.px(x + 3, y + 1, 10, 9, '#3a2418');
    r.px(x + 4, y + 2, 8, 7, '#8a5a32');
    r.px(x + 5, y + 3, 1, 5, '#6a4224');
    r.px(x + 10, y + 3, 1, 5, '#6a4224');
    r.px(x + 2, y + 9, 12, 6, '#3a2418');
    r.px(x + 3, y + 10, 10, 4, '#b07a46');
    r.px(x + 3, y + 10, 10, 1, '#d09a62');
  }

  function chairBottom(r, x, y) {     // Stuhl vor dem Tisch, Lehne vorne
    r.px(x + 4, y + 14, 10, 2, 'rgba(50,25,10,0.3)');
    r.px(x + 2, y, 12, 6, '#3a2418');
    r.px(x + 3, y + 1, 10, 4, '#b07a46');
    r.px(x + 3, y + 1, 10, 1, '#d09a62');
    r.px(x + 3, y + 5, 10, 9, '#3a2418');
    r.px(x + 4, y + 6, 8, 7, '#8a5a32');
    r.px(x + 4, y + 6, 8, 1, '#a8723e');
    r.px(x + 7, y + 7, 2, 5, '#6a4224');
  }

  // --- Elternhaus: Küche und Essplatz ---------------------------------------
  function elternKitchen(r) {
    // Hängeschränke
    var cx = 3 * TILE, cw = 4 * TILE, i;
    r.px(cx, 18, cw, 13, '#3a2418');
    r.px(cx + 1, 19, cw - 2, 11, '#b47a48');
    r.px(cx + 1, 19, cw - 2, 1, '#cc955e');
    for (i = 0; i < 4; i++) {
      r.px(cx + i * 16 + 2, 21, 12, 7, '#a06a3c');
      r.px(cx + i * 16 + (i % 2 ? 3 : 12), 25, 1, 2, '#f0d080');
      if (i > 0) r.px(cx + i * 16, 19, 1, 11, '#7a4e2a');
    }
    r.px(cx, 31, cw, 2, 'rgba(60,30,10,0.25)');
    r.px(2 * TILE, 4 * TILE, 5 * TILE + 2, 3, 'rgba(50,25,10,0.3)');

    // Kühlschrank
    r.px(33, 20, 14, 44, '#3a3a44');
    r.px(34, 21, 12, 42, '#eef2f4');
    r.px(43, 21, 3, 42, '#c8d0d6');
    r.px(34, 21, 12, 1, '#ffffff');
    r.px(34, 36, 12, 1, '#8a949c');
    r.px(42, 25, 1, 7, '#8a949c');
    r.px(42, 40, 1, 9, '#8a949c');
    r.px(36, 27, 3, 3, '#f0c040');
    r.px(37, 42, 4, 4, '#ffffff');
    r.px(37, 43, 4, 1, '#d0d6dc');

    // Unterschränke mit Arbeitsplatte
    var x0 = 3 * TILE, x1 = 7 * TILE;
    r.px(x0, 39, x1 - x0 + 1, 25, '#3a2418');
    r.px(x0, 40, x1 - x0, 7, '#e6e0d4');
    r.px(x0, 40, x1 - x0, 1, '#ffffff');
    r.px(x0, 46, x1 - x0, 2, '#b4ac9e');
    r.px(x0, 48, x1 - x0, 14, '#c08a56');
    r.px(x0, 62, x1 - x0, 2, '#5a3a22');
    for (i = 0; i < 4; i++) {
      var dx = x0 + i * 16;
      if (i === 1) continue;
      r.px(dx + 2, 50, 12, 10, '#b07a48');
      r.px(dx + 2, 50, 12, 1, '#d4a06a');
      r.px(dx + (i % 2 ? 4 : 11), 54, 1, 2, '#f0d080');
      r.px(dx, 48, 1, 14, '#8a5a32');
    }

    // Herd mit Backofen und Topf
    var sx = 4 * TILE;
    r.px(sx, 40, 16, 7, '#3a3a42');
    r.ellipse(sx + 4, 43, 3, 2, '#55555f');
    r.ellipse(sx + 12, 43, 3, 2, '#55555f');
    r.px(sx, 48, 16, 14, '#d8dcdf');
    r.px(sx + 2, 51, 12, 7, '#3a3a42');
    r.px(sx + 3, 52, 4, 1, '#6a6a74');
    r.px(sx + 2, 49, 12, 1, '#8a949c');
    r.px(sx + 15, 48, 1, 14, '#a8b0b6');
    r.px(sx + 2, 34, 12, 9, '#2a2030');
    r.px(sx + 3, 35, 10, 7, '#c8503c');
    r.px(sx + 3, 35, 10, 1, '#e8806a');
    r.px(sx + 4, 36, 2, 5, '#e06a54');
    r.px(sx + 1, 36, 2, 2, '#2a2030');
    r.px(sx + 13, 36, 2, 2, '#2a2030');
    r.px(sx + 3, 34, 10, 1, '#9aa4ae');

    // Spüle
    var kx = 5 * TILE;
    r.px(kx + 2, 41, 12, 5, '#7a8692');
    r.px(kx + 3, 42, 10, 3, '#c4d0d8');
    r.px(kx + 3, 42, 10, 1, '#e8f0f4');
    r.px(kx + 7, 36, 2, 6, '#9aa4ae');
    r.px(kx + 7, 36, 5, 1, '#c8d0d6');

    // Schneidebrett mit Gemüse
    var bx = 6 * TILE;
    r.px(bx + 3, 41, 10, 4, '#d8a868');
    r.px(bx + 3, 44, 10, 1, '#b08048');
    r.px(bx + 5, 42, 3, 1, '#f08a30');
    r.px(bx + 9, 42, 2, 2, '#5ab04a');
  }

  function elternTable(r) {
    var x = 8 * TILE + 1, y = 6 * TILE, w = 3 * TILE - 2;
    r.ellipse(x + w / 2 + 2, y + 29, 24, 4, 'rgba(50,20,10,0.3)');
    r.px(x + 2, y + 20, 3, 10, '#4a2c18');
    r.px(x + w - 5, y + 20, 3, 10, '#4a2c18');
    r.px(x, y, w, 23, '#3a2418');
    r.px(x + 1, y + 1, w - 2, 18, '#b07a46');
    r.px(x + 1, y + 1, w - 2, 1, '#d09a62');
    r.px(x + 1, y + 19, w - 2, 3, '#7a4e2a');
    r.px(x + 16, y + 1, 14, 18, '#f2ede0');
    r.px(x + 16, y + 1, 1, 18, '#d8d0bc');
    r.px(x + 29, y + 1, 1, 18, '#d8d0bc');
    r.ellipse(x + 8, y + 9, 5, 3, '#c8c4bc');
    r.ellipse(x + 8, y + 9, 4, 2, '#ffffff');
    r.ellipse(x + w - 8, y + 9, 5, 3, '#c8c4bc');
    r.ellipse(x + w - 8, y + 9, 4, 2, '#ffffff');
    r.ellipse(x + 23, y + 11, 5, 3, '#8a5a32');
    r.px(x + 20, y + 8, 3, 3, '#e8443a');
    r.px(x + 23, y + 7, 3, 3, '#f0c040');
    r.px(x + 25, y + 9, 2, 2, '#5ab04a');
    r.px(x + 21, y + 8, 1, 1, '#ff9a8a');
  }

  register('eltern', {
    map: [
      '################',
      '##WWWWWWWWWWWW##',
      '##WWWWWWWWWWWW##',
      '##xxxxx.....xx##',   // Kühlschrank, Küchenzeile, Regal
      '##..x.........##',   // Mutter vor dem Herd
      '##.......x....##',   // Stuhl oben
      '##......xxx...##',   // Esstisch
      '##......xxx...##',
      '##......x.x...##',   // Stühle unten
      '##............##',
      '##............##',
      '##x..........x##',   // Pflanzen
      '#######MM#######',   // Ausgang
      '################'
    ],
    floor: { type: 'planks', a: '#c99a60', b: '#c08f58', hi: '#d8ac72', seam: '#8e6038', grain: '#b2834c' },
    wall: { paper: '#efe2c4', pattern: 'stripes', accent: '#e5d4ae', wain: '#a87446', wainHi: '#c8955e', wainLine: '#7e5230' },
    bake: function (r) {
      windowPane(r, 9, '#d85a5a', '#a83c44');
      windowLight(r, 9);
      picture(r, 12 * TILE + 2, 21);
      clock(r, 120, 26);
      rug(r, 7 * TILE + 2, 5 * TILE + 4, 5 * TILE - 4, 4 * TILE - 8, '#b03c3c', '#e0b860');
      elternKitchen(r);
      shelf(r, 12 * TILE + 1, 22, 42);
      chairTop(r, 9 * TILE, 5 * TILE);
      elternTable(r);
      chairBottom(r, 8 * TILE, 8 * TILE);
      chairBottom(r, 10 * TILE, 8 * TILE);
      plant(r, 2, 11);
      plant(r, 13, 11);
    },
    npc: {
      x: 4 * TILE, y: 4 * TILE, sprites: function () { return People.mother(); },
      talk: {
        name: 'Mama',
        texts: [
          'Ach, du bist wach! Seit die Schule zerstört wurde, ist es im Dorf so still …',
          'Man sagt, die Lehrerinnen und Lehrer werden im Schloss gefangen gehalten.',
          'Nur wer alle Dungeons löst, kann das Schloss befreien. Pass auf dich auf!'
        ],
        // Zusatzseite nach dem ersten Wappen (freigegeben)
        // Weitere Stufen je Wappen und nach dem Finale (Texte vorläufig, Nutzer passt sie an)
        later: [
          { wappen: 1, texts: ['Graf Gerade? Von dem habe ich noch nie gehört … Aber du hast den ersten Wächter befreit! Ich bin so stolz auf dich.'] },
          { wappen: 2, texts: ['Ich habe gesehen, dass der Leuchtturm wieder leuchtet! Dieser Graf Gerade ist also wirklich da draußen … Pass gut auf dich auf.'] },
          { wappen: 3, texts: ['Im Dorf erzählt man, das Kraftwerk im Osten läuft wieder. Warst du das etwa auch?'] },
          { wappen: 4, texts: ['Das Schultor steht offen? Und das Schloss war die ganze Zeit unsere Schule … Sei vorsichtig da drin!'] },
          { finale: true, replace: true, texts: [
            'Du hast es geschafft! Die Lehrerinnen und Lehrer sind frei – das ganze Dorf spricht von nichts anderem.',
            'Graf Gerade ist fort, und bald wird die Schule wieder aufgebaut. Ich bin so stolz auf dich!'
          ] }
        ]
      },
      // Mutter wiegt sich beim Rühren leicht hin und her
      frame: function (t) { var f = Math.floor(t / 350) % 2; return { i: f, dx: f, dy: 0 }; }
    },
    // Dampf aus dem Topf
    overlay: function (r, t) {
      var ctx = r.getCtx();
      for (var i = 0; i < 3; i++) {
        var p = (t / 1000 * 0.5 + i / 3) % 1;
        ctx.globalAlpha = 0.6 * (1 - p);
        var rad = 1 + Math.round(p * 3);
        r.ellipse(72 + Math.round(Math.sin(p * 6 + i * 2) * 2), 32 - Math.round(p * 18), rad, rad, '#ffffff');
      }
      ctx.globalAlpha = 1;
    }
  });

  // --- Vorberechnung und Zeichnen ------------------------------------------
  function bake(name) {
    var def = rooms[name];
    var st = { layer: Render.createLayer(W, H), overlay: null, sprites: null };
    Render.setTarget(st.layer.ctx);
    Render.px(0, 0, W, H, '#0e0b12');
    if (def.bakeFull) {
      // Eigene Raumgrafik (z. B. Hoehle im Dungeon), Boden/Wand/Matte fertig
      def.bakeFull(Render);
    } else {
      drawFloor(Render, def.floor);
      drawWalls(Render, def.wall);
      def.bake(Render);
      drawMat(Render);
    }
    if (def.bakeOverlay) {
      st.overlay = Render.createLayer(W, H);
      Render.setTarget(st.overlay.ctx);
      def.bakeOverlay(Render);
    }
    Render.setTarget(null);
    if (def.npc) {
      // Figuren aus People liefern entweder [Bild, Blinzeln] oder Blickrichtungen
      // ({ down, up, left, right }); im Raum wird die Vorderansicht genutzt.
      var sp = def.npc.sprites();
      st.sprites = sp.down || sp;
    }
    st.guestSprites = (def.guests || []).map(function (g) { return g.sprites(); });
    def.state = st;
    return st;
  }

  function stateOf(name) {
    return rooms[name].state || bake(name);
  }

  // Grundebene: Raum, Animationen, Bewohner (unter der Spielfigur)
  function drawGround(r, t, name) {
    var def = rooms[name], st = stateOf(name);
    r.image(st.layer.canvas, 0, 0);
    if (def.anim) def.anim(r, t);
    var npc = def.npc;
    if (npc) {
      var f = npc.frame(t);
      var ctx = r.getCtx();
      ctx.globalAlpha = 0.3;
      r.ellipse(npc.x + 8, npc.y + 15, 6, 2, '#2a140a');
      ctx.globalAlpha = 1;
      r.image(st.sprites[f.i], npc.x + (f.dx || 0), npc.y + (f.dy || 0));
    }
    (def.guests || []).forEach(function (g, i) {
      var set = st.guestSprites[i];
      var dir = g.facing || 'down';
      var arr = set[dir] || set.down;
      var blinkI = dir === 'down' && (t + i * 1300) % 3800 < 180 ? 1 : 0;
      var ctx = r.getCtx();
      ctx.globalAlpha = 0.3;
      r.ellipse(g.x + 8, g.y + 15, 6, 2, '#2a140a');
      ctx.globalAlpha = 1;
      r.image(arr[blinkI] || arr[0], g.x, g.y);
    });
  }

  // Überlagerung (über der Spielfigur), z. B. Ladentheke, Dampf
  function drawOverlay(r, t, name) {
    var def = rooms[name], st = stateOf(name);
    if (st.overlay) r.image(st.overlay.canvas, 0, 0);
    if (def.overlay) def.overlay(r, t);
  }

  return {
    register: register,
    isBlocked: isBlocked,
    isExit: isExit,
    talkTarget: talkTarget,
    matWarp: matWarp,
    drawGround: drawGround,
    drawOverlay: drawOverlay,
    SPAWN: SPAWN,
    // Hilfsfunktionen für js/rooms.js
    lib: {
      windowPane: windowPane, windowLight: windowLight, picture: picture, clock: clock,
      plant: plant, shelf: shelf, books: books, rug: rug, chairTop: chairTop, chairBottom: chairBottom
    }
  };
})();
