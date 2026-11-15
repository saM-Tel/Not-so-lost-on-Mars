# Project page: draft for the submission form

Written 15 Nov 2026 by the team owner with Claude Code. Owner: role C. One section per field of the Space Apps project submission form, in the form's order (field list in [SUBMISSION_CHECKLIST.md](SUBMISSION_CHECKLIST.md)). Copy each section into the field of the same name.

- **[FILL]** marks what only a person can write. Do not submit with any left.
- Every figure here is copied from [../README.md](../README.md) or [STATUS.md](STATUS.md). If one changes there, change it here too.
- Read the last section before pressing submit.

---

## Project Name

Tether: not so lost on Mars

## High-Level Project Summary

Tether is a map for an astronaut on foot on Mars. It answers one question: can I do this science and still get home safely?

It opens on a globe of Mars with nine NASA landing sites. At Bright Angel in Jezero crater, where Perseverance cored the "Cheyava Falls" rock in 2024, it shows the ground at walking scale: 25 cm images from orbit on 1 m terrain. You pick science targets, or several stops with time at each. Tether plans a walk a suited person can do, avoiding slopes over the suit's limit, and gives time, energy, oxygen and radiation, each as a range. It draws a "tether", a line showing how far you can go and still walk home in time. It checks the walk at every point against the moment you would be there, and names the tightest point.

It is honest about what it knows. Every layer shows who measured it and when, and every prediction carries a confidence grade. We checked our slopes against the tilt Perseverance logged at 116 stops: the typical difference is 1.4 degrees.

The challenge asks for a hyperlocal, layered map of a real place on Mars that helps astronauts survive. Tether is that map, built around the one limit that matters most on a walk: getting home.

## Link to Project Demo

**[FILL]** A public link to the video (30 seconds or less) or to the slides (7 or fewer, including title and intro). Open it in a private window before submitting.

Draft video made Sun 15 Nov 14:19: `tether-demo-draft-1.mp4`, 29.5 s, 1280 x 720, no sound, in `demo-video/` beside the repository on Joseph's laptop (not in git). It follows the shot list below, recorded from the public site by a script Claude Code wrote, which drove a headless browser and captured its screen; the scenes are sped up 1.2 to 4.9 times and the subtitles and end card were added by the same script. Every picture in it is the live app showing real NASA data; nothing in it is generated imagery. **The team decides** whether that is acceptable under "no AI-generated video", or records the same shot list by hand. It still needs uploading somewhere public, and its link put above.

A 30-second shot list, all recorded from the live app at the Bright Angel link. Subtitles, no voice needed:

| Seconds | On screen | Subtitle |
|---|---|---|
| 0 to 4 | The globe of Mars with the site markers | Can I do this science and still get home? |
| 4 to 9 | Fly into Bright Angel; the ground in 3D | A real place in Jezero crater, at walking scale |
| 9 to 15 | The walk to Cheyava Falls, the tether line, the verdict at the top of the card | The tether: how far you can go and still walk home in time |
| 15 to 21 | Add two stops; the verdict names the tightest point; the margin chart | Every point of the walk is checked against the clock |
| 21 to 26 | First person under the visor: arrow home, start-back countdown | What it feels like on the ground (simulated) |
| 26 to 30 | An information card with source, date and grade; the link | Every number has a source, a date and a range |

Rules for the video: no AI-generated images, video or audio; no NASA logo; no one under 18; only people who have agreed to NASA using their name and likeness. Keep the credit line visible on any NASA image.

## Link to Final Project

https://sam-tel.github.io/Not-so-lost-on-Mars/#site=bright-angel

It opens on the hero walk. The plain link, https://sam-tel.github.io/Not-so-lost-on-Mars/ , opens on the globe. Both need no login.

Repository (public; checked Sun 15 Nov 14:10): https://github.com/saM-Tel/Not-so-lost-on-Mars

## Detailed Project Description

### What it does

Tether is a static web app for planning a Marswalk. It answers one question: can I do this science and still get home safely? Everything in it helps answer that question.

