// WHAT:    Elevation profile along the route (F3): height against distance for the way out and the way back, drawn as a small
//          SVG chart in the route card, with what the heights rest on.
// IN:      Profile points from src/route/stats.ts (distance from the start and height at each cell of a leg).
// OUT:     A chart element.
// USED BY: src/ui/routePanel.ts.
// RULES:   Heights are metres relative to the areoid, never called sea level. The two legs use the route colours.
// TRAPS:   PITFALLS 3, 5.
// OWNER:   Role B.

type Profile = readonly { distanceM: number; heightM: number }[];

const SVG = 'http://www.w3.org/2000/svg';
const WIDTH = 360;
const HEIGHT = 130;
const PAD = { left: 44, right: 8, top: 8, bottom: 26 };

function svgEl<K extends keyof SVGElementTagNameMap>(tag: K, attributes: Record<string, string | number>): SVGElementTagNameMap[K] {
  const node = document.createElementNS(SVG, tag);
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, String(value));
  return node;
}

/** A step for axis ticks that gives three to six ticks over the span. */
function tickStep(span: number): number {
  const raw = span / 4;
  const power = 10 ** Math.floor(Math.log10(Math.max(raw, 1e-9)));
  const scaled = raw / power;
  return (scaled < 1.5 ? 1 : scaled < 3.5 ? 2 : scaled < 7.5 ? 5 : 10) * power;
}

/**
 * The profile of a walk out and back. The way back is drawn from the far end, so the chart reads left to right
 * as the whole walk: out, then home again.
 */
export function profileChart(out: Profile, back: Profile, outColour: string, backColour: string, heightNote: string): HTMLElement {
  const figure = document.createElement('figure');
  figure.className = 'profile';
  if (out.length < 2 || back.length < 2) return figure;
  const outLength = out[out.length - 1]!.distanceM;
  const total = outLength + back[back.length - 1]!.distanceM;
  const heights = [...out, ...back].map((p) => p.heightM);
  const low = Math.min(...heights);
  const high = Math.max(...heights);
  const span = Math.max(high - low, 10);
  const bottom = low - span * 0.08;
  const top = low + span * 1.08;
  const x = (d: number): number => PAD.left + (d / total) * (WIDTH - PAD.left - PAD.right);
  const y = (h: number): number => PAD.top + (1 - (h - bottom) / (top - bottom)) * (HEIGHT - PAD.top - PAD.bottom);

  const svg = svgEl('svg', { viewBox: `0 0 ${WIDTH} ${HEIGHT}`, role: 'img', class: 'profile__chart' });
  svg.setAttribute('aria-label',
    `Height along the walk: ${Math.round(total)} m out and back, from ${Math.round(low)} m to ${Math.round(high)} m relative to the areoid.`);

  // Height ticks, in metres relative to the areoid.
  const hStep = tickStep(top - bottom);
  for (let h = Math.ceil(bottom / hStep) * hStep; h <= top; h += hStep) {
    svg.append(svgEl('line', { x1: PAD.left, x2: WIDTH - PAD.right, y1: y(h), y2: y(h), class: 'profile__grid' }));
    const label = svgEl('text', { x: PAD.left - 4, y: y(h) + 3, 'text-anchor': 'end', class: 'profile__tick' });
    label.textContent = `${Math.round(h)}`;
    svg.append(label);
  }
  // Distance ticks along the whole walk.
  const dStep = tickStep(total);
  for (let d = 0; d <= total + 1e-6; d += dStep) {
    const label = svgEl('text', { x: x(d), y: HEIGHT - PAD.bottom + 12, 'text-anchor': 'middle', class: 'profile__tick' });
    label.textContent = d >= 1000 ? `${(d / 1000).toFixed(d % 1000 === 0 ? 0 : 1)} km` : `${Math.round(d)} m`;
    svg.append(label);
  }
  // The turning point at the target.
  svg.append(svgEl('line', { x1: x(outLength), x2: x(outLength), y1: PAD.top, y2: HEIGHT - PAD.bottom, class: 'profile__turn' }));

  const path = (points: Profile, offset: number): string =>
    points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(offset + p.distanceM).toFixed(1)},${y(p.heightM).toFixed(1)}`).join(' ');
  svg.append(
    svgEl('path', { d: path(out, 0), class: 'profile__edge' }),
    svgEl('path', { d: path(out, 0), stroke: outColour, class: 'profile__line' }),
    svgEl('path', { d: path(back, outLength), class: 'profile__edge' }),
    svgEl('path', { d: path(back, outLength), stroke: backColour, class: 'profile__line profile__line--back' }),
  );

  const caption = document.createElement('figcaption');
  caption.className = 'route-card__note';
  caption.textContent =
    `Height along the walk, metres relative to the areoid (Mars has no sea level). Out, then back from the target at the dashed line. ${heightNote}`;
  figure.append(svg, caption);
  return figure;
}
