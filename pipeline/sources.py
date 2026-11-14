# WHAT:    Finds each source file and reads only the site's box from it.
# IN:      A source's file name, its folder on the team data server and its original address; a box in degrees; MARS_DATA_URL from the ignored .env file.
# OUT:     Arrays for the box with their grid definition, and which source was used.
# USED BY: build_site.py and the stage files.
# RULES:   Tries the team data server, then ../data/raw/, then the original address. Works with no server set. Never writes to the server.
#          Refuses a file whose projection it does not understand, so a wrong grid is never assumed.
# TRAPS:   PITFALLS 4, 10.
# OWNER:   Role A.

import dataclasses
import json
import math
import os
import pathlib

import numpy as np
import rasterio
from rasterio.windows import Window

import mars

REPO = pathlib.Path(__file__).resolve().parent.parent

# The USGS mosaics are stored row by row with no compression. GTIFF_DIRECT_IO makes GDAL fetch only
# the bytes of the window asked for, not every whole row it crosses.
GDAL_OPTIONS = {
    "GDAL_DISABLE_READDIR_ON_OPEN": "EMPTY_DIR",
    "GDAL_HTTP_TIMEOUT": "120",
    "GDAL_HTTP_MAX_RETRY": "3",
    "GTIFF_DIRECT_IO": "YES",
}


@dataclasses.dataclass(frozen=True)
class Box:
    """A site's box in the app's convention: east-positive longitude -180 to 180, planetocentric latitude."""
    west_lon_deg: float
    east_lon_deg: float
    south_lat_deg: float
    north_lat_deg: float

    @staticmethod
    def around(lon_deg: float, lat_deg: float, width_km: float, height_km: float) -> "Box":
        """A box of the given ground size centred on a point. East-west degrees grow with latitude."""
        half_lat = (height_km * 1000 / 2) / mars.METRES_PER_DEGREE
        half_lon = (width_km * 1000 / 2) / (mars.METRES_PER_DEGREE * math.cos(math.radians(lat_deg)))
        return Box(lon_deg - half_lon, lon_deg + half_lon, lat_deg - half_lat, lat_deg + half_lat)

    def as_dict(self) -> dict:
        return {"westLonDeg": self.west_lon_deg, "eastLonDeg": self.east_lon_deg,
                "southLatDeg": self.south_lat_deg, "northLatDeg": self.north_lat_deg}


@dataclasses.dataclass
class Grid:
    """A block of cells read from a source file, north row first, evenly spaced in degrees."""
    values: np.ndarray           # (rows, columns)
    west_lon_deg: float          # outer edge of the first column
    north_lat_deg: float         # outer edge of the first row
    cell_lon_deg: float          # width of a cell in degrees of longitude
    cell_lat_deg: float          # height of a cell in degrees of latitude
    nodata: float | None
    origin: str                  # which source was used, in words

    @property
    def rows(self) -> int:
        return self.values.shape[0]

    @property
    def cols(self) -> int:
        return self.values.shape[1]

    @property
    def box(self) -> Box:
        return Box(self.west_lon_deg, self.west_lon_deg + self.cols * self.cell_lon_deg,
                   self.north_lat_deg - self.rows * self.cell_lat_deg, self.north_lat_deg)

    @property
    def cell_north_south_m(self) -> float:
        return self.cell_lat_deg * mars.METRES_PER_DEGREE

    def cell_east_west_m(self, lat_deg: float) -> float:
        """Ground width of a cell at this latitude. Narrower than its height away from the equator."""
        return self.cell_lon_deg * mars.METRES_PER_DEGREE * math.cos(math.radians(lat_deg))

    def fractional_index(self, lon_deg, lat_deg):
        """Row and column, as fractions, of a position; cell centres sit at whole numbers."""
        col = (np.asarray(lon_deg) - self.west_lon_deg) / self.cell_lon_deg - 0.5
        row = (self.north_lat_deg - np.asarray(lat_deg)) / self.cell_lat_deg - 0.5
        return row, col

    def sample(self, lon_deg, lat_deg, clamp: bool = False) -> np.ndarray:
        """Values at positions, blended from the four nearest cells.

        Outside the grid the answer is NaN, or with `clamp` the nearest edge value. Beside missing
        data the answer is NaN. Only the cells needed are converted, so this is cheap on large grids.
        """
        row, col = self.fractional_index(lon_deg, lat_deg)
        inside = (row >= 0) & (col >= 0) & (row <= self.rows - 1) & (col <= self.cols - 1)
        row = np.clip(row, 0, self.rows - 1)
        col = np.clip(col, 0, self.cols - 1)
        r0 = np.minimum(np.floor(row).astype(np.int64), self.rows - 2)
        c0 = np.minimum(np.floor(col).astype(np.int64), self.cols - 2)
        fr, fc = row - r0, col - c0

        def cells(r, c):
            raw = self.values[r, c]
            picked = np.asarray(raw, dtype=np.float64)
            return picked if self.nodata is None else np.where(raw == self.nodata, np.nan, picked)

        out = ((1 - fr) * ((1 - fc) * cells(r0, c0) + fc * cells(r0, c0 + 1))
               + fr * ((1 - fc) * cells(r0 + 1, c0) + fc * cells(r0 + 1, c0 + 1)))
        return out if clamp else np.where(inside, out, np.nan)

    def halved(self) -> "Grid":
        """The same block at half the detail: each new cell is the mean of the valid cells in a 2 x 2 block."""
        rows, cols = self.rows // 2, self.cols // 2
        blocks = self.values[: rows * 2, : cols * 2].reshape(rows, 2, cols, 2)
        # Sums are taken straight from the stored cells, so a large image is never copied as 8-byte numbers.
        if self.nodata is None:
            mean = blocks.sum(axis=(1, 3), dtype=np.float64) / 4
        else:
            valid = blocks != self.nodata
            count = valid.sum(axis=(1, 3))
            total = np.where(valid, blocks, 0).sum(axis=(1, 3), dtype=np.float64)
            mean = np.where(count > 0, total / np.maximum(count, 1), self.nodata)
        values = np.rint(mean).astype(self.values.dtype) if np.issubdtype(self.values.dtype, np.integer) else mean.astype(self.values.dtype)
        return Grid(values, self.west_lon_deg, self.north_lat_deg, self.cell_lon_deg * 2, self.cell_lat_deg * 2, self.nodata, self.origin)

