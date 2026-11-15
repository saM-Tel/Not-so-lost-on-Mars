# Role B handoff

## Sun 15 Nov 02:30, role B work by the team owner, with Claude Code. START HERE, Joseph

Done (not committed yet; the owner decides): (1) F18 orbiters: an orbiter running out of predictions no longer blanks the walk; a link minute counts as known only while a relay orbiter has data, an imaging minute only while a camera orbiter has; after the saved window ends (MRO, 30 Nov 12:46 UTC, a limit of Horizons itself) the orbit panel and globe replay that window, labelled with its real dates (`predictionWindow`, `predictionClock` in `data/orbiters.ts`); Mars Express no longer listed as both counted and not counted. (2) `pwa/sw.js`: a new deploy's worker takes over at once; site data other than tiles is network-first, so a new site.json never meets an old grid; failed cache saves no longer lose the response. `ui/install.ts` reloads a page once when that happens. (3) `route/client.ts`: a worker error rejects the request it names; an error naming none rejects everything and refuses later requests.
Not done: everything in your working files was left alone and written up as S0 to S24 in REVIEW_QUEUE (newest section). Start with S0: `planTo` and `planVia` in `routePanel.ts` need a `.catch`, or a failed route still hangs the card.
Broken or risky: nothing seen in a browser. The globe replays with no margin and the panel with 48 h, so in a replay they show different (each labelled) moments. `walkThrough.ts` still uses `Date.now()` for relays, so after 30 Nov its visor says "link: no prediction" (S17); use `predictionClock`. The replay note has class `orbit__replay` with no style yet.
Next: S0, then S1 and S9 to S11; then open "Link and view from orbit" and the globe dots in a browser.
Files: app/src/data/orbiters.ts (+test), ui/orbitPanel.ts, map/orbiters.ts, pwa/sw.js, ui/install.ts, route/client.ts (+ new client.test.ts), route/worker.ts, route/messages.ts, AGENTS.md indexes.
Other roles need to know: A, `build_orbiters.py` skips its longitude check silently if Horizons' wording changes (S23); no pipeline `.venv` on the owner's laptop, so not changed.
Checks: `npm run check` passes: types, 102 tests (12 new), build. pytest not run (no .venv here).

## Sun 15 Nov 00:28, role B work by Joseph, with Claude Code

Done: (1) the route planner failed to start at every site since Saturday 21:52: `ui/routePanel.ts` drew the stops list before `stops`, `addingStops`, `shownStops` and `planVia` were declared. Declarations moved up; `main.ts` now removes a site's layers even when the planner fails to start. (2) Interface pass: on screens 1,100 px and wider the walk card is a column on the right (`body.has-walk`), the map sits between it and the side panel, and the toolbar moves with the map; on a phone the card starts folded; the credit line is one line; scroll bars and links match the theme; the stops list and margin chart have styles. (3) Saturday evening: review items R1 to R8, R13 to R19 (see REVIEW_QUEUE, Done).
Not done: the evening's features have still not been tried one by one (several stops, margin chart, orbit panel, walk-through, first person, orbiters on the globe); tablet and helmet views not reworked; the level 2 sites not opened since the layout change.
Broken or risky: the walk card is now a child of the page, not of the map, so anything that assumed it sits inside the map box should be checked (the tablet and helmet views hide it; first person hides it). The headless test browser on this laptop draws no frames when the screen is asleep unless started with `--disable-gpu`.
Next: open each part of the walk column and the walk-through in the browser and fix what breaks; then batch 3 data with role A; then the backup video.
Files: app/src/ui/routePanel.ts, app/src/main.ts, app/src/style.css
Other roles need to know: C, screenshots for the project page can be taken now: the layout holds at 1,400 px.
Checks: `npm run check` passes: types, 90 tests, build. Seen in a scripted browser on the dev server at 1,400 x 900 and 390 x 800: site opens with no note, walk to Cheyava Falls planned, three columns, folded card on the phone.

## Sat 14 Nov 16:55, role B handover from the team owner to Joseph, with Claude Code. START HERE

