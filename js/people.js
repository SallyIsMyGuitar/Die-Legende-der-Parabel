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

  // Kinder sind eine Zeile kleiner: eine Rumpfzeile faellt weg, oben
  // kommt eine leere Zeile dazu (Fuesse bleiben auf derselben Hoehe)
  function small(rows) {
    var r = rows.slice();
    r.splice(10, 1);
    r.unshift('................');
    return r;
  }

  // Blickrichtungen je Figur: down, up, left, right (down mit Blinzeln);
  // kind = true zeichnet die Figur als Kind (etwas kleiner)
  function dirs(p, kind) {
    var front = kind ? small(FRONT) : FRONT.slice();
    return {
      down: [Render.sprite(front, p), Render.sprite(blink(front), p)],
      up: [backSprite(p, kind)],
      left: [sideSprite(p, true, kind)],
      right: [sideSprite(p, false, kind)]
    };
  }

  // Rückenansicht: Haare statt Gesicht
  function backSprite(p, kind) {
    var rows = FRONT.slice();
    rows[4] = '..ohhhhhhhhhho..';
    rows[5] = '..ohhhhhhhhhho..';
    rows[6] = '..oHhhhhhhhhHo..';
    rows[7] = '..oShhhhhhhhSo..';
    return Render.sprite(kind ? small(rows) : rows, p);
  }

  // Seitenansicht nach rechts; mirror = true heißt Blick nach links
  function sideSprite(p, mirror, kind) {
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
    return Render.sprite(kind ? small(rows) : rows, p, mirror === true);
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

  // Maschinistin (Wasserkraftwerk, Dungeon 3): gelber Schutzhelm,
  // blauer Arbeitsanzug, schwarze Sicherheitsschuhe
  function maschinistin() {
    var p = pal({
      h: '#f0c030', H: '#fae070', k: '#b48a14', q: '#5a3a24',
      t: '#2e5a9a', T: '#4a7ac0', D: '#1e3e70',
      p: '#2e5a9a', B: '#1a1a20'
    });
    var d = dirs(p);
    // Vorderansicht mit Helmkrempe (k) und dunklem Haaransatz (q)
    var front = FRONT.slice();
    front[3] = '.okkkkkkkkkkkko.';
    front[4] = '..oqqsssssqqqo..';
    d.down = [Render.sprite(front, p), Render.sprite(blink(front), p)];
    return d;
  }

  // Netzweber (frueher Erklaer-NPC im Dungeon 3, jetzt Sprite einer
  // befreiten Lehrerin): schwarze Haare, tuerkiser Umhang
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

  // Karawanenfuehrerin (Steppe, Dungeon 4): dunkles Tuch, gelbe Robe
  function karawanenfuehrerin() {
    return dirs(pal({
      h: '#3a2418', H: '#c8a048',
      t: '#d8a828', T: '#f0c858', D: '#b08418',
      p: '#6a4a2e', B: '#4a3624'
    }));
  }

  // Sterndeuter (Duenen): weisser Bart, tiefblaue Robe mit Sternen
  function sterndeuter() {
    return dirs(pal({
      h: '#e8e8e8', H: '#ffffff',
      t: '#24346e', T: '#3c5088', D: '#1a2650',
      p: '#24346e', B: '#8a7448'
    }));
  }

  // Brunnenhueterin (Oase): blaues Kopftuch, helles Gewand
  function brunnenhueterin() {
    return dirs(pal({
      h: '#2a4868', H: '#4a6a94',
      t: '#e8e2d4', T: '#f6f4ec', D: '#c8c0b0',
      p: '#3a5a4a', B: '#6a4a2e'
    }));
  }

  // Hausmeister (Schulhof): graues Haar, dunkelblaue Arbeitskleidung
  // Herr Dietl: Lehrer im Versteck, leicht braune Haut, schwarze Haare,
  // oranger Pullover, blaue Jeans, dunkelbraune Schuhe
  function dietl() {
    return dirs(pal({
      s: '#d0a070', S: '#a87648',
      h: '#16161c', H: '#34343e',
      t: '#ec7a26', T: '#f8a050', D: '#b4561a',
      p: '#3a5c9c', B: '#3c2616'
    }));
  }

  function hausmeister() {
    return dirs(pal({
      h: '#8a8a8a', H: '#b0b0b0',
      t: '#3a4a5a', T: '#546478', D: '#2c3a48',
      p: '#3a3a44', B: '#2a2420'
    }));
  }

  // --- Weitere Dorfbewohner (nur Rollenbezeichnungen) -------------------

  // Postbotin: dunkelblonde Haare, gelbe Postjacke, blaue Hose
  function postbotin() {
    return dirs(pal({
      h: '#a8844a', H: '#c8a466',
      t: '#f0c030', T: '#f8dc6a', D: '#b48a14',
      p: '#2e4a7a', B: '#2a2420'
    }));
  }

  // Opa: weisses Haar, brauner Strickpulli, graue Hose
  function opa() {
    return dirs(pal({
      h: '#e8e8e4', H: '#ffffff',
      t: '#8a5a3a', T: '#a8764e', D: '#5e3c24',
      p: '#6a6a72', B: '#3a2a20'
    }));
  }

  // Kind am Teich: rote Haare, hellblaues T-Shirt, kurze Hose (kleiner)
  function kind() {
    return dirs(pal({
      h: '#c8542a', H: '#e87a44',
      t: '#6aaee0', T: '#9acdf0', D: '#3e7eb0',
      p: '#5a6a3a', B: '#e8e4dc'
    }), true);
  }

  // Kundin im Laden: dunkle Haare, violetter Mantel, schwarze Schuhe
  function kundin() {
    return dirs(pal({
      h: '#3a2430', H: '#5a3a48',
      t: '#7a4a9a', T: '#9a6ab8', D: '#54306e',
      p: '#3a3a4a', B: '#1c1c22'
    }));
  }

  // Schueler im Laden: braune Haare, roter Kapuzenpulli, Jeans (Kind)
  function schueler() {
    return dirs(pal({
      h: '#6a4428', H: '#8a5e3a',
      t: '#d0443c', T: '#ec6a5a', D: '#962a26',
      p: '#3a5c9c', B: '#f4f4f4'
    }), true);
  }

  return {
    postbotin: postbotin,
    opa: opa,
    kind: kind,
    kundin: kundin,
    schueler: schueler,
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
    netzweber: netzweber,
    maschinistin: maschinistin,
    karawanenfuehrerin: karawanenfuehrerin,
    sterndeuter: sterndeuter,
    brunnenhueterin: brunnenhueterin,
    hausmeister: hausmeister,
    dietl: dietl
  };
})();
