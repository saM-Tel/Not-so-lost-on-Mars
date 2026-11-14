// WHAT:    Adds a built site's image and 3D terrain to the map, and takes them away again (F1). Still to add: overlay layers with opacity control (F2).
// IN:      The map; a loaded site.
// OUT:     Map sources and layers; the map's terrain setting.
// USED BY: src/main.ts.
// RULES:   A layer appears only if its record in layers.json is complete. Heights are scaled by the Earth to Mars radius ratio.
// TRAPS:   PITFALLS 3, 4, 5.
// OWNER:   Role B.

import type { Map as MapLibreMap } from 'maplibre-gl';
import type { LoadedSite } from '../data/loadSite';
import { MAPLIBRE_METRES_PER_MARS_METRE } from '../mars/constants';

const IMAGE_ID = 'site-image';
const TERRAIN_ID = 'site-terrain';

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
    map.addSource(TERRAIN_ID, {
      type: 'raster-dem',
      tiles: [folderUrl + terrain.tiles.path],
      tileSize: terrain.tiles.tileSizePx,
      minzoom: terrain.tiles.minZoom,
      maxzoom: terrain.tiles.maxZoom,
      bounds,
      encoding: 'custom',
      redFactor: 6553.6,
      greenFactor: 25.6,
      blueFactor: 0.1,
      baseShift: -10000 - site.terrainHeightM.lowest,
      attribution: `${terrain.title}: ${terrain.credit}`,
    });
    // MapLibre believes the planet is Earth-sized, so horizontal distances are stretched by the
    // radius ratio. Heights are stretched by the same ratio to keep every slope true.
    map.setTerrain({ source: TERRAIN_ID, exaggeration: MAPLIBRE_METRES_PER_MARS_METRE });
  } else {
    notShown.push('The ground is drawn flat because the terrain record is incomplete.');
  }
  return notShown;
}

/** Take the site's image and terrain off the map. Safe to call when none is shown. */
export function removeSiteLayers(map: MapLibreMap): void {
  if (map.getTerrain()) map.setTerrain(null);
  if (map.getLayer(IMAGE_ID)) map.removeLayer(IMAGE_ID);
  if (map.getSource(IMAGE_ID)) map.removeSource(IMAGE_ID);
  if (map.getSource(TERRAIN_ID)) map.removeSource(TERRAIN_ID);
}
