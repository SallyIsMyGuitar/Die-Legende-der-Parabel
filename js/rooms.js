// rooms.js: Innenräume im Ostteil des Dorfs – Nachbarin, Freund, Schreibwarenladen
(function () {
  'use strict';

  var TILE = 16;
  var L = Interior.lib;
  var hash = Render.hash;

  // Blinzeln alle paar Sekunden (Bild 1 = Augen zu)
  function blinkFrame(t, period, offset) {
    return (t + (offset || 0)) % period < 140 ? 1 : 0;
  }

  // ===================================================================
  // Nachbarin: Wohnzimmer mit Kamin, Standuhr, Vitrine, Sofa
  // ===================================================================
  function grandfatherClock(r) {
    var x = 2 * TILE + 2, y = 14;
    r.px(x + 2, 64, 12, 2, 'rgba(50,25,10,0.3)');
    r.px(x, y, 12, 50, '#2a160c');
    r.px(x + 1, y + 1, 10, 48, '#6a3a20');
    r.px(x + 1, y + 1, 2, 48, '#8a5230');
    r.ellipse(x + 6, y + 8, 4, 4, '#c8a050');
    r.ellipse(x + 6, y + 8, 3, 3, '#f4ecd8');
    r.px(x + 6, y + 6, 1, 3, '#2a2030');
    r.px(x + 6, y + 8, 2, 1, '#2a2030');
    r.px(x + 3, y + 16, 6, 22, '#2a160c');             // Pendelkasten
    r.px(x + 4, y + 17, 4, 20, '#3a2a28');
    r.px(x, y + 42, 12, 2, '#4a2414');
  }

  function fireplace(r) {
    var x = 6 * TILE, w = 3 * TILE, y = 20, i;
    r.px(x + 2, 64, w, 2, 'rgba(50,25,10,0.3)');
    r.px(x, y, w, 44, '#4a4038');
    for (var row = 0; row < 11; row++) {
      for (i = 0; i < 6; i++) {
        var bx = x + 1 + i * 8 + (row % 2 ? 4 : 0);
        if (bx + 7 > x + w - 1) continue;
        r.px(bx, y + 1 + row * 4, 7, 3, hash(i, row) > 0.5 ? '#a89a8c' : '#968878');
      }
    }
    r.px(x - 2, y + 8, w + 4, 4, '#3a2418');               // Kaminsims
    r.px(x - 2, y + 8, w + 4, 1, '#8a5a32');
    r.px(x + 6, y + 3, 3, 5, '#e8e0d0');                   // Kerzen und Vase
    r.px(x + 7, y + 2, 1, 1, '#f8d048');
    r.px(x + 38, y + 3, 3, 5, '#e8e0d0');
    r.px(x + 39, y + 2, 1, 1, '#f8d048');
    r.px(x + 20, y + 2, 7, 6, '#4a7ac8');
    r.px(x + 21, y + 1, 5, 1, '#6a9ae0');
    r.px(x + 22, y - 2, 1, 3, '#e8506a');
    r.px(x + 24, y - 3, 1, 4, '#f6d64a');
    r.px(x + 10, y + 18, w - 20, 25, '#1a1210');           // Feueröffnung
    r.px(x + 12, y + 16, w - 24, 2, '#1a1210');
    r.px(x + 14, y + 38, w - 28, 3, '#5a3420');            // Holzscheite
    r.px(x + 16, y + 36, w - 32, 2, '#7a4a2a');
    r.px(x + 6, y + 43, w - 12, 1, '#6a5e52');
  }

  function vitrine(r) {
    var x = 12 * TILE + 1, y = 18, w = 30, h = 46, i;
    r.px(x + 2, y + h, w, 3, 'rgba(50,25,10,0.3)');
    r.px(x, y, w, h, '#2a160c');
    r.px(x + 1, y + 1, w - 2, h - 2, '#7a4428');
    r.px(x + 3, y + 3, w - 6, 24, '#bcd8e4');               // Glastür
    r.px(x + 3, y + 14, w - 6, 1, '#7a4428');
    for (i = 0; i < 3; i++) {
      r.ellipse(x + 8 + i * 7, y + 9, 3, 3, '#f4f4f4');     // Teller
      r.ellipse(x + 8 + i * 7, y + 9, 1, 1, '#4a7ac8');
      r.px(x + 6 + i * 7, y + 20, 4, 4, '#f4f4f4');          // Tassen
      r.px(x + 10 + i * 7, y + 21, 1, 2, '#f4f4f4');
    }
    r.px(x + 4, y + 4, 1, 8, 'rgba(255,255,255,0.6)');
    r.px(x + 3, y + 30, 11, 13, '#9a5a32');
    r.px(x + 16, y + 30, 11, 13, '#9a5a32');
    r.px(x + 13, y + 35, 1, 2, '#f0d080');
    r.px(x + 16, y + 35, 1, 2, '#f0d080');
  }

  function rockingChair(r) {
    var x = 10 * TILE, y = 4 * TILE;
    r.px(x + 1, y - 6, 14, 14, '#3a1e10');
    r.px(x + 2, y - 5, 12, 12, '#8a5230');
    for (var i = 0; i < 4; i++) r.px(x + 3 + i * 3, y - 4, 1, 10, '#6a3a20');
    r.px(x + 1, y + 14, 14, 1, '#3a1e10');
    r.px(x, y + 15, 16, 1, '#6a3a20');
  }

  function ovalRug(r) {
    r.ellipse(104, 116, 44, 22, '#6a3a5a');
    r.ellipse(104, 116, 42, 20, '#b0607e');
    r.ellipse(104, 116, 34, 15, '#e8c0a0');
    r.ellipse(104, 116, 30, 12, '#b0607e');
    r.ellipse(104, 116, 14, 5, '#d888a4');
  }

  function coffeeTable(r) {
    var x = 6 * TILE + 1, y = 6 * TILE + 2, w = 2 * TILE - 2;
    r.ellipse(x + w / 2 + 2, y + 14, 15, 3, 'rgba(50,20,10,0.3)');
    r.px(x + 2, y + 9, 2, 5, '#3a2014');
    r.px(x + w - 4, y + 9, 2, 5, '#3a2014');
    r.px(x, y, w, 10, '#2a160c');
    r.px(x + 1, y + 1, w - 2, 7, '#7a4428');
    r.px(x + 1, y + 1, w - 2, 1, '#9a5a32');
    r.px(x + 6, y - 2, 7, 6, '#f4f4f4');                    // Teekanne
    r.px(x + 13, y, 2, 2, '#f4f4f4');
    r.px(x + 8, y - 3, 3, 1, '#d8d0c0');
    r.px(x + 7, y, 5, 1, '#4a7ac8');
    r.px(x + 19, y + 2, 4, 3, '#f4f4f4');                   // Tasse
    r.px(x + 20, y + 2, 2, 1, '#8a5a32');
  }

  function sofaBack(r) {
    var x = 5 * TILE, y = 8 * TILE, w = 3 * TILE;
    r.px(x + 2, y + 15, w, 2, 'rgba(50,25,10,0.3)');
    r.px(x, y, w, 15, '#24402e');
    r.px(x + 1, y + 1, w - 2, 5, '#6aa07a');                // Sitzkissen (oben sichtbar)
    r.px(x + 16, y + 1, 1, 5, '#4a7a5a');
    r.px(x + 32, y + 1, 1, 5, '#4a7a5a');
    r.px(x + 1, y + 6, w - 2, 8, '#4a7a5a');                // Rückenlehne
    r.px(x + 1, y + 6, w - 2, 1, '#7ab08a');
    for (var i = x + 6; i < x + w - 4; i += 8) r.px(i, y + 10, 1, 1, '#2e5a3e');
    r.px(x, y, 4, 15, '#3a6a4a');                            // Armlehnen
    r.px(x + w - 4, y, 4, 15, '#3a6a4a');
    r.px(x, y, 4, 1, '#7ab08a');
    r.px(x + w - 4, y, 4, 1, '#7ab08a');
    r.px(x + 18, y - 1, 8, 4, '#e8a0b0');                    // Kissen
  }

  function yarnBasket(r) {
    var x = 13 * TILE, y = 11 * TILE;
    r.px(x + 2, y + 15, 13, 1, 'rgba(50,25,10,0.3)');
    r.px(x + 2, y + 8, 12, 7, '#7a5a2a');
    for (var i = 0; i < 6; i++) r.px(x + 3 + i * 2, y + 9, 1, 5, '#a8823e');
    r.ellipse(x + 6, y + 7, 3, 3, '#d8443a');
    r.ellipse(x + 11, y + 7, 3, 3, '#4a7ac8');
    r.ellipse(x + 8, y + 5, 3, 3, '#f0c040');
    r.px(x + 5, y + 2, 1, 6, '#c8c8d0');                     // Stricknadeln
    r.px(x + 9, y + 1, 1, 6, '#c8c8d0');
  }

  function ovalPortrait(r, cx, cy, hair) {
    r.ellipse(cx, cy, 5, 6, '#c8a050');
    r.ellipse(cx, cy, 4, 5, '#e8e0cc');
    r.ellipse(cx, cy - 1, 2, 2, '#f8d0a4');
    r.px(cx - 2, cy - 4, 4, 2, hair);
    r.px(cx - 3, cy + 2, 6, 3, '#6a4a8a');
  }

  Interior.register('nachbarin', {
    map: [
      '################',
      '##WWWWWWWWWWWW##',
      '##WWWWWWWWWWWW##',
      '##x...xxx...xx##',   // Standuhr, Kamin, Vitrine
      '##........x...##',   // Nachbarin im Schaukelstuhl
      '##............##',
      '##....xx......##',   // Couchtisch
      '##............##',
      '##...xxx......##',   // Sofa
      '##............##',
      '##............##',
      '##x..........x##',   // Pflanze, Wollkorb
      '#######MM#######',
      '################'
    ],
    floor: { type: 'planks', a: '#9a6a44', b: '#8e603c', hi: '#ac7c52', seam: '#5e3a22', grain: '#80553a' },
    wall: { paper: '#d6e2c4', pattern: 'dots', accent: '#e8a0b0', leaf: '#7aa060', wain: '#7a5a3a', wainHi: '#9a7a52', wainLine: '#5a3e26' },
    bake: function (r) {
      L.windowPane(r, 10, '#f4f0e6', '#d8d0c0');
      L.windowLight(r, 10);
      ovalPortrait(r, 4 * TILE + 8, 26, '#5a3a20');
      ovalPortrait(r, 5 * TILE + 8, 28, '#c8c8d0');
      ovalRug(r);
      grandfatherClock(r);
      fireplace(r);
      vitrine(r);
      rockingChair(r);
      coffeeTable(r);
      sofaBack(r);
      L.plant(r, 2, 11);
      yarnBasket(r);
    },
    // Feuer im Kamin, Pendel der Standuhr, Lichtschein auf dem Boden
    anim: function (r, t) {
      var ctx = r.getCtx();
      var fx = 6 * TILE + 12, fy = 20 + 38, i;
      ctx.globalAlpha = 0.18 + 0.05 * Math.sin(t * 0.01);
      r.ellipse(6 * TILE + 24, 68, 22, 6, '#f8a040');
      ctx.globalAlpha = 1;
      for (i = 0; i < 6; i++) {
        var h = 6 + Math.round((Math.sin(t * 0.012 + i * 1.7) + 1) * 4 + hash(i, Math.floor(t / 90)) * 3);
        var x = fx + 2 + i * 4;
        r.px(x, fy - h, 3, h, '#e0502a');
        r.px(x, fy - h + 2, 3, h - 2, '#f08a30');
        r.px(x + 1, fy - h + 4, 1, Math.max(1, h - 5), '#f8d048');
      }
      var swing = Math.round(Math.sin(t * 0.004) * 1.5);
      var px = 2 * TILE + 8 + swing;
      r.px(px, 32, 1, 14, '#c8a050');
      r.ellipse(px, 47, 2, 2, '#e0b860');
    },
    npc: {
      x: 10 * TILE, y: 4 * TILE, sprites: function () { return People.neighbor(); },
      talk: {
        name: 'Nachbarin',
        texts: [
          'Früher hat man die Schulglocke bis hierher gehört.',
          'Ich habe da so ein Gefühl, dass gerade du die Schule wieder aufbauen kannst.'
        ]
      },
      // Schaukeln im Schaukelstuhl
      frame: function (t) {
        return { i: blinkFrame(t, 3400, 500), dx: 0, dy: Math.sin(t * 0.003) > 0.3 ? 1 : 0 };
      }
    }
  });

  // ===================================================================
  // Freund: Kinderzimmer mit Bett, Schreibtisch, Computer, Parabel-Poster
  // ===================================================================
  function bed(r) {
    var x = 2 * TILE + 1, y = 34, w = 2 * TILE - 2, h = 46;
    r.px(x + 2, y + h, w, 3, 'rgba(50,25,10,0.3)');
    r.px(x, y, w, h, '#2a160c');
    r.px(x + 1, y + 1, w - 2, 7, '#a06a3c');                 // Kopfteil
    r.px(x + 1, y + 1, w - 2, 1, '#c88a52');
    r.px(x + 2, y + 8, w - 4, 8, '#f4f4f4');                 // Kissen
    r.px(x + 2, y + 15, w - 4, 1, '#d0d4d8');
    r.px(x + 1, y + 17, w - 2, h - 20, '#3e6ab8');           // Decke
    r.px(x + 1, y + 17, w - 2, 2, '#6a94dc');
    for (var i = 0; i < 4; i++) {
      r.px(x + 5 + (i % 2) * 12, y + 24 + Math.floor(i / 2) * 10, 4, 4, '#f0c040');   // Sterne
      r.px(x + 6 + (i % 2) * 12, y + 23 + Math.floor(i / 2) * 10, 2, 6, '#f0c040');
    }
    r.px(x + 1, y + h - 3, w - 2, 2, '#a06a3c');
  }

  function desk(r) {
    var x = 10 * TILE, y = 36, w = 2 * TILE;
    r.px(x + 2, 64, w, 2, 'rgba(50,25,10,0.3)');
    r.px(x, y + 4, w, 24, '#2a160c');
    r.px(x + 1, y + 5, w - 2, 6, '#c89a62');                  // Tischplatte
    r.px(x + 1, y + 5, w - 2, 1, '#e0b47a');
    r.px(x + 1, y + 11, w - 2, 16, '#a07440');
    r.px(x + 3, y + 13, 12, 5, '#b8844c');                   // Schublade
    r.px(x + 8, y + 15, 2, 1, '#f0d080');
    r.px(x + 18, y + 13, 12, 13, '#3a2418');                  // Beinfreiheit
    // Computer
    r.px(x + 9, y - 10, 16, 13, '#2a2a32');
    r.px(x + 10, y - 9, 14, 10, '#24344e');
    r.px(x + 15, y + 3, 4, 2, '#4a4a54');
    r.px(x + 8, y + 7, 14, 2, '#e4e4ea');                     // Tastatur
    r.px(x + 24, y + 7, 3, 2, '#e4e4ea');                     // Maus
    r.px(x + 3, y + 1, 4, 5, '#d8443a');                      // Stiftebecher
    r.px(x + 3, y - 1, 1, 2, '#f0c040');
    r.px(x + 5, y - 2, 1, 3, '#4a7ac8');
  }

  // Poster mit Parabel y = x² (passend zum Spieltitel)
  function parabolaPoster(r) {
    var x = 6 * TILE + 4, y = 18, w = 22, h = 18;
    r.px(x, y, w, h, '#3a3a44');
    r.px(x + 1, y + 1, w - 2, h - 2, '#f8f8f2');
    var ox = x + w / 2, oy = y + h - 4;
    r.px(x + 2, oy, w - 4, 1, '#8a8a94');                     // x-Achse
    r.px(ox, y + 2, 1, h - 4, '#8a8a94');                     // y-Achse
    for (var i = -8; i <= 8; i++) {
      var py = oy - Math.round(i * i / 6);
      if (py > y + 1) r.px(ox + i, py, 1, 1, '#d8443a');
    }
  }

  function footballPoster(r) {
    var x = 3 * TILE + 8, y = 19;
    r.px(x, y, 14, 16, '#2a5a2a');
    r.px(x + 1, y + 1, 12, 14, '#4a9a4a');
    r.px(x + 1, y + 7, 12, 1, '#f4f4f4');
    r.ellipse(x + 7, y + 8, 3, 3, '#f4f4f4');
    r.px(x + 6, y + 7, 2, 2, '#22202e');
  }

  function ball(r, x, y) {
    r.ellipse(x + 3, y + 7, 4, 1, 'rgba(50,25,10,0.3)');
    r.ellipse(x + 3, y + 3, 3, 3, '#22202e');
    r.ellipse(x + 3, y + 3, 3 - 1, 3 - 1, '#f4f4f4');
    r.px(x + 2, y + 2, 2, 2, '#22202e');
    r.px(x + 1, y + 1, 1, 1, '#ffffff');
  }

  function bookStack(r, tx, ty) {
    var x = tx * TILE, y = ty * TILE;
    var cols = ['#c84a4a', '#4a7ac8', '#e0b040', '#5aa84e', '#9a5ac0'];
    r.px(x + 3, y + 15, 12, 1, 'rgba(50,25,10,0.3)');
    for (var i = 0; i < 5; i++) {
      var off = Math.round((hash(i, 9) - 0.5) * 3);
      r.px(x + 2 + off, y + 12 - i * 3, 12, 3, '#2a160c');
      r.px(x + 3 + off, y + 12 - i * 3, 10, 2, cols[i]);
      r.px(x + 3 + off, y + 13 - i * 3, 10, 1, '#f4f0e0');
    }
  }

  function toyBox(r, tx, ty) {
    var x = tx * TILE, y = ty * TILE;
    r.px(x + 2, y + 15, 13, 1, 'rgba(50,25,10,0.3)');
    r.px(x + 1, y + 5, 14, 10, '#2a160c');
    r.px(x + 2, y + 6, 12, 8, '#d8703a');
    r.px(x + 2, y + 6, 12, 1, '#f0a060');
    r.px(x + 4, y + 9, 8, 2, '#f0c040');
    r.px(x + 3, y + 2, 3, 4, '#4a7ac8');                     // Spielzeug schaut heraus
    r.px(x + 9, y + 1, 2, 5, '#e8443a');
    r.ellipse(x + 11, y + 4, 2, 2, '#5ab04a');
  }

  Interior.register('freund', {
    map: [
      '################',
      '##WWWWWWWWWWWW##',
      '##WWWWWWWWWWWW##',
      '##xx......xxxx##',   // Bett, Schreibtisch, Regal
      '##xx.......x..##',   // Bett, Schreibtischstuhl
      '##............##',
      '##.....x......##',   // Freund
      '##............##',
      '##............##',
      '##............##',
      '##............##',
      '##x..........x##',   // Bücherstapel, Spielzeugkiste
      '#######MM#######',
      '################'
    ],
    floor: { type: 'planks', a: '#d8b888', b: '#d0ae7e', hi: '#e6c89a', seam: '#a88458', grain: '#c4a070' },
    wall: { paper: '#cfe0f0', pattern: 'stripes', accent: '#bcd2ea', wain: '#5a7ab0', wainHi: '#7a9ad0', wainLine: '#3e5a8a' },
    bake: function (r) {
      L.windowPane(r, 8, '#f0c040', '#c89a20');
      L.windowLight(r, 8);
      parabolaPoster(r);
      footballPoster(r);
      r.ellipse(120, 132, 34, 18, '#3e6ab8');                 // runder Teppich
      r.ellipse(120, 132, 30, 15, '#f4f4f4');
      r.ellipse(120, 132, 24, 11, '#6a94dc');
      r.ellipse(120, 132, 10, 4, '#f4f4f4');
      bed(r);
      desk(r);
      L.shelf(r, 12 * TILE + 1, 22, 42);
      L.chairBottom(r, 11 * TILE, 4 * TILE);
      ball(r, 9 * TILE + 4, 9 * TILE + 6);
      bookStack(r, 2, 11);
      toyBox(r, 13, 11);
    },
    // flimmernder Bildschirm mit Cursor
    anim: function (r, t) {
      var x = 10 * TILE + 10, y = 27;
      for (var i = 0; i < 4; i++) {
        var len = 3 + Math.floor(hash(i, Math.floor(t / 1500)) * 9);
        r.px(x + 1, y + 1 + i * 2, len, 1, i === 0 ? '#f0c040' : '#7ad0f0');
      }
      if (Math.floor(t / 500) % 2) r.px(x + 1, y + 9, 2, 1, '#ffffff');
    },
    npc: {
      x: 7 * TILE, y: 6 * TILE, sprites: function () { return People.friend(); },
      talk: {
        name: 'Freund',
        texts: [
          'Keine Schule – klingt erst mal super, oder?',
          'Na ja … ehrlich gesagt vermisse ich sogar Mathe. Schau mal, mein Parabel-Poster!'
        ]
      },
      // leichtes Wippen auf den Fußspitzen
      frame: function (t) {
        return { i: blinkFrame(t, 2900, 900), dx: 0, dy: Math.floor(t / 600) % 2 };
      }
    }
  });

  // ===================================================================
  // Laden: Hefte, Stifte und Bücher
  // ===================================================================
  var GOODS = ['#e84a4a', '#4a7ac8', '#f0c040', '#5ab04a', '#9a5ac0', '#e88a3a', '#3ab0b0'];

  function sign(r, cx, y, label) {
    var tw = Render.textWidth(label);
    r.px(cx - tw / 2 - 3, y, tw + 6, 9, '#3a2418');
    r.px(cx - tw / 2 - 2, y + 1, tw + 4, 7, '#f4e8c8');
    Render.text(label, cx - tw / 2, y + 2, '#5a3a22');
  }

  function backShelves(r) {
    var x = 2 * TILE, y = 22, w = 12 * TILE, h = 42, i, j;
    r.px(x, 64, w, 3, 'rgba(50,25,10,0.3)');
    r.px(x, y, w, h, '#3a2418');
    r.px(x + 1, y + 1, w - 2, h - 2, '#8a5a32');
    for (j = 0; j < 3; j++) {
      var sy = y + 2 + j * 13;
      r.px(x + 2, sy, w - 4, 11, '#5a3a20');
      r.px(x + 1, sy + 11, w - 2, 2, '#a8723e');
      // links Hefte (flache Stapel), Mitte Stifte, rechts Bücher
      for (i = 0; i < 4; i++) {
        var hx = x + 4 + i * 15, col = GOODS[(i + j * 2) % GOODS.length];
        for (var k = 0; k < 3; k++) {
          r.px(hx, sy + 9 - k * 2, 12, 2, col);
          r.px(hx, sy + 10 - k * 2, 12, 1, '#f4f0e0');
        }
      }
      for (i = 0; i < 4; i++) {
        var cx = x + 4 * TILE + 4 + i * 15;
        r.px(cx, sy + 6, 9, 5, '#6a727c');
        r.px(cx, sy + 6, 9, 1, '#8a929c');
        for (k = 0; k < 5; k++) {
          r.px(cx + 1 + k * 2, sy + 1 + (k % 2), 1, 5, GOODS[(k + i + j) % GOODS.length]);
          r.px(cx + 1 + k * 2, sy + (k % 2), 1, 1, '#f4d8a8');
        }
      }
      Interior.lib.books(r, x + 8 * TILE + 2, sy + 11, x + w - 4, j + 3, GOODS);
    }
    r.px(x + 4 * TILE, y + 1, 2, h - 2, '#3a2418');
    r.px(x + 8 * TILE, y + 1, 2, h - 2, '#3a2418');
    sign(r, x + 2 * TILE, 14, 'HEFTE');
    sign(r, x + 6 * TILE, 14, 'STIFTE');
    sign(r, x + 10 * TILE, 14, 'BÜCHER');
  }

  function sideCabinet(r, tx, globe) {
    var x = tx * TILE, y = 4 * TILE;
    r.px(x + 1, y + 2, 14, 14, '#2a160c');
    r.px(x + 2, y + 3, 12, 12, '#9a6a3c');
    r.px(x + 2, y + 3, 12, 2, '#c89a62');
    if (globe) {
      r.px(x + 7, y - 2, 2, 5, '#5a3a20');
      r.ellipse(x + 8, y - 5, 5, 5, '#2a5a9a');
      r.ellipse(x + 7, y - 6, 2, 2, '#5ab04a');
      r.px(x + 9, y - 4, 2, 2, '#5ab04a');
    } else {
      r.px(x + 4, y - 4, 8, 7, '#3e8a5a');                    // Radiergummi-Kiste
      r.px(x + 5, y - 3, 2, 2, '#f08cb4');
      r.px(x + 8, y - 3, 2, 2, '#f4f4f4');
      r.px(x + 6, y, 2, 2, '#9cc8ff');
    }
  }

  function displayTable(r, tx, ty, kind) {
    var x = tx * TILE + 1, y = ty * TILE + 1, w = 2 * TILE - 2, i;
    r.px(x + 2, y + 15, w, 2, 'rgba(50,25,10,0.3)');
    r.px(x, y, w, 15, '#2a160c');
    r.px(x + 1, y + 1, w - 2, 9, '#c89a62');
    r.px(x + 1, y + 10, w - 2, 4, '#8a5a32');
    if (kind === 'hefte') {
      for (i = 0; i < 4; i++) {
        r.px(x + 3 + i * 7, y + 3 - (i % 2), 6, 7, GOODS[i]);
        r.px(x + 4 + i * 7, y + 5 - (i % 2), 4, 1, '#f4f0e0');
      }
    } else {
      for (i = 0; i < 3; i++) {
        r.px(x + 3 + i * 9, y + 1, 8, 8, '#2a160c');
        r.px(x + 4 + i * 9, y + 2, 6, 6, GOODS[i + 3]);
        r.px(x + 4 + i * 9, y + 2, 1, 6, 'rgba(0,0,0,0.25)');
      }
    }
    r.px(x + w - 7, y + 7, 6, 4, '#f4f4f4');                  // Preisschild
    r.px(x + w - 6, y + 8, 4, 1, '#c82828');
  }

  function pencilStand(r, tx, ty) {
    var x = tx * TILE, y = ty * TILE;
    r.px(x + 3, y + 15, 12, 1, 'rgba(50,25,10,0.3)');
    r.px(x + 3, y + 6, 10, 10, '#2a2a32');
    r.px(x + 4, y + 7, 8, 8, '#6a727c');
    for (var i = 0; i < 4; i++) {
      r.px(x + 4 + i * 2, y - 2 + (i % 2) * 2, 2, 9, GOODS[i]);
      r.px(x + 4 + i * 2, y - 3 + (i % 2) * 2, 2, 1, '#f4d8a8');
      r.px(x + 4 + i * 2, y - 4 + (i % 2) * 2, 1, 1, '#2a2030');
    }
  }

  // Ladentheke liegt über dem Verkäufer (Überlagerungsebene)
  function counter(r) {
    var x = 5 * TILE, y = 5 * TILE - 6, w = 6 * TILE;
    r.px(x + 2, y + 22, w, 2, 'rgba(50,25,10,0.3)');
    r.px(x, y, w, 22, '#2a160c');
    r.px(x + 1, y + 1, w - 2, 6, '#d8b07a');
    r.px(x + 1, y + 1, w - 2, 1, '#f0cc94');
    r.px(x + 1, y + 7, w - 2, 14, '#8a5a32');
    for (var i = x + 8; i < x + w - 4; i += 16) r.px(i, y + 9, 10, 10, '#9a6a3c');
    // Kasse
    r.px(x + 64, y - 8, 18, 12, '#2a2a32');
    r.px(x + 65, y - 7, 16, 10, '#8a929c');
    r.px(x + 66, y - 6, 8, 3, '#7ad08a');
    for (i = 0; i < 3; i++) r.px(x + 67 + i * 4, y - 1, 3, 2, '#e4e4ea');
    // Glas mit Stiften, Heftstapel, Klingel
    r.px(x + 12, y - 6, 8, 9, '#a8c8d8');
    for (i = 0; i < 3; i++) r.px(x + 13 + i * 2, y - 9 + (i % 2), 1, 6, GOODS[i]);
    r.px(x + 28, y - 1, 14, 5, '#4a7ac8');
    r.px(x + 29, y - 3, 12, 3, '#e84a4a');
    r.ellipse(x + 50, y + 1, 3, 2, '#e0b040');
    r.px(x + 50, y - 2, 1, 2, '#e0b040');
  }

  Interior.register('laden', {
    map: [
      '################',
      '##WWWWWWWWWWWW##',
      '##WWWWWWWWWWWW##',
      '##xxxxxxxxxxxx##',   // Regale mit Heften, Stiften, Büchern
      '##..x...x..x..##',   // Seitenschränke, Verkäufer
      '##...xxxxxx...##',   // Ladentheke
      '##............##',
      '##............##',
      '##.xx......xx.##',   // Auslagetische
      '##............##',
      '##............##',
      '##x..........x##',   // Stifteständer, Pflanze
      '#######MM#######',
      '################'
    ],
    floor: { type: 'tiles', a: '#e0d8c8', b: '#c8bca8', hi: '#ece6da', seam: '#a89c88' },
    wall: { paper: '#f4ecd8', pattern: 'stripes', accent: '#ece0c4', wain: '#6a8a5a', wainHi: '#8aaa7a', wainLine: '#4a6a3a' },
    bake: function (r) {
      backShelves(r);
      sideCabinet(r, 4, false);
      sideCabinet(r, 11, true);
      displayTable(r, 3, 8, 'hefte');
      displayTable(r, 11, 8, 'buecher');
      pencilStand(r, 2, 11);
      L.plant(r, 13, 11);
    },
    bakeOverlay: function (r) {
      counter(r);
    },
    npc: {
      x: 8 * TILE, y: 4 * TILE, sprites: function () { return People.shopkeeper(); },
      talkTiles: [[7, 5], [8, 5], [9, 5]],   // über die Theke hinweg
      talk: {
        name: 'Verkäufer',
        texts: [
          'Willkommen! Hefte, Stifte, Bücher – alles da.',
          'Ohne Schule kauft leider kaum jemand etwas. Kaufen geht noch nicht.'
        ]
      },
      frame: function (t) {
        return { i: blinkFrame(t, 3100, 0), dx: Math.sin(t * 0.0012) > 0.6 ? 1 : 0, dy: 0 };
      }
    }
  });

})();
