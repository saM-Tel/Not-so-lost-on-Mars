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
| `layerPanel.ts` | Layer panel in the side panel: one row per layer with a switch, opacity control, legend and information card, then what the rover's own measurements say about our terrain. Built | F2, F9 |
| `infoCard.ts` | Information card for a layer, built from its record: who measured it, when, detail, accuracy, what we did, grade and caveats. To add: cards for predictions | F2 |
| `routePanel.ts` | Route card over the map: click a target, see the walk out and back with distance, climb, time and energy for three cases, and what the numbers rest on; draws the tether and judges the walk against it. Can be folded away. Holds the default slope limit. Lists the scenario's science targets and plans the first when the site opens; shows the profile and oxygen; restarts the route worker when the slope limit changes. To add: the route's confidence line | F3 |
| `safetyPanel.ts` | The tether's controls (walk-back limit, time since leaving home), the line saying whether the planned walk stays inside it, and the suit settings (slope limit 15, 20 or 25 degrees). To add: storm advice | F4, F5, F10 |
| `profileChart.ts` | Elevation profile of the walk out and back as a small SVG chart, heights relative to the areoid. Built. To add: the confidence line | F3 |
| `photoStrip.ts` | Real rover photos taken near the route, in the route card, each with sol, date, local time, camera, distance and credit. Built. To add: preferring the direction of travel | F6 |
| `weatherBanner.ts` | Space-weather banner on the map: NASA's latest forecast of an eruption reaching Mars, with issue time, arrival window, and whether it is live or a snapshot. Built | F5 |
| `weatherBanner.test.ts` | Tests for the forecast parsing and the banner's wording, on made-up notices | |
| `timeSlider.ts` | "When to go": start-time slider in local solar time, Sun height, sunrise and sunset for today's season, whether the walk ends in daylight, and typical weather where the site has a station record. Built. To add: dust devils, shadows | F11 |
| `install.ts` | Makes the built site installable: registers the service worker (built site only) and shows "Install app" when the browser offers it | F8 |
| `modes.ts` | Switches between the planner, the field tablet (one big status card and three glove-sized buttons: next target, go home, storm) and the helmet concept view over a real rover photo (bearing arrow, distance, tether margin bar, one alert line). Cautious values only. Built | F13 |
| `urlState.ts` | Keeps the view in the address bar so any view can be shared: the site, the walk's target and the tether settings, as `#site=<site id>&to=<lon>,<lat>&back=<minutes>&t=<minutes>` | F7 |
| `urlState.test.ts` | Tests for reading and writing the address bar state | |
| `format.ts` | Turns numbers into text. Built so far: distance, height, duration, energy, dose and three-case ranges. To add: dates in Earth UTC and Mars time |  |
| `format.test.ts` | Tests for `format.ts` | |

## Known issues

None recorded.
