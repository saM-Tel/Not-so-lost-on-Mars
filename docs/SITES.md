# Sites: how far "all sites" can go

Prepared 13 November 2026, before the event, as planning.

## Answer

Yes, every NASA landing site can be in the app, and so can any point on Mars. They cannot all be at the same quality, because the data is not. So each site carries a readiness level that the user can see, and features switch on only where the data supports them.

A route planned on 20 m terrain must never look as trustworthy as one planned on 1 m terrain. Showing the level openly is what makes "all sites" a strength.

## Readiness levels

| Level | Name | Data needed | What the app offers |
|---|---|---|---|
| 1 | Walk-ready | 1 m terrain mosaic, 25 cm imagery, rover measurements on the ground | Everything: walking routes, tether, storm mode, photos, validation |
| 2 | Scout-ready | A HiRISE terrain model of 1 to 2 m and HiRISE imagery, usually a narrow strip | Walking routes and tether inside the strip, marked "not checked on the ground" |
| 3 | Survey | CTX terrain at 20 m and CTX imagery | Layers and vehicle-scale route sketches only. No walking plan |
| 4 | Overview | Global layers only | Layered context map, radiation estimate by altitude, season and Sun. No routes |

## What exists for each site

Checked on 13 November against the Mars Trek catalogue and the PDS search service. Positions are approximate and for orientation only; take exact values from the data.

| Site | Mission | About | Trek imagery | Terrain | Ground data | Level |
|---|---|---|---|---|---|---|
| Jezero crater | Perseverance, 2021 to now | 18.44 N, 77.45 E | 25 cm corrected mosaic | USGS 1 m mosaic | Stops to sol 2022, photos, weather archive | 1 |
| Gale crater boxwork | Curiosity, 2012 to now | 4.80 S, 137.38 E: Curiosity's Altadena drill stop (landed at 4.59 S, 137.44 E) | HiRISE mosaic | USGS 1 m mosaic | Stops to sol 5070, photos, daily weather, radiation | 1 |
| Columbia Hills, Gusev | Spirit, 2004 to 2010 | 14.57 S, 175.47 E | HiRISE mosaic | 1 m model on Trek; 6 PDS models nearby | Traverse source to be found | 2 |
| Meridiani and Endeavour | Opportunity, 2004 to 2018 | 1.95 S, 5.53 W | HiRISE mosaic | Endeavour and Victoria models; 5 PDS models nearby | Traverse source to be found | 2 |
| Elysium Planitia | InSight, 2018 to 2022 | 4.50 N, 135.62 E | HiRISE mosaic | Combined model on Trek; 4 PDS models nearby | Weather archive at the PDS | 2 |
| Arctic plain | Phoenix, 2008 | 68.22 N, 125.75 W | HiRISE mosaic | 3 PDS models nearby | Weather archive at the PDS | 2 |
| Ares Vallis | Pathfinder, 1997 | 19.13 N, 33.22 W | HiRISE mosaic | 1 PDS model nearby | None planned | 2 |
| Chryse Planitia | Viking 1, 1976 | 22.27 N, 47.95 W | HiRISE mosaic | 1 PDS model nearby | None planned | 2 |
| Utopia Planitia | Viking 2, 1976 | 47.64 N, 134.29 E | HiRISE mosaic | 1 PDS model nearby | None planned | 2 |
| Candidate human zones: Deuteronilus Mensae, East Melas, Coprates, Apollinaris and others | None | Various | CTX mosaics | CTX models on Trek | None | 3 |
| Anywhere else | None | Any | Global CTX and HiRISE mosaics | Global 200 m model | None | 4 |

"PDS models nearby" counts products that touch a box of about half a degree around the site. Whether a model covers the exact landing point must be checked per site.

The one model chosen for each site (four for Opportunity), with its address and size, is listed in [DATA_CATALOG.md](DATA_CATALOG.md) under "Other landing sites".

## Built so far (14 Nov, 16:55)

| Site | Level | What is built |
|---|---|---|
| Bright Angel, Jezero | 1 | 3 km box: 25 cm image, 1 m terrain with CTX 20 m terrain round it to 10 km, routing grids, rover stops and path, photos, terrain checks, hero scenario (home and three targets at rover stops), night infrared layer, typical weather by local hour from Perseverance's MEDA (15 Nov) |
| Chryse Planitia, Utopia Planitia, Ares Vallis, Columbia Hills, Meridiani, Arctic plain, Elysium Planitia | 2 | 2 km box at the centre of one HiRISE terrain strip: 1 m image and terrain warped from the strip's own projection, routing grids. Automatic, not reviewed |
| Gale crater boxwork | 1 | Built 15 Nov: 3 km box centred on Curiosity's Altadena drill stop (116_1944), 25 cm image and 1 m terrain from the USGS Gale mosaics (Calef and Parker 2016), routing grids, rover stops, terrain checks (typical 2.3 degrees, 9 in 10 within 6.6 degrees, correlation 0.49, over 285 stops), home and three targets at Curiosity's stops. No photos and no drive lines. Typical weather from Curiosity is built |
| All nine | | Approach imagery: CTX rings of 320, 40 and 12 km |

The owner moved the level 2 builds ahead of Three Forks and Gale on 14 November (DECISIONS).

## Order of work

1. **Mars globe with every site marked.** A marker per site showing its level and what data exists. It uses one global image only, and it makes the "any site" claim visible from the first screen. The team owner put this first on 14 November.
2. **Bright Angel, Jezero** (level 1). The hero. Fully curated: named targets, chosen photos, validation. No other site is built until its must-haves work.
3. **Three Forks, Jezero** (level 1). Same files as the hero, so nearly free.
4. **Gale crater boxwork** (level 1). The example in the challenge statement, and the only site with radiation measured in place.
5. **Level 2 sites, built by the pipeline without curation.** Columbia Hills first, then Endeavour, then InSight. Each is a config file and a pipeline run. They carry an "automatic build, not reviewed" label.
6. **Level 3 zones.** Only if everything above is done.

Stop adding sites at the Sunday 12:00 freeze, wherever we are.

## What each site config must state

- Site id, display name, mission, readiness level
- The box to build, in east longitude and planetocentric latitude
- Addresses of the terrain and image files, with product ids
- "Home" position for the tether and why it was chosen
- Named science targets with positions and one-line reasons, or none
- Dates and accuracy for every source, per [CONFIDENCE.md](CONFIDENCE.md)
- Known problems with the data at this site

## Risks of going wide

| Risk | Guard |
|---|---|
| The hero suffers | No second site before Saturday 23:00 |
| An automatic site has bad terrain and gives a silly route | Level label, "not reviewed" label, and a route-quality check that refuses to plan across missing or seam-damaged terrain |
| The repository grows too large to host | Size budget per site; smaller boxes and fewer zoom levels for level 2 |
| Each site hides a new longitude convention or projection | The pipeline converts at the boundary and prints the box it built for a human to check against Trek |
