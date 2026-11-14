// WHAT:    Draws keep-out ground, home, the target and the route out and back on the map (F3). Still to add: the tether lines (F4).
// IN:      Keep-out cells and route lines from the route worker, as longitude and latitude.
// OUT:     Map sources, layers and markers; a function that removes them all.
// USED BY: src/ui/routePanel.ts.
// RULES:   Red means danger and nothing else: here it marks keep-out ground. The route colours are colour-blind-safe and
//          have a dark edge so they stay readable on bright and dark ground.
// TRAPS:   PITFALLS 6, 11.
// OWNER:   Role B.

import { Marker, type GeoJSONSource, type Map as MapLibreMap } from 'maplibre-gl';
import type { GridDefinition } from '../data/contract';
import type { LonLat } from '../mars/geometry';

const KEEP_OUT_ID = 'route-keep-out';
const LINES_ID = 'route-lines';
/** Okabe and Ito colours: sky blue for the way out, yellow for the way home. */
export const OUT_COLOUR = '#56b4e9';
export const BACK_COLOUR = '#f0e442';
/** The danger red of style.css, as numbers for the keep-out picture. */
const DANGER_RGB = [229, 72, 77] as const;

export interface RouteLayer {
  showKeepOut(keepOut: Uint8Array, definition: GridDefinition): void;
  showHome(position: LonLat): void;
  /** Draw a walk, or clear it with null. */
  showRoute(route: { target: LonLat; out: LonLat[]; back: LonLat[] } | null): void;
  remove(): void;
}

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

export function addRouteLayer(map: MapLibreMap): RouteLayer {
  let home: Marker | null = null;
  let target: Marker | null = null;

  map.addSource(LINES_ID, { type: 'geojson', data: lines([], []) });
  map.addLayer({
    id: `${LINES_ID}-edge`, type: 'line', source: LINES_ID,
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': '#08090e', 'line-width': 7, 'line-opacity': 0.8 },
  });
  map.addLayer({
    id: `${LINES_ID}-out`, type: 'line', source: LINES_ID, filter: ['==', ['get', 'leg'], 'out'],
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': OUT_COLOUR, 'line-width': 4 },
  });
  // Dashed, so both show where the way home lies on top of the way out.
  map.addLayer({
    id: `${LINES_ID}-back`, type: 'line', source: LINES_ID, filter: ['==', ['get', 'leg'], 'back'],
    layout: { 'line-join': 'round' },
    paint: { 'line-color': BACK_COLOUR, 'line-width': 4, 'line-dasharray': [1.5, 1.5] },
  });

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
      const west = definition.northWestCorner.lonEastDeg;
      const north = definition.northWestCorner.latDeg;
      const east = west + definition.cols * definition.cellLonDeg;
      const south = north - definition.rows * definition.cellLatDeg;
      if (map.getLayer(KEEP_OUT_ID)) map.removeLayer(KEEP_OUT_ID);
      if (map.getSource(KEEP_OUT_ID)) map.removeSource(KEEP_OUT_ID);
      map.addSource(KEEP_OUT_ID, {
        type: 'image', url: canvas.toDataURL('image/png'),
        coordinates: [[west, north], [east, north], [east, south], [west, south]],
      });
      // Beneath the route lines, and see-through so the ground still shows.
      map.addLayer({
        id: KEEP_OUT_ID, type: 'raster', source: KEEP_OUT_ID,
        paint: { 'raster-opacity': 0.4, 'raster-resampling': 'nearest', 'raster-fade-duration': 0 },
      }, `${LINES_ID}-edge`);
    },
    showHome(position) {
      home?.remove();
      home = new Marker({ element: pin('route-pin--home', 'Home'), anchor: 'bottom' }).setLngLat(position).addTo(map);
    },
    showRoute(route) {
      target?.remove();
      target = null;
      (map.getSource(LINES_ID) as GeoJSONSource | undefined)?.setData(route ? lines(route.out, route.back) : lines([], []));
      if (route) {
        target = new Marker({ element: pin('route-pin--target', 'Target'), anchor: 'bottom' }).setLngLat(route.target).addTo(map);
      }
    },
    remove() {
      home?.remove();
      target?.remove();
      for (const id of [`${LINES_ID}-back`, `${LINES_ID}-out`, `${LINES_ID}-edge`, KEEP_OUT_ID]) {
        if (map.getLayer(id)) map.removeLayer(id);
      }
      for (const id of [LINES_ID, KEEP_OUT_ID]) if (map.getSource(id)) map.removeSource(id);
    },
  };
}
