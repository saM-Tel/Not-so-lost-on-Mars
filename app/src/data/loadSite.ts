// WHAT:    Loads one built site: site.json, layers.json, validation.json and the routing grid files (F1, F3, F9). Still to add: vectors (F2).
// IN:      A site id; files under public/data/<site id>/.
// OUT:     The site in memory, or an error with a plain reason.
// USED BY: src/main.ts, src/map/siteLayers.ts.
// RULES:   Never reads from the team data server. A missing optional file switches its feature off and says why.
// TRAPS:   PITFALLS 10.
// OWNER:   Role B.

import type { LayerRecord, SiteFile, ValidationFile } from './contract';
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
  /** The checks of our terrain against the rover's measurements, or null when the site has none. */
  validation: ValidationFile | null;
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
  // Optional: a site without this file simply shows no checks.
  const validation = await fetch(`${folderUrl}validation.json`)
    .then((r) => (r.ok ? (r.json() as Promise<ValidationFile>) : null))
    .catch(() => null);
  return {
    site,
    layers,
    folderUrl,
    validation,
    image: withTiles.find((layer) => layer.dataType === 'optical') ?? null,
    terrain: withTiles.find((layer) => layer.dataType === 'topographic' && layer.tiles?.encoding === 'mapbox') ?? null,
  };
}

/**
 * Fetch the site's two routing grid files. Each call fetches again, because the buffers are handed to the
 * route worker and cannot be reused. Throws with a plain reason if the site has no grids or a file is missing.
 */
export async function loadRoutingGridFiles(loaded: LoadedSite): Promise<{ heightM: ArrayBuffer; slopeMaxDeg: ArrayBuffer }> {
  const definition = loaded.site.grid;
  if (!definition) throw new Error('This site has no routing grids, so routes cannot be planned here.');
  const fetchFile = async (name: string): Promise<ArrayBuffer> => {
    const file = definition.files.find((f) => f.name === name);
    if (!file) throw new Error(`The routing grid '${name}' is not listed for this site.`);
    if (file.numberType !== 'float32' || definition.byteOrder !== 'little-endian') {
      throw new Error(`The routing grid '${name}' is stored in a form this version cannot read.`);
    }
    const response = await fetch(loaded.folderUrl + file.path);
    if (!response.ok) throw new Error(`Could not load the routing grid '${name}' (status ${response.status}).`);
    const buffer = await response.arrayBuffer();
    if (buffer.byteLength !== definition.rows * definition.cols * 4) {
      throw new Error(`The routing grid '${name}' is not the size its definition says.`);
    }
    return buffer;
  };
  const [heightM, slopeMaxDeg] = await Promise.all([fetchFile('heightM'), fetchFile('slopeMaxDeg')]);
  return { heightM, slopeMaxDeg };
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
