# Not so lost on Mars: battle plan

Prepared on the evening of Friday 13 November 2026, the day before the hackathon. This is research and planning only. No project code, data processing or submission text was produced before the start.

Challenge: Interplanetary Survival Guide: Martian Map (NASA Space Apps 2026, Universal Event). Team of three.

## 1. The plan in one minute

We build **Tether** (working name): a web app that gives a Mars astronaut a 1-metre-scale layered map of one real place, plans a walking route a suited human can actually do, and shows live how far they can go and still get home.

Most teams in this challenge will overlay Mars Trek tiles on a web map and draw a route by hand. We win by doing six things they will not:

1. **Hyperlocal, not regional.** The challenge statement says existing tools "are built for regional and global views rather than the hyperlocalized areas astronauts will target". We work at 25 cm imagery and 1 m terrain over a 3 × 3 km site.
2. **A real route planner.** Routes come from a physics-based walking-effort model on real terrain, not a hand-drawn line.
3. **A safety envelope.** One computation gives the energy and time to get home from every point on the map. The map shows the boundary you must not cross with the consumables you have left. This is the "tether".
4. **Proof it is right.** We check our terrain against Perseverance's own measured tilt and elevation at its 708 logged stops, and compare our routes with the path the rover's drivers chose.
5. **Dates and doubt on everything.** Every layer shows its mission, date and accuracy. Every prediction shows a range, and safety limits use the cautious end. The standard is in [CONFIDENCE.md](CONFIDENCE.md).
6. **Any site, honestly labelled.** Every NASA landing site is in the app with a visible readiness level. Full walking plans appear only where metre-scale terrain exists. See [SITES.md](SITES.md).

Hero site: **Bright Angel in Neretva Vallis, Jezero crater**, where Perseverance found the "Cheyava Falls" rock with a potential biosignature (announced September 2025). Mars Sample Return was effectively cancelled in January 2026, so the story writes itself: a rover found the most interesting rock on Mars and cannot bring it home; a human geologist can walk up to it.

## 2. Rules and deadlines

| Item | What we know | Confidence |
|---|---|---|
| Hackathon window | Saturday 14 Nov 09:00 to Sunday 15 Nov 23:59. For the Universal Event the times follow the local time of the Team Owner's area of residence | Confirmed in the Project Submission Guide |
| Starting early | The official FAQ says teams "are not allowed to begin working on the challenges prior to the hackathon" | From a search excerpt of the FAQ; read the full answer yourselves |
| Judging criteria | Impact, Creativity, Validity, Relevance, Presentation, each scored 1 to 5. Validity includes usability. Relevance asks for NASA data "as a core component". Presentation is scored from the demo and the full project | Confirmed in the Judging and Awards Guide |
| Demo | A video of at most 30 seconds, or a slide deck of at most 7 slides including title and intro. Hosted externally on a public link that needs no login. English, or English subtitles on a video. **Going over either limit makes the project ineligible for Global Judging** | Confirmed in both guides |
| Universal Event eligibility | Two to six team members, all listed on the team's Members tab, all with the same event choice. Nobody can be added after submission closes | Confirmed in the Judging and Awards Guide |
| Originality | A checkbox confirms the work is original and that all external resources, "including code, text and images (even if they are open source or freely available)", are listed in the References field | Confirmed |
| AI use | Allowed, and the form asks how it was used. The guide says AI "should not be used to come up with your idea of how to solve the challenge". AI-made images and video need a visible watermark. AI-made audio, **code and data** "must acknowledge" it "in descriptive text and metadata". Generated content may not use NASA logos, flags or mission identifiers. The answer on the form is not shown to judges, but judges see the markers inside the project | Confirmed in the Project Submission Guide |
| Results | Global Nominees 3 Dec 2026, Global Finalists and Honorable Mentions 17 Dec 2026, Global Winners 26 Jan 2027 | Confirmed in the Judging and Awards Guide |
| Other limits | No image, video, audio or likeness of anyone under 18 in the demo or project. At least one NASA dataset or resource is needed for a Global Award. Teams are reviewed under NASA's rule on bilateral activity with China or Chinese-owned entities | Confirmed in the guides |

