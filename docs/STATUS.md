# Status board

Read this first in every session. Change only your own rows, in a small commit of its own, and push it straight away.

Last updated: Saturday 14 November 2026, 09:30. No app features built yet. File scaffold in place. Source files are on the team data server except the mineral products, which are still downloading.

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
| F14 Mars globe and site picker | A, B | not started | Moved to must-have and built first; decided 14 Nov. See SPEC |
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

| Files | State on 14 November, 09:10 UTC |
|---|---|
| Jezero context terrain and image | Complete; sizes match the USGS source |
| Jezero terrain mosaic | Complete; size matches |
| Jezero image mosaic | Complete; size matches |
| Rover feeds | Complete, 5 files; live feeds, so no source size to compare |
| Gale terrain and image | Complete; sizes match |
| Seven other landing sites | Complete: 68 terrain and image files, sizes match the HiRISE archive, plus the 58 image label files |
| Jezero geologic map | Complete; size matches |
| Jezero mineral products | Downloading. The first run never reached them; restarted on 14 Nov. None of the 690 files confirmed yet |
| Perseverance weather archive | Optional second stage, off |

The first run of the new batch stopped at 02:37 UTC on 14 Nov with 12 problems, all from wrong rows in its download list (4 swapped sizes, 8 wrong file names). The list was corrected and rerun on the server with 0 problems. The mineral list had every size overstated and is being corrected in the server's script.

## Waiting on someone

- Both teammates: install Tailscale, accept the share of the data server, put the address in `.env`, and confirm a file listing loads.
- Team owner: share the machine in Tailscale and send the address privately. Confirm the mineral products finish downloading.
