# WHAT:    Turns the USGS geologic map of Jezero crater and Nili Planum (SIM 3464) into GeoJSON in degrees for one site (F2).
# IN:      ../data/raw/geology/sim3464_database.zip (team data server raw/jezero/geology); a site config with `geology`.
# OUT:     ../data/work/<site id>/geology.geojson: map units touching a 12 km square round the site, each with its map
#          symbol (such as Njf), name and our colour. build_site.py copies it into the site and writes its record.
# USED BY: People and AI sessions from the command line: python build_geology.py ../sites/bright-angel.yaml
# RULES:   Needs the fiona package (fiona==1.10.1, in requirements.txt). Runs in its own process,
#          because fiona and rasterio each carry their own GDAL. Our colours, colour-blind safe, never red.
# TRAPS:   PITFALLS 4. The map is on Mars Transverse Mercator, central meridian 77.5 E; positions are 100 to 200 m off.
#          In SIM 3464 the unit polygons are the layer GeoUnits_v1, not the GeMS name MapUnitPolys. Its `unit` field
#          is a bare number; `symbol` is the label printed on the map. A few rows disagree (one misspelt name, one row
#          whose number belongs to another unit), so each symbol takes the name most of its polygons carry.
# OWNER:   Role A.

import json
import math
import pathlib
import sys
import zipfile

REPO = pathlib.Path(__file__).resolve().parent.parent
ZIP = REPO / "data" / "raw" / "geology" / "sim3464_database.zip"
UNZIPPED = REPO / "data" / "raw" / "geology" / "unzipped"
MARS_RADIUS_M = 3_396_190.0
TARGET_CRS = f"+proj=longlat +R={MARS_RADIUS_M} +no_defs"
SQUARE_KM = 12.0
# Okabe and Ito colours without the vermillion, plus greys: colour-blind safe and never red.
# Indigo from Paul Tol's muted scheme makes ten, the number of units round Bright Angel.
PALETTE = ["#0072b2", "#56b4e9", "#009e73", "#f0e442", "#cc79a7", "#e69f00", "#999999", "#d0d0d0", "#000000", "#332288"]


# Positions are kept to 5 decimal places of a degree, about 0.6 m on Mars: far finer than the map's 100 to 200 m offset.
DECIMALS = 5


def clip_ring(ring, west: float, east: float, south: float, north: float) -> list[list[float]]:
    """One ring cut to a longitude and latitude box (Sutherland and Hodgman, one box edge at a time).
    Returns a closed ring rounded to DECIMALS, or [] when less than a triangle is left."""
    points = [(float(x), float(y)) for x, y, *_ in ring]
    if len(points) > 1 and points[0] == points[-1]:
        points.pop()
    edges = (
        (lambda p: p[0] >= west, lambda a, b: (west, a[1] + (b[1] - a[1]) * (west - a[0]) / (b[0] - a[0]))),
        (lambda p: p[0] <= east, lambda a, b: (east, a[1] + (b[1] - a[1]) * (east - a[0]) / (b[0] - a[0]))),
        (lambda p: p[1] >= south, lambda a, b: (a[0] + (b[0] - a[0]) * (south - a[1]) / (b[1] - a[1]), south)),
        (lambda p: p[1] <= north, lambda a, b: (a[0] + (b[0] - a[0]) * (north - a[1]) / (b[1] - a[1]), north)),
    )
    for inside, cross in edges:
        kept = []
        for i, current in enumerate(points):
            previous = points[i - 1]
            if inside(current):
                if not inside(previous):
                    kept.append(cross(previous, current))
                kept.append(current)
            elif inside(previous):
                kept.append(cross(previous, current))
        points = kept
        if not points:
            return []
    rounded: list[list[float]] = []
    for x, y in points:
        point = [round(x, DECIMALS), round(y, DECIMALS)]
        if not rounded or point != rounded[-1]:
            rounded.append(point)
    if len(rounded) > 1 and rounded[0] == rounded[-1]:
        rounded.pop()
    return rounded + [rounded[0]] if len(rounded) >= 3 else []


