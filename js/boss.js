// boss.js: Bosse der Dungeons - je Boss-Raum eine feste Instanz
// Boss.register(raum, def) meldet einen Boss mit Herzpunkten, Position und
// Zeichnung an (raum = Boss-Raum, z. B. 'dboss'). Boss.of(raum) liefert die
// Instanz mit den bekannten Methoden (startFight, damage, die, draw ...).
// Jede richtige Antwort kostet den Boss ein Herz, das Schwert wirkt bei
// Bossen nicht. Nach dem Sieg oeffnet sich das Tor.
var Boss = (function () {
  'use strict';

  var byRoom = {};   // Raum -> Instanz

  // Kleines Herz: gefuellt oder leer (Form, nicht nur Farbe)
  function heart(r, cx, cy, full) {
    var col = full ? '#e8344a' : '#55506a';
    r.px(cx - 2, cy, 2, 2, col);
    r.px(cx + 1, cy, 2, 2, col);
    r.px(cx - 2, cy + 2, 5, 1, col);
    r.px(cx - 1, cy + 3, 3, 1, col);
    r.px(cx, cy + 4, 1, 1, col);
  }

  // Eine Instanz: Herzpunkte, Besiegt-Animation und Zeichnung aus def.
  // def = { maxHp, x, y, cx, cy, hearts: {x, y}, drawLiving(r, def, inst, now, alpha),
  //         drawDying(r, def, inst, now) }
  //   x, y   = linke obere Ecke der Zeichnung
  //   cx, cy = Mittelpunkt fuer Beruehrung und Rueckstoss
  function create(def) {
    var hp = def.maxHp;
    var defeated = false;
    var fighting = false;
    var dieT = 0;            // Startzeit der Besiegt-Animation

    var inst = {
      def: def,

      startFight: function () { fighting = true; },
      // Richtige Antwort: ein Herz weg, Restherz bleibt
      damage: function () { hp = Math.max(0, hp - 1); fighting = hp > 0; return hp; },
      // Wievielte Aufgabe ist dran (0 bis maxHp - 1)
      index: function () { return def.maxHp - hp; },
      die: function () { fighting = false; defeated = true; dieT = performance.now(); },
      isFighting: function () { return fighting; },
      isDefeated: function () { return defeated; },
      // Startzeit der Besiegt-Animation (fuer die Zeichnung der Instanz)
      dieStart: function () { return dieT; },
      // Spielstand laden: Boss ist schon besiegt (ohne Animation)
      setDefeated: function () { hp = 0; defeated = true; fighting = false; dieT = 0; },

      // Herzleiste unter dem Boss (Position aus def.hearts)
      drawHearts: function (r, alpha) {
        var ctx = r.getCtx();
        if (alpha !== undefined) ctx.globalAlpha = alpha;
        for (var i = 0; i < def.maxHp; i++) {
          heart(r, def.hearts.x + i * 7, def.hearts.y, i < hp);
        }
        if (alpha !== undefined) ctx.globalAlpha = 1;
      },

      // Alles zusammen: lebend, im Kampf mit Herzen, oder beim Zerfallen
      draw: function (r, now) {
        if (defeated) {
          if (now - dieT < 1500) def.drawDying(r, def, inst, now);
          return;
        }
        def.drawLiving(r, def, inst, now, undefined);
        inst.drawHearts(r);
      }
    };
    return inst;
  }

  function register(room, def) {
    byRoom[room] = create(def);
    return byRoom[room];
  }

  // Instanz im Boss-Raum (null, wenn der Raum keinen Boss hat)
  function of(room) {
    return byRoom[room] || null;
  }

  // Alle Instanzen durchgehen (fuer das Speichern)
  function each(fn) {
    var rooms = Object.keys(byRoom);
    for (var i = 0; i < rooms.length; i++) fn(rooms[i], byRoom[rooms[i]]);
  }

  return { register: register, of: of, each: each };
})();

