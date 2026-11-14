// WHAT:    Fixed places in the map's layer order. Each group of layers is added beneath its slot, so the order no longer
//          depends on which file happened to add its layers first (review item R9; F1 to F4, F11, F14).
// IN:      The map, once its style has loaded.
// OUT:     Hidden marker layers, one per slot, added on top of the globe image.
// USED BY: src/main.ts (adds them), approach.ts, siteLayers.ts, overlays.ts, routeLayer.ts (add layers beneath them).
// RULES:   Bottom to top: globe image; approach rings; site image; sun shading; thermal, slope, geology and rover path;
//          keep-out; tether; route lines; rover stops. Site columns and pins go above every slot. A slot is a hidden
//          background layer: it draws nothing and does not split the layers MapLibre drapes over 3D ground.
// TRAPS:   PITFALLS 10.
// OWNER:   Role B.

import type { Map as MapLibreMap } from 'maplibre-gl';

/** Add a layer beneath the slot of its group. */
export const SLOT = {
  rings: 'slot-rings',
  image: 'slot-image',
  shading: 'slot-shading',
  overlays: 'slot-overlays',
  keepOut: 'slot-keep-out',
  tether: 'slot-tether',
  route: 'slot-route',
  points: 'slot-points',
} as const;

/** Add every slot in order, above the layers already in the style. Call once, after the style loads. */
export function addSlots(map: MapLibreMap): void {
  for (const id of Object.values(SLOT)) {
    if (!map.getLayer(id)) map.addLayer({ id, type: 'background', layout: { visibility: 'none' } });
  }
}
