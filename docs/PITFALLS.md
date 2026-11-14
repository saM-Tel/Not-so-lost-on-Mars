# Pitfalls: misreadings and problems ahead

Prepared 13 November 2026, before the event, as planning. Read the section for your area before you start. Most of these are mistakes an AI assistant or a tired human will make by default.

## 1. Misreading the challenge

| Misreading | What the challenge asks for |
|---|---|
| "Build a map of Mars" | A view of one place or route at the scale of a single excursion. The statement says existing tools are too regional |
| "Plan a rover drive" | A human on foot in a suit, possibly helped by a rover |
| "Add as many layers as possible" | Layers combined so they give "helpful context for navigating". Each layer must change a decision |
| "Safety is one feature" | "NASA's first priority is always astronaut safety." It is the centre of the product |
| "Science is decoration" | The crew must do "new and exciting science along the way". Targets need reasons |
| "Any Mars data will do" | NASA data must be the core. Partner-agency data is an extra, credited separately |
| "It is a game or a simulation" | It is a tool an astronaut could use |
| "Judges will explore the app" | Most will see a 30-second video and skim the page. The first screen must explain itself |

## 2. Rules and honesty

| Trap | Do this |
|---|---|
| Starting before 09:00 Saturday | Planning only until then |
| Placeholder or "realistic" sample data left in | Never invent data. Show "no data" |
| AI-generated pictures in the app or video | Real NASA imagery only, credited |
| Using the NASA logo | Do not |
| Forgetting to record AI use or sources | Update AI_USE.md and REFERENCES.md as you go, not at the end |
| Calling archive weather "current" or a forecast "measured" | Use the fixed words in CONFIDENCE.md |
| A dramatic radiation heat map | Radiation barely varies across a few kilometres. Show sky exposure, dose over time and storm response |
| Claiming terrain shelter protects the crew | Curiosity measured a 4% to 5% reduction. Say it is small |
| Rewriting history, force-pushing, changing commit dates | Never |

## 3. Mars is not Earth

| Trap | Do this |
|---|---|
| Distance functions in map libraries assume Earth's radius | Write our own with radius 3,396,190 m and use them everywhere |
| MapLibre's scale bar and terrain height assume Earth | Hide the built-in scale bar; set terrain exaggeration to about 1.88; draw our own scale |
| Treating a sol as 24 hours | A sol is 88,775.244 s. Use the Mars24 algorithm for local time and season |
| Sol numbers treated as one calendar | Each mission counts from its own landing |
| "Sea level" | Heights are relative to the MOLA areoid. Rover data has both a height and a radius; compare like with like |
| Earth gravity in effort formulas | 3.71 m/s² |
| Pressure read as hectopascals | Mars surface pressure is about 700 to 800 pascals |
| Air temperature confused with ground temperature | They differ by tens of degrees. Label which one |

## 4. Coordinates and projections

| Trap | Do this |
|---|---|
| Longitude conventions differ: 0 to 360 east, -180 to 180, and west-positive in old products | Convert at the boundary to east-positive, -180 to 180. Print the box built and compare it with Trek |
| Planetocentric and planetographic latitude mixed | Use planetocentric. The difference can reach a third of a degree |
| USGS mosaics use a grid true at the equator, so cells are narrower east to west than north to south at the site | Multiply east-west spacing by the cosine of the latitude (about 0.949 at Jezero) in slope and distance |
| Trek tiles fed to MapLibre | They are not Web Mercator. Cut our own tiles |
| Trek tile address order | Zoom, then row, then column. Zoom 0 has two tiles |
| Trek terrain layers used as heights | They are pictures. Use the USGS files |
| The Jezero geologic map is 100 to 200 m off the corrected base, in its own projection | Reproject with the supplied definition, shift by eye against known contacts, and state the offset |
| Assuming every terrain file uses the Jezero grid | The single-strip HiRISE models each have their own projection: a different latitude of true scale, sometimes a local radius, and polar stereographic for Phoenix. Read it from the file |
| A landing position copied from an old source | Older figures use other reference frames and often do not say which latitude type. NASA's catalogue figure for Pathfinder is about 20 km from the terrain model labelled as its site. Quote such a position as text with its source; do not plot it |
| Rover positions assumed to match the image exactly | They are localised against the same base map but can differ by metres. State it |

## 5. Terrain

| Trap | Do this |
|---|---|
| "1 m grid" read as "1 m detail" | Real detail is about 3 to 5 m |
| Slope between neighbouring cells | Mostly noise. Use a baseline of at least 5 m |
| Seams between source models look like cliffs | Mask seams and missing data; flag routes that cross them |
| Small rocks assumed absent because the terrain is smooth | Rocks under the real detail are invisible. Use imagery or say unknown |
| Missing-data values rendered as deep pits or spikes | Detect and mask the no-data value before tiling |
| Shadows in the image mistaken for dark material or hazards | The image has fixed afternoon lighting. Our computed shadows are a separate overlay |
| Old imagery treated as today's surface | State the acquisition date; ripples move; rover tracks are absent |
| One slope number used for everything | Use slope along the direction of travel for effort and the steepest slope for keep-out. A level path across a steep side-slope is still a hazard |

