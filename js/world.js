// world.js: Dorf-Bildschirme, Kollision, Übergänge und Zeichnen der Außenwelt
// Jeder Bildschirm ist 16 x 14 Kacheln groß. Kachelzeichen:
//   'T' Baum   '.' Wiese   'P' Weg   '~' Wasser   'F' Zaun   'G' Tor (gesperrt)
//   'S' Schulgelände   'W' Brunnen   'R' Ruinenmauer   'E' Dungeon-Eingang
//   'i' Hinweisschild (an der Ruine)
//   'C' R\u00e4tsel-Truhe (an der Ruine, Belohnung: Schwert)
//   'q' Quelle vor dem Dungeon-Eingang (Raststelle, gezeichnet wie der Dorfbrunnen)
// Gebäude stehen in der Liste buildings und werden beim Start eingestempelt
// ('H' Gebäude, 'D' Tür). Innenräume liegen in js/interior.js und js/rooms.js.
var World = (function () {
  'use strict';

  var TILE = 16;
  var COLS = 16;
  var ROWS = 14;
  var W = COLS * TILE;
  var H = ROWS * TILE;
  var BLOCKING = 'THDFGSW~REiCqVL';

  var SCREENS = {
    start: {
      map: [
        'TTTTTTTTTTTTTTTT',
        'T.....T........T',
        'T..TT.T........T',
        'T..T...........T',
        'T..T.PPPPPPPPPPP',
        'T....P..........',
        'T....P..FSSSSSST',
        'T.~~.P..FSSSSSST',
        'T.~~.P..FSSSSSST',
        'T....P..FSSSSSST',
        'T....P..FSSSSSST',
        'T....P..FFFGGFFT',
        'T....PPPPPPPP..T',
        'TTTTTTTTTTTTTTTT'
      ],
      buildings: [
        { x: 8, y: 2, w: 4, h: 2, door: 9, room: 'eltern', style: 'red', windows: [3], barrel: 0, lantern: true }
      ],
      school: { x: 9, y: 6, w: 6, h: 5 },
      signs: [
        {
          tiles: [[11, 11], [12, 11]], x: 12 * 16, y: 11 * 16,
          name: 'Schild',
          texts: ['GESPERRT. Die Schule bleibt geschlossen, bis die Lehrkräfte zurück sind.']
        }
      ],
      exits: { east: 'ost' }
    },
    ost: {
      map: [
        'TTTTTTTTTTTTTTTT',
        'T.......T......T',
        'T.......T......T',
        'T..............T',
        'PPPPPPPPPPPPPPPP',
        '........PP......',
        'T.....PPPP.....T',
        'T.....PWPP..TT.T',
        'T.....PPPP..TT.T',
        'T.......iP..T..T',
        'T........P.....T',
        'T........P.....T',
        'T...PPPPPPi....T',
        'TTTTTTTTVVTTTTTT'
      ],
      buildings: [
        { x: 2, y: 2, w: 4, h: 2, door: 3, room: 'nachbarin', style: 'blue', windows: [0, 3], lantern: true },
        { x: 10, y: 2, w: 4, h: 2, door: 12, room: 'freund', style: 'green', windows: [0, 1], lantern: true },
        { x: 2, y: 10, w: 5, h: 2, door: 4, room: 'laden', style: 'shop', windows: [0, 1, 3, 4], shop: true }
      ],
      // Der Brunnen ist die Rastquelle im Startdorf; das zweite Schild öffnet die Testseite
      signs: [
        {
          tiles: [[7, 7]], x: 7 * 16, y: 7 * 16,
          name: 'Brunnen',
          texts: ['Du trinkst vom klaren Wasser. Deine Herzen sind wieder voll.'],
          action: 'rest',
          // Hier wacht die Spielfigur auf, wenn sie alle Herzen verliert
          spawn: { x: 7 * 16, y: 8 * 16, facing: 'up' }
        },
        {
          tiles: [[8, 9]], x: 8 * 16, y: 9 * 16,
          name: 'Schild',
          texts: ['Testseite für die Lehrkraft: Beispielaufgaben mit Lösungen.'],
          action: 'testpage'
        },
        {
          // Schild am Felsen: Weg nach Süden (erster Felsen aus „Felsen, Wasser, Sandsturm, Burgtor“)
          tiles: [[10, 12]], x: 10 * 16, y: 12 * 16,
          name: 'Schild',
          texts: ['Der Weg nach Süden ist durch einen Felsen versperrt. Vielleicht löst er sich, sobald der Wächter der Höhle besiegt ist.']
        }
      ],
      exits: { west: 'start', east: 'wiese', south: 'felder' }
    },

    // Felder am Dorfrand: erster Abschnitt nach Süden (Dungeon 2: Scheitelform)
    felder: {
      map: [
        'TTTTTTTTPPTTTTTT',
        'T.......PP.....T',
        'T.FFFF..PP.FFFFT',
        'T.FFFF..PP.FFFFT',
        'T.......PP.....T',
        'T.......PP.....T',
        'T.FFFF..PP.FFFFT',
        'T.FFFF..PP.FFFFT',
        'T.......PP.....T',
        'T...T...PP...T.T',
        'T.......PP.....T',
        'T.......PP.....T',
        'T.......PP.....T',
        'TTTTTTTTPPTTTTTT'
      ],
      buildings: [],
      npcs: [
        {
          x: 6 * TILE, y: 10 * TILE, sprites: function () { return People.gartnerin(); },
          talk: {
            name: 'Gärtnerin',
            texts: [
              'Hallo! Die Strohgolems auf meinen Feldern stehen unter dem Bann des Grafen. Sie lassen nur nach Süden, wer die Scheitelform kennt.',
              'In y = a(x − xs)² + ys ist S(xs|ys) der Scheitel – der tiefste oder höchste Punkt der Parabel.',
              'Zum Beispiel: y = 2(x − 3)² + 1 hat den Scheitel S(3|1). Und bei y = −0,5(x + 2)² − 4 ist der Scheitel S(−2|−4).'
            ],
            merk: { id: 'spfAusS', name: 'Scheitelform aus S und a', text: 'y = a(x − xs)² + ys hat den Scheitel S(xs|ys). Beispiel: y = −0,5(x + 2)² − 4 hat S(−2|−4).' }
          }
        }
      ],
      exits: { north: 'ost', south: 'klippen' }
    },

    // Klippenweg: zweiter Abschnitt, felsiger Pfad nach Süden
    klippen: {
      map: [
        'TTTTTTTTPPTTTTTT',
        'T.TT....PP...T.T',
        'T..T....PP..TT.T',
        'T.T.....PP.T...T',
        'T..T....PPPT...T',
        'T.T.....PP..T..T',
        'T..T....PP.....T',
        'T.TT....PP.TT..T',
        'T.T.....PP...T.T',
        'T.......PP.....T',
        'T.T.....PP.TT..T',
        'T..T....PP.....T',
        'T.T.....PP...T.T',
        'TTTTTTTTPPTTTTTT'
      ],
      buildings: [],
      npcs: [
        {
          x: 5 * TILE, y: 8 * TILE, sprites: function () { return People.fischer(); },
          talk: {
            name: 'Fischer',
            texts: [
              'Vorsicht an der Kante! Die Klippengeister treiben hier ihren Spuk und sperren den Weg nach Süden.',
              'Kennst du die Scheitelform? Sie hilft beim Rechnen: y = a(x − xs)² + ys. Streckfaktor und Verschiebung zusammen bestimmen die Parabel.',
              'Ist der Scheitel S(1|−2) gegeben und die Parabel geht durch P(3|6), dann setze ein: 6 = a(3 − 1)² − 2. Das gibt 8 = 4a, also a = 2 und y = 2(x − 1)² − 2.'
            ],
            merk: { id: 'spfAusSP', name: 'Scheitelform aus S und P', text: 'P in y = a(x − xs)² + ys einsetzen und nach a auflösen. Beispiel: S(1|−2) und P(3|6) geben a = 2, also y = 2(x − 1)² − 2.' }
          }
        }
      ],
      exits: { north: 'felder', south: 'kueste' }
    },

    // Küste mit dem Leuchtturm: der Weg zum zweiten Dungeon (Scheitelform)
    kueste: {
      map: [
        'TTTTTTTTPPTTTTTT',
        'T.......PP.....T',
        'T.~~~~~~PP.....T',
        'T.~~~~~~PP.....T',
        'T.~~~~~~PP...i.T',
        'T.~~~~~~PP.....T',
        'T...~~~.PP...q.T',
        'T....~~.PP.....T',
        'T.......PP.....T',
        'T......LLLL....T',
        'T......LLLL....T',
        'T......LLEE....T',
        'T..............T',
        'TTTTTTTTTTTTTTTT'
      ],
      buildings: [],
      lighthouse: { x: 7, y: 9, w: 4, h: 3 },
      npcs: [
        {
          x: 13 * TILE, y: 8 * TILE, sprites: function () { return People.turmwaerter(); },
          talk: {
            name: 'Turmwärter',
            texts: [
              'Siehst du den dunklen Leuchtturm? Sein Licht entsteht in einem parabolischen Spiegel – einem gekrümmten Spiegel, der die Strahlen bündelt.',
              'Graf Gerade hasst genau diese Krümmung. Seit seinem Bann ist das Licht erloschen, und die Krabbengeister bewachen die Tür.',
              'Die Parabel y = 0,5(x − 2)² + 3 hat den Scheitel S(2|3). Weil sie nach oben geöffnet ist, ist der Scheitel der tiefste Punkt: Alle y-Werte ab 3 kommen vor. Der kleinste y-Wert ist also ys.'
            ],
            merk: { id: 'wertemenge', name: 'Wertemenge am Scheitel', text: 'Der Scheitel S(xs|ys) grenzt die Wertemenge ein: Bei a > 0 ist ys der kleinste y-Wert, bei a < 0 der größte.' }
          }
        }
      ],
      signs: [
        {
          tiles: [[13, 4]], x: 13 * 16, y: 4 * 16,
          name: 'Schild',
          texts: ['Leuchtturm. Ohne die Krümmung des Spiegels kein Licht.']
        },
        {
          // Rastquelle vor dem Leuchtturm
          tiles: [[13, 6]], x: 13 * 16, y: 6 * 16,
          name: 'Quelle',
          texts: ['Du trinkst vom klaren Wasser. Deine Herzen sind wieder voll.'],
          action: 'rest',
          spawn: { x: 13 * 16, y: 7 * 16, facing: 'up' }
        }
      ],
      // Der Leuchtturm ist der Dungeon 2; er öffnet sich erst in einem späteren Schritt
      dungeon: null,
      exits: { north: 'klippen' }
    },

    // Wiese mit kleinem Teich auf dem Weg zum ersten Dungeon
    wiese: {
      map: [
        'TTTTTTTTTTTTTTTT',
        'T....T.....T...T',
        'T..............T',
        'T..............T',
        'PPPPPPPPPPPPPPPP',
        '................',
        'T...~~~~~......T',
        'T...~~~~~..TT..T',
        'T....~~....T...T',
        'T..........T...T',
        'T.....T........T',
        'T..............T',
        'T..............T',
        'TTTTTTTTTTTTTTTT'
      ],
      buildings: [],
      npcs: [
        {
          x: 8 * TILE, y: 5 * TILE, sprites: function () { return People.wanderer(); },
          talk: {
            name: 'Wanderin',
            texts: [
              'Hallo! Seit die Schule zerstört ist, liegt ein seltsamer Bann über dem Land. Sogar die Pilzwesen hier sind verzaubert.',
              'Sie lassen nur durch, wer die Normalparabel kennt: y = x². Ihr Scheitel liegt im Ursprung, also bei S(0|0).',
              'Ein Punkt liegt auf der Normalparabel, wenn y = x² gilt. Zum Beispiel P(3|9), denn 3² = 9. Aber auch P(−3|9), denn (−3)² = 9!'
            ],
            merk: { id: 'normalparabel', name: 'Normalparabel', text: 'Die Normalparabel hat die Gleichung y = x² und den Scheitel S(0|0). P(x|y) liegt auf ihr, wenn y = x² gilt, z. B. P(−3|9).' }
          }
        }
      ],
      exits: { west: 'ost', east: 'wald' }
    },

    // Waldweg als dunklerer Durchgang
    wald: {
      map: [
        'TTTTTTTTTTTTTTTT',
        'TTTTT.....TTTTTT',
        'TTT..........TTT',
        'TT....TT.....TTT',
        'PPPPPPPPPPPPPPPP',
        '................',
        'T......T......TT',
        'T.............TT',
        'TT....T......TTT',
        'TTT.........TTTT',
        'TTTT.......TTTTT',
        'TTTTT....TTTTTTT',
        'TTTTTTTTTTTTTTTT',
        'TTTTTTTTTTTTTTTT'
      ],
      buildings: [],
      npcs: [
        {
          x: 10 * TILE, y: 5 * TILE, sprites: function () { return People.forester(); },
          talk: {
            name: 'Förster',
            texts: [
              'Vor ein paar Nächten zog ein Graf mit einem Heer aus Linealen durch meinen Wald. Seitdem sind die Moosgeister wie verhext.',
              'Sie fragen nach dem Streckfaktor a in y = ax². Ist |a| > 1, ist die Parabel gestreckt, also schmaler. Ist |a| < 1, ist sie gestaucht, also breiter.',
              'Und ist a negativ, ist die Parabel nach unten geöffnet. Mit dem Faktor 2 gestreckt und nach unten geöffnet heißt also: y = −2x².'
            ],
            merk: { id: 'streckfaktor', name: 'Streckfaktor a', text: 'In y = ax² gilt: |a| > 1 gestreckt (schmaler), |a| < 1 gestaucht (breiter). a > 0: nach oben geöffnet, a < 0: nach unten geöffnet.' }
          }
        }
      ],
      exits: { west: 'wiese', east: 'ruine' }
    },

    // Ruine mit dem Eingang zum ersten Dungeon (Höhle der Parabeln)
    ruine: {
      map: [
        'TTTTTTTTTTTTTTTT',
        'T....TTTTTTTT..T',
        'T..RRRRRRRRRR..T',
        'T..RRRRRRRRRR..T',
        'PPPRRREERRRR...T',
        '.....i..........',
        'T..............T',
        'T...T..........T',
        'T...........T..T',
        'T.q.T.....T....T',
        'T........T.C...T',
        'T..............T',
        'T....T.........T',
        'TTTTTTTTTTTTTTTT'
      ],
      buildings: [],
      npcs: [
        {
          x: 12 * TILE, y: 6 * TILE, sprites: function () { return People.hermit(); },
          talk: {
            name: 'Einsiedler',
            texts: [
              'Du willst in die Höhle der Parabeln? Mutig. Ihr Wächter steht im Bann des Grafen und lässt niemanden vorbei.',
              'Die Steingolems hier prüfen, ob du verschobene Parabeln verstehst: y = a(x − xs)² + ys hat den Scheitel S(xs|ys).',
              'Pass beim Vorzeichen auf! Bei y = (x + 3)² − 1 ist xs = −3. Der Scheitel ist also S(−3|−1).'
            ],
            merk: { id: 'scheitelform', name: 'Scheitelform', text: 'y = a(x − xs)² + ys hat den Scheitel S(xs|ys). Vorsicht beim Vorzeichen: y = (x + 3)² − 1 hat S(−3|−1).' }
          }
        }
      ],
      signs: [
        {
          tiles: [[5, 5]], x: 5 * 16, y: 5 * 16,
          name: 'Schild',
          texts: ['Höhle der Parabeln. Wer eintreten will, muss erst die verzauberten Wesen vor dem Eingang erlösen.']
        },
        {
          // Freiwillige R\u00e4tsel-Truhe mit dem Schwert als Belohnung
          tiles: [[11, 10]], x: 11 * 16, y: 10 * 16,
          name: 'Truhe',
          texts: ['Die Truhe ist leer.'],
          action: 'chest'
        },
        {
          // Rastquelle vor dem Dungeon-Eingang
          tiles: [[2, 9]], x: 2 * 16, y: 9 * 16,
          name: 'Quelle',
          texts: ['Du trinkst vom klaren Wasser. Deine Herzen sind wieder voll.'],
          action: 'rest',
          spawn: { x: 2 * 16, y: 10 * 16, facing: 'up' }
        }
      ],
      // Der dunkle Eingang ('E') f\u00fchrt in die H\u00f6hle der Parabeln
      dungeon: 'dhalle',
      exits: { west: 'wald' }
    }
  };

  // Spielstart: im Elternhaus, direkt vor der Mutter
  var START = { screen: 'eltern', x: 4 * TILE, y: 5 * TILE, facing: 'up' };

  var rgb = Render.rgb, lerp = Render.lerp;
  var hash = Render.hash, noise = Render.noise;

  var states = {};          // vorberechnete Daten je Bildschirm
  var current = START.screen;
  var S = null;             // gerade bearbeiteter Bildschirm

  // --- Aufbau der Kachelraster -----------------------------------------
  function buildTiles(def) {
    var t = def.map.map(function (row) {
      if (row.length !== COLS) console.warn('Kartenzeile mit falscher Länge: ' + row);
      return row.split('');
    });
    def.buildings.forEach(function (b) {
      for (var y = b.y; y < b.y + b.h; y++) {
        for (var x = b.x; x < b.x + b.w; x++) t[y][x] = 'H';
      }
      t[b.y + b.h - 1][b.door] = 'D';
    });
    return t;
  }

  Object.keys(SCREENS).forEach(function (name) {
    var def = SCREENS[name];
    states[name] = { name: name, def: def, tiles: buildTiles(def), doors: {} };
  });

  // Zielraum -> Bildschirm und Gebäude (für den Weg nach draußen)
  var roomHome = {};
  Object.keys(SCREENS).forEach(function (name) {
    SCREENS[name].buildings.forEach(function (b) {
      if (b.room) roomHome[b.room] = { screen: name, building: b };
    });
  });

  // Kachel im Bildschirm st; außerhalb wird beim Nachbarbildschirm nachgesehen
  function tileOf(st, tx, ty) {
    if ((tx < 0 || tx >= COLS) && (ty < 0 || ty >= ROWS)) return '#';   // Ecke
    if (tx < 0 || tx >= COLS) {
      var dir = tx < 0 ? 'west' : 'east';
      var next = st.def.exits && st.def.exits[dir];
      if (!next) return '#';
      return states[next].tiles[ty][tx < 0 ? tx + COLS : tx - COLS];
    }
    if (ty < 0 || ty >= ROWS) {
      var vdir = ty < 0 ? 'north' : 'south';
      var vnext = st.def.exits && st.def.exits[vdir];
      if (!vnext) return '#';
      return states[vnext].tiles[ty < 0 ? ty + ROWS : ty - ROWS][tx];
    }
    return st.tiles[ty][tx];
  }

  function tileAt(tx, ty) {
    return tileOf(S, tx, ty);
  }

  function isOutdoor() {
    return !!states[current];
  }

  function isBlocked(tx, ty) {
    if (!isOutdoor()) return Interior.isBlocked(current, tx, ty);
    var t = tileOf(states[current], tx, ty);
    if (t === '#' || BLOCKING.indexOf(t) >= 0) return true;
    // Außen-NPCs blockieren ihre Kachel
    var npcs = states[current].def.npcs || [];
    for (var i = 0; i < npcs.length; i++) {
      if (Math.floor(npcs[i].x / TILE) === tx && Math.floor(npcs[i].y / TILE) === ty) return true;
    }
    return false;
  }

  // --- Übergänge -----------------------------------------------------------
  // Tür berühren (nach oben gegen die Tür laufen) oder Fußmatte im Haus.
  // 'E' ist der Dungeon-Eingang (nach oben dagegen laufen),
  // im Dungeon führen die Öffnungen ('M') in den nächsten Raum.
  function checkWarp(px, py, facing) {
    var cx = Math.floor((px + 8) / TILE);
    if (isOutdoor()) {
      if (facing !== 'up') return null;
      var ty = Math.floor((py - 1) / TILE);
      var st = states[current];
      var t = tileOf(st, cx, ty);
      if (t === 'D') {
        var b = st.def.buildings.filter(function (bb) { return bb.door === cx && bb.y + bb.h - 1 === ty; })[0];
        if (!b || !b.room) return null;
        return { type: 'enter', room: b.room, building: b };
      }
      if (t === 'E') return { type: 'dungeon', room: st.def.dungeon || null };
      return null;
    }
    var my = Math.floor((py + 8) / TILE);
    if (Interior.isExit(current, cx, my)) {
      var home = roomHome[current];
      if (home) return { type: 'exit', screen: home.screen, building: home.building };
      var to = Interior.matWarp(current, cx, my);
      if (to) return { type: 'warp', to: to };
    }
    return null;
  }

  // Bildschirmrand überschritten? Liefert Richtung und Ziel.
  function checkEdge(px, py) {
    if (!isOutdoor()) return null;
    var ex = states[current].def.exits || {};
    if (px + 8 >= W && ex.east) return { dir: 'east', to: ex.east };
    if (px + 8 < 0 && ex.west) return { dir: 'west', to: ex.west };
    if (py + 8 >= H && ex.south) return { dir: 'south', to: ex.south };
    if (py + 8 < 0 && ex.north) return { dir: 'north', to: ex.north };
    return null;
  }

  // Gegenüber der Spielfigur: Bewohner oder Schild, mit dem man reden kann
  function talkTarget(px, py, facing) {
    var cx = px + 8, cy = py + 8, fx = cx, fy = cy;
    if (facing === 'up') fy = py - 1;
    else if (facing === 'down') fy = py + 16;
    else if (facing === 'left') fx = px - 1;
    else fx = px + 16;
    var tx = Math.floor(fx / TILE), ty = Math.floor(fy / TILE);
    if (!isOutdoor()) return Interior.talkTarget(current, tx, ty);
    var signs = states[current].def.signs || [];
    for (var i = 0; i < signs.length; i++) {
      for (var j = 0; j < signs[i].tiles.length; j++) {
        var t = signs[i].tiles[j];
        if (t[0] === tx && t[1] === ty) {
          return { name: signs[i].name, texts: signs[i].texts, action: signs[i].action, spawn: signs[i].spawn, merk: signs[i].merk, later: signs[i].later, hintX: signs[i].x, hintY: signs[i].y };
        }
      }
    }
    // Außen-NPCs auf dem Weg zu den Dungeons
    var npcs = states[current].def.npcs || [];
    for (var k = 0; k < npcs.length; k++) {
      var n = npcs[k];
      if (Math.floor(n.x / TILE) === tx && Math.floor(n.y / TILE) === ty) {
        return { name: n.talk.name, texts: n.talk.texts, merk: n.talk.merk, later: n.talk.later, hintX: n.x + 8, hintY: n.y, npc: n };
      }
    }
    return null;
  }

  function setScreen(name) { current = name; }
  function getScreen() { return current; }

  // NPC zur Laufzeit in einen Bildschirm einfügen (z. B. nach einer Szene)
  function addNpc(name, npc) {
    var def = states[name].def;
    if (!def.npcs) def.npcs = [];
    def.npcs.push(npc);
    states[name].npcSprites = null;   // Sprites neu einlesen
  }

  function setDoorOpen(b, p) {
    states[roomHome[b.room].screen].doors[b.room] = p;
  }

  function doorRect(b) { return Buildings.doorRect(b); }

  // Rätsel-Truhe öffnen (p = 0 zu, 1 offen) auf dem aktuellen Bildschirm
  function setChestOpen(p, screen) {
    var st = states[screen || current];
    if (st) st.chestOpen = p;
  }

  // Felsen lösen (nach dem Sieg über den Wächter des ersten Dungeons):
  // Alle 'V'-Kacheln werden zu Weg, der Bildschirm wird neu vorberechnet.
  function openRockGate(screen) {
    var st = states[screen || current];
    if (!st || st.rockOpen) return;
    st.rockOpen = true;
    for (var ty = 0; ty < ROWS; ty++) {
      for (var tx = 0; tx < COLS; tx++) {
        if (st.tiles[ty][tx] === 'V') st.tiles[ty][tx] = 'P';
      }
    }
    if (st.ground) bake(st);   // schon gezeichnet: Pixel neu vorberechnen
  }

  // Pixelposition der Truhe auf dem aktuellen Bildschirm (oder null)
  function chestPos() {
    var st = states[current];
    var sg = st && (st.def.signs || []).filter(function (g) { return g.action === 'chest'; })[0];
    return sg ? { x: sg.tiles[0][0] * TILE, y: sg.tiles[0][1] * TILE } : null;
  }

  // --- Masken für Weg und Wasser (Autotiling) ----------------------------
  function shapeMask(id, top, side, round, roundTop) {
    var m = new Uint8Array(W * H);
    for (var ty = 0; ty < ROWS; ty++) {
      for (var tx = 0; tx < COLS; tx++) {
        if (tileAt(tx, ty) !== id) continue;
        var n = tileAt(tx, ty - 1) !== id, s = tileAt(tx, ty + 1) !== id;
        var w = tileAt(tx - 1, ty) !== id, e = tileAt(tx + 1, ty) !== id;
        var t0 = n ? top : 0, b0 = s ? side : 0;
        var l0 = w ? side : 0, r0 = e ? side : 0;
        for (var i = t0; i < TILE - b0; i++) {
          var cut = 0;
          if (n && roundTop && i - t0 < round) cut = round - (i - t0);
          var fromBottom = TILE - b0 - 1 - i;
          if (s && fromBottom < round) cut = Math.max(cut, round - fromBottom);
          var l = l0 + (w ? cut : 0), r = TILE - r0 - (e ? cut : 0);
          for (var j = l; j < r; j++) m[(ty * TILE + i) * W + tx * TILE + j] = 1;
        }
      }
    }
    return m;
  }

  function buildBank() {
    var m = new Uint8Array(W * H);
    var cuts = [0, 2, 1, 0];
    for (var ty = 0; ty < ROWS; ty++) {
      for (var tx = 0; tx < COLS; tx++) {
        if (tileAt(tx, ty) !== '~' || tileAt(tx, ty - 1) === '~') continue;
        var w = tileAt(tx - 1, ty) !== '~', e = tileAt(tx + 1, ty) !== '~';
        for (var i = 1; i < 4; i++) {
          var l = (w ? 1 + cuts[i] : 0), r = TILE - (e ? 1 + cuts[i] : 0);
          for (var j = l; j < r; j++) m[(ty * TILE + i) * W + tx * TILE + j] = i;
        }
      }
    }
    return m;
  }

  function buildDepth(waterMask) {
    var d = new Uint8Array(W * H);
    var queue = [];
    for (var k = 0; k < W * H; k++) {
      if (!waterMask[k]) continue;
      if (!waterMask[k - 1] || !waterMask[k + 1] || !waterMask[k - W] || !waterMask[k + W]) {
        d[k] = 1;
        queue.push(k);
      }
    }
    for (var q = 0; q < queue.length; q++) {
      var c = queue[q], nb = [c - 1, c + 1, c - W, c + W];
      for (var i = 0; i < 4; i++) {
        if (waterMask[nb[i]] && !d[nb[i]]) {
          d[nb[i]] = d[c] + 1;
          queue.push(nb[i]);
        }
      }
    }
    return d;
  }

  function adjacent(mask, k) {
    return mask[k - 1] || mask[k + 1] || mask[k - W] || mask[k + W];
  }

  // --- Bodenfarben ---------------------------------------------------------
  var C = {
    grassA: rgb('#4a9a3e'), grassB: rgb('#7cc85e'),
    grassDark: rgb('#2c6a2a'), grassLight: rgb('#b0e888'), dry: rgb('#9a9a4a'),
    sandA: rgb('#d6b97c'), sandB: rgb('#f0dcaa'), sandShade: rgb('#b08c56'),
    bankLip: rgb('#356e2e'), bankA: rgb('#7c5636'), bankB: rgb('#55391f'),
    foam: rgb('#dcf2fb'), shallow: rgb('#78bdea'), mid: rgb('#3d88d6'),
    deep: rgb('#2154aa'), bankShadow: rgb('#1c3f78')
  };

  function grassColor(x, y) {
    var n = 0.65 * noise(x, y, 26, 1) + 0.35 * noise(x, y, 8, 2);
    var c = lerp(C.grassA, C.grassB, 0.2 + n * 0.6);
    var h = hash(x, y);
    if (h > 0.94) c = lerp(c, C.grassDark, 0.25);
    else if (h < 0.035) c = lerp(c, C.grassLight, 0.25);
    return c;
  }

  function sandColor(x, y, k) {
    var m = S.pathMask;
    var c = lerp(C.sandA, C.sandB, 0.35 + noise(x, y, 6, 7) * 0.55);
    if (!m[k - W]) c = lerp(c, C.sandShade, 0.65);
    else if (!m[k - 2 * W]) c = lerp(c, C.sandShade, 0.3);
    if (!m[k - 1] && x > 0) c = lerp(c, C.sandShade, 0.3);
    var h = hash(x * 3, y * 5);
    if (h > 0.985) c = lerp(c, C.sandShade, 0.8);
    else if (h < 0.02) c = lerp(c, [255, 250, 225], 0.5);
    return c;
  }

  function waterColor(x, y, k) {
    for (var s = 1; s <= 3; s++) {
      if (S.bankMask[k - s * W]) return lerp(C.mid, C.bankShadow, 0.75 - 0.18 * (s - 1));
    }
    var d = S.waterDepth[k];
    if (d <= 1) return C.foam;
    if (d === 2) return lerp(C.foam, C.shallow, 0.65);
    if (d <= 5) return lerp(C.shallow, C.mid, (d - 2) / 3);
    return lerp(C.mid, C.deep, Math.min(1, (d - 5) / 12));
  }

  function bankColor(x, y, row) {
    if (row === 1) return C.bankLip;
    var c = lerp(C.bankA, C.bankB, (row - 2) * 0.9);
    if (hash(x * 7, y * 3) > 0.8) c = lerp(c, C.bankB, 0.5);
    return c;
  }

  // --- Bäume, Büschel, Steine ------------------------------------------------
  var CANOPY = [
    { dark: '#143a20', shade: '#22602c', mid: '#338838', light: '#50a646', hi: '#88d066' },
    { dark: '#103628', shade: '#1c5a3e', mid: '#2b7d4c', light: '#459e5f', hi: '#80cc86' },
    { dark: '#183c1c', shade: '#2e6628', mid: '#448a34', light: '#64a846', hi: '#9ad46a' }
  ];

  function canopyInfo(tx, ty) {
    var seed = S.name === 'start' ? 0 : 50;
    return {
      cx: tx * TILE + 8 + Math.round((hash(tx + seed, ty + 99) - 0.5) * 2),
      cy: ty * TILE + 6,
      big: hash(tx + 1 + seed, ty + 5) > 0.5 ? 1 : 0,
      pal: CANOPY[Math.floor(hash(tx + 7 + seed, ty + 3) * 3)]
    };
  }

  function drawCanopy(r, tx, ty) {
    var c = canopyInfo(tx, ty), P = c.pal;
    var bumps = [[0, 1, 10 + c.big, 8 + c.big], [-5, -3, 6, 5], [5, -3, 6, 5], [0, -6, 6, 5]];
    var i, b;
    for (i = 0; i < bumps.length; i++) { b = bumps[i]; r.ellipse(c.cx + b[0], c.cy + b[1], b[2] + 1, b[3] + 1, P.dark); }
    for (i = 0; i < bumps.length; i++) { b = bumps[i]; r.ellipse(c.cx + b[0], c.cy + b[1], b[2], b[3], P.shade); }
    for (i = 0; i < bumps.length; i++) { b = bumps[i]; r.ellipse(c.cx + b[0] - 1, c.cy + b[1] - 1, b[2] - 1, b[3] - 1, P.mid); }
    for (i = 1; i < bumps.length; i++) { b = bumps[i]; r.ellipse(c.cx + b[0] - 1, c.cy + b[1] - 2, b[2] - 3, b[3] - 3, P.light); }
    r.ellipse(c.cx - 3, c.cy - 4, 4, 3, P.light);
    r.ellipse(c.cx - 3, c.cy - 8, 2, 1, P.hi);
    r.ellipse(c.cx + 3, c.cy - 5, 2, 1, P.hi);
    for (i = 0; i < 7; i++) {
      var lx = c.cx - 7 + Math.floor(hash(tx * 11 + i, ty) * 14);
      var ly = c.cy - 6 + Math.floor(hash(tx, ty * 13 + i) * 12);
      r.px(lx, ly, 2, 1, P.shade);
      r.px(lx + 1, ly + 1, 1, 1, P.shade);
    }
    r.px(c.cx - 1, c.cy - 2, 1, 1, P.hi);
  }

  function drawTrunk(r, tx, ty) {
    var x = tx * TILE, y = ty * TILE;
    r.px(x + 5, y + 9, 6, 7, '#2a1a10');
    r.px(x + 6, y + 9, 4, 7, '#6b4428');
    r.px(x + 6, y + 9, 1, 7, '#8c5e36');
    r.px(x + 9, y + 9, 1, 7, '#4a2c18');
    r.px(x + 3, y + 14, 3, 2, '#2a1a10');
    r.px(x + 4, y + 14, 2, 1, '#5a3820');
    r.px(x + 10, y + 14, 3, 2, '#2a1a10');
    r.px(x + 10, y + 14, 2, 1, '#5a3820');
  }

  function drawTuft(r, x, y) {
    r.px(x, y + 1, 1, 3, '#357a30');
    r.px(x + 2, y, 1, 4, '#357a30');
    r.px(x + 4, y + 2, 1, 2, '#357a30');
    r.px(x + 1, y + 2, 1, 2, '#3f8a38');
    r.px(x + 3, y + 1, 1, 3, '#3f8a38');
    r.px(x + 2, y, 1, 1, '#a4e07c');
    r.px(x, y + 1, 1, 1, '#94d470');
  }

  // Ruinenmauer: grobe Steinquader mit Moos
  function drawRuinWall(r, tx, ty) {
    var x = tx * TILE, y = ty * TILE;
    r.px(x, y, TILE, TILE, '#8a8f8a');
    r.px(x, y, TILE, 1, '#b8bcb4');
    r.px(x, y + 15, TILE, 1, '#565c56');
    r.px(x, y, 1, TILE, '#a8ada6');
    r.px(x + 15, y, 1, TILE, '#565c56');
    r.px(x, y + 7, TILE, 1, '#6a706a');
    // versetzte Fugen je Zeile
    var j1 = (ty % 2) ? 3 : 7, j2 = (ty % 2) ? 11 : 15;
    r.px(x + j1, y, 1, 7, '#6a706a');
    r.px(x + j2, y + 8, 1, 7, '#6a706a');
    // Moosflecken
    if (hash(tx * 5, ty * 3) > 0.55) {
      r.px(x + 2 + Math.floor(hash(tx, ty) * 6), y + 2, 3, 2, '#5a7a44');
      r.px(x + 9 + Math.floor(hash(ty, tx) * 4), y + 9, 2, 2, '#4c6a38');
    }
    r.px(x + 3, y + 3, 2, 1, '#b8bcb4');
    r.px(x + 10, y + 10, 2, 1, '#b8bcb4');
  }

  // Dunkler Eingang in die Ruine (Dungeon-Eingang, noch verschlossen)
  function drawRuinDoor(r, tx, ty) {
    var x = tx * TILE, y = ty * TILE;
    r.px(x, y, TILE, TILE, '#14121c');
    r.px(x, y, TILE, 2, '#7a7f7a');
    r.px(x, y + 2, TILE, 1, '#565c56');
    if (tileAt(tx - 1, ty) !== 'E') {
      r.px(x, y, 2, TILE, '#9a9f98');
      r.px(x + 1, y, 1, TILE, '#b8bcb4');
    }
    if (tileAt(tx + 1, ty) !== 'E') {
      r.px(x + 14, y, 2, TILE, '#9a9f98');
      r.px(x + 14, y, 1, TILE, '#565c56');
    }
    // schwach schimmernde Stufen
    r.px(x + 4, y + 13, 8, 1, '#2c2a3a');
    r.px(x + 5, y + 9, 6, 1, '#22202e');
  }

  // Felsbrocken (versperrt den Südausgang des Dorfplatzes, bis der
  // Wächter des ersten Dungeons besiegt ist)
  function drawRock(r, tx, ty) {
    var x = tx * TILE, y = ty * TILE;
    var left = tileAt(tx - 1, ty) === 'V';
    r.px(x, y + 1, 16, 14, '#7c8280');
    r.px(x, y + 1, 16, 2, '#9aa09e');
    r.px(x, y + 12, 16, 3, '#4c524e');
    if (!left) {
      r.px(x, y + 1, 2, 14, '#9aa09e');
      r.px(x, y + 1, 1, 13, '#b4bab8');
    }
    r.px(x + 6, y + 3, 1, 8, '#666c6a');   // Riss
    r.px(x + 6, y + 10, 4, 1, '#666c6a');
    r.px(x + 10, y + 5, 3, 1, '#b4bab8');
    r.px(x + 3, y + 10, 4, 1, '#5c6260');
  }

  // Leuchtturm (Dungeon 2): weißer Turm mit roten Bändern, Galerie und
  // dunklem Lampenraum – das Licht ist seit dem Bann erloschen
  function drawLighthouse(r, l) {
    var x = l.x * TILE, base = (l.y + l.h) * TILE;
    // Sockel aus Stein
    r.px(x + 6, base - 12, 52, 12, '#8a8f96');
    r.px(x + 6, base - 12, 52, 2, '#b4bac2');
    r.px(x + 6, base - 2, 52, 2, '#3a3a44');
    // Turmschaft, nach oben schmaler werdend
    r.px(x + 10, base - 76, 44, 64, '#f2ede2');
    r.px(x + 14, base - 92, 36, 16, '#f2ede2');
    r.px(x + 12, base - 76, 2, 4, '#f2ede2');   // Übergang
    r.px(x + 50, base - 76, 2, 4, '#f2ede2');
    // rote Bänder
    r.px(x + 10, base - 58, 44, 8, '#d8443c');
    r.px(x + 10, base - 30, 44, 8, '#d8443c');
    // Umrisse
    r.px(x + 10, base - 76, 1, 64, '#b8b2a6');
    r.px(x + 53, base - 76, 1, 64, '#b8b2a6');
    r.px(x + 14, base - 92, 1, 16, '#b8b2a6');
    r.px(x + 49, base - 92, 1, 16, '#b8b2a6');
    // Galerie mit Geländer
    r.px(x + 8, base - 96, 48, 4, '#5a5468');
    r.px(x + 8, base - 96, 48, 1, '#7a7490');
    r.px(x + 8, base - 102, 2, 10, '#5a5468');
    r.px(x + 54, base - 102, 2, 10, '#5a5468');
    r.px(x + 8, base - 103, 48, 2, '#5a5468');
    // Lampenraum: dunkel, kein Licht seit dem Bann
    r.px(x + 18, base - 114, 28, 11, '#20232c');
    r.px(x + 18, base - 114, 28, 1, '#3a3e4c');
    r.px(x + 22, base - 111, 7, 5, '#0e1018');
    r.px(x + 35, base - 111, 7, 5, '#0e1018');
    // Kuppel und Spitze
    r.px(x + 20, base - 120, 24, 6, '#d8443c');
    r.px(x + 24, base - 123, 16, 3, '#a02c34');
    r.px(x + 31, base - 129, 2, 6, '#5a5468');
  }

  // Tür des Leuchtturms: dunkler Rahmen, hölzerne Tür mit Griff
  // (rechte Hälfte der doppelt breiten Tür zeichnet die linke Kachel mit)
  function drawTowerDoor(r, tx, ty) {
    if (tileAt(tx - 1, ty) === 'E') return;
    var x = tx * TILE, y = ty * TILE;
    var w = tileAt(tx + 1, ty) === 'E' ? 32 : 16;
    r.px(x + 3, y + 2, w - 6, 14, '#20232c');
    r.px(x + 4, y + 4, w - 8, 12, '#5a3a22');
    r.px(x + 4, y + 4, w - 8, 2, '#7a5230');
    for (var i = 1; i < w - 8; i += 3) r.px(x + 4 + i, y + 6, 1, 10, '#3a2416');
    r.px(x + w - 11, y + 10, 2, 2, '#e8c04a');
  }

  // Kleine Holztruhe (freiwilliges R\u00e4tsel, Belohnung: das Schwert)
  function drawChest(r, tx, ty) {
    var x = tx * TILE, y = ty * TILE;
    r.px(x + 3, y + 6, 10, 8, '#7a4e28');
    r.px(x + 3, y + 6, 10, 1, '#9a6a38');
    r.px(x + 3, y + 13, 10, 1, '#5a381e');
    r.px(x + 4, y + 8, 8, 3, '#6a4222');
    r.px(x + 4, y + 3, 8, 4, '#8a5c34');
    r.px(x + 4, y + 3, 8, 1, '#a87848');
    r.px(x + 7, y + 8, 2, 3, '#e8c04a');
    r.px(x + 7, y + 9, 2, 1, '#b8863a');
    r.px(x + 3, y + 6, 1, 8, '#4a2f1c');
    r.px(x + 12, y + 6, 1, 8, '#4a2f1c');
  }

  // Geöffnete Truhe über die geschlossene zeichnen: Deckel klappt nach
  // hinten auf (p = 0 zu, 1 ganz offen), innen dunkel mit goldenem Schimmer
  function drawChestOpen(r, tx, ty, p) {
    var x = tx * TILE, y = ty * TILE;
    var lift = Math.round(p * 3);   // Deckel wandert nach oben
    // Innenraum (überdeckt den geschlossenen Deckel)
    r.px(x + 4, y + 3, 8, 5, '#2a1a10');
    r.px(x + 5, y + 6, 6, 1, p > 0.5 ? '#c89a3a' : '#3a2416');
    // aufgeklappter Deckel, von hinten gesehen (wird schmaler)
    var h = Math.max(1, 4 - lift);
    r.px(x + 3, y + 3 - lift, 10, h, '#8a5c34');
    r.px(x + 3, y + 3 - lift, 10, 1, '#a87848');
    r.px(x + 3, y + 2 + h - lift, 10, 1, '#5a381e');
  }

  // Kleines Holzschild (Hinweisschild an der Ruine)
  function drawSign(r, tx, ty) {
    var x = tx * TILE, y = ty * TILE;
    r.px(x + 7, y + 8, 2, 8, '#5a3a22');
    r.px(x + 7, y + 9, 1, 7, '#7a5230');
    r.px(x + 2, y + 2, 12, 7, '#8a5c34');
    r.px(x + 2, y + 2, 12, 1, '#a87848');
    r.px(x + 2, y + 8, 12, 1, '#5a3a22');
    r.px(x + 4, y + 4, 8, 1, '#4a2f1c');
    r.px(x + 4, y + 6, 6, 1, '#4a2f1c');
  }

  function drawStone(r, x, y) {
    r.px(x, y + 2, 5, 1, 'rgba(20,50,20,0.45)');
    r.px(x, y, 4, 2, '#8f9692');
    r.px(x + 1, y, 2, 1, '#c6ccc6');
    r.px(x + 3, y + 1, 1, 1, '#646c68');
  }

  function areaClear(x, y, w, h) {
    for (var yy = y - 1; yy <= y + h; yy++) {
      for (var xx = x - 1; xx <= x + w; xx++) {
        var k = yy * W + xx;
        if (S.pathMask[k] || S.waterMask[k] || S.bankMask[k]) return false;
        if (tileAt(xx >> 4, yy >> 4) !== '.') return false;
      }
    }
    return true;
  }

  function drawShadows(r) {
    var col = '#0c2a12';
    for (var ty = 0; ty < ROWS; ty++) {
      for (var tx = 0; tx < COLS; tx++) {
        var t = tileAt(tx, ty);
        if (t === 'T') {
          var c = canopyInfo(tx, ty);
          r.ellipse(c.cx + 2, c.cy + 6, 11 + c.big, 7, col);
        } else if (t === 'W') {
          r.ellipse(tx * TILE + 10, ty * TILE + 12, 9, 5, col);
        } else if (t === 'R' && tileAt(tx, ty + 1) !== 'R' && tileAt(tx, ty + 1) !== 'E') {
          // Schatten unter freier Mauerkante
          r.px(tx * TILE, ty * TILE + TILE, TILE, 2, col);
        }
      }
    }
    S.def.buildings.forEach(function (b) {
      var x = b.x * TILE, y = b.y * TILE, w = b.w * TILE, h = b.h * TILE;
      r.px(x + w - 2, y - 4, 6, h + 4, col);
      r.px(x + 2, y + h, w + 2, 3, col);
    });
    var s = S.def.school;
    if (s) r.px((s.x + s.w) * TILE - 2, s.y * TILE - 2, 4, (s.h - 1) * TILE + 2, col);
  }

  // --- Vorberechnung eines Bildschirms ---------------------------------------
  function bake(st) {
    S = st;
    st.pathMask = shapeMask('P', 2, 2, 2, true);
    st.waterMask = shapeMask('~', 4, 1, 3, false);
    st.bankMask = buildBank();
    st.waterDepth = buildDepth(st.waterMask);

    // 1) Bodenpixel
    st.ground = Render.createLayer(W, H);
    var img = st.ground.ctx.createImageData(W, H);
    var data = img.data;
    st.wavePixels = [];
    st.foamPixels = [];
    for (var y = 0; y < H; y++) {
      for (var x = 0; x < W; x++) {
        var k = y * W + x;
        var id = st.tiles[y >> 4][x >> 4];
        var c;
        if (st.pathMask[k]) {
          c = sandColor(x, y, k);
        } else if (st.waterMask[k]) {
          c = waterColor(x, y, k);
          var shaded = st.bankMask[k - W] || st.bankMask[k - 2 * W] || st.bankMask[k - 3 * W];
          if (st.waterDepth[k] === 1 && !shaded) st.foamPixels.push([x, y]);
          else if (st.waterDepth[k] >= 3) st.wavePixels.push([x, y]);
        } else if (st.bankMask[k]) {
          c = bankColor(x, y, st.bankMask[k]);
        } else {
          c = grassColor(x, y);
          if (id === 'T') c = lerp(c, C.grassDark, 0.25);
          if (id === 'S' || id === 'F' || id === 'G' || id === 'R' || id === 'E' || id === 'i' || id === 'C' || id === 'q' || id === 'V' || id === 'L') c = lerp(c, C.dry, 0.35);
          if (adjacent(st.pathMask, k) || adjacent(st.waterMask, k) || adjacent(st.bankMask, k)) {
            c = lerp(c, C.grassDark, 0.55);
          }
        }
        var o = k * 4;
        data[o] = c[0]; data[o + 1] = c[1]; data[o + 2] = c[2]; data[o + 3] = 255;
      }
    }
    st.ground.ctx.putImageData(img, 0, 0);

    // 2) Schatten
    var shadow = Render.createLayer(W, H);
    Render.setTarget(shadow.ctx);
    drawShadows(Render);
    Render.setTarget(st.ground.ctx);
    Render.image(shadow.canvas, 0, 0, 0.3);

    // 3) Büschel, Steine, Stämme, Unkraut am Zaun; Blumen merken
    st.flowers = [];
    var flowerColors = ['#ffffff', '#f6d64a', '#f08cb4', '#9cc8ff'];
    var salt = st.name === 'start' ? 0 : 31;
    for (var ty = 0; ty < ROWS; ty++) {
      for (var tx = 0; tx < COLS; tx++) {
        var t = tileAt(tx, ty);
        if (t === 'T' && tileAt(tx, ty + 1) !== 'T') drawTrunk(Render, tx, ty);
        if (t !== '.') continue;
        var hx = tx + salt;
        var nearFence = 'FG'.indexOf(tileAt(tx, ty - 1)) >= 0 || 'FG'.indexOf(tileAt(tx + 1, ty)) >= 0;
        if (nearFence && hash(hx, ty * 3) > 0.3) Buildings.fenceWeeds(Render, tx, ty, hx * 7 + ty);
        for (var n = 0; n < 2; n++) {
          if (hash(hx * 3 + n, ty * 7) < 0.55) {
            var gx = tx * TILE + 1 + Math.floor(hash(hx + n * 5, ty + 11) * 10);
            var gy = ty * TILE + 1 + Math.floor(hash(hx + 13, ty + n * 3) * 10);
            if (areaClear(gx, gy, 5, 4)) drawTuft(Render, gx, gy);
          }
        }
        if (hash(hx * 17, ty * 5) > 0.93) {
          var sx = tx * TILE + 3 + Math.floor(hash(hx, ty * 2) * 8);
          var sy = ty * TILE + 4 + Math.floor(hash(hx * 2, ty) * 8);
          if (areaClear(sx, sy, 5, 3)) drawStone(Render, sx, sy);
        }
        if (hash(hx * 5, ty * 9) > 0.62) {
          var fx = tx * TILE + 3 + Math.floor(hash(hx * 9, ty) * 10);
          var fy = ty * TILE + 3 + Math.floor(hash(hx, ty * 9) * 9);
          if (areaClear(fx - 1, fy - 1, 4, 5)) {
            st.flowers.push({
              x: fx, y: fy,
              color: flowerColors[Math.floor(hash(hx + 3, ty + 8) * flowerColors.length)],
              phase: hash(hx, ty) * 6.28
            });
          }
        }
      }
    }

    // 4) Objekte zeilenweise (je Grundzeile eine Ebene) und Baumkronen
    //    (eigene Ebene ganz oben), siehe Tiefensortierung unten
    st.rows = [];
    for (var row = 0; row < ROWS; row++) {
      if (!rowHasObjects(st, row)) continue;
      var y0 = Math.max(0, (row - ROW_UP) * TILE);
      var y1 = Math.min(H, (row + ROW_DOWN + 1) * TILE);
      var lay = Render.createLayer(W, y1 - y0);
      lay.ctx.translate(0, -y0);
      Render.setTarget(lay.ctx);
      paintObjects(st, 'row', row);
      st.rows[row] = { canvas: lay.canvas, y: y0 };
    }
    st.overlay = Render.createLayer(W, H);
    Render.setTarget(st.overlay.ctx);
    paintObjects(st, 'canopy');
    Render.setTarget(null);
  }

  // --- Tiefensortierung der Objekte ----------------------------------------
  // Jedes Objekt (Haus, Laden, Schule, Brunnen, Zaun, Tor, Schild, Truhe,
  // Ruinenmauer) hat eine Grundzeile = Kachelzeile seiner Unterkante. Die
  // Objekte jeder Grundzeile liegen in einer eigenen Ebene. Gezeichnet wird
  // Zeile für Zeile von oben nach unten: erst die Figuren, deren Füße in dieser
  // Zeile stehen, dann die Objekte der Zeile. So steht eine Figur vor allem,
  // was weiter oben steht, und hinter allem ab ihrer eigenen Zeile.
  // Baumkronen liegen immer ganz oben (Effekt „unter dem Baum“).
  var ROW_UP = 7;     // so viele Kachelzeilen ragt ein Objekt höchstens nach oben
  var ROW_DOWN = 1;   // ... und höchstens nach unten über seine Grundzeile

  // Zeichnet Objekte. mode 'row': nur die Objekte der Grundzeile onlyRow.
  // mode 'canopy': nur Baumkronen; Objekte, die im Original über einer Krone
  // lagen, radieren sie dort aus (Reihenfolge Krone/Gebäude bleibt wie bisher).
  function paintObjects(st, mode, onlyRow) {
    var ctx = Render.getCtx();
    var s = st.def.school;
    function obj(row, fn) {
      if (mode === 'row') { if (row === onlyRow) fn(); return; }
      ctx.globalCompositeOperation = 'destination-out';
      fn();
      ctx.globalCompositeOperation = 'source-over';
    }
    for (var cy = 0; cy < ROWS; cy++) {
      var cx, tt;
      for (cx = 0; cx < COLS; cx++) {
        tt = tileAt(cx, cy);
        var x = cx, y = cy;
        if (tt === 'T') { if (mode === 'canopy') drawCanopy(Render, cx, cy); }
        else if (tt === 'W' || tt === 'q') obj(cy, function () { Buildings.well(Render, x, y); });  // Quelle sieht aus wie der Dorfbrunnen
        else if (tt === 'R') obj(cy, function () { drawRuinWall(Render, x, y); });
        else if (tt === 'E') obj(cy, function () {
          // Leuchtturm-Tür sieht anders aus als der Höhleneingang
          if (st.def.lighthouse) drawTowerDoor(Render, x, y);
          else drawRuinDoor(Render, x, y);
        });
        else if (tt === 'i') obj(cy, function () { drawSign(Render, x, y); });
        else if (tt === 'C') obj(cy, function () { drawChest(Render, x, y); });
        else if (tt === 'V') obj(cy, function () { drawRock(Render, x, y); });
      }
      if (s && cy === s.y) obj(s.y + s.h - 1, function () { Buildings.school(Render, s); });
      var lt = st.def.lighthouse;
      if (lt && cy === lt.y + lt.h - 1) obj(lt.y + lt.h - 1, function () { drawLighthouse(Render, lt); });
      for (cx = 0; cx < COLS; cx++) {
        tt = tileAt(cx, cy);
        var fx = cx, fy = cy;
        if (tt === 'F') {
          var up = tileAt(cx, cy - 1) === 'F', down = tileAt(cx, cy + 1) === 'F';
          var side = 'FG'.indexOf(tileAt(cx - 1, cy)) >= 0 || 'FG'.indexOf(tileAt(cx + 1, cy)) >= 0;
          obj(cy, function () {
            if (up || down) Buildings.fence(Render, fx, fy, 'v');
            if (side) Buildings.fence(Render, fx, fy, 'h', hash(fx, fy) > 0.75);
          });
        } else if (tt === 'G' && tileAt(cx - 1, cy) !== 'G') {
          obj(cy, function () { Buildings.gate(Render, fx, fy); });
        }
      }
      st.def.buildings.forEach(function (b) {
        if (b.y + b.h - 1 !== cy) return;
        obj(cy, function () {
          if (b.shop) Buildings.shop(Render, b);
          else Buildings.house(Render, b);
        });
      });
    }
  }

  // Hat die Grundzeile row mindestens ein Objekt?
  function rowHasObjects(st, row) {
    for (var cx = 0; cx < COLS; cx++) {
      if ('WqREiVCFG'.indexOf(tileAt(cx, row)) >= 0) return true;
    }
    var s = st.def.school;
    if (s && s.y + s.h - 1 === row) return true;
    var lt = st.def.lighthouse;
    if (lt && lt.y + lt.h - 1 === row) return true;
    return st.def.buildings.some(function (b) { return b.y + b.h - 1 === row; });
  }

  // Kachelzeile, in der die Füße einer 16x16-Figur mit Oberkante y stehen
  function footRowOf(y) {
    return Math.max(0, Math.min(ROWS - 1, Math.floor((y + 15) / TILE)));
  }

  // Objekte und Figuren nach Tiefe zeichnen (zwischen drawGround und
  // drawOverlay). actors: Liste { y, draw } mit y = Oberkante der 16x16-Figur.
  // In Innenräumen und Dungeon-Räumen werden die Figuren einfach der Reihe
  // nach gezeichnet (dort liegen keine Objekte über den Figuren).
  function drawSorted(r, name, actors) {
    name = name || current;
    if (!states[name]) { actors.forEach(function (a) { a.draw(); }); return; }
    var st = stateOf(name);
    // Figuren nach Fußzeile einsortieren, innerhalb der Zeile von oben nach unten
    var list = actors.slice().sort(function (a, b) { return a.y - b.y; });
    var k = 0;
    for (var row = 0; row < ROWS; row++) {
      while (k < list.length && footRowOf(list[k].y) <= row) list[k++].draw();
      var L = st.rows[row];
      if (L) r.image(L.canvas, 0, L.y);
      drawOpenChest(r, st, row);
    }
    while (k < list.length) list[k++].draw();
  }

  // Geöffnete Rätsel-Truhe (nach gelöstem Rätsel) über der geschlossenen,
  // in der Grundzeile der Truhe
  function drawOpenChest(r, st, row) {
    if (!(st.chestOpen > 0)) return;
    (st.def.signs || []).forEach(function (sg) {
      if (sg.action === 'chest' && sg.tiles[0][1] === row)
        drawChestOpen(r, sg.tiles[0][0], sg.tiles[0][1], st.chestOpen);
    });
  }

  function stateOf(name) {
    var st = states[name];
    if (!st.ground) bake(st);
    S = st;
    return st;
  }

  // --- Zeichnen pro Bild -------------------------------------------------------
  function drawWater(ctx, st, t) {
    var i, p;
    ctx.fillStyle = '#ffffff';
    for (i = 0; i < st.foamPixels.length; i++) {
      p = st.foamPixels[i];
      if (Math.sin(t * 0.003 + p[0] * 0.9 + p[1] * 1.3) > 0.25) ctx.fillRect(p[0], p[1], 1, 1);
    }
    ctx.fillStyle = 'rgba(160,214,250,0.75)';
    for (i = 0; i < st.wavePixels.length; i++) {
      p = st.wavePixels[i];
      var v = Math.sin(p[0] * 0.38 + p[1] * 0.85 - t * 0.0022) + Math.sin(p[0] * 0.12 - p[1] * 0.5 + t * 0.0013);
      if (v > 1.6) ctx.fillRect(p[0], p[1], 1, 1);
    }
    if (!st.wavePixels.length) return;
    ctx.fillStyle = '#ffffff';
    for (i = 0; i < 3; i++) {
      var cycle = t / 1100 + i * 0.37;
      p = st.wavePixels[Math.floor(hash(i, Math.floor(cycle)) * st.wavePixels.length)];
      var phase = cycle - Math.floor(cycle);
      if (!p || phase > 0.5) continue;
      ctx.fillRect(p[0], p[1], 1, 1);
      if (phase > 0.12 && phase < 0.38) {
        ctx.fillRect(p[0] - 1, p[1], 3, 1);
        ctx.fillRect(p[0], p[1] - 1, 1, 3);
      }
    }
  }

  function drawFlowers(r, st, t) {
    for (var i = 0; i < st.flowers.length; i++) {
      var f = st.flowers[i];
      var sway = Math.round(Math.sin(t * 0.0016 + f.phase) * 0.8);
      r.px(f.x + 1, f.y + 2, 1, 2, '#2f7a2c');
      var x = f.x + sway, y = f.y;
      r.px(x + 1, y - 1, 1, 1, f.color);
      r.px(x, y, 3, 1, f.color);
      r.px(x + 1, y + 1, 1, 1, f.color);
      r.px(x + 1, y, 1, 1, f.color === '#f6d64a' ? '#f08040' : '#f6d64a');
    }
  }

  // Boden inkl. Animationen (unter der Spielfigur); name optional
  function drawGround(r, time, name) {
    var t = time || 0;
    name = name || current;
    if (!states[name]) { Interior.drawGround(r, t, name); return; }
    var st = stateOf(name);
    r.image(st.ground.canvas, 0, 0);
    drawWater(r.getCtx(), st, t);
    drawFlowers(r, st, t);
    // Außen-NPCs (unter Gebänden und Baumkronen)
    var npcs = st.def.npcs || [];
    if (npcs.length && !st.npcSprites) {
      st.npcSprites = npcs.map(function (n) { return n.sprites(); });
    }
    var ctx = r.getCtx();
    for (var i = 0; i < npcs.length; i++) {
      var n = npcs[i];
      ctx.globalAlpha = 0.3;
      r.ellipse(n.x + 8, n.y + 15, 6, 2, '#2a140a');
      ctx.globalAlpha = 1;
      // Blickrichtung (Standard: zur Kamera); Blinzeln nur in der Vorderansicht
      var set = st.npcSprites[i];
      var dir = n.facing || 'down';
      var arr = set[dir] || set.down;
      var blink = dir === 'down' && (t + i * 900) % 3600 < 180 ? 1 : 0;
      r.image(arr[blink], n.x, n.y);
    }
  }

  // Baumkronen, offene Türen, Rauch (über der Spielfigur)
  function drawOverlay(r, time, name) {
    var t = time || 0;
    name = name || current;
    if (!states[name]) { Interior.drawOverlay(r, t, name); return; }
    var st = stateOf(name);
    r.image(st.overlay.canvas, 0, 0);
    var ctx = r.getCtx();
    st.def.buildings.forEach(function (b) {
      if (st.doors[b.room] > 0) Buildings.openDoor(r, b, st.doors[b.room]);
      if (!b.chimney) return;
      for (var i = 0; i < 4; i++) {
        var p = (t / 1000 * 0.35 + i / 4 + b.x * 0.13) % 1;
        ctx.globalAlpha = 0.55 * (1 - p);
        var rad = 2 + Math.round(p * 4);
        r.ellipse(b.chimney.x + Math.round(Math.sin(p * 5 + i) * 2 + p * 8), b.chimney.y - Math.round(p * 28), rad, rad, '#f2f2f2');
      }
      ctx.globalAlpha = 1;
    });
  }

  return {
    drawGround: drawGround,
    drawSorted: drawSorted,
    drawOverlay: drawOverlay,
    isBlocked: isBlocked,
    checkWarp: checkWarp,
    checkEdge: checkEdge,
    talkTarget: talkTarget,
    setScreen: setScreen,
    getScreen: getScreen,
    addNpc: addNpc,
    isOutdoor: isOutdoor,
    setDoorOpen: setDoorOpen,
    doorRect: doorRect,
    setChestOpen: setChestOpen,
    openRockGate: openRockGate,
    chestPos: chestPos,
    START: START,
    WIDTH: W,
    HEIGHT: H,
    TILE: TILE
  };
})();
