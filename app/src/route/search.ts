// WHAT:    Least-effort route between two cells, and cost-to-home for every cell (F3, F4).
// IN:      A grid; start and end cells; a cost case.
// OUT:     A list of cells for a route; an array of energy and time to reach home from every cell.
// USED BY: src/route/worker.ts.
// RULES:   Out and back are computed separately. Cost-to-home uses the cost of stepping towards home. Any search estimate never exceeds the true cost.
// TRAPS:   PITFALLS 6.
// OWNER:   Role B.
