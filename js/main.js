// main.js: Start und Spielschleife
(function () {
  'use strict';

  var canvas = document.getElementById('game-canvas');

  // Initialisierung
  Render.init(canvas);
  Input.init();

  // Spielschleife mit zeitunabhängiger Bewegung
  var lastTime = null;

  // Bildschirmwechsel mit Abblende: fadeDir 1 = abdunkeln, -1 = aufhellen
  var fade = 0, fadeDir = 0, warp = null;

  function loop(now) {
    if (lastTime === null) lastTime = now;
    var dt = Math.min((now - lastTime) / 1000, 0.1); // Begrenzung gegen Sprünge
    lastTime = now;

    if (!warp) {
      Player.update(World, Input, dt);
      warp = World.checkWarp(Player.getX(), Player.getY(), Player.getFacing());
      if (warp) fadeDir = 1;
    }
    if (fadeDir === 1) {
      fade = Math.min(1, fade + dt * 4);
      if (fade === 1) {
        World.setScreen(warp.to);
        Player.setPosition(warp.x, warp.y, warp.facing);
        fadeDir = -1;
      }
    } else if (fadeDir === -1) {
      fade = Math.max(0, fade - dt * 4);
      if (fade === 0) { fadeDir = 0; warp = null; }
    }

    // Zeichenreihenfolge: Boden – Figur – Kronen/Haus – Atmosphäre – Anzeige
    World.drawGround(Render, now);
    Player.draw(Render);
    World.drawOverlay(Render, now);
    Fx.draw(Render, now, World.isOutdoor());
    Hud.draw(Render);
    if (fade > 0) Render.px(0, 0, Render.WIDTH, Render.HEIGHT, 'rgba(0,0,0,' + fade + ')');

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
