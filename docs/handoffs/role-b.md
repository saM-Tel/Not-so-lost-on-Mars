# Role B handoff

## Sat 14 Nov 15:40, role B work by Joseph, with Claude Code

Done: the tether (F4, first version). The worker sends the quickest time home from every cell for the cautious and expected cases; `safety/tether.ts` turns that into a picture; the card has the walk-back limit and a slider for time since leaving home, and says whether the planned walk stays inside. The card is narrower and folds away with "Hide".
Not done: energy and oxygen budgets; a reserve; suit settings the person can change (mass, speed, slope limit); the route and tether settings in the address bar (F7).
Broken or risky: the tether rule is ours, built from three published figures (DECISIONS, proposed). At Bright Angel with 1 hour allowed, 72% of the box is inside the cautious tether, and with 30 minutes 21%; the longest cautious walk home from anywhere reachable is 175 minutes. The open card hides the target when it is near the middle of the view. Seen only in a scripted browser.
Next: F2, the layer panel: slope as a map layer with its record, and an information card for each layer.
Files: app/src/safety/budget.ts, tether.ts, tether.test.ts; ui/safetyPanel.ts, routePanel.ts; route/search.ts, worker.ts, messages.ts, client.ts; map/routeLayer.ts; style.css; the folder guides
Other roles need to know: C, two ideas from Joseph are logged as optional in SPEC under Stretch: orbiter passes for communications, and day and night along the walk.
Checks: `npm run check` passes: types, 56 tests, build. Scripted browser at Bright Angel: tether search 1.35 s; a 650 m walk east is 19 min from home (inside); the walk up the north-west slope is 36 min from home (inside); with 7 h 35 min gone the card says there is not enough time.

## Sat 14 Nov 14:40, role B work by Joseph, with Claude Code

Done: the route is on screen (F3, first version). Opening Bright Angel starts the route worker, shades keep-out ground red, marks home, and a click on the ground draws the walk out (blue) and back (yellow, dashed) with a table of distance, climb, time and energy for three cases and a list of what the numbers rest on.
Not done: several targets; oxygen; elevation profile; route confidence; footing; smoothing; the route in the address bar (F7); the tether (F4).
Broken or risky: home is the site marker as a stand-in; the site config has no home or targets. Tried only through a scripted browser that fires a click on the dev server, not by a person and not on the built site. The route card covers the top left of the map.
Next: the tether (F4): a cost-to-home array from the worker for the cautious case, a suit budget with sources, and the boundary line on the map.
Files: app/src/route/worker.ts, messages.ts, client.ts; map/routeLayer.ts; ui/routePanel.ts, format.ts, format.test.ts; data/loadSite.ts; main.ts; style.css; the folder guides
Other roles need to know: two real results from Bright Angel for the story. East along the valley floor: 650 m each way, about 14 min each way. North-west up the slope: 1.15 km and 142 m of climb out in 1 h 30 min (56 min to 2 h 0 min), 28 min back.
Added at 14:55: zooming in on a site by hand selects it (`map/zoomSelect.ts`), from zoom 4 when the site is in the middle quarter of the view. Tried with scripted camera jumps only, not a real wheel or pinch.
Checks: `npm run check` passes: types, 49 tests, build. Scripted browser: whole-grid search 1.0 to 1.3 s, route answer 0.1 s, keep-out 19% of the box, 80% reachable.

## Sat 14 Nov 13:45, role B work by Joseph, with Claude Code

Done: the site is public at https://sam-tel.github.io/Not-so-lost-on-Mars/ (F8). Route core built and tested in `src/route/`: `cost.ts` (speed and energy by slope, three cases), `grid.ts`, `search.ts` (keep-out, routes from and to home for every cell), `stats.ts`. `contract.ts` has the grid definition.
Not done: nothing of the route is on screen. `worker.ts`, `client.ts`, loading the grid files in `loadSite.ts`, `routeLayer.ts`, `routePanel.ts`, a home position and targets. Oxygen, footing, smoothing. README.
Broken or risky: the search has only run on small test grids, not on the real 791 x 750 grid, so its speed is unknown. The pairing of published figures with the three cases is ours (DECISIONS, proposed). The equations were read from the SEXTANT planner's source code, not from the two papers it credits.
Next: load the grids, run the search in the worker on the real grid and time it, then draw a route from home to a clicked point with its numbers.
Files: app/src/route/cost.ts, grid.ts, search.ts, stats.ts, route.test.ts, route/AGENTS.md, app/src/data/contract.ts, data/AGENTS.md
Other roles need to know: C, the three cases and their sources are in `cost.ts` and REFERENCES; the wording on screen should say "Apollo-based model applied to Mars".
Checks: `npm run check` passes: types, 41 tests, build. Public site opened in a scripted browser: Bright Angel loads in 1.6 s, no failed requests.

## Sat 14 Nov 12:00, role B work by Joseph, with Claude Code

