# WHAT:    Stage 8: checks our terrain against the rover's own measurements (F9, and the F1 height check): heights and slope.
# IN:      Terrain heights for the box; the rover's stops with the height it logged at each.
# OUT:     Summaries with sample size and typical difference, for validation.json. Still to add: a route against the rover's path.
# USED BY: build_site.py.
# RULES:   Compares like with like: areoid heights with areoid heights. Reports every stop used; hides none.
# TRAPS:   PITFALLS 3, 4, 5.
# OWNER:   Role A.

import json
import pathlib
import urllib.request

import numpy as np

import sources

REPO = pathlib.Path(__file__).resolve().parent.parent


def read_rover_stops(file_name: str, server_path: str, original_url: str) -> tuple[list[dict], str]:
    """The rover's logged stops, from the team data server, a local copy, or the mission's own address."""
    features, origin = read_feed_features(file_name, server_path, original_url)
    return [feature["properties"] for feature in features], origin


def read_feed_features(file_name: str, server_path: str, original_url: str) -> tuple[list[dict], str]:
    """Every feature of one of the rover's GeoJSON feeds, with which source it came from."""
    local = REPO / "data" / "raw" / pathlib.PurePosixPath(server_path.strip("/")).name / file_name
    candidates = []
    server = sources.data_server_url()
    if server:
        candidates.append((f"{server}/{server_path.strip('/')}/{file_name}", "team data server"))
    candidates.append((original_url, "original address"))
    text, origin = None, None
    if local.exists():
        text, origin = local.read_text(encoding="utf-8"), "local copy in data/raw"
    else:
        errors = []
        for url, name in candidates:
            try:
                request = urllib.request.Request(url, headers={"User-Agent": "mars-site-builder"})
                with urllib.request.urlopen(request, timeout=60) as response:
                    text, origin = response.read().decode("utf-8"), name
                local.parent.mkdir(parents=True, exist_ok=True)
                local.write_text(text, encoding="utf-8")
                break
            except OSError as error:
                errors.append(f"{name}: {error}")
        if text is None:
            raise RuntimeError(f"could not read {file_name}: " + " | ".join(errors))
    return json.loads(text)["features"], origin


def height_check(terrain: sources.Grid, stops: list[dict], height_field: str) -> dict:
    """Terrain height minus the rover's logged height at every stop inside the terrain block.

    The rover's file gives east-positive longitude and planetocentric latitude, and heights relative
    to the areoid, the same as the terrain mosaic. A stop is skipped only when it lies outside the
    block, beside missing terrain, or has no logged height; the count of each is reported.
    """
    lon = np.array([stop["lon"] for stop in stops], dtype=float)
    lat = np.array([stop["lat"] for stop in stops], dtype=float)
    logged = np.array([stop.get(height_field, np.nan) for stop in stops], dtype=float)
    logged[logged <= -9000] = np.nan  # the file writes -9999 where it has no value
    box = terrain.box
    in_box = (lon >= box.west_lon_deg) & (lon <= box.east_lon_deg) & (lat >= box.south_lat_deg) & (lat <= box.north_lat_deg)
    sampled = terrain.sample(lon, lat)
    usable = in_box & np.isfinite(sampled) & np.isfinite(logged)
    difference = (sampled - logged)[usable]
    summary = {
        "what": "Terrain height minus the height the rover logged at the same position",
        "heightReference": "metres relative to the areoid, in both",
        "stopsInBox": int(in_box.sum()),
        "stopsUsed": int(usable.sum()),
        "stopsSkippedNoTerrain": int((in_box & ~np.isfinite(sampled)).sum()),
        "stopsSkippedNoLoggedHeight": int((in_box & np.isfinite(sampled) & ~np.isfinite(logged)).sum()),
    }
    if difference.size:
        absolute = np.abs(difference)
        sols = [stops[i]["sol"] for i in np.flatnonzero(usable)]
        summary.update({
            "medianDifferenceM": round(float(np.median(difference)), 2),
            "medianAbsoluteDifferenceM": round(float(np.median(absolute)), 2),
            "percentile90AbsoluteDifferenceM": round(float(np.percentile(absolute, 90)), 2),
            "largestAbsoluteDifferenceM": round(float(absolute.max()), 2),
            "firstSol": int(min(sols)),
            "lastSol": int(max(sols)),
        })
    return summary


def slope_check(slope: sources.Grid, stops: list[dict], tilt_field: str = "tilt") -> dict:
    """Our slope minus the tilt the rover measured, at every stop inside the block.

    `slope` holds the steepest slope at each terrain cell, in degrees, with NaN where it is unknown. The rover's
    tilt is how far the vehicle leaned from level where it stood. The two are close kin, not the same thing: ours
    is the ground's steepest slope over a span of about 6 m, the rover's is a vehicle standing on six wheels.
    """
    lon = np.array([stop["lon"] for stop in stops], dtype=float)
    lat = np.array([stop["lat"] for stop in stops], dtype=float)
    tilt = np.array([stop.get(tilt_field, np.nan) for stop in stops], dtype=float)
    tilt[(tilt <= -9000) | (tilt < 0)] = np.nan  # the file writes -9999 where it has no value
    box = slope.box
    in_box = (lon >= box.west_lon_deg) & (lon <= box.east_lon_deg) & (lat >= box.south_lat_deg) & (lat <= box.north_lat_deg)
    sampled = slope.sample(lon, lat)
    usable = in_box & np.isfinite(sampled) & np.isfinite(tilt)
    ours, rovers = sampled[usable], tilt[usable]
    summary = {
        "what": "Our slope from the orbital terrain minus the tilt the rover measured at the same position",
        "unit": "degrees from level, in both",
        "stopsInBox": int(in_box.sum()),
        "stopsUsed": int(usable.sum()),
        "stopsSkippedNoSlope": int((in_box & ~np.isfinite(sampled)).sum()),
        "stopsSkippedNoTilt": int((in_box & np.isfinite(sampled) & ~np.isfinite(tilt)).sum()),
    }
    if ours.size >= 3:
        difference = ours - rovers
        absolute = np.abs(difference)
        summary.update({
            "medianDifferenceDeg": round(float(np.median(difference)), 1),
            "medianAbsoluteDifferenceDeg": round(float(np.median(absolute)), 1),
            "percentile90AbsoluteDifferenceDeg": round(float(np.percentile(absolute, 90)), 1),
            "largestAbsoluteDifferenceDeg": round(float(absolute.max()), 1),
            "correlation": round(float(np.corrcoef(ours, rovers)[0, 1]), 2),
            "roverTiltMedianDeg": round(float(np.median(rovers)), 1),
            "roverTiltLargestDeg": round(float(rovers.max()), 1),
            "ourSlopeMedianDeg": round(float(np.median(ours)), 1),
            "ourSlopeLargestDeg": round(float(ours.max()), 1),
        })
    return summary
