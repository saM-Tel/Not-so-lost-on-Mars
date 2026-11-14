# app: guide

Scaffold added on Saturday 14 November: every source file exists and holds only its header comment until it is built.

## Purpose

The static web app an astronaut, and a judge, opens. It reads the files the pipeline wrote and never changes them.

## Owner

Role B.

## Commands

Run these inside `app/`. Node 20 or later.

- Install: `npm install`
- Run locally: `npm run dev`
- Check (types, tests, build), the one command that must pass before any push: `npm run check`

Set up by hand, without a project generator: `package.json`, `tsconfig.json`, `vite.config.ts` and `index.html`.

## Reads and writes

- Reads `public/data/` as described in [../docs/DATA_CONTRACT.md](../docs/DATA_CONTRACT.md). Never edit anything under `public/data/` by hand.
- Reads live NASA feeds from the browser, always with a saved snapshot as fallback.
- Writes nothing outside this folder.

## Structure

```
src/           entry point and styles
src/mars/      Mars constants, distance, time and Sun. The only place these are defined
src/data/      loading site files; types that mirror the data contract
src/map/       the Mars globe, site markers, fly-in, site layers, legend, scale bar
src/route/     cost, route search, smoothing; runs in a Web Worker
src/safety/    tether, dose, storm mode
src/ui/        panels, cards and the three display modes
public/data/   pipeline outputs
```

Each folder under `src/` has its own guide with its rules and file index.

## Rules for this folder

- All geometry goes through `src/mars/`. No map-library distance, area or scale function; they assume Earth.
- Route and cost-to-home work runs in a Web Worker.
- A layer appears only if its record in `layers.json` is complete.
- Every number on screen comes with its range and source, per [../docs/CONFIDENCE.md](../docs/CONFIDENCE.md).
- The site is served under the repository name on GitHub Pages. Set the base path and use relative addresses.
- The plain link opens on the Mars globe (feature F14). A link that names a built site opens on that site with its route already shown (feature F7).
- No new dependency without a reason in the commit message. None after Sunday 12:00.
- Read sections 3, 4, 6, 10 and 11 of [../docs/PITFALLS.md](../docs/PITFALLS.md) before starting.

## File index

Add a row when you add a file. Remove it when you delete one.

| File | What it does | Feature |
|---|---|---|
| `index.html` | The single page; holds the map element and loads `src/main.ts` | F7, F14 |
| `package.json` | Dependencies and the commands above | |
| `tsconfig.json` | TypeScript settings: strict, no output | |
| `vite.config.ts` | Build settings; relative base path for GitHub Pages | F8 |
| `src/` | Entry point and styles: see [src/AGENTS.md](src/AGENTS.md) | |
| `src/mars/` | See [src/mars/AGENTS.md](src/mars/AGENTS.md) | F1, F3, F11, F14 |
| `src/data/` | See [src/data/AGENTS.md](src/data/AGENTS.md) | F1 to F5, F14 |
| `src/map/` | See [src/map/AGENTS.md](src/map/AGENTS.md) | F1 to F4, F14 |
| `src/route/` | See [src/route/AGENTS.md](src/route/AGENTS.md) | F3, F4 |
| `src/safety/` | See [src/safety/AGENTS.md](src/safety/AGENTS.md) | F4, F5, F10 |
| `src/ui/` | See [src/ui/AGENTS.md](src/ui/AGENTS.md) | F2 to F7, F10, F11, F13, F14 |

## Known issues

- No tests exist yet, so the check passes with none. Add tests beside the file they test, as `<name>.test.ts`.
- The installed versions are MapLibre GL JS 6, Vite 8, TypeScript 7 and Vitest 5. Check their own documentation before relying on behaviour remembered from older versions.
