// WHAT:    Least-effort routes from and to home for every cell in one pass each, and so cost-to-home for every cell (F3, F4).
// IN:      The routing grid, the slope limit, home's cell, and the case to plan with.
// OUT:     For every cell: the energy to walk there from home (or home from there), and the neighbour the route passes through.
// USED BY: src/route/worker.ts.
// RULES:   Out and back are separate searches. Cost-to-home uses the cost of stepping towards home. A cell with no data or
//          steeper than the limit is never entered.
// TRAPS:   PITFALLS 6: searching from home with forward costs gives cost from home, not cost to home.
// OWNER:   Role B.

import { stepCost, type WalkCase } from './cost';
import { steps, type RoutingGrid } from './grid';

/** 1 where a walker may not go: no data, or the steepest slope in the cell is over the limit. */
export function keepOut(grid: RoutingGrid, slopeLimitDeg: number): Uint8Array {
  const blocked = new Uint8Array(grid.heightM.length);
  for (let i = 0; i < blocked.length; i++) {
    const slope = grid.slopeMaxDeg[i]!;
    // Written so that NaN (no data) is blocked too.
    if (!(slope <= slopeLimitDeg) || Number.isNaN(grid.heightM[i]!)) blocked[i] = 1;
  }
  return blocked;
}

export interface Field {
  /** Energy in joules along the best route between home and each cell; Infinity where no route exists. */
  energyJ: Float64Array;
  /** The next cell along that route on the way towards home, or -1 at home and where no route exists. */
  towardsHome: Int32Array;
}

/** A binary heap of cells ordered by cost. A cell can sit in it more than once; stale entries are skipped by the caller. */
class Heap {
  private cells: number[] = [];
  private costs: number[] = [];
  get size(): number { return this.cells.length; }
  push(cell: number, cost: number): void {
    let i = this.cells.length;
    this.cells.push(cell);
    this.costs.push(cost);
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.costs[parent]! <= cost) break;
      this.cells[i] = this.cells[parent]!;
      this.costs[i] = this.costs[parent]!;
      i = parent;
    }
    this.cells[i] = cell;
    this.costs[i] = cost;
  }
  pop(): { cell: number; cost: number } {
    const top = { cell: this.cells[0]!, cost: this.costs[0]! };
    const cell = this.cells.pop()!;
    const cost = this.costs.pop()!;
    const n = this.cells.length;
    if (n > 0) {
      let i = 0;
      for (;;) {
        let child = 2 * i + 1;
        if (child >= n) break;
        if (child + 1 < n && this.costs[child + 1]! < this.costs[child]!) child++;
        if (this.costs[child]! >= cost) break;
        this.cells[i] = this.cells[child]!;
        this.costs[i] = this.costs[child]!;
        i = child;
      }
      this.cells[i] = cell;
      this.costs[i] = cost;
    }
    return top;
  }
}

/**
 * Least energy between home and every cell, in one pass outward from home.
 * `direction` 'fromHome' prices each step as walked away from home; 'toHome' prices it as walked towards home,
 * which is what cost-to-home needs because uphill and downhill differ.
 */
export function searchFromHome(
  grid: RoutingGrid, blocked: Uint8Array, home: number, walkCase: WalkCase, direction: 'fromHome' | 'toHome',
): Field {
  const cells = grid.rows * grid.cols;
  const energyJ = new Float64Array(cells).fill(Infinity);
  const towardsHome = new Int32Array(cells).fill(-1);
  const done = new Uint8Array(cells);
  if (home < 0 || home >= cells || blocked[home]) return { energyJ, towardsHome };

  const moves = steps(grid);
  const heap = new Heap();
  energyJ[home] = 0;
  heap.push(home, 0);
  while (heap.size > 0) {
    const { cell, cost } = heap.pop();
    if (done[cell]) continue;
    done[cell] = 1;
    const row = Math.floor(cell / grid.cols);
    const col = cell - row * grid.cols;
    const height = grid.heightM[cell]!;
    for (const move of moves) {
      const r = row + move.dRow;
      const c = col + move.dCol;
      if (r < 0 || c < 0 || r >= grid.rows || c >= grid.cols) continue;
      const next = r * grid.cols + c;
      if (done[next] || blocked[next]) continue;
      // A diagonal step may not cut the corner of a keep-out cell.
      if (move.dRow !== 0 && move.dCol !== 0 && (blocked[row * grid.cols + c] || blocked[r * grid.cols + col])) continue;
      const rise = grid.heightM[next]! - height;
      // Away from home the walker goes cell -> next; towards home the walker goes next -> cell.
      const step = stepCost(move.lengthM, direction === 'fromHome' ? rise : -rise, walkCase).energyJ;
      const total = cost + Math.max(step, 1e-6);
      if (total < energyJ[next]!) {
        energyJ[next] = total;
        towardsHome[next] = cell;
        heap.push(next, total);
      }
    }
  }
  return { energyJ, towardsHome };
}

/** The cells from a cell back to home along a field's route, starting at the cell. Empty if no route exists. */
export function pathToHome(field: Field, cell: number): number[] {
  if (cell < 0 || !Number.isFinite(field.energyJ[cell]!)) return [];
  const path = [cell];
  let at = cell;
  while (field.towardsHome[at]! >= 0) {
    at = field.towardsHome[at]!;
    path.push(at);
  }
  return path;
}
