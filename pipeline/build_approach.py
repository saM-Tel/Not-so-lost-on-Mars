# WHAT:    Builds the approach imagery (F14, F1): three rings of real orbital images around every site, so the ground
#          around a site is sharp while the person zooms in, not the stretched whole-planet image.
# IN:      Every config in ../sites/. The CTX global mosaic (Murray Lab, Caltech), read as tiles from Esri's OnMars CTX
#          service, which NASA Mars Trek lists as CTX_beta01_uncontrolled_5m_Caltech. A site may name its own file for
#          the near ring under `approach.near` (Bright Angel uses the USGS Jezero CTX mosaic), read through sources.py.
#          Source tiles are kept in ../data/work/approach/ between runs.
# OUT:     ../app/public/data/approach/ (layers.json and tiles/<layer id>/{z}/{x}/{y}.webp), written to a temporary
#          folder and renamed when complete.
# USED BY: People and AI sessions from the command line: python build_approach.py [--site <site id>]
# RULES:   Every ring has a full layer record with its bounds. Missing source pixels are transparent. A network error
#          stops the build; only a tile the service says does not exist counts as no data.
# TRAPS:   PITFALLS 2, 4, 10.
# OWNER:   Role A.

import argparse
import concurrent.futures
import dataclasses
import io
import json
import pathlib
import shutil
import sys
import time
import urllib.error
import urllib.request

import numpy as np
from PIL import Image, ImageFile

import config
import mars
import records
import sources
import tiles

REPO = pathlib.Path(__file__).resolve().parent.parent
OUT = REPO / "app" / "public" / "data" / "approach"
WORK = REPO / "data" / "work" / "approach"
SITES = REPO / "sites"

# Esri's OnMars CTX service: plain degrees on the Mars 2000 sphere (radius 3,396,190 m), origin at 180 W, 90 N,
# 512-pixel tiles, level L at 0.3515625 / 2**L degrees per pixel, levels 0 to 12. Read from
# https://astro.arcgis.com/arcgis/rest/services/OnMars/CTX/MapServer?f=json on 14 Nov 2026.
ESRI_SERVICE = "https://astro.arcgis.com/arcgis/rest/services/OnMars/CTX/MapServer"
ESRI_TILE_URL = ESRI_SERVICE + "/tile/{level}/{row}/{col}"
ESRI_TILE_PX = 512
ESRI_LEVEL0_DEG_PER_PX = 0.3515625
ESRI_MAX_LEVEL = 12
# Every complete PNG file ends with this chunk. Files are checked for it before decoding, so the setting below
# only ever applies to a file already known to be cut short.
PNG_END = b"IEND\xaeB`\x82"
ImageFile.LOAD_TRUNCATED_IMAGES = True


@dataclasses.dataclass(frozen=True)
class Ring:
    name: str
    box_km: float          # side of the square, centred on the site marker
    pixel_m: float         # ground size of a source pixel this ring is drawn from
    zooms_below: int       # how many zooms under the finest one are cut too
    title: str


# Each ring fills the screen at the zooms it covers, and the next ring takes over before it runs out:
# the wide ring holds a 1000-pixel view to about zoom 9, the middle one to zoom 12, the near one to zoom 14,
# and the site's own 25 cm map starts at zoom 12. Outside a ring's zooms MapLibre stretches the ring below.
RINGS = (
    Ring("wide", 320.0, 160.0, 3, "Region from orbit"),
    Ring("mid", 40.0, 20.0, 2, "Surroundings from orbit"),
    Ring("near", 12.0, 5.0, 1, "Close surroundings from orbit"),
)


def esri_level_for(pixel_m: float) -> int:
    """The coarsest service level whose pixels are no larger than pixel_m."""
    for level in range(ESRI_MAX_LEVEL + 1):
        if ESRI_LEVEL0_DEG_PER_PX / 2**level * mars.METRES_PER_DEGREE <= pixel_m * 1.05:
            return level
    return ESRI_MAX_LEVEL