Both guides, dated 13 November 2026, were read on 14 November from PDF copies the team owner saved, and the table above was corrected from them. The website still cannot be opened from the lead machine (certificate error). The participant FAQ and the terms and conditions have not been read; the rule about not starting early comes from the FAQ. The submission fields and the award names are in [DECISIONS.md](DECISIONS.md) and [SUBMISSION_CHECKLIST.md](SUBMISSION_CHECKLIST.md).

### What this means for tonight

The "no early work" rule is the reason nothing gets built, committed or pushed before 09:00. Our repository is the "final project" link, so its history is part of what judges can see. It should show the truth: work started at 09:00 on Saturday.

Allowed tonight: reading this plan, reading the official guides, choosing roles, installing tools, creating accounts, setting up the team data server.
Not tonight: project code, data processing, submission text, video.

The team owner decided to download the public source files to the team data server tonight, because the download is slow. The files are not opened or processed until 09:00. This is recorded in [DECISIONS.md](DECISIONS.md).

## 3. How we score on each criterion

| Criterion | What judges look for | How Tether scores |
|---|---|---|
| Impact | Size of the problem, who benefits | Astronaut safety is NASA's stated first priority. The same engine works for any site with terrain data, including the Moon |
| Creativity | Novel approach | The safe-return envelope and the storm-shelter decision are not in Mars Trek or any other public Mars map |
| Validity | Scientifically sound, feasible, usable | Published walking-effort model, measured radiation numbers, and validation against rover data, with stated limits |
| Relevance | Fits the challenge; NASA data is the core, "rather than a superficial addition" | Eight data types from seven missions, each of which changes the route or the safety answer |
| Presentation | Demo and project page | A working public app, a 30-second video cut from real use, and a project page written for a judge with two minutes |

The challenge page lists five resources. We use four directly (Mars Trek, the USGS geologic mapping programme, the Perseverance raw image gallery, and the Curiosity route map as the design reference) and say so on the project page.

## 4. The product

### User and mission

The user is a crew member on a surface excursion. A pressurised rover has parked at a trailhead that Perseverance has already driven over. The Marswalk is the 1 to 3 km round trip on foot from that rover. The rover is "home" for the tether.

- **EVA-1 Cheyava Falls (hero).** Walk from the trailhead in Neretva Vallis to the Bright Angel outcrops, examine the leopard-spot rocks in person, sample context rocks the rover could not reach, and return. The terrain has sand ripples, a boulder field and channel walls, so the hazards are real.
- **EVA-2 Three Forks depot (stretch).** Recover the ten sample tubes Perseverance left on the surface as a backup cache.

### Features

1. **Layered map, 2D and 3D.** Imagery, slope, footing, geology, minerals, thermal, rover path, with opacity controls and a legend that says which mission each layer comes from.
2. **Route planner.** Click science targets. The app returns the least-effort safe route with distance, time, energy, oxygen used, radiation dose and an elevation profile.
3. **The tether.** A boundary on the map: inside it you can still walk home with reserve. It shrinks as time passes or as you change the suit settings. A turnaround warning fires when the planned route crosses it.
4. **Space weather and storm mode.** A banner shows NASA's current forecast of solar eruptions heading for Mars. Storm mode compares "return to the rover" with "shelter against terrain" and routes to the better one. A replay of the 20 May 2024 storm shows it working.
5. **What you will see.** At points along the route, real Perseverance photographs taken at that spot, facing the direction of travel.
6. **Three display modes of the same app.** Habitat planner (desktop), field tablet (large glove-friendly controls), and a helmet display concept drawn over a real panorama.
7. **Dates and confidence everywhere.** An information card for each layer, three cases for each prediction, and a confidence line under each route.
8. **Site picker.** A Mars overview with every NASA landing site and what data exists there.

Acceptance checks for each feature are in [SPEC.md](SPEC.md).

### Honest limits we state up front

