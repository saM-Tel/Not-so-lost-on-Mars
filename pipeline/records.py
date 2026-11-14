# WHAT:    Stage 9: writes layers.json and site.json, including file sizes. So far: the layer record check and the JSON writer.
# IN:      Layer records as dictionaries; source details from the config.
# OUT:     layers.json under the output folder.
# USED BY: build_globe.py, build_site.py, build_approach.py, weather.py, build_space_weather.py.
# RULES:   Every layer record is complete per docs/CONFIDENCE.md. A field that cannot be found is marked missing, not guessed.
# TRAPS:   PITFALLS 2.
# OWNER:   Role A.

import datetime
import json
import pathlib

CONTRACT_VERSION = 1

# What to write when a value was looked for and not found, or does not apply to this layer.
NOT_FOUND = "not found"
NOT_APPLICABLE = "not applicable"

# The fields of docs/CONFIDENCE.md section 1, in order. Every record carries every field.
LAYER_FIELDS = [
    "id", "title", "dataType",
    "mission", "instrument", "agency",
    "productId", "sourceUrl", "doi",
    "acquiredFrom", "acquiredTo", "published",
    "gridSpacing", "realDetail",
    "positionAccuracy", "heightAccuracy",
    "processing", "grade", "caveats", "credit",
]

# A layer may not ship if any of these is missing: the app's information card needs them all.
MUST_BE_KNOWN = [
    "id", "title", "dataType", "mission", "instrument", "agency", "productId", "sourceUrl",
    "acquiredFrom", "acquiredTo", "gridSpacing", "realDetail", "processing", "grade", "caveats", "credit",
]

DATA_TYPES = {
    "optical", "topographic", "thermal", "spectral", "geologic",
    "atmospheric", "radiation", "space weather", "in-situ",
}
GRADES = {"A", "B", "C", "D"}


def layer_record_problems(record: dict) -> list[str]:
    """Every reason this layer record may not ship. An empty list means it is complete."""
    problems = []
    for field in LAYER_FIELDS:
        if field not in record:
            problems.append(f"field '{field}' is absent")
        elif record[field] in (None, "", []):
            problems.append(f"field '{field}' is empty; write a value, '{NOT_FOUND}' or '{NOT_APPLICABLE}'")
    for field in MUST_BE_KNOWN:
        if record.get(field) in (NOT_FOUND, NOT_APPLICABLE):
            problems.append(f"field '{field}' must be known before the layer ships")
    if record.get("dataType") not in DATA_TYPES:
        problems.append(f"dataType '{record.get('dataType')}' is not one of {sorted(DATA_TYPES)}")
    if record.get("grade") not in GRADES:
        problems.append(f"grade '{record.get('grade')}' is not A, B, C or D")
    if not isinstance(record.get("caveats"), list):
        problems.append("caveats must be a list of sentences")
    return problems


def utc_now_iso() -> str:
    return datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def write_json(path: pathlib.Path, value) -> int:
    """Write JSON with stable formatting. Returns the size in bytes."""
    text = json.dumps(value, indent=2, ensure_ascii=False) + "\n"
    path.write_text(text, encoding="utf-8", newline="\n")
    return path.stat().st_size


def write_layers(folder: pathlib.Path, layers: list[dict]) -> int:
    """Check every record and write layers.json. Refuses to write an incomplete record."""
    for record in layers:
        problems = layer_record_problems(record)
        if problems:
            raise ValueError(f"layer '{record.get('id')}' is incomplete: " + "; ".join(problems))
    return write_json(folder / "layers.json", {
        "contractVersion": CONTRACT_VERSION,
        "builtUtc": utc_now_iso(),
        "layers": layers,
    })
