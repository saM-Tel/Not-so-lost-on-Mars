// WHAT:    Loads the list of every site for the globe (F14).
// IN:      public/data/sites.json.
// OUT:     Site records: id, name, mission, readiness level, position, what data exists, whether it is built.
// USED BY: src/main.ts, src/map/siteMarkers.ts, src/ui/sitePicker.ts.
// RULES:   A record with no cited position is rejected, not guessed.
// TRAPS:   PITFALLS 2, 4.
// OWNER:   Role B.
