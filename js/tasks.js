// tasks.js: Aufgabenvorlagen mit Zahlenbereichen, die nur "schöne" Lösungen erzeugen
// Jeder Aufgabentyp ist ein eigener Abschnitt und liefert:
//   frage        Fragetext (eindeutig nach einer Form)
//   felder       strukturierte Eingabefelder, z. B. [{ key: 'd', label: 'd' }]
//   loesung      erwartete Werte in der Reihenfolge der Felder
//   loesungstext kurze Lösung für die Testseite und den dritten Fehler
//   hinweis      Hinweis nach dem zweiten Fehler
var Tasks = (function () {
  'use strict';

  // --- Zufall mit fester Reihenfolge, damit die Testseite wiederholbar ist ---
  function rngFrom(seed) {
    var s = seed >>> 0;
    return function () {
      s = (s + 0x6D2B79F5) >>> 0;
      var t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function pick(rng, arr) {
    return arr[Math.floor(rng() * arr.length)];
  }

  function randInt(rng, min, max) {
    return min + Math.floor(rng() * (max - min + 1));
  }

  // --- Zahlen im deutschen Format (Komma, höchstens eine Nachkommastelle) ---
  function fmt(n) {
    if (Math.abs(n - Math.round(n)) < 1e-9) return String(Math.round(n));
    return (Math.round(n * 10) / 10).toFixed(1).replace('.', ',');
  }

  // Vorzeichen-Term, z. B. " - 3" oder " + 2"; bei 0 leer
  function signed(n) {
    if (Math.abs(n) < 1e-9) return '';
    return n > 0 ? ' + ' + fmt(n) : ' - ' + fmt(-n);
  }

  // --- y = a(x - xs)² + ys sauber formatiert ---
  function spfText(a, d, e) {
    var head;
    if (a === 1) head = '';
    else if (a === -1) head = '-';
    else head = fmt(a);
    var klammer = d === 0 ? 'x²' : '(x';
    if (d !== 0) {
      if (d > 0) klammer += ' - ' + fmt(d);
      else klammer += ' + ' + fmt(-d);
      klammer += ')²';
    }
    var rest = signed(e);
    if (!head && !rest && d === 0) return 'y = x²';
    if (!rest) rest = '';
    return 'y = ' + head + klammer + rest;
  }

  // --- y = ax² + bx + c sauber formatiert (Nullterme entfallen) ---
  function allgText(a, b, c) {
    var t = '';
    if (a === 1) t += 'x²';
    else if (a === -1) t += '-x²';
    else t += fmt(a) + 'x²';
    if (b !== 0) t += (b > 0 ? ' + ' : ' - ') + (Math.abs(b) === 1 ? '' : fmt(Math.abs(b))) + 'x';
    if (c !== 0) t += signed(c);
    return 'y = ' + t;
  }

  // --- Typ 1: Scheitel aus der Scheitelform ablesen ---
  // Schreibweise wie im Lehrbuch: y = a(x - xs)² + ys, Scheitel S(xs|ys)
  function scheitelAblesen(rng) {
    var a = pick(rng, [0.5, 1, 2, -0.5, -1, -2]);
    var xs = randInt(rng, -5, 5);
    var ys = randInt(rng, -5, 5);
    return {
      frage: 'Gib den Scheitelpunkt an: ' + spfText(a, xs, ys),
      felder: [{ key: 'xs', label: 'xs' }, { key: 'ys', label: 'ys' }],
      loesung: [xs, ys],
      loesungstext: 'S(' + fmt(xs) + '|' + fmt(ys) + ')',
      hinweis: 'Bei y = a(x - xs)² + ys liegt der Scheitel bei S(xs|ys).'
    };
  }

  // --- Typ 2: Scheitel aus der allgemeinen Form ---
  // Nur ganze Koeffizienten: b = -2axs und c = axs² + ys
  function scheitelAllgemein(rng) {
    var a = pick(rng, [1, 2, -1, -2]);
    var xs = randInt(rng, -4, 4);
    var ys = randInt(rng, -6, 6);
    var b = -2 * a * xs;
    var c = a * xs * xs + ys;
    return {
      frage: 'Gib den Scheitelpunkt an: ' + allgText(a, b, c),
      felder: [{ key: 'xs', label: 'xs' }, { key: 'ys', label: 'ys' }],
      loesung: [xs, ys],
      loesungstext: 'S(' + fmt(xs) + '|' + fmt(ys) + ')',
      hinweis: 'Forme in die Scheitelform um: y = a(x - xs)² + ys.'
    };
  }

  // --- Typ 3: Scheitelform aus Scheitelpunkt und einem Punkt ---
  // Der zweite Punkt liegt auf der Parabel, alle Werte sind "schön".
  // Werte bleiben im sichtbaren Bereich des Koordinatensystems (Graph-Modus).
  function spfAufstellen(rng) {
    var a, xs, ys, abstand, yp;
    do {
      a = pick(rng, [0.5, 1, 2, -0.5, -1, -2]);
      xs = randInt(rng, -2, 2);
      ys = randInt(rng, -2, 2);
      abstand = pick(rng, [-2, 2]);
      yp = a * abstand * abstand + ys;
    } while (Math.abs(yp) > 5);
    var xp = xs + abstand;
    return {
      frage: 'Die Parabel geht durch S(' + fmt(xs) + '|' + fmt(ys) + ') und P(' + fmt(xp) + '|' + fmt(yp) + '). Stelle sie mit a, xs und ys ein.',
      felder: [{ key: 'a', label: 'a' }, { key: 'xs', label: 'xs' }, { key: 'ys', label: 'ys' }],
      loesung: [a, xs, ys],
      graph: true,
      graphFix: { xp: xp, yp: yp },
      loesungstext: spfText(a, xs, ys),
      hinweis: 'Bei y = a(x - xs)² + ys ist xs die x-Koordinate des Scheitels.'
    };
  }

  // --- Typ 4: Streckfaktor a aus Scheitel und einem Punkt ---
  // Passt zum Tipp des Foersters (a streckt oder staucht die Parabel).
  // Zahleneingabe: a soll gerechnet werden, nicht am Bildschirm eingepasst.
  function aBestimmen(rng) {
    var a = pick(rng, [0.5, 1, 2, -0.5, -1, -2]);
    var xs = randInt(rng, -4, 4);
    var ys = randInt(rng, -5, 5);
    var abstand = pick(rng, [-3, -2, 2, 3]);
    var xp = xs + abstand;
    var yp = a * abstand * abstand + ys;
    return {
      frage: 'Die Parabel geht durch S(' + fmt(xs) + '|' + fmt(ys) + ') und P(' + fmt(xp) + '|' + fmt(yp) + '). Gib den Streckfaktor a an.',
      felder: [{ key: 'a', label: 'a' }],
      loesung: [a],
      loesungstext: 'a = ' + fmt(a),
      hinweis: 'Setze P in y = a(x \u2212 xs)\u00b2 + ys ein und löse nach a auf.'
    };
  }

  // --- Typ 5 (Wiese, leicht): Punkt auf der Normalparabel ---
  // Passt zum Tipp der Wanderin: P(x|y) liegt auf y = x², wenn y = x² gilt.
  // Mal ist y gesucht, mal das (positive oder negative) x.
  function normalPunkt(rng) {
    var x = randInt(rng, 1, 6) * pick(rng, [1, -1]);
    var y = x * x;
    if (rng() < 0.5) {
      return {
        frage: 'Der Punkt P(' + fmt(x) + '|y) liegt auf der Normalparabel y = x². Gib y an.',
        felder: [{ key: 'y', label: 'y' }],
        loesung: [y],
        loesungstext: 'y = (' + fmt(x) + ')² = ' + fmt(y),
        hinweis: 'Setze x in y = x² ein. Achtung: (−3)² = 9.'
      };
    }
    var vz = x > 0 ? 'positiv' : 'negativ';
    return {
      frage: 'Der Punkt P(x|' + fmt(y) + ') liegt auf der Normalparabel y = x². x ist ' + vz + '. Gib x an.',
      felder: [{ key: 'x', label: 'x' }],
      loesung: [x],
      loesungstext: 'x = ' + fmt(x) + ', denn (' + fmt(x) + ')² = ' + fmt(y),
      hinweis: 'Welche Zahl ergibt quadriert ' + fmt(y) + '? Beachte das Vorzeichen.'
    };
  }

  // --- Typ 6 (Wald, leicht bis mittel): a aus der Beschreibung ---
  // Passt zum Tipp des Foersters: gestreckt/gestaucht und Oeffnung.
  function aBeschreibung(rng) {
    var betrag = pick(rng, [0.5, 2, 3, 0.5, 1.5, 4]);
    var a = betrag * pick(rng, [1, -1]);
    var form = betrag > 1 ? 'mit dem Faktor ' + fmt(betrag) + ' gestreckt'
      : 'mit dem Faktor ' + fmt(betrag) + ' gestaucht';
    var oeffnung = a > 0 ? 'nach oben' : 'nach unten';
    return {
      frage: 'Die Parabel y = ax² ist ' + form + ' und ' + oeffnung + ' geöffnet. Gib a an.',
      felder: [{ key: 'a', label: 'a' }],
      loesung: [a],
      loesungstext: 'a = ' + fmt(a) + ', also ' + spfText(a, 0, 0),
      hinweis: '|a| ist der Faktor. Nach unten geöffnet heißt: a ist negativ.'
    };
  }

  // --- Typ 7 (Truhe, plus): verschobene Parabel in Scheitelform ---
  // Passt zum Tipp des Einsiedlers: Verschiebung ergibt S(xs|ys).
  function verschiebung(rng) {
    var a = pick(rng, [0.5, 2, -1, -2, 3, -0.5]);
    var xs, ys;
    do {
      xs = randInt(rng, -4, 4);
      ys = randInt(rng, -4, 4);
    } while (xs === 0 || ys === 0);
    var rl = xs > 0 ? 'um ' + xs + ' nach rechts' : 'um ' + (-xs) + ' nach links';
    var ou = ys > 0 ? 'um ' + ys + ' nach oben' : 'um ' + (-ys) + ' nach unten';
    return {
      frage: 'Die Parabel ' + spfText(a, 0, 0) + ' wird ' + rl + ' und ' + ou + ' verschoben. Gib die Scheitelform an.',
      felder: [{ key: 'a', label: 'a' }, { key: 'xs', label: 'xs' }, { key: 'ys', label: 'ys' }],
      loesung: [a, xs, ys],
      loesungstext: spfText(a, xs, ys),
      hinweis: 'Verschieben ändert a nicht. Rechts: xs > 0, unten: ys < 0.'
    };
  }

  // --- Typ 8 (Felder, leicht): Scheitelform aus Streckfaktor und Scheitel ---
  // Passt zum Tipp der Gaertnerin: aus S(xs|ys) und a die Klammer bzw.
  // die Verschiebung richtig lesen (Vorzeichen!).
  function spfAusS(rng) {
    var a = pick(rng, [0.5, 1, 2, -0.5, -1, -2]);
    var xs, ys;
    do {
      xs = randInt(rng, -5, 5);
      ys = randInt(rng, -5, 5);
    } while (xs === 0 && ys === 0);
    return {
      frage: 'Die Parabel y = a(x \u2212 xs)\u00b2 + ys hat den Streckfaktor a = ' + fmt(a) +
        ' und den Scheitel S(' + fmt(xs) + '|' + fmt(ys) + '). Gib xs und ys der Scheitelform an.',
      felder: [{ key: 'xs', label: 'xs' }, { key: 'ys', label: 'ys' }],
      loesung: [xs, ys],
      loesungstext: spfText(a, xs, ys) + ', also xs = ' + fmt(xs) + ' und ys = ' + fmt(ys),
      hinweis: 'Bei S(xs|ys) steht in der Klammer (x \u2212 xs). Achtung Vorzeichen: S(\u22122|3) hei\u00dft (x + 2)\u00b2 + 3.'
    };
  }

  // --- Typ 9 (Klippen, mittel): Scheitelform aus Scheitel und Punkt ---
  // Rechnen statt Einstellen: a aus S und P bestimmen, dann die Form angeben.
  function spfAusSP(rng) {
    var a = pick(rng, [0.5, 1, 2, -0.5, -1, -2]);
    var xs = randInt(rng, -4, 4);
    var ys = randInt(rng, -4, 4);
    var abstand = pick(rng, [-3, -2, 2, 3]);
    var xp = xs + abstand;
    var yp = a * abstand * abstand + ys;
    return {
      frage: 'Die Parabel geht durch S(' + fmt(xs) + '|' + fmt(ys) + ') und P(' + fmt(xp) + '|' + fmt(yp) +
        '). Stelle die Scheitelform auf: Gib a, xs und ys an.',
      felder: [{ key: 'a', label: 'a' }, { key: 'xs', label: 'xs' }, { key: 'ys', label: 'ys' }],
      loesung: [a, xs, ys],
      loesungstext: 'a = ' + fmt(a) + ', also ' + spfText(a, xs, ys),
      hinweis: 'Setze P in y = a(x \u2212 xs)\u00b2 + ys ein und l\u00f6se nach a auf.'
    };
  }

  // --- Typ 10 (Kueste, schwer): Wertemenge am Scheitel ablesen ---
  // Passt zum Tipp des Turmwaerters: Der Scheitel ist der tiefste bzw.
  // hoechste Punkt, sein y-Wert grenzt die Wertemenge ein.
  function wertemenge(rng) {
    var a = pick(rng, [0.5, 1, 2, -0.5, -1, -2]);
    var xs = randInt(rng, -4, 4);
    var ys = randInt(rng, -4, 4);
    var auf = a > 0;
    var grenze = auf ? 'kleinste' : 'gr\u00f6\u00dfte';
    return {
      frage: 'Die Parabel ' + spfText(a, xs, ys) + ' ist nach ' + (auf ? 'oben' : 'unten') +
        ' ge\u00f6ffnet. Gib die ' + grenze + ' y-Koordinate der Wertemenge an und dazu die zugeh\u00f6rige x-Koordinate.',
      felder: [{ key: 'y', label: 'y' }, { key: 'x', label: 'x' }],
      loesung: [ys, xs],
      loesungstext: 'Der Scheitel S(' + fmt(xs) + '|' + fmt(ys) + ') gibt die ' +
        (auf ? 'kleinste' : 'gr\u00f6\u00dfte') + ' y-Koordinate: ' + fmt(ys) + ' bei x = ' + fmt(xs) + '.',
      hinweis: 'Der y-Wert des Scheitels grenzt die Wertemenge ein: Bei a > 0 gibt es nichts darunter, bei a < 0 nichts dar\u00fcber.'
    };
  }

  // --- Typ 11 (Turm, Auswahl): Wertemenge als Auswahl -------------------
  // Passt zur Alten Turmuhr: Der Scheitel grenzt die Wertemenge ein.
  // Auswahl A bis D statt Eingabe, damit die Mengenschreibweise ohne
  // Tippfehler geprueft wird. Richtige Loesung:
  //   a > 0 (nach oben geoeffnet) -> W = {y | y >= ys}
  //   a < 0 (nach unten geoeffnet) -> W = {y | y <= ys}
  function shuffle(rng, arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(rng() * (i + 1));
      var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  function wertemengeAuswahl(rng) {
    var a = pick(rng, [0.5, 1, 2, -0.5, -1, -2]);
    var xs = randInt(rng, -4, 4);
    var ys = randInt(rng, -3, 3);
    var auf = a > 0;
    var richtig = auf
      ? 'W = {y | y \u2265 ' + fmt(ys) + '}'
      : 'W = {y | y \u2264 ' + fmt(ys) + '}';
    // typische Fehler: Oeffnung verkehrt, Grenze daneben, Begrenzung vergessen
    var verkehrt = auf
      ? 'W = {y | y \u2264 ' + fmt(ys) + '}'
      : 'W = {y | y \u2265 ' + fmt(ys) + '}';
    var daneben = auf
      ? 'W = {y | y \u2265 ' + fmt(ys + 1) + '}'
      : 'W = {y | y \u2264 ' + fmt(ys - 1) + '}';
    var optionen = shuffle(rng, [
      { t: richtig, ok: true },
      { t: verkehrt, ok: false },
      { t: daneben, ok: false },
      { t: 'W = \u211d', ok: false }
    ]);
    var loesungIdx = 0;
    for (var i = 0; i < optionen.length; i++) if (optionen[i].ok) loesungIdx = i;
    return {
      frage: 'Wie lautet die Wertemenge der Parabel ' + spfText(a, xs, ys) + '?',
      auswahl: optionen.map(function (o) { return o.t; }),
      felder: [],
      loesung: loesungIdx,
      loesungstext: richtig,
      hinweis: auf
        ? 'Nach oben ge\u00f6ffnet: Der Scheitel gibt den kleinsten y-Wert vor, also y \u2265 ys.'
        : 'Nach unten ge\u00f6ffnet: Der Scheitel gibt den gr\u00f6\u00dften y-Wert vor, also y \u2264 ys.'
    };
  }

  // --- Typ 12 (Wasserreich): Umformen in die Scheitelform -----------------
  // Passt zum Merksatz des Netzwebers: Vorgegeben ist die allgemeine Form
  // y = ax² + bx + c, gesucht sind a, xs und ys der Scheitelform.
  // Nur "sch\u00f6ne" Werte: ganze Zahlen oder genau eine Nachkommastelle
  // (bei a = ±0,5 bleibt xs gerade, damit alle Koeffizienten einfach sind).
  function umformen(rng) {
    var a = pick(rng, [0.5, 1, 2, -0.5, -1, -2]);
    var xs = randInt(rng, -4, 4);
    while (Math.abs(a) === 0.5 && xs % 2 !== 0) xs = randInt(rng, -4, 4);
    var ys = randInt(rng, -4, 4);
    var b = -2 * a * xs;
    var c = a * xs * xs + ys;
    return {
      frage: 'Forme in die Scheitelform um. Gib a, xs und ys an: ' + allgText(a, b, c),
      felder: [{ key: 'a', label: 'a' }, { key: 'xs', label: 'xs' }, { key: 'ys', label: 'ys' }],
      loesung: [a, xs, ys],
      loesungstext: spfText(a, xs, ys) + ' mit S(' + fmt(xs) + '|' + fmt(ys) + ')',
      hinweis: 'Es gilt xs = −b : (2a) und ys = c − a · xs².'
    };
  }

  // --- Liste aller Aufgabentypen (sp\u00e4ter kommen weitere Abschnitte dazu) ---
  // Reihenfolge wie im Spiel: Wiese, Wald, Ruine, Hoehle (Halle, Mitte),
  // Truhe, Felder, Klippen, Kueste (Weg zum zweiten Dungeon)
  var TYPES = [
    { id: 'normalPunkt', name: 'Punkt auf der Normalparabel', make: normalPunkt },
    { id: 'aBeschreibung', name: 'a aus der Beschreibung', make: aBeschreibung },
    { id: 'scheitelAblesen', name: 'Scheitel ablesen (Scheitelform)', make: scheitelAblesen },
    { id: 'scheitelAllgemein', name: 'Scheitel (allg. Form)', make: scheitelAllgemein },
    { id: 'aBestimmen', name: 'Streckfaktor a bestimmen', make: aBestimmen },
    { id: 'spfAufstellen', name: 'Scheitelform aufstellen', make: spfAufstellen },
    { id: 'verschiebung', name: 'Verschiebung (Truhe)', make: verschiebung },
    { id: 'spfAusS', name: 'Scheitelform aus S und a', make: spfAusS },
    { id: 'spfAusSP', name: 'Scheitelform aus S und P', make: spfAusSP },
    { id: 'wertemenge', name: 'Wertemenge am Scheitel', make: wertemenge },
    { id: 'wertemengeAuswahl', name: 'Wertemenge (Auswahl)', make: wertemengeAuswahl },
    { id: 'umformen', name: 'Umformen (Scheitelform)', make: umformen }
  ];

  // Eine Aufgabe erzeugen; gleicher Typ + gleicher Samen = gleiche Aufgabe.
  // kontext (optional) stellt den Bezug zur Umgebung her, z. B. zum Tipp
  // eines Erklaer-NPCs, und wird dem Fragetext vorangestellt.
  function make(typeId, seed, kontext) {
    var type = null;
    for (var i = 0; i < TYPES.length; i++) {
      if (TYPES[i].id === typeId) type = TYPES[i];
    }
    var task = type.make(rngFrom(seed * 2654435761 + 1));
    if (kontext) task.frage = kontext + ' ' + task.frage;
    return task;
  }

  // --- Boss der Hoehle der Parabeln: feste, von der Lehrkraft gepruefte Aufgaben
  // Thema des Dungeons: Normalparabel und Parameter.
  // Sie verbinden alles, was auf dem Weg geuebt wurde (freigegeben).
  var BOSS_HOEHLE = [
    {
      frage: 'Gib den Scheitelpunkt der Parabel y = −0,5(x + 2)² + 3 an.',
      felder: [{ key: 'xs', label: 'xs' }, { key: 'ys', label: 'ys' }],
      loesung: [-2, 3],
      loesungstext: 'S(−2|3)',
      hinweis: 'Bei (x + 2) ist xs = −2.'
    },
    {
      frage: 'Die Parabel hat den Scheitel S(1|−4) und geht durch P(3|4). Gib den Streckfaktor a an.',
      felder: [{ key: 'a', label: 'a' }],
      loesung: [2],
      loesungstext: '4 = a(3 − 1)² − 4, also 8 = 4a, a = 2',
      hinweis: 'Setze P ein: 4 = a(3 − 1)² − 4.'
    },
    {
      frage: 'Stelle die Parabel mit S(−1|3) ein, die durch P(1|1) geht.',
      felder: [{ key: 'a', label: 'a' }, { key: 'xs', label: 'xs' }, { key: 'ys', label: 'ys' }],
      loesung: [-0.5, -1, 3],
      loesungstext: 'y = −0,5(x + 1)² + 3',
      hinweis: 'Setze P ein: 1 = a(1 + 1)² + 3, also a = −0,5.',
      graph: true,
      graphFix: { xp: 1, yp: 1 }
    }
  ];

  // --- Boss des Leuchtturms: feste, von der Lehrkraft gepruefte Aufgaben ---
  // Thema des Dungeons: Scheitelform. Sie verbinden alles, was auf dem Weg
  // und im Turm geuebt wurde (Scheitel ablesen, a bestimmen, aufstellen).
  var BOSS_TURM = [
    {
      frage: 'Gib den Scheitelpunkt der Parabel y = 1,5(x − 2)² − 3 an.',
      felder: [{ key: 'xs', label: 'xs' }, { key: 'ys', label: 'ys' }],
      loesung: [2, -3],
      loesungstext: 'S(2|−3)',
      hinweis: 'Bei (x − 2) ist xs = 2.'
    },
    {
      frage: 'Die Parabel hat den Scheitel S(1|2) und geht durch P(3|10). Gib den Streckfaktor a an.',
      felder: [{ key: 'a', label: 'a' }],
      loesung: [2],
      loesungstext: '10 = a(3 − 1)² + 2, also 8 = 4a, a = 2',
      hinweis: 'Setze P ein: 10 = a(3 − 1)² + 2.'
    },
    {
      frage: 'Stelle die Parabel mit S(−1|4) ein, die durch P(1|0) geht.',
      felder: [{ key: 'a', label: 'a' }, { key: 'xs', label: 'xs' }, { key: 'ys', label: 'ys' }],
      loesung: [-1, -1, 4],
      loesungstext: 'y = −(x + 1)² + 4',
      hinweis: 'Setze P ein: 0 = a(1 + 1)² + 4, also a = −1.',
      graph: true,
      graphFix: { xp: 1, yp: 0 }
    }
  ];

  // Feste Boss-Aufgaben je Dungeon (Schluessel = Boss-Raum)
  var BOSS_FEST = { dboss: BOSS_HOEHLE, lboss: BOSS_TURM };

  function bossTasks(room) {
    return (BOSS_FEST[room] || []).slice();
  }

  return { TYPES: TYPES, make: make, fmt: fmt, spfText: spfText, bossTasks: bossTasks };
})();
