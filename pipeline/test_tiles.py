# WHAT:    Tests for tiles.py. Every image here is a small made-up test fixture, built in the test and never written to the app.
# IN:      Nothing.
# OUT:     Pass or fail under pytest.
# USED BY: The pipeline check command.
# RULES:   Fixtures stay in this file. Expected values are worked by hand.
# TRAPS:   PITFALLS 4.
# OWNER:   Role A.

import numpy as np
from PIL import Image

import mars
import tiles


def fixture_latitude_bands(rows: int = 512, cols: int = 1024) -> np.ndarray:
    """Test fixture: each row's red value encodes its latitude; green encodes longitude."""
    lat = 90.0 - (np.arange(rows) + 0.5) * 180.0 / rows
    lon = -180.0 + (np.arange(cols) + 0.5) * 360.0 / cols
    image = np.zeros((rows, cols, 3), dtype=np.uint8)
    image[:, :, 0] = np.rint((lat[:, None] + 90.0) / 180.0 * 255.0)
    image[:, :, 1] = np.rint((lon[None, :] + 180.0) / 360.0 * 255.0)
    return image


def test_reprojection_puts_latitudes_on_the_right_rows():
    source = fixture_latitude_bands()
    zoom = 2
    out = tiles.equirectangular_to_mercator(source, zoom)
    side = mars.TILE_SIZE_PX * 2**zoom
    assert out.shape == (side, side, 3)
    for lat in (-70.0, -18.45, 0.0, 18.45, 47.64, 68.22):
        _, y = mars.mercator_fraction(0.0, lat)
        row = int(y * side)
        expected_red = (lat + 90.0) / 180.0 * 255.0
        # The fixture steps by 0.35 degrees a row and red by 1.4 a degree, so allow 2 levels.
        assert abs(float(out[row, side // 2, 0]) - expected_red) <= 2.0


def test_reprojection_keeps_east_on_the_right():
    source = fixture_latitude_bands()
    out = tiles.equirectangular_to_mercator(source, 2)
    side = out.shape[0]
    green = out[side // 2, :, 1].astype(int)
    assert green[0] < 5 and green[-1] > 250
    assert np.all(np.diff(green) >= 0)
    # Longitude 77.45 E sits at this fraction of the way across.
    x, _ = mars.mercator_fraction(77.45, 0.0)
    assert abs(green[int(x * side)] - (77.45 + 180.0) / 360.0 * 255.0) <= 2


def test_halve_averages_blocks():
    image = np.array([[[0], [4]], [[8], [12]]], dtype=np.uint8)
    assert tiles.halve(image).tolist() == [[[6]]]


def test_pyramid_writes_every_tile(tmp_path):
    zoom_max = 2
    side = mars.TILE_SIZE_PX * 2**zoom_max
    top = np.zeros((side, side, 3), dtype=np.uint8)
    top[: side // 2, side // 2:, 0] = 200  # north-east quarter is red
    count, size = tiles.write_image_pyramid(top, zoom_max, tmp_path)
    assert count == 1 + 4 + 16
    assert size == sum(p.stat().st_size for p in tmp_path.rglob("*.jpg"))
    # Tile address is zoom / x / y, with x counted east and y counted south.
    north_east = np.asarray(Image.open(tmp_path / "1" / "1" / "0.jpg"))
    south_west = np.asarray(Image.open(tmp_path / "1" / "0" / "1.jpg"))
    assert north_east[:, :, 0].mean() > 190
    assert south_west[:, :, 0].mean() < 10
