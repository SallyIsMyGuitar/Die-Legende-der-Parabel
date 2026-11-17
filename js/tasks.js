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
  // Der zweite Punkt liegt auf der Parabel, alle Werte sind "schön"
  function spfAufstellen(rng) {
    var a = pick(rng, [0.5, 1, 2, -0.5, -1, -2]);
    var xs = randInt(rng, -4, 4);
    var ys = randInt(rng, -5, 5);
    var abstand = pick(rng, [-3, -2, 2, 3]);
    var xp = xs + abstand;
    var yp = a * abstand * abstand + ys;
    return {
      frage: 'Die Parabel geht durch S(' + fmt(xs) + '|' + fmt(ys) + ') und P(' + fmt(xp) + '|' + fmt(yp) + '). Gib a, xs und ys an.',
      felder: [{ key: 'a', label: 'a' }, { key: 'xs', label: 'xs' }, { key: 'ys', label: 'ys' }],
      loesung: [a, xs, ys],
      loesungstext: spfText(a, xs, ys),
      hinweis: 'Bei y = a(x - xs)² + ys ist xs die x-Koordinate des Scheitels.'
    };
  }

  // --- Liste aller Aufgabentypen (später kommen weitere Abschnitte dazu) ---
  var TYPES = [
    { id: 'scheitelAblesen', name: 'Scheitel ablesen (Scheitelform)', make: scheitelAblesen },
    { id: 'scheitelAllgemein', name: 'Scheitel (allg. Form)', make: scheitelAllgemein },
    { id: 'spfAufstellen', name: 'Scheitelform aufstellen', make: spfAufstellen }
  ];

  // Eine Aufgabe erzeugen; gleicher Typ + gleicher Samen = gleiche Aufgabe
  function make(typeId, seed) {
    var type = null;
    for (var i = 0; i < TYPES.length; i++) {
      if (TYPES[i].id === typeId) type = TYPES[i];
    }
    return type.make(rngFrom(seed * 2654435761 + 1));
  }

  return { TYPES: TYPES, make: make, fmt: fmt };
})();
