// WHAT:    A to-scale, low-detail astronaut on the 3D ground for the walk-through (F19): legs, body, arms, life-support
//          pack and helmet as raised shapes, 1.8 m tall, facing the way it walks, with a small name pin above it.
// IN:      The map; a position, a heading in degrees from north.
// OUT:     One GeoJSON source and fill-extrusion layer, one marker, and functions to move and remove them.
// USED BY: src/ui/walkThrough.ts.
// RULES:   Sizes in Mars metres, from src/mars/constants.ts; heights scaled by the Earth to Mars radius ratio like the
//          terrain, so the figure keeps its true proportions on the 3D ground. MapLibre raises each shape by the terrain
//          height at its centre. White and greys: not red. The figure is a symbol at true size, not a suit model.
// TRAPS:   PITFALLS 3.
// OWNER:   Role B.

import { Marker, type GeoJSONSource, type Map as MapLibreMap } from 'maplibre-gl';
import { MAPLIBRE_METRES_PER_MARS_METRE, METRES_PER_DEGREE } from '../mars/constants';

const SOURCE_ID = 'walker';

/** One part: a box `w` wide (across) and `d` deep (front to back), centred `x` across and `y` forward, from `base` to `top` metres. */
interface Part { x: number; y: number; w: number; d: number; base: number; top: number; colour: string; round?: boolean }

/** A person 1.8 m tall in a suit with a pack on the back. Low detail on purpose. */
const BODY: Part[] = [
  { x: -0.12, y: 0, w: 0.17, d: 0.22, base: 0, top: 0.86, colour: '#e9e6df' },
  { x: 0.12, y: 0, w: 0.17, d: 0.22, base: 0, top: 0.86, colour: '#e9e6df' },
  { x: 0, y: 0, w: 0.5, d: 0.3, base: 0.86, top: 1.46, colour: '#f4f2ec' },
  { x: 0, y: -0.27, w: 0.46, d: 0.24, base: 0.9, top: 1.52, colour: '#b9b6ae' },
  { x: -0.33, y: 0.02, w: 0.13, d: 0.15, base: 0.92, top: 1.42, colour: '#e9e6df' },
  { x: 0.33, y: 0.02, w: 0.13, d: 0.15, base: 0.92, top: 1.42, colour: '#e9e6df' },
  { x: 0, y: 0.02, w: 0.34, d: 0.34, base: 1.46, top: 1.8, colour: '#ffffff', round: true },
  // The visor: a darker strip on the front of the helmet, so the way it faces can be read.
  { x: 0, y: 0.15, w: 0.24, d: 0.06, base: 1.55, top: 1.72, colour: '#3a4a5c' },
];

export interface Astronaut {
  move(position: [number, number], headingDeg: number): void;
  setVisible(visible: boolean): void;
  remove(): void;
}

/** The outline of one part at a position and heading, as longitude and latitude. */
function outline(part: Part, [lon, lat]: [number, number], headingDeg: number): [number, number][] {
  const corners: [number, number][] = part.round
    ? Array.from({ length: 10 }, (_, i) => {
      const a = (i / 10) * 2 * Math.PI;
      return [part.x + (part.w / 2) * Math.cos(a), part.y + (part.d / 2) * Math.sin(a)];
    })
    : [[part.x - part.w / 2, part.y - part.d / 2], [part.x + part.w / 2, part.y - part.d / 2],
      [part.x + part.w / 2, part.y + part.d / 2], [part.x - part.w / 2, part.y + part.d / 2]];
  const h = (headingDeg * Math.PI) / 180;
  const metresPerDegLon = METRES_PER_DEGREE * Math.cos((lat * Math.PI) / 180);
  const ring = corners.map(([across, forward]): [number, number] => {
    // Forward is the heading, measured clockwise from north; across is 90 degrees to its right.
    const east = forward * Math.sin(h) + across * Math.cos(h);
    const north = forward * Math.cos(h) - across * Math.sin(h);
    return [lon + east / metresPerDegLon, lat + north / METRES_PER_DEGREE];
  });
  return [...ring, ring[0]!];
}

function figure(position: [number, number], headingDeg: number): Parameters<GeoJSONSource['setData']>[0] {
  return {
    type: 'FeatureCollection' as const,
    features: BODY.map((part) => ({
      type: 'Feature' as const,
      properties: { base: part.base, top: part.top, colour: part.colour },
      geometry: { type: 'Polygon' as const, coordinates: [outline(part, position, headingDeg)] },
    })),
  };
}

/** Put the astronaut on the map at a position. */
export function addAstronaut(map: MapLibreMap, position: [number, number], headingDeg: number): Astronaut {
  map.addSource(SOURCE_ID, { type: 'geojson', data: figure(position, headingDeg) });
  // Not draped: raised shapes, added on top of every slot so nothing covers the figure.
  map.addLayer({
    id: SOURCE_ID, type: 'fill-extrusion', source: SOURCE_ID,
    paint: {
      'fill-extrusion-color': ['get', 'colour'],
      'fill-extrusion-base': ['*', ['get', 'base'], MAPLIBRE_METRES_PER_MARS_METRE],
      'fill-extrusion-height': ['*', ['get', 'top'], MAPLIBRE_METRES_PER_MARS_METRE],
      'fill-extrusion-opacity': 1,
    },
  });
  const pin = document.createElement('div');
  pin.className = 'walker-pin';
  pin.textContent = 'Astronaut';
  const marker = new Marker({ element: pin, anchor: 'bottom', offset: [0, -14] }).setLngLat(position).addTo(map);
  return {
    move(next, heading) {
      (map.getSource(SOURCE_ID) as GeoJSONSource | undefined)?.setData(figure(next, heading));
      marker.setLngLat(next);
    },
    setVisible(visible) {
      if (map.getLayer(SOURCE_ID)) map.setLayoutProperty(SOURCE_ID, 'visibility', visible ? 'visible' : 'none');
      pin.hidden = !visible;
    },
    remove() {
      marker.remove();
      if (map.getLayer(SOURCE_ID)) map.removeLayer(SOURCE_ID);
      if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
    },
  };
}
