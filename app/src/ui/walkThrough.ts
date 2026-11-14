// WHAT:    The walk-through in the route card (F19): put a to-scale astronaut at home, steer it with the arrow keys or
//          W, A, S, D, or let it walk the planned route at a chosen speed-up, with the camera following and a readout of
//          time gone, walk home from here, tether margin, relay in view and the Sun. The tether shrinks as time goes.
//          First person: a deliberately low-resolution view from the astronaut's eyes, 1.7 m above the 3D ground, under
//          a helmet visor (src/ui/visor.ts) labelled as simulated, with the speed-up shown.
// IN:      The map; the site's ground, tether field, home, planned route and relay predictions, through `WalkWorld`.
// OUT:     A page element; the astronaut on the map (src/map/astronaut.ts); the tether's time since leaving home.
// USED BY: src/ui/routePanel.ts.
// RULES:   A demonstration of the tether, not a game: no score, no levels. Cautious values only, as in the field views.
//          Time counts while the astronaut walks. Arrow keys belong to the walk-through only while steering. Every
//          map setting changed for first person (pitch and zoom limits, drawing density, sky) is put back on leaving.
// TRAPS:   PITFALLS 3, 7, 10.
// OWNER:   Role B.

import { LngLat, type Map as MapLibreMap, type SkySpecification } from 'maplibre-gl';
import { addAstronaut, type Astronaut } from '../map/astronaut';
import { MAPLIBRE_METRES_PER_MARS_METRE } from '../mars/constants';
import { bearingDeg, destination, distanceM, type LonLat } from '../mars/geometry';
import { sunAt } from '../mars/sun';
import { localTrueSolarTimeHours } from '../mars/time';
import { alongTimeline, cellIndex, routeTimeline, walkFreely, type RouteTimeline, type WalkerGround } from '../safety/walker';
import { formatDuration } from './format';
import { createVisor, type Visor, type VisorSnapshot } from './visor';

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

