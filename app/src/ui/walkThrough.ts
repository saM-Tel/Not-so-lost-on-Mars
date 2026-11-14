// WHAT:    The walk-through in the route card (F19): put a to-scale astronaut at home, steer it with the arrow keys or
//          W, A, S, D, or let it walk the planned route at a chosen speed-up, with the camera following and a readout of
//          time gone, walk home from here, tether margin, relay in view and the Sun. The tether shrinks as time goes.
// IN:      The map; the site's ground, tether field, home, planned route and relay predictions, through `WalkWorld`.
// OUT:     A page element; the astronaut on the map (src/map/astronaut.ts); the tether's time since leaving home.
// USED BY: src/ui/routePanel.ts.
// RULES:   A demonstration of the tether, not a game: no score, no levels. Cautious values only, as in the field views.
//          Time counts while the astronaut walks. Arrow keys belong to the walk-through only while steering.
// TRAPS:   PITFALLS 3, 7.
// OWNER:   Role B.

import type { Map as MapLibreMap } from 'maplibre-gl';
import { addAstronaut, type Astronaut } from '../map/astronaut';
import type { LonLat } from '../mars/geometry';
import { sunAt } from '../mars/sun';
import { alongTimeline, cellIndex, routeTimeline, walkFreely, type RouteTimeline, type WalkerGround } from '../safety/walker';
import { formatDuration } from './format';