def fetch_esri_tile(level: int, row: int, col: int) -> np.ndarray | None:
    """One 512 x 512 service tile as 8-bit grey, from the working folder if kept, else from the service.

    Returns None only when the service says the tile does not exist (no CTX coverage there).
    """
    cached = WORK / "esri-ctx" / str(level) / str(row) / f"{col}.png"
    missing = cached.with_suffix(".none")
    if missing.exists() or cached.with_suffix(".unavailable").exists():
        return None
    damaged = cached.with_suffix(".damaged")
    if cached.exists() and cached.stat().st_size > 0:
        try:
            return decode_esri_tile(cached.read_bytes(), level, row, col, allow_truncated=damaged.exists())
        except OSError:
            cached.unlink()  # a partial file from an earlier run; fetch it again
    url = ESRI_TILE_URL.format(level=level, row=row, col=col)
    last_error = None
    short_copies: list[bytes] = []
    server_errors = 0
    attempts = 8
    for attempt in range(attempts):
        if attempt:
            time.sleep(min(2.0 * attempt, 10.0))  # the service answers 500 or cuts files short when pressed
        try:
            request = urllib.request.Request(url, headers={"User-Agent": "mars-site-builder"})
            with urllib.request.urlopen(request, timeout=60) as response:
                data = response.read()
            if not data.endswith(PNG_END):
                short_copies.append(data)
            if len(short_copies) >= 3 and all(copy == data for copy in short_copies[-3:]):
                # The service sends the same cut-short file every time: the damage is at the source. Keep what
                # decodes; the rows that do not are left black, which is no data, so they are transparent.
                tile = decode_esri_tile(data, level, row, col, allow_truncated=True)
                damaged.parent.mkdir(parents=True, exist_ok=True)
                damaged.write_text("the service sends this tile cut short\n", encoding="utf-8")
                print(f"    note: CTX tile {level}/{row}/{col} is damaged at the source; its missing rows are left as no data")
            else:
                tile = decode_esri_tile(data, level, row, col)  # a download cut short fails here and is fetched again
        except urllib.error.HTTPError as error:
            if error.code == 404:
                missing.parent.mkdir(parents=True, exist_ok=True)
                missing.write_text("the service has no tile here\n", encoding="utf-8")
                return None
            last_error = error
            server_errors += error.code >= 500
            continue
        except OSError as error:
            last_error = error
            continue
        cached.parent.mkdir(parents=True, exist_ok=True)
        cached.write_bytes(data)
        return tile
    if server_errors == attempts:
        # The service fails on this one tile every time, over about a minute. Left as no data, so the coarser ring
        # shows through. Remembered, so later runs do not ask again; delete the .unavailable file to retry.
        missing.with_suffix(".unavailable").parent.mkdir(parents=True, exist_ok=True)
        missing.with_suffix(".unavailable").write_text(f"{last_error}\n", encoding="utf-8")
        print(f"    note: CTX tile {level}/{row}/{col} fails at the service every time ({last_error}); left as no data")
        return None
    raise RuntimeError(f"could not fetch {url}: {last_error}")


def decode_esri_tile(data: bytes, level: int, row: int, col: int, allow_truncated: bool = False) -> np.ndarray:
    """A service tile as 8-bit grey. Raises OSError if the file is damaged or the wrong size, unless a cut-short
    file is allowed, when the part that decodes is kept and the rest is black."""
    if not data.endswith(PNG_END) and not allow_truncated:
        raise OSError(f"CTX tile {level}/{row}/{col} is cut short")
    image = Image.open(io.BytesIO(data))
    image.load()
    if image.size != (ESRI_TILE_PX, ESRI_TILE_PX):
        raise OSError(f"CTX tile {level}/{row}/{col} is {image.size}, expected {ESRI_TILE_PX} x {ESRI_TILE_PX}")
    return np.asarray(image.convert("L"))


