# Product specification

Prepared 13 November 2026, before the event, as planning. Features are listed in build order. Do not start a "should" before every "must" passes its checks.

Each feature states the astronaut's question it answers. If you cannot say which question a piece of work answers, stop and ask.

## Must have (Saturday 23:00)

### F14. Mars globe and site picker
Question: "Where on Mars can this work, and where do I start?"
- The app opens on a 3D globe of Mars with a tall marker at every NASA landing site, each showing its readiness level and available data, per [SITES.md](SITES.md). Clicking a marker flies down to the site and opens its details. At a built site the fly-in ends on the metre-scale map.
- Checks: every marker position has a cited source; a site that is not built says so and offers no route; the globe image shows its mission, dates and credit; markers never use red; the fly-in to Bright Angel ends on the hero scenario; "All sites" returns to the globe.
- The team owner moved this up from "should have" on 14 November and it is built first. It keeps its number so other documents still match.

### F1. Hero site map
Question: "What is this place like?"
- 25 cm imagery and 3D terrain for a 3 × 3 km box at Bright Angel, Jezero.
- Checks: loads from the public link in under 5 seconds on a mid-range laptop; pan, zoom and tilt work; a custom scale bar is correct for Mars; heights at three rover stops match the rover's own values within the stated terrain accuracy.

### F2. Layer panel with information cards
Question: "What do I know about the ground, and how well?"
- Layers: slope, keep-out areas, geology, rover path and stops. Each has an opacity control, a legend and a card built from its record in [CONFIDENCE.md](CONFIDENCE.md).
- Checks: every layer shows mission, instrument, dates, detail, grade and caveats; no layer appears without a complete record.

### F3. Route planner
Question: "How do I get to the science and back?"
- Click or pick targets. The app returns a walking route that avoids keep-out areas, with distance, time, energy, oxygen and an elevation profile.
- Checks: the route never crosses a keep-out cell; out and back are computed separately; results show three cases; a route appears in under 3 seconds; distances use Mars geometry.

### F4. The tether
Question: "How far can I go and still get home?"
- A boundary on the map from cost-to-home and the remaining budget. Suit settings can be changed. A warning appears when a route leaves the boundary.
- Checks: uses the cautious case; the boundary shrinks as elapsed time rises; standing at home gives the full budget; the expected-case line is drawn lighter outside it.

### F5. Dose and space weather
Question: "What is the radiation cost, and is a storm coming?"
- Dose for the planned walk, with a range. A banner with the latest NASA forecast that names Mars, with issue time and arrival window.
- Checks: gray and sievert are never mixed; the banner says "forecast"; a saved snapshot is used and labelled when the live feed fails.

### F6. Photos along the route
Question: "What will I see when I get there?"
- At route points near a rover stop, real photos taken there, preferring those facing the direction of travel.
- Checks: each photo shows sol, Earth date, camera and credit; no photo is shown more than a stated distance from where it was taken.

### F7. Opening state and shareable link
Question for the judge: "What is this?"
- The plain link opens on the globe (F14) with one line of explanation and Bright Angel marked as the place to start. A link that names a site opens on that site; for Bright Angel that is the hero scenario with a route and the tether already on screen. The address bar holds the state so any view can be shared.
- Checks: a first-time visitor understands the product within 10 seconds without clicking, on the plain link and on the Bright Angel link; reloading a copied link restores the same view.
- The split between the two links is proposed, not yet agreed. See [DECISIONS.md](DECISIONS.md).
- A walk through several stops keeps its stops and the minutes at each in the link, in place of the target (decided 15 Nov, DECISIONS.md).

### F8. Public site and repository
- Checks: the link works in a private browser window; the README explains what it is, how to run it and where the data comes from.

## Should have (Sunday 12:00)

### F9. Validation panel
- Terrain slope against rover tilt and terrain height against rover height at every stop in the box; one route compared with the rover's actual path. Reported with sample size and typical error.

### F10. Storm mode
Question: "A storm is coming. What do I do?"
- Compares returning home with sheltering against terrain and recommends one. Includes a replay of the 20 May 2024 event.
- Checks: the replay is labelled as a replay of a past event measured at Gale; terrain shelter is described as a small reduction; the default advice is to go home when time allows.

### F11. Time of day
Question: "When should I go?"
- A slider for local time showing typical temperature, pressure, ultraviolet and dust-devil likelihood for the season, with Sun height and computed shadows.
- Checks: values are labelled "typical"; the number of sols behind each value is shown; shadows are labelled as computed.

### F12. Thermal and mineral layers
- Night infrared as a guide to loose versus firm ground; mineral maps as science-target context. Both state their coarser detail.

### F13. Field tablet and helmet display
- The same data in two reduced layouts, described below.

### F17. Interface upgrade
Question: "Can I see at a glance whether I can get home, and trust what I see?"
- Added by the team owner on 14 November, 19:04: the interfaces are a bit rough. One design pass over all three displays below, so they look like one product and the verdict is the first thing seen. It follows the must-haves like every other "should"; the owner may move it earlier.
- Scope:
  - One set of design values in `app/src/style.css` (colours, type sizes, spacing, corners, shadows), and every panel moved onto them.
  - The desktop layout as described under Displays: layers on the left, route and safety on the right, profile and time along the bottom.
  - Route card: the verdict and tether margin at the top; route, oxygen and dose, photos, storm, when to go and sources in sections that open and close.
  - The controls at the top right (view switch, install, full map) grouped in one bar.
  - Loading, empty and "no data" states look the same everywhere.
  - Field tablet and helmet: no empty or half-drawn screens (the owner found them "janky and often empty" on 14 November); large type; cautious values only.
