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
| `cost.ts` | Walking speed and effort for a suited person on a slope, and the three cases with their sources. Built. To add: a footing factor | F3 |
| `grid.ts` | The routing grid: indexing, neighbours, and step lengths from the corrected cell spacing. Built | F3, F4 |
| `search.ts` | Keep-out cells from the slope limit; one pass from home gives the least-effort route to every cell, a second gives the way home and cost-to-home. Built | F3, F4 |
| `smooth.ts` | Removes the staircase from a route, then the cost is recomputed along the smoothed path | F3 |
| `stats.ts` | Distance, climb, time, energy and the elevation profile along a route, for all three cases. Built. To add: oxygen | F3 |
| `route.test.ts` | Tests for `cost.ts`, `grid.ts`, `search.ts` and `stats.ts` on made-up grids, with expected values worked by hand | |
| `messages.ts` | Types of the messages between the page and the route worker | F3 |
| `worker.ts` | Web Worker entry: receives the grids, searches from and to home once, then answers each route request from those two searches. To add: cost-to-home arrays for the tether | F3, F4 |
| `client.ts` | Page-side wrapper that starts the route worker and turns its messages into promises. Built for routes. To add: tether requests | F3, F4 |

## Known issues

- On Bright Angel's 791 x 750 grid the two searches from home take about 1.0 to 1.3 s together in headless Edge, and a route answer about 0.1 s. Not timed on a slower machine.
- A route follows grid cells, so it zigzags and its distance is up to about 8% longer than a smoothed path. That errs on the cautious side. `smooth.ts` is not built.
- The slope along a step is taken between the mean heights of neighbouring 4 m cells, a span of 3.8 to 5.5 m.
