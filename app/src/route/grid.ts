// WHAT:    The routing grid: indexing, neighbours, and step lengths from the corrected cell spacing (F3, F4).
// IN:      Grid definition from site.json; height, slope and keep-out arrays.
// OUT:     Row and column helpers; step length in metres for each direction; longitude and latitude of a cell.
// USED BY: src/route/search.ts, src/route/smooth.ts, src/safety/tether.ts.
// RULES:   Cells are narrower east to west than north to south. Keep-out and no-data cells are never entered.
// TRAPS:   PITFALLS 4, 6.
// OWNER:   Role B.
