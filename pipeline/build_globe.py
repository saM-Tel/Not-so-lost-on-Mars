# WHAT:    Builds what the globe needs (F14): Web Mercator tiles of a global Mars image, and sites.json from every site config.
# IN:      The Viking colour mosaic, read as tiles from NASA Mars Trek and kept in ../data/work/globe/ between runs; every config in ../sites/.
# OUT:     ../app/public/data/globe/ (tiles/image-viking/{z}/{x}/{y}.jpg and layers.json) and ../app/public/data/sites.json.
# USED BY: People and AI sessions from the command line: python build_globe.py [--only image|sites]
# RULES:   The image keeps its mission, dates and credit in a layer record. No position without a cited source. A missing source tile stops the build.
# TRAPS:   PITFALLS 2, 4, 10.
# OWNER:   Role A.

import argparse
import concurrent.futures
import io
import pathlib
import shutil
import sys
import urllib.request

import numpy as np
from PIL import Image

import config
import mars
import records
import tiles

REPO = pathlib.Path(__file__).resolve().parent.parent
DATA = REPO / "app" / "public" / "data"
OUT = DATA / "globe"
WORK = REPO / "data" / "work" / "globe"
SITES = REPO / "sites"

LAYER_ID = "image-viking"
TREK_LAYER = "Mars_Viking_MDIM21_ClrMosaic_global_232m"
# Mars Trek tiles are evenly spaced in degrees, not Web Mercator. Row comes before column,
# and zoom z has 2**z rows and 2**(z + 1) columns (docs/DATA_CATALOG.md, "Mars Trek map tiles").
TREK_URL = "https://trek.nasa.gov/tiles/Mars/EQ/{layer}/1.0.0/default/default028mm/{z}/{row}/{col}.jpg"
PRODUCT_PAGE = "https://astrogeology.usgs.gov/search/map/mars_viking_colorized_global_mosaic_232m"
SOURCE_SPACING_M = 231.5417872  # from the product page


def fetch_trek_tile(z: int, row: int, col: int) -> tuple[bytes, str]:
    """One source tile, from the local working folder if it is there, else from Mars Trek."""
    cached = WORK / "trek" / TREK_LAYER / str(z) / str(row) / f"{col}.jpg"
    if cached.exists() and cached.stat().st_size > 0:
        return cached.read_bytes(), "local working copy"
    url = TREK_URL.format(layer=TREK_LAYER, z=z, row=row, col=col)
    last_error = None
    for _ in range(3):
        try:
            request = urllib.request.Request(url, headers={"User-Agent": "mars-site-builder"})
            with urllib.request.urlopen(request, timeout=60) as response:
                data = response.read()
            cached.parent.mkdir(parents=True, exist_ok=True)
            cached.write_bytes(data)
            return data, "NASA Mars Trek"
        except OSError as error:  # includes HTTP and network errors
            last_error = error
    raise RuntimeError(f"could not fetch {url}: {last_error}")


def read_trek_mosaic(z: int) -> np.ndarray:
    """The whole planet at Trek zoom z: (rows, columns, 3), longitude -180 to 180, latitude 90 to -90."""
    rows, cols = 2**z, 2 ** (z + 1)
    size = mars.TILE_SIZE_PX
    mosaic = np.zeros((rows * size, cols * size, 3), dtype=np.uint8)
    wanted = [(row, col) for row in range(rows) for col in range(cols)]
    used = {}
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
        for (row, col), (data, origin) in zip(wanted, pool.map(lambda rc: fetch_trek_tile(z, *rc), wanted)):
            image = Image.open(io.BytesIO(data)).convert("RGB")
            if image.size != (size, size):
                raise RuntimeError(f"Trek tile {z}/{row}/{col} is {image.size}, expected {size} x {size}")
            mosaic[row * size:(row + 1) * size, col * size:(col + 1) * size] = np.asarray(image)
            used[origin] = used.get(origin, 0) + 1
    for origin, count in used.items():
        print(f"  source: {count} tiles from {origin}")
    return mosaic


def layer_record(zoom_max: int) -> dict:
    """The record the app shows for the globe image. Facts are from the USGS product page, read 14 Nov 2026."""
    our_spacing_km = mars.tile_pixel_size_m(zoom_max, 0.0) / 1000.0
    return {
        "id": LAYER_ID,
        "title": "Mars from orbit",
        "dataType": "optical",
        "mission": "Viking Orbiter 1 and 2",
        "instrument": "Visual Imaging Subsystem (VIS)",
        "agency": "NASA",
        "productId": TREK_LAYER,
        "sourceUrl": PRODUCT_PAGE,
        "doi": records.NOT_FOUND,
        "acquiredFrom": "1976",
        "acquiredTo": "1980",
        "published": "2009-02-02",
        "gridSpacing": f"{SOURCE_SPACING_M:.0f} m in the source mosaic; about {our_spacing_km:.1f} km at the equator in our copy",
        "realDetail": f"About {our_spacing_km:.1f} km at the equator in our copy",
        "positionAccuracy": "About 200 m, one pixel of the source mosaic (USGS product page)",
        "heightAccuracy": records.NOT_APPLICABLE,
        "processing": (
            f"Read as tiles from NASA Mars Trek at its zoom {zoom_max - 1}, redrawn on the Web Mercator square, "
            f"and cut into tiles for zoom 0 to {zoom_max}. Latitudes beyond {mars.MERCATOR_MAX_LAT_DEG:.1f} degrees are not kept."
        ),
        "grade": "B",
        "caveats": [
            "The colour was added artistically by NASA Ames. It is not measured colour.",
            "Brightness differences between regions were filtered out of the source mosaic to show landforms.",
            "Imaged from 1976 to 1980. Dust cover and the polar caps have changed since.",
            "Too coarse to show anything at walking scale. It is for finding sites, not for planning.",
        ],
        "credit": "NASA Viking Orbiter; mosaic by USGS Astrogeology Science Center; colour by NASA Ames",
        "tiles": {
            "path": f"tiles/{LAYER_ID}/{{z}}/{{x}}/{{y}}.jpg",
            "minZoom": 0,
            "maxZoom": zoom_max,
            "tileSizePx": mars.TILE_SIZE_PX,
        },
    }


