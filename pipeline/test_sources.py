# WHAT:    Tests for sources.py and for the site tile cutting in tiles.py. Every grid and file here is a small made-up test fixture.
# IN:      Nothing. Fixture files are written to a temporary folder and never reach the app.
# OUT:     Pass or fail under pytest.
# USED BY: The pipeline check command.
# RULES:   Fixture values are simple planes so the expected answers can be worked by hand.
# TRAPS:   PITFALLS 4, 5.
# OWNER:   Role A.

import math

import numpy as np
import pytest
import rasterio
from PIL import Image
from rasterio.crs import CRS
from rasterio.transform import from_origin

import mars
import sources
import tiles

MARS_GRID = "+proj=eqc +lat_ts=0 +lat_0=0 +lon_0=0 +x_0=0 +y_0=0 +R=3396190 +units=m +no_defs"


def fixture_plane(rows=40, cols=60, nodata=None) -> sources.Grid:
    """Test fixture: a tilted plane. Value = 100 * row + column, on cells 0.001 degrees across."""
    values = (100.0 * np.arange(rows)[:, None] + np.arange(cols)[None, :]).astype(np.float32)
    return sources.Grid(values, west_lon_deg=10.0, north_lat_deg=20.0, cell_lon_deg=0.001, cell_lat_deg=0.001,
                        nodata=nodata, origin="test fixture")


def test_box_around_a_point_uses_the_mars_radius():
    box = sources.Box.around(0.0, 0.0, 3.0, 3.0)
    # 1.5 km is 1500 / 59,274.70 = 0.025306 degrees
    assert box.north_lat_deg == pytest.approx(0.025306, abs=1e-6)
    assert box.east_lon_deg == pytest.approx(0.025306, abs=1e-6)
    # At 60 degrees north a degree of longitude is half as long, so the box is twice as wide in degrees.
    north = sources.Box.around(0.0, 60.0, 3.0, 3.0)
    assert north.east_lon_deg == pytest.approx(2 * 0.025306, abs=2e-6)
    assert north.north_lat_deg - 60.0 == pytest.approx(0.025306, abs=1e-6)


def test_cells_are_narrower_east_to_west():
    grid = fixture_plane()
    assert grid.cell_north_south_m == pytest.approx(0.001 * mars.METRES_PER_DEGREE)
    assert grid.cell_east_west_m(60.0) == pytest.approx(grid.cell_north_south_m / 2, rel=1e-9)


def test_sample_blends_neighbouring_cells():
    grid = fixture_plane()
    # Centre of row 2, column 3
    assert grid.sample(10.0035, 19.9975) == pytest.approx(203.0)
    # Halfway to the next column and the next row
    assert grid.sample(10.0040, 19.9975) == pytest.approx(203.5)
    assert grid.sample(10.0035, 19.9970) == pytest.approx(253.0)


def test_sample_outside_is_missing_unless_clamped():
    grid = fixture_plane()
    assert np.isnan(grid.sample(9.9, 19.9975))
    assert grid.sample(9.9, 19.9975, clamp=True) == pytest.approx(200.0)  # nearest edge cell of row 2


def test_sample_beside_missing_data_is_missing():
    grid = fixture_plane(nodata=-9999.0)
    grid.values[2, 3] = -9999.0
    assert np.isnan(grid.sample(10.0035, 19.9975))
    assert np.isnan(grid.sample(10.0040, 19.9975))
    assert grid.sample(10.0055, 19.9975) == pytest.approx(205.0)


def test_halved_averages_blocks_and_ignores_missing_cells():
    grid = fixture_plane(rows=4, cols=4, nodata=-9999.0)
    half = grid.halved()
    assert half.values.shape == (2, 2)
    assert half.cell_lat_deg == pytest.approx(0.002)
    assert half.values[0, 0] == pytest.approx((0 + 1 + 100 + 101) / 4)
    grid.values[0, 0] = -9999.0
    assert grid.halved().values[0, 0] == pytest.approx((1 + 100 + 101) / 3)


def write_fixture_file(path, crs_text, rows=50, cols=80):
    """Test fixture file: 1 m cells on a grid whose north-west corner is at x = 600 km, y = 300 km."""
    values = (1000.0 * np.arange(rows)[:, None] + np.arange(cols)[None, :]).astype(np.float32)
    with rasterio.open(path, "w", driver="GTiff", height=rows, width=cols, count=1, dtype="float32",
                       crs=CRS.from_string(crs_text), transform=from_origin(600_000.0, 300_000.0, 1.0, 1.0),
                       nodata=-9999.0) as dataset:
        dataset.write(values, 1)


