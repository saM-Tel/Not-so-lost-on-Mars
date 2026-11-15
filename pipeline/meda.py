# WHAT:    Stage 7b: typical weather by local solar hour at Jezero for today's season, from Perseverance's MEDA derived
#          environment data (F11): pressure, the temperature inside the humidity sensor on the rover's mast, and
#          horizontal wind speed, each as the 10th, 50th and 90th percentile across sols, with the sol count.
# IN:      MEDA data_derived_env CSV files and labels, one folder per sol (team data server raw/meda, or the PDS
#          Atmospheres Node); the Perseverance waypoint file in data/raw/feeds for where the rover was each sol. The
#          season of each sol comes from its label's start time by Mars24 (mars.py), not from the ancillary file.
# OUT:     ../app/public/data/weather/<site id>.json in the "hourly" form (docs/DATA_CONTRACT.md), with a source record.
#          Per-sol sums are cached in ../data/work/meda/ so a rebuild does not fetch again.
# USED BY: weather.py (python weather.py bright-angel). Tests: test_meda.py.
# RULES:   Same season only: the sols fetched are the ones near today's solar longitude in each Mars year. Values are
#          "typical", with the number of sols behind each. Empty values and the missing constant 999999999 are left out.
#          As the MEDA readme says: humidity sensor data before sol 63 and wind data before sol 36 are not used.
#          The humidity sensor's own temperature is never called the air temperature.
# TRAPS:   PITFALLS 3, 9.
# OWNER:   Role A.

import concurrent.futures
import csv
import datetime
import io
import json
import pathlib
import re
import urllib.request

import numpy as np

import mars
import records
import sources

REPO = pathlib.Path(__file__).resolve().parent.parent
OUT = REPO / "app" / "public" / "data" / "weather"
CACHE = REPO / "data" / "work" / "meda"
WAYPOINTS = REPO / "data" / "raw" / "feeds" / "m20_perseverance_waypoints.json"

SERVER_PATH = "raw/meda/data_derived_env"
ORIGINAL_URL = "https://atmos.nmsu.edu/PDS/data/PDS4/Mars2020/mars2020_meda/data_derived_env"
MISSING = 999_999_999.0

# What we read from each product: the column, the name in the output, and the first sol whose data the MEDA readme
# calls reliable for science.
PRODUCTS = {
    "PS": [("PRESSURE", "pressurePa", 0)],
    "RHS": [("HUMIDITY_LOCAL_TEMP", "sensorTempK", 63)],
    "WS": [("HORIZONTAL_WIND_SPEED", "windMps", 36)],
}
# An hour of one sol counts only with this many readings in it (about 1 a second): ten minutes for pressure, five for
# the humidity sensor and wind, which run in shorter sessions.
MIN_SAMPLES = {"pressurePa": 600, "sensorTempK": 300, "windMps": 300}
# Percentiles need at least this many sols, as in weather.py.
MIN_SOLS = 5

STATIONS = {
    "bright-angel": {
        "sols": list(range(3, 65)) + list(range(672, 734)) + list(range(1340, 1403)),
        "record": {
            "mission": "Mars 2020 (Perseverance)",
            "instrument": "Mars Environmental Dynamics Analyzer (MEDA)",
            "agency": "NASA; MEDA was provided by Spain's Centro de Astrobiología (CSIC-INTA)",
            "sourceUrl": "https://atmos.nmsu.edu/PDS/data/PDS4/Mars2020/mars2020_meda/",
            "credit": "NASA/JPL-Caltech/CAB (CSIC-INTA)",
        },
    },
}


def parse_ltst(text: str) -> tuple[int, int] | None:
    """Local true solar time as MEDA writes it, '0699 23:32:56', into (sol, hour). None if it is not in that form."""
    match = re.fullmatch(r"\s*(\d{1,5}) (\d{2}):(\d{2}):(\d{2})(\.\d+)?\s*", text or "")
    if not match:
        return None
    hour = int(match.group(2))
    return (int(match.group(1)), hour) if 0 <= hour < 24 else None


def number(text: str | None) -> float | None:
    """A reading, or None when it is empty, not a number or the missing constant."""
    try:
        value = float(text)
    except (TypeError, ValueError):
        return None
    return None if not np.isfinite(value) or value >= MISSING else value


def accumulate(csv_text: str, columns: list[tuple[str, str, int]], file_sol: int, still_only: bool = False) -> dict:
    """Sums and counts of each column by (local true solar sol, hour): {name: {"sol:hour": [sum, count]}}.

    `file_sol` is the mission sol of the file (its local mean solar sol); a column is skipped when the file is earlier
    than the first reliable sol. With `still_only`, rows are used only while the rover stood still (ROVER_STILL = 1).
    """
    wanted = [(column, name) for column, name, first_sol in columns if file_sol >= first_sol]
    sums: dict[str, dict[str, list[float]]] = {name: {} for _, name in wanted}
    if not wanted:
        return sums
    reader = csv.DictReader(io.StringIO(csv_text))
    for row in reader:
        when = parse_ltst(row.get("LTST", ""))
        if when is None:
            continue
        if still_only and (row.get("ROVER_STILL") or "").strip() != "1":
            continue
        key = f"{when[0]}:{when[1]}"
        for column, name in wanted:
            value = number(row.get(column))
            if value is None:
                continue
            cell = sums[name].setdefault(key, [0.0, 0])
            cell[0] += value
            cell[1] += 1
    return sums


