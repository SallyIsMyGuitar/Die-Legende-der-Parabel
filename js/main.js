// main.js: Start, Spielschleife und Abläufe (Tür-Animation, Bildschirmwechsel)
(function () {
  'use strict';

  var canvas = document.getElementById('game-canvas');
  var W = Render.WIDTH, H = Render.HEIGHT;

  Render.init(canvas);
  Input.init();

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
  var spaethSprites = null;  // Sprites einmal vorberechnen

  function drawSpaeth(r, t) {
    if (!spaethSprites) spaethSprites = People.spaeth();
    var bob = spaethPhase === 'approach' ? Math.floor(t / 90) % 2 : 0;
    var ctx = r.getCtx();
    ctx.globalAlpha = 0.3;
    r.ellipse(spaeth.x + 8, spaeth.y + 15, 6, 2, '#2a140a');
    ctx.globalAlpha = 1;
    r.image(spaethSprites[0], Math.round(spaeth.x), Math.round(spaeth.y - bob));
  }

  function startSpaeth() {
    spaeth = { x: W + 16, y: 64 };
    spaethPhase = 'approach';
    run([
      { dur: 0.7, tick: function (p) { spaeth.x = W + 16 + (248 - (W + 16)) * p; } },
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
        spaeth.x = 248 + (192 - 248) * p;
        spaeth.y = 64 + (96 - 64) * p;
      } },
      { dur: 0, end: function () {
        World.addNpc('ost', {
          x: 192, y: 96, sprites: function () { return People.spaeth(); },
          talk: { name: 'Herr Späth', texts: SPAETH_TEXTS }
        });
        spaeth = null;
        spaethPhase = null;
        spaethDone = true;
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
    if (Dialog.isActive()) {
      Dialog.update(dt, Input);
    } else if (seq) {
      updateSeq(dt);
    } else if (spaethPhase === 'talk') {
      spaethAside();   // Gespräch ist beendet
    } else {
      Player.update(World, Input, dt);
      // Szene auslösen, bevor die Spielfigur das Dorf Richtung Osten verlässt
      if (!spaethDone && !spaeth && World.getScreen() === 'ost' && Player.getX() >= 232) {
        startSpaeth();
      } else {
        target = World.talkTarget(Player.getX(), Player.getY(), Player.getFacing());
        if (target && Input.pressed('a')) {
          Player.setPosition(Player.getX(), Player.getY());   // Laufanimation anhalten
          Dialog.open(target.name, target.texts);
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
    if (fade > 0) Render.px(0, 0, W, H, 'rgba(0,0,0,' + fade + ')');
    Input.clearPressed();

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
