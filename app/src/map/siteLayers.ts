// WHAT:    Adds a built site's image and 3D terrain (which may reach past the box, from a coarser model) to the map and takes
//          them away again (F1), and draws computed sun shading for a chosen Sun position (F11).
// IN:      The map; a loaded site.
// OUT:     Map sources and layers; the map's terrain setting.
// USED BY: src/main.ts.
// RULES:   A layer appears only if its record in layers.json is complete. Heights are scaled by the Earth to Mars radius ratio.
//          3D terrain is on only from zoom 12.2 inwards, past MapLibre's globe-to-flat blend (see TERRAIN_ON_FROM_ZOOM).
// TRAPS:   PITFALLS 3, 4, 5, 10.
// OWNER:   Role B.

import type { Map as MapLibreMap } from 'maplibre-gl';
import type { LoadedSite } from '../data/loadSite';
import { MAPLIBRE_METRES_PER_MARS_METRE } from '../mars/constants';
import { SLOT } from './slots';

const IMAGE_ID = 'site-image';
/** The map layer that draws the ground image, for the layer panel's switch and opacity control. */
export const SITE_IMAGE_LAYER_ID = IMAGE_ID;
const TERRAIN_ID = 'site-terrain';

/**
 * The ground is raised into 3D only from this zoom inwards. MapLibre 6.18's globe blends into the flat map between
 * zoom 11 and 12 (`projection_factory.ts`); with terrain on during that blend, part of the screen was left black and
 * labels jumped away from the ground (seen by the team owner on 14 Nov). Switched on just past the blend and off just
 * before it, a little apart, so it does not flicker at one zoom.
 */
const TERRAIN_ON_FROM_ZOOM = 12.2;
const TERRAIN_OFF_BELOW_ZOOM = 12.0;
/** Stops watching the zoom for the site now shown; nothing when no site is shown. */
let stopTerrainWatch = (): void => {};

/** Switch the site's terrain on and off with the zoom, as above. */
function watchTerrainZoom(map: MapLibreMap): void {
  const update = (): void => {
    const zoom = map.getZoom();
    const on = map.getTerrain() !== null;
    if (!on && zoom >= TERRAIN_ON_FROM_ZOOM) {
      // MapLibre believes the planet is Earth-sized, so horizontal distances are stretched by the
      // radius ratio. Heights are stretched by the same ratio to keep every slope true.
      map.setTerrain({ source: TERRAIN_ID, exaggeration: MAPLIBRE_METRES_PER_MARS_METRE });
    } else if (on && zoom < TERRAIN_OFF_BELOW_ZOOM) {
      map.setTerrain(null);
    }
  };
  map.on('zoom', update);
  update();
  stopTerrainWatch = () => map.off('zoom', update);
}

/**
 * Draw the site's image on the ground and raise the ground into 3D. Returns what could not be shown, in words.
 * `beforeLayerId` is a layer the image must sit beneath, so markers stay on top.
 */
export function showSiteLayers(map: MapLibreMap, loaded: LoadedSite, beforeLayerId?: string): string[] {
  removeSiteLayers(map);
  const notShown: string[] = [];
  const { site, folderUrl, image, terrain } = loaded;
  const bounds: [number, number, number, number] = [
    site.box.westLonDeg, site.box.southLatDeg, site.box.eastLonDeg, site.box.northLatDeg,
  ];

  if (image?.tiles) {
    map.addSource(IMAGE_ID, {
      type: 'raster',
      tiles: [folderUrl + image.tiles.path],
      tileSize: image.tiles.tileSizePx,
      minzoom: image.tiles.minZoom,
      maxzoom: image.tiles.maxZoom,
      bounds,
      attribution: `${image.title}: ${image.credit}`,
    });
    map.addLayer({ id: IMAGE_ID, type: 'raster', source: IMAGE_ID }, beforeLayerId);
  } else {
    notShown.push('The ground image is not shown because its record is incomplete.');
  }

  if (terrain?.tiles) {
    // The files hold true heights relative to the areoid, which at Jezero are more than 2 km below
    // zero. Outside the box the map has no terrain and sits at zero, so drawn as stored the site
    // would lie at the bottom of a square pit. The lowest height in the box is subtracted at draw
    // time only: the terrain is drawn relative to its own lowest point, and every height shown to
    // the user is still the true one from the file.
    // Terrain may reach past the box: the pipeline can add a coarser model round it so the box does not stand
    // above flat ground (tiles.bounds). Its outer edge is eased to the box's lowest point, which is drawn at zero.
    const terrainBox = terrain.tiles.bounds;
    map.addSource(TERRAIN_ID, {
      type: 'raster-dem',
      tiles: [folderUrl + terrain.tiles.path],
      tileSize: terrain.tiles.tileSizePx,
      minzoom: terrain.tiles.minZoom,
      maxzoom: terrain.tiles.maxZoom,
      bounds: terrainBox
        ? [terrainBox.westLonDeg, terrainBox.southLatDeg, terrainBox.eastLonDeg, terrainBox.northLatDeg]
        : bounds,
      encoding: 'custom',
      redFactor: 6553.6,
      greenFactor: 25.6,
      blueFactor: 0.1,
      baseShift: -10000 - site.terrainHeightM.lowest,
      attribution: `${terrain.title}: ${terrain.credit}`,
    });
    watchTerrainZoom(map);
  } else {
    notShown.push('The ground is drawn flat because the terrain record is incomplete.');
  }
  return notShown;
}