def merge(into: dict, more: dict) -> None:
    """Add one file's sums into the running total (an hour can be split between two files)."""
    for name, cells in more.items():
        target = into.setdefault(name, {})
        for key, (total, count) in cells.items():
            cell = target.setdefault(key, [0.0, 0])
            cell[0] += total
            cell[1] += count


def typical_by_hour(sums: dict, name: str, convert=lambda v: v, digits: int = 1) -> list[dict]:
    """For each local hour 0 to 23: the number of sols with enough readings, and the 10th, 50th and 90th percentiles of
    the sols' hourly means (absent under MIN_SOLS)."""
    by_hour: list[list[float]] = [[] for _ in range(24)]
    for key, (total, count) in sums.get(name, {}).items():
        if count >= MIN_SAMPLES[name]:
            by_hour[int(key.split(":")[1])].append(convert(total / count))
    out = []
    for values in by_hour:
        array = np.array(values)
        entry = {"sols": int(array.size)}
        if array.size >= MIN_SOLS:
            entry.update({k: round(float(np.percentile(array, q)), digits) for k, q in (("p10", 10), ("p50", 50), ("p90", 90))})
        out.append(entry)
    return out


def _get(url: str, byte_range: str | None = None) -> bytes:
    request = urllib.request.Request(url, headers={"User-Agent": "tether-pipeline"})
    if byte_range:
        request.add_header("Range", f"bytes={byte_range}")
    with urllib.request.urlopen(request, timeout=120) as response:
        return response.read()


def _base() -> tuple[str, str]:
    server = sources.data_server_url()
    return (f"{server}/{SERVER_PATH}", "team data server") if server else (ORIGINAL_URL, "original address (PDS Atmospheres Node)")


def read_sol(base: str, sol: int) -> dict | None:
    """Fetch one sol's products and reduce them to sums by hour, with the sol's solar longitude and start time.
    Cached in data/work/meda; None when the sol has no folder."""
    cached = CACHE / f"sol_{sol:04d}.json"
    if cached.exists():
        return json.loads(cached.read_text(encoding="utf-8"))
    folder = f"{base}/sol_{sol:04d}/"
    try:
        listing = _get(folder).decode("utf-8", "replace")
    except Exception:
        return None
    names = sorted(set(re.findall(r'href="(WE__\d{4}_+DER_([A-Z]+)_+P\d+\.CSV)"', listing)))
    result: dict = {"sol": sol, "products": [], "sums": {}, "lsDeg": None, "startUtc": None}
    for file_name, product in names:
        # The ancillary file's SOLAR_LONGITUDE_ANGLE is not the season: it changes through the day and falls from sol
        # to sol. The season is worked out from the label's start time instead (season_of).
        if product not in PRODUCTS:
            continue
        text = _get(folder + file_name).decode("utf-8", "replace")
        merge(result["sums"], accumulate(text, PRODUCTS[product], sol, still_only=product == "WS"))
        result["products"].append(file_name)
        if product == "PS" and result["startUtc"] is None:
            label = _get(folder + file_name[:-4] + ".xml").decode("utf-8", "replace")
            found = re.search(r"<start_date_time>([^<]+)</start_date_time>", label)
            result["startUtc"] = found.group(1).strip() if found else None
    CACHE.mkdir(parents=True, exist_ok=True)
    cached.write_text(json.dumps(result), encoding="utf-8")
    return result


def season_of(start_utc: str | None) -> float | None:
    """The season (solar longitude, degrees) at a label's start time, by Mars24; None without a time."""
    if not start_utc:
        return None
    moment = datetime.datetime.fromisoformat(start_utc.replace("Z", "+00:00"))
    return round(mars.solar_longitude_deg(moment), 2)


def rover_positions(sols: list[int]) -> dict[int, tuple[float, float, float]]:
    """Where the rover was on each sol, from the waypoint file: (east longitude, latitude, height relative to the areoid).
    The last waypoint on or before the sol; before the first waypoint, the first (the rover had not driven yet)."""
    if not WAYPOINTS.exists():
        return {}
    points = sorted(
        ((f["properties"]["sol"], f["properties"]["lon"], f["properties"]["lat"], f["properties"].get("elev_geoid"))
         for f in json.loads(WAYPOINTS.read_text(encoding="utf-8"))["features"]),
        key=lambda p: p[0])
    out = {}
    for sol in sols:
        before = [p for p in points if p[0] <= sol] or points[:1]
        out[sol] = before[-1][1:]
    return out