def data_server_url() -> str | None:
    """The team data server's address, from the environment or the ignored .env file. None if not set."""
    value = os.environ.get("MARS_DATA_URL")
    env_file = REPO / ".env"
    if not value and env_file.exists():
        for line in env_file.read_text(encoding="utf-8").splitlines():
            if line.strip().startswith("MARS_DATA_URL="):
                value = line.split("=", 1)[1].strip()
    return value.rstrip("/") if value else None


def candidate_addresses(file_name: str, server_path: str, original_url: str) -> list[tuple[str, str]]:
    """Where to look for a source file, in order, each with words that say which source it is."""
    candidates = []
    server = data_server_url()
    if server:
        candidates.append((f"/vsicurl/{server}/{server_path.strip('/')}/{file_name}", "team data server"))
    local = REPO / "data" / "raw" / pathlib.PurePosixPath(server_path.strip("/")).name / file_name
    if local.exists():
        candidates.append((str(local), "local copy in data/raw"))
    candidates.append((f"/vsicurl/{original_url.rstrip('/')}/{file_name}", "original address"))
    return candidates


def _degrees_per_metre(dataset) -> float:
    """Check that the file is the grid we understand and return degrees per projected metre.

    Understood: equirectangular, true to scale at the equator, centred on longitude 0, on the Mars
    sphere of mars.MARS_RADIUS_M. Then x = radius * longitude and y = radius * latitude, in radians.
    Other landing-site files use other projections (docs/PITFALLS.md section 4) and are refused here.
    """
    crs = dataset.crs.to_dict() if dataset.crs else {}
    radius = crs.get("R", crs.get("a"))
    understood = (
        crs.get("proj") == "eqc"
        and float(crs.get("lat_ts", 0)) == 0 and float(crs.get("lon_0", 0)) == 0 and float(crs.get("lat_0", 0)) == 0
        and float(crs.get("x_0", 0)) == 0 and float(crs.get("y_0", 0)) == 0
        and radius is not None and float(radius) == mars.MARS_RADIUS_M and float(crs.get("b", radius)) == float(radius)
    )
    transform = dataset.transform
    if not understood or transform.b != 0 or transform.d != 0 or transform.e >= 0:
        raise ValueError(f"cannot read {dataset.name}: its projection is not the equator-true Mars grid ({crs})")
    return 1.0 / mars.METRES_PER_DEGREE


def read_box(file_name: str, server_path: str, original_url: str, box: Box, cache_folder: pathlib.Path) -> Grid:
    """Read the part of a source file that covers the box, from the first source that answers.

    The cells read are kept in `cache_folder` so that a rebuild does not fetch them again.
    """
    cache_folder.mkdir(parents=True, exist_ok=True)
    stem = pathlib.Path(file_name).stem
    cache_values = cache_folder / f"{stem}.npy"
    cache_meta = cache_folder / f"{stem}.json"
    wanted = {"file": file_name, "box": box.as_dict()}
    if cache_values.exists() and cache_meta.exists():
        meta = json.loads(cache_meta.read_text(encoding="utf-8"))
        if meta.get("wanted") == wanted:
            return Grid(np.load(cache_values), meta["westLonDeg"], meta["northLatDeg"], meta["cellLonDeg"],
                        meta["cellLatDeg"], meta["nodata"], f"local working copy, first read from the {meta['origin']}")

    errors = []
    for address, origin in candidate_addresses(file_name, server_path, original_url):
        try:
            with rasterio.Env(**GDAL_OPTIONS), rasterio.open(address) as dataset:
                per_metre = _degrees_per_metre(dataset)
                t = dataset.transform
                # Columns and rows whose cells touch the box, widened to whole cells and kept inside the file.
                col0 = max(0, math.floor((box.west_lon_deg / per_metre - t.c) / t.a))
                col1 = min(dataset.width, math.ceil((box.east_lon_deg / per_metre - t.c) / t.a))
                row0 = max(0, math.floor((box.north_lat_deg / per_metre - t.f) / t.e))
                row1 = min(dataset.height, math.ceil((box.south_lat_deg / per_metre - t.f) / t.e))
                if col1 <= col0 or row1 <= row0:
                    raise ValueError(f"{file_name} does not cover the box")
                values = dataset.read(1, window=Window(col0, row0, col1 - col0, row1 - row0))
                grid = Grid(values, (t.c + col0 * t.a) * per_metre, (t.f + row0 * t.e) * per_metre,
                            t.a * per_metre, -t.e * per_metre, dataset.nodata, origin)
        except (rasterio.errors.RasterioIOError, OSError) as error:
            errors.append(f"{origin}: {error}")
            continue
        np.save(cache_values, grid.values)
        cache_meta.write_text(json.dumps({
            "wanted": wanted, "origin": origin, "westLonDeg": grid.west_lon_deg, "northLatDeg": grid.north_lat_deg,
            "cellLonDeg": grid.cell_lon_deg, "cellLatDeg": grid.cell_lat_deg, "nodata": grid.nodata,
        }, indent=2), encoding="utf-8")
        return grid
    raise RuntimeError(f"could not read {file_name} from any source: " + " | ".join(errors))