- **The place.** A globe of Mars with nine NASA landing sites. Two are built in full, each a 3 km by 3 km box of 25 cm imagery on 1 m terrain: Bright Angel in Jezero crater, and the boxwork on Mount Sharp in Gale crater, the challenge's own example, where Curiosity drilled the Altadena rock in June 2025. Seven more landing sites have a smaller map built automatically from one HiRISE terrain strip each.
- **Layers.** Slope, keep-out ground, geology, night-time warmth, and the rover's path and stops. Each layer has a card saying who measured it, when, how fine its detail really is, how far to trust it, and what not to conclude from it.
- **Walks.** Pick a science target, click any point, or add several stops with time at each. The route is the least-effort way out and a separate way home, never crossing ground steeper than the suit's slope limit (20 degrees, NASA's Artemis III requirement). It gives distance, climb, time, energy, oxygen and radiation, each for a favourable, an expected and a cautious case.
- **The tether.** A line on the map shows how far you can go and still walk home within the allowance. The allowance is the walk-back limit (1 hour by default, or 30 minutes) or the time left of an 8-hour walk, whichever is less. The line shrinks as the walk goes on. The walk is checked at every point against the moment you would be there. The card names the tightest point and shows a chart of the margin along the walk.
- **Around the walk.** Radiation picked up on the walk, NASA's latest forecast of a solar eruption reaching Mars, and a storm drill set against the 20 May 2024 storm Curiosity measured. Sunrise, sunset and whether the walk ends in daylight. Typical pressure, temperature and wind for the hour you set out and over the walk, from Perseverance's weather station in the same season of three past Mars years. When a relay orbiter is in view for a link, from JPL Horizons predictions. Real Perseverance photos taken within 30 m of the route.
- **On the ground.** A to-scale astronaut walks the planned route on the 3D ground, standing at each stop for its time, while the tether shrinks. A first-person view under a simulated helmet display shows the arrow home, the walk-home time and a start-back countdown. A field tablet view and a helmet concept view show the same data with cautious values only.
- **Sharing.** The link holds the site, the walk and the tether settings, so it opens the same walk with the same verdict.

### How it works

- **Data preparation.** Python with rasterio and NumPy reads the parts of the NASA and USGS source files it needs and writes small static files: image and terrain tiles, routing grids of 4 m cells (mean height and steepest slope), rover stops and photos, and orbiter passes.
- **The app.** TypeScript, built with Vite, drawn with MapLibre GL JS. It has no server, no login and no database, and is hosted on GitHub Pages.
- **Routes and the tether.** A Web Worker searches the routing grid once from home and once towards home with a walking model for a suited person in Mars gravity. The model is the speed and energy equations from the SEXTANT traverse planner, with suit masses and walking speeds from NASA's 2026 study of Mars spacesuit mass. Each route is then a quick look-up. The tether is the cautious time to walk home from every cell, compared with the allowance.
- **Mars, not Earth.** All distances use the Mars sphere the USGS products use (radius 3,396,190 m), gravity 3.71 m/s², and Mars local time from NASA's Mars24 method. Heights are relative to the Mars areoid.

### How we checked it

Perseverance stopped 116 times inside the Bright Angel box and logged how far it was tilted each time. Against our slope from orbit, the typical difference is 1.4 degrees, 9 in 10 are within 4.0 degrees, and the correlation is 0.89. The rover's drivers chose gentle ground, so this says more about gentle slopes than steep ones. The route card uses that 4-degree figure to flag stretches close to the slope limit. At the Gale boxwork the same check is weaker (typical 2.3 degrees, 9 in 10 within 6.6 degrees, correlation 0.49, over 285 stops), and the app shows it as it is.

### How it answers the challenge

The challenge asks for "a layered, integrated view of a location or route on the Martian surface that pulls together data from multiple NASA science missions and could help a human explorer plan and carry out a successful Marswalk". Line by line:

