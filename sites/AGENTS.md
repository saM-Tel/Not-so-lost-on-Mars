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
| `gale-crater.yaml` | Gale crater (Curiosity) | 1 | No |
| `columbia-hills.yaml` | Columbia Hills, Gusev crater (Spirit) | 2 | No |
| `meridiani.yaml` | Meridiani (Opportunity) | 2 | No |
| `elysium-planitia.yaml` | Elysium Planitia (InSight) | 2 | No |
| `arctic-plain.yaml` | Arctic plain (Phoenix) | 2 | No |
| `ares-vallis.yaml` | Ares Vallis (Pathfinder) | 2 | No |
| `chryse-planitia.yaml` | Chryse Planitia (Viking 1) | 2 | No |
| `utopia-planitia.yaml` | Utopia Planitia (Viking 2) | 2 | No |

Each config holds what the globe needs: identity, readiness level, the position of its marker with its source, the landing position as published, what data exists and known problems. `bright-angel.yaml` also holds what a build needs: the box (a size, centred on the marker position), the terrain and image files with their dates, accuracy and credit, and the rover's stops. It is the only site built. Home and science targets are still to be added to it.

A position is given in one of two ways, both copied digit for digit from the source: `from: point` with a longitude and latitude, or `from: terrain-footprint` with the four edges of a terrain model, in which case the marker stands at the footprint's centre. `pipeline/config.py` converts the longitude and refuses a position with no source.

After changing a config, run `build_globe.py --only sites` in `pipeline/` to rewrite `app/public/data/sites.json`.
