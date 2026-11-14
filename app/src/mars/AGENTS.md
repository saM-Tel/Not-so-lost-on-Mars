# app/src/mars: guide

## Purpose

Mars constants, distance, time and Sun. The only place these are defined in the app.

## Owner

Role B.

## Commands

Run from `app/`. They are listed in [../../AGENTS.md](../../AGENTS.md).

## Reads and writes

Reads and writes no files. Pure functions.

## Rules for this folder

- No import from MapLibre and no access to the page, so the route worker can use these files.
- Values match the root `AGENTS.md` and `pipeline/mars.py`.
- Every function is tested against a value from a cited source or one worked by hand in the test.
- Every file starts with the header from [../../../docs/WORKFLOW.md](../../../docs/WORKFLOW.md). A file with only its header is not built yet.

## File index

Add a row when you add a file. Remove it when you delete one.

| File | What it does | Feature |
|---|---|---|
| `constants.ts` | Mars constants (radius, gravity, sol length) and the Earth radius MapLibre assumes. The only place they are defined in the app |  |
| `geometry.ts` | Distance, bearing and cell spacing on the Mars sphere, and longitude conversion | F1, F3, F14 |
| `geometry.test.ts` | Tests for `constants.ts` and `geometry.ts`, with expected values worked by hand | |
| `time.ts` | Mars time from Earth time: sol number, local mean solar time and season | F11, information cards |
| `sun.ts` | Height and direction of the Sun at a place and time, for the time-of-day view and computed shadows | F11 |

## Known issues

None recorded.