| The challenge asks for | What Tether does |
|---|---|
| A map, tool or interface a Mars astronaut could use, with NASA data and tools | A planner for the habitat, a field tablet view and a helmet display concept, all from NASA data |
| Science goals, and a location to explore | Bright Angel, where Perseverance found the Cheyava Falls rock with possible signs of past life; and the boxwork on Mount Sharp, the challenge's own example, where Curiosity drilled Altadena in 2025. Targets are real rover stops, each with its reason and source |
| Data from multiple NASA science missions | Mars Reconnaissance Orbiter (HiRISE, CTX), Mars Odyssey (THEMIS), Perseverance, Curiosity, Viking, and NASA's space weather, Deep Space Network and JPL Horizons services |
| At least three kinds of data, layered for context | At Bright Angel: optical, topographic (terrain and slope), thermal (night infrared), geologic, radiation, atmospheric (weather by hour) and space weather, each with a card saying who measured it, when and how far to trust it |
| Astronaut safety first; space weather and radiation | The tether: how far you can go and still walk home in time, checked at every point of the walk. Radiation dose for the walk with a range, NASA's latest solar storm forecast, and a storm drill |
| Spacesuits and loads change how people move | Walking speed and energy for a suited person in Mars gravity, in three cases from published suit masses and speeds; a slope limit from NASA's Artemis requirement |
| A route map that avoids obstacles such as large rock formations | The least-effort route out and a separate way home, never on ground steeper than the suit's limit. Features larger than about 4 m show up as steep ground; smaller rocks are not seen, and the app says so |
| A display inside the habitat, a tablet, or a helmet visor | All three, and a first-person walk-through under a simulated visor with the arrow and time home |
| Rover photos, so the astronaut knows what to expect | Real Perseverance photos taken within 30 m of the planned route, each with its date and credit |
| Rovers carrying crew and tools, or astronauts in pairs | The crew rover can be driven to a new spot and becomes home for every walk. Pairs are not modelled |
| Updates on current conditions | NASA's live solar storm forecast and the live link to Earth. Surface weather is typical for the season, from past Mars years, not live |

(Copied from the README on Sun 15 Nov 14:10. If the README changes, copy it again.)

### What it does not do yet

We would rather list these than hide them.

- **Nobody has walked on Mars.** Time and energy come from a model built on Apollo data and tests on Earth, applied to Mars gravity. They are grade C, and the app says so.
- **Home is an assumption.** The crew's rover parks at a stop Perseverance itself used for 16 sols; you can move it.
- **The tether is a time limit only.** It does not yet budget oxygen or energy, and takes no reserve.
- **Loose sand and small rocks are not counted.** The terrain cannot show anything smaller than about 3 to 5 m.
- **Radiation is the everyday background.** A solar storm can add far more in a few hours and is not in the dose figure; the storm drill shows how much.
- **Weather at Jezero is typical, not live.** It is the spread of the same season in past Mars years, measured where the rover was then, a few kilometres from Bright Angel. Its temperature is the one inside MEDA's humidity sensor, which follows the air but is not an air temperature reading. Wind data is sparse: the wind sensors were damaged by wind-blown grains in 2022.
- **Photos are not sorted by the way they face.**
- **The seven other maps are automatic.** One terrain strip each, not checked on the ground or by a person.
- **Gale is less sure than Bright Angel.** Its mosaics are tied to Mars's global laser map, good to about 100 m in absolute position (Curiosity's stops sit on the same mosaic, so they agree with each other). Its slope check is weaker (typical 2.3 degrees, 9 in 10 within 6.6 degrees, correlation 0.49, over 285 stops). It has no rover photos, because our photo index reads only Perseverance's feed, and no drive lines, because NASA's Curiosity path file gives no sol numbers to date them. The boxwork ridges themselves, about 1 to 2 m tall, are smaller than the terrain can show.
- **Orbiter predictions end.** They were saved from JPL Horizons on 14 November and end on 30 November 2026, where MRO's own prediction ends. After that the app replays the saved window and says so. The elevation a relay link needs and what counts as overhead for a camera are assumed (grade D); we found no published figure.
- **The walk-through is a demonstration, not a game.** It uses the same walking model as the route card and the same tether, with no score.

(Copied from the README on Sun 15 Nov 14:10. If the README changes, copy it again.)

### Why it matters

The first people on Mars will walk to their science. The limit on every walk is getting home with time and air to spare. Tether turns that limit into a line on a map and a plain verdict, and is honest about every number behind it. Grade A means measured here on the ground; B, measured here from orbit; C, measured elsewhere or modelled; D, assumed.

### Tools, languages and software

TypeScript, Python, MapLibre GL JS, Vite, Vitest, NumPy, Rasterio with GDAL, Fiona, Pillow, PyYAML, pytest, GitHub Pages, and Claude Code (see the next field). Licences are listed in the README; our own work is under the Apache License 2.0.

## Use of Super Intelligence

Not shown to judges. It must be truthful; copy and check against [AI_USE.md](AI_USE.md).

We used an AI coding assistant, Claude Code (Anthropic), with the models Claude Opus 5.5, Claude Sonnet 5.5 and Claude Fable 5.2, throughout the event. Working task by task under the team's direction, it:

- wrote most of the code, the tests and the documentation;
- searched for and read sources, and checked that NASA data addresses respond;
- reviewed the code read-only and listed suspected bugs, which it then fixed.

