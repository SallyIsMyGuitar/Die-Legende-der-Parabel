// render.js: Skalierung des Canvas, Zeichenebenen und Pixel-Zeichenhilfen
var Render = (function () {
  'use strict';

  var canvas, screenCtx, ctx;
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
    screenCtx = canvas.getContext('2d');
    screenCtx.imageSmoothingEnabled = false;
    ctx = screenCtx;
    window.addEventListener('resize', resize);
    resize();
  }

  // Unsichtbare Zeichenebene (z. B. für vorberechnete Hintergründe)
  function createLayer(w, h) {
    var c = document.createElement('canvas');
    c.width = w || LOGICAL_W;
    c.height = h || LOGICAL_H;
    var cx = c.getContext('2d');
    cx.imageSmoothingEnabled = false;
    return { canvas: c, ctx: cx };
  }

  // Zeichenziel umschalten; ohne Argument wieder auf den Bildschirm
  function setTarget(targetCtx) {
    ctx = targetCtx || screenCtx;
  }

  function getCtx() {
    return ctx;
  }

  // Ein "Pixel"-Rechteck im logischen Raster zeichnen
  // Koordinaten werden gerundet, damit keine unscharfen Halbpixel entstehen
  function px(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }

  // Eine 16x16-Kachel an Kachelposition (tx, ty) füllen
  function tile(tx, ty, color) {
    px(tx * TILE, ty * TILE, TILE, TILE, color);
  }

  // Gefüllte Pixel-Ellipse ohne Kantenglättung (Mittelpunkt cx/cy, Radien rx/ry)
  function ellipse(cx, cy, rx, ry, color) {
    ctx.fillStyle = color;
    for (var j = -ry; j < ry; j++) {
      var yy = (j + 0.5) / ry;
      var half = Math.round(rx * Math.sqrt(1 - yy * yy));
      if (half > 0) ctx.fillRect(Math.round(cx - half), cy + j, half * 2, 1);
    }
  }

  // Bild/Ebene an Position zeichnen, optional mit Deckkraft
  function image(src, x, y, alpha) {
    if (alpha !== undefined) ctx.globalAlpha = alpha;
    ctx.drawImage(src, Math.round(x), Math.round(y));
    if (alpha !== undefined) ctx.globalAlpha = 1;
  }

  // Pixel-Sprite aus Textzeilen erzeugen: jedes Zeichen ist eine Farbe aus
  // der Palette, '.' ist durchsichtig. flip spiegelt waagrecht.
  function sprite(rows, palette, flip) {
    var w = rows[0].length;
    var layer = createLayer(w, rows.length);
    var c = layer.ctx;
    for (var j = 0; j < rows.length; j++) {
      if (rows[j].length !== w) console.warn('Sprite-Zeile ' + j + ' hat falsche Länge: ' + rows[j]);
      for (var i = 0; i < w; i++) {
        var col = palette[rows[j].charAt(flip ? w - 1 - i : i)];
        if (!col) continue;
        c.fillStyle = col;
        c.fillRect(i, j, 1, 1);
      }
    }
    return layer.canvas;
  }

  // Kleine 3x5-Pixelschrift für Schilder (nur Großbuchstaben)
  var FONT = {
    A: ['.#.', '#.#', '###', '#.#', '#.#'], B: ['##.', '#.#', '##.', '#.#', '##.'],
    C: ['.##', '#..', '#..', '#..', '.##'], D: ['##.', '#.#', '#.#', '#.#', '##.'],
    E: ['###', '#..', '##.', '#..', '###'], F: ['###', '#..', '##.', '#..', '#..'],
    G: ['.##', '#..', '#.#', '#.#', '.##'], H: ['#.#', '#.#', '###', '#.#', '#.#'],
    I: ['###', '.#.', '.#.', '.#.', '###'], L: ['#..', '#..', '#..', '#..', '###'],
    N: ['##.', '#.#', '#.#', '#.#', '#.#'], O: ['.#.', '#.#', '#.#', '#.#', '.#.'],
    P: ['##.', '#.#', '##.', '#..', '#..'], R: ['##.', '#.#', '##.', '#.#', '#.#'],
    S: ['.##', '#..', '.#.', '..#', '##.'], T: ['###', '.#.', '.#.', '.#.', '.#.'],
    U: ['#.#', '#.#', '#.#', '#.#', '###'], 'Ü': ['#.#', '...', '#.#', '#.#', '###'],
    ' ': ['...', '...', '...', '...', '...']
  };

  function text(str, x, y, color) {
    x = Math.round(x);
    y = Math.round(y);
    ctx.fillStyle = color;
    for (var n = 0; n < str.length; n++) {
      var g = FONT[str.charAt(n)] || FONT[' '];
      for (var j = 0; j < 5; j++) {
        for (var i = 0; i < 3; i++) {
          if (g[j].charAt(i) === '#') ctx.fillRect(x + n * 4 + i, y + j, 1, 1);
        }
      }
    }
  }

  function textWidth(str) {
    return str.length * 4 - 1;
  }

  // Farbhilfen ---------------------------------------------------------
  function rgb(hex) {
    return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
  }

  // Lineare Mischung zweier RGB-Arrays
  function lerp(a, b, t) {
    t = Math.max(0, Math.min(1, t));
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  }

  // Sanfter Übergang zwischen zwei Hex-Farben, Ergebnis als CSS-Farbe
  function mix(c1, c2, t) {
    var c = lerp(rgb(c1), rgb(c2), t);
    return 'rgb(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ')';
  }

  // Deterministischer "Zufall" (0..1) pro Koordinatenpaar
  function hash(x, y) {
    var h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  }

  // Weiches Wertrauschen (0..1) für organische Farbverläufe
  function noise(x, y, scale, seed) {
    var gx = x / scale, gy = y / scale;
    var x0 = Math.floor(gx), y0 = Math.floor(gy);
    var fx = gx - x0, fy = gy - y0;
    fx = fx * fx * (3 - 2 * fx);
    fy = fy * fy * (3 - 2 * fy);
    var s = seed * 1013;
    var a = hash(x0 + s, y0), b = hash(x0 + 1 + s, y0);
    var c = hash(x0 + s, y0 + 1), d = hash(x0 + 1 + s, y0 + 1);
    return (a + (b - a) * fx) * (1 - fy) + (c + (d - c) * fx) * fy;
  }

  return {
    init: init,
    resize: resize,
    getCanvas: function () { return canvas; },
    createLayer: createLayer,
    setTarget: setTarget,
    getCtx: getCtx,
    px: px,
    tile: tile,
    ellipse: ellipse,
    image: image,
    sprite: sprite,
    text: text,
    textWidth: textWidth,
    rgb: rgb,
    lerp: lerp,
    mix: mix,
    hash: hash,
    noise: noise,
    TILE: TILE,
    WIDTH: LOGICAL_W,
    HEIGHT: LOGICAL_H
  };
})();
