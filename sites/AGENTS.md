# sites: guide

Scaffold added on Saturday 14 November. Configs are YAML files named `<site id>.yaml`.

## Purpose

One config file per site. A config is everything the pipeline needs to build that site, and the only thing that differs between sites.

## Owner

Role A, with role C supplying science targets and their reasons.

## What each config states

- Site id in kebab-case, display name, mission, readiness level from [../docs/SITES.md](../docs/SITES.md)
- The box to build: east longitude and planetocentric latitude
- Addresses and product ids of the terrain and image files
- "Home" for the tether, and why that spot
- Science targets: name, position, one-line reason, and where the position came from
- Dates and accuracy for each source
- Known problems with the data at this site

## Rules for this folder

- No invented coordinates. Every position cites its source, such as a rover stop id and sol.
- State the longitude convention of each source and convert to east-positive, -180 to 180.
- A site that no person has reviewed says so, and the app shows it.
- Adding a site must not need a code change. If it does, fix the pipeline, not the config.

## File index

| File | Site | Level | Reviewed by a person |
|---|---|---|---|
| `bright-angel.yaml` | Bright Angel, Neretva Vallis, Jezero crater (Perseverance) | 1 | No |
| `gale-crater.yaml` | Gale crater boxwork, Mount Sharp (Curiosity) | 1 | No |
| `columbia-hills.yaml` | Columbia Hills, Gusev crater (Spirit) | 2 | No |
| `meridiani.yaml` | Meridiani (Opportunity) | 2 | No |
| `elysium-planitia.yaml` | Elysium Planitia (InSight) | 2 | No |
| `arctic-plain.yaml` | Arctic plain (Phoenix) | 2 | No |
| `ares-vallis.yaml` | Ares Vallis (Pathfinder) | 2 | No |
| `chryse-planitia.yaml` | Chryse Planitia (Viking 1) | 2 | No |
| `utopia-planitia.yaml` | Utopia Planitia (Viking 2) | 2 | No |

Each config holds what the globe needs: identity, readiness level, the position of its marker with its source, the landing position as published, what data exists and known problems. `bright-angel.yaml` also holds what a build needs: the box (a size, centred on the marker position), the terrain and image files with their dates, accuracy and credit, and the rover's stops. Since 14 Nov the seven level 2 configs also hold build settings: a 2 km box at the centre of the terrain model's footprint, and the terrain model and its 1 m ortho image with records whose dates are the source images' START_TIME in the HiRISE archive. Since 15 Nov `gale-crater.yaml` has a build section too: a 3 km box on the boxwork of Mount Sharp centred on Curiosity's Altadena drill stop, the USGS Gale mosaics with dates from their source images' HiRISE labels, and Curiosity's stops. Bright Angel and Gale have a scenario (home and science targets). A rover block names `layerSource` (the end of the rover layer ids, `m20` or `msl`) and `photoFeed` (the raw image feed; only `mars2020` gets photos, from `pipeline/photos.py`).

A position is given in one of two ways, both copied digit for digit from the source: `from: point` with a longitude and latitude, or `from: terrain-footprint` with the four edges of a terrain model, in which case the marker stands at the footprint's centre. `pipeline/config.py` converts the longitude and refuses a position with no source.

A config may have `scenario`: `home` and `targets`, each naming a rover `stop` id (looked up in the waypoints file at build time, so no coordinate is typed), a `name`, a `why` and a `whySourceUrl`; home may be `assumed: true`. Targets need an `id`. `bright-angel.yaml` and `gale-crater.yaml` have one.

A config may also have `approach.near`: a file for the near ring of approach imagery, with the same fields as a source (`file`, `serverPath`, `originalUrl`, `record`). Without it the near ring comes from the CTX global mosaic. `bright-angel.yaml` names the USGS Jezero CTX mosaic, which the HiRISE map was aligned to.

After changing a config, run `build_globe.py --only sites` in `pipeline/` to rewrite `app/public/data/sites.json`.