People on the team decided what to build, chose between options, set the scope and the cut lines, and looked at the results in the browser. Not every line has been reviewed by a person. Every session is logged in the repository (`docs/AI_USE.md`), and the README and the app's credits say AI was used.

Where the idea came from: **[FILL]** Say truthfully who on the team had the idea and when. The Project Submission Guide says AI should not be used to come up with the idea.

No AI-generated images, video or audio are used anywhere in the app, the video or this page.

## NASA Data

- **HiRISE on Mars Reconnaissance Orbiter:** the 25 cm image and 1 m terrain at Bright Angel (USGS mosaics, Fergason and others 2020) and at the Gale boxwork (USGS mosaics, Calef and Parker 2016, filled with CTX and HRSC), and the terrain models and images at seven landing sites (HiRISE archive, University of Arizona).
- **Context Camera (CTX) on Mars Reconnaissance Orbiter:** the land round each site. Sources: the USGS Jezero mosaic and terrain (Fergason, Galuszka and Hare 2020), and the global mosaic by the Murray Lab at Caltech.
- **Mars 2020 Perseverance:** rover stops, path and tilt (mission location files), used for the routes' home and targets and to check our slope; navigation camera photos (raw image feed).
- **Viking Orbiter:** the colour mosaic of the whole planet (USGS Astrogeology and NASA Ames, through Mars Trek).
- **THEMIS on Mars Odyssey:** night-time warmth, from the USGS Jezero geologic map package.
- **USGS geologic map of Jezero crater (SIM 3464, Sun and Stack 2020):** the geology layer.
- **Perseverance MEDA:** typical weather by hour at Jezero for the season (derived data from the Planetary Data System Atmospheres Node).
- **Curiosity:** its stops, tilt and path (mission location files), for the Gale home and targets and the slope check; REMS daily weather at Gale; RAD dose rates (Hassler and others 2014; Guo and others 2015); NASA/JPL's account of the 20 May 2024 solar storm.
- **NASA CCMC DONKI:** space weather forecasts from the Moon to Mars Space Weather Analysis Office.
- **NASA Deep Space Network Now:** the live link to Earth.
- **JPL Horizons:** predicted positions and passes of MRO, Mars Odyssey, Mars Express and TGO.
- **Mars24 (NASA GISS):** the method for Mars local time and the Sun (Allison and McEwen 2000).
- **NASA studies:** suit mass, walking speeds and walk-back limits (Ogilvie and others 2026, NASA Johnson Space Center); the 20-degree slope limit (NASA Artemis III requirement, in Ortiz 2025).

## Space Agency Partner Data and Other References

- **ESA:** Mars Express and the ExoMars Trace Gas Orbiter trajectories, from the ESA navigation team through JPL Horizons; HRSC terrain and images from Mars Express inside the USGS Gale mosaics.
- **Spain's Centro de Astrobiología (CSIC-INTA):** partner on Curiosity's REMS and Perseverance's MEDA instruments.
- **Papers, data products, software and images:** see below.

Drafted on Sun 15 Nov from [REFERENCES.md](REFERENCES.md) and the README's licence table, keeping only what the app, the pipeline or this page uses. Paste the text between the lines into the form.

---

**Imagery and terrain**

