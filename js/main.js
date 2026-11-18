// main.js: Start, Spielschleife und Abläufe (Tür-Animation, Bildschirmwechsel)
(function () {
  'use strict';

  var canvas = document.getElementById('game-canvas');
  var W = Render.WIDTH, H = Render.HEIGHT;

  Render.init(canvas);
  Input.init();
  TaskUi.init();
  Merkbuch.init();

  // --- Rastquelle: zuletzt benutzte Quelle (Start: Brunnen im Dorf) --------
  // Bei null Herzen kommt die Spielfigur hier wieder zu sich.
  var lastRest = { screen: 'ost', x: 7 * 16, y: 8 * 16, facing: 'up' };

  function useRest(target) {
    Hud.fill();
    if (target.spawn) {
      lastRest = { screen: World.getScreen(), x: target.spawn.x, y: target.spawn.y, facing: target.spawn.facing };
    }
    saveGame();   // Rastquellen speichern automatisch
  }

  // --- Spielstand: Fortschritt sammeln, speichern und laden ----------------
  var stats = { right: 0, wrong: 0 };   // Fehlerstatistik (fuer Abspann/Code)
  var bossIntroDone = false;            // Wächter hat sich schon vorgestellt

  function collectState() {
    return {
      v: 1,
      rest: lastRest,
      defeated: Enemies.getDefeated(),
      chest: chestDone,
      sword: Sword.has(),
      merk: Merkbuch.all(),
      boss: Boss.isDefeated(),
      raetsel: Raetsel.isSolved(),
      bossIntro: bossIntroDone,
      wappen: wappens,
      spaeth: spaethDone,
      stats: stats
    };
  }

  function saveGame() { Save.write(collectState()); }

  // Gespeicherten Stand uebernehmen; Start an der letzten Rastquelle
  function applyState(st) {
    if (st.rest && st.rest.screen) lastRest = st.rest;
    Enemies.setDefeated(st.defeated);
    if (st.chest) { chestDone = true; World.setChestOpen(1, 'ruine'); }
    if (st.sword) Sword.give();
    Merkbuch.load(st.merk);
    if (st.boss) Boss.setDefeated();
    if (st.raetsel) Raetsel.setSolved();
    bossIntroDone = !!st.bossIntro || !!st.boss;
    wappens = st.wappen || 0;
    if (st.spaeth) { spaethDone = true; placeSpaethNpc(); }
    if (st.stats) stats = { right: st.stats.right || 0, wrong: st.stats.wrong || 0 };
    World.setScreen(lastRest.screen);
    Player.setPosition(lastRest.x, lastRest.y, lastRest.facing);
    Hud.fill();
  }

  // Texte einer Figur: nach dem ersten Wappen kommen Zusatzseiten dazu
  // (later.replace = true ersetzt die bisherigen Seiten)
  function textsFor(target) {
    var l = target.later;
    if (!l) return target.texts;
    if (l.wappen && wappens < l.wappen) return target.texts;
    if (l.solved && !Raetsel.isSolved()) return target.texts;
    return l.replace ? l.texts : target.texts.concat(l.texts);
  }

  // --- Bann von Graf Gerade: Ausgang gesperrt, bis alle Wesen erlöst sind ---
  // 'edge' = Ostrand, 'dungeon' = Höhleneingang, 'warp' = Öffnung nach oben
  var BANN = { wiese: 'edge', wald: 'edge', ruine: 'dungeon', dhalle: 'warp', dmittel: 'warp' };
  var FORWARD = { dhalle: 'dmittel', dmittel: 'draetsel' };   // Öffnung nach vorn

  // --- Fackel-Rätsel vor dem Boss (Logik in raetsel.js) --------------------
  function lightTorch(t) {
    var res = Raetsel.light(t.x, t.y);
    if (res === 'wrong') {
      Dialog.open('', ['Die Flamme zischt – alle Fackeln erlöschen. Der Punkt (' +
        Tasks.fmt(t.x) + '|' + Tasks.fmt(t.y) + ') liegt nicht auf der Parabel ' + Raetsel.FORMEL + '.']);
    } else if (res === 'solved') {
      saveGame();
      Dialog.open('', ['Alle fünf Fackeln brennen. Mit lautem Knirschen hebt sich das Gitter.']);
    }
  }

  function bannActive(screen) {
    return !!BANN[screen] && Enemies.remaining(screen) > 0;
  }

  // Figur prallt am Bann ab, kurzer Text mit der Zahl der übrigen Wesen
  function bannBlock(nx, ny, facing) {
    Player.setPosition(nx, ny, facing);
    var n = Enemies.remaining(World.getScreen());
    Dialog.open('Bann', ['Ein Bann aus starren, geraden Linien versperrt den Weg. Er löst sich erst, wenn alle verzauberten Wesen hier erlöst sind. Noch übrig: ' + n + '.']);
  }

  // Flächen, auf denen der Bann sichtbar flimmert
  function bannRects(screen) {
    var kind = BANN[screen];
    if (kind === 'edge') {
      var list = [];
      for (var ty = 0; ty < 14; ty++) {
        if (!World.isBlocked(15, ty)) list.push([15 * 16 + 6, ty * 16, 10, 16]);
      }
      return list;
    }
    if (kind === 'dungeon') return [[6 * 16, 4 * 16, 32, 16]];
    return [[8 * 16, 1 * 16, 16, 16]];
  }

  // Bann zeichnen: senkrechte, gerade Lichtstreifen, die leicht pulsieren
  function drawBann(r, now) {
    var screen = World.getScreen();
    if (!bannActive(screen)) return;
    var ctx = r.getCtx();
    var rects = bannRects(screen);
    for (var i = 0; i < rects.length; i++) {
      var b = rects[i];
      for (var x = b[0] + 1; x < b[0] + b[2]; x += 3) {
        ctx.globalAlpha = 0.35 + 0.3 * Math.sin(now / 180 + x * 0.7);
        r.px(x, b[1], 1, b[3], '#c8a8ff');
      }
      ctx.globalAlpha = 0.5 + 0.3 * Math.sin(now / 120);
      r.px(b[0], b[1] + ((Math.floor(now / 60) + i * 5) % b[3]), b[2], 1, '#ffffff');
    }
    ctx.globalAlpha = 1;
  }

  // Nach einem Sieg: Ist das letzte Wesen erlöst, löst sich der Bann
  function bannReleased(screen) {
    return !!BANN[screen] && Enemies.remaining(screen) === 0;
  }

  // --- Boss des ersten Dungeons: feste Aufgaben nacheinander ---------------
  var BOSS_NAME = 'Wächter der Höhle';
  var BOSS_CONTEXT = 'Der Wächter fragt:';
  // Vorstellung beim ersten Kontakt (danach startet die erste Aufgabe)
  var BOSS_INTRO_TEXTS = [
    'Halt! Graf Gerade hat befohlen: Hier kommt keine Kurve durch!',
    'Beantworte meine drei Fragen. Für jede richtige Antwort verliere ich ein Herz. Dein Schwert nützt dir bei mir nichts.'
  ];
  var BOSS_VICTORY_TEXTS = [
    'Der Bann zerbricht in tausend gerade Splitter. Der Wächter atmet auf, und das Tor öffnet sich.',
    'Danke! Graf Gerade hat mich verzaubert. Er hasst alles, was sich krümmt – und Parabeln am allermeisten.',
    'Darum ließ er eure Schule zerstören: Dort lernt man, wie Parabeln funktionieren. Er hat noch weitere Wächter … und ein Schloss.',
    'Du erhältst das erste Wappen: das Wappen der Normalparabel. Kehre ins Dorf zurück und erzähle, was du erfahren hast.'
  ];
  var bossAttempts = 1;    // Versuche an der aktuellen Boss-Aufgabe
  var wappens = 0;         // gesammelte Wappen (fuer den Abspann)

  function startBossTask() {
    Boss.startFight();
    var def = Tasks.bossTasks()[Boss.index()];
    // Feste Aufgabe mit Kontext uebernehmen
    var task = {
      frage: BOSS_CONTEXT + ' ' + def.frage,
      felder: def.felder,
      loesung: def.loesung,
      loesungstext: def.loesungstext,
      hinweis: def.hinweis,
      graph: def.graph,
      graphFix: def.graphFix
    };
    TaskUi.openFixed(task, function (solved, errors) {
      if (solved) stats.right++; else stats.wrong++;
      if (solved) {
        bossAttempts = 1;
        if (Boss.damage() > 0) {
          // naechste feste Aufgabe nach kurzem Durchatmen
          run([{ dur: 0.5 }, { dur: 0, end: function () { startBossTask(); } }]);
        } else {
          Boss.die();
          wappens++;
          saveGame();   // nach dem Dungeon automatisch speichern
          run([
            { dur: 1.3 },
            { dur: 0, end: function () {
              Dialog.open(BOSS_NAME, BOSS_VICTORY_TEXTS);
            } }
          ]);
        }
      } else {
        bossAttempts++;                     // gleiche Aufgabe kommt wieder
        hurt({ x: 102, y: 60 });   // Rueckstoss vom Boss weg
      }
    }, { boss: true, attempt: bossAttempts });
  }

  // --- Kampf: Beruehrung mit einem Gegner startet genau eine Aufgabe -------
  // Die Aufgabenbox blendet erst aus, dann folgt die Animation:
  //   richtig = Gegner blitzt auf und zerfaellt in eine Rauchwolke
  //   falsch  = Herz verschwindet oben, Figur blinkt und weicht zurueck
  function startBattle(enemy) {
    var attempt = Enemies.attemptOf(enemy);
    TaskUi.open(Enemies.typeIdOf(enemy), Enemies.seedOf(enemy), function (solved, errors, joker) {
      if (solved) {
        if (!joker) stats.right++;
        // Herz-Drop nur bei richtiger Antwort im ersten Versuch, nie mit Schwert
        Enemies.defeat(enemy, !joker && attempt === 1);
        saveGame();
        var texts = [];
        if (joker) texts.push('Dein Schwert zerbricht. Der Gegner weicht zurück \u2013 diesmal ohne Rechnung.');
        if (bannReleased(enemy.screen)) texts.push('Das letzte Wesen ist erlöst. Der Bann löst sich auf – der Weg ist frei!');
        if (texts.length) {
          // erst die Besiegt-Animation, dann der Hinweis
          run([
            { dur: Enemies.DEFEAT_TIME },
            { dur: 0, end: function () { Dialog.open('', texts); } }
          ]);
        }
      } else {
        stats.wrong++;
        hurt(enemy);
      }
    }, Enemies.contextOf(enemy), { attempt: attempt });   // Kontext aus dem Tipp des NPCs
  }

  // Falsche Antwort: ein Herz weg (blinkt und zerplatzt im HUD), Figur
  // blinkt und weicht von der Quelle des Schadens zurueck. Bei null Herzen
  // geht es danach zur letzten Rastquelle.
  function hurt(source) {
    Hud.loseHeart();
    Player.blink(Config.PLAYER_BLINK);
    var steps = knockbackSteps(source);
    if (Hud.getHearts() === 0) {
      steps = steps.concat([{ dur: 0.8 }], respawnSteps());
    }
    run(steps);
  }

  // --- R\u00e4tsel-Truhe an der Ruine: Belohnung ist das Schwert --------------
  var chestDone = false;   // Truhe ist nach dem Raetsel leer
  var chestAttempts = 0;   // Versuche am Raetsel (Hinweis ab dem 2., Loesung im 3.)
  var chestSword = null;   // aufsteigendes Schwert ueber der Truhe: { x, y, p }
  function openChest() {
    if (chestDone) {
      Dialog.open('Truhe', ['Die Truhe ist leer.']);
      return;
    }
    chestAttempts++;
    // Plus-Raetsel zum Thema des ersten Dungeons: verschobene Parabel
    TaskUi.open('verschiebung', Math.floor(Date.now() / 1000) % 100000, function (solved, errors) {
      var pos = World.chestPos();
      if (!solved) {
        if (errors === 0) chestAttempts--;      // mit B abgebrochen: zaehlt nicht
        else { stats.wrong++; hurt(pos); }       // falsch: Herz weg wie im Kampf
        return;                                  // Truhe bleibt, spaeter neuer Versuch
      }
      stats.right++;
      chestDone = true;
      // Aufgabe ist zu: Deckel klappt auf, Schwert steigt auf, dann der Text
      run([
        { dur: 0.3, tick: function (p) { World.setChestOpen(p); } },
        { dur: 0.7, start: function () { chestSword = { x: pos.x, y: pos.y, p: 0 }; },
          tick: function (p) { chestSword.p = p; } },
        { dur: 0.3 },
        { dur: 0, end: function () {
          chestSword = null;
          Sword.give();   // Schwert wandert in den Slot im HUD
          saveGame();
          Dialog.open('Truhe', [
            'Du l\u00f6st das R\u00e4tsel und \u00f6ffnest die Truhe.',
            'Darin liegt ein Schwert! Es \u00fcberspringt einmal eine Aufgabe und zerbricht danach.',
            'Du tr\u00e4gst es im Platz links neben A und B oben rechts. Antippen oder Taste E setzt es ein.'
          ]);
        } }
      ]);
    }, 'R\u00e4tsel der Truhe:', { abortable: true, attempt: chestAttempts });
  }

  // Schwert steigt aus der Truhe auf, mit kurzem Funkeln
  function drawChestSword(r, now) {
    var c = chestSword;
    var ease = 1 - (1 - c.p) * (1 - c.p);
    var x = c.x + 1, y = Math.round(c.y + 2 - ease * 14);
    Sword.drawIcon(r, x, y);
    if (c.p > 0.6) {
      var k = Math.floor(now / 90) % 2;
      r.px(x + 12, y - 2 + k, 1, 3, '#ffffff');
      r.px(x + 11, y - 1 + k, 3, 1, '#ffffff');
    }
  }

  // Spielstart im Elternhaus bei der Mutter (bzw. Titelbild davor)
  World.setScreen(World.START.screen);
  Player.setPosition(World.START.x, World.START.y, World.START.facing);

  // --- Titelbild: Neues Spiel oder Weiterspielen ---------------------------
  // phase 'menu' | 'confirm' (Spielstand wirklich löschen?) | null = Spiel läuft
  var saved = Save.read();
  var title = { phase: 'menu' };

  function updateTitle() {
    if (title.phase === 'menu') {
      if (Input.pressed('a')) {
        if (saved) applyState(saved);
        title = null;
      } else if (saved && Input.pressed('b')) {
        title.phase = 'confirm';
      }
    } else if (title.phase === 'confirm') {
      if (Input.pressed('a')) {
        Save.clear();      // neu beginnen: Start im Elternhaus
        saved = null;
        title = null;
      } else if (Input.pressed('b')) {
        title.phase = 'menu';
      }
    }
  }

  // Text mittig, optional doppelt so groß
  function centerText(ctx, text, y, color, big) {
    if (big) {
      ctx.save();
      ctx.scale(2, 2);
      Font.draw(ctx, text, Math.floor((W / 2 - Font.width(text)) / 2), y / 2, color);
      ctx.restore();
      return;
    }
    Font.draw(ctx, text, Math.floor((W - Font.width(text)) / 2), y, color);
  }

  function drawTitle(r, now) {
    var ctx = r.getCtx();
    r.px(0, 0, W, H, 'rgba(10,8,16,0.78)');
    centerText(ctx, 'Die Legende', 38, '#f0c040', true);
    centerText(ctx, 'der Parabel', 62, '#f0c040', true);
    // kleine Parabel als Zierde
    for (var x = -30; x <= 30; x++) {
      var y = Math.round(x * x / 30);
      r.px(W / 2 + x, 112 - y, 1, 1, '#efe4c4');
    }
    r.px(W / 2 - 1, 111, 3, 3, '#f0c040');
    var blinkOn = Math.floor(now / 500) % 2 === 0;
    if (title.phase === 'menu') {
      if (saved) {
        centerText(ctx, 'A: Weiterspielen', 130, blinkOn ? '#f6f0e2' : '#c8c0b0');
        centerText(ctx, 'B: Neues Spiel', 144, '#8a8496');
      } else {
        centerText(ctx, 'A: Spiel starten', 136, blinkOn ? '#f6f0e2' : '#c8c0b0');
      }
    } else {
      centerText(ctx, 'Spielstand löschen und neu beginnen?', 130, '#f6f0e2');
      centerText(ctx, 'A: Ja, neu beginnen   B: Nein', 144, '#8a8496');
    }
    centerText(ctx, 'Der Spielstand bleibt nur auf diesem Gerät.', 196, '#8a8496');
  }

  // --- Abläufe: Folge von Schritten mit Dauer (Sekunden) -------------------
  // Während ein Ablauf läuft, ist die Steuerung gesperrt.
  var seq = null;
  var fade = 0;            // 0 = klar, 1 = schwarz
  var doorClip = null;     // Spielfigur wird in dieser Türöffnung nachgezeichnet
  var slide = null;        // laufender Bildschirmwechsel

  function run(steps) {
    seq = { steps: steps, i: 0, t: 0 };
    if (steps[0].start) steps[0].start();
  }

  function updateSeq(dt) {
    var s = seq.steps[seq.i];
    seq.t += dt;
    var p = s.dur > 0 ? Math.min(1, seq.t / s.dur) : 1;
    if (s.tick) s.tick(p, dt);
    if (p < 1) return;
    if (s.end) s.end();
    seq.i++;
    seq.t = 0;
    if (seq.i >= seq.steps.length) { seq = null; return; }
    if (seq.steps[seq.i].start) seq.steps[seq.i].start();
  }

  var WALK = 14;           // Pixel, die die Figur durch die Tür geht

  // --- Szene: Herr Späth hält die Spielfigur am Ost-Rand des Dorfes auf ---
  var SPAETH_TEXTS = [
    'Aus der Bahn!!! Ich bin schöner als du ...',
    'Halt, stopp ... Du willst die Schule retten. Ich bin Herr Späth, der letzte Universalgelehrte unserer Zeit ...',
    'Wenn du die Schule retten willst, habe ich als Tipp für dich: Nimm einen Stift und einen Zettel, damit du deine Nebenrechnungen notieren kannst.'
  ];
  var spaeth = null;         // Position der Figur, solange die Szene läuft
  var spaethPhase = null;    // 'approach' | 'talk' | 'aside'
  var spaethDone = false;    // Szene nur einmal pro Spielsitzung
  var SPAETH_STAND_TEXTS = ['Auf geht\'s ... Rette das Volk niederer Bildung!'];

  // Figur dreht sich zur Spielfigur, solange das Gespräch läuft
  var turnedNpc = null;

  function faceToward(npc, px, py) {
    var dx = px - npc.x, dy = py - npc.y;
    if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 'right' : 'left';
    return dy > 0 ? 'down' : 'up';
  }
  var spaethSprites = null;  // Sprites einmal vorberechnen

  function drawSpaeth(r, t) {
    if (!spaethSprites) {
      // Ansturm von links: Blick nach rechts; danach stehend: Blick nach links
      spaethSprites = People.spaeth();
    }
    var bob = spaethPhase === 'approach' ? Math.floor(t / 90) % 2 : 0;
    var img = spaethPhase === 'aside' ? spaethSprites.left[0] : spaethSprites.right[0];
    var ctx = r.getCtx();
    ctx.globalAlpha = 0.3;
    r.ellipse(spaeth.x + 8, spaeth.y + 15, 6, 2, '#2a140a');
    ctx.globalAlpha = 1;
    r.image(img, Math.round(spaeth.x), Math.round(spaeth.y - bob));
  }

  function startSpaeth() {
    // Halt neben der Spielfigur (links von ihr), Blick zu ihr nach rechts
    var stopX = Player.getX() - 16;
    spaeth = { x: -32, y: 64 };
    spaethPhase = 'approach';
    run([
      { dur: 0.7, tick: function (p) { spaeth.x = -32 + (stopX + 32) * p; } },
      { dur: 0, end: function () {
        spaethPhase = 'talk';
        Dialog.open('Herr Späth', SPAETH_TEXTS);
      } }
    ]);
  }

  // Nach dem Gespräch: tritt vom Weg herunter und bleibt als NPC stehen
  function spaethAside() {
    spaethPhase = 'aside';
    run([
      { dur: 0.6, tick: function (p) {
        spaeth.x = spaeth.x0 + (192 - spaeth.x0) * p;
        spaeth.y = 64 + (96 - 64) * p;
      }, start: function () { spaeth.x0 = spaeth.x; } },
      { dur: 0, end: function () {
        placeSpaethNpc();
        spaeth = null;
        spaethPhase = null;
        spaethDone = true;
        saveGame();
      } }
    ]);
  }

  // Herr Späth steht nach der Szene als NPC am Dorfplatz
  function placeSpaethNpc() {
    World.addNpc('ost', {
      x: 192, y: 96, baseFacing: 'left',
      sprites: function () { return People.spaeth(); },
      talk: { name: 'Herr Späth', texts: SPAETH_STAND_TEXTS }
    });
  }

  // Rückstoß nach einem verlorenen Kampf: Figur weicht vom Gegner weg,
  // damit nicht sofort der nächste Kampf beginnt (mit Kollision, im Bildschirm)
  function knockbackSteps(enemy) {
    var dx = Player.getX() - enemy.x, dy = Player.getY() - enemy.y;
    var vx = 0, vy = 0;
    if (Math.abs(dx) >= Math.abs(dy) && dx !== 0) vx = dx > 0 ? 1 : -1;
    else if (dy !== 0) vy = dy > 0 ? 1 : -1;
    else {
      // genau übereinander: entgegen der Blickrichtung
      var f = Player.getFacing();
      vx = f === 'left' ? 1 : f === 'right' ? -1 : 0;
      vy = f === 'up' ? 1 : f === 'down' ? -1 : 0;
    }
    var speed = Config.KNOCKBACK / Config.KNOCKBACK_TIME;
    return [
      { dur: Config.KNOCKBACK_TIME, tick: function (p, dt) {
        var nx = Math.max(0, Math.min(W - 16, Player.getX() + vx * speed * dt)) - Player.getX();
        var ny = Math.max(0, Math.min(H - 16, Player.getY() + vy * speed * dt)) - Player.getY();
        Player.push(World, nx, ny);
      } }
    ];
  }

  // Alle Herzen verloren: Abblende, an der letzten Rastquelle wieder zu sich kommen
  function respawnSteps() {
    return [
      { dur: 0.5, tick: function (p) { fade = p; } },
      { dur: 0.3, end: function () {
        World.setScreen(lastRest.screen);
        Player.setPosition(lastRest.x, lastRest.y, lastRest.facing);
        Player.blink(0);
        Hud.fill();
      } },
      { dur: 0.5, tick: function (p) { fade = 1 - p; } },
      { dur: 0, end: function () {
        // Ein getragenes Schwert geht bei null Herzen verloren
        if (Sword.has()) {
          Sword.breakSword();
          saveGame();
          Dialog.open('', ['Du kommst an der Quelle wieder zu dir. Deine Herzen sind wieder voll. Dein Schwert ist verloren.']);
        } else {
          Dialog.open('', ['Du kommst an der Quelle wieder zu dir. Deine Herzen sind wieder voll.']);
        }
      } }
    ];
  }

  // Dungeon betreten: Abblende, Eingangshalle, wieder aufblenden
  function enterDungeon(room) {
    run([
      { dur: 0.25, tick: function (p) { fade = p; } },
      { dur: 0, end: function () {
        World.setScreen(room);
        Player.setPosition(8 * 16, 11 * 16, 'up');
      } },
      { dur: 0.25, tick: function (p) { fade = 1 - p; } }
    ]);
  }

  // Übergang zwischen Dungeon-Räumen (Höhlenöffnungen) mit Abblende
  function roomWarp(w) {
    run([
      { dur: 0.25, tick: function (p) { fade = p; } },
      { dur: 0, end: function () {
        World.setScreen(w.to.screen || w.to.room);
        Player.setPosition(w.to.x, w.to.y, w.to.facing || 'up');
      } },
      { dur: 0.25, tick: function (p) { fade = 1 - p; } }
    ]);
  }

  // Haus betreten: Tür geht auf, Figur geht hinein, Abblende, Raum
  function enterHouse(w) {
    var b = w.building;
    var startX = Player.getX(), y0 = Player.getY();
    var targetX = b.door * Render.TILE;
    run([
      { dur: 0.25, tick: function (p) {
        World.setDoorOpen(b, p);
        Player.setPosition(startX + (targetX - startX) * p, y0, 'up');
      } },
      { dur: 0.4, start: function () { doorClip = World.doorRect(b); },
        tick: function (p, dt) { Player.scriptMove(0, -WALK * dt / 0.4, dt, 'up'); } },
      { dur: 0.25, tick: function (p) { fade = p; } },
      { dur: 0, end: function () {
        World.setDoorOpen(b, 0);
        doorClip = null;
        World.setScreen(w.room);
        Player.setPosition(Interior.SPAWN.x, Interior.SPAWN.y, 'up');
      } },
      { dur: 0.25, tick: function (p) { fade = 1 - p; } }
    ]);
  }

  // Haus verlassen: Abblende, Figur steht in offener Tür, tritt heraus, Tür schließt
  function leaveHouse(w) {
    var b = w.building;
    var outY = (b.y + b.h) * Render.TILE;
    run([
      { dur: 0.25, tick: function (p) { fade = p; } },
      { dur: 0, end: function () {
        World.setScreen(w.screen);
        World.setDoorOpen(b, 1);
        Player.setPosition(b.door * Render.TILE, outY - WALK, 'down');
        doorClip = World.doorRect(b);
      } },
      { dur: 0.25, tick: function (p) { fade = 1 - p; } },
      { dur: 0.4, tick: function (p, dt) { Player.scriptMove(0, WALK * dt / 0.4, dt, 'down'); },
        end: function () { Player.setPosition(b.door * Render.TILE, outY, 'down'); doorClip = null; } },
      { dur: 0.25, tick: function (p) { World.setDoorOpen(b, 1 - p); } }
    ]);
  }

  // Bildschirm seitlich weiterschieben (wie in klassischen 2D-Abenteuern)
  function startSlide(edge) {
    var dir = edge.dir === 'east' ? 1 : -1;
    var fromX = Player.getX(), y = Player.getY();
    var toX = dir > 0 ? 0 : W - 16;
    slide = { from: World.getScreen(), to: edge.to, dir: dir, p: 0 };
    run([
      { dur: 0.6, tick: function (p, dt) {
        slide.p = p;
        // Position im gemeinsamen Koordinatensystem beider Bildschirme
        var combined = fromX + ((toX + dir * W) - fromX) * p;
        Player.scriptMove(combined - Player.getX(), y - Player.getY(), dt, dir > 0 ? 'right' : 'left');
      } },
      { dur: 0, end: function () {
        World.setScreen(slide.to);
        Player.setPosition(toX, y, dir > 0 ? 'right' : 'left');
        slide = null;
      } }
    ]);
  }

  // --- Zeichnen ---------------------------------------------------------------
  function drawScene(now) {
    var ctx = Render.getCtx();
    var here = World.getScreen();
    if (slide) {
      // Die Spielfigur wird mit dem Bildschirm sortiert, in dem ihre Mitte liegt
      var cam = slide.dir * slide.p * W;
      var px = Player.getX() + 8;
      var inTo = slide.dir > 0 ? px >= W : px < 0;
      ctx.save();
      ctx.translate(-cam, 0);
      World.drawGround(Render, now, slide.from);
      ctx.translate(slide.dir * W, 0);
      World.drawGround(Render, now, slide.to);
      ctx.restore();
      ctx.save();
      ctx.translate(-cam, 0);
      World.drawSorted(Render, slide.from, inTo ? [] :
        [{ y: Player.getY(), draw: function () { Player.draw(Render); } }]);
      ctx.translate(slide.dir * W, 0);
      World.drawSorted(Render, slide.to, !inTo ? [] :
        [{ y: Player.getY(), draw: function () { Player.draw(Render, -slide.dir * W, 0); } }]);
      ctx.restore();
      ctx.save();
      ctx.translate(-cam, 0);
      World.drawOverlay(Render, now, slide.from);
      ctx.translate(slide.dir * W, 0);
      World.drawOverlay(Render, now, slide.to);
      ctx.restore();
      return;
    }
    World.drawGround(Render, now);
    // Spielfigur, Gegner, Wächter und Herr Späth nach Tiefe mit den Objekten
    // (Häuser, Brunnen, Zaun …) zeichnen; Reihenfolge wie bisher bei gleicher Höhe
    var actors = [{ y: Player.getY(), draw: function () { Player.draw(Render); } }];
    if (World.isOutdoor() || Enemies.hasScreen(here))
      actors = actors.concat(Enemies.actors(Render, now, here));
    if (here === 'dboss') actors.push({ y: -999, draw: function () { Boss.draw(Render, now); } });
    if (spaeth) actors.push({ y: spaeth.y, draw: function () { drawSpaeth(Render, now); } });
    World.drawSorted(Render, null, actors);
    World.drawOverlay(Render, now);
    if (chestSword) drawChestSword(Render, now);
    if (doorClip) {
      // Figur in der Türöffnung sichtbar halten (vor dem dunklen Flur)
      ctx.save();
      ctx.beginPath();
      ctx.rect(doorClip.x, doorClip.y, doorClip.w, doorClip.h);
      ctx.clip();
      Player.draw(Render);
      ctx.restore();
    }
  }

  // --- Aktionen von A und B: im HUD (Tastatur) und unter den Touch-Tasten ---
  // Wort für A, wenn die Figur vor etwas steht
  function actionWord(t) {
    if (!t) return '';
    if (t.action === 'rest') return 'Trinken';
    if (t.action === 'chest') return 'Öffnen';
    if (t.action === 'torch') return 'Entzünden';
    if (t.action === 'testpage') return 'Lesen';
    if (/Schild|Steintafel|Inschrift/.test(t.name)) return 'Lesen';
    return 'Reden';
  }

  // Aktuelle Belegung { a, b, dpad } je nach Spielzustand
  function currentActions(target) {
    if (title) {
      if (title.phase === 'confirm') return { a: 'Ja', b: 'Nein', dpad: false };
      return { a: saved ? 'Weiter' : 'Start', b: saved ? 'Neu' : '', dpad: false };
    }
    if (Merkbuch.isActive()) return { a: 'Schließen', b: 'Schließen', dpad: false };
    if (TaskUi.isActive()) return { a: 'Prüfen', b: TaskUi.isAbortable() ? 'Abbrechen' : '', dpad: false };
    if (TestPage.isActive()) return { a: 'Öffnen', b: 'Zurück', dpad: false };
    if (Dialog.isActive()) return { a: 'Weiter', b: 'Schließen', dpad: false };
    return { a: actionWord(target), b: '', dpad: true };
  }

  // Tastenbelegung im HUD (nur am PC): kleine Schilder an Buch und Schwert,
  // darunter rechts die aktuelle Aktion von A und B
  function drawKeyHints(r, act) {
    var ctx = r.getCtx();
    var touch = Input.isTouch();
    if (!touch) {
      keyBadge(r, ctx, Render.WIDTH - 84, 'M');
      keyBadge(r, ctx, Render.WIDTH - 64, 'E');
    }
    // auf dem iPad stehen die Aktionen schon unter den Touch-Tasten
    if (touch) return;
    var parts = [];
    if (act.a) parts.push('Enter: ' + act.a);
    if (act.b) parts.push('Esc: ' + act.b);
    if (!parts.length) return;
    var text = parts.join('   ');
    var w = Font.width(text);
    var x = Render.WIDTH - 6 - w, y = 25;
    r.px(x - 3, y - 2, w + 6, 11, 'rgba(14,18,32,0.6)');
    Font.draw(ctx, text, x, y, '#f6f0e2');
  }

  // Tastenbuchstabe unten links an einem 16-px-Platz im HUD
  function keyBadge(r, ctx, slotX, letter) {
    var x = slotX - 3, y = 14;
    r.px(x, y, 9, 10, '#efe4c4');
    r.px(x + 1, y + 1, 7, 8, '#2e2a3e');
    Font.draw(ctx, letter, x + 5 - Math.ceil(Font.width(letter) / 2), y + 2, '#f6f0e2');
  }

  // --- Spielschleife mit zeitunabhängiger Bewegung -----------------------------
  var lastTime = null;

  function loop(now) {
    if (lastTime === null) lastTime = now;
    var dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;

    var target = null;
    if (title) updateTitle();
    if (title) {
      var tact = currentActions(null);
      Input.setDpadVisible(false);
      Input.setLabels(tact.a, tact.b);
      drawScene(now);
      drawTitle(Render, now);
      Input.clearPressed();
      requestAnimationFrame(loop);
      return;
    }
    // Merkbuch geht jederzeit auf und zu, auch mitten in einer Aufgabe
    if (Input.pressed('book')) {
      Merkbuch.isActive() ? Merkbuch.close() : Merkbuch.open();
    }
    if (Merkbuch.isActive()) {
      Merkbuch.update(Input);
    } else if (TaskUi.isActive()) {
      TaskUi.update(dt, Input);
    } else if (TestPage.isActive()) {
      TestPage.update(Input);
    } else if (Dialog.isActive()) {
      Dialog.update(dt, Input);
    } else if (seq) {
      updateSeq(dt);
    } else if (spaethPhase === 'talk') {
      spaethAside();   // Gespräch ist beendet
    } else if (turnedNpc && !Dialog.isActive()) {
      // Gespräch beendet: Figur dreht sich zurück
      turnedNpc.facing = turnedNpc.baseFacing || 'down';
      turnedNpc = null;
    } else {
      Player.update(World, Input, dt);
      // Gegner bewegen und Beruehrung pruefen (startet den Kampf)
      // (solange die Figur nach einem Fehler blinkt, startet kein Kampf)
      Enemies.update(World, dt, Player.getX(), Player.getY(),
        Player.isBlinking() ? null : startBattle);
      // Szene auslösen, bevor die Spielfigur das Dorf Richtung Osten verlässt
      // Boss des ersten Dungeons: Beruehrung startet die feste Aufgabenreihe
      if (World.getScreen() === 'dboss' && !Boss.isDefeated() && !Player.isBlinking() &&
          Math.abs(Player.getX() + 8 - 112) < 15 && Math.abs(Player.getY() + 8 - 74) < 15) {
        if (!bossIntroDone) {
          // erst stellt sich der Wächter vor, danach (noch in Berührung) die Aufgabe
          bossIntroDone = true;
          Player.setPosition(Player.getX(), Player.getY());
          Dialog.open(BOSS_NAME, BOSS_INTRO_TEXTS);
        } else {
          startBossTask();
        }
      } else if (!spaethDone && !spaeth && World.getScreen() === 'ost' && Player.getX() >= 232) {
        startSpaeth();
      } else {
        target = World.talkTarget(Player.getX(), Player.getY(), Player.getFacing());
        if (target && Input.pressed('a')) {
          Player.setPosition(Player.getX(), Player.getY());   // Laufanimation anhalten
          if (target.action === 'testpage') {
            TestPage.open();   // Schild der Testseite für die Lehrkraft
          } else if (target.action === 'chest') {
            openChest();       // Rätsel-Truhe mit dem Schwert
          } else if (target.action === 'torch') {
            lightTorch(target.torch);   // Fackel-Rätsel vor dem Boss
          } else {
            if (target.action === 'rest') useRest(target);   // Rastquelle
            if (target.npc) {
              target.npc.facing = faceToward(target.npc, Player.getX(), Player.getY());
              turnedNpc = target.npc;
            }
            Dialog.open(target.name, textsFor(target));
            // Gehoerter Merksatz landet automatisch im Merkbuch
            if (target.merk && Merkbuch.add(target.merk)) saveGame();
          }
          target = null;
        }
        var w = World.checkWarp(Player.getX(), Player.getY(), Player.getFacing());
        var here = World.getScreen();
        var banned = bannActive(here);
        if (w && w.type === 'enter') enterHouse(w);
        else if (w && w.type === 'exit') leaveHouse(w);
        else if (w && w.type === 'dungeon') {
          if (banned) bannBlock(Player.getX(), Player.getY() + 6, 'down');
          else enterDungeon(w.room);
        } else if (w && w.type === 'warp') {
          // Öffnung nach vorn ist gebannt, zurück geht es immer
          if (banned && w.to.room === FORWARD[here]) bannBlock(Player.getX(), 2 * 16 + 4, 'down');
          else if (here === 'draetsel' && w.to.room === 'dboss' && !Raetsel.isSolved()) {
            // Gitter zum Boss bleibt zu, bis alle Fackeln richtig brennen
            Player.setPosition(Player.getX(), 2 * 16 + 4, 'down');
            Dialog.open('Gitter', ['Ein schweres Gitter versperrt den Weg. Entzünde zuerst die richtigen Fackeln.']);
          } else roomWarp(w);
        } else {
          var edge = World.checkEdge(Player.getX(), Player.getY());
          if (edge && banned && edge.dir === 'east') bannBlock(W - 16 - 8, Player.getY(), 'left');
          else if (edge) startSlide(edge);
        }
      }
    }

    drawScene(now);
    if (!slide) drawBann(Render, now);
    Fx.draw(Render, now, World.isOutdoor());
    if (target) Dialog.drawHint(Render, target.hintX, target.hintY, now);
    Hud.draw(Render);
    Sword.draw(Render);
    Merkbuch.drawHud(Render);
    // Belegung von A/B: im HUD (PC) und unter den Touch-Tasten (iPad)
    var act = currentActions(target);
    Input.setDpadVisible(act.dpad);
    Input.setLabels(act.a, act.b);
    if (!TaskUi.isActive() && !Merkbuch.isActive() && !TestPage.isActive()) drawKeyHints(Render, act);
    Dialog.draw(Render);
    TestPage.draw(Render);
    // Boss-Herzen unter der Aufgabenbox (sonst verdecken sie die Eingabefelder)
    if (World.getScreen() === 'dboss' && Boss.isFighting()) Boss.drawHearts(Render);
    TaskUi.draw(Render);
    Merkbuch.draw(Render);
    if (fade > 0) Render.px(0, 0, W, H, 'rgba(0,0,0,' + fade + ')');
    Input.clearPressed();

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
