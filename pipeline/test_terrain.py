# WHAT:    Tests for terrain.py and grids.py, on small made-up fixtures that stay in this file.
# IN:      Nothing.
# OUT:     Pass or fail.
# USED BY: pytest.
# RULES:   Expected values are worked by hand from the geometry, not copied from the code's output.
# TRAPS:   PITFALLS 4, 5.
# OWNER:   Role A.

import math

import numpy as np
import pytest

import grids
import mars
import sources
import terrain

NS_M, EW_M = 1.0, 0.948  # cell spacing at Jezero: narrower east to west


def tilted_plane(rows, cols, rise_per_m_east, rise_per_m_north):
    """Test fixture: a flat plane that rises by the given amounts per metre. Row 0 is the north edge."""
    east_m = np.arange(cols)[None, :] * EW_M
    north_m = -np.arange(rows)[:, None] * NS_M
    return (100.0 + rise_per_m_east * east_m + rise_per_m_north * north_m).astype(np.float32)


def test_slope_of_a_plane_uses_the_narrower_east_west_spacing():
    # 0.3 up per metre east and 0.4 up per metre north is a 0.5 gradient: atan(0.5) = 26.565 degrees.
    slope, baseline = terrain.slope_deg(tilted_plane(30, 30, 0.3, 0.4), NS_M, EW_M)
    assert slope[15, 15] == pytest.approx(math.degrees(math.atan(0.5)), abs=0.01)
    # Three cells each side: 6 m north to south and 6 x 0.948 m east to west, both at least 5 m.
    assert baseline == {"northSouthM": 6.0, "eastWestM": 5.688}


def test_slope_is_unknown_at_the_edge_and_beside_missing_data():
    heights = tilted_plane(30, 30, 0.1, 0.0)
    heights[15, 15] = -9999.0
    slope, _ = terrain.slope_deg(heights, NS_M, EW_M, nodata=-9999.0)
    assert np.isnan(slope[0, 15]) and np.isnan(slope[15, 2]) and np.isnan(slope[29, 29])
    assert np.isnan(slope[15, 18]) and np.isnan(slope[12, 15])  # three cells from the missing one
    assert slope[15, 19] == pytest.approx(math.degrees(math.atan(0.1)), abs=0.01)


def test_a_baseline_under_five_metres_is_refused():
    with pytest.raises(ValueError, match="minimum"):
        terrain.slope_deg(tilted_plane(20, 20, 0.1, 0.1), NS_M, EW_M, baseline_m=2.0)


def test_coarsen_takes_mean_or_largest_and_skips_missing_cells():
    values = np.array([[1, 3, np.nan, np.nan, 9],
                       [5, np.nan, np.nan, np.nan, 9]], dtype=np.float32)
    assert grids.coarsen(values, 2, "mean")[0, 0] == pytest.approx(3.0)   # (1 + 3 + 5) / 3
    assert grids.coarsen(values, 2, "max")[0, 0] == pytest.approx(5.0)
    assert np.isnan(grids.coarsen(values, 2, "mean")[0, 1])
    assert grids.coarsen(values, 2, "max").shape == (1, 2)                # the fifth column is dropped


def test_routing_grids_are_written_as_the_definition_says(tmp_path):
    heights = tilted_plane(40, 48, 0.2, 0.0)
    per_m = 1.0 / mars.METRES_PER_DEGREE
    grid = sources.Grid(heights, 77.3, 18.5, per_m, per_m, -9999.0, "test fixture")
    slope, baseline = terrain.slope_deg(heights, grid.cell_north_south_m, grid.cell_east_west_m(18.5), nodata=-9999.0)
    definition = grids.write_routing_grids(grid, slope, baseline, 18.5, tmp_path / "grid", factor=4)
    assert (definition["rows"], definition["cols"]) == (10, 12)
    assert definition["cellNorthSouthM"] == pytest.approx(4.0)
    assert definition["cellEastWestM"] == pytest.approx(4.0 * math.cos(math.radians(18.5)), abs=1e-3)
    by_name = {entry["name"]: entry for entry in definition["files"]}
    read = np.fromfile(tmp_path / "grid" / "heightM.f32", dtype="<f4").reshape(10, 12)
    assert by_name["heightM"]["bytes"] == 10 * 12 * 4
    # The first routing cell is the mean of source columns 0 to 3 of the plane.
    assert read[0, 0] == pytest.approx(float(heights[0, :4].mean()), abs=1e-3)
    slopes = np.fromfile(tmp_path / "grid" / "slopeMaxDeg.f32", dtype="<f4").reshape(10, 12)
    # Slope is unknown within 3 source cells of the edge, so the corner routing cell (source rows and columns
    # 0 to 3) has exactly one source cell with a slope, at row 3, column 3. That one value is the cell's slope.
    assert slopes[0, 0] == pytest.approx(math.degrees(math.atan(0.2)), abs=0.05)
    assert by_name["slopeMaxDeg"]["cellsWithNoData"] == 0
    # The plane rises 0.2 per metre east; the fixture's 0.948 m cells are within 0.1% of the grid's own spacing.
    assert slopes[5, 5] == pytest.approx(math.degrees(math.atan(0.2)), abs=0.05)