- Radiation barely varies across a 3 km site. Curiosity measured only a 4% drop in dose when a butte blocked 19% of the sky. So we do not draw a dramatic radiation heat map. We show sky exposure (exact, from terrain), cumulative dose per route, and the response to a storm. The main storm response is to go home; terrain shelter is the fallback.
- A forecast eruption arrival is an advisory, not a dose measurement.
- Jezero has no radiation instrument. We use Curiosity's measurements from Gale crater, adjusted for altitude, and label it as a model.
- Thermal data is 100 m per pixel, so it is context, not hyperlocal.

## 5. Data

All of these responded when tested on 13 November unless marked otherwise. Full addresses, dates, accuracy and a ranked list of extra resources are in [DATA_CATALOG.md](DATA_CATALOG.md).

| Data type | Source and mission | Resolution | Used for | Access |
|---|---|---|---|---|
| Optical | HiRISE orthomosaic, Jezero (MRO), USGS | 25 cm | Base map | GeoTIFF, 7.4 GB, supports partial reads. Also Mars Trek tiles to zoom 17 |
| Optical context | CTX mosaic (MRO) | 6 m | Wider view | GeoTIFF, 36 MB |
| Topographic | HiRISE terrain mosaic, Jezero (MRO), USGS | 1 m | Slope, 3D, routing, sky view, shadows | GeoTIFF, 1.8 GB, supports partial reads |
| Topographic context | CTX terrain (MRO) | 20 m | Fallback terrain | GeoTIFF, 10 MB |
| Geologic | USGS SIM 3464, Sun and Stack 2020 | 1:75,000 | Rock units, science targets | File geodatabase, 349 MB zip. Offset 100 to 200 m from the controlled mosaic; needs a manual shift |
| Spectral | CRISM map-projected products (MRO) | 18 m | Clay and carbonate targets | 6 products cover the site, via the PDS ODE search service |
| Thermal | THEMIS night infrared (Mars Odyssey), TES thermal inertia (MGS) | 100 m and coarser | Loose sand versus rock | Mars Trek tiles |
| In-situ path | Perseverance waypoints and traverse (Mars 2020) | 708 stops to sol 2022 | Proven ground, validation, trailhead | JSON, readable from a browser |
| In-situ imagery | Perseverance raw images (Mars 2020) | Latest sol 2031 | Point-of-view photos | JSON feed with site, drive and camera pointing |
| Atmospheric | MEDA weather station (Mars 2020) | Per sol | Best time of day, dust devils | PDS archive, files by sol |
| Radiation | RAD (Curiosity), published values | n/a | Dose rate, storm replay | Papers; raw data at PDS if time allows |
| Space weather | NASA DONKI solar-wind simulations | Live | Storm banner | JSON. 26 of 91 runs since 1 October list Mars as a target; one predicted arrival at Mars on 13 Nov 12:00 UTC |

Things that did not work:

- The Perseverance weather feed on mars.nasa.gov stops at sol 1133 (April 2024). Use the MEDA archive.
- The panorama files named inside the waypoint data return "forbidden". Use the raw image feed.
- The demo key for NASA's API is limited to about 30 requests an hour. Get a free personal key and save a snapshot as a fallback.

Second and third sites, if we get that far: Three Forks uses the same Jezero files. Gale crater has a 1 m terrain file (3.9 GB), a 25 cm image file (24 GB), Curiosity waypoints to sol 5070, and a daily weather feed to August 2026.

## 6. Architecture

```
pipeline/  (Python)                      app/  (TypeScript, static site)
  read a 3 x 3 km window of each file      MapLibre GL JS: 2D map and 3D terrain
  -> image tiles                           layer panel, legend, mission credits
  -> terrain tiles                         route planner in a Web Worker
  -> slope, roughness, sky view            tether contour, suit settings
  -> cost grid (2 m, binary)               storm mode, time-of-day slider
  -> geology and waypoints as GeoJSON      tablet and helmet-display modes
  -> weather tables as JSON
        |                                        ^
        +------ static files in app/public ------+
                 hosted on GitHub Pages
```

