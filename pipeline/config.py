# WHAT:    Reads and checks a site config. So far: identity, position and what data exists, which is what the globe needs (F14).
# IN:      A YAML file from ../sites/.
# OUT:     A checked config as a dictionary, with the site's position worked out in the app's convention; or an error listing every problem.
# USED BY: build_globe.py. build_site.py will use it too.
# RULES:   A position without a source is an error. Longitudes are converted to east-positive, -180 to 180.
# TRAPS:   PITFALLS 2, 4.
# OWNER:   Role A.

import math
import pathlib
import re

import yaml

import mars

# Readiness levels. The wording is that of docs/SITES.md, "Readiness levels"; keep the two in step.
LEVELS = {
    1: {"name": "Walk-ready", "offers": "Everything: walking routes, tether, storm mode, photos, validation."},
    2: {"name": "Scout-ready", "offers": "Walking routes and tether inside the terrain strip, marked 'not checked on the ground'."},
    3: {"name": "Survey", "offers": "Layers and vehicle-scale route sketches only. No walking plan."},
    4: {"name": "Overview", "offers": "Layered context map, radiation estimate by altitude, season and Sun. No routes."},
}

LONGITUDE_CONVENTIONS = {
    "east-positive, -180 to 180",
    "east-positive, 0 to 360",
    "west-positive, 0 to 360",
}


class ConfigError(ValueError):
    """A site config that cannot be used, with every problem found."""


def _position(config: dict, problems: list[str]) -> dict | None:
    """Work out the site's position in east-positive -180 to 180 longitude and planetocentric latitude."""
    position = config.get("position")
    if not isinstance(position, dict):
        problems.append("'position' is missing")
        return None
    for field in ("from", "source", "sourceUrl", "longitudeConvention", "latitudeType"):
        if not position.get(field):
            problems.append(f"position.{field} is missing: every position cites its source and convention")
    convention = position.get("longitudeConvention")
    if convention and convention not in LONGITUDE_CONVENTIONS:
        problems.append(f"position.longitudeConvention '{convention}' is not one of {sorted(LONGITUDE_CONVENTIONS)}")
    if position.get("latitudeType") and position["latitudeType"] != "planetocentric":
        problems.append("position.latitudeType must be planetocentric; convert the source value first and say how")

    to_east = mars.west_to_east if convention and convention.startswith("west-positive") else mars.lon_to_180
    kind = position.get("from")
    result: dict = {}
    if kind == "point":
        if not all(isinstance(position.get(k), (int, float)) for k in ("lonEastDeg", "latDeg")):
            problems.append("position needs lonEastDeg and latDeg as numbers")
            return None
        result = {"lonEastDeg": to_east(position["lonEastDeg"]), "latDeg": float(position["latDeg"]),
                  "what": "A single point taken from the source."}
    elif kind == "terrain-footprint":
        keys = ("westLonDeg", "eastLonDeg", "southLatDeg", "northLatDeg")
        if not all(isinstance(position.get(k), (int, float)) for k in keys):
            problems.append("position needs westLonDeg, eastLonDeg, southLatDeg and northLatDeg as numbers")
            return None
        west, east = to_east(position["westLonDeg"]), to_east(position["eastLonDeg"])
        south, north = float(position["southLatDeg"]), float(position["northLatDeg"])
        if not (west < east and south < north):
            problems.append("position footprint is not west < east and south < north after conversion")
            return None
        lat = (south + north) / 2
        result = {
            "lonEastDeg": (west + east) / 2,
            "latDeg": lat,
            "what": "The centre of the terrain model's footprint.",
            "footprint": {"westLonDeg": west, "eastLonDeg": east, "southLatDeg": south, "northLatDeg": north},
            # Size on the ground, from the Mars radius. East to west shrinks with the cosine of latitude.
            "footprintWidthKm": (east - west) * mars.METRES_PER_DEGREE * math.cos(math.radians(lat)) / 1000,
            "footprintHeightKm": (north - south) * mars.METRES_PER_DEGREE / 1000,
        }
    else:
        problems.append(f"position.from '{kind}' must be 'point' or 'terrain-footprint'")
        return None
    if not -90 <= result["latDeg"] <= 90:
        problems.append("position latitude is outside -90 to 90")
    result["source"] = position.get("source")
    result["sourceUrl"] = position.get("sourceUrl")
    if position.get("why"):
        result["why"] = " ".join(str(position["why"]).split())
        result["whySourceUrl"] = position.get("whySourceUrl")
    return result


def load_site_config(path: pathlib.Path) -> dict:
    """Read one site config and check it. Raises ConfigError naming every problem."""
    config = yaml.safe_load(path.read_text(encoding="utf-8"))
    problems: list[str] = []
    if not isinstance(config, dict):
        raise ConfigError(f"{path.name}: the file holds no settings")

    site_id = config.get("id")
    if not isinstance(site_id, str) or not re.fullmatch(r"[a-z0-9]+(-[a-z0-9]+)*", site_id):
        problems.append(f"id '{site_id}' must be kebab-case")
    elif site_id != path.stem:
        problems.append(f"id '{site_id}' must match the file name '{path.stem}'")
    for field in ("name", "place", "mission", "missionYears"):
        if not isinstance(config.get(field), str) or not config[field].strip():
            problems.append(f"'{field}' is missing")
    if config.get("level") not in LEVELS:
        problems.append(f"level '{config.get('level')}' must be 1, 2, 3 or 4")
    if not isinstance(config.get("reviewedByPerson"), bool):
        problems.append("'reviewedByPerson' must be true or false")
    for field in ("data", "problems"):
        value = config.get(field, [])
        if not isinstance(value, list) or not all(isinstance(item, str) for item in value):
            problems.append(f"'{field}' must be a list of sentences")

    landing = config.get("landing")
    if landing is not None:
        for field in ("asPublished", "source", "sourceUrl"):
            if not isinstance(landing, dict) or not landing.get(field):
                problems.append(f"landing.{field} is missing")

    position = _position(config, problems)
    if problems:
        raise ConfigError(f"{path.name}: " + "; ".join(problems))
    config["positionChecked"] = position
    return config


def load_all_site_configs(folder: pathlib.Path) -> list[dict]:
    """Every site config in the folder, checked, in file-name order."""
    return [load_site_config(path) for path in sorted(folder.glob("*.yaml"))]