- Fergason, R. L., and others, 2020. Mars 2020 Terrain Relative Navigation HiRISE orthorectified image mosaic (25 cm) and DTM mosaic (1 m), Jezero crater. USGS Astrogeology Science Center. https://astrogeology.usgs.gov/search/map/mars_2020_terrain_relative_navigation_hirise_orthorectified_image_mosaic and https://astrogeology.usgs.gov/search/map/mars_2020_terrain_relative_navigation_hirise_dtm_mosaic. Credit: NASA/JPL-Caltech/University of Arizona/USGS.
- Fergason, R. L., Galuszka, D. M., and Hare, T. M., 2020. Context Camera orthorectified image mosaic and DTM for Mars 2020 Terrain Relative Navigation. USGS. doi:10.5066/P9GV1ND3. https://planetarymaps.usgs.gov/mosaic/mars2020_trn/CTX/
- Calef, F. J., III, and Parker, T., 2016. MSL Gale Merged Orthophoto Mosaic (25 cm) and Merged DEM (1 m). PDS Annex, USGS Astrogeology Science Center. https://astrogeology.usgs.gov/search/map/mars_msl_gale_merged_orthophoto_mosaic_25cm and https://astrogeology.usgs.gov/search/map/mars_msl_gale_merged_dem_1m. Credit: NASA/JPL-Caltech/University of Arizona/ESA/DLR/FU Berlin/USGS.
- HiRISE image labels for PSP_001488_1750 and ESP_025368_1755 (dates of the Gale source images). University of Arizona. https://hirise-pds.lpl.arizona.edu/PDS/RDR/
- HiRISE digital terrain models and ortho images for seven landing sites (Viking 1 and 2, Pathfinder, Spirit, Opportunity, Phoenix, InSight). University of Arizona. https://hirise.lpl.arizona.edu/PDS/DTM/
- Global CTX mosaic, beta01. The Murray Lab, Caltech; served by Esri (OnMars CTX). Credit: NASA/JPL/MSSS/The Murray Lab. https://astro.arcgis.com/arcgis/rest/services/OnMars/CTX/MapServer. Described in Dickson, J. L., and others, 2024, Earth and Space Science, doi:10.1029/2024EA003555.
- Mars Viking Colorized Global Mosaic 232 m (MDIM 2.1). USGS Astrogeology Science Center, 2009, read through NASA Mars Trek. Credit: NASA Viking Orbiter; mosaic by USGS; colour by NASA Ames. https://astrogeology.usgs.gov/search/map/mars_viking_colorized_global_mosaic_232m
- Sun, V. Z., and Stack, K. M., 2020. Geologic map of Jezero crater and the Nili Planum region, Mars. USGS Scientific Investigations Map 3464. doi:10.3133/sim3464. Also the source of the THEMIS night-time infrared mosaic (USGS, October 2018; credit NASA/JPL-Caltech/Arizona State University).

**Rover and lander data**

