// WHAT:    Removes the staircase from a route, then the cost is recomputed along the smoothed path (F3).
// IN:      A list of cells; the grid.
// OUT:     A shorter list of points that still avoids keep-out cells.
// USED BY: src/route/worker.ts.
// RULES:   A smoothed route never crosses a keep-out or no-data cell.
// TRAPS:   PITFALLS 6.
// OWNER:   Role B.
