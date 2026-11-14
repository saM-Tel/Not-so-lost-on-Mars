// WHAT:    Draws keep-out ground, the tether, home, the target and the route out and back on the map (F3, F4).
// IN:      Keep-out cells and route lines from the route worker; the tether picture from src/safety/tether.ts.
// OUT:     Map sources, layers and markers; a function that removes them all.
// USED BY: src/ui/routePanel.ts.
// RULES:   Red means danger and nothing else: here it marks keep-out ground. The route colours are colour-blind-safe and
//          have a dark edge so they stay readable on bright and dark ground.
// TRAPS:   PITFALLS 6, 11.
// OWNER:   Role B.

import { Marker, type CanvasSource, type GeoJSONSource, type ImageSource, type Map as MapLibreMap } from 'maplibre-gl';
import type { GridDefinition } from '../data/contract';
import type { LonLat } from '../mars/geometry';
import { SLOT } from './slots';

const KEEP_OUT_ID = 'route-keep-out';
const TETHER_ID = 'route-tether';
const LINES_ID = 'route-lines';
const GAPS_ID = 'route-link-gaps';
/** Okabe and Ito colours: sky blue for the way out, yellow for the way home. */
export const OUT_COLOUR = '#56b4e9';
export const BACK_COLOUR = '#f0e442';
/** The danger red of style.css, as numbers for the keep-out picture. */
const DANGER_RGB = [229, 72, 77] as const;

export interface RouteLayer {
  showKeepOut(keepOut: Uint8Array, definition: GridDefinition): void;
  /** Switch the keep-out shading on or off and set how strong it is, 0 to 1. */
  setKeepOut(visible: boolean, opacity: number): void;
  /** Draw the tether from a picture with four bytes per grid cell (src/safety/tether.ts). */
  showTether(picture: Uint8ClampedArray, definition: GridDefinition): void;
  /** Take the tether off the screen until the next showTether, for when it no longer matches the settings. */
  hideTether(): void;
  showHome(position: LonLat): void;
  /** Small named pins at the scenario's science targets. */
  showTargets(targets: { name: string; lonEastDeg: number; latDeg: number }[]): void;
  /** Draw a walk, or clear it with null. */
  showRoute(route: { target: LonLat; out: LonLat[]; back: LonLat[] } | null): void;
  /** Glow beneath the stretches of the walk with no relay link (F18), or clear it with null. */
  showGaps(stretches: LonLat[][] | null): void;
  remove(): void;
}

/** Okabe and Ito reddish purple: clear of the route's blue and yellow and of the danger red (F18 gaps). */
export const GAP_COLOUR = '#cc79a7';

function pin(className: string, label: string): HTMLElement {
  const element = document.createElement('div');
  element.className = `route-pin ${className}`;
  element.textContent = label;
  return element;
}

/** The two legs as GeoJSON lines. The type is taken from MapLibre, so no GeoJSON type package is needed. */
function lines(out: LonLat[], back: LonLat[]): Parameters<GeoJSONSource['setData']>[0] {
  const feature = (leg: string, coordinates: LonLat[]) => ({
    type: 'Feature' as const, properties: { leg }, geometry: { type: 'LineString' as const, coordinates },
  });
  return { type: 'FeatureCollection' as const, features: out.length > 1 ? [feature('out', out), feature('back', back)] : [] };
}

/** The grid's four corners, clockwise from the north-west, as an image source wants them. */
function corners(definition: GridDefinition): [[number, number], [number, number], [number, number], [number, number]] {
  const west = definition.northWestCorner.lonEastDeg;
  const north = definition.northWestCorner.latDeg;
  const east = west + definition.cols * definition.cellLonDeg;
  const south = north - definition.rows * definition.cellLatDeg;
  return [[west, north], [east, north], [east, south], [west, south]];
}

