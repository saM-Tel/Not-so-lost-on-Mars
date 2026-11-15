# Status board

Read this first in every session. Change only your own rows, in a small commit of its own, and push it straight away.

Last updated: Sun 15 Nov, about 09:30, by the team owner with Claude Code. Joseph has handed the project over; the owner now holds roles A, B and C. This morning: S0 to S18 and S23 from REVIEW_QUEUE fixed and tried in a scripted browser; stops now go in the shareable link and the walk-through stands at stops (team decisions); the verdict and the margin chart use one rule; README brought up to date with a licence section; Apache 2.0 `LICENSE` added (owner to confirm); a draft of every project page field in [PROJECT_PAGE.md](PROJECT_PAGE.md). Pushed about 09:40 (740a81e, b3a151e and the docs commit after them). Feature freeze is today at 12:00 and the submission at 21:00. Not started: the backup video (the owner is doing it next). Batch 3 data is on the server and not yet used.

## Now

| Role | Person | Working on | Since |
|---|---|---|---|
| A: data and science | Team owner, from Joseph's handover on Sun 15 Nov morning | Not started this morning. Open: batch 3 data (MEDA weather, RAD storm data, Gale dates); rerun `build_orbiters.py` before submitting if time allows | Sun 15 Nov |
| B: app | Team owner with Claude Code, from Joseph's handover | Done 09:20, pushed (740a81e): S0 to S18 (route card, walk-through, visor, walker, tether, link). Next: the owner looks at the walk column and the walk-through by eye | Sun 15 Nov |
| C: story and submission | Team owner | The backup video next; then fill the [FILL] marks in PROJECT_PAGE.md and paste it into the form | Sun 15 Nov |
| (was: B, files outside Joseph's) | Team owner with Claude Code | Done Sun 02:30 and pushed (abd8291, d547cd3) | Sun 01:45 |

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
| 9 | F19 first person: a deliberately low-resolution view from the astronaut's eyes (1.7 m) with a visor display: arrow and distance home, walk-home time, tether margin bar, start-back countdown, time gone, clock, relay, Sun, speed, and "SIMULATED" with the speed-up | coded 21:45, not yet seen in a browser | Asked for by the owner on 14 Nov evening. Real time stays an option, to show it is to scale. `ui/visor.ts`; first person in `ui/walkThrough.ts` |
| 10 | F3 routes through several stops: numbered stops added on the map, reordered or removed, each with time spent there; home, 1, 2, ..., home; the tether checked at every point against the time you are there | coded 21:52, d3b62d1; not seen in a browser; no styles yet | Asked for by the owner on 14 Nov evening. Worker legs between stops; Several stops block in "Targets and stops"; verdict counts time at stops. Still to do: styles for `.stops` and `.margin-chart` in style.css |
| 11 | Tether margin along the walk: a small chart of margin by minute under the elevation profile, and the tightest point | coded 21:52, d3b62d1; not seen in a browser; no styles yet | Suggested by Claude; built with item 10 because it uses the same timeline. The SVG has no styles yet, so it may draw as a filled black shape: add stroke styles for `.margin-chart__trace`, `__zero`, `__stop`, `__dot` |
| 12 | Walk-through: "way home from here" (press H) draws the quickest walkable way home | not started | Suggested by Claude on 14 Nov evening; the owner has not confirmed it yet |

## Public link

https://sam-tel.github.io/Not-so-lost-on-Mars/ since Sat 14 Nov 12:42. Bright Angel: https://sam-tel.github.io/Not-so-lost-on-Mars/#site=bright-angel . Every push to main that passes the app check republishes it.

## Features

Status is one of: not started, in progress, works, works with issues, cut. "Works" means it passed its checks in [SPEC.md](SPEC.md) with real data.

| Feature | Owner | Status | Notes |
|---|---|---|---|
| F14 Mars globe and site picker | A, B | works with issues | Live. New 14 Nov afternoon: approach imagery, three rings of real CTX images round every site (320, 40, 12 km), so zooming in is no longer a blur (seen in headless Chrome at Bright Angel). Eight sites now open a built map. Not tried by a person since |
| F1 Hero site map | A, B | works with issues | Bright Angel built from real data, now with CTX 20 m terrain round the box out to 10 km (not looked at yet). Not checked: load time from the public link; heights at three rover stops shown in the app |
| F2 Layer panel and information cards | B | works with issues | Six layers at Bright Angel: ground image, slope, keep-out, rover path and stops, night-time warmth (F12), and geology (built 14 Nov evening, 12b95da, after fiona was installed). Not tried by a person since the geology layer was added |
| F3 Route planner | B | works with issues | Home and three science targets, any clicked point, or several stops with time at each. Elevation profile, oxygen (Weir 1949), route confidence line. Sun 15 Nov: failed requests now say so (S0); clearing stops goes back to one target (S2); time at stops counts in radiation and daylight (S4). Tried in a scripted browser on 15 Nov: hero walk, two stops, Clear, a stops link reloaded. Not done: smoothing |
| F4 Tether | A, B | works with issues | Checked at every point of the walk against the moment the walker is there, with time at stops and the planned way back; the verdict and the margin chart use this one rule (S5, 15 Nov) and name the same tightest point (seen in a scripted browser). Suit setting (slope limit 15, 20 or 25 degrees). Time budget only; no energy or oxygen supply, no reserve (REVIEW_QUEUE 10) |
| F5 Dose and space weather | A, B | works with issues | The route card gives the radiation picked up on the walk, as dose equivalent in microsieverts and absorbed dose in micrograys, each with a range, from rates Curiosity measured at Gale (grade C). A banner on the map shows NASA's latest forecast of a solar eruption reaching Mars, with issue time and arrival window, live when NASA's feed answers and otherwise from a saved snapshot, labelled. Seen in a scripted browser, live. Issues: the absorbed-dose rate is from the 2014 paper as recorded in DATA_CATALOG, not re-read; terrain shielding is not included; the snapshot fallback was tested in unit tests, not by blocking the feed in a browser |
| F6 Photos along the route | C, B | works with issues | The route card shows up to six real Perseverance navigation camera photos taken within 30 m of the planned walk, in walking order, each with sol, Earth date, local time, camera, distance from the route, stop and credit, and a link to NASA's page. The index holds 401 photos at 111 of the 116 rover stops in the box. Seen in a scripted browser: six photos loaded on the walk east along the valley. Issues: photos are not chosen by direction of travel, because we have not confirmed what the mast azimuth is measured from; the pictures load from NASA's server, so they need the network |
| F7 Opening state and shareable link | B | works with issues | The Bright Angel link opens on the walk to Cheyava Falls (seen in a scripted browser). The link holds the target, or the stops with the minutes at each (team decision, 15 Nov), and the tether settings. Layer choices not in the link; the 10-second first-visitor test not done |
| F8 Public site and repository | B | works with issues | Live. Installable as an app. README up to date on 15 Nov with a licence section listing every third-party licence; Apache 2.0 `LICENSE`, agreed by the owner. Not done: private-window check |
| F9 Validation panel | A | works with issues | Slope and height at 116 stops. New, not tried: the route card sets the rover's distance driven between home and a target beside our walk |
| F10 Storm mode | A, B | in progress | Coded, not tried: storm drill in the route card (pick a warning time; go home or start home and shelter under steep ground); the 20 May 2024 event at Gale, 8,100 micrograys (NASA), against the walk's background dose |
| F11 Time of day | A, B | in progress | Coded, not tried: Mars24 season, local solar time and Sun (tested against the Mars24 worked example), start-time slider, sunrise and sunset, whether the walk ends in daylight, computed sun shading; typical weather by Mars month at Gale only (Curiosity REMS). No weather at Jezero: the MEDA archive is not on the server. No dust devils |
| F12 Thermal and mineral layers | A | in progress | Night infrared (THEMIS, USGS 2018) as a layer at Bright Angel: coded, to be built. Minerals not started: CRISM files unprocessed (REVIEW_QUEUE 10) |
| F13 Tablet and helmet display | B, C | in progress | Tried briefly by the owner: janky and often empty. Fixed since: the helmet option shows only when its rover photo loads; the map resizes on a view change. Still open: R6 and R13 to R15 in REVIEW_QUEUE |
| F17 Interface upgrade | B, C | works with issues | Added by the team owner, 14 Nov 19:04. Two passes on 14 Nov evening (see the plan above); not yet seen in a browser at phone and laptop widths; tablet and helmet views not yet reworked |
| F18 Orbiters overhead | A, B | works with issues | JPL Horizons predictions saved to 30 Nov; after that the panel and globe replay the saved window, labelled with its real dates (pushed, abd8291). The walk-through clock now uses the start chosen here, so its relay readout follows the replay too (S17). Relay and camera roles counted only where a source confirmed them; thresholds assumed. Not yet looked at by a person |
| F19 Walk-through | B | works with issues | Astronaut steered with the keyboard or walking the planned route, standing at each stop for its time (team decision, 15 Nov); first person under a visor. Sun 15 Nov: S9 to S18 fixed (keys, tether time put back on Stop, idle loop, mouse in first person). Tried in a scripted browser: playback, Stop, held keys, first person in and out. Not tried by a person |
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

- Fixed Sun 15 Nov 00:28 (7a3a388): the note 'Source "overlay-thermal-themis" already exists' on opening a site. The cause was not a double open. The route planner threw "Cannot access 'stops' before initialization" on every site since d3b62d1, so it never started, and the layers it left behind gave the note on the next open. Seen fixed in a scripted browser.
- Fixed Sun 15 Nov 00:28 (32cc581): styles for the Several stops list and the margin chart. Written from the class names; the list and chart themselves have not been looked at with stops in them.

- Fixed Sun 15 Nov, about 09:20, pushed (740a81e, b3a151e): S0 to S18 and S23 in [REVIEW_QUEUE.md](REVIEW_QUEUE.md) (Done). Tried in a scripted browser, not by a person. Still open there: the low items S19 to S22 and S24.

Nothing else known broken, but most of the afternoon's work has not been opened in a browser. Large items for review are in [REVIEW_QUEUE.md](REVIEW_QUEUE.md).

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
- **The team owner:** fill the [FILL] marks in [PROJECT_PAGE.md](PROJECT_PAGE.md): the video link, where the idea came from, the references.
- **The team owner:** the backup video (overdue since Saturday 23:00; being done next).

- The third teammate: install Tailscale, accept the share of the data server, put the address in `.env`, and confirm a file listing loads. Joseph has done this.

- The team: confirm or change the two open proposals in DECISIONS.md (what each link opens on; how AI-written code is acknowledged).
