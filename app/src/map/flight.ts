// WHAT:    Camera moves: globe to a site, a site back to the globe, and the slow idle turn of the globe (F14, F7).
// IN:      The map; a site's position in degrees, or a built site's box.
// OUT:     Nothing. Moves the camera and resolves when it has arrived.
// USED BY: src/main.ts.
// RULES:   The idle turn stops on the first touch and respects the reduced-motion setting.
// TRAPS:   PITFALLS 11.
// OWNER:   Role B.

import type { Map as MapLibreMap } from 'maplibre-gl';
import type { SiteEntry, SiteFile } from '../data/contract';
import { METRES_PER_DEGREE } from '../mars/constants';
import { zoomForMetresPerPixel } from '../mars/geometry';

/** The whole planet in view. */
export const GLOBE_ZOOM = 1.6;
/**
 * How close to go to a site that has no map of its own yet. The global image has no more detail
 * than its zoom 5 tiles, so going closer would only show blur.
 */
export const REGION_ZOOM = 5;
/** Camera tilt from straight down when looking at a site's region, in degrees. */
export const REGION_PITCH_DEG = 45;

function reducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function arrived(map: MapLibreMap): Promise<void> {
  return new Promise((resolve) => { void map.once('moveend', () => resolve()); });
}

/** Turn the globe to a site and descend towards it. */
export function flyToSite(map: MapLibreMap, site: SiteEntry, zoom: number = REGION_ZOOM): Promise<void> {
  const done = arrived(map);
  // Tilted, so the site's column and the lie of the land read as three-dimensional.
  const view = { center: [site.lonEastDeg, site.latDeg] as [number, number], zoom, pitch: REGION_PITCH_DEG, bearing: 0 };
  if (reducedMotion()) map.jumpTo(view);
  else map.flyTo({ ...view, duration: 3200, essential: true });
  return done;
}

/** Camera tilt from straight down inside a built site, in degrees. */
export const SITE_PITCH_DEG = 55;

/** Descend into a built site so that its box fills most of the view, tilted to show the relief. */
export function flyIntoSite(map: MapLibreMap, site: SiteFile): Promise<void> {
  const done = arrived(map);
  const lat = site.centre.latDeg;
  // Width of the box on the ground, from the Mars radius; then the zoom at which it spans most of the view.
  const widthM = (site.box.eastLonDeg - site.box.westLonDeg) * METRES_PER_DEGREE * Math.cos((lat * Math.PI) / 180);
  const viewPx = Math.max(200, map.getContainer().clientWidth * 0.8);
  const zoom = zoomForMetresPerPixel(widthM / viewPx, lat, 512); // MapLibre counts zoom on 512-pixel tiles
  const view = { center: [site.centre.lonEastDeg, lat] as [number, number], zoom, pitch: SITE_PITCH_DEG, bearing: 0 };
  if (reducedMotion()) map.jumpTo(view);
  else map.flyTo({ ...view, duration: 5000, essential: true });
  return done;
}

/** Back out to the whole planet, keeping the place below in view. */
export function flyToGlobe(map: MapLibreMap): Promise<void> {
  const done = arrived(map);
  const view = { zoom: GLOBE_ZOOM, pitch: 0, bearing: 0 };
  if (reducedMotion()) map.jumpTo(view);
  else map.flyTo({ ...view, duration: 2400, essential: true });
  return done;
}

/**
 * Turn the globe slowly eastwards until the person first touches it. Returns a function that stops the turn.
 * Does nothing if the person has asked for reduced motion.
 */
export function startIdleTurn(map: MapLibreMap, degreesPerSecond = 3): () => void {
  if (reducedMotion()) return () => {};
  let running = true;
  let last = performance.now();

  const step = (now: number): void => {
    if (!running) return;
    const elapsedS = Math.min(0.1, (now - last) / 1000);
    last = now;
    const centre = map.getCenter();
    map.jumpTo({ center: [centre.lng - degreesPerSecond * elapsedS, centre.lat] });
    requestAnimationFrame(step);
  };

  const stop = (): void => {
    running = false;
    for (const name of ['mousedown', 'touchstart', 'wheel', 'keydown'] as const) {
      map.getCanvasContainer().removeEventListener(name, stop);
    }
  };
  for (const name of ['mousedown', 'touchstart', 'wheel', 'keydown'] as const) {
    map.getCanvasContainer().addEventListener(name, stop, { passive: true });
  }
  requestAnimationFrame(step);
  return stop;
}