export interface WalkWorld {
  ground(): WalkerGround | null;
  /** Cautious time to walk home from each grid cell, seconds; null until the tether is worked out. */
  timeHomeS(): Float32Array | null;
  home(): LonLat | null;
  route(): { out: LonLat[]; back: LonLat[] } | null;
  /** The longest walk home allowed at a time since leaving home. */
  allowedS(elapsedS: number): number;
  /** Move the tether's "time since leaving home" to this, so the boundary on the map shrinks with the walk. */
  setElapsed(elapsedS: number): void;
  relaysAt(utc: Date): string[] | null;
  site: LonLat;
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

const KEYS: Record<string, number> = {
  ArrowUp: 0, KeyW: 0, ArrowRight: 90, KeyD: 90, ArrowDown: 180, KeyS: 180, ArrowLeft: 270, KeyA: 270,
};
const STOPS = {
  'keep-out': 'Keep-out ground ahead: too steep for the suit, or no terrain data. Go round it.',
  edge: 'The edge of the mapped ground. There is no terrain data beyond it.',
  'no-data': 'No terrain data ahead.',
} as const;

export function createWalkThrough(map: MapLibreMap, world: WalkWorld): { element: HTMLElement; remove(): void } {
  const box = el('section', 'walk');
  box.append(el('p', 'route-card__note',
    'A to-scale astronaut, 1.8 m tall, on the 3D ground. It walks at the cautious speed for the slope underfoot and cannot enter keep-out ground. As time goes, the tether on the map shrinks.'));
  const place = el('button', 'route-card__target', 'Put the astronaut at home');
  const play = el('button', 'route-card__target', 'Walk the planned route');
  const stop = el('button', 'route-card__target', 'Stop');
  for (const b of [place, play, stop]) b.type = 'button';
  const speed = el('select');
  speed.setAttribute('aria-label', 'Speed of the walk-through');
  for (const [value, label] of [[1, 'Real time'], [10, '10 times faster'], [60, '60 times faster'], [300, '300 times faster']] as const) {
    const option = el('option', undefined, label);
    option.value = String(value);
    speed.append(option);
  }
  speed.value = '60';
  const buttons = el('div', 'walk__buttons');
  buttons.append(place, play, stop, speed);
  const hint = el('p', 'route-card__note', 'Steer with the arrow keys or W, A, S, D (directions on the screen). Esc stops. Time counts while the astronaut walks.');
  const readout = el('dl', 'walk__readout');
  const status = el('p', 'walk__status');
  status.setAttribute('role', 'status');
  box.append(buttons, hint, readout, status);

  let astronaut: Astronaut | null = null;
  let position: LonLat | null = null;
  let heading = 0;
  let elapsedS = 0;
  let lastSetS = -Infinity;
  let mode: 'idle' | 'steer' | 'route' = 'idle';
  let timeline: RouteTimeline | null = null;
  let startedUtc = Date.now();
  let frame = 0;
  let last = 0;
  const held = new Set<string>();

  /** One readout line. Danger (red) is kept for being outside the tether or cut off from home, as in the field views. */
  const line = (term: string, value: string, level: 'ok' | 'caution' | 'danger' = 'ok'): void => {
    readout.append(el('dt', undefined, term), el('dd', level === 'ok' ? undefined : `walk__${level}`, value));
  };

  const showReadout = (): void => {
    readout.replaceChildren();
    if (!position) return;
    const ground = world.ground();
    const field = world.timeHomeS();
    line('Time gone', formatDuration(elapsedS));
    const cell = ground ? cellIndex(ground.definition, position) : -1;
    const home = field && cell >= 0 ? field[cell]! : null;
    if (home === null) {
      line('Walk home from here', 'no data yet');
    } else if (!Number.isFinite(home)) {
      line('Walk home from here', 'no walkable way home from this spot', 'danger');
    } else {
      const margin = world.allowedS(elapsedS) - home;
      line('Walk home from here', `${formatDuration(home)} (cautious)`);
      line('Tether margin', margin >= 0 ? formatDuration(margin) : `outside the tether by ${formatDuration(-margin)}: head home`, margin < 0 ? 'danger' : 'ok');
    }
    const now = new Date(startedUtc + elapsedS * 1000);
    const relays = world.relaysAt(now);
    line('Relay in view', relays === null ? 'no prediction for this time' : relays.length > 0 ? relays.join(', ') : 'none: no link', relays !== null && relays.length === 0 ? 'caution' : 'ok');
    const sun = sunAt(now, world.site[0], world.site[1]);
    line('Sun', sun.elevationDeg > 0 ? `${sun.elevationDeg.toFixed(0)}° up` : 'down: it is night', sun.elevationDeg <= 0 ? 'caution' : 'ok');
  };

  /** Keep the tether's time since leaving home in step, a minute at a time (its slider moves in 5-minute steps). */
  const syncTether = (force = false): void => {
    if (force || Math.abs(elapsedS - lastSetS) >= 60) {
      world.setElapsed(elapsedS);
      lastSetS = elapsedS;
    }
  };

  const tick = (now: number): void => {
    const dt = Math.min(0.1, (now - last) / 1000) * Number(speed.value);
    last = now;
    if (!position) return;
    if (mode === 'route' && timeline) {
      const at = alongTimeline(timeline, elapsedS + dt);
      elapsedS += dt;
      position = at.position;
      heading = at.headingDeg;
      if (at.done) {
        elapsedS = timeline.timesS[timeline.timesS.length - 1]!;
        status.textContent = `Back home after ${formatDuration(elapsedS)} of walking (cautious).`;
        mode = 'idle';
      }
      map.jumpTo({ center: position });
    } else if (mode === 'steer' && held.size > 0) {
      const ground = world.ground();
      if (ground) {
        let x = 0;
        let y = 0;
        for (const code of held) { const a = (KEYS[code]! * Math.PI) / 180; x += Math.sin(a); y += Math.cos(a); }
        if (x !== 0 || y !== 0) {
          const bearing = (map.getBearing() + (Math.atan2(x, y) * 180) / Math.PI + 360) % 360;
          const step = walkFreely(ground, position, bearing, dt);
          heading = bearing;
          if (step.stoppedBy) {
            status.textContent = STOPS[step.stoppedBy];
          } else {
            status.textContent = '';
            position = step.position;
            elapsedS += dt;
            map.jumpTo({ center: position });
          }
        }
      }
    }
    astronaut?.move(position, heading);
    syncTether(mode === 'idle');
    showReadout();
    if (mode !== 'idle') frame = requestAnimationFrame(tick);
  };

  const run = (): void => {
    cancelAnimationFrame(frame);
    last = performance.now();
    frame = requestAnimationFrame(tick);
  };

  const putAt = (where: LonLat, zoom: number, pitch: number): void => {
    position = where;
    elapsedS = 0;
    startedUtc = Date.now();
    syncTether(true);
    if (astronaut) astronaut.move(where, heading); else astronaut = addAstronaut(map, where, heading);
    map.easeTo({ center: where, zoom: Math.max(map.getZoom(), zoom), pitch, duration: 1200 });
  };

  const onKey = (event: KeyboardEvent): void => {
    const target = event.target as HTMLElement | null;
    if (target && ['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName)) return;
    if (event.code === 'Escape' && event.type === 'keydown') { halt(); return; }
    if (!(event.code in KEYS)) return;
    if (mode === 'route') mode = 'steer';
    if (mode !== 'steer') return;
    event.preventDefault();
    if (event.type === 'keydown') { held.add(event.code); if (held.size === 1) run(); } else held.delete(event.code);
  };

  const listen = (on: boolean): void => {
    if (on) {
      window.addEventListener('keydown', onKey);
      window.addEventListener('keyup', onKey);
      map.keyboard.disable();
    } else {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKey);
      map.keyboard.enable();
      held.clear();
    }
  };

  const halt = (): void => {
    mode = 'idle';
    cancelAnimationFrame(frame);
    listen(false);
    syncTether(true);
    showReadout();
  };

  place.addEventListener('click', () => {
    const home = world.home();
    if (!home || !world.ground()) { status.textContent = 'The ground is still being read; try again in a moment.'; return; }
    heading = 0;
    putAt(home, 19.5, 60);
    mode = 'steer';
    listen(true);
    status.textContent = 'At home. Steer with the arrow keys or W, A, S, D.';
    showReadout();
  });

  play.addEventListener('click', () => {
    const route = world.route();
    const ground = world.ground();
    if (!route || !ground) { status.textContent = 'Plan a walk first: pick a target on the map or in Science targets.'; return; }
    timeline = routeTimeline(ground, [route.out, route.back]);
    heading = alongTimeline(timeline, 0).headingDeg;
    putAt(timeline.points[0]!, 18.5, 55);
    mode = 'route';
    listen(true);
    status.textContent = `Walking the planned route: ${formatDuration(timeline.timesS[timeline.timesS.length - 1]!)} in the cautious case.`;
    run();
  });

  stop.addEventListener('click', halt);

  return {
    element: box,
    remove() {
      halt();
      astronaut?.remove();
      astronaut = null;
    },
  };
}
