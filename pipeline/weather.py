# WHAT:    Stage 7: typical weather by Mars month (30 degrees of solar longitude) at a site with a weather station, from
#          the station's daily record (F11). Built for Curiosity's REMS daily feed at Gale crater.
# IN:      msl_curiosity_rems_weather.json (team data server raw/feeds, or NASA's feed address).
# OUT:     ../app/public/data/weather/<site id>.json: for each Mars month, the number of sols and the 10th, 50th and 90th
#          percentiles of the daily low and high air temperature, ground temperature and pressure, and how often each
#          ultraviolet level and sky state was reported; with a full source record.
# USED BY: People and AI sessions from the command line: python weather.py gale-crater
# RULES:   Same season only. Never another site's weather: the file is written for the site the station stands at.
#          Values are "typical", with the number of sols behind each. Missing values ("--") are left out, not filled.
# TRAPS:   PITFALLS 3, 9.
# OWNER:   Role A.

import argparse
import json
import pathlib
import sys

import numpy as np

import records

REPO = pathlib.Path(__file__).resolve().parent.parent
OUT = REPO / "app" / "public" / "data" / "weather"

# The one station we have, and the site it stands at. Another site gets no weather from it.
STATIONS = {
    "gale-crater": {
        "file": "msl_curiosity_rems_weather.json",
        "serverPath": "raw/feeds",
        "originalUrl": "https://mars.nasa.gov/rss/api/?feed=weather&category=msl&feedtype=json",
        "record": {
            "mission": "Mars Science Laboratory (Curiosity)",
            "instrument": "Rover Environmental Monitoring Station (REMS)",
            "agency": "NASA; REMS was provided by Spain's Centro de Astrobiología (CSIC-INTA)",
            "sourceUrl": "https://mars.nasa.gov/msl/weather/",
            "credit": "NASA/JPL-Caltech/CAB (CSIC-INTA)",
            "caveats": [
                "Daily lows and highs as NASA's feed gives them, one value each per sol; not readings by the hour.",
                "Measured at the rover, which has driven up Mount Sharp since 2012, so later years are higher up.",
                "Typical values: the spread of past years in the same Mars month, not a forecast.",
            ],
        },
    },
}

NUMBERS = {
    "airLowC": "min_temp",
    "airHighC": "max_temp",
    "groundLowC": "min_gts_temp",
    "groundHighC": "max_gts_temp",
    "pressurePa": "pressure",
}


def number(value) -> float | None:
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def summarise(soles: list[dict]) -> list[dict]:
    months = []
    for month in range(12):
        low, high = month * 30, (month + 1) * 30
        rows = [s for s in soles if number(s.get("ls")) is not None and low <= number(s["ls"]) < high]
        entry = {"month": month + 1, "lsFromDeg": low, "lsToDeg": high, "sols": len(rows)}
        for name, field in NUMBERS.items():
            values = np.array([v for v in (number(r.get(field)) for r in rows) if v is not None])
            entry[name] = ({"sols": int(values.size), "p10": round(float(np.percentile(values, 10)), 1),
                            "p50": round(float(np.percentile(values, 50)), 1), "p90": round(float(np.percentile(values, 90)), 1)}
                           if values.size >= 5 else {"sols": int(values.size)})
        for name, field in (("ultraviolet", "local_uv_irradiance_index"), ("sky", "atmo_opacity")):
            counts: dict[str, int] = {}
            for r in rows:
                value = str(r.get(field) or "").strip()
                if value and value != "--":
                    counts[value] = counts.get(value, 0) + 1
            entry[name] = dict(sorted(counts.items(), key=lambda item: -item[1]))
        sunrise = sorted(r["sunrise"] for r in rows if str(r.get("sunrise", "")).count(":") == 1)
        sunset = sorted(r["sunset"] for r in rows if str(r.get("sunset", "")).count(":") == 1)
        entry["sunriseLocal"] = sunrise[len(sunrise) // 2] if sunrise else None
        entry["sunsetLocal"] = sunset[len(sunset) // 2] if sunset else None
        months.append(entry)
    return months


def build(site_id: str) -> None:
    station = STATIONS.get(site_id)
    if not station:
        sys.exit(f"No weather station stands at '{site_id}'. Weather is never borrowed from another site.")
    features, origin = None, None
    # The feed is JSON with a list called 'soles', not GeoJSON, so it is read directly.
    local = REPO / "data" / "raw" / "feeds" / station["file"]
    if local.exists():
        data, origin = json.loads(local.read_text(encoding="utf-8", errors="replace")), "local copy in data/raw"
    else:
        sys.exit(f"Fetch {station['file']} into data/raw/feeds/ first (team data server raw/feeds).")
    soles = data["soles"]
    sols = [int(s["sol"]) for s in soles if str(s.get("sol", "")).isdigit()]
    dates = sorted(s["terrestrial_date"] for s in soles if s.get("terrestrial_date"))
    months = summarise(soles)
    record = dict(station["record"])
    record.update({
        "productId": station["file"],
        "acquiredFrom": f"{dates[0]} (sol {min(sols)})",
        "acquiredTo": f"{dates[-1]} (sol {max(sols)})",
        "readFrom": origin,
        "how": "Sols grouped by Mars month (30 degrees of solar longitude each, as the feed's own 'Month 1' to 'Month 12'), "
               "then the 10th, 50th and 90th percentiles of each daily value. Values marked '--' in the feed are left out.",
    })
    OUT.mkdir(parents=True, exist_ok=True)
    size = records.write_json(OUT / f"{site_id}.json", {
        "contractVersion": records.CONTRACT_VERSION, "builtUtc": records.utc_now_iso(), "siteId": site_id,
        "word": "typical", "source": record, "months": months,
    })
    print(f"Weather for {site_id}: {len(soles)} sols from {dates[0]} to {dates[-1]}, {size} bytes, from the {origin}")
    for m in months:
        a = m["airHighC"]
        print(f"  month {m['month']:>2}: {m['sols']:>4} sols, high air p50 {a.get('p50')} C, pressure p50 {m['pressurePa'].get('p50')} Pa")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Typical weather by Mars month at a site with a weather station.")
    parser.add_argument("site", help="site id; only gale-crater has a station in our files")
    build(parser.parse_args().site)
