// boss.js: Waechter der Hoehle der Parabeln - Boss des ersten Dungeons
// Er stellt mehrere feste, von der Lehrkraft gepruefte Aufgaben nacheinander
// (tasks.js, bossTasks). Jede richtige Antwort kostet ihn ein Herz, das
// Schwert wirkt bei ihm nicht. Nach dem Sieg oeffnet sich das Boss-Tor.
var Boss = (function () {
  'use strict';

  var MAX_HP = 3;          // eine feste Aufgabe = ein Herz
  var X = 102, Y = 60;     // linke obere Ecke; Bildmitte (112, 72)

  var hp = MAX_HP;
  var defeated = false;
  var fighting = false;
  var dieT = 0;            // Start der Besiegt-Animation

  function startFight() { fighting = true; }
  // Richtige Antwort: ein Herz weg, Restherz zurueck
  function damage() { hp = Math.max(0, hp - 1); fighting = hp > 0; return hp; }
  // Wievielte Aufgabe ist dran (0 bis 2)
  function index() { return MAX_HP - hp; }
  function die() { fighting = false; defeated = true; dieT = performance.now(); }

  // Kleines Herz: gefuellt oder leer (Form, nicht nur Farbe)
  function heart(r, cx, cy, full) {
    var col = full ? '#e8344a' : '#55506a';
    r.px(cx - 2, cy, 2, 2, col);
    r.px(cx + 1, cy, 2, 2, col);
    r.px(cx - 2, cy + 2, 5, 1, col);
    r.px(cx - 1, cy + 3, 3, 1, col);
    r.px(cx, cy + 4, 1, 1, col);
  }

  // Herzleiste unter dem schwebenden Waechter
  function drawHearts(r, alpha) {
    var ctx = r.getCtx();
    if (alpha !== undefined) ctx.globalAlpha = alpha;
    for (var i = 0; i < MAX_HP; i++) heart(r, 100 + i * 7, 94, i < hp);
    if (alpha !== undefined) ctx.globalAlpha = 1;
  }

  // Schwebe-Statue: dunkler Stein, leuchtende Augen, Parabel auf der Brust
  function drawLiving(r, now, alpha) {
    var ctx = r.getCtx();
    var bob = Math.round(Math.sin(now / 500) * 2);
    var x = X, y = Y + bob;
    if (alpha !== undefined) ctx.globalAlpha = alpha;

    // Schatten auf dem Hoehlenboden
    ctx.globalAlpha = (alpha === undefined ? 1 : alpha) * 0.35;
    r.ellipse(112, 90, 12, 3, '#000000');
    ctx.globalAlpha = alpha === undefined ? 1 : alpha;

    // Arme aus Stein
    r.px(x - 3, y + 8, 5, 13, '#3a3546');
    r.px(x + 18, y + 8, 5, 13, '#3a3546');
    r.px(x - 3, y + 8, 5, 1, '#524c60');
    r.px(x + 18, y + 8, 5, 1, '#524c60');

    // Kopf mit leuchtenden Augen
    r.px(x + 5, y, 10, 8, '#5a5468');
    r.px(x + 5, y, 10, 1, '#6e6880');
    r.px(x + 6, y + 7, 8, 1, '#3e3a4a');
    var eye = hp > 1 ? '#6ae0f0' : hp === 1 ? '#e8443a' : '#55506a';
    r.px(x + 6, y + 3, 2, 2, eye);
    r.px(x + 12, y + 3, 2, 2, eye);
    r.px(x + 6, y + 3, 1, 1, '#d8f8ff');
    r.px(x + 12, y + 3, 1, 1, '#d8f8ff');

    // Rumpf
    r.px(x + 2, y + 8, 16, 13, '#4a4456');
    r.px(x + 2, y + 8, 16, 1, '#5e5870');
    r.px(x + 3, y + 9, 2, 4, '#5e5870');

    // Parabel-Glyphe auf der Brust (goldene Kurve)
    for (var i = -3; i <= 3; i++) {
      r.px(x + 10 + i, y + 17 - Math.round(i * i * 0.5), 1, 1, '#f0c040');
    }

    // Risse je nach erlittenem Schaden
    if (hp <= 2) {
      r.px(x + 13, y + 10, 1, 4, '#2c2838');
      r.px(x + 14, y + 13, 1, 3, '#2c2838');
    }
    if (hp === 1) {
      r.px(x + 5, y + 12, 3, 1, '#2c2838');
      r.px(x + 7, y + 13, 1, 4, '#2c2838');
      r.px(x + 11, y + 17, 4, 1, '#2c2838');
    }

    // Schwebender Unterbau, nach unten schmaler werdend
    r.px(x + 4, y + 21, 12, 3, '#3e3a4a');
    r.px(x + 6, y + 24, 8, 2, '#332f40');
    r.px(x + 8, y + 26, 4, 1, '#332f40');

    ctx.globalAlpha = 1;
  }

  // Besiegt-Animation: Statue sackt ab und zerfaellt in Staub und Stein
  function drawDying(r, now) {
    var t = (now - dieT) / 1000;
    if (t > 1.4) return;
    var ctx = r.getCtx();
    var p = Math.min(1, t / 1.2);
    drawLiving(r, dieT + 1, Math.max(0, 1 - p) );   // einfrieren, abblenden
    // Staubwolke, die nach oben zieht
    ctx.globalAlpha = Math.max(0, 0.7 - p * 0.7);
    for (var i = 0; i < 5; i++) {
      var wx = 96 + i * 8 + Math.sin(i * 2) * 3;
      var wy = 78 - p * 24 + Math.cos(i * 3) * 4;
      r.ellipse(wx, wy, 4 + p * 3, 3 + p * 2, '#cfc8d8');
    }
    ctx.globalAlpha = 1;
  }

  // Alles together: lebend, im Kampf mit Herzen, oder beim Zerfallen
  function draw(r, now) {
    if (defeated) {
      if (now - dieT < 1500) drawDying(r, now);
      return;
    }
    drawLiving(r, now);
    drawHearts(r);
  }

  return {
    startFight: startFight,
    damage: damage,
    index: index,
    die: die,
    draw: draw,
    drawHearts: drawHearts,
    isFighting: function () { return fighting; },
    isDefeated: function () { return defeated; }
  };
})();
