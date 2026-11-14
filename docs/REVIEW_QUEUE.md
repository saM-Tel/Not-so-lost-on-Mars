# Review queue

Large bugs, risky areas and optimisation reviews that deserve a careful second look, ideally by a larger model or a person with time. Started on Sat 14 Nov 2026 at the team owner's request.

Add an entry when you find something too big to fix inside your current task. Newest at the top. When an item is fixed, move it to "Done" with the commit. Keep each entry short: what, where, why it matters, what a fix might be.

Severity: **high** breaks a must-have or could show a wrong number; **medium** visibly hurts the demo or speed; **low** tidy-up.

## Open

### From the app review of 14 Nov, about 16:45 (items R1 to R20)

A larger model (Claude Fable) read the app's map, route, safety, time and display-mode code; full text with line numbers in [reviews/2026-11-14-app-review.md](reviews/2026-11-14-app-review.md). It did not read the pipeline, the service worker, `vite.config.ts`, `photos.ts`, `photoStrip.ts`, `layerPanel.ts`, `urlState.ts`, `zoomSelect.ts` or `scaleBar.ts`, and ran nothing. **Fixed items are marked FIXED with their commit and listed under Done.** Work them in this order (the review's fix plan), run `npm run check` after each group, and move each to Done with its commit.

**Group 1, `app/src/map/routeLayer.ts`**
- **R1, FIXED in baa2228 (high, suspected): tether picture may stay stale on 3D ground.** The canvas source's `play()` may not refresh MapLibre's cached terrain textures. Check: at Bright Angel drag "Time since leaving home" past 7 h without moving the map. If the line does not move, clear the render-to-texture cache after drawing (look for `freeRtt` in `app/node_modules/maplibre-gl/src/`), then `map.triggerRepaint()`; use `play(); pause();` instead of pausing on the next render.
- **R2, FIXED in baa2228 (medium): keep-out is re-added above the tether after a restart and forgets the panel's switch and opacity.** In `showKeepOut`, update the existing image source (`updateImage`) and leave the layer alone; add it before `route-tether` the first time.

**Group 2, `app/src/ui/routePanel.ts`**
- **R3, FIXED in baa2228 (high, confirmed): the tether verdict and tablet margin use the quickest way home, not the planned way back.** Use `Math.max(farthest along the out line, farthest along the back line, backS)`; set the tablet alert in the "not enough time" branch too.
- **R4, FIXED in baa2228 (medium): a restart (slope limit, moved rover) leaves the old tether, verdict, table, storm advice and daylight line on screen,** for good if home becomes unusable. One `restart()` that clears all of them and hides the tether until new fields arrive.
- **R5, FIXED in baa2228 (medium): the rover comparison ignores a moved rover; the confidence line hard-codes Bright Angel's "9 in 10 within 4.0 degrees" and "Perseverance".** Skip the comparison when home was moved; read the figures from `loaded.validation` and the name from `loaded.site.mission`, and leave the sentence out when absent (the level 2 sites have no rover check).
- **R6, FIXED in baa2228 (medium): the tablet shows "Working out the walk…" forever after a refused target.** Pass the refusal message to the field view; clear the storm alert when a new target is chosen.
- **R7, FIXED in baa2228 (medium, suspected): the address bar is rewritten on every slider frame;** Safari throws after 100 calls in 30 s, which would stop the tether redrawing. Debounce to 300 ms in a try/catch.
- **R8, FIXED in baa2228 (speed): skip tether redraws when the allowed time has not changed** (with a 1-hour limit it is 3,600 s for the first 7 hours).

**Group 3, layer order (slots)**: `main.ts`, `approach.ts`, `siteLayers.ts`, `overlays.ts`, `routeLayer.ts`
- **R9, FIXED in c9e2a69 (medium): sun shading darkens the analysis layers; the rover-stop circles split the draped layers.** Add hidden anchor layers in `main.ts` after the approach rings (`slot-image`, `slot-shading`, `slot-overlays`, `slot-keep-out`, `slot-tether`, `slot-route`, `slot-points`) and insert every layer before its slot. Target order, bottom to top: globe; rings (all wide, all mid, all near); site image; sun shading; thermal, slope, geology, rover path; keep-out; tether; route lines; rover stops; site columns and pins. Check with `map.getStyle().layers.map(l => l.id)`.
- **R10, FIXED in c9e2a69 (medium to low): sun shading uses Earth-scaled slopes and ignores the Sun's height.** Multiply the shading source's three factors and `baseShift` by `MAPLIBRE_METRES_PER_MARS_METRE`; set `hillshade-method` if the installed style spec has it.
- **R11, FIXED in c9e2a69 (low): rings sorted by site first** (latent: a later site's wide ring could cover an earlier site's finer rings); sort by ring first. **R12, FIXED in c9e2a69 (low, suspected):** rings may appear one zoom late; try layer `minzoom: tiles.minZoom - 1`.