def test_rover_stops_and_path_are_cut_to_the_box():
    import vectors
    box = sources.Box(77.0, 77.1, 18.0, 18.1)
    stops = [
        {"properties": {"RMC": "1_0", "sol": 10, "lon": 77.05, "lat": 18.05, "elev_geoid": -2500.123, "tilt": 3.26, "dist_total_m": 120.4}},
        {"properties": {"RMC": "1_1", "sol": 11, "lon": 77.20, "lat": 18.05, "elev_geoid": -2400.0, "tilt": 1.0, "dist_total_m": 300.0}},
        {"properties": {"RMC": "1_2", "sol": 12, "lon": 77.06, "lat": 18.06, "elev_geoid": -9999, "tilt": 2.0, "dist_total_m": 400.0}},
    ]
    found = vectors.rover_stops(stops, box, "elev_geoid")["features"]
    assert [f["properties"]["stop"] for f in found] == ["1_0", "1_2"]       # the middle stop is outside the box
    assert found[0]["properties"] == {"stop": "1_0", "sol": 10, "heightM": -2500.12, "tiltDeg": 3.3, "drivenTotalM": 120.0}
    assert "heightM" not in found[1]["properties"]                          # -9999 means the file has no value

    # A drive that leaves the box twice gives two lines; a lone point inside gives none.
    drive = {"properties": {"sol": 10}, "geometry": {"type": "LineString", "coordinates": [
        [77.01, 18.05, 0], [77.02, 18.05, 0], [77.2, 18.05, 0], [77.03, 18.05, 0], [77.04, 18.05, 0], [77.3, 18.05, 0], [77.05, 18.05, 0]]}}
    lines = vectors.rover_path([drive], box)["features"]
    assert [len(f["geometry"]["coordinates"]) for f in lines] == [2, 2]
    assert lines[0]["geometry"]["coordinates"][0] == [77.01, 18.05]


def test_a_sol_is_turned_into_an_earth_date_from_the_landing_date():
    import vectors
    # One sol is 88,775.244 s, so 1215 sols are 1,248.4 Earth days after 18 February 2021: 20 July 2024.
    # NASA dates the rock core taken on that sol to 21 July 2024, which is the "day out" the layer record states.
    assert vectors.sol_to_earth_date(0, "2021-02-18") == "2021-02-18"
    assert vectors.sol_to_earth_date(1215, "2021-02-18") == "2024-07-20"


def test_slope_is_compared_with_rover_tilt_at_each_stop():
    import validate
    per_m = 1.0 / mars.METRES_PER_DEGREE
    # Test fixture: slope 10 degrees everywhere except a block of 20 degrees in the south-east.
    values = np.full((40, 40), 10.0, dtype=np.float32)
    values[20:, 20:] = 20.0
    grid = sources.Grid(values, 77.0, 18.0, per_m, per_m, None, "test fixture")
    at = lambda row, col: {"lon": 77.0 + (col + 0.5) * per_m, "lat": 18.0 - (row + 0.5) * per_m}
    stops = [
        {**at(5, 5), "tilt": 8.0},        # ours 10, rover 8: +2
        {**at(30, 30), "tilt": 21.0},     # ours 20, rover 21: -1
        {**at(5, 30), "tilt": 10.0},      # ours 10, rover 10: 0
        {**at(6, 6), "tilt": -9999},      # no tilt logged
        {"lon": 78.0, "lat": 18.0, "tilt": 3.0},   # outside the block
    ]
    check = validate.slope_check(grid, stops)
    assert (check["stopsInBox"], check["stopsUsed"], check["stopsSkippedNoTilt"]) == (4, 3, 1)
    assert check["medianDifferenceDeg"] == 0.0
    assert check["medianAbsoluteDifferenceDeg"] == 1.0
    assert check["largestAbsoluteDifferenceDeg"] == 2.0
