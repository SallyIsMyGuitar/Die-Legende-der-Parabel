// main.js: Start, Spielschleife und Abläufe (Tür-Animation, Bildschirmwechsel)
(function () {
  'use strict';

  var canvas = document.getElementById('game-canvas');
  var W = Render.WIDTH, H = Render.HEIGHT;

  Render.init(canvas);
  Input.init();
  TaskUi.init();

  // --- Rastquelle: zuletzt benutzte Quelle (Start: Brunnen im Dorf) --------
  // Bei null Herzen kommt die Spielfigur hier wieder zu sich.
  var lastRest = { screen: 'ost', x: 7 * 16, y: 8 * 16, facing: 'up' };

  function useRest(target) {
    Hud.fill();
    if (target.spawn) {
      lastRest = { screen: World.getScreen(), x: target.spawn.x, y: target.spawn.y, facing: target.spawn.facing };
    }
  }

  // --- Kampf: Beruehrung mit einem Gegner startet genau eine Aufgabe -------
  function startBattle(enemy) {
    TaskUi.open(Enemies.typeIdOf(enemy), Enemies.seedOf(enemy), function (solved, errors) {
      if (solved) Enemies.defeat(enemy, errors === 0);   // richtig = Monster besiegt
      else if (Hud.getHearts() === 0) respawn();          // alle Herzen weg
      else knockback(enemy);                               // Figur weicht zurück
    }, Enemies.contextOf(enemy));   // Kontext aus dem Tipp des NPCs
  }

  // Spielstart im Elternhaus bei der Mutter
  World.setScreen(World.START.screen);
  Player.setPosition(World.START.x, World.START.y, World.START.facing);

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
        World.addNpc('ost', {
          x: 192, y: 96, baseFacing: 'left',
          sprites: function () { return People.spaeth(); },
          talk: { name: 'Herr Späth', texts: SPAETH_STAND_TEXTS }
        });
        spaeth = null;
        spaethPhase = null;
        spaethDone = true;
      } }
    ]);
  }

  // Rückstoß nach einem verlorenen Kampf: Figur weicht vom Gegner weg,
  // damit nicht sofort der nächste Kampf beginnt (mit Kollision, im Bildschirm)
  function knockback(enemy) {
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
    run([
      { dur: Config.KNOCKBACK_TIME, tick: function (p, dt) {
        var nx = Math.max(0, Math.min(W - 16, Player.getX() + vx * speed * dt)) - Player.getX();
        var ny = Math.max(0, Math.min(H - 16, Player.getY() + vy * speed * dt)) - Player.getY();
        Player.push(World, nx, ny);
      } }
    ]);
  }

  // Alle Herzen verloren: Abblende, an der letzten Rastquelle wieder zu sich kommen
  function respawn() {
    run([
      { dur: 0.5, tick: function (p) { fade = p; } },
      { dur: 0.3, end: function () {
        World.setScreen(lastRest.screen);
        Player.setPosition(lastRest.x, lastRest.y, lastRest.facing);
        Hud.fill();
      } },
      { dur: 0.5, tick: function (p) { fade = 1 - p; } },
      { dur: 0, end: function () {
        Dialog.open('', ['Du kommst an der Quelle wieder zu dir. Deine Herzen sind wieder voll.']);
      } }
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
    if (slide) {
      var cam = slide.dir * slide.p * W;
      ctx.save();
      ctx.translate(-cam, 0);
      World.drawGround(Render, now, slide.from);
      ctx.translate(slide.dir * W, 0);
      World.drawGround(Render, now, slide.to);
      ctx.restore();
      Player.draw(Render, -cam, 0);
      ctx.save();
      ctx.translate(-cam, 0);
      World.drawOverlay(Render, now, slide.from);
      ctx.translate(slide.dir * W, 0);
      World.drawOverlay(Render, now, slide.to);
      ctx.restore();
      return;
    }
    World.drawGround(Render, now);
    Player.draw(Render);
    if (World.isOutdoor()) Enemies.draw(Render, now, World.getScreen());
    if (spaeth) drawSpaeth(Render, now);
    World.drawOverlay(Render, now);
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

  // --- Spielschleife mit zeitunabhängiger Bewegung -----------------------------
  var lastTime = null;

  function loop(now) {
    if (lastTime === null) lastTime = now;
    var dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;

    var target = null;
    if (TaskUi.isActive()) {
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
      Enemies.update(World, dt, Player.getX(), Player.getY(), startBattle);
      // Szene auslösen, bevor die Spielfigur das Dorf Richtung Osten verlässt
      if (!spaethDone && !spaeth && World.getScreen() === 'ost' && Player.getX() >= 232) {
        startSpaeth();
      } else {
        target = World.talkTarget(Player.getX(), Player.getY(), Player.getFacing());
        if (target && Input.pressed('a')) {
          Player.setPosition(Player.getX(), Player.getY());   // Laufanimation anhalten
          if (target.action === 'testpage') {
            TestPage.open();   // Schild der Testseite für die Lehrkraft
          } else {
            if (target.action === 'rest') useRest(target);   // Rastquelle
            if (target.npc) {
              target.npc.facing = faceToward(target.npc, Player.getX(), Player.getY());
              turnedNpc = target.npc;
            }
            Dialog.open(target.name, target.texts);
          }
          target = null;
        }
        var w = World.checkWarp(Player.getX(), Player.getY(), Player.getFacing());
        if (w && w.type === 'enter') enterHouse(w);
        else if (w && w.type === 'exit') leaveHouse(w);
        else {
          var edge = World.checkEdge(Player.getX(), Player.getY());
          if (edge) startSlide(edge);
        }
      }
    }

    drawScene(now);
    Fx.draw(Render, now, World.isOutdoor());
    if (target) Dialog.drawHint(Render, target.hintX, target.hintY, now);
    Hud.draw(Render);
    Dialog.draw(Render);
    TestPage.draw(Render);
    TaskUi.draw(Render);
    if (fade > 0) Render.px(0, 0, W, H, 'rgba(0,0,0,' + fade + ')');
    Input.clearPressed();

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
