// WHAT:    Creates the MapLibre map: globe view with the global Mars image, and the corrections MapLibre needs for Mars (F14, F1).
// IN:      A page element; the global image's layer record and the address of the folder its tiles sit in.
// OUT:     The map object.
// USED BY: src/main.ts and the other files in src/map.
// RULES:   Built-in scale bar off. Terrain heights scaled by the Earth to Mars radius ratio. No Earth-like atmosphere glow. The image credit is always visible.
// TRAPS:   PITFALLS 3, 4, 11.
// OWNER:   Role B.

import { Map as MapLibreMap, NavigationControl, setWorkerUrl, type StyleSpecification } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
// MapLibre 6 looks for its worker file beside its own module. A bundler moves the module, so the
// worker's address has to be given explicitly.
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import type { LayerRecord } from '../data/contract';
import type { LonLat } from '../mars/geometry';

setWorkerUrl(new URL(workerUrl, document.baseURI).href);

/** Colour of the empty space around the globe. Also set on the page in style.css. */
const SPACE_COLOUR = '#07080c';

export interface GlobeMapOptions {
  container: HTMLElement;
  /** Record of the whole-planet image. It must have tiles. */
  image: LayerRecord;
  /** Address of the folder holding that record's layers.json, ending in '/'. */
  folderUrl: string;
  /** Where the globe faces when it opens. */
  center: LonLat;
}

/** The whole-planet view. Site layers are added later by siteLayers.ts when a site is opened. */
export function createGlobeMap(options: GlobeMapOptions): MapLibreMap {
  const { container, image, folderUrl, center } = options;
  if (!image.tiles) throw new Error(`Layer '${image.id}' has no tiles to draw.`);

  const style: StyleSpecification = {
    version: 8,
    projection: { type: 'globe' },
    // MapLibre's default sky adds a blue Earth-like glow around the globe. Mars has none like it.
    sky: { 'atmosphere-blend': 0 },
    sources: {
      [image.id]: {
        type: 'raster',
        // The braces must stay as they are, so the pattern is joined on, not passed through URL().
        tiles: [folderUrl + image.tiles.path],
        tileSize: image.tiles.tileSizePx,
        minzoom: image.tiles.minZoom,
        maxzoom: image.tiles.maxZoom,
        attribution: `${image.title}: ${image.credit}`,
      },
    },
    layers: [
      { id: 'space', type: 'background', paint: { 'background-color': SPACE_COLOUR } },
      { id: image.id, type: 'raster', source: image.id },
    ],
  };

  const map = new MapLibreMap({
    container,
    style,
    center,
    zoom: 1.6,
    minZoom: 0.6,
    maxPitch: 80,
    renderWorldCopies: false,
    // Credit stays written out in full; it is never folded away behind a button.
    attributionControl: { compact: false },
  });
  // Zoom and compass only. MapLibre's scale control is left out on purpose: it assumes Earth.
  map.addControl(new NavigationControl({ visualizePitch: true }), 'top-right');
  return map;
}