- **No server.** Everything is static files, so the public link cannot go down during judging.
- **One site, one config file.** `pipeline/build_site.py sites/bright_angel.yaml`. A second site is another config, not more code.
- **Routing in the browser.** A 2 m grid over 3 km is 1,500 × 1,500 cells. A* for a route and one Dijkstra pass for cost-to-home both fit in a Web Worker in a few seconds.
- **Python tools.** rasterio, numpy, scipy, pyogrio, Pillow. GDAL is not installed on the lead machine; the rasterio package brings its own.

### Three traps to avoid

1. **Pixels are not square on the ground.** The USGS files use an equirectangular grid with its true scale at the equator. At 18.45° north, one pixel is 1 m north to south but about 0.949 m east to west. Slope and distance must use the corrected spacing.
2. **MapLibre assumes Earth.** We feed it Mars longitude and latitude. Its scale bar and terrain height will be wrong by the ratio of the radii, about 1.88. Set terrain exaggeration to 1.88, hide the built-in scale bar, and compute every distance in our own code using a Mars radius of 3,396.19 km.
3. **Trek tiles are not Web Mercator.** They cannot go straight into MapLibre. Cut our own tiles for the site; keep Trek for a small context inset or as the imagery fallback.

## 7. The science models

Each model is small, cited, and has its settings exposed in the app.

### Walking speed and effort

The published approach is the one in MIT's SEXTANT traverse planner, used in NASA's BASALT field tests. Speed depends on slope and comes from Apollo data (Marquez and Cummings 2008). Metabolic rate comes from a load-carrying model for slopes (Santee and others 2001) with Mars gravity.

The equations below are from memory. **Check them against the papers before coding.**

```
speed v (m/s), slope a (degrees, positive uphill)
  a < -20        : 0.05
  -20 <= a < -10 : 0.095a + 1.95
  -10 <= a < 0   : 0.06a + 1.6
  0 <= a < 6     : -0.2a + 1.6
  6 <= a < 15    : -0.039a + 0.634
  a >= 15        : 0.05

metabolic rate W (watts), m = astronaut + suit mass (kg), g = 3.71
  level    = (3.28m + 71.1)(0.661 v cos a + 0.115)
  uphill   = 3.5 m g v sin a
  downhill = 2.4 m g v sin a x 0.3^(|a|/7.65)
```

Cost of moving between cells is energy = rate × distance / speed. It differs uphill and downhill, so the route out and the route home are computed separately. Add a multiplier for footing (sand, ripples, rubble) and block cells steeper than a set limit (default 20°).

### Consumables and the tether

Budget = usable energy and time for the suit, minus a reserve. Convert energy to oxygen at roughly 14.6 MJ per kg. One Dijkstra pass outward from home, using the return-direction cost, gives cost-to-home for every cell. The tether is the contour where cost-to-home equals what is left.

### Radiation

- Baseline: 0.21 mGy per day absorbed dose and about 0.67 mSv per day dose equivalent at Gale (Hassler and others 2014). One search result suggested the paper itself gives a slightly different dose-equivalent figure; check.
- Terrain shielding: 19% of sky blocked gave a 4% lower dose (Ehresmann and others 2021); a companion paper gives 5 ± 1% (Guo and others 2021). Sky view comes from the terrain model.
- Storm replay: the 20 May 2024 event delivered about 8,100 µGy at Curiosity, the largest it has recorded. That is roughly a month of normal dose in hours.

### Weather and light

- From the MEDA archive: temperature, wind, pressure and ultraviolet by local time of day, for the current season.
- Dust devils: about 4.9 vortices per sol at Jezero, peaking near noon, about one in five carrying dust (Hueso and others 2023).
- Sun position from NASA's Mars24 algorithm (Allison and McEwen 2000), used to draw shadows for a chosen time.

### Validation

