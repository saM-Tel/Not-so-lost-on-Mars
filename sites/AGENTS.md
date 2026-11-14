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
| `bright-angel.yaml` | Bright Angel, Neretva Vallis, Jezero crater | 1 | No. Header only; not filled in yet |
