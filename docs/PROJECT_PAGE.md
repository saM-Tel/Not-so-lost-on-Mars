# Project page: what to paste into each field

Written 15 Nov 2026 by the team owner with Claude Code. Owner: role C. Reorganised on 15 Nov at about 16:50 to follow the live submission form field by field, in the form's order, using the copy of the form the owner pasted in.

**How to use this page**

- Open the preview in VS Code (Ctrl+Shift+V) and copy from the preview, not from the raw text. Headings, lists and bold then paste into Project Details as formatting, and the plain fields get plain text.
- The text for each field sits between two horizontal lines. Copy everything between them.
- **[FILL]** marks what only a person can write. Do not submit with any left.
- Every figure is copied from [../README.md](../README.md) or [STATUS.md](STATUS.md). If one changes there, change it here too.
- Every link in the NASA Data and Other Data tables was requested by a script on 15 Nov between 16:40 and 16:50 and answered. Nobody has read the pages. The two DOI links to Wiley journals (Dickson 2024, Weir 1949) send scripts to the publisher, which refuses them; they should open in a browser.

---

## 1. Project Name

The box shows the team name. Replace it with:

---

Tether: not so lost on Mars

---

## 2. Summary

A plain text box of up to 1,500 characters; the form suggests 50 to 200 words. This text is about 1,080 characters and 197 words.

---

Tether is a map for an astronaut on foot on Mars. It answers one question: can I do this science and still get home safely?

It opens on a globe of Mars with nine NASA landing sites. At Bright Angel in Jezero crater, where Perseverance cored the "Cheyava Falls" rock in 2024, it shows the ground at walking scale: 25 cm images from orbit on 1 m terrain. Pick science targets, or several stops with time at each. Tether plans a walk a suited person can do, avoiding slopes over the suit's limit, and gives time, energy, oxygen and radiation, each as a range. Its "tether" is a line showing how far you can go and still walk home in time, and the walk is checked against the clock at every point.

Every layer shows who measured it and when, and every prediction carries a confidence grade. Against the tilt Perseverance logged at 116 stops, our slopes differ by 1.4 degrees typically.

The challenge asks for a hyperlocal, layered map of a real place on Mars that helps astronauts survive. Tether is that map, built around the one limit that matters most on a walk: getting home.

---

## 3. Project Demonstration

One full link (starting `https://`) to the video, 30 seconds or less. It must open with no login, password or permission request: test it in a private window before submitting. Over 30 seconds means no Global Award.

---

**[FILL]** the video's public link

---

Draft video made Sun 15 Nov 14:19: `tether-demo-draft-1.mp4`, 29.5 s, 1280 x 720, no sound, in the repository at `docs/demo/tether-demo-draft-1.mp4`, with a note on how it was made (`docs/demo/README.md`; added by Joseph at 17:56). A script Claude Code wrote recorded it from the public site: it drove a headless browser and captured its screen, sped the scenes up 1.2 to 4.9 times, and added the subtitles and end card. Every picture in it is the live app showing real NASA data; nothing in it is generated imagery. **The team decides** whether that is acceptable under "no AI-generated video", or records the same shot list by hand. If the team counts it as AI-generated video, the guide requires a visible watermark on it.

The 30-second shot list, recorded from the live app at the Bright Angel link. Subtitles, no voice needed:

| Seconds | On screen | Subtitle |
|---|---|---|
| 0 to 4 | The globe of Mars with the site markers | Can I do this science and still get home? |
| 4 to 9 | Fly into Bright Angel; the ground in 3D | A real place in Jezero crater, at walking scale |
| 9 to 15 | The walk to Cheyava Falls, the tether line, the verdict at the top of the card | The tether: how far you can go and still walk home in time |
| 15 to 21 | Add two stops; the verdict names the tightest point; the margin chart | Every point of the walk is checked against the clock |
| 21 to 26 | First person under the visor: arrow home, start-back countdown | What it feels like on the ground (simulated) |
| 26 to 30 | An information card with source, date and grade; the link | Every number has a source, a date and a range |

