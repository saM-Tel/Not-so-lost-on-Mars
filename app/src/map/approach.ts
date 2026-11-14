// WHAT:    Adds the approach imagery to the map: three rings of real orbital images around every site, so the land around a
//          site stays sharp while the person zooms in instead of showing the stretched whole-planet image (F14, F1).
// IN:      The map; public/data/approach/layers.json, written by pipeline/build_approach.py.
// OUT:     One raster source and layer per ring, each limited to its own bounds and zooms.
// USED BY: src/main.ts.
// RULES:   A ring appears only if its record is complete; its credit shows while it is on screen. Optional: if the file is
//          missing the globe works as before. Must sit under the site's own image, which main.ts adds later.
// TRAPS:   PITFALLS 4, 10.
// OWNER:   Role B.

import type { Map as MapLibreMap } from 'maplibre-gl';
import type { LayerRecord } from '../data/contract';
import { loadLayers } from '../data/layers';

/** Order inside one site: coarse under fine. */
const RING_ORDER = { wide: 0, mid: 1, near: 2 } as const;

/** The usable approach rings, or none when the file is absent or unreadable. Never throws. */
export async function loadApproachLayers(url: string): Promise<LayerRecord[]> {
  try {
    const { usable, rejected } = await loadLayers(url);
    for (const r of rejected) console.warn(`Approach imagery '${r.id}' left out: ${r.problems.join(', ')}`);
    return usable.filter((layer) => layer.tiles?.bounds !== undefined);
  } catch (error) {
    console.warn('No approach imagery:', error instanceof Error ? error.message : error);
    return [];
  }
}

/**
 * Add every ring as a raster layer above the whole-planet image. MapLibre asks for a ring's tiles only when the
 * view is inside its bounds and zooms, so the globe view costs nothing. Past a ring's finest zoom MapLibre keeps
 * drawing it stretched, which fills the space around the next, smaller ring.
 */
export function addApproachLayers(map: MapLibreMap, rings: LayerRecord[], folderUrl: string, beforeLayerId?: string): string[] {
  const sorted = [...rings].sort((a, b) =>
    String(a.siteId).localeCompare(String(b.siteId)) || RING_ORDER[a.ring ?? 'wide'] - RING_ORDER[b.ring ?? 'wide']);
  const ids: string[] = [];
  for (const ring of sorted) {
    const tiles = ring.tiles;
    const box = tiles?.bounds;
    if (!tiles || !box) continue;
    map.addSource(ring.id, {
      type: 'raster',
      tiles: [folderUrl + tiles.path],
      tileSize: tiles.tileSizePx,
      minzoom: tiles.minZoom,
      maxzoom: tiles.maxZoom,
      bounds: [box.westLonDeg, box.southLatDeg, box.eastLonDeg, box.northLatDeg],
      attribution: `${ring.title}: ${ring.credit}`,
    });
    // Shown from the ring's coarsest zoom; below that it would be a speck on the globe.
    map.addLayer({ id: ring.id, type: 'raster', source: ring.id, minzoom: tiles.minZoom, paint: { 'raster-fade-duration': 150 } }, beforeLayerId);
    ids.push(ring.id);
  }
  return ids;
}
