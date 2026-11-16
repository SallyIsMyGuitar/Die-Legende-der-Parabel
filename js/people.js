// people.js: Sprites der Dorfbewohner (16x16, ohne Dialog)
// Jede Funktion liefert ein Array von Einzelbildern (Canvas) für die Animation.
var People = (function () {
  'use strict';

  var BASE = {
    o: '#22202e', s: '#f8d0a4', S: '#d9a074', w: '#ffffff', e: '#22202e'
  };

  function pal(extra) {
    var p = {};
    for (var k in BASE) p[k] = BASE[k];
    for (var j in extra) p[j] = extra[j];
    return p;
  }

  // Vorderansicht: h/H = Haare, t/T/D = Oberteil, p = Hose, B = Schuhe
  var FRONT = [
    '....oooooooo....',
    '...ohHHhhhhho...',
    '..ohHhhhhhhhho..',
    '..ohhhhhhhhhho..',
    '..ohhhshhshhho..',
    '..ohssssssssho..',
    '..oswessssewso..',
    '..oSsessssesSo..',
    '...oSSssssSSo...',
    '..oDtTttttTtDo..',
    '.osDttttttttDso.',
    '.osDttttttttDso.',
    '..oDDDDDDDDDDo..',
    '...oppo..oppo...',
    '...oppo..oppo...',
    '...oBBo..oBBo...'
  ];

  // Augen geschlossen (für Blinzeln)
  function blink(rows) {
    var r = rows.slice();
    r[6] = r[6].replace(/[we]/g, 's');
    r[7] = r[7].replace(/e/g, 'S');
    return r;
  }

  // Mutter: von hinten am Herd, zwei Bilder (Rühren)
  function mother() {
    var p = pal({
      m: '#5a3420', M: '#7e4c2c', c: '#c0506a', C: '#8e3450',
      a: '#f4f0e6', A: '#d8d2c4', B: '#5a3a2a'
    });
    var rows = [
      '.....oooooo.....',
      '....oMmmmmmo....',
      '...ommmmMmmmo...',
      '..ommmmmmmmmmo..',
      '..oMmmmmmmmmMo..',
      '..ommmmmmmmmmo..',
      '..oMmmmmmmmmMo..',
      '..oSmmmmmmmmSo..',
      '...oSSSSSSSSo...',
      '..occaccccacco..',
      '.oscaccccccacso.',
      '.oscaAaaaaAacso.',
      '..occccccccccco.',
      '..oCCCCCCCCCCo..',
      '...oCCCCCCCCo...',
      '....oBBoooBBo...'
    ];
    var stir = rows.slice();
    stir[10] = '.oscaccccccacsso';
    stir[11] = '.oscaAaaaaAacoo.';
    return [Render.sprite(rows, p), Render.sprite(stir, p)];
  }

  // Ältere Nachbarin: graue Haare mit Dutt, Brille, lila Strickjacke, Rock
  function neighbor() {
    var p = pal({
      h: '#c8c8d0', H: '#ececf2', g: '#4a3a5a',
      t: '#9a7ab8', T: '#c4a8dc', D: '#6a4a88',
      c: '#5a6a8a', C: '#3e4a66', B: '#4a3028'
    });
    var rows = FRONT.slice();
    rows[0] = '......oHHo......';
    rows[1] = '....ohHHhhhho...';
    rows[6] = '..osgegssgegso..';
    rows[7] = '..oSsgssssgsSo..';
    rows[12] = '..o' + 'cccccccccc' + 'o..';
    rows[13] = '..oCccccccccCo..';
    rows[14] = '...oCCCCCCCCo...';
    rows[15] = '....oBBooBBo....';
    return [Render.sprite(rows, p), Render.sprite(blink(rows), p)];
  }

  // Freund: schwarze Haare, rotes T-Shirt, Jeans, weiße Schuhe
  function friend() {
    var p = pal({
      h: '#2a2a38', H: '#50506a',
      t: '#d8443a', T: '#f07a6a', D: '#9a2a24',
      p: '#4a5a7a', B: '#f4f4f4'
    });
    var rows = FRONT.slice();
    rows[0] = '....o.oooo.o....';
    return [Render.sprite(rows, p), Render.sprite(blink(rows), p)];
  }

  // Ladenbesitzer: rotblonde Haare, grüne Schürze über weißem Hemd
  function shopkeeper() {
    var p = pal({
      h: '#c8783a', H: '#eaa266', m: '#9a5226',
      t: '#3f8a5a', T: '#f4f4f4', D: '#2a6040',
      p: '#4a4a5a', B: '#3a2a20'
    });
    var rows = FRONT.slice();
    rows[7] = '..oSsemmmmesSo..';   // Schnurrbart
    rows[9] = '..oTTtTTTTtTTo..';   // Hemdkragen und Schürzenträger
    return [Render.sprite(rows, p), Render.sprite(blink(rows), p)];
  }

  // Wanderin: dunkle Haare, orangefarbenes Oberteil, feste Schuhe
  function wanderer() {
    var p = pal({
      h: '#4a3020', H: '#6a4a30',
      t: '#e08a2a', T: '#f4b45a', D: '#a85e14',
      p: '#5a6a4a', B: '#6a4a2e'
    });
    var rows = FRONT.slice();
    return [Render.sprite(rows, p), Render.sprite(blink(rows), p)];
  }

  // Herr Späth: entflohener Lehrer, graues Haar, Brille, dunkler Anzug mit Krawatte
  function spaeth() {
    var p = pal({
      h: '#7a7a82', H: '#a0a0a8', g: '#3a3a48',
      t: '#3a4a66', T: '#54627e', D: '#26324a',
      k: '#a03030', p: '#4a4a52', B: '#2a2a30'
    });
    var rows = FRONT.slice();
    rows[6] = '..osgegssgegso..';   // Brille
    rows[7] = '..oSsgssssgsSo..';
    rows[9] = '..oTttkkktttTo..';   // Kragen mit roter Krawatte
    return [Render.sprite(rows, p), Render.sprite(blink(rows), p)];
  }

  // Förster: graue Haare, grüne Uniform, braune Stiefel
  function forester() {
    var p = pal({
      h: '#8a8a8a', H: '#b0b0b0',
      t: '#3f6a3a', T: '#548a4c', D: '#2a4a26',
      p: '#5a4a38', B: '#3a2a20'
    });
    var rows = FRONT.slice();
    return [Render.sprite(rows, p), Render.sprite(blink(rows), p)];
  }

  return {
    mother: mother,
    neighbor: neighbor,
    friend: friend,
    shopkeeper: shopkeeper,
    wanderer: wanderer,
    forester: forester,
    spaeth: spaeth
  };
})();