Rules for the video: no AI-generated images, video or audio; no NASA logo; no one under 18; only people who have agreed to NASA using their name and likeness. Keep the credit line visible on any NASA image.

## 4. Project

One full link. The Bright Angel link opens on the hero walk; the plain link and the repository are given in Project Details.

---

https://sam-tel.github.io/Not-so-lost-on-Mars/#site=bright-angel

---

## 5. Project Details

A rich text box. The form asks: what it does or how it works, its benefits, its intended impact, the tools and languages used, how it is creative, and what the team considered. The headings below answer those in turn. There are no tables, because a table may not paste into the box.

Fill the two **[FILL]** marks in the last section before you paste. Optional: screenshots of the live app can go in through the box's Insert menu (JPG, PNG or GIF up to 10 MB), with a credit caption such as "Bright Angel, Jezero crater. Image: NASA/JPL-Caltech/University of Arizona; mosaic by USGS." No AI-generated images and no NASA logo.

---

**Tether is a map for an astronaut on foot on Mars.** It answers one question: can I do this science and still get home safely?

- Open it on the hero walk: https://sam-tel.github.io/Not-so-lost-on-Mars/#site=bright-angel
- Open it on the globe: https://sam-tel.github.io/Not-so-lost-on-Mars/
- Code (public): https://github.com/saM-Tel/Not-so-lost-on-Mars

No login is needed.

### What it does

- **The place.** A globe of Mars with nine NASA landing sites. Two are built in full, each a 3 km by 3 km box of 25 cm imagery on 1 m terrain: Bright Angel in Jezero crater, where Perseverance cored the "Cheyava Falls" rock in July 2024, and the boxwork on Mount Sharp in Gale crater, the challenge's own example, where Curiosity drilled the Altadena rock in June 2025. Seven more landing sites have a smaller map built automatically from one HiRISE terrain strip each.
- **Layers.** Slope, keep-out ground, geology, night-time warmth, and the rover's path and stops. Each layer has a card saying who measured it, when, how fine its detail really is, how far to trust it, and what not to conclude from it.
- **Walks.** Pick a science target, click any point, or add several stops with time at each. The route is the least-effort way out and a separate way home, never crossing ground steeper than the suit's slope limit (20 degrees, NASA's Artemis III requirement). It gives distance, climb, time, energy, oxygen and radiation, each for a favourable, an expected and a cautious case.
- **The tether.** A line on the map shows how far you can go and still walk home within the allowance. The allowance is the walk-back limit (1 hour by default, or 30 minutes) or the time left of an 8-hour walk, whichever is less. The line shrinks as the walk goes on. The walk is checked at every point against the moment you would be there. The card names the tightest point and shows a chart of the margin along the walk.
- **Around the walk.** Radiation picked up on the walk, NASA's latest forecast of a solar eruption reaching Mars, and a storm drill set against the 20 May 2024 storm Curiosity measured. Sunrise, sunset and whether the walk ends in daylight. Typical pressure, temperature and wind for the hour you set out and over the walk, from Perseverance's weather station in the same season of three past Mars years. When a relay orbiter is in view for a link, from JPL Horizons predictions. Real Perseverance photos taken within 30 m of the route.
- **On the ground.** A to-scale astronaut walks the planned route on the 3D ground, standing at each stop for its time, while the tether shrinks. A first-person view under a simulated helmet display shows the arrow home, the walk-home time and a start-back countdown. A field tablet view shows the same data with cautious values only.
- **Sharing.** The link holds the site, the walk and the tether settings, so it opens the same walk with the same verdict.

### How it works

