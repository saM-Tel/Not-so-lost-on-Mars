# app/src/map: guide

## Purpose

The MapLibre map: the Mars globe with its site markers, the fly-in, and a site's image, terrain and overlay layers.

## Owner

Role B.

## Commands

Run from `app/`. They are listed in [../../AGENTS.md](../../AGENTS.md).

## Reads and writes

Reads loaded site data from `../data/`. Writes nothing.

## Rules for this folder

- All geometry goes through `../mars/`. No MapLibre distance, area or scale function; they assume Earth.
- Terrain heights are scaled by the Earth to Mars radius ratio. The built-in scale bar and the atmosphere glow stay off.
- A layer appears only if its record in `layers.json` is complete, and its credit is visible.
- Red means danger and nothing else. Site markers show readiness level in other colours.
- Every file starts with the header from [../../../docs/WORKFLOW.md](../../../docs/WORKFLOW.md). A file with only its header is not built yet.

## File index

Add a row when you add a file. Remove it when you delete one.

| File | What it does | Feature |
|---|---|---|
| `mapView.ts` | Creates the MapLibre map: globe view with the global Mars image, the corrections MapLibre needs for Mars, and the "Full map" button that hides the side panel | F14, F1 |
| `siteMarkers.ts` | Draws a tall column, a name and a pulse at each landing site on the globe, and reports clicks | F14 |
| `flight.ts` | Camera moves: globe to a site, a site back to the globe, and the slow idle turn of the globe | F14, F7 |
| `zoomSelect.ts` | Selects a site when the person zooms in on it by hand: from zoom 4 inwards, the nearest site within the middle of the view | F14 |
| `zoomSelect.test.ts` | Tests for choosing the site in focus, on made-up positions | |
| `siteLayers.ts` | Adds a built site's image and 3D terrain to the map and takes them away again. To add: overlay layers with opacity control | F1, F2 |
| `legend.ts` | Builds the legend for each layer from its record | F2 |
| `scaleBar.ts` | Our own scale bar, correct for Mars; shown from zoom 7 inwards | F1 |
| `scaleBar.test.ts` | Tests for the scale bar's arithmetic | |
| `routeLayer.ts` | Draws keep-out ground in red, the tether picture, home, the target, and the route out and back | F3, F4 |

## Known issues

- MapLibre 6 looks for its worker file beside its own module. Under Vite that address is wrong, so `mapView.ts` sets it with `setWorkerUrl`. Without it the map stays blank.
- MapLibre 6 has no default export. Import names: `import { Map } from 'maplibre-gl'`.
- A polygon cannot change size with zoom, so `siteMarkers.ts` keeps one set of columns for each half step of zoom. Column heights are scaled by the Earth to Mars radius ratio like every other height.
- Terrain files hold true heights relative to the areoid. `siteLayers.ts` subtracts the box's lowest height at draw time only, because outside the box the map has no terrain and sits at zero; without that the site would lie at the bottom of a pit about 2.3 km deep. The box still stands apart from its surroundings at its edges until context terrain is added.
- A browser screenshot taken with a "virtual time" budget does not show the columns while the globe is turning. Use a scripted browser that waits in real time.