Done: everything in the 16:05 entry below, plus the link-to-Earth line (`ui/earthLink.ts`), route export as GeoJSON and "Move the rover" (`ui/routePanel.ts`), and field-view fixes (helmet only when its photo loads; map resize on a view change). All pushed.
Not done: a person trying the afternoon's panels; review items R1 to R20.
Broken or risky: a read-only review found real bugs, logged as R1 to R20 in docs/REVIEW_QUEUE.md with the full text in docs/reviews/2026-11-14-app-review.md. The worst: the tether verdict uses the quickest way home, not the planned one (R3, confirmed); the tether may not redraw on 3D ground when the slider moves (R1, check first); the tablet stays on "Working out the walk…" after a refused target (R6).
Next, in order: (1) `cd app`, `npm install`, `npm run build`, `npm run preview`; open Bright Angel and try every panel, noting what breaks; (2) fix R1 to R20 group by group as the queue lists them, `npm run check` after each; (3) push, so the public site updates; (4) help with the backup video by 23:00.
Files: app/src/ui/routePanel.ts (most of the route card), modes.ts, map/routeLayer.ts, siteLayers.ts, overlays.ts, approach.ts, main.ts, style.css
Other roles need to know: the service worker runs only in the built site; after a new build, close every tab of it and reopen. Two old dev servers may still be running on port 5173 on the owner's laptop.
Checks: tsc and 76 tests pass; the production build succeeds; seen in a browser only by the owner, briefly.

## Sat 14 Nov 16:05, role B work by the team owner, with Claude Code

