// WHAT:    Tests for the route core: cost.ts, grid.ts, search.ts and stats.ts.
// IN:      Small made-up grids, built in this file as test fixtures.
// OUT:     Pass or fail.
// USED BY: npm test.
// RULES:   Expected values are worked by hand from the published equations, not copied from the code's output.
// TRAPS:   PITFALLS 6.
// OWNER:   Role B.

import { describe, expect, it } from 'vitest';
import { modelSpeedMps, speedMps, stepCost, WALK_CASES, type WalkCase } from './cost';
import { cellAt, cellCentre, steps, type RoutingGrid } from './grid';
import { keepOut, pathToHome, searchFromHome } from './search';
import { routeStats } from './stats';

const expected = WALK_CASES.find((c) => c.id === 'expected') as WalkCase;

/** Test fixture: a grid whose height rises by `risePerColM` for each column eastwards. Cells are 4 m by 3.8 m. */
function fixtureGrid(rows: number, cols: number, risePerColM = 0): RoutingGrid {
  const heightM = new Float32Array(rows * cols);
  for (let i = 0; i < heightM.length; i++) heightM[i] = 100 + (i % cols) * risePerColM;
  return {
    rows, cols, westLonDeg: 77.3, northLatDeg: 18.5, cellLonDeg: 0.0001, cellLatDeg: 0.0001,
    cellNorthSouthM: 4, cellEastWestM: 3.8, heightM, slopeMaxDeg: new Float32Array(rows * cols),
  };
}

describe('walking speed', () => {
  it('follows the published line at each slope', () => {
    expect(modelSpeedMps(0)).toBeCloseTo(1.6, 6);
    expect(modelSpeedMps(6)).toBeCloseTo(0.4, 6);          // -0.2 * 6 + 1.6
    expect(modelSpeedMps(10)).toBeCloseTo(0.244, 6);       // -0.039 * 10 + 0.634
    expect(modelSpeedMps(20)).toBe(0.05);
    expect(modelSpeedMps(-10)).toBeCloseTo(1.0, 6);        // 0.06 * -10 + 1.6
    expect(modelSpeedMps(-15)).toBeCloseTo(0.525, 6);      // 0.095 * -15 + 1.95
    expect(modelSpeedMps(-25)).toBe(0.05);
  });

  it('is scaled to the level speed of the case', () => {
    expect(speedMps(0, expected)).toBeCloseTo(1.0, 6);
    expect(speedMps(6, expected)).toBeCloseTo(0.25, 6);    // 0.4 * (1.0 / 1.6)
  });
});

describe('cost of one step', () => {
  it('matches the level-ground equation', () => {
    // 186 kg, 1.0 m/s, 10 m: (3.28 * 186 + 71.1) * (0.661 + 0.115 / 1.0) * 10 = 681.18 * 0.776 * 10
    const step = stepCost(10, 0, expected);
    expect(step.timeS).toBeCloseTo(10, 6);
    expect(step.energyJ).toBeCloseTo(5285.96, 1);
  });

  it('matches the uphill equation with Mars gravity', () => {
    // 10 m along, 1 m up: slope 5.7106 deg, speed (1.6 - 0.2 * 5.7106) * 0.625 = 0.28618 m/s.
    // Level part 681.18 * (0.661 * 0.99504 + 0.115 / 0.28618) * 10 = 7217.6 J.
    // Lift 3.5 * 186 * 3.71 * 10 * 0.099504 = 2403.2 J. Total 9620.8 J.
    const step = stepCost(10, 1, expected);
    expect(step.timeS).toBeCloseTo(10 / 0.28618, 1);
    expect(Math.abs(step.energyJ - 9620.8)).toBeLessThan(5);
  });

  it('costs less going down a gentle slope than going up it, and never less than nothing', () => {
    expect(stepCost(10, -1, expected).energyJ).toBeLessThan(stepCost(10, 1, expected).energyJ);
    for (const rise of [-8, -4, -2, -1, -0.5]) expect(stepCost(10, rise, expected).energyJ).toBeGreaterThan(0);
  });
});

describe('the grid', () => {
  it('finds the cell at a position and gives its centre back', () => {
    const grid = fixtureGrid(5, 6);
    const index = cellAt(grid, [77.30025, 18.49985]);       // third column, second row
    expect(index).toBe(1 * 6 + 2);
    expect(cellCentre(grid, index)[0]).toBeCloseTo(77.30025, 9);
    expect(cellCentre(grid, index)[1]).toBeCloseTo(18.49985, 9);
    expect(cellAt(grid, [77.2999, 18.4999])).toBe(-1);
  });

  it('gives each step its true length', () => {
    const lengths = steps(fixtureGrid(3, 3)).map((s) => s.lengthM);
    expect(lengths.slice(0, 4)).toEqual([4, 4, 3.8, 3.8]);
    expect(lengths[4]).toBeCloseTo(Math.hypot(4, 3.8), 9);
  });
});

