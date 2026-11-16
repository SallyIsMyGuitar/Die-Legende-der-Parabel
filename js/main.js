// main.js: Start und Spielschleife
(function () {
  'use strict';

  var canvas = document.getElementById('game-canvas');

  // Initialisierung
  Render.init(canvas);
  Input.init();

  // Spielschleife mit zeitunabhängiger Bewegung
  var lastTime = null;

  function loop(now) {
    if (lastTime === null) lastTime = now;
    var dt = Math.min((now - lastTime) / 1000, 0.1); // Begrenzung gegen Sprünge
    lastTime = now;

    Player.update(World, Input, dt);

    // Zeichenreihenfolge: Boden – Figur – Kronen/Haus – Atmosphäre – Anzeige
    World.drawGround(Render, now);
    Player.draw(Render);
    World.drawOverlay(Render, now);
    Fx.draw(Render, now);
    Hud.draw(Render);

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
