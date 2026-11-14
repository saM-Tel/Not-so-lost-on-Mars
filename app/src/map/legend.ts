// WHAT:    Legends for map layers, and the colour ramp the slope layer is drawn with (F2).
// IN:      Legend descriptions made by src/map/overlays.ts and src/ui/routePanel.ts.
// OUT:     Legend elements; colours for a value on the slope ramp.
// USED BY: src/map/overlays.ts, src/ui/layerPanel.ts.
// RULES:   Colour-blind-safe ramps. Red only for danger.
// TRAPS:   PITFALLS 11.
// OWNER:   Role B.

/** A legend is either a few named colours or a ramp from one value to another. */
export type Legend =
  | { kind: 'swatches'; items: { colour: string; label: string; shape?: 'line' | 'dot' | 'area' }[] }
  | { kind: 'ramp'; colours: string[]; labels: string[]; note?: string };

/**
 * The viridis ramp at five evenly spaced points, dark purple to yellow. It reads the same with the common
 * kinds of colour blindness, stays in order when printed grey, and has no red in it.
 */
export const SLOPE_RAMP = ['#440154', '#3b528b', '#21918c', '#5ec962', '#fde725'] as const;
/** The slope drawn with the last colour of the ramp, degrees. Steeper ground is drawn the same. */
export const SLOPE_RAMP_TOP_DEG = 30;

function rgb(hex: string): [number, number, number] {
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
}

/** The colour for a share of the way along a ramp, 0 to 1, as red, green and blue from 0 to 255. */
export function rampColour(share: number, ramp: readonly string[] = SLOPE_RAMP): [number, number, number] {
  const at = Math.min(1, Math.max(0, share)) * (ramp.length - 1);
  const low = Math.min(ramp.length - 2, Math.floor(at));
  const mix = at - low;
  const a = rgb(ramp[low]!);
  const b = rgb(ramp[low + 1]!);
  return [0, 1, 2].map((i) => Math.round(a[i]! + (b[i]! - a[i]!) * mix)) as [number, number, number];
}

/** Build the element for a legend. */
export function legendElement(legend: Legend): HTMLElement {
  const box = document.createElement('div');
  box.className = 'legend';
  if (legend.kind === 'swatches') {
    for (const item of legend.items) {
      const row = document.createElement('span');
      row.className = 'legend__item';
      const swatch = document.createElement('span');
      swatch.className = `legend__swatch legend__swatch--${item.shape ?? 'area'}`;
      swatch.style.background = item.colour;
      row.append(swatch, item.label);
      box.append(row);
    }
    return box;
  }
  const bar = document.createElement('div');
  bar.className = 'legend__ramp';
  bar.style.background = `linear-gradient(to right, ${legend.colours.join(', ')})`;
  const labels = document.createElement('div');
  labels.className = 'legend__labels';
  for (const label of legend.labels) {
    const text = document.createElement('span');
    text.textContent = label;
    labels.append(text);
  }
  box.append(bar, labels);
  if (legend.note) {
    const note = document.createElement('p');
    note.className = 'legend__note';
    note.textContent = legend.note;
    box.append(note);
  }
  return box;
}
