# Status board

Read this first in every session. Change only your own rows, in a small commit of its own, and push it straight away.

Last updated: Sat 14 Nov 16:55, at handover from the team owner to Joseph. Everything below is pushed. Every feature from F1 to F16 has a first version, but most of the afternoon's work has not been tried by a person. Start with [handoffs/role-b.md](handoffs/role-b.md) and the R items in [REVIEW_QUEUE.md](REVIEW_QUEUE.md). Eight of nine sites are built (not Gale).

## Now

| Role | Person | Working on | Since |
|---|---|---|---|
| A: data and science | Joseph, from the owner's handover at 16:55 | Next: the batch 3 data arriving on the server (MEDA weather, RAD storm data, Gale dates), geology once fiona is installed | Sat 16:55 |
| B: app | Joseph, from the owner's handover at 16:55 | Next: try every panel in the browser, then fix review items R1 to R20 in order | Sat 16:55 |
| C: story and submission | Team owner and Joseph | Backup video by 23:00; README and project page | Sat 16:55 |

## Evening work plan: team owner with Claude Code, from Sat 14 Nov 20:20

Agreed by the team owner at 20:20. Work in this order; update the status here as each item is done. Joseph: these touch `app/src/main.ts`, `app/src/map/`, `app/src/ui/routePanel.ts`, `app/src/ui/timeSlider.ts`, `app/src/style.css` and the Bright Angel build, so check here before editing those files tonight.

| # | Task | Status | Notes |
|---|---|---|---|
| 1 | Black band and jumping labels when zooming in by hand at zoom 12 | done, c9e2a69; fixed in the browser (owner, 20:50) | Cause: MapLibre's globe blends into the flat map between zoom 11 and 12 (`projection_factory.ts`), and the site's 3D terrain was already on. Terrain now on only from zoom 12.2; a hand zoom opens the site where the camera is, without the app's own flight |
| 2 | R9, R10: layer order and sun shading; the Sun slider and switch show no visible change | done, c9e2a69; Sun fixed in the browser (owner, 20:50) | `map/slots.ts`; shading on true Mars slopes with a method that uses the Sun's height (REVIEW_QUEUE Done) |
| 3 | R11, R12: approach ring order and first zoom | done, c9e2a69 | Not checked by eye |
| 4 | R20: approach rings only for the site in focus; no name tidying while markers are hidden | done, c9e2a69 | |
| 5 | Geology layer at Bright Angel (F2) | done, 12b95da | 75 polygons in 10 units, 1.2 MB, labelled with the map's symbols. `build_geology.py` fixed (layer name, cut to the 12 km square); pytest 49 pass |
| 5a | The site and the globe image load slowly since tonight's changes (owner, 20:50) | done, 5855b5c and 93f9e66; not timed | The 1.2 MB geology file is now fetched only when the layer is first switched on. The globe is one 0.8 MB picture loaded at the start and kept under the tiles, which start at zoom 3 (asked for by the owner) |
| 5b | Level 2 sites (Ares Vallis and others): a vertical height glitch (owner, 20:50) | done, a2b0d2f; owner glad it is fixed (21:10) | Each terrain tile repeated the box's edge heights to its own edge, so the ground ended in a wall that moved with the zoom. Edges now eased to the box's lowest point over 400 m, labelled as not measured. All seven level 2 sites rebuilt |
| 6 | F17 interface upgrade | two passes done, d8fa09b and 252e49e; not yet seen in a browser | Route card answer first with parts that open and close; layers panel says what it is for and what grades mean; one toolbar; numbers first in the walk part; one-line space-weather banner. Still to do: tablet and helmet views; a look at 360, 1,024 and 1,440 px |
| 7 | F18 orbiters overhead | coded 21:23, not yet seen in a browser | `pipeline/build_orbiters.py` saves JPL Horizons predictions (MRO, Odyssey, Mars Express, TGO; MAVEN left out) to 30 Nov. Globe: dots and tracks. Route card: "Link and view from orbit" with a start slider, timeline, and the no-link stretches glowing purple on the map. Thresholds assumed (10 and 60 degrees) |
| 8 | F19 walk-through: a to-scale astronaut you steer on the 3D ground, with live tether, time home and link readouts; a "walk the route" playback | coded 21:32, not yet seen in a browser | No new library: raised shapes in MapLibre (`map/astronaut.ts`), rules in `safety/walker.ts` (tested), controls in the route card. Built as a demonstration of the tether (no score, no levels), with the owner's approval |

## Public link

