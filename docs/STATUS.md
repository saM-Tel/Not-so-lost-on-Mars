# Status board

Read this first in every session. Change only your own rows, in a small commit of its own, and push it straight away.

Last updated: Sat 14 Nov 11:35. The Mars globe with site markers works on a developer's machine (F14, in progress). Bright Angel is built and shows its image on the ground (F1, in progress). Nothing is deployed. Every source file is on the team data server.

## Now

| Role | Person | Working on | Since |
|---|---|---|---|
| A: data and science | Joseph, covering for the team owner | F1 data built; next `terrain.py` | Sat 11:00 |
| B: app | Joseph, covering for the team owner | Checking F1 in the browser; next F8 | Sat 11:00 |
| C: story and submission | to assign | | |

## Public link

Not deployed yet.

## Features

Status is one of: not started, in progress, works, works with issues, cut. "Works" means it passed its checks in [SPEC.md](SPEC.md) with real data.

| Feature | Owner | Status | Notes |
|---|---|---|---|
| F14 Mars globe and site picker | A, B | in progress | Works locally: globe, a column and name at each of nine sites, click to fly in, details card with sources, `#site=<id>` links. Not done: not deployed |
| F1 Hero site map | A, B | in progress | Bright Angel built from real data: 25 cm image and terrain tiles, 10.8 MB. Seen in a headless browser screenshot, and by Joseph in his own browser on the dev server at 11:45, who reported it looks good. To fix: the site sits right of the view's centre; the scale bar label overlaps the credit line |
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
| bright-angel | 1 | image and terrain tiles only | no |
| gale-crater | 1 | no | no |
| columbia-hills, meridiani, elysium-planitia, arctic-plain, ares-vallis, chryse-planitia, utopia-planitia | 2 | no | no |

All nine have a config in `sites/` with a cited position, and appear on the globe as "not built yet".

## Broken right now

Nothing recorded.

## Team data server

Set up on 13 November. Reachable from the team owner's laptop and from Joseph's laptop over Tailscale (checked 14 November 11:15: listing, partial reads, about 8.6 MB/s on one 50 MB read). See [../data/AGENTS.md](../data/AGENTS.md).

| Files | State on 14 November, 09:50 UTC |
|---|---|
| Jezero context terrain and image | Complete; sizes match the USGS source |
| Jezero terrain mosaic | Complete; size matches |
| Jezero image mosaic | Complete; size matches |
| Rover feeds | Complete, 5 files; live feeds, so no source size to compare |
| Gale terrain and image | Complete; sizes match |
| Seven other landing sites | Complete: 68 terrain and image files, sizes match the HiRISE archive, plus the 58 image label files |
| Jezero geologic map | Complete; size matches |
| Jezero mineral products | Complete at 09:47 UTC: 690 files, 10,943,277,624 bytes, counted from the laptop over Tailscale |
| Perseverance weather archive | Optional second stage, off |

The first run of the new batch stopped at 02:37 UTC on 14 Nov with 12 problems, all from wrong rows in its download list (4 swapped sizes, 8 wrong file names). The list was corrected and rerun on the server with 0 problems. The mineral list had every size overstated; the server's script was changed to take sizes from the files themselves and the run then finished with 0 problems. Sizes were checked, not checksums.

## Waiting on someone

- The third teammate: install Tailscale, accept the share of the data server, put the address in `.env`, and confirm a file listing loads. Joseph has done this.
- The team: confirm or change the two open proposals in DECISIONS.md (what each link opens on; how AI-written code is acknowledged).