- Checks: screenshots at 360, 1,024 and 1,440 px wide show no overlap and no cut-off text; text contrast is at least 4.5 to 1 (WCAG AA) on panels and over the imagery; red only for danger; every number, source, date and range shown before is still shown; the F7 10-second test passes on both links; `npm run check` passes.
- Not part of it: new features; a UI framework or component library, unless the commit message says why.

## Stretch

- F15. More sites: Three Forks, Gale boxwork, then level 2 sites built by the pipeline.
- F16. Two walkers or a rover drop-off and pick-up; route export; a live "link to Earth" indicator; rover models in the 3D view.
- F18. Orbiters overhead: link and imaging coverage along a walk. Question: "Will I have a link, and could an orbiter see me, during this walk?" Asked for by the team owner on 14 November, 19:10, from Joseph's idea of orbiter passes.
  - On the globe: the Mars orbiters at their current predicted positions, with ground tracks, labelled "predicted position, from JPL Horizons, fetched <date>".
  - At a site, for a planned walk and its start time (F11): a timeline of when each orbiter is above the horizon seen from the site. Mark the stretches with no orbiter in view (no relay link) and with no camera-carrying orbiter high overhead in daylight (no chance of an orbital image). On the map, highlight the parts of the route walked during a gap.
  - Source: the JPL Horizons API gives each orbiter's azimuth and elevation seen from a point on Mars; checked on 14 November (DATA_CATALOG, Space environment). It does not answer calls from a browser, so the pipeline saves a table per site for a window of days and the app reads it. Show the fetch date and where each prediction ends.
  - Open; find a source or label as assumed: which orbiters relay for surface missions in November 2026 (Horizons notes no contact with MAVEN since 6 December 2025); the lowest elevation a relay link needs; which orbiters carry cameras and what counts as overhead for imaging. Being overhead does not mean an orbiter is imaging the walker: say "could see", never "sees".
  - Checks: the site's longitude is sent west-positive (PITFALLS, coordinates); pass times at Bright Angel match a second Horizons query for the same window; nothing is shown past the end of an orbiter's trajectory file; every gap shows its start and end in UTC and in Mars local time.
- F19. Walk-through. Question: "What does staying inside the tether feel like on the ground?" Proposed by the team owner on 14 November evening: a to-scale, low-detail 3D astronaut to show it all working.
  - A figure 1.8 m tall, drawn from a few simple raised shapes on the 3D ground (no new library), that the person steers with the arrow keys or W, A, S, D, or that walks the planned route on its own ("Walk the route") at a chosen speed-up, with the camera following.
  - It moves at the walking model's cautious speed for the slope underfoot, in Mars gravity, and cannot enter keep-out ground. A readout follows it: time gone, walk home from here (cautious), tether margin, whether a relay is in view (F18) and the Sun.
  - It is a demonstration of the tether, not a game: no score, no levels, no winning. (Out of scope below lists "a game mode"; the owner asked for this, and it stays inside that line.)
  - Walking the planned route stands still at each stop for its time, so the clock, the margin and the relay times match the route card (decided 15 Nov, DECISIONS.md).
  - Checks: the figure is 1.8 m tall on the map's scale; walking time matches the route card's cautious time for the same path within 5%; it never stands on a keep-out cell; the readout's walk home equals the tether field at that cell.
- Optional idea from Joseph, 14 November. Not scheduled; to pick up only if the must-haves and should-haves are done.
  - Day and night along the walk: whether the Sun is up at the start and for the whole walk, and when it sets. This extends F11 (time of day), which already plans Sun height and shadows.

## Predictions

| Prediction | Inputs | Method | Range from | Grade |
|---|---|---|---|---|
| Walk time | Slope, footing, speed model | Sum along the route | Three cases | C: lunar model applied to Mars |
| Energy and oxygen | The above, mass, gravity | Load-carrying model | Three cases | C |
| Tether and turnaround time | Cost-to-home, budget, elapsed time | One shortest-path pass from home | Cautious and expected lines | C |
| Dose for the walk | Duration, dose rate, sky exposure | Rate × time × shielding factor | Solar-cycle range | C at Jezero; A at Gale |
| Storm arrival | NASA forecast | Shown as issued | Arrival window | Forecast |
| Temperature, pressure, ultraviolet by hour | Weather archive, same season | Percentiles by local time | 10th to 90th percentile | A, "typical" |
| Dust-devil encounter chance | Published rate, route area, hours exposed | Chance of at least one, from the rate | Published rate range | A-based statistic |
| Sun height and shadows | Mars time algorithm, terrain | Geometry | Terrain error at shadow edges | B |
| Route confidence | Terrain quality along the path | Weakest stretch | Not applicable | Inherits |

## Displays

**Habitat planner (desktop).** Layer panel on the left, map in the centre, route and safety panel on the right, elevation profile and time slider along the bottom. Shows everything, including sources and all three cases.

**Field tablet.** The map, one large status card (distance to next point, tether margin, time to turnaround), and three large buttons: next target, go home, storm. Touch targets sized for gloves. Cautious values only.

**Helmet display.** Drawn over a real rover photograph. A bearing arrow, distance to the next point, a tether margin bar and a time to turnaround. One alert line. No map, no menus. It is a concept view to show what the same data looks like at the point of use, and is labelled as a concept.

## Out of scope

Accounts, saved profiles, a server, a chatbot, multiplayer, a game mode, machine-learning training, and any layer that does not change a decision.
