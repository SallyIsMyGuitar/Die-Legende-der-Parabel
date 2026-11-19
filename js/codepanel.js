// codepanel.js: Spielstand-Code zum Kopieren und Einfuegen (Schritt 4)
// Ein DOM-Panel ueber dem Canvas: Der Code laesst sich markieren und
// kopieren oder ein fremder Code einfuegen und uebernehmen. Kein Server,
// keine Datenuebertragung: Alles bleibt auf dem Geraet (save.js).
// Waehrend das Panel offen ist, hoert das Spiel auf Tasten (Input.setSuspended).
var CodePanel = (function () {
  'use strict';

  var el, out, inp, msg;

  function init() {
    el = document.getElementById('code-panel');
    out = document.getElementById('code-out');
    inp = document.getElementById('code-in');
    msg = document.getElementById('code-msg');
    document.getElementById('code-close').addEventListener('click', close);
    document.getElementById('code-copy').addEventListener('click', copy);
    document.getElementById('code-apply').addEventListener('click', apply);
  }

  function open(state) {
    out.value = Save.code(state);
    inp.value = '';
    setMsg('');
    el.hidden = false;
    Input.setSuspended(true);
  }

  function close() {
    el.hidden = true;
    Input.setSuspended(false);
  }

  function setMsg(text) {
    msg.textContent = text || '';
  }

  // Code in die Zwischenablage legen; Fallback: Text markieren zum Kopieren
  function copy() {
    out.focus();
    out.select();
    setMsg('');
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(out.value).then(function () {
        setMsg('Code kopiert.');
      }).catch(function () {
        setMsg('Code ist markiert: bitte selbst kopieren.');
      });
    } else {
      setMsg('Code ist markiert: bitte selbst kopieren.');
    }
  }

  // Eingefuegten Code uebernehmen: pruefen, speichern, Seite neu laden
  function apply() {
    var st = Save.parseCode(inp.value);
    if (!st) {
      setMsg('Das ist kein gueltiger Spielstand-Code.');
      inp.classList.add('error');
      return;
    }
    inp.classList.remove('error');
    Save.write(st);
    location.reload();
  }

  init();
  return { init: init, open: open };
})();
