# app: guide

Prepared 13 November 2026, before the event, as planning. This folder holds only guide files until 09:00 Saturday.

## Purpose

The static web app an astronaut, and a judge, opens. It reads the files the pipeline wrote and never changes them.

## Owner

Role B.

## Commands

To be set in the first hour and written here:

- Install:
- Run locally:
- Check (types, tests, build), the one command that must pass before any push:

Setting up: this folder already contains these guide files, so the project generator will say it is not empty. Keep the existing files.

## Reads and writes

- Reads `public/data/` as described in [../docs/DATA_CONTRACT.md](../docs/DATA_CONTRACT.md). Never edit anything under `public/data/` by hand.
- Reads live NASA feeds from the browser, always with a saved snapshot as fallback.
- Writes nothing outside this folder.

## Proposed structure

```
src/mars/      Mars constants, distance, time and Sun. The only place these are defined
src/data/      loading site files; types that mirror the data contract
src/map/       map setup, layers, legend, information cards
src/route/     cost, route search, smoothing; runs in a Web Worker
src/safety/    tether, dose, storm mode
src/ui/        panels and the three display modes
public/data/   pipeline outputs
```

## Rules for this folder

- All geometry goes through `src/mars/`. No map-library distance, area or scale function; they assume Earth.
- Route and cost-to-home work runs in a Web Worker.
- A layer appears only if its record in `layers.json` is complete.
- Every number on screen comes with its range and source, per [../docs/CONFIDENCE.md](../docs/CONFIDENCE.md).
- The site is served under the repository name on GitHub Pages. Set the base path and use relative addresses.
- The app opens on the hero scenario with a route already shown (feature F7).
- No new dependency without a reason in the commit message. None after Sunday 12:00.
- Read sections 3, 4, 6, 10 and 11 of [../docs/PITFALLS.md](../docs/PITFALLS.md) before starting.

## File index

Add a row when you add a file. Remove it when you delete one.

| File | What it does | Feature |
|---|---|---|
| | | |

## Known issues

None recorded.
