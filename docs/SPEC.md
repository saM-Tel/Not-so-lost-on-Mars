# Product specification

Prepared 13 November 2026, before the event, as planning. Features are listed in build order. Do not start a "should" before every "must" passes its checks.

Each feature states the astronaut's question it answers. If you cannot say which question a piece of work answers, stop and ask.

## Must have (Saturday 23:00)

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
- The link opens on the hero scenario with a route, the tether and one line of explanation already on screen. The address bar holds the state so any view can be shared.
- Checks: a first-time visitor understands the product within 10 seconds without clicking; reloading a copied link restores the same view.

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

### F14. Site picker
Question: "Where else could this work?"
- A Mars overview with every NASA landing site, each showing its readiness level and available data, per [SITES.md](SITES.md).

## Stretch

- F15. More sites: Three Forks, Gale boxwork, then level 2 sites built by the pipeline.
- F16. Two walkers or a rover drop-off and pick-up; route export; a live "link to Earth" indicator; rover models in the 3D view.

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
