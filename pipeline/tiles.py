# WHAT:    Stage 3: cuts image and terrain tiles in the layout MapLibre reads. So far: whole-planet image pyramids for the globe (F14).
# IN:      Image arrays (rows, columns, 3) of 8-bit colour, laid out on the Web Mercator square.
# OUT:     tiles/<layer id>/{z}/{x}/{y}.jpg under the output folder.
# USED BY: build_globe.py. Site image and terrain tiles are still to be added for build_site.py.
# RULES:   Tile maths comes from mars.py. Missing data is transparent, never a pit or spike. Stays inside the size budget.
# TRAPS:   PITFALLS 3, 4, 5, 10.
# OWNER:   Role A.

import pathlib

import numpy as np
from PIL import Image

from mars import MERCATOR_MAX_LAT_DEG, TILE_SIZE_PX, mercator_y_to_lat_deg


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
