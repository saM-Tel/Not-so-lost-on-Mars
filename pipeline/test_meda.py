# WHAT:    Tests for meda.py: reading MEDA's local true solar time, leaving out empty and missing values, the first
#          reliable sol of each sensor, the hour split across two files, and percentiles only with enough sols.
# IN:      Nothing. The CSV text below is a made-up test fixture in MEDA's column layout, not real data.
# OUT:     Pass or fail under pytest.
# USED BY: python -m pytest -q
# RULES:   Fixtures are named as such and stay in this file.
# TRAPS:   PITFALLS 9.
# OWNER:   Role A.

import meda

FIXTURE_PS = """SCLK,LMST,LTST,PRESSURE,PRESSURE_UNCERTAINTY,TRANSDUCER
1,00700M00:00:00.060,0699 23:59:58,700.0,,1
2,00700M00:00:01.033,0699 23:59:59,702.0,,1
3,00700M00:00:02.006,0700 00:00:00,710.0,,1
4,00700M00:00:02.979,0700 00:00:01,,,1
5,00700M00:00:03.952,0700 00:00:02,999999999,,1
6,00700M00:00:04.925,bad,720.0,,1
"""

FIXTURE_WS = """SCLK,LMST,LTST,HORIZONTAL_WIND_SPEED,HORIZONTAL_WIND_SPEED_UNCERTAINTY,ROVER_STILL
1,00050M11:30:23.342,0050 11:10:21,4.0,,1
2,00050M11:30:23.828,0050 11:10:22,8.0,,0
3,00050M11:30:24.314,0050 11:10:23,6.0,,1
"""


def test_local_true_solar_time_is_read_as_sol_and_hour():
    assert meda.parse_ltst("0699 23:32:56") == (699, 23)
    assert meda.parse_ltst("1402 00:00:00.5") == (1402, 0)
    assert meda.parse_ltst("00700M00:00:00.060") is None
    assert meda.parse_ltst("") is None


def test_empty_and_missing_values_are_left_out_and_hours_keyed_by_true_solar_sol():
    sums = meda.accumulate(FIXTURE_PS, meda.PRODUCTS["PS"], 700)["pressurePa"]
    assert sums == {"699:23": [1402.0, 2], "700:0": [710.0, 1]}


def test_a_sensor_is_skipped_before_its_first_reliable_sol():
    early = meda.accumulate(FIXTURE_PS.replace("PRESSURE,", "X,").replace("TRANSDUCER", "T"), meda.PRODUCTS["RHS"], 50)
    assert early == {}
    assert meda.accumulate(FIXTURE_WS, meda.PRODUCTS["WS"], 30) == {}


def test_wind_is_used_only_while_the_rover_stands_still():
    sums = meda.accumulate(FIXTURE_WS, meda.PRODUCTS["WS"], 50, still_only=True)["windMps"]
    assert sums == {"50:11": [10.0, 2]}


def test_an_hour_split_across_two_files_is_merged():
    total = {}
    meda.merge(total, {"pressurePa": {"699:23": [1400.0, 2]}})
    meda.merge(total, {"pressurePa": {"699:23": [700.0, 1], "700:0": [5.0, 1]}})
    assert total == {"pressurePa": {"699:23": [2100.0, 3], "700:0": [5.0, 1]}}


def test_percentiles_need_enough_readings_and_enough_sols():
    n = meda.MIN_SAMPLES["pressurePa"]
    sums = {"pressurePa": {f"{sol}:9": [float(700 + sol) * n, n] for sol in range(1, 6)}}
    sums["pressurePa"]["6:9"] = [0.0, n - 1]          # too few readings: not counted
    sums["pressurePa"]["1:10"] = [700.0 * n, n]       # only one sol at 10h: no percentiles
    hours = meda.typical_by_hour(sums, "pressurePa", digits=0)
    assert hours[9] == {"sols": 5, "p10": 701.0, "p50": 703.0, "p90": 705.0}
    assert hours[10] == {"sols": 1}
    assert hours[11] == {"sols": 0}


def test_kelvin_is_converted_to_celsius():
    n = meda.MIN_SAMPLES["sensorTempK"]
    sums = {"sensorTempK": {f"{sol}:3": [273.15 * n, n] for sol in range(1, 6)}}
    assert meda.typical_by_hour(sums, "sensorTempK", convert=lambda k: k - 273.15)[3]["p50"] == 0.0
