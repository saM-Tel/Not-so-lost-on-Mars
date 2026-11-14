// WHAT:    Page-side wrapper that starts the route worker and turns its messages into promises (F3, F4).
// IN:      A loaded site; route and tether requests.
// OUT:     Promises of routes, statistics and cost-to-home.
// USED BY: src/main.ts, src/ui/routePanel.ts, src/safety/tether.ts.
// RULES:   The page never runs a search itself.
// TRAPS:   PITFALLS 6.
// OWNER:   Role B.
