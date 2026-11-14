// WHAT:    Real rover photos taken near points on the route (F6).
// IN:      public/data/<site id>/photos.json; the route.
// OUT:     Image elements with sol, Earth date, camera and credit.
// USED BY: src/ui/routePanel.ts.
// RULES:   No photo is shown further from where it was taken than the stated limit. Ordinary image elements only.
// TRAPS:   PITFALLS 2, 10.
// OWNER:   Role B.
