# WHAT:    Tests for config.py. The small configs written here are test fixtures; the real ones in ../sites/ are also all loaded.
# IN:      Nothing, plus the real configs in ../sites/.
# OUT:     Pass or fail under pytest.
# USED BY: The pipeline check command.
# RULES:   Fixture coordinates are round numbers chosen to make the arithmetic obvious. They are not places.
# TRAPS:   PITFALLS 2, 4.
# OWNER:   Role A.

import pathlib

import pytest

import config
import mars

SITES = pathlib.Path(__file__).resolve().parent.parent / "sites"

FIXTURE_POINT = """
id: fixture-site
name: Fixture
place: Nowhere
mission: None
missionYears: "none"
level: 2
reviewedByPerson: false
position:
  from: point
  source: "test fixture"
  sourceUrl: "test fixture"
  longitudeConvention: "{convention}"
  latitudeType: planetocentric
  lonEastDeg: {lon}
  latDeg: 10
"""


def write(tmp_path, text, name="fixture-site.yaml"):
    path = tmp_path / name
    path.write_text(text, encoding="utf-8")
    return path


@pytest.mark.parametrize("convention, lon, expected", [
    ("east-positive, -180 to 180", 77.5, 77.5),
    ("east-positive, 0 to 360", 312.0, -48.0),
    ("west-positive, 0 to 360", 48.0, -48.0),
])
def test_longitude_is_converted_at_the_boundary(tmp_path, convention, lon, expected):
    loaded = config.load_site_config(write(tmp_path, FIXTURE_POINT.format(convention=convention, lon=lon)))
    assert loaded["positionChecked"]["lonEastDeg"] == pytest.approx(expected)
    assert loaded["positionChecked"]["latDeg"] == 10


def test_footprint_centre_and_size(tmp_path):
    text = FIXTURE_POINT.format(convention="east-positive, 0 to 360", lon=0).replace(
        "  from: point", "  from: terrain-footprint").replace(
        "  lonEastDeg: 0\n  latDeg: 10", "  westLonDeg: 300\n  eastLonDeg: 302\n  southLatDeg: 59\n  northLatDeg: 61")
    position = config.load_site_config(write(tmp_path, text))["positionChecked"]
    assert position["lonEastDeg"] == pytest.approx(-59.0)
    assert position["latDeg"] == pytest.approx(60.0)
    # Two degrees of latitude is 118.549 km. Two degrees of longitude at 60 N is half of that.
    assert position["footprintHeightKm"] == pytest.approx(2 * mars.METRES_PER_DEGREE / 1000)
    assert position["footprintWidthKm"] == pytest.approx(mars.METRES_PER_DEGREE / 1000, rel=1e-9)


def test_a_position_without_a_source_is_refused(tmp_path):
    text = FIXTURE_POINT.format(convention="east-positive, -180 to 180", lon=1).replace('  source: "test fixture"\n', "")
    with pytest.raises(config.ConfigError, match="position.source"):
        config.load_site_config(write(tmp_path, text))


def test_planetographic_latitude_is_refused(tmp_path):
    text = FIXTURE_POINT.format(convention="east-positive, -180 to 180", lon=1).replace("planetocentric", "planetographic")
    with pytest.raises(config.ConfigError, match="planetocentric"):
        config.load_site_config(write(tmp_path, text))


def test_id_must_match_the_file_name(tmp_path):
    text = FIXTURE_POINT.format(convention="east-positive, -180 to 180", lon=1)
    with pytest.raises(config.ConfigError, match="file name"):
        config.load_site_config(write(tmp_path, text, name="other-name.yaml"))


def test_every_real_site_config_loads():
    loaded = config.load_all_site_configs(SITES)
    assert len(loaded) >= 9
    for site in loaded:
        position = site["positionChecked"]
        assert -180 < position["lonEastDeg"] <= 180
        assert -90 <= position["latDeg"] <= 90
        assert position["source"] and position["sourceUrl"]


def test_real_footprints_are_the_strips_the_labels_describe():
    by_id = {site["id"]: site for site in config.load_all_site_configs(SITES)}
    # Viking 1 terrain label: 8526 x 20459 cells of 1.0086 m, so about 8.6 km by 20.6 km.
    viking = by_id["chryse-planitia"]["positionChecked"]
    assert viking["footprintHeightKm"] == pytest.approx(20.6, abs=0.1)
    assert viking["footprintWidthKm"] == pytest.approx(8.5, abs=0.2)
    assert viking["lonEastDeg"] == pytest.approx(-47.9456, abs=0.0001)  # 312.0544 E in 0 to 360