- Perseverance stops and drives (Mars 2020 mission location files). NASA/JPL-Caltech. https://mars.nasa.gov/mmgis-maps/M20/Layers/json/M20_waypoints.json and M20_traverse.json
- Perseverance raw images (navigation camera). NASA/JPL-Caltech. https://mars.nasa.gov/mars2020/multimedia/raw-images/
- Curiosity stops (MSL mission location file). NASA/JPL-Caltech. https://mars.nasa.gov/mmgis-maps/MSL/Layers/json/MSL_waypoints.json
- Curiosity raw image record FRB_802661004EDR_F1161944FHAZ00337M_ (Curiosity's sol clock). NASA/JPL-Caltech. https://mars.nasa.gov/api/v1/raw_image_items/
- Curiosity REMS daily weather. NASA/JPL-Caltech/CAB (CSIC-INTA). https://mars.nasa.gov/rss/api/?feed=weather&category=msl&feedtype=json
- Mars 2020 MEDA derived environment data, PDS Atmospheres Node. NASA/JPL-Caltech/CAB (CSIC-INTA). https://atmos.nmsu.edu/PDS/data/PDS4/Mars2020/mars2020_meda/
- NASA NSSDCA spacecraft catalogue (published landing positions). https://nssdc.gsfc.nasa.gov/nmc/

**Space weather, links and orbits**

- NASA CCMC DONKI notifications, Moon to Mars Space Weather Analysis Office, read through https://api.nasa.gov/. https://ccmc.gsfc.nasa.gov/tools/DONKI/
- NASA Deep Space Network Now. https://eyes.nasa.gov/dsn/dsn.html (feed https://eyes.nasa.gov/dsn/data/dsn.xml)
- JPL Horizons, NASA JPL Solar System Dynamics: predicted positions of MRO, Mars Odyssey, Mars Express and TGO (trajectories from the NASA and ESA navigation teams). https://ssd.jpl.nasa.gov/horizons/
- Mission pages for the orbiters' cameras and relay roles: NASA MRO https://science.nasa.gov/mission/mars-reconnaissance-orbiter/ ; NASA Mars Odyssey https://science.nasa.gov/mission/odyssey/ ; ESA Mars Express https://www.esa.int/Science_Exploration/Space_Science/Mars_Express ; ESA ExoMars https://www.esa.int/Science_Exploration/Human_and_Robotic_Exploration/Exploration/ExoMars

**Science and engineering**

- Hassler, D. M., and others, 2014. Mars' surface radiation environment measured with the Mars Science Laboratory's Curiosity rover. Science 343. https://ntrs.nasa.gov/citations/20180007641
- Guo, J., and others, 2015. Modeling the variations of dose rate measured by RAD during the first MSL Martian year: 2012-2014. Astrophysical Journal. https://arxiv.org/abs/1507.03473
- NASA/JPL, 10 June 2024. NASA watches Mars light up during epic solar storm. https://www.jpl.nasa.gov/news/nasa-watches-mars-light-up-during-epic-solar-storm/
- Ogilvie, R., Swartout, B., Hoffmann, B., McFarland, S., and Hickox, L., 2026. Mars Spacesuit Mass Requirements. ICES-2026-127, NASA Johnson Space Center. https://ntrs.nasa.gov/citations/20260003038
- Ortiz, L., 2025. Artemis Human Landing System Overview. NASA, 2025 International Space Apps Challenge. https://ntrs.nasa.gov/citations/20250009323
- Marquez, J. J., and Cummings, M. L., 2008, and Santee, W. R., and others, 2001: the walking speed and energy equations, as coded in pextant, the open-source SEXTANT traverse planner (MIT licence). https://github.com/norheim/pextant
- Weir, J. B. de V., 1949. New methods for calculating metabolic rate with special reference to protein metabolism. Journal of Physiology 109, 1-9. doi:10.1113/jphysiol.1949.sp004363
- Allison, M., and McEwen, M., 2000. A post-Pathfinder evaluation of areocentric solar coordinates. Planetary and Space Science 48, 215-235; the Mars24 algorithm, NASA GISS. https://www.giss.nasa.gov/tools/mars24/help/algorithm.html

**Context for the hero sites**

- NASA, 25 July 2024. NASA's Perseverance rover scientists find intriguing Mars rock (Cheyava Falls). https://www.nasa.gov/missions/mars-2020-perseverance/perseverance-rover/nasas-perseverance-rover-scientists-find-intriguing-mars-rock/
- NASA, 23 June 2025. NASA's Curiosity Mars rover starts unpacking boxwork formations. https://www.nasa.gov/missions/mars-science-laboratory/curiosity-rover/nasas-curiosity-mars-rover-starts-unpacking-boxwork-formations/
- NASA Curiosity blog, sols 4568-4569, 13 June 2025. https://science.nasa.gov/blog/curiosity-blog-sols-4568-4569-a-close-look-at-the-altadena-drill-hole-and-tailings/
- NASA/JPL, 23 Feb 2026. NASA's Curiosity rover sees Martian 'spiderwebs' up close. https://www.jpl.nasa.gov/news/nasas-curiosity-rover-sees-martian-spiderwebs-up-close/

**Software and its licences**

- MapLibre GL JS 6.18 (BSD-3-Clause), Vite 8.3 (MIT), TypeScript 7.0 (Apache-2.0), Vitest 5.1 (MIT), NumPy 2.5 (BSD-3-Clause and others), Rasterio 1.5 with GDAL 3.12 (BSD-3-Clause; GDAL MIT), Fiona 1.10 (BSD-3-Clause), Pillow 13.0 (MIT-CMU), PyYAML 6.0 (MIT), pytest 9.2 (MIT), pextant (MIT). Hosted on GitHub Pages.
- Claude Code (Anthropic), the AI coding assistant described under "Use of Super Intelligence".

**Images on the page and in the video**

- Screenshots of the app, showing the imagery above with its credit lines. No AI-generated images, no NASA logo.

---

Left out on purpose, because nothing in the app or this page uses them: the CRISM mineral products (downloaded, not processed), and papers we read only in part for ideas we did not build (Ehresmann 2021 and Guo 2021 on terrain shielding, Wold 2018 on forecast error, Hueso 2023 on dust devils, Kirk 2021, Kluis 2022, Jacob and others). If the team prefers to cite everything consulted, add them from REFERENCES.md.

## Images on the page

Optional; JPG, PNG or GIF up to 10 MB. Use screenshots of the live app, which show real NASA imagery, with the credit line in the caption. For example: "Bright Angel, Jezero crater. Image: NASA/JPL-Caltech/University of Arizona; mosaic by USGS." No AI-generated images and no NASA logo.

## Before you press submit

- Tick the two boxes only once every [FILL] is gone and the references are pasted.
- Check against the terms read on 15 Nov (summary in [DECISIONS.md](DECISIONS.md)):
  - our licence is named;
  - every third-party licence is listed;
  - nothing promotes a commercial product;
  - no personal details;
  - no one under 18;
  - each person shown has agreed;
  - every team member is named as themselves.
- Run the Sunday list in [SUBMISSION_CHECKLIST.md](SUBMISSION_CHECKLIST.md).