Done: scale bar moved above the credit line (it overlapped). Deploy workflow added: `.github/workflows/deploy.yml` runs `npm ci` and `npm run check`, then publishes `app/dist` to GitHub Pages. `package-lock.json` refreshed, because `npm ci` failed on the committed one.
Not done: GitHub Pages is not switched on, so nothing is public yet. README. Overlays, layer panel, route planner.
Broken or risky: the workflow has not run successfully yet; its deploy step will fail until a repository admin sets Settings, Pages, Source to "GitHub Actions". The earlier note that the site sat off-centre was wrong: that screenshot was taken mid-flight. A scripted browser that waits in real time shows it centred, tilted 55 degrees, with relief.
Next: once Pages is on, open the public link in a private window and time the load (F1, F8 checks). Then F2 once the pipeline writes slope.
Files: app/src/style.css, app/package-lock.json, .github/workflows/deploy.yml, .github/AGENTS.md, .github/CLAUDE.md
Other roles need to know: every push to main now starts a build on GitHub. A push that fails `npm run check` publishes nothing.
Checks: `npm run check` passes: types, 29 tests, build; `npm ci` passes from the new lock file in a clean folder. Built site is 24.7 MB.

## Sat 14 Nov 11:35, role B work by Joseph, with Claude Code

Done: checked the committed F1 app code against the built Bright Angel site. `#site=bright-angel` loads the site and shows the 25 cm image on the ground, tilted, with the details card and a scale bar. No app code changed.
Not done: deployment to GitHub Pages (F8); overlays, layer panel, route planner.
Broken or risky: in a headless Edge screenshot the site sits to the right of the view's centre and is cut off at the right edge, and the scale bar's label overlaps the credit line. Joseph then opened the dev server in his own browser at 11:45 and reported it looks good; the terrain heights on screen were not measured against anything. Not tried on a phone, or in Firefox or Safari.
Next: fix the framing and the scale bar overlap; then deploy (F8).
Files: none
Other roles need to know: `npm install` on this laptop rewrote `package-lock.json` (npm 11.19); the change was discarded, not committed.
Checks: `npm run check` passes: types, tests, build.

## Sat 14 Nov 10:01, role B work by the team owner, with Claude Code

Done: the app opens on a turning Mars globe with a column, a name and a pulse at each of nine sites; clicking a column, a name or a list entry flies there and shows a details card with sources; "All sites" flies back; `#site=<id>` in the address opens that site (F14, part of F7). Mars constants and geometry in `src/mars/`.
Not done: opening a built site's own map (F1); every other panel; deployment to GitHub Pages (F8). Most files under `src/` still hold only their header.
Broken or risky: nothing known. The interface text is a first draft for role C to rewrite. Not tried on a phone or in Firefox or Safari.
Next: deploy the globe to GitHub Pages so there is a public link, then `siteLayers.ts` for Bright Angel's image and terrain once the pipeline writes them.
Files: app/src/main.ts, style.css, map/mapView.ts, map/siteMarkers.ts, map/flight.ts, ui/sitePicker.ts, ui/urlState.ts, data/contract.ts, data/layers.ts, data/loadSites.ts, mars/constants.ts, mars/geometry.ts, app/run-tests.mjs
Other roles need to know: on Windows use `npm run check`, not `npx vitest`; see the app guide's known issues. MapLibre is version 6: no default export, and its worker address is set in `mapView.ts`.
Checks: `npm run check` passes: types, 23 tests, build. Seen working in headless Edge on the dev server: opening view, list click, marker click, back to all sites, site link. Not tested: the built site under the repository address, touch, keyboard.
## Sat 14 Nov 10:16, role B work by the team owner, with Claude Code

Done: F1 app code written (uncommitted): `loadSite.ts`, `siteLayers.ts` (WebP + `raster-dem` with `baseShift` and 1.876 height scaling), `flyIntoSite()`, Mars `scaleBar.ts` (zoom >= 7), and `main.ts` wiring.
Not done: browser verification of Bright Angel 3D terrain/image (blocked waiting on pipeline output); overlay layers (`layers.json` overlays), route worker/UI (F3/F4), deployment to GitHub Pages (F8).
Broken or risky: `loadSite.ts` requires `terrainHeightM.lowest` in `site.json`, and `app/public/data/bright-angel/` does not exist yet. Built-site rendering and `baseShift` in MapLibre 6 are untested in the browser.
Next: wait for or re-run Role A's `build_site.py ../sites/bright-angel.yaml`, verify Bright Angel 3D view + scale bar in headless Edge, commit uncommitted F1 changes, then deploy globe/F1 to GitHub Pages.
Files: app/src/main.ts, style.css, data/contract.ts, data/loadSite.ts, map/siteLayers.ts, map/scaleBar.ts, map/scaleBar.test.ts, map/flight.ts, map/siteMarkers.ts, mars/geometry.ts, mars/geometry.test.ts, map/AGENTS.md, data/AGENTS.md, src/AGENTS.md
Other roles need to know: Role A must re-run `build_site.py` after killing any leftover pre-edit run so `site.json` includes `terrainHeightM`. Update `docs/STATUS.md` and `docs/AI_USE.md` before pushing.
Checks: `npm run check` passes (`tsc --noEmit`, 4 test files / 29 tests, `vite build`). Not browser-tested since F1 changes.