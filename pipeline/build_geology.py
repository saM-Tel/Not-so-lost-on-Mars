# WHAT:    Turns the USGS geologic map of Jezero crater and Nili Planum (SIM 3464) into GeoJSON in degrees for one site (F2).
# IN:      ../data/raw/geology/sim3464_database.zip (team data server raw/jezero/geology); a site config with `geology`.
# OUT:     ../data/work/<site id>/geology.geojson: map units touching a 12 km square round the site, each with its unit
#          code, name and our colour. build_site.py copies it into the site and writes its record.
# USED BY: People and AI sessions from the command line: python build_geology.py ../sites/bright-angel.yaml
# RULES:   Needs the fiona package (not installed by default: see docs/REVIEW_QUEUE.md item 7). Runs in its own process,
#          because fiona and rasterio each carry their own GDAL. Our colours, colour-blind safe, never red.
# TRAPS:   PITFALLS 4. The map is on Mars Transverse Mercator, central meridian 77.5 E; positions are 100 to 200 m off.
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
PALETTE = ["#0072b2", "#56b4e9", "#009e73", "#f0e442", "#cc79a7", "#e69f00", "#999999", "#d0d0d0", "#000000"]


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
    # The polygon layer of map units: the one named like MapUnitPolys, as in the USGS GeMS schema.
    name = next((l for l in layers if "mapunitpoly" in l.lower()), None) or next(l for l in layers if "poly" in l.lower())
    features = []
    colours: dict[str, str] = {}
    with fiona.open(str(gdb), layer=name) as source:
        fields = list(source.schema["properties"].keys())
        unit_field = next((f for f in fields if f.lower() in ("mapunit", "unit", "unitlabel", "label")), fields[0])
        name_field = next((f for f in fields if f.lower() in ("name", "unitname", "fullname", "description")), unit_field)
        print(f"Layer {name}: {len(source)} polygons; unit field {unit_field}, name field {name_field}")
        for feature in source:
            geometry = transform_geom(source.crs_wkt, TARGET_CRS, feature["geometry"])
            xs, ys = [], []

            def walk(coords):
                if coords and isinstance(coords[0], (int, float)):
                    xs.append(coords[0]); ys.append(coords[1])
                else:
                    for c in coords:
                        walk(c)
            walk(geometry["coordinates"])
            if not xs or max(xs) < west or min(xs) > east or max(ys) < south or min(ys) > north:
                continue
            unit = str(feature["properties"].get(unit_field) or "unknown")
            colours.setdefault(unit, PALETTE[len(colours) % len(PALETTE)])
            features.append({
                "type": "Feature",
                "properties": {"unit": unit, "name": str(feature["properties"].get(name_field) or unit), "colour": colours[unit]},
                "geometry": {"type": geometry["type"], "coordinates": geometry["coordinates"]},
            })
    out = REPO / "data" / "work" / site_id / "geology.geojson"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps({"type": "FeatureCollection", "features": features}), encoding="utf-8")
    print(f"Wrote {out.relative_to(REPO)}: {len(features)} polygons in {len(colours)} units: {', '.join(sorted(colours))}")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit("usage: python build_geology.py ../sites/<site id>.yaml")
    main(pathlib.Path(sys.argv[1]).resolve())