https://sam-tel.github.io/Not-so-lost-on-Mars/ since Sat 14 Nov 12:42. Bright Angel: https://sam-tel.github.io/Not-so-lost-on-Mars/#site=bright-angel . Every push to main that passes the app check republishes it.

## Features

Status is one of: not started, in progress, works, works with issues, cut. "Works" means it passed its checks in [SPEC.md](SPEC.md) with real data.

| Feature | Owner | Status | Notes |
|---|---|---|---|
| F14 Mars globe and site picker | A, B | works with issues | Live. New 14 Nov afternoon: approach imagery, three rings of real CTX images round every site (320, 40, 12 km), so zooming in is no longer a blur (seen in headless Chrome at Bright Angel). Eight sites now open a built map. Not tried by a person since |
| F1 Hero site map | A, B | works with issues | Bright Angel built from real data, now with CTX 20 m terrain round the box out to 10 km (not looked at yet). Not checked: load time from the public link; heights at three rover stops shown in the app |
| F2 Layer panel and information cards | B | works with issues | Five layers plus night-time warmth (F12, coded). Geology: code written, blocked on installing `fiona` (REVIEW_QUEUE 7). Not tried by a person |
| F3 Route planner | B | works with issues | Coded 14 Nov afternoon, not tried: home and three science targets from the hero scenario, buttons to pick a target, elevation profile, oxygen (Weir 1949), route confidence line. Earlier: one target, three cases, keep-out never crossed. Not done: route through several targets in a row, smoothing |
| F4 Tether | A, B | works with issues | Suit setting added (slope limit 15, 20 or 25 degrees; restarts the route search), not tried. Time budget only; no energy or oxygen supply, no reserve (REVIEW_QUEUE 10). The slider now draws through a canvas source, for smoothness |
| F5 Dose and space weather | A, B | works with issues | The route card gives the radiation picked up on the walk, as dose equivalent in microsieverts and absorbed dose in micrograys, each with a range, from rates Curiosity measured at Gale (grade C). A banner on the map shows NASA's latest forecast of a solar eruption reaching Mars, with issue time and arrival window, live when NASA's feed answers and otherwise from a saved snapshot, labelled. Seen in a scripted browser, live. Issues: the absorbed-dose rate is from the 2014 paper as recorded in DATA_CATALOG, not re-read; terrain shielding is not included; the snapshot fallback was tested in unit tests, not by blocking the feed in a browser |
| F6 Photos along the route | C, B | works with issues | The route card shows up to six real Perseverance navigation camera photos taken within 30 m of the planned walk, in walking order, each with sol, Earth date, local time, camera, distance from the route, stop and credit, and a link to NASA's page. The index holds 401 photos at 111 of the 116 rover stops in the box. Seen in a scripted browser: six photos loaded on the walk east along the valley. Issues: photos are not chosen by direction of travel, because we have not confirmed what the mast azimuth is measured from; the pictures load from NASA's server, so they need the network |
| F7 Opening state and shareable link | B | works with issues | The Bright Angel link now opens on the walk to Cheyava Falls (hero scenario), coded, not tried. Layer choices not in the link; the 10-second first-visitor test not done |
| F8 Public site and repository | B | works with issues | Live, pushed at handover. New: installable as an app (manifest, icon, service worker that keeps seen files; tried only as far as the build). Not done: private-window check; licence |
| F9 Validation panel | A | works with issues | Slope and height at 116 stops. New, not tried: the route card sets the rover's distance driven between home and a target beside our walk |
| F10 Storm mode | A, B | in progress | Coded, not tried: storm drill in the route card (pick a warning time; go home or start home and shelter under steep ground); the 20 May 2024 event at Gale, 8,100 micrograys (NASA), against the walk's background dose |
| F11 Time of day | A, B | in progress | Coded, not tried: Mars24 season, local solar time and Sun (tested against the Mars24 worked example), start-time slider, sunrise and sunset, whether the walk ends in daylight, computed sun shading; typical weather by Mars month at Gale only (Curiosity REMS). No weather at Jezero: the MEDA archive is not on the server. No dust devils |
| F12 Thermal and mineral layers | A | in progress | Night infrared (THEMIS, USGS 2018) as a layer at Bright Angel: coded, to be built. Minerals not started: CRISM files unprocessed (REVIEW_QUEUE 10) |
| F13 Tablet and helmet display | B, C | in progress | Tried briefly by the owner: janky and often empty. Fixed since: the helmet option shows only when its rover photo loads; the map resizes on a view change. Still open: R6 and R13 to R15 in REVIEW_QUEUE |
| F17 Interface upgrade | B, C | works with issues | Added by the team owner, 14 Nov 19:04. Two passes on 14 Nov evening (see the plan above); not yet seen in a browser at phone and laptop widths; tablet and helmet views not yet reworked |
| F18 Orbiters overhead | A, B | works with issues | Added by the team owner, 14 Nov 19:10. Coded 14 Nov evening from JPL Horizons predictions saved to 30 Nov; not yet seen in a browser. Relay and camera roles counted only where a source confirmed them (MRO, Odyssey; Mars Express camera); thresholds assumed. Rebuild the predictions before submitting |
| F19 Walk-through | B | works with issues | Proposed by the team owner on 14 Nov evening. Coded the same evening: a 1.8 m astronaut steered with the keyboard or walking the planned route, camera following, readout of tether margin, walk home, relay and Sun, the tether shrinking as time goes. Not yet seen in a browser |
| F15 More sites | A | in progress | Seven landing sites built as level 2 from their HiRISE terrain strips, warped from their own projections (2.6 to 6.3 MB each). Gale not built: image dates of its mosaics not found (REVIEW_QUEUE 8) |
| F16 Extras | any | in progress | Coded, not tried: live link to Earth from NASA DSN Now; route export as GeoJSON with its Mars frame; rover drop-off (move home). Not started: two walkers, rover models in 3D, orbiter passes overhead (now F18) |