| Check | Data | What we report |
|---|---|---|
| Terrain slope | Rover tilt at 708 stops | Correlation and typical error |
| Terrain height | Rover elevation at 708 stops | Typical error in metres |
| Route choice | Rover's actual path between two stops | Overlay, and whether we avoid what the drivers avoided |

These three figures go on the project page. They cost about an hour and are the strongest evidence for Validity.

## 8. Scope

The feature numbers match [SPEC.md](SPEC.md).

**Must have (done by Saturday 23:00)**

- F14. Mars globe with a marker at every NASA landing site; click to fly in (moved up and built first; decided 14 November)
- F1. Hero site with 25 cm imagery and 3D terrain
- F2. Layer panel with an information card per layer: slope, keep-out areas, geology, rover path
- F3. Route planner with three-case statistics and elevation profile
- F4. Tether with suit settings
- F5. Dose per route and the live space-weather banner
- F6. Point-of-view photos along the route
- F7. Opening state that explains itself, and a shareable link
- F8. Public link, public repository, README

**Should have (Sunday 12:00)**

- F9. Validation figures
- F10. Storm mode with the May 2024 replay
- F11. Time-of-day slider with typical weather and shadows
- F12. Thermal and mineral layers
- F13. Tablet and helmet-display modes

**Stretch**

- F15. More sites, in this order: Three Forks, Gale boxwork, then automatic builds of Columbia Hills, Endeavour and InSight
- F16. Two-person or rover-assisted routes, route export, live link-to-Earth indicator, rover models in 3D

### Cut lines

| If this happens | Do this |
|---|---|
| No map on screen by Saturday 15:00 | Drop 3D; 2D only |
| Partial file reads are too slow | Download the 1.8 GB terrain file in full; take imagery from Trek tiles |
| Router not working by Saturday 21:00 | Straight segments with a slope check, plus one precomputed route |
| Tether not working by Sunday 10:00 | Replace with a simple range ring |
| Geology offset cannot be fixed in 30 minutes | Show it at low opacity with a stated caveat |
| Mineral products are awkward to georeference | Use the Trek mineral detection layer |

## 9. Roles

Assign these tonight. Each role has one owner; everyone helps everywhere.

| Role | Owns | First task at 09:00 |
|---|---|---|
| A: Data and science | Pipeline, terrain products, cost grid, radiation, weather tables, validation | Read a window of the terrain file and confirm it covers Bright Angel |
| B: App | Map, layers, route worker, tether, display modes, deployment | Scaffold the app and get a blank page live on GitHub Pages |
| C: Story and submission | Mission design, targets, interface copy, photos, video, project page, references, AI log, testing | Open the submission form, list every field, start the references and AI log |

## 10. Schedule

All times local. Five-minute check-in at every milestone.

| When | Goal | A | B | C |
|---|---|---|---|---|
| Sat 09:00 | Kick-off | First commit, repository layout, confirm decisions in section 13 | | |
| Sat 09:30 to 13:00 | Map on screen | Image and terrain tiles, slope | App shell, base map, layer panel, 3D | Mission spec, target coordinates, wireframes |
| **Sat 13:00** | **M1: site visible in 2D and 3D, deployed** | | | |
| Sat 14:00 to 18:00 | Route | Cost grid, keep-outs, validation script | Route worker, click targets, statistics, profile | Geology layer, target cards, photo feed |
| **Sat 18:00** | **M2: click two points, get a route** | | | |
| Sat 19:00 to 23:00 | Tether | Cost-to-home, consumables, dose, sky view | Tether contour, suit panel | Space-weather feed, weather tables, first screen recordings |
| **Sat 23:00** | **M3: tether works. Record a backup video now** | | | |
| Sat 00:00 to 07:00 | Sleep | | | |
| Sun 08:00 to 12:00 | Storm, layers, sites | Shadows, thermal, minerals; then build further sites with the pipeline | Storm mode, time slider, tablet and helmet modes, site picker | Project page draft, validation write-up |
| **Sun 12:00** | **M4: feature freeze** | | | |
| Sun 13:00 to 17:00 | Polish | Figures, README science section | Bug fixes, three-device test, loading speed | Project page, references, AI disclosure |
| Sun 17:00 to 19:30 | Video | Review | Capture | Edit, subtitles, upload |
| Sun 19:30 to 21:00 | Submission | All three proofread; open every link in a private window | | |
| **Sun 21:00** | **Submit** | | | |
| Sun 21:00 to 23:00 | Typos only. Stop at 23:00 | | | |