describe('route search', () => {
  it('stopped early at a stop, gives that stop the same cost and path as a full search (F3, several stops)', () => {
    const grid = fixtureGrid(9, 9, 0.6);
    for (const row of [0, 1, 2, 3, 4, 5, 6]) grid.slopeMaxDeg[row * 9 + 4] = 25; // a wall to go round
    const blocked = keepOut(grid, 20);
    const from = 1 * 9 + 1;
    const to = 2 * 9 + 7;
    const full = searchFromHome(grid, blocked, from, expected, 'fromHome');
    const early = searchFromHome(grid, blocked, from, expected, 'fromHome', 'energyJ', to);
    expect(early.cost[to]).toBeCloseTo(full.cost[to]!, 9);
    expect(pathToHome(early, to)).toEqual(pathToHome(full, to));
  });

  it('walks straight across flat ground', () => {
    const grid = fixtureGrid(5, 5);
    const home = 2 * 5 + 0;
    const field = searchFromHome(grid, keepOut(grid, 20), home, expected, 'fromHome');
    const oneStep = stepCost(3.8, 0, expected).energyJ;
    expect(field.cost[2 * 5 + 4]).toBeCloseTo(4 * oneStep, 6);
    expect(pathToHome(field, 2 * 5 + 4)).toEqual([14, 13, 12, 11, 10]);
  });

  it('goes round a keep-out wall and never through it or across its corner', () => {
    const grid = fixtureGrid(5, 5);
    for (const row of [0, 1, 2, 3]) grid.slopeMaxDeg[row * 5 + 2] = 25;   // too steep: a wall with a gap in the south row
    const blocked = keepOut(grid, 20);
    const field = searchFromHome(grid, blocked, 0, expected, 'fromHome');
    const path = pathToHome(field, 4);
    expect(path.length).toBeGreaterThan(5);
    expect(path.every((cell) => blocked[cell] === 0)).toBe(true);
    expect(path).toContain(4 * 5 + 2);                       // the only gap
  });

  it('marks cells with no data as keep-out and unreachable cells as having no route', () => {
    const grid = fixtureGrid(3, 3);
    for (const row of [0, 1, 2]) grid.heightM[row * 3 + 1] = NaN;         // a column with no data cuts the grid in two
    const field = searchFromHome(grid, keepOut(grid, 20), 0, expected, 'fromHome');
    expect(field.cost[2]).toBe(Infinity);
    expect(pathToHome(field, 2)).toEqual([]);
  });

  it('prices the way home in the direction walked', () => {
    // Height rises 0.3 m per column, so home at the west edge is downhill from everywhere.
    const grid = fixtureGrid(3, 6, 0.3);
    const blocked = keepOut(grid, 20);
    const home = 1 * 6 + 0;
    const far = 1 * 6 + 5;
    const out = searchFromHome(grid, blocked, home, expected, 'fromHome');
    const back = searchFromHome(grid, blocked, home, expected, 'toHome');
    expect(back.cost[far]).toBeLessThan(out.cost[far]!);            // home is downhill

    // The field's number is the energy of actually walking its route, in walking order.
    const homeward = pathToHome(back, far);
    expect(routeStats(grid, homeward, [expected]).cases[0]!.energyJ).toBeCloseTo(back.cost[far]!, 3);
    const outward = pathToHome(out, far).reverse();
    expect(routeStats(grid, outward, [expected]).cases[0]!.energyJ).toBeCloseTo(out.cost[far]!, 3);
  });
});

describe('route statistics', () => {
  it('adds up distance, climb and all three cases along one route', () => {
    const grid = fixtureGrid(1, 4, 0.5);
    const stats = routeStats(grid, [0, 1, 2, 3], WALK_CASES);
    expect(stats.distanceM).toBeCloseTo(3 * 3.8, 6);
    expect(stats.climbM).toBeCloseTo(1.5, 5);
    expect(stats.descentM).toBe(0);
    expect(stats.steepestUpDeg).toBeCloseTo((Math.atan2(0.5, 3.8) * 180) / Math.PI, 4);
    expect(stats.cases.map((c) => c.caseId)).toEqual(['favourable', 'expected', 'cautious']);
    // Slower and heavier costs more time and more energy.
    expect(stats.cases[0]!.timeS).toBeLessThan(stats.cases[1]!.timeS);
    expect(stats.cases[1]!.timeS).toBeLessThan(stats.cases[2]!.timeS);
    expect(stats.cases[0]!.energyJ).toBeLessThan(stats.cases[2]!.energyJ);
    expect(stats.profile).toHaveLength(4);
    expect(stats.profile[3]!.heightM).toBeCloseTo(101.5, 4);
  });
});
