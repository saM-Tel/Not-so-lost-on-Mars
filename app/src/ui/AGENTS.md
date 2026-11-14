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
| `routePanel.ts` | Route card over the map: click a target, see the walk out and back with distance, climb, time and energy for three cases, and what the numbers rest on; draws the tether and judges the walk against it. Can be folded away. Holds the default slope limit. To add: several targets, oxygen, confidence, the profile | F3 |
| `safetyPanel.ts` | Built so far: the tether's controls (walk-back limit, time since leaving home) and the line saying whether the planned walk stays inside it. To add: suit settings, dose and storm advice | F4, F5, F10 |
| `profileChart.ts` | Elevation profile along the route, with the confidence line under it | F3 |
| `photoStrip.ts` | Real rover photos taken near points on the route | F6 |
| `weatherBanner.ts` | Space-weather banner: the latest NASA forecast that names Mars, with issue time and arrival window | F5 |
| `timeSlider.ts` | Local-time slider: typical temperature, pressure, ultraviolet and dust-devil likelihood, Sun height and shadows | F11 |
| `modes.ts` | Switches between the habitat planner, field tablet and helmet display layouts | F13 |
| `urlState.ts` | Keeps the view in the address bar so any view can be shared: the site, the walk's target and the tether settings, as `#site=<site id>&to=<lon>,<lat>&back=<minutes>&t=<minutes>` | F7 |
| `urlState.test.ts` | Tests for reading and writing the address bar state | |
| `format.ts` | Turns numbers into text. Built so far: distance, height, duration, energy and three-case ranges. To add: dates in Earth UTC and Mars time |  |
| `format.test.ts` | Tests for `format.ts` | |

## Known issues

None recorded.
