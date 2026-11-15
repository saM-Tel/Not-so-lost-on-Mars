# Tether: not so lost on Mars

Tether is a map for an astronaut on foot on Mars. It answers one question: **can I do this science and still get home safely?**

**Open it:** https://sam-tel.github.io/Not-so-lost-on-Mars/

**Go straight to the hero site:** https://sam-tel.github.io/Not-so-lost-on-Mars/#site=bright-angel (opens on a walk to the Cheyava Falls rock)

Team "Not so lost on Mars", NASA Space Apps Challenge 2026, challenge "Interplanetary Survival Guide: Martian Map".

## What it does

The app opens on a globe of Mars with a marker at nine NASA landing sites. Zooming in on any of them shows real orbital images of the land around it at finer and finer detail. Two sites are built in full: **Bright Angel** in Neretva Vallis, Jezero crater, where the Perseverance rover cored the "Cheyava Falls" rock in July 2024, and the **boxwork on Mount Sharp** in Gale crater, where Curiosity drilled the "Altadena" rock in June 2025. Seven more landing sites have a smaller map built automatically from one strip of 1 m terrain.

At Bright Angel you can:

- **See the ground at walking scale.** A 3 km by 3 km box with a 25 cm image from orbit, draped over 3D terrain.
- **Plan a walk.** Pick one of three science targets at real rover stops, or click any point. The app draws the least-effort way out from the crew's rover and a separate way home, and avoids ground steeper than the suit's slope limit (20 degrees by default). It gives distance, climb, time, energy and oxygen as an expected value with a favourable and a cautious value beside it, a height profile, and how much of the walk is close to the slope limit.
- **Walk through several stops.** Add stops on the map or from the science targets, put them in order, and say how long you will spend at each. Time at a stop counts against the tether, the radiation and the daylight check, because standing still is still time outside.
- **See the tether.** A line on the map shows how far you can go and still walk home in time. It shrinks as the walk goes on. The walk is checked at every point against the moment you would be there, and the card names the tightest point, with a small chart of the margin along the walk. A walk that leaves the tether gets a warning.
- **See whether you will have a link.** For the walk and a start time, a timeline of when a relay orbiter is in view and when a camera orbiter passes high overhead in daylight, from JPL Horizons predictions saved by the pipeline. The stretches with no link glow on the map. The orbiters also appear on the globe. Once the saved predictions end, the app replays them and labels them with their real dates.
- **Walk it.** A to-scale astronaut, 1.8 m tall, walks the planned route on the 3D ground at a speed-up you choose, standing at each stop for its time, or you steer it with the keyboard. It moves at the cautious walking speed for the slope underfoot and cannot enter keep-out ground. A first-person view puts you at eye height under a simulated helmet display: walk-home time, tether margin and a start-back countdown, and an arrow that follows the quickest walkable way home, which is also drawn on the ground in blue. It is labelled as simulated.
- **See the radiation cost.** The dose picked up on the walk, and NASA's latest forecast of a solar eruption reaching Mars.
- **Practise a storm.** Pick a warning time; the app says whether to go home or to start home and shelter under steep ground, and sets the 20 May 2024 solar storm measured at Gale crater beside the walk's own dose.
- **Choose when to go.** Mars local time, sunrise and sunset for today's season, whether the walk ends in daylight, and shading of the ground for the Sun's direction. At Bright Angel, typical weather for the hour you set out and over the walk, from three past Mars years of Perseverance's weather station in the same season: pressure, temperature and wind, each with its spread and the number of sols behind it.
- **Take it outside.** A field tablet view with one large status card and big buttons. The Helmet button opens the first-person view under the simulated visor.
- **See what is really there.** Photos the rover took within 30 m of your route, each with its date, camera and credit.
- **Check every layer.** Each layer has a card saying who measured it, when, how fine its detail really is, how far to trust it, and what not to conclude from it.
- **Share the view.** The address bar holds the site, the target or the stops with the time at each, and the tether settings, so a copied link opens the same walk with the same verdict. A walk can be downloaded as a GeoJSON file.
- **Install it.** In Chrome or Edge it can be installed as an app; it keeps the map it has shown, so it opens quickly next time.
- **See the link to Earth.** A live line says which Mars spacecraft NASA's Deep Space Network is talking to and how long a message takes.

All of this was built during the 39 hours of the event. Most of it has been tried in a scripted browser; [docs/STATUS.md](docs/STATUS.md) says what a person has checked and what is still open.