- **Data preparation.** Python with rasterio and NumPy reads the parts of the NASA and USGS source files it needs and writes small static files: image and terrain tiles, routing grids of 4 m cells (mean height and steepest slope), rover stops and photos, and orbiter passes.
- **The app.** TypeScript, built with Vite, drawn with MapLibre GL JS. It has no server, no login and no database, and is hosted on GitHub Pages.
- **Routes and the tether.** A Web Worker searches the routing grid once from home and once towards home with a walking model for a suited person in Mars gravity. The model is the speed and energy equations from the SEXTANT traverse planner, with suit masses and walking speeds from NASA's 2026 study of Mars spacesuit mass. Each route is then a quick look-up. The tether is the cautious time to walk home from every cell, compared with the allowance.
- **Mars, not Earth.** All distances use the Mars sphere the USGS products use (radius 3,396,190 m), gravity 3.71 m/s², and Mars local time from NASA's Mars24 method. Heights are relative to the Mars areoid.

### Benefits and intended impact

The first people on Mars will walk to their science. The limit on every walk is getting home with time and air to spare. Tether turns that limit into a line on a map and a plain verdict, and is honest about every number behind it.

- **Inside the habitat**, a crew can plan a walk and see whether it is safe, where it gets tight, and how sure each number is.
- **Outside**, the same answer is on a field tablet and under a helmet display, with cautious values only.
- **For anyone**, it is one public link with no login, built from real NASA data. The pipeline already builds a smaller map automatically from one HiRISE terrain strip, as it did for seven landing sites.

### What is new about it

- **The tether.** A map usually shows where you could go. Tether shows how far you can go and still get back, as a line that shrinks while you walk. The walk is checked at every point against the moment you would be there, with time at each stop counted, because standing still is still time outside.
- **Honest numbers.** Every number has a source, a date and a range, and a confidence grade: A means measured here on the ground; B, measured here from orbit; C, measured elsewhere or modelled; D, assumed. Where we have no data, the app says "no data".
- **You can walk the plan.** A to-scale astronaut walks the route on the real terrain, and a first-person view under a simulated visor shows what the numbers mean on the ground.

### What we considered

- **Safety first.** Getting home is the limit on every walk, so the tether uses the cautious case, and keep-out ground is anything steeper than NASA's 20-degree requirement for walking.
- **The person in the suit.** Speed and energy are for a suited person in Mars gravity, in three cases from published suit masses and walking speeds, not for a rover.
- **Mars is not Earth.** Mars radius, gravity, local time and heights throughout; no Earth defaults.
- **Honesty.** Nothing is invented. Every prediction is a range, and our limits are listed below rather than hidden.
- **Easy to open.** Static files on one public link: no server, no login, no account. It can be installed as an app in Chrome or Edge.

### How it answers the challenge

The challenge asks for "a layered, integrated view of a location or route on the Martian surface that pulls together data from multiple NASA science missions and could help a human explorer plan and carry out a successful Marswalk". Line by line:

- **A map, tool or interface a Mars astronaut could use, with NASA data and tools.** A planner for the habitat, a field tablet view and a helmet display concept, all from NASA data.
- **Science goals, and a location to explore.** Bright Angel, where Perseverance found the Cheyava Falls rock with possible signs of past life; and the boxwork on Mount Sharp, the challenge's own example, where Curiosity drilled Altadena in 2025. Targets are real rover stops, each with its reason and source.
- **Data from multiple NASA science missions.** Mars Reconnaissance Orbiter (HiRISE, CTX), Mars Odyssey (THEMIS), Perseverance, Curiosity, Viking, and NASA's space weather, Deep Space Network and JPL Horizons services.
- **At least three kinds of data, layered for context.** At Bright Angel: optical, topographic (terrain and slope), thermal (night infrared), geologic, radiation, atmospheric (weather by hour) and space weather, each with a card saying who measured it, when and how far to trust it.
- **Astronaut safety first; space weather and radiation.** The tether: how far you can go and still walk home in time, checked at every point of the walk. Radiation dose for the walk with a range, NASA's latest solar storm forecast, and a storm drill.
- **Spacesuits and loads change how people move.** Walking speed and energy for a suited person in Mars gravity, in three cases from published suit masses and speeds; a slope limit from NASA's Artemis requirement.
- **A route map that avoids obstacles such as large rock formations.** The least-effort route out and a separate way home, never on ground steeper than the suit's limit. Features larger than about 4 m show up as steep ground; smaller rocks are not seen, and the app says so.
- **A display inside the habitat, a tablet, or a helmet visor.** All three, and a first-person walk-through under a simulated visor with the arrow and time home.
- **Rover photos, so the astronaut knows what to expect.** Real Perseverance photos taken within 30 m of the planned route, each with its date and credit.
- **Rovers carrying crew and tools, or astronauts in pairs.** The crew rover can be driven to a new spot and becomes home for every walk. Pairs are not modelled.
- **Updates on current conditions.** NASA's live solar storm forecast and the live link to Earth. Surface weather is typical for the season, from past Mars years, not live.

