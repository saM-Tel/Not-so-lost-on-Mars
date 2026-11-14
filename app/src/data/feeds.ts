// WHAT:    Fetches the live NASA space-weather feeds, falling back to the saved snapshot (F5).
// IN:      NASA DONKI addresses; public/data/<site id>/space-weather.json.
// OUT:     Forecast records with issue time, fetch time and whether they are live or a snapshot.
// USED BY: src/ui/weatherBanner.ts, src/safety/storm.ts.
// RULES:   Always says which of live or snapshot is shown. A forecast is never called a measurement.
// TRAPS:   PITFALLS 8, 10.
// OWNER:   Role B.
