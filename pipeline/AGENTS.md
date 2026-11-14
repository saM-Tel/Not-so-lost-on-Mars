# pipeline: guide

Prepared 13 November 2026, before the event, as planning. This folder holds only guide files until 09:00 Saturday.

## Purpose

Turns NASA and USGS source files into the small files the app reads. One command builds one site from its config file.

## Owner

Role A.

## Commands

To be set in the first hour and written here:

- Create the Python environment and install:
- Build a site:
- Check (tests and a dry run), the one command that must pass before any push:

## Reads and writes

- Reads site configs from `../sites/`.
- Reads source files by address, fetching only the site's box where the file allows it. It tries the team data server first, then a local copy in `../data/raw/<site>/`, then the original NASA or USGS address. See [../data/AGENTS.md](../data/AGENTS.md).
- Takes the server address from an ignored `.env` file. Runs correctly with no server set.
- Prints which source each file came from.
- Writes working files to `../data/work/<site>/`.
- Writes finished outputs to `../app/public/data/<site>/`, exactly as [../docs/DATA_CONTRACT.md](../docs/DATA_CONTRACT.md) describes.

## Proposed stages

1. Fetch or window-read the terrain and image files for the site's box
2. Mask missing data and seams
3. Cut image and terrain tiles
4. Derive slope, roughness and sky exposure
5. Build the routing grids
6. Convert vectors: geology, rover path, stops, targets
7. Build weather tables and the photo index
8. Run validation against rover measurements
9. Write `layers.json` and `site.json`, including sizes

## Rules for this folder

- A build is repeatable: same config, same outputs. No manual steps.
- Print the box that was built, in the app's coordinate convention, so a person can compare it with Mars Trek.
- Cells are narrower east to west than north to south at the site. Use the corrected spacing in every slope and distance.
- Measure slope over at least 5 m, and record the baseline in the layer record.
- Detect the no-data value before any calculation.
- Every output layer gets a full record: mission, instrument, product, dates, detail, accuracy, grade, caveats, credit. Take dates and accuracy from the product itself. Leave a field marked missing if you cannot find it; do not guess.
- Stay inside the size budget in [../data/AGENTS.md](../data/AGENTS.md). Print the total at the end of a build.
- Write to a temporary folder and rename when complete, so the app never sees half a site.
- Never write into `data/raw/` except to download, and never write to the team data server from the pipeline.
- Read sections 3, 4, 5, 8 and 9 of [../docs/PITFALLS.md](../docs/PITFALLS.md) before starting.

## File index

Add a row when you add a file. Remove it when you delete one.

| File | What it does | Feature |
|---|---|---|
| | | |

## Known issues

None recorded.
