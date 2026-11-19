// buildings.js: Gebäude im Dorf – Wohnhäuser, Laden, verlassene Schule, Zaun, Brunnen
// Alle Funktionen zeichnen mit Render in die gerade aktive Ebene.
// Gebäudeangaben in Kacheln: { x, y, w, h, door (Spalte der Tür), style, windows, ... }
var Buildings = (function () {
  'use strict';

  var TILE = 16;
  var mix = Render.mix, hash = Render.hash;

  var STYLES = {
    red: {
      roof: ['#d8604c', '#9a2e2e'], line: ['#8a2828', '#6a1c1c'], scallop: ['#f0907a', '#c05a4a'],
      ridge: '#f4a088', edge: '#3a1414', eave: '#6a2020', wall: ['#f6ead0', '#d6c194'], door: '#8a5a32'
    },
    blue: {
      roof: ['#6a9ae0', '#2e4e9a'], line: ['#2a4488', '#1c3070'], scallop: ['#a0c4f4', '#5a80c8'],
      ridge: '#c4dcfc', edge: '#141e3a', eave: '#20306a', wall: ['#f4eee2', '#d4cab0'], door: '#4f7a4a'
    },
    green: {
      roof: ['#78b860', '#33703a'], line: ['#2e6a34', '#1e5028'], scallop: ['#a8dc88', '#5a9a4a'],
      ridge: '#c4ecaa', edge: '#14301a', eave: '#1e4a24', wall: ['#f2e4cc', '#d2bc94'], door: '#9a4a3a'
    },
    shop: {
      roof: ['#e09a50', '#a05a28'], line: ['#8a4a1e', '#6a3814'], scallop: ['#f4c080', '#c07a40'],
      ridge: '#f8d0a0', edge: '#3a200c', eave: '#6a3a14', wall: ['#f6ead0', '#d6c194'], door: '#3e6e8e'
    }
  };

  // Pixelgeometrie eines Gebäudes
  function geo(b) {
    var x0 = b.x * TILE, y0 = b.y * TILE, w = b.w * TILE;
    return {
      x0: x0, y0: y0, w: w,
      wy0: y0 + 16, wy1: (b.y + b.h) * TILE,
      dcx: b.door * TILE + 8
    };
  }

  // Türöffnung (für Animation und zum Abschneiden der Spielfigur)
  function doorRect(b) {
    var g = geo(b);
    return { x: g.dcx - 5, y: g.wy0 + 4, w: 10, h: g.wy1 - g.wy0 - 4 };
  }

  // --- Wohnhaus --------------------------------------------------------
  function house(r, b) {
    var S = STYLES[b.style] || STYLES.red;
    var g = geo(b), x0 = g.x0, y0 = g.y0, w = g.w, wy0 = g.wy0, wy1 = g.wy1, dcx = g.dcx;
    var i;

    // Schornstein (hinter dem Dach)
    var cx = x0 + w - 20;
    r.px(cx - 1, y0 - 13, 10, 11, '#3a2222');
    r.px(cx, y0 - 12, 8, 10, '#9a5a4e');
    r.px(cx, y0 - 12, 2, 10, '#bc786a');
    r.px(cx + 6, y0 - 12, 2, 10, '#7a4038');
    r.px(cx, y0 - 9, 8, 1, '#7a4038');
    r.px(cx, y0 - 5, 8, 1, '#7a4038');
    r.px(cx - 2, y0 - 15, 12, 3, '#3a2222');
    r.px(cx - 1, y0 - 14, 10, 1, '#6a4040');
    b.chimney = { x: cx + 4, y: y0 - 16 };

    // Dach
    var rTop = y0 - 6, rows = 22;
    for (i = 0; i < rows; i++) {
      var t = i / (rows - 1);
      var inset = Math.round((rows - 1 - i) / (rows - 1) * 4);
      var l = x0 - 3 + inset, rr = x0 + w + 3 - inset, y = rTop + i;
      r.px(l - 1, y, rr - l + 2, 1, S.edge);
      r.px(l, y, rr - l, 1, mix(S.roof[0], S.roof[1], t));
      if (i % 4 === 3) r.px(l, y, rr - l, 1, mix(S.line[0], S.line[1], t));
      if (i % 4 === 0 && i > 1) {
        var off = ((i >> 2) % 2) * 3;
        for (var xx = l + off; xx < rr - 3; xx += 6) r.px(xx + 1, y, 3, 1, mix(S.scallop[0], S.scallop[1], t));
      }
    }
    r.px(x0 + 1, rTop - 1, w - 2, 2, S.edge);
    r.px(x0 + 2, rTop, w - 4, 1, S.ridge);
    r.px(x0 - 4, rTop + rows, w + 8, 2, S.edge);
    r.px(x0 - 3, rTop + rows, w + 6, 1, S.eave);

    // Wand
    for (i = wy0; i < wy1; i++) r.px(x0 + 2, i, w - 4, 1, mix(S.wall[0], S.wall[1], (i - wy0) / (wy1 - wy0)));
    r.px(x0 + 1, wy0, 1, wy1 - wy0, '#2e2018');
    r.px(x0 + w - 2, wy0, 1, wy1 - wy0, '#2e2018');
    r.px(x0 + 2, wy0, w - 4, 3, 'rgba(80,40,20,0.35)');
    var beams = [x0 + 2, x0 + w - 5];
    for (i = 0; i < beams.length; i++) {
      r.px(beams[i], wy0, 3, wy1 - wy0 - 3, '#6e4a2c');
      r.px(beams[i], wy0, 1, wy1 - wy0 - 3, '#946a42');
    }
    // Steinsockel
    r.px(x0 + 2, wy1 - 3, w - 4, 3, '#8c8478');
    r.px(x0 + 2, wy1 - 3, w - 4, 1, '#b0a898');
    for (i = x0 + 4; i < x0 + w - 4; i += 5) r.px(i + ((i >> 2) % 2), wy1 - 2, 1, 2, '#625c52');

    // Tür
    door(r, b, S.door);

    // Laterne
    if (b.lantern) {
      r.px(dcx + 8, wy0 + 4, 4, 1, '#2e2018');
      r.px(dcx + 8, wy0 + 5, 3, 5, '#2e2018');
      r.px(dcx + 9, wy0 + 6, 1, 3, '#ffe27a');
    }

    // Fenster
    var last = b.w - 1;
    (b.windows || []).forEach(function (wi) {
      var wcx = x0 + wi * TILE + 8 + (wi === last ? -3 : wi === 0 ? 3 : 0);
      window_(r, wcx, wy0, b.flowers !== false);
    });

    if (b.barrel !== undefined) barrel(r, x0 + b.barrel * TILE + 6, wy1 - 10);
  }

  function door(r, b, color) {
    var g = geo(b), dcx = g.dcx, wy0 = g.wy0, wy1 = g.wy1;
    r.px(dcx - 6, wy0 + 4, 12, wy1 - wy0 - 4, '#2e2018');
    r.px(dcx - 4, wy0 + 3, 8, 1, '#2e2018');
    r.px(dcx - 5, wy0 + 5, 10, wy1 - wy0 - 6, color);
    r.px(dcx - 3, wy0 + 4, 6, 1, color);
    r.px(dcx - 2, wy0 + 5, 1, wy1 - wy0 - 6, 'rgba(0,0,0,0.25)');
    r.px(dcx + 1, wy0 + 5, 1, wy1 - wy0 - 6, 'rgba(0,0,0,0.25)');
    r.px(dcx - 5, wy0 + 5, 1, wy1 - wy0 - 6, 'rgba(255,255,255,0.25)');
    r.px(dcx + 3, wy0 + 10, 1, 2, '#f2c84a');
    r.px(dcx - 7, wy1 - 1, 14, 1, '#c4bcac');
  }

  // Offene Tür: dunkler Flur mit warmem Licht, Türblatt schwenkt nach innen.
  // p = 0 (zu) bis 1 (ganz offen).
  function openDoor(r, b, p) {
    if (p <= 0) return;
    var S = STYLES[b.style] || STYLES.red;
    var d = doorRect(b);
    r.px(d.x, d.y + 1, d.w, d.h - 2, '#1a1210');
    r.px(d.x + 2, d.y, d.w - 4, 1, '#1a1210');
    r.px(d.x + 1, d.y + d.h - 5, d.w - 2, 4, '#4a2e18');
    r.px(d.x + 2, d.y + d.h - 3, d.w - 4, 2, '#7a4e26');
    r.px(d.x + 3, d.y + d.h - 2, d.w - 6, 1, '#c88a44');
    var pw = Math.round(10 * (1 - p));
    if (pw > 0) {
      r.px(d.x, d.y + 1, pw, d.h - 2, S.door);
      r.px(d.x + pw - 1, d.y + 1, 1, d.h - 2, 'rgba(0,0,0,0.35)');
    } else {
      r.px(d.x, d.y + 1, 1, d.h - 2, S.door);
    }
  }

  function window_(r, wcx, wy0, flowers) {
    var i;
    r.px(wcx - 6, wy0 + 3, 12, 9, '#4a3020');
    for (i = 0; i < 7; i++) r.px(wcx - 5, wy0 + 4 + i, 10, 1, mix('#d4f0fa', '#78b4dc', i / 6));
    r.px(wcx - 4, wy0 + 5, 2, 1, '#ffffff');
    r.px(wcx - 4, wy0 + 6, 1, 1, '#ffffff');
    r.px(wcx, wy0 + 4, 1, 7, '#4a3020');
    r.px(wcx - 5, wy0 + 7, 10, 1, '#4a3020');
    if (!flowers) return;
    r.px(wcx - 7, wy0 + 12, 14, 2, '#6e4a2c');
    r.px(wcx - 7, wy0 + 12, 14, 1, '#946a42');
    var fc = ['#e8506a', '#f6d64a', '#e8506a', '#f4f0f0', '#e8506a', '#f6d64a'];
    for (i = 0; i < fc.length; i++) {
      r.px(wcx - 6 + i * 2, wy0 + 10, 2, 2, '#4a9a3e');
      r.px(wcx - 6 + i * 2 + (i % 2), wy0 + 10, 1, 1, fc[(i + wcx) % fc.length]);
    }
  }

  function barrel(r, bx, by) {
    r.px(bx - 1, by, 9, 10, '#2e2018');
    r.px(bx, by + 1, 7, 8, '#8a5a32');
    r.px(bx + 1, by + 1, 1, 8, '#b07a46');
    r.px(bx, by + 3, 7, 1, '#4a4a52');
    r.px(bx, by + 7, 7, 1, '#4a4a52');
    r.px(bx, by, 7, 1, '#5a3a20');
  }

  // --- Laden: wie ein Haus, mit Markise, Schaufenstern und Schild -------
  function shop(r, b) {
    var saved = b.windows;
    b.windows = [];
    house(r, b);
    b.windows = saved;
    var g = geo(b), x0 = g.x0, wy0 = g.wy0, dcx = g.dcx, i;

    // Schaufenster mit Heften, Stiften und Büchern
    (b.windows || []).forEach(function (wi, n) {
      var wx = x0 + wi * TILE + (wi === 0 ? 4 : wi === b.w - 1 ? 0 : 2);
      r.px(wx, wy0 + 3, 13, 10, '#4a3020');
      r.px(wx + 1, wy0 + 4, 11, 8, '#cfe8f4');
      r.px(wx + 1, wy0 + 4, 11, 1, '#ffffff');
      var items = ['#e84a4a', '#4a7ac8', '#f0c040', '#5ab04a', '#9a5ac0'];
      if (n % 3 === 0) {                       // Bücher
        for (i = 0; i < 4; i++) r.px(wx + 2 + i * 2, wy0 + 7, 2, 5, items[(i + n) % 5]);
      } else if (n % 3 === 1) {                // Hefte
        for (i = 0; i < 3; i++) r.px(wx + 2 + i * 3, wy0 + 9 - i, 4, 3, items[(i + n + 1) % 5]);
      } else {                                 // Stifte im Becher
        for (i = 0; i < 4; i++) r.px(wx + 4 + i, wy0 + 6 + (i % 2), 1, 4, items[i]);
        r.px(wx + 3, wy0 + 9, 6, 3, '#8a949c');
      }
      r.px(wx, wy0 + 13, 13, 1, '#946a42');
    });

    // gestreifte Markise über der Tür
    var ax = dcx - 10, ay = wy0 + 1;
    for (i = 0; i < 20; i++) r.px(ax + i, ay, 1, 5, Math.floor(i / 3) % 2 ? '#f4f0e6' : '#d8443a');
    for (i = 0; i < 20; i += 3) r.px(ax + i, ay + 5, 2, 1, Math.floor(i / 3) % 2 ? '#f4f0e6' : '#d8443a');
    r.px(ax, ay, 20, 1, '#8a2a24');

    // Schild "LADEN" auf dem Dach
    var label = 'LADEN', tw = Render.textWidth(label);
    var sx = dcx - Math.ceil(tw / 2) - 3, sy = g.y0 + 4;
    r.px(sx, sy, tw + 6, 9, '#3a2418');
    r.px(sx + 1, sy + 1, tw + 4, 7, '#f4e8c8');
    Render.text(label, sx + 3, sy + 2, '#8a2a24');
  }

  // --- Verlassene Schule -------------------------------------------------
  // s = { x, y, w, h } in Kacheln (Gebäude oben, unterste Reihe ist der Hof)
  function school(r, s) {
    var X0 = s.x * TILE, Y0 = s.y * TILE, W = s.w * TILE;
    var by = (s.y + s.h - 1) * TILE;        // Unterkante Gebäude
    var cx = X0 + W / 2;
    var i, j;

    // Wand mit Flecken und Rissen
    var wTop = Y0 + 12;
    for (i = wTop; i < by; i++) r.px(X0 + 2, i, W - 4, 1, mix('#d4c6a0', '#b0a07a', (i - wTop) / (by - wTop)));
    for (i = 0; i < 26; i++) {
      var sx = X0 + 4 + Math.floor(hash(i, 41) * (W - 10));
      var sy = wTop + 2 + Math.floor(hash(41, i) * (by - wTop - 6));
      r.px(sx, sy, 2 + Math.floor(hash(i, 3) * 4), 2, 'rgba(110,96,64,0.35)');
    }
    r.px(X0 + 1, wTop, 1, by - wTop, '#2e2a22');
    r.px(X0 + W - 2, wTop, 1, by - wTop, '#2e2a22');
    r.px(X0 + 2, Y0 + 36, W - 4, 2, '#8e8064');                       // Stockwerkgesims
    r.px(X0 + 2, Y0 + 36, W - 4, 1, '#c4b48e');
    crack(r, X0 + 20, wTop + 4, 9);
    crack(r, X0 + 70, Y0 + 40, 12);

    // Fenster: heil, zerbrochen oder vernagelt
    var rowsY = [Y0 + 18, Y0 + 41];
    for (j = 0; j < 2; j++) {
      for (i = 0; i < s.w; i++) {
        var wx = X0 + i * TILE + 3;
        if (j === 1 && (i === 2 || i === 3)) continue;               // Eingang
        var kind = Math.floor(hash(i * 7 + j, 13) * 3);
        schoolWindow(r, wx, rowsY[j], kind, i + j);
      }
    }

    // Eingang: Doppeltür mit Brettern vernagelt
    var dx = X0 + 2 * TILE + 4, dw = 2 * TILE - 8, dy = Y0 + 41;
    r.px(dx - 1, dy - 1, dw + 2, by - dy + 1, '#2a2018');
    r.px(dx, dy, dw, by - dy, '#5a3a2a');
    r.px(dx + dw / 2, dy, 1, by - dy, '#2a2018');
    plank(r, dx - 2, dy + 4, dw + 4, 1);
    plank(r, dx - 2, dy + 12, dw + 4, -1);
    r.px(dx - 3, by - 2, dw + 6, 2, '#8a8478');                      // Stufe
    r.px(dx - 3, by - 2, dw + 6, 1, '#a8a294');
    // verblichenes Schild "SCHULE"
    var label = 'SCHULE', tw = Render.textWidth(label);
    r.px(cx - tw / 2 - 3, Y0 + 29, tw + 6, 9, '#4a3a2a');
    r.px(cx - tw / 2 - 2, Y0 + 30, tw + 4, 7, '#c8b88a');
    Render.text(label, cx - tw / 2, Y0 + 31, '#7a6a52');
    r.px(cx + tw / 2 - 2, Y0 + 30, 2, 3, '#a89a72');                 // abgeblättert

    // Dach: Schiefer mit Moos und Löchern
    var rTop = Y0 - 4, rows = 16;
    for (i = 0; i < rows; i++) {
      var inset = Math.round((rows - 1 - i) / (rows - 1) * 5);
      var l = X0 - 3 + inset, rr = X0 + W + 3 - inset, y = rTop + i;
      r.px(l - 1, y, rr - l + 2, 1, '#1e2228');
      r.px(l, y, rr - l, 1, mix('#7a8090', '#4a505e', i / (rows - 1)));
      if (i % 4 === 3) r.px(l, y, rr - l, 1, '#3e4450');
    }
    r.px(X0 - 4, rTop + rows, W + 8, 2, '#1e2228');
    for (i = 0; i < 14; i++) {
      var mx = X0 + Math.floor(hash(i, 77) * W), my = rTop + 2 + Math.floor(hash(77, i) * 12);
      r.ellipse(mx, my, 2 + Math.floor(hash(i, 5) * 3), 1 + Math.floor(hash(5, i) * 2), i % 3 ? '#5a7a3a' : '#7a9a48');
    }
    r.px(X0 + 18, rTop + 6, 4, 2, '#14161a');                         // Löcher
    r.px(X0 + 74, rTop + 9, 3, 2, '#14161a');
    r.px(X0 + 75, rTop + 8, 1, 1, '#14161a');

    // Giebel mit stehengebliebener Uhr
    for (i = 0; i < 10; i++) r.px(cx - 2 - i, rTop - 10 + i, 4 + i * 2, 1, i === 0 ? '#1e2228' : '#6a7080');
    r.px(cx - 12, rTop, 24, 1, '#1e2228');
    r.ellipse(cx, rTop - 2, 4, 4, '#2a2a30');
    r.ellipse(cx, rTop - 2, 3, 3, '#e4dcc4');
    r.px(cx, rTop - 5, 1, 3, '#2a2030');
    r.px(cx - 2, rTop - 2, 2, 1, '#2a2030');
    r.px(cx + 1, rTop - 4, 1, 1, '#8a8478');                          // Sprung im Glas
    r.px(cx + 2, rTop - 3, 1, 1, '#8a8478');

    // Efeu an den Ecken und vom Dach hängend
    ivy(r, X0 + 4, by - 2, 34, 3);
    ivy(r, X0 + W - 6, by - 2, 28, 9);
    ivy(r, X0 + 52, wTop + 2, 10, 17);
    ivy(r, X0 + 30, wTop + 2, 7, 21);

    // Hof: rissige Platten, Unkraut, umgekippte Mülltonne
    var yy = by;
    for (i = 0; i < 4; i++) r.px(cx - 8 + (i % 2) * 8, yy + 1 + Math.floor(i / 2) * 7, 7, 6, i === 2 ? '#8a8a80' : '#9a9a8e');
    r.px(cx - 4, yy + 3, 1, 4, '#5a5a52');
    r.px(cx + 3, yy + 9, 3, 1, '#5a5a52');
    for (i = 0; i < 18; i++) {
      var wx2 = X0 + 2 + Math.floor(hash(i, 91) * (W - 6));
      if (Math.abs(wx2 - cx) < 9 && i % 3) continue;
      weed(r, wx2, yy + 14 - Math.floor(hash(91, i) * 4), 6 + Math.floor(hash(i, 19) * 6), i);
    }
    // Mülltonne
    var tx = X0 + W - 26, ty = yy + 6;
    r.px(tx, ty, 12, 7, '#2a2e34');
    r.px(tx + 1, ty + 1, 10, 5, '#6a727c');
    r.px(tx + 1, ty + 1, 10, 1, '#8a929c');
    r.px(tx + 3, ty + 1, 1, 5, '#4a525c');
    r.px(tx + 7, ty + 1, 1, 5, '#4a525c');
    r.ellipse(tx + 13, ty + 3, 2, 4, '#2a2e34');
    r.px(tx + 15, ty + 6, 3, 2, '#c8c0a0');                           // Papierreste
    r.px(tx - 4, ty + 7, 2, 1, '#e8e0c8');
  }

  // --- Intakte Schule (Meilenstein 6) -------------------------------------
  // s = { x, y, w, h } in Kacheln wie bei school(): Gebaeude oben, unterste
  // Reihe ist der Hof. Zusaetzlich: s.door = Spalte der Eingangstuer relativ
  // zur linken Kante (Standard 2), s.doorFrame = false zeichnet keine eigene
  // Fassaden-Tuer (z. B. wenn das Kachel-'E' den Eingang darstellt).
  // Wiederverwendbar fuer Schritt 2 (Wiederaufbau im Dorf und auf dem
  // Schulhof). Heile Fenster, sauberes Dach, Uhr ohne Sprung.
  function schoolIntact(r, s) {
    var X0 = s.x * TILE, Y0 = s.y * TILE, W = s.w * TILE;
    var by = (s.y + s.h - 1) * TILE;        // Unterkante Gebaeude
    var wTop = Y0 + 12;                     // Oberkante Wand
    var tall = by - wTop >= 40;             // zwei Fenster-Reihen wie im Original
    var cx = X0 + W / 2;
    var dcol = s.door === undefined ? 2 : s.door;
    var i, j;

    // Frische Wand mit Gesims (Gesims nur bei hohen Fassaden)
    for (i = wTop; i < by; i++) r.px(X0 + 2, i, W - 4, 1, mix('#e8dcc0', '#cfc0a0', (i - wTop) / (by - wTop)));
    r.px(X0 + 1, wTop, 1, by - wTop, '#2e2a22');
    r.px(X0 + W - 2, wTop, 1, by - wTop, '#2e2a22');
    if (tall) {
      r.px(X0 + 2, wTop + 24, W - 4, 2, '#9a8c70');
      r.px(X0 + 2, wTop + 24, W - 4, 1, '#d4c8a8');
    }

    // Fenster: heil, mit hellem Glas und Fensterbaenken; zwei Reihen nur
    // bei hoher Fassade, keine Fenster in der Eingangsspalte
    var rowsY = tall ? [wTop + 6, by - 23] : [wTop + 6];
    for (j = 0; j < rowsY.length; j++) {
      for (i = 0; i < s.w; i++) {
        if (j === 1 && (i === dcol || i === dcol + 1)) continue;   // Eingang frei
        intactWindow(r, X0 + i * TILE + 3, rowsY[j], i + j);
      }
    }

    // Eingang: Doppelte Glastuer mit Stufen (weglassbar)
    if (s.doorFrame !== false) {
      var dx = X0 + dcol * TILE + 4, dw = 2 * TILE - 8, dy = by - 23;
      r.px(dx - 1, dy - 1, dw + 2, by - dy + 1, '#2a2018');
      r.px(dx, dy, dw / 2 - 1, by - dy, '#5a7a94');
      r.px(dx + dw / 2 + 1, dy, dw / 2 - 1, by - dy, '#5a7a94');
      r.px(dx, dy, dw, 1, '#c8d8e4');
      r.px(dx + 3, dy + 3, 3, 2, '#8fb4cc');
      r.px(dx + dw - 6, dy + 3, 3, 2, '#8fb4cc');
      r.px(dx + Math.floor(dw / 2) - 1, dy, 2, by - dy, '#2a2018');   // Trennsteg
      r.px(dx - 3, by - 2, dw + 6, 2, '#8a8478');
      r.px(dx - 3, by - 2, dw + 6, 1, '#c4bca8');
    }

    // Gepflegtes Schild "SCHULE" (nur bei hohen Fassaden, hoehe wie Original)
    if (tall) {
      var label = 'SCHULE', tw = Render.textWidth(label);
      r.px(cx - tw / 2 - 3, wTop + 17, tw + 6, 9, '#3a2418');
      r.px(cx - tw / 2 - 2, wTop + 18, tw + 4, 7, '#f4e8c8');
      Render.text(label, cx - tw / 2, wTop + 19, '#8a2a24');
    }

    // Dach: heiler Schiefer mit First
    var rTop = Y0 - 4, rows = 16;
    for (i = 0; i < rows; i++) {
      var inset = Math.round((rows - 1 - i) / (rows - 1) * 5);
      var l = X0 - 3 + inset, rr = X0 + W + 3 - inset, y = rTop + i;
      r.px(l - 1, y, rr - l + 2, 1, '#1e2228');
      r.px(l, y, rr - l, 1, mix('#7a8090', '#4a505e', i / (rows - 1)));
      if (i % 4 === 3) r.px(l, y, rr - l, 1, '#3e4450');
    }
    r.px(X0 + 1, rTop - 1, W - 2, 2, '#1e2228');
    r.px(X0 + 2, rTop, W - 4, 1, '#a8b0c0');
    r.px(X0 - 4, rTop + rows, W + 8, 2, '#1e2228');
    r.px(X0 - 3, rTop + rows, W + 6, 1, '#3e4a58');

    // Giebel mit heiler Uhr
    for (i = 0; i < 10; i++) r.px(cx - 2 - i, rTop - 10 + i, 4 + i * 2, 1, i === 0 ? '#1e2228' : '#6a7080');
    r.px(cx - 12, rTop, 24, 1, '#1e2228');
    r.ellipse(cx, rTop - 2, 4, 4, '#2a2a30');
    r.ellipse(cx, rTop - 2, 3, 3, '#f4eed8');
    r.px(cx, rTop - 5, 1, 3, '#2a2030');
    r.px(cx - 2, rTop - 2, 2, 1, '#2a2030');
    r.px(cx + 1, rTop - 2, 1, 2, '#4a4050');

    // Hof: gefegte Platten, Blumenbeet an der Ecke
    var yy = by;
    for (i = 0; i < 4; i++) r.px(cx - 8 + (i % 2) * 8, yy + 1 + Math.floor(i / 2) * 7, 7, 6, i === 2 ? '#94948a' : '#a2a296');
    r.ellipse(X0 + 8, yy + 8, 5, 3, '#5a7a3a');
    for (i = 0; i < 3; i++) r.px(X0 + 5 + i * 3, yy + 5, 2, 2, i === 1 ? '#f6d64a' : '#e8506a');
  }

  // Heiles Schul-Fenster mit Rahmen und Fensterbank (kein Brett, kein Riss)
  function intactWindow(r, x, y, seed) {
    r.px(x - 1, y - 1, 12, 13, '#6a5c48');
    r.px(x, y, 10, 11, '#4a5c70');
    for (var i = 0; i < 9; i++) r.px(x + 1, y + 1 + i, 8, 1, mix('#d4ecf8', '#8ab4d4', i / 8));
    r.px(x + 2, y + 1, 2, 2, '#ffffff');
    r.px(x + 5, y, 1, 11, '#6a5c48');
    r.px(x, y + 5, 10, 1, '#6a5c48');
    r.px(x - 1, y + 11, 12, 1, '#8a8064');
    if (seed % 2) r.px(x + 11, y + 2, 2, 2, '#e8506a');   // Blumenkasten
  }

  function crack(r, x, y, len) {
    for (var i = 0; i < len; i++) {
      r.px(x + Math.round(Math.sin(i * 1.3) * 1.5), y + i, 1, 1, '#6a5c44');
    }
  }

  function plank(r, x, y, w, slope) {
    for (var i = 0; i < w; i++) {
      var yy = y + Math.round(i / w * 3 * slope);
      r.px(x + i, yy, 1, 3, '#8a6a48');
      r.px(x + i, yy, 1, 1, '#b08a5e');
      r.px(x + i, yy + 2, 1, 1, '#5a4430');
    }
    r.px(x + 1, y + 1, 1, 1, '#2a2a30');
    r.px(x + w - 2, y + 1 + 3 * slope, 1, 1, '#2a2a30');
  }

  function schoolWindow(r, x, y, kind, seed) {
    r.px(x - 1, y - 1, 12, 13, '#4a4232');
    r.px(x, y, 10, 11, '#3a4858');
    r.px(x + 1, y + 1, 3, 2, '#5a7088');
    r.px(x + 5, y, 1, 11, '#4a4232');
    if (kind === 1) {                       // zerbrochen
      r.px(x + 1, y + 3, 7, 6, '#12161c');
      r.px(x + 2, y + 2, 2, 2, '#c8d8e0');
      r.px(x + 6, y + 8, 2, 2, '#c8d8e0');
      r.px(x + 7, y + 3, 1, 3, '#a8bcc8');
      r.px(x + 1, y + 7, 1, 2, '#a8bcc8');
    } else if (kind === 2) {                // vernagelt
      plank(r, x - 2, y + 1, 14, 1);
      plank(r, x - 2, y + 7, 14, -1);
    }
    r.px(x - 1, y + 11, 12, 1, '#8a8064');  // Fensterbank
    if (seed % 2) r.px(x + 2, y + 12, 1, 3, 'rgba(90,70,40,0.4)');   // Rostspur
  }

  function ivy(r, x, y, height, seed) {
    var px = x;
    for (var i = 0; i < height; i += 2) {
      px += Math.round((hash(seed, i) - 0.5) * 3);
      var c = hash(i, seed) > 0.5 ? '#3a7a34' : '#5a9a44';
      r.px(px, y - i, 3, 2, '#24502a');
      r.px(px, y - i, 2, 1, c);
      if (hash(seed + 1, i) > 0.6) r.px(px + 2, y - i - 1, 2, 2, c);
      if (hash(seed + 2, i) > 0.7) r.px(px - 2, y - i, 2, 2, '#4a8a3a');
    }
  }

  function weed(r, x, y, h, seed) {
    var cols = ['#6a8a3a', '#8aa848', '#a8b858', '#5a7a2a'];
    for (var k = 0; k < 4; k++) {
      var bx = x + k - 1, bh = h - (k % 2) * 2 - Math.floor(hash(seed, k) * 3);
      var lean = k < 2 ? -1 : 1;
      for (var j = 0; j < bh; j++) {
        r.px(bx + (j > bh / 2 ? lean : 0), y - j, 1, 1, cols[(k + seed) % cols.length]);
      }
    }
    r.px(x, y - h, 1, 1, '#d8c870');
  }

  // --- Zaun um die Schule ------------------------------------------------
  // kind: 'h' waagrecht, 'v' senkrecht
  function fence(r, tx, ty, kind, broken) {
    var x = tx * TILE, y = ty * TILE;
    var wood = '#8a7a64', dark = '#4a4034', light = '#ada08a';
    if (kind === 'h') {
      r.px(x, y + 6, 16, 2, dark);
      r.px(x, y + 11, 16, 2, dark);
      r.px(x, y + 6, 16, 1, wood);
      r.px(x, y + 11, 16, 1, wood);
      for (var i = 0; i < 4; i++) {
        if (broken && i === 2) {            // umgekippte Latte
          r.px(x + i * 4 + 1, y + 12, 6, 2, wood);
          r.px(x + i * 4 + 1, y + 13, 6, 1, dark);
          continue;
        }
        var h = 12 - (hash(tx * 4 + i, ty) > 0.7 ? 3 : 0);
        r.px(x + i * 4 + 1, y + 15 - h, 3, h, dark);
        r.px(x + i * 4 + 1, y + 15 - h, 2, h - 1, wood);
        r.px(x + i * 4 + 1, y + 15 - h, 2, 1, light);
      }
      r.px(x, y + 15, 16, 1, 'rgba(20,40,20,0.35)');
    } else {
      r.px(x + 7, y, 2, 16, dark);
      r.px(x + 7, y, 1, 16, wood);
      r.px(x + 6, y + 2, 4, 5, dark);
      r.px(x + 6, y + 2, 3, 4, wood);
      r.px(x + 6, y + 10, 4, 5, dark);
      r.px(x + 6, y + 10, 3, 4, wood);
      r.px(x + 6, y + 2, 3, 1, light);
      r.px(x + 6, y + 10, 3, 1, light);
    }
  }

  // Tor mit Kette, Vorhängeschloss und Schild "GESPERRT" (gx = linke Torkachel)
  function gate(r, gx, gy) {
    var x = gx * TILE, y = gy * TILE, w = 2 * TILE, i;
    // Torpfosten
    r.px(x - 2, y - 2, 4, 18, '#3a3434');
    r.px(x + w - 2, y - 2, 4, 18, '#3a3434');
    r.px(x - 2, y - 2, 4, 1, '#6a6262');
    r.px(x + w - 2, y - 2, 4, 1, '#6a6262');
    // Eisenstäbe mit Rost
    r.px(x + 2, y + 1, w - 4, 2, '#2e2e36');
    r.px(x + 2, y + 13, w - 4, 2, '#2e2e36');
    for (i = x + 3; i < x + w - 3; i += 3) {
      r.px(i, y, 1, 15, '#3a3a44');
      if (hash(i, gy) > 0.6) r.px(i, y + 4 + Math.floor(hash(gy, i) * 6), 1, 2, '#8a4a2a');
    }
    // Kette diagonal mit Schloss
    for (i = 0; i < w - 4; i += 2) {
      var cy = y + 4 + Math.round(Math.abs(i - (w - 4) / 2) / 4);
      r.px(x + 2 + i, cy, 2, 1, i % 4 ? '#c8ccd2' : '#7a8088');
    }
    r.px(x + w / 2 - 2, y + 5, 5, 5, '#2a2018');
    r.px(x + w / 2 - 1, y + 6, 3, 3, '#d8b040');
    r.px(x + w / 2 - 1, y + 3, 3, 2, '#7a8088');
    r.px(x + w / 2, y + 7, 1, 1, '#2a2018');
    // Warnschild
    var label = 'GESPERRT', tw = Render.textWidth(label);
    var sx = x + w / 2 - tw / 2 - 3, sy = y + 8;
    r.px(sx, sy, tw + 6, 9, '#8a1c1c');
    r.px(sx + 1, sy + 1, tw + 4, 7, '#f4f0e6');
    Render.text(label, sx + 3, sy + 2, '#c82828');
    r.px(sx + 2, sy - 1, 1, 1, '#7a8088');
    r.px(sx + tw + 3, sy - 1, 1, 1, '#7a8088');
  }

  // Unkraut außen am Zaun
  function fenceWeeds(r, tx, ty, seed) {
    weed(r, tx * TILE + 3 + Math.floor(hash(seed, 1) * 10), ty * TILE + 15, 5 + Math.floor(hash(1, seed) * 4), seed);
  }

  // --- Brunnen -------------------------------------------------------------
  function well(r, tx, ty) {
    var x = tx * TILE, y = ty * TILE, cx = x + 8;
    r.ellipse(cx, y + 10, 8, 5, '#3a3a40');
    r.ellipse(cx, y + 9, 7, 4, '#9a9a96');
    r.ellipse(cx, y + 9, 5, 3, '#1c3a6a');
    r.ellipse(cx, y + 9, 4, 2, '#2c5a9a');
    r.px(cx - 2, y + 8, 2, 1, '#9cc8f0');
    for (var i = 0; i < 5; i++) r.px(cx - 7 + i * 3, y + 11 + (i % 2), 2, 1, '#6a6a66');
    // Pfosten und Dach
    r.px(x, y - 8, 2, 16, '#4a2c18');
    r.px(x + 14, y - 8, 2, 16, '#4a2c18');
    r.px(x, y - 8, 1, 16, '#7a4e2a');
    r.px(x + 14, y - 8, 1, 16, '#7a4e2a');
    r.px(x + 2, y - 4, 12, 1, '#6a4224');                // Kurbelstange
    r.px(cx, y - 3, 1, 7, '#b0a890');                    // Seil
    r.px(cx - 2, y + 3, 5, 3, '#7a4e2a');                // Eimer
    r.px(cx - 2, y + 3, 5, 1, '#a07040');
    for (i = 0; i < 6; i++) r.px(x - 3 + i, y - 9 - i, 22 - i * 2, 1, i === 5 ? '#3a1414' : mix('#d8604c', '#9a2e2e', 1 - i / 5));
    r.px(x - 4, y - 8, 24, 1, '#3a1414');
  }

  return {
    STYLES: STYLES,
    house: house,
    shop: shop,
    openDoor: openDoor,
    doorRect: doorRect,
    school: school,
    schoolIntact: schoolIntact,
    fence: fence,
    gate: gate,
    fenceWeeds: fenceWeeds,
    well: well,
    weed: weed
  };
})();
