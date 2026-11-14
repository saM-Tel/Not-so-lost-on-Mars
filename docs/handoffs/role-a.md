# Role A handoff

## Sat 14 Nov 10:01, role A work by the team owner, with Claude Code

Done: `build_globe.py` builds the globe image (Viking colour mosaic, zoom 0 to 5, 13.4 MB, full layer record) and `sites.json` from nine site configs. `mars.py`, `tiles.py`, `config.py`, `records.py` built so far as their headers say. Team data server confirmed complete, including all 690 mineral files.
Not done: `build_site.py` and every site stage. No site is built. The mineral products are downloaded but untouched.
Broken or risky: each landing-site terrain model has its own projection, and Phoenix is polar; the pipeline cannot read them yet (DATA_CATALOG, PITFALLS 4). The model catalogued as Opportunity's landing site does not contain the published landing point. Pathfinder's published landing position is outside its model. InSight's landing position was not found.
Next: build Bright Angel (F1): read a 3 x 3 km window of the Jezero terrain and image mosaics around rover stop RMC 56_0, cut image and terrain tiles, write `site.json`. Settle the grid and terrain-tile parts of DATA_CONTRACT with role B first.
Files: pipeline/*.py, sites/*.yaml, app/public/data/globe/, app/public/data/sites.json
Other roles need to know: B, `sites.json` and `globe/layers.json` are described in DATA_CONTRACT "In use since 14 November". C, the Bright Angel config still needs home, targets and their reasons; the marker stands at the rover stop where Cheyava Falls was cored.
Checks: `.venv\Scripts\python -m pytest -q` passes, 21 tests. `build_globe.py` run with real data. Site positions compared with SITES.md, not yet with Mars Trek by a person.

## 13 Nov 2026, role A, with Claude Code

Done:
- Researched 1 m HiRISE terrain models for seven landing sites (Viking 1, Viking 2, Pathfinder, Spirit, Opportunity, Phoenix, InSight) via the PDS Orbital Data Explorer.
- Found the Jezero geologic map package (USGS SIM 3464) and six MRO CRISM mineral products (~11.2 GB).
- Wrote download manifests: 759 new files, ~28.6 GB, to the team data server.
- Updated DATA_CATALOG, data/AGENTS, STATUS and SITES.

Not done:
- Nothing blocking. The new-batch server prompt has been handed to the server; both downloaders are now running.

Broken or risky:
- CRISM file list is rebuilt on the server from the PDS query; not yet verified against live URLs. Watch for FAIL/WARN in the new-batch log once CRISM starts.

Next:
- Confirm both units (`marsdata-download`, `marsdata-new-batch`) finish; check the new-batch log for FAIL/WARN on Saturday morning.

Files:
- docs/DATA_CATALOG.md, data/AGENTS.md, docs/STATUS.md, docs/SITES.md, docs/REFERENCES.md, docs/AI_USE.md

Other roles need to know:
- The team data server gains ~28.6 GB of new folders (raw/<site>/, raw/jezero/geology/, raw/jezero/crism/).

Checks:
- Manifest sizes computed from PDS KBytes; not yet downloaded.
## Sat 14 Nov 10:16, role A work by the team owner, with Claude Code

Done: F1 pipeline code written (uncommitted): `sources.py` (3x3 km `/vsicurl/` window reader + `.npy` cache), `tiles.py` (site WebP z12-18 + Mapbox PNG z11-15), `validate.py` (rover `elev_geoid` check), `config.py`, `build_site.py`, and `sites/bright-angel.yaml`.
Not done: Bright Angel site build (`app/public/data/bright-angel/` does not exist yet); `mask.py`, `terrain.py` (slope/roughness/sky), `grids.py`, `vectors.py`, `weather.py`, `photos.py`; `docs/STATUS.md` and `docs/AI_USE.md` updates.
Broken or risky: a background `build_site.py` started at 10:11 was using older code without `terrainHeightM` in `site.json` or the `halved()` memory fix, and had not finished reading the 25 cm ortho image. Terrain heights match 116 rover stops to 0.03 m median, likely meaning rover heights came from this same DTM (checks position, not accuracy).
Next: check/kill any running `build_site.py` process, run `.venv\Scripts\python -u build_site.py ../sites/bright-angel.yaml` (terrain is already cached in `data/work/bright-angel/`), then commit pipeline + `sites/bright-angel.yaml` + `docs/DATA_CONTRACT.md` updates.
Files: pipeline/sources.py, tiles.py, validate.py, config.py, build_site.py, test_sources.py, pipeline/AGENTS.md, sites/bright-angel.yaml, sites/AGENTS.md, docs/DATA_CONTRACT.md
Other roles need to know: `site.json` now includes `terrainHeightM` (`lowest`, `highest`, `atCentre`). Rover waypoint feeds are cached locally in `data/raw/feeds/`.
Checks: `.venv\Scripts\python -m pytest -q` passes (32 tests); `build_site.py ../sites/bright-angel.yaml --dry-run` passes. Full site build incomplete.