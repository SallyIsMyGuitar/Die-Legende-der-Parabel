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

  // Blickrichtungen je Figur: down, up, left, right (down mit Blinzeln)
  function dirs(p) {
    var front = FRONT.slice();
    return {
      down: [Render.sprite(front, p), Render.sprite(blink(front), p)],
      up: [backSprite(p)],
      left: [sideSprite(p, true)],
      right: [sideSprite(p, false)]
    };
  }

  // Rückenansicht: Haare statt Gesicht
  function backSprite(p) {
    var rows = FRONT.slice();
    rows[4] = '..ohhhhhhhhhho..';
    rows[5] = '..ohhhhhhhhhho..';
    rows[6] = '..oHhhhhhhhhHo..';
    rows[7] = '..oShhhhhhhhSo..';
    return Render.sprite(rows, p);
  }

  // Seitenansicht nach rechts; mirror = true heißt Blick nach links
  function sideSprite(p, mirror) {
    // Zeilen 1–3 mit '.' auf 16 Zeichen aufgefüllt (vorher 15 Zeichen und
    // Konsolen-Warnung); das letzte Pixel war schon durchsichtig, das Bild bleibt gleich
    var rows = [
      '....oooooooo....',
      '...ohhhHHhho....',
      '..ohhhhhHHhho...',
      '..ohhhhhhhhhho..',
      '..oHhhhsssssso..',
      '..ohhhhssssweo..',
      '..oHhhsssssseo..',
      '..oSHsssssssssso',
      '...oSSssssSSo...',
      '..ottDttttttDo..',
      '.ottDtttttttDso.',
      '.otTDtttttttDso.',
      '..ottDDDDDDDDo..',
      '...oppo..oppo...',
      '...oBBo..oBBo...',
      '...oBBo..oBBo...'
    ];
    return Render.sprite(rows, p, mirror === true);
  }

  // Wanderin: dunkle Haare, orangefarbenes Oberteil, feste Schuhe
  function wanderer() {
    return dirs(pal({
      h: '#4a3020', H: '#6a4a30',
      t: '#e08a2a', T: '#f4b45a', D: '#a85e14',
      p: '#5a6a4a', B: '#6a4a2e'
    }));
  }

  // Herr Späth: entflohener Lehrer, dunkelgraue Haare, blaues T-Shirt,
  // beige Chino, weiße Sneaker
  function spaeth() {
    return dirs(pal({
      h: '#4a4a52', H: '#6a6a74',
      t: '#3e64a8', T: '#5a80d0', D: '#2c4a80',
      p: '#c8b48a', B: '#f4f4f4'
    }));
  }

  // Förster: graue Haare, grüne Uniform, braune Stiefel
  function forester() {
    return dirs(pal({
      h: '#8a8a8a', H: '#b0b0b0',
      t: '#3f6a3a', T: '#548a4c', D: '#2a4a26',
      p: '#5a4a38', B: '#3a2a20'
    }));
  }

  // Forscherin (Hoehle): blonde Haare, heller Forschermantel, dunkle Hose
  function researcher() {
    return dirs(pal({
      h: '#d8b860', H: '#f0d888',
      t: '#e4e2ea', T: '#ffffff', D: '#a8a4b4',
      p: '#3a3a4a', B: '#5a3a24'
    }));
  }

  // Einsiedler (Ruine): weisse Haare, brauner Umhang, Sandalen
  function hermit() {
    return dirs(pal({
      h: '#e8e4dc', H: '#ffffff',
      t: '#7a5a3a', T: '#9a7650', D: '#56402a',
      p: '#6a5038', B: '#a07850'
    }));
  }

  // Gaertnerin (Felder): dunkle Haare mit Tuch, gruene Arbeitsschuerze
  function gartnerin() {
    return dirs(pal({
      h: '#4a3020', H: '#a87848',
      t: '#f4f4f4', T: '#dfe4dc', D: '#a8a89a',
      p: '#5a6a4a', B: '#6a4a2e'
    }));
  }

  // Fischer (Klippenweg): gelber Oelpelz, blaue Muetze, dunkle Hose
  function fischer() {
    return dirs(pal({
      h: '#3a3028', H: '#3e64a8',
      t: '#e0b83a', T: '#f0d070', D: '#b89420',
      p: '#3a3a4a', B: '#2a3a52'
    }));
  }

  // Tuermerin (Leuchtturm, Dungeon 2): rotbraune Haare, dunkelblaues Kleid
  function tuemerin() {
    return dirs(pal({
      h: '#7a4020', H: '#a85a30',
      t: '#3a4a6a', T: '#5a6a8a', D: '#2a3450',
      p: '#2e2a3e', B: '#3a2a20'
    }));
  }

  // Netzweber (Wasserreich, Dungeon 3): schwarze Haare, tuerkiser Umhang
  function netzweber() {
    return dirs(pal({
      h: '#1e1a2a', H: '#3a3448',
      t: '#2a8a8a', T: '#4aa8a8', D: '#1a6a6a',
      p: '#2a3448', B: '#1a2438'
    }));
  }

  // Turmwaerter (Kueste): graue Haare, dunkelblaue Uniform, braune Stiefel
  function turmwaerter() {
    return dirs(pal({
      h: '#8a8a8a', H: '#b0b0b0',
      t: '#3a4a6a', T: '#5a6a8a', D: '#2a3450',
      p: '#2e2a3e', B: '#3a2a20'
    }));
  }

  return {
    researcher: researcher,
    hermit: hermit,
    mother: mother,
    neighbor: neighbor,
    friend: friend,
    shopkeeper: shopkeeper,
    wanderer: wanderer,
    forester: forester,
    spaeth: spaeth,
    gartnerin: gartnerin,
    fischer: fischer,
    turmwaerter: turmwaerter,
    tuemerin: tuemerin,
    netzweber: netzweber
  };
})();
