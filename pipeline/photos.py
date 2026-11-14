# WHAT:    Stage 7: index of real rover photos taken at the rover's stops inside the box (F6).
# IN:      The rover's raw image feed (NASA's public address, one camera); the rover's stops with their positions.
# OUT:     photos.json under the site folder: for each photo its stop and position, sol, time taken, camera, pointing, addresses and credit.
# USED BY: build_site.py.
# RULES:   Only real photos, each with its credit. A photo is placed at a rover stop only when the feed's own site and drive
#          numbers match that stop exactly. Photos stay on NASA's server; only their addresses are stored.
# TRAPS:   PITFALLS 2. The feed is slow: about 100 requests for Bright Angel, kept in ../data/work/<site>/ after the first run.
# OWNER:   Role A.

import json
import pathlib
import urllib.parse
import urllib.request

import records

FEED = "https://mars.nasa.gov/rss/api/"
PAGE_SIZE = 100
# The left navigation camera: wide views of the ground around the rover, with the mast's pointing recorded.
INSTRUMENT = "NAVCAM_LEFT"
CAMERA_NAME = "Navigation Camera (left), on the rover's mast"
MAX_PER_STOP = 6
# Frames looking at the rover's deck or straight up say little about the ground ahead. Mast elevation is in degrees,
# negative below the horizon. Frames outside the wide range are never used.
ELEVATION_RANGE_DEG = (-35.0, 10.0)
# Nearer the horizon the rover's own deck is less often in view. A stop with at least this many such frames uses only those.
PREFERRED_FROM_DEG = -20.0
PREFERRED_ENOUGH = 3
MIN_SIZE_PX = (1200, 900)


def _number(text) -> float | None:
    try:
        return float(text)
    except (TypeError, ValueError):
        return None


def fetch_feed(first_sol: int, last_sol: int, cache: pathlib.Path) -> tuple[list[dict], str]:
    """Every left navigation camera frame from the sols given. Kept in `cache` so a rebuild does not ask again."""
    wanted = {"instrument": INSTRUMENT, "firstSol": first_sol, "lastSol": last_sol}
    if cache.exists():
        saved = json.loads(cache.read_text(encoding="utf-8"))
        if saved.get("wanted") == wanted:
            return saved["images"], "local working copy, first read from NASA's raw image feed"
    images, page = [], 0
    while True:
        query = urllib.parse.urlencode({
            "feed": "raw_images", "category": "mars2020", "feedtype": "json", "order": "sol asc",
            "num": PAGE_SIZE, "page": page, "search": f"|{INSTRUMENT}",
            "condition_2": f"{first_sol}:sol:gte", "condition_3": f"{last_sol}:sol:lte",
        })
        request = urllib.request.Request(f"{FEED}?{query}", headers={"User-Agent": "mars-site-builder"})
        with urllib.request.urlopen(request, timeout=120) as response:
            batch = json.loads(response.read().decode("utf-8"))
        images.extend(batch.get("images", []))
        total = int(batch.get("total_results", 0))
        if page % 10 == 0:
            print(f"  photo feed: {len(images)} of {total} records read")
        page += 1
        if not batch.get("images") or len(images) >= total:
            break
    cache.parent.mkdir(parents=True, exist_ok=True)
    cache.write_text(json.dumps({"wanted": wanted, "images": images}), encoding="utf-8")
    return images, "NASA's raw image feed"