## 6. Routing

| Trap | Do this |
|---|---|
| Using outbound costs for the return | Uphill and downhill differ. Cost-to-home needs the reverse direction on every step |
| Searching from home with forward costs and calling it cost-to-home | That gives cost from home. Search from home using the cost of stepping towards the cell being expanded |
| A search shortcut that overestimates | The estimate must never exceed the true cost, or routes are not the best |
| Diagonal steps given the wrong length | Cells are not square on the ground. Compute each step length from the corrected spacing |
| Staircase routes that are longer than they should be | Allow more step directions or smooth the path, then recompute cost along the smoothed path |
| Routing on the main thread | Use a Web Worker with typed arrays |
| Choosing the route on the cautious case | Choose on expected; report all three; protect with cautious |
| A route through unknown ground presented as safe | Lower its confidence and say why |

## 7. People and suits

| Trap | Do this |
|---|---|
| Treating the walking model as validated for Mars | It comes from Apollo lunar data and load-carrying tests on Earth. Nobody has walked on Mars. Grade C, with a range |
| Units from Apollo-era documents | They use BTU per hour. 1 BTU per hour is 0.293 W |
| Suit mass ignored | Mass drives effort. Make it a setting with a cited default |
| Fast level-ground speed taken as realistic | The Apollo figures are an upper bound. Include a speed factor in the three cases |
| Too many numbers on the field displays | One cautious number per question |

## 8. Radiation and space weather

| Trap | Do this |
|---|---|
| Gray and sievert mixed | Absorbed dose in gray; dose equivalent in sievert. On Mars the ratio is about 3, not 1 |
| Micro and milli confused | Write units on every value |
| An eruption's arrival treated as a radiation storm | The forecast model predicts the arrival of solar wind and eruptions. Energetic particles can arrive earlier, and many storms never reach the ground |
| Every storm assumed to raise surface dose | The atmosphere stops lower-energy particles. Only the hardest events show at the surface |
| Gale measurements presented as Jezero measurements | Say "measured at Gale, adjusted for altitude" |
| Forecast arrival shown as a single time | Show a window. The model is typically wrong by about 10 hours at Earth |

## 9. Weather

| Trap | Do this |
|---|---|
| Using the Perseverance feed on mars.nasa.gov | It stops in April 2024. Use the archive |
| Trusting wind after 2022 | The wind sensors were damaged. Show coverage and say so |
| Counting every vortex as a dust devil | About one in five carries dust |
| Averaging across seasons | Use the same season as the planned date |
| Applying Gale weather to Jezero | Different sites. Do not |

## 10. Building and hosting

| Trap | Do this |
|---|---|
| Blank page on GitHub Pages | The site is served under the repository name. Set the base path in the build config and use relative asset addresses |
| Works on Windows, breaks when hosted | File names are case-sensitive on the host |
| Committing raw data | Never. Files over 100 MB are rejected and the repository becomes unusable. Ignore `data/raw/` |
| The deployed app reading from the team data server | Never. Judges must not depend on a home machine. The app uses only files in `app/public/data/` |
| A build failing because the team data server is off or slow | Fall back to the original NASA or USGS address and say which source was used |
| The server address written into code or committed | Keep it in an ignored `.env` file |
| Processed tiles too large | Set a size budget per site; fewer zoom levels; compressed formats |
| Live feeds blocked or rate-limited during judging | Try live, fall back to a saved snapshot, label which is shown |
| Remote images used as 3D textures | That needs permission headers on the image host. Use ordinary image elements, or check first |
| The demo depends on a slow computation | Ship a precomputed route for the opening state |
| New dependencies on Sunday | None after the freeze |
| Tests all fail on Windows with "Cannot read properties of undefined (reading 'config')" | The terminal's folder is spelled with a lowercase drive letter. Use `npm run check`, which starts the tests the right way |
| A blank map with MapLibre 6 under Vite | Its worker file must be given with `setWorkerUrl`. See `app/src/map/mapView.ts` |
| A new web address that judges' networks block | The guide suggests asking for a web filter classification for a new site. A `github.io` address avoids the question |
| Three people and several AIs editing the same files | One owner per folder; pull before push; small commits |
| An AI tidying or refactoring files it was not asked to touch | Change only what the task needs |
| An AI reporting success without running the code | Run it with real data and say what was tested |

## 11. Presentation

| Trap | Do this |
|---|---|
| Opening on an empty map | The globe opens with every site marked and one line of explanation. A site link opens on the hero scenario with a route and tether |
| A globe that looks like Earth | Switch off MapLibre's blue atmosphere glow. Use a real Mars mosaic with its credit |
| Rainbow colours; red used for decoration | Colour-blind-safe ramps; red for danger only |
| Overlays unreadable on orange ground | Test every layer on the real imagery |
| Jargon on screen | Plain words. Spell out terms on first use |
| Video made at the last minute | Record a backup on Saturday night |
| Submitting at 23:50 | Submit at 21:00 |
| Links that need a login | Open every link in a private window before submitting |
