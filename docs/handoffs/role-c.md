# Role C handoff

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
