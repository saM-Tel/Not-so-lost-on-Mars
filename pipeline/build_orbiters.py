# WHAT:    Saves JPL Horizons predictions of the Mars orbiters (F18): the point on Mars below each one every 2 minutes, for
#          the globe, and minute by minute when each is above the horizon at every built site, for the walk's timeline of
#          link and imaging gaps.
# IN:      The JPL Horizons API (https://ssd.jpl.nasa.gov/api/horizons.api); site positions from ../app/public/data/sites.json.
# OUT:     ../app/public/data/orbiters/globe.json and ../app/public/data/orbiters/<site id>.json (docs/DATA_CONTRACT.md).
# USED BY: People and AI sessions from the command line: python build_orbiters.py [--days 16]. Run it again before the
#          submission so the predictions start near the judging dates.
# RULES:   Predictions, labelled as such, with the fetch time and where each prediction ends. An orbiter's role (relay,
#          camera) is set only from a source read on 14 Nov; otherwise it is marked not confirmed. Horizons gives Mars
#          longitude west-positive and latitude planetodetic: both are converted here, at the boundary. A browser cannot
#          call Horizons (no cross-origin header), which is why this is a pipeline step.
# TRAPS:   PITFALLS 4 (Horizons longitude and latitude), 8.
# OWNER:   Role A.

import argparse
import datetime as dt
import json
import math
import pathlib
import re
import sys
import time
import urllib.parse
import urllib.request

import records

REPO = pathlib.Path(__file__).resolve().parent.parent
DATA = REPO / "app" / "public" / "data"
OUT = DATA / "orbiters"
API = "https://ssd.jpl.nasa.gov/api/horizons.api"

# Mars reference ellipsoid as Horizons states it in its output header ("Target radii: 3396.19, 3396.19, 3376.2 km").
EQUATOR_KM = 3396.19
POLE_KM = 3376.2

# Roles from pages read on 14 Nov 2026. MRO's page names HiRISE and its relay work; Odyssey's page names THEMIS and relay
# work; ESA's Mars Express page names its stereo camera. Not confirmed from a page we could read: TGO's camera and
# relay role, Mars Express's relay role (ESA's pages build that text with scripts).
ORBITERS = [
    {"id": "mro", "name": "Mars Reconnaissance Orbiter", "short": "MRO", "horizonsId": "-74", "agency": "NASA",
     "relay": True, "camera": "HiRISE", "roleSourceUrl": "https://science.nasa.gov/mission/mars-reconnaissance-orbiter/"},
    {"id": "odyssey", "name": "2001 Mars Odyssey", "short": "Odyssey", "horizonsId": "-53", "agency": "NASA",
     "relay": True, "camera": "THEMIS", "roleSourceUrl": "https://science.nasa.gov/mission/odyssey/"},
    {"id": "mars-express", "name": "Mars Express", "short": "Mars Express", "horizonsId": "-41", "agency": "ESA",
     "relay": None, "camera": "High Resolution Stereo Camera", "roleSourceUrl": "https://www.esa.int/Science_Exploration/Space_Science/Mars_Express"},
    {"id": "tgo", "name": "ExoMars Trace Gas Orbiter", "short": "TGO", "horizonsId": "-143", "agency": "ESA",
     "relay": None, "camera": None, "roleSourceUrl": "https://www.esa.int/Science_Exploration/Human_and_Robotic_Exploration/Exploration/ExoMars"},
]
LEFT_OUT = [{"name": "MAVEN", "why": "Horizons notes no contact with the spacecraft since 6 December 2025 (read 14 Nov 2026)."}]

GLOBE_STEP_MIN = 2
SITE_STEP_MIN = 1


def horizons(params: dict) -> str:
    """One Horizons request, as text. Retries twice on a network error."""
    query = urllib.parse.urlencode({"format": "text", **{k: f"'{v}'" for k, v in params.items()}})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(f"{API}?{query}", timeout=120) as response:
                return response.read().decode("utf-8", errors="replace")
        except OSError as error:
            if attempt == 2:
                raise
            print(f"  note: Horizons did not answer ({error}); trying again")
            time.sleep(5)
    raise AssertionError("unreachable")


