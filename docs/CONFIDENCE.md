# Dates and confidence standard

Prepared 13 November 2026, before the event, as planning.

The rule: **no layer without a date and a source, and no prediction without a range.** This is what makes the product trustworthy to an expert judge, and it is cheap if it is built in from the first layer instead of added at the end.

## 1. Every layer carries a record

Each site has one metadata file listing its layers. The app reads it to build the layer panel, the legend and the information card. A layer with an incomplete record does not ship.

| Field | Meaning | Example |
|---|---|---|
| id, title | Short id and display name | `terrain-hirise`, "Terrain height" |
| data type | Optical, topographic, thermal, spectral, geologic, atmospheric, radiation, space weather, in-situ | Topographic |
| mission, instrument, agency | Who measured it | MRO, HiRISE, NASA |
| product id, source address, DOI | Exactly which product | From the product page |
| acquired from, acquired to | When the measurements were taken | From the product label |
| published | When the product was released | From the product page |
| grid spacing | Size of one cell | 1 m |
| real detail | Smallest feature it truly resolves | About 3 to 5 m |
| position accuracy, height accuracy | With the percentile and the source | Under 6 m at the 93rd percentile |
| processing | What we did to it | "Cut to site box; slope over a 5 m baseline" |
| grade | A, B, C or D, defined below | B |
| caveats | What a user must not conclude from it | "Rocks under 3 m are not in this model" |
| credit | Credit line to display | NASA/JPL-Caltech/University of Arizona/USGS |

## 2. Confidence grades

| Grade | Meaning | Examples |
|---|---|---|
| A | Measured at this place by an instrument on the ground | Rover tilt at a stop; weather at the rover; radiation at Curiosity |
| B | Measured at this place from orbit | HiRISE imagery and terrain; CRISM minerals; THEMIS temperature |
| C | Measured somewhere else, or modelled, and applied here | Gale radiation applied to Jezero; a lunar walking model applied to Mars |
| D | An assumption or engineering judgement | Suit mass; reserve margin; effort multiplier on sand |

A result takes the lowest grade among its inputs. A walk time built from grade B terrain and a grade C walking model is grade C.

## 3. Dates and age

- Show the acquisition date, not the date we downloaded it.
- Show age in plain words: "imaged before the 2021 landing".
- Say what may have changed since: sand ripples move, rover tracks and hardware are not in old images, weather changes daily.
- For live feeds show "issued at" and "fetched at", both in UTC, and say when a saved snapshot is being shown instead of live data.
- Show Mars time next to Earth time: sol number, local mean solar time and season.

## 4. Words with fixed meanings

| Word | Use only when |
|---|---|
| Measured | An instrument recorded it at that place |
| Typical | A summary of past measurements for the same season and time of day |
| Forecast | A model's statement about the future, with an issue time |
| Modelled | Computed from other data by a stated method |
| Assumed | We chose it |
| Live | Fetched from the source within the last hour |

Weather from the archive is "typical", never "forecast" or "current". A predicted solar-eruption arrival is a "forecast", never a measurement.

## 5. Predictions come in three cases

Every prediction is computed for a favourable, an expected and a cautious case.

- The route is chosen with the expected case.
- Time, energy, oxygen and dose are then reported for all three along that same route.
- **Anything that protects the crew uses the cautious case:** the tether, the turnaround time and keep-out areas.
- Write ranges as "2 h 10 min (1 h 50 min to 2 h 45 min)".

The cases come from these parameters. Values are set on Saturday from the sources and recorded with their grade. Until a value has a source it is grade D and labelled "assumed".

| Parameter | Where the range comes from | Known so far |
|---|---|---|
| Slope at each cell | Terrain height accuracy and the baseline used | See section 6 |
| Walking speed | Spread in the Apollo data behind the speed model | To read from the paper |
| Effort on loose ground | Published terrain factors | To find |
| Body and suit mass | Published suit masses | To find |
| Metabolic model error | Reported error of the load-carrying model | To read from the paper |
| Background dose rate | Solar-cycle variation in Curiosity's record | 0.210 ± 0.040 mGy per day near solar maximum |
| Terrain shielding | Curiosity's measurement near a butte | 4% to 5% lower with 19% of sky blocked |
| Eruption arrival time | Verified error of the forecast model | About ±10 h at Earth; assume wider at Mars |
| Weather at a given hour | Spread across sols in the same season | 10th to 90th percentile band |
| Dust-devil rate | Published rate at Jezero | 2.0 to 3.0 per km² per sol |

## 6. Terrain uncertainty

- A 1 m grid does not mean 1 m detail. Studies of these terrain models find real detail of 10 to 20 image pixels, which is about 3 to 5 m here.
- Slope computed between neighbouring 1 m cells is mostly noise. Measure slope over a baseline of at least 5 m and state the baseline in the layer record.
- Use three slope classes, not two: passable, possibly too steep (within the error of the limit), too steep. Draw the middle class hatched.
- Mosaics have seams where source models meet, with height steps up to about 2.3 m. Build a seam and missing-data mask. A route that crosses the mask is flagged, and its confidence drops.
- Rocks smaller than the real detail are not in the terrain. Rock hazard must come from imagery or be shown as unknown.

## 7. Route confidence

A route's confidence is that of its weakest stretch. Show it as a coloured line under the elevation profile so the user can see which part is the doubtful one and why: seam, missing data, possibly steep, or outside rover-checked ground.

## 8. How each display mode shows uncertainty

| Mode | Shows | Reason |
|---|---|---|
| Habitat planner | All three cases, grades, sources and dates | Time to think |
| Field tablet | The cautious value; range and source on tap | Gloves, glare, limited attention |
| Helmet display | One cautious value and a colour state | A stressed user needs one number that is safe to trust |

## 9. Before anything ships

- [ ] The layer record is complete, including dates and credit
- [ ] The grade is set and matches section 2
- [ ] The words match section 4
- [ ] Predictions show three cases; safety uses the cautious one
- [ ] The source is in REFERENCES.md
