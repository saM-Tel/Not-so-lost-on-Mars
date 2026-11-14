// WHAT:    Web Worker entry: receives grids and requests, runs the route search and cost-to-home, posts results (F3, F4).
// IN:      Messages from src/route/client.ts.
// OUT:     Messages with routes, statistics and cost-to-home arrays.
// USED BY: src/route/client.ts.
// RULES:   No page access. Typed arrays are transferred, not copied. A route answers in under 3 seconds.
// TRAPS:   PITFALLS 6.
// OWNER:   Role B.
