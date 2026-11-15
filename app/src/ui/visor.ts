// WHAT:    The helmet visor over the walk-through's first-person view (F19, F13 concept): heading, an arrow and distance
//          home, the walk home, the tether margin as a bar, a start-back countdown, time gone, the clock, relay, Sun,
//          speed and slope, and a plain "simulated" label with the speed-up, so the view is never taken for real.
// IN:      A snapshot of the walk-through each frame.
// OUT:     A page element over the map.
// USED BY: src/ui/walkThrough.ts.
// RULES:   Cautious values only. Red only for danger: outside the tether, or no way home. The arrow points home in the
//          simulation, whose heading is known; it is not drawn over a photograph. Labelled as a concept and simulated.
// TRAPS:   PITFALLS 7, 11.
// OWNER:   Role B.

import { formatDistance, formatDuration } from './format';
import { formatMarsClock } from './timeSlider';

export interface VisorSnapshot {
  headingDeg: number;
  /** Whether home is known; when it is not, the visor says so rather than "At home". */
  homeKnown: boolean;
  /** Bearing from the astronaut to home, degrees from north; null when at home. */
  homeBearingDeg: number | null;
  /** Bearing along the quickest walkable way home, a few metres ahead; null when it is not known. */
  wayHomeBearingDeg: number | null;
  homeDistanceM: number;
  /** Cautious walk home from here, seconds: null before the tether is worked out, Infinity when cut off. */
  timeHomeS: number | null;
  allowedS: number;
  elapsedS: number;
  utc: Date;
  localSolarHours: number;
  speedUp: number;
  speedMps: number;
  slopeDeg: number;
  walkedM: number;
  relays: string[] | null;
  sunElevationDeg: number;
  message: string;
}

export interface Visor {
  element: HTMLElement;
  update(snapshot: VisorSnapshot): void;
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

const COMPASS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

export function createVisor(onLeave: () => void): Visor {
  const visor = el('div', 'visor');
  visor.setAttribute('aria-label', 'Helmet display, simulated');
  const top = el('div', 'visor__top');
  const heading = el('span', 'visor__heading');
  const badge = el('span', 'visor__badge');
  top.append(heading, badge);

  const left = el('div', 'visor__panel visor__panel--left');
  const homeArrow = el('div', 'visor__arrow');
  homeArrow.textContent = '↑';
  const homeText = el('p', 'visor__big');
  const homeSub = el('p', 'visor__small');
  const homeLabel = el('p', 'visor__label', 'Home');
  left.append(homeLabel, homeArrow, homeText, homeSub);

  const right = el('div', 'visor__panel visor__panel--right');
  const marginLabel = el('p', 'visor__label', 'Tether margin');
  const marginBar = el('div', 'visor__bar');
  const marginFill = el('div', 'visor__bar-fill');
  marginBar.append(marginFill);
  const marginText = el('p', 'visor__big');
  const turnBack = el('p', 'visor__small');
  right.append(marginLabel, marginBar, marginText, turnBack);

  const bottom = el('div', 'visor__bottom');
  const clock = el('p', 'visor__clock');
  const stats = el('p', 'visor__small');
  const status = el('p', 'visor__alert');
  status.setAttribute('role', 'status');
  bottom.append(clock, stats, status);

  const leave = el('button', 'visor__leave', 'Leave first person');
  leave.type = 'button';
  leave.addEventListener('click', onLeave);
  const note = el('p', 'visor__note',
    'Concept of a helmet display, simulated from orbital terrain: not a real view. Ground beyond the mapped area is flat; the sky colour is for illustration. The arrow and the blue line follow the quickest walkable way home. Cautious values.');
  visor.append(top, left, right, bottom, leave, note);

  return {
    element: visor,
    update(s) {
      // Rounded first, so 359.6 degrees reads N 000, not N 360.
      const degrees = Math.round(s.headingDeg) % 360;
      heading.textContent = `${COMPASS[Math.round(degrees / 45) % 8]} ${String(degrees).padStart(3, '0')}°`;
      badge.textContent = s.speedUp === 1 ? 'SIMULATED · real time' : `SIMULATED · ${s.speedUp}× real time`;

      if (!s.homeKnown) {
        homeArrow.style.transform = 'none';
        homeArrow.textContent = '?';
        homeText.textContent = 'Home not known';
      } else if (s.homeBearingDeg === null || s.homeDistanceM < 2) {
        homeArrow.style.transform = 'none';
        homeArrow.textContent = '⌂';
        homeText.textContent = 'At home';
      } else {
        // The arrow follows the walkable way home, drawn on the ground in blue; a straight line could cross keep-out.
        const bearing = s.wayHomeBearingDeg ?? s.homeBearingDeg;
        homeArrow.textContent = '↑';
        homeArrow.style.transform = `rotate(${(bearing - s.headingDeg + 360) % 360}deg)`;
        homeText.textContent = `${formatDistance(s.homeDistanceM)} away`;
      }
      const cutOff = s.timeHomeS !== null && !Number.isFinite(s.timeHomeS);
      homeLabel.textContent = s.wayHomeBearingDeg !== null ? 'Way home' : 'Home';
      homeSub.textContent = s.timeHomeS === null ? 'walk home: no data yet' : cutOff ? 'no walkable way home'
        : `walk home ${formatDuration(s.timeHomeS)}${s.wayHomeBearingDeg !== null ? ' along the blue line' : ''}`;
      homeSub.classList.toggle('visor__danger', cutOff);

      if (s.timeHomeS === null || cutOff) {
        marginFill.style.width = '0%';
        marginText.textContent = cutOff ? 'cut off' : 'no data';
        turnBack.textContent = '';
      } else {
        const margin = s.allowedS - s.timeHomeS;
        marginFill.style.width = `${(Math.max(0, Math.min(1, s.allowedS > 0 ? margin / s.allowedS : 0)) * 100).toFixed(0)}%`;
        marginFill.classList.toggle('visor__bar-fill--danger', margin < 0);
        marginText.textContent = margin >= 0 ? formatDuration(margin) : `outside by ${formatDuration(-margin)}`;
        marginText.classList.toggle('visor__danger', margin < 0);
        turnBack.textContent = margin >= 0 ? `start back within ${formatDuration(margin)}` : 'head home now';
      }

      const utc = s.utc.toISOString().slice(11, 19);
      clock.textContent = `${formatMarsClock(s.localSolarHours)} local solar time · ${utc} UTC · time gone ${formatDuration(s.elapsedS)}`;
      const link = s.relays === null ? 'link: no prediction' : s.relays.length > 0 ? `link: ${s.relays.join(', ')}` : 'no link';
      const sun = s.sunElevationDeg > 0 ? `Sun ${s.sunElevationDeg.toFixed(0)}° up` : 'Sun down';
      stats.textContent = `${s.speedMps.toFixed(2)} m/s on ${s.slopeDeg >= 0 ? '+' : ''}${s.slopeDeg.toFixed(0)}° · walked ${formatDistance(s.walkedM)} · ${link} · ${sun} · eye height 1.7 m`;
      // Written only when it changes: it is read out by screen readers.
      if (status.textContent !== s.message) status.textContent = s.message;
    },
  };
}
