# Data contract between the pipeline and the app

Prepared 13 November 2026, before the event, as planning. **This is a proposal. Roles A and B confirm or change it in the first hour on Saturday,** then record the result in [DECISIONS.md](DECISIONS.md).

Role A's pipeline writes these files. Role B's app reads them. Neither side should have to read the other's code. If both follow this page, the two halves can be built at different times and still fit.

## Principles

1. The pipeline writes; the app reads. Nobody edits these files by hand.
2. Every file a site needs is listed in that site's `site.json`, with its size.
3. Every layer has a record in `layers.json` that meets [CONFIDENCE.md](CONFIDENCE.md).
4. Positions are east-positive longitude and planetocentric latitude in degrees. Heights are metres above the areoid.
5. Names carry units.
6. The contract has a version number in `site.json`. A change that breaks the other side raises the number and needs both owners to agree.

## Proposed layout

```
app/public/data/
  sites.json                 every site for the picker: id, name, mission, readiness level, centre, box
  <site id>/
    site.json                identity, box, home position, targets, grid definition, file list, build time, contract version
    layers.json              one record per layer
    tiles/<layer id>/{z}/{x}/{y}.<ext>   map tiles
    grid/                    routing grids as raw binary arrays
    vectors/                 geology, rover path, stops, targets as GeoJSON
    weather.json             typical values by local hour for the season
    space-weather.json       saved snapshot of the live feeds, with fetch time
    photos.json              photo index: position, sol, date, camera, pointing, address, credit
    validation.json          terrain and route checks with sample sizes
```

## In use since 14 November

These parts are built and the app reads them. They are still a proposal until roles A and B confirm them, but changing them now means changing `pipeline/records.py`, `pipeline/build_globe.py` and `app/src/data/contract.ts` together.

```
app/public/data/
  sites.json                         every site for the globe
  globe/
    layers.json                      one record: the whole-planet image
    tiles/image-viking/{z}/{x}/{y}.jpg
```

**`layers.json`** holds `contractVersion`, `builtUtc` and `layers`. Each layer record has every field of [CONFIDENCE.md](CONFIDENCE.md) section 1, in camelCase: `id`, `title`, `dataType`, `mission`, `instrument`, `agency`, `productId`, `sourceUrl`, `doi`, `acquiredFrom`, `acquiredTo`, `published`, `gridSpacing`, `realDetail`, `positionAccuracy`, `heightAccuracy`, `processing`, `grade`, `caveats` (a list) and `credit`. A value that was looked for and not found is the text `not found`; one that does not apply is `not applicable`. The app leaves out any layer whose mission, instrument, dates, detail, grade, caveats or credit is absent or `not found`. A layer with map tiles also has `tiles`: `path` (a pattern with `{z}`, `{x}`, `{y}`, relative to the folder holding `layers.json`), `minZoom`, `maxZoom`, `tileSizePx`, `count` and `bytes`.

**Image tiles** are 256-pixel JPEG files on the Web Mercator square, addressed zoom, then column counted east, then row counted south.

**`sites.json`** holds `contractVersion`, `builtUtc`, `convention`, `levels` (name and offer for each readiness level) and `sites`. Each site has `id`, `name`, `place`, `mission`, `missionYears`, `level`, `built`, `reviewedByPerson`, `lonEastDeg`, `latDeg`, `position` (what the point is, its source and address), `landing` (the landing position as its source prints it, or null), `data` and `problems` (lists of sentences), and `terrainFootprint` when the position came from a terrain model. `built` is true when `<site id>/site.json` exists.

## Grid definition

To settle on Saturday. The app needs all of these from `site.json` to read a grid correctly:

- Rows and columns
- Longitude and latitude of the north-west corner
- Cell size in metres, north to south and east to west separately
- Row order (north first) and byte order
- For each grid file: name, number type, unit, and the value that means "no data"

## Tiles

To settle on Saturday: tile format, zoom range, how terrain heights are encoded, and the size budget per site.

## What the app may assume

- A site folder is complete or absent. The pipeline writes to a temporary folder and renames it when done.
- A missing optional file means the feature is switched off for that site, with the reason shown.
- Nothing in these files is invented. Missing values are marked as missing.
