# pipeline: guide

Scaffold added on Saturday 14 November: every source file exists and holds only its header comment until it is built.

## Purpose

Turns NASA and USGS source files into the small files the app reads. One command builds one site from its config file. A second command builds the global image and the site list for the globe.

## Owner

Role A.

## Commands

Run these inside `pipeline/`. Use a standard Python 3.12 from python.org. The Python that comes with MSYS2 cannot install rasterio.

- Create the Python environment and install: `py -3.12 -m venv .venv`, then `.venv\Scripts\python -m pip install -r requirements.txt`. On macOS or Linux: `python3.12 -m venv .venv`, then `.venv/bin/python -m pip install -r requirements.txt`
- Build a site: `.venv\Scripts\python build_site.py ../sites/<site id>.yaml`. Add `--dry-run` to check the config and print the box without reading or writing. The first build of Bright Angel reads about 190 MB from the team data server in three to four minutes; the cells are then kept in `../data/work/<site id>/` and a rebuild takes about a minute
- Build the approach imagery around every site: `.venv\Scripts\python build_approach.py`, or `--site <site id>` for one site, keeping the others. The first run fetches about 75 tiles per site from Esri's OnMars CTX service and keeps them in `../data/work/approach/`; a rerun takes seconds. It prints a "note:" for any tile the service fails to give, which is left as no data
- Refresh the space-weather snapshot: `.venv\Scripts\python build_space_weather.py`. Run it shortly before the submission so the fallback is fresh
- Build the globe image and site list: `.venv\Scripts\python build_globe.py` Add `--only image` or `--only sites` to build one of the two. The image step fetches 512 tiles from Mars Trek on the first run and keeps them in `../data/work/globe/`. Run the sites step after changing any file in `../sites/`
- Check, the one command that must pass before any push: `.venv\Scripts\python -m pytest -q`, then `.venv\Scripts\python build_site.py ../sites/bright-angel.yaml --dry-run`

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
| `build_site.py` | One command that builds one site from its config: box (any projection, warped), terrain check against the rover, image and terrain tiles (terrain can reach past the box), slope, routing grids, hero scenario, extra coloured layers, geology if prepared, rover layers, photos, `layers.json`, `validation.json`, `site.json`. Builds in `../data/work/<site id>/build.tmp` and moves the folder in. To add: mask, roughness, sky exposure | F1 to F7, F9, F12, F15 |
| `build_globe.py` | Builds what the globe needs: Web Mercator tiles of the Viking colour mosaic with its layer record, one whole-planet overview picture at zoom 3 (`overview` in the record), and `sites.json` from every site config. Assembles in `../data/work/globe-build.tmp` and moves the folder in | F14 |
| `build_approach.py` | Builds the approach imagery: three rings of CTX images (320 km, 40 km, 12 km) around every site, from the CTX global mosaic through Esri's OnMars service, or from a file the site config names under `approach.near` (Bright Angel: the USGS Jezero CTX mosaic). Writes `../app/public/data/approach/` | F14, F1 |
| `build_geology.py` | Turns the USGS geologic map (SIM 3464 geodatabase) into GeoJSON in degrees for one site, in `../data/work/<site id>/geology.geojson`, which `build_site.py` then ships with a legend. Polygons are cut to a 12 km square and kept to 5 decimal places (1.2 MB at Bright Angel). Needs `fiona` (in requirements.txt). Run `python build_geology.py ../sites/bright-angel.yaml`, then `build_site.py`. First run 14 Nov: 75 polygons in 10 units | F2 |
| `test_geology.py` | Tests for the polygon cutting in `build_geology.py`, on made-up rings | |
| `build_space_weather.py` | Saves a snapshot of NASA's notices that forecast a solar eruption reaching Mars, with its fetch time. One request per run | F5 |
| `test_space_weather.py` | Tests for `build_space_weather.py` on made-up notices | |
| `mars.py` | Mars constants and geometry: radius, gravity, sol length, cell spacing, longitude conversion, tile maths | all |
| `test_mars.py` | Tests for `mars.py`, with expected values worked by hand | |
| `config.py` | Reads and checks a site config: identity, position, what data exists, and for a site that can be built its box and sources with their dates and accuracy. The scenario is checked by `scenario.py`, approach sources by `build_approach.py` | all |
| `test_config.py` | Tests for `config.py`; also loads every real config in `../sites/` | |
| `sources.py` | Finds each source file (team data server, then local copy, then original address) and reads only the site's box from it, warping any other projection onto the app's grid | F1, F15 |
| `test_sources.py` | Tests for `sources.py` and for the site tile cutting in `tiles.py`, on made-up fixtures | |
| `mask.py` | Stage 2: finds missing data and seams between source terrain models | F1, F3 |
| `tiles.py` | Stage 3: cuts tiles in the layout MapLibre reads: whole-planet image pyramids, a site's image (WebP) and terrain (PNG) tiles, terrain with a coarser surround eased flat at its edge, terrain with an eased margin for a block with nothing round it (level 2 sites, 400 m), and colour tiles along a ramp | F1, F12, F14, F15 |
| `test_tiles.py` | Tests for `tiles.py` on small made-up fixtures that stay in the test file | |
| `test_terrain.py` | Tests for `terrain.py`, `grids.py` and `vectors.py` on made-up fixtures, with expected values worked by hand | |
| `terrain.py` | Stage 4. Built so far: steepest slope over a baseline of at least 5 m, on the corrected cell spacing. To add: roughness and sky exposure | F2, F3, F5 |
| `grids.py` | Stage 5. Built so far: joins 4 x 4 source cells into a routing cell and writes mean height and steepest slope as raw 32-bit floats, with the grid definition for `site.json`. To add: mask, footing, sky exposure | F3, F4 |
| `vectors.py` | Stage 6. Built so far: the rover's stops and path inside the box as GeoJSON, each with a full layer record, and sol numbers turned into Earth dates. To add: geology and science targets | F2 |
| `weather.py` | Typical weather by Mars month at a site with its own station: Curiosity REMS daily lows, highs, pressure, ultraviolet and sky at Gale, as percentiles with sol counts. Writes `../app/public/data/weather/<site id>.json`. Run `python weather.py gale-crater` | F11 |
| `photos.py` | Stage 7: reads NASA's raw image feed for the left navigation camera and indexes up to six photos for each rover stop in the box. Built | F6 |
| `scenario.py` | The hero scenario: home and science targets placed at rover stops looked up by id in the waypoints file, with reasons and sources, for `site.json` | F3, F7 |
| `validate.py` | Stage 8: checks our terrain against the rover's own measurements. Built: heights and slope at every rover stop in the box, and the reader for the rover's feeds. To add: a route against the rover's path | F1, F9 |
| `records.py` | Stage 9: the layer record check, the JSON writer and `layers.json` | F2, F14 |

## Known issues

- Since 14 Nov, files on other projections (the landing-site terrain models, Phoenix's polar one included) are warped onto the app's grid by GDAL as they are read, and the build output says so. A HiRISE 1 m ortho image borrows its terrain model's georeferencing (`georeferenceFrom: terrain` in the config). Zooms follow each source's detail (`zooms_for` in `build_site.py`).
- A site build used to fail at its last step with "Access is denied" while the app's dev server was running. Since 14 Nov it builds in `../data/work/<site id>/build.tmp` and moves the folder in at the end; if it still fails, stop `npm run dev` and build again.
- The first build of a site with a rover reads about 100 pages of NASA's image feed, two minutes for Bright Angel. The answer is kept in `../data/work/<site id>/photo_feed.json`.
- Missing terrain cells stop a build, because the mask stage is not built. Bright Angel has none.
- The rover's logged heights agree with the terrain to a few centimetres, which suggests they were read from this same terrain model. Treat the height check as a check of position, not of terrain accuracy. Slope against rover tilt is the independent check: at Bright Angel a typical difference of 1.4 degrees over 116 stops.
