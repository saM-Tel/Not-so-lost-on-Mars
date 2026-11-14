// WHAT:    Distance, bearing and cell spacing on the Mars sphere, and longitude conversion (F1, F3, F14).
// IN:      East-positive longitude and planetocentric latitude, degrees.
// OUT:     Metres and degrees.
// USED BY: src/map, src/route, src/safety, src/ui.
// RULES:   Radius comes from constants.ts. No map-library distance, area or scale function.
// TRAPS:   PITFALLS 3, 4.
// OWNER:   Role B.

import { MARS_RADIUS_M } from './constants';

const RAD = Math.PI / 180;

/** A position as [east-positive longitude, planetocentric latitude], in degrees. */
export type LonLat = [lonDeg: number, latDeg: number];

/** East-positive longitude in any range, returned in -180 (exclusive) to 180 (inclusive). */
export function lonTo180(lonEastDeg: number): number {
  let lon = lonEastDeg % 360;
  if (lon > 180) lon -= 360;
  else if (lon <= -180) lon += 360;
  return lon;
}

/** Great-circle distance on the Mars sphere, in metres. */
export function distanceM(a: LonLat, b: LonLat): number {
  const p1 = a[1] * RAD;
  const p2 = b[1] * RAD;
  const dp = p2 - p1;
  const dl = (b[0] - a[0]) * RAD;
  const h = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return 2 * MARS_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Direction from a to b in degrees clockwise from north, 0 to 360. */
export function bearingDeg(a: LonLat, b: LonLat): number {
  const p1 = a[1] * RAD;
  const p2 = b[1] * RAD;
  const dl = (b[0] - a[0]) * RAD;
  const y = Math.sin(dl) * Math.cos(p2);
  const x = Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dl);
  return ((Math.atan2(y, x) / RAD) + 360) % 360;
}

/** The point reached by going `distM` metres from `start` on the bearing given in degrees from north. */
export function destination(start: LonLat, bearingFromNorthDeg: number, distM: number): LonLat {
  const d = distM / MARS_RADIUS_M;
  const b = bearingFromNorthDeg * RAD;
  const p1 = start[1] * RAD;
  const l1 = start[0] * RAD;
  const p2 = Math.asin(Math.sin(p1) * Math.cos(d) + Math.cos(p1) * Math.sin(d) * Math.cos(b));
  const l2 = l1 + Math.atan2(Math.sin(b) * Math.sin(d) * Math.cos(p1), Math.cos(d) - Math.sin(p1) * Math.sin(p2));
  return [lonTo180(l2 / RAD), p2 / RAD];
}

/**
 * Ground width of a cell in a grid that is true to scale at the equator.
 * The USGS mosaics are such grids, so a cell 1 m tall is narrower than 1 m east to west.
 */
export function eastWestSpacingM(northSouthSpacingM: number, latDeg: number): number {
  return northSouthSpacingM * Math.cos(latDeg * RAD);
}

/** Ground size on Mars of one screen pixel of a 256-pixel-tile map at this zoom and latitude, in metres. */
export function metresPerPixel(zoom: number, latDeg: number, tileSizePx = 256): number {
  return (2 * Math.PI * MARS_RADIUS_M * Math.cos(latDeg * RAD)) / (tileSizePx * 2 ** zoom);
}