def build(site_id: str, site_lon: float, site_lat: float) -> None:
    station = STATIONS[site_id]
    base, origin = _base()
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        sols = [s for s in pool.map(lambda n: read_sol(base, n), station["sols"]) if s]
    if not sols:
        raise SystemExit(f"No MEDA sols could be read from the {origin}.")
    sums: dict = {}
    for s in sols:
        merge(sums, s["sums"])
    used = [s["sol"] for s in sols]
    for s in sols:
        s["lsDeg"] = season_of(s["startUtc"])
    ls = [s["lsDeg"] for s in sols if s["lsDeg"] is not None]
    starts = sorted(s["startUtc"] for s in sols if s["startUtc"])
    hours = []
    pressure = typical_by_hour(sums, "pressurePa", digits=0)
    temperature = typical_by_hour(sums, "sensorTempK", convert=lambda k: k - 273.15)
    wind = typical_by_hour(sums, "windMps")
    for hour in range(24):
        hours.append({"hour": hour, "pressurePa": pressure[hour], "sensorTempC": temperature[hour], "windMps": wind[hour]})

    # Where the readings were taken, against the site.
    positions = rover_positions(used)
    measured_at = None
    if positions:
        distances = [mars.distance_m(lon, lat, site_lon, site_lat) / 1000 for lon, lat, _ in positions.values()]
        heights = [h for _, _, h in positions.values() if h is not None]
        measured_at = {
            "distanceKmMin": round(min(distances), 1), "distanceKmMax": round(max(distances), 1),
            "heightMMin": round(min(heights)) if heights else None, "heightMMax": round(max(heights)) if heights else None,
            "from": "Perseverance waypoints (m20_perseverance_waypoints.json), the last one on or before each sol",
        }
    windows = []
    for low, high in ((0, 400), (400, 1000), (1000, 2000)):
        group = [s for s in sols if low <= s["sol"] < high]
        if group:
            group_ls = [s["lsDeg"] for s in group if s["lsDeg"] is not None]
            group_starts = sorted(s["startUtc"] for s in group if s["startUtc"])
            windows.append({
                "solFrom": min(s["sol"] for s in group), "solTo": max(s["sol"] for s in group), "sols": len(group),
                "lsFromDeg": round(min(group_ls), 1) if group_ls else None, "lsToDeg": round(max(group_ls), 1) if group_ls else None,
                "utcFrom": group_starts[0] if group_starts else None, "utcTo": group_starts[-1] if group_starts else None,
            })
    caveats = [
        "Typical values: the spread of the same season in three Mars years, not a forecast and not today's weather.",
        "Temperature is the temperature inside MEDA's humidity sensor on the rover's mast. It follows the air temperature "
        "but is not an air temperature reading; MEDA's air temperature product is not in our files. Humidity sensor data "
        "before sol 63 is not used, as the MEDA readme advises.",
        "Wind only from sols when the rover stood still, from sol 36 on; MEDA's wind sensors were damaged by wind-blown "
        "grains in 2022 and early 2023, and few sols in these windows have wind data.",
    ]
    if measured_at:
        caveats.append(
            f"Measured where the rover was on those sols, {measured_at['distanceKmMin']} to {measured_at['distanceKmMax']} km "
            f"from this site, at heights of {measured_at['heightMMin']} to {measured_at['heightMMax']} m relative to the "
            "areoid. Pressure is lower higher up.")
    record = dict(station["record"])
    record.update({
        "caveats": caveats,
        "productId": "MEDA data_derived_env: pressure (DER_PS), humidity sensor (DER_RHS), wind (DER_WS), ancillary (DER_ANCILLARY)",
        "acquiredFrom": f"{starts[0][:10] if starts else 'date not found'} (sol {min(used)})",
        "acquiredTo": f"{starts[-1][:10] if starts else 'date not found'} (sol {max(used)})",
        "readFrom": origin,
        "how": "Each reading put in its hour of local true solar time; the mean of each hour of each sol with enough readings "
               "(10 minutes for pressure, 5 for the others); then, for each hour, the 10th, 50th and 90th percentiles of those "
               f"means across sols (none under {MIN_SOLS} sols). Empty values and 999999999 are left out.",
    })
    OUT.mkdir(parents=True, exist_ok=True)
    size = records.write_json(OUT / f"{site_id}.json", {
        "contractVersion": records.CONTRACT_VERSION, "builtUtc": records.utc_now_iso(), "siteId": site_id,
        "word": "typical", "kind": "hourly", "source": record,
        "season": {"lsFromDeg": round(min(ls), 1) if ls else None, "lsToDeg": round(max(ls), 1) if ls else None, "windows": windows},
        "measuredAt": measured_at, "hours": hours,
    })
    print(f"MEDA weather for {site_id}: {len(sols)} sols ({', '.join(f'{w['solFrom']}-{w['solTo']}' for w in windows)}), "
          f"Ls {min(ls):.1f} to {max(ls):.1f}, {size} bytes, from the {origin}")
    for h in hours[::3]:
        print(f"  {h['hour']:02d}h: pressure {h['pressurePa']}, sensor {h['sensorTempC']}, wind {h['windMps']}")