// --- Waechter der Hoehle der Parabeln (Dungeon 1, Raum 'dboss') ------------
// Schwebende Statue: dunkler Stein, leuchtende Augen, Parabel auf der Brust.
// Zeichnung und Werte entsprechen dem urspruenglichen Boss der Hoehle.
(function () {
  'use strict';

  var X = 102, Y = 60;     // linke obere Ecke; Bildmitte (112, 72), Mitte (112, 74)

  // Schwebe-Statue (hp = restliche Herzen, alpha = Abblenden beim Zerfallen)
  function drawLiving(r, def, inst, now, alpha) {
    var ctx = r.getCtx();
    var hp = def.maxHp - inst.index();
    var bob = Math.round(Math.sin(now / 500) * 2);
    var x = X, y = Y + bob;
    if (alpha !== undefined) ctx.globalAlpha = alpha;

    // Schatten auf dem Hoehlenboden
    ctx.globalAlpha = (alpha === undefined ? 1 : alpha) * 0.35;
    r.ellipse(112, 90, 12, 3, '#000000');
    ctx.globalAlpha = alpha === undefined ? 1 : alpha;

    // Arme aus Stein
    r.px(x - 3, y + 8, 5, 13, '#3a3546');
    r.px(x + 18, y + 8, 5, 13, '#3a3546');
    r.px(x - 3, y + 8, 5, 1, '#524c60');
    r.px(x + 18, y + 8, 5, 1, '#524c60');

    // Kopf mit leuchtenden Augen
    r.px(x + 5, y, 10, 8, '#5a5468');
    r.px(x + 5, y, 10, 1, '#6e6880');
    r.px(x + 6, y + 7, 8, 1, '#3e3a4a');
    var eye = hp > 1 ? '#6ae0f0' : hp === 1 ? '#e8443a' : '#55506a';
    r.px(x + 6, y + 3, 2, 2, eye);
    r.px(x + 12, y + 3, 2, 2, eye);
    r.px(x + 6, y + 3, 1, 1, '#d8f8ff');
    r.px(x + 12, y + 3, 1, 1, '#d8f8ff');

    // Rumpf
    r.px(x + 2, y + 8, 16, 13, '#4a4456');
    r.px(x + 2, y + 8, 16, 1, '#5e5870');
    r.px(x + 3, y + 9, 2, 4, '#5e5870');

    // Parabel-Glyphe auf der Brust (goldene Kurve)
    for (var i = -3; i <= 3; i++) {
      r.px(x + 10 + i, y + 17 - Math.round(i * i * 0.5), 1, 1, '#f0c040');
    }

    // Risse je nach erlittenem Schaden
    if (hp <= 2) {
      r.px(x + 13, y + 10, 1, 4, '#2c2838');
      r.px(x + 14, y + 13, 1, 3, '#2c2838');
    }
    if (hp === 1) {
      r.px(x + 5, y + 12, 3, 1, '#2c2838');
      r.px(x + 7, y + 13, 1, 4, '#2c2838');
      r.px(x + 11, y + 17, 4, 1, '#2c2838');
    }

    // Schwebender Unterbau, nach unten schmaler werdend
    r.px(x + 4, y + 21, 12, 3, '#3e3a4a');
    r.px(x + 6, y + 24, 8, 2, '#332f40');
    r.px(x + 8, y + 26, 4, 1, '#332f40');

    ctx.globalAlpha = 1;
  }

  // Besiegt-Animation: Statue sackt ab und zerfaellt in Staub und Stein
  function drawDying(r, def, inst, now) {
    var t = (now - inst.dieStart()) / 1000;
    if (t > 1.4) return;
    var ctx = r.getCtx();
    var p = Math.min(1, t / 1.2);
    drawLiving(r, def, inst, inst.dieStart() + 1, Math.max(0, 1 - p));   // einfrieren, abblenden
    // Staubwolke, die nach oben zieht
    ctx.globalAlpha = Math.max(0, 0.7 - p * 0.7);
    for (var i = 0; i < 5; i++) {
      var wx = 96 + i * 8 + Math.sin(i * 2) * 3;
      var wy = 78 - p * 24 + Math.cos(i * 3) * 4;
      r.ellipse(wx, wy, 4 + p * 3, 3 + p * 2, '#cfc8d8');
    }
    ctx.globalAlpha = 1;
  }

  Boss.register('dboss', {
    maxHp: 3,          // eine feste Aufgabe = ein Herz
    x: X, y: Y,        // linke obere Ecke der Zeichnung (Rueckstoss)
    cx: 112, cy: 74,   // Bildmitte fuer die Beruehrung
    hearts: { x: 100, y: 94 },
    drawLiving: drawLiving,
    drawDying: drawDying
  });
})();