## Sites

| Site | Level | Data built | Reviewed by a person |
|---|---|---|---|
| bright-angel | 1 | image and terrain tiles (terrain reaching 10 km), routing grids, rover stops and path, photo index, terrain checks, hero scenario | no |
| gale-crater | 1 | no (dates missing); typical weather from Curiosity REMS | no |
| columbia-hills, meridiani, ares-vallis, chryse-planitia, utopia-planitia | 2 | 2 km image and terrain from one HiRISE strip, routing grids | no |
| arctic-plain, elysium-planitia | 2 | 2 km image and terrain from one HiRISE strip (Phoenix warped from polar stereographic), routing grids | no |
| all nine | | approach imagery (CTX rings) | no |

All nine have a config in `sites/` with a cited position, and appear on the globe as "not built yet".

## Broken right now

Nothing known broken, but most of the afternoon's work has not been opened in a browser. Large items for review are in [REVIEW_QUEUE.md](REVIEW_QUEUE.md).

## Team data server

Set up on 13 November. Reachable from the team owner's laptop and from Joseph's laptop over Tailscale (checked 14 November, about 11:10: listing, partial reads, about 8.6 MB/s on one 50 MB read). See [../data/AGENTS.md](../data/AGENTS.md).

| Files | State on 14 November, 09:50 UTC |
|---|---|
| Jezero context terrain and image | Complete; sizes match the USGS source |
| Jezero terrain mosaic | Complete; size matches |
| Jezero image mosaic | Complete; size matches |
| Rover feeds | Complete, 5 files; live feeds, so no source size to compare |
| Gale terrain and image | Complete; sizes match |
| Seven other landing sites | Complete: 68 terrain and image files, sizes match the HiRISE archive, plus the 58 image label files |
| Jezero geologic map | Complete; size matches |
| Jezero mineral products | Complete at 09:47 UTC: 690 files, 10,943,277,624 bytes, counted from the laptop over Tailscale |
| Perseverance weather archive | Optional second stage, off |

The first run of the new batch stopped at 02:37 UTC on 14 Nov with 12 problems, all from wrong rows in its download list (4 swapped sizes, 8 wrong file names). The list was corrected and rerun on the server with 0 problems. The mineral list had every size overstated; the server's script was changed to take sizes from the files themselves and the run then finished with 0 problems. Sizes were checked, not checksums.

## Waiting on someone

- **Batch 3 on the team data server,** asked for at about 16:30 and taking a few hours: Perseverance MEDA weather for sols 3 to 64, 672 to 733 and 1340 to 1402 (`/raw/meda/`), Curiosity RAD data for sols 4185 to 4195 around the 20 May 2024 storm (`/raw/rad/`), and the Gale mosaics' metadata (`/raw/gale/metadata/`). The server's Claude session reports what arrived; see [../data/AGENTS.md](../data/AGENTS.md).
- **The team owner:** approve installing `fiona` in the pipeline, for the geology layer (REVIEW_QUEUE item 7).
- **Anyone:** the backup video by 23:00 (SUBMISSION_CHECKLIST).

- The third teammate: install Tailscale, accept the share of the data server, put the address in `.env`, and confirm a file listing loads. Joseph has done this.
- The team: confirm or change the two open proposals in DECISIONS.md (what each link opens on; how AI-written code is acknowledged).
