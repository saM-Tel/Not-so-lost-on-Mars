# app/src/route: guide

## Purpose

Walking cost, route search, smoothing and route statistics. Runs in a Web Worker.

## Owner

Role B.

## Commands

Run from `app/`. They are listed in [../../AGENTS.md](../../AGENTS.md).

## Reads and writes

Reads the routing grids handed over by `client.ts`. Writes nothing.

## Rules for this folder

- Only `client.ts` runs on the page. Every other file must work inside the worker: no page access, no MapLibre.
- Out and back are computed separately. Cost-to-home uses the cost of stepping towards home.
- The route is chosen on the expected case; all three cases are reported along it.
- Step lengths come from the corrected cell spacing in `grid.ts`.
- Tests use small made-up grids. They are named as fixtures and live only in test files.
- Every file starts with the header from [../../../docs/WORKFLOW.md](../../../docs/WORKFLOW.md). A file with only its header is not built yet.

## File index

Add a row when you add a file. Remove it when you delete one.

| File | What it does | Feature |
|---|---|---|
| `cost.ts` | Walking speed and effort for a suited person on a slope, for the favourable, expected and cautious cases | F3 |
| `grid.ts` | The routing grid: indexing, neighbours, and step lengths from the corrected cell spacing | F3, F4 |
| `search.ts` | Least-effort route between two cells, and cost-to-home for every cell | F3, F4 |
| `smooth.ts` | Removes the staircase from a route, then the cost is recomputed along the smoothed path | F3 |
| `stats.ts` | Distance, time, energy, oxygen and the elevation profile along a route, for all three cases | F3 |
| `worker.ts` | Web Worker entry: receives grids and requests, runs the route search and cost-to-home, posts results | F3, F4 |
| `client.ts` | Page-side wrapper that starts the route worker and turns its messages into promises | F3, F4 |

## Known issues

None recorded.
