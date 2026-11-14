# Role C handoff

## Sat 14 Nov 21:55, team owner with Claude Code, end of the evening session. START HERE

Done since 21:35 (all pushed): F19 first person under a helmet visor (`ui/visor.ts`, `ui/walkThrough.ts`); F3 walks through several stops with time at each stop, the verdict counting it, and the tightest point and a margin chart in "This walk" (`route/worker.ts`, `ui/routePanel.ts`, `safety/tether.ts`, `safety/walker.ts`).
Not done: styles for the new Several stops list (`.stops`, `.stops__item`, `.stops__button`, `.stops__stay`, `.route-pin--stop`) and the margin chart (`.margin-chart__trace`, `__zero`, `__stop`, `__dot`, `__line--outside`): the chart's SVG may draw as a filled black shape until styled. Item 12 (way home from here) not started. Nothing from tonight has been seen in a browser except the zoom fix, the Sun shading and the level 2 edges.
BROKEN, seen by the owner at 21:55: opening a site shows the note 'Source "overlay-thermal-themis" already exists.' (with a Close button). Not investigated. Suspected, not confirmed: the site's overlays are added twice, when a second open of the site starts before the first has finished (`stopRoutePlanner` in `app/src/main.ts` is set only after `addOverlays` finishes, so the second open cannot remove the first's layers). Tonight's change that opens a site zoomed into by hand without a camera flight (c9e2a69, `main.ts`) removed the 5-second wait that used to sit before `addOverlays`, which may be why it shows now. Fix to try: in `open()` remove any overlays already drawn (or skip a source that exists) before `addOverlays`, and check `thisChoice` again after it. Fix this first.
Also risky: walking the planned route in the walk-through does not pause at stops. Stops are not kept in the shareable link. First person changes pitch and zoom limits, drawing density and sky; all are put back on leaving, but this was not tried in a browser.
Next, Sunday morning: (1) open the dev server at Bright Angel and try Targets and stops, the margin chart, Link and view from orbit, Walk-through (map view and First person) and the orbiters on the globe; (2) add the missing styles; (3) rerun `pipeline/build_orbiters.py` before submitting (predictions end 30 Nov); (4) the backup video.
Files: app/src/ui (routePanel, walkThrough, visor, orbitPanel), app/src/route (worker, search, messages, client), app/src/safety (tether, walker), app/src/map/routeLayer.ts, app/src/style.css.
Other roles need to know: Joseph, role B's files changed a lot tonight; pull before editing. The plan with every item's status is in STATUS.md, "Evening work plan".
Checks: `npm run check` passes (types, 90 tests, build) at 21:52. `pytest -q` passed (54) at 21:23; the pipeline has not changed since.

## Sat 14 Nov 21:35, team owner with Claude Code (app and pipeline work for the evening plan). START HERE

Done (all pushed; plan and statuses in STATUS.md, "Evening work plan"): zoom 12 glitch; R9 to R12 and R20; sun shading; geology at Bright Angel; level 2 terrain edges eased; globe as one overview picture; F17 two passes; F18 orbiters (globe, and link and view timeline in the route card); F19 walk-through astronaut.
Not done: F17 at phone and laptop widths, and the tablet and helmet views by eye; the backup video (owner: Sunday).
Broken or risky: F17, F18 and F19 have not been seen in a browser. Orbiter predictions end 30 Nov (MRO 12:45 UTC): rerun `pipeline/build_orbiters.py` before submitting.
Next: open the dev server and check, at Bright Angel: the route card's parts; "Link and view from orbit" (open it, move "Set out in"; purple glow on the map); "Walk-through" (Put the astronaut at home, arrow keys; Walk the planned route); orbiters on the globe.
Files: app/src/ui (routePanel, orbitPanel, walkThrough, layerPanel, toolbar, weatherBanner), app/src/map (slots, approach, siteLayers, orbiters, astronaut, mapView), app/src/data/orbiters.ts, app/src/safety/walker.ts, pipeline (build_orbiters, build_geology, build_globe, tiles, build_site).
Other roles need to know: Joseph, much of role B's code changed tonight; pull before editing. Thresholds for link (10 degrees) and imaging (60 degrees) are assumed, and say so.
Checks: `npm run check` (types, 87 tests, build) and `pytest -q` (54 tests) pass.

## Sat 14 Nov 19:58, role C work by the team owner, with Claude Code

Done: pulled Joseph's fixes (R1 to R8, R13 to R19); `npm run check` passes. Added F17 (interface upgrade, a "should") and F18 (orbiters overhead, a stretch) to SPEC and STATUS at the owner's request. Found a source for F18: JPL Horizons, in DATA_CATALOG.
Not done: STATUS rows and a role B handoff for Joseph's evening fixes (his to write); the backup video; README; licence; project page.
Broken or risky: none of Joseph's fixes has been seen in a browser.
Next: try the app in a browser, then record the backup video by 23:00.
Files: docs/SPEC.md, STATUS.md, REVIEW_QUEUE.md, DATA_CATALOG.md, PITFALLS.md, AI_USE.md
Other roles need to know: A and B, F18 needs a pipeline step: Horizons does not answer browser calls. Send a Mars site longitude as a negative east longitude (corrected 21:35; PITFALLS 4).
Checks: `npm run check`: types, unit tests and build pass.

## Sat 14 Nov 16:55, role C handover from the team owner, with Claude Code. START HERE

Done: documents brought up to date for the handover (STATUS, DECISIONS, SITES, DATA_CATALOG, PITFALLS, REVIEW_QUEUE, AI_USE, README); the app review logged in docs/reviews/.
Not done: the backup video (due 23:00); the project page text; a licence; the AI wording for the submission (AI_USE has the log).
Broken or risky: features in the video may break until R1 to R20 are fixed; record after role B's first round of fixes, or record the parts that work.
Next: record the backup video from the plain link (globe, zoom in on Bright Angel) and the Bright Angel link (walk to Cheyava Falls, tether slider, storm drill), storyboard in PLAN.md section 11; then draft the project page from README.md.
Files: README.md, docs/SUBMISSION_CHECKLIST.md, docs/AI_USE.md
Other roles need to know: the field tablet and helmet views are behind the switch at the top right of the map; the helmet appears only when a rover photo near the target loads.
Checks: none run for this role.

## Sat 14 Nov 16:05, role C work by the team owner, with Claude Code

Done: docs/REVIEW_QUEUE.md started for large bugs and reviews; AI_USE, REFERENCES, DATA_CATALOG, PITFALLS kept up to date for the afternoon's work.
Not done: the backup video (due 23:00); the project page text; SUBMISSION_CHECKLIST; a licence.
Broken or risky: the README describes the app as it was at 14:00; the new panels and sites are not in it.
Next: record the backup video from the plain link and the Bright Angel link (storyboard in PLAN.md section 11) once the app has been tried and pushed.
Files: docs/REVIEW_QUEUE.md, docs/STATUS.md, docs/handoffs/
Other roles need to know: for the video, the Bright Angel link opens on the walk to Cheyava Falls; the field tablet and helmet views are behind the switch at top right.
Checks: none run for this role.