def rows(text: str) -> list[list[str]]:
    """The CSV rows between $$SOE and $$EOE."""
    if "$$SOE" not in text:
        return []
    body = text.split("$$SOE", 1)[1].split("$$EOE", 1)[0]
    return [[cell.strip() for cell in line.split(",")] for line in body.strip().splitlines() if line.strip()]


def coverage_end(text: str) -> dt.datetime | None:
    """When Horizons says it has no ephemeris after a date, that date (TDB, treated as UTC to the minute), else None."""
    # "for target" when the orbiter is the target; "for center" when it is the observer (the ground track).
    found = re.search(r"No ephemeris for (?:target|center).*?after A\.D\. (\d{4}-[A-Z]{3}-\d{2} \d{2}:\d{2})", text, re.S)
    if not found:
        return None
    return dt.datetime.strptime(found.group(1).title(), "%Y-%b-%d %H:%M").replace(tzinfo=dt.timezone.utc)


def trajectory_note(text: str) -> list[str]:
    """Header lines that say how far the trajectory is fitted to tracking and where prediction begins, word for word."""
    keep = []
    for line in text.split("$$SOE", 1)[0].splitlines():
        # Not the old notes about comet Siding Spring (2014), which also mention predictions and reconstruction.
        if (re.search(r"predict|fit to data|data-fit|no contact|reconstruct", line, re.I) and "EOP" not in line
                and not re.search(r"comet|siding spring|minimum risk|^\s*time-span", line, re.I)):
            keep.append(" ".join(line.split()))
    return keep[:4]


def stamp(moment: dt.datetime) -> str:
    return moment.strftime("%Y-%m-%d %H:%M")


def iso(moment: dt.datetime) -> str:
    return moment.strftime("%Y-%m-%dT%H:%M:00Z")


def parse_time(cell: str) -> dt.datetime:
    return dt.datetime.strptime(cell, "%Y-%b-%d %H:%M").replace(tzinfo=dt.timezone.utc)


def planetocentric_from_planetodetic(lat_deg: float) -> float:
    return math.degrees(math.atan((POLE_KM / EQUATOR_KM) ** 2 * math.tan(math.radians(lat_deg))))


def planetodetic_from_planetocentric(lat_deg: float) -> float:
    return math.degrees(math.atan((EQUATOR_KM / POLE_KM) ** 2 * math.tan(math.radians(lat_deg))))


def east_from_west(lon_west_deg: float) -> float:
    """Horizons' west-positive Mars longitude to our east-positive -180 to 180."""
    east = -lon_west_deg
    return (east + 180.0) % 360.0 - 180.0


def fetch(params: dict, start: dt.datetime, stop: dt.datetime, step_min: int) -> tuple[str, dt.datetime]:
    """Fetch a table, shortening the window once if the prediction ends before `stop`. Returns (text, real stop)."""
    text = horizons({**params, "START_TIME": stamp(start), "STOP_TIME": stamp(stop), "STEP_SIZE": f"{step_min} m", "CSV_FORMAT": "YES"})
    end = coverage_end(text)
    if end is not None and end < stop:
        stop = end - dt.timedelta(minutes=2)
        text = horizons({**params, "START_TIME": stamp(start), "STOP_TIME": stamp(stop), "STEP_SIZE": f"{step_min} m", "CSV_FORMAT": "YES"})
    return text, stop


