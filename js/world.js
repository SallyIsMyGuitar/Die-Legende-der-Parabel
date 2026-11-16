// world.js: Dorf-Bildschirme, Kollision, Übergänge und Zeichnen der Außenwelt
// Jeder Bildschirm ist 16 x 14 Kacheln groß. Kachelzeichen:
//   'T' Baum   '.' Wiese   'P' Weg   '~' Wasser   'F' Zaun   'G' Tor (gesperrt)
//   'S' Schulgelände   'W' Brunnen
// Gebäude stehen in der Liste buildings und werden beim Start eingestempelt
// ('H' Gebäude, 'D' Tür). Innenräume liegen in js/interior.js und js/rooms.js.
var World = (function () {
  'use strict';

  var TILE = 16;
  var COLS = 16;
  var ROWS = 14;
  var W = COLS * TILE;
  var H = ROWS * TILE;
  var BLOCKING = 'THDFGSW~';

  var SCREENS = {
    start: {
      map: [
        'TTTTTTTTTTTTTTTT',
        'T.....T........T',
        'T..TT.T........T',
        'T..T...........T',
        'T..T.PPPPPPPPPPP',
        'T....P..........',
        'T....P..FSSSSSST',
        'T.~~.P..FSSSSSST',
        'T.~~.P..FSSSSSST',
        'T....P..FSSSSSST',
        'T....P..FSSSSSST',
        'T....P..FFFGGFFT',
        'T....PPPPPPPP..T',
        'TTTTTTTTTTTTTTTT'
      ],
      buildings: [
        { x: 8, y: 2, w: 4, h: 2, door: 9, room: 'eltern', style: 'red', windows: [3], barrel: 0, lantern: true }
      ],
      school: { x: 9, y: 6, w: 6, h: 5 },
      signs: [
        {
          tiles: [[11, 11], [12, 11]], x: 12 * 16, y: 11 * 16,
          name: 'Schild',
          texts: ['GESPERRT. Die Schule bleibt geschlossen, bis die Lehrkräfte zurück sind.']
        }
      ],
      exits: { east: 'ost' }
    },
    ost: {
      map: [
        'TTTTTTTTTTTTTTTT',
        'T.......T......T',
        'T.......T......T',
        'T..............T',
        'PPPPPPPPPPPPPP.T',
        '........PP.....T',
        'T.....PPPP.....T',
        'T.....PWPP..TT.T',
        'T.....PPPP..TT.T',
        'T........P..T..T',
        'T........P.....T',
        'T........P.....T',
        'T...PPPPPP.....T',
        'TTTTTTTTTTTTTTTT'
      ],
      buildings: [
        { x: 2, y: 2, w: 4, h: 2, door: 3, room: 'nachbarin', style: 'blue', windows: [0, 3], lantern: true },
        { x: 10, y: 2, w: 4, h: 2, door: 12, room: 'freund', style: 'green', windows: [0, 1], lantern: true },
        { x: 2, y: 10, w: 5, h: 2, door: 4, room: 'laden', style: 'shop', windows: [0, 1, 3, 4], shop: true }
      ],
      exits: { west: 'start' }
    }
  };

  // Spielstart: im Elternhaus, direkt vor der Mutter
  var START = { screen: 'eltern', x: 4 * TILE, y: 5 * TILE, facing: 'up' };

  var rgb = Render.rgb, lerp = Render.lerp;
  var hash = Render.hash, noise = Render.noise;

  var states = {};          // vorberechnete Daten je Bildschirm
  var current = START.screen;
  var S = null;             // gerade bearbeiteter Bildschirm

  // --- Aufbau der Kachelraster -----------------------------------------
  function buildTiles(def) {
    var t = def.map.map(function (row) {
      if (row.length !== COLS) console.warn('Kartenzeile mit falscher Länge: ' + row);
      return row.split('');
    });
    def.buildings.forEach(function (b) {
      for (var y = b.y; y < b.y + b.h; y++) {
        for (var x = b.x; x < b.x + b.w; x++) t[y][x] = 'H';
      }
      t[b.y + b.h - 1][b.door] = 'D';
    });
    return t;
  }

  Object.keys(SCREENS).forEach(function (name) {
    var def = SCREENS[name];
    states[name] = { name: name, def: def, tiles: buildTiles(def), doors: {} };
  });

  // Zielraum -> Bildschirm und Gebäude (für den Weg nach draußen)
  var roomHome = {};
  Object.keys(SCREENS).forEach(function (name) {
    SCREENS[name].buildings.forEach(function (b) {
      if (b.room) roomHome[b.room] = { screen: name, building: b };
    });
  });

  // Kachel im Bildschirm st; außerhalb wird beim Nachbarbildschirm nachgesehen
  function tileOf(st, tx, ty) {
    if (ty < 0 || ty >= ROWS) return '#';
    if (tx < 0 || tx >= COLS) {
      var dir = tx < 0 ? 'west' : 'east';
      var next = st.def.exits && st.def.exits[dir];
      if (!next) return '#';
      return states[next].tiles[ty][tx < 0 ? tx + COLS : tx - COLS];
    }
    return st.tiles[ty][tx];
  }

  function tileAt(tx, ty) {
    return tileOf(S, tx, ty);
  }

  function isOutdoor() {
    return !!states[current];
  }

  function isBlocked(tx, ty) {
    if (!isOutdoor()) return Interior.isBlocked(current, tx, ty);
    var t = tileOf(states[current], tx, ty);
    return t === '#' || BLOCKING.indexOf(t) >= 0;
  }

  // --- Übergänge -----------------------------------------------------------
  // Tür berühren (nach oben gegen die Tür laufen) oder Fußmatte im Haus.
  function checkWarp(px, py, facing) {
    var cx = Math.floor((px + 8) / TILE);
    if (isOutdoor()) {
      if (facing !== 'up') return null;
      var ty = Math.floor((py - 1) / TILE);
      var st = states[current];
      if (tileOf(st, cx, ty) !== 'D') return null;
      var b = st.def.buildings.filter(function (bb) { return bb.door === cx && bb.y + bb.h - 1 === ty; })[0];
      if (!b || !b.room) return null;
      return { type: 'enter', room: b.room, building: b };
    }
    if (Interior.isExit(current, cx, Math.floor((py + 8) / TILE))) {
      var home = roomHome[current];
      return { type: 'exit', screen: home.screen, building: home.building };
    }
    return null;
  }

  // Bildschirmrand überschritten? Liefert Richtung und Ziel.
  function checkEdge(px) {
    if (!isOutdoor()) return null;
    var ex = states[current].def.exits || {};
    if (px + 8 >= W && ex.east) return { dir: 'east', to: ex.east };
    if (px + 8 < 0 && ex.west) return { dir: 'west', to: ex.west };
    return null;
  }

  // Gegenüber der Spielfigur: Bewohner oder Schild, mit dem man reden kann
  function talkTarget(px, py, facing) {
    var cx = px + 8, cy = py + 8, fx = cx, fy = cy;
    if (facing === 'up') fy = py - 1;
    else if (facing === 'down') fy = py + 16;
    else if (facing === 'left') fx = px - 1;
    else fx = px + 16;
    var tx = Math.floor(fx / TILE), ty = Math.floor(fy / TILE);
    if (!isOutdoor()) return Interior.talkTarget(current, tx, ty);
    var signs = states[current].def.signs || [];
    for (var i = 0; i < signs.length; i++) {
      for (var j = 0; j < signs[i].tiles.length; j++) {
        var t = signs[i].tiles[j];
        if (t[0] === tx && t[1] === ty) {
          return { name: signs[i].name, texts: signs[i].texts, hintX: signs[i].x, hintY: signs[i].y };
        }
      }
    }
    return null;
  }

  function setScreen(name) { current = name; }
  function getScreen() { return current; }

  function setDoorOpen(b, p) {
    states[roomHome[b.room].screen].doors[b.room] = p;
  }

  function doorRect(b) { return Buildings.doorRect(b); }

  // --- Masken für Weg und Wasser (Autotiling) ----------------------------
  function shapeMask(id, top, side, round, roundTop) {
    var m = new Uint8Array(W * H);
    for (var ty = 0; ty < ROWS; ty++) {
      for (var tx = 0; tx < COLS; tx++) {
        if (tileAt(tx, ty) !== id) continue;
        var n = tileAt(tx, ty - 1) !== id, s = tileAt(tx, ty + 1) !== id;
        var w = tileAt(tx - 1, ty) !== id, e = tileAt(tx + 1, ty) !== id;
        var t0 = n ? top : 0, b0 = s ? side : 0;
        var l0 = w ? side : 0, r0 = e ? side : 0;
        for (var i = t0; i < TILE - b0; i++) {
          var cut = 0;
          if (n && roundTop && i - t0 < round) cut = round - (i - t0);
          var fromBottom = TILE - b0 - 1 - i;
          if (s && fromBottom < round) cut = Math.max(cut, round - fromBottom);
          var l = l0 + (w ? cut : 0), r = TILE - r0 - (e ? cut : 0);
          for (var j = l; j < r; j++) m[(ty * TILE + i) * W + tx * TILE + j] = 1;
        }
      }
    }
    return m;
  }

  function buildBank() {
    var m = new Uint8Array(W * H);
    var cuts = [0, 2, 1, 0];
    for (var ty = 0; ty < ROWS; ty++) {
      for (var tx = 0; tx < COLS; tx++) {
        if (tileAt(tx, ty) !== '~' || tileAt(tx, ty - 1) === '~') continue;
        var w = tileAt(tx - 1, ty) !== '~', e = tileAt(tx + 1, ty) !== '~';
        for (var i = 1; i < 4; i++) {
          var l = (w ? 1 + cuts[i] : 0), r = TILE - (e ? 1 + cuts[i] : 0);
          for (var j = l; j < r; j++) m[(ty * TILE + i) * W + tx * TILE + j] = i;
        }
      }
    }
    return m;
  }

  function buildDepth(waterMask) {
    var d = new Uint8Array(W * H);
    var queue = [];
    for (var k = 0; k < W * H; k++) {
      if (!waterMask[k]) continue;
      if (!waterMask[k - 1] || !waterMask[k + 1] || !waterMask[k - W] || !waterMask[k + W]) {
        d[k] = 1;
        queue.push(k);
      }
    }
    for (var q = 0; q < queue.length; q++) {
      var c = queue[q], nb = [c - 1, c + 1, c - W, c + W];
      for (var i = 0; i < 4; i++) {
        if (waterMask[nb[i]] && !d[nb[i]]) {
          d[nb[i]] = d[c] + 1;
          queue.push(nb[i]);
        }
      }
    }
    return d;
  }

  function adjacent(mask, k) {
    return mask[k - 1] || mask[k + 1] || mask[k - W] || mask[k + W];
  }

  // --- Bodenfarben ---------------------------------------------------------
  var C = {
    grassA: rgb('#4a9a3e'), grassB: rgb('#7cc85e'),
    grassDark: rgb('#2c6a2a'), grassLight: rgb('#b0e888'), dry: rgb('#9a9a4a'),
    sandA: rgb('#d6b97c'), sandB: rgb('#f0dcaa'), sandShade: rgb('#b08c56'),
    bankLip: rgb('#356e2e'), bankA: rgb('#7c5636'), bankB: rgb('#55391f'),
    foam: rgb('#dcf2fb'), shallow: rgb('#78bdea'), mid: rgb('#3d88d6'),
    deep: rgb('#2154aa'), bankShadow: rgb('#1c3f78')
  };

  function grassColor(x, y) {
    var n = 0.65 * noise(x, y, 26, 1) + 0.35 * noise(x, y, 8, 2);
    var c = lerp(C.grassA, C.grassB, 0.2 + n * 0.6);
    var h = hash(x, y);
    if (h > 0.94) c = lerp(c, C.grassDark, 0.25);
    else if (h < 0.035) c = lerp(c, C.grassLight, 0.25);
    return c;
  }

  function sandColor(x, y, k) {
    var m = S.pathMask;
    var c = lerp(C.sandA, C.sandB, 0.35 + noise(x, y, 6, 7) * 0.55);
    if (!m[k - W]) c = lerp(c, C.sandShade, 0.65);
    else if (!m[k - 2 * W]) c = lerp(c, C.sandShade, 0.3);
    if (!m[k - 1] && x > 0) c = lerp(c, C.sandShade, 0.3);
    var h = hash(x * 3, y * 5);
    if (h > 0.985) c = lerp(c, C.sandShade, 0.8);
    else if (h < 0.02) c = lerp(c, [255, 250, 225], 0.5);
    return c;
  }

  function waterColor(x, y, k) {
    for (var s = 1; s <= 3; s++) {
      if (S.bankMask[k - s * W]) return lerp(C.mid, C.bankShadow, 0.75 - 0.18 * (s - 1));
    }
    var d = S.waterDepth[k];
    if (d <= 1) return C.foam;
    if (d === 2) return lerp(C.foam, C.shallow, 0.65);
    if (d <= 5) return lerp(C.shallow, C.mid, (d - 2) / 3);
    return lerp(C.mid, C.deep, Math.min(1, (d - 5) / 12));
  }

  function bankColor(x, y, row) {
    if (row === 1) return C.bankLip;
    var c = lerp(C.bankA, C.bankB, (row - 2) * 0.9);
    if (hash(x * 7, y * 3) > 0.8) c = lerp(c, C.bankB, 0.5);
    return c;
  }

  // --- Bäume, Büschel, Steine ------------------------------------------------
  var CANOPY = [
    { dark: '#143a20', shade: '#22602c', mid: '#338838', light: '#50a646', hi: '#88d066' },
    { dark: '#103628', shade: '#1c5a3e', mid: '#2b7d4c', light: '#459e5f', hi: '#80cc86' },
    { dark: '#183c1c', shade: '#2e6628', mid: '#448a34', light: '#64a846', hi: '#9ad46a' }
  ];

  function canopyInfo(tx, ty) {
    var seed = S.name === 'start' ? 0 : 50;
    return {
      cx: tx * TILE + 8 + Math.round((hash(tx + seed, ty + 99) - 0.5) * 2),
      cy: ty * TILE + 6,
      big: hash(tx + 1 + seed, ty + 5) > 0.5 ? 1 : 0,
      pal: CANOPY[Math.floor(hash(tx + 7 + seed, ty + 3) * 3)]
    };
  }

  function drawCanopy(r, tx, ty) {
    var c = canopyInfo(tx, ty), P = c.pal;
    var bumps = [[0, 1, 10 + c.big, 8 + c.big], [-5, -3, 6, 5], [5, -3, 6, 5], [0, -6, 6, 5]];
    var i, b;
    for (i = 0; i < bumps.length; i++) { b = bumps[i]; r.ellipse(c.cx + b[0], c.cy + b[1], b[2] + 1, b[3] + 1, P.dark); }
    for (i = 0; i < bumps.length; i++) { b = bumps[i]; r.ellipse(c.cx + b[0], c.cy + b[1], b[2], b[3], P.shade); }
    for (i = 0; i < bumps.length; i++) { b = bumps[i]; r.ellipse(c.cx + b[0] - 1, c.cy + b[1] - 1, b[2] - 1, b[3] - 1, P.mid); }
    for (i = 1; i < bumps.length; i++) { b = bumps[i]; r.ellipse(c.cx + b[0] - 1, c.cy + b[1] - 2, b[2] - 3, b[3] - 3, P.light); }
    r.ellipse(c.cx - 3, c.cy - 4, 4, 3, P.light);
    r.ellipse(c.cx - 3, c.cy - 8, 2, 1, P.hi);
    r.ellipse(c.cx + 3, c.cy - 5, 2, 1, P.hi);
    for (i = 0; i < 7; i++) {
      var lx = c.cx - 7 + Math.floor(hash(tx * 11 + i, ty) * 14);
      var ly = c.cy - 6 + Math.floor(hash(tx, ty * 13 + i) * 12);
      r.px(lx, ly, 2, 1, P.shade);
      r.px(lx + 1, ly + 1, 1, 1, P.shade);
    }
    r.px(c.cx - 1, c.cy - 2, 1, 1, P.hi);
  }

  function drawTrunk(r, tx, ty) {
    var x = tx * TILE, y = ty * TILE;
    r.px(x + 5, y + 9, 6, 7, '#2a1a10');
    r.px(x + 6, y + 9, 4, 7, '#6b4428');
    r.px(x + 6, y + 9, 1, 7, '#8c5e36');
    r.px(x + 9, y + 9, 1, 7, '#4a2c18');
    r.px(x + 3, y + 14, 3, 2, '#2a1a10');
    r.px(x + 4, y + 14, 2, 1, '#5a3820');
    r.px(x + 10, y + 14, 3, 2, '#2a1a10');
    r.px(x + 10, y + 14, 2, 1, '#5a3820');
  }

  function drawTuft(r, x, y) {
    r.px(x, y + 1, 1, 3, '#357a30');
    r.px(x + 2, y, 1, 4, '#357a30');
    r.px(x + 4, y + 2, 1, 2, '#357a30');
    r.px(x + 1, y + 2, 1, 2, '#3f8a38');
    r.px(x + 3, y + 1, 1, 3, '#3f8a38');
    r.px(x + 2, y, 1, 1, '#a4e07c');
    r.px(x, y + 1, 1, 1, '#94d470');
  }

  function drawStone(r, x, y) {
    r.px(x, y + 2, 5, 1, 'rgba(20,50,20,0.45)');
    r.px(x, y, 4, 2, '#8f9692');
    r.px(x + 1, y, 2, 1, '#c6ccc6');
    r.px(x + 3, y + 1, 1, 1, '#646c68');
  }

  function areaClear(x, y, w, h) {
    for (var yy = y - 1; yy <= y + h; yy++) {
      for (var xx = x - 1; xx <= x + w; xx++) {
        var k = yy * W + xx;
        if (S.pathMask[k] || S.waterMask[k] || S.bankMask[k]) return false;
        if (tileAt(xx >> 4, yy >> 4) !== '.') return false;
      }
    }
    return true;
  }

  function drawShadows(r) {
    var col = '#0c2a12';
    for (var ty = 0; ty < ROWS; ty++) {
      for (var tx = 0; tx < COLS; tx++) {
        var t = tileAt(tx, ty);
        if (t === 'T') {
          var c = canopyInfo(tx, ty);
          r.ellipse(c.cx + 2, c.cy + 6, 11 + c.big, 7, col);
        } else if (t === 'W') {
          r.ellipse(tx * TILE + 10, ty * TILE + 12, 9, 5, col);
        }
      }
    }
    S.def.buildings.forEach(function (b) {
      var x = b.x * TILE, y = b.y * TILE, w = b.w * TILE, h = b.h * TILE;
      r.px(x + w - 2, y - 4, 6, h + 4, col);
      r.px(x + 2, y + h, w + 2, 3, col);
    });
    var s = S.def.school;
    if (s) r.px((s.x + s.w) * TILE - 2, s.y * TILE - 2, 4, (s.h - 1) * TILE + 2, col);
  }

  // --- Vorberechnung eines Bildschirms ---------------------------------------
  function bake(st) {
    S = st;
    st.pathMask = shapeMask('P', 2, 2, 2, true);
    st.waterMask = shapeMask('~', 4, 1, 3, false);
    st.bankMask = buildBank();
    st.waterDepth = buildDepth(st.waterMask);

    // 1) Bodenpixel
    st.ground = Render.createLayer(W, H);
    var img = st.ground.ctx.createImageData(W, H);
    var data = img.data;
    st.wavePixels = [];
    st.foamPixels = [];
    for (var y = 0; y < H; y++) {
      for (var x = 0; x < W; x++) {
        var k = y * W + x;
        var id = st.tiles[y >> 4][x >> 4];
        var c;
        if (st.pathMask[k]) {
          c = sandColor(x, y, k);
        } else if (st.waterMask[k]) {
          c = waterColor(x, y, k);
          var shaded = st.bankMask[k - W] || st.bankMask[k - 2 * W] || st.bankMask[k - 3 * W];
          if (st.waterDepth[k] === 1 && !shaded) st.foamPixels.push([x, y]);
          else if (st.waterDepth[k] >= 3) st.wavePixels.push([x, y]);
        } else if (st.bankMask[k]) {
          c = bankColor(x, y, st.bankMask[k]);
        } else {
          c = grassColor(x, y);
          if (id === 'T') c = lerp(c, C.grassDark, 0.25);
          if (id === 'S' || id === 'F' || id === 'G') c = lerp(c, C.dry, 0.35);
          if (adjacent(st.pathMask, k) || adjacent(st.waterMask, k) || adjacent(st.bankMask, k)) {
            c = lerp(c, C.grassDark, 0.55);
          }
        }
        var o = k * 4;
        data[o] = c[0]; data[o + 1] = c[1]; data[o + 2] = c[2]; data[o + 3] = 255;
      }
    }
    st.ground.ctx.putImageData(img, 0, 0);

    // 2) Schatten
    var shadow = Render.createLayer(W, H);
    Render.setTarget(shadow.ctx);
    drawShadows(Render);
    Render.setTarget(st.ground.ctx);
    Render.image(shadow.canvas, 0, 0, 0.3);

    // 3) Büschel, Steine, Stämme, Unkraut am Zaun; Blumen merken
    st.flowers = [];
    var flowerColors = ['#ffffff', '#f6d64a', '#f08cb4', '#9cc8ff'];
    var salt = st.name === 'start' ? 0 : 31;
    for (var ty = 0; ty < ROWS; ty++) {
      for (var tx = 0; tx < COLS; tx++) {
        var t = tileAt(tx, ty);
        if (t === 'T' && tileAt(tx, ty + 1) !== 'T') drawTrunk(Render, tx, ty);
        if (t !== '.') continue;
        var hx = tx + salt;
        var nearFence = 'FG'.indexOf(tileAt(tx, ty - 1)) >= 0 || 'FG'.indexOf(tileAt(tx + 1, ty)) >= 0;
        if (nearFence && hash(hx, ty * 3) > 0.3) Buildings.fenceWeeds(Render, tx, ty, hx * 7 + ty);
        for (var n = 0; n < 2; n++) {
          if (hash(hx * 3 + n, ty * 7) < 0.55) {
            var gx = tx * TILE + 1 + Math.floor(hash(hx + n * 5, ty + 11) * 10);
            var gy = ty * TILE + 1 + Math.floor(hash(hx + 13, ty + n * 3) * 10);
            if (areaClear(gx, gy, 5, 4)) drawTuft(Render, gx, gy);
          }
        }
        if (hash(hx * 17, ty * 5) > 0.93) {
          var sx = tx * TILE + 3 + Math.floor(hash(hx, ty * 2) * 8);
          var sy = ty * TILE + 4 + Math.floor(hash(hx * 2, ty) * 8);
          if (areaClear(sx, sy, 5, 3)) drawStone(Render, sx, sy);
        }
        if (hash(hx * 5, ty * 9) > 0.62) {
          var fx = tx * TILE + 3 + Math.floor(hash(hx * 9, ty) * 10);
          var fy = ty * TILE + 3 + Math.floor(hash(hx, ty * 9) * 9);
          if (areaClear(fx - 1, fy - 1, 4, 5)) {
            st.flowers.push({
              x: fx, y: fy,
              color: flowerColors[Math.floor(hash(hx + 3, ty + 8) * flowerColors.length)],
              phase: hash(hx, ty) * 6.28
            });
          }
        }
      }
    }

    // 4) Überlagerung, zeilenweise von oben nach unten: Kronen, Brunnen,
    //    Schule, Zaun, Gebäude
    st.overlay = Render.createLayer(W, H);
    Render.setTarget(st.overlay.ctx);
    var s = st.def.school;
    for (var cy = 0; cy < ROWS; cy++) {
      var cx, tt;
      for (cx = 0; cx < COLS; cx++) {
        tt = tileAt(cx, cy);
        if (tt === 'T') drawCanopy(Render, cx, cy);
        else if (tt === 'W') Buildings.well(Render, cx, cy);
      }
      if (s && cy === s.y) Buildings.school(Render, s);
      for (cx = 0; cx < COLS; cx++) {
        tt = tileAt(cx, cy);
        if (tt === 'F') {
          var up = tileAt(cx, cy - 1) === 'F', down = tileAt(cx, cy + 1) === 'F';
          var side = 'FG'.indexOf(tileAt(cx - 1, cy)) >= 0 || 'FG'.indexOf(tileAt(cx + 1, cy)) >= 0;
          if (up || down) Buildings.fence(Render, cx, cy, 'v');
          if (side) Buildings.fence(Render, cx, cy, 'h', hash(cx, cy) > 0.75);
        } else if (tt === 'G' && tileAt(cx - 1, cy) !== 'G') {
          Buildings.gate(Render, cx, cy);
        }
      }
      st.def.buildings.forEach(function (b) {
        if (b.y + b.h - 1 !== cy) return;
        if (b.shop) Buildings.shop(Render, b);
        else Buildings.house(Render, b);
      });
    }
    Render.setTarget(null);
  }

  function stateOf(name) {
    var st = states[name];
    if (!st.ground) bake(st);
    S = st;
    return st;
  }

  // --- Zeichnen pro Bild -------------------------------------------------------
  function drawWater(ctx, st, t) {
    var i, p;
    ctx.fillStyle = '#ffffff';
    for (i = 0; i < st.foamPixels.length; i++) {
      p = st.foamPixels[i];
      if (Math.sin(t * 0.003 + p[0] * 0.9 + p[1] * 1.3) > 0.25) ctx.fillRect(p[0], p[1], 1, 1);
    }
    ctx.fillStyle = 'rgba(160,214,250,0.75)';
    for (i = 0; i < st.wavePixels.length; i++) {
      p = st.wavePixels[i];
      var v = Math.sin(p[0] * 0.38 + p[1] * 0.85 - t * 0.0022) + Math.sin(p[0] * 0.12 - p[1] * 0.5 + t * 0.0013);
      if (v > 1.6) ctx.fillRect(p[0], p[1], 1, 1);
    }
    if (!st.wavePixels.length) return;
    ctx.fillStyle = '#ffffff';
    for (i = 0; i < 3; i++) {
      var cycle = t / 1100 + i * 0.37;
      p = st.wavePixels[Math.floor(hash(i, Math.floor(cycle)) * st.wavePixels.length)];
      var phase = cycle - Math.floor(cycle);
      if (!p || phase > 0.5) continue;
      ctx.fillRect(p[0], p[1], 1, 1);
      if (phase > 0.12 && phase < 0.38) {
        ctx.fillRect(p[0] - 1, p[1], 3, 1);
        ctx.fillRect(p[0], p[1] - 1, 1, 3);
      }
    }
  }

  function drawFlowers(r, st, t) {
    for (var i = 0; i < st.flowers.length; i++) {
      var f = st.flowers[i];
      var sway = Math.round(Math.sin(t * 0.0016 + f.phase) * 0.8);
      r.px(f.x + 1, f.y + 2, 1, 2, '#2f7a2c');
      var x = f.x + sway, y = f.y;
      r.px(x + 1, y - 1, 1, 1, f.color);
      r.px(x, y, 3, 1, f.color);
      r.px(x + 1, y + 1, 1, 1, f.color);
      r.px(x + 1, y, 1, 1, f.color === '#f6d64a' ? '#f08040' : '#f6d64a');
    }
  }

  // Boden inkl. Animationen (unter der Spielfigur); name optional
  function drawGround(r, time, name) {
    var t = time || 0;
    name = name || current;
    if (!states[name]) { Interior.drawGround(r, t, name); return; }
    var st = stateOf(name);
    r.image(st.ground.canvas, 0, 0);
    drawWater(r.getCtx(), st, t);
    drawFlowers(r, st, t);
  }

  // Kronen, Gebäude, offene Türen, Rauch (über der Spielfigur)
  function drawOverlay(r, time, name) {
    var t = time || 0;
    name = name || current;
    if (!states[name]) { Interior.drawOverlay(r, t, name); return; }
    var st = stateOf(name);
    r.image(st.overlay.canvas, 0, 0);
    var ctx = r.getCtx();
    st.def.buildings.forEach(function (b) {
      if (st.doors[b.room] > 0) Buildings.openDoor(r, b, st.doors[b.room]);
      if (!b.chimney) return;
      for (var i = 0; i < 4; i++) {
        var p = (t / 1000 * 0.35 + i / 4 + b.x * 0.13) % 1;
        ctx.globalAlpha = 0.55 * (1 - p);
        var rad = 2 + Math.round(p * 4);
        r.ellipse(b.chimney.x + Math.round(Math.sin(p * 5 + i) * 2 + p * 8), b.chimney.y - Math.round(p * 28), rad, rad, '#f2f2f2');
      }
      ctx.globalAlpha = 1;
    });
  }

  return {
    drawGround: drawGround,
    drawOverlay: drawOverlay,
    isBlocked: isBlocked,
    checkWarp: checkWarp,
    checkEdge: checkEdge,
    talkTarget: talkTarget,
    setScreen: setScreen,
    getScreen: getScreen,
    isOutdoor: isOutdoor,
    setDoorOpen: setDoorOpen,
    doorRect: doorRect,
    START: START,
    WIDTH: W,
    HEIGHT: H,
    TILE: TILE
  };
})();
