// WHAT:    Loads a site's index of real rover photos and picks the ones taken near a route (F6).
// IN:      public/data/<site id>/photos.json, written by pipeline/photos.py; a route as a line of positions.
// OUT:     The photos taken within a stated distance of the route, in the order the walker passes them.
// USED BY: src/ui/photoStrip.ts.
// RULES:   No photo is offered further from where it was taken than the limit. Distances use src/mars/geometry.ts.
//          A site with no photos.json has no photos; that is not an error.
// TRAPS:   PITFALLS 2, 3.
// OWNER:   Role B.

import { distanceM, type LonLat } from '../mars/geometry';

/** One photo in photos.json. */
export interface RoverPhoto {
  id: string;
  /** The rover stop it was taken at, as the rover team names it: "site_drive". */
  stop: string;
  lonEastDeg: number;
  latDeg: number;
  sol: number;
  takenUtc: string;
  /** Local mean solar time at the rover, "HH:MM". */
  localMeanSolarTime: string;
  camera: string;
  mastAzimuthDeg: number;
  mastElevationDeg: number;
  smallUrl: string;
  mediumUrl: string;
  pageUrl: string;
  credit: string;
}

export interface PhotoIndex {
  contractVersion: number;
  builtUtc: string;
  source: { name: string; url: string };
  how: string;
  caveats: string[];
  photos: RoverPhoto[];
}

/** A photo is shown only if it was taken within this distance of the route, metres. */
export const PHOTO_LIMIT_M = 30;

/** Fetch a site's photo index, or null when the site has none. */
export async function loadPhotoIndex(folderUrl: string): Promise<PhotoIndex | null> {
  try {
    const response = await fetch(`${folderUrl}photos.json`);
    if (!response.ok) return null;
    const index = (await response.json()) as PhotoIndex;
    return Array.isArray(index.photos) ? index : null;
  } catch {
    return null;
  }
}

export interface PhotoNearRoute {
  photo: RoverPhoto;
  /** How far from the route the photo was taken, metres. */
  distanceM: number;
}

/**
 * Photos taken within `limitM` of the route, ordered as the walker passes them, at most `perStop` from one
 * stop and `total` in all. From a stop with several photos the ones kept point in different directions.
 */
export function photosNearRoute(
  photos: readonly RoverPhoto[], line: readonly LonLat[], limitM = PHOTO_LIMIT_M, total = 6, perStop = 2,
): PhotoNearRoute[] {
  const byStop = new Map<string, RoverPhoto[]>();
  for (const photo of photos) byStop.set(photo.stop, [...(byStop.get(photo.stop) ?? []), photo]);

  const near: { stop: string; distanceM: number; along: number }[] = [];
  for (const [stop, taken] of byStop) {
    const at: LonLat = [taken[0]!.lonEastDeg, taken[0]!.latDeg];
    let best = Infinity;
    let along = -1;
    line.forEach((point, i) => {
      const away = distanceM(at, point);
      if (away < best) { best = away; along = i; }
    });
    if (best <= limitM) near.push({ stop, distanceM: best, along });
  }
  near.sort((a, b) => a.along - b.along);

  const chosen: PhotoNearRoute[] = [];
  for (const { stop, distanceM: away } of near) {
    const taken = byStop.get(stop)!;
    // Spread the picks across the stop's photos, which the pipeline stored in order around the mast.
    const step = Math.max(1, Math.floor(taken.length / perStop));
    for (const photo of taken.filter((_, i) => i % step === 0).slice(0, perStop)) {
      if (chosen.length < total) chosen.push({ photo, distanceM: away });
    }
  }
  return chosen;
}
