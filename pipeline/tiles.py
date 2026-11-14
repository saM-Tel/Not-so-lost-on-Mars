# WHAT:    Stage 3: cuts image and terrain tiles in the layout MapLibre reads: whole-planet image pyramids for the globe (F14), and a site's image and terrain tiles (F1).
# IN:      For the globe, colour image arrays on the Web Mercator square. For a site, blocks of cells from sources.py, evenly spaced in degrees.
# OUT:     tiles/<layer id>/{z}/{x}/{y}.<jpg, webp or png> under the output folder.
# USED BY: build_globe.py, build_site.py.
# RULES:   Tile maths comes from mars.py. Missing data is transparent, never a pit or spike. Stays inside the size budget.
# TRAPS:   PITFALLS 3, 4, 5, 10.
# OWNER:   Role A.

import pathlib

import numpy as np
from PIL import Image

import mars
from mars import MERCATOR_MAX_LAT_DEG, TILE_SIZE_PX, mercator_fraction, mercator_y_to_lat_deg, tile_pixel_size_m


def equirectangular_to_mercator(source: np.ndarray, zoom: int, chunk_rows: int = 512) -> np.ndarray:
    """Resample a whole-planet image onto the Web Mercator square at one zoom level.

    `source` is (rows, columns, bands), 8-bit, covering longitude -180 to 180 east (left to right)
    and planetocentric latitude 90 to -90 (top to bottom), evenly spaced in degrees.
    Returns a square image of side 256 * 2**zoom. Latitudes beyond the Mercator limit are dropped.
    Each output pixel is a linear blend of the four nearest source pixels.
    """
    src_rows, src_cols = source.shape[:2]
    side = TILE_SIZE_PX * 2**zoom

    # Columns: both grids are evenly spaced in longitude and wrap around the planet.
    col = (np.arange(side) + 0.5) * src_cols / side - 0.5
    c0 = np.floor(col).astype(np.int64)
    fc = (col - c0).astype(np.float32)[None, :, None]
    c1 = (c0 + 1) % src_cols
    c0 = c0 % src_cols

    # Rows: Mercator rows are not evenly spaced in latitude.
    lat = np.array([mercator_y_to_lat_deg((j + 0.5) / side) for j in range(side)])
    assert abs(lat[0]) < MERCATOR_MAX_LAT_DEG
    row = (90.0 - lat) / 180.0 * src_rows - 0.5
    r0 = np.clip(np.floor(row).astype(np.int64), 0, src_rows - 1)
    r1 = np.clip(r0 + 1, 0, src_rows - 1)
    fr = (row - np.floor(row)).astype(np.float32)[:, None, None]

    out = np.empty((side, side, source.shape[2]), dtype=np.uint8)
    for start in range(0, side, chunk_rows):
        rows = slice(start, min(start + chunk_rows, side))
        top = source[r0[rows]].astype(np.float32)
        bottom = source[r1[rows]].astype(np.float32)
        top = top[:, c0] * (1 - fc) + top[:, c1] * fc
        bottom = bottom[:, c0] * (1 - fc) + bottom[:, c1] * fc
        out[rows] = np.clip(np.rint(top * (1 - fr[rows]) + bottom * fr[rows]), 0, 255).astype(np.uint8)
    return out


