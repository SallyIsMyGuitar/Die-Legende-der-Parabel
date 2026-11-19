// wueste.js: Der Weg nach Westen - Steppe, Duenen und Oase (Dungeon 4:
// Nullstellen und quadratische Gleichungen)
// Drei Bildschirme westlich des Dorfes, Wuesten-Optik: Sand (= Wegkacheln
// 'P', die sandfarben gezeichnet werden), Felsen ('V'), Kakteen ('K') und
// trockene Buesche ('B'). Am Ende liegt die Oase mit Rastquelle und
// Rätsel-Truhe vor dem Sandtempel ('E'), laut Plan folgen Erklaer-NPCs
// (Karawanenfuehrerin, Sterndeuter, Brunnenhueterin) in einem spaeteren
// Schritt. Angemeldet per World.addScreen().
(function () {
  'use strict';

  var TILE = 16;
  var hash = Render.hash;

  // ---Wuesten-Optik ---------------------------------------------------------

  // Sandsteintempel: Fassade mit Saeulen und parabelfoermigen Ornamenten,
  // in den Boden des Oasen-Bildschirms gebacken (ueber der Tuer 'E')
  function bakeTemple(r) {
    var x = 5 * TILE, y = 0;
    // Sandsteinwand
    r.px(x, y, 6 * TILE, 3 * TILE + 6, '#c8a05c');
    r.px(x, y, 6 * TILE, 2, '#e0bc7c');
    for (var i = 0; i < 6; i++) {
      r.px(x + i * TILE, y + (i % 2 ? 8 : 14), TILE, 1, '#b08044');
    }
    // zwei Saeulen links und rechts der Tuer
    for (var p = 0; p < 2; p++) {
      var px = x + 4 + p * (5 * TILE - 8);
      r.px(px, y + 6, 8, TILE + 10, '#b8905a');
      r.px(px + 1, y + 6, 2, TILE + 10, '#d8b076');
      r.px(px + 5, y + 6, 2, TILE + 10, '#9a7040');
      // Kapitell
      r.px(px - 1, y + 3, 10, 3, '#d0a468');
      r.px(px - 1, y + 3, 10, 1, '#e8c68c');
    }
    // Stufenzinnen oben
    for (var z = 0; z < 4; z++) r.px(x + 6 + z * 22, y, 12, 4, '#d0a468');
    // Parabel-Ornament (Hieroglyphen-artige Linie) in der Wandmitte
    for (var o = -14; o <= 14; o++) {
      var oy = Math.round(o * o / 28);
      if (oy <= 10 && o % 2 === 0) r.px(x + 3 * TILE + o, y + 22 - oy, 1, 1, '#7a5426');
    }
    r.px(x + 2 * TILE + 10, y + 20, 1, 4, '#7a5426');
    r.px(x + 3 * TILE + 10, y + 20, 1, 4, '#7a5426');
    r.px(x + 2 * TILE + 10, y + 19, 17, 1, '#7a5426');
    // fallender Sand an der Kante
    for (var s = 0; s < 8; s++) {
      r.px(x + 4 + s * 11, y + 3 * TILE + 3, 2, 1, '#e8cf98');
    }
    r.px(x, y + 3 * TILE + 4, 6 * TILE, 2, '#b08044');
  }

  // ---Die drei Bildschirme --------------------------------------------------

  // Steppe: erster Wuesten-Bildschirm (leicht, Karawanenfuehrerin folgt)
  World.addScreen('steppe', {
    map: [
      'PPPPPPPPPPPPPPPP',
      'PPKPPPVPPPPKPPPP',
      'PPPPPPPPPBPPPPPP',
      'PVPPPPPPPPPPPVPP',
      'PPPPPBPPPPPPPPPP',
      'PPPPPPPPPPPPPPPP',
      'PPKPPPPVPPPPPPPP',
      'PPPPPPPPPPPKPPPP',
      'PBPPPPPPPPPPPPVP',
      'PPPPVPPPKPPPPPPP',
      'PPPPPPPPPPPPPPPP',
      'PPKPPPPPPBVPPPPP',
      'PPPPPBPPKPPPPPPP',
      'PPPPPPPVPPPPKPPP'
    ],
    buildings: [],
    exits: { east: 'start', west: 'duenen' }
  });

  // Duenen: zweiter Bildschirm (mittel, Sterndeuter folgt)
  World.addScreen('duenen', {
    map: [
      'PPPPPPPPPPPPPPPP',
      'PPPVPPPKPPPPPPPP',
      'PPPPPPPPPPPPPPPP',
      'PPKPPPPPVPPPBPPP',
      'PPPPPPPPPPPPPPPP',
      'PPPPPPPPPPPPPPPP',
      'PBPPPPKPPPPVPPPP',
      'PPPPPPPPPPPPPPPP',
      'PPPPPPPPPKPPPPPP',
      'PVPPPBPPPPPPPKPP',
      'PPPPPPPPPPPPPPPP',
      'PPKPPPPVPPPPPPPP',
      'PPPPPPPPPPBPPPPP',
      'PPPPVPPPPPPPPPPP'
    ],
    buildings: [],
    exits: { east: 'steppe', west: 'oase' }
  });

  // Oase: dritter Bildschirm (schwer). Teich, Rastquelle vor dem
  // Sandtempel-Eingang und eine Raeetsel-Truhe (Brunnenhueterin folgt).
  World.addScreen('oase', {
    map: [
      'PPPPPPPPPPPPPPPP',
      'PPVPPPPPPPPPVPPP',
      'PPPPPPPPPPPPPPPP',
      'PPPPPPPEEPPPPPPP',
      'PPP~~~~~PiqPPPPP',
      'PP~~~~~~PPPPPPPP',
      'PP~~~~~~PKPPPPPP',
      'PPP~~~~PPPPPPPPP',
      'PPPP~~PPPVPPBPPP',
      'PPPPPPPPPPPPPPPP',
      'PPVPPBPPPPKPPCPP',
      'PPPPPPPPPPPPPPPP',
      'PKPPPPVPPPPPPPPP',
      'PPPPPPPPPPPPPPPP'
    ],
    buildings: [],
    bakeExtra: function (r) { bakeTemple(r); },
    signs: [
      {
        // Schild vor dem Tempel
        tiles: [[9, 4]], x: 9 * 16, y: 4 * 16, name: 'Schild',
        texts: ['Sandtempel. Sein Wächter steht im Bann des Grafen.']
      },
      {
        // Rastquelle vor dem Eingang des Sandtempels (sieht aus wie der Dorfbrunnen)
        tiles: [[10, 4]], x: 10 * 16, y: 4 * 16, name: 'Quelle',
        texts: ['Du trinkst vom klaren Wasser. Deine Herzen sind wieder voll.'],
        action: 'rest',
        spawn: { x: 10 * 16, y: 5 * 16, facing: 'up' }
      },
      {
        // Freiwillige Raeetsel-Truhe mit dem Schwert als Belohnung
        tiles: [[13, 10]], x: 13 * 16, y: 10 * 16, name: 'Truhe',
        texts: ['Die Truhe ist leer.'], action: 'chest'
      }
    ],
    dungeon: 'seingang',
    exits: { east: 'duenen' }
  });
})();
