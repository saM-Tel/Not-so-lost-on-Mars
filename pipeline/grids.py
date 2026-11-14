# WHAT:    Stage 5: writes the routing grids as raw binary arrays. So far: mean height and steepest slope.
#          Still to add: the missing-data and seam mask, footing, sky exposure.
# IN:      Heights and slope for the box on the source's 1 m cells, with the grid they sit on.
# OUT:     grid/ under the site folder, and the grid definition for site.json.
# USED BY: build_site.py.
# RULES:   Layout matches docs/DATA_CONTRACT.md exactly. The pipeline writes measured values only: where a slope
#          limit lies, and so which cells are keep-out, is decided in the app from the suit settings.
# TRAPS:   PITFALLS 4, 5, 6.
# OWNER:   Role A.

import pathlib

import numpy as np

import sources

# Source cells per routing cell, each way. Four 1 m cells make a 4 m cell, which matches the terrain's
# real detail of about 3 to 5 m (docs/CONFIDENCE.md section 6) and keeps the files small for the browser.
CELLS_PER_ROUTING_CELL = 4


def coarsen(values: np.ndarray, factor: int, how: str) -> np.ndarray:
    """Join `factor` x `factor` blocks of cells into one, taking the mean or the largest of the known values.

    NaN means no data. A block with no known value is NaN. Rows and columns left over at the south and
    east edges, fewer than `factor`, are dropped.
    """
    rows, cols = values.shape[0] // factor, values.shape[1] // factor
    blocks = values[: rows * factor, : cols * factor].astype(np.float64).reshape(rows, factor, cols, factor)
    known = ~np.isnan(blocks)
    count = known.sum(axis=(1, 3))
    if how == "mean":
        out = np.where(known, blocks, 0).sum(axis=(1, 3)) / np.maximum(count, 1)
    elif how == "max":
        out = np.where(known, blocks, -np.inf).max(axis=(1, 3))
    else:
        raise ValueError(f"unknown way to join cells: {how}")
    return np.where(count > 0, out, np.nan).astype(np.float32)


def write_routing_grids(terrain: sources.Grid, slope_deg: np.ndarray, slope_baseline_m: dict,
                        centre_lat_deg: float, folder: pathlib.Path, factor: int = CELLS_PER_ROUTING_CELL) -> dict:
    """Write the routing grids and return the grid definition that goes into site.json."""
    folder.mkdir(parents=True, exist_ok=True)
    heights = terrain.values.astype(np.float32)
    if terrain.nodata is not None:
        heights[terrain.values == terrain.nodata] = np.nan

    arrays = {
        "heightM": (coarsen(heights, factor, "mean"), "m",
                    f"Mean terrain height of the {factor} x {factor} source cells in the routing cell, relative to the areoid."),
        "slopeMaxDeg": (coarsen(slope_deg, factor, "max"), "deg",
                        f"Steepest slope found among the {factor} x {factor} source cells in the routing cell. Each source "
                        f"cell's slope is measured over {slope_baseline_m['northSouthM']} m north to south and "
                        f"{slope_baseline_m['eastWestM']} m east to west. Use it for keep-out; for effort use the slope "
                        "along the direction of travel, taken from heightM."),
    }
    files = []
    rows, cols = arrays["heightM"][0].shape
    for name, (array, unit, meaning) in arrays.items():
        path = folder / f"{name}.f32"
        array.astype("<f4").tofile(path)
        files.append({
            "name": name, "path": f"grid/{name}.f32", "numberType": "float32", "unit": unit, "noData": "NaN",
            "cellsWithNoData": int(np.isnan(array).sum()), "bytes": path.stat().st_size,
            "fromLayer": "terrain-hirise", "meaning": meaning,
        })
    cell_lon = terrain.cell_lon_deg * factor
    cell_lat = terrain.cell_lat_deg * factor
    return {
        "rows": rows, "cols": cols,
        "northWestCorner": {"lonEastDeg": round(terrain.west_lon_deg, 9), "latDeg": round(terrain.north_lat_deg, 9)},
        "cellLonDeg": cell_lon, "cellLatDeg": cell_lat,
        "cellNorthSouthM": round(terrain.cell_north_south_m * factor, 4),
        "cellEastWestM": round(terrain.cell_east_west_m(centre_lat_deg) * factor, 4),
        "cellEastWestMeasuredAtLatDeg": round(centre_lat_deg, 7),
        "rowOrder": "north row first; within a row, west cell first",
        "byteOrder": "little-endian",
        "sourceCellsPerCell": factor,
        "slopeBaselineM": slope_baseline_m,
        "files": files,
    }
