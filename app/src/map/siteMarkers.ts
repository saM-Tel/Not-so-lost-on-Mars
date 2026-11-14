// WHAT:    Draws a tall column, a name and a pulse at each landing site on the globe, and reports clicks (F14).
// IN:      Site records from src/data/loadSites.ts.
// OUT:     Map layers and markers; a callback with the clicked site id.
// USED BY: src/main.ts.
// RULES:   Colour shows readiness level and is never red. Columns shrink as the view zooms in. Positions come only from sites.json.
// TRAPS:   PITFALLS 3, 11.
// OWNER:   Role B.
