# app/src/ui: guide

## Purpose

Panels, cards and the three display modes. Shows results; computes nothing beyond formatting.

## Owner

Role B.

## Commands

Run from `app/`. They are listed in [../../AGENTS.md](../../AGENTS.md).

## Reads and writes

Reads results from the other folders. Writes only to the page and the address bar.

## Rules for this folder

- English, plain words, SI units. Every number comes with its range and source.
- Use the fixed words in `docs/CONFIDENCE.md` section 4: measured, typical, forecast, modelled, assumed, live.
- Tablet and helmet layouts show cautious values only.
- Every file starts with the header from [../../../docs/WORKFLOW.md](../../../docs/WORKFLOW.md). A file with only its header is not built yet.

## File index

Add a row when you add a file. Remove it when you delete one.

| File | What it does | Feature |
|---|---|---|
| `sitePicker.ts` | The list of sites beside the globe, the details card for a chosen site, and the record of the globe image | F14 |
| `layerPanel.ts` | Layer panel in the side panel: what it is for and what the grades mean, then one row per layer with a switch, opacity control, legend and information card, then what the rover's own measurements say about our terrain. Built | F2, F9 |
| `infoCard.ts` | Information card for a layer, built from its record: who measured it, when, detail, accuracy, what we did, grade and caveats. To add: cards for predictions | F2 |
| `routePanel.ts` | Route card over the map, answer first (status and tether verdict) then parts that open and close (F17): click a target, see the walk out and back with distance, climb, time and energy for three cases, and what the numbers rest on; draws the tether and judges the walk against it. Can be folded away. Holds the default slope limit. Lists the scenario's science targets and plans the first when the site opens; shows the profile and oxygen; restarts the route worker when the slope limit changes; route confidence line; the rover's own drive between home and a target; GeoJSON export of the walk with its Mars frame and stops (F16); moving the rover to a new home (F16 drop-off); walks through several stops with time at each, counted in the tether, radiation and daylight; one tether check at every point for the verdict, the margin chart and the field views; says so when a route request fails | F3, F4, F16 |
| `safetyPanel.ts` | The tether's controls (walk-back limit, time since leaving home), the line saying whether the planned walk stays inside it, and the suit settings (slope limit 15, 20 or 25 degrees). To add: storm advice | F4, F5, F10 |
| `profileChart.ts` | Elevation profile of the walk out and back as a small SVG chart, heights relative to the areoid. Built. To add: the confidence line | F3 |
| `photoStrip.ts` | Real rover photos taken near the route, in the route card, each with sol, date, local time, camera, distance and credit. Built. To add: preferring the direction of travel | F6 |
| `weatherBanner.ts` | Space-weather banner on the map: NASA's latest forecast of an eruption reaching Mars, with issue time, arrival window, and whether it is live or a snapshot. Built | F5 |
| `weatherBanner.test.ts` | Tests for the forecast parsing and the banner's wording, on made-up notices | |
| `timeSlider.ts` | "When to go": start-time slider in local solar time, Sun height, sunrise and sunset for today's season, whether the walk ends in daylight, and typical weather where the site has a station record: by Mars month at Gale (REMS), by local hour at the start time and over the walk at Bright Angel (MEDA). Built. To add: dust devils | F11 |
| `earthLink.ts` | Live link-to-Earth line on the map: which Mars spacecraft NASA's Deep Space Network is talking to now, and the one-way light time, from DSN Now; "no data" when the feed does not answer | F16 |
| `toolbar.ts` | The one bar at the top right of the map that holds the display switch and "Install app", beside the zoom buttons | F17 |
| `install.ts` | Makes the built site installable: registers the service worker (built site only), reloads a page once when a new deploy's worker takes it over, and shows "Install app" when the browser offers it | F8 |
| `modes.ts` | Switches between the planner, the field tablet (one big status card and three glove-sized buttons: next target, go home, storm) and the helmet: the Helmet button opens the walk-through's first-person view under the visor (15 Nov); a concept view over a real rover photo remains for a caller that gives no first-person view. Cautious values only. Built | F13 |
| `orbitPanel.ts` | "Link and view from orbit" in the route card (F18): a start slider (now to 24 h ahead), when a relay is in view and when a camera orbiter could see the walker, a timeline per orbiter, and the stretches with no link glowing on the map while the part is open; after the saved predictions end, a labelled replay of them with their real dates; gives its chosen start to the walk-through | F18 |
| `walkThrough.ts` | The walk-through part of the route card (F19), with a first-person view at eye height under the visor (low drawing density, pitch and zoom limits raised, illustrative sky, all put back on leaving): put the astronaut at home and steer it with the arrow keys or W, A, S, D, or walk the planned route at a speed-up, standing at each stop for its time; camera follows; readout of time gone, walk home, tether margin, relay in view and Sun; moves the tether's time since leaving home from the card's own value and puts it back on Stop; clock from the orbit panel's start; mouse and touch off in first person; frame loop only while moving; while steering, the quickest walkable way home drawn on the ground in blue; opens first person for the Helmet button | F19 |
| `visor.ts` | The helmet visor over the walk-through's first-person view (F19): heading, an arrow along the quickest walkable way home and the distance home, walk home, tether margin bar, start-back countdown, clock, time gone, relay, Sun, speed and slope, "SIMULATED" with the speed-up | F19, F13 |
| `urlState.ts` | Keeps the view in the address bar so any view can be shared: the site, the walk's target and the tether settings, as `#site=<site id>&to=<lon>,<lat>&back=<minutes>&t=<minutes>`, or for a walk through stops `stops=<lon>,<lat>,<minutes>;...` in place of `to=` | F7 |
| `urlState.test.ts` | Tests for reading and writing the address bar state | |
| `format.ts` | Turns numbers into text. Built so far: distance, height, duration, energy, dose and three-case ranges. To add: dates in Earth UTC and Mars time |  |
| `format.test.ts` | Tests for `format.ts` | |

## Known issues

None recorded.
