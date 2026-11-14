# pipeline: guide

Scaffold added on Saturday 14 November: every source file exists and holds only its header comment until it is built.

## Purpose

Turns NASA and USGS source files into the small files the app reads. One command builds one site from its config file. A second command builds the global image and the site list for the globe.

## Owner

Role A.

## Commands

Run these inside `pipeline/`. Use a standard Python 3.12 from python.org. The Python that comes with MSYS2 cannot install rasterio.

- Create the Python environment and install: `py -3.12 -m venv .venv`, then `.venv\Scripts\python -m pip install -r requirements.txt`. On macOS or Linux: `python3.12 -m venv .venv`, then `.venv/bin/python -m pip install -r requirements.txt`
- Build a site: `.venv\Scripts\python build_site.py ../sites/<site id>.yaml` (not built yet)
- Build the globe image and site list: `.venv\Scripts\python build_globe.py` Add `--only image` or `--only sites` to build one of the two. The image step fetches 512 tiles from Mars Trek on the first run and keeps them in `../data/work/globe/`. Run the sites step after changing any file in `../sites/`
- Check, the one command that must pass before any push: `.venv\Scripts\python -m pytest -q`. A dry run of a site build will be added to it when `build_site.py` exists

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
| `requirements.txt` | Pinned Python packages | |
| `build_site.py` | One command that builds one site from its config: runs every stage in order and writes the site folder | F1 to F6, F9 |
| `build_globe.py` | Builds what the globe needs: Web Mercator tiles of the Viking colour mosaic with its layer record, and `sites.json` from every site config | F14 |
| `mars.py` | Mars constants and geometry: radius, gravity, sol length, cell spacing, longitude conversion, tile maths | all |
| `test_mars.py` | Tests for `mars.py`, with expected values worked by hand | |
| `config.py` | Reads and checks a site config. Built so far: identity, position and what data exists. To add: the box, source files, home and targets | all |
| `test_config.py` | Tests for `config.py`; also loads every real config in `../sites/` | |
| `sources.py` | Finds each source file and reads only the site's box from it | F1 |
| `mask.py` | Stage 2: finds missing data and seams between source terrain models | F1, F3 |
| `tiles.py` | Stage 3: cuts image and terrain tiles in the layout MapLibre reads. Built so far: whole-planet image pyramids | F1, F14 |
| `test_tiles.py` | Tests for `tiles.py` on small made-up fixtures that stay in the test file | |
| `terrain.py` | Stage 4: slope, roughness and sky exposure from terrain heights | F2, F3, F5 |
| `grids.py` | Stage 5: writes the routing grids as raw binary arrays | F3, F4 |
| `vectors.py` | Stage 6: converts geology, the rover path, rover stops and science targets to GeoJSON | F2 |
| `weather.py` | Stage 7: typical weather by local hour for the season, from the weather archive | F11 |
| `photos.py` | Stage 7: index of real rover photos near the route area | F6 |
| `validate.py` | Stage 8: checks our terrain against the rover's own measurements | F1, F9 |
| `records.py` | Stage 9: writes `layers.json` and `site.json`, including file sizes. Built so far: the layer record check and `layers.json` | F2, F14 |

## Known issues

None recorded.
