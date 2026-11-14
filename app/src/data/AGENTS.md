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
| `contract.ts` | Types that mirror docs/DATA_CONTRACT.md. Built so far: layers.json, sites.json and site.json with its routing grid definition |  |
| `layers.ts` | Loads a layers.json and checks that each layer's record is complete; incomplete layers are left out with the reasons | F2, F14 |
| `loadSites.ts` | Loads the list of every site for the globe; a site with no cited position is left out with the reason | F14 |
| `records.test.ts` | Tests for the record checks in `layers.ts` and `loadSites.ts`, on made-up fixtures | |
| `loadSite.ts` | Loads one built site: site.json, layers.json and the routing grid files. To add: vectors | F1 to F4 |
| `feeds.ts` | Fetches the live NASA space-weather feeds, falling back to the saved snapshot | F5 |

## Known issues

None recorded.
