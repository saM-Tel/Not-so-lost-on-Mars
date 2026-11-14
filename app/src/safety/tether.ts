// WHAT:    The tether: the boundary where the cost to get home equals what is left (F4).
// IN:      Cost-to-home arrays for the cautious and expected cases; the remaining budget.
// OUT:     Boundary lines as longitude and latitude; whether a route leaves the boundary and where.
// USED BY: src/map/routeLayer.ts, src/ui/safetyPanel.ts.
// RULES:   Protection uses the cautious case. The boundary shrinks as elapsed time rises.
// TRAPS:   PITFALLS 6, 7.
// OWNER:   Role B.
