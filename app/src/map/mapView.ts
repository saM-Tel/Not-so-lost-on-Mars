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
/** The one-picture globe drawn under the tiles. */
const OVERVIEW_ID = 'globe-overview';
/** Northern edge of the Web Mercator square, degrees: atan(sinh(pi)). The overview covers it from edge to edge. */
const MERCATOR_MAX_LAT_DEG = (Math.atan(Math.sinh(Math.PI)) * 180) / Math.PI;

export interface GlobeMapOptions {
  container: HTMLElement;
  /** Record of the whole-planet image. It must have tiles. */
  image: LayerRecord;
  /** Address of the folder holding that record's layers.json, ending in '/'. */
  folderUrl: string;
  /** Where the globe faces when it opens. */
  center: LonLat;
}

/**
 * A button that gives the whole screen to the map by hiding the side panel, and brings the panel back.
 * On a phone the panel takes almost half the screen, which leaves too little map to plan on.
 */
function fullMapControl(map: MapLibreMap): { onAdd(): HTMLElement; onRemove(): void } {
  const box = document.createElement('div');
  box.className = 'maplibregl-ctrl maplibregl-ctrl-group';
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'full-map-button';
  const show = (full: boolean): void => {
    document.body.classList.toggle('map-full', full);
    button.textContent = full ? 'Show panel' : 'Full map';
    button.setAttribute('aria-pressed', String(full));
    // The map's box has changed size; tell MapLibre once the page has laid it out again.
    requestAnimationFrame(() => map.resize());
  };
  button.addEventListener('click', () => show(!document.body.classList.contains('map-full')));
  show(false);
  box.append(button);
  return { onAdd: () => box, onRemove: () => { document.body.classList.remove('map-full'); box.remove(); } };
}

/** The whole-planet view. Site layers are added later by siteLayers.ts when a site is opened. */
export function createGlobeMap(options: GlobeMapOptions): MapLibreMap {
  const { container, image, folderUrl, center } = options;
  if (!image.tiles) throw new Error(`Layer '${image.id}' has no tiles to draw.`);

  // The whole planet as one picture, when the pipeline wrote one: it loads in a single request at the start and stays
  // under the tiles, so the globe shows whole at once instead of filling in tile by tile, and never shows gaps while
  // finer tiles load. Tiles are drawn only from the zoom where they hold more detail than it (256-pixel tiles at
  // zoom z serve the map at zoom z - 1).
  const overview = image.overview;
  const tilesFromZoom = overview ? overview.zoom : 0;
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
      ...(overview ? {
        [OVERVIEW_ID]: {
          type: 'image' as const,
          url: folderUrl + overview.path,
          coordinates: [
            [-180, MERCATOR_MAX_LAT_DEG], [180, MERCATOR_MAX_LAT_DEG], [180, -MERCATOR_MAX_LAT_DEG], [-180, -MERCATOR_MAX_LAT_DEG],
          ] as [[number, number], [number, number], [number, number], [number, number]],
        },
      } : {}),
    },
    layers: [
      { id: 'space', type: 'background', paint: { 'background-color': SPACE_COLOUR } },
      ...(overview ? [{ id: OVERVIEW_ID, type: 'raster' as const, source: OVERVIEW_ID, paint: { 'raster-fade-duration': 0 } }] : []),
      { id: image.id, type: 'raster', source: image.id, minzoom: tilesFromZoom },
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
    // Phone and high-density laptop screens report 2.5 to 3 device pixels per CSS pixel. Drawing the globe, the
    // 3D terrain and every overlay at that density costs up to twice the work of 2 and looks no sharper on a map.
    pixelRatio: Math.min(window.devicePixelRatio || 1, 2),
    // Credit stays written out in full; it is never folded away behind a button. It also says AI was used to write
    // the app, so the statement is on screen in every view (Project Submission Guide).
    attributionControl: { compact: false, customAttribution: 'App code written with an AI assistant (Claude Code)' },
  });
  // Zoom and compass only. MapLibre's scale control is left out on purpose: it assumes Earth.
  map.addControl(new NavigationControl({ visualizePitch: true }), 'top-right');
  map.addControl(fullMapControl(map), 'top-right');
  // The map's box changes size whenever a panel opens, folds or hides (the walk column, full map, the field views,
  // first person). MapLibre only watches the window, so the map is told here, whatever caused the change.
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => map.resize()).observe(container);
  return map;
}
