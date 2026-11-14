# app/src/safety: guide

## Purpose

What protects the crew: suit budget, the tether, radiation dose and storm mode.

## Owner

Role B.

## Commands

Run from `app/`. They are listed in [../../AGENTS.md](../../AGENTS.md).

## Reads and writes

Reads results from `../route/` and feeds from `../data/`. Writes nothing.

## Rules for this folder

- Anything that protects the crew uses the cautious case.
- Gray and sievert are never converted 1:1.
- Every default is cited or labelled assumed, with its grade from `docs/CONFIDENCE.md`.
- Every file starts with the header from [../../../docs/WORKFLOW.md](../../../docs/WORKFLOW.md). A file with only its header is not built yet.

## File index

Add a row when you add a file. Remove it when you delete one.

| File | What it does | Feature |
|---|---|---|
| `budget.ts` | Suit settings and consumables: usable energy, oxygen and time, minus the reserve | F4 |
| `tether.ts` | The tether: the boundary where the cost to get home equals what is left | F4 |
| `dose.ts` | Radiation dose for a planned walk, with its range | F5 |
| `storm.ts` | Storm mode: compares going home with sheltering against terrain, and replays the 20 May 2024 event | F10 |

## Known issues

None recorded.
