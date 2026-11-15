# References

Every dataset, paper, library and image we use goes here when we first use it. The submission's References field is built from this file.

Entries below were gathered during planning on 13 November 2026. "Read" means someone on the team has read the source itself. Until then, treat figures taken from it as unconfirmed.

## Event rules

| Source | Address | Read |
|---|---|---|
| Participant FAQ | https://www.spaceappschallenge.org/resources/participant-faqs/ | No, search excerpt only |
| Judging and Awards Guide, dated 13 Nov 2026 | https://www.spaceappschallenge.org/resources/judging-awards-guide/ | Yes, 14 Nov, from a saved PDF |
| Project Submission Guide, dated 13 Nov 2026 | https://www.spaceappschallenge.org/resources/project-submission-guide/ | Yes, 14 Nov, from a saved PDF |
| Participant terms and conditions, updated 7 Aug 2026 | https://www.spaceappschallenge.org/legal/ | Yes, 15 Nov, from the text the team owner pasted; summary in DECISIONS.md |
| Organiser answers on submission times | https://github.com/nasa/spaceapps/discussions/1788 | Yes |

## Data

| Source | Address |
|---|---|
| Mars Trek map services | https://trek.nasa.gov/tiles/apidoc/trekAPI.html?body=mars |
| Mars Viking Colorized Global Mosaic 232m (MDIM 2.1), USGS Astrogeology Science Center, 2009. The globe image; read as tiles from Mars Trek layer `Mars_Viking_MDIM21_ClrMosaic_global_232m` | https://astrogeology.usgs.gov/search/map/mars_viking_colorized_global_mosaic_232m |
| Mars 2020 Jezero landing site terrain and image mosaics, USGS | https://astrogeology.usgs.gov/search/map/mars-2020-jezero-crater-landing-site-products |
| Fergason, Galuszka and Hare 2020, Context Camera orthorectified image mosaic for Mars 2020 Terrain Relative Navigation (`JEZ_ctx_B_soc_008_orthoMosaic_6m_Eqc_latTs0_lon0`), USGS, doi 10.5066/P9GV1ND3. The near approach ring at Bright Angel. Dates (2006 to 2020), the 9.6 m image agreement and the source image pairs read from its metadata file on 14 Nov | https://planetarymaps.usgs.gov/mosaic/mars2020_trn/CTX/ |
| CTX global mosaic, beta01, Murray Lab, Caltech; served as tiles by Esri (OnMars CTX) and listed in Mars Trek as `CTX_beta01_uncontrolled_5m_Caltech`. The approach rings at every site. Credit "NASA/JPL/MSSS/The Murray Lab". Service description read 14 Nov; image dates not read (see Dickson 2024 below) | https://astro.arcgis.com/arcgis/rest/services/OnMars/CTX/MapServer |
| Curiosity REMS daily weather feed, NASA/JPL-Caltech/CAB (CSIC-INTA), 4,745 sols from 7 Aug 2012 to 25 Aug 2026. Typical weather at Gale by Mars month (`pipeline/weather.py`) | https://mars.nasa.gov/rss/api/?feed=weather&category=msl&feedtype=json |
| NASA/JPL news, 10 June 2024, "NASA Watches Mars Light Up During Epic Solar Storm": 20 May 2024 event, 8,100 micrograys beside Curiosity, about 30 chest X-rays; cliffsides would give extra shielding. Read 14 Nov | https://www.jpl.nasa.gov/news/nasa-watches-mars-light-up-during-epic-solar-storm/ |
| NASA Deep Space Network Now feed: which spacecraft each DSN dish is talking to, with round-trip light time. Read live by the app (`app/src/ui/earthLink.ts`); checked 14 Nov that browsers may read it | https://eyes.nasa.gov/dsn/data/dsn.xml |
| Dickson and others 2024, the global CTX mosaic of Mars, Earth and Space Science, doi 10.1029/2024EA003555. Describes the final Murray Lab mosaic. **Not read**: the publisher blocks automated reading; a person should read it for the image dates | https://doi.org/10.1029/2024EA003555 |
| HiRISE LPL PDS archive, 1 m terrain models and ortho images for the seven landing sites (Viking 1, Viking 2, Pathfinder, Spirit, Opportunity, Phoenix, InSight) | https://hirise.lpl.arizona.edu/PDS/DTM/ |
| MRO CRISM targeted products (Jezero mineral observations, 6 products, 10.94 GB), PDS Geosciences Node | https://pds-geosciences.wustl.edu/mro/mro-m-crism-5-rdr-mptargeted-v1/ |
| Mars Sample Return terrain and image mosaics, USGS, 2025 (accuracy figures) | https://astrogeology.usgs.gov/search/map/mars-sample-return-terrain-relative-navigation-hirise-dtm-mosaic |
| USGS planetary data catalogue | https://stac.astrogeology.usgs.gov/api/collections |
| Sun and Stack 2020, Geologic map of Jezero crater and the Nili Planum region, USGS SIM 3464, doi 10.3133/sim3464 | https://pubs.usgs.gov/publication/sim3464 |
| Perseverance location data | https://mars.nasa.gov/mmgis-maps/M20/Layers/json/M20_waypoints.json |
| Curiosity location data: stops (used for the Gale box, home, targets and slope check) | https://mars.nasa.gov/mmgis-maps/MSL/Layers/json/MSL_waypoints.json |
| Curiosity drive lines, read 15 Nov; not used, as it gives no sol numbers | https://mars.nasa.gov/mmgis-maps/MSL/Layers/json/MSL_traverse.json |
| Calef and Parker 2016, MSL Gale Merged Orthophoto Mosaic (25 cm) and Merged DEM (1 m), PDS Annex, USGS. The Gale boxwork map. Product pages and PDS3 labels read 15 Nov from the team data server | https://astrogeology.usgs.gov/search/map/mars_msl_gale_merged_orthophoto_mosaic_25cm and https://astrogeology.usgs.gov/search/map/mars_msl_gale_merged_dem_1m |
| HiRISE PDS labels for PSP_001488_1750 (start 2006-11-20) and ESP_025368_1755 (start 2011-12-25): the dates of the earliest and latest Gale source images | https://hirise-pds.lpl.arizona.edu/PDS/RDR/ |
| NASA, "NASA's Curiosity Mars Rover Starts Unpacking Boxwork Formations", 23 June 2025: Altadena drilled on 8 June 2025. Read 15 Nov | https://www.nasa.gov/missions/mars-science-laboratory/curiosity-rover/nasas-curiosity-mars-rover-starts-unpacking-boxwork-formations/ |
| NASA Curiosity blog, sols 4568 and 4569, 13 June 2025: the rover still at the Altadena drill site. Read 15 Nov | https://science.nasa.gov/blog/curiosity-blog-sols-4568-4569-a-close-look-at-the-altadena-drill-hole-and-tailings/ |
| NASA JPL, "NASA's Curiosity Rover Sees Martian 'Spiderwebs' Up Close", 23 Feb 2026: boxwork ridges about 1 to 2 m tall; Curiosity to leave the boxwork in March. Read 15 Nov | https://www.jpl.nasa.gov/news/nasas-curiosity-rover-sees-martian-spiderwebs-up-close/ |
| NASA raw image feed, Curiosity image FRB_802661004EDR_F1161944FHAZ00337M_ (sol 4564, 13:00:54 local mean solar time, 2025-06-08T14:29:15Z): Curiosity's sol clock | https://mars.nasa.gov/api/v1/raw_image_items/?condition_1=msl:mission |
| NASA NSSDCA spacecraft catalogue: landing positions as published for Viking 1, Viking 2, Pathfinder, Spirit, Opportunity and Phoenix | https://nssdc.gsfc.nasa.gov/nmc/ |
| NASA JPL, "NASA's Perseverance Rover Scientists Find Intriguing Mars Rock", 25 July 2024: date and place of the Cheyava Falls core | https://www.nasa.gov/missions/mars-2020-perseverance/perseverance-rover/nasas-perseverance-rover-scientists-find-intriguing-mars-rock/ |
| Perseverance raw images | https://mars.nasa.gov/mars2020/multimedia/raw-images/ |
| Curiosity weather feed | https://mars.nasa.gov/rss/api/?feed=weather&category=msl&feedtype=json |
| Mars 2020 MEDA archive, PDS Atmospheres Node: derived environment data (pressure, humidity sensor, wind, ancillary) for sols 3 to 64, 672 to 733 and 1340 to 1402, read through the team data server by `pipeline/meda.py` for typical weather at Bright Angel. The bundle readme and the product labels were read on 15 Nov; the SIS documents were not | https://atmos.nmsu.edu/PDS/data/PDS4/Mars2020/mars2020_meda/ |
| PDS Orbital Data Explorer search service | https://oderest.rsl.wustl.edu/live2/ |
| NASA DONKI space weather database | https://api.nasa.gov/ |
| Deep Space Network Now | https://eyes.nasa.gov/dsn/dsn.html |
| JPL Horizons, NASA JPL Solar System Dynamics: predicted positions of MRO, Mars Odyssey, Mars Express and TGO (trajectories from the NASA and ESA navigation teams). Fetched by `pipeline/build_orbiters.py` on 14 Nov 2026 for F18 | https://ssd.jpl.nasa.gov/horizons/ |
| NASA, Mars Reconnaissance Orbiter mission page (read 14 Nov 2026: HiRISE camera; relay role) | https://science.nasa.gov/mission/mars-reconnaissance-orbiter/ |
| NASA, Mars Odyssey mission page (read 14 Nov 2026: THEMIS camera; relay role) | https://science.nasa.gov/mission/odyssey/ |
| ESA, Mars Express page (read 14 Nov 2026: High Resolution Stereo Camera) | https://www.esa.int/Science_Exploration/Space_Science/Mars_Express |
| ESA, ExoMars page (read 14 Nov 2026; TGO's camera and relay role not confirmed from it) | https://www.esa.int/Science_Exploration/Human_and_Robotic_Exploration/Exploration/ExoMars |

## Science

| Source | Address |
|---|---|
| Allison and McEwen 2000, A post-Pathfinder evaluation of areocentric solar coordinates, Planetary and Space Science 48, 215-235; the Mars24 algorithm on NASA GISS's pages. Season, Mars time and Sun position (`app/src/mars/time.ts`); checked against the Mars24 worked example | https://www.giss.nasa.gov/tools/mars24/help/algorithm.html |
| Weir 1949, New methods for calculating metabolic rate with special reference to protein metabolism, Journal of Physiology 109, 1-9. Oxygen from energy (`app/src/safety/oxygen.ts`). Not re-read on 14 Nov; the equation is widely reproduced | https://doi.org/10.1113/jphysiol.1949.sp004363 |

| Source | Used for | Read |
|---|---|---|
| Hassler and others 2014, Mars' surface radiation environment measured with Curiosity, Science. https://ntrs.nasa.gov/citations/20180007641 | Background dose rate | No |
| Guo and others 2015, Modeling the variations of dose rate measured by RAD during the first MSL Martian year: 2012 to 2014, Astrophysical Journal. https://arxiv.org/abs/1507.03473 | Dose equivalent rate on the surface: "the current surface measurement ~0.7 mSv/day", and an estimated range over the solar cycle "from about 0.35 mSv/day to about 1.15 mSv/day". Also "around 220 uGy/day" absorbed, which agrees with Hassler 2014 | Pages 10, 20 and 21 read on 14 Nov |
| NASA CCMC DONKI notifications, read through api.nasa.gov with its public demo key. https://ccmc.gsfc.nasa.gov/tools/DONKI/ | Forecasts of solar eruptions reaching Mars, for the banner and its snapshot. NASA calls them experimental research information | Read live on 14 Nov: 16 notices from 31 Oct to 14 Nov, one forecasting an arrival at Mars |
| Ehresmann and others 2021, Natural radiation shielding on Mars measured with MSL/RAD, JGR Planets, doi 10.1029/2021JE006851 | Terrain shielding | Abstract only |
| Guo and others 2021, Directionality of the Martian surface radiation, GRL, doi 10.1029/2021GL093912 | Terrain shielding | Abstract only |
| NASA, "NASA watches Mars light up during epic solar storm", 2024. https://www.nasa.gov/solar-system/planets/mars/nasa-watches-mars-light-up-during-epic-solar-storm | May 2024 storm | No |
| Wold and others 2018, Verification of real-time WSA-ENLIL+Cone simulations of CME arrival time, 2010 to 2016. https://arxiv.org/pdf/1801.07818 | Forecast arrival error | Abstract only |
| Hueso and others 2023, Convective vortices and dust devils detected and characterized by Mars 2020, JGR Planets. https://arxiv.org/pdf/2109.04601 | Dust-devil rates | Abstract only |
| Kirk and others 2021, Evaluating stereo digital terrain model quality at Mars rover landing sites, Remote Sensing. https://pubs.usgs.gov/publication/70225507 | Real detail of terrain models | Abstract only |
| Marquez and Cummings 2008, Design and evaluation of path planning decision support for planetary surface exploration, Journal of Aerospace Computing, Information, and Communication | Walking speed by slope | No; title to confirm |
| Santee and others 2001, A proposed model for load carriage on sloped terrain, Aviation, Space, and Environmental Medicine | Metabolic rate | No |
| NASA Mars 2020 raw images, and the feed behind them. https://mars.nasa.gov/mars2020/multimedia/raw-images/ ; feed `https://mars.nasa.gov/rss/api/?feed=raw_images&category=mars2020&feedtype=json` | The photos along the route: 9,341 left navigation camera records for sols 1046 to 1281, of which 401 are indexed. Also the moment sol 0 began, 2021-02-18T04:24:20Z, worked out from one record that gives sol 1215, local time 20:12:55.968 and 2024-07-21T10:49:14.311 UTC | Feed read on 14 Nov |
| Norheim and others, pextant: Python implementation of the SEXTANT traverse planner, MIT licence. https://github.com/norheim/pextant, file `pextant/explorers.py`, class `Astronaut` | The walking speed and energy equations as we coded them in `app/src/route/cost.ts`. Its comments credit "Marquez 2008" for speed and "Santee, 2001" for energy; we have not read those two papers themselves | Source file read on 14 Nov |
| Ogilvie, Swartout, Hoffmann, McFarland and Hickox 2026, Mars Spacesuit Mass Requirements, ICES-2026-127, NASA Johnson Space Center. https://ntrs.nasa.gov/citations/20260003038 | Mass and speed for the three cases: an average person of 180 lbm (82 kg); suits from Apollo at 170 lbm (77 kg) to the xEMU at 376 lbm (170 kg) in Table 1; an initial Mars suit limit of 229 lbm (104 kg); Apollo walk-back planning speeds of 3.6 km/h for one hour and 2.7 km/h for longer; a longest walk back of one hour or 3.5 km. The paper gives the xEMU as 376 lbm in Table 1 and 391 lbm in its conclusion; we use the table | Pages 1, 2 and 10 to 14 read on 14 Nov |
| Ortiz 2025, Artemis Human Landing System Overview, NASA 2025 International Space Apps Challenge, 4 October 2025. https://ntrs.nasa.gov/citations/20250009323 | Slope limit for walking: slide 24 says "Slopes for Extravehicular Activity (EVA) must be less than 20 deg"; slide 21 lists "Surface slope limit for EVA (2km): <20 deg". A lunar requirement; the slides do not say over what distance the slope is measured | Slides 21 to 26 read on 14 Nov |
| Jacob and others, Apollo Lunar Roving Vehicle as traversed performance metrics, LPSC abstract. https://ntrs.nasa.gov/citations/20250011301 | Context only: steepest slope on the Apollo 15 and 16 rover drives was 22.1 and 24.7 degrees on a 2 m terrain model. It is about the vehicle, not walking | Read in full on 14 Nov |
| Kluis and others 2022, A methodology for analyzing and improving EVA performance. https://bhp.engr.tamu.edu/wp-content/uploads/sites/212/2022/02/Kluis-et-al.-2022-A-METHODOLOGY-FOR-ANALYZING-AND-IMPROVING-EVA-PERFORMANCE.pdf | Route planner precedent | Abstract only |
| Allison and McEwen 2000, A post-Pathfinder evaluation of areocentric solar coordinates, Planetary and Space Science | Mars time and Sun position | No |
| NASA-STD-3001, Space Flight Human-System Standard | Crew dose limit | No |

## Context for the story

| Source | Address |
|---|---|
| Cheyava Falls and the Bright Angel formation | https://en.wikipedia.org/wiki/Cheyava_Falls (find the NASA and journal sources before citing) |
| Mars Sample Return status, 2026 | https://www.scientificamerican.com/article/nasas-mars-sample-return-mission-in-jeopardy-as-u-s-considers-abandoning/ |

## Software libraries

Add each library with its licence when it is first installed.

| Library | Version | Licence | Used for |
|---|---|---|---|
| MapLibre GL JS | 6.18.0 | BSD-3-Clause | The globe, the map and 3D terrain |
| Vite | 8.3.8 | MIT | Building the static site |
| TypeScript | 7.0.2 | Apache-2.0 | Type checking the app |
| Vitest | 5.1.0 | MIT | Tests for the app |
| NumPy | 2.5.4 | BSD-3-Clause and others | Arrays in the pipeline |
| Rasterio (with GDAL 3.12.2) | 1.5.2 | BSD-3-Clause | Reading the terrain and image files |
| Pillow | 13.0.0 | MIT-CMU | Writing tile images |
| PyYAML | 6.0.3 | MIT | Reading site configs |
| pytest | 9.2.0 | MIT | Tests for the pipeline |
| Fiona | 1.10.1 | BSD-3-Clause | Reading the geologic map (`pipeline/build_geology.py`) |

## Images and media

Add each image used in the app, video or project page with its credit line.

| Image | Where it is used | Credit line |
|---|---|---|
| Viking colour mosaic of Mars (see Data above) | The globe in the app | NASA Viking Orbiter; mosaic by USGS Astrogeology Science Center; colour by NASA Ames |