### How we checked it

Perseverance stopped 116 times inside the Bright Angel box and logged how far it was tilted each time. Against our slope from orbit, the typical difference is 1.4 degrees, 9 in 10 are within 4.0 degrees, and the correlation is 0.89. The rover's drivers chose gentle ground, so this says more about gentle slopes than steep ones. The route card uses that 4-degree figure to flag stretches close to the slope limit. At the Gale boxwork the same check is weaker (typical 2.3 degrees, 9 in 10 within 6.6 degrees, correlation 0.49, over 285 stops), and the app shows it as it is.

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
- **Gale is less sure than Bright Angel.** Its mosaics are tied to Mars's global laser map, good to about 100 m in absolute position (Curiosity's stops sit on the same mosaic, so they agree with each other). Its slope check is weaker (see above). It has no rover photos, because our photo index reads only Perseverance's feed, and no drive lines, because NASA's Curiosity path file gives no sol numbers to date them. The boxwork ridges themselves, about 1 to 2 m tall, are smaller than the terrain can show.
- **Orbiter predictions end.** They were saved from JPL Horizons on 14 November and end on 30 November 2026, where MRO's own prediction ends. After that the app replays the saved window and says so. The elevation a relay link needs and what counts as overhead for a camera are assumed (grade D); we found no published figure.
- **The walk-through is a demonstration, not a game.** It uses the same walking model as the route card and the same tether, with no score.

### Tools, languages and software

TypeScript, Python, MapLibre GL JS, Vite, Vitest, NumPy, Rasterio with GDAL, Fiona, Pillow, PyYAML, pytest, GitHub Pages, and Claude Code (see below). Our own work is under the Apache License 2.0; every third-party licence is listed in the README. Every source we used, each with its full link, is cited in docs/REFERENCES.md in the repository.

### How we used AI

We used an AI coding assistant, Claude Code (Anthropic), with the models Claude Opus 5.5, Claude Sonnet 5.5 and Claude Fable 5.2, throughout the event. Working task by task under the team's direction, it wrote most of the code, the tests and the documentation; searched for and read sources, and checked that NASA data addresses respond; reviewed the code for suspected bugs, which it then fixed; suggested some features, such as the chart of the tether margin along the walk; and laid out the interface and wrote the app icon as SVG code. People on the team decided what to build, chose between options, set the scope and looked at the results in the browser. Not every line has been reviewed by a person. Every session is logged in the repository (docs/AI_USE.md), and the app says so in its side panel, its map credit line and its page metadata.

The idea started with Sam: a map of Mars with as much real data and as many sites as we could manage, shown on a globe, with as many settings as possible. Joseph had the idea of in-between image layers round each site that blend into one another, so the detail sharpens step by step as you zoom in from the globe to walking scale. Many of the other features came to Sam while we were building. Claude Code turned the plan into written documents and suggested some features along the way.

**[FILL: keep only if the scripted draft video is used]** The demo video is a screen recording of the live app, captured by a script Claude Code wrote, which also added the subtitles and end card. Every frame shows the real app and real NASA data.

Apart from the app icon (five plain shapes written as SVG code), there are no AI-made images and no AI audio in the project. Every image of Mars is a real NASA image with its credit.

