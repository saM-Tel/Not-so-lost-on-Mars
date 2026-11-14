// WHAT:    Route card: click a target, see the walk out and back with distance, climb, time and energy for three cases (F3),
//          the tether with its settings and whether the walk stays inside it (F4), the radiation dose on the walk (F5),
//          and real rover photos taken near it (F6).
//          Still to add: several targets, oxygen, the route's confidence line, the elevation profile.
// IN:      A loaded site with routing grids; clicks on the map; results from src/route/client.ts.
// OUT:     A card over the map, and the route drawn through src/map/routeLayer.ts. Returns a function that removes both.
// USED BY: src/main.ts.
// RULES:   Ranges are written as in docs/CONFIDENCE.md section 5. Every number says what it rests on.
// TRAPS:   PITFALLS 6, 7, 11.
// OWNER:   Role B.

import type { Map as MapLibreMap, MapMouseEvent } from 'maplibre-gl';
import { loadRoutingGridFiles, type LoadedSite } from '../data/loadSite';
import type { Overlay } from '../map/overlays';
import { addRouteLayer, BACK_COLOUR, OUT_COLOUR } from '../map/routeLayer';
import { startRouteWorker } from '../route/client';
import { WALK_CASES } from '../route/cost';
import type { RouteAnswer, RouteLeg, TetherFields } from '../route/messages';
import { allowedTimeHomeS, DEFAULT_WALK_BACK_LIMIT_S, timeLeftS } from '../safety/budget';
import { walkDose } from '../safety/dose';
import { farthestFromHomeS, tetherPicture } from '../safety/tether';
import { formatDistance, formatDose, formatDuration, formatEnergy, formatHeight, formatRange } from './format';
import { createPhotoStrip } from './photoStrip';
import { createTetherControls } from './safetyPanel';
import { updateUrlState, type UrlState } from './urlState';

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
export function startRoutePlanner(
  map: MapLibreMap, loaded: LoadedSite,
  options: { onOverlay?: (overlay: Overlay) => void; /** A walk to restore, from a shared link. */ restore?: UrlState } = {},
): () => void {
  const card = el('section', 'route-card');
  card.setAttribute('aria-label', 'Plan a walk');
  const status = el('p', 'route-card__status', 'Reading the ground and working out the ways from home…');
  status.setAttribute('role', 'status');
  const result = el('div');
  const photos = createPhotoStrip(loaded.folderUrl);
  // The card can be folded away so the map is clear; the status line stays in view.
  const fold = el('button', 'route-card__fold', 'Hide');
  fold.type = 'button';
  fold.setAttribute('aria-expanded', 'true');
  fold.addEventListener('click', () => {
    const folded = card.classList.toggle('route-card--folded');
    fold.textContent = folded ? 'Show' : 'Hide';
    fold.setAttribute('aria-expanded', String(!folded));
  });
  const heading = el('header', 'route-card__header');
  heading.append(el('h2', undefined, 'Plan a walk'), fold);
  card.append(heading, status, result, photos.element);
  map.getContainer().append(card);

  const layer = addRouteLayer(map);
  let stopped = false;
  let stopWorker = (): void => {};
  let onClick: ((event: MapMouseEvent) => void) | null = null;
  let latest = 0;
  let tetherFields: TetherFields | null = null;
  let lastAnswer: RouteAnswer | null = null;
  let redraw = 0;

  /** Say whether the walk on screen stays inside the tether, judged at its far end in the cautious case. */
  const showVerdict = (): void => {
    const definition = loaded.site.grid;
    if (!tetherFields || !definition || !lastAnswer?.ok) { tether.showVerdict(null); return; }
    const settings = tether.settings();
    const outS = caseValue(lastAnswer.out, 'cautious', 'timeS');
    const backS = caseValue(lastAnswer.back, 'cautious', 'timeS');
    // By the time the walker reaches the far end, this much of the walk has gone.
    const allowedThereS = allowedTimeHomeS({ ...settings, elapsedS: settings.elapsedS + outS });
    const farthestS = farthestFromHomeS(tetherFields.cautiousS, definition, lastAnswer.out.line);
    if (settings.elapsedS + outS + backS > settings.elapsedS + timeLeftS(settings.elapsedS)) {
      tether.showVerdict({ inside: false, text: `Not enough time left. Out and back takes ${formatDuration(outS + backS)} in the cautious case and ${formatDuration(timeLeftS(settings.elapsedS))} is left.` });
    } else if (farthestS > allowedThereS) {
      tether.showVerdict({ inside: false, text: `This walk leaves the tether. At its farthest it is ${formatDuration(farthestS)} from home in the cautious case; the most allowed by then is ${formatDuration(allowedThereS)}. Choose a nearer target.` });
    } else {
      tether.showVerdict({ inside: true, text: `This walk stays inside the tether. At its farthest it is ${formatDuration(farthestS)} from home in the cautious case; ${formatDuration(allowedThereS)} is allowed.` });
    }
  };

  /** Draw the tether for the settings now chosen. Several changes in one frame are drawn once. */
  const drawTether = (): void => {
    cancelAnimationFrame(redraw);
    redraw = requestAnimationFrame(() => {
      const definition = loaded.site.grid;
      if (stopped || !tetherFields || !definition) return;
      const settings = tether.settings();
      // Keep the address bar in step, so the link can be shared. Defaults are left out to keep it short.
      updateUrlState({
        walkBackMin: settings.walkBackLimitS === DEFAULT_WALK_BACK_LIMIT_S ? null : settings.walkBackLimitS / 60,
        elapsedMin: settings.elapsedS / 60,
      });
      const allowedS = allowedTimeHomeS(settings);
      layer.showTether(tetherPicture(tetherFields.cautiousS, tetherFields.expectedS, allowedS, definition.rows, definition.cols), definition);
      showVerdict();
    });
  };
  const tether = createTetherControls(drawTether);

  const showAnswer = (answer: RouteAnswer): void => {
    lastAnswer = answer;
    showVerdict();
    result.replaceChildren();
    if (!answer.ok) {
      layer.showRoute(null);
      photos.show(null);
      updateUrlState({ target: null });
      status.textContent = REFUSALS[answer.reason] ?? 'No route was found.';
      return;
    }
    layer.showRoute({ target: answer.target, out: answer.out.line, back: answer.back.line });
    updateUrlState({ target: answer.target });
    // Photos the rover took near the way out and the way back.
    photos.show([...answer.out.line, ...answer.back.line]);
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
    // Radiation picked up outside over the round trip. Gray and sievert each come from their own measured rate.
    const walkTime = (caseId: string): number => caseValue(answer.out, caseId, 'timeS') + caseValue(answer.back, caseId, 'timeS');
    const dose = walkDose({ favourable: walkTime('favourable'), expected: walkTime('expected'), cautious: walkTime('cautious') });
    const doseLine = el('p', 'route-card__dose');
    doseLine.textContent =
      `Radiation on this walk: ${formatRange(dose.equivalentUSv.expected, dose.equivalentUSv.lowest, dose.equivalentUSv.highest, (v) => formatDose(v, 'Sv'))} dose equivalent; ` +
      `${formatRange(dose.absorbedUGy.expected, dose.absorbedUGy.lowest, dose.absorbedUGy.highest, (v) => formatDose(v, 'Gy'))} absorbed dose.`;
    const doseBasis = el('p', 'route-card__note',
      'Modelled from the everyday background Curiosity measured at Gale crater, applied here (grade C), for the walking time only. The range covers the solar cycle and the three walking cases. A solar storm can add far more in hours and is not included.');
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
      doseLine,
      doseBasis,
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
      // Keep-out ground is a layer like any other in the layer panel. Its record is the slope layer's, with what
      // we did to it and the lower grade that the walking limit brings.
      const slope = loaded.layers.usable.find((record) => record.grid === 'slopeMaxDeg');
      if (slope && options.onOverlay) {
        const keepOut: Overlay = {
          record: {
            ...slope,
            id: 'keep-out',
            title: 'Keep-out ground',
            processing: `Cells whose steepest slope is over ${SLOPE_LIMIT_DEG} degrees. The limit is NASA's Artemis III requirement for walking on the Moon (Ortiz 2025), applied to Mars. Routes never cross these cells.`,
            grade: 'C',
            caveats: [
              `The ${SLOPE_LIMIT_DEG} degree limit is a lunar requirement applied to Mars, and its source does not say over what distance slope is measured.`,
              'Ground that is not shaded is not proven safe: rocks, loose sand and ledges under about 3 m are not seen.',
              ...slope.caveats,
            ],
          },
          legend: { kind: 'swatches', items: [{ colour: '#e5484d', label: `Steeper than ${SLOPE_LIMIT_DEG}°: do not walk here` }] },
          visible: true,
          opacity: 0.4,
          setVisible(visible) { keepOut.visible = visible; layer.setKeepOut(keepOut.visible, keepOut.opacity); },
          setOpacity(opacity) { keepOut.opacity = opacity; layer.setKeepOut(keepOut.visible, keepOut.opacity); },
        };
        options.onOverlay(keepOut);
      }
      if (ready.homeCentre) layer.showHome(ready.homeCentre);
      const about = el('p', 'route-card__note');
      about.textContent =
        `Home is the site's marker, a stand-in until the team chooses where the crew's rover parks. ` +
        `Red is keep-out ground, steeper than ${SLOPE_LIMIT_DEG} degrees: ${(ready.keepOutShare * 100).toFixed(0)}% of this box. ` +
        `${(ready.reachableShare * 100).toFixed(0)}% of it can be walked to and back from.`;
      card.insertBefore(about, result);
      const restore = options.restore;
      void client.tether.then((fields) => {
        if (stopped) return;
        tetherFields = fields;
        if (restore) {
          tether.set({
            ...(restore.walkBackMin ? { walkBackLimitS: restore.walkBackMin * 60 } : {}),
            ...(restore.elapsedMin ? { elapsedS: restore.elapsedMin * 60 } : {}),
          });
        }
        card.insertBefore(tether.element, result);
        drawTether();
      });
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
      // A shared link names a target: plan that walk straight away.
      if (restore?.target) {
        const request = ++latest;
        status.textContent = 'Working out the walk…';
        void client.route(restore.target).then((answer) => {
          if (!stopped && request === latest) showAnswer(answer);
        });
      }
      if (import.meta.env.DEV) (window as unknown as { tetherRoute: unknown }).tetherRoute = { client, ready, showAnswer, tetherReady: client.tether };
    } catch (error) {
      if (!stopped) status.textContent = error instanceof Error ? error.message : String(error);
    }
  })();

  return () => {
    stopped = true;
    cancelAnimationFrame(redraw);
    stopWorker();
    if (onClick) map.off('click', onClick);
    map.getCanvas().style.cursor = '';
    layer.remove();
    card.remove();
  };
}
