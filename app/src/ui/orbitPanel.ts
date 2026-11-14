// WHAT:    "Link and view from orbit" in the route card (F18): for the planned walk and a chosen start, when a relay orbiter
//          is in view for a link, and when an orbiter's camera could see the walker, as two summary lines and a timeline,
//          with the stretches of the route walked with no link glowing on the map while this part is open.
// IN:      The site's passes and the orbiters' roles (src/data/orbiters.ts); the walk's cautious duration and legs.
// OUT:     A page element; calls `onGaps` with the stretches to glow, or null.
// USED BY: src/ui/routePanel.ts.
// RULES:   Predicted, with the fetch time; thresholds assumed (grade D) and said so; only confirmed roles counted. Times in
//          Earth UTC and Mars local true solar time. The gap colour is not red: a gap is a risk to plan for, not danger.
// TRAPS:   PITFALLS 4, 11.
// OWNER:   Role B.

import {
  elevationAt, IMAGING_MIN_ELEVATION_DEG, LINK_MIN_ELEVATION_DEG, loadGlobeOrbiters, loadSitePasses, stretchesInGaps, walkCoverage,
  type GlobeOrbiters, type SitePasses,
} from '../data/orbiters';
import { localTrueSolarTimeHours } from '../mars/time';
import { sunAt } from '../mars/sun';
import { formatDuration } from './format';
import { formatMarsClock } from './timeSlider';
import { formatUtc } from './weatherBanner';

export interface OrbitWalk {
  minutes: number;
  legs: { line: [number, number][]; distancesM: number[]; minutes: number }[];
}