---

## 6. Use of Super Intelligence (SI)

A list of options to tick. Judges do not see this field, but it must be truthful. The options as the form shows them (pasted by the owner on 15 Nov), with the answer from [AI_USE.md](AI_USE.md):

| Option | Tick? | Why |
|---|---|---|
| Ideation or Brainstorming | Yes | Claude Code wrote the planning documents on 13 Nov, suggested some features (the chart of the tether margin along the walk), and chose between options when the owner asked it to use its judgment. Where the core idea came from is the [FILL] in Project Details |
| Research or Information Gathering | Yes | It searched for and read the sources, and checked that NASA data addresses respond |
| Data Analysis and Interpretation | Yes | It wrote and ran the pipeline that turns NASA's files into the app's data, the slope check against rover tilt, the MEDA weather summary and the alignment check |
| Building SI/ML Into the Project | No | The app contains no AI or machine learning |
| Coding, Debugging, or Troubleshooting | Yes | It wrote most of the code and tests, and found and fixed bugs |
| Writing, Editing, or Translation | Yes | It wrote most of the documentation, the README and this page |
| Visual Design or Image Creation | Yes | It laid out and styled the interface, and wrote the app icon (five plain shapes) as SVG code |
| Presentation, Video, or Audio | Yes, if the scripted draft video is used | A script it wrote recorded the screen, retimed the scenes and added the subtitles and end card. If the video is recorded by hand instead, No |
| Other Project-Related SI Use | No | Nothing left over: code review is covered by Coding |
| None / Did not use SI or SI tools | No | |

If the team decides the scripted video counts as AI-generated video, the guide requires a visible watermark on it.

## 7. NASA Data

The form takes at most 25 links (found by the owner on 15 Nov). One pair per entry: press "Add New Link", then paste the Link Text and the Link Url. Where two sources share a row, the row links to the first and names the second in its text; every source keeps its full link in [REFERENCES.md](REFERENCES.md), which is public in the repository and named in Project Details.

