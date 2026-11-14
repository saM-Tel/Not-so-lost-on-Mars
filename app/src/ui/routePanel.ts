// WHAT:    Route card: click a target, see the walk out and back with distance, climb, time and energy for three cases (F3),
//          the tether with its settings and whether the walk stays inside it (F4), the radiation dose on the walk (F5),
//          and real rover photos taken near it (F6). Laid out answer first (status and tether verdict), then parts that
//          open and close: targets, tether, this walk, photos, storm, when to go, home and suit (F17).
//          Also the scenario's science targets, oxygen, the elevation profile, the route's confidence line, the suit's
//          slope limit, the storm drill, the when-to-go panel, route export and the field views' state.
//          Still to add: a route through several targets in a row.
// IN:      A loaded site with routing grids; clicks on the map; results from src/route/client.ts.
// OUT:     A card over the map, and the route drawn through src/map/routeLayer.ts. Returns a function that removes both.
// USED BY: src/main.ts.
// RULES:   Ranges are written as in docs/CONFIDENCE.md section 5. Every number says what it rests on.
// TRAPS:   PITFALLS 6, 7, 11.
// OWNER:   Role B.

import type { Map as MapLibreMap, MapMouseEvent } from 'maplibre-gl';
import type { ScenarioPlace } from '../data/contract';
import { loadRoutingGridFiles, type LoadedSite } from '../data/loadSite';
import type { Overlay } from '../map/overlays';
import { addRouteLayer, BACK_COLOUR, OUT_COLOUR } from '../map/routeLayer';
import { setSunShading } from '../map/siteLayers';
import { startRouteWorker } from '../route/client';
import { WALK_CASES } from '../route/cost';
import type { RouteAnswer, RouteLeg, TetherFields } from '../route/messages';
import { allowedTimeHomeS, DEFAULT_WALK_BACK_LIMIT_S, timeLeftS, WALK_DURATION_S } from '../safety/budget';
import { walkDose } from '../safety/dose';
import { OXYGEN_BASIS, oxygenForEnergy } from '../safety/oxygen';
import { stormAdvice } from '../safety/storm';
import { tetherPicture, walkFarthestFromHomeS } from '../safety/tether';
import { formatDistance, formatDose, formatDuration, formatEnergy, formatHeight, formatRange } from './format';
import { createOrbitPanel } from './orbitPanel';
import { createWalkThrough } from './walkThrough';
import { createPhotoStrip } from './photoStrip';
import { profileChart } from './profileChart';
import { createTimePanel } from './timeSlider';
import { createModeSwitch, type FieldState } from './modes';
import { loadPhotoIndex, photosNearRoute } from '../data/photos';
import { bearingDeg } from '../mars/geometry';
import { createStormDrill, createSuitSettings as suitSettings, createTetherControls } from './safetyPanel';
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

/** The scenario's science targets as buttons, each with its reason and where its position comes from. */
function targetList(targets: ScenarioPlace[], onPick: (target: ScenarioPlace) => void): HTMLElement {
  const box = el('div', 'route-card__targets');
  box.append(el('h3', undefined, 'Science targets'));
  const list = el('ul');
  for (const target of targets) {
    const item = el('li');
    const button = el('button', 'route-card__target', target.name);
    button.type = 'button';
    button.addEventListener('click', () => onPick(target));
    const why = el('p', 'route-card__note');
    why.append(`${target.why} `);
    const link = el('a', undefined, 'Source');
    link.href = target.whySourceUrl;
    link.target = '_blank';
    link.rel = 'noopener';
    why.append(link, `. Position: ${target.positionSource}.`);
    item.append(button, why);
    list.append(item);
  }
  box.append(list);
  return box;
}