// --- Waechter des Turms, die Laterne des Leuchtturms (Dungeon 2, 'lboss') ---
// Schwebende Laterne: dunkles Gestell, warmes Glas, im Kern die Flamme,
// die nach dem Sieg in den Spiegel zurueckkehrt und den Turm wieder entzuendet.
(function () {
  'use strict';

  var X = 102, Y = 60;     // linke obere Ecke; Bildmitte (112, 72), Punkte (112, 74)

  function drawLiving(r, def, inst, now, alpha) {
    var ctx = r.getCtx();
    var hp = def.maxHp - inst.index();
    var bob = Math.round(Math.sin(now / 500) * 2);
    var x = X, y = Y + bob;
    if (alpha !== undefined) ctx.globalAlpha = alpha;

    // warmer Lichtschein auf den Boden unter der Laterne
    ctx.globalAlpha = (alpha === undefined ? 1 : alpha) * (0.16 + 0.04 * (Math.floor(now / 200) % 2));
    r.ellipse(112, 92, 16, 5, '#f0b050');
    ctx.globalAlpha = alpha === undefined ? 1 : alpha;

    // Aufhaengung und Ring
    r.px(x + 10, y - 4, 1, 6, '#3a3644');
    r.px(x + 8, y, 8, 2, '#4a4456');

    // Laternenkoerper: dunkles Gestell mit warmem Glas (dunkelt bei Schaden)
    r.px(x + 5, y + 2, 14, 18, '#3a3644');
    var glas = hp > 1 ? '#f6c04a' : '#e08a3a';
    var kern = hp > 1 ? '#f8e88a' : '#f0b050';
    r.px(x + 7, y + 4, 10, 14, glas);
    r.px(x + 9, y + 7, 6, 8, kern);
    // flackernde Flamme im Kern
    var fl = Math.floor(now / 120) % 3;
    r.px(x + 11 + Math.floor(fl / 2), y + 9, 2, 4, '#ffffff');
    // Stege des Gestells
    r.px(x + 5, y + 8, 14, 1, '#3a3644');
    r.px(x + 5, y + 14, 14, 1, '#3a3644');
    r.px(x + 11, y + 2, 1, 18, '#3a3644');
    // Dach und Fuss
    r.px(x + 6, y + 1, 12, 1, '#4a4456');
    r.px(x + 6, y + 20, 12, 1, '#4a4456');

    // Risse im Glas je nach erlittenem Schaden
    if (hp <= 2) {
      r.px(x + 8, y + 5, 1, 5, '#2c2838');
      r.px(x + 9, y + 9, 2, 1, '#2c2838');
    }
    if (hp === 1) {
      r.px(x + 14, y + 12, 1, 4, '#2c2838');
      r.px(x + 12, y + 16, 3, 1, '#2c2838');
    }

    ctx.globalAlpha = 1;
  }

  // Besiegt-Animation: Das Licht loest sich, Funken regnen nach unten
  function drawDying(r, def, inst, now) {
    var t = (now - inst.dieStart()) / 1000;
    if (t > 1.4) return;
    var ctx = r.getCtx();
    var p = Math.min(1, t / 1.2);
    drawLiving(r, def, inst, inst.dieStart() + 1, Math.max(0, 1 - p));   // einfrieren, abblenden
    // goldene Funken, die nach unten ziehen
    ctx.globalAlpha = Math.max(0, 0.8 - p * 0.8);
    for (var i = 0; i < 7; i++) {
      var fx = 96 + i * 6 + (i % 2) * 3;
      var fy = 66 + p * 30 + Math.sin(i * 3 + p * 4) * 3;
      r.px(fx, fy, 1, 1, '#fff2a0');
      r.px(fx - 1, fy, 1, 1, '#ffffff');
    }
    ctx.globalAlpha = 1;
  }

  Boss.register('lboss', {
    maxHp: 3,          // eine feste Aufgabe = ein Herz
    x: X, y: Y,        // linke obere Ecke der Zeichnung (Rueckstoss)
    cx: 112, cy: 74,   // Bildmitte fuer die Beruehrung
    hearts: { x: 100, y: 94 },
    drawLiving: drawLiving,
    drawDying: drawDying
  });
})();

