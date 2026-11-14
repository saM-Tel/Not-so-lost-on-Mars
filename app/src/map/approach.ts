// WHAT:    Adds the approach imagery to the map: three rings of real orbital images around the site in focus, so the land
//          around a site stays sharp while the person zooms in instead of showing the stretched whole-planet image (F14, F1).
// IN:      The map; public/data/approach/layers.json, written by pipeline/build_approach.py.
// OUT:     One raster source and layer per ring of the site in focus, each limited to its own bounds and zooms.
// USED BY: src/main.ts.
// RULES:   A ring appears only if its record is complete; its credit shows while it is on screen. Optional: if the file is
//          missing the globe works as before. Sits beneath the site's own image (map/slots.ts). Only the rings of the
//          site whose wide ring holds the middle of the view are on the map: 3 sources, not 27 (review item R20).
// TRAPS:   PITFALLS 4, 10. Ring tiles are 256 pixels, so MapLibre asks for them one zoom above the map's own zoom.
// OWNER:   Role B.

import type { Map as MapLibreMap } from 'maplibre-gl';
import type { LayerRecord } from '../data/contract';
import { loadLayers } from '../data/layers';

/** Order of the rings: coarse under fine, whichever site they belong to (review item R11). */
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

/** The map zoom from which a ring's coarsest tiles are used. 256-pixel tiles at zoom z serve the map at zoom z - 1 (review item R12). */
function firstMapZoom(ring: LayerRecord): number {
  return Math.max(0, (ring.tiles?.minZoom ?? 0) - ((ring.tiles?.tileSizePx ?? 512) === 256 ? 1 : 0));
}

/**
 * Add rings as raster layers beneath `beforeLayerId`, coarse first, so finer rings are drawn on top. MapLibre asks
 * for a ring's tiles only when the view is inside its bounds and zooms. Past a ring's finest zoom MapLibre keeps
 * drawing it stretched, which fills the space around the next, smaller ring. Returns the ids added.
 */
export function addApproachLayers(map: MapLibreMap, rings: LayerRecord[], folderUrl: string, beforeLayerId?: string): string[] {
  const sorted = [...rings].sort((a, b) =>
    RING_ORDER[a.ring ?? 'wide'] - RING_ORDER[b.ring ?? 'wide'] || String(a.siteId).localeCompare(String(b.siteId)));
  const ids: string[] = [];
  for (const ring of sorted) {
    const tiles = ring.tiles;
    const box = tiles?.bounds;
    if (!tiles || !box || map.getSource(ring.id)) continue;
    map.addSource(ring.id, {
      type: 'raster',
      tiles: [folderUrl + tiles.path],
      tileSize: tiles.tileSizePx,
      minzoom: tiles.minZoom,
      maxzoom: tiles.maxZoom,
      bounds: [box.westLonDeg, box.southLatDeg, box.eastLonDeg, box.northLatDeg],
      attribution: `${ring.title}: ${ring.credit}`,
    });
    // Shown from the ring's coarsest tiles; below that it would be a speck on the globe.
    map.addLayer({ id: ring.id, type: 'raster', source: ring.id, minzoom: firstMapZoom(ring), paint: { 'raster-fade-duration': 150 } }, beforeLayerId);
    ids.push(ring.id);
  }
  return ids;
}

/** Take rings off the map by id. */
function removeApproachLayers(map: MapLibreMap, ids: readonly string[]): void {
  for (const id of ids) {
    if (map.getLayer(id)) map.removeLayer(id);
    if (map.getSource(id)) map.removeSource(id);
  }
}

/** Whether a position lies inside a ring's bounds. */
function inside(ring: LayerRecord, lon: number, lat: number): boolean {
  const box = ring.tiles?.bounds;
  return !!box && lon >= box.westLonDeg && lon <= box.eastLonDeg && lat >= box.southLatDeg && lat <= box.northLatDeg;
}

/**
 * Keep only the rings of the site in focus on the map: the site whose wide ring holds the middle of the view, the
 * nearest one by its ring's centre if two do. Checked on every move, which costs a few comparisons; layers change
 * only when the site in focus changes, so a flight into a site has its rings before it arrives. Returns a stop function.
 */
export function watchApproachRings(map: MapLibreMap, rings: LayerRecord[], folderUrl: string, beforeLayerId?: string): () => void {
  const bySite = new Map<string, LayerRecord[]>();
  for (const ring of rings) {
    const siteId = String(ring.siteId);
    bySite.set(siteId, [...(bySite.get(siteId) ?? []), ring]);
  }
  /** The widest ring of each site, used to decide which site is in focus. */
  const widest = [...bySite.entries()].map(([siteId, list]) => ({
    siteId,
    ring: [...list].sort((a, b) => RING_ORDER[a.ring ?? 'wide'] - RING_ORDER[b.ring ?? 'wide'])[0]!,
  }));
  /** No ring is drawn below this zoom, so there is no site in focus. */
  const fromZoom = Math.min(...rings.map(firstMapZoom)) - 1;
  let focusId: string | null = null;
  let added: string[] = [];

  const update = (): void => {
    let next: string | null = null;
    if (map.getZoom() >= fromZoom) {
      const { lng, lat } = map.getCenter();
      let best = Infinity;
      for (const { siteId, ring } of widest) {
        if (!inside(ring, lng, lat)) continue;
        const box = ring.tiles!.bounds!;
        const away = Math.hypot(lng - (box.westLonDeg + box.eastLonDeg) / 2, lat - (box.southLatDeg + box.northLatDeg) / 2);
        if (away < best) { best = away; next = siteId; }
      }
    }
    if (next === focusId) return;
    removeApproachLayers(map, added);
    added = next ? addApproachLayers(map, bySite.get(next) ?? [], folderUrl, beforeLayerId) : [];
    focusId = next;
  };
  map.on('move', update);
  update();
  return () => {
    map.off('move', update);
    removeApproachLayers(map, added);
    added = [];
    focusId = null;
  };
}
