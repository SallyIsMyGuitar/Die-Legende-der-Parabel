// dietl.js: Versteck von Herrn Dietl im dichten Wald östlich der Ruine
// Durch die Lücke in der Baumreihe am rechten Rand der Ruine (Zeile 5)
// kommt man auf diesen Bildschirm. Herr Dietl stellt Fragen zur Spielwelt
// (Auswahl A bis C). Jede richtige Antwort bringt zufällig ein Herz oder
// ein Schwert, höchstens MAX_BELOHNUNGEN Mal. Falsche Antworten kosten nichts.
// Angemeldet per World.addScreen(); der Ablauf (Dialog, Frage, Belohnung)
// liegt in main.js (talkDietl).
var Dietl = (function () {
  'use strict';

  var TILE = 16;
  var MAX_BELOHNUNGEN = 4;

  // --- Bildschirm: dichter Wald mit kleiner Lichtung ------------------------
  World.addScreen('dietl', {
    map: [
      'TTTTTTTTTTTTTTTT',
      'TTTTTTTTTTTTTTTT',
      'TTTTTTTTTTTTTTTT',
      'TTTTTTT...TTTTTT',
      'TTTTT.......TTTT',
      '............TTTT',
      'TTTT........TTTT',
      'TTTTT......TTTTT',
      'TTTTTTT..TTTTTTT',
      'TTTTTTTTTTTTTTTT',
      'TTTTTTTTTTTTTTTT',
      'TTTTTTTTTTTTTTTT',
      'TTTTTTTTTTTTTTTT',
      'TTTTTTTTTTTTTTTT'
    ],
    buildings: [],
    signs: [],
    npcs: [
      {
        x: 9 * TILE, y: 4 * TILE, sprites: function () { return People.dietl(); },
        talk: { name: 'Herr Dietl', texts: [], action: 'dietl' }
      }
    ],
    exits: { west: 'ruine' }
  });

  // --- Fragen zur Spielwelt -------------------------------------------------
  // Nur Wissen, das man bis zur Ruine schon haben kann (Dorf, Wiese, Wald,
  // Ruine). a = Antworten, die erste ist richtig (Reihenfolge wird gemischt).
  // Texte vorläufig, der Nutzer passt sie an.
  var FRAGEN = [
    { f: 'Was ist mit der Schule im Dorf passiert?',
      a: ['Sie wurde zerstört.', 'Sie hat Ferien.', 'Sie wurde verkauft.'],
      h: 'Mama hat es dir gleich am Anfang erzählt.' },
    { f: 'Wo werden die Lehrerinnen und Lehrer laut Mama gefangen gehalten?',
      a: ['In der zerstörten Schule', 'Im Leuchtturm', 'Im Laden'],
      h: 'Frag Mama im Elternhaus.' },
    { f: 'Womit zog der Graf durch den Wald des Försters?',
      a: ['Mit einem Heer aus Linealen', 'Mit einer Herde Drachen', 'Mit einem Heer aus Zirkeln'],
      h: 'Der Förster hat es dir erzählt.' },
    { f: 'Wo füllst du im Dorf deine Herzen wieder auf?',
      a: ['Am Brunnen auf dem Dorfplatz', 'Im Schreibwarenladen', 'Am Schultor'],
      h: 'Die Nachbarin hat es dir verraten.' },
    { f: 'Wo landen die Merksätze, die du unterwegs hörst?',
      a: ['Im Merkbuch', 'In der Truhe', 'Auf dem Schild'],
      h: 'Taste M oder das Buch-Symbol oben rechts.' },
    { f: 'Wie viele Herzen hast du höchstens?',
      a: [String(Config.HEARTS_MAX), String(Config.HEARTS_MAX - 1), String(Config.HEARTS_MAX + 1)],
      h: 'Zähle die Herzen oben links.' },
    { f: 'Was passiert, wenn du alle Herzen verlierst?',
      a: ['Ich wache an der Quelle auf.', 'Das Spiel ist vorbei.', 'Alle Merksätze sind weg.'],
      h: 'Die Nachbarin hat es dir erklärt.' },
    { f: 'Was rät dir Herr Späth für deine Nebenrechnungen?',
      a: ['Stift und Zettel', 'Einen Taschenrechner', 'Nichts aufschreiben'],
      h: 'Er hat dich am Ostausgang des Dorfes angehalten.' },
    { f: 'Was verkauft der Laden auf dem Dorfplatz?',
      a: ['Hefte, Stifte, Bücher', 'Brot und Käse', 'Schwerter'],
      h: 'Frag den Verkäufer.' },
    { f: 'Wie oft kannst du ein Schwert einsetzen, bevor es zerbricht?',
      a: ['Einmal', 'Zweimal', 'Dreimal'],
      h: 'Das Schwert ist ein Joker für einen Einsatz.' }
  ];

  var letzte = -1;   // zuletzt gestellte Frage (nicht zweimal hintereinander)

  // Neue Frage als feste Aufgabe für TaskUi.openFixed (Auswahl-Modus)
  function frage() {
    var i;
    do { i = Math.floor(Math.random() * FRAGEN.length); } while (i === letzte && FRAGEN.length > 1);
    letzte = i;
    var q = FRAGEN[i];
    // Antworten mischen, die richtige merken
    var opts = q.a.map(function (t, k) { return { t: t, ok: k === 0 }; });
    for (var j = opts.length - 1; j > 0; j--) {
      var r = Math.floor(Math.random() * (j + 1));
      var tmp = opts[j]; opts[j] = opts[r]; opts[r] = tmp;
    }
    var loes = 0;
    for (var o = 0; o < opts.length; o++) if (opts[o].ok) loes = o;
    return {
      frage: 'Herr Dietl fragt: ' + q.f,
      auswahl: opts.map(function (x) { return x.t; }),
      felder: [],
      loesung: loes,
      loesungstext: q.a[0],
      hinweis: q.h
    };
  }

  // --- Texte (vorläufig, der Nutzer passt sie an) ---------------------------
  var TEXTE = {
    erstes: [
      'Pssst! Ich bin Herr Dietl. Hier im dichten Wald findet mich der Graf nicht.',
      'Wer gut aufpasst, wird belohnt: Beantworte mir eine Frage zur Spielwelt, dann bekommst du ein Herz oder ein Schwert.'
    ],
    wieder: function (rest) {
      return ['Na, wieder da? Eine richtige Antwort, eine Belohnung. Ich habe noch ' +
        rest + (rest === 1 ? ' Belohnung' : ' Belohnungen') + ' für dich.'];
    },
    finale: 'Der Graf ist besiegt? Großartig! Dann traue ich mich bald wieder aus dem Wald.',
    alle: ['Du hast mir schon viermal richtig geantwortet. Mehr Belohnungen habe ich leider nicht. Viel Glück!'],
    voll: ['Du hast volle Herzen und trägst schon ein Schwert. Komm wieder, wenn du etwas brauchst!'],
    falsch: ['Leider nicht richtig. Komm einfach noch einmal zu mir, dann stelle ich dir eine neue Frage.'],
    herz: ['Richtig! Hier hast du ein Herz.'],
    schwert: [
      'Richtig! Nimm dieses Schwert.',
      'Es überspringt einmal eine Aufgabe und zerbricht danach. Bei Wächtern hilft es nicht.'
    ]
  };

  return { frage: frage, TEXTE: TEXTE, MAX: MAX_BELOHNUNGEN };
})();
