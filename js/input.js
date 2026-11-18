// input.js: Tastatur und Touch-Steuerung mit Multitouch
var Input = (function () {
  'use strict';

  var held = { up: false, down: false, left: false, right: false };
  var litButtons = {}; // visuelles Aufleuchten der Aktionstasten
  var pressedOnce = {}; // einmalige Tastendrücke, werden von pressed() verbraucht

  var keyMap = {
    ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
    KeyW: 'up', KeyS: 'down', KeyA: 'left', KeyD: 'right'
  };

  function onKeyDown(e) {
    var dir = keyMap[e.code];
    if (dir) {
      held[dir] = true;
      e.preventDefault();
      return;
    }
    // A = Enter oder Leertaste, B = Esc oder Rücktaste
    if (e.code === 'Enter' || e.code === 'NumpadEnter' || e.code === 'Space') {
      e.preventDefault();
      if (!e.repeat) lightButton('a');
    } else if (e.code === 'Escape') {
      e.preventDefault();
      if (!e.repeat) lightButton('b');
    } else if (e.code === 'Backspace') {
      e.preventDefault();
      // Rücktaste = B; zusätzlich 'del', damit die Aufgabenbox eine Ziffer löschen kann
      if (!e.repeat) { lightButton('b'); pressedOnce.del = true; }
    } else if (e.code === 'KeyE') {
      // Schwert (Joker) in einer Aufgabe einsetzen
      if (!e.repeat) pressedOnce.sword = true;
    } else if (e.code === 'KeyM') {
      // Merkbuch jederzeit oeffnen und schliessen
      if (!e.repeat) pressedOnce.book = true;
    }
  }

  function onKeyUp(e) {
    var dir = keyMap[e.code];
    if (dir) {
      held[dir] = false;
      e.preventDefault();
    }
  }

  // Touch: gedrückte Punkte verfolgen, damit Multitouch (Steuerkreuz + Aktionstaste) geht
  var activeTouches = {};

  // Richtung(en) aus der Daumenposition im Steuerkreuz: in den Ecken
  // zwei Richtungen gleichzeitig (schräg laufen), in der Mitte keine
  function dirFromPoint(x, y, el) {
    var rect = el.getBoundingClientRect();
    var lx = (x - rect.left) / rect.width - 0.5;
    var ly = (y - rect.top) / rect.height - 0.5;
    var dirs = [];
    if (Math.abs(lx) < 0.1 && Math.abs(ly) < 0.1) return dirs;   // tote Mitte
    // Winkel in Achtel teilen: gerade Richtungen bekommen je 45°, Diagonalen 45°
    var ang = Math.atan2(ly, lx) * 180 / Math.PI;   // 0 = rechts, 90 = unten
    if (ang > -67.5 && ang < 67.5) dirs.push('right');
    if (ang > 112.5 || ang < -112.5) dirs.push('left');
    if (ang > 22.5 && ang < 157.5) dirs.push('down');
    if (ang < -22.5 && ang > -157.5) dirs.push('up');
    return dirs;
  }

  function refreshDirs() {
    held.up = false; held.down = false; held.left = false; held.right = false;
    for (var id in activeTouches) {
      var t = activeTouches[id];
      if (t.dir) t.dir.forEach(function (d) { held[d] = true; });
    }
  }

  function onTouchStart(e) {
    e.preventDefault();
    var dpad = document.getElementById('dpad');
    var dpadRect = dpad.getBoundingClientRect();
    for (var i = 0; i < e.changedTouches.length; i++) {
      var touch = e.changedTouches[i];
      if (dpadRect.left <= touch.clientX &&
          touch.clientX <= dpadRect.right &&
          dpadRect.top <= touch.clientY &&
          touch.clientY <= dpadRect.bottom) {
        activeTouches[touch.identifier] = {
          type: 'dir',
          dir: dirFromPoint(touch.clientX, touch.clientY, dpad)
        };
      } else {
        var btn = targetButton(touch);
        activeTouches[touch.identifier] = { type: 'btn', btn: btn };
        if (btn) lightButton(btn);
      }
    }
    refreshDirs();
    updateDpadVisuals();
  }

  function targetButton(touch) {
    var el = document.elementFromPoint(touch.clientX, touch.clientY);
    while (el && el !== document.body) {
      if (el.dataset && el.dataset.btn) return el.dataset.btn;
      el = el.parentElement;
    }
    return null;
  }

  function onTouchMove(e) {
    e.preventDefault();
    var dpad = document.getElementById('dpad');
    var dpadRect = dpad.getBoundingClientRect();
    for (var i = 0; i < e.changedTouches.length; i++) {
      var touch = e.changedTouches[i];
      var t = activeTouches[touch.identifier];
      if (!t) continue;
      if (t.type === 'dir') {
        if (dpadRect.left <= touch.clientX &&
            touch.clientX <= dpadRect.right &&
            dpadRect.top <= touch.clientY &&
            touch.clientY <= dpadRect.bottom) {
          t.dir = dirFromPoint(touch.clientX, touch.clientY, dpad);
        } else {
          t.dir = [];
        }
      }
    }
    refreshDirs();
    updateDpadVisuals();
  }

  function onTouchEnd(e) {
    e.preventDefault();
    for (var i = 0; i < e.changedTouches.length; i++) {
      delete activeTouches[e.changedTouches[i].identifier];
    }
    refreshDirs();
    updateDpadVisuals();
  }

  // Steuerkreuz-Tasten visuell hervorheben, solange sie gedrückt sind
  function updateDpadVisuals() {
    var btns = document.querySelectorAll('.dpad-btn');
    for (var i = 0; i < btns.length; i++) {
      var dir = btns[i].dataset.dir;
      btns[i].classList.toggle('lit', !!held[dir]);
    }
  }

  // Aktionstaste kurz aufleuchten lassen (in diesem Meilenstein nur Rückmeldung)
  function lightButton(name) {
    litButtons[name] = true;
    pressedOnce[name] = true;
    var el = document.querySelector('[data-btn="' + name + '"]');
    if (el) {
      el.classList.add('lit');
      setTimeout(function () { el.classList.remove('lit'); }, 150);
    }
  }

  function init() {
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    // Touch-Steuerung nur auf Touch-Geräten anzeigen
    var isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouch) {
      document.body.classList.add('touch');
      var controls = document.getElementById('touch-controls');
      controls.hidden = false;
      controls.addEventListener('touchstart', onTouchStart, { passive: false });
      controls.addEventListener('touchmove', onTouchMove, { passive: false });
      controls.addEventListener('touchend', onTouchEnd, { passive: false });
      controls.addEventListener('touchcancel', onTouchEnd, { passive: false });
    }
  }

  // Steuerkreuz aus- bzw. einblenden (z. B. während Aufgaben und Dialogen).
  // Beim Ausblenden werden gehaltene Richtungen losgelassen.
  var dpadOff = false;
  function setDpadVisible(on) {
    if (dpadOff === !on) return;
    dpadOff = !on;
    document.body.classList.toggle('dpad-off', dpadOff);
    if (dpadOff) {
      for (var id in activeTouches) if (activeTouches[id].type === 'dir') delete activeTouches[id];
      refreshDirs();
      updateDpadVisuals();
    }
  }

  // Beschriftung unter den Touch-Tasten A und B (aktuelle Aktion)
  var labels = { a: null, b: null };
  function setLabels(a, b) {
    if (labels.a === a && labels.b === b) return;
    labels.a = a; labels.b = b;
    var la = document.getElementById('label-a'), lb = document.getElementById('label-b');
    if (la) la.textContent = a || '';
    if (lb) lb.textContent = b || '';
  }

  return {
    init: init,
    isTouch: function () { return document.body.classList.contains('touch'); },
    setDpadVisible: setDpadVisible,
    setLabels: setLabels,
    isDown: function (dir) { return !!held[dir]; },
    // true genau einmal pro Tastendruck (A/B)
    pressed: function (name) {
      var p = !!pressedOnce[name];
      pressedOnce[name] = false;
      return p;
    },
    // alle offenen Tastendrücke verwerfen
    clearPressed: function () { pressedOnce = {}; }
  };
})();
