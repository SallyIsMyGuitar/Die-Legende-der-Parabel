// config.js: Spielwerte an einer Stelle, damit sie beim Testen leicht
// angepasst werden koennen (Herzen, Herz-Drops, Kampf, Animationen).
var Config = {
  HEARTS_MAX: 4,          // volle Herzen
  HEART_DROP_EVERY: 2,    // jeder n-te Sieg im ersten Versuch laesst ein Herz fallen
  ENEMY_COOLDOWN: 1.5,    // Sekunden nach einem Kampf ohne neue Beruehrung
  KNOCKBACK: 24,          // Pixel, die die Figur nach einem verlorenen Kampf zurueckweicht
  KNOCKBACK_TIME: 0.2,    // Dauer des Rueckstosses in Sekunden
  PLAYER_BLINK: 1.0,      // Sekunden, die die Figur nach einem Fehler blinkt (ohne neuen Kampf)
  TASK_CLOSE_TIME: 0.25   // Sekunden, in denen die Aufgabenbox ausblendet
};
