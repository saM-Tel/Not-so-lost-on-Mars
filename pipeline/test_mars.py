# WHAT:    Tests for mars.py. Expected values are worked by hand from the Mars radius, not taken from data.
# IN:      Nothing.
# OUT:     Pass or fail under pytest.
# USED BY: The pipeline check command.
# RULES:   No Earth values. Tolerances are stated beside each check.
# TRAPS:   PITFALLS 3, 4.
# OWNER:   Role A.

import math

import pytest

import mars


def test_constants_match_the_brief():
    assert mars.MARS_RADIUS_M == 3_396_190.0
    assert mars.MARS_GRAVITY_M_S2 == 3.71
    assert mars.SOL_S == 88_775.244


def test_one_degree_on_the_ground():
    # 2 * pi * 3,396,190 / 360 = 59,274.70 m
    assert mars.METRES_PER_DEGREE == pytest.approx(59_274.70, abs=0.01)


def test_longitude_conversion():
    assert mars.lon_to_180(77.45) == pytest.approx(77.45)
    assert mars.lon_to_180(312.05) == pytest.approx(-47.95)  # Viking 1, given as 0 to 360 east
    assert mars.lon_to_180(360.0) == pytest.approx(0.0)
    assert mars.lon_to_180(180.0) == pytest.approx(180.0)
    assert mars.lon_to_180(-180.0) == pytest.approx(180.0)
    assert mars.west_to_east(47.95) == pytest.approx(-47.95)
    assert mars.west_to_east(225.71) == pytest.approx(134.29)  # Viking 2 in west-positive


def test_cells_are_narrower_east_to_west():
    # cos(18.45 deg) = 0.9486, the figure quoted for Jezero in PITFALLS section 4
    assert mars.east_west_spacing_m(1.0, 18.45) == pytest.approx(0.9486, abs=0.0001)
    assert mars.east_west_spacing_m(1.0, 0.0) == pytest.approx(1.0)


def test_distance_uses_the_mars_radius():
    quarter = math.pi * 3_396_190.0 / 2  # equator to pole
    assert mars.distance_m(0, 0, 0, 90) == pytest.approx(quarter, rel=1e-12)
    assert mars.distance_m(10, 0, 11, 0) == pytest.approx(mars.METRES_PER_DEGREE, rel=1e-9)
    # One degree of longitude at 60 N is half as long as at the equator (small-angle, so 0.01 % slack).
    assert mars.distance_m(10, 60, 11, 60) == pytest.approx(mars.METRES_PER_DEGREE / 2, rel=1e-4)
    assert mars.distance_m(77.3, 18.5, 77.3, 18.5) == 0.0


def test_mercator_square():
    assert mars.mercator_fraction(0, 0) == pytest.approx((0.5, 0.5))
    assert mars.mercator_fraction(-180, mars.MERCATOR_MAX_LAT_DEG) == pytest.approx((0.0, 0.0))
    assert mars.mercator_fraction(180, -mars.MERCATOR_MAX_LAT_DEG) == pytest.approx((1.0, 1.0))
    assert mars.MERCATOR_MAX_LAT_DEG == pytest.approx(85.0511, abs=0.0001)
    for lat in (-70.0, -18.45, 0.0, 18.45, 68.22):
        _, y = mars.mercator_fraction(0, lat)
        assert mars.mercator_y_to_lat_deg(y) == pytest.approx(lat, abs=1e-9)


def test_tile_bounds():
    west, south, east, north = mars.tile_bounds_deg(0, 0, 0)
    assert (west, east) == (-180.0, 180.0)
    assert north == pytest.approx(mars.MERCATOR_MAX_LAT_DEG)
    assert south == pytest.approx(-mars.MERCATOR_MAX_LAT_DEG)
    west, south, east, north = mars.tile_bounds_deg(1, 1, 0)  # north-east quarter
    assert (west, east) == (0.0, 180.0)
    assert south == pytest.approx(0.0, abs=1e-12)


def test_tile_pixel_size_is_for_mars():
    # Zoom 0 at the equator: 2 * pi * 3,396,190 / 256 = 83,355.0 m per pixel. Earth would give 156,543 m.
    assert mars.tile_pixel_size_m(0, 0.0) == pytest.approx(83_355.0, abs=0.1)
