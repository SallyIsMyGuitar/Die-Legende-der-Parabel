// fx.js: Atmosphäre – Schmetterlinge, ziehende Wolkenschatten, Vignette
var Fx = (function () {
  'use strict';

  var W = Render.WIDTH, H = Render.HEIGHT;
  var cloudLayer = null, vignette = null;

  var butterflies = [
    { x: 56, y: 170, color: '#fff4b0', speed: 1.0, phase: 0.0 },
    { x: 200, y: 182, color: '#f6a0c8', speed: 0.8, phase: 2.1 },
    { x: 214, y: 60, color: '#a8d8ff', speed: 1.2, phase: 4.2 }
  ];

  var clouds = [
    { offset: 0, y: 40, parts: [[0, 0, 30, 14], [22, -6, 20, 12], [-20, 4, 18, 10]] },
    { offset: 230, y: 150, parts: [[0, 0, 26, 12], [-18, -4, 16, 10], [18, 3, 18, 9]] }
  ];

  function buildVignette() {
    vignette = Render.createLayer(W, H);
    var ctx = vignette.ctx;
    // warmes Licht von links oben
    var warm = ctx.createLinearGradient(0, 0, W, H);
    warm.addColorStop(0, 'rgba(255,236,180,0.12)');
    warm.addColorStop(0.5, 'rgba(255,236,180,0)');
    ctx.fillStyle = warm;
    ctx.fillRect(0, 0, W, H);
    // abgedunkelte Ränder
    var g = ctx.createRadialGradient(W / 2, H / 2, H * 0.38, W / 2, H / 2, H * 0.9);
    g.addColorStop(0, 'rgba(8,16,24,0)');
    g.addColorStop(1, 'rgba(8,16,24,0.5)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  function drawClouds(r, t) {
    if (!cloudLayer) cloudLayer = Render.createLayer(W, H);
    var ctx = cloudLayer.ctx;
    ctx.clearRect(0, 0, W, H);
    Render.setTarget(ctx);
    for (var i = 0; i < clouds.length; i++) {
      var c = clouds[i];
      var cx = ((t * 0.006 + c.offset) % (W + 120)) - 60;
      var cy = c.y + Math.round(Math.sin(t * 0.0002 + i) * 4);
      for (var j = 0; j < c.parts.length; j++) {
        var p = c.parts[j];
        Render.ellipse(Math.round(cx + p[0]), cy + p[1], p[2], p[3], '#0e2638');
      }
    }
    Render.setTarget(null);
    r.image(cloudLayer.canvas, 0, 0, 0.13);
  }

  function drawButterflies(r, t) {
    for (var i = 0; i < butterflies.length; i++) {
      var b = butterflies[i];
      var s = t * 0.001 * b.speed;
      var x = Math.round(b.x + Math.sin(s * 0.7 + b.phase) * 26 + Math.sin(s * 1.9 + b.phase) * 6);
      var y = Math.round(b.y + Math.sin(s * 1.1 + b.phase * 2) * 14 + Math.sin(s * 3.3) * 3);
      var open = Math.floor(t / 110 + i * 3) % 2 === 0;
      r.px(x - 1, y + 7, 3, 1, 'rgba(12,42,18,0.3)');   // Schatten
      if (open) {
        r.px(x - 3, y - 1, 3, 2, b.color);
        r.px(x + 1, y - 1, 3, 2, b.color);
        r.px(x - 2, y + 1, 2, 1, b.color);
        r.px(x + 1, y + 1, 2, 1, b.color);
      } else {
        r.px(x - 1, y - 2, 1, 3, b.color);
        r.px(x + 1, y - 2, 1, 3, b.color);
      }
      r.px(x, y - 1, 1, 3, '#2a2030');
    }
  }

  // Schmetterlinge und Wolken nur draußen, Vignette überall
  function draw(r, time, outdoor) {
    var t = time || 0;
    if (!vignette) buildVignette();
    if (outdoor) {
      drawButterflies(r, t);
      drawClouds(r, t);
    }
    r.image(vignette.canvas, 0, 0);
  }

  return { draw: draw };
})();