const REFUSALS: Record<string, string> = {
  outside: 'That point is outside the mapped box. Choose a point on the detailed ground.',
  'keep-out': 'That point is on keep-out ground: steeper than the slope limit, or with no terrain data. Choose a point that is not shaded red.',
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
  // F17: the answer first (the status line and the tether verdict), then each part under a heading that opens and
  // closes. A part stays hidden until it has something to show.
  const summary = el('div', 'route-card__summary');
  summary.append(status);
  const part = (title: string, open: boolean): HTMLDetailsElement => {
    const box = el('details', 'card-section');
    box.open = open;
    box.hidden = true;
    box.append(el('summary', 'card-section__title', title));
    return box;
  };
  const parts = {
    targets: part('Science targets', true),
    tether: part('Tether: how far you can go', true),
    walk: part('This walk: distance, time, oxygen, radiation', true),
    orbit: part('Link and view from orbit', false),
    walkthrough: part('Walk-through: an astronaut on the ground', false),
    photos: part('What you will see: rover photos', false),
    storm: part('Storm drill', false),
    when: part('When to go: Sun and weather', false),
    setup: part('Home, rover and suit', false),
  };
  /** Put content into a part and show it. */
  const fill = (box: HTMLDetailsElement, ...content: HTMLElement[]): void => {
    box.append(...content);
    box.hidden = false;
  };
  parts.walk.append(result);
  fill(parts.photos, photos.element);
  card.append(heading, summary, ...Object.values(parts));
  map.getContainer().append(card);

  const layer = addRouteLayer(map);
  // Link and view from orbit (F18): the stretches with no link glow on the map only while this part is open.
  const orbit = createOrbitPanel({
    dataUrl: new URL('../', loaded.folderUrl).href, siteId: loaded.site.id,
    lonEastDeg: loaded.site.centre.lonEastDeg, latDeg: loaded.site.centre.latDeg,
    onGaps: (stretches) => layer.showGaps(stretches),
  });
  fill(parts.orbit, orbit.element);
  parts.orbit.addEventListener('toggle', () => orbit.setOpen(parts.orbit.open));
  // Walk-through (F19): a to-scale astronaut on the ground, using this card's ground, tether, home and route.
  let keepOutCells: Uint8Array | null = null;
  let homeAt: [number, number] | null = null;
  let heightView: Float32Array | null = null;
  const walk = createWalkThrough(map, {
    ground: () => {
      const definition = loaded.site.grid;
      if (!definition || !gridFiles) return null;
      heightView ??= new Float32Array(gridFiles.heightM);
      return { definition, heightM: heightView, keepOut: keepOutCells };
    },
    timeHomeS: () => tetherFields?.cautiousS ?? null,
    home: () => homeAt,
    route: () => (lastAnswer?.ok ? { out: lastAnswer.out.line, back: lastAnswer.back.line } : null),
    allowedS: (elapsedS) => allowedTimeHomeS({ ...tether.settings(), elapsedS }),
    setElapsed: (elapsedS) => { tether.set({ elapsedS }); drawTether(); },
    relaysAt: (utc) => orbit.relaysAt(utc),
    site: [loaded.site.centre.lonEastDeg, loaded.site.centre.latDeg],
  });
  fill(parts.walkthrough, walk.element);
  let stopped = false;
  let stopWorker = (): void => {};
  let onClick: ((event: MapMouseEvent) => void) | null = null;
  let latest = 0;
  let tetherFields: TetherFields | null = null;
  let lastAnswer: RouteAnswer | null = null;
  let redraw = 0;
  /** The suit's slope limit now chosen, degrees. Changing it restarts the route worker. */
  let slopeLimitDeg = SLOPE_LIMIT_DEG;
  /** Plan the walk from home to a position and back. Set once the worker is ready. */
  let planTo: (position: [number, number]) => void = () => {};

  /** Say whether the walk on screen stays inside the tether, judged at its far end in the cautious case. */
  const showVerdict = (): void => {
    const definition = loaded.site.grid;
    if (!tetherFields || !definition || !lastAnswer?.ok) { tether.showVerdict(null); modes.setState(null); return; }
    const settings = tether.settings();
    const outS = caseValue(lastAnswer.out, 'cautious', 'timeS');
    const backS = caseValue(lastAnswer.back, 'cautious', 'timeS');
    // By the time the walker reaches the far end, this much of the walk has gone.
    const allowedThereS = allowedTimeHomeS({ ...settings, elapsedS: settings.elapsedS + outS });
    // Judged along the walk as planned: the way back drawn on the map can be slower than the quickest way home.
    const farthestS = walkFarthestFromHomeS(tetherFields.cautiousS, definition, lastAnswer.out.line, lastAnswer.back.line, backS);
    let alert: string | null = null;
    if (outS + backS > timeLeftS(settings.elapsedS)) {
      alert = 'Not enough time left for this walk.';
      tether.showVerdict({ inside: false, text: `Not enough time left. Out and back takes ${formatDuration(outS + backS)} in the cautious case and ${formatDuration(timeLeftS(settings.elapsedS))} is left.` });
    } else if (farthestS > allowedThereS) {
      alert = 'This walk leaves the tether. Choose a nearer target.';
      tether.showVerdict({ inside: false, text: `This walk leaves the tether. At its farthest it is ${formatDuration(farthestS)} from home in the cautious case, along the planned way out and back; the most allowed by then is ${formatDuration(allowedThereS)}. Choose a nearer target.` });
    } else {
      tether.showVerdict({ inside: true, text: `This walk stays inside the tether. At its farthest it is ${formatDuration(farthestS)} from home in the cautious case, along the planned way out and back; ${formatDuration(allowedThereS)} is allowed.` });
    }
    updateField(lastAnswer, settings.elapsedS, outS, backS, allowedThereS, farthestS, alert);
  };

  /** The field tablet and helmet views (F13): cautious values for the planned walk. */
  let stormAlert: string | null = null;
  const photoIndex = loadPhotoIndex(loaded.folderUrl);
  let fieldRequest = 0;
  /** The photo found for the current target, kept so slider moves do not look it up and reload it again. */
  let fieldPhoto: { key: string; photo: FieldState['photo'] } | null = null;
  const updateField = (
    answer: Extract<RouteAnswer, { ok: true }>, elapsedS: number, outS: number, backS: number, allowedThereS: number, farthestS: number,
    verdictAlert: string | null,
  ): void => {
    const homeAt: [number, number] = homeOverride ?? (loaded.site.home ? [loaded.site.home.lonEastDeg, loaded.site.home.latDeg] : [loaded.site.centre.lonEastDeg, loaded.site.centre.latDeg]);
    const named = (loaded.site.targets ?? []).find((t) => Math.abs(t.lonEastDeg - answer.target[0]) < 1e-4 && Math.abs(t.latDeg - answer.target[1]) < 1e-4);
    const state: FieldState = {
      targetName: named?.name ?? 'Chosen point',
      distanceM: answer.out.stats.distanceM,
      bearingDeg: bearingDeg(homeAt, answer.target),
      homeFromTargetS: backS,
      tetherMarginS: allowedThereS - farthestS,
      tetherAllowedS: allowedThereS,
      stayAtTargetS: verdictAlert === null ? WALK_DURATION_S - elapsedS - outS - backS : 0,
      alert: stormAlert ?? verdictAlert,
      photo: null,
    };
    const key = `${answer.target[0].toFixed(6)},${answer.target[1].toFixed(6)}`;
    if (fieldPhoto?.key === key) {
      modes.setState({ ...state, photo: fieldPhoto.photo });
      return;
    }
    modes.setState(state);
    const mine = ++fieldRequest;
    void photoIndex.then((index) => {
      if (!index || mine !== fieldRequest) return;
      const near = photosNearRoute(index.photos, [answer.target], 60, 1, 1)[0];
      const p = near?.photo;
      const photo = p ? { url: p.mediumUrl, caption: `${p.camera}, sol ${p.sol}, ${Math.round(near!.distanceM)} m from the target. ${p.credit}` } : null;
      fieldPhoto = { key, photo };
      modes.setState({ ...state, photo });
    });
  };
  const modes = createModeSwitch({
    onLayoutChange: () => {
      map.resize();
      const card = document.querySelector<HTMLElement>('.field-card');
      if (!document.body.classList.contains('mode-tablet') || !card || !lastAnswer?.ok) return;
      const points = [...lastAnswer.out.line, ...lastAnswer.back.line];
      const lons = points.map((p) => p[0]);
      const lats = points.map((p) => p[1]);
      map.fitBounds([[Math.min(...lons), Math.min(...lats)], [Math.max(...lons), Math.max(...lats)]], {
        padding: { top: 70, left: 40, right: 40, bottom: card.offsetHeight + 60 }, duration: 600,
      });
    },
    onNextTarget: () => {
      const targets = loaded.site.targets ?? [];
      if (targets.length === 0) return;
      const current = lastAnswer?.ok ? lastAnswer.target : null;
      const at = current ? targets.findIndex((t) => Math.abs(t.lonEastDeg - current[0]) < 1e-4 && Math.abs(t.latDeg - current[1]) < 1e-4) : -1;
      const next = targets[(at + 1) % targets.length]!;
      stormAlert = null;
      planTo([next.lonEastDeg, next.latDeg]);
    },
    onGoHome: () => {
      if (!lastAnswer?.ok) return;
      const line = lastAnswer.back.line;
      const lons = line.map((p) => p[0]);
      const lats = line.map((p) => p[1]);
      map.fitBounds([[Math.min(...lons), Math.min(...lats)], [Math.max(...lons), Math.max(...lats)]], { padding: 80, duration: 800 });
      stormAlert = null;
      showVerdict();
    },
    onStorm: () => {
      if (!lastAnswer?.ok) return;
      stormAlert = stormAdvice(caseValue(lastAnswer.back, 'cautious', 'timeS'), storm.warningS(), formatDuration).headline;
      showVerdict();
    },
  });

  /** Draw the tether for the settings now chosen. Several changes in one frame are drawn once. */
  /** What the tether on screen was drawn from, so a slider move that changes nothing is not drawn again (R8). */
  let drawn: { fields: TetherFields; allowedS: number } | null = null;
  let urlTimer = 0;
  const drawTether = (): void => {
    cancelAnimationFrame(redraw);
    redraw = requestAnimationFrame(() => {
      const definition = loaded.site.grid;
      if (stopped || !tetherFields || !definition) return;
      const settings = tether.settings();
      // Keep the address bar in step, so the link can be shared. Defaults are left out to keep it short. Written a
      // moment after the slider rests: some browsers refuse an address that changes many times a second (R7).
      window.clearTimeout(urlTimer);
      urlTimer = window.setTimeout(() => {
        try {
          updateUrlState({
            walkBackMin: settings.walkBackLimitS === DEFAULT_WALK_BACK_LIMIT_S ? null : settings.walkBackLimitS / 60,
            elapsedMin: settings.elapsedS / 60,
          });
        } catch { /* the address bar is a convenience; the tether must go on drawing without it */ }
      }, 300);
      const allowedS = allowedTimeHomeS(settings);
      // With a one-hour limit the allowed time is the same for the first seven hours of the walk.
      if (drawn?.fields !== tetherFields || drawn.allowedS !== allowedS) {
        layer.showTether(tetherPicture(tetherFields.cautiousS, tetherFields.expectedS, allowedS, definition.rows, definition.cols), definition);
        drawn = { fields: tetherFields, allowedS };
      }
      showVerdict();
    });
  };
  const tether = createTetherControls(drawTether);
  // The verdict answers the product's question, so it sits at the top of the card, under the status line.
  summary.append(tether.verdictElement);

  /**
   * Route confidence (F3): the weakest stretch is ground close to the slope limit, where our slope from orbit may be
   * off by as much as the margin. 4 degrees: 9 in 10 rover stops agreed with our slope within 4.0 degrees (F9).
   */
  const CONFIDENCE_MARGIN_DEG = 4;
  const confidenceLine = (answer: Extract<RouteAnswer, { ok: true }>): HTMLElement => {
    const line = el('p', 'route-card__note');
    const definition = loaded.site.grid;
    if (!gridFiles || !definition) return line;
    const slope = new Float32Array(gridFiles.slopeMaxDeg);
    let near = 0;
    let total = 0;
    const points = [...answer.out.line, ...answer.back.line];
    for (let i = 1; i < points.length; i++) {
      const [lon, lat] = points[i]!;
      const col = Math.floor((lon - definition.northWestCorner.lonEastDeg) / definition.cellLonDeg);
      const row = Math.floor((definition.northWestCorner.latDeg - lat) / definition.cellLatDeg);
      if (row < 0 || col < 0 || row >= definition.rows || col >= definition.cols) continue;
      const stepM = Math.hypot((points[i]![0] - points[i - 1]![0]) * definition.cellEastWestM / definition.cellLonDeg,
        (points[i]![1] - points[i - 1]![1]) * definition.cellNorthSouthM / definition.cellLatDeg);
      total += stepM;
      if (slope[row * definition.cols + col]! > slopeLimitDeg - CONFIDENCE_MARGIN_DEG) near += stepM;
    }
    const share = total > 0 ? near / total : 0;
    // The rover check of our slope, where this site has one. Without it the margin is an assumption, and says so.
    const check = loaded.validation?.slope;
    const basis = check?.percentile90AbsoluteDifferenceDeg !== undefined
      ? `9 in 10 of the ${check.stopsUsed} rover stops here agreed with our slope within ${check.percentile90AbsoluteDifferenceDeg} degrees`
      : 'an assumed margin: our slope has not been checked against a rover at this site';
    line.textContent = near === 0
      ? `Route confidence: the whole walk stays more than ${CONFIDENCE_MARGIN_DEG} degrees below the slope limit (${basis}), so an error that large in our slope would not make it too steep (grade C).`
      : `Route confidence: weakest stretch. ${formatDistance(near)} of the walk (${(share * 100).toFixed(0)}%) crosses ground within ${CONFIDENCE_MARGIN_DEG} degrees of the slope limit, where our slope from orbit may be off by that much (${basis}). Check those stretches on the ground (grade C).`;
    return line;
  };

  /**
   * Validation (F9): one route against the rover's own drive. Home and the scenario's targets are rover stops, and
   * every stop logs the distance the rover had driven, so the rover's distance between them is known.
   */
  const stopsRecord = loaded.layers.usable.find((record) => record.vector?.geometry === 'point');
  const roverStops: Promise<Map<string, { sol: number; drivenTotalM: number }>> = stopsRecord?.vector
    ? fetch(loaded.folderUrl + stopsRecord.vector.path).then(async (response) => {
      const collection = (await response.json()) as { features: { properties: { stop: string; sol: number; drivenTotalM?: number } }[] };
      const byStop = new Map<string, { sol: number; drivenTotalM: number }>();
      for (const f of collection.features) {
        if (f.properties.drivenTotalM !== undefined && !byStop.has(f.properties.stop)) byStop.set(f.properties.stop, { sol: f.properties.sol, drivenTotalM: f.properties.drivenTotalM });
      }
      return byStop;
    }).catch(() => new Map())
    : Promise.resolve(new Map());
  const roverComparison = (answer: Extract<RouteAnswer, { ok: true }>): HTMLElement => {
    const line = el('p', 'route-card__note');
    const home = loaded.site.home;
    const target = (loaded.site.targets ?? []).find((t) => Math.abs(t.lonEastDeg - answer.target[0]) < 1e-4 && Math.abs(t.latDeg - answer.target[1]) < 1e-4);
    // The comparison is between two rover stops. Once the crew rover has been moved, home is no longer one of them.
    if (!home || !target || homeOverride) return line;
    void roverStops.then((stops) => {
      const a = stops.get(home.stop);
      const b = stops.get(target.stop);
      if (!a || !b) return;
      const drivenM = Math.abs(b.drivenTotalM - a.drivenTotalM);
      line.textContent =
        `Checked against the rover: the ${loaded.site.mission} rover drove ${formatDistance(drivenM)} between these two stops (sols ${Math.min(a.sol, b.sol)} to ${Math.max(a.sol, b.sol)}), ` +
        `against ${formatDistance(answer.out.stats.distanceM)} for our walk out. The rover's drive includes stops and detours for science, so it is a check on scale, not a race (F9, measured).`;
    });
    return line;
  };

  /**
   * Route export (F16): the walk as GeoJSON, with the Mars frame written into the file so nobody loads it into an
   * Earth GPS tool by mistake. No GPX: GPX means Earth coordinates.
   */
  const exportButton = (answer: Extract<RouteAnswer, { ok: true }>): HTMLElement => {
    const button = el('button', 'route-card__target', 'Download this walk (GeoJSON)');
    button.type = 'button';
    button.addEventListener('click', () => {
      const leg = (name: string, line: [number, number][], stats: RouteLeg['stats']) => ({
        type: 'Feature',
        properties: {
          leg: name, distanceM: Math.round(stats.distanceM), climbM: Math.round(stats.climbM),
          timeS: Object.fromEntries(stats.cases.map((c) => [c.caseId, Math.round(c.timeS)])),
          energyJ: Object.fromEntries(stats.cases.map((c) => [c.caseId, Math.round(c.energyJ)])),
        },
        geometry: { type: 'LineString', coordinates: line },
      });
      const file = {
        type: 'FeatureCollection',
        frame: 'Mars: planetocentric latitude and east-positive longitude in degrees on the Mars 2000 sphere (radius 3,396,190 m). Not Earth coordinates.',
        site: loaded.site.id,
        slopeLimitDeg,
        madeUtc: new Date().toISOString(),
        modelled: 'Times and energy are modelled for three cases (favourable, expected, cautious); see the app for sources.',
        features: [leg('out', answer.out.line, answer.out.stats), leg('back', answer.back.line, answer.back.stats)],
      };
      const url = URL.createObjectURL(new Blob([JSON.stringify(file, null, 1)], { type: 'application/geo+json' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `tether-${loaded.site.id}-walk.geojson`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    });
    return button;
  };

  /** Rover drop-off (F16): the crew rover can drive to a new spot, which becomes home for the tether and every walk. */
  let homeOverride: [number, number] | null = null;
  let placingHome = false;
  const moveRover = el('button', 'route-card__target', 'Move the rover: click a new spot');
  moveRover.type = 'button';
  moveRover.addEventListener('click', () => {
    placingHome = !placingHome;
    moveRover.textContent = placingHome ? 'Click the map where the rover should park…' : 'Move the rover: click a new spot';
  });

  /** Storm mode (F10): what to do from the far end of the planned walk if a storm is coming. */
  const showStorm = (): void => {
    if (!lastAnswer?.ok) { storm.show(null, null); return; }
    const answer = lastAnswer;
    const timeHomeS = caseValue(answer.back, 'cautious', 'timeS');
    const walkTime = (caseId: string): number => caseValue(answer.out, caseId, 'timeS') + caseValue(answer.back, caseId, 'timeS');
    const dose = walkDose({ favourable: walkTime('favourable'), expected: walkTime('expected'), cautious: walkTime('cautious') });
    storm.show(stormAdvice(timeHomeS, storm.warningS(), formatDuration), dose.absorbedUGy.expected);
  };
  const storm = createStormDrill(showStorm);
  /** When to go (F11): Sun, daylight along the walk and, where the site has a station record, typical weather. */
  const when = createTimePanel({
    lonEastDeg: loaded.site.centre.lonEastDeg,
    latDeg: loaded.site.centre.latDeg,
    weatherUrl: new URL(`../weather/${loaded.site.id}.json`, loaded.folderUrl).href,
    onSun: (sun) => setSunShading(map, loaded, sun),
  });

  const showAnswer = (answer: RouteAnswer): void => {
    lastAnswer = answer;
    showVerdict();
    showStorm();
    when.setWalk(answer.ok ? caseValue(answer.out, 'cautious', 'timeS') + caseValue(answer.back, 'cautious', 'timeS') : null);
    if (answer.ok) {
      const outMin = caseValue(answer.out, 'cautious', 'timeS') / 60;
      const backMin = caseValue(answer.back, 'cautious', 'timeS') / 60;
      orbit.setWalk({
        minutes: outMin + backMin,
        legs: [
          { line: answer.out.line, distancesM: answer.out.stats.profile.map((p) => p.distanceM), minutes: outMin },
          { line: answer.back.line, distancesM: answer.back.stats.profile.map((p) => p.distanceM), minutes: backMin },
        ],
      });
    } else {
      orbit.setWalk(null);
    }
    result.replaceChildren();
    parts.walk.hidden = true;
    if (!answer.ok) {
      layer.showRoute(null);
      photos.show(null);
      updateUrlState({ target: null });
      status.textContent = REFUSALS[answer.reason] ?? 'No route was found.';
      modes.setState(null, status.textContent);
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
    const doseBasis =
      'Radiation: modelled from the everyday background Curiosity measured at Gale crater, applied here (grade C), for the walking time only. The range covers the solar cycle and the three walking cases. A solar storm can add far more in hours and is not included.';
    const details = el('details', 'route-card__basis');
    details.append(el('summary', undefined, 'What these numbers rest on'));
    const basis = el('ul');
    // F17: the notes that explain each number live here, one click away, so the card shows the numbers first.
    for (const text of [
      'Modelled, not measured. Nobody has walked on Mars. Time and energy come from a walking model built on Apollo lunar data and load-carrying tests on Earth, with Mars gravity (grade C).',
      'Each number is the expected case, with the favourable and cautious cases in brackets. The route is chosen for least energy in the expected case; walking time only, with no stops.',
      'Out and back differ because uphill and downhill cost differently.',
      `Oxygen: ${OXYGEN_BASIS}`,
      doseBasis,
      ...WALK_CASES.map((c) => `${c.id[0]!.toUpperCase()}${c.id.slice(1)}: ${c.basis}`),
      `Ground steeper than ${slopeLimitDeg} degrees is keep-out${slopeLimitDeg === SLOPE_LIMIT_DEG ? ", from NASA's Artemis requirement for walking on the Moon (grade C)" : ', a limit chosen in the suit settings (assumed); the NASA figure is 20 degrees'}. Slope is measured from orbit over about 6 m, so rocks and ledges smaller than about 3 to 5 m are not seen.`,
      'The route follows 4 m grid cells, so its distance can be up to about 8% longer than a smooth path.',
      'Loose sand and rubble are not yet counted. Energy is metabolic energy; oxygen is worked out from it.',
    ]) basis.append(el('li', undefined, text));
    details.append(basis);
    // Oxygen breathed over the round trip, from the energy of each case.
    const energy = (caseId: string): number => caseValue(answer.out, caseId, 'energyJ') + caseValue(answer.back, caseId, 'energyJ');
    const grams = (caseId: string): number => oxygenForEnergy(energy(caseId)).grams;
    const oxygenLine = el('p', 'route-card__dose');
    oxygenLine.textContent =
      `Oxygen breathed on this walk: ${formatRange(grams('expected'), grams('favourable'), grams('cautious'), (g) => `${g.toFixed(0)} g`)}.`;
    const terrainRecord = loaded.layers.usable.find((record) => record.id === 'terrain-hirise');
    const heightNote = terrainRecord
      ? `Heights from ${terrainRecord.mission} ${terrainRecord.instrument}; real detail ${terrainRecord.realDetail.toLowerCase()}; each point is the mean of a 4 m cell.`
      : 'Each point is the mean height of a 4 m cell.';
    // Numbers first (table, then oxygen, radiation and the steepest step), then the profile, the checks, what the
    // numbers rest on, and last the action of taking the walk away as a file.
    const steepLine = el('p', 'route-card__dose', `Steepest step along the route: ${steepest.toFixed(0)} degrees.`);
    result.append(
      table,
      oxygenLine,
      doseLine,
      steepLine,
      profileChart(answer.out.stats.profile, answer.back.stats.profile, OUT_COLOUR, BACK_COLOUR, heightNote),
      confidenceLine(answer),
      roverComparison(answer),
      details,
      exportButton(answer),
    );
    parts.walk.hidden = false;
  };

  // The site's routing grids, read once; the worker is started again whenever the slope limit changes.
  let gridFiles: Awaited<ReturnType<typeof loadRoutingGridFiles>> | null = null;
  let firstStart = true;
  let lastTarget: [number, number] | null = null;
  const about = el('p', 'route-card__note');
  /**
   * Work out the ways from home again, after a new slope limit or a moved rover. Everything worked out from the old
   * ones leaves the screen at once: the route, the tether, the verdict, the table, the photos, the storm advice and
   * the daylight line. If home turns out to be unusable they must not stay behind (R4).
   */
  const restart = (): void => {
    stopWorker();
    tetherFields = null;
    lastAnswer = null;
    drawn = null;
    layer.showRoute(null);
    layer.hideTether();
    result.replaceChildren();
    parts.walk.hidden = true;
    photos.show(null);
    when.setWalk(null);
    orbit.setWalk(null);
    showVerdict();
    showStorm();
    planTo = () => {};
    void begin();
  };
  const suit = suitSettings((limitDeg) => {
    slopeLimitDeg = limitDeg;
    restart();
  });

  /** Start the route worker for the current slope limit, draw keep-out ground and the tether, and plan a walk. */
  const begin = async (): Promise<void> => {
    try {
      const definition = loaded.site.grid;
      if (!definition) throw new Error('This site has no routing grids, so routes cannot be planned here.');
      status.textContent = 'Reading the ground and working out the ways from home…';
      gridFiles ??= await loadRoutingGridFiles(loaded);
      if (stopped) return;
      // The scenario's home when the site has one (pipeline/scenario.py); otherwise the site marker stands in.
      const scenarioHome = loaded.site.home;
      const home: [number, number] = homeOverride ?? (scenarioHome
        ? [scenarioHome.lonEastDeg, scenarioHome.latDeg]
        : [loaded.site.centre.lonEastDeg, loaded.site.centre.latDeg]);
      // The worker takes ownership of the arrays it is given, so it gets copies and the originals stay for a restart.
      const client = startRouteWorker({
        definition, heightM: gridFiles.heightM.slice(), slopeMaxDeg: gridFiles.slopeMaxDeg.slice(), home, slopeLimitDeg,
      });
      stopWorker = client.stop;
      const ready = await client.ready;
      if (stopped) return;
      layer.showKeepOut(ready.keepOut, definition);
      keepOutCells = ready.keepOut;
      homeAt = ready.homeCentre;
      const first = firstStart;
      firstStart = false;
      // Keep-out ground is a layer like any other in the layer panel. Its record is the slope layer's, with what
      // we did to it and the lower grade that the walking limit brings.
      const slope = loaded.layers.usable.find((record) => record.grid === 'slopeMaxDeg');
      if (first && slope && options.onOverlay) {
        const keepOut: Overlay = {
          record: {
            ...slope,
            id: 'keep-out',
            title: 'Keep-out ground',
            processing: `Cells whose steepest slope is over the suit's slope limit, ${SLOPE_LIMIT_DEG} degrees unless changed in the suit settings. The default is NASA's Artemis III requirement for walking on the Moon (Ortiz 2025), applied to Mars. Routes never cross these cells.`,
            grade: 'C',
            caveats: [
              `The ${SLOPE_LIMIT_DEG} degree default is a lunar requirement applied to Mars, and its source does not say over what distance slope is measured.`,
              'Ground that is not shaded is not proven safe: rocks, loose sand and ledges under about 3 m are not seen.',
              ...slope.caveats,
            ],
          },
          legend: { kind: 'swatches', items: [{ colour: '#e5484d', label: 'Steeper than the slope limit: do not walk here' }] },
          visible: true,
          opacity: 0.4,
          setVisible(visible) { keepOut.visible = visible; layer.setKeepOut(keepOut.visible, keepOut.opacity); },
          setOpacity(opacity) { keepOut.opacity = opacity; layer.setKeepOut(keepOut.visible, keepOut.opacity); },
        };
        options.onOverlay(keepOut);
      }
      if (ready.homeCentre) layer.showHome(ready.homeCentre);
      const homeText = homeOverride
        ? 'Home: the crew rover, moved to the spot you chose (your choice, not a sourced position). '
        : scenarioHome
          ? `Home: ${scenarioHome.name}${scenarioHome.assumed ? ' (assumed)' : ''}. ${scenarioHome.why} `
          : `Home is the site's marker, a stand-in until the team chooses where the crew's rover parks. `;
      about.textContent =
        homeText +
        `Red is keep-out ground, steeper than ${slopeLimitDeg} degrees or with no terrain data: ${(ready.keepOutShare * 100).toFixed(0)}% of this box. ` +
        `${(ready.reachableShare * 100).toFixed(0)}% of it can be walked to and back from.`;
      const targets = loaded.site.targets ?? [];
      if (first) {
        fill(parts.setup, about, moveRover, suit.element);
        if (targets.length > 0) {
          fill(parts.targets, targetList(targets, (target) => planTo([target.lonEastDeg, target.latDeg])));
          layer.showTargets(targets);
        }
      }
      const restore = first ? options.restore : undefined;
      void client.tether.then((fields) => {
        if (stopped || stopWorker !== client.stop) return;
        tetherFields = fields;
        if (restore) {
          tether.set({
            ...(restore.walkBackMin ? { walkBackLimitS: restore.walkBackMin * 60 } : {}),
            ...(restore.elapsedMin ? { elapsedS: restore.elapsedMin * 60 } : {}),
          });
        }
        if (!tether.element.isConnected) fill(parts.tether, tether.element);
        if (!storm.element.isConnected) fill(parts.storm, storm.element);
        if (!when.element.isConnected) fill(parts.when, when.element);
        showStorm();
        drawTether();
      });
      if (!ready.homeUsable) {
        status.textContent = 'Home is on keep-out ground or outside the box, so no walk can start here.';
        return;
      }
      status.textContent = targets.length > 0 ? 'Pick a science target, or click the ground.' : 'Click the ground to choose a target.';
      planTo = (position) => {
        const request = ++latest;
        lastTarget = position;
        // A storm alert belongs to the walk it was raised for.
        stormAlert = null;
        status.textContent = 'Working out the walk…';
        void client.route(position).then((answer) => {
          if (!stopped && request === latest) showAnswer(answer);
        });
      };
      if (first) {
        onClick = (event) => {
          if (placingHome) {
            // Drop-off: the rover drives here; the ways home are worked out again from the new spot.
            placingHome = false;
            moveRover.textContent = 'Move the rover: click a new spot';
            homeOverride = [event.lngLat.lng, event.lngLat.lat];
            restart();
            return;
          }
          planTo([event.lngLat.lng, event.lngLat.lat]);
        };
        map.on('click', onClick);
        map.getCanvas().style.cursor = 'crosshair';
      }
      // A shared link names a target: plan that walk straight away. Without one, the hero scenario opens on the
      // walk to the first science target, so the route and the tether are on screen at once (F7). After a change of
      // suit settings the same walk is planned again.
      if (!first && lastTarget) planTo(lastTarget);
      else if (restore?.target) planTo(restore.target);
      else if (targets[0]) planTo([targets[0].lonEastDeg, targets[0].latDeg]);
      if (import.meta.env.DEV) (window as unknown as { tetherRoute: unknown }).tetherRoute = { client, ready, showAnswer, tetherReady: client.tether };
    } catch (error) {
      if (!stopped) status.textContent = error instanceof Error ? error.message : String(error);
    }
  };
  void begin();

  return () => {
    stopped = true;
    cancelAnimationFrame(redraw);
    window.clearTimeout(urlTimer);
    stopWorker();
    if (onClick) map.off('click', onClick);
    map.getCanvas().style.cursor = '';
    walk.remove();
    layer.remove();
    card.remove();
    modes.remove();
  };
}