// --- Waechter des Wasserreichs, die Perle in der Muschel (Dungeon 3, 'wboss')
// Schwebende Riesenmuschel mit leuchtender Perle. Nach dem Sieg kehrt die
// Perle in die Bildtafel zurueck und das Wasser fliesst wieder in Kurven.
(function () {
  'use strict';

  var X = 102, Y = 60;     // linke obere Ecke; Bildmitte (112, 72), Punkte (112, 74)

  function drawLiving(r, def, inst, now, alpha) {
    var ctx = r.getCtx();
    var hp = def.maxHp - inst.index();
    var bob = Math.round(Math.sin(now / 500) * 2);
    var x = X, y = Y + bob;
    if (alpha !== undefined) ctx.globalAlpha = alpha;

    // welliger Lichtschein auf dem Boden
    ctx.globalAlpha = (alpha === undefined ? 1 : alpha) * (0.2 + 0.05 * (Math.floor(now / 250) % 2));
    r.ellipse(112, 92, 16, 5, '#8ad8e8');
    ctx.globalAlpha = alpha === undefined ? 1 : alpha;

    // Rueckenschale der Muschel
    r.px(x + 4, y + 2, 16, 14, '#7a6a8a');
    r.px(x + 5, y + 3, 14, 12, '#9a8aaa');
    r.px(x + 7, y + 4, 10, 1, '#b8aabc');
    // Riffkanten an der Schale (mehr Risse bei Schaden)
    r.px(x + 6, y + 7, 12, 1, '#6a5a7a');
    r.px(x + 7, y + 11, 10, 1, '#6a5a7a');
    if (hp <= 2) r.px(x + 9, y + 8, 1, 4, '#4a3a5a');
    if (hp === 1) {
      r.px(x + 14, y + 5, 1, 5, '#4a3a5a');
      r.px(x + 11, y + 12, 4, 1, '#4a3a5a');
    }

    // Innenseite und leuchtende Perle (wird bei Schaden dunkler)
    r.px(x + 6, y + 8, 12, 8, '#e8dce8');
    var perl = hp > 1 ? '#f4f0f4' : '#c8b4c4';
    r.ellipse(x + 12, y + 11, 4, 3, perl);
    r.ellipse(x + 11, y + 10, 1, 1, '#ffffff');
    // Perle leuchtet im Takt
    ctx.globalAlpha = (alpha === undefined ? 1 : alpha) * (0.15 + 0.08 * (Math.floor(now / 300 + hp) % 2));
    r.ellipse(x + 12, y + 11, 7, 5, '#f0e4f0');
    ctx.globalAlpha = alpha === undefined ? 1 : alpha;

    // Augen in der Schalenkante
    var eye = hp > 1 ? '#6ae0f0' : '#e8443a';
    r.px(x + 6, y + 5, 2, 2, eye);
    r.px(x + 16, y + 5, 2, 2, eye);

    ctx.globalAlpha = 1;
  }

  // Besiegt-Animation: Die Muschel oeffnet sich ganz, die Perle loest sich
  // und zerrinnt in Wasser, das in Kurven davonrieselt
  function drawDying(r, def, inst, now) {
    var t = (now - inst.dieStart()) / 1000;
    if (t > 1.4) return;
    var ctx = r.getCtx();
    var p = Math.min(1, t / 1.2);
    drawLiving(r, def, inst, inst.dieStart() + 1, Math.max(0, 1 - p));   // einfrieren, abblenden
    // Wassertropfen ziehen in Kurven davon
    ctx.globalAlpha = Math.max(0, 0.8 - p * 0.8);
    for (var i = 0; i < 6; i++) {
      var cx = 104 + i * 4;
      var cy = 70 + p * 26 + Math.sin(i + p * 5) * 4 * p;
      r.ellipse(cx, cy, 2, 2, '#b8e0f0');
    }
    ctx.globalAlpha = 1;
  }

  Boss.register('wboss', {
    maxHp: 3,          // eine feste Aufgabe = ein Herz
    x: X, y: Y,        // linke obere Ecke der Zeichnung (Rueckstoss)
    cx: 112, cy: 74,   // Bildmitte fuer die Beruehrung
    hearts: { x: 100, y: 94 },
    drawLiving: drawLiving,
    drawDying: drawDying
  });
})();

