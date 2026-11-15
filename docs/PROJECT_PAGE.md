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

**[FILL]** Add the repository address if the team makes it public: https://github.com/sam-tel/Not-so-lost-on-Mars

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

**[FILL]** Paste the table "How it answers the challenge" from the README. It maps each line of the challenge statement to what Tether does.

### What it does not do yet

**[FILL]** Copy the list under "What it does not do yet" in the README at the time of submitting. It is kept there so it stays current.

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
- **Papers, data products, software and images:** **[FILL]** Paste the full list from [REFERENCES.md](REFERENCES.md) at the time of submitting, with each software licence from the README. The terms say every source must be cited, even open-source ones. A team that does not cite them can lose an award.

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
