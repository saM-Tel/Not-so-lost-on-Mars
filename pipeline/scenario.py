# WHAT:    The hero scenario of a site (F7, F3): home for the tether and the science targets, each placed at a rover stop
#          looked up by its id in the rover's waypoints file, with the reason and its source.
# IN:      The site config's `scenario` section; the rover's stops as read by validate.read_rover_stops; the terrain grid.
# OUT:     The `home` and `targets` entries of site.json.
# USED BY: build_site.py.
# RULES:   No coordinate is typed into a config: a stop id that is not in the file, or a stop outside the box, stops the
#          build. Home is marked as an assumption when the config says so.
# TRAPS:   PITFALLS 2, 4.
# OWNER:   Role A, with role C choosing the targets.

import mars
import sources


class ScenarioError(ValueError):
    pass


def _place(entry: dict, stops_by_id: dict[str, dict], box: sources.Box, terrain: sources.Grid, kind: str) -> dict:
    stop_id = str(entry.get("stop", ""))
    stop = stops_by_id.get(stop_id)
    if stop is None:
        raise ScenarioError(f"scenario {kind} '{entry.get('name')}': stop '{stop_id}' is not in the rover's waypoints file")
    lon, lat = mars.lon_to_180(float(stop["lon"])), float(stop["lat"])
    if not (box.west_lon_deg <= lon <= box.east_lon_deg and box.south_lat_deg <= lat <= box.north_lat_deg):
        raise ScenarioError(f"scenario {kind} '{entry.get('name')}': stop {stop_id} is outside the site's box")
    for field in ("name", "why", "whySourceUrl"):
        if not entry.get(field):
            raise ScenarioError(f"scenario {kind} at stop {stop_id}: '{field}' is missing")
    height = float(terrain.sample(lon, lat))
    return {
        **({"id": entry["id"]} if entry.get("id") else {}),
        "name": entry["name"],
        "stop": stop_id,
        "firstSol": int(stop["sol"]),
        "lonEastDeg": round(lon, 7),
        "latDeg": round(lat, 7),
        "heightM": round(height, 2),
        "why": " ".join(str(entry["why"]).split()),
        "whySourceUrl": entry["whySourceUrl"],
        "positionSource": f"Perseverance waypoints file, stop {stop_id}, first logged on sol {int(stop['sol'])}",
        "assumed": bool(entry.get("assumed", False)),
    }


def resolve(scenario: dict | None, stops: list[dict], box: sources.Box, terrain: sources.Grid) -> dict:
    """Home and targets for site.json, or an empty dict when the config has no scenario."""
    if not scenario:
        return {}
    # The waypoints file can log one stop id more than once; the first time it was logged is kept.
    stops_by_id: dict[str, dict] = {}
    for stop in sorted(stops, key=lambda s: int(s["sol"])):
        stops_by_id.setdefault(str(stop.get("RMC")), stop)
    out = {}
    if scenario.get("home"):
        out["home"] = _place(scenario["home"], stops_by_id, box, terrain, "home")
    targets = [_place(entry, stops_by_id, box, terrain, "target") for entry in scenario.get("targets", [])]
    ids = [target.get("id") for target in targets]
    if any(not i for i in ids) or len(set(ids)) != len(ids):
        raise ScenarioError("every scenario target needs its own id")
    out["targets"] = targets
    return out