// ---Waechter des Sandtempels, die goldene Sanduhr (Dungeon 4, 'sboss') -------
// Schwebende Sanduhr aus Gold: im oberen Glas der gerade Sand, unten waechst
// der Bannhaufe. Nach dem Sieg rieselt der Sand in sanften Boegen.
(function () {
  'use strict';

  var X = 102, Y = 60;     // linke obere Ecke; Bildmitte (112, 72), Punkte (112, 74)

  function drawLiving(r, def, inst, now, alpha) {
    var ctx = r.getCtx();
    var hp = def.maxHp - inst.index();
    var bob = Math.round(Math.sin(now / 500) * 2);
    var x = X, y = Y + bob;
    if (alpha !== undefined) ctx.globalAlpha = alpha;

    // warmer Lichtschein auf dem Tempelboden
    ctx.globalAlpha = (alpha === undefined ? 1 : alpha) * (0.16 + 0.04 * (Math.floor(now / 250) % 2));
    r.ellipse(112, 92, 16, 5, '#f0b050');
    ctx.globalAlpha = alpha === undefined ? 1 : alpha;

    // Augen ueber dem oberen Glas
    var eye = hp > 1 ? '#6ae0f0' : '#e8443a';
    r.px(x + 6, y + 1, 2, 2, eye);
    r.px(x + 16, y + 1, 2, 2, eye);

    // Rahmen der Sanduhr: zwei Kegelstummel aus Gold
    var gold = hp > 1 ? '#e8c04a' : '#c89838';
    var hell = hp > 1 ? '#f8e088' : '#e0b858';
    // oberes Glas
    r.px(x + 4, y + 3, 16, 2, gold);
    r.px(x + 5, y + 5, 14, 2, hell);
    r.px(x + 7, y + 7, 10, 2, gold);
    r.px(x + 9, y + 9, 6, 1, hell);
    // Hals
    r.px(x + 11, y + 10, 2, 3, gold);
    // unteres Glas (mehr Sand je nach restlichen Herzen)
    r.px(x + 9, y + 13, 6, 1, hell);
    r.px(x + 7, y + 14, 10, 2, gold);
    r.px(x + 5, y + 16, 14, 3, hell);
    r.px(x + 4, y + 19, 16, 3, gold);
    // Sand: oben weniger, unten mehr (Sand fliesst pro verlorener Aufgabe)
    var oben = hp, unten = def.maxHp - hp + 2;
    for (var i = 0; i < oben; i++) r.px(x + 6 + i * 2, y + 5, 1, 1, '#f6e8c0');
    for (var j = 0; j < unten; j++) r.px(x + 6 + j * 2, y + 16, 1, 2, '#f6e8c0');
    // fallender Sandfaden im Hals
    var fl = Math.floor(now / 150) % 2;
    r.px(x + 11, y + 12 + fl, 2, 1, '#f6e8c0');
    // Risse im Gold bei Schaden
    if (hp <= 2) r.px(x + 7, y + 8, 1, 4, '#8a6434');
    if (hp === 1) r.px(x + 15, y + 15, 1, 5, '#8a6434');

    ctx.globalAlpha = 1;
  }

  // Besiegt-Animation: Die Sanduhr dreht sich, der Sand rieselt in Boegen davon
  function drawDying(r, def, inst, now) {
    var t = (now - inst.dieStart()) / 1000;
    if (t > 1.4) return;
    var ctx = r.getCtx();
    var p = Math.min(1, t / 1.2);
    drawLiving(r, def, inst, inst.dieStart() + 1, Math.max(0, 1 - p));   // einfrieren, abblenden
    // Sandkoerner ziehen in sanften Boegen davon
    ctx.globalAlpha = Math.max(0, 0.8 - p * 0.8);
    for (var i = 0; i < 8; i++) {
      var sx = 100 + i * 4;
      var sy = 66 + p * 28 + Math.sin(i + p * 5) * 5 * p;
      r.px(sx, sy, 1, 1, '#f6e8c0');
      r.px(sx + 1, sy + 1, 1, 1, '#e8c04a');
    }
    ctx.globalAlpha = 1;
  }

  Boss.register('sboss', {
    maxHp: 3,          // eine feste Aufgabe = ein Herz
    x: X, y: Y,        // linke obere Ecke der Zeichnung (Rueckstoss)
    cx: 112, cy: 74,   // Bildmitte fuer die Beruehrung
    hearts: { x: 100, y: 94 },
    drawLiving: drawLiving,
    drawDying: drawDying
  });
})();
