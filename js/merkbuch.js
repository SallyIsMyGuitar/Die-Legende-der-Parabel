// merkbuch.js: Merksaetze der Erklaer-NPCs sammeln
// Alles Gehoerte landet automatisch hier (je Eintrag genau einmal).
// Die Buch-Ansicht zum Blaettern kommt in einem eigenen Schritt.
var Merkbuch = (function () {
  'use strict';

  var entries = [];   // { id, name, text }, Reihenfolge des Hoerens

  // Eintrag aufnehmen, falls die Kennung noch nicht bekannt ist
  function add(merk) {
    for (var i = 0; i < entries.length; i++) {
      if (entries[i].id === merk.id) return false;
    }
    entries.push({ id: merk.id, name: merk.name, text: merk.text });
    return true;
  }

  return {
    add: add,
    all: function () { return entries.slice(); },
    count: function () { return entries.length; }
  };
})();