def test_read_box_returns_the_cells_that_touch_the_box(tmp_path, monkeypatch):
    monkeypatch.delenv("MARS_DATA_URL", raising=False)
    monkeypatch.setattr(sources, "data_server_url", lambda: None)
    folder = tmp_path / "raw" / "fixture"
    folder.mkdir(parents=True)
    write_fixture_file(folder / "fixture.tif", MARS_GRID)
    monkeypatch.setattr(sources, "REPO", tmp_path / "missing")  # no local copy; the 'original address' is the file
    per_m = 1.0 / mars.METRES_PER_DEGREE
    # Columns 10 to 19 and rows 5 to 9, in degrees
    box = sources.Box((600_010.0) * per_m, (600_020.0) * per_m, (300_000.0 - 10.0) * per_m, (300_000.0 - 5.0) * per_m)
    monkeypatch.setattr(sources, "candidate_addresses", lambda *a: [(str(folder / "fixture.tif"), "test fixture file")])
    monkeypatch.setattr(sources, "ROWS_PER_READ", 2)  # the 5 rows arrive as blocks of 2, 2 and 1
    grid = sources.read_box("fixture.tif", "raw/fixture", "unused", box, tmp_path / "work")
    assert grid.values.shape == (5, 10)
    assert grid.values[0, 0] == 5010.0 and grid.values[-1, -1] == 9019.0
    assert grid.west_lon_deg == pytest.approx(600_010.0 * per_m)
    assert grid.north_lat_deg == pytest.approx(299_995.0 * per_m)
    assert grid.origin == "test fixture file"
    # A second read comes from the working copy and gives the same cells.
    again = sources.read_box("fixture.tif", "raw/fixture", "unused", box, tmp_path / "work")
    assert np.array_equal(again.values, grid.values) and "working copy" in again.origin


def test_a_file_on_another_projection_is_refused(tmp_path, monkeypatch):
    path = tmp_path / "other.tif"
    write_fixture_file(path, MARS_GRID.replace("+lat_ts=0", "+lat_ts=20"))
    monkeypatch.setattr(sources, "candidate_addresses", lambda *a: [(str(path), "test fixture file")])
    with pytest.raises(ValueError, match="projection"):
        sources.read_box("other.tif", "raw/fixture", "unused", sources.Box(10.0, 10.1, 5.0, 5.1), tmp_path / "work")


def test_terrain_heights_survive_encoding_to_a_tenth_of_a_metre():
    heights = np.array([[-2415.3, -2354.03], [-1869.8, 0.0]])
    decoded = tiles.decode_terrain(tiles.encode_terrain(heights))
    assert np.abs(decoded - heights).max() <= 0.05 + 1e-9


def test_site_tiles_put_cells_in_the_right_place(tmp_path):
    grid = fixture_plane(rows=400, cols=600)
    box = grid.box
    zoom = 14
    count, size = tiles.write_site_terrain_tiles(grid, box, zoom, zoom, tmp_path / "terrain")
    columns, rows = tiles.tile_range(box, zoom)
    assert count == len(columns) * len(rows) and size > 0
    x, y = columns[0], rows[0]
    decoded = tiles.decode_terrain(np.asarray(Image.open(tmp_path / "terrain" / str(zoom) / str(x) / f"{y}.png")))
    lon, lat = tiles.tile_pixel_positions(zoom, x, y)
    expected = grid.sample(lon, lat, clamp=True)
    assert np.abs(decoded - expected).max() <= 0.05 + 1e-6
    # Independent check of one pixel: its position from the tile maths, its value from the plane.
    west, south, east, north = mars.tile_bounds_deg(zoom, x, y)
    assert lon[0, 0] == pytest.approx(west + (east - west) / 512)
    assert lat[0, 0] < north and lat[-1, 0] > south


def test_image_tiles_are_transparent_outside_the_block(tmp_path):
    values = np.full((300, 300), 200, dtype=np.uint8)
    grid = sources.Grid(values, 10.0, 20.0, 0.001, 0.001, nodata=0.0, origin="test fixture")
    zoom = 12
    count, _ = tiles.write_site_image_tiles(grid, grid.box, zoom, zoom, tmp_path / "image")
    assert count >= 1
    columns, rows = tiles.tile_range(grid.box, zoom)
    tile = np.asarray(Image.open(tmp_path / "image" / str(zoom) / str(columns[0]) / f"{rows[0]}.webp").convert("RGBA"))
    assert tile[..., 3].min() == 0 and tile[..., 3].max() == 255   # part inside, part outside
    inside = tile[..., 3] == 255
    assert abs(float(tile[..., 0][inside].mean()) - 200.0) < 3.0
