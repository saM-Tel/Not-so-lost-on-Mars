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
| `mapView.ts` | Creates the MapLibre map: globe view with the global Mars image (one overview picture under the tiles, which start at zoom 3), the corrections MapLibre needs for Mars, and the "Full map" button that hides the side panel | F14, F1 |
| `approach.ts` | Adds the approach imagery: three rings of real orbital images around the site in focus (the one whose wide ring holds the middle of the view), each limited to its bounds and zooms, so the land around a site stays sharp while zooming in | F14, F1 |
| `slots.ts` | Fixed places in the layer order: hidden marker layers that every other layer is added beneath, so the order is always rings, site image, sun shading, analysis layers, keep-out, tether, route lines, rover stops | F1 to F4, F11, F14 |
| `siteMarkers.ts` | Draws a tall column, a name and a pulse at each landing site on the globe, and reports clicks | F14 |
| `flight.ts` | Camera moves: globe to a site, a site back to the globe, and the slow idle turn of the globe | F14, F7 |
| `zoomSelect.ts` | Selects a site when the person zooms in on it by hand: from zoom 4 inwards, the nearest site within the middle of the view | F14 |
| `zoomSelect.test.ts` | Tests for choosing the site in focus, on made-up positions | |
| `siteLayers.ts` | Adds a built site's image and 3D terrain (terrain may reach past the box, `tiles.bounds`; on only from zoom 12.2 inwards) and takes them away again; computed sun shading for a Sun position (hillshade lit from the Sun's direction and height, on true Mars slopes) | F1, F11 |
| `orbiters.ts` | The orbiters on the globe (F18): a labelled dot at the point below each one now and its track 45 minutes either side, moved every second, up to zoom 8; credited as predicted from JPL Horizons | F18 |
| `astronaut.ts` | The walk-through's astronaut (F19): legs, body, arms, pack and helmet as raised shapes, 1.8 m tall in Mars metres with heights scaled like the terrain, facing the way it walks, with a name pin | F19 |
| `legend.ts` | Legends for map layers (named colours or a ramp) and the colour-blind-safe ramp the slope layer is drawn with | F2 |
| `overlays.ts` | A built site's layers as things the layer panel can switch and fade: the ground image, slope drawn from the routing grid, the rover's path and stops, and any tiled or polygon layer the pipeline coloured itself (night-time warmth, geology), with the legend from its record | F2, F12 |
| `scaleBar.ts` | Our own scale bar, correct for Mars; shown from zoom 7 inwards | F1 |
| `scaleBar.test.ts` | Tests for the scale bar's arithmetic | |
| `routeLayer.ts` | Draws keep-out ground in red, the tether picture (a canvas the map reads directly, so the time slider stays smooth), home, the target, and the route out and back | F3, F4 |

## Known issues

- MapLibre 6 looks for its worker file beside its own module. Under Vite that address is wrong, so `mapView.ts` sets it with `setWorkerUrl`. Without it the map stays blank.
- MapLibre 6 has no default export. Import names: `import { Map } from 'maplibre-gl'`.
- A polygon cannot change size with zoom, so `siteMarkers.ts` keeps one set of columns for each half step of zoom. Column heights are scaled by the Earth to Mars radius ratio like every other height.
- MapLibre 6.18's globe blends into the flat map between zoom 11 and 12. With 3D terrain on during that blend, part of the screen was drawn black and labels jumped (seen 14 Nov), so `siteLayers.ts` switches terrain on only from zoom 12.2 and off below 12.0.
- Terrain files hold true heights relative to the areoid. `siteLayers.ts` subtracts the box's lowest height at draw time only, because outside the box the map has no terrain and sits at zero; without that the site would lie at the bottom of a pit about 2.3 km deep. The box still stands apart from its surroundings at its edges until context terrain is added; with the approach imagery around it this now shows clearly (docs/REVIEW_QUEUE.md, item 1).
- `mapView.ts` caps the drawing density at 2 device pixels per CSS pixel. Above that the map costs much more to draw and looks no sharper.
- A browser screenshot taken with a "virtual time" budget does not show the columns while the globe is turning. Use a scripted browser that waits in real time.
