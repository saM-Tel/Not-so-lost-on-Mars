# app/src: guide

## Purpose

The app's source. This folder itself holds only the entry point and the styles; everything else is in the subfolders, each with its own guide.

## Owner

Role B.

## Commands

Run from `app/`. They are listed in [../AGENTS.md](../AGENTS.md).

## Reads and writes

Reads `../public/data/` through `data/`. Writes nothing.

## Rules for this folder

- `main.ts` wires things together and holds no logic of its own.
- A site's files load only when that site is opened, so the globe appears quickly.
- Subfolders: `mars/` constants and geometry, `data/` loading, `map/` the globe and site map, `route/` the route worker, `safety/` tether and dose, `ui/` panels.
- Every file starts with the header from [../../docs/WORKFLOW.md](../../docs/WORKFLOW.md). A file with only its header is not built yet.

## File index

Add a row when you add a file. Remove it when you delete one.

| File | What it does | Feature |
|---|---|---|
| `main.ts` | Entry point: opens the Mars globe with approach imagery and a marker at every site, flies to a chosen site, opens a built site's image, 3D terrain, layer panel and route planning, reads the site named in the address bar, and adds the link-to-Earth line and the space-weather banner in one column at the bottom right of the map (`.map-notes`), and installation as an app | F1, F7, F8, F14, F16 |
| `style.css` | Layout and colours for the globe view, the side panel, the route card and its panels, the field tablet and helmet views, and the install button | F13, F14 |

## Known issues

None recorded.
