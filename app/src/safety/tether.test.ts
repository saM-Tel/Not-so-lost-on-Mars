// WHAT:    Tests for budget.ts and tether.ts.
// IN:      A small made-up time-to-home grid, built in this file as a test fixture.
// OUT:     Pass or fail under Vitest.
// USED BY: npm run check.
// RULES:   The SPEC's checks for F4: cautious case, shrinks with elapsed time, home is always inside.
// TRAPS:   PITFALLS 6, 7.
// OWNER:   Role B.

import { describe, expect, it } from 'vitest';
import type { GridDefinition } from '../data/contract';
import { allowedTimeHomeS, timeLeftS, WALK_DURATION_S } from './budget';
import { farthestFromHomeS, marginsAlongWalk, tetherPicture, walkFarthestFromHomeS } from './tether';

/** Test fixture: one row of six cells; home is the west cell and each cell east is 10 minutes further from home. */
const cols = 6;
const cautiousS = Float32Array.from([0, 600, 1200, 1800, 2400, 3000]);
/** In the expected case the same ground is quicker: 6 minutes a cell. */
const expectedS = Float32Array.from([0, 360, 720, 1080, 1440, 1800]);

function opacity(picture: Uint8ClampedArray, cell: number): number {
  return picture[cell * 4 + 3]!;
}

describe('the time budget', () => {
  it('allows the walk-back limit while there is time, then only the time left', () => {
    expect(allowedTimeHomeS({ walkBackLimitS: 3600, elapsedS: 0 })).toBe(3600);
    expect(allowedTimeHomeS({ walkBackLimitS: 1800, elapsedS: 0 })).toBe(1800);
    expect(allowedTimeHomeS({ walkBackLimitS: 3600, elapsedS: WALK_DURATION_S - 900 })).toBe(900);
    expect(allowedTimeHomeS({ walkBackLimitS: 3600, elapsedS: WALK_DURATION_S + 60 })).toBe(0);
    expect(timeLeftS(3600)).toBe(7 * 3600);
  });
});

describe('the tether picture', () => {
  it('dims ground beyond the cautious limit and draws a strong line at it', () => {
    // 20 minutes allowed: cells 0 to 2 are inside in the cautious case.
    const picture = tetherPicture(cautiousS, expectedS, 1200, 1, cols);
    expect(opacity(picture, 0)).toBe(0);           // home: clear
    expect(opacity(picture, 2)).toBe(255);         // the last cell inside: the line
    expect(opacity(picture, 1)).toBe(255);         // the line is three cells wide
    expect(opacity(picture, 5)).toBe(120);         // well outside: dimmed
  });

  it('draws the expected-case line fainter and further out', () => {
    // 1,100 s allowed. Cautious: cells 0 and 1 are inside, so the strong line is centred on cell 1 (cells 0 to 2).
    // Expected: cells 0 to 3 are inside (1,080 s), so the faint line is at cell 3. Cell 4 is beyond both.
    const picture = tetherPicture(cautiousS, expectedS, 1100, 1, cols);
    expect(opacity(picture, 1)).toBe(255);
    expect([picture[3 * 4], opacity(picture, 3)]).toEqual([255, 120]);   // white, part see-through
    expect([picture[4 * 4], opacity(picture, 4)]).toEqual([8, 120]);     // dark dimming only
  });

  it('shrinks as elapsed time rises and always leaves home inside', () => {
    const inside = (elapsedS: number): number => {
      const allowed = allowedTimeHomeS({ walkBackLimitS: 3600, elapsedS });
      return Array.from(cautiousS).filter((t) => t <= allowed).length;
    };
    expect(inside(0)).toBe(6);
    expect(inside(WALK_DURATION_S - 1500)).toBe(3);
    expect(inside(WALK_DURATION_S)).toBe(1);       // only home, where the walk home takes no time
  });

  it('does not outline ground that has no way home', () => {
    const withGap = Float32Array.from([0, 600, Infinity, 1800, 2400, 3000]);
    const picture = tetherPicture(withGap, withGap, 3600, 1, cols);
    expect(opacity(picture, 1)).toBe(0);           // beside the gap, but not at the time limit: no line
    expect(opacity(picture, 2)).toBe(120);         // the gap itself is not reachable: dimmed
  });
});

describe('how far from home a route gets', () => {
  const definition = {
    rows: 1, cols, northWestCorner: { lonEastDeg: 77.3, latDeg: 18.5 }, cellLonDeg: 0.0001, cellLatDeg: 0.0001,
  } as GridDefinition;

  it('finds the longest time-to-home along a line', () => {
    const line: [number, number][] = [[77.30005, 18.49995], [77.30015, 18.49995], [77.30035, 18.49995]];
    expect(farthestFromHomeS(cautiousS, definition, line)).toBe(1800);
  });

  it('judges a walk by its planned way back when that is slower than the quickest way home', () => {
    const out: [number, number][] = [[77.30005, 18.49995], [77.30035, 18.49995]];   // quickest way home from its end: 1,800 s
    const back: [number, number][] = [[77.30035, 18.49995], [77.30045, 18.49995]];  // passes a cell 2,400 s from home
    expect(walkFarthestFromHomeS(cautiousS, definition, out, back, 1000)).toBe(2400);
    // A planned way back of 62 minutes counts in full, though the quickest way home is shorter.
    expect(walkFarthestFromHomeS(cautiousS, definition, out, out, 3720)).toBe(3720);
  });

  it('checks the tether at every point against the moment the walker is there (several stops)', () => {
    // Fixture: cells 0, 3 and 5 of the row (0, 1,800 and 3,000 s from home), reached at 0, 1 h and 3 h into the walk.
    const points: [number, number][] = [[77.30005, 18.49995], [77.30035, 18.49995], [77.30055, 18.49995]];
    const times = [0, 3600, 3 * 3600];
    // Allowed: 1 hour until 7 hours gone, then the time left of the 8-hour walk.
    const allowed = (elapsed: number) => allowedTimeHomeS({ walkBackLimitS: 3600, elapsedS: elapsed });
    const early = marginsAlongWalk(cautiousS, definition, points, times, allowed, 0);
    expect(early.marginsS).toEqual([3600, 1800, 600]);
    expect(early.tightestIndex).toBe(2);
    // Started 6 hours into the outing: at 9 hours gone nothing is left, so the last point is 3,000 s over.
    const late = marginsAlongWalk(cautiousS, definition, points, times, allowed, 6 * 3600);
    expect(late.marginsS[2]).toBe(-3000);
  });

  it('says there is no way home from a point outside the grid', () => {
    expect(farthestFromHomeS(cautiousS, definition, [[77.2, 18.49995]])).toBe(Infinity);
  });
});
