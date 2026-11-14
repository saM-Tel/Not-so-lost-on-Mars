// WHAT:    The walk-through's rules (F19): how far the astronaut walks in a given time on the slope underfoot, where it may
//          not go, and where it is at a given time when it walks the planned route.
// IN:      The routing grid (heights, keep-out cells); a position, a bearing and a time step; route lines.
// OUT:     New positions, what stopped a step, and a timeline of the route with cautious times.
// USED BY: src/ui/walkThrough.ts.
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
): { position: LonLat; stoppedBy: Stop | null; speedMps: number } {
  const here = heightAt(ground, position);
  const ahead = destination(position, bearing, SLOPE_AHEAD_M);
  const there = heightAt(ground, ahead);
  if (here === null || there === null) {
    return { position, stoppedBy: cellIndex(ground.definition, ahead) < 0 ? 'edge' : 'no-data', speedMps: 0 };
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
    if (stop) return { position: at, stoppedBy: stop, speedMps: speed };
    at = next;
  }
  return { position: at, stoppedBy: null, speedMps: speed };
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
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]!;
    const b = points[i]!;
    const rise = (heightAt(ground, b) ?? 0) - (heightAt(ground, a) ?? 0);
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
  return { position: [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f], headingDeg: bearingDeg(a, b), done: false };
}
