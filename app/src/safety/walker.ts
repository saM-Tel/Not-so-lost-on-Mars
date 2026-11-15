// WHAT:    The walk-through's rules (F19): how far the astronaut walks in a given time on the slope underfoot, where it may
//          not go, and where it is at a given time when it walks the planned route, standing at each stop for its time;
//          the quickest walkable way home from where it stands, down the tether's time-to-home field.
// IN:      The routing grid (heights, keep-out cells); a position, a bearing and a time step; route lines; stops with
//          their times.
// OUT:     New positions, what stopped a step, and a timeline of the route with cautious times: with time at stops added
//          from each stop on (for the tether), or with a pause at each stop (for playback).
// USED BY: src/ui/walkThrough.ts, src/ui/routePanel.ts.
// RULES:   The cautious walking case from src/route/cost.ts, the same model as the route card, so times agree. Keep-out
//          ground, ground with no data and the edge of the grid stop a step. Distances through src/mars/geometry.ts.
// TRAPS:   PITFALLS 3, 6, 7.
// OWNER:   Role B.

import type { GridDefinition } from '../data/contract';
import { bearingDeg, destination, distanceM, type LonLat } from '../mars/geometry';
import { speedMps, stepCost, WALK_CASES, type WalkCase } from '../route/cost';

const CAUTIOUS = WALK_CASES.find((c) => c.id === 'cautious') as WalkCase;
/** Slope underfoot is taken over this distance ahead, about one routing cell. */
const SLOPE_AHEAD_M = 4;

export interface WalkerGround {
  definition: GridDefinition;
  heightM: Float32Array;
  /** 1 for each keep-out cell, north row first; null while it is not known yet. */
  keepOut: Uint8Array | null;
}

/** The grid cell that holds a position, or -1 outside the grid. */
export function cellIndex(definition: GridDefinition, [lon, lat]: LonLat): number {
  const col = Math.floor((lon - definition.northWestCorner.lonEastDeg) / definition.cellLonDeg);
  const row = Math.floor((definition.northWestCorner.latDeg - lat) / definition.cellLatDeg);
  if (row < 0 || col < 0 || row >= definition.rows || col >= definition.cols) return -1;
  return row * definition.cols + col;
}

/** Height of the ground at a position, metres relative to the areoid, or null outside the grid or with no data. */
export function heightAt(ground: WalkerGround, position: LonLat): number | null {
  const cell = cellIndex(ground.definition, position);
  if (cell < 0) return null;
  const h = ground.heightM[cell]!;
  return Number.isFinite(h) ? h : null;
}

export type Stop = 'keep-out' | 'edge' | 'no-data';

/**
 * Walk from `position` towards `bearing` for `seconds` at the cautious speed for the slope ahead. Returns the new
 * position, or the old one with what stopped it.
 */
export function walkFreely(
  ground: WalkerGround, position: LonLat, bearing: number, seconds: number,
): { position: LonLat; stoppedBy: Stop | null; speedMps: number; slopeDeg: number } {
  const here = heightAt(ground, position);
  const ahead = destination(position, bearing, SLOPE_AHEAD_M);
  const there = heightAt(ground, ahead);
  if (here === null || there === null) {
    return { position, stoppedBy: cellIndex(ground.definition, ahead) < 0 ? 'edge' : 'no-data', speedMps: 0, slopeDeg: 0 };
  }
  const slopeDeg = (Math.atan2(there - here, SLOPE_AHEAD_M) * 180) / Math.PI;
  const speed = speedMps(slopeDeg, CAUTIOUS);
  // In steps of at most 1 m, each checked, so a long time step (a high speed-up) cannot carry the walker over a
  // keep-out cell: it stops at the last free point before it.
  const total = speed * seconds;
  const count = Math.max(1, Math.ceil(total / MAX_SUBSTEP_M));
  let at = position;
  for (let i = 1; i <= count; i++) {
    const next = destination(position, bearing, (total * i) / count);
    const cell = cellIndex(ground.definition, next);
    const stop: Stop | null = cell < 0 ? 'edge' : ground.keepOut?.[cell] ? 'keep-out' : !Number.isFinite(ground.heightM[cell]!) ? 'no-data' : null;
    if (stop) return { position: at, stoppedBy: stop, speedMps: speed, slopeDeg };
    at = next;
  }
  return { position: at, stoppedBy: null, speedMps: speed, slopeDeg };
}

/** The longest unchecked stretch in one step, metres: a quarter of a routing cell. */
const MAX_SUBSTEP_M = 1;

export interface RouteTimeline {
  points: LonLat[];
  /** Cautious time from the start to each point, seconds. */
  timesS: number[];
}

/**
 * The planned walk as one line (out, then back) with the cautious time to reach each point: each step priced by the
 * route card's own walking model, from the heights of the cells at its two ends.
 */
export function routeTimeline(ground: WalkerGround, lines: readonly LonLat[][]): RouteTimeline {
  const points: LonLat[] = [];
  for (const line of lines) {
    for (const point of line) {
      const last = points[points.length - 1];
      if (!last || last[0] !== point[0] || last[1] !== point[1]) points.push(point);
    }
  }
  const timesS = [0];
  // A point with no height (outside the grid, or no data) carries the last known height, so it adds no climb. Taking
  // it as 0 m would add a climb of about 2.4 km against heights near -2,400 m (review item S15).
  let carried = points.length > 0 ? heightAt(ground, points[0]!) : null;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]!;
    const b = points[i]!;
    const there = heightAt(ground, b) ?? carried;
    const rise = there !== null && carried !== null ? there - carried : 0;
    carried = there;
    timesS.push(timesS[i - 1]! + stepCost(distanceM(a, b), rise, CAUTIOUS).timeS);
  }
  return { points, timesS };
}