def halve(image: np.ndarray) -> np.ndarray:
    """Half-size copy made by averaging each 2 x 2 block."""
    rows, cols, bands = image.shape
    blocks = image.reshape(rows // 2, 2, cols // 2, 2, bands).astype(np.uint16)
    return ((blocks.sum(axis=(1, 3)) + 2) // 4).astype(np.uint8)


def write_image_pyramid(top: np.ndarray, zoom_max: int, folder: pathlib.Path, quality: int = 82) -> tuple[int, int]:
    """Cut a whole Web Mercator square into JPEG tiles for zoom_max down to 0.

    `top` is the square at zoom_max. Returns (number of tiles, total bytes written).
    """
    assert top.shape[0] == top.shape[1] == TILE_SIZE_PX * 2**zoom_max
    count = 0
    size = 0
    level = top
    for z in range(zoom_max, -1, -1):
        n = 2**z
        for x in range(n):
            column_folder = folder / str(z) / str(x)
            column_folder.mkdir(parents=True, exist_ok=True)
            for y in range(n):
                tile = level[y * TILE_SIZE_PX:(y + 1) * TILE_SIZE_PX, x * TILE_SIZE_PX:(x + 1) * TILE_SIZE_PX]
                path = column_folder / f"{y}.jpg"
                Image.fromarray(tile).save(path, format="JPEG", quality=quality, optimize=True)
                count += 1
                size += path.stat().st_size
        if z > 0:
            level = halve(level)
    return count, size


# ---- Site tiles: a block of cells in degrees, redrawn as Web Mercator tiles ----------------

# Terrain tiles store heights in the three colour channels of a lossless PNG, in the layout MapLibre
# calls "mapbox": height in metres = -10000 + (red * 65536 + green * 256 + blue) * 0.1.
TERRAIN_BASE_M = -10000.0
TERRAIN_STEP_M = 0.1


def tile_range(box, zoom: int) -> tuple[range, range]:
    """The columns and rows of tiles that touch a box at one zoom."""
    n = 2**zoom
    x0, y0 = mercator_fraction(box.west_lon_deg, box.north_lat_deg)
    x1, y1 = mercator_fraction(box.east_lon_deg, box.south_lat_deg)
    return (range(int(x0 * n), min(n - 1, int(x1 * n)) + 1), range(int(y0 * n), min(n - 1, int(y1 * n)) + 1))


def tile_pixel_positions(zoom: int, x: int, y: int) -> tuple[np.ndarray, np.ndarray]:
    """Longitude and latitude of every pixel centre in a tile, each as a 256 x 256 array."""
    n = 2**zoom
    across = (x + (np.arange(TILE_SIZE_PX) + 0.5) / TILE_SIZE_PX) / n
    down = (y + (np.arange(TILE_SIZE_PX) + 0.5) / TILE_SIZE_PX) / n
    lon = across * 360.0 - 180.0
    lat = np.degrees(np.arctan(np.sinh(np.pi * (1.0 - 2.0 * down))))
    return np.meshgrid(lon, lat)


def detail_levels(grid, zoom_min: int, zoom_max: int, centre_lat_deg: float) -> dict:
    """For each zoom, the copy of the grid whose cells are no smaller than half a tile pixel.

    Drawing fine cells straight into coarse tiles would pick single cells and look speckled, so
    coarser zooms are drawn from copies in which neighbouring cells have already been averaged.
    """
    levels = {}
    current = grid
    for zoom in range(zoom_max, zoom_min - 1, -1):
        pixel_m = tile_pixel_size_m(zoom, centre_lat_deg)
        while current.cell_north_south_m * 2 <= pixel_m and min(current.rows, current.cols) >= 4:
            current = current.halved()
        levels[zoom] = current
    return levels


def write_site_image_tiles(grid, box, zoom_min: int, zoom_max: int, folder: pathlib.Path, quality: int = 80) -> tuple[int, int]:
    """Cut a one-band image block into WebP tiles. Pixels with no data, or outside the block, are transparent.

    Returns (number of tiles, total bytes).
    """
    centre_lat = (box.south_lat_deg + box.north_lat_deg) / 2
    levels = detail_levels(grid, zoom_min, zoom_max, centre_lat)
    count = size = 0
    for zoom in range(zoom_min, zoom_max + 1):
        columns, rows = tile_range(box, zoom)
        for x in columns:
            for y in rows:
                lon, lat = tile_pixel_positions(zoom, x, y)
                values = levels[zoom].sample(lon, lat)
                seen = np.isfinite(values)
                if not seen.any():
                    continue
                grey = np.clip(np.rint(np.where(seen, values, 0)), 0, 255).astype(np.uint8)
                if seen.all():
                    image = Image.fromarray(grey, mode="L").convert("RGB")
                else:
                    alpha = np.where(seen, 255, 0).astype(np.uint8)
                    image = Image.fromarray(np.dstack([grey, grey, grey, alpha]), mode="RGBA")
                path = folder / str(zoom) / str(x) / f"{y}.webp"
                path.parent.mkdir(parents=True, exist_ok=True)
                image.save(path, format="WEBP", quality=quality, method=4)
                count += 1
                size += path.stat().st_size
    return count, size


def encode_terrain(height_m: np.ndarray) -> np.ndarray:
    """Heights in metres to the three colour channels of a terrain tile."""
    steps = np.rint((height_m - TERRAIN_BASE_M) / TERRAIN_STEP_M).astype(np.int64)
    if steps.min() < 0 or steps.max() >= 256**3:
        raise ValueError("height outside the range a terrain tile can hold")
    return np.dstack([(steps >> 16) & 255, (steps >> 8) & 255, steps & 255]).astype(np.uint8)


def decode_terrain(rgb: np.ndarray) -> np.ndarray:
    """The reverse of encode_terrain. Used by the tests, and it is what MapLibre does."""
    rgb = rgb.astype(np.int64)
    return TERRAIN_BASE_M + (rgb[..., 0] * 65536 + rgb[..., 1] * 256 + rgb[..., 2]) * TERRAIN_STEP_M


def write_terrain_tiles_with_surround(fine, fine_box, coarse, outer_box, zoom_min: int, zoom_max: int, folder: pathlib.Path,
                                      reference_m: float, feather_m: float) -> tuple[int, int]:
    """Terrain tiles over a wider box: the fine grid inside its own box, the coarse grid round it.

    Display only. Towards the outer edge the coarse heights are eased to `reference_m` over `feather_m`, because past
    the outer box the map has no terrain at all; that easing is not data, and the layer record says so. Missing
    coarse cells take the reference height. Returns (number of tiles, total bytes).
    """
    if fine.nodata is not None and (fine.values == fine.nodata).any():
        raise NotImplementedError("the terrain block has missing cells; masking them is not built yet")
    centre_lat = (outer_box.south_lat_deg + outer_box.north_lat_deg) / 2
    fine_levels = detail_levels(fine, zoom_min, zoom_max, centre_lat)
    coarse_levels = detail_levels(coarse, zoom_min, zoom_max, centre_lat)
    metres_per_deg_lat = mars.METRES_PER_DEGREE
    metres_per_deg_lon = mars.METRES_PER_DEGREE * np.cos(np.radians(centre_lat))
    count = size = 0
    for zoom in range(zoom_min, zoom_max + 1):
        columns, rows = tile_range(outer_box, zoom)
        for x in columns:
            for y in rows:
                lon, lat = tile_pixel_positions(zoom, x, y)
                inside_fine = ((lon >= fine_box.west_lon_deg) & (lon <= fine_box.east_lon_deg)
                               & (lat >= fine_box.south_lat_deg) & (lat <= fine_box.north_lat_deg))
                heights = coarse_levels[zoom].sample(lon, lat, clamp=True)
                heights = np.where(np.isfinite(heights), heights, reference_m)
                edge_m = np.minimum.reduce([
                    (lon - outer_box.west_lon_deg) * metres_per_deg_lon, (outer_box.east_lon_deg - lon) * metres_per_deg_lon,
                    (lat - outer_box.south_lat_deg) * metres_per_deg_lat, (outer_box.north_lat_deg - lat) * metres_per_deg_lat,
                ])
                weight = np.clip(edge_m / feather_m, 0.0, 1.0)
                heights = reference_m + (heights - reference_m) * weight
                if inside_fine.any():
                    fine_heights = fine_levels[zoom].sample(lon, lat, clamp=True)
                    heights = np.where(inside_fine & np.isfinite(fine_heights), fine_heights, heights)
                path = folder / str(zoom) / str(x) / f"{y}.png"
                path.parent.mkdir(parents=True, exist_ok=True)
                Image.fromarray(encode_terrain(heights), mode="RGB").save(path, format="PNG", optimize=True)
                count += 1
                size += path.stat().st_size
    return count, size


def write_site_terrain_tiles(grid, box, zoom_min: int, zoom_max: int, folder: pathlib.Path) -> tuple[int, int]:
    """Cut a height block into terrain tiles. Heights are true Mars metres relative to the areoid.

    A terrain tile cannot be transparent. Where a tile reaches past the block, the nearest edge
    height is repeated so the 3D surface has no cliff; those pixels are not data. Missing cells
    inside the block stop the build, because the mask stage that would handle them is not built.

    Returns (number of tiles, total bytes).
    """
    if grid.nodata is not None and (grid.values == grid.nodata).any():
        raise NotImplementedError("the terrain block has missing cells; masking them is not built yet")
    centre_lat = (box.south_lat_deg + box.north_lat_deg) / 2
    levels = detail_levels(grid, zoom_min, zoom_max, centre_lat)
    count = size = 0
    for zoom in range(zoom_min, zoom_max + 1):
        columns, rows = tile_range(box, zoom)
        for x in columns:
            for y in rows:
                lon, lat = tile_pixel_positions(zoom, x, y)
                heights = levels[zoom].sample(lon, lat, clamp=True)
                path = folder / str(zoom) / str(x) / f"{y}.png"
                path.parent.mkdir(parents=True, exist_ok=True)
                Image.fromarray(encode_terrain(heights), mode="RGB").save(path, format="PNG", optimize=True)
                count += 1
                size += path.stat().st_size
    return count, size
