# Data catalogue

Prepared 13 November 2026, before the event, as planning. "Checked" means the address answered a request on 13 November. "Known" means the resource exists to the best of our knowledge but was not tested.

Dates and accuracy marked "read from product" must be filled from the product's own label or page on Saturday. Do not guess them.

## A. Core sources

### Terrain and imagery

| Source | Mission, instrument | Detail | Dates | Accuracy | Access | Status |
|---|---|---|---|---|---|---|
| Jezero image mosaic | MRO HiRISE, USGS | 25 cm | Images from before the 2021 landing; read from product | Aligned to the CTX base within 6 m (93rd percentile, per the 2025 USGS release) | GeoTIFF 7.36 GB, partial reads supported: `https://planetarymaps.usgs.gov/mosaic/mars2020_trn/HiRISE/JEZ_hirise_soc_006_orthoMosaic_25cm_Eqc_latTs0_lon0_first.tif` | Checked |
| Jezero terrain mosaic | MRO HiRISE, USGS | 1 m grid; real detail about 3 to 5 m | Read from product | Seams between source models: under 0.9 m sideways and 2.3 m in height (99th percentile), worse on the crater rim | GeoTIFF 1.84 GB, partial reads supported: `https://planetarymaps.usgs.gov/mosaic/mars2020_trn/HiRISE/JEZ_hirise_soc_006_DTM_MOLAtopography_DeltaGeoid_1m_Eqc_latTs0_lon0_blend40.tif` | Checked |
| Jezero context image and terrain | MRO CTX, USGS | 6 m image, 20 m terrain | Read from product | Average sideways error 9.6 m | GeoTIFF 36 MB and 10 MB, same server under `mars2020_trn/CTX/` | Checked |
| Gale terrain and image mosaics | MRO HiRISE, USGS | 1 m and 25 cm | Read from product | Read from product | GeoTIFF 3.87 GB and 24.4 GB: `https://planetarymaps.usgs.gov/mosaic/Mars/MSL/MSL_Gale_DEM_Mosaic_1m_v3.tif` and `MSL_Gale_Orthophoto_Mosaic_25cm_v3.tif` | Checked |
| Any-site terrain | MRO HiRISE and CTX, USGS | 1 to 2 m and 20 m | Per product | Per product | USGS catalogue with cloud-readable files: `https://stac.astrogeology.usgs.gov/api/collections` (collections `mro_hirise_socet_dtms`, `mro_ctx_controlled_usgs_dtms`, `mo_themis_controlled_mosaics`) | Checked: catalogue answers; individual files not tested |
| HiRISE terrain models by location | MRO HiRISE, PDS | 1 to 2 m | Per product | Per product | PDS search service: `https://oderest.rsl.wustl.edu/live2/?query=product&target=mars&ihid=MRO&iid=HIRISE&pt=DTM&westlon=..&eastlon=..&minlat=..&maxlat=..&output=JSON` | Checked: returns products at all nine NASA landing sites |

### Mars Trek map tiles

Catalogue of all 222 Mars layers: `https://trek.nasa.gov/mars/TrekServices/ws/index/eq/searchItems?start=0&rows=2147483647&facetKeys=itemType%7CserviceTypes&facetValues=product%7CMosaic`

Tile address pattern: `https://trek.nasa.gov/tiles/Mars/EQ/<layer id>/1.0.0/default/default028mm/{zoom}/{row}/{column}.<png or jpg>`. Row comes before column. Zoom 0 is two tiles side by side. Each layer's format and zoom range is in `.../<layer id>/1.0.0/WMTSCapabilities.xml`. Tiles can be read from a browser.

| Layer id | What | Detail |
|---|---|---|
| `JEZ_hirise_soc_006_orthoMosaic_25cm_Eqc_latTs0_lon0_first_dd` | Jezero HiRISE image, PNG, zoom 0 to 17, covers 77.223 to 77.584 E, 18.307 to 18.669 N | 25 cm |
| `JEZ_ctx_B_soc_008_orthoMosaic_6m_Eqc_latTs0_lon0` | Jezero CTX image | 6 m |
| `curiosity_hirise_mosaic`, `Gale_DEM_SMG_1m` | Gale image and terrain picture, 137.122 to 137.730 E, 4.925 to 4.249 S | 25 cm, 1 m |
| `THEMIS_NightIR_ControlledMosaics_100m_v2_oct2018`, `THEMIS_DayIR_ControlledMosaics_100m_v2_oct2018` | Night and day infrared, Mars Odyssey; mosaic version dated October 2018 | 100 m |
| `Mars_Viking_MDIM21_ClrMosaic_global_232m` | Whole-planet colour mosaic from the Viking orbiters, 1976 to 1980. The globe image in the app. Zoom 0 to 7 as JPEG | 232 m |
| `TES_Thermal_Inertia`, `TES_Dust`, `tes_ruffdust`, `Mars_MGS_TES_Albedo_mosaic_global_7410m` | Thermal inertia, dust, albedo, Mars Global Surveyor | Kilometres |
| `Mars_MOLA_blend200ppx_HRSC_DEM_clon0dd_200mpp_lzw`, `Mars_MGS_MOLA_ClrShade_merge_global_463m` | Global terrain, MGS MOLA with Mars Express HRSC | 200 m, 463 m |
| `CTX_beta01_uncontrolled_5m_Caltech`, `HiRISE_Global` | Global CTX and HiRISE image mosaics, not position-corrected | 5 m, 25 cm where covered |
| `SIM3292_Global_Geology` | USGS global geologic map | Global scale |
| `Hydrous_Mineral_Detections_CRISM_clon0`, `Aqueous_Mineral_Distribution_Options_clon0` | Mineral detections | Points and regions |
| `EZMars`, `ExplorationZones_Proposed_Oct2015_buffer_100km_clon0` | Candidate human exploration zones | Regions |

