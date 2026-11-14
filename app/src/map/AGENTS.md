# app/src/map: guide

## Purpose

The MapLibre map: the Mars globe with its site markers, the fly-in, and a site's image, terrain and overlay layers.

## Owner

Role B.

## Commands

Run from `app/`. They are listed in [../AGENTS.md](../AGENTS.md).

## Reads and writes

Reads loaded site data from `../data/`. Writes nothing.

## Rules for this folder

- All geometry goes through `../mars/`. No MapLibre distance, area or scale function; they assume Earth.
- Terrain heights are scaled by the Earth to Mars radius ratio. The built-in scale bar and the atmosphere glow stay off.
- A layer appears only if its record in `layers.json` is complete, and its credit is visible.
- Red means danger and nothing else. Site markers show readiness level in other colours.
- Every file starts with the header from [../../docs/WORKFLOW.md](../../docs/WORKFLOW.md). A file with only its header is not built yet.

## File index

Add a row when you add a file. Remove it when you delete one.

| File | What it does | Feature |
|---|---|---|
| `mapView.ts` | Creates the MapLibre map: globe view with the global Mars image, and the corrections MapLibre needs for Mars | F14, F1 |
| `siteMarkers.ts` | Draws a tall column, a name and a pulse at each landing site on the globe, and reports clicks | F14 |
| `flight.ts` | Camera moves: globe to a site, a site back to the globe, and the slow idle turn of the globe | F14, F7 |
| `siteLayers.ts` | Adds a site's image, 3D terrain and overlay layers from layers.json, with opacity control | F1, F2 |
| `legend.ts` | Builds the legend for each layer from its record | F2 |
| `scaleBar.ts` | Our own scale bar, correct for Mars | F1 |
| `routeLayer.ts` | Draws targets, the route, and the cautious and expected tether lines on the map | F3, F4 |

## Known issues

None recorded.
