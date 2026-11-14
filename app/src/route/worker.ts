// WHAT:    Web Worker entry: receives grids and requests, runs the route search from and to home, posts results (F3),
//          then the time to walk home from every cell for the tether (F4).
// IN:      Messages from src/route/client.ts, typed in src/route/messages.ts.
// OUT:     Messages with keep-out cells, routes and statistics.
// USED BY: src/route/client.ts.
// RULES:   No page access. Typed arrays are transferred, not copied. A route answers in under 3 seconds.
//          The route is chosen on the expected case; all three cases are reported along it.
// TRAPS:   PITFALLS 6.
// OWNER:   Role B.

import { WALK_CASES, type WalkCase } from './cost';
import { cellAt, cellCentre, makeGrid, type RoutingGrid } from './grid';
import type { Reply, Request, RouteLeg } from './messages';
import { keepOut, pathToHome, searchFromHome, type Field } from './search';
import { routeStats } from './stats';

interface State {
  grid: RoutingGrid;
  blocked: Uint8Array;
  home: number;
  out: Field;
  back: Field;
}

let state: State | null = null;
const planningCase = WALK_CASES.find((c) => c.id === 'expected') as WalkCase;

function post(reply: Reply, transfer: Transferable[] = []): void {
  (self as unknown as { postMessage(message: Reply, transfer: Transferable[]): void }).postMessage(reply, transfer);
}

function leg(grid: RoutingGrid, cells: number[]): RouteLeg {
  return { line: cells.map((cell) => cellCentre(grid, cell)), stats: routeStats(grid, cells, WALK_CASES) };
}

self.onmessage = (event: MessageEvent<Request>): void => {
  const request = event.data;
  try {
    if (request.type === 'init') {
      const started = performance.now();
      const grid = makeGrid(request.definition, new Float32Array(request.heightM), new Float32Array(request.slopeMaxDeg));
      const blocked = keepOut(grid, request.slopeLimitDeg);
      const home = cellAt(grid, request.home);
      const homeUsable = home >= 0 && blocked[home] === 0;
      const out = searchFromHome(grid, blocked, homeUsable ? home : -1, planningCase, 'fromHome');
      const back = searchFromHome(grid, blocked, homeUsable ? home : -1, planningCase, 'toHome');
      state = { grid, blocked, home, out, back };
      let keepOutCells = 0;
      let reachable = 0;
      for (let i = 0; i < blocked.length; i++) {
        keepOutCells += blocked[i]!;
        if (Number.isFinite(out.cost[i]!) && Number.isFinite(back.cost[i]!)) reachable++;
      }
      const copy = blocked.slice();
      post({
        type: 'ready', rows: grid.rows, cols: grid.cols, keepOut: copy, homeUsable,
        homeCentre: home >= 0 ? cellCentre(grid, home) : null,
        keepOutShare: keepOutCells / blocked.length, reachableShare: reachable / blocked.length,
        searchMs: performance.now() - started,
      }, [copy.buffer]);

      // For the tether: the quickest walk home from every cell, in the cautious case and in the expected case.
      const tetherStarted = performance.now();
      const timeHome = (caseId: WalkCase['id']): Float32Array => Float32Array.from(searchFromHome(
        grid, blocked, homeUsable ? home : -1, WALK_CASES.find((c) => c.id === caseId) as WalkCase, 'toHome', 'timeS',
      ).cost);
      const cautiousS = timeHome('cautious');
      const expectedS = timeHome('expected');
      post({ type: 'tether', cautiousS, expectedS, searchMs: performance.now() - tetherStarted }, [cautiousS.buffer, expectedS.buffer]);
      return;
    }
    if (!state) throw new Error('A route was asked for before the grids were loaded.');
    const { grid, blocked, out, back } = state;
    const target = cellAt(grid, request.target);
    if (target < 0) { post({ type: 'route', id: request.id, ok: false, reason: 'outside' }); return; }
    if (blocked[target]) { post({ type: 'route', id: request.id, ok: false, reason: 'keep-out' }); return; }
    if (!Number.isFinite(out.cost[target]!) || !Number.isFinite(back.cost[target]!)) {
      post({ type: 'route', id: request.id, ok: false, reason: 'unreachable' });
      return;
    }
    post({
      type: 'route', id: request.id, ok: true, target: cellCentre(grid, target),
      // The outward field's path runs from the target back to home, so it is reversed into walking order.
      out: leg(grid, pathToHome(out, target).reverse()),
      back: leg(grid, pathToHome(back, target)),
    });
  } catch (error) {
    post({ type: 'error', message: error instanceof Error ? error.message : String(error) });
  }
};
