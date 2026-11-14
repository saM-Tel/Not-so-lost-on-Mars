# WHAT:    One command that builds one site from its config. So far: reads the box, checks terrain against the rover, cuts image and
#          terrain tiles, and writes layers.json, validation.json and site.json (F1). Still to add: stages 2 and 4 to 7.
# IN:      Path to a site config in ../sites/.
# OUT:     ../app/public/data/<site id>/, written to a temporary folder and renamed when complete; sites.json is then rewritten.
# USED BY: People and AI sessions from the command line: python build_site.py ../sites/<site id>.yaml [--dry-run]
# RULES:   Same config, same outputs. Prints the box built, which source each file came from, and the total size.
# TRAPS:   PITFALLS 3, 4, 5, 10.
# OWNER:   Role A.

import argparse
import pathlib
import shutil
import sys

import build_globe
import config
import mars
import records
import sources
import tiles
import validate

REPO = pathlib.Path(__file__).resolve().parent.parent
DATA = REPO / "app" / "public" / "data"
WORK = REPO / "data" / "work"

# Tile zooms. One pixel of a zoom 18 tile is about 0.30 m at Jezero, close to the 25 cm image.
# One pixel of a zoom 15 terrain tile is about 2.4 m, finer than the terrain's real detail of 3 to 5 m.
IMAGE_ZOOMS = (12, 18)
TERRAIN_ZOOMS = (11, 15)
# Size budget from data/AGENTS.md, in megabytes, by readiness level.
BUDGET_MB = {1: 120, 2: 50}


def folder_summary(root: pathlib.Path, relative: str) -> dict:
    files = [p for p in (root / relative).rglob("*") if p.is_file()]
    return {"path": relative, "files": len(files), "bytes": sum(p.stat().st_size for p in files)}