Trek terrain layers are pictures of terrain, not height values. Use the USGS files for heights.

### Rover and surface data

| Source | Mission | Dates | Notes | Access | Status |
|---|---|---|---|---|---|
| Perseverance waypoints | Mars 2020 | Sol 13 to sol 2022 (about 28 October 2026); 708 stops | Each stop has longitude, latitude, height, tilt, pitch, roll, heading, distance | `https://mars.nasa.gov/mmgis-maps/M20/Layers/json/M20_waypoints.json`; browser-readable | Checked |
| Perseverance traverse | Mars 2020 | To sol 2022; 45.25 km driven | 559 line segments | `.../M20/Layers/json/M20_traverse.json` | Checked |
| Ingenuity flight waypoints | Mars 2020 | Read from file | Flight path points | `.../M20/Layers/json/m20_heli_waypoints.json` | Checked |
| Perseverance raw images | Mars 2020 | Latest sol 2031 (6 November 2026) | Each image has sol, site, drive, camera, mast azimuth and elevation, local time | `https://mars.nasa.gov/rss/api/?feed=raw_images&category=mars2020&feedtype=json&num=..&page=..&order=sol+desc`; filter options to confirm | Checked |
| Curiosity waypoints | MSL | To sol 5070; 1,388 stops | Same fields, no image list | `https://mars.nasa.gov/mmgis-maps/MSL/Layers/json/MSL_waypoints.json` | Checked |
| Curiosity raw images | MSL | Latest sol 5073 (13 November 2026) | Has sol, site, drive, instrument | `https://mars.nasa.gov/api/v1/raw_image_items/?order=sol+desc&per_page=..&page=..&condition_1=msl:mission` | Checked |
| Curiosity daily weather | MSL REMS | 7 August 2012 to 25 August 2026 (sol 4995); 4,745 sols | Air and ground temperature, pressure in pascals, ultraviolet index, sky opacity, sunrise and sunset | `https://mars.nasa.gov/rss/api/?feed=weather&category=msl&feedtype=json` | Checked |
| Perseverance weather archive | Mars 2020 MEDA | Folders from sol 0 to the sol 1740 to 1859 folder | Wind sensors were damaged by wind-blown grains in 2022 and early 2023; wind data after that is less sensitive | `https://atmos.nmsu.edu/PDS/data/PDS4/Mars2020/mars2020_meda/data_derived_env/` | Checked: folders exist; file format not yet read |
| Jezero geologic map | USGS SIM 3464, Sun and Stack | Published 2020 | 1:75,000. Positions are 100 to 200 m off the corrected base map. Mars Transverse Mercator, central meridian 77.5 E. File geodatabase | `https://pubs.usgs.gov/publication/sim3464` (349 MB zip) | Checked: readme read; zip not downloaded |
| Mineral maps | MRO CRISM | Per product; the instrument stopped in 2022 to 2023 | 18 m | PDS search service with `iid=CRISM&pt=MTRDR`; 6 products cover 77.25 to 77.50 E, 18.40 to 18.55 N | Checked: count only |

### Space environment

