# WHAT:    Saves a snapshot of NASA's space-weather notices that forecast a solar eruption reaching Mars (F5).
# IN:      NASA DONKI notifications for the last 14 days, read through api.nasa.gov with its public demo key.
# OUT:     ../app/public/data/space-weather.json: when it was fetched, how many notices were read, and each forecast for Mars.
# USED BY: People and AI sessions from the command line: python build_space_weather.py. The app reads the file when the live feed fails.
# RULES:   Nothing is added to what a notice says. A forecast keeps its issue time, its arrival time and the uncertainty the
#          notice itself states. The snapshot always carries its fetch time, so the app can say how old it is.
# TRAPS:   PITFALLS 8, 10. The demo key allows only a few requests an hour; one run makes one request.
# OWNER:   Role A.

import datetime
import json
import pathlib
import re
import sys
import urllib.request

import records

REPO = pathlib.Path(__file__).resolve().parent.parent
OUT = REPO / "app" / "public" / "data" / "space-weather.json"
API = "https://api.nasa.gov/DONKI/notifications"
DAYS = 14

ARRIVAL = re.compile(r"Mars at (\d{4}-\d\d-\d\dT\d\d:\d\dZ)(?: \(([a-z ]+)\))?")
WINDOW = re.compile(r"plus minus (\d+) hours")
KIND = re.compile(r"Mars \(([a-z ]+)\)")


def mars_forecasts(notices: list[dict]) -> list[dict]:
    """Every arrival at Mars that the notices forecast, newest notice first. One entry for each arrival time.

    A notice is used only if it gives a time for Mars in the form "Mars at 2026-11-13T12:00Z". The uncertainty is
    taken from the same notice ("plus minus 7 hours") and is left empty when the notice does not state one.
    """
    found: dict[str, dict] = {}
    for notice in sorted(notices, key=lambda n: n.get("messageIssueTime", ""), reverse=True):
        body = notice.get("messageBody", "")
        for arrival, kind in ARRIVAL.findall(body.replace("\n", " ")):
            if arrival in found:
                continue
            window = WINDOW.search(body)
            stated = KIND.search(body)
            found[arrival] = {
                "arrivalUtc": arrival,
                "windowHours": int(window.group(1)) if window else None,
                "kind": kind or (stated.group(1) if stated else None),
                "issuedUtc": notice.get("messageIssueTime"),
                "messageId": notice.get("messageID"),
                "messageUrl": notice.get("messageURL"),
            }
    return sorted(found.values(), key=lambda f: f["issuedUtc"] or "", reverse=True)


def build() -> None:
    today = datetime.datetime.now(datetime.timezone.utc).date()
    start = today - datetime.timedelta(days=DAYS)
    url = f"{API}?startDate={start.isoformat()}&endDate={today.isoformat()}&type=all&api_key=DEMO_KEY"
    request = urllib.request.Request(url, headers={"User-Agent": "mars-site-builder"})
    try:
        with urllib.request.urlopen(request, timeout=90) as response:
            notices = json.loads(response.read().decode("utf-8"))
    except OSError as error:
        sys.exit(f"Could not read NASA's notifications, so the snapshot was left as it was: {error}")
    forecasts = mars_forecasts(notices)
    size = records.write_json(OUT, {
        "contractVersion": records.CONTRACT_VERSION,
        "fetchedUtc": records.utc_now_iso(),
        "periodFromUtc": start.isoformat(),
        "periodToUtc": today.isoformat(),
        "noticesRead": len(notices),
        "source": {
            "name": "NASA DONKI notifications, written by the Moon to Mars Space Weather Analysis Office",
            "url": "https://ccmc.gsfc.nasa.gov/tools/DONKI/",
            "credit": "NASA CCMC DONKI; Moon to Mars Space Weather Analysis Office",
            "disclaimer": "NASA calls these notices experimental research information. NOAA's Space Weather Prediction "
                          "Center is the official United States source for space weather forecasts.",
        },
        "forecasts": forecasts,
    })
    print(f"Read {len(notices)} notices from {start} to {today}; {len(forecasts)} forecast an arrival at Mars. Wrote {OUT.relative_to(REPO)}, {size} bytes")
    for forecast in forecasts:
        print(f"  issued {forecast['issuedUtc']}: Mars at {forecast['arrivalUtc']}, plus or minus {forecast['windowHours']} h, {forecast['kind']}")


if __name__ == "__main__":
    build()
