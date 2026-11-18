// enemies.js: Gegner auf dem Weg zum ersten Dungeon
// Je Bildschirm eigene Gegner mit passendem Aussehen und festem Aufgabentyp
// (von leicht nach schwer). Beruehrt die Spielfigur ein Gegner, startet der
// Kampf: Das Spiel pausiert und zeigt genau eine Aufgabe (taskui.js).
// Richtig geloest = Gegner dauerhaft besiegt, sonst bleibt er stehen und
// die Aufgabe kommt spaeter mit neuen Zahlen wieder.
// Besiegt-Animation: Gegner blitzt weiss auf und zerfaellt in eine
// Rauchwolke mit Funken; ein Herz-Drop springt danach aus der Wolke.
var Enemies = (function () {
  'use strict';

  var TILE = 16;
  var SIZE = 16;
  var SPEED = 18;            // Pixel pro Sekunde, langsamer als die Spielfigur
  var TURN_MIN = 0.8;        // Sekunden bis zur moeglichen Richtungsaenderung
  var TURN_MAX = 2.0;
  var COOLDOWN = Config.ENEMY_COOLDOWN;   // Sekunden ohne neue Beruehrung nach einem Kampf
  var TOUCH = 13;            // Ueberlappung in Pixeln, die als Beruehrung zaehlt

  // Feste Aufgabentypen je Bildschirm, von leicht zu schwer,
  // passend zum Merksatz des Erklaer-NPCs auf dem jeweiligen Bildschirm
  var TYPES = {
    wiese: 'normalPunkt',       // Wanderin: Normalparabel y = x²
    wald: 'aBeschreibung',      // Foerster: a streckt/staucht, Oeffnung
    ruine: 'scheitelAblesen',   // Einsiedler: Scheitelform, S(xs|ys)
    dhalle: 'aBestimmen',       // Forscherin: P einsetzen, a berechnen
    dmittel: 'spfAufstellen',   // Alte Inschrift: Scheitelform aufstellen
    felder: 'spfAusS',          // Gaertnerin: Scheitelform aus S und a
    klippen: 'spfAusSP',        // Fischer: Scheitelform aus S und P
    kueste: 'wertemenge'        // Turmwaerter: Wertemenge am Scheitel
  };

  // Kurzer Kontext vor der Aufgabe (die Wesen stehen im Bann von Graf Gerade)
  var KONTEXT = {
    wiese: 'Ein verzaubertes Pilzwesen fragt:',
    wald: 'Ein verhexter Moosgeist fragt:',
    ruine: 'Ein Steingolem knirscht:',
    dhalle: 'Eine Fledermaus kreischt:',
    dmittel: 'Ein Kristallgeist summt:',
    felder: 'Ein Strohgolem raschelt:',
    klippen: 'Ein Klippengeist heult:',
    kueste: 'Ein Krabbengeist scharrt:'
  };

  // --- Sprites (16x16, ein Frame; Bewegung ueber Wippen) ---------------------

  // Pilzwesen (Wiese): roter Hut mit Punkten, cremefarbener Stiel
  var MUSHROOM = [
    '................',
    '.....oooooo.....',
    '...oorrrrrroo...',
    '..orrwrrrrwrro..',
    '.orrwrrrrrrwrro.',
    '.oRRrrrrrrrrRRo.',
    '..oRRRRRRRRRRo..',
    '...oooooooooo...',
    '....osssssso....',
    '....osesseso....',
    '....osssssso....',
    '....osssssso....',
    '....oSSSSSSo....',
    '.....oooooo.....',
    '................',
    '................'
  ];
  var MUSHROOM_COLORS = {
    o: '#2a1420', r: '#d8443c', R: '#a02c34', w: '#f6f0e2',
    s: '#f0dcc0', S: '#cfae86', e: '#2a1420'
  };

  // Moosgeist (Wald): grüner Buckel mit Blatt auf dem Kopf
  var MOSS = [
    '................',
    '.......L........',
    '......oLo.......',
    '.....oLLo.......',
    '...oogggoo......',
    '..oggggggggo....',
    '.ogghggggghgo...',
    '.oggggggggggo...',
    '.ogweggggweggo..',
    '.oggggggggggo...',
    '.ogghgggghggo...',
    '..oggggggggo....',
    '...ooggoo.......',
    '....oo..oo......',
    '................',
    '................'
  ];
  var MOSS_COLORS = {
    o: '#16301c', g: '#3f7c34', h: '#7cb854', L: '#a8d878',
    w: '#ffffff', e: '#16301c'
  };

  // Steingolem (Ruine): bröckelnder Steinblock mit leuchtenden Augen
  var GOLEM = [
    '................',
    '..oooooooo......',
    '.ogggggggo......',
    '.oghggghgo......',
    '.oggggggggo.....',
    '.owegggwego.....',
    '.oggggggggo.....',
    '..oggddggo......',
    '...ooooooo......',
    '..ogggggggo.....',
    '.oggghgggggo....',
    '.oghgggghgggo...',
    '.ogggggggggo....',
    '..ogggggggo.....',
    '...oooooooo.....',
    '................'
  ];
  var GOLEM_COLORS = {
    o: '#2e2a34', g: '#8a8496', h: '#b4aec2', d: '#4a4452',
    w: '#ffd858', e: '#7a2a20'
  };

  // Fledermaus der Eingangshalle: dunkle Schwingen, gelbe Augen
  var BAT = [
    '................',
    '................',
    '................',
    '..p..........p..',
    '..pp........pp..',
    '..ppp......ppp..',
    '..ppppbbbbpppp..',
    '..pppbbbbbbppp..',
    '...ppbybbybpp...',
    '....bbbbbb......',
    '....b.bb.b......',
    '.....bbbb.......',
    '......bb........',
    '................',
    '................',
    '................'
  ];
  var BAT_COLORS = { p: '#3e3054', b: '#5e4a78', y: '#f6d64a' };

  // Kristallgeist im Mittelraum: schwebender Kristall mit dunklen Augen
  var CRYSTAL = [
    '................',
    '.......cc.......',
    '......cwwc......',
    '.....cwwwwc.....',
    '.....cwwwwc.....',
    '....ccwwwwcc....',
    '....cwewwewc....',
    '....cwwwwwwc....',
    '....cwwwwwwc....',
    '.....cwwwwc.....',
    '....ccwwwwcc....',
    '....c..cc..c....',
    '......cccc......',
    '.......cc.......',
    '................',
    '................'
  ];
  var CRYSTAL_COLORS = { c: '#2a6a7a', w: '#8ed8e8', e: '#1c2a3a' };

  // Strohgolem (Felder): Ballen aus Stroh mit krummer Naht
  var STRAW = [
    '................',
    '....oooooooo....',
    '...ossssssoo....',
    '..oshsssshso....',
    '.osssssssssso...',
    '.osecssecsso....',
    '.osssssssssso...',
    '.osddssddsso....',
    '..osssssssso....',
    '.oshssssssho....',
    '.osssshssssso...',
    '..osddddsso.....',
    '..osssssssso....',
    '...oo...oo......',
    '................',
    '................'
  ];
  var STRAW_COLORS = {
    o: '#6a4a18', s: '#e8c458', h: '#d8a838', d: '#b8902c',
    e: '#2a1420', c: '#7ad86a'
  };

  // Klippengeist (Klippenweg): felsiger Geist mit dunklen Augen
  var CLIFF = [
    '................',
    '.....oooooo.....',
    '...ooggggggoo...',
    '..oggggggggggo..',
    '..ogweggweggo...',
    '.oggggggggggo...',
    '.oghhgggggho....',
    '.ogggdddggggo...',
    '..oggggggggo....',
    '..oghgggggho....',
    '...oggggggo.....',
    '...og.gg.go.....',
    '....o..o..o.....',
    '................',
    '................',
    '................'
  ];
  var CLIFF_COLORS = {
    o: '#2e3a44', g: '#8a96a2', h: '#b4c0ca', d: '#5a666e',
    w: '#f0f4f8', e: '#101c2c'
  };

  // Krabbengeist (Kueste): rote Krabbe mit Scheren und Stielaugen
  var CRAB = [
    '................',
    '..c..........c..',
    '..cc........cc..',
    '...c..cccc..c...',
    '....ccccccccc...',
    '...cccccccccc...',
    '..ccecc..ccecc..',
    '..ccccccccccc...',
    '..cccccccccc....',
    '...cccccccc.....',
    '...c.c..c.c.....',
    '..c..c..c..c....',
    '................',
    '................',
    '................',
    '................'
  ];
  var CRAB_COLORS = { c: '#d8443c', e: '#f6d64a' };

  var SPRITES = {
    wiese: { rows: MUSHROOM, colors: MUSHROOM_COLORS },
    wald: { rows: MOSS, colors: MOSS_COLORS },
    ruine: { rows: GOLEM, colors: GOLEM_COLORS },
    dhalle: { rows: BAT, colors: BAT_COLORS },
    dmittel: { rows: CRYSTAL, colors: CRYSTAL_COLORS },
    felder: { rows: STRAW, colors: STRAW_COLORS },
    klippen: { rows: CLIFF, colors: CLIFF_COLORS },
    kueste: { rows: CRAB, colors: CRAB_COLORS }
  };
  var spriteCache = {};
  var flashCache = {};   // weisse Silhouette fuer das Aufblitzen

  function spriteOf(screen) {
    if (!spriteCache[screen]) {
      var s = SPRITES[screen];
      spriteCache[screen] = Render.sprite(s.rows, s.colors, false);
    }
    return spriteCache[screen];
  }

  function flashOf(screen) {
    if (!flashCache[screen]) {
      var s = SPRITES[screen];
      var white = {};
      Object.keys(s.colors).forEach(function (k) { white[k] = '#ffffff'; });
      flashCache[screen] = Render.sprite(s.rows, white, false);
    }
    return flashCache[screen];
  }

  // Zeiten der Besiegt-Animation in Millisekunden
  var FLASH_MS = 320;    // Aufblitzen (weiss/normal im Wechsel, leichtes Zittern)
  var POOF_MS = 480;     // Rauchwolke mit Funken
  var DROP_HOP_MS = 300; // Herz springt aus der Wolke

  // --- Gegner-Definition je Bildschirm ---------------------------------------
  // Startposition in Kacheln; Bewegung passiert nur auf freien Kacheln.

  var DEFS = {
    wiese: [
      { x: 4, y: 8 },
      { x: 11, y: 10 }
    ],
    wald: [
      { x: 4, y: 5 },
      { x: 12, y: 7 }
    ],
    ruine: [
      { x: 4, y: 8 },
      { x: 12, y: 10 },
      { x: 8, y: 12 }
    ],
    dhalle: [
      { x: 4, y: 4 },
      { x: 12, y: 8 }
    ],
    dmittel: [
      { x: 4, y: 9 },
      { x: 12, y: 5 }
    ],
    felder: [
      { x: 5, y: 5 },
      { x: 12, y: 9 },
      { x: 4, y: 11 }
    ],
    klippen: [
      { x: 4, y: 3 },
      { x: 12, y: 6 },
      { x: 5, y: 10 }
    ],
    kueste: [
      { x: 4, y: 8 },
      { x: 13, y: 7 },
      { x: 12, y: 10 }
    ]
  };

  // Zustand: einmalig angelegt, ueberlebt Bildschirmwechsel
  var enemies = [];
  var defeated = {};   // 'screen:index' -> true, dauerhaft besiegt
  var drops = [];      // fallen gelassene Herzen: { screen, x, y, t0 }
  var dying = [];      // laufende Besiegt-Animationen: { e, t0 }
  var firstTryWins = 0;   // Siege im ersten Versuch (fuer Herz-Drops)

  Object.keys(DEFS).forEach(function (screen) {
    DEFS[screen].forEach(function (d, i) {
      enemies.push({
        screen: screen, index: i,
        x: d.x * TILE, y: d.y * TILE,
        dirX: 0, dirY: 0,
        turnTime: Math.random() * TURN_MAX,
        cooldown: 0,
        attempts: 0
      });
    });
  });

  // --- Bewegung ---------------------------------------------------------------

  // Prueft, ob das 16x16-Feld des Gegners an (px, py) frei ist
  function canBeAt(world, px, py) {
    var tx1 = Math.floor(px / TILE);
    var ty1 = Math.floor(py / TILE);
    var tx2 = Math.floor((px + SIZE - 1) / TILE);
    var ty2 = Math.floor((py + SIZE - 1) / TILE);
    for (var ty = ty1; ty <= ty2; ty++) {
      for (var tx = tx1; tx <= tx2; tx++) {
        if (world.isBlocked(tx, ty)) return false;
      }
    }
    return true;
  }

  // Neue zufaellige Richtung (auch Stillstand moeglich)
  function turn(e) {
    var r = Math.random();
    if (r < 0.3) { e.dirX = 0; e.dirY = 0; }
    else if (r < 0.55) { e.dirX = -1; e.dirY = 0; }
    else if (r < 0.8) { e.dirX = 1; e.dirY = 0; }
    else if (r < 0.9) { e.dirX = 0; e.dirY = -1; }
    else { e.dirX = 0; e.dirY = 1; }
    e.turnTime = TURN_MIN + Math.random() * (TURN_MAX - TURN_MIN);
  }

  function update(world, dt, playerX, playerY, onBattle) {
    var active = [];
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (e.screen !== world.getScreen()) continue;
      if (defeated[e.screen + ':' + e.index]) continue;
      active.push(e);
    }

    // Fallen gelassenes Herz aufheben (Beruehrung) = ein Herz zurueck
    for (var d = drops.length - 1; d >= 0; d--) {
      var h = drops[d];
      if (h.screen !== world.getScreen()) continue;
      if (performance.now() < h.t0) continue;   // noch in der Wolke
      if (Math.abs(playerX - h.x) < TOUCH && Math.abs(playerY - h.y) < TOUCH) {
        Hud.heal(1);
        drops.splice(d, 1);
      }
    }

    for (var j = 0; j < active.length; j++) {
      var en = active[j];
      if (en.cooldown > 0) en.cooldown -= dt;

      // langsames Umherwandern
      en.turnTime -= dt;
      if (en.turnTime <= 0) turn(en);
      var dx = en.dirX * SPEED * dt;
      var dy = en.dirY * SPEED * dt;
      if (dx !== 0 && !canBeAt(world, en.x + dx, en.y)) turn(en);
      else en.x += dx;
      if (dy !== 0 && !canBeAt(world, en.x, en.y + dy)) turn(en);
      else en.y += dy;

      // Beruehrung mit der Spielfigur startet den Kampf
      // (nicht, solange die Figur nach einem Fehler blinkt: onBattle = null)
      if (onBattle && en.cooldown <= 0 &&
          Math.abs(playerX - en.x) < TOUCH &&
          Math.abs(playerY - en.y) < TOUCH) {
        en.cooldown = COOLDOWN;
        en.attempts++;
        onBattle(en);
        return;   // nur ein Kampf gleichzeitig
      }
    }
  }

  // --- Kampf-Ergebnis -----------------------------------------------------------

  // Samen fuer die Aufgabe: Gegner + Versuchzaehler => neue Zahlen pro Versuch
  function seedOf(e) {
    var screenNo = { wiese: 1, wald: 2, ruine: 3, dhalle: 4, dmittel: 5, felder: 6, klippen: 7, kueste: 8 }[e.screen] || 1;
    return screenNo * 100 + e.index * 10 + e.attempts;
  }

  function typeIdOf(e) { return TYPES[e.screen]; }

  function contextOf(e) { return KONTEXT[e.screen]; }

  // Wievielter Versuch gegen diesen Gegner (1 = erster Kontakt)
  function attemptOf(e) { return e.attempts; }

  // Wie viele Gegner sind auf diesem Bildschirm noch nicht besiegt?
  // (der Bann am Ausgang loest sich erst bei 0)
  function remaining(screen) {
    var n = 0;
    for (var i = 0; i < enemies.length; i++) {
      if (enemies[i].screen === screen && !defeated[screen + ':' + enemies[i].index]) n++;
    }
    return n;
  }

  // Speichern/Laden: Liste der besiegten Gegner ('screen:index')
  function getDefeated() { return Object.keys(defeated); }
  function setDefeated(list) {
    defeated = {};
    (list || []).forEach(function (k) { defeated[k] = true; });
  }

  // Hat der Bildschirm Gegner? (dafuer, ob im Dungeon gezeichnet wird)
  function hasScreen(screen) { return !!DEFS[screen]; }

  // Richtig geloest: Gegner dauerhaft besiegt, Besiegt-Animation startet.
  // Bei Sieg im ersten Versuch laesst jeder n-te Gegner ein Herz fallen.
  function defeat(e, firstTry) {
    defeated[e.screen + ':' + e.index] = true;
    var t0 = performance.now();
    dying.push({ e: e, t0: t0 });
    if (!firstTry) return;
    firstTryWins++;
    if (firstTryWins % Config.HEART_DROP_EVERY === 0) {
      // Herz erscheint erst, wenn sich die Wolke lichtet
      drops.push({ screen: e.screen, x: e.x, y: e.y, t0: t0 + FLASH_MS + POOF_MS * 0.5 });
    }
  }

  // Dauer der Besiegt-Animation in Sekunden (fuer Ablaeufe in main.js)
  var DEFEAT_TIME = (FLASH_MS + POOF_MS) / 1000;

  // Besiegt-Animation zeichnen: erst Aufblitzen, dann Rauchwolke mit Funken
  function drawDying(r, now, d) {
    var e = d.e, t = now - d.t0;
    var ctx = r.getCtx();
    if (t < FLASH_MS) {
      var shake = Math.floor(t / 40) % 2 ? 1 : -1;
      var img = Math.floor(t / 60) % 2 ? spriteOf(e.screen) : flashOf(e.screen);
      r.image(img, Math.round(e.x) + shake, Math.round(e.y));
      return;
    }
    var p = (t - FLASH_MS) / POOF_MS;
    var cx = Math.round(e.x) + 8, cy = Math.round(e.y) + 8;
    // Wolke: fuenf Ballen, die nach aussen wachsen und erst in der
    // zweiten Haelfte verblassen
    ctx.globalAlpha = p < 0.5 ? 1 : Math.max(0, 2 - p * 2);
    for (var k = 0; k < 5; k++) {
      var w = k / 5 * Math.PI * 2 + 0.6;
      var dist = 2 + p * 8;
      var rad = Math.max(1, Math.round(5 - p * 3 + (k % 2)));
      var bx = Math.round(cx + Math.cos(w) * dist);
      var by = Math.round(cy + Math.sin(w) * dist * 0.8 - p * 3);
      r.ellipse(bx, by, rad, rad, '#cfc8d8');
      r.ellipse(bx - 1, by - 1, Math.max(1, rad - 2), Math.max(1, rad - 2), '#ffffff');
    }
    // Funken: kleine gelbe Kreuze, die schnell nach aussen fliegen
    for (var f = 0; f < 6; f++) {
      var fw = f / 6 * Math.PI * 2;
      var fd = 4 + p * 16;
      var fx = Math.round(cx + Math.cos(fw) * fd), fy = Math.round(cy + Math.sin(fw) * fd);
      r.px(fx, fy - 1, 1, 3, '#fff2a0');
      r.px(fx - 1, fy, 3, 1, '#fff2a0');
      r.px(fx, fy, 1, 1, '#ffffff');
    }
    ctx.globalAlpha = 1;
  }

  // --- Zeichnen ----------------------------------------------------------------

  // Alle sichtbaren Figuren dieses Bildschirms (Herz-Drops, Besiegt-Animationen,
  // Gegner) als Liste { x, y, draw }: x/y = linke obere Ecke (16x16), draw()
  // zeichnet die Figur. So kann World sie nach Tiefe vor/hinter Objekte setzen.
  function actors(r, time, screen) {
    var list = [];
    var ctx = r.getCtx();
    var now = performance.now();
    // fallen gelassene Herzen: springen aus der Wolke, dann leicht wippend
    drops.forEach(function (dr) {
      if (dr.screen !== screen) return;
      var dt = now - dr.t0;
      if (dt < 0) return;
      list.push({ x: dr.x, y: dr.y, draw: function () {
        var hb = Math.floor(time / 250) % 2;
        if (dt < DROP_HOP_MS) {
          var q = dt / DROP_HOP_MS;
          hb = Math.round(Math.sin(q * Math.PI) * 8);   // Bogen nach oben
        }
        Hud.drawHeart(r, Math.round(dr.x) + 4, Math.round(dr.y) + 5 - hb);
      } });
    });
    // laufende Besiegt-Animationen; fertige werden entfernt
    for (var a = dying.length - 1; a >= 0; a--) {
      if (now - dying[a].t0 > FLASH_MS + POOF_MS) { dying.splice(a, 1); continue; }
      if (dying[a].e.screen !== screen) continue;
      (function (dd) {
        list.push({ x: dd.e.x, y: dd.e.y, draw: function () { drawDying(r, now, dd); } });
      })(dying[a]);
    }
    enemies.forEach(function (e) {
      if (e.screen !== screen) return;
      if (defeated[e.screen + ':' + e.index]) return;
      list.push({ x: e.x, y: e.y, draw: function () {
        var bob = Math.floor(time / 300 + e.index) % 2;
        ctx.globalAlpha = 0.3;
        r.ellipse(e.x + 8, e.y + 15, 6, 2, '#2a140a');
        ctx.globalAlpha = 1;
        r.image(spriteOf(e.screen), Math.round(e.x), Math.round(e.y - bob));
      } });
    });
    return list;
  }

  function draw(r, time, screen) {
    actors(r, time, screen).forEach(function (ac) { ac.draw(); });
  }

  return {
    update: update,
    draw: draw,
    actors: actors,
    defeat: defeat,
    DEFEAT_TIME: DEFEAT_TIME,
    attemptOf: attemptOf,
    hasScreen: hasScreen,
    seedOf: seedOf,
    typeIdOf: typeIdOf,
    contextOf: contextOf,
    remaining: remaining,
    getDefeated: getDefeated,
    setDefeated: setDefeated
  };
})();