def ground_track(orbiter: dict, start: dt.datetime, stop: dt.datetime) -> dict:
    """The point on Mars below the orbiter every GLOBE_STEP_MIN minutes: Mars seen from the orbiter, sub-observer point."""
    text, stop = fetch({"COMMAND": "499", "EPHEM_TYPE": "OBSERVER", "CENTER": f"500@{orbiter['horizonsId']}",
                        "QUANTITIES": "14", "OBJ_DATA": "NO"}, start, stop, GLOBE_STEP_MIN)
    table = rows(text)
    if not table:
        raise ValueError(f"Horizons gave no ground track for {orbiter['name']}: {text[-400:]}")
    lon = [round(east_from_west(float(r[3])), 2) for r in table]
    lat = [round(planetocentric_from_planetodetic(float(r[4])), 2) for r in table]
    return {"startUtc": iso(parse_time(table[0][0])), "endUtc": iso(parse_time(table[-1][0])), "stepMin": GLOBE_STEP_MIN,
            "lonEastDeg": lon, "latDeg": lat, "trajectoryNote": trajectory_note(horizons_header_for(orbiter))}


_headers: dict[str, str] = {}


def horizons_header_for(orbiter: dict) -> str:
    """The orbiter's own object page from Horizons (its trajectory notes), fetched once."""
    if orbiter["id"] not in _headers:
        _headers[orbiter["id"]] = horizons({"COMMAND": orbiter["horizonsId"], "MAKE_EPHEM": "NO", "OBJ_DATA": "YES"})
    return _headers[orbiter["id"]]


def passes(orbiter: dict, site: dict, start: dt.datetime, stop: dt.datetime) -> dict:
    """When the orbiter is above the site's horizon, minute by minute, with its elevation in whole degrees."""
    lat_d = planetodetic_from_planetocentric(site["latDeg"])
    lon_w = (-site["lonEastDeg"]) % 360.0
    # Horizons refuses a positive longitude for Mars ("Input east-longitude as negative for IAU west-positive body
    # #499"): the east longitude goes in as a negative number, and Horizons echoes it back as west longitude.
    lon_input = -(site["lonEastDeg"] % 360.0)
    text, stop = fetch({"COMMAND": orbiter["horizonsId"], "EPHEM_TYPE": "OBSERVER", "CENTER": "coord@499",
                        "COORD_TYPE": "GEODETIC", "SITE_COORD": f"{lon_input:.5f},{lat_d:.5f},0", "QUANTITIES": "4",
                        "OBJ_DATA": "NO"}, start, stop, SITE_STEP_MIN)
    table = rows(text)
    if not table:
        raise ValueError(f"Horizons gave no sky positions for {orbiter['name']} at {site['id']}: {text[-400:]}")
    # Check the site Horizons used: its echoed longitude must be ours, west-positive. If Horizons stops echoing it
    # (its wording changed), the build stops: a silent skip could save passes for the wrong place (review item S23).
    echoed = re.search(r"Center geodetic\s*:\s*([-\d.]+),", text)
    if not echoed:
        raise ValueError(f"Horizons did not echo the site position for {site['id']}, so its longitude cannot be checked")
    if abs(((float(echoed.group(1)) - lon_w) + 180) % 360 - 180) > 1e-3:
        raise ValueError(f"Horizons used a different site longitude for {site['id']}: {echoed.group(1)} W, wanted {lon_w:.5f} W")
    found, current = [], None
    for r in table:
        elevation = float(r[4])
        moment = parse_time(r[0])
        if elevation > 0:
            if current is None:
                current = {"startUtc": iso(moment), "elevationDeg": []}
            current["elevationDeg"].append(round(elevation))
        elif current is not None:
            found.append(current)
            current = None
    if current is not None:
        found.append(current)
    return {"id": orbiter["id"], "startUtc": iso(parse_time(table[0][0])), "endUtc": iso(parse_time(table[-1][0])),
            "stepMin": SITE_STEP_MIN, "passes": found}