**Group 4, `app/src/ui/modes.ts` and `app/src/style.css`** (check at 360 px and 1,024 px wide)
- **R13, FIXED in 2af8745 (medium): the tablet card covers the walk and the bottom widgets.** After entering tablet mode and resizing, fit the map to the walk with bottom padding the card's height; hide `.earth-link` and `.weather-banner` in tablet mode.
- **R14, FIXED in 2af8745 (low to medium, honesty): the helmet arrow is rotated over a photo whose look direction is not confirmed.** Keep the bearing as text, or a small compass marked N.
- **R15, FIXED in 2af8745 (low): widgets overlap:** the link-to-Earth line sits on the scale bar (move it to `bottom: 96px`); below about 1,120 px the mode switch covers the route card's Hide button (move it to the bottom right there).

**Group 5, `flight.ts`, `tether.ts`, `overlays.ts`**
- **R16, FIXED in 3668b44 (low to medium, suspected): a flight promise can resolve at the start of a flight** when a second site is clicked mid-flight (`moveend` from the stopped flight). Call `flyTo` first, then wait for `moveend`; return at once on the `jumpTo` path.
- **R17, FIXED in 3668b44 (speed): `tetherPicture` allocates per cell.** Inline the four neighbours, write through a `Uint32Array`, reuse buffers; time it with `performance.now()`.
- **R18, FIXED in 3668b44 (speed): the slope picture is built at site open though it starts hidden** (2.4 MB fetch and a PNG encode). Build it when first switched on.

**Small items**
- **R19, FIXED in 2af8745 (low):** problem boxes in `main.ts` never go away, stack, and use a red border for non-danger messages; keep-out also marks no-data cells but its text says only "steeper than"; "before sunset" is printed as a clock, not a duration (`timeSlider.ts`); the tablet's Storm button is outlined red all the time; headers of `routePanel.ts` and `style.css` still say "Still to add" for built things.
- **R20, FIXED in c9e2a69 (speed, later):** rings only for the site in focus (3 sources, not 27; see item 6 below); skip `tidyNames` in `siteMarkers.ts` while markers are hidden.

Not reviewed yet and worth a second review: the pipeline (`build_approach.py`, `sources.py` warping, `tiles.py` terrain easing, `build_site.py`), `app/pwa/sw.js` and `vite.config.ts`, `layerPanel.ts`, `urlState.ts`, `photos.ts`.

### Earlier items

### 10. Features started but blocked on a source or a decision (high to medium)
- **F12 minerals:** Mars Trek does not serve its CRISM mineral layers as tiles. The six CRISM MTRDR products (10.9 GB) are on the server, unprocessed; a person should pick the summary parameters to show (for example the hydrated-mineral ones) and check whether any product covers Bright Angel (77.305 E, 18.497 N).
- **F6 photos by direction of travel:** NASA's feed gives a mast azimuth, but what it is measured from (rover body or north) is not confirmed. Until it is, photos are not chosen by direction.
- **F11 dust devils:** no published dust-devil rate for Jezero has been read. Leave out until one is.
- **F4 energy and oxygen budgets and a reserve:** need sourced suit capacities; oxygen used on a walk is shown (Weir 1949) but not compared with a supply.
- **F7 layer choices in the link:** not built.
- **F16 rover models in 3D:** not started: needs a NASA 3D model file and a 3D library (a new dependency), so it waits for a decision.
- **F16 two walkers:** not built; the rover drop-off (move home) is.
- **Orbiter passes overhead, now F18 in SPEC (14 Nov 19:10):** DSN Now (the link-to-Earth line) shows which orbiters are talking to Earth, not whether one is above the site. A source for passes is now in DATA_CATALOG: JPL Horizons, checked 14 Nov. Still open: which orbiters relay today, the minimum elevation for a link, and what counts as overhead for imaging.
- **F9:** one route against the rover is now shown in the route card as distance driven against distance walked between home and a target (both rover stops). A path-shape comparison is not built.


