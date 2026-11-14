# Review queue

Large bugs, risky areas and optimisation reviews that deserve a careful second look, ideally by a larger model or a person with time. Started on Sat 14 Nov 2026 at the team owner's request.

Add an entry when you find something too big to fix inside your current task. Newest at the top. When an item is fixed, move it to "Done" with the commit. Keep each entry short: what, where, why it matters, what a fix might be.

Severity: **high** breaks a must-have or could show a wrong number; **medium** visibly hurts the demo or speed; **low** tidy-up.

## Open

### 1. Site terrain floats above flat surroundings (medium, looks wrong on the fly-in)
- **Where:** `app/src/map/siteLayers.ts` (terrain source and `baseShift`), `pipeline/tiles.py`, `pipeline/build_approach.py`.
- **What:** only the 3 x 3 km box has terrain. Everything around it, including the new approach imagery, sits at height zero. The box is drawn relative to its own lowest point, so in 3D, and even looking straight down on the globe, its edges stand up and look skewed against the CTX imagery around it.
- **Fix idea:** one terrain pyramid per site that uses the HiRISE heights inside the box and the USGS CTX 20 m terrain (`JEZ_ctx_B_soc_008_DTM_MOLAtopography_DeltaGeoid_20m...`, on the server) around it, both relative to the areoid, with `baseShift` taken from the wider area. Check that the two models agree at the box edge (the HiRISE mosaic sits a median 0.4 m below CTX, per its record). For sites with no CTX terrain, a MOLA-based surround or a feathered edge.

### 2. Murray Lab CTX mosaic dates not confirmed (medium, honesty rule)
- **Where:** `pipeline/build_approach.py`, `global_ctx_record`.
- **What:** the service gives no image dates. The record says "2006 at the earliest" and "not stated by the service" for the end. The paper is Dickson and others 2024, doi:10.1029/2024EA003555, which blocks automated reading.
- **Fix:** a person reads the paper or the Murray Lab page (https://murray-lab.caltech.edu/CTX/) and puts the image date range and the beta01 release date into the record and into REFERENCES.

### 3. Approach imagery: Esri service is flaky (low)
- **Where:** `pipeline/build_approach.py`, `fetch_esri_tile`.
- **What:** Esri's OnMars CTX service sometimes answers 500 or sends cut-short PNG files. Tiles that fail the same way every time are left as no data and listed in the build output. Re-running later may fill them.
- **Check:** look at the build output for "note:" lines; delete `data/work/approach/esri-ctx/**/*.unavailable` and `*.damaged` and rebuild before the submission.

### 4. Tether picture is rebuilt on the main thread on every slider step (low to medium, smoothness)
- **Where:** `app/src/safety/tether.ts` `tetherPicture`, called from `app/src/ui/routePanel.ts` `drawTether`.
- **What:** about 593,000 cells, three passes, on each slider step (one per animation frame). The PNG encode that used to follow it is gone (now a canvas source), so this is the main remaining cost.
- **Fix idea:** compute in the route worker and transfer the bytes, or work out edge cells once per walk-back limit and only re-threshold the dimmed area.

### 5. First load size (medium, speed on the public link)
- **Where:** `app/dist/assets/index-*.js` is 1.13 MB (312 kB gzip), most of it MapLibre; the MapLibre worker is another 520 kB.
- **What:** fine on a laptop, slow on a phone over mobile data. The service worker now keeps everything after the first visit.
- **Fix idea:** check that GitHub Pages serves the worker gzip-compressed; lazy-load the route and photo code until a site is opened; consider lowering the site image to zoom 17 outside the hero area.

### 6. Many map sources for the approach imagery (low, to measure)
- **Where:** `app/src/map/approach.ts`.
- **What:** three raster sources per site, 27 in all. Each is limited to its bounds and zooms, so nothing loads at globe view, but MapLibre still works out tile coverage for each on every frame.
- **Check:** record a performance profile while spinning the globe and while zooming in. If it shows, add rings only for the site in focus.

## Done

None yet.
