# Status board

Read this first in every session. Change only your own rows, in a small commit of its own, and push it straight away.

Last updated: 13 November 2026, evening, before the event. No app features built; all source files are downloading on the team data server.

## Now

| Role | Person | Working on | Since |
|---|---|---|---|
| A: data and science | to assign | | |
| B: app | to assign | | |
| C: story and submission | to assign | | |

## Public link

Not deployed yet.

## Features

Status is one of: not started, in progress, works, works with issues, cut. "Works" means it passed its checks in [SPEC.md](SPEC.md) with real data.

| Feature | Owner | Status | Notes |
|---|---|---|---|
| F1 Hero site map | A, B | not started | |
| F2 Layer panel and information cards | B | not started | |
| F3 Route planner | B | not started | |
| F4 Tether | A, B | not started | |
| F5 Dose and space weather | A, B | not started | |
| F6 Photos along the route | C, B | not started | |
| F7 Opening state and shareable link | B | not started | |
| F8 Public site and repository | B | not started | |
| F9 Validation panel | A | not started | |
| F10 Storm mode | A, B | not started | |
| F11 Time of day | A, B | not started | |
| F12 Thermal and mineral layers | A | not started | |
| F13 Tablet and helmet display | B, C | not started | |
| F14 Site picker | B | not started | |
| F15 More sites | A | not started | |
| F16 Extras | any | not started | |

## Sites

| Site | Level | Data built | Reviewed by a person |
|---|---|---|---|
| bright-angel | 1 | no | no |

## Broken right now

Nothing recorded.

## Team data server

Set up on 13 November. Reachable from the team owner's laptop over Tailscale. See [../data/AGENTS.md](../data/AGENTS.md).

| Files | State on 13 November, evening |
|---|---|
| Jezero context terrain and image | Complete, sizes match |
| Jezero terrain mosaic | Complete, size matches |
| Jezero image mosaic | Downloading |
| Rover feeds | Queued |
| Gale terrain and image | Downloading |
| Seven other landing sites | Downloading (new batch unit) |
| Jezero geologic map and mineral products | Downloading (new batch unit; CRISM after the site files) |
| Perseverance weather archive | Optional second stage, off |

## Waiting on someone

- Both teammates: install Tailscale, accept the share of the data server, put the address in `.env`, and confirm a file listing loads.
- Team owner: share the machine in Tailscale and send the address privately. On Saturday morning, check the server's download log for failures.
