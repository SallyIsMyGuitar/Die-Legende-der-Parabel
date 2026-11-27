// main.js: Start, Spielschleife und Abläufe (Tür-Animation, Bildschirmwechsel)
(function () {
  'use strict';

  var canvas = document.getElementById('game-canvas');
  var W = Render.WIDTH, H = Render.HEIGHT;

  Render.init(canvas);
  Input.init();
  TaskUi.init();
  Merkbuch.init();

  // --- Rastquelle: zuletzt benutzte Quelle (Start: Brunnen im Dorf) --------
  // Bei null Herzen kommt die Spielfigur hier wieder zu sich.
  var lastRest = { screen: 'ost', x: 7 * 16, y: 8 * 16, facing: 'up' };

  function useRest(target) {
    Hud.fill();
    if (target.spawn) {
      lastRest = { screen: World.getScreen(), x: target.spawn.x, y: target.spawn.y, facing: target.spawn.facing };
    }
    saveGame();   // Rastquellen speichern automatisch
  }

  // --- Spielstand: Fortschritt sammeln, speichern und laden ----------------
  var stats = { right: 0, wrong: 0 };   // Fehlerstatistik (fuer Abspann/Code)
  var finaleDone = false;               // Endboss Graf Gerade besiegt
  var abspannDone = false;              // Abspann war schon zu Ende gesehen

  // --- Bosse der Dungeons: Vorstellung und Sieg je Boss-Raum ------------
  // (Instanz mit Herzen und Zeichnung liegt in boss.js, Aufgaben in tasks.js)
  var bossIntroDone = {};               // Raum -> Wächter hat sich schon vorgestellt

  // Spielstand je Boss-Raum: true = besiegt
  function bossState() {
    var st = {};
    Boss.each(function (room, inst) { st[room] = inst.isDefeated(); });
    return st;
  }

  function collectState() {
    return {
      v: 1,
      rest: lastRest,
      defeated: Enemies.getDefeated(),
      chest: !!chestDone.ruine,   // Bit der alten Truhe (abwaertskompatibel)
      chests: chestDone,
      sword: Sword.has(),
      merk: Merkbuch.all(),
      boss: !!Boss.of('dboss') && Boss.of('dboss').isDefeated(),   // alter Schluessel (Dungeon 1)
      bosses: bossState(),                                          // besiegt je Boss-Raum
      raetsel: Raetsel.isSolved(),
      spiegel: Spiegel.isSolved(),
      linse: Linse.isSolved(),
      schaltwarte: Schaltwarte.isSolved(),
      platten: Platten.isSolved(),
      leuchtturm: World.isLighthouseLit(),
      sandsturm: World.isSandstormOpen(),
      schultor: World.isSchoolGateOpen(),
      finale: finaleDone,
      bossIntro: bossIntroDone,
      wappen: wappens,
      spaeth: spaethDone,
      dietl: dietlRewards,
      stats: stats,
      abspann: abspannDone,
      repeats: Enemies.getRepeats()
    };
  }

  function saveGame() { Save.write(collectState()); }

  // Gespeicherten Stand uebernehmen; Start an der letzten Rastquelle
  function applyState(st) {
    if (st.rest && st.rest.screen) lastRest = st.rest;
    // aeltere Staende: Der Schulhof-Bildschirm ist entfallen, seine Quelle
    // steht jetzt vor der Schule im Dorf
    if (lastRest.screen === 'schulhof') lastRest = { screen: 'start', x: 7 * 16, y: 7 * 16, facing: 'up' };
    Enemies.setDefeated(st.defeated);
    chestDone = st.chests || (st.chest ? { ruine: true } : {});
    if (chestDone.ruine) World.setChestOpen(1, 'ruine');
    if (chestDone.klippen) World.setChestOpen(1, 'klippen');
    if (chestDone.oase) World.setChestOpen(1, 'oase');
    if (st.sword) Sword.give();
    Merkbuch.load(st.merk);
    var bossesSt = st.bosses || (st.boss ? { dboss: true } : {});   // alte Staende nur mit 'boss'
    Object.keys(bossesSt).forEach(function (k) {
      if (bossesSt[k] && Boss.of(k)) Boss.of(k).setDefeated();
    });
    if (bossesSt.dboss) World.openRockGate('ost');
    if (st.raetsel) Raetsel.setSolved();
    if (st.spiegel) Spiegel.setSolved();
    if (st.linse) Linse.setSolved();   // aeltere Staende: Linsenkammer noch ungeloest
    // aeltere Staende: geloestes Brunnen-Raetsel zaehlt als geloeste Schaltwarte
    if (st.schaltwarte || st.gezeiten) Schaltwarte.setSolved();
    if (st.platten) Platten.setSolved();
    if (st.leuchtturm) World.setLighthouseLit(true);
    if (bossesSt.lboss) World.setWaterGateOpen(true);
    // Sandsturm, Platten-Raeetsel und Schultor (aeltere Staende bleiben zu)
    if (st.sandsturm) World.setSandstormOpen(true);
    if (st.schultor) World.setSchoolGateOpen(true);
    finaleDone = !!st.finale;
    // Vorstellung je Boss-Raum; aeltere Staende kennen nur die Hoehle
    bossIntroDone = st.bossIntro && typeof st.bossIntro === 'object'
      ? st.bossIntro
      : ((st.bossIntro || st.boss) ? { dboss: true } : {});
    wappens = st.wappen || 0;
    if (st.spaeth) { spaethDone = true; placeSpaethNpc(); }
    if (st.stats) stats = { right: st.stats.right || 0, wrong: st.stats.wrong || 0 };
    dietlRewards = st.dietl || 0;   // aeltere Staende: noch keine Belohnung
    abspannDone = !!st.abspann;      // aeltere Staende: Abspann noch nicht gesehen
    Enemies.setRepeats(st.repeats);   // Wiederholungszaehler je Dungeon-Raum
    if (finaleDone && abspannDone) placeTeachers();
    World.setScreen(lastRest.screen);
    Player.setPosition(lastRest.x, lastRest.y, lastRest.facing);
    Hud.fill();
  }

  // Spielstand-Seite im Merkbuch (Schritt 4): Statistik und per A der
  // Spielstand-Code (codepanel.js, ohne Server und Pruefsumme)
  var standSetupDone = false;
  function setupStandPage() {
    if (standSetupDone) return;
    standSetupDone = true;
    Merkbuch.setStand(function () {
      return [
        'Richtig: ' + stats.right + '   Falsch: ' + stats.wrong,
        'Wappen: ' + wappens + ' von 5',
        'Mit A hier den Spielstand-Code zeigen.'
      ];
    }, function () {
      CodePanel.open(collectState());
    });
  }

  // Texte einer Figur: nach dem ersten Wappen kommen Zusatzseiten dazu
  // (later.replace = true ersetzt die bisherigen Seiten)
  // later darf auch eine Liste von Stufen sein (z. B. Wappen 1, 2, 3, 4,
  // Finale): Es gilt die LETZTE Stufe, deren Bedingung erfuellt ist.
  function laterMatches(l) {
    if (l.wappen && wappens < l.wappen) return false;
    if (l.solved && !Raetsel.isSolved()) return false;
    if (l.spiegel && !Spiegel.isSolved()) return false;
    if (l.linse && !Linse.isSolved()) return false;
    if (l.schaltwarte && !Schaltwarte.isSolved()) return false;
    if (l.platten && !Platten.isSolved()) return false;
    if (l.school && !World.isSchoolGateOpen()) return false;
    if (l.finale && !finaleDone) return false;   // Endboss Graf Gerade besiegt
    // bestimmter Boss besiegt (z. B. boss: 'lboss'), unabhaengig vom Wappenzaehler
    if (l.boss && !(Boss.of(l.boss) && Boss.of(l.boss).isDefeated())) return false;
    return true;
  }

  function textsFor(target) {
    var l = target.later;
    if (!l) return target.texts;
    var stufen = Array.isArray(l) ? l : [l];
    for (var i = stufen.length - 1; i >= 0; i--) {
      var s = stufen[i];
      if (laterMatches(s)) return s.replace ? s.texts : target.texts.concat(s.texts);
    }
    return target.texts;
  }

  // --- Bann von Graf Gerade: Ausgang gesperrt, bis alle Wesen erlöst sind ---
  // Auf den Wegen zu den Dungeons gibt es keine Hindernisse: Die Gegner sind
  // freiwillige Übung. Der Bann gilt nur noch INNERHALB der Dungeons
  // ('warp' = Öffnung nach vorn ist gesperrt, bis alle Wesen des Raums erlöst sind).
  var BANN = { dhalle: 'warp', dmittel: 'warp', leingang: 'warp', lmitte: 'warp',
               weingang: 'warp', wmitte: 'warp', seingang: 'warp', smitte: 'warp',
               klassenzimmer: 'warp', physiksaal: 'warp', turnhalle: 'warp' };
  var FORWARD = { dhalle: 'dmittel', dmittel: 'draetsel',
                  leingang: 'lmitte', lmitte: 'llinse',
                  weingang: 'wmitte', wmitte: 'wraetsel',
                  seingang: 'smitte', smitte: 'splatten',
                  klassenzimmer: 'physiksaal', physiksaal: 'turnhalle', turnhalle: 'aula' };   // Öffnung nach vorn

  // --- Rätsel vor dem Boss: Fackeln (Höhle), Spiegel (Turm) ------------------
  // (Logik in raetsel.js bzw. spiegel.js; Schaltwarte des Kraftwerks siehe unten)
  function lightTorch(t) {
    var screen = World.getScreen();
    var R, wrongText, solvedText;
    if (screen === 'lraetsel') {
      R = Spiegel;
      wrongText = 'Das Licht bricht sich – alle Spiegel verdunkeln sich.';
      solvedText = 'Alle fünf Spiegel stehen im Licht. Mit lautem Ruck hebt sich das Gitter.';
    } else {
      R = Raetsel;
      wrongText = 'Die Flamme zischt – alle Fackeln erlöschen.';
      solvedText = 'Alle fünf Fackeln brennen. Mit lautem Knirschen hebt sich das Gitter.';
    }
    var res = R.light(t.x, t.y);
    if (res === 'wrong') {
      Dialog.open('', [wrongText + ' Der Punkt (' +
        Tasks.fmt(t.x) + '|' + Tasks.fmt(t.y) + ') liegt nicht auf der Parabel ' + R.FORMEL + '.']);
    } else if (res === 'solved') {
      saveGame();
      Dialog.open('', [solvedText]);
    }
  }

  // Schaltwarte (Kraftwerk): Startschalter prueft die eingestellte Parabel
  function startTurbine() {
    var res = Schaltwarte.starte();
    if (res === 'solved') {
      saveGame();
      Dialog.open('', ['Wasser strömt durch das Druckrohr, die Turbine läuft an. Mit lautem Ruck hebt sich das Gitter.']);
    } else if (res === 'wrong') {
      Dialog.open('', ['Die Turbine stottert und bleibt stehen. Die Parabel ' + Schaltwarte.term() + ' trifft nicht alle drei Anschlüsse.']);
    }
  }

  function bannActive(screen) {
    return !!BANN[screen] && Enemies.remaining(screen) > 0;
  }

  // Figur prallt am Bann ab, kurzer Text mit der Zahl der übrigen Wesen
  function bannBlock(nx, ny, facing) {
    Player.setPosition(nx, ny, facing);
    var n = Enemies.remaining(World.getScreen());
    Dialog.open('Bann', ['Ein Bann aus starren, geraden Linien versperrt den Weg. Er löst sich erst, wenn alle verzauberten Wesen hier erlöst sind. Noch übrig: ' + n + '.']);
  }

  // Flächen, auf denen der Bann sichtbar flimmert (nur noch im Dungeon:
  // die Öffnung nach oben, bis alle Wesen des Raums erlöst sind)
  function bannRects(screen) {
    return [[8 * 16, 1 * 16, 16, 16]];
  }

  // Bann zeichnen: senkrechte, gerade Lichtstreifen, die leicht pulsieren
  function drawBann(r, now) {
    var screen = World.getScreen();
    if (!bannActive(screen)) return;
    var ctx = r.getCtx();
    var rects = bannRects(screen);
    for (var i = 0; i < rects.length; i++) {
      var b = rects[i];
      for (var x = b[0] + 1; x < b[0] + b[2]; x += 3) {
        ctx.globalAlpha = 0.35 + 0.3 * Math.sin(now / 180 + x * 0.7);
        r.px(x, b[1], 1, b[3], '#c8a8ff');
      }
      ctx.globalAlpha = 0.5 + 0.3 * Math.sin(now / 120);
      r.px(b[0], b[1] + ((Math.floor(now / 60) + i * 5) % b[3]), b[2], 1, '#ffffff');
    }
    ctx.globalAlpha = 1;
  }

  // Nach einem Sieg: Ist das letzte Wesen erlöst, löst sich der Bann
  function bannReleased(screen) {
    return !!BANN[screen] && Enemies.remaining(screen) === 0;
  }

  // --- Bosse der Dungeons: Texte und Ablauf je Boss-Raum ------------------
  // Aufgaben je Boss liegen in tasks.js (bossTasks), Instanz in boss.js.
  // Die Texte des Wächters der Höhle sind freigegeben und bleiben unverändert.
  // --- Platten-Raeetsel vor dem Wächter des Sandtempels (Dungeon 4) -----
  // Die Druckplatten werden durch Betreten gedrueckt (ausgeloest pro Kachel-
  // wechsel, nicht solange man auf derselben Platte stehen bleibt).
  var lastPlateTile = null;
  function stepOnPlate(screen) {
    if (screen !== 'splatten' || Platten.isSolved()) return;
    if (TaskUi.isActive() || Dialog.isActive() || seq) return;
    var tx = (Player.getX() + 8) >> 4;
    var ty = (Player.getY() + 8) >> 4;
    if (tx === null) return;
    if (lastPlateTile === tx + ',' + ty) return;   // steht noch auf derselben Platte
    var x = Platten.plateAt(tx, ty);
    if (x === null) { lastPlateTile = null; return; }   // neben den Platten merken
    lastPlateTile = tx + ',' + ty;
    var res = Platten.press(x);
    if (res === 'wrong') {
      Dialog.open('', ['Die Platte bei x = ' + Tasks.fmt(x) + ' versinkt \u2013 alle Platten kehren in den Boden zurück. Sie liegt nicht auf der Parabel ' + Platten.FORMEL + '. Das Gitter bleibt zu.']);
    } else if (res === 'solved') {
      saveGame();
      Dialog.open('', ['Beide Platten der Nullstellen sind gedrückt. Mit lautem Ruck hebt sich das Gitter zum Wächter.']);
    }
    // 'pressed' und 'already': Platte bleibt gedrueckt, kein Text
  }

  // --- Schiebe-Raetsel in der Linsenkammer (Leuchtturm, linse.js) -------
  function pushStone(dt, screen) {
    if (screen !== Linse.ROOM || Linse.isSolved()) return;
    var res = Linse.update(dt, Player.getX(), Player.getY(), Player.getFacing(), Input,
      function (tx, ty) { return World.isBlocked(tx, ty); });
    if (res === 'solved') {
      saveGame();
      Dialog.open('', ['Der Linsenstein rastet im Scheitel S(−2|−1) ein. Das Licht folgt jetzt der Parabel ' + Linse.FORMEL + '. Mit lautem Ruck hebt sich das Gitter.']);
    } else if (res === 'reset') {
      Dialog.open('', ['Klack! Die Druckplatte senkt sich, und der Linsenstein gleitet an seinen Platz im Ursprung zurück.']);
    }
  }

  var BOSSES = {
    dboss: {
      name: 'Wächter der Höhle',
      kontext: 'Der Wächter fragt:',
      // Vorstellung beim ersten Kontakt (danach startet die erste Aufgabe)
      intro: [
        'Halt! Graf Gerade hat befohlen: Hier kommt keine Kurve durch!',
        'Beantworte meine drei Fragen. Für jede richtige Antwort verliere ich ein Herz. Dein Schwert nützt dir bei mir nichts.'
      ],
      victory: [
        'Der Bann zerbricht in tausend gerade Splitter. Der Wächter atmet auf, und das Tor öffnet sich.',
        'Danke! Graf Gerade hat mich verzaubert. Er hasst alles, was sich krümmt – und Parabeln am allermeisten.',
        'Darum ließ er eure Schule zerstören: Dort lernt man, wie Parabeln funktionieren. Er hat sich in eurer Schule verschanzt und das Tor mit vier Siegeln verschlossen. Jeder seiner Wächter trug eines. Meines ist gebrochen.',
        'Du erhältst das erste Wappen: das Wappen der Normalparabel. Kehre ins Dorf zurück und erzähle, was du erfahren hast.'
      ],
      // nach dem Sieg: der Felsen am Suedausgang loest sich auf
      onWin: function () { World.openRockGate('ost'); }
    },
    lboss: {
      name: 'Wächter des Turms',
      kontext: 'Der Wächter fragt:',
      intro: [
        'Halt! Graf Gerade hat diesen Turm verzaubert: Kein Licht, keine Kurve – nur gerade Finsternis!',
        'Beantworte meine drei Fragen. Für jede richtige Antwort verliere ich ein Herz. Dein Schwert hilft dir hier nicht.'
      ],
      victory: [
        'Mit einem heißen Aufblitzen kehrt das Licht in den Spiegel zurück. Der Bann über dem Turm zerbricht.',
        'Ich war die Laterne des Turms, verzaubert vom Grafen. Er fürchtet nichts mehr als einen leuchtenden Scheitelpunkt.',
        'Hast du das Wasserkraftwerk im Osten gesehen? Sein Tor trägt das Siegel des Grafen. Erst wenn du es bannst, zeigt sich der nächste Wächter.',
        'Du erhältst das Wappen der Scheitelform. Das zweite Siegel am Schultor ist gebrochen.'
      ],
      // nach dem Sieg: der Leuchtturm draussen leuchtet wieder und
      // das Wassertor zur Lagune (Dungeon 3) oeffnet sich
      onWin: function () { World.setLighthouseLit(true); World.setWaterGateOpen(true); }
    },
    wboss: {
      name: 'Wächter des Kraftwerks',
      kontext: 'Der Wächter fragt:',
      intro: [
        'Halt! Graf Gerade hat mir befohlen: Im Kraftwerk dreht sich nichts mehr – alles bleibt gerade, starr und stumm!',
        'Beantworte meine drei Fragen. Für jede richtige Antwort verliere ich ein Herz. Dein Schwert hilft dir hier nicht.'
      ],
      victory: [
        'Die Turbinen setzen sich in Bewegung, das Wasser rauscht wieder. Der Bann über dem Kraftwerk zerbricht.',
        'Ich bin das Turbinenrad des Kraftwerks, verzaubert vom Grafen. Meine Schaufeln sind gebogen wie Parabeln – das konnte er nicht dulden.',
        'Hast du vom Sandsturm im Westen gehört? Er trägt sein Siegel. Erst wenn du ihn bannst, öffnet sich der Weg zum letzten Wächter.',
        'Du erhältst das Wappen der allgemeinen Form. Das dritte Siegel ist gebrochen – nur eines hält das Schultor noch.'
      ],
      // nach dem Sieg: Der Sandsturm im Westen loest sich auf
      // (Dungeon 4: Weg ueber Steppe, Duenen und Oase zum Sandtempel)
      onWin: function () { World.setSandstormOpen(true); }
    },
    sboss: {
      name: 'Wächter des Sandtempels',
      kontext: 'Der Wächter fragt:',
      intro: [
        'Halt! Graf Gerade hat den Sandtempel versiegelt: Im Sand verweht alles auf geraden Bahnen \u2013 jede Krümmung begräbt er!',
        'Beantworte meine drei Fragen. Für jede richtige Antwort verliere ich ein Herz. Dein Schwert hilft dir hier nicht.'
      ],
      victory: [
        'Der Bann zerbricht, und der Sand rieselt willenlos in sanften Bögen.',
        'Ich bin die Sanduhr des Tempels, verzaubert vom Grafen. Er glaubte, selbst die Zeit müsse gradlinig verfallen.',
        'Mit mir bricht das letzte Siegel. Das Schultor im Dorf steht offen – dort wartet Graf Gerade mit den Lehrerinnen und Lehrern.',
        'Du erhältst das Wappen der Nullstellen. Der Sand weht dir den Weg frei.'
      ],
      // nach dem Sieg: Das Schultor im Dorf oeffnet sich (Dungeon 5: Finale)
      onWin: function () { World.setSchoolGateOpen(true); }
    },
    aula: {
      name: 'Graf Gerade',
      kontext: 'Graf Gerade fragt:',
      intro: [
        'So weit kommst du also. Ich bin Graf Gerade! Ich dulde nichts, was sich krümmt \u2013 und Parabeln hasse ich am meisten.',
        'Solange es hier noch jemanden gibt, der Kurven lehrt, bleiben die Lehrerinnen und Lehrer gefangen. Vier Fragen \u2013 dein Schwert hilft dir nicht.'
      ],
      victory: [
        'Seine starren Linien biegen sich \u2013 eine nach der anderen wird zur Parabel. Der Bann über dem Land zerbricht.',
        'Graf Gerade zersplittert in lauter gerade Splitter und verschwindet. Die Lichtlinien über der Schule erlöschen.',
        'Auf dem Boden liegt nur noch das alte Tafellineal aus dem Matheraum. Jahrelang zog es nur gerade Striche, während daneben an der Tafel die schönsten Parabeln entstanden. Aus Neid wurde Graf Gerade.',
        'Die Lehrerinnen und Lehrer sind frei! Man hört die befreiten Stimmen bis auf den Schulhof. Die Schule wird wieder aufgebaut.',
        'Du erhältst das Wappen der Anwendungen. Der Rückweg durch die Schule steht dir offen.'
      ],
      // nach dem Sieg: Finale-Flagge (Abspann und Wiederholungsmodus folgen
      // in Meilenstein 6); die Figur bleibt in der Aula stehen
      onWin: function () { finaleDone = true; }
    }
  };
  var bossAttempts = 1;    // Versuche an der aktuellen Boss-Aufgabe
  var wappens = 0;         // gesammelte Wappen (fuer den Abspann)
  var finaleTalkPending = false;   // Siegdialog des Grafen ist zu: Abspann starten

  // Abspann nach dem Sieg ueber Graf Gerade (abspann.js); danach steht die
  // Figur im Dorf vor dem Schultor
  function startAbspann() {
    Abspann.start(wappens, stats, function () {
      abspannDone = true;
      placeTeachers();                       // befreite Lehrkraefte (Schritt 2)
      World.rebake('start');                 // Schule im Dorf: intakt zeichnen
      World.setScreen('start');
      Player.setPosition(11 * 16, 12 * 16, 'up');   // vor dem Schultor
      saveGame();
    });
  }

  // Befreite Lehrkraefte vor der Schule im Dorf (Texte vorlaeufig).
  // Nur Rollenbezeichnungen, keine Namen; Herr Spaeth und Herr Dietl stehen
  // weiter dort, wo sie schon stehen.
  var teachersPlaced = false;
  function placeTeachers() {
    if (teachersPlaced) return;
    teachersPlaced = true;
    World.addNpc('start', {
      x: 10 * 16, y: 10 * 16, baseFacing: 'down',
      sprites: function () { return People.netzweber(); },
      talk: { name: 'Lehrerin', texts: [
        'Wir sind frei! Danke, dass du die Schule gerettet hast.',
        'Ab jetzt üben wir wieder Parabeln – jeden Tag ein bisschen.'
      ] }
    });
    World.addNpc('start', {
      x: 14 * 16, y: 10 * 16, baseFacing: 'down',
      sprites: function () { return People.tuemerin(); },
      talk: { name: 'Lehrerin', texts: [
        'Der Bann ist zerbrochen. Übung macht den Meister!',
        'Die Steintafel neben dem Eingang startet eine Wiederholung.'
      ] }
    });
    World.addNpc('start', {
      x: 6 * 16, y: 8 * 16, baseFacing: 'right',
      sprites: function () { return People.sterndeuter(); },
      talk: { name: 'Lehrer', texts: [
        'Fünf Wappen und ein freies Land. Gut gemacht!',
        'Jede Steintafel an einem Dungeon-Eingang startet eine Wiederholung.'
      ] }
    });
  }

  function startBossTask() {
    var room = World.getScreen();            // Boss-Raum bestimmt den Boss
    var boss = Boss.of(room);
    var name = BOSSES[room].name;
    boss.startFight();
    var def = Tasks.bossTasks(room)[boss.index()];
    // Feste Aufgabe mit Kontext uebernehmen
    var task = {
      frage: BOSSES[room].kontext + ' ' + def.frage,
      felder: def.felder,
      auswahl: def.auswahl,
      loesung: def.loesung,
      loesungstext: def.loesungstext,
      hinweis: def.hinweis,
      graph: def.graph,
      graphFix: def.graphFix
    };
    TaskUi.openFixed(task, function (solved, errors) {
      if (solved) stats.right++; else stats.wrong++;
      if (solved) {
        bossAttempts = 1;
        if (boss.damage() > 0) {
          // naechste feste Aufgabe nach kurzem Durchatmen
          run([{ dur: 0.5 }, { dur: 0, end: function () { startBossTask(); } }]);
        } else {
          boss.die();
          wappens++;
          if (BOSSES[room].onWin) BOSSES[room].onWin();
          saveGame();   // nach dem Dungeon automatisch speichern
          if (room === 'aula') finaleTalkPending = true;   // danach: Abspann
          run([
            { dur: 1.3 },
            { dur: 0, end: function () {
              Dialog.open(name, BOSSES[room].victory);
            } }
          ]);
        }
      } else {
        bossAttempts++;                     // gleiche Aufgabe kommt wieder
        hurt({ x: boss.def.x, y: boss.def.y });   // Rueckstoss vom Boss weg
      }
    }, { boss: true, attempt: bossAttempts });
  }

  // --- Wiederholungsmodus (Schritt 3) --------------------------------------
  // Nach dem Finale kann jeder Dungeon ueber die Steintafel am Eingang
  // wiederholt werden: Die Gegner kehren mit neuen Zahlen zurueck (der
  // Wiederholungszaehler zaehlt in den Samen), Bosse und Bodenraetsel
  // bleiben, wie sie sind, und der erste Durchlauf samt Wappen bleibt erhalten.
  var DUNGEONS = {
    hoehle: { name: 'H\u00f6hle der Parabeln', rooms: ['dhalle', 'dmittel', 'draetsel', 'dboss'] },
    turm: { name: 'Leuchtturm', rooms: ['leingang', 'lmitte', 'llinse', 'lraetsel', 'lboss'] },
    wasser: { name: 'Wasserkraftwerk', rooms: ['weingang', 'wmitte', 'wraetsel', 'wboss'] },
    sand: { name: 'Sandtempel', rooms: ['seingang', 'smitte', 'splatten', 'sboss'] },
    schule: { name: 'Schule', rooms: ['klassenzimmer', 'physiksaal', 'turnhalle', 'aula'] }
  };

  // Steintafeln an den Dungeon-Eingaengen (Texte vorlaeufig) und die
  // Erinnerungstafel zum erneuten Ansehen des Abspanns (Aktion 'abspann').
  // Beides wird beim Laden registriert, bevor irgendein Bildschirm gebacken wird.
  function addStele(screen, tiles, dungeonKey) {
    World.addSign(screen, {
      tiles: tiles, x: tiles[0][0] * 16, y: tiles[0][1] * 16,
      name: 'Steintafel',
      texts: ['Eine alte Steintafel mit f\u00fcnf Wappen-Vertiefungen. Sie schl\u00e4ft noch \u2026'],
      action: 'repeat', dungeon: dungeonKey
    });
  }
  addStele('ruine', [[10, 5]], 'hoehle');
  addStele('kueste', [[11, 12]], 'turm');
  addStele('lagune', [[10, 6]], 'wasser');
  addStele('oase', [[9, 5]], 'sand');
  addStele('start', [[9, 10]], 'schule');
  World.addSign('ost', {
    tiles: [[6, 3]], x: 6 * 16, y: 3 * 16,
    name: 'Erinnerungstafel',
    texts: ['Hier soll einmal an die Rettung der Schule erinnert werden. Noch ist es nicht so weit.'],
    action: 'abspann'
  });

  // Rueckfrage der Steintafel: A = Wiederholung starten, B = zurueck
  var repeatAsk = null;    // { key: dungeon } waehrend der Rueckfrage

  function doRepeat(key) {
    var D = DUNGEONS[key];
    D.rooms.forEach(function (rm) { Enemies.advanceRepeat(rm); });
    Enemies.clearScreens(D.rooms);
    saveGame();
    var durchlauf = (Enemies.getRepeats()[D.rooms[0]] || 0) + 1;
    Dialog.open('Steintafel', [
      'Wiederholung: ' + D.name + '. Durchlauf ' + durchlauf + '.',
      'Die verzauberten Wesen kehren zur\u00fcck \u2013 mit neuen Zahlen. Deine Wappen und der erste Durchlauf bleiben erhalten.'
    ]);
  }

  // Kleine Box fuer die Rueckfrage (Bauart wie der Dialog)
  function drawRepeatAsk(r) {
    var ctx = r.getCtx();
    var b = { x: 40, y: 82, w: 176, h: 60 };
    r.px(b.x + 2, b.y, b.w - 4, b.h, '#1c1828');
    r.px(b.x, b.y + 2, b.w, b.h - 4, '#1c1828');
    r.px(b.x + 1, b.y + 1, b.w - 2, b.h - 2, '#1c1828');
    r.px(b.x + 3, b.y + 1, b.w - 6, 1, '#efe4c4');
    r.px(b.x + 3, b.y + b.h - 2, b.w - 6, 1, '#efe4c4');
    r.px(b.x + 1, b.y + 3, 1, b.h - 6, '#efe4c4');
    r.px(b.x + b.w - 2, b.y + 3, 1, b.h - 6, '#efe4c4');
    Font.draw(ctx, 'Wiederholung \u00fcben?', b.x + 10, b.y + 8, '#f0c040');
    Font.draw(ctx, DUNGEONS[repeatAsk.key].name, b.x + 10, b.y + 22, '#f6f0e2');
    Font.draw(ctx, 'A: Ja   B: Nein', b.x + 10, b.y + 42, '#8a8496');
  }

  // --- Kampf: Beruehrung mit einem Gegner startet genau eine Aufgabe -------
  // Die Aufgabenbox blendet erst aus, dann folgt die Animation:
  //   richtig = Gegner blitzt auf und zerfaellt in eine Rauchwolke
  //   falsch  = Herz verschwindet oben, Figur blinkt und weicht zurueck
  function startBattle(enemy) {
    var attempt = Enemies.attemptOf(enemy);
    TaskUi.open(Enemies.typeIdOf(enemy), Enemies.seedOf(enemy), function (solved, errors, joker) {
      if (solved) {
        if (!joker) stats.right++;
        // Herz-Drop nur bei richtiger Antwort im ersten Versuch, nie mit Schwert
        Enemies.defeat(enemy, !joker && attempt === 1);
        saveGame();
        var texts = [];
        if (joker) texts.push('Dein Schwert zerbricht. Der Gegner weicht zurück \u2013 diesmal ohne Rechnung.');
        if (bannReleased(enemy.screen)) texts.push('Das letzte Wesen ist erlöst. Der Bann löst sich auf – der Weg ist frei!');
        if (texts.length) {
          // erst die Besiegt-Animation, dann der Hinweis
          run([
            { dur: Enemies.DEFEAT_TIME },
            { dur: 0, end: function () { Dialog.open('', texts); } }
          ]);
        }
      } else {
        stats.wrong++;
        hurt(enemy);
      }
    }, Enemies.contextOf(enemy), { attempt: attempt });   // Kontext aus dem Tipp des NPCs
  }

  // Falsche Antwort: ein Herz weg (blinkt und zerplatzt im HUD), Figur
  // blinkt und weicht von der Quelle des Schadens zurueck. Bei null Herzen
  // geht es danach zur letzten Rastquelle.
  function hurt(source) {
    Hud.loseHeart();
    Player.blink(Config.PLAYER_BLINK);
    var steps = knockbackSteps(source);
    if (Hud.getHearts() === 0) {
      steps = steps.concat([{ dur: 0.8 }], respawnSteps());
    }
    run(steps);
  }

  // --- R\u00e4tsel-Truhe an der Ruine: Belohnung ist das Schwert --------------
  // Je Bildschirm: Aufgabentyp der dortigen Rätsel-Truhe (Belohnung: Schwert)
  var CHEST_TYPE = { ruine: 'verschiebung', klippen: 'scheitelAllgemein' };
  var chestDone = {};       // Bildschirm -> Truhe ist nach dem Raetsel leer
  var chestAttempts = {};  // Bildschirm -> Versuche am Raetsel (Hinweis ab dem 2., Loesung im 3.)
  var chestSword = null;   // aufsteigendes Schwert ueber der Truhe: { x, y, p }
  function openChest() {
    var screen = World.getScreen();
    if (chestDone[screen]) {
      Dialog.open('Truhe', ['Die Truhe ist leer.']);
      return;
    }
    chestAttempts[screen] = (chestAttempts[screen] || 0) + 1;
    // Plus-Raetsel zum Thema des jeweiligen Weges (Aufgabentyp je Bildschirm)
    TaskUi.open(CHEST_TYPE[screen] || 'verschiebung', Math.floor(Date.now() / 1000) % 100000, function (solved, errors) {
      var pos = World.chestPos();
      if (!solved) {
        if (errors === 0) chestAttempts[screen]--;   // mit B abgebrochen: zaehlt nicht
        else { stats.wrong++; hurt(pos); }            // falsch: Herz weg wie im Kampf
        return;                                       // Truhe bleibt, spaeter neuer Versuch
      }
      stats.right++;
      chestDone[screen] = true;
      // Aufgabe ist zu: Deckel klappt auf, Schwert steigt auf, dann der Text
      run([
        { dur: 0.3, tick: function (p) { World.setChestOpen(p); } },
        { dur: 0.7, start: function () { chestSword = { x: pos.x, y: pos.y, p: 0 }; },
          tick: function (p) { chestSword.p = p; } },
        { dur: 0.3 },
        { dur: 0, end: function () {
          chestSword = null;
          Sword.give();   // Schwert wandert in den Slot im HUD
          saveGame();
          Dialog.open('Truhe', [
            'Du l\u00f6st das R\u00e4tsel und \u00f6ffnest die Truhe.',
            'Darin liegt ein Schwert! Es \u00fcberspringt einmal eine Aufgabe und zerbricht danach.',
            'Du tr\u00e4gst es im Platz links neben A und B oben rechts. Antippen oder Taste E setzt es ein.'
          ]);
        } }
      ]);
    }, 'R\u00e4tsel der Truhe:', { abortable: true, attempt: chestAttempts[screen] });
  }

  // --- Herr Dietl im Versteck: Frage zur Spielwelt, Belohnung Herz/Schwert ---
  // Höchstens Dietl.MAX Belohnungen. Falsche Antworten kosten kein Herz und
  // zählen nicht in die Fehlerstatistik (keine Mathe-Aufgabe).
  var dietlRewards = 0;        // bisher erhaltene Belohnungen
  var dietlQuizPending = false; // nach dem Gespräch folgt die Frage
  var dietlMet = false;         // in dieser Sitzung schon vorgestellt

  // Was Herr Dietl gerade geben kann: Herz nur, wenn eines fehlt; Schwert nur,
  // wenn keines getragen wird
  function dietlChoices() {
    var c = [];
    if (Hud.getHearts() < Config.HEARTS_MAX) c.push('herz');
    if (!Sword.has()) c.push('schwert');
    return c;
  }

  function talkDietl() {
    var T = Dietl.TEXTE;
    var rest = Dietl.MAX - dietlRewards;
    var texts = [];
    if (finaleDone) texts.push(T.finale);
    if (rest <= 0) {
      texts = texts.concat(T.alle);
    } else if (!dietlChoices().length) {
      texts = texts.concat(dietlMet ? [] : T.erstes, T.voll);
    } else {
      texts = texts.concat(dietlMet || dietlRewards > 0 ? T.wieder(rest) : T.erstes);
      dietlQuizPending = true;   // nach dem Gespräch: Frage stellen
    }
    dietlMet = true;
    Dialog.open('Herr Dietl', texts);
  }

  function startDietlQuiz() {
    TaskUi.openFixed(Dietl.frage(), function (solved, errors) {
      if (!solved) {
        if (errors > 0) Dialog.open('Herr Dietl', Dietl.TEXTE.falsch);   // mit B abgebrochen: nichts
        return;
      }
      var c = dietlChoices();
      if (!c.length) return;
      var gabe = c[Math.floor(Math.random() * c.length)];
      if (gabe === 'herz') Hud.heal(1);
      else Sword.give();   // Schwert wandert in den Slot im HUD
      dietlRewards++;
      saveGame();
      Dialog.open('Herr Dietl', gabe === 'herz' ? Dietl.TEXTE.herz : Dietl.TEXTE.schwert);
    }, { abortable: true, attempt: 1 });
  }

  // Schwert steigt aus der Truhe auf, mit kurzem Funkeln
  function drawChestSword(r, now) {
    var c = chestSword;
    var ease = 1 - (1 - c.p) * (1 - c.p);
    var x = c.x + 1, y = Math.round(c.y + 2 - ease * 14);
    Sword.drawIcon(r, x, y);
    if (c.p > 0.6) {
      var k = Math.floor(now / 90) % 2;
      r.px(x + 12, y - 2 + k, 1, 3, '#ffffff');
      r.px(x + 11, y - 1 + k, 3, 1, '#ffffff');
    }
  }

  // Spielstart im Elternhaus bei der Mutter (bzw. Titelbild davor)
  World.setScreen(World.START.screen);
  Player.setPosition(World.START.x, World.START.y, World.START.facing);

  // Neues Spiel: Die Figur steht im Elternhaus vor Mama, das Gespräch mit
  // ihr beginnt von selbst (wie beim Ansprechen mit A)
  function startMama() {
    var t = World.talkTarget(Player.getX(), Player.getY(), Player.getFacing());
    if (t) Dialog.open(t.name, textsFor(t));
  }

  // --- Titelbild: Neues Spiel oder Weiterspielen ---------------------------
  // phase 'menu' | 'confirm' (Spielstand wirklich löschen?) | null = Spiel läuft
  var saved = Save.read();
  var title = { phase: 'menu' };

  function updateTitle() {
    if (title.phase === 'menu') {
      if (Input.pressed('a')) {
        if (saved) applyState(saved);
        else startMama();  // neues Spiel ohne Spielstand: Mama spricht sofort
        title = null;
      } else if (saved && Input.pressed('b')) {
        title.phase = 'confirm';
      }
    } else if (title.phase === 'confirm') {
      if (Input.pressed('a')) {
        Save.clear();      // neu beginnen: Start im Elternhaus
        saved = null;
        title = null;
        startMama();       // Gespräch mit Mama startet automatisch
      } else if (Input.pressed('b')) {
        title.phase = 'menu';
      }
    }
  }

  // Text mittig, optional doppelt so groß
  function centerText(ctx, text, y, color, big) {
    if (big) {
      ctx.save();
      ctx.scale(2, 2);
      Font.draw(ctx, text, Math.floor((W / 2 - Font.width(text)) / 2), y / 2, color);
      ctx.restore();
      return;
    }
    Font.draw(ctx, text, Math.floor((W - Font.width(text)) / 2), y, color);
  }

  function drawTitle(r, now) {
    var ctx = r.getCtx();
    r.px(0, 0, W, H, 'rgba(10,8,16,0.78)');
    centerText(ctx, 'Die Legende', 38, '#f0c040', true);
    centerText(ctx, 'der Parabel', 62, '#f0c040', true);
    // kleine Parabel als Zierde
    for (var x = -30; x <= 30; x++) {
      var y = Math.round(x * x / 30);
      r.px(W / 2 + x, 112 - y, 1, 1, '#efe4c4');
    }
    r.px(W / 2 - 1, 111, 3, 3, '#f0c040');
    var blinkOn = Math.floor(now / 500) % 2 === 0;
    if (title.phase === 'menu') {
      if (saved) {
        centerText(ctx, 'A: Weiterspielen', 130, blinkOn ? '#f6f0e2' : '#c8c0b0');
        centerText(ctx, 'B: Neues Spiel', 144, '#8a8496');
      } else {
        centerText(ctx, 'A: Spiel starten', 136, blinkOn ? '#f6f0e2' : '#c8c0b0');
      }
    } else {
      centerText(ctx, 'Spielstand löschen und neu beginnen?', 130, '#f6f0e2');
      centerText(ctx, 'A: Ja, neu beginnen   B: Nein', 144, '#8a8496');
    }
    centerText(ctx, 'Der Spielstand bleibt nur auf diesem Gerät.', 196, '#8a8496');
  }

  // --- Abläufe: Folge von Schritten mit Dauer (Sekunden) -------------------
  // Während ein Ablauf läuft, ist die Steuerung gesperrt.
  var seq = null;
  var fade = 0;            // 0 = klar, 1 = schwarz
  var doorClip = null;     // Spielfigur wird in dieser Türöffnung nachgezeichnet
  var slide = null;        // laufender Bildschirmwechsel

  function run(steps) {
    seq = { steps: steps, i: 0, t: 0 };
    if (steps[0].start) steps[0].start();
  }

  function updateSeq(dt) {
    var s = seq.steps[seq.i];
    seq.t += dt;
    var p = s.dur > 0 ? Math.min(1, seq.t / s.dur) : 1;
    if (s.tick) s.tick(p, dt);
    if (p < 1) return;
    if (s.end) s.end();
    seq.i++;
    seq.t = 0;
    if (seq.i >= seq.steps.length) { seq = null; return; }
    if (seq.steps[seq.i].start) seq.steps[seq.i].start();
  }

  var WALK = 14;           // Pixel, die die Figur durch die Tür geht

  // --- Szene: Herr Späth hält die Spielfigur am Ost-Rand des Dorfes auf ---
  var SPAETH_TEXTS = [
    'Aus der Bahn!!! Ich bin schöner als du ...',
    'Halt, stopp ... Du willst die Schule retten. Ich bin Herr Späth, der letzte Universalgelehrte unserer Zeit ...',
    'Wenn du die Schule retten willst, habe ich als Tipp für dich: Nimm einen Stift und einen Zettel, damit du deine Nebenrechnungen notieren kannst.'
  ];
  var spaeth = null;         // Position der Figur, solange die Szene läuft
  var spaethPhase = null;    // 'approach' | 'talk' | 'aside'
  var spaethDone = false;    // Szene nur einmal pro Spielsitzung
  var SPAETH_STAND_TEXTS = ['Auf geht\'s ... Rette das Volk niederer Bildung!'];

  // Figur dreht sich zur Spielfigur, solange das Gespräch läuft
  var turnedNpc = null;

  function faceToward(npc, px, py) {
    var dx = px - npc.x, dy = py - npc.y;
    if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 'right' : 'left';
    return dy > 0 ? 'down' : 'up';
  }
  var spaethSprites = null;  // Sprites einmal vorberechnen

  function drawSpaeth(r, t) {
    if (!spaethSprites) {
      // Ansturm von links: Blick nach rechts; danach stehend: Blick nach links
      spaethSprites = People.spaeth();
    }
    var bob = spaethPhase === 'approach' ? Math.floor(t / 90) % 2 : 0;
    var img = spaethPhase === 'aside' ? spaethSprites.left[0] : spaethSprites.right[0];
    var ctx = r.getCtx();
    ctx.globalAlpha = 0.3;
    r.ellipse(spaeth.x + 8, spaeth.y + 15, 6, 2, '#2a140a');
    ctx.globalAlpha = 1;
    r.image(img, Math.round(spaeth.x), Math.round(spaeth.y - bob));
  }

  function startSpaeth() {
    // Halt neben der Spielfigur (links von ihr), Blick zu ihr nach rechts
    var stopX = Player.getX() - 16;
    spaeth = { x: -32, y: 64 };
    spaethPhase = 'approach';
    run([
      { dur: 0.7, tick: function (p) { spaeth.x = -32 + (stopX + 32) * p; } },
      { dur: 0, end: function () {
        spaethPhase = 'talk';
        Dialog.open('Herr Späth', SPAETH_TEXTS);
      } }
    ]);
  }

  // Nach dem Gespräch: tritt vom Weg herunter und bleibt als NPC stehen
  function spaethAside() {
    spaethPhase = 'aside';
    run([
      { dur: 0.6, tick: function (p) {
        spaeth.x = spaeth.x0 + (192 - spaeth.x0) * p;
        spaeth.y = 64 + (96 - 64) * p;
      }, start: function () { spaeth.x0 = spaeth.x; } },
      { dur: 0, end: function () {
        placeSpaethNpc();
        spaeth = null;
        spaethPhase = null;
        spaethDone = true;
        saveGame();
      } }
    ]);
  }

  // Herr Späth steht nach der Szene als NPC am Dorfplatz
  function placeSpaethNpc() {
    World.addNpc('ost', {
      x: 192, y: 96, baseFacing: 'left',
      sprites: function () { return People.spaeth(); },
      talk: { name: 'Herr Späth', texts: SPAETH_STAND_TEXTS }
    });
  }

  // Rückstoß nach einem verlorenen Kampf: Figur weicht vom Gegner weg,
  // damit nicht sofort der nächste Kampf beginnt (mit Kollision, im Bildschirm)
  function knockbackSteps(enemy) {
    var dx = Player.getX() - enemy.x, dy = Player.getY() - enemy.y;
    var vx = 0, vy = 0;
    if (Math.abs(dx) >= Math.abs(dy) && dx !== 0) vx = dx > 0 ? 1 : -1;
    else if (dy !== 0) vy = dy > 0 ? 1 : -1;
    else {
      // genau übereinander: entgegen der Blickrichtung
      var f = Player.getFacing();
      vx = f === 'left' ? 1 : f === 'right' ? -1 : 0;
      vy = f === 'up' ? 1 : f === 'down' ? -1 : 0;
    }
    var speed = Config.KNOCKBACK / Config.KNOCKBACK_TIME;
    return [
      { dur: Config.KNOCKBACK_TIME, tick: function (p, dt) {
        var nx = Math.max(0, Math.min(W - 16, Player.getX() + vx * speed * dt)) - Player.getX();
        var ny = Math.max(0, Math.min(H - 16, Player.getY() + vy * speed * dt)) - Player.getY();
        Player.push(World, nx, ny);
      } }
    ];
  }

  // Alle Herzen verloren: Abblende, an der letzten Rastquelle wieder zu sich kommen
  function respawnSteps() {
    return [
      { dur: 0.5, tick: function (p) { fade = p; } },
      { dur: 0.3, end: function () {
        World.setScreen(lastRest.screen);
        Player.setPosition(lastRest.x, lastRest.y, lastRest.facing);
        Player.blink(0);
        Hud.fill();
      } },
      { dur: 0.5, tick: function (p) { fade = 1 - p; } },
      { dur: 0, end: function () {
        // Ein getragenes Schwert geht bei null Herzen verloren
        if (Sword.has()) {
          Sword.breakSword();
          saveGame();
          Dialog.open('', ['Du kommst an der Quelle wieder zu dir. Deine Herzen sind wieder voll. Dein Schwert ist verloren.']);
        } else {
          Dialog.open('', ['Du kommst an der Quelle wieder zu dir. Deine Herzen sind wieder voll.']);
        }
      } }
    ];
  }

  // Dungeon betreten: Abblende, Eingangshalle, wieder aufblenden
  function enterDungeon(room) {
    run([
      { dur: 0.25, tick: function (p) { fade = p; } },
      { dur: 0, end: function () {
        World.setScreen(room);
        Player.setPosition(8 * 16, 11 * 16, 'up');
      } },
      { dur: 0.25, tick: function (p) { fade = 1 - p; } }
    ]);
  }

  // Übergang zwischen Dungeon-Räumen (Höhlenöffnungen) mit Abblende
  function roomWarp(w) {
    run([
      { dur: 0.25, tick: function (p) { fade = p; } },
      { dur: 0, end: function () {
        World.setScreen(w.to.screen || w.to.room);
        // Linsenkammer: der Stein liegt beim Betreten wieder am Start
        if (w.to.room === Linse.ROOM) Linse.reset();
        Player.setPosition(w.to.x, w.to.y, w.to.facing || 'up');
      } },
      { dur: 0.25, tick: function (p) { fade = 1 - p; } }
    ]);
  }

  // Haus betreten: Tür geht auf, Figur geht hinein, Abblende, Raum
  function enterHouse(w) {
    var b = w.building;
    var startX = Player.getX(), y0 = Player.getY();
    var targetX = b.door * Render.TILE;
    run([
      { dur: 0.25, tick: function (p) {
        World.setDoorOpen(b, p);
        Player.setPosition(startX + (targetX - startX) * p, y0, 'up');
      } },
      { dur: 0.4, start: function () { doorClip = World.doorRect(b); },
        tick: function (p, dt) { Player.scriptMove(0, -WALK * dt / 0.4, dt, 'up'); } },
      { dur: 0.25, tick: function (p) { fade = p; } },
      { dur: 0, end: function () {
        World.setDoorOpen(b, 0);
        doorClip = null;
        World.setScreen(w.room);
        Player.setPosition(Interior.SPAWN.x, Interior.SPAWN.y, 'up');
      } },
      { dur: 0.25, tick: function (p) { fade = 1 - p; } }
    ]);
  }

  // Haus verlassen: Abblende, Figur steht in offener Tür, tritt heraus, Tür schließt
  function leaveHouse(w) {
    var b = w.building;
    var outY = (b.y + b.h) * Render.TILE;
    run([
      { dur: 0.25, tick: function (p) { fade = p; } },
      { dur: 0, end: function () {
        World.setScreen(w.screen);
        World.setDoorOpen(b, 1);
        Player.setPosition(b.door * Render.TILE, outY - WALK, 'down');
        doorClip = World.doorRect(b);
      } },
      { dur: 0.25, tick: function (p) { fade = 1 - p; } },
      { dur: 0.4, tick: function (p, dt) { Player.scriptMove(0, WALK * dt / 0.4, dt, 'down'); },
        end: function () { Player.setPosition(b.door * Render.TILE, outY, 'down'); doorClip = null; } },
      { dur: 0.25, tick: function (p) { World.setDoorOpen(b, 1 - p); } }
    ]);
  }

  // Bildschirm weiterschieben (wie in klassischen 2D-Abenteuern),
  // seitlich (Ost/West) oder nach Süden/Norden
  function startSlide(edge) {
    var horiz = edge.dir === 'east' || edge.dir === 'west';
    var dir = (edge.dir === 'east' || edge.dir === 'south') ? 1 : -1;
    var fromX = Player.getX(), fromY = Player.getY();
    var toX = horiz ? (dir > 0 ? 0 : W - 16) : fromX;
    var toY = horiz ? fromY : (dir > 0 ? 0 : H - 16);
    slide = { from: World.getScreen(), to: edge.to, horiz: horiz, dir: dir, p: 0 };
    run([
      { dur: 0.6, tick: function (p, dt) {
        slide.p = p;
        // Position im gemeinsamen Koordinatensystem beider Bildschirme
        if (horiz) {
          var combined = fromX + ((toX + dir * W) - fromX) * p;
          Player.scriptMove(combined - Player.getX(), fromY - Player.getY(), dt, dir > 0 ? 'right' : 'left');
        } else {
          var combinedY = fromY + ((toY + dir * H) - fromY) * p;
          Player.scriptMove(fromX - Player.getX(), combinedY - Player.getY(), dt, dir > 0 ? 'down' : 'up');
        }
      } },
      { dur: 0, end: function () {
        World.setScreen(slide.to);
        Player.setPosition(toX, toY, dir > 0 ? (horiz ? 'right' : 'down') : (horiz ? 'left' : 'up'));
        slide = null;
      } }
    ]);
  }

  // --- Zeichnen ---------------------------------------------------------------
  function drawScene(now) {
    var ctx = Render.getCtx();
    var here = World.getScreen();
    if (slide) {
      // Die Spielfigur wird mit dem Bildschirm sortiert, in dem ihre Mitte liegt
      var ax = slide.horiz;
      var size = ax ? W : H;
      var cam = slide.dir * slide.p * size;
      var mid = ax ? Player.getX() + 8 : Player.getY() + 8;
      var inTo = slide.dir > 0 ? mid >= size : mid < 0;
      ctx.save();
      if (ax) ctx.translate(-cam, 0); else ctx.translate(0, -cam);
      World.drawGround(Render, now, slide.from);
      if (ax) ctx.translate(slide.dir * W, 0); else ctx.translate(0, slide.dir * H);
      World.drawGround(Render, now, slide.to);
      ctx.restore();
      ctx.save();
      if (ax) ctx.translate(-cam, 0); else ctx.translate(0, -cam);
      World.drawSorted(Render, slide.from, inTo ? [] :
        [{ y: Player.getY(), draw: function () { Player.draw(Render); } }]);
      if (ax) ctx.translate(slide.dir * W, 0); else ctx.translate(0, slide.dir * H);
      World.drawSorted(Render, slide.to, !inTo ? [] :
        [{ y: Player.getY(), draw: function () {
          Player.draw(Render, ax ? -slide.dir * W : 0, ax ? 0 : -slide.dir * H);
        } }]);
      ctx.restore();
      ctx.save();
      if (ax) ctx.translate(-cam, 0); else ctx.translate(0, -cam);
      World.drawOverlay(Render, now, slide.from);
      if (ax) ctx.translate(slide.dir * W, 0); else ctx.translate(0, slide.dir * H);
      World.drawOverlay(Render, now, slide.to);
      ctx.restore();
      return;
    }
    World.drawGround(Render, now);
    // Spielfigur, Gegner, Wächter und Herr Späth nach Tiefe mit den Objekten
    // (Häuser, Brunnen, Zaun …) zeichnen; Reihenfolge wie bisher bei gleicher Höhe
    var actors = [{ y: Player.getY(), draw: function () { Player.draw(Render); } }];
    if (World.isOutdoor() || Enemies.hasScreen(here))
      actors = actors.concat(Enemies.actors(Render, now, here));
    var bossDraw = Boss.of(here);
    if (bossDraw && here in BOSSES) actors.push({ y: -999, draw: function () { bossDraw.draw(Render, now); } });
    if (spaeth) actors.push({ y: spaeth.y, draw: function () { drawSpaeth(Render, now); } });
    World.drawSorted(Render, null, actors);
    World.drawOverlay(Render, now);
    if (chestSword) drawChestSword(Render, now);
    if (doorClip) {
      // Figur in der Türöffnung sichtbar halten (vor dem dunklen Flur)
      ctx.save();
      ctx.beginPath();
      ctx.rect(doorClip.x, doorClip.y, doorClip.w, doorClip.h);
      ctx.clip();
      Player.draw(Render);
      ctx.restore();
    }
  }

  // --- Aktionen von A und B: im HUD (Tastatur) und unter den Touch-Tasten ---
  // Wort für A, wenn die Figur vor etwas steht
  function actionWord(t) {
    if (!t) return '';
    if (t.action === 'rest') return 'Trinken';
    if (t.action === 'chest') return 'Öffnen';
    if (t.action === 'torch') return 'Entzünden';
    if (t.action === 'hebel') return 'Schalten';
    if (t.action === 'start') return 'Starten';
    if (t.action === 'testpage' || t.action === 'repeat' || t.action === 'abspann') return 'Lesen';
    if (/Schild|Tafel|Inschrift/.test(t.name)) return 'Lesen';
    return 'Reden';
  }

  // Aktuelle Belegung { a, b, dpad } je nach Spielzustand
  function currentActions(target) {
    if (title) {
      if (title.phase === 'confirm') return { a: 'Ja', b: 'Nein', dpad: false };
      return { a: saved ? 'Weiter' : 'Start', b: saved ? 'Neu' : '', dpad: false };
    }
    if (Abspann.isActive()) {
      return { a: Abspann.onLast() ? 'Ins Dorf' : 'Weiter',
               b: Abspann.onLast() ? '' : 'Überspringen', dpad: false };
    }
    if (repeatAsk) return { a: 'Ja', b: 'Nein', dpad: false };
    if (Merkbuch.isActive())
      return { a: Merkbuch.atStand() ? 'Code zeigen' : 'Schließen', b: 'Schließen', dpad: false };
    if (TaskUi.isActive()) return { a: 'Prüfen', b: TaskUi.isAbortable() ? 'Abbrechen' : '', dpad: false };
    if (TestPage.isActive()) return { a: TestPage.isExamples() ? 'Neue Zahlen' : 'Öffnen', b: TestPage.isExamples() ? 'Zurück' : 'Schließen', dpad: false };
    if (Dialog.isActive()) return { a: 'Weiter', b: '', dpad: false };   // kein Abbruch mit B
    return { a: actionWord(target), b: '', dpad: true };
  }

  // Tastenbelegung im HUD (nur am PC): kleine Schilder an Buch und Schwert,
  // darunter rechts die aktuelle Aktion von A und B
  function drawKeyHints(r, act) {
    var ctx = r.getCtx();
    var touch = Input.isTouch();
    if (!touch) {
      keyBadge(r, ctx, Render.WIDTH - 84, 'M');
      keyBadge(r, ctx, Render.WIDTH - 64, 'E');
    }
    // auf dem iPad stehen die Aktionen schon unter den Touch-Tasten
    if (touch) return;
    var parts = [];
    if (act.a) parts.push('Enter: ' + act.a);
    if (act.b) parts.push('Esc: ' + act.b);
    if (!parts.length) return;
    var text = parts.join('   ');
    var w = Font.width(text);
    var x = Render.WIDTH - 6 - w, y = 25;
    r.px(x - 3, y - 2, w + 6, 11, 'rgba(14,18,32,0.6)');
    Font.draw(ctx, text, x, y, '#f6f0e2');
  }

  // Tastenbuchstabe unten links an einem 16-px-Platz im HUD
  function keyBadge(r, ctx, slotX, letter) {
    var x = slotX - 3, y = 14;
    r.px(x, y, 9, 10, '#efe4c4');
    r.px(x + 1, y + 1, 7, 8, '#2e2a3e');
    Font.draw(ctx, letter, x + 5 - Math.ceil(Font.width(letter) / 2), y + 2, '#f6f0e2');
  }

  // --- Spielschleife mit zeitunabhängiger Bewegung -----------------------------
  var lastTime = null;

  function loop(now) {
    if (lastTime === null) lastTime = now;
    var dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;

    var target = null;
    if (title) updateTitle();
    if (Abspann.isActive()) {
      Abspann.update(dt, Input);
      var aact = currentActions(null);
      Input.setDpadVisible(false);
      Input.setLabels(aact.a, aact.b);
      drawScene(now);
      Abspann.draw(Render, now);
      drawKeyHints(Render, aact);
      Input.clearPressed();
      requestAnimationFrame(loop);
      return;
    }
    if (title) {
      // Auf dem Titelbild bleibt das Merkbuch zu (ein Tipp auf das
      // Buch-Symbol würde es sonst unsichtbar öffnen; nach dem Start wäre es offen)
      if (Merkbuch.isActive()) Merkbuch.close();
      var tact = currentActions(null);
      Input.setDpadVisible(false);
      Input.setLabels(tact.a, tact.b);
      drawScene(now);
      drawTitle(Render, now);
      Input.clearPressed();
      requestAnimationFrame(loop);
      return;
    }
    // Merkbuch geht jederzeit auf und zu, auch mitten in einer Aufgabe
    // (im Abspann bleibt es zu)
    if (!Abspann.isActive() && !repeatAsk && Input.pressed('book')) {
      Merkbuch.isActive() ? Merkbuch.close() : Merkbuch.open();
    }
    if (repeatAsk) {
      // Rueckfrage der Steintafel: A startet die Wiederholung, B bricht ab
      var askKey = repeatAsk.key;
      var ja = Input.pressed('a'), nein = Input.pressed('b');
      if (ja || nein) repeatAsk = null;
      if (ja) doRepeat(askKey);
    } else if (Merkbuch.isActive()) {
      Merkbuch.update(Input);
    } else if (TaskUi.isActive()) {
      TaskUi.update(dt, Input);
    } else if (TestPage.isActive()) {
      TestPage.update(Input);
    } else if (Dialog.isActive()) {
      Dialog.update(dt, Input);
    } else if (seq) {
      updateSeq(dt);
    } else if (spaethPhase === 'talk') {
      spaethAside();   // Gespräch ist beendet
    } else if (dietlQuizPending) {
      dietlQuizPending = false;
      startDietlQuiz();   // Gespräch mit Herrn Dietl beendet: jetzt die Frage
    } else if (finaleTalkPending && !Dialog.isActive()) {
      finaleTalkPending = false;
      startAbspann();     // Siegdialog des Grafen beendet: der Abspann läuft
    } else if (turnedNpc && !Dialog.isActive()) {
      // Gespräch beendet: Figur dreht sich zurück
      turnedNpc.facing = turnedNpc.baseFacing || 'down';
      turnedNpc = null;
    } else {
      Player.update(World, Input, dt);
      // Platten-Raeetsel: Betreten einer Druckplatte drueckt sie
      stepOnPlate(World.getScreen());
      // Linsenkammer: gegen den Linsenstein laufen schiebt ihn
      pushStone(dt, World.getScreen());
      // Gegner bewegen und Beruehrung pruefen (startet den Kampf)
      // (solange die Figur nach einem Fehler blinkt, startet kein Kampf)
      Enemies.update(World, dt, Player.getX(), Player.getY(),
        Player.isBlinking() ? null : startBattle);
      // Szene auslösen, bevor die Spielfigur das Dorf Richtung Osten verlässt
      // Boss im aktuellen Raum: Beruehrung startet die feste Aufgabenreihe
      var bossHere = BOSSES[World.getScreen()] ? World.getScreen() : null;
      var bossInst = bossHere ? Boss.of(bossHere) : null;
      if (bossInst && !bossInst.isDefeated() && !Player.isBlinking() &&
          Math.abs(Player.getX() + 8 - bossInst.def.cx) < 15 && Math.abs(Player.getY() + 8 - bossInst.def.cy) < 15) {
        if (!bossIntroDone[bossHere]) {
          // erst stellt sich der Wächter vor, danach (noch in Berührung) die Aufgabe
          bossIntroDone[bossHere] = true;
          Player.setPosition(Player.getX(), Player.getY());
          Dialog.open(BOSSES[bossHere].name, BOSSES[bossHere].intro);
        } else {
          startBossTask();
        }
      } else if (!spaethDone && !spaeth && World.getScreen() === 'ost' && Player.getX() >= 232) {
        startSpaeth();
      } else {
        target = World.talkTarget(Player.getX(), Player.getY(), Player.getFacing());
        if (target && Input.pressed('a')) {
          Player.setPosition(Player.getX(), Player.getY());   // Laufanimation anhalten
          if (target.action === 'testpage') {
            TestPage.open();   // Schild der Testseite für die Lehrkraft
          } else if (target.action === 'chest') {
            openChest();       // Rätsel-Truhe mit dem Schwert
          } else if (target.action === 'torch') {
            lightTorch(target.torch);   // Fackel-Rätsel vor dem Boss
          } else if (target.action === 'hebel') {
            Schaltwarte.schalte(target.hebel);   // Schaltwarte: Hebel weiterschalten
          } else if (target.action === 'start') {
            startTurbine();                      // Schaltwarte: Startschalter
          } else if (target.action === 'repeat') {
            // Steintafel: vor dem Finale schlaeft sie, danach Rueckfrage
            if (!finaleDone) {
              Dialog.open(target.name, textsFor(target));
            } else {
              repeatAsk = { key: target.dungeon };
            }
          } else if (target.action === 'abspann') {
            // Erinnerungstafel: Abspann erneut ansehen (erst nach dem Finale)
            if (finaleDone && abspannDone) Abspann.start(wappens, stats, null);
            else Dialog.open(target.name, textsFor(target));
          } else if (target.action === 'dietl') {
            target.npc.facing = faceToward(target.npc, Player.getX(), Player.getY());
            turnedNpc = target.npc;
            talkDietl();                // Herr Dietl im Versteck
          } else {
            if (target.action === 'rest') useRest(target);   // Rastquelle
            if (target.npc) {
              target.npc.facing = faceToward(target.npc, Player.getX(), Player.getY());
              turnedNpc = target.npc;
            }
            Dialog.open(target.name, textsFor(target));
            // Gehoerter Merksatz landet automatisch im Merkbuch
            if (target.merk && Merkbuch.add(target.merk)) saveGame();
          }
          target = null;
        }
        var w = World.checkWarp(Player.getX(), Player.getY(), Player.getFacing());
        var here = World.getScreen();
        var banned = bannActive(here);
        if (w && w.type === 'enter') enterHouse(w);
        else if (w && w.type === 'exit') leaveHouse(w);
        else if (w && w.type === 'dungeon') {
          if (banned) bannBlock(Player.getX(), Player.getY() + 6, 'down');
          else if (!w.room) {
            // Leuchtturm (Dungeon 2): verschlossen, bis der Dungeon gebaut ist
            Player.setPosition(Player.getX(), Player.getY(), 'down');
            Dialog.open('Tür', ['Die Tür ist fest verschlossen. Aus dem Leuchtturm dringt kein Licht.']);
          }
          else if (w.room === 'weingang' && !World.isWaterGateOpen()) {
            // Wassertor der Lagune (Dungeon 3): zu, bis der Wächter des Turms besiegt ist
            Player.setPosition(Player.getX(), Player.getY(), 'down');
            Dialog.open('Tor', ['Das Tor des Kraftwerks ist versiegelt – starr wie ein Lineal. Erst der Wächter des Turms kann das Siegel brechen.']);
          }
          else enterDungeon(w.room);
        } else if (w && w.type === 'warp') {
          // Öffnung nach vorn ist gebannt, zurück geht es immer
          if (banned && w.to.room === FORWARD[here]) bannBlock(Player.getX(), 2 * 16 + 4, 'down');
          else if (here === 'draetsel' && w.to.room === 'dboss' && !Raetsel.isSolved()) {
            // Gitter zum Boss bleibt zu, bis alle Fackeln richtig brennen
            Player.setPosition(Player.getX(), 2 * 16 + 4, 'down');
            Dialog.open('Gitter', ['Ein schweres Gitter versperrt den Weg. Entzünde zuerst die richtigen Fackeln.']);
          } else if (here === Linse.ROOM && w.to.room === 'lraetsel' && !Linse.isSolved()) {
            // Gitter zum Spiegelraum bleibt zu, bis der Linsenstein im Scheitel ruht
            Player.setPosition(Player.getX(), 2 * 16 + 4, 'down');
            Dialog.open('Gitter', ['Ein schweres Gitter versperrt den Weg. Schiebe zuerst den Linsenstein auf den Scheitel der Parabel ' + Linse.FORMEL + '.']);
          } else if (here === 'lraetsel' && w.to.room === 'lboss' && !Spiegel.isSolved()) {
            // Gitter zum Boss bleibt zu, bis alle Spiegel im Licht stehen
            Player.setPosition(Player.getX(), 2 * 16 + 4, 'down');
            Dialog.open('Gitter', ['Ein schweres Gitter versperrt den Weg. Lenke zuerst das Licht auf die richtigen Spiegel.']);
          } else if (here === 'wraetsel' && w.to.room === 'wboss' && !Schaltwarte.isSolved()) {
            // Gitter zur Turbinenhalle bleibt zu, bis die Turbine laeuft
            Player.setPosition(Player.getX(), 2 * 16 + 4, 'down');
            Dialog.open('Gitter', ['Ein schweres Gitter versperrt den Weg. Bringe zuerst in der Schaltwarte die Turbine zum Laufen.']);
          } else if (here === 'splatten' && w.to.room === 'sboss' && !Platten.isSolved()) {
            // Gitter zum Boss bleibt zu, bis beide Nullstellen-Platten gedrueckt sind
            Player.setPosition(Player.getX(), 2 * 16 + 4, 'down');
            Dialog.open('Gitter', ['Ein schweres Gitter versperrt den Weg. Tritt zuerst auf die Platten der Nullstellen.']);
          } else roomWarp(w);
        } else {
          var edge = World.checkEdge(Player.getX(), Player.getY());
          if (edge && banned && edge.dir === 'east') bannBlock(W - 16 - 8, Player.getY(), 'left');
          else if (edge && banned && edge.dir === 'south') bannBlock(Player.getX(), H - 16 - 8, 'up');
          else if (edge) startSlide(edge);
        }
      }
    }

    drawScene(now);
    if (!slide) drawBann(Render, now);
    Fx.draw(Render, now, World.isOutdoor());
    if (target) Dialog.drawHint(Render, target.hintX, target.hintY, now);
    Hud.draw(Render);
    Sword.draw(Render);
    Merkbuch.drawHud(Render);
    // Belegung von A/B: im HUD (PC) und unter den Touch-Tasten (iPad)
    var act = currentActions(target);
    Input.setDpadVisible(act.dpad);
    Input.setLabels(act.a, act.b);
    if (!TaskUi.isActive() && !Merkbuch.isActive() && !TestPage.isActive()) drawKeyHints(Render, act);
    Dialog.draw(Render);
    if (repeatAsk) drawRepeatAsk(Render);
    TestPage.draw(Render);
    // Boss-Herzen unter der Aufgabenbox (sonst verdecken sie die Eingabefelder)
    var bossFight = Boss.of(World.getScreen());
    if (bossFight && bossFight.isFighting()) bossFight.drawHearts(Render);
    TaskUi.draw(Render);
    Merkbuch.draw(Render);
    if (fade > 0) Render.px(0, 0, W, H, 'rgba(0,0,0,' + fade + ')');
    Input.clearPressed();

    requestAnimationFrame(loop);
  }

  setupStandPage();   // Spielstand-Seite im Merkbuch (Schritt 4)

  requestAnimationFrame(loop);
})();
