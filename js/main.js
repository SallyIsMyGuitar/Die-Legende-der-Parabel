// main.js: Start, Spielschleife und Abläufe (Tür-Animation, Bildschirmwechsel)
(function () {
  'use strict';

  var canvas = document.getElementById('game-canvas');
  var W = Render.WIDTH, H = Render.HEIGHT;

  Render.init(canvas);
  Input.init();

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

    if (seq) {
      updateSeq(dt);
    } else {
      Player.update(World, Input, dt);
      var w = World.checkWarp(Player.getX(), Player.getY(), Player.getFacing());
      if (w && w.type === 'enter') enterHouse(w);
      else if (w && w.type === 'exit') leaveHouse(w);
      else {
        var edge = World.checkEdge(Player.getX(), Player.getY());
        if (edge) startSlide(edge);
      }
    }

    drawScene(now);
    Fx.draw(Render, now, World.isOutdoor());
    Hud.draw(Render);
    if (fade > 0) Render.px(0, 0, W, H, 'rgba(0,0,0,' + fade + ')');

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
