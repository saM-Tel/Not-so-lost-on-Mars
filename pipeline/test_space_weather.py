# WHAT:    Tests for build_space_weather.py.
# IN:      Nothing. The notices below are made-up test fixtures written in the wording of real NASA notices.
# OUT:     Pass or fail.
# USED BY: pytest.
# RULES:   A forecast is taken only from a notice that states a time for Mars; nothing is filled in.
# TRAPS:   PITFALLS 8.
# OWNER:   Role A.

import build_space_weather

ALERT = {
    "messageType": "CME", "messageID": "FIXTURE-AL-001", "messageURL": "https://example.invalid/1",
    "messageIssueTime": "2026-11-10T13:06Z",
    "messageBody": "it is estimated that the CME may impact STEREO A (minor impact), Mars (glancing blow), and Psyche (glancing blow).\n"
                   "The leading edge of the CME may reach STEREO A at 2026-11-12T01:00Z and the flank of the CME may reach "
                   "Mars at 2026-11-13T12:00Z and Psyche at 2026-11-14T06:00Z (plus minus 7 hours).",
}
REPORT = {
    "messageType": "Report", "messageID": "FIXTURE-7D-001", "messageURL": "https://example.invalid/2",
    "messageIssueTime": "2026-11-11T21:02Z",
    "messageBody": "CME Starting time | Predicted Impacts (plus minus 7 hours)\n"
                   "2026-11-09T18:15Z Mars at 2026-11-13T12:00Z (glancing blow), Psyche at 2026-11-14T06:00Z (glancing blow)",
}
OTHER = {
    "messageType": "CME", "messageID": "FIXTURE-AL-002", "messageURL": "https://example.invalid/3",
    "messageIssueTime": "2026-11-12T09:00Z",
    "messageBody": "The Moon to Mars Space Weather Analysis Office estimates that the CME may impact Europa Clipper at 2026-11-15T12:00Z.",
}


def test_a_forecast_keeps_its_times_its_stated_window_and_its_notice():
    forecasts = build_space_weather.mars_forecasts([ALERT])
    assert forecasts == [{
        "arrivalUtc": "2026-11-13T12:00Z", "windowHours": 7, "kind": "glancing blow",
        "issuedUtc": "2026-11-10T13:06Z", "messageId": "FIXTURE-AL-001", "messageUrl": "https://example.invalid/1",
    }]


def test_the_same_arrival_is_listed_once_from_the_newest_notice():
    forecasts = build_space_weather.mars_forecasts([ALERT, REPORT])
    assert len(forecasts) == 1 and forecasts[0]["messageId"] == "FIXTURE-7D-001"


def test_a_notice_that_only_mentions_mars_is_not_a_forecast():
    assert build_space_weather.mars_forecasts([OTHER]) == []