Done (coded, mostly not opened in a browser): approach layers; installable app (manifest, icon, service worker, Install button); tether slider via a canvas source and a drawing-density cap; hero scenario in the route card (targets, opens on Cheyava Falls); suit slope limit; elevation profile; oxygen; route confidence line; rover drive comparison; storm drill; when-to-go panel with Mars24 time, Sun and computed shading; field tablet and helmet concept views.
Not done: layer choices in the link; route through several targets in a row; photos by direction of travel.
Broken or risky: the route card is long now; the mode switch and install button share the top right. The service worker only runs in the built site.
Next: open the app (`npm run build`, `npm run preview`) and try every panel; fix what breaks; then push.
Files: app/src/ (main.ts, map/approach.ts, siteLayers.ts, routeLayer.ts, overlays.ts, mapView.ts; ui/routePanel.ts, safetyPanel.ts, timeSlider.ts, profileChart.ts, modes.ts, install.ts; safety/oxygen.ts, storm.ts; mars/time.ts, sun.ts), app/pwa/, app/public/manifest.webmanifest, app/public/icons/, app/vite.config.ts, style.css
Other roles need to know: commits are local only (owner's choice); the public site is behind.
Checks: tsc passes; 76 tests pass (4 new for Mars time); the zoom-in at Bright Angel was seen in headless Chrome only.

## Sat 14 Nov 13:56, role C work by Joseph, with Claude Code

Done: `README.md` at the top of the repository, for judges and visitors: what Tether is, what you can do at Bright Angel, the three promises and the grades, the check against the rover, a table of data sources, an open list of what it does not do yet, how to run the app and the pipeline, and how AI was used.
Not done: a licence file; the project page text, the video and the rest of SUBMISSION_CHECKLIST.
Broken or risky: the README says AI wrote most of the code and that not every line has been reviewed by a person. That is true today; the team should read it and decide whether to say more. It does not say where the idea came from, because this session does not know.
Next: open the public site after this push and confirm it matches; then the should-haves.
Files: README.md
Other roles need to know: C, the README is a first draft in your area. Change it freely.
Checks: every number in it was copied from this session's build and test output.

## Sat 14 Nov 13:53, roles A and B work by Joseph, with Claude Code

Done: photos along the route (F6). `pipeline/photos.py` reads NASA's raw image feed and indexes 401 left navigation camera photos at 111 of the 116 rover stops in the box. The route card shows up to six taken within 30 m of the walk, with full captions and a link to NASA's page. Sol numbers now turn into Earth dates from the moment sol 0 began, worked out from the feed itself, in place of a landing date taken from memory.
Not done: choosing photos by direction of travel; a larger view on click (the link opens NASA's page).
Broken or risky: the mast azimuth's reference frame is not confirmed, so no photo is labelled with a compass direction. Some frames still show part of the rover. Pictures load from mars.nasa.gov at view time.
Next: the README (F8), then a hero scenario for the Bright Angel link.
Files: pipeline/photos.py, vectors.py, config.py, build_site.py, test_terrain.py; sites/bright-angel.yaml; app/src/data/photos.ts, photos.test.ts; ui/photoStrip.ts, routePanel.ts; style.css; app/public/data/bright-angel/
Other roles need to know: C, the walk east along the valley floor (`#site=bright-angel&to=77.31589,18.49948`) passes four rover stops and shows six photos from 20 to 24 June 2024. Every must-have feature now has a first working version.
Checks: `npm run check` passes: types, 72 tests, build. `pytest -q` passes, 44 tests. Full site build with real data, exit 0, 16.3 MB.

## Sat 14 Nov 13:43, roles A and B work by Joseph, with Claude Code

Done: dose and space weather (F5). `safety/dose.ts` gives the dose on a walk from two rates Curiosity measured at Gale; the route card shows it. `pipeline/build_space_weather.py` saves a snapshot of NASA's forecasts for Mars; `data/feeds.ts` reads NASA live and falls back to the snapshot; `ui/weatherBanner.ts` shows the latest forecast with its window.
Not done: terrain shielding of dose; storm mode (F10); a banner state for a forecast still ahead has only been unit-tested, because today's one forecast has passed.
Broken or risky: NASA's public demo key allows about 10 requests an hour from one address, so judges will often see the snapshot; refresh it before submitting. The absorbed-dose rate (0.210 plus or minus 0.040 mGy a day) is as recorded in DATA_CATALOG from Hassler 2014, not re-read today; the dose-equivalent figures were read today in Guo 2015.
Next: photos along the route (F6), then the README (F8).
Files: app/src/safety/dose.ts, dose.test.ts; data/feeds.ts; ui/weatherBanner.ts, weatherBanner.test.ts, routePanel.ts, format.ts; main.ts; style.css; pipeline/build_space_weather.py, test_space_weather.py; app/public/data/space-weather.json
Other roles need to know: C, real numbers for the story: a 2.2 km round trip at Bright Angel is about 58 microsieverts (18 to 130). The forecast on screen today: issued 11 Nov, a glancing blow reaching Mars between 13 Nov 05:00 and 19:00 UTC.
Checks: `npm run check` passes: types, 68 tests, build. `pytest -q` passes, 43 tests. Built app opened in a scripted browser: banner read live from NASA, dose line shown.

## Sat 14 Nov 13:31, role B work by Joseph, with Claude Code

Done: the shareable link (F7). `urlState.ts` reads and writes the walk's target (`to=lon,lat`), the walk-back limit (`back=` minutes, left out at the default) and time since leaving home (`t=` minutes). The route card keeps the address bar in step and restores a walk from a link once, at the site the link names.
Not done: a chosen hero scenario for the Bright Angel link; layer choices in the link; the first-time-visitor check.
Broken or risky: a target is stored to 5 decimal places and snaps to its 4 m cell's centre when restored, so the address changes slightly on first load and is stable after that. Tried in a scripted browser on the built app only.
Next: slope against rover tilt (F9, pipeline), then dose and space weather (F5).
Files: app/src/ui/urlState.ts, urlState.test.ts, routePanel.ts, safetyPanel.ts; main.ts; ui/AGENTS.md
Other roles need to know: C, a link for the video can now carry the whole scenario. Example that shows a warning: `#site=bright-angel&to=77.29271,18.50596&back=30&t=60`.
Checks: `npm run check` passes: types, 59 tests, build. The example link restored the 2.22 km round trip, the 30-minute limit, one hour gone and the "leaves the tether" verdict.

Note, 14 Nov 13:25: the entry times from 11:41 to 13:15 below were first written from estimates that ran up to two and a half hours ahead of the clock. They now show the commit times.

## Sat 14 Nov 13:30, role B work by Joseph, with Claude Code

Done: the layer panel (F2). Opening a built site adds a "Layers" section under the site's name with a row for each layer: switch, opacity, legend, and a card built from the layer's record. Slope is drawn from the routing grid with the viridis ramp, off at first; the rover's path and stops are bluish green; keep-out ground has its own row and record, grade C.
Not done: geology; cards for predictions; the layer choices in the address bar.
Broken or risky: slope and keep-out shading mix to brown when both are on. Seen in a scripted browser on the built app, not by a person.
Next: F7, the route and settings in the address bar.
Files: app/src/map/overlays.ts, legend.ts, siteLayers.ts, routeLayer.ts; ui/layerPanel.ts, infoCard.ts, sitePicker.ts, routePanel.ts; data/contract.ts; main.ts; style.css; the folder guides
Other roles need to know: Joseph asked at about 13:25 for work to carry on task by task without waiting for replies, with each task committed and pushed.
Checks: `npm run check` passes: types, 56 tests, build.

## Sat 14 Nov 13:15, role B work by Joseph, with Claude Code

Added at 13:30: a "Full map" button under the zoom buttons hides the side panel so the map has the whole screen, asked for by Joseph because the phone layout leaves too little map. Tried in a scripted browser at 390 x 800: the map grows from 390 x 440 to 390 x 800 and back. Not tried on a real phone.

Done: the tether (F4, first version). The worker sends the quickest time home from every cell for the cautious and expected cases; `safety/tether.ts` turns that into a picture; the card has the walk-back limit and a slider for time since leaving home, and says whether the planned walk stays inside. The card is narrower and folds away with "Hide".
Not done: energy and oxygen budgets; a reserve; suit settings the person can change (mass, speed, slope limit); the route and tether settings in the address bar (F7).
Broken or risky: the tether rule is ours, built from three published figures (DECISIONS, proposed). At Bright Angel with 1 hour allowed, 72% of the box is inside the cautious tether, and with 30 minutes 21%; the longest cautious walk home from anywhere reachable is 175 minutes. The open card hides the target when it is near the middle of the view. Seen only in a scripted browser.
Next: F2, the layer panel: slope as a map layer with its record, and an information card for each layer.
Files: app/src/safety/budget.ts, tether.ts, tether.test.ts; ui/safetyPanel.ts, routePanel.ts; route/search.ts, worker.ts, messages.ts, client.ts; map/routeLayer.ts; style.css; the folder guides
Other roles need to know: C, two ideas from Joseph are logged as optional in SPEC under Stretch: orbiter passes for communications, and day and night along the walk.
Checks: `npm run check` passes: types, 56 tests, build. Scripted browser at Bright Angel: tether search 1.35 s; a 650 m walk east is 19 min from home (inside); the walk up the north-west slope is 36 min from home (inside); with 7 h 35 min gone the card says there is not enough time.

## Sat 14 Nov 13:00, role B work by Joseph, with Claude Code

Done: the route is on screen (F3, first version). Opening Bright Angel starts the route worker, shades keep-out ground red, marks home, and a click on the ground draws the walk out (blue) and back (yellow, dashed) with a table of distance, climb, time and energy for three cases and a list of what the numbers rest on.
Not done: several targets; oxygen; elevation profile; route confidence; footing; smoothing; the route in the address bar (F7); the tether (F4).
Broken or risky: home is the site marker as a stand-in; the site config has no home or targets. Tried only through a scripted browser that fires a click on the dev server, not by a person and not on the built site. The route card covers the top left of the map.
Next: the tether (F4): a cost-to-home array from the worker for the cautious case, a suit budget with sources, and the boundary line on the map.
Files: app/src/route/worker.ts, messages.ts, client.ts; map/routeLayer.ts; ui/routePanel.ts, format.ts, format.test.ts; data/loadSite.ts; main.ts; style.css; the folder guides
Other roles need to know: two real results from Bright Angel for the story. East along the valley floor: 650 m each way, about 14 min each way. North-west up the slope: 1.15 km and 142 m of climb out in 1 h 30 min (56 min to 2 h 0 min), 28 min back.
Added at 13:02: zooming in on a site by hand selects it (`map/zoomSelect.ts`), from zoom 4 when the site is in the middle quarter of the view. Tried with scripted camera jumps only, not a real wheel or pinch.
Checks: `npm run check` passes: types, 49 tests, build. Scripted browser: whole-grid search 1.0 to 1.3 s, route answer 0.1 s, keep-out 19% of the box, 80% reachable.

## Sat 14 Nov 12:45, role B work by Joseph, with Claude Code

Done: the site is public at https://sam-tel.github.io/Not-so-lost-on-Mars/ (F8). Route core built and tested in `src/route/`: `cost.ts` (speed and energy by slope, three cases), `grid.ts`, `search.ts` (keep-out, routes from and to home for every cell), `stats.ts`. `contract.ts` has the grid definition.
Not done: nothing of the route is on screen. `worker.ts`, `client.ts`, loading the grid files in `loadSite.ts`, `routeLayer.ts`, `routePanel.ts`, a home position and targets. Oxygen, footing, smoothing. README.
Broken or risky: the search has only run on small test grids, not on the real 791 x 750 grid, so its speed is unknown. The pairing of published figures with the three cases is ours (DECISIONS, proposed). The equations were read from the SEXTANT planner's source code, not from the two papers it credits.
Next: load the grids, run the search in the worker on the real grid and time it, then draw a route from home to a clicked point with its numbers.
Files: app/src/route/cost.ts, grid.ts, search.ts, stats.ts, route.test.ts, route/AGENTS.md, app/src/data/contract.ts, data/AGENTS.md
Other roles need to know: C, the three cases and their sources are in `cost.ts` and REFERENCES; the wording on screen should say "Apollo-based model applied to Mars".
Checks: `npm run check` passes: types, 41 tests, build. Public site opened in a scripted browser: Bright Angel loads in 1.6 s, no failed requests.

## Sat 14 Nov 11:41, role B work by Joseph, with Claude Code

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
Broken or risky: in a headless Edge screenshot the site sits to the right of the view's centre and is cut off at the right edge, and the scale bar's label overlaps the credit line. Joseph then opened the dev server in his own browser at about 11:36 and reported it looks good; the terrain heights on screen were not measured against anything. Not tried on a phone, or in Firefox or Safari.
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