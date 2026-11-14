// WHAT:    Distance, time, energy, oxygen and the elevation profile along a route, for all three cases (F3).
// IN:      A route; the grid; the three cost cases.
// OUT:     Totals with ranges in SI units; profile points; the weakest stretch for route confidence.
// USED BY: src/route/worker.ts, src/ui/routePanel.ts, src/ui/profileChart.ts.
// RULES:   The route is chosen on the expected case; all three cases are reported along that same route.
// TRAPS:   PITFALLS 6, 7.
// OWNER:   Role B.
