// WHAT:    The messages that pass between the page and the route worker (F3).
// IN:      Nothing.
// OUT:     Types only.
// USED BY: src/route/worker.ts, src/route/client.ts, src/ui/routePanel.ts, src/map/routeLayer.ts.
// RULES:   Positions are [east-positive longitude, planetocentric latitude] in degrees.
// TRAPS:   PITFALLS 6.
// OWNER:   Role B.

import type { GridDefinition } from '../data/contract';
import type { LonLat } from '../mars/geometry';
import type { RouteStats } from './stats';

export type Request =
  | {
      type: 'init';
      definition: GridDefinition;
      heightM: ArrayBuffer;
      slopeMaxDeg: ArrayBuffer;
      home: LonLat;
      slopeLimitDeg: number;
    }
  /** A walk from home to the target and back; with `via`, through those stops in order before the target (F3). */
  | { type: 'route'; id: number; target: LonLat; via?: LonLat[] };

/** One direction of a walk: the line to draw, in walking order, and its numbers. */
export interface RouteLeg {
  line: LonLat[];
  stats: RouteStats;
}

export interface Ready {
  type: 'ready';
  rows: number;
  cols: number;
  /** 1 for each keep-out cell, north row first. */
  keepOut: Uint8Array;
  /** False when home is outside the grid or in a keep-out cell, so no route can start. */
  homeUsable: boolean;
  /** Centre of the grid cell that holds home, or null when home is outside the grid. */
  homeCentre: LonLat | null;
  /** Fraction of cells that are keep-out, and fraction that can be walked to and back from. */
  keepOutShare: number;
  reachableShare: number;
  searchMs: number;
}

/** A stop of a walk through several stops: where it is, and its index in the way out's line. The target is the last. */
export interface RouteStop {
  position: LonLat;
  lineIndex: number;
}

export type RouteAnswer =
  | { type: 'route'; id: number; ok: true; target: LonLat; out: RouteLeg; back: RouteLeg; stops?: RouteStop[] }
  | { type: 'route'; id: number; ok: false; reason: 'outside' | 'keep-out' | 'unreachable'; /** Which stop, counting from 0, when there are several. */ stop?: number };

/** Time to walk home from every cell, seconds, north row first; Infinity where there is no way home. */
export interface TetherFields {
  type: 'tether';
  /** The quickest way home in the cautious case. The tether is drawn from this. */
  cautiousS: Float32Array;
  /** The quickest way home in the expected case, for the lighter line. */
  expectedS: Float32Array;
  searchMs: number;
}

/** A failure in the worker. `id` names the route request it happened in; without it, the start (or everything) failed. */
export interface WorkerError {
  type: 'error';
  message: string;
  id?: number;
}

export type Reply = Ready | TetherFields | RouteAnswer | WorkerError;
