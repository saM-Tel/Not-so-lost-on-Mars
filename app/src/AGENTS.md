# app/src: guide

## Purpose

The app's source. This folder itself holds only the entry point and the styles; everything else is in the subfolders, each with its own guide.

## Owner

Role B.

## Commands

Run from `app/`. They are listed in [AGENTS.md](AGENTS.md).

## Reads and writes

Reads `../public/data/` through `data/`. Writes nothing.

## Rules for this folder

- `main.ts` wires things together and holds no logic of its own.
- A site's files load only when that site is opened, so the globe appears quickly.
- Subfolders: `mars/` constants and geometry, `data/` loading, `map/` the globe and site map, `route/` the route worker, `safety/` tether and dose, `ui/` panels.
- Every file starts with the header from [../docs/WORKFLOW.md](../docs/WORKFLOW.md). A file with only its header is not built yet.

## File index

Add a row when you add a file. Remove it when you delete one.

| File | What it does | Feature |
|---|---|---|
| `main.ts` | Entry point. Reads the address bar, opens the Mars globe or a named site, and wires the map, panels and route worker together | F7 |
| `style.css` | Layout and colours for the globe view and the three display modes | F13, F14 |

## Known issues

None recorded.
