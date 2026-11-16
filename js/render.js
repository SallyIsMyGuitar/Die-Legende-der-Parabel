// render.js: Skalierung des Canvas und Pixel-Zeichenhilfen
var Render = (function () {
  'use strict';

  var canvas, ctx;
  var LOGICAL_W = 256;
  var LOGICAL_H = 224;
  var TILE = 16;

  // Canvas auf ganzzahlige Vielfache der logischen Auflösung skalieren,
  // damit die Pixel scharf bleiben.
  function resize() {
    var wrap = document.getElementById('game-wrap');
    var availW = wrap.clientWidth;
    var availH = wrap.clientHeight;
    var scale = Math.max(1, Math.floor(Math.min(availW / LOGICAL_W, availH / LOGICAL_H)));
    canvas.style.width = (LOGICAL_W * scale) + 'px';
    canvas.style.height = (LOGICAL_H * scale) + 'px';
  }

  function init(canvasEl) {
    canvas = canvasEl;
    ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    window.addEventListener('resize', resize);
    resize();
  }

  // Ein einzelnes "Pixel"-Rechteck im logischen Raster zeichnen
  function px(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  }

  // Eine 16x16-Kachel an Bildschirmposition (tx, ty in Kacheln) zeichnen
  function tile(tx, ty, color) {
    px(tx * TILE, ty * TILE, TILE, TILE, color);
  }

  function getCtx() {
    return ctx;
  }

  return {
    init: init,
    resize: resize,
    px: px,
    tile: tile,
    TILE: TILE,
    WIDTH: LOGICAL_W,
    HEIGHT: LOGICAL_H
  };
})();
