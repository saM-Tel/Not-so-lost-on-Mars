// WHAT:    A built site's layers as things the layer panel can switch and fade: the ground image, slope, and the
//          rover's path and stops (F2). Still to add: geology.
// IN:      The map; a loaded site, with its layer records and routing grid definition.
// OUT:     One Overlay for each layer that could be drawn, and a function that takes them off the map.
// USED BY: src/main.ts, src/ui/layerPanel.ts. src/ui/routePanel.ts makes one more Overlay, for keep-out ground.
// RULES:   A layer appears only if its record in layers.json is complete; loadSite.ts has already left the others out.
//          Red means danger and nothing else, so no layer here uses it.
// TRAPS:   PITFALLS 4, 11.
// OWNER:   Role B.

import type { Map as MapLibreMap } from 'maplibre-gl';
import type { LayerRecord } from '../data/contract';
import type { LoadedSite } from '../data/loadSite';
import { rampColour, SLOPE_RAMP, SLOPE_RAMP_TOP_DEG, type Legend } from './legend';
import { SITE_IMAGE_LAYER_ID } from './siteLayers';

/** A layer the person can switch on and off and fade. */
export interface Overlay {
  record: LayerRecord;
  legend: Legend | null;
  visible: boolean;
  /** 0 to 1. */
  opacity: number;
  setVisible(visible: boolean): void;
  setOpacity(opacity: number): void;
}

/** Okabe and Ito bluish green: clear of the route's blue and yellow, and not red. */
const ROVER_COLOUR = '#009e73';
const SLOPE_ID = 'overlay-slope';

function overlay(
  map: MapLibreMap, record: LayerRecord, legend: Legend | null, start: { visible: boolean; opacity: number },
  layers: { id: string; opacityProperties: string[] }[],
): Overlay {
  const apply = (self: Overlay): void => {
    for (const layer of layers) {
      if (!map.getLayer(layer.id)) continue;
      map.setLayoutProperty(layer.id, 'visibility', self.visible ? 'visible' : 'none');
      for (const property of layer.opacityProperties) {
        map.setPaintProperty(layer.id, property as Parameters<MapLibreMap['setPaintProperty']>[1], self.opacity);
      }
    }
  };
  const self: Overlay = {
    record, legend, ...start,
    setVisible(visible) { self.visible = visible; apply(self); },
    setOpacity(opacity) { self.opacity = opacity; apply(self); },
  };
  apply(self);
  return self;
}

/** Draw the slope grid as a picture, one pixel per routing cell, coloured along the ramp. Cells with no data stay clear. */
async function slopePicture(loaded: LoadedSite, gridName: string): Promise<string | null> {
  const definition = loaded.site.grid;
  const file = definition?.files.find((f) => f.name === gridName);
  if (!definition || !file) return null;
  const response = await fetch(loaded.folderUrl + file.path);
  if (!response.ok) return null;
  const slope = new Float32Array(await response.arrayBuffer());
  if (slope.length !== definition.rows * definition.cols) return null;
  const canvas = document.createElement('canvas');
  canvas.width = definition.cols;
  canvas.height = definition.rows;
  const context = canvas.getContext('2d');
  if (!context) return null;
  const picture = context.createImageData(definition.cols, definition.rows);
  for (let i = 0; i < slope.length; i++) {
    const value = slope[i]!;
    if (Number.isNaN(value)) continue;
    picture.data.set([...rampColour(value / SLOPE_RAMP_TOP_DEG), 255], i * 4);
  }
  context.putImageData(picture, 0, 0);
  return canvas.toDataURL('image/png');
}

/** Add the site's layers to the map. The ground image is already there; it only gains its controls. */
export async function addOverlays(map: MapLibreMap, loaded: LoadedSite): Promise<{ overlays: Overlay[]; remove(): void }> {
  const overlays: Overlay[] = [];
  const added: { layers: string[]; sources: string[] } = { layers: [], sources: [] };

  if (loaded.image && map.getLayer(SITE_IMAGE_LAYER_ID)) {
    overlays.push(overlay(map, loaded.image, null, { visible: true, opacity: 1 },
      [{ id: SITE_IMAGE_LAYER_ID, opacityProperties: ['raster-opacity'] }]));
  }

  for (const record of loaded.layers.usable) {
    if (record.grid && loaded.site.grid) {
      const url = await slopePicture(loaded, record.grid);
      if (!url) continue;
      const g = loaded.site.grid;
      const west = g.northWestCorner.lonEastDeg;
      const north = g.northWestCorner.latDeg;
      const east = west + g.cols * g.cellLonDeg;
      const south = north - g.rows * g.cellLatDeg;
      map.addSource(SLOPE_ID, { type: 'image', url, coordinates: [[west, north], [east, north], [east, south], [west, south]] });
      map.addLayer({ id: SLOPE_ID, type: 'raster', source: SLOPE_ID, paint: { 'raster-resampling': 'nearest', 'raster-fade-duration': 0 } });
      added.layers.push(SLOPE_ID);
      added.sources.push(SLOPE_ID);
      overlays.push(overlay(map, record, {
        kind: 'ramp', colours: [...SLOPE_RAMP],
        // Four labels spaced evenly along the bar, so each sits at its own value.
        labels: [0, 1, 2, 3].map((i) => (i === 3 ? `${SLOPE_RAMP_TOP_DEG}° or more` : `${(i * SLOPE_RAMP_TOP_DEG) / 3}°`)),
        note: 'Steepest slope in each 4 m cell, in degrees from level.',
      }, { visible: false, opacity: 0.6 }, [{ id: SLOPE_ID, opacityProperties: ['raster-opacity'] }]));
    } else if (record.vector) {
      const id = `overlay-${record.id}`;
      map.addSource(id, { type: 'geojson', data: loaded.folderUrl + record.vector.path });
      added.sources.push(id);
      if (record.vector.geometry === 'line') {
        map.addLayer({ id: `${id}-edge`, type: 'line', source: id, layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#08090e', 'line-width': 4 } });
        map.addLayer({ id, type: 'line', source: id, layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': ROVER_COLOUR, 'line-width': 2 } });
        added.layers.push(id, `${id}-edge`);
        overlays.push(overlay(map, record, { kind: 'swatches', items: [{ colour: ROVER_COLOUR, label: 'Where the rover drove', shape: 'line' }] },
          { visible: true, opacity: 0.9 }, [{ id: `${id}-edge`, opacityProperties: ['line-opacity'] }, { id, opacityProperties: ['line-opacity'] }]));
      } else {
        map.addLayer({ id, type: 'circle', source: id, paint: { 'circle-radius': 4, 'circle-color': ROVER_COLOUR, 'circle-stroke-color': '#08090e', 'circle-stroke-width': 1.5 } });
        added.layers.push(id);
        overlays.push(overlay(map, record, { kind: 'swatches', items: [{ colour: ROVER_COLOUR, label: 'Where a drive ended', shape: 'dot' }] },
          { visible: true, opacity: 0.9 }, [{ id, opacityProperties: ['circle-opacity', 'circle-stroke-opacity'] }]));
      }
    }
  }

  return {
    overlays,
    remove() {
      for (const id of added.layers) if (map.getLayer(id)) map.removeLayer(id);
      for (const id of added.sources) if (map.getSource(id)) map.removeSource(id);
    },
  };
}
