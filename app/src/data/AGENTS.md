# app/src/data: guide

## Purpose

Loads the files the pipeline wrote, and holds the types that mirror the data contract.

## Owner

Role B.

## Commands

Run from `app/`. They are listed in [../../AGENTS.md](../../AGENTS.md).

## Reads and writes

Reads `../../public/data/` and the live NASA feeds. Writes nothing.

## Rules for this folder

- Change `contract.ts` only together with `docs/DATA_CONTRACT.md` and the pipeline.
- Never read from the team data server.
- A missing optional file switches its feature off and gives the reason. A missing value stays missing.
- Every file starts with the header from [../../../docs/WORKFLOW.md](../../../docs/WORKFLOW.md). A file with only its header is not built yet.

## File index

Add a row when you add a file. Remove it when you delete one.

| File | What it does | Feature |
|---|---|---|
| `contract.ts` | Types that mirror docs/DATA_CONTRACT.md. Built so far: layers.json (with the globe's `overview` picture), sites.json and site.json with its routing grid definition |  |
| `layers.ts` | Loads a layers.json and checks that each layer's record is complete; incomplete layers are left out with the reasons | F2, F14 |
| `loadSites.ts` | Loads the list of every site for the globe; a site with no cited position is left out with the reason | F14 |
| `records.test.ts` | Tests for the record checks in `layers.ts` and `loadSites.ts`, on made-up fixtures | |
| `loadSite.ts` | Loads one built site: site.json, layers.json, validation.json and the routing grid files | F1 to F4, F9 |
| `photos.ts` | Loads a site's index of rover photos and picks those taken within 30 m of a route, in walking order | F6 |
| `photos.test.ts` | Tests for choosing photos near a route, on made-up records | |
| `orbiters.ts` | Orbiters overhead (F18): loads the saved Horizons predictions; where each orbiter is now (the point below it) and its ground track; for a walk, minute by minute, whether a confirmed relay is high enough for a link and a confirmed camera is high overhead in daylight; the stretches of route walked in a gap; which orbiters are counted (`isCounted`); the window every counted orbiter covers and `predictionClock`, which replays that window once it has ended. Thresholds assumed (10 and 60 degrees) | F18 |
| `orbiters.test.ts` | Tests for `orbiters.ts` on made-up tracks and passes, including one window ending first and the replay clock | |
| `feeds.ts` | Reads NASA's notices that forecast a solar eruption reaching Mars: live, or else the saved snapshot, and says which. Built | F5 |

## Known issues

None recorded.
