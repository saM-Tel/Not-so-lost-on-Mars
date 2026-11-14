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
| `budget.ts` | The time budget behind the tether: an 8-hour walk and a walk-back limit of 30 minutes or 1 hour, both from a NASA source. To add: energy and oxygen budgets, a reserve | F4 |
| `tether.ts` | The tether: a picture of the boundary where the walk home takes as long as is allowed, cautious line strong and expected line faint; how far from home a route gets | F4 |
| `tether.test.ts` | Tests for `budget.ts` and `tether.ts` on a made-up grid | |
| `dose.ts` | Radiation dose for a planned walk: dose equivalent and absorbed dose, each from its own measured rate, with a range. To add: terrain shielding | F5 |
| `dose.test.ts` | Tests for `dose.ts` | |
| `oxygen.ts` | Oxygen breathed on a walk from its metabolic energy (Weir 1949, respiratory quotient 0.85 assumed), for each case | F3 |
| `storm.ts` | Storm mode: compares going home with sheltering against terrain, and replays the 20 May 2024 event | F10 |

## Known issues

- The tether is a time limit only. Energy and oxygen are not yet budgets, and no reserve is taken off, because we have no sourced figures for them.
- Whether a walk stays inside the tether is judged once, at the walk's far end, not at every point along it.
