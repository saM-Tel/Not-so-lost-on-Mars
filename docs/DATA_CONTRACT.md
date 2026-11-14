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
  space-weather.json                 snapshot of NASA's forecasts for Mars; one file for the planet, not one per site
  globe/
    layers.json                      one record: the whole-planet image
    tiles/image-viking/{z}/{x}/{y}.jpg
  approach/
    layers.json                      three rings of orbital images around every site
    tiles/image-ctx-<site>-<ring>/{z}/{x}/{y}.webp
```

**`layers.json`** holds `contractVersion`, `builtUtc` and `layers`. Each layer record has every field of [CONFIDENCE.md](CONFIDENCE.md) section 1, in camelCase: `id`, `title`, `dataType`, `mission`, `instrument`, `agency`, `productId`, `sourceUrl`, `doi`, `acquiredFrom`, `acquiredTo`, `published`, `gridSpacing`, `realDetail`, `positionAccuracy`, `heightAccuracy`, `processing`, `grade`, `caveats` (a list) and `credit`. A value that was looked for and not found is the text `not found`; one that does not apply is `not applicable`. The app leaves out any layer whose mission, instrument, dates, detail, grade, caveats or credit is absent or `not found`. A layer drawn from a routing grid has `grid`, the name of the grid file (so far only `slopeMaxDeg`, for the layer `slope-hirise`). A layer of points or lines has `vector`: `path` (relative to the folder holding `layers.json`), `geometry` (`point` or `line`), `count` and `bytes`. A layer with map tiles also has `tiles`: `path` (a pattern with `{z}`, `{x}`, `{y}`, relative to the folder holding `layers.json`), `minZoom`, `maxZoom`, `tileSizePx`, `count` and `bytes`.

**`approach/layers.json`** (added 14 Nov, written by `pipeline/build_approach.py`) holds the approach imagery: three rings of orbital images around every site, so the land around a site is sharp while zooming in. Same layout as any `layers.json`, with records named `image-ctx-<site id>-<ring>`. Each record also has `siteId`, `ring` (`wide`, `mid` or `near`) and `tiles.bounds` (`westLonDeg`, `eastLonDeg`, `southLatDeg`, `northLatDeg`), the box the tiles cover. Tiles are 256-pixel WebP files at `approach/tiles/<layer id>/{z}/{x}/{y}.webp`, transparent where the source has no data. The app adds each ring as a raster source limited to its bounds and zooms, under the site's own image. The file is optional: without it the globe works as before.

**`space-weather.json`** holds `contractVersion`, `fetchedUtc`, `periodFromUtc`, `periodToUtc`, `noticesRead`, `source` (`name`, `url`, `credit`, `disclaimer`) and `forecasts`, newest notice first. Each forecast has `arrivalUtc`, `windowHours` (the uncertainty the notice states, or null), `kind` (the notice's own words, or null), `issuedUtc`, `messageId` and `messageUrl`. Written by `pipeline/build_space_weather.py`; the app reads it only when NASA's live feed cannot be read.

**`photos.json`** holds `contractVersion`, `builtUtc`, `source`, `how`, `caveats` and `photos`. Each photo has `id`, `stop` (the rover stop, "site_drive"), `lonEastDeg`, `latDeg` (the stop's position), `sol`, `takenUtc`, `localMeanSolarTime`, `camera`, `mastAzimuthDeg`, `mastElevationDeg` (as NASA's feed gives them; the frame of the azimuth is not confirmed), `smallUrl`, `mediumUrl`, `pageUrl` and `credit`. The pictures stay on NASA's server.

**Image tiles** are 256-pixel JPEG files on the Web Mercator square, addressed zoom, then column counted east, then row counted south.

**`sites.json`** holds `contractVersion`, `builtUtc`, `convention`, `levels` (name and offer for each readiness level) and `sites`. Each site has `id`, `name`, `place`, `mission`, `missionYears`, `level`, `built`, `reviewedByPerson`, `lonEastDeg`, `latDeg`, `position` (what the point is, its source and address), `landing` (the landing position as its source prints it, or null), `data` and `problems` (lists of sentences), and `terrainFootprint` when the position came from a terrain model. `built` is true when `<site id>/site.json` exists.

**A built site's folder**, `<site id>/`, so far holds:

```
site.json          identity, box, centre, terrain height range, grid definition, which source each input was read from, file sizes
layers.json        one record per layer, as above
validation.json    terrain checked against the rover: `heights` and `slope`, each with sample size, typical and largest difference and a caution
tiles/image-hirise/{z}/{x}/{y}.webp     zoom 12 to 18; transparent where there is no data
tiles/terrain-hirise/{z}/{x}/{y}.png    zoom 11 to 15
grid/heightM.f32, grid/slopeMaxDeg.f32  routing grids; see "Grid definition"
vectors/rover-stops.geojson             the rover's stops in the box: points with stop, sol, heightM, tiltDeg, drivenTotalM
vectors/rover-path.geojson              the rover's drives in the box: lines with sol
photos.json                             real rover photos at the stops in the box; optional
```

**`site.json`** holds `contractVersion`, `builtUtc`, `id`, `name`, `place`, `mission`, `level`, `reviewedByPerson`, `convention`, `box` (`westLonDeg`, `eastLonDeg`, `southLatDeg`, `northLatDeg`), `boxSizeKm`, `centre`, `terrainHeightM` (`lowest`, `highest`, `atCentre`, metres relative to the areoid), `grid`, `readFrom`, `files` and `totalBytes`. When the config has a scenario (added 14 Nov, `pipeline/scenario.py`) it also holds `home` and `targets`: each a place at a rover stop with `name`, `stop`, `firstSol`, `lonEastDeg`, `latDeg`, `heightM`, `why`, `whySourceUrl`, `positionSource` and `assumed`; targets also have `id`. The app uses `home` for the tether and routes, and plans the walk to the first target when the site opens without a walk in the link.

**Terrain tiles** are 256-pixel PNG files. A height in metres relative to the areoid is `-10000 + (red * 65536 + green * 256 + blue) * 0.1`, which MapLibre calls the "mapbox" encoding; the record says `"encoding": "mapbox"`. Heights are true Mars metres. The app scales them by the Earth to Mars radius ratio when drawing, and subtracts `terrainHeightM.lowest` at draw time only. Past the edge of the box a tile repeats the edge height; that is not data.

## Grid definition

Built on 14 November and confirmed the same day by Joseph, covering roles A and B (see [DECISIONS.md](DECISIONS.md)). Changing it means changing `pipeline/grids.py` and the app's reader together.

`site.json` holds `grid`, with everything the app needs to read a grid file:

- `rows`, `cols`
- `northWestCorner`: `lonEastDeg`, `latDeg` of the outer corner of the first cell
- `cellLonDeg`, `cellLatDeg`: a cell's size in degrees. Cell `(row, col)` has its centre at longitude `northWestCorner.lonEastDeg + (col + 0.5) * cellLonDeg` and latitude `northWestCorner.latDeg - (row + 0.5) * cellLatDeg`
- `cellNorthSouthM`, `cellEastWestM`: a cell's size on the ground, separately, with `cellEastWestMeasuredAtLatDeg`. At Bright Angel a cell is 4.0 m by 3.79 m
- `rowOrder` (north row first; within a row, west cell first) and `byteOrder` (little-endian)
- `sourceCellsPerCell`: 4, so a routing cell joins 4 x 4 cells of the 1 m terrain. Chosen to match the terrain's real detail of 3 to 5 m and to keep each file near 2.4 MB
- `slopeBaselineM`: the span each slope was measured over, `northSouthM` and `eastWestM`
- `files`: for each grid file `name`, `path`, `numberType`, `unit`, `noData`, `cellsWithNoData`, `bytes`, `fromLayer` (the layer record that gives its source, dates and accuracy) and `meaning`

Grid files so far, each `rows * cols` 32-bit floats with NaN for no data:

| File | Unit | What it holds |
|---|---|---|
| `grid/heightM.f32` | m | Mean terrain height of the cell, relative to the areoid |
| `grid/slopeMaxDeg.f32` | degrees | The steepest slope among the cell's source cells. For keep-out. For effort, take the slope along the direction of travel from `heightM` |

The pipeline writes measured values only. It does not mark cells as keep-out: the slope limit is a suit setting in the app. Still to add: the missing-data and seam mask, footing and sky exposure.

## Tiles

To settle on Saturday: tile format, zoom range, how terrain heights are encoded, and the size budget per site.

## What the app may assume

- A site folder is complete or absent. The pipeline writes to a temporary folder and renames it when done.
- A missing optional file means the feature is switched off for that site, with the reason shown.
- Nothing in these files is invented. Missing values are marked as missing.