/** Map view: each key walks in a direction on the screen. */
const SCREEN_KEYS: Record<string, number> = {
  ArrowUp: 0, KeyW: 0, ArrowRight: 90, KeyD: 90, ArrowDown: 180, KeyS: 180, ArrowLeft: 270, KeyA: 270,
};
/** First person: forward and back along the heading; left and right turn. */
const FORWARD = new Set(['ArrowUp', 'KeyW']);
const BACK = new Set(['ArrowDown', 'KeyS']);
const TURN_LEFT = new Set(['ArrowLeft', 'KeyA']);
const TURN_RIGHT = new Set(['ArrowRight', 'KeyD']);
/** Turning speed in first person, degrees per real second (not sped up, so it stays controllable). */
const TURN_DEG_PER_S = 60;
/** Eye height above the ground, metres; the figure is 1.8 m tall. */
const EYE_M = 1.7;
/** First person looks at the ground this far ahead, metres. */
const LOOK_AHEAD_M = 25;
/** Drawing density in first person: well under one map pixel per screen pixel, for a deliberately coarse view. */
const FIRST_PERSON_PIXEL_RATIO = 0.4;
/** Illustrative butterscotch sky for first person; the globe style has no sky of its own. */
const FIRST_PERSON_SKY: SkySpecification = {
  'sky-color': '#b48a63', 'horizon-color': '#d8b48c', 'fog-color': '#c9a27a',
  'sky-horizon-blend': 0.6, 'horizon-fog-blend': 0.7, 'fog-ground-blend': 0.75, 'atmosphere-blend': 0,
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
  const eyes = el('button', 'route-card__target', 'First person');
  const stop = el('button', 'route-card__target', 'Stop');
  for (const b of [place, play, eyes, stop]) b.type = 'button';
  const speed = el('select');
  speed.setAttribute('aria-label', 'Speed of the walk-through');
  for (const [value, label] of [[1, 'Real time'], [10, '10 times faster'], [60, '60 times faster'], [300, '300 times faster']] as const) {
    const option = el('option', undefined, label);
    option.value = String(value);
    speed.append(option);
  }
  speed.value = '60';
  const buttons = el('div', 'walk__buttons');
  buttons.append(place, play, eyes, stop, speed);
  const hint = el('p', 'route-card__note',
    'Map view: the arrow keys or W, A, S, D walk in that direction on the screen. First person: up and down walk forward and back, left and right turn. Esc stops. Time counts while the astronaut walks; choose Real time to see it is to scale.');
  const readout = el('dl', 'walk__readout');
  const status = el('p', 'walk__status');
  status.setAttribute('role', 'status');
  box.append(buttons, hint, readout, status);

  let astronaut: Astronaut | null = null;
  let position: LonLat | null = null;
  let heading = 0;
  let elapsedS = 0;
  let walkedM = 0;
  let lastSpeed = 0;
  let lastSlope = 0;
  let lastSetS = -Infinity;
  let mode: 'idle' | 'steer' | 'route' = 'idle';
  let timeline: RouteTimeline | null = null;
  let startedUtc = Date.now();
  let frame = 0;
  let last = 0;
  let firstPerson = false;
  let visor: Visor | null = null;
  let saved: { maxPitch: number; maxZoom: number; sky: SkySpecification | undefined } | null = null;
  const held = new Set<string>();

  /** Everything the readout and the visor show, worked out once a frame. */
  const snapshot = (): VisorSnapshot | null => {
    if (!position) return null;
    const ground = world.ground();
    const field = world.timeHomeS();
    const cell = ground ? cellIndex(ground.definition, position) : -1;
    const timeHomeS = field && cell >= 0 ? field[cell]! : null;
    const home = world.home();
    const utc = new Date(startedUtc + elapsedS * 1000);
    return {
      headingDeg: heading,
      homeBearingDeg: home ? bearingDeg(position, home) : null,
      homeDistanceM: home ? distanceM(position, home) : 0,
      timeHomeS,
      allowedS: world.allowedS(elapsedS),
      elapsedS,
      utc,
      localSolarHours: localTrueSolarTimeHours(utc, world.site[0]),
      speedUp: Number(speed.value),
      speedMps: lastSpeed,
      slopeDeg: lastSlope,
      walkedM,
      relays: world.relaysAt(utc),
      sunElevationDeg: sunAt(utc, world.site[0], world.site[1]).elevationDeg,
      message: status.textContent ?? '',
    };
  };

  /** One readout line. Danger (red) is kept for being outside the tether or cut off from home, as in the field views. */
  const line = (term: string, value: string, level: 'ok' | 'caution' | 'danger' = 'ok'): void => {
    readout.append(el('dt', undefined, term), el('dd', level === 'ok' ? undefined : `walk__${level}`, value));
  };

  const showReadout = (s: VisorSnapshot | null): void => {
    readout.replaceChildren();
    if (!s) return;
    line('Time gone', formatDuration(s.elapsedS));
    if (s.timeHomeS === null) {
      line('Walk home from here', 'no data yet');
    } else if (!Number.isFinite(s.timeHomeS)) {
      line('Walk home from here', 'no walkable way home from this spot', 'danger');
    } else {
      const margin = s.allowedS - s.timeHomeS;
      line('Walk home from here', `${formatDuration(s.timeHomeS)} (cautious)`);
      line('Tether margin', margin >= 0 ? formatDuration(margin) : `outside the tether by ${formatDuration(-margin)}: head home`, margin < 0 ? 'danger' : 'ok');
    }
    line('Relay in view', s.relays === null ? 'no prediction for this time' : s.relays.length > 0 ? s.relays.join(', ') : 'none: no link',
      s.relays !== null && s.relays.length === 0 ? 'caution' : 'ok');
    line('Sun', s.sunElevationDeg > 0 ? `${s.sunElevationDeg.toFixed(0)}° up` : 'down: it is night', s.sunElevationDeg <= 0 ? 'caution' : 'ok');
  };

  /** Keep the tether's time since leaving home in step, a minute at a time (its slider moves in 5-minute steps). */
  const syncTether = (force = false): void => {
    if (force || Math.abs(elapsedS - lastSetS) >= 60) {
      world.setElapsed(elapsedS);
      lastSetS = elapsedS;
    }
  };

  /** First person: the camera at eye height over the 3D ground, looking at the ground ahead along the heading. */
  const placeCamera = (): void => {
    if (!position) return;
    const k = MAPLIBRE_METRES_PER_MARS_METRE;
    const ground = map.queryTerrainElevation(position) ?? 0;
    const ahead = destination(position, heading, LOOK_AHEAD_M);
    const groundAhead = map.queryTerrainElevation(ahead) ?? ground;
    map.jumpTo(map.calculateCameraOptionsFromTo(
      new LngLat(position[0], position[1]), ground + EYE_M * k, new LngLat(ahead[0], ahead[1]), groundAhead + 0.4 * k,
    ));
  };

  /** Walk for `dt` simulated seconds towards `bearing`; returns false when something stops the step. */
  const stepTowards = (bearing: number, dt: number): boolean => {
    const ground = world.ground();
    if (!ground || !position) return false;
    const step = walkFreely(ground, position, bearing, dt);
    lastSpeed = step.speedMps;
    lastSlope = step.slopeDeg;
    if (step.stoppedBy) { status.textContent = STOPS[step.stoppedBy]; return false; }
    status.textContent = '';
    walkedM += distanceM(position, step.position);
    position = step.position;
    elapsedS += dt;
    return true;
  };

  const tick = (now: number): void => {
    const realDt = Math.min(0.1, (now - last) / 1000);
    const dt = realDt * Number(speed.value);
    last = now;
    if (!position) return;
    if (mode === 'route' && timeline) {
      const before = position;
      const at = alongTimeline(timeline, elapsedS + dt);
      elapsedS += dt;
      position = at.position;
      heading = at.headingDeg;
      walkedM += distanceM(before, position);
      lastSpeed = dt > 0 ? distanceM(before, position) / dt : 0;
      if (at.done) {
        elapsedS = timeline.timesS[timeline.timesS.length - 1]!;
        status.textContent = `Back home after ${formatDuration(elapsedS)} of walking (cautious).`;
        mode = 'steer';
      }
    } else if (mode === 'steer' && held.size > 0) {
      if (firstPerson) {
        const turn = [...held].reduce((n, code) => n + (TURN_RIGHT.has(code) ? 1 : TURN_LEFT.has(code) ? -1 : 0), 0);
        heading = (heading + turn * TURN_DEG_PER_S * realDt + 360) % 360;
        const forward = [...held].reduce((n, code) => n + (FORWARD.has(code) ? 1 : BACK.has(code) ? -1 : 0), 0);
        if (forward !== 0) stepTowards(forward > 0 ? heading : (heading + 180) % 360, dt);
      } else {
        let x = 0;
        let y = 0;
        for (const code of held) { const a = ((SCREEN_KEYS[code] ?? 0) * Math.PI) / 180; x += Math.sin(a); y += Math.cos(a); }
        if (x !== 0 || y !== 0) {
          heading = (map.getBearing() + (Math.atan2(x, y) * 180) / Math.PI + 360) % 360;
          stepTowards(heading, dt);
        }
      }
    } else {
      lastSpeed = 0;
    }
    astronaut?.move(position, heading);
    if (firstPerson) placeCamera(); else if (mode !== 'idle' && (held.size > 0 || mode === 'route')) map.jumpTo({ center: position });
    syncTether(mode === 'idle');
    const s = snapshot();
    showReadout(s);
    if (s) visor?.update(s);
    if (mode !== 'idle' || firstPerson) frame = requestAnimationFrame(tick);
  };

  const run = (): void => {
    cancelAnimationFrame(frame);
    last = performance.now();
    frame = requestAnimationFrame(tick);
  };

  const putAt = (where: LonLat, zoom: number, pitch: number): void => {
    position = where;
    elapsedS = 0;
    walkedM = 0;
    startedUtc = Date.now();
    syncTether(true);
    if (astronaut) astronaut.move(where, heading); else astronaut = addAstronaut(map, where, heading);
    astronaut.setVisible(!firstPerson);
    if (!firstPerson) map.easeTo({ center: where, zoom: Math.max(map.getZoom(), zoom), pitch, duration: 1200 });
  };

  const onKey = (event: KeyboardEvent): void => {
    const target = event.target as HTMLElement | null;
    if (target && ['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName)) return;
    if (event.code === 'Escape' && event.type === 'keydown') { if (firstPerson) leaveFirstPerson(); else halt(); return; }
    if (!(event.code in SCREEN_KEYS)) return;
    if (mode === 'route') mode = 'steer';
    if (mode !== 'steer') return;
    event.preventDefault();
    if (event.type === 'keydown') { held.add(event.code); if (!firstPerson && held.size === 1) run(); } else held.delete(event.code);
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
    if (firstPerson) leaveFirstPerson();
    mode = 'idle';
    cancelAnimationFrame(frame);
    listen(false);
    syncTether(true);
    showReadout(snapshot());
  };

  const enterFirstPerson = (): void => {
    if (firstPerson) return;
    if (!position) {
      const home = world.home();
      if (!home || !world.ground()) { status.textContent = 'The ground is still being read; try again in a moment.'; return; }
      putAt(home, 19.5, 60);
    }
    firstPerson = true;
    saved = { maxPitch: map.getMaxPitch(), maxZoom: map.getMaxZoom(), sky: map.getSky() };
    map.setMaxPitch(89);
    map.setMaxZoom(24);
    map.setPixelRatio(FIRST_PERSON_PIXEL_RATIO);
    map.setSky(FIRST_PERSON_SKY);
    astronaut?.setVisible(false);
    visor = createVisor(leaveFirstPerson);
    map.getContainer().append(visor.element);
    document.body.classList.add('walk-first-person');
    requestAnimationFrame(() => map.resize());
    eyes.textContent = 'Back to the map view';
    if (mode === 'idle') mode = 'steer';
    listen(true);
    run();
  };

  function leaveFirstPerson(): void {
    if (!firstPerson) return;
    firstPerson = false;
    visor?.element.remove();
    visor = null;
    document.body.classList.remove('walk-first-person');
    if (saved) {
      map.setMaxPitch(saved.maxPitch);
      map.setMaxZoom(saved.maxZoom);
      map.setSky(saved.sky ?? { 'atmosphere-blend': 0 });
    }
    map.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    astronaut?.setVisible(true);
    eyes.textContent = 'First person';
    requestAnimationFrame(() => {
      map.resize();
      if (position) map.easeTo({ center: position, zoom: 19.5, pitch: 60, duration: 800 });
    });
  }

  place.addEventListener('click', () => {
    const home = world.home();
    if (!home || !world.ground()) { status.textContent = 'The ground is still being read; try again in a moment.'; return; }
    heading = 0;
    putAt(home, 19.5, 60);
    mode = 'steer';
    listen(true);
    status.textContent = 'At home. Steer with the arrow keys or W, A, S, D.';
    if (firstPerson) run(); else showReadout(snapshot());
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

  eyes.addEventListener('click', () => (firstPerson ? leaveFirstPerson() : enterFirstPerson()));
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