def build(config_path: pathlib.Path, dry_run: bool) -> None:
    site = config.load_site_config(config_path)
    if not site.get("buildable"):
        sys.exit(f"{config_path.name} has no 'box' and 'sources', so there is nothing to build.")
    site_id = site["id"]
    position = site["positionChecked"]
    box = sources.Box.around(position["lonEastDeg"], position["latDeg"], site["box"]["widthKm"], site["box"]["heightKm"])
    centre_lat = position["latDeg"]

    print(f"Site: {site_id} ({site['name']}, {site['place']})")
    print("Box built, in east-positive longitude and planetocentric latitude. Compare it with Mars Trek:")
    print(f"  west {box.west_lon_deg:.5f} E   east {box.east_lon_deg:.5f} E   south {box.south_lat_deg:.5f} N   north {box.north_lat_deg:.5f} N")
    print(f"  {site['box']['widthKm']} km east to west by {site['box']['heightKm']} km north to south, centred on {position['source']}")
    for name in ("terrain", "image"):
        source = site["sources"][name]
        places = [origin for _, origin in sources.candidate_addresses(source["file"], source["serverPath"], source["originalUrl"])]
        print(f"  {name}: {source['file']}; will try: {', then '.join(places)}")
    if dry_run:
        print("Dry run: the config is valid. Nothing was read or written.")
        return

    work = WORK / site_id
    grids = {}
    for name in ("terrain", "image"):
        source = site["sources"][name]
        grids[name] = sources.read_box(source["file"], source["serverPath"], source["originalUrl"], box, work)
        grid = grids[name]
        missing = 0 if grid.nodata is None else int((grid.values == grid.nodata).sum())
        print(f"Read {name}: {grid.cols} x {grid.rows} cells from the {grid.origin}; "
              f"cell {grid.cell_north_south_m:.3f} m north to south, {grid.cell_east_west_m(centre_lat):.3f} m east to west; "
              f"{missing} cells with no data")

    rover = site.get("rover")
    checks = {"heights": None}
    if rover:
        stops, origin = validate.read_rover_stops(rover["file"], rover["serverPath"], rover["originalUrl"])
        heights = validate.height_check(grids["terrain"], stops, rover["heightField"])
        heights["roverFile"] = rover["file"]
        heights["roverFileReadFrom"] = origin
        heights["caution"] = (
            "The agreement is closer than the terrain's stated accuracy, which suggests the rover's logged heights "
            "were themselves read from this terrain model. That is not confirmed. If so, this shows that we placed "
            "the terrain correctly, not that the terrain is accurate."
        )
        checks["heights"] = heights
        print(f"Height check at {heights['stopsUsed']} of {heights['stopsInBox']} rover stops in the box: "
              f"median difference {heights.get('medianDifferenceM')} m, typical {heights.get('medianAbsoluteDifferenceM')} m, "
              f"largest {heights.get('largestAbsoluteDifferenceM')} m")

    temporary = DATA / f"{site_id}.tmp"
    if temporary.exists():
        shutil.rmtree(temporary)
    temporary.mkdir(parents=True)

    layers = []
    for name, layer_id, title, data_type, zooms in (
        ("image", "image-hirise", "Ground from orbit", "optical", IMAGE_ZOOMS),
        ("terrain", "terrain-hirise", "Terrain height", "topographic", TERRAIN_ZOOMS),
    ):
        folder = temporary / "tiles" / layer_id
        pixel_m = mars.tile_pixel_size_m(zooms[1], centre_lat)
        if name == "image":
            count, size = tiles.write_site_image_tiles(grids[name], box, zooms[0], zooms[1], folder)
            extension = "webp"
            processing = (f"Cut to the site's box and redrawn as map tiles for zoom {zooms[0]} to {zooms[1]}. "
                          f"One tile pixel at zoom {zooms[1]} is {pixel_m:.2f} m on the ground. Places with no data are transparent.")
        else:
            count, size = tiles.write_site_terrain_tiles(grids[name], box, zooms[0], zooms[1], folder)
            extension = "png"
            processing = (f"Cut to the site's box and stored as height tiles for zoom {zooms[0]} to {zooms[1]}, to the nearest 0.1 m. "
                          f"One tile pixel at zoom {zooms[1]} is {pixel_m:.1f} m on the ground, so the 3D view is smoother than the 1 m grid. "
                          "Past the edge of the box the edge height is repeated so the surface has no cliff; that is not data.")
        record = dict(site["sources"][name]["record"])
        record.update({
            "id": layer_id, "title": title, "dataType": data_type, "processing": processing,
            "tiles": {
                "path": f"tiles/{layer_id}/{{z}}/{{x}}/{{y}}.{extension}",
                "minZoom": zooms[0], "maxZoom": zooms[1], "tileSizePx": mars.TILE_SIZE_PX,
                "count": count, "bytes": size,
            },
        })
        if name == "terrain":
            record["tiles"]["encoding"] = "mapbox"
        layers.append(record)
        print(f"Wrote {count} {name} tiles, {size / 1e6:.1f} MB")

    records.write_layers(temporary, layers)
    records.write_json(temporary / "validation.json", {
        "contractVersion": records.CONTRACT_VERSION, "builtUtc": records.utc_now_iso(), **checks,
    })
    files = [
        {"path": "layers.json", "files": 1, "bytes": (temporary / "layers.json").stat().st_size},
        {"path": "validation.json", "files": 1, "bytes": (temporary / "validation.json").stat().st_size},
        *[folder_summary(temporary, f"tiles/{layer['id']}") for layer in layers],
    ]
    total = sum(entry["bytes"] for entry in files)
    records.write_json(temporary / "site.json", {
        "contractVersion": records.CONTRACT_VERSION,
        "builtUtc": records.utc_now_iso(),
        "id": site_id,
        "name": site["name"],
        "place": site["place"],
        "mission": site["mission"],
        "level": site["level"],
        "reviewedByPerson": site["reviewedByPerson"],
        "convention": "East-positive longitude from -180 to 180 and planetocentric latitude, in degrees. Heights in metres relative to the areoid.",
        "box": {key: round(value, 7) for key, value in box.as_dict().items()},
        "boxSizeKm": {"eastWest": site["box"]["widthKm"], "northSouth": site["box"]["heightKm"]},
        "centre": {"lonEastDeg": round(position["lonEastDeg"], 7), "latDeg": round(position["latDeg"], 7)},
        "terrainHeightM": {
            "lowest": round(float(grids["terrain"].values.min()), 2),
            "highest": round(float(grids["terrain"].values.max()), 2),
            "atCentre": round(float(grids["terrain"].sample(position["lonEastDeg"], position["latDeg"])), 2),
        },
        "readFrom": {name: grids[name].origin for name in grids},
        "files": files,
        "totalBytes": total,
    })

    final = DATA / site_id
    if final.exists():
        shutil.rmtree(final)
    temporary.rename(final)

    budget = BUDGET_MB.get(site["level"])
    total_mb = (total + (final / "site.json").stat().st_size) / 1e6
    print(f"Wrote {final.relative_to(REPO)}: {total_mb:.1f} MB" + (f" of a {budget} MB budget" if budget else ""))
    if budget and total_mb > budget:
        print("  OVER BUDGET: use fewer zoom levels or a smaller box before committing.")
    build_globe.build_sites()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Build one site from its config.")
    parser.add_argument("config", type=pathlib.Path, help="a site config, for example ../sites/bright-angel.yaml")
    parser.add_argument("--dry-run", action="store_true", help="check the config and print the box; read and write nothing")
    arguments = parser.parse_args()
    build(arguments.config.resolve(), arguments.dry_run)