At Gale the walks start from a crew rover parked at one of Curiosity's own stops and go to the Altadena drill site and two more stops where Curiosity worked; typical weather there comes from Curiosity's records.

## How it answers the challenge

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

## Three promises

1. **Hyperlocal.** Metre-scale detail over a few kilometres, not another global viewer.
2. **Human.** Routes, effort and limits for a person in a suit, not for a rover.
3. **Honest.** Every layer shows its source and its dates. Every prediction shows a range. Nothing is invented: where we have no data, the app says "no data".

Each number carries a confidence grade:

| Grade | Meaning |
|---|---|
| A | Measured at this place by an instrument on the ground |
| B | Measured at this place from orbit |
| C | Measured somewhere else, or modelled, and applied here |
| D | An assumption or engineering judgement |

## Checked against the rover

Perseverance stopped 116 times inside the Bright Angel box and logged how far it was tilted each time. We compared that with the slope we worked out from orbit:

- At all 116 stops, the typical difference is **1.4 degrees**, and 9 in 10 are within 4.0 degrees. The correlation is 0.89.
- The rover's drivers chose gentle ground, so this says less about steep slopes than about gentle ones.

At Gale the same check over Curiosity's stops in the boxwork box is weaker: typical 2.3 degrees, 9 in 10 within 6.6 degrees, correlation 0.49, over 285 stops. The terrain mosaic there mixes HiRISE terrain with coarser terrain where HiRISE stereo was lacking, so trust its slopes less.

The app shows each site's check in the side panel, under the layers.

## Where the data comes from

| Data | Source | Used for |
|---|---|---|
| Ground image, 25 cm | HiRISE on Mars Reconnaissance Orbiter; mosaic by USGS (Fergason and others 2020) | The map at Bright Angel |
| Terrain heights, 1 m grid | HiRISE stereo images; mosaic by USGS (Fergason and others 2020) | 3D view, slope, routes |
| Rover stops, path and tilt | NASA Mars 2020 mission location files | Rover layers; the check of our slope |
| Rover photos | NASA Mars 2020 raw image feed | Photos along the route |
| Whole-planet image | Viking Orbiter colour mosaic, USGS and NASA Ames | The globe |
| Land round each site, about 5 m | Context Camera (CTX) on Mars Reconnaissance Orbiter: global mosaic by the Murray Lab at Caltech, and the USGS Jezero mosaic and terrain (Fergason, Galuszka and Hare 2020) | Zooming in; 3D land round Bright Angel |
| Seven landing-site maps, 1 m | HiRISE terrain models and images from the University of Arizona's HiRISE archive | The level 2 sites |
| Gale ground image (25 cm) and terrain heights (1 m grid) | HiRISE on Mars Reconnaissance Orbiter, filled with CTX and Mars Express HRSC; mosaics by USGS (Calef and Parker 2016) | The map at the Gale boxwork |
| Curiosity's stops, tilt and path | NASA Mars Science Laboratory location files | Gale home and targets; the check of our slope |
| Night-time warmth | THEMIS on Mars Odyssey; mosaic by USGS, in the Jezero geologic map package (Sun and Stack 2020) | Where footing may change |
| Geology | Geologic map of Jezero crater and the Nili Planum region, USGS SIM 3464 (Sun and Stack 2020) | The geology layer at Bright Angel |
| Orbiter positions and passes | JPL Horizons, NASA JPL Solar System Dynamics, with trajectories from the NASA and ESA navigation teams (MRO, Mars Odyssey, Mars Express, TGO) | Link and view from orbit; orbiters on the globe |
| Typical weather at Gale | Curiosity's REMS instrument, 14 years of daily records (NASA, Spain's Centro de Astrobiología) | The Gale site |
| Typical weather at Jezero, by hour | Perseverance's MEDA instrument, derived data for the same season in three Mars years (NASA, Spain's Centro de Astrobiología), from NASA's Planetary Data System | When to go at Bright Angel |
| Mars time and the Sun | NASA's Mars24 method (Allison and McEwen 2000) | When to go |
| The 20 May 2024 solar storm | NASA/JPL, 10 June 2024: 8,100 micrograys beside Curiosity | The storm replay |
| Oxygen from energy | Weir 1949 | Oxygen on a walk |
| Link to Earth | NASA Deep Space Network Now | The link line |
| Walking speed and energy by slope | The SEXTANT traverse planner's public code, which credits Marquez 2008 and Santee and others 2001 | Time and energy of a walk |
| Suit mass, walking speeds, walk-back limits, 8-hour walk | Ogilvie and others 2026, "Mars Spacesuit Mass Requirements", NASA Johnson Space Center | The three cases; the tether |
| Slope limit for walking, 20 degrees | NASA Artemis III requirement, in Ortiz 2025 | Keep-out ground |
| Radiation dose rates | Curiosity's RAD instrument at Gale crater (Hassler and others 2014; Guo and others 2015) | Dose on a walk |
| Space weather forecasts | NASA CCMC DONKI notices from the Moon to Mars Space Weather Analysis Office | The forecast banner |

