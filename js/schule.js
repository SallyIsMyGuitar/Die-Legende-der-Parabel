// schule.js: Die zerstoerte Schule - Dungeon 5, das Finale
// (Schnittpunkte und Anwendungen)
// Ein Bildschirm der Auenwelt (Schulhof mit Ruine des Schulgebaudes,
// Hausmeister hinter Muelltonnen, Rastquelle vor dem Eingang, starre
// gerade Lichtlinien als Zeichen des Grafen) und vier Raeume:
// Klassenzimmer (Zerbrochene Tafel), Physiksaal (Alte Wurfmaschine,
// Rastquelle auf halber Strecke), Turnhalle (Anzeigetafel), Aula (Endboss
// Graf Gerade, boss.js). Raeume angemeldet per Interior.register().
// Aulere Boden- und Wandzeichen wie in den Dungeons: '#' ausserhalb,
// 'W' Wand, '.' Boden, 'M' Oeffnung; 't' umgekippter Tisch,
// 'b' zerbrochene Bank, 'x' Schutt, 'Q' Quelle (blockieren alle).
(function () {
  'use strict';

  var TILE = 16;
  var hash = Render.hash;

  // ---Schulhof (Auenwelt-Bildschirm, noerdlich vom Dorf) -------------------

  // Muelltonnen hinter denen sich der Hausmeister versteckt
  function bakeBins(r) {
    var x = 4 * TILE, y = 6 * TILE;
    r.ellipse(x + 8, y + 30, 8, 2, 'rgba(20,40,20,0.4)');
    // zwei Tonnen mit Raedern, seitlich versetzt
    r.px(x + 1, y + 6, 12, 12, '#2e4a5e');
    r.px(x + 2, y + 7, 10, 10, '#3e6a84');
    r.px(x + 2, y + 7, 10, 1, '#587f9c');
    r.px(x + 1, y + 5, 12, 2, '#24404f');
    r.px(x + 3, y + 12, 2, 2, '#1c2024');   // Rollen
    r.px(x + 14, y + 12, 12, 12, '#3a3a44');
    r.px(x + 15, y + 13, 10, 11, '#55555e');
    r.px(x + 15, y + 13, 10, 1, '#6c6c75');
    r.px(x + 14, y + 12, 12, 2, '#2e2e36');
    // verstreutes Papier
    r.px(x + 4, y + 18, 3, 2, '#d8d8d0');
    r.px(x + 28, y + 8, 3, 2, '#d8d8d0');
  }

  // Starre gerade Lichtlinien des Grafen ueber dem Hof (bis der Endboss
  // besiegt ist), leicht pulsierend, ohne jede Kurve
  function grafLines(r, t) {
    var ctx = r.getCtx();
    if (typeof Boss !== 'undefined' && Boss.of('aula') && Boss.of('aula').isDefeated()) return;
    var x = 0;
    ctx.globalAlpha = 0.10 + 0.05 * (Math.floor(t / 400) % 2);
    for (var i = 0; i < 7; i++) {
      x = 10 + i * 36;
      r.px(x, 16, 1, 88, '#b8c8f8');
      r.px(x + 1, 100, 22, 1, '#b8c8f8');
      r.px(x + 22, 100, 1, 50, '#b8c8f8');
    }
    ctx.globalAlpha = 1;
  }

  World.addScreen('schulhof', {
    map: [
      'TTTTTTTTTTTTTTTT',
      'T...RRRRRRRRR..T',
      'T...RRRRRRRRR..T',
      'T...RRRREERRR..T',
      'T..............T',
      'T.........q....T',
      'T..............T',
      'T..............T',
      'T..........i...T',
      'T...V..........T',
      'T..........V...T',
      'T..............T',
      'T..............T',
      'TTTTT..TTTTTTTTT'
    ],
    buildings: [],
    bakeExtra: function (r) { bakeBins(r); },
    anim: function (r, t) { grafLines(r, t); },
    npcs: [
      {
        x: 3 * TILE, y: 7 * TILE, sprites: function () { return People.hausmeister(); },
        talk: {
          name: 'Hausmeister',
          texts: [
            'Psst, hier drüben! Ich bin der Hausmeister der Schule – seit der Graf sein Heer aus Linealen schickte, halte ich mich hinter den Tonnen versteckt.',
            'Dahinter, in der Ruine, hält er die Lehrerinnen und Lehrer gefangen. Alles folgt seinen starren, geraden Linien.',
            'Mein Merksatz: Schnittpunkte von Parabel und Gerade: beide Terme gleichsetzen und die quadratische Gleichung lösen.'
          ],
          merk: { id: 'schnittGerade', name: 'Schnittpunkte Parabel/Gerade', text: 'Schnittpunkte von Parabel und Gerade: beide Terme gleichsetzen und die quadratische Gleichung lösen.' }
        }
      }
    ],
    signs: [
      {
        // Schild am Weg zur Ruine
        tiles: [[11, 8]], x: 11 * 16, y: 8 * 16, name: 'Schild',
        texts: ['Zerstörte Schule. Graf Gerade hält die Lehrkräfte gefangen.']
      },
      {
        // Rastquelle vor dem Eingang der Ruine (sieht aus wie der Dorfbrunnen)
        tiles: [[10, 5]], x: 10 * 16, y: 5 * 16, name: 'Quelle',
        texts: ['Du trinkst vom klaren Wasser. Deine Herzen sind wieder voll.'],
        action: 'rest',
        spawn: { x: 10 * 16, y: 6 * 16, facing: 'up' }
      }
    ],
    dungeon: 'klassenzimmer',
    exits: { south: 'start' }
  });

  // ---Schul-Optik (Innenraeume) --------------------------------------------

  // Linoleumboden mit Rissen
  function schoolFloor(r, tx, ty) {
    var x = tx * TILE, y = ty * TILE;
    var even = (tx + ty) % 2 === 0;
    r.px(x, y, TILE, TILE, even ? '#8a8478' : '#827c70');
    r.px(x, y, TILE, 1, '#78746a');
    r.px(x, y + 15, TILE, 1, '#6e6a60');
    if (hash(tx * 3, ty * 7) > 0.82) {
      // Riss im Boden
      r.px(x + 2 + Math.floor(hash(tx, ty) * 6), y + 4, 1, 8, '#5e5a52');
      r.px(x + 4 + Math.floor(hash(ty, tx) * 6), y + 9, 1, 5, '#5e5a52');
    }
  }

  // Wand mit abgeplatztem Putz
  function schoolWall(r, tx, ty) {
    var x = tx * TILE, y = ty * TILE;
    r.px(x, y, TILE, TILE, '#b8b2a4');
    r.px(x, y, TILE, 1, '#c8c2b4');
    r.px(x, y + 15, TILE, 1, '#9a9488');
    var j = (ty % 2) ? 5 : 11;
    r.px(x + j, y, 1, 16, '#a8a296');
    if (hash(tx * 5 + 1, ty * 3) > 0.7) {
      r.px(x + 3 + Math.floor(hash(tx, ty) * 8), y + 4 + Math.floor(hash(ty, tx) * 7), 3, 2, '#8a8478');
    }
  }

  // Umgekippter Tisch (blockiert, Zeichen 't')
  function tippedTable(r, tx, ty) {
    var x = tx * TILE, y = ty * TILE;
    r.ellipse(x + 8, y + 14, 7, 2, 'rgba(20,20,30,0.35)');
    r.px(x + 2, y + 3, 12, 5, '#7a4e2a');    // Platte schraeg
    r.px(x + 2, y + 3, 12, 1, '#96603a');
    r.px(x + 3, y + 8, 2, 7, '#5a381e');     // Beine
    r.px(x + 11, y + 6, 2, 9, '#5a381e');
  }

  // Zerbrochene Bank (blockiert, Zeichen 'b')
  function brokenBench(r, tx, ty) {
    var x = tx * TILE, y = ty * TILE;
    r.ellipse(x + 8, y + 14, 7, 2, 'rgba(20,20,30,0.35)');
    r.px(x + 2, y + 7, 6, 3, '#8a5c34');
    r.px(x + 9, y + 9, 5, 3, '#8a5c34');
    r.px(x + 9, y + 9, 5, 1, '#a87848');
    r.px(x + 3, y + 10, 2, 5, '#5a381e');
    r.px(x + 11, y + 12, 2, 3, '#5a381e');
    r.px(x + 4, y + 6, 2, 1, '#d8d8d0');     // Papierfetzen
  }

  // Schutt und Truemmer (blockiert, Zeichen 'x')
  function debris(r, tx, ty) {
    var x = tx * TILE, y = ty * TILE;
    r.ellipse(x + 8, y + 14, 7, 2, 'rgba(20,20,30,0.35)');
    r.px(x + 2, y + 8, 7, 6, '#8a8478');
    r.px(x + 3, y + 9, 5, 4, '#a8a296');
    r.px(x + 9, y + 6, 5, 8, '#6e6a60');
    r.px(x + 10, y + 7, 3, 6, '#8a8478');
    r.px(x + 5, y + 10, 2, 1, '#5e5a52');
    r.px(x + 11, y + 4, 2, 2, '#d8d8d0');
  }

  // Tuerfreie Oeffnung (Uebergang)
  function schoolOpening(r, tx, ty, top) {
    var x = tx * TILE, y = ty * TILE;
    r.px(x, y, TILE, TILE, '#14121a');
    r.px(x + 1, y + (top ? 3 : 1), 14, 3, '#8a8478');
    r.px(x + 1, y + (top ? 3 : 1), 14, 1, '#a8a296');
  }

  // Vignette ueber der Spielfigur
  function vignette(r) {
    var ctx = r.getCtx();
    for (var i = 0; i < 2; i++) {
      ctx.globalAlpha = 0.15 - i * 0.05;
      var m = 8 + i * 8;
      r.px(m, m, 256 - 2 * m, 8, '#1e1c26');
      r.px(m, 224 - m - 8, 256 - 2 * m, 8, '#1e1c26');
      r.px(m, m, 8, 224 - 2 * m, '#1e1c26');
      r.px(256 - m - 8, m, 8, 224 - 2 * m, '#1e1c26');
    }
    ctx.globalAlpha = 1;
  }

  function bakeSchool(r, def) {
    r.px(0, 0, 256, 224, '#14121a');
    for (var ty = 0; ty < 14; ty++) {
      for (var tx = 0; tx < 16; tx++) {
        var c = def.map[ty].charAt(tx);
        if (c === '#') continue;
        if (c === 'W') {
          schoolWall(r, tx, ty);
          continue;
        }
        schoolFloor(r, tx, ty);
        if (c === 't') tippedTable(r, tx, ty);
        else if (c === 'b') brokenBench(r, tx, ty);
        else if (c === 'x') debris(r, tx, ty);
        else if (c === 'M') schoolOpening(r, tx, ty, ty < 7);
      }
    }
    if (def.bakeExtra) def.bakeExtra(r);
  }

  // Zerbrochene Tafel an der Wand des Klassenzimmers (Kachel 5,1)
  function zerbrocheneTafel(r) {
    var x = 5 * TILE, y = 1 * TILE;
    r.px(x + 1, y + 2, 14, 12, '#3a3a40');
    r.px(x + 2, y + 3, 12, 10, '#20302c');
    // Sprung in der Tafel: diagonale helle Linie
    r.px(x + 5, y + 3, 1, 1, '#c8c8c0');
    r.px(x + 6, y + 4, 1, 1, '#c8c8c0');
    r.px(x + 7, y + 5, 1, 2, '#c8c8c0');
    r.px(x + 8, y + 7, 1, 3, '#c8c8c0');
    r.px(x + 9, y + 10, 1, 1, '#c8c8c0');
    // Kreidereste und ein gerades Zeichen des Grafen
    r.px(x + 3, y + 9, 3, 1, '#e8e8e0');
    r.px(x + 10, y + 4, 4, 1, '#e8e8e0');
  }

  // Alte Wurfmaschine im Physiksaal (Kachel 5,1), Katapult mit Parabel-Schwanz
  function wurfmaschine(r) {
    var x = 5 * TILE, y = 1 * TILE;
    r.px(x + 2, y + 9, 12, 5, '#6a4a2c');
    r.px(x + 3, y + 10, 10, 3, '#8a6a44');
    r.px(x + 3, y + 12, 1, 3, '#5a3c22');
    r.px(x + 12, y + 12, 1, 3, '#5a3c22');
    // geworfener Arm
    r.px(x + 4, y + 4, 1, 5, '#5a3c22');
    r.px(x + 5, y + 3, 6, 1, '#5a3c22');
    r.px(x + 10, y + 4, 2, 2, '#3a3a44');   // Gewicht
    // bogenfoermige Flugbahn eingraviert
    for (var i = 0; i < 5; i++) {
      var o = i - 2;
      r.px(x + 12 + i, y + 3 - Math.round((4 - o * o) * 0.2) + 2, 1, 1, '#c8b96a');
    }
  }

  // Anzeigetafel in der Turnhalle (Kachel 5,1): Punkteziffern abgesprungen
  function anzeigetafel(r) {
    var x = 5 * TILE, y = 1 * TILE;
    r.px(x + 1, y + 2, 14, 12, '#2e2e36');
    r.px(x + 2, y + 3, 12, 10, '#1c1c24');
    // halbe Sieben, halbe Null
    r.px(x + 4, y + 4, 1, 4, '#e8443a');
    r.px(x + 5, y + 4, 2, 1, '#e8443a');
    r.px(x + 9, y + 5, 1, 6, '#e8443a');
    r.px(x + 10, y + 7, 2, 1, '#e8443a');
    r.px(x + 11, y + 5, 1, 1, '#e8443a');
    r.px(x + 11, y + 9, 1, 1, '#e8443a');
  }

  // ---Die Raeume ------------------------------------------------------------

  // Klassenzimmer: Zerbrochene Tafel, Lineal-Soldaten (Bann)
  var KLASSENZIMMER = {
    map: [
      '################',
      '#WWWWWWWMWWWWWW#',
      '#W............W#',
      '#W............W#',
      '#W............W#',
      '#W....t.....t.W#',
      '#W............W#',
      '#W............W#',
      '#W............W#',
      '#W............W#',
      '#W..t......t..W#',
      '#W............W#',
      '#WWWWWWWMWWWWWW#',
      '################'
    ],
    mats: {
      '8,1': { room: 'physiksaal', x: 8 * TILE, y: 11 * TILE, facing: 'up' },
      '8,12': { screen: 'schulhof', x: 8 * TILE, y: 4 * TILE, facing: 'down' }
    },
    bakeExtra: function (r) { zerbrocheneTafel(r); },
    objects: [
      {
        // Erklaer-Objekt: Reihenfolge beim Gleichsetzen
        tiles: [[5, 1]], x: 5 * TILE, y: 1 * TILE,
        name: 'Zerbrochene Tafel',
        texts: [
          'Die Kreideschrift lautet: Gleichsetzen, auf eine Seite bringen, Lösungsformel anwenden.',
          'Wo Parabel und Gerade sich schneiden, ist der y-Wert gleich. Also: ax² + bx + c = mx + t.'
        ],
        merk: { id: 'gleichsetzen', name: 'Gleichsetzen', text: 'Schnittpunkte: Parabel und Gerade gleichsetzen, auf eine Seite bringen, Lösungsformel anwenden.' }
      }
    ]
  };

  // Physiksaal: Alte Wurfmaschine, Rastquelle, Kreide-Geister (Bann)
  var PHYSIKSAAL = {
    map: [
      '################',
      '#WWWWWWWMWWWWWW#',
      '#W............W#',
      '#W............W#',
      '#W..b.......b.W#',
      '#W........Q...W#',
      '#W............W#',
      '#W............W#',
      '#W.....x......W#',
      '#W............W#',
      '#W........x...W#',
      '#W............W#',
      '#WWWWWWWMWWWWWW#',
      '################'
    ],
    mats: {
      '8,1': { room: 'turnhalle', x: 8 * TILE, y: 11 * TILE, facing: 'up' },
      '8,12': { room: 'klassenzimmer', x: 8 * TILE, y: 2 * TILE, facing: 'down' }
    },
    bakeExtra: function (r) {
      wurfmaschine(r);
      Buildings.well(r, 9, 5);   // Quelle sieht aus wie der Dorfbrunnen
    },
    objects: [
      {
        // Erklaer-Objekt: Scheitel der Wurfparabel
        tiles: [[5, 1]], x: 5 * TILE, y: 1 * TILE,
        name: 'Alte Wurfmaschine',
        texts: [
          'Die Maschine warf einst weiter als jede lineale Wache: Der Scheitel einer Wurfparabel ist der höchste Punkt der Flugbahn.',
          'Bei y = a(x − xs)² + ys mit a < 0 liegt dieser Punkt bei S(xs|ys). Vom Scheitel bis zur Landung ist es genau halb so weit wie die ganze Wurfweite.'
        ],
        merk: { id: 'wurfscheitel', name: 'Scheitel einer Wurfparabel', text: 'Der Scheitel einer Wurfparabel ist der höchste Punkt der Flugbahn: S(xs|ys) bei y = a(x − xs)² + ys mit a < 0.' }
      },
      {
        // Rastquelle: heilt alle Herzen, speichert die Ruecksprung-Stelle
        tiles: [[9, 5]], x: 9 * TILE, y: 5 * TILE,
        name: 'Quelle',
        texts: ['Du trinkst vom klaren Wasser. Deine Herzen sind wieder voll.'],
        action: 'rest',
        spawn: { x: 9 * TILE, y: 6 * TILE, facing: 'up' }
      }
    ]
  };

  // Turnhalle: Anzeigetafel, Geodreieck-Waechter (Bann)
  var TURNHALLE = {
    map: [
      '################',
      '#WWWWWWWMWWWWWW#',
      '#W............W#',
      '#W............W#',
      '#W............W#',
      '#W....b......bW#',
      '#W............W#',
      '#W.....t......W#',
      '#W............W#',
      '#W............W#',
      '#W...x......x.W#',
      '#W............W#',
      '#WWWWWWWMWWWWWW#',
      '################'
    ],
    mats: {
      '8,1': { room: 'aula', x: 8 * TILE, y: 11 * TILE, facing: 'up' },
      '8,12': { room: 'physiksaal', x: 8 * TILE, y: 2 * TILE, facing: 'down' }
    },
    bakeExtra: function (r) { anzeigetafel(r); },
    objects: [
      {
        // Erklaer-Objekt: groesster/kleinster Wert am Scheitel
        tiles: [[5, 1]], x: 5 * TILE, y: 1 * TILE,
        name: 'Anzeigetafel',
        texts: [
          'Auf der Tafel steht: Größter oder kleinster Wert einer quadratischen Funktion: am Scheitel ablesen.',
          'Bei A(x) = x · (U : 2 − x) liegt das Maximum in der Mitte, bei x = U : 4.'
        ],
        merk: { id: 'extremwertAmScheitel', name: 'Extremwert am Scheitel', text: 'Größter oder kleinster Wert einer quadratischen Funktion: am Scheitel ablesen.' }
      }
    ]
  };

  // Aula: Endboss Graf Gerade (boss.js, 'aula'). Gerade Lichtlinien im
  // Laufbild, solange der Graf steht
  var AULA = {
    map: [
      '################',
      '#WWWWWWWWWWWWWW#',
      '#W............W#',
      '#W............W#',
      '#W............W#',
      '#W............W#',
      '#W............W#',
      '#W............W#',
      '#W............W#',
      '#W............W#',
      '#W............W#',
      '#W............W#',
      '#WWWWWWWMWWWWWW#',
      '################'
    ],
    mats: {
      '8,12': { room: 'turnhalle', x: 8 * TILE, y: 2 * TILE, facing: 'down' }
    }
  };

  [KLASSENZIMMER, PHYSIKSAAL, TURNHALLE, AULA].forEach(function (R) {
    R.bakeFull = function (r) { bakeSchool(r, R); };
    R.overlay = vignette;
  });

  // Aula: Bann des Grafen aus geraden Lichtlinien ueber dem Boden
  AULA.anim = function (r, t) {
    var ctx = r.getCtx();
    if (typeof Boss !== 'undefined' && Boss.of('aula') && Boss.of('aula').isDefeated()) {
      // Nach dem Sieg: sanfte Parabelboegen statt gerader Linien
      ctx.globalAlpha = 0.14 + 0.05 * (Math.floor(t / 300) % 2);
      for (var p = 0; p < 6; p++) {
        var bc = 40 + p * 36;
        for (var o = -12; o <= 12; o += 2) {
          r.px(bc + o, 96 - Math.round(o * o / 16), 1, 1, '#f8e0a0');
        }
      }
      ctx.globalAlpha = 1;
      return;
    }
    ctx.globalAlpha = 0.12 + 0.06 * (Math.floor(t / 400) % 2);
    for (var i = 0; i < 8; i++) {
      var x = 24 + i * 30;
      r.px(x, 26 + (i % 2) * 6, 1, 60, '#b8c8f8');
      r.px(x, 92 + (i % 3), 16, 1, '#b8c8f8');
    }
    ctx.globalAlpha = 1;
  };

  Interior.register('klassenzimmer', KLASSENZIMMER);
  Interior.register('physiksaal', PHYSIKSAAL);
  Interior.register('turnhalle', TURNHALLE);
  Interior.register('aula', AULA);
})();
