// WHAT:    Our own scale bar, correct for Mars (F1).
// IN:      The map's centre latitude and zoom.
// OUT:     A scale bar element in metres or kilometres, shown only when the view is close enough for one scale to hold across it.
// USED BY: src/main.ts.
// RULES:   Uses src/mars/geometry.ts. Never MapLibre's scale control, which assumes Earth.
// TRAPS:   PITFALLS 3.
// OWNER:   Role B.

import type { Map as MapLibreMap } from 'maplibre-gl';
import { metresPerPixel } from '../mars/geometry';

/** MapLibre counts zoom on 512-pixel tiles. */
const MAP_TILE_PX = 512;
/** Further out than this the planet's curve is in view and no single scale is true across the screen. */
const SHOW_FROM_ZOOM = 7;
const MAX_BAR_PX = 140;

export interface ScaleBar {
  lengthM: number;
  widthPx: number;
  label: string;
}

/** The longest round length (1, 2 or 5 times a power of ten) whose bar fits in `maxPx`. */
export function scaleBarFor(metresPerPx: number, maxPx: number = MAX_BAR_PX): ScaleBar {
  const longest = metresPerPx * maxPx;
  const power = 10 ** Math.floor(Math.log10(longest));
  const step = [5, 2, 1].find((s) => s * power <= longest) ?? 1;
  const lengthM = step * power;
  const label = lengthM >= 1000 ? `${lengthM / 1000} km` : `${Number(lengthM.toPrecision(1))} m`;
  return { lengthM, widthPx: lengthM / metresPerPx, label };
}

/** Add the scale bar to the map's container and keep it up to date as the view moves. */
export function addScaleBar(map: MapLibreMap): void {
  const box = document.createElement('div');
  box.className = 'scale-bar';
  box.title = 'Distance on the ground at the centre of the view, for Mars. Looking at a slant, distances further away are longer than they appear.';
  const bar = document.createElement('div');
  bar.className = 'scale-bar__bar';
  const text = document.createElement('span');
  box.append(bar, text);
  map.getContainer().append(box);

  const update = (): void => {
    const zoom = map.getZoom();
    box.hidden = zoom < SHOW_FROM_ZOOM;
    if (box.hidden) return;
    const scale = scaleBarFor(metresPerPixel(zoom, map.getCenter().lat, MAP_TILE_PX));
    bar.style.width = `${scale.widthPx.toFixed(1)}px`;
    text.textContent = scale.label;
  };
  map.on('move', update);
  update();
}