### 8. Gale crater not built: image dates of the Gale mosaics not found (medium, F15)
- **Where:** `sites/gale-crater.yaml` has no `box` or `sources` yet. The mosaics (`MSL_Gale_DEM_Mosaic_1m_v3.tif`, `MSL_Gale_Orthophoto_Mosaic_25cm_v3.tif`, Calef and Parker 2016) are on the server and on the app's grid, so the pipeline can read them as they are.
- **What:** no file we could read gives the dates of the HiRISE images in the mosaics; the USGS page (https://astrogeology.usgs.gov/search/map/mars_msl_gale_merged_orthophoto_mosaic_25cm) refuses automated reading. Without dates the app hides the layers.
- **Fix:** a person reads the dates on that page (or its PDS label), then copy `bright-angel.yaml`'s build section with the Curiosity waypoints (`msl_curiosity_waypoints.json`) as the rover.

### 9. Level 2 sites: image borrowed georeferencing (medium, check by eye)
- **Where:** the seven level 2 configs, `georeferenceFrom: terrain`.
- **What:** GDAL reads the 1 m ortho JP2's georeferencing differently from its terrain model's label (for Spirit it reports latitude of origin -10 where the terrain says true scale at -10). The two files have the same size and scale, so the image uses the terrain file's. Check in the app that ridges in the image line up with the 3D terrain at each site.

### 7. Geology layer blocked: no vector reader (high, F2 must-have). RESOLVED in 12b95da
- **Resolved:** the team owner installed fiona 1.10.1 at 20:15 (`uv pip`, as this laptop's environment has no pip). `build_geology.py` needed two fixes: the unit layer is `GeoUnits_v1`, and polygons are now cut to the 12 km square (10.9 MB before, 1.2 MB after). Built and shipped at Bright Angel: 75 polygons in 10 units. Not yet looked at in a browser. Text below kept for the record.
- **Where:** the Jezero geologic map (USGS SIM 3464) is an ArcGIS file geodatabase only, no shapefiles (`data/raw/geology/sim3464_database.zip`).
- **What:** the pipeline has no package that reads vector data. Installing `fiona==1.10.1` into `pipeline/.venv` was refused by the AI tool's permission check on 14 Nov, so a person must approve or run it.
- **Fix:** `pipeline\.venv\Scripts\python -m pip install fiona==1.10.1`, add it to `requirements.txt`, then write `build_geology.py` (read the map units in Mars Transverse Mercator, central meridian 77.5 E, reproject to degrees on the Mars sphere, keep units touching the 12 km near ring, colour them with a colour-blind-safe palette with no red, caveat the 100 to 200 m offset). Keep fiona and rasterio in separate processes on Windows: both carry their own GDAL.

### 1. Site terrain floats above flat surroundings (medium, looks wrong on the fly-in) — coded 14 Nov, not yet looked at
- **Where:** `app/src/map/siteLayers.ts` (terrain source and `baseShift`), `pipeline/tiles.py`, `pipeline/build_approach.py`.
- **What:** only the 3 x 3 km box has terrain. Everything around it, including the new approach imagery, sits at height zero. The box is drawn relative to its own lowest point, so in 3D, and even looking straight down on the globe, its edges stand up and look skewed against the CTX imagery around it.
- **Done so far:** `tiles.write_terrain_tiles_with_surround` and `approach.terrain` in `bright-angel.yaml`: a 10 km square of CTX 20 m heights round the box, eased to the box's lowest point over the last 1.5 km. Needs a look in 3D; check the step at the box edge and the slope of the easing.
- **Fix idea (as built):** one terrain pyramid per site that uses the HiRISE heights inside the box and the USGS CTX 20 m terrain (`JEZ_ctx_B_soc_008_DTM_MOLAtopography_DeltaGeoid_20m...`, on the server) around it, both relative to the areoid, with `baseShift` taken from the wider area. Check that the two models agree at the box edge (the HiRISE mosaic sits a median 0.4 m below CTX, per its record). For sites with no CTX terrain, a MOLA-based surround or a feathered edge.

### 2. Murray Lab CTX mosaic dates not confirmed (medium, honesty rule)
- **Where:** `pipeline/build_approach.py`, `global_ctx_record`.
- **What:** the service gives no image dates. The record says "2006 at the earliest" and "before February 2018", from the copy of beta01 dated February 2018 that USGS SIM 3464 ships (`Nili_CTX_Mosaic_Beta01_Feb2018_MTM.tif`). The paper is Dickson and others 2024, doi:10.1029/2024EA003555, which blocks automated reading.
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

### 6. Many map sources for the approach imagery (low, to measure). Addressed by R20 on 14 Nov: rings only for the site in focus, without a profile
- **Where:** `app/src/map/approach.ts`.
- **What:** three raster sources per site, 27 in all. Each is limited to its bounds and zooms, so nothing loads at globe view, but MapLibre still works out tile coverage for each on every frame.
- **Check:** record a performance profile while spinning the globe and while zooming in. If it shows, add rings only for the site in focus.

## Done

### R9, R10, R11, R12, R20 and the zoom 12 glitch: fixed Sat 14 Nov 20:37, commit c9e2a69, team owner with Claude Code

- Zoom 12 glitch (not a review item; seen by the owner): a black band and labels off the ground when zooming in by hand at Bright Angel. MapLibre's globe blends into the flat map between zoom 11 and 12, and the site's terrain was already on. Terrain now switches on from zoom 12.2 and off below 12.0 (`map/siteLayers.ts`). A site chosen by zooming in by hand opens where the camera is, without the app's own flight (`main.ts`).
- R9: new `map/slots.ts`; every layer goes beneath its slot. Rover stops are in the points slot, above the draped layers.
- R10: the shading source's heights are scaled by the radius ratio; `hillshade-method: 'basic'` with intensity 0.5 uses the Sun's height, which the default method ignored. This is why the Sun slider and switch showed no visible change.
- R11: rings sorted by ring, then site. R12: a ring's layer starts one zoom before its source's first zoom (256-pixel tiles).
- R20: `watchApproachRings` keeps only the rings of the site whose wide ring holds the middle of the view; `tidyNames` does not run while markers are hidden.
- How checked: types, 77 unit tests and the production build pass. At 20:50 the team owner confirmed in the browser that the zoom glitch and the Sun shading are fixed. Not checked by eye: ring order and first ring zoom.

### R16, R17, R18: fixed Sat 14 Nov 19:42, commit 3668b44

- R16: travel() in map/flight.ts.
- R17: packed colours and a Uint32Array view in safety/tether.ts.
- R18: empty image source, filled by updateImage on first show, in map/overlays.ts.
- How checked: types, 77 unit tests and the production build pass; the tether picture's six existing tests cover R17's rewrite. R17 was not timed. R18 relies on MapLibre 6.18 accepting an image source with no address, which its source says it does (source/image_source.ts) but which was not tried in a browser: switch Slope on and check it appears.

### R13, R14, R15, R19: fixed Sat 14 Nov 19:39, commit 2af8745

- R13: CSS hides the two bottom widgets in tablet mode; onLayoutChange fits the walk with the card's height as bottom padding.
- R14: the arrow element is hidden.
- R15: .earth-link at bottom 96px; .route-card starts at 52px under 1,120 px wide and 92px under 720 px, in place of moving the mode switch to the bottom right, where the forecast banner is.
- R19: showProblem in main.ts stacks, closes and expires notes; wording and headers corrected.
- How checked: types, 77 unit tests and the production build pass. Layout changes were made from the style sheet alone and have not been seen at any screen width; check at 360 px and 1,024 px.

### R1, R2, R3, R4, R5, R6, R7, R8: fixed Sat 14 Nov 19:37, commit baa2228

- R1: after drawing, release the terrain's cached textures (the call MapLibre makes itself for image sources) and repaint; play then pause, no wait for a render.
- R2: the keep-out image is updated in place; added under the tether the first time.
- R3: new safety/tether.ts walkFarthestFromHomeS, with a test; the tablet alert is set when there is not enough time, too.
- R4: restart() in ui/routePanel.ts; routeLayer.hideTether().
- R5: figures from loaded.validation.slope and loaded.site.mission; an assumed margin is called assumed.
- R6: ModeSwitch.setState takes a message.
- R7: debounced, in a try.
- R8: skipped when fields and allowed time are unchanged.
- How checked: types, 77 unit tests (one new, for R3) and the production build pass. R1 was confirmed by reading MapLibre 6.18's source (webgl/render_to_texture.ts, ui/map.ts), not by eye. None of the eight has been seen in a browser: the scripted browser stalled on the site view all evening. A person should try each.

