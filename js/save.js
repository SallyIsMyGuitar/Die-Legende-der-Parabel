// save.js: Spielstand im Local Storage des Geräts (kein Server, keine Übertragung)
// Gespeichert wird automatisch an Rastquellen, nach dem Boss und nach
// jedem Fortschritt (Gegner erlöst, Truhe, Merksatz). Beim Laden beginnt
// die Spielfigur immer an der zuletzt benutzten Rastquelle.
// Der Spielstand ist ein einfaches Objekt; später kann daraus der
// Spielstand-Code zum Kopieren erzeugt werden.
var Save = (function () {
  'use strict';

  var KEY = 'legende-der-parabel-v1';

  // Speichern; Fehler (z. B. privater Modus in Safari) werden still ignoriert
  function write(state) {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(state));
      return true;
    } catch (e) {
      return false;
    }
  }

  // Laden; liefert null, wenn kein (lesbarer) Spielstand da ist
  function read() {
    try {
      var raw = window.localStorage.getItem(KEY);
      if (!raw) return null;
      var state = JSON.parse(raw);
      return state && typeof state === 'object' ? state : null;
    } catch (e) {
      return null;
    }
  }

  function clear() {
    try { window.localStorage.removeItem(KEY); } catch (e) { /* egal */ }
  }

  // --- Spielstand-Code (Schritt 4, Feinschliff) ----------------------------
  // Kompakter Text ohne Pruefsumme zum Kopieren und Einfuegen. Er enthaelt
  // den Fortschritt inklusive Fehlerstatistik. Die Merkbuch-Eintraege bleiben
  // bewusst aus: Ihre Merksaetze lassen sich im Spiel wieder anhoeren, der
  // Code bleibt dadurch kurz. Ungueltige Codes lehnt parseCode still ab.
  function code(state) {
    var st = {};
    for (var k in state) if (state.hasOwnProperty(k) && k !== 'merk') st[k] = state[k];
    return 'LDP1-' + btoa(unescape(encodeURIComponent(JSON.stringify(st))));
  }

  function parseCode(text) {
    try {
      var t = String(text || '').replace(/\s+/g, '');
      if (t.indexOf('LDP1-') !== 0) return null;
      var json = decodeURIComponent(escape(atob(t.slice(5))));
      var st = JSON.parse(json);
      return st && typeof st === 'object' ? st : null;
    } catch (e) {
      return null;
    }
  }

  return { write: write, read: read, clear: clear, code: code, parseCode: parseCode };
})();