def read_esri_box(level: int, box: sources.Box) -> sources.Grid:
    """The service's pixels that cover a box, as a grid evenly spaced in degrees. 0 is no data."""
    deg_per_px = ESRI_LEVEL0_DEG_PER_PX / 2**level
    span = deg_per_px * ESRI_TILE_PX
    row0, row1 = int((90.0 - box.north_lat_deg) // span), int((90.0 - box.south_lat_deg) // span)
    col0, col1 = int((box.west_lon_deg + 180.0) // span), int((box.east_lon_deg + 180.0) // span)
    rows, cols = row1 - row0 + 1, col1 - col0 + 1
    values = np.zeros((rows * ESRI_TILE_PX, cols * ESRI_TILE_PX), dtype=np.uint8)
    wanted = [(r, c) for r in range(row0, row1 + 1) for c in range(col0, col1 + 1)]
    absent = 0
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        for (r, c), tile in zip(wanted, pool.map(lambda rc: fetch_esri_tile(level, *rc), wanted)):
            if tile is None:
                absent += 1
                continue
            y, x = (r - row0) * ESRI_TILE_PX, (c - col0) * ESRI_TILE_PX
            values[y:y + ESRI_TILE_PX, x:x + ESRI_TILE_PX] = tile
    print(f"    CTX service level {level}: {len(wanted)} tiles, {absent} with no coverage")
    return sources.Grid(values, -180.0 + col0 * span, 90.0 - row0 * span, deg_per_px, deg_per_px, 0,
                        "Esri OnMars CTX service")


def finest_zoom(pixel_m: float, lat_deg: float) -> int:
    """The finest zoom whose tile pixels are not much smaller than the source pixels at this latitude."""
    zoom = 0
    while zoom < 18 and mars.tile_pixel_size_m(zoom + 1, lat_deg) >= pixel_m * 0.8:
        zoom += 1
    return zoom


def global_ctx_record(layer_id: str, ring: Ring, level: int, zoom_min: int, zoom_max: int, lat_deg: float) -> dict:
    """Record for a ring drawn from the CTX global mosaic. Facts from the service description, read 14 Nov 2026."""
    source_m = ESRI_LEVEL0_DEG_PER_PX / 2**level * mars.METRES_PER_DEGREE
    our_m = mars.tile_pixel_size_m(zoom_max, lat_deg)
    return {
        "id": layer_id,
        "title": ring.title,
        "dataType": "optical",
        "mission": "Mars Reconnaissance Orbiter",
        "instrument": "Context Camera (CTX)",
        "agency": "NASA",
        "productId": "CTX global mosaic, beta01 (Murray Lab, Caltech); listed in NASA Mars Trek as CTX_beta01_uncontrolled_5m_Caltech",
        "sourceUrl": ESRI_SERVICE,
        "doi": records.NOT_FOUND,
        # The service gives no image dates. CTX has imaged Mars since 2006 (the USGS Jezero CTX metadata gives
        # 2006 as the start of CTX coverage). The latest date in beta01 is not stated: see docs/REVIEW_QUEUE.md.
        "acquiredFrom": "2006 at the earliest",
        "acquiredTo": "Not stated by the service; before the beta01 mosaic was made",
        "published": records.NOT_FOUND,
        "gridSpacing": f"About 5 m in the source mosaic; read at about {source_m:.0f} m; about {our_m:.0f} m in our copy at zoom {zoom_max}",
        "realDetail": f"About {max(source_m, our_m):.0f} m",
        "positionAccuracy": "Not stated. The service calls the mosaic uncontrolled: its images are not tied to a reference map",
        "heightAccuracy": records.NOT_APPLICABLE,
        "processing": (
            f"Read as {ESRI_TILE_PX}-pixel tiles from Esri's OnMars CTX service at level {level} (about {source_m:.0f} m a pixel), "
            f"which are evenly spaced in degrees on the Mars 2000 sphere, then redrawn as Web Mercator tiles for zoom {zoom_min} "
            f"to {zoom_max} over a {ring.box_km:.0f} km square centred on the site marker. Pure black pixels are treated as no data."
        ),
        "grade": "C",
        "caveats": [
            "For finding your way and seeing the land around the site. Not for planning a walk.",
            "Uncontrolled: not aligned to the site's own map, so ground features may not line up exactly at the edge of the site box.",
            "Black and white: brightness only, not colour.",
            "The service stores it with lossy JPEG compression at 8 bits.",
            "The service does not give the date of each image.",
        ],
        "credit": "NASA/JPL/MSSS/The Murray Lab, Caltech; tiles served by Esri",
    }


def configured_record(layer_id: str, ring: Ring, source: dict, zoom_min: int, zoom_max: int, lat_deg: float) -> dict:
    """Record for a ring drawn from a file the site config names, with the facts the config gives for it."""
    stated = source["record"]
    our_m = mars.tile_pixel_size_m(zoom_max, lat_deg)
    record = {key: stated[key] for key in config.SOURCE_RECORD_FIELDS}
    record.update({
        "id": layer_id,
        "title": ring.title,
        "dataType": "optical",
        "gridSpacing": f"{stated['gridSpacing']} in the source; about {our_m:.0f} m in our copy at zoom {zoom_max}",
        "processing": (
            f"Read from {source['file']} over a {ring.box_km:.0f} km square centred on the site marker and redrawn as "
            f"Web Mercator tiles for zoom {zoom_min} to {zoom_max}. Cells marked as no data in the file are transparent."
        ),
    })
    record["caveats"] = list(stated["caveats"])
    return record


def check_approach_source(site_id: str, source: dict) -> None:
    problems = [f"approach.near.{field} is missing" for field in ("file", "serverPath", "originalUrl") if not source.get(field)]
    stated = source.get("record") or {}
    problems += [f"approach.near.record.{field} is missing" for field in config.SOURCE_RECORD_FIELDS if stated.get(field) in (None, "", [])]
    if problems:
        sys.exit(f"{site_id}: " + "; ".join(problems))


def build_site_rings(site: dict, folder: pathlib.Path) -> list[dict]:
    site_id = site["id"]
    position = site["positionChecked"]
    lon, lat = position["lonEastDeg"], position["latDeg"]
    near_source = (site.get("approach") or {}).get("near")
    if near_source:
        check_approach_source(site_id, near_source)
    print(f"  {site_id}: {lon:.4f} E, {lat:.4f} N")
    layers = []
    for ring in RINGS:
        layer_id = f"image-ctx-{site_id}-{ring.name}"
        box = sources.Box.around(lon, lat, ring.box_km, ring.box_km)
        if ring.name == "near" and near_source:
            grid = sources.read_box(near_source["file"], near_source["serverPath"], near_source["originalUrl"], box,
                                    REPO / "data" / "work" / site_id / "approach")
            source_m = grid.cell_north_south_m
            print(f"    near ring from {near_source['file']} ({grid.origin})")
        else:
            level = esri_level_for(ring.pixel_m)
            grid = read_esri_box(level, box)
            source_m = ESRI_LEVEL0_DEG_PER_PX / 2**level * mars.METRES_PER_DEGREE
        zoom_max = finest_zoom(source_m, lat)
        zoom_min = zoom_max - ring.zooms_below
        count, size = tiles.write_site_image_tiles(grid, box, zoom_min, zoom_max, folder / "tiles" / layer_id, quality=72)
        if ring.name == "near" and near_source:
            record = configured_record(layer_id, ring, near_source, zoom_min, zoom_max, lat)
        else:
            record = global_ctx_record(layer_id, ring, level, zoom_min, zoom_max, lat)
        record["siteId"] = site_id
        record["ring"] = ring.name
        record["tiles"] = {
            "path": f"tiles/{layer_id}/{{z}}/{{x}}/{{y}}.webp",
            "minZoom": zoom_min,
            "maxZoom": zoom_max,
            "tileSizePx": mars.TILE_SIZE_PX,
            "count": count,
            "bytes": size,
            "bounds": box.as_dict(),
        }
        print(f"    {ring.name:<5} {ring.box_km:>4.0f} km, zoom {zoom_min} to {zoom_max}: {count} tiles, {size / 1e6:.1f} MB")
        layers.append(record)
    return layers


def build(only_site: str | None) -> None:
    sites = config.load_all_site_configs(SITES)
    if only_site:
        sites = [site for site in sites if site["id"] == only_site]
        if not sites:
            sys.exit(f"no site config with id '{only_site}'")
    print(f"Approach imagery for {len(sites)} site(s)")
    # Built outside app/public, then moved in whole: a running dev server watches app/public and on Windows
    # holds open every folder made inside it, which makes renaming a temporary folder there fail.
    temporary = WORK / "build.tmp"
    if temporary.exists():
        shutil.rmtree(temporary)
    # A build of one site keeps the other sites' rings from the last full build.
    if only_site and OUT.exists():
        shutil.copytree(OUT, temporary)
        for ring in RINGS:
            shutil.rmtree(temporary / "tiles" / f"image-ctx-{only_site}-{ring.name}", ignore_errors=True)
        previous = json.loads((temporary / "layers.json").read_text(encoding="utf-8"))["layers"]
        kept = [layer for layer in previous if layer.get("siteId") != only_site]
    else:
        temporary.mkdir(parents=True)
        kept = []
    layers = kept
    for site in sites:
        layers += build_site_rings(site, temporary)
    layers.sort(key=lambda layer: (layer["siteId"], [ring.name for ring in RINGS].index(layer["ring"])))
    json_bytes = records.write_layers(temporary, layers)
    if OUT.exists():
        shutil.rmtree(OUT)
    shutil.move(str(temporary), str(OUT))
    total = sum(layer["tiles"]["bytes"] for layer in layers) + json_bytes
    tile_count = sum(layer["tiles"]["count"] for layer in layers)
    print(f"  wrote {len(layers)} layers, {tile_count} tiles: {total / 1e6:.1f} MB in {OUT.relative_to(REPO)}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Build the approach imagery around every site.")
    parser.add_argument("--site", help="build only this site's rings and keep the others")
    arguments = parser.parse_args()
    build(arguments.site)