| # | Link Text | Link Url |
|---|---|---|
| 1 | HiRISE (Mars Reconnaissance Orbiter): 25 cm image mosaic and 1 m terrain mosaic of Jezero crater, USGS (Fergason and others 2020) | `https://astrogeology.usgs.gov/search/map/mars_2020_terrain_relative_navigation_hirise_orthorectified_image_mosaic` |
| 2 | CTX (Mars Reconnaissance Orbiter): image mosaic and terrain of Jezero crater, USGS (Fergason, Galuszka and Hare 2020) | `https://doi.org/10.5066/P9GV1ND3` |
| 3 | HiRISE (Mars Reconnaissance Orbiter): 25 cm merged image mosaic and 1 m merged terrain of Gale crater, USGS (Calef and Parker 2016) | `https://astrogeology.usgs.gov/search/map/mars_msl_gale_merged_orthophoto_mosaic_25cm` |
| 4 | HiRISE archive, University of Arizona: terrain models and images at seven landing sites, and the image labels that date the Gale source images | `https://hirise.lpl.arizona.edu/PDS/DTM/` |
| 5 | CTX (Mars Reconnaissance Orbiter): global mosaic by the Murray Lab, Caltech, served as tiles by Esri (OnMars CTX) | `https://murray-lab.caltech.edu/CTX/` |
| 6 | Viking Orbiter: colourised global mosaic of Mars, USGS and NASA Ames, read through NASA Mars Trek | `https://astrogeology.usgs.gov/search/map/mars_viking_colorized_global_mosaic_232m` |
| 7 | THEMIS (Mars Odyssey) night-time infrared mosaic, and the geologic map of Jezero crater and the Nili Planum region: USGS SIM 3464 (Sun and Stack 2020) | `https://doi.org/10.3133/sim3464` |
| 8 | Perseverance (Mars 2020): rover stops, tilt and drive path, mission location files | `https://mars.nasa.gov/mmgis-maps/M20/Layers/json/M20_waypoints.json` |
| 9 | Perseverance (Mars 2020): navigation camera raw images | `https://mars.nasa.gov/mars2020/multimedia/raw-images/` |
| 10 | Perseverance MEDA: derived weather data, NASA Planetary Data System Atmospheres Node (MEDA by CAB, CSIC-INTA, Spain) | `https://atmos.nmsu.edu/PDS/data/PDS4/Mars2020/mars2020_meda/` |
| 11 | Curiosity (Mars Science Laboratory): rover stops and tilt, mission location file; and one raw image record, used to set Curiosity's sol clock | `https://mars.nasa.gov/mmgis-maps/MSL/Layers/json/MSL_waypoints.json` |
| 12 | Curiosity REMS: daily weather at Gale crater (REMS by CAB, CSIC-INTA, Spain) | `https://mars.nasa.gov/rss/api/?feed=weather&category=msl&feedtype=json` |
| 13 | Curiosity RAD: radiation measured on the surface at Gale crater (Hassler and others 2014) | `https://ntrs.nasa.gov/citations/20180007641` |
| 14 | NASA/JPL: the 20 May 2024 solar storm measured at Mars (10 June 2024) | `https://www.jpl.nasa.gov/news/nasa-watches-mars-light-up-during-epic-solar-storm/` |
| 15 | NASA CCMC DONKI: space weather notices from the Moon to Mars Space Weather Analysis Office, read through NASA Open APIs (api.nasa.gov) | `https://ccmc.gsfc.nasa.gov/tools/DONKI/` |
| 16 | NASA Deep Space Network Now: the live link to Earth | `https://eyes.nasa.gov/dsn/dsn.html` |
| 17 | JPL Horizons: predicted positions and passes of MRO, Mars Odyssey, Mars Express and TGO | `https://ssd.jpl.nasa.gov/horizons/` |
| 18 | Mars24 algorithm, NASA GISS: Mars local time and the Sun (Allison and McEwen 2000) | `https://www.giss.nasa.gov/tools/mars24/help/algorithm.html` |
| 19 | Mars Spacesuit Mass Requirements (Ogilvie and others 2026, NASA Johnson Space Center): suit masses, walking speeds, walk-back limits | `https://ntrs.nasa.gov/citations/20260003038` |
| 20 | Artemis Human Landing System Overview (Ortiz 2025, NASA): the 20-degree walking slope limit | `https://ntrs.nasa.gov/citations/20250009323` |
| 21 | NASA Space Science Data Coordinated Archive (NSSDCA) catalogue: published landing positions | `https://nssdc.gsfc.nasa.gov/nmc/` |
| 22 | Mars Reconnaissance Orbiter and Mars Odyssey mission pages: camera and relay roles | `https://science.nasa.gov/mission/mars-reconnaissance-orbiter/` |
| 23 | NASA: Perseverance scientists find intriguing Mars rock, Cheyava Falls (25 July 2024) | `https://www.nasa.gov/missions/mars-2020-perseverance/perseverance-rover/nasas-perseverance-rover-scientists-find-intriguing-mars-rock/` |
| 24 | NASA: Curiosity starts unpacking boxwork formations (23 June 2025); and the Curiosity blog for sols 4568 to 4569 on the Altadena drill hole | `https://www.nasa.gov/missions/mars-science-laboratory/curiosity-rover/nasas-curiosity-mars-rover-starts-unpacking-boxwork-formations/` |
| 25 | NASA/JPL: Curiosity sees Martian "spiderwebs" up close (23 Feb 2026) | `https://www.jpl.nasa.gov/news/nasas-curiosity-rover-sees-martian-spiderwebs-up-close/` |

## 8. Space Agency Partner & Other Data

Same as above: one pair per entry. The form asks for every resource, including code and open-source software, so the software is listed with its version and licence.