def choose(images: list[dict], stops: dict[str, dict]) -> list[dict]:
    """Up to MAX_PER_STOP frames for each stop, spread around the compass of the mast.

    `stops` maps a stop's name, "site_drive", to its record with `lon` and `lat`. A frame is kept only if it is a
    full frame of useful size, its pointing is known and near the horizon, and its site and drive match a stop.
    """
    by_stop: dict[str, list[dict]] = {}
    for image in images:
        stop = f"{image.get('site')}_{image.get('drive')}"
        extended = image.get("extended") or {}
        azimuth, elevation = _number(extended.get("mastAz")), _number(extended.get("mastEl"))
        size = [_number(part) for part in str(extended.get("dimension", "")).strip("()").split(",")]
        if (stop not in stops or image.get("sample_type") != "Full" or azimuth is None or elevation is None
                or len(size) != 2 or None in size or size[0] < MIN_SIZE_PX[0] or size[1] < MIN_SIZE_PX[1]
                or not ELEVATION_RANGE_DEG[0] <= elevation <= ELEVATION_RANGE_DEG[1]
                or not (image.get("image_files") or {}).get("small")):
            continue
        by_stop.setdefault(stop, []).append(image)

    photos = []
    for stop, frames in sorted(by_stop.items(), key=lambda item: [int(part) for part in item[0].split("_")]):
        # One frame for each pointing, then an even spread around the mast's turn.
        unique = {(round(_number(f["extended"]["mastAz"])), round(_number(f["extended"]["mastEl"]))): f for f in frames}
        level = {key: f for key, f in unique.items() if key[1] >= PREFERRED_FROM_DEG}
        if len(level) >= PREFERRED_ENOUGH:
            unique = level
        ordered = sorted(unique.values(), key=lambda f: _number(f["extended"]["mastAz"]))
        step = max(1, len(ordered) // MAX_PER_STOP)
        for frame in ordered[::step][:MAX_PER_STOP]:
            record = stops[stop]
            photos.append({
                "id": frame["imageid"],
                "stop": stop,
                "lonEastDeg": round(float(record["lon"]), 7),
                "latDeg": round(float(record["lat"]), 7),
                "sol": int(frame["sol"]),
                "takenUtc": str(frame["date_taken_utc"])[:19] + "Z",
                # The feed writes Mars time as "Sol-01215M20:12:55.968": local mean solar time after the M.
                "localMeanSolarTime": str(frame.get("date_taken_mars", "")).split("M")[-1][:5] or records.NOT_FOUND,
                "camera": CAMERA_NAME,
                "mastAzimuthDeg": round(_number(frame["extended"]["mastAz"]), 1),
                "mastElevationDeg": round(_number(frame["extended"]["mastEl"]), 1),
                "smallUrl": frame["image_files"]["small"],
                "mediumUrl": frame["image_files"].get("medium", frame["image_files"]["small"]),
                "pageUrl": frame.get("link", ""),
                "credit": frame.get("credit") or records.NOT_FOUND,
            })
    return photos


def write_photo_index(folder: pathlib.Path, images: list[dict], stops_in_box: list[dict], origin: str) -> dict:
    """Write photos.json and return a short summary for the build to print."""
    stops = {str(stop["RMC"]): stop for stop in stops_in_box}
    photos = choose(images, stops)
    size = records.write_json(folder / "photos.json", {
        "contractVersion": records.CONTRACT_VERSION,
        "builtUtc": records.utc_now_iso(),
        "source": {
            "name": "NASA Mars 2020 raw images",
            "url": "https://mars.nasa.gov/mars2020/multimedia/raw-images/",
            "readFrom": origin,
            "framesRead": len(images),
        },
        "how": f"Up to {MAX_PER_STOP} full frames from the left navigation camera for each rover stop in the box, spread around the "
               f"mast's turn, looking between {ELEVATION_RANGE_DEG[0]:g} and {ELEVATION_RANGE_DEG[1]:g} degrees from the horizon, and "
               f"only above {PREFERRED_FROM_DEG:g} degrees where a stop has at least {PREFERRED_ENOUGH} such frames. "
               "A photo is placed at a stop only when the feed's own site and drive numbers match that stop.",
        "caveats": [
            "A photo shows the view from where the rover stood, about 2 m above the ground, on the day it was taken.",
            "Which way a photo faces on the map is not given: the mast's azimuth is stored as the feed gives it and we have not confirmed what it is measured from.",
        ],
        "photos": photos,
    })
    return {"photos": len(photos), "stopsWithPhotos": len({p["stop"] for p in photos}), "stopsInBox": len(stops), "bytes": size}
