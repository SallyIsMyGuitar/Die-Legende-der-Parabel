// schule.js: Die zerstoerte Schule - Dungeon 5, das Finale
// (Schnittpunkte und Anwendungen)
// Eingang ist die Tuer der Schule auf dem Startbildschirm (Hausmeister
// hinter Muelltonnen und Rastquelle davor, Lichtlinien in world.js).
// Vier Raeume:
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

  // ---Schule im Dorf (Startbildschirm) -----------------------------------
  // Dungeon 5 liegt im Schulgebaeude selbst: Nach dem Sieg ueber Dungeon 4
  // oeffnet sich das Schultor, die Tuer der Schule fuehrt ins Klassenzimmer.
  // Links vor dem Zaun versteckt sich der Hausmeister hinter den
  // Muelltonnen ('U'), darueber steht die Rastquelle vor der Schule.
  World.addNpc('start', {
    x: 7 * TILE, y: 9 * TILE, baseFacing: 'down', sprites: function () { return People.hausmeister(); },
    // erst sichtbar, wenn das Schultor offen ist (vorher verriete er zu frueh,
    // dass die Lehrkraefte in der Schule gefangen sind)
    when: function () { return World.isSchoolGateOpen(); },
    talk: {
      name: 'Hausmeister',
      texts: [
        'Psst, hier drüben! Ich bin der Hausmeister der Schule – seit der Graf sein Heer aus Linealen schickte, halte ich mich hinter den Tonnen versteckt.',
        'Dahinter, in der Ruine, hält er die Lehrerinnen und Lehrer gefangen. Alles folgt seinen starren, geraden Linien.',
        'Seltsam ist nur: Kurz bevor der Graf kam, verschwand das große Tafellineal aus dem Matheraum. Keiner weiß, wohin.',
        'Mein Merksatz: Schnittpunkte von Parabel und Gerade: beide Terme gleichsetzen und die quadratische Gleichung lösen.'
      ],
      merk: { id: 'schnittGerade', name: 'Schnittpunkte Parabel/Gerade', text: 'Schnittpunkte von Parabel und Gerade: beide Terme gleichsetzen und die quadratische Gleichung lösen.' },
      // nach dem Finale: kein Versteck mehr (Texte vorläufig)
      later: { finale: true, replace: true, texts: [
        'Du hast es geschafft! Der Graf ist fort, und ich muss mich nicht mehr hinter den Tonnen verstecken.',
        'Jetzt räume ich endlich auf. Bis die Schule wieder steht, dauert es aber noch ein bisschen.',
        'Und das alte Tafellineal hänge ich wieder an die Tafel. Aber ab jetzt zeichnen wir damit nur noch Achsen für Parabeln!',
        'Mein Merksatz: Schnittpunkte von Parabel und Gerade: beide Terme gleichsetzen und die quadratische Gleichung lösen.'
      ] }
    }
  });

  World.addSign('start', {
    // Rastquelle vor der Schule (sieht aus wie der Dorfbrunnen)
    tiles: [[7, 6]], x: 7 * TILE, y: 6 * TILE, name: 'Quelle',
    texts: ['Du trinkst vom klaren Wasser. Deine Herzen sind wieder voll.'],
    action: 'rest',
    spawn: { x: 7 * TILE, y: 7 * TILE, facing: 'up' }
  });

  // ---Schul-Optik (Innenraeume) --------------------------------------------
  // Jeder Raum hat ein eigenes Thema (def.art): 'klasse' Klassenzimmer mit
  // Parkett und Fenstern, 'physik' Physiksaal mit Fliesen und Labortischen,
  // 'turnhalle' mit Hallenboden, Spielfeldlinien und Sprossenwand, 'aula' mit
  // Buehne, Vorhang und Stuhlreihen. Vor dem Finale ist alles zerstoert
  // (Risse, Schutt, umgekippte Moebel), danach aufgeraeumt (sauber()).
  var mix = Render.mix;

  function sauber() {
    return typeof Boss !== 'undefined' && !!Boss.of('aula') && Boss.of('aula').isDefeated();
  }

  function isWall(def, tx, ty) {
    var c = def.map[ty] ? def.map[ty].charAt(tx) : '#';
    return c === 'W' || c === '#' || c === '';
  }

  // Boden je Raum
  function schoolFloor(r, tx, ty, art, kaputt) {
    var x = tx * TILE, y = ty * TILE, i;
    if (art === 'klasse' || art === 'aula') {
      // Parkett: versetzte Holzstaebe
      var holz = art === 'aula' ? ['#7a4a32', '#6a3e2a', '#5a3222'] : ['#b48a5a', '#a27a4c', '#8a663c'];
      for (i = 0; i < 4; i++) {
        var py = y + i * 4;
        r.px(x, py, TILE, 4, (i + tx) % 2 ? holz[0] : holz[1]);
        r.px(x + ((i + tx) % 2 ? 4 : 10), py, 1, 4, holz[2]);
        r.px(x, py + 3, TILE, 1, holz[2]);
      }
    } else if (art === 'physik') {
      // Fliesen blaugrau
      var even = (tx + ty) % 2 === 0;
      r.px(x, y, TILE, TILE, even ? '#9aa8b4' : '#8e9ca8');
      r.px(x, y, TILE, 1, '#7a8894');
      r.px(x, y, 1, TILE, '#7a8894');
    } else {
      // Turnhallenboden: helles Holz in Laengsbahnen
      r.px(x, y, TILE, TILE, '#d8b47a');
      for (i = 0; i < TILE; i += 4) r.px(x + i, y, 1, TILE, '#c8a26a');
      if (hash(tx, ty * 3) > 0.7) r.px(x + 6, y + 4, 1, 3, '#e8c890');
    }
    if (kaputt && hash(tx * 3, ty * 7) > 0.8) {
      // Riss im Boden
      r.px(x + 2 + Math.floor(hash(tx, ty) * 6), y + 4, 1, 8, 'rgba(30,24,20,0.6)');
      r.px(x + 4 + Math.floor(hash(ty, tx) * 6), y + 9, 1, 5, 'rgba(30,24,20,0.6)');
    }
  }

  // Wand je Raum (Putz mit Lambris), vor dem Finale mit Abplatzungen
  var WANDFARBE = { klasse: ['#e8dcc0', '#5a8a5a'], physik: ['#e8eef0', '#4a7aa8'], turnhalle: ['#d8d0c0', '#c84a3a'], aula: ['#e0c8a8', '#7a2a2a'] };
  function schoolWall(r, tx, ty, def, kaputt) {
    var x = tx * TILE, y = ty * TILE;
    var f = WANDFARBE[def.art] || WANDFARBE.klasse;
    r.px(x, y, TILE, TILE, f[0]);
    r.px(x, y, TILE, 1, mix(f[0], '#ffffff', 0.4));
    r.px(x, y + 15, TILE, 1, mix(f[0], '#000000', 0.3));
    if (ty === 1 || ty === 12) {           // Lambris (farbiger Sockel) an oberer/unterer Wand
      r.px(x, y + 10, TILE, 5, f[1]);
      r.px(x, y + 10, TILE, 1, mix(f[1], '#ffffff', 0.3));
    } else {
      r.px(x + 10, y, 5, TILE, f[1]);      // Sockel an den Seitenwaenden
    }
    if (kaputt && hash(tx * 5 + 1, ty * 3) > 0.65) {
      r.px(x + 2 + Math.floor(hash(tx, ty) * 8), y + 2 + Math.floor(hash(ty, tx) * 6), 4, 3, '#8a8478');
      r.px(x + 3 + Math.floor(hash(tx, ty) * 8), y + 3 + Math.floor(hash(ty, tx) * 6), 2, 1, '#6e6a60');
    }
  }

  // Wandschatten auf den Boden
  function wallShadows(r, def) {
    var ctx = r.getCtx();
    ctx.globalAlpha = 0.2;
    for (var ty = 0; ty < 14; ty++) {
      for (var tx = 0; tx < 16; tx++) {
        if (isWall(def, tx, ty)) continue;
        if (isWall(def, tx, ty - 1)) r.px(tx * TILE, ty * TILE, TILE, 3, '#000000');
        if (isWall(def, tx - 1, ty)) r.px(tx * TILE, ty * TILE, 2, TILE, '#000000');
      }
    }
    ctx.globalAlpha = 1;
  }

  // 't': Schultisch (Klasse), Turnkasten (Turnhalle); zerstoert umgekippt
  function tisch(r, tx, ty, art, kaputt) {
    var x = tx * TILE, y = ty * TILE;
    r.ellipse(x + 8, y + 14, 7, 2, 'rgba(20,20,30,0.35)');
    if (art === 'turnhalle') {
      r.px(x + 2, y + 4, 12, 10, '#a87848');
      r.px(x + 2, y + 4, 12, 3, '#e8e0d0');               // Polster
      r.px(x + 2, y + 9, 12, 1, '#7a5430');
      r.px(x + 2, y + 12, 12, 1, '#7a5430');
      if (kaputt) r.px(x + 9, y + 4, 5, 3, '#6a4a2a');      // Polster aufgerissen
      return;
    }
    if (kaputt) {
      r.px(x + 2, y + 3, 12, 5, '#7a4e2a');                  // Platte schraeg
      r.px(x + 2, y + 3, 12, 1, '#96603a');
      r.px(x + 3, y + 8, 2, 7, '#5a381e');                   // Beine
      r.px(x + 11, y + 6, 2, 9, '#5a381e');
    } else {
      r.px(x + 1, y + 5, 14, 6, '#c8a070');                  // Tischplatte
      r.px(x + 1, y + 5, 14, 1, '#e0bc8a');
      r.px(x + 2, y + 11, 2, 4, '#5a5a62');                  // Metallbeine
      r.px(x + 12, y + 11, 2, 4, '#5a5a62');
      r.px(x + 4, y + 6, 4, 3, '#ffffff');                   // Heft
      r.px(x + 9, y + 7, 3, 1, '#2e6aa8');                   // Stift
    }
  }

  // 'b': Labortisch (Physik), Turnmatte (Turnhalle); zerstoert zerbrochen
  function bank(r, tx, ty, art, kaputt) {
    var x = tx * TILE, y = ty * TILE;
    r.ellipse(x + 8, y + 14, 7, 2, 'rgba(20,20,30,0.35)');
    if (art === 'turnhalle') {
      r.px(x + 1, y + 6, 14, 8, '#3a6ab0');
      r.px(x + 1, y + 6, 14, 1, '#5a8ad0');
      r.px(x + 1, y + 10, 14, 1, '#2a4a80');
      if (kaputt) r.px(x + 10, y + 7, 4, 2, '#e8c890');
      return;
    }
    if (art === 'physik' && !kaputt) {
      r.px(x + 1, y + 4, 14, 10, '#4a4e58');                 // Unterschrank
      r.px(x, y + 3, 16, 3, '#2a2e36');                      // schwarze Platte
      r.px(x + 3, y + 3, 4, 2, '#8a94a4');                   // Waschbecken
      r.px(x + 5, y, 1, 4, '#b8c0c8');                       // Wasserhahn
      r.px(x + 10, y + 1, 2, 3, '#6ac8e8');                  // Glaskolben
      return;
    }
    r.px(x + 2, y + 7, 6, 3, art === 'physik' ? '#4a4e58' : '#8a5c34');
    r.px(x + 9, y + 9, 5, 3, art === 'physik' ? '#2a2e36' : '#8a5c34');
    r.px(x + 3, y + 10, 2, 5, '#5a381e');
    r.px(x + 11, y + 12, 2, 3, '#5a381e');
    r.px(x + 4, y + 6, 2, 1, '#d8d8d0');
    if (art === 'physik') r.px(x + 6, y + 12, 3, 1, '#9ad8f0');   // Scherben
  }

  // 'x': Schutt; aufgeraeumt: Pflanze (Klasse/Physik) bzw. Ballwagen (Turnhalle)
  function schutt(r, tx, ty, art, kaputt) {
    var x = tx * TILE, y = ty * TILE;
    r.ellipse(x + 8, y + 14, 7, 2, 'rgba(20,20,30,0.35)');
    if (!kaputt) {
      if (art === 'turnhalle') {
        r.px(x + 2, y + 6, 12, 8, '#5a5a62');
        r.ellipse(x + 5, y + 6, 3, 3, '#e87a2a');
        r.ellipse(x + 11, y + 6, 3, 3, '#e8e0d0');
        r.ellipse(x + 8, y + 4, 3, 3, '#e87a2a');
        return;
      }
      r.px(x + 5, y + 9, 6, 5, '#b8643a');
      r.ellipse(x + 8, y + 6, 5, 4, '#4a8a3a');
      r.ellipse(x + 6, y + 4, 2, 2, '#6aaa4a');
      return;
    }
    r.px(x + 2, y + 8, 7, 6, '#8a8478');
    r.px(x + 3, y + 9, 5, 4, '#a8a296');
    r.px(x + 9, y + 6, 5, 8, '#6e6a60');
    r.px(x + 10, y + 7, 3, 6, '#8a8478');
    r.px(x + 5, y + 10, 2, 1, '#5e5a52');
    r.px(x + 11, y + 4, 2, 2, '#d8d8d0');
  }

  // 'h': Stuhlreihe in der Aula (blockiert); zerstoert umgestossen
  function stuhl(r, tx, ty, kaputt) {
    var x = tx * TILE, y = ty * TILE;
    r.ellipse(x + 8, y + 14, 7, 2, 'rgba(20,20,30,0.35)');
    if (kaputt && hash(tx, ty) > 0.5) {
      r.px(x + 3, y + 9, 10, 3, '#8a2a2a');
      r.px(x + 3, y + 12, 2, 2, '#3a3a40');
      return;
    }
    r.px(x + 3, y + 2, 10, 6, '#a83a3a');      // Lehne
    r.px(x + 3, y + 2, 10, 1, '#c85a5a');
    r.px(x + 3, y + 8, 10, 4, '#8a2a2a');      // Sitz
    r.px(x + 4, y + 12, 2, 3, '#3a3a40');
    r.px(x + 10, y + 12, 2, 3, '#3a3a40');
  }

  // Tuerfreie Oeffnung (Uebergang)
  function schoolOpening(r, tx, ty, top) {
    var x = tx * TILE, y = ty * TILE;
    r.px(x, y, TILE, TILE, '#14121a');
    r.px(x + 1, y + (top ? 3 : 1), 14, 3, '#8a8478');
    r.px(x + 1, y + (top ? 3 : 1), 14, 1, '#a8a296');
  }

  // Fenster in der oberen Wand (Tageslicht, zerstoert mit Sprung)
  function fenster(r, tx, ty, kaputt) {
    var x = tx * TILE, y = ty * TILE;
    r.px(x + 2, y + 1, 12, 9, '#6a6a72');
    r.px(x + 3, y + 2, 10, 7, '#a8d4f0');
    r.px(x + 3, y + 2, 10, 2, '#cce8f8');
    r.px(x + 8, y + 2, 1, 7, '#6a6a72');
    if (kaputt) {
      r.px(x + 4, y + 3, 1, 1, '#ffffff');
      r.px(x + 5, y + 4, 1, 2, '#ffffff');
      r.px(x + 6, y + 6, 1, 1, '#ffffff');
    }
  }

  // Lichtstreifen der Fenster auf dem Boden (Laufbild)
  function fensterLicht(r, t, def) {
    if (!def.fenster) return;
    var ctx = r.getCtx();
    def.fenster.forEach(function (f, i) {
      ctx.globalAlpha = 0.09 + 0.02 * Math.sin(t / 900 + i);
      for (var k = 0; k < 50; k += 2) r.px(f[0] * TILE + 2 - k / 4, 2 * TILE + k, 12, 2, '#fff8e0');
    });
    ctx.globalAlpha = 1;
  }

  // Kreidestaub in der Luft (nur vor dem Finale)
  function kreidestaub(r, t) {
    var ctx = r.getCtx();
    ctx.globalAlpha = 0.5;
    for (var i = 0; i < 8; i++) {
      var ph = (t / 6000 + i / 8) % 1;
      r.px(Math.round(30 + i * 27 + Math.sin(t / 900 + i) * 6), Math.round(200 - ph * 170), 1, 1, '#e8e8e0');
    }
    ctx.globalAlpha = 1;
  }

  // Turnhalle: Spielfeldlinien, Mittelkreis, Basketballkorb, Sprossenwand
  function turnhallenDeko(r, kaputt) {
    var weiss = kaputt ? '#c8c0a8' : '#ffffff';
    r.px(3 * TILE, 3 * TILE, 10 * TILE, 1, weiss);               // Spielfeld
    r.px(3 * TILE, 11 * TILE, 10 * TILE, 1, weiss);
    r.px(3 * TILE, 3 * TILE, 1, 8 * TILE, weiss);
    r.px(13 * TILE, 3 * TILE, 1, 8 * TILE + 1, weiss);
    r.px(3 * TILE, 7 * TILE, 10 * TILE, 1, weiss);               // Mittellinie
    for (var a = 0; a < 40; a++) {                               // Mittelkreis
      var w = a / 40 * Math.PI * 2;
      r.px(Math.round(128 + Math.cos(w) * 20), Math.round(112 + Math.sin(w) * 14), 1, 1, weiss);
    }
    // Basketballkorb an der oberen Wand (Kachel 11,1)
    var bx = 11 * TILE, by = 1 * TILE;
    r.px(bx + 1, by + 1, 14, 9, '#ffffff');
    r.px(bx + 5, by + 4, 6, 4, kaputt ? '#c8c8c8' : '#e8443a');
    r.px(bx + 4, by + 10, 8, 1, '#e87a2a');                      // Ring
    for (var n = 0; n < 4; n++) r.px(bx + 5 + n * 2, by + 11 + (n % 2), 1, 3, '#e8e8e0');   // Netz
    // Sprossenwand an der linken Seitenwand
    for (var y = 3 * TILE; y < 11 * TILE; y += 5) r.px(1 * TILE + 2, y, 12, 2, kaputt && y % 3 ? '#8a6a44' : '#c8a070');
    r.px(1 * TILE + 2, 3 * TILE, 2, 8 * TILE, '#a87848');
    r.px(1 * TILE + 12, 3 * TILE, 2, 8 * TILE, '#a87848');
  }

  // Physiksaal: Pendel an der Wand (Laufbild)
  function pendel(r, t) {
    var cx = 11 * TILE + 8, cy = 1 * TILE + 1;
    r.px(cx - 5, cy, 11, 2, '#5a5a62');
    var w = Math.sin(t / 500) * 0.5;
    for (var k = 0; k < 11; k++) r.px(Math.round(cx + Math.sin(w) * k), cy + 2 + k, 1, 1, '#3a3a40');
    r.ellipse(Math.round(cx + Math.sin(w) * 12), cy + 14, 2, 2, '#c8a040');
  }

  // Aula: Buehne mit rotem Vorhang an der oberen Wand
  function buehne(r, kaputt) {
    r.px(2 * TILE, 2 * TILE, 12 * TILE, 2 * TILE - 4, '#5a3222');          // Buehnenboden
    for (var i = 0; i < 12; i++) r.px((2 + i) * TILE, 2 * TILE, 1, 2 * TILE - 4, '#4a2a1a');
    r.px(2 * TILE, 4 * TILE - 4, 12 * TILE, 3, '#3a2014');                 // Buehnenkante
    r.px(2 * TILE, 4 * TILE - 4, 12 * TILE, 1, '#8a5a3a');
    // Vorhang links und rechts, oben eine Borduere
    [2, 12].forEach(function (cx) {
      for (var k = 0; k < 2 * TILE; k += 4) {
        r.px(cx * TILE + k / 2, 1 * TILE, 4, 2 * TILE + 8 - k / 2, k % 8 ? '#a82a2a' : '#c84040');
      }
    });
    r.px(2 * TILE, 1 * TILE, 12 * TILE, 5, kaputt ? '#7a2020' : '#a82a2a');
    for (var b = 2 * TILE; b < 14 * TILE; b += 8) r.px(b, 1 * TILE + 5, 4, 2, '#e8c04a');
  }

  // Kronleuchter (Laufbild): warmes Licht an der Decke, vor dem Finale flackernd
  function kronleuchter(r, t, kaputt) {
    var ctx = r.getCtx();
    // von oben gesehen: goldener Ring mit sechs Lichtern, darunter warmer Schein
    [[64, 112], [192, 112]].forEach(function (k, i) {
      var an = !(kaputt && Math.floor(t / 120 + i * 5) % 9 === 0);
      if (an) {
        ctx.globalAlpha = kaputt ? 0.07 : 0.11;
        r.ellipse(k[0], k[1], 36, 24, '#fff0c0');
        ctx.globalAlpha = 1;
      }
      for (var a = 0; a < 24; a++) {
        var w = a / 24 * Math.PI * 2;
        r.px(Math.round(k[0] + Math.cos(w) * 8), Math.round(k[1] + Math.sin(w) * 5), 1, 1, '#c8a040');
      }
      for (var n = 0; n < 6; n++) {
        var v = n / 6 * Math.PI * 2;
        r.px(Math.round(k[0] + Math.cos(v) * 8) - 1, Math.round(k[1] + Math.sin(v) * 5) - 1, 2, 2, an ? '#fff8d0' : '#8a7a50');
      }
      r.px(k[0] - 1, k[1] - 1, 2, 2, '#c8a040');
    });
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
    var kaputt = !sauber();
    def.gebackenSauber = !kaputt;   // merken: nach dem Finale neu backen
    r.px(0, 0, 256, 224, '#14121a');
    var ty, tx, c;
    for (ty = 0; ty < 14; ty++) {
      for (tx = 0; tx < 16; tx++) {
        c = def.map[ty].charAt(tx);
        if (c === '#') continue;
        if (c === 'W') { schoolWall(r, tx, ty, def, kaputt); continue; }
        schoolFloor(r, tx, ty, def.art, kaputt);
      }
    }
    if (def.art === 'turnhalle') turnhallenDeko(r, kaputt);
    if (def.art === 'aula') buehne(r, kaputt);
    wallShadows(r, def);
    for (ty = 0; ty < 14; ty++) {
      for (tx = 0; tx < 16; tx++) {
        c = def.map[ty].charAt(tx);
        if (c === 't') tisch(r, tx, ty, def.art, kaputt);
        else if (c === 'b') bank(r, tx, ty, def.art, kaputt);
        else if (c === 'x') schutt(r, tx, ty, def.art, kaputt);
        else if (c === 'h') stuhl(r, tx, ty, kaputt);
        else if (c === 'M') schoolOpening(r, tx, ty, ty < 7);
      }
    }
    (def.fenster || []).forEach(function (f) { fenster(r, f[0], f[1], kaputt); });
    if (def.bakeExtra) def.bakeExtra(r, kaputt);
  }

  // Zerbrochene Tafel an der Wand des Klassenzimmers (Kachel 5,1)
  function zerbrocheneTafel(r, kaputt) {
    var x = 5 * TILE, y = 1 * TILE;
    r.px(x + 1, y + 2, 14, 12, '#3a3a40');
    r.px(x + 2, y + 3, 12, 10, '#20302c');
    if (!kaputt) {
      // heile Tafel mit sauber gezeichneter Parabel
      for (var o = -4; o <= 4; o++) r.px(x + 8 + o, y + 5 + Math.round(o * o / 3), 1, 1, '#e8e8e0');
      r.px(x + 3, y + 11, 10, 1, '#8a8a80');
      return;
    }
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
  // Thema: Parkett, Fenster mit Tageslicht, Tische, Kreidestaub
  var KLASSENZIMMER = {
    art: 'klasse',
    fenster: [[10, 1], [11, 1], [12, 1]],
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
      '8,12': { screen: 'start', x: 11.5 * TILE, y: 10 * TILE, facing: 'down' }
    },
    bakeExtra: function (r, kaputt) { zerbrocheneTafel(r, kaputt); },
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
  // Thema: Fliesen, Labortische mit Waschbecken, Pendel an der Wand
  var PHYSIKSAAL = {
    art: 'physik',
    fenster: [[3, 1]],
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
          'Bei y = a(x − xs)² + ys mit a < 0 liegt dieser Punkt bei S(xs|ys). Startet und landet der Wurf auf gleicher Höhe, liegt der Scheitel genau in der Mitte der Wurfweite.'
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
  // Thema: Hallenboden mit Spielfeld, Basketballkorb, Sprossenwand, Matten
  var TURNHALLE = {
    art: 'turnhalle',
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
  // Thema: Buehne mit rotem Vorhang, Stuhlreihen, Kronleuchter, Parkett
  var AULA = {
    art: 'aula',
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
      '#W.hhhh...hhhhW#',
      '#W.hhhh...hhhhW#',
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

  // Nach dem Finale: Raum einmal neu backen, damit er aufgeraeumt erscheint
  function frisch(R) {
    if (R.state && R.gebackenSauber !== sauber()) R.state = null;
  }

  KLASSENZIMMER.anim = function (r, t) {
    frisch(KLASSENZIMMER);
    fensterLicht(r, t, KLASSENZIMMER);
    if (!sauber()) kreidestaub(r, t);
  };
  PHYSIKSAAL.anim = function (r, t) {
    frisch(PHYSIKSAAL);
    fensterLicht(r, t, PHYSIKSAAL);
    pendel(r, t);
  };
  TURNHALLE.anim = function (r, t) { frisch(TURNHALLE); };

  // Aula: Bann des Grafen aus geraden Lichtlinien ueber dem Boden
  AULA.anim = function (r, t) {
    frisch(AULA);
    kronleuchter(r, t, !sauber());
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
