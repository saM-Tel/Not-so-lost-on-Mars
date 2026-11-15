// WHAT:    Tests for src/safety/walker.ts: walking speed on the flat, keep-out and the grid edge stopping a step, and the
//          route timeline agreeing with the walking model, a missing height adding no climb, and playback standing still
//          at stops.
// IN:      Nothing. The grid below is a made-up test fixture.
// OUT:     Pass or fail.
// USED BY: npm test.
// RULES:   Fixtures are named as such and stay in this file.
// TRAPS:   PITFALLS 3, 6.
// OWNER:   Role B.

import { describe, expect, it } from 'vitest';
import type { GridDefinition } from '../data/contract';
import { distanceM, type LonLat } from '../mars/geometry';
import { speedMps, stepCost, WALK_CASES } from '../route/cost';
import { alongTimeline, cellIndex, routeTimeline, walkFreely, withStopPauses, withStopTimes, type WalkerGround } from './walker';

const CELL_DEG = 4 / 59_274.9; // about 4 m on Mars, north to south
const FIXTURE_DEFINITION = {
  rows: 20, cols: 20, northWestCorner: { lonEastDeg: 10, latDeg: 0.001 }, cellLonDeg: CELL_DEG, cellLatDeg: CELL_DEG,
  cellNorthSouthM: 4, cellEastWestM: 4, cellEastWestMeasuredAtLatDeg: 0, rowOrder: 'north-first', byteOrder: 'little-endian',
  sourceCellsPerCell: 4, slopeBaselineM: { northSouthM: 6, eastWestM: 6 }, files: [],
} as unknown as GridDefinition;

const cautious = WALK_CASES.find((c) => c.id === 'cautious')!;

function fixtureGround(keepOutCells: number[] = []): WalkerGround {
  const keepOut = new Uint8Array(400);
  for (const cell of keepOutCells) keepOut[cell] = 1;
  return { definition: FIXTURE_DEFINITION, heightM: new Float32Array(400).fill(-2400), keepOut };
}

/** The centre of a cell of the fixture grid. */
function centre(row: number, col: number): LonLat {
  return [10 + (col + 0.5) * CELL_DEG, 0.001 - (row + 0.5) * CELL_DEG];
}

describe('walkFreely', () => {
  it('walks at the cautious level speed on flat ground', () => {
    const start = centre(10, 5);
    const step = walkFreely(fixtureGround(), start, 90, 2);
    expect(step.stoppedBy).toBeNull();
    expect(step.speedMps).toBeCloseTo(speedMps(0, cautious), 9);
    expect(distanceM(start, step.position)).toBeCloseTo(2 * speedMps(0, cautious), 3);
  });
  it('is stopped by keep-out ground and by the edge of the grid', () => {
    const start = centre(10, 5);
    // A 6 m step would land beyond the keep-out cell next door: it must stop before it, not jump it.
    const blocked = walkFreely(fixtureGround([10 * 20 + 6]), start, 90, 6 / speedMps(0, cautious));
    expect(blocked.stoppedBy).toBe('keep-out');
    expect(cellIndex(FIXTURE_DEFINITION, blocked.position)).toBe(10 * 20 + 5);
    expect(walkFreely(fixtureGround(), centre(10, 19), 90, 10).stoppedBy).toBe('edge');
  });
});

describe('routeTimeline and alongTimeline', () => {
  it('prices each step with the route card model and finds the walker by time', () => {
    const out = [centre(10, 2), centre(10, 3), centre(10, 4)];
    const back = [centre(10, 4), centre(10, 3), centre(10, 2)];
    const timeline = routeTimeline(fixtureGround(), [out, back]);
    expect(timeline.points).toHaveLength(5); // the turn point is not doubled
    const oneStep = stepCost(distanceM(out[0]!, out[1]!), 0, cautious).timeS;
    expect(timeline.timesS[4]).toBeCloseTo(4 * oneStep, 6);
    // A quarter of the first step: still in the first cell (halfway would sit exactly on the cell border).
    const quarter = alongTimeline(timeline, oneStep / 4);
    expect(quarter.done).toBe(false);
    expect(quarter.headingDeg).toBeCloseTo(90, 3);
    expect(cellIndex(FIXTURE_DEFINITION, quarter.position)).toBe(10 * 20 + 2);
    expect(alongTimeline(timeline, 1e9).done).toBe(true);
  });
  it('carries the last known height over a cell with no data, so it adds no climb (S15)', () => {
    const ground = fixtureGround();
    ground.heightM[10 * 20 + 3] = Number.NaN;
    const line = [centre(10, 2), centre(10, 3), centre(10, 4)];
    const flat = routeTimeline(fixtureGround(), [line]);
    const gap = routeTimeline(ground, [line]);
    expect(gap.timesS[2]).toBeCloseTo(flat.timesS[2]!, 6);
  });
});

describe('withStopTimes', () => {
  it('adds the time at each stop to every point from that stop on', () => {
    const timeline = { points: [[0, 0], [1, 0], [2, 0], [3, 0]] as [number, number][], timesS: [0, 10, 20, 30] };
    const stopped = withStopTimes(timeline, [{ lineIndex: 1, stayS: 100 }, { lineIndex: 2, stayS: 5 }]);
    expect(stopped.timesS).toEqual([0, 110, 125, 135]);
    expect(stopped.points).toBe(timeline.points);
  });
});

describe('withStopPauses', () => {
  it('stands still at each stop for its time, with the same total as withStopTimes (S13)', () => {
    const timeline = { points: [[0, 0], [1, 0], [2, 0], [3, 0]] as [number, number][], timesS: [0, 10, 20, 30] };
    const stops = [{ lineIndex: 1, stayS: 100, name: 'A' }, { lineIndex: 2, stayS: 5, name: 'B' }];
    const played = withStopPauses(timeline, stops);
    expect(played.timesS).toEqual([0, 10, 110, 120, 125, 135]);
    expect(played.points).toEqual([[0, 0], [1, 0], [1, 0], [2, 0], [2, 0], [3, 0]]);
    expect(played.timesS[played.timesS.length - 1]).toBe(withStopTimes(timeline, stops).timesS[3]);
    expect(played.pauses).toEqual([{ fromS: 10, toS: 110, number: 1, name: 'A' }, { fromS: 120, toS: 125, number: 2, name: 'B' }]);
    // Halfway through the first stop the walker is at it, still facing the way it came.
    const waiting = alongTimeline(played, 60);
    expect(waiting.position).toEqual([1, 0]);
    expect(waiting.done).toBe(false);
    expect(waiting.headingDeg).toBeCloseTo(alongTimeline(played, 5).headingDeg, 9);
  });
  it('leaves a timeline without stops as it was', () => {
    const timeline = { points: [[0, 0], [1, 0]] as [number, number][], timesS: [0, 10] };
    expect(withStopPauses(timeline, [])).toEqual({ ...timeline, pauses: [] });
  });
});
