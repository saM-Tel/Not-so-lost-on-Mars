# WHAT:    One command that builds one site from its config. So far: reads the box, checks terrain against the rover, cuts image and
#          terrain tiles, measures slope, writes the routing grids, and writes layers.json, validation.json and site.json (F1, F3).
#          Still to add: stage 2, the rest of stages 4 and 5, and stages 6 and 7.
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

import numpy as np

import build_globe
import config
import grids as routing_grids
import mars
import photos
import records
import scenario
import sources
import terrain
import tiles
import validate
import vectors

REPO = pathlib.Path(__file__).resolve().parent.parent
DATA = REPO / "app" / "public" / "data"
WORK = REPO / "data" / "work"

# Tile zooms. One pixel of a zoom 18 tile is about 0.30 m at Jezero, close to the 25 cm image.
# One pixel of a zoom 15 terrain tile is about 2.4 m, finer than the terrain's real detail of 3 to 5 m.
IMAGE_ZOOMS = (12, 18)
TERRAIN_ZOOMS = (11, 15)
# Terrain round the box, when the config names a coarser model for it: from this zoom, eased flat over this distance
# at its outer edge.
SURROUND_MIN_ZOOM = 9
SURROUND_FEATHER_M = 1500.0
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

    # Built outside app/public and moved in whole at the end: a running dev server holds open every folder made
    # under app/public on Windows, which made the final rename fail (pipeline/AGENTS.md, known issues).
    temporary = work / "build.tmp"
    if temporary.exists():
        shutil.rmtree(temporary)
    temporary.mkdir(parents=True)
    hero = scenario.resolve(site.get("scenario"), stops if rover else [], box, grids["terrain"])
    if hero:
        print(f"Scenario: home at stop {hero['home']['stop'] if 'home' in hero else 'none'}; "
              f"{len(hero.get('targets', []))} targets: {', '.join(t['name'] for t in hero.get('targets', []))}")

    layers = []
    surround = (site.get("approach") or {}).get("terrain")
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
        elif surround:
            # Heights round the box from a coarser model, so the box does not stand above flat ground in 3D.
            outer = sources.Box.around(position["lonEastDeg"], position["latDeg"], surround["sizeKm"], surround["sizeKm"])
            coarse = sources.read_box(surround["file"], surround["serverPath"], surround["originalUrl"], outer, work / "surround")
            reference = float(grids["terrain"].values.min())
            zooms = (SURROUND_MIN_ZOOM, zooms[1])
            count, size = tiles.write_terrain_tiles_with_surround(grids[name], box, coarse, outer, zooms[0], zooms[1], folder,
                                                                  reference, SURROUND_FEATHER_M)
            extension = "png"
            processing = (f"Height tiles for zoom {zooms[0]} to {zooms[1]}, to the nearest 0.1 m: this 1 m terrain inside the "
                          f"{site['box']['widthKm']} km box, and round it, out to a {surround['sizeKm']} km square, "
                          f"{surround['record']['productId']} ({surround['record']['gridSpacing']}, {surround['record']['credit']}). "
                          f"Over the last {SURROUND_FEATHER_M / 1000:.1f} km of the square the heights are eased to the box's lowest point, "
                          "because the map has no terrain beyond it; that easing is for the picture only and is not data. "
                          "Routes and slopes use only the 1 m terrain.")
            print(f"Terrain round the box: {surround['file']} over {surround['sizeKm']} km, from the {coarse.origin}")
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
            if surround:
                record["tiles"]["bounds"] = {key: round(value, 7) for key, value in outer.as_dict().items()}
                record["caveats"] = [*record["caveats"],
                                     f"Round the box the 3D shape comes from a {surround['record']['gridSpacing']} CTX terrain model and "
                                     "is eased flat at its outer edge; it is not this layer's 1 m data."]
        layers.append(record)
        print(f"Wrote {count} {name} tiles, {size / 1e6:.1f} MB")

    terrain_grid = grids["terrain"]
    slope, slope_baseline = terrain.slope_deg(terrain_grid.values, terrain_grid.cell_north_south_m,
                                              terrain_grid.cell_east_west_m(centre_lat), terrain_grid.nodata)
    grid_definition = routing_grids.write_routing_grids(terrain_grid, slope, slope_baseline, centre_lat, temporary / "grid")
    known = slope[~np.isnan(slope)]
    print(f"Slope over {slope_baseline['northSouthM']} m north to south and {slope_baseline['eastWestM']} m east to west: "
          f"median {np.median(known):.1f} deg, 95% of cells under {np.percentile(known, 95):.1f} deg, steepest {known.max():.1f} deg")
    print(f"Wrote routing grids: {grid_definition['cols']} x {grid_definition['rows']} cells of "
          f"{grid_definition['cellNorthSouthM']} m north to south by {grid_definition['cellEastWestM']} m east to west, "
          f"{sum(entry['bytes'] for entry in grid_definition['files']) / 1e6:.1f} MB")

    if rover:
        slope_grid = sources.Grid(slope, terrain_grid.west_lon_deg, terrain_grid.north_lat_deg, terrain_grid.cell_lon_deg,
                                  terrain_grid.cell_lat_deg, None, terrain_grid.origin)
        slopes = validate.slope_check(slope_grid, stops)
        slopes["baselineM"] = slope_baseline
        slopes["caution"] = (
            "The two are not quite the same measurement. Ours is the steepest slope of the ground over about 6 m, taken "
            "from orbit; the rover's is how far the vehicle leaned where it stood. Rover drivers also choose gentle "
            "ground, so these stops say little about how well steep slopes are measured."
        )
        checks["slope"] = slopes
        print(f"Slope check at {slopes['stopsUsed']} of {slopes['stopsInBox']} rover stops: ours minus rover tilt, "
              f"median {slopes.get('medianDifferenceDeg')} deg, typical {slopes.get('medianAbsoluteDifferenceDeg')} deg, "
              f"90% within {slopes.get('percentile90AbsoluteDifferenceDeg')} deg, correlation {slopes.get('correlation')}")

    # Slope as a layer of its own. It is drawn by the app from the routing grid, so it has no tiles.
    slope_record = dict(site["sources"]["terrain"]["record"])
    slope_record.update({
        "id": "slope-hirise", "title": "Slope", "dataType": "topographic",
        "gridSpacing": f"{grid_definition['cellNorthSouthM']:g} m cells, each holding the steepest of "
                       f"{routing_grids.CELLS_PER_ROUTING_CELL ** 2} slopes measured on the 1 m terrain",
        "realDetail": f"About 6 m: each slope is measured over {slope_baseline['northSouthM']} m north to south "
                      f"and {slope_baseline['eastWestM']} m east to west",
        "processing": "Steepest slope at each 1 m cell of the terrain, then the steepest of those in each routing cell. "
                      "Cells are narrower east to west at this latitude and the spacing is corrected for it.",
        "caveats": [*slope_record["caveats"],
                    (f"Checked against the tilt the rover measured at {checks['slope']['stopsUsed']} stops: typical difference "
                     f"{checks['slope'].get('medianAbsoluteDifferenceDeg')} degrees, 9 in 10 within "
                     f"{checks['slope'].get('percentile90AbsoluteDifferenceDeg')} degrees. Rover drivers choose gentle ground, "
                     "so steep slopes are less well checked.") if checks.get("slope") else
                    "Slope has not been checked against anything measured on the ground at this site.",
                    "A short steep step, such as a ledge under about 3 m, can be missed."],
        "grid": "slopeMaxDeg",
    })
    layers.append(slope_record)

    if rover and rover.get("pathFile"):
        stop_features, _ = validate.read_feed_features(rover["file"], rover["serverPath"], rover["originalUrl"])
        path_features, path_origin = validate.read_feed_features(rover["pathFile"], rover["serverPath"], rover["pathOriginalUrl"])
        rover_layers = vectors.write_rover_layers(temporary / "vectors", stop_features, path_features, box, rover)
        layers.extend(rover_layers)
        for layer in rover_layers:
            print(f"Wrote {layer['title'].lower()}: {layer['vector']['count']} features, "
                  f"{layer['acquiredFrom']} to {layer['acquiredTo']}; path file from the {path_origin}")

    # Real rover photos at the stops in the box. Optional: without them the app simply shows none.
    if rover:
        in_box = [stop for stop in stops if box.west_lon_deg <= mars.lon_to_180(float(stop["lon"])) <= box.east_lon_deg
                  and box.south_lat_deg <= float(stop["lat"]) <= box.north_lat_deg]
        if in_box:
            try:
                sols = [int(stop["sol"]) for stop in in_box]
                frames, photo_origin = photos.fetch_feed(min(sols), max(sols), work / "photo_feed.json")
                summary = photos.write_photo_index(temporary, frames, in_box, photo_origin)
                print(f"Wrote photos.json: {summary['photos']} photos at {summary['stopsWithPhotos']} of {summary['stopsInBox']} "
                      f"stops, from {len(frames)} frames; source: {photo_origin}")
            except OSError as error:
                print(f"No photos.json: the rover's image feed could not be read ({error}).")

    records.write_layers(temporary, layers)
    records.write_json(temporary / "validation.json", {
        "contractVersion": records.CONTRACT_VERSION, "builtUtc": records.utc_now_iso(), **checks,
    })
    files = [
        {"path": "layers.json", "files": 1, "bytes": (temporary / "layers.json").stat().st_size},
        {"path": "validation.json", "files": 1, "bytes": (temporary / "validation.json").stat().st_size},
        *[folder_summary(temporary, f"tiles/{layer['id']}") for layer in layers if "tiles" in layer],
        folder_summary(temporary, "grid"),
        *([folder_summary(temporary, "vectors")] if (temporary / "vectors").exists() else []),
        *([{"path": "photos.json", "files": 1, "bytes": (temporary / "photos.json").stat().st_size}]
          if (temporary / "photos.json").exists() else []),
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
        "grid": grid_definition,
        **hero,
        "readFrom": {name: grids[name].origin for name in grids},
        "files": files,
        "totalBytes": total,
    })

    final = DATA / site_id
    if final.exists():
        shutil.rmtree(final)
    shutil.move(str(temporary), str(final))

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
