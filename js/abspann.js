// abspann.js: Abspann nach dem Sieg ueber Graf Gerade (Meilenstein 6, Schritt 1)
// Vier Standbild-Seiten, weiter mit A; B springt auf die letzte Seite
// (Statistik). A auf der letzten Seite beendet den Abspann. Texte vorlaeufig.
// Die Lehrkraefte im Abspann sind kleine generische Figuren ohne Namen.
var Abspann = (function () {
  'use strict';

  var W = 256, H = 224;
  var hash = Render.hash;
  var GOLD = '#f0c040', TEXT = '#f6f0e2', DIM = '#8a8496';
  var PAGES = 4;   // Befreiung, Wiederaufbau, Wappen, Statistik

  var active = false;
  var page = 0;
  var t = 0;              // Sekunden auf der aktuellen Seite (fuer Einblendungen)
  var wappens = 0;
  var stats = { right: 0, wrong: 0 };
  var onDone = null;

  // Seitenueberschriften (vorlaeufig; Herr Spaeth und Herr Dietl fehlen hier
  // absichtlich)
  var TITLES = [
    ['Der Bann ist zerbrochen.', 'Die Lehrerinnen und Lehrer sind frei!'],
    ['Die Schule wird wieder aufgebaut.', 'Bald klingt die Schulglocke wieder ueber dem Dorf.'],
    ['Deine Wappen', ''],
    ['Deine Rechnungen', 'Danke für dein Spielen!']
  ];
  // Namen der fuenf Wappen in der Reihenfolge der Dungeons
  var WAPPEN = ['Normalparabel', 'Scheitelform', 'Allgemeine Form', 'Nullstellen', 'Anwendungen'];

  function start(w, s, done) {
    wappens = w || 0;
    stats = { right: (s && s.right) || 0, wrong: (s && s.wrong) || 0 };
    onDone = done;
    page = 0;
    t = 0;
    active = true;
  }

  function update(dt, input) {
    if (!active) return;
    t += dt;
    if (input.pressed('a')) {
      if (page < PAGES - 1) { page++; t = 0; }
      else {
        active = false;
        if (onDone) onDone();
      }
      return;
    }
    // B ueberspringt direkt zur Statistik (letzten Seite)
    if (input.pressed('b') && page < PAGES - 1) { page = PAGES - 1; t = 0; }
  }

  function center(ctx, str, y, color) {
    Font.draw(ctx, str, Math.round((W - Font.width(str)) / 2), y, color || TEXT);
  }

  // Kleine generische Figur (Lehrerin/Lehrer) ohne Namen, 10 x 14 Pixel
  function person(r, x, y, hair, cloth, bob) {
    y += bob;
    r.px(x + 2, y, 6, 2, hair);                      // Haare
    r.px(x + 3, y + 2, 4, 3, '#f0c8a8');             // Gesicht
    r.px(x + 3, y + 3, 1, 1, '#22202e');
    r.px(x + 6, y + 3, 1, 1, '#22202e');
    r.px(x + 2, y + 5, 6, 5, cloth);                 // Oberteil
    r.px(x + 1, y + 5, 1, 4, cloth);                 // Arme
    r.px(x + 8, y + 5, 1, 4, cloth);
    r.px(x + 2, y + 10, 2, 4, '#3a3a52');            // Beine
    r.px(x + 6, y + 10, 2, 4, '#3a3a52');
    r.px(x + 2, y + 14, 2, 1, '#22202e');            // Schuhe
    r.px(x + 6, y + 14, 2, 1, '#22202e');
  }

  // Haken (gruen) bzw. Kreuz (rot): Form und Farbe unterscheiden sich
  function mark(r, x, y, ok) {
    if (ok) {
      r.px(x, y + 4, 1, 3, '#58b04a');
      r.px(x + 1, y + 5, 1, 3, '#58b04a');
      r.px(x + 2, y + 4, 1, 2, '#58b04a');
      r.px(x + 3, y + 2, 1, 3, '#58b04a');
      r.px(x + 4, y + 1, 1, 2, '#58b04a');
      r.px(x + 5, y, 1, 2, '#58b04a');
    } else {
      for (var i = 0; i < 7; i++) {
        r.px(x + i, y + i, 1, 1, '#e8344a');
        r.px(x + 6 - i, y + i, 1, 1, '#e8344a');
      }
    }
  }

  // Wappen-Schild mit Parabel; fertig = gold mit Kurve, sonst grauer Umriss
  function wappen(r, x, y, fertig) {
    var edge = fertig ? GOLD : '#4a4656';
    var body = fertig ? '#2e4e9a' : '#2a2838';
    var i, k;
    for (i = 0; i < 14; i++) {
      var inset = i > 9 ? Math.floor((i - 9) * 1.6) : 0;   // unten spitz zulaufend
      r.px(x + inset, y + i, 14 - inset * 2, 1, edge);
      if (inset === 0 && i > 0 && i < 13) r.px(x + 1, y + i, 12, 1, body);
    }
    r.px(x, y, 14, 1, edge);
    r.px(x + 1, y + 1, 12, 1, body);
    if (!fertig) return;   // noch nicht errungen: nur Umriss
    // Parabel als Zierde im Schild
    for (k = -5; k <= 5; k++) {
      r.px(x + 7 + k, y + 11 - Math.round(k * k / 3.2), 1, 1, TEXT);
    }
    r.px(x + 7, y + 4, 2, 1, GOLD);
    r.px(x + 7, y + 4, 1, 2, GOLD);
  }

  // Sanfter Parabelbogen als Zierde unten auf jeder Seite
  function arcs(r, now) {
    var ctx = r.getCtx();
    ctx.globalAlpha = 0.5 + 0.3 * Math.sin(now / 700);
    for (var p = 0; p < 3; p++) {
      var bx = 48 + p * 80;
      for (var o = -7; o <= 7; o++) r.px(bx + o * 2, 198 - Math.round(o * o / 3.5), 1, 1, GOLD);
    }
    ctx.globalAlpha = 1;
  }

  function stars(r, now) {
    for (var i = 0; i < 26; i++) {
      var sx = 4 + Math.floor(hash(i, 7) * 248);
      var sy = 4 + Math.floor(hash(7, i) * 150);
      var on = Math.floor((now / 500 + i) % 6) > 1;
      if (on) r.px(sx, sy, 1, 1, 'rgba(246,240,226,' + (0.25 + 0.5 * hash(i, 3)) + ')');
    }
  }

  // Seite 1: befreite Lehrkräfte ziehen aus der offenen Tür des Schlosses
  function sceneBefreiung(r, now) {
    // Silhouette des Schlosses (die alte Schule)
    r.px(56, 96, 144, 76, '#242030');
    for (var i = 0; i < 14; i++) r.px(56 + i * 2 + 6, 96 - i, 144 - i * 4, 1, '#1c1828');
    r.px(120, 148, 16, 24, '#141220');                        // Turoeffnung
    var glow = 0.5 + 0.3 * Math.sin(now / 600);
    r.px(120, 148, 16, 24, 'rgba(248,224,160,' + (glow * 0.35) + ')');
    r.px(40, 172, 176, 1, '#2e2a3c');                         // Boden
    // vier Lehrkraefte, die herauskommen (wippender Gang)
    person(r, 118, 157, '#4a3226', '#7a4e9c', Math.floor(now / 260) % 2);
    person(r, 138, 157, '#2a2a32', '#3a6a8c', Math.floor(now / 260 + 1) % 2);
    person(r, 100, 157, '#6a4a24', '#a04a48', Math.floor(now / 260) % 2);
    person(r, 90, 157, '#4a4a52', '#5a8a4a', Math.floor(now / 260 + 1) % 2);
  }

  // Seite 2: die wiederaufgebaute Schule (Gebaeude, wiederverwendbar in
  // Schritt 2 ueber Buildings.schoolIntact)
  function sceneAufbau(r, now) {
    Buildings.schoolIntact(r, { x: 5, y: 6, w: 10, h: 5 });
    // aufsteigende Stäubchen als dezente Animation
    for (var i = 0; i < 8; i++) {
      var p = ((now / 1400 + i * 0.4) % 1);
      var sx = 86 + Math.floor(hash(i, 11) * 84);
      r.px(sx, 176 - Math.round(p * 60), 1, 1, 'rgba(240,192,64,' + (0.7 - p * 0.6) + ')');
    }
  }

  function draw(r, now) {
    var ctx = r.getCtx();
    r.px(0, 0, W, H, '#191722');
    stars(r, now);

    var title = TITLES[page];
    center(ctx, title[0], 20, page === 2 || page === 3 ? GOLD : TEXT);
    if (title[1]) center(ctx, title[1], 34, TEXT);

    if (page === 0) sceneBefreiung(r, now);
    else if (page === 1) sceneAufbau(r, now);
    else if (page === 2) {
      center(ctx, wappens + ' von 5 Wappen', 34, DIM);
      for (var i = 0; i < 5; i++) {
        var y = 56 + i * 26;
        var fertig = i < wappens;
        wappen(r, 70, y, fertig);
        Font.draw(ctx, WAPPEN[i], 94, y + 4, fertig ? TEXT : DIM);
      }
    } else {
      mark(r, 92, 70, true);
      Font.draw(ctx, 'Richtig: ' + stats.right, 108, 72, TEXT);
      mark(r, 92, 96, false);
      Font.draw(ctx, 'Falsch: ' + stats.wrong, 108, 98, TEXT);
      var prozent = stats.right + stats.wrong > 0
        ? Math.round(stats.right * 100 / (stats.right + stats.wrong)) : 100;
      center(ctx, 'Im ersten Versuch richtig: ' + prozent + ' von 100', 128, DIM);
    }

    arcs(r, now);

    // Fusszeile: Bedienung (A weiter bzw. Ins Dorf, B ueberspringen)
    if (page < PAGES - 1) {
      var fw = Font.width('A: Weiter');
      Font.draw(ctx, 'A: Weiter', W - 8 - fw, 208, DIM);
      Font.draw(ctx, 'B: Überspringen', 8, 208, DIM);
    } else {
      var lw = Font.width('A: Ins Dorf');
      Font.draw(ctx, 'A: Ins Dorf', W - 8 - lw, 208, DIM);
    }
  }

  return {
    start: start,
    update: update,
    draw: draw,
    isActive: function () { return active; },
    onLast: function () { return active && page === PAGES - 1; }
  };
})();
