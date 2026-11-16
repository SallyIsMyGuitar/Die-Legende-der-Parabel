// main.js: Start und Spielschleife
(function () {
  'use strict';

  var canvas = document.getElementById('game-canvas');

  // Initialisierung
  Render.init(canvas);
  World.draw(Render);
  Input.init();

  // Spielschleife mit zeitunabhängiger Bewegung
  var lastTime = null;

  function loop(now) {
    if (lastTime === null) lastTime = now;
    var dt = Math.min((now - lastTime) / 1000, 0.1); // Begrenzung gegen Sprünge
    lastTime = now;

    Player.update(World, Input, dt);

    World.draw(Render);
    Player.draw(Render);

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
