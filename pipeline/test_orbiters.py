# WHAT:    Tests for the conversions and parsing in build_orbiters.py.
# IN:      Nothing. The Horizons text below is a made-up test fixture in the layout of a real Horizons reply.
# OUT:     Pass or fail.
# USED BY: pytest.
# RULES:   No network: only the pure functions are tested.
# TRAPS:   PITFALLS 4.
# OWNER:   Role A.

import datetime as dt

import pytest

import build_orbiters as bo

FIXTURE = """
Center geodetic : 282.695, 18.497, 0.0    {W-lon(deg),Lat(deg),Alt(km)}
$$SOE
 2026-Nov-14 21:26,*, , 120.5,   0.4,
 2026-Nov-14 21:27,*, , 121.0,  12.6,
$$EOE
"""


def test_west_longitude_becomes_east_in_the_app_range():
    # Horizons echoed 282.695 W for Bright Angel, which is 77.305 E.
    assert bo.east_from_west(282.695) == pytest.approx(77.305)
    assert bo.east_from_west(90.0) == pytest.approx(-90.0)
    assert bo.east_from_west(0.0) == pytest.approx(0.0)


def test_latitude_types_convert_both_ways_and_differ_by_a_fraction_of_a_degree():
    centric = 18.497
    detic = bo.planetodetic_from_planetocentric(centric)
    assert 0.2 < detic - centric < 0.4  # PITFALLS 4: up to a third of a degree
    assert bo.planetocentric_from_planetodetic(detic) == pytest.approx(centric, abs=1e-9)
    assert bo.planetodetic_from_planetocentric(0.0) == 0.0


def test_rows_between_the_markers_are_read():
    table = bo.rows(FIXTURE)
    assert len(table) == 2 and table[1][0] == "2026-Nov-14 21:27" and float(table[1][4]) == 12.6
    assert bo.rows("no markers here") == []


def test_end_of_a_prediction_is_read_from_the_refusal():
    text = 'No ephemeris for target "Mars Reconnaissance Orbiter (spacecraft)" after A.D. 2026-NOV-30 12:48:00.0000 TDB'
    assert bo.coverage_end(text) == dt.datetime(2026, 11, 30, 12, 48, tzinfo=dt.timezone.utc)
    centre = 'No ephemeris for center "Mars Reconnaissance Orbiter (spacecraft)" after A.D. 2026-NOV-30 12:48:50.8169 UT'
    assert bo.coverage_end(centre) == dt.datetime(2026, 11, 30, 12, 48, tzinfo=dt.timezone.utc)
    assert bo.coverage_end(FIXTURE) is None
