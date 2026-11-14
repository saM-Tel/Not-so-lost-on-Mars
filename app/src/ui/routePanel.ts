// WHAT:    Route card: click a target, see the walk out and back with distance, climb, time and energy for three cases (F3).
//          Still to add: several targets, oxygen, the route's confidence line, the elevation profile.
// IN:      A loaded site with routing grids; clicks on the map; results from src/route/client.ts.
// OUT:     A card over the map, and the route drawn through src/map/routeLayer.ts. Returns a function that removes both.
// USED BY: src/main.ts.
// RULES:   Ranges are written as in docs/CONFIDENCE.md section 5. Every number says what it rests on.
// TRAPS:   PITFALLS 6, 7, 11.
// OWNER:   Role B.

import type { Map as MapLibreMap, MapMouseEvent } from 'maplibre-gl';
import { loadRoutingGridFiles, type LoadedSite } from '../data/loadSite';
import { addRouteLayer, BACK_COLOUR, OUT_COLOUR } from '../map/routeLayer';
import { startRouteWorker } from '../route/client';
import { WALK_CASES } from '../route/cost';
import type { RouteAnswer, RouteLeg } from '../route/messages';
import { formatDistance, formatDuration, formatEnergy, formatHeight, formatRange } from './format';

/**
 * Steepest ground a person in a suit may walk on, degrees. NASA's Artemis III requirement is that slopes for
 * EVA be under 20 degrees (Ortiz 2025, docs/REFERENCES.md). A lunar requirement applied to Mars: grade C.
 */
export const SLOPE_LIMIT_DEG = 20;

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function caseValue(leg: RouteLeg, caseId: string, key: 'timeS' | 'energyJ'): number {
  return leg.stats.cases.find((c) => c.caseId === caseId)?.[key] ?? NaN;
}

/** One number for all three cases, summed over the legs given. */
function range(legs: RouteLeg[], key: 'timeS' | 'energyJ', format: (value: number) => string): string {
  const total = (caseId: string): number => legs.reduce((sum, leg) => sum + caseValue(leg, caseId, key), 0);
  return formatRange(total('expected'), total('favourable'), total('cautious'), format);
}

function legRow(name: string, colour: string | null, legs: RouteLeg[]): HTMLElement {
  const row = el('tr');
  const label = el('th', undefined, name);
  label.scope = 'row';
  if (colour) {
    const swatch = el('span', 'route-card__swatch');
    swatch.style.background = colour;
    label.prepend(swatch);
  }
  const distance = legs.reduce((sum, leg) => sum + leg.stats.distanceM, 0);
  const climb = legs.reduce((sum, leg) => sum + leg.stats.climbM, 0);
  row.append(
    label,
    el('td', undefined, formatDistance(distance)),
    el('td', undefined, formatHeight(climb)),
    el('td', undefined, range(legs, 'timeS', formatDuration)),
    el('td', undefined, range(legs, 'energyJ', formatEnergy)),
  );
  return row;
}

const REFUSALS: Record<string, string> = {
  outside: 'That point is outside the mapped box. Choose a point on the detailed ground.',
  'keep-out': `That point is on keep-out ground: steeper than ${SLOPE_LIMIT_DEG} degrees. Choose a point that is not shaded red.`,
  unreachable: 'No walkable way there and back was found: keep-out ground cuts it off from home.',
};

