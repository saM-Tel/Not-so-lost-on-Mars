// WHAT:    Tests for src/safety/walker.ts: walking speed on the flat, keep-out and the grid edge stopping a step, and the
//          route timeline agreeing with the walking model.
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
import { alongTimeline, cellIndex, routeTimeline, walkFreely, type WalkerGround } from './walker';

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
});