Full citations, with what we read and what we did not, are in [docs/REFERENCES.md](docs/REFERENCES.md).

## What it does not do yet

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

## Run it yourself

You need Node 20 or later.

```
cd app
npm install
npm run dev
```

Then open the address it prints. To run the checks (types, tests, build): `npm run check`. To try the installable app and its offline copy, build it and serve the build: `npm run build`, then `npm run preview`.

The app is static files. It has no server, no login and no database. All the data it needs is in `app/public/data/`.

To rebuild that data from the source files you need Python 3.12:

```
cd pipeline
py -3.12 -m venv .venv
.venv\Scripts\python -m pip install -r requirements.txt
.venv\Scripts\python build_site.py ../sites/bright-angel.yaml
.venv\Scripts\python build_approach.py
.venv\Scripts\python weather.py gale-crater
.venv\Scripts\python weather.py bright-angel
```

`build_site.py` builds one site (any of the nine with a build section in `sites/`); `build_approach.py` builds the imagery round every site; `weather.py gale-crater` needs Curiosity's weather file in `data/raw/feeds/`; `weather.py bright-angel` reads Perseverance's MEDA files (about 1 GB on the first run) and the rover's waypoint file in `data/raw/feeds/`.

On macOS or Linux use `python3.12` and `.venv/bin/python`. The build reads only the part of each source file it needs. We ran it against our own mirror of the files; without that mirror it falls back to the original NASA and USGS addresses, a path we have not timed. The first run takes several minutes.

## How the repository is laid out

| Folder | What is in it |
|---|---|
| `app/` | The web app: TypeScript, Vite, MapLibre GL JS |
| `pipeline/` | Python that turns NASA and USGS files into the small files the app reads |
| `sites/` | One config file for each landing site, with a cited position |
| `app/public/data/` | The pipeline's outputs. Nobody edits these by hand |
| `docs/` | The plan, the specification, the data standard, sources, and a log of how we worked |

## How AI was used

We used an AI coding assistant, Claude Code, throughout. It wrote most of the code, the tests and the documentation in this repository, working task by task under the team's direction, and it did the searches for sources. People on the team decided what to build and chose between options. Not every line has been reviewed by a person; the log says what was checked and what was not.

Every session is logged in [docs/AI_USE.md](docs/AI_USE.md). The app says so too: a line under its intro, the map's credit line, and the `generator` and `ai-assistance` tags in `app/index.html`. There are no AI-generated images, video or audio anywhere in the project. Every picture is a real NASA image with its credit.

## Licence

Our own code, data files and text are released under the Apache License 2.0: see [LICENSE](LICENSE). This is the licence NASA's participant terms apply when a team names none.

Software we use, and its licence:

| Software | Licence | Used for |
|---|---|---|
| MapLibre GL JS | BSD-3-Clause | The globe, the map and 3D terrain; part of the published site |
| Vite | MIT | Building the site (not shipped) |
| TypeScript | Apache-2.0 | Type checking (not shipped) |
| Vitest | MIT | Tests (not shipped) |
| NumPy | BSD-3-Clause and others | Data preparation |
| Rasterio, with GDAL | BSD-3-Clause (GDAL: MIT) | Reading terrain and image files |
| Fiona | BSD-3-Clause | Reading the geologic map |
| Pillow | MIT-CMU | Writing tile images |
| PyYAML | MIT | Reading site configs |
| pytest | MIT | Tests |
| pextant (SEXTANT planner) | MIT | Source of the walking speed and energy equations we coded in `app/src/route/cost.ts` |

The data and images come from NASA, JPL, ESA, USGS and the University of Arizona's HiRISE team, as listed above, with the credit each asks for. Every source, including papers, is cited in [docs/REFERENCES.md](docs/REFERENCES.md).

## Credits

Images and data: NASA/JPL-Caltech, University of Arizona, USGS Astrogeology Science Center, NASA Ames, NASA CCMC, CAB (CSIC-INTA) for REMS and MEDA, NASA/JPL/MSSS/The Murray Lab (CTX mosaic), JPL Horizons. This project is not endorsed by NASA.