| # | Link Text | Link Url |
|---|---|---|
| 1 | ESA Mars Express: trajectory (through JPL Horizons), and HRSC terrain and images inside the USGS Gale mosaics (ESA/DLR/FU Berlin) | `https://www.esa.int/Science_Exploration/Space_Science/Mars_Express` |
| 2 | ESA ExoMars Trace Gas Orbiter: trajectory, through JPL Horizons | `https://www.esa.int/Science_Exploration/Human_and_Robotic_Exploration/Exploration/ExoMars` |
| 3 | Dickson and others 2024: the global CTX mosaic of Mars (Earth and Space Science) | `https://doi.org/10.1029/2024EA003555` |
| 4 | Guo and others 2015: modelling the dose rate measured by Curiosity's RAD (Astrophysical Journal) | `https://arxiv.org/abs/1507.03473` |
| 5 | pextant, the open-source SEXTANT traverse planner (MIT licence): walking speed and energy equations from Marquez and Cummings 2008 and Santee and others 2001 | `https://github.com/norheim/pextant` |
| 6 | Weir 1949: oxygen use from energy (Journal of Physiology) | `https://doi.org/10.1113/jphysiol.1949.sp004363` |
| 7 | MapLibre GL JS 6.18 (BSD-3-Clause): the globe, map and 3D terrain | `https://maplibre.org/` |
| 8 | Vite 8.3 (MIT): building the site | `https://vite.dev/` |
| 9 | TypeScript 7.0 (Apache-2.0) | `https://www.typescriptlang.org/` |
| 10 | Vitest 5.1 (MIT): app tests | `https://vitest.dev/` |
| 11 | NumPy 2.5 (BSD-3-Clause and others): data preparation | `https://numpy.org/` |
| 12 | Rasterio 1.5 (BSD-3-Clause): reading terrain and image files | `https://rasterio.readthedocs.io/` |
| 13 | GDAL 3.12 (MIT), used through Rasterio | `https://gdal.org/` |
| 14 | Fiona 1.10 (BSD-3-Clause): reading the geologic map | `https://fiona.readthedocs.io/` |
| 15 | Pillow 13.0 (MIT-CMU): writing tile images | `https://python-pillow.org/` |
| 16 | PyYAML 6.0 (MIT): reading site configs | `https://pyyaml.org/` |
| 17 | pytest 9.2 (MIT): pipeline tests | `https://pytest.org/` |
| 18 | GitHub Pages: hosting the public site | `https://pages.github.com/` |
| 19 | Claude Code (Anthropic): the AI coding assistant that wrote most of the code and documents, under the team's direction | `https://claude.com/claude-code` |

Left out on purpose, because nothing in the app or this page uses them: the CRISM mineral products (downloaded, not processed), NASA's Curiosity path file (read, but it has no sol numbers, so Gale has no drive lines), and papers we read only in part for ideas we did not build (Ehresmann 2021 and Guo 2021 on terrain shielding, Wold 2018 on forecast error, Hueso 2023 on dust devils, Kirk 2021, Kluis 2022, Jacob and others). If the team prefers to cite everything consulted, add them from [REFERENCES.md](REFERENCES.md). Spain's Centro de Astrobiología (CSIC-INTA) is credited in entries 10 and 12 of NASA Data rather than on its own, because its website did not answer when checked.

## 9. Project Submission Verification, then Submit

- Turn the edit **Lock** on while you paste, so a teammate does not overwrite you. "Save Progress" makes the page public but does not submit it.
- Tick the two boxes only once every [FILL] is gone and every link pair is in.
- Check against the terms read on 15 Nov (summary in [DECISIONS.md](DECISIONS.md)):
  - our licence is named;
  - every third-party licence is listed;
  - nothing promotes a commercial product;
  - no personal details;
  - no one under 18;
  - each person shown has agreed;
  - every team member is named as themselves.
- Run the Sunday list in [SUBMISSION_CHECKLIST.md](SUBMISSION_CHECKLIST.md).
- Press "Submit for Judging" and take a screenshot of the notification bar. Changes are allowed until 23:59 local time, and only the last submission is judged.