The backup video on Saturday night matters. If Sunday goes badly we still have a complete, honest submission.

## 11. Submission package

### Video, 30 seconds

| Time | Picture | Words on screen |
|---|---|---|
| 0 to 4 s | Real Perseverance photo of Bright Angel | A rover found a possible sign of ancient life here. It cannot bring it home. |
| 4 to 9 s | 3D fly-in; layers switch on one by one | Seven NASA missions. One map. One-metre detail. |
| 9 to 15 s | Click targets; route bends round sand and boulders; numbers tick | A route a suited human can walk. |
| 15 to 21 s | Tether boundary shrinking | How far you can go and still get home. |
| 21 to 26 s | Storm alert; route snaps back to the rover | When the Sun turns, the fastest way to shelter. |
| 26 to 30 s | Helmet display over a real panorama; name and link | Tether. Not so lost on Mars. |

Use real NASA imagery only, credited. No AI-generated pictures and no NASA logo.

### Project page

Lead with what it is, who it is for, and the link. Then: the problem in the challenge's own words, the five features, the data table with missions, the validation figures, the limits, what comes next. Close with references and the AI disclosure.

### Records to keep from 09:00

- `docs/REFERENCES.md`: every dataset, paper, library and image, with links.
- `docs/AI_USE.md`: which AI tools we used, for what, and what we did ourselves.

## 12. Risks

| Risk | Likelihood | Response |
|---|---|---|
| Large files slow to read | Medium | Start the terrain download at 09:00 in the background as insurance |
| Three people edit the same files | Medium | Small commits, pull before push, one owner per folder |
| Live feeds fail during judging | Medium | Ship a saved snapshot of every feed; try live first |
| The app is slow on a judge's laptop | Medium | Test on the weakest machine we have; cap tile sizes |
| Submission site is overloaded near the deadline | High | Submit at 21:00, not 23:50 |
| Models questioned by an expert judge | Low | Settings are visible, sources cited, limits stated |

## 13. Decisions to make tonight

1. **Site.** Recommended: Bright Angel as hero, Three Forks second, Gale third. The alternative is Gale boxwork as hero, which matches the example in the challenge and has radiation measured on site, but many teams will pick it.
2. **Name.** Tether is a working name. Alternatives: Homeward, Lifeline.
3. **Roles.** Who takes A, B and C.
4. **Video or slides.** Recommended: video, with slides as the fallback.
5. **How many sites.** Recommended: hero first, then the site picker, then further sites only after Saturday 23:00.

Record the outcomes in [DECISIONS.md](DECISIONS.md).

## 14. Tonight's checklist

- [ ] Everyone reads this plan
- [ ] Someone reads the Project Submission Guide and the Judging and Awards Guide and corrects section 2
- [ ] All three of us appear on the team's Members tab with the Universal Event selected
- [ ] Everyone has push access to the repository
- [ ] Node 20 or later, Python 3.12, and git installed on every machine
- [ ] A free NASA API key each
- [ ] An account that can host a public video, and a screen recorder that works
- [ ] Sleep

## 15. Documents

