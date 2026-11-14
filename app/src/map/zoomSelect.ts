// WHAT:    Selects a site when the person zooms in on it by hand, without clicking its marker (F14).
// IN:      The map's centre and zoom after each move the person makes; the list of sites.
// OUT:     A call to `onSelect` with the site's id when a site is close to the middle of a zoomed-in view.
// USED BY: src/main.ts.
// RULES:   Only the person's own moves count, never a flight the app started. Distances use src/mars/geometry.ts.
// TRAPS:   PITFALLS 3, 11.
// OWNER:   Role B.

import type { Map as MapLibreMap } from 'maplibre-gl';
import type { SiteEntry } from '../data/contract';
import { distanceM, metresPerPixel, type LonLat } from '../mars/geometry';

/** MapLibre counts zoom on 512-pixel tiles. */
const MAP_TILE_PX = 512;
/** From this zoom inwards the view is about 2,700 km wide or less, so "the site in the middle" is clear. */
export const SELECT_FROM_ZOOM = 4;
/** A site counts as in the middle when it is within this share of the view's smaller side from the centre. */
const MIDDLE_SHARE = 0.25;

/**
 * The site the person has zoomed in on, or null: the nearest site to the centre of the view, if the view is
 * zoomed in to at least SELECT_FROM_ZOOM and the site lies in the middle part of it.
 */
export function siteInFocus(
  centre: LonLat, zoom: number, viewWidthPx: number, viewHeightPx: number, sites: readonly SiteEntry[],
): SiteEntry | null {
  if (zoom < SELECT_FROM_ZOOM) return null;
  const reachM = MIDDLE_SHARE * Math.min(viewWidthPx, viewHeightPx) * metresPerPixel(zoom, centre[1], MAP_TILE_PX);
  let nearest: SiteEntry | null = null;
  let nearestM = Infinity;
  for (const site of sites) {
    const away = distanceM(centre, [site.lonEastDeg, site.latDeg]);
    if (away <= reachM && away < nearestM) {
      nearest = site;
      nearestM = away;
    }
  }
  return nearest;
}

/**
 * Watch the person's own moves and select the site they zoom in on.
 * `isFlying` says whether the app is moving the camera itself; `selectedId` gives the site already chosen.
 */
export function watchZoomSelect(map: MapLibreMap, sites: readonly SiteEntry[], options: {
  isFlying: () => boolean;
  selectedId: () => string | null;
  onSelect: (siteId: string) => void;
}): void {
  map.on('moveend', () => {
    if (options.isFlying()) return;
    const centre = map.getCenter();
    const container = map.getContainer();
    const site = siteInFocus([centre.lng, centre.lat], map.getZoom(), container.clientWidth, container.clientHeight, sites);
    if (site && site.id !== options.selectedId()) options.onSelect(site.id);
  });
}