const SHADE_ID = 'site-sun-shading';

/**
 * Computed shading of the 3D ground for a Sun position (F11): MapLibre's hillshade, lit from the Sun's azimuth and
 * height. Not real shadows: it shades slopes facing away from the Sun but does not cast shadows across the ground.
 * Pass null to hide it.
 */
export function setSunShading(map: MapLibreMap, loaded: LoadedSite, sun: { azimuthDeg: number; elevationDeg: number } | null): void {
  const terrain = loaded.terrain?.tiles;
  if (!terrain) return;
  if (!map.getSource(SHADE_ID)) {
    const box = terrain.bounds ?? loaded.site.box;
    // MapLibre works out slopes for shading against Earth-sized pixels, which are wider than Mars ones by the radius
    // ratio, so every slope came out about half as steep as it is (review item R10). Heights scaled by the same ratio
    // give true slopes, as for the 3D ground.
    const k = MAPLIBRE_METRES_PER_MARS_METRE;
    map.addSource(SHADE_ID, {
      type: 'raster-dem', tiles: [loaded.folderUrl + terrain.path], tileSize: terrain.tileSizePx,
      minzoom: terrain.minZoom, maxzoom: terrain.maxZoom, encoding: 'custom',
      redFactor: 6553.6 * k, greenFactor: 25.6 * k, blueFactor: 0.1 * k, baseShift: -10000 * k,
      bounds: [box.westLonDeg, box.southLatDeg, box.eastLonDeg, box.northLatDeg],
    });
    // Over the site image, half see-through, so the ground still shows; beneath the analysis layers, keep-out,
    // tether and route, which must keep their own colours (review item R9).
    map.addLayer({
      id: SHADE_ID, type: 'hillshade', source: SHADE_ID,
      paint: {
        // 'basic' lights each slope from the Sun's direction and height, so a low Sun darkens more ground; the
        // default method ignores the height and fades away on gentle slopes, which made the Sun controls look dead.
        // At an intensity of 0.5 it uses the slopes as they are.
        'hillshade-method': 'basic',
        'hillshade-exaggeration': 0.5,
        'hillshade-illumination-anchor': 'map',
        'hillshade-shadow-color': 'rgba(0,0,0,0.75)',
        'hillshade-highlight-color': 'rgba(255,255,255,0)',
      },
    }, SLOT.shading);
  }
  map.setLayoutProperty(SHADE_ID, 'visibility', sun ? 'visible' : 'none');
  if (!sun) return;
  map.setPaintProperty(SHADE_ID, 'hillshade-illumination-direction', sun.azimuthDeg);
  map.setPaintProperty(SHADE_ID, 'hillshade-illumination-altitude', Math.max(0, sun.elevationDeg));
}

/** Take the site's image and terrain off the map. Safe to call when none is shown. */
export function removeSiteLayers(map: MapLibreMap): void {
  stopTerrainWatch();
  stopTerrainWatch = () => {};
  if (map.getLayer(SHADE_ID)) map.removeLayer(SHADE_ID);
  if (map.getSource(SHADE_ID)) map.removeSource(SHADE_ID);
  if (map.getTerrain()) map.setTerrain(null);
  if (map.getLayer(IMAGE_ID)) map.removeLayer(IMAGE_ID);
  if (map.getSource(IMAGE_ID)) map.removeSource(IMAGE_ID);
  if (map.getSource(TERRAIN_ID)) map.removeSource(TERRAIN_ID);
}
