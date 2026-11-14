# Role B handoff

## Sat 14 Nov 10:01, role B work by the team owner, with Claude Code

Done: the app opens on a turning Mars globe with a column, a name and a pulse at each of nine sites; clicking a column, a name or a list entry flies there and shows a details card with sources; "All sites" flies back; `#site=<id>` in the address opens that site (F14, part of F7). Mars constants and geometry in `src/mars/`.
Not done: opening a built site's own map (F1); every other panel; deployment to GitHub Pages (F8). Most files under `src/` still hold only their header.
Broken or risky: nothing known. The interface text is a first draft for role C to rewrite. Not tried on a phone or in Firefox or Safari.
Next: deploy the globe to GitHub Pages so there is a public link, then `siteLayers.ts` for Bright Angel's image and terrain once the pipeline writes them.
Files: app/src/main.ts, style.css, map/mapView.ts, map/siteMarkers.ts, map/flight.ts, ui/sitePicker.ts, ui/urlState.ts, data/contract.ts, data/layers.ts, data/loadSites.ts, mars/constants.ts, mars/geometry.ts, app/run-tests.mjs
Other roles need to know: on Windows use `npm run check`, not `npx vitest`; see the app guide's known issues. MapLibre is version 6: no default export, and its worker address is set in `mapView.ts`.
Checks: `npm run check` passes: types, 23 tests, build. Seen working in headless Edge on the dev server: opening view, list click, marker click, back to all sites, site link. Not tested: the built site under the repository address, touch, keyboard.