def clip_polygon(polygon, west: float, east: float, south: float, north: float) -> list:
    """A polygon (outer ring, then holes) cut to the box; [] when its outer ring falls outside."""
    outer = clip_ring(polygon[0], west, east, south, north)
    if not outer:
        return []
    holes = [h for h in (clip_ring(ring, west, east, south, north) for ring in polygon[1:]) if h]
    return [outer, *holes]


def main(config_path: pathlib.Path) -> None:
    try:
        import fiona
        from fiona.transform import transform_geom
    except ImportError:
        sys.exit("build_geology.py needs fiona: .venv\\Scripts\\python -m pip install fiona==1.10.1 (docs/REVIEW_QUEUE.md item 7)")
    import yaml
    config = yaml.safe_load(config_path.read_text(encoding="utf-8"))
    site_id = config["id"]
    lon0, lat0 = float(config["position"]["lonEastDeg"]), float(config["position"]["latDeg"])
    half_lat = (SQUARE_KM * 500) / (MARS_RADIUS_M * math.pi / 180)
    half_lon = half_lat / math.cos(math.radians(lat0))
    west, east, south, north = lon0 - half_lon, lon0 + half_lon, lat0 - half_lat, lat0 + half_lat

    if not UNZIPPED.exists():
        with zipfile.ZipFile(ZIP) as archive:
            members = [m for m in archive.namelist() if ".gdb/" in m and not m.startswith("__MACOSX")]
            archive.extractall(UNZIPPED, members)
    gdb = next(UNZIPPED.rglob("*.gdb"))
    layers = fiona.listlayers(str(gdb))
    print(f"Geodatabase {gdb.name}: layers {layers}")
    # The polygon layer of map units: named like MapUnitPolys in the USGS GeMS schema, GeoUnits_v1 in SIM 3464.
    name = (next((l for l in layers if "mapunitpoly" in l.lower()), None)
            or next((l for l in layers if l.lower().startswith("geounits") and "anno" not in l.lower()), None)
            or next(l for l in layers if "poly" in l.lower()))
    features = []
    colours: dict[str, str] = {}
    with fiona.open(str(gdb), layer=name) as source:
        fields = list(source.schema["properties"].keys())
        unit_field = next((f for want in ("symbol", "mapunit", "unitlabel", "label", "unit") for f in fields if f.lower() == want), fields[0])
        name_field = next((f for f in fields if f.lower() in ("name", "unitname", "fullname", "description")), unit_field)
        print(f"Layer {name}: {len(source)} polygons; unit field {unit_field}, name field {name_field}")
        for feature in source:
            geometry = transform_geom(source.crs_wkt, TARGET_CRS, feature["geometry"])
            polygons = geometry["coordinates"] if geometry["type"] == "MultiPolygon" else [geometry["coordinates"]]
            # Cut to the square: some units run 100 km across, and whole polygons made a file of 11 MB.
            clipped = [p for p in (clip_polygon(polygon, west, east, south, north) for polygon in polygons) if p]
            if not clipped:
                continue
            unit = str(feature["properties"].get(unit_field) or "unknown")
            colours.setdefault(unit, PALETTE[len(colours) % len(PALETTE)])
            features.append({
                "type": "Feature",
                "properties": {"unit": unit, "name": str(feature["properties"].get(name_field) or unit), "colour": colours[unit]},
                "geometry": {"type": "MultiPolygon", "coordinates": clipped},
            })
    # One name per symbol: the one most of its polygons carry, so a stray misspelling never reaches the legend.
    counts: dict[str, dict[str, int]] = {}
    for feature in features:
        p = feature["properties"]
        counts.setdefault(p["unit"], {}).setdefault(p["name"], 0)
        counts[p["unit"]][p["name"]] += 1
    for feature in features:
        names = counts[feature["properties"]["unit"]]
        feature["properties"]["name"] = max(names, key=lambda n: names[n])
    if len(colours) > len(PALETTE):
        print(f"warning: {len(colours)} units but {len(PALETTE)} colours, so some units share a colour")
    out = REPO / "data" / "work" / site_id / "geology.geojson"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps({"type": "FeatureCollection", "features": features}), encoding="utf-8")
    print(f"Wrote {out.relative_to(REPO)}: {len(features)} polygons in {len(colours)} units: {', '.join(sorted(colours))}")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit("usage: python build_geology.py ../sites/<site id>.yaml")
    main(pathlib.Path(sys.argv[1]).resolve())
