// WHAT:    Adds a built site's image and 3D terrain (which may reach past the box, from a coarser model) to the map and takes
//          them away again (F1), and draws computed sun shading for a chosen Sun position (F11).
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
/** The map layer that draws the ground image, for the layer panel's switch and opacity control. */
export const SITE_IMAGE_LAYER_ID = IMAGE_ID;
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
    // MapLibre believes the planet is Earth-sized, so horizontal distances are stretched by the
    // radius ratio. Heights are stretched by the same ratio to keep every slope true.
    map.setTerrain({ source: TERRAIN_ID, exaggeration: MAPLIBRE_METRES_PER_MARS_METRE });
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
    map.addSource(SHADE_ID, {
      type: 'raster-dem', tiles: [loaded.folderUrl + terrain.path], tileSize: terrain.tileSizePx,
      minzoom: terrain.minZoom, maxzoom: terrain.maxZoom, encoding: 'custom',
      redFactor: 6553.6, greenFactor: 25.6, blueFactor: 0.1, baseShift: -10000,
      bounds: [box.westLonDeg, box.southLatDeg, box.eastLonDeg, box.northLatDeg],
    });
    // Under the site image would hide it; over it, half see-through, so the ground still shows.
    // Beneath keep-out shading and the route lines, which must stay readable.
    const below = ['route-keep-out', 'route-tether', 'route-lines-edge'].find((id) => map.getLayer(id));
    map.addLayer({
      id: SHADE_ID, type: 'hillshade', source: SHADE_ID,
      paint: { 'hillshade-illumination-anchor': 'map', 'hillshade-exaggeration': 0.7, 'hillshade-highlight-color': 'rgba(255,255,255,0)' },
    }, below);
  }
  map.setLayoutProperty(SHADE_ID, 'visibility', sun ? 'visible' : 'none');
  if (!sun) return;
  map.setPaintProperty(SHADE_ID, 'hillshade-illumination-direction', sun.azimuthDeg);
  // Lower Sun, darker shading on slopes facing away from it. Newer MapLibre also takes the Sun's height directly.
  map.setPaintProperty(SHADE_ID, 'hillshade-shadow-color', `rgba(0,0,0,${Math.min(0.85, 0.35 + (60 - Math.max(0, sun.elevationDeg)) / 100)})`);
  try {
    map.setPaintProperty(SHADE_ID, 'hillshade-illumination-altitude' as 'hillshade-exaggeration', Math.max(1, sun.elevationDeg));
  } catch { /* older style spec: direction and darkness only */ }
}

/** Take the site's image and terrain off the map. Safe to call when none is shown. */
export function removeSiteLayers(map: MapLibreMap): void {
  if (map.getLayer(SHADE_ID)) map.removeLayer(SHADE_ID);
  if (map.getSource(SHADE_ID)) map.removeSource(SHADE_ID);
  if (map.getTerrain()) map.setTerrain(null);
  if (map.getLayer(IMAGE_ID)) map.removeLayer(IMAGE_ID);
  if (map.getSource(IMAGE_ID)) map.removeSource(IMAGE_ID);
  if (map.getSource(TERRAIN_ID)) map.removeSource(TERRAIN_ID);
}