def source_record(fetched: dt.datetime, start: dt.datetime, stop: dt.datetime) -> dict:
    """The full record of CONFIDENCE.md section 1 for these predictions."""
    return {
        "id": "orbiters-horizons", "title": "Orbiters overhead", "dataType": "ephemeris",
        "mission": "Mars Reconnaissance Orbiter, 2001 Mars Odyssey, Mars Express, ExoMars Trace Gas Orbiter",
        "instrument": "Trajectory predictions from each mission's navigation team, served by JPL Horizons",
        "agency": "NASA JPL (Horizons); ESA for Mars Express and TGO trajectories",
        "productId": "JPL Horizons observer tables: sub-observer point (quantity 14) and azimuth and elevation (quantity 4)",
        "sourceUrl": "https://ssd.jpl.nasa.gov/horizons/", "doi": "not applicable",
        "acquiredFrom": iso(start), "acquiredTo": iso(stop), "published": f"Fetched {iso(fetched)}",
        "gridSpacing": f"One point every {GLOBE_STEP_MIN} minutes on the globe; every {SITE_STEP_MIN} minute at a site",
        "realDetail": "Whole degrees of elevation; ground points to 0.01 degree",
        "positionAccuracy": "not found: Horizons does not state the error of a prediction, which grows along the orbit with time",
        "heightAccuracy": "not applicable",
        "processing": ("Horizons gives Mars longitude west-positive and latitude on its reference ellipsoid; converted to east "
                       "longitude and planetocentric latitude. Each site's position is sent to Horizons as planetodetic "
                       "latitude and west longitude, and the longitude Horizons echoes is checked."),
        "grade": "C",
        "caveats": [
            "Predicted positions, not tracked ones. Each orbiter's notes say how far its trajectory is fitted to tracking.",
            "TGO's trajectory is fitted to tracking only up to June 2025, so its times are the least certain.",
            "Above the horizon does not mean a link is scheduled, or that a camera is pointed at you.",
            "MAVEN is left out: Horizons notes no contact since 6 December 2025.",
        ],
        "credit": "NASA JPL Horizons, with trajectories from NASA and ESA mission navigation teams",
    }


def main(days: float) -> None:
    sites = json.loads((DATA / "sites.json").read_text(encoding="utf-8"))["sites"]
    built = [s for s in sites if s.get("built")]
    fetched = dt.datetime.now(dt.timezone.utc).replace(second=0, microsecond=0)
    start = fetched
    stop = start + dt.timedelta(days=days)
    print(f"Orbiters from {stamp(start)} to {stamp(stop)} UTC, {len(ORBITERS)} orbiters, {len(built)} built sites")
    OUT.mkdir(parents=True, exist_ok=True)

    globe_orbiters = []
    for orbiter in ORBITERS:
        track = ground_track(orbiter, start, stop)
        globe_orbiters.append({k: orbiter[k] for k in ("id", "name", "short", "agency", "relay", "camera", "roleSourceUrl")} | track)
        print(f"  {orbiter['short']}: {len(track['lonEastDeg'])} ground points to {track['endUtc']}; "
              f"{'; '.join(track['trajectoryNote']) or 'no trajectory note'}")
    record = source_record(fetched, start, stop)
    size = records.write_json(OUT / "globe.json", {
        "contractVersion": 1, "builtUtc": iso(fetched), "word": "predicted", "source": record,
        "orbiters": globe_orbiters, "leftOut": LEFT_OUT,
    }, compact=True)
    print(f"Wrote orbiters/globe.json: {size / 1e3:.0f} kB")

    for site in built:
        site_orbiters = [passes(orbiter, site, start, stop) for orbiter in ORBITERS]
        size = records.write_json(OUT / f"{site['id']}.json", {
            "contractVersion": 1, "builtUtc": iso(fetched), "word": "predicted", "siteId": site["id"],
            "position": {"lonEastDeg": site["lonEastDeg"], "latDeg": site["latDeg"]}, "orbiters": site_orbiters,
        }, compact=True)
        counts = ", ".join(f"{o['id']} {len(o['passes'])}" for o in site_orbiters)
        print(f"Wrote orbiters/{site['id']}.json: {size / 1e3:.0f} kB; passes above the horizon: {counts}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--days", type=float, default=16.0, help="how many days ahead to save (default 16)")
    arguments = parser.parse_args()
    if arguments.days <= 0 or arguments.days > 60:
        sys.exit("--days must be between 0 and 60")
    main(arguments.days)
