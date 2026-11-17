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
    // A = Enter, B = Rücktaste
    if (e.code === 'Enter' || e.code === 'NumpadEnter') {
      e.preventDefault();
      if (!e.repeat) lightButton('a');
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

  function dirFromPoint(x, y, el) {
    var rect = el.getBoundingClientRect();
    var lx = (x - rect.left) / rect.width;
    var ly = (y - rect.top) / rect.height;
    if (ly < 0.4) return 'up';
    if (ly > 0.6) return 'down';
    if (lx < 0.4) return 'left';
    if (lx > 0.6) return 'right';
    return null;
  }

  function refreshDirs() {
    held.up = false; held.down = false; held.left = false; held.right = false;
    for (var id in activeTouches) {
      var t = activeTouches[id];
      if (t.dir) held[t.dir] = true;
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
          t.dir = null;
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
    var el = document.querySelector('.action-btn[data-btn="' + name + '"]');
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

  return {
    init: init,
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