export interface OrbitPanel {
  element: HTMLElement;
  /** The planned walk, or null to clear. */
  setWalk(walk: OrbitWalk | null): void;
  /** Whether the part holding this panel is open: the map glow shows only then. */
  setOpen(open: boolean): void;
  /** Short names of the confirmed relays high enough for a link at a moment; null when there is no prediction then. */
  relaysAt(utc: Date): string[] | null;
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

const MINUTE_MS = 60_000;

export function createOrbitPanel(options: {
  dataUrl: string; siteId: string; lonEastDeg: number; latDeg: number;
  onGaps: (stretches: [number, number][][] | null) => void;
}): OrbitPanel {
  const box = el('section', 'orbit');
  const intro = el('p', 'route-card__note',
    'When an orbiter is in view to relay your link to the habitat and Earth, and when one could see you from overhead.');
  const slider = el('input');
  slider.type = 'range';
  slider.id = `orbit-start-${options.siteId}`;
  slider.min = '0';
  slider.max = String(24 * 60);
  slider.step = '15';
  slider.value = '0';
  const sliderLabel = el('label', undefined, 'Set out in ');
  sliderLabel.htmlFor = slider.id;
  const startText = el('span', 'orbit__start');
  const row = el('p', 'tether__row');
  row.append(sliderLabel, slider, startText);
  const linkLine = el('p', 'orbit__line');
  const imageLine = el('p', 'orbit__line');
  const timeline = el('div', 'orbit__timeline');
  const basis = el('details', 'route-card__basis');
  basis.append(el('summary', undefined, 'How this is worked out'));
  const basisList = el('ul');
  basis.append(basisList);
  box.append(intro, row, linkLine, imageLine, timeline, basis);

  let globe: GlobeOrbiters | null = null;
  let site: SitePasses | null = null;
  let walk: OrbitWalk | null = null;
  let open = false;
  let stretches: [number, number][][] | null = null;

  const ready = Promise.all([loadGlobeOrbiters(options.dataUrl), loadSitePasses(options.dataUrl, options.siteId)]).then(([g, s]) => {
    globe = g;
    site = s;
    basisList.replaceChildren(...[
      `Predicted, not tracked: orbit predictions from each mission's navigation team, served by JPL Horizons and saved ${g ? formatUtc(new Date(g.builtUtc)) : 'never'}. ${g?.source.caveats[1] ?? ''}`,
      `Link: counted when an orbiter that relays for surface missions is ${LINK_MIN_ELEVATION_DEG} degrees or more above the horizon. Assumed (grade D): no sourced figure was found.`,
      `Could see you: an orbiter with a camera within ${90 - IMAGING_MIN_ELEVATION_DEG} degrees of straight overhead while the Sun is up. Assumed (grade D). In view does not mean a camera is pointed at you.`,
      `Counted for links: ${g?.orbiters.filter((o) => o.relay === true).map((o) => o.short).join(', ') || 'none'}. Counted for cameras: ${g?.orbiters.filter((o) => o.camera).map((o) => `${o.short} (${o.camera})`).join(', ') || 'none'}. Shown but not counted, as their roles were not confirmed from a source: ${g?.orbiters.filter((o) => o.relay !== true).map((o) => o.short).join(', ') || 'none'}. ${g?.leftOut.map((l) => `${l.name} left out: ${l.why}`).join(' ') ?? ''}`,
      'On the map, the stretches walked with no link glow purple. Approximate: the walking time is spread along the route by distance.',
    ].map((text) => el('li', undefined, text)));
  });

  const sunUp = (utc: Date): boolean => sunAt(utc, options.lonEastDeg, options.latDeg).elevationDeg > 0;
  const when = (utc: Date): string => `${formatUtc(utc)}, ${formatMarsClock(localTrueSolarTimeHours(utc, options.lonEastDeg))} local solar time`;

  /** A bar of segments, each [first minute, minute after last] of `total`, with a class and a title. */
  const bar = (label: string, segments: { from: number; to: number; className: string; title: string }[], total: number, rowClass = ''): HTMLElement => {
    const line = el('div', `orbit-row ${rowClass}`.trim());
    const name = el('span', 'orbit-row__label', label);
    const track = el('span', 'orbit-row__bar');
    for (const s of segments) {
      const part = el('span', s.className);
      part.style.left = `${(s.from / total) * 100}%`;
      part.style.width = `${Math.max(0.6, ((s.to - s.from) / total) * 100)}%`;
      part.title = s.title;
      track.append(part);
    }
    line.append(name, track);
    return line;
  };

  const render = (): void => {
    const offsetMin = Number(slider.value);
    const start = new Date(Math.floor(Date.now() / MINUTE_MS) * MINUTE_MS + offsetMin * MINUTE_MS);
    startText.textContent = offsetMin === 0 ? ' now' : ` ${formatDuration(offsetMin * 60)}`;
    timeline.replaceChildren();
    stretches = null;
    if (!globe || !site) {
      linkLine.textContent = 'Orbiters overhead: no data for this site.';
      imageLine.textContent = '';
      options.onGaps(null);
      return;
    }
    if (!walk) {
      linkLine.textContent = 'Plan a walk to see when you would have a link.';
      imageLine.textContent = '';
      options.onGaps(null);
      return;
    }
    const total = Math.max(1, Math.ceil(walk.minutes));
    const coverage = walkCoverage(site, globe.orbiters, start, total, sunUp);
    const end = new Date(start.getTime() + total * MINUTE_MS);
    if (coverage.minutes.some((m) => !m.known)) {
      const lastEnd = new Date(Math.min(...site.orbiters.map((o) => Date.parse(o.endUtc))));
      linkLine.textContent = `No prediction for all of this walk: the saved predictions end ${formatUtc(lastEnd)}. Choose an earlier start.`;
      imageLine.textContent = '';
      options.onGaps(null);
      return;
    }
    const sum = (list: [number, number][]): number => list.reduce((n, [a, b]) => n + (b - a), 0);
    const noLink = sum(coverage.linkGaps);
    const noImage = sum(coverage.imagingGaps);
    linkLine.textContent = noLink === 0
      ? `Link: a relay is in view for the whole walk, ${formatDuration(total * 60)}.`
      : `Link: no relay in view for ${formatDuration(noLink * 60)} of this ${formatDuration(total * 60)} walk` +
        `${coverage.linkGaps.length > 1 ? `, in ${coverage.linkGaps.length} stretches` : ''}; a relay is in view for ${formatDuration((total - noLink) * 60)}.`;
    imageLine.textContent = noImage === total
      ? 'Could be seen from orbit: no camera orbiter passes high overhead in daylight during this walk.'
      : `Could be seen from orbit: for ${formatDuration((total - noImage) * 60)}, when a camera orbiter is high overhead in daylight.`;
    linkLine.classList.toggle('orbit__line--gap', noLink > 0);

    // Timeline: start and end, the two counted rows, then each orbiter above the horizon.
    const axis = el('div', 'orbit__axis');
    axis.append(el('span', undefined, when(start)), el('span', undefined, when(end)));
    const covered = (gapList: [number, number][]): { from: number; to: number }[] => {
      const result: { from: number; to: number }[] = [];
      let at = 0;
      for (const [a, b] of gapList) { if (a > at) result.push({ from: at, to: a }); at = b; }
      if (at < total) result.push({ from: at, to: total });
      return result;
    };
    timeline.append(
      axis,
      bar('Link', [
        ...coverage.linkGaps.map(([a, b]) => ({ from: a, to: b, className: 'orbit-seg orbit-seg--gap', title: `No link for ${formatDuration((b - a) * 60)}` })),
        ...covered(coverage.linkGaps).map((c) => ({ ...c, className: 'orbit-seg orbit-seg--ok', title: 'A relay is in view' })),
      ], total, 'orbit-row--summary'),
      bar('Seen', covered(coverage.imagingGaps).map((c) => ({ ...c, className: 'orbit-seg orbit-seg--ok', title: 'A camera orbiter is high overhead in daylight' })),
        total, 'orbit-row--summary'),
    );
    for (const orbiter of globe.orbiters) {
      const segments: { from: number; to: number; className: string; title: string }[] = [];
      let from = -1;
      let peak = 0;
      coverage.minutes.forEach((minute, i) => {
        const up = minute.up.find((u) => u.id === orbiter.id);
        if (up && from < 0) { from = i; peak = 0; }
        if (up) peak = Math.max(peak, up.elevationDeg);
        if ((!up || i === total - 1) && from >= 0) {
          const to = up ? i + 1 : i;
          segments.push({ from, to, className: `orbit-seg orbit-seg--pass${orbiter.relay === true || orbiter.camera ? '' : ' orbit-seg--unconfirmed'}`,
            title: `${orbiter.name}: above the horizon for ${formatDuration((to - from) * 60)}, up to ${peak} degrees` });
          from = -1;
        }
      });
      const label = orbiter.relay === true || orbiter.camera ? orbiter.short : `${orbiter.short}*`;
      timeline.append(bar(label, segments, total));
    }
    if (globe.orbiters.some((o) => o.relay !== true && !o.camera)) {
      timeline.append(el('p', 'route-card__note', '* Shown, not counted: role not confirmed from a source.'));
    }
    stretches = stretchesInGaps(walk.legs, coverage.linkGaps);
    options.onGaps(open ? stretches : null);
  };

  slider.addEventListener('input', render);
  void ready.then(render);

  return {
    element: box,
    setWalk(next) {
      walk = next;
      void ready.then(render);
    },
    setOpen(next) {
      open = next;
      options.onGaps(open ? stretches : null);
    },
    relaysAt(utc) {
      if (!globe || !site) return null;
      const names: string[] = [];
      for (const orbiter of site.orbiters) {
        const elevation = elevationAt(orbiter, utc);
        if (elevation === null) return null;
        const track = globe.orbiters.find((o) => o.id === orbiter.id);
        if (track?.relay === true && elevation >= LINK_MIN_ELEVATION_DEG) names.push(track.short);
      }
      return names;
    },
  };
}