/** Where the walker is `seconds` into the timeline, facing along the route; `done` once the walk is over. */
export function alongTimeline(timeline: RouteTimeline, seconds: number): { position: LonLat; headingDeg: number; done: boolean } {
  const { points, timesS } = timeline;
  const last = points.length - 1;
  if (last < 1) return { position: points[0] ?? [0, 0], headingDeg: 0, done: true };
  if (seconds >= timesS[last]!) return { position: points[last]!, headingDeg: bearingDeg(points[last - 1]!, points[last]!), done: true };
  let low = 0;
  let high = last;
  while (high - low > 1) {
    const mid = (low + high) >> 1;
    if (timesS[mid]! <= seconds) low = mid; else high = mid;
  }
  const a = points[low]!;
  const b = points[high]!;
  const span = timesS[high]! - timesS[low]!;
  const f = span > 0 ? (Math.max(0, seconds) - timesS[low]!) / span : 0;
  return { position: [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f], headingDeg: headingInto(points, high), done: false };
}

/** The direction of travel into point `index`; while standing still at a stop, the direction the walker arrived in. */
function headingInto(points: readonly LonLat[], index: number): number {
  for (let i = index; i > 0; i--) {
    const a = points[i - 1]!;
    const b = points[i]!;
    if (a[0] !== b[0] || a[1] !== b[1]) return bearingDeg(a, b);
  }
  return 0;
}

/**
 * A timeline with time spent at stops (F3): each stop's time is added to every point from that stop on, so a stop
 * counts at the moment of leaving it, the later and stricter moment for the tether.
 */
export function withStopTimes(timeline: RouteTimeline, stops: readonly { lineIndex: number; stayS: number }[]): RouteTimeline {
  const timesS = timeline.timesS.map((t, i) => t + stops.reduce((sum, s) => sum + (i >= s.lineIndex ? s.stayS : 0), 0));
  return { points: timeline.points, timesS };
}

/** A stretch of a playback timeline spent standing at a stop. */
export interface StopPause {
  fromS: number;
  toS: number;
  /** Which stop, counted from 1 in walking order. */
  number: number;
  name: string;
}

/**
 * The timeline for playing the walk back (F19), standing still at each stop for its time (team decision of 15 Nov,
 * review item S13): the stop's point appears twice, at the moment of arriving and the moment of leaving, so the walker
 * waits there instead of walking slowly into it. The total time is the same as `withStopTimes` gives.
 */
export function withStopPauses(
  timeline: RouteTimeline, stops: readonly { lineIndex: number; stayS: number; name: string }[],
): RouteTimeline & { pauses: StopPause[] } {
  const points: LonLat[] = [];
  const timesS: number[] = [];
  const pauses: StopPause[] = [];
  let added = 0;
  timeline.points.forEach((point, i) => {
    const arrive = timeline.timesS[i]! + added;
    points.push(point);
    timesS.push(arrive);
    stops.forEach((stop, k) => {
      if (stop.lineIndex !== i || !(stop.stayS > 0)) return;
      added += stop.stayS;
      pauses.push({ fromS: arrive, toS: arrive + stop.stayS, number: k + 1, name: stop.name });
    });
    if (timeline.timesS[i]! + added > arrive) {
      points.push(point);
      timesS.push(timeline.timesS[i]! + added);
    }
  });
  return { points, timesS, pauses };
}

/**
 * The quickest walkable way home from a position (F19): down the tether's cautious time-to-home field, one cell at a
 * time to the neighbour (of eight) with the least time left, until home (the cell with no time left) is reached.
 * Keep-out cells have no way home in the field, so the way never crosses them. Returns cell centres from the
 * position's cell to home, or null outside the grid or where there is no walkable way home.
 */
export function wayHome(timeHomeS: Float32Array, definition: GridDefinition, from: LonLat): LonLat[] | null {
  const { rows, cols } = definition;
  let cell = cellIndex(definition, from);
  if (cell < 0 || !Number.isFinite(timeHomeS[cell]!)) return null;
  const centre = (i: number): LonLat => [
    definition.northWestCorner.lonEastDeg + ((i % cols) + 0.5) * definition.cellLonDeg,
    definition.northWestCorner.latDeg - (Math.floor(i / cols) + 0.5) * definition.cellLatDeg,
  ];
  const way: LonLat[] = [centre(cell)];
  for (let step = 0; step < rows * cols && timeHomeS[cell]! > 0; step++) {
    const row = Math.floor(cell / cols);
    const col = cell % cols;
    let best = cell;
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const r = row + dr;
        const c = col + dc;
        if ((dr === 0 && dc === 0) || r < 0 || c < 0 || r >= rows || c >= cols) continue;
        const next = r * cols + c;
        if (timeHomeS[next]! < timeHomeS[best]!) best = next;
      }
    }
    // A cell with no neighbour nearer home is a flat spot in the field: stop rather than loop.
    if (best === cell) break;
    cell = best;
    way.push(centre(cell));
  }
  return way;
}
