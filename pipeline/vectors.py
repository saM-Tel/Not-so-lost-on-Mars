# WHAT:    Stage 6: converts the rover's stops and path to GeoJSON, with a layer record for each.
#          Still to add: geology and science targets.
# IN:      The rover's waypoint and traverse feeds as GeoJSON features; the site's box; the rover part of the site config.
# OUT:     vectors/rover-stops.geojson and vectors/rover-path.geojson under the site folder, and their layer records.
# USED BY: build_site.py.
# RULES:   Every source's longitude convention is converted at the boundary. Nothing is moved or smoothed: positions are
#          the rover team's own, rounded to 7 decimal places of a degree (about 6 mm).
# TRAPS:   PITFALLS 4.
# OWNER:   Role A.

import datetime
import pathlib

import mars
import records
import sources


def sol_to_earth_date(sol: int, landing_date: str) -> str:
    """The Earth date a sol falls on, counted from the landing date as sol 0. Good to about a day."""
    landed = datetime.date.fromisoformat(landing_date)
    return (landed + datetime.timedelta(seconds=sol * mars.SOL_S)).isoformat()


def _inside(box: sources.Box, lon: float, lat: float) -> bool:
    return box.west_lon_deg <= lon <= box.east_lon_deg and box.south_lat_deg <= lat <= box.north_lat_deg


def rover_stops(features: list[dict], box: sources.Box, height_field: str) -> dict:
    """The rover's stops inside the box, as GeoJSON points. A value the file marks as missing (-9999) is left out."""
    def known(value):
        return value if isinstance(value, (int, float)) and value > -9000 else None

    out = []
    for feature in features:
        p = feature["properties"]
        lon = mars.lon_to_180(float(p["lon"]))
        lat = float(p["lat"])
        if not _inside(box, lon, lat):
            continue
        properties = {"stop": p.get("RMC"), "sol": p.get("sol")}
        for name, field, digits in (("heightM", height_field, 2), ("tiltDeg", "tilt", 1), ("drivenTotalM", "dist_total_m", 0)):
            value = known(p.get(field))
            if value is not None:
                properties[name] = round(float(value), digits)
        out.append({"type": "Feature", "properties": properties,
                    "geometry": {"type": "Point", "coordinates": [round(lon, 7), round(lat, 7)]}})
    return {"type": "FeatureCollection", "features": out}


def rover_path(features: list[dict], box: sources.Box) -> dict:
    """The parts of the rover's drives that lie inside the box, as GeoJSON lines, one or more for each drive."""
    out = []
    for feature in features:
        geometry = feature["geometry"]
        lines = geometry["coordinates"] if geometry["type"] == "MultiLineString" else [geometry["coordinates"]]
        for line in lines:
            run = []
            for point in [*line, None]:
                inside = point is not None and _inside(box, mars.lon_to_180(float(point[0])), float(point[1]))
                if inside:
                    run.append([round(mars.lon_to_180(float(point[0])), 7), round(float(point[1]), 7)])
                    continue
                if len(run) > 1:
                    out.append({"type": "Feature", "properties": {"sol": feature["properties"].get("sol")},
                                "geometry": {"type": "LineString", "coordinates": run}})
                run = []
    return {"type": "FeatureCollection", "features": out}


def write_rover_layers(folder: pathlib.Path, stop_features: list[dict], path_features: list[dict],
                       box: sources.Box, rover: dict) -> list[dict]:
    """Write the two files and return their layer records. A layer with nothing in the box is not written."""
    folder.mkdir(parents=True, exist_ok=True)
    base = rover["record"]
    last_sol = max(int(f["properties"]["sol"]) for f in stop_features)
    layers = []
    for layer_id, title, file_name, product, collection, geometry, spacing, detail in (
        ("rover-stops-m20", "Rover stops", "rover-stops.geojson", rover["file"],
         rover_stops(stop_features, box, rover["heightField"]), "point",
         "One point where each drive ended", "A single position for each stop"),
        ("rover-path-m20", "Rover path", "rover-path.geojson", rover["pathFile"],
         rover_path(path_features, box), "line",
         "A line along each drive, with a point every few metres", "The line the rover logged as it drove"),
    ):
        sols = [int(f["properties"]["sol"]) for f in collection["features"] if f["properties"].get("sol") is not None]
        if not sols:
            continue
        size = records.write_json(folder / file_name, collection)
        first, last = min(sols), max(sols)
        layers.append({
            "id": layer_id, "title": title, "dataType": "in-situ",
            "mission": base["mission"], "instrument": base["instrument"], "agency": base["agency"],
            "productId": product, "sourceUrl": base["sourceUrl"], "doi": records.NOT_FOUND,
            "acquiredFrom": f"{sol_to_earth_date(first, rover['landingDate'])} (sol {first})",
            "acquiredTo": f"{sol_to_earth_date(last, rover['landingDate'])} (sol {last})",
            "published": f"A live file that grows as the rover drives; our copy ends at sol {last_sol}",
            "gridSpacing": spacing, "realDetail": detail,
            "positionAccuracy": records.NOT_FOUND, "heightAccuracy": records.NOT_FOUND,
            "processing": "Cut to the site's box. Positions are as the rover team published them; nothing is moved or smoothed. "
                          "Earth dates are counted from the landing date and can be a day out.",
            "grade": "A",
            "caveats": [
                "The file does not say how accurate these positions are.",
                "Where a rover drove is not proof that a person on foot can walk there, and the reverse.",
                "Only the part inside this site's box is shown.",
            ],
            "credit": base["credit"],
            "vector": {"path": f"vectors/{file_name}", "geometry": geometry,
                       "count": len(collection["features"]), "bytes": size},
        })
    return layers