| File | Purpose |
|---|---|
| [../AGENTS.md](../AGENTS.md) | The brief every AI assistant and new teammate reads first |
| [STATUS.md](STATUS.md), `handoffs/` | What works now and what the last session left |
| [WORKFLOW.md](WORKFLOW.md) | How three people and their AI tools hand work over |
| [DATA_CONTRACT.md](DATA_CONTRACT.md) | The shape of the files that pass from the pipeline to the app |
| [SPEC.md](SPEC.md) | Features, displays and predictions with acceptance checks |
| [CONFIDENCE.md](CONFIDENCE.md) | How dates, accuracy and ranges are recorded and shown |
| [DATA_CATALOG.md](DATA_CATALOG.md) | Every data source, with dates, accuracy and extra resources |
| [SITES.md](SITES.md) | Which sites are possible and at what quality |
| [PITFALLS.md](PITFALLS.md) | Misreadings and problems to avoid |
| [DECISIONS.md](DECISIONS.md) | What the team has settled and what is open |
| [SUBMISSION_CHECKLIST.md](SUBMISSION_CHECKLIST.md) | Sunday's list |
| [REFERENCES.md](REFERENCES.md), [AI_USE.md](AI_USE.md) | Running records for the submission |

## 16. Sources

The maintained list is [REFERENCES.md](REFERENCES.md). The list below is the snapshot from planning.

Rules and judging
- Space Apps participant FAQ: https://www.spaceappschallenge.org/resources/participant-faqs/
- Judging and Awards Guide: https://www.spaceappschallenge.org/resources/judging-awards-guide/
- Project Submission Guide: https://www.spaceappschallenge.org/resources/project-submission-guide/
- Organiser answer on submission times: https://github.com/nasa/spaceapps/discussions/1788

Data
- Mars Trek tile services: https://trek.nasa.gov/tiles/apidoc/trekAPI.html?body=mars
- Jezero HiRISE terrain and image mosaics (USGS): https://astrogeology.usgs.gov/search/map/mars-2020-jezero-crater-landing-site-products
- Terrain file: https://planetarymaps.usgs.gov/mosaic/mars2020_trn/HiRISE/JEZ_hirise_soc_006_DTM_MOLAtopography_DeltaGeoid_1m_Eqc_latTs0_lon0_blend40.tif
- Image file: https://planetarymaps.usgs.gov/mosaic/mars2020_trn/HiRISE/JEZ_hirise_soc_006_orthoMosaic_25cm_Eqc_latTs0_lon0_first.tif
- USGS SIM 3464 geologic map: https://pubs.usgs.gov/publication/sim3464
- Perseverance waypoints: https://mars.nasa.gov/mmgis-maps/M20/Layers/json/M20_waypoints.json
- Perseverance traverse: https://mars.nasa.gov/mmgis-maps/M20/Layers/json/M20_traverse.json
- Perseverance raw images feed: https://mars.nasa.gov/rss/api/?feed=raw_images&category=mars2020&feedtype=json
- MEDA archive: https://atmos.nmsu.edu/PDS/data/PDS4/Mars2020/mars2020_meda/
- CRISM product search (PDS ODE): https://oderest.rsl.wustl.edu/live2/
- NASA DONKI: https://api.nasa.gov/

Science
- Hassler and others 2014, Mars surface radiation, Science: https://ntrs.nasa.gov/citations/20180007641
- Ehresmann and others 2021, natural radiation shielding, JGR Planets, doi 10.1029/2021JE006851
- Guo and others 2021, directionality of surface radiation, GRL, doi 10.1029/2021GL093912
- NASA on the May 2024 solar storm at Mars: https://www.nasa.gov/solar-system/planets/mars/nasa-watches-mars-light-up-during-epic-solar-storm
- Hueso and others 2023, vortices and dust devils at Jezero: https://arxiv.org/pdf/2109.04601
- Kluis and others 2022, EVA performance and SEXTANT: https://bhp.engr.tamu.edu/wp-content/uploads/sites/212/2022/02/Kluis-et-al.-2022-A-METHODOLOGY-FOR-ANALYZING-AND-IMPROVING-EVA-PERFORMANCE.pdf
- Marquez and Cummings 2008, Journal of Aerospace Information Systems (find and read)
- Santee and others 2001, Aviation, Space, and Environmental Medicine (find and read)
- Cheyava Falls: https://en.wikipedia.org/wiki/Cheyava_Falls
- Mars Sample Return status: https://www.scientificamerican.com/article/nasas-mars-sample-return-mission-in-jeopardy-as-u-s-considers-abandoning/
