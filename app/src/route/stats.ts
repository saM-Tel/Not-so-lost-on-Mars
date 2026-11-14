// WHAT:    Distance, time, energy and the elevation profile along a route, for all three cases (F3). Still to add: oxygen.
// IN:      A route as a list of grid cells in walking order; the routing grid; the cases.
// OUT:     Totals for each case and a height profile.
// USED BY: src/route/worker.ts.
// RULES:   The route is chosen on the expected case; all three cases are reported along that same route.
//          Distance is measured on the map from the corrected cell spacing, so it is a Mars distance.
// TRAPS:   PITFALLS 6, 7. A route that follows grid cells zigzags, so its distance is up to about 8% longer than a
//          smoothed path would be. That errs on the cautious side; smooth.ts is not built yet.
// OWNER:   Role B.

import { stepCost, type WalkCase } from './cost';
import type { RoutingGrid } from './grid';

export interface CaseTotals {
  caseId: WalkCase['id'];
  timeS: number;
  energyJ: number;
}

export interface RouteStats {
  /** Length on the map, metres. */
  distanceM: number;
  /** Total height gained and lost along the way, metres, both positive. */
  climbM: number;
  descentM: number;
  /** Steepest step along the direction of travel, degrees: uphill positive, downhill negative. */
  steepestUpDeg: number;
  steepestDownDeg: number;
  cases: CaseTotals[];
  /** Distance from the start and height at each cell of the route. */
  profile: { distanceM: number; heightM: number }[];
}

/** Totals along a route. `cells` is in walking order. */
export function routeStats(grid: RoutingGrid, cells: number[], cases: readonly WalkCase[]): RouteStats {
  const totals = cases.map((c) => ({ caseId: c.id, timeS: 0, energyJ: 0 }));
  const profile: RouteStats['profile'] = [];
  let distanceM = 0;
  let climbM = 0;
  let descentM = 0;
  let steepestUpDeg = 0;
  let steepestDownDeg = 0;
  for (let i = 0; i < cells.length; i++) {
    const cell = cells[i]!;
    if (i > 0) {
      const previous = cells[i - 1]!;
      const dRow = Math.floor(cell / grid.cols) - Math.floor(previous / grid.cols);
      const dCol = (cell % grid.cols) - (previous % grid.cols);
      const lengthM = Math.hypot(dRow * grid.cellNorthSouthM, dCol * grid.cellEastWestM);
      const riseM = grid.heightM[cell]! - grid.heightM[previous]!;
      distanceM += lengthM;
      if (riseM > 0) climbM += riseM; else descentM -= riseM;
      const slopeDeg = (Math.atan2(riseM, lengthM) * 180) / Math.PI;
      steepestUpDeg = Math.max(steepestUpDeg, slopeDeg);
      steepestDownDeg = Math.min(steepestDownDeg, slopeDeg);
      cases.forEach((walkCase, k) => {
        const step = stepCost(lengthM, riseM, walkCase);
        totals[k]!.timeS += step.timeS;
        totals[k]!.energyJ += step.energyJ;
      });
    }
    profile.push({ distanceM, heightM: grid.heightM[cell]! });
  }
  return { distanceM, climbM, descentM, steepestUpDeg, steepestDownDeg, cases: totals, profile };
}
