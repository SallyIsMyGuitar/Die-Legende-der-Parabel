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

  // --- y = a(x - d)² + e sauber formatiert ---
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

  // --- Typ 1: Scheitelpunkt aus der Scheitelpunktsform ablesen ---
  function scheitelAblesen(rng) {
    var a = pick(rng, [0.5, 1, 2, -0.5, -1, -2]);
    var d = randInt(rng, -5, 5);
    var e = randInt(rng, -5, 5);
    return {
      frage: 'Gib den Scheitelpunkt an: ' + spfText(a, d, e),
      felder: [{ key: 'd', label: 'd' }, { key: 'e', label: 'e' }],
      loesung: [d, e],
      loesungstext: 'S(' + fmt(d) + '|' + fmt(e) + ')',
      hinweis: 'Bei y = a(x - d)² + e liegt der Scheitel bei S(d|e).'
    };
  }

  // --- Typ 2: Scheitelpunkt aus der allgemeinen Form ---
  // Nur ganze Koeffizienten: b = -2ad und c = ad² + e
  function scheitelAllgemein(rng) {
    var a = pick(rng, [1, 2, -1, -2]);
    var d = randInt(rng, -4, 4);
    var e = randInt(rng, -6, 6);
    var b = -2 * a * d;
    var c = a * d * d + e;
    return {
      frage: 'Gib den Scheitelpunkt an: ' + allgText(a, b, c),
      felder: [{ key: 'd', label: 'd' }, { key: 'e', label: 'e' }],
      loesung: [d, e],
      loesungstext: 'S(' + fmt(d) + '|' + fmt(e) + ')',
      hinweis: 'Forme in die Scheitelpunktsform um: y = a(x - d)² + e.'
    };
  }

  // --- Typ 3: Scheitelpunktsform aus Scheitelpunkt und einem Punkt ---
  // Der zweite Punkt liegt auf der Parabel, alle Werte sind "schön"
  function spfAufstellen(rng) {
    var a = pick(rng, [0.5, 1, 2, -0.5, -1, -2]);
    var d = randInt(rng, -4, 4);
    var e = randInt(rng, -5, 5);
    var abstand = pick(rng, [-3, -2, 2, 3]);
    var xp = d + abstand;
    var yp = a * abstand * abstand + e;
    return {
      frage: 'Die Parabel geht durch S(' + fmt(d) + '|' + fmt(e) + ') und P(' + fmt(xp) + '|' + fmt(yp) + '). Gib a, d und e an.',
      felder: [{ key: 'a', label: 'a' }, { key: 'd', label: 'd' }, { key: 'e', label: 'e' }],
      loesung: [a, d, e],
      loesungstext: spfText(a, d, e),
      hinweis: 'Bei y = a(x - d)² + e ist d die x-Koordinate des Scheitels.'
    };
  }

  // --- Liste aller Aufgabentypen (später kommen weitere Abschnitte dazu) ---
  var TYPES = [
    { id: 'scheitelAblesen', name: 'Scheitel ablesen (SPF)', make: scheitelAblesen },
    { id: 'scheitelAllgemein', name: 'Scheitel (allg. Form)', make: scheitelAllgemein },
    { id: 'spfAufstellen', name: 'SPF aufstellen', make: spfAufstellen }
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
