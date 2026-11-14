// WHAT:    Loads one built site: site.json, layers.json, routing grids as typed arrays, and vectors (F1 to F4).
// IN:      A site id; files under public/data/<site id>/.
// OUT:     The site in memory, or a clear reason why a file is missing.
// USED BY: src/main.ts, src/map/siteLayers.ts, src/route/client.ts.
// RULES:   Never reads from the team data server. A missing optional file switches its feature off and says why.
// TRAPS:   PITFALLS 10.
// OWNER:   Role B.
