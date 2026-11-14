// WHAT:    Loads one built site: site.json and layers.json so far (F1). Still to add: routing grids as typed arrays, and vectors (F2 to F4).
// IN:      A site id; files under public/data/<site id>/.
// OUT:     The site in memory, or an error with a plain reason.
// USED BY: src/main.ts, src/map/siteLayers.ts.
// RULES:   Never reads from the team data server. A missing optional file switches its feature off and says why.
// TRAPS:   PITFALLS 10.
// OWNER:   Role B.

import type { LayerRecord, SiteFile } from './contract';
import { loadLayers, type LoadedLayers } from './layers';

export interface LoadedSite {
  site: SiteFile;
  layers: LoadedLayers;
  /** Address of the site's folder, ending in '/'. Tile paths in layers.json are relative to it. */
  folderUrl: string;
  /** The image layer to draw on the ground, if its record is complete. */
  image: LayerRecord | null;
  /** The terrain layer for the 3D surface, if its record is complete. */
  terrain: LayerRecord | null;
}

const loaded = new Map<string, Promise<LoadedSite>>();

async function fetchSite(dataUrl: string, siteId: string): Promise<LoadedSite> {
  const folderUrl = `${dataUrl}${siteId}/`;
  const response = await fetch(`${folderUrl}site.json`);
  if (!response.ok) throw new Error(`Could not load the site '${siteId}' (status ${response.status}).`);
  const site = (await response.json()) as SiteFile;
  const box = site.box;
  const numbers = [box?.westLonDeg, box?.eastLonDeg, box?.southLatDeg, box?.northLatDeg, site.terrainHeightM?.lowest];
  if (site.id !== siteId || numbers.some((n) => typeof n !== 'number' || !Number.isFinite(n))) {
    throw new Error(`The file for the site '${siteId}' is incomplete, so the site cannot be opened.`);
  }
  const layers = await loadLayers(`${folderUrl}layers.json`);
  const withTiles = layers.usable.filter((layer) => layer.tiles !== undefined);
  return {
    site,
    layers,
    folderUrl,
    image: withTiles.find((layer) => layer.dataType === 'optical') ?? null,
    terrain: withTiles.find((layer) => layer.dataType === 'topographic' && layer.tiles?.encoding === 'mapbox') ?? null,
  };
}

/** Load a built site once; later calls reuse the first answer. */
export function loadSite(dataUrl: string, siteId: string): Promise<LoadedSite> {
  let promise = loaded.get(siteId);
  if (!promise) {
    promise = fetchSite(dataUrl, siteId);
    loaded.set(siteId, promise);
    promise.catch(() => loaded.delete(siteId));
  }
  return promise;
}