def build(zoom_max: int) -> None:
    print(f"Globe image: {TREK_LAYER}, Web Mercator zoom 0 to {zoom_max}")
    source = read_trek_mosaic(zoom_max - 1)
    print(f"  source mosaic: {source.shape[1]} x {source.shape[0]} pixels, longitude -180 to 180 east, latitude 90 to -90")
    top = tiles.equirectangular_to_mercator(source, zoom_max)

    temporary = OUT.with_name(OUT.name + ".tmp")
    if temporary.exists():
        shutil.rmtree(temporary)
    temporary.mkdir(parents=True)
    count, tile_bytes = tiles.write_image_pyramid(top, zoom_max, temporary / "tiles" / LAYER_ID)
    record = layer_record(zoom_max)
    record["tiles"]["count"] = count
    record["tiles"]["bytes"] = tile_bytes
    json_bytes = records.write_layers(temporary, [record])

    if OUT.exists():
        shutil.rmtree(OUT)
    temporary.rename(OUT)
    total_mb = (tile_bytes + json_bytes) / 1e6
    print(f"  wrote {count} tiles and layers.json to {OUT.relative_to(REPO)}: {total_mb:.1f} MB")
    print(f"  one pixel at zoom {zoom_max} is {mars.tile_pixel_size_m(zoom_max, 0.0) / 1000:.2f} km at the equator")


def site_entry(site: dict) -> dict:
    """One site as the globe shows it. Everything comes from the site's config; nothing is added here."""
    position = site["positionChecked"]
    entry = {
        "id": site["id"],
        "name": site["name"],
        "place": site["place"],
        "mission": site["mission"],
        "missionYears": site["missionYears"],
        "level": site["level"],
        # Built means the pipeline has written this site's folder, so the app can open it.
        "built": (DATA / site["id"] / "site.json").exists(),
        "reviewedByPerson": site["reviewedByPerson"],
        "lonEastDeg": round(position["lonEastDeg"], 6),
        "latDeg": round(position["latDeg"], 6),
        "position": {key: position[key] for key in ("what", "source", "sourceUrl", "why", "whySourceUrl") if position.get(key)},
        "landing": site.get("landing"),
        "data": site.get("data", []),
        "problems": site.get("problems", []),
    }
    if "footprint" in position:
        entry["terrainFootprint"] = {
            **{key: round(value, 6) for key, value in position["footprint"].items()},
            "widthKm": round(position["footprintWidthKm"], 1),
            "heightKm": round(position["footprintHeightKm"], 1),
        }
    return entry


def build_sites() -> None:
    """Write sites.json: every site config, checked, for the globe's markers and details cards."""
    sites = config.load_all_site_configs(SITES)
    entries = [site_entry(site) for site in sites]
    DATA.mkdir(parents=True, exist_ok=True)
    temporary = DATA / "sites.json.tmp"
    size = records.write_json(temporary, {
        "contractVersion": records.CONTRACT_VERSION,
        "builtUtc": records.utc_now_iso(),
        "convention": "East-positive longitude from -180 to 180 and planetocentric latitude, in degrees.",
        "levels": {str(level): text for level, text in config.LEVELS.items()},
        "sites": entries,
    })
    temporary.replace(DATA / "sites.json")
    print(f"Site list: {len(entries)} sites, {size} bytes, written to {(DATA / 'sites.json').relative_to(REPO)}")
    for entry in entries:
        state = "built" if entry["built"] else "not built"
        print(f"  {entry['id']:<18} level {entry['level']}  {entry['lonEastDeg']:>11.5f} E  {entry['latDeg']:>10.5f} N  {state}")
    print("  Compare these positions with Mars Trek before trusting them.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Build the global Mars image and the site list for the globe.")
    parser.add_argument("--zoom-max", type=int, default=5, help="highest Web Mercator zoom to cut (default 5)")
    parser.add_argument("--only", choices=["image", "sites"], help="build just the image tiles or just the site list")
    arguments = parser.parse_args()
    if not 1 <= arguments.zoom_max <= 7:
        sys.exit("zoom-max must be from 1 to 7")
    if arguments.only != "sites":
        build(arguments.zoom_max)
    if arguments.only != "image":
        build_sites()