| Source | What | Dates | Accuracy | Access | Status |
|---|---|---|---|---|---|
| NASA DONKI solar-wind simulations | Forecast arrival of solar eruptions at Mars and other targets | Live. 91 runs from 1 October to 13 November 2026, 26 naming Mars; one predicted arrival at Mars on 13 November 12:00 UTC | Arrival time is typically wrong by about 10 hours at Earth (10.4 ± 0.9 h over 273 events, 2010 to 2016). No figure found for Mars; assume worse | `https://api.nasa.gov/DONKI/WSAEnlilSimulations?startDate=..&endDate=..&api_key=..` | Checked |
| NASA DONKI notifications | Written alerts from NASA's Moon to Mars Space Weather Analysis Office | Live. 7 of 14 notices from 1 to 13 November mention Mars | n/a | `https://api.nasa.gov/DONKI/notifications?startDate=..&endDate=..&type=all&api_key=..` | Checked |
| Curiosity RAD, published values | Surface dose at Gale crater | 2012 onwards | 0.210 ± 0.040 mGy per day (Hassler 2014). Dose equivalent about 0.64 to 0.67 mSv per day; two figures seen, check the paper | Papers; raw data at the PDS plasma node | Known |
| Deep Space Network Now | Which spacecraft Earth is talking to at this moment | Live. At the time of the check: MRO and Mars Odyssey | n/a | `https://eyes.nasa.gov/dsn/data/dsn.xml` | Checked |

### Other landing sites: terrain models found on 13 November

One HiRISE terrain model folder per site from the PDS, each holding a 1 m terrain file (`.IMG`) and matching images (`.JP2`). File counts and sizes were read from the server. "Near" is the distance from the folder's centre to our approximate landing position, which came from memory; **check that each model covers the real landing point before building the site.** Acquisition dates are in each file's label; the dates on the server are posting dates.

All folders are under `https://hirise.lpl.arizona.edu/PDS/DTM/`.

| Site | Product | Files, size | Folder | Notes |
|---|---|---|---|---|
| Viking 1 | DTEEC_001521_2025_001719_2025_U01 | 5, 2.57 GB | `PSP/ORB_001500_001599/PSP_001521_2025_PSP_001719_2025/` | Labelled "possible Viking Lander 1 landing site". Near: 0.2 km |
| Viking 2 | DTEEC_002055_2280_001976_2280_A01 | 9, 2.18 GB | `PSP/ORB_002000_002099/PSP_002055_2280_PSP_001976_2280/` | Labelled "possible location for Viking Lander 2". Near: 1.2 km |
| Pathfinder | DTEEC_002391_1995_001890_1995_A01 | 9, 1.75 GB | `PSP/ORB_002300_002399/PSP_002391_1995_PSP_001890_1995/` | Labelled "possible Mars Pathfinder landing site". Near: 4.4 km, so coverage is uncertain |
| Spirit | DTEEC_001513_1655_001777_1650_U01 | 5, 0.96 GB | `PSP/ORB_001500_001599/PSP_001513_1655_PSP_001777_1650/` | Columbia Hills. Near: 1.9 km |
| Opportunity, small model | DTEEC_001414_1780_001612_1780_U01 | 5, 0.03 GB | `PSP/ORB_001400_001499/PSP_001414_1780_PSP_001612_1780/` | About 1.3 by 1.7 km. Its label says "Possibily Opportunity Rover landing site", but its footprint (2.036 to 2.065 S) does not contain the landing position NASA's catalogue gives (1.946 S, 354.473 E) |
| Opportunity, Victoria crater | DTEEC_021747_1780_022380_1780_U01 | 5, 1.05 GB | `ESP/ORB_021700_021799/ESP_021747_1780_ESP_022380_1780/` | Its footprint contains the published landing position, near its north-west corner |
| Opportunity, Endeavour west rim | DTEEC_018701_1775_018846_1775_U01 | 7, 2.31 GB | `ESP/ORB_018700_018799/ESP_018701_1775_ESP_018846_1775/` | Where the mission ended |
| Opportunity, north Endeavour | DTEEC_028815_1780_028670_1780_A01 | 13, 2.00 GB | `ESP/ORB_028800_028899/ESP_028815_1780_ESP_028670_1780/` | |
| Phoenix | DTEPC_008591_2485_008644_2485_U01 | 5, 1.86 GB | `PSP/ORB_008500_008599/PSP_008591_2485_PSP_008644_2485/` | Polar projection, unlike the others; the pipeline must handle it. Near: 0.8 km |
| InSight | DTEEC_037262_1845_036761_1845_U01 | 5, 2.37 GB | `ESP/ORB_037200_037299/ESP_037262_1845_ESP_036761_1845/` | Near: 4.1 km |

Read from the label at the start of each terrain file on 14 November: every model gives planetocentric latitude and east-positive longitude from 0 to 360, but **each has its own projection**. The equirectangular ones are true to scale at different latitudes (20 N for Viking 1, 45 N for Viking 2, 15 N for Pathfinder, 10 S for Spirit, the equator for Opportunity and InSight) and several use a local radius, not 3,396.19 km. Phoenix is polar stereographic. The pipeline must read the projection from each file. The landing position in NASA's catalogue falls inside the model for Viking 1, Viking 2, Spirit, Opportunity (Victoria model) and Phoenix; it falls outside for Pathfinder, whose catalogue figure is an older one with no stated frame; it was not found for InSight. The footprints are in the site configs under `sites/`.