/**
 * Make the map draw its draped layers again. On 3D ground MapLibre 6 draws them into textures it keeps for each
 * terrain tile, and it only renews those when a source reports new tiles. A canvas source whose picture changed
 * reports nothing, so without this the old tether stays on screen until the camera moves (review item R1).
 * `releaseAllRTT` is the call MapLibre itself makes when an image source changes (maplibre-gl/src/ui/map.ts).
 */
function refreshDraped(map: MapLibreMap): void {
  const terrain = (map as unknown as { terrain?: { tileManager?: { releaseAllRTT?: () => void } } | null }).terrain;
  terrain?.tileManager?.releaseAllRTT?.();
  map.triggerRepaint();
}

export function addRouteLayer(map: MapLibreMap): RouteLayer {
  let tetherCanvas: HTMLCanvasElement | null = null;
  let tetherImage: ImageData | null = null;
  let home: Marker | null = null;
  let target: Marker | null = null;
  let targetPins: Marker[] = [];

  map.addSource(LINES_ID, { type: 'geojson', data: lines([], []) });
  map.addLayer({
    id: `${LINES_ID}-edge`, type: 'line', source: LINES_ID,
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': '#08090e', 'line-width': 7, 'line-opacity': 0.8 },
  }, SLOT.route);
  map.addLayer({
    id: `${LINES_ID}-out`, type: 'line', source: LINES_ID, filter: ['==', ['get', 'leg'], 'out'],
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': OUT_COLOUR, 'line-width': 4 },
  }, SLOT.route);
  // Dashed, so both show where the way home lies on top of the way out.
  map.addLayer({
    id: `${LINES_ID}-back`, type: 'line', source: LINES_ID, filter: ['==', ['get', 'leg'], 'back'],
    layout: { 'line-join': 'round' },
    paint: { 'line-color': BACK_COLOUR, 'line-width': 4, 'line-dasharray': [1.5, 1.5] },
  }, SLOT.route);

  return {
    showKeepOut(keepOut, definition) {
      // One picture pixel per grid cell: red where a walker may not go, clear elsewhere.
      const canvas = document.createElement('canvas');
      canvas.width = definition.cols;
      canvas.height = definition.rows;
      const context = canvas.getContext('2d');
      if (!context) return;
      const picture = context.createImageData(definition.cols, definition.rows);
      for (let i = 0; i < keepOut.length; i++) {
        if (!keepOut[i]) continue;
        picture.data[i * 4] = DANGER_RGB[0];
        picture.data[i * 4 + 1] = DANGER_RGB[1];
        picture.data[i * 4 + 2] = DANGER_RGB[2];
        picture.data[i * 4 + 3] = 255;
      }
      context.putImageData(picture, 0, 0);
      const url = canvas.toDataURL('image/png');
      const existing = map.getSource(KEEP_OUT_ID) as ImageSource | undefined;
      if (existing) {
        // After a restart (a new slope limit, a moved rover) only the picture changes. The layer keeps its place
        // beneath the tether, and the switch and opacity the layer panel gave it.
        existing.updateImage({ url, coordinates: corners(definition) });
        return;
      }
      map.addSource(KEEP_OUT_ID, { type: 'image', url, coordinates: corners(definition) });
      // Beneath the tether and the route lines, and see-through so the ground still shows.
      map.addLayer({
        id: KEEP_OUT_ID, type: 'raster', source: KEEP_OUT_ID,
        paint: { 'raster-opacity': 0.4, 'raster-resampling': 'nearest', 'raster-fade-duration': 0 },
      }, SLOT.keepOut);
    },
    setKeepOut(visible, opacity) {
      if (!map.getLayer(KEEP_OUT_ID)) return;
      map.setLayoutProperty(KEEP_OUT_ID, 'visibility', visible ? 'visible' : 'none');
      map.setPaintProperty(KEEP_OUT_ID, 'raster-opacity', opacity);
    },
    showTether(picture, definition) {
      // One canvas, drawn into again on every change and read by the map directly. Turning it into a PNG
      // address on each change (as before) took tens of milliseconds and made the time slider stutter.
      if (!tetherCanvas || tetherCanvas.width !== definition.cols || tetherCanvas.height !== definition.rows) {
        tetherCanvas = document.createElement('canvas');
        tetherCanvas.width = definition.cols;
        tetherCanvas.height = definition.rows;
        tetherImage = null;
      }
      const context = tetherCanvas.getContext('2d');
      if (!context) return;
      tetherImage ??= context.createImageData(definition.cols, definition.rows);
      tetherImage.data.set(picture);
      context.putImageData(tetherImage, 0, 0);
      const source = map.getSource(TETHER_ID) as CanvasSource | undefined;
      if (source) {
        // A paused canvas source shows a still copy: play then pause makes it take the new picture once.
        source.play();
        source.pause();
        if (map.getLayer(TETHER_ID)) map.setLayoutProperty(TETHER_ID, 'visibility', 'visible');
        refreshDraped(map);
        return;
      }
      map.addSource(TETHER_ID, { type: 'canvas', canvas: tetherCanvas, coordinates: corners(definition), animate: false });
      // Above the keep-out shading, beneath the route lines.
      map.addLayer({
        id: TETHER_ID, type: 'raster', source: TETHER_ID,
        paint: { 'raster-opacity': 0.9, 'raster-fade-duration': 0 },
      }, SLOT.tether);
    },
    hideTether() {
      if (!map.getLayer(TETHER_ID)) return;
      map.setLayoutProperty(TETHER_ID, 'visibility', 'none');
      refreshDraped(map);
    },
    showHome(position) {
      home?.remove();
      home = new Marker({ element: pin('route-pin--home', 'Home'), anchor: 'bottom' }).setLngLat(position).addTo(map);
    },
    showTargets(targets) {
      for (const marker of targetPins) marker.remove();
      targetPins = targets.map((t) =>
        new Marker({ element: pin('route-pin--science', t.name), anchor: 'bottom' }).setLngLat([t.lonEastDeg, t.latDeg]).addTo(map));
    },
    showRoute(route) {
      target?.remove();
      target = null;
      (map.getSource(LINES_ID) as GeoJSONSource | undefined)?.setData(route ? lines(route.out, route.back) : lines([], []));
      if (route) {
        target = new Marker({ element: pin('route-pin--target', 'Target'), anchor: 'bottom' }).setLngLat(route.target).addTo(map);
      }
    },
    showGaps(stretches) {
      const data: Parameters<GeoJSONSource['setData']>[0] = {
        type: 'FeatureCollection' as const,
        features: (stretches ?? []).map((line) => ({
          type: 'Feature' as const, properties: {}, geometry: { type: 'LineString' as const, coordinates: line },
        })),
      };
      const source = map.getSource(GAPS_ID) as GeoJSONSource | undefined;
      if (source) { source.setData(data); return; }
      map.addSource(GAPS_ID, { type: 'geojson', data });
      // A wide glow beneath the route lines, so the walk stays readable and the stretches with no link stand out.
      map.addLayer({
        id: GAPS_ID, type: 'line', source: GAPS_ID,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': GAP_COLOUR, 'line-width': 16, 'line-opacity': 0.55, 'line-blur': 2 },
      }, `${LINES_ID}-edge`);
    },
    remove() {
      home?.remove();
      target?.remove();
      for (const marker of targetPins) marker.remove();
      for (const id of [`${LINES_ID}-back`, `${LINES_ID}-out`, `${LINES_ID}-edge`, GAPS_ID, TETHER_ID, KEEP_OUT_ID]) {
        if (map.getLayer(id)) map.removeLayer(id);
      }
      for (const id of [LINES_ID, GAPS_ID, TETHER_ID, KEEP_OUT_ID]) if (map.getSource(id)) map.removeSource(id);
    },
  };
}