/** Start route planning for an open site. Returns a function that takes everything away again. */
export function startRoutePlanner(map: MapLibreMap, loaded: LoadedSite): () => void {
  const card = el('section', 'route-card');
  card.setAttribute('aria-label', 'Plan a walk');
  const status = el('p', 'route-card__status', 'Reading the ground and working out the ways from home…');
  status.setAttribute('role', 'status');
  const result = el('div');
  card.append(el('h2', undefined, 'Plan a walk'), status, result);
  map.getContainer().append(card);

  const layer = addRouteLayer(map);
  let stopped = false;
  let stopWorker = (): void => {};
  let onClick: ((event: MapMouseEvent) => void) | null = null;
  let latest = 0;

  const showAnswer = (answer: RouteAnswer): void => {
    result.replaceChildren();
    if (!answer.ok) {
      layer.showRoute(null);
      status.textContent = REFUSALS[answer.reason] ?? 'No route was found.';
      return;
    }
    layer.showRoute({ target: answer.target, out: answer.out.line, back: answer.back.line });
    status.textContent = 'Click another point to change the target.';
    const table = el('table', 'route-card__table');
    const head = el('tr');
    for (const title of ['', 'Distance', 'Climb', 'Time', 'Energy']) head.append(el('th', undefined, title));
    const body = el('tbody');
    body.append(
      legRow('Out', OUT_COLOUR, [answer.out]),
      legRow('Back', BACK_COLOUR, [answer.back]),
      legRow('Round trip', null, [answer.out, answer.back]),
    );
    const thead = el('thead');
    thead.append(head);
    table.append(thead, body);
    const steepest = Math.max(
      answer.out.stats.steepestUpDeg, -answer.out.stats.steepestDownDeg,
      answer.back.stats.steepestUpDeg, -answer.back.stats.steepestDownDeg,
    );
    const details = el('details', 'route-card__basis');
    details.append(el('summary', undefined, 'What these numbers rest on'));
    const basis = el('ul');
    for (const text of [
      'Modelled, not measured. Nobody has walked on Mars. Time and energy come from a walking model built on Apollo lunar data and load-carrying tests on Earth, with Mars gravity (grade C).',
      'Each number is the expected case, with the favourable and cautious cases in brackets. The route is chosen for least energy in the expected case; walking time only, with no stops.',
      ...WALK_CASES.map((c) => `${c.id[0]!.toUpperCase()}${c.id.slice(1)}: ${c.basis}`),
      `Ground steeper than ${SLOPE_LIMIT_DEG} degrees is keep-out, from NASA's Artemis requirement for walking on the Moon (grade C). Slope is measured from orbit over about 6 m, so rocks and ledges smaller than about 3 to 5 m are not seen.`,
      'The route follows 4 m grid cells, so its distance can be up to about 8% longer than a smooth path.',
      'Loose sand and rubble are not yet counted. Energy is metabolic energy; oxygen is not yet shown.',
    ]) basis.append(el('li', undefined, text));
    details.append(basis);
    result.append(
      table,
      el('p', 'route-card__note', `Steepest step along the route: ${steepest.toFixed(0)} degrees. Out and back differ because uphill and downhill cost differently.`),
      details,
    );
  };

  void (async () => {
    try {
      const definition = loaded.site.grid;
      if (!definition) throw new Error('This site has no routing grids, so routes cannot be planned here.');
      const files = await loadRoutingGridFiles(loaded);
      if (stopped) return;
      const home: [number, number] = [loaded.site.centre.lonEastDeg, loaded.site.centre.latDeg];
      const client = startRouteWorker({ definition, ...files, home, slopeLimitDeg: SLOPE_LIMIT_DEG });
      stopWorker = client.stop;
      const ready = await client.ready;
      if (stopped) return;
      layer.showKeepOut(ready.keepOut, definition);
      if (ready.homeCentre) layer.showHome(ready.homeCentre);
      const about = el('p', 'route-card__note');
      about.textContent =
        `Home is the site's marker, where Perseverance stood at Cheyava Falls: a stand-in until the team chooses where the crew's rover parks. ` +
        `Red shading is keep-out ground, steeper than ${SLOPE_LIMIT_DEG} degrees: ${(ready.keepOutShare * 100).toFixed(0)}% of this box. ` +
        `${(ready.reachableShare * 100).toFixed(0)}% of the box can be walked to and back from.`;
      card.insertBefore(about, result);
      if (!ready.homeUsable) {
        status.textContent = 'Home is on keep-out ground or outside the box, so no walk can start here.';
        return;
      }
      status.textContent = 'Click the ground to choose a target.';
      onClick = (event) => {
        const request = ++latest;
        status.textContent = 'Working out the walk…';
        void client.route([event.lngLat.lng, event.lngLat.lat]).then((answer) => {
          if (!stopped && request === latest) showAnswer(answer);
        });
      };
      map.on('click', onClick);
      map.getCanvas().style.cursor = 'crosshair';
      if (import.meta.env.DEV) (window as unknown as { tetherRoute: unknown }).tetherRoute = { client, ready, showAnswer };
    } catch (error) {
      if (!stopped) status.textContent = error instanceof Error ? error.message : String(error);
    }
  })();

  return () => {
    stopped = true;
    stopWorker();
    if (onClick) map.off('click', onClick);
    map.getCanvas().style.cursor = '';
    layer.remove();
    card.remove();
  };
}