Total: 68 files, 17.06 GB. Each `.JP2` image also has a small `.LBL` label file beside it holding its acquisition details; the 58 labels were added to the server on 14 November. These are single strips a few kilometres wide, not mosaics, so each site's box is smaller than at Jezero or Gale.

### Jezero geology and minerals: addresses found on 13 November

| Source | Address | Size | Notes |
|---|---|---|---|
| Jezero geologic map package | `https://pubs.usgs.gov/sim/3464/sim3464_database.zip` | 349,336,873 bytes | |
| CRISM mineral products, 6 | From the PDS search service: `https://oderest.rsl.wustl.edu/live2/?query=product&target=mars&ihid=MRO&iid=CRISM&pt=MTRDR&westlon=77.25&eastlon=77.50&minlat=18.40&maxlat=18.55&results=fmp&output=JSON` | 690 files, 10.94 GB (10,943,277,624 bytes, summed from each file's own size on 14 November; the search service's size field overstates it as 11.2 GB) | Acquired 29 Jan 2007, 26 Feb 2007, 21 Apr 2007, 19 May 2007, 27 Jun 2007 and 14 Aug 2011. Whether any covers Bright Angel (77.305 E, 18.497 N) is not checked |

## B. Extra resources that could strengthen the project

Ranked by value for effort. None is needed for the must-have list.

| Resource | What it adds | Effort | Status |
|---|---|---|---|
| Rover tilt and height at every stop (already in the waypoint files) | Validation of our terrain against measurements on the ground | Low | Checked |
| DONKI notifications | Plain-language space-weather alert text for the banner | Low | Checked |
| Deep Space Network Now | A live "link to Earth" indicator | Low | Checked |
| Curiosity weather feed | Fourteen years of daily weather for Gale, ready-made, including an ultraviolet index | Low | Checked |
| Mars24 Sun and time algorithm (NASA GISS; Allison and McEwen 2000) | Correct Mars local time, season and Sun position | Low | Known |
| NASA 3D Resources models of Perseverance, Curiosity and Ingenuity | Real hardware in the 3D view | Low | Known |
| NASA Image and Video Library | Credited stills for the video and project page | Low | Known |
| Trek exploration-zone layers | Shows where NASA has studied sending people | Low | Checked: in the Trek catalogue |
| USGS cloud-readable terrain catalogue | Terrain for any site without downloading whole files | Medium | Checked: catalogue only |
| Ingenuity flight paths | "Scout from the air" story; aerial photos of ground a walker will cross | Medium | Checked |
| Perseverance sample documentation and chemistry (PIXL, SuperCam, SHERLOC) via the PDS Analyst's Notebook | A chemical data type and reasons for each science target | Medium | Known |
| Mars Odyssey MARIE estimated global radiation map (NASA image PIA03480) | Radiation by altitude for every site | Medium | Known |
| NASA-STD-3001 crew health limits (career radiation limit about 600 mSv) | A reference line for dose displays | Low | Known; figure not confirmed |
| Curiosity RAD raw data at the PDS | Our own dose time series and storm replay from measurements | Medium to high | Known |
| Subsurface water-ice maps (SWIM project) and Odyssey hydrogen maps | A resources layer for choosing where to live | Medium | Known |
| NASA Ames Mars Climate Modeling Center outputs; Mars-GRAM; Mars Climate Sounder | Weather for sites with no weather station | High | Known |
| MRO MARCI weekly weather reports | Current dust-storm activity in words and pictures | Medium | Known |
| NASA-AMMOS MMGIS, the open-source software behind NASA's rover location maps | Design reference for layer panels and photo viewers | Reading only | Known |
| SEXTANT and the BASALT field-test papers; Apollo traverse maps and cuff checklists | Precedent for the route planner and the field display | Reading only | Known |
| Partner agency data: Mars Express HRSC (ESA), Trace Gas Orbiter CaSSIS (ESA), Hope probe (UAE) | Colour stereo imagery and global weather; widens the "multiple agencies" story | Medium to high | HRSC layers are in the Trek catalogue; others known |
| Free tools from the event's Global Collaborators (GoDaddy, Google, Meteomatics, Microsoft, Miro) | Possibly a free domain name or cloud credit | Low | Named in search results; offers not read |

## C. Known not to work

| Thing | Problem | Use instead |
|---|---|---|
| Perseverance weather feed on mars.nasa.gov | Stops at sol 1133 (27 April 2024) | MEDA archive |
| Panorama files named inside the Perseverance waypoint data | The address pattern returns "forbidden" | Raw image feed |
| NASA API demo key | About 30 requests an hour; also refuses header-only requests | A free personal key and a saved snapshot |
| spaceappschallenge.org from the lead machine's command line | Certificate error | A browser |
| Trek tiles in MapLibre | Not Web Mercator | Our own tiles; Trek for an inset or fallback |
