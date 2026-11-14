# Tether: not so lost on Mars

Tether is a map for an astronaut on foot on Mars. It answers one question: **can I do this science and still get home safely?**

**Open it:** https://sam-tel.github.io/Not-so-lost-on-Mars/

**Go straight to a planned walk:** https://sam-tel.github.io/Not-so-lost-on-Mars/#site=bright-angel&to=77.31589,18.49948

Team "Not so lost on Mars", NASA Space Apps Challenge 2026, challenge "Interplanetary Survival Guide: Martian Map".

## What it does

The app opens on a globe of Mars with a marker at nine NASA landing sites. One site is built in full: **Bright Angel** in Neretva Vallis, Jezero crater, where the Perseverance rover cored the "Cheyava Falls" rock in July 2024.

At Bright Angel you can:

- **See the ground at walking scale.** A 3 km by 3 km box with a 25 cm image from orbit, draped over 3D terrain.
- **Plan a walk.** Click any point. The app draws the least-effort way out and a separate way home, and avoids ground steeper than 20 degrees. It gives distance, climb, time and energy as an expected value with a favourable and a cautious value beside it.
- **See the tether.** A line on the map shows how far you can go and still walk home in time. It shrinks as the walk goes on. A walk that leaves it gets a warning.
- **See the radiation cost.** The dose picked up on the walk, and NASA's latest forecast of a solar eruption reaching Mars.
- **See what is really there.** Photos the rover took within 30 m of your route, each with its date, camera and credit.
- **Check every layer.** Each layer has a card saying who measured it, when, how fine its detail really is, how far to trust it, and what not to conclude from it.
- **Share the view.** The address bar holds the site, the target and the tether settings.

The other eight sites show where they are and what data exists for them. They say plainly that they are not built yet.

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

The app shows this check in the side panel, under the layers.

## Where the data comes from

| Data | Source | Used for |
|---|---|---|
| Ground image, 25 cm | HiRISE on Mars Reconnaissance Orbiter; mosaic by USGS (Fergason and others 2020) | The map at Bright Angel |
| Terrain heights, 1 m grid | HiRISE stereo images; mosaic by USGS (Fergason and others 2020) | 3D view, slope, routes |
| Rover stops, path and tilt | NASA Mars 2020 mission location files | Rover layers; the check of our slope |
| Rover photos | NASA Mars 2020 raw image feed | Photos along the route |
| Whole-planet image | Viking Orbiter colour mosaic, USGS and NASA Ames | The globe |
| Walking speed and energy by slope | The SEXTANT traverse planner's public code, which credits Marquez 2008 and Santee and others 2001 | Time and energy of a walk |
| Suit mass, walking speeds, walk-back limits, 8-hour walk | Ogilvie and others 2026, "Mars Spacesuit Mass Requirements", NASA Johnson Space Center | The three cases; the tether |
| Slope limit for walking, 20 degrees | NASA Artemis III requirement, in Ortiz 2025 | Keep-out ground |
| Radiation dose rates | Curiosity's RAD instrument at Gale crater (Hassler and others 2014; Guo and others 2015) | Dose on a walk |
| Space weather forecasts | NASA CCMC DONKI notices from the Moon to Mars Space Weather Analysis Office | The forecast banner |

Full citations, with what we read and what we did not, are in [docs/REFERENCES.md](docs/REFERENCES.md).

## What it does not do yet

We would rather list these than hide them.

- **Nobody has walked on Mars.** Time and energy come from a model built on Apollo data and tests on Earth, applied to Mars gravity. They are grade C, and the app says so.
- **Home is a stand-in.** It sits where the rover stood at Cheyava Falls until a parking place for the crew's vehicle is chosen.
- **One target at a time.** A walk goes to one point and back.
- **The tether is a time limit only.** It does not yet budget oxygen or energy, and takes no reserve.
- **Loose sand and small rocks are not counted.** The terrain cannot show anything smaller than about 3 to 5 m.
- **No geology layer yet.**
- **Radiation is the everyday background.** A solar storm can add far more in a few hours and is not in the dose figure.
- **Photos are not sorted by the way they face.**
- **Only Bright Angel has a map.** The other sites' terrain files use other map projections that our pipeline cannot read yet.

## Run it yourself

You need Node 20 or later.

```
cd app
npm install
npm run dev
```

Then open the address it prints. To run the checks (types, tests, build): `npm run check`.

The app is static files. It has no server, no login and no database. All the data it needs is in `app/public/data/`.

To rebuild that data from the source files you need Python 3.12:

```
cd pipeline
py -3.12 -m venv .venv
.venv\Scripts\python -m pip install -r requirements.txt
.venv\Scripts\python build_site.py ../sites/bright-angel.yaml
```

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

Every session is logged in [docs/AI_USE.md](docs/AI_USE.md). There are no AI-generated images, video or audio anywhere in the project. Every picture is a real NASA image with its credit.

## Credits

Images and data: NASA/JPL-Caltech, University of Arizona, USGS Astrogeology Science Center, NASA Ames, NASA CCMC. This project is not endorsed by NASA.
