# App review, Sat 14 Nov 2026, about 16:45

A read-only review of the app's map, route, safety, time and display-mode code by a larger model (Claude Fable), asked for by the team owner and pasted into the Claude Code session that makes the fixes. Copied here word for word, apart from this header. Each finding is tracked as an item in [../REVIEW_QUEUE.md](../REVIEW_QUEUE.md) (items R1 to R20); fixes are recorded there with their commits.

Line numbers refer to the code at commit 2ba63bb and will drift as fixes land.

---

**Scope.** This review covers the app's map, route, safety, time and display-mode code only. It was stopped before I read the pipeline, `app/pwa/sw.js`, `app/vite.config.ts`, `photos.ts`, `photoStrip.ts`, `layerPanel.ts`, `urlState.ts`, `zoomSelect.ts`, `scaleBar.ts` or any data file. Nothing was run in a browser or edited, and no `docs/AI_USE.md` line was added. Claims about MapLibre's internals are from memory of versions 3 to 5, not from the installed 6.18 source, and are marked "suspected".

## Summary

1. The style order of the imagery is right: the site image sits above all 27 rings. The order faults are the Sun shading above the analysis layers, keep-out jumping above the tether after a restart, and the rover-stop circles in the middle of the draped layers.
2. The most serious suspected bug is that the tether picture may not redraw on 3D ground when the slider moves. The most serious confirmed one is that the tether verdict uses the quickest way home, not the planned way back.
3. The tablet "shows nothing" because it prints "Working out the walk…" forever after a refused target, and its card covers the route and the bottom widgets.

## Findings

**1. Tether picture may stay stale on 3D ground**
- Severity: high.
- Where: app/src/map/routeLayer.ts:134-140.
- What: with terrain on, MapLibre draws draped layers into cached textures per terrain tile. `source.play()` on a canvas source only asks for a repaint, so the cache may keep the old tether.
- How it fails: at Bright Angel, drag "Time since leaving home" past 7 hours without moving the map. The white line does not move until the camera moves.
- Fix: test first. If it is stale, clear the cache after `putImageData` (in versions 3 to 5 this was `map.terrain.sourceCache.freeRtt()`), then `map.triggerRepaint()`. Also replace play-then-pause-on-render with `source.play(); source.pause();`, which uploads once instead of twice.
- Confidence: suspected; check by the steps above, and search `freeRtt` in `app/node_modules/maplibre-gl/src/` for the current name and its callers.

**2. Tether verdict and tablet margin use the quickest way home, not the planned one**
- Severity: high.
- Where: app/src/ui/routePanel.ts:158, used at lines 161-166 and 185-188.
- What: `farthestS` is the quickest cautious time home along the way out only. The drawn way back is the least-energy route and can take longer (`backS`), and the back leg is never checked.
- How it fails: a walk whose planned return takes 62 minutes can read "stays inside the tether" at a 60-minute limit. The tablet can show a positive margin and no alert while the planner says "Not enough time left".
- Fix: `const farthestS = Math.max(farthestFromHomeS(tetherFields.cautiousS, definition, lastAnswer.out.line), farthestFromHomeS(tetherFields.cautiousS, definition, lastAnswer.back.line), backS);`. Set the tablet alert in the "not enough time" branch too.
- Confidence: confirmed by reading the code.

**3. A restart leaves the old tether, verdict and numbers on screen**
- Severity: medium.
- Where: app/src/ui/routePanel.ts:464-472 and lines 577-583.
- What: after a slope-limit change or a rover move, only the route line is cleared. The old tether picture, verdict, route table, storm advice, daylight line and tablet state stay until the new worker answers.
- How it fails: change the limit to 15°. For 2 to 3 seconds the screen shows the 20° tether and "stays inside". If home is now unusable they stay for good, because `begin()` returns at line 560.
- Fix: put both restarts in one `restart()` that also calls `result.replaceChildren(); photos.show(null); when.setWalk(null); showVerdict(); showStorm();` and hides the tether layer until new fields arrive.
- Confidence: confirmed by reading the code.

**4. Keep-out is re-added above the tether and forgets its panel setting**
- Severity: medium.
- Where: app/src/map/routeLayer.ts:103-113.
- What: `showKeepOut` removes and re-adds the layer before `route-lines-edge`, so after any restart it sits above the tether. It also comes back visible at 0.4 opacity whatever the layer panel says.
- How it fails: hide keep-out in the panel, change the slope limit. Red is back, over the white line, with the box still unticked.
- Fix: if the source exists, call `updateImage({ url, coordinates })` on it and leave the layer alone. Otherwise add it before `route-tether` when that exists.
- Confidence: confirmed by reading the code.

**5. Rover check and confidence line show figures that do not apply**
- Severity: medium.
- Where: app/src/ui/routePanel.ts:298-313 and lines 277-279.
- What: `roverComparison` ignores `homeOverride`. The confidence text hard-codes "9 in 10 rover stops agreed within 4.0 degrees" and line 309 hard-codes "Perseverance".
- How it fails: move the rover, pick a science target. The card compares the rover's drive from the original home stop with a walk from somewhere else. A site with a grid but no rover check would show Bright Angel's statistic.
- Fix: return the empty line when `homeOverride` is set. Take the 4.0 figure and sample size from `loaded.validation`, and omit the sentence when absent. Use `loaded.site.mission` for the rover name.
- Confidence: confirmed for the code; whether the seven other sites have `grid` in `site.json`: check.

**6. Tablet shows "Working out the walk…" forever**
- Severity: medium.
- Where: app/src/ui/modes.ts:119-125; app/src/ui/routePanel.ts:152 and lines 385-390.
- What: any refused target sets the field state to null. The refusal reason goes to the route card, which is hidden in tablet mode. Map taps still re-target, and `stormAlert` survives a tap.
- How it fails: in tablet mode, tap red ground. The card says "Working out the walk…" and never changes.
- Fix: let `setState` take a message and pass `REFUSALS[answer.reason]` to it. Clear `stormAlert` inside `planTo`.
- Confidence: confirmed by reading the code.

**7. Tablet card covers the route and the bottom widgets**
- Severity: medium.
- Where: app/src/style.css:1002-1015; app/src/ui/modes.ts:156-161.
- What: the card sits over the bottom centre of a map that has just grown leftwards. Nothing re-frames the walk, and the scale bar, link-to-Earth line, weather banner and credit lie under or beside it.
- Fix: on entering tablet mode, after `map.resize()`, fit the map to the walk with bottom padding equal to the card's height. Add `body.mode-tablet .earth-link, body.mode-tablet .weather-banner { display: none; }`.
- Confidence: confirmed from the CSS; exact overlap: check in a browser.

**8. Sun shading sits above the analysis layers; rover stops split the draped layers**
- Severity: medium.
- Where: app/src/map/siteLayers.ts:99-103; app/src/map/overlays.ts:143.
- What: the hillshade is inserted just under the route layers, so it darkens slope, infrared, geology and the rover path. The rover-stop circle layer is not draped, so it cuts the draped layers into two texture passes.
- Fix: use the slot order below.
- Confidence: order confirmed; the cost of the split is suspected.

**9. Address bar written on every slider frame**
- Severity: medium.
- Where: app/src/ui/routePanel.ts:242-245.
- What: `updateUrlState` runs inside the animation-frame redraw. Safari throws after 100 `history.replaceState` calls in 30 seconds, and the throw would come before `showTether`.
- How it fails: on an iPhone, drag the slider for two seconds and the tether stops updating.
- Fix: move the URL update to a 300 ms debounce and wrap it in try/catch.
- Confidence: suspected; check whether `urlState.ts` already guards this.

**10. Sun shading uses Earth-scaled slopes and ignores Sun height**
- Severity: medium to low.
- Where: app/src/map/siteLayers.ts:91-96 and line 111.
- What: the shading source gives true Mars metres, but MapLibre works out slope from Earth-sized tile pixels, so slopes are shaded about 1.88 times too gentle. `hillshade-illumination-altitude` only has an effect when `hillshade-method` is not the default.
- Fix: multiply the three factors and `baseShift` by `MAPLIBRE_METRES_PER_MARS_METRE` for this source. Set `'hillshade-method': 'basic'` if the installed style spec has it.
- Confidence: the unscaled source is confirmed; MapLibre's behaviour is suspected, check the style spec in `node_modules`.

**11. Flight promise can resolve at the start of a flight**
- Severity: low to medium.
- Where: app/src/map/flight.ts:28-30, used at lines 34, 47 and 61.
- What: `moveend` is listened for before `flyTo`. `flyTo` first stops any running flight, which fires `moveend`.
- How it fails: click a second site during a fly-in. Overlays and the route card appear mid-flight and `flights` drops to 0 early.
- Fix: call `flyTo` first, then return the `moveend` promise. On the `jumpTo` path, return `Promise.resolve()`.
- Confidence: suspected; check by the steps above.

**12. Helmet arrow implies a direction in the photo**
- Severity: low to medium (honesty).
- Where: app/src/ui/modes.ts:137.
- What: the arrow is rotated by the compass bearing over a photo whose look direction is not confirmed (REVIEW_QUEUE item 10).
- Fix: keep the bearing as text and drop the rotation, or draw a small compass with "N" marked.
- Confidence: confirmed by reading the code.

**13. Widgets overlap**
- Severity: low.
- Where: app/src/style.css:1169-1173 against lines 329-333; lines 963-967 against 524-530.
- What: the link-to-Earth line (left 12, bottom 64) sits on the scale bar (left 12, bottom 56). The mode switch covers the route card's "Hide" button below about 1,120 px of window width and on phones.
- Fix: move `.earth-link` to `bottom: 96px`. Below 1,120 px, put the mode switch at `top: auto; bottom: 12px; right: 12px`.
- Confidence: suspected from the CSS; check in a browser.

**14. Small items**
- Severity: low for all.
- app/src/map/approach.ts:36-37: rings are sorted by site first, so a later site's `wide` ring would cover an earlier site's finer rings if two sites were close. Sort by ring first. Latent today.
- app/src/map/approach.ts:53: 256-pixel tiles at zoom z are native at map zoom z − 1, so each ring appears one level late. Try `minzoom: tiles.minZoom - 1` (suspected).
- app/src/main.ts:32-38: problem boxes are never removed, stack on one spot, and have a red border for non-danger messages.
- app/src/ui/routePanel.ts:530: no-data cells are drawn red and described as "steeper than". Say "or has no data".
- app/src/ui/timeSlider.ts:112: time before sunset is printed as a clock ("03:12 before sunset"). Use a duration.
- app/src/style.css:1059-1061: the Storm button is outlined red all the time.
- The headers of `routePanel.ts`, `siteLayers.ts` and `style.css` still say "Still to add" for things that are built.

## The five layer questions

1. **Actual order at Bright Angel**, bottom to top: `space`, `image-viking`, the 27 rings (by site, then wide, mid, near), `site-image`, the 18 hidden `site-columns-*`, the overlays in `layers.json` order, `site-sun-shading`, `route-keep-out`, `route-tether`, `route-lines-edge`, `-out`, `-back`. The differences from the intended order are findings 4 and 8.
2. **Rings over the site image:** no. `site-image` is inserted above every ring. Rings show through only where the site tiles are transparent, which is intended.
3. **Terrain edge:** outside the terrain source's bounds MapLibre draws the ground at 0, and inside it draws (height − lowest) × 1.88. So the outer edge is seamless only if the easing ends exactly at `lowest`. I did not read `pipeline/tiles.py`, so the easing is not checked. The seven sites with no surround will show a wall where edge tiles end.
4. **Brightness and position mismatch:** not assessed; it needs the pipeline and a look in the browser. One thing visible from the app code is that the tether's dimming stops at the box edge, so the box reads as a dark square against the brighter rings.
5. **Tablet and helmet resize:** the resize is handled by `setMode`, and by MapLibre's own resize tracking if it is on by default as I remember. The faults are findings 6, 7, 12 and 13.

## Correct layer order

Add hidden anchor layers once in `main.ts`, after `addApproachLayers` and before `addSiteMarkers`. Each is `{ id, type: 'background', layout: { visibility: 'none' } }`. Every `addLayer` then passes its slot's anchor as `beforeId`.

| Order | Layers | Insert before |
|---|---|---|
| 1 | `space`, `image-viking` | none |
| 2 | rings: all wide, then all mid, then all near | `slot-image` |
| 3 | `site-image` | `slot-image` |
| 4 | `site-sun-shading` | `slot-shading` |
| 5 | `overlay-thermal-*`, `overlay-slope`, `overlay-geology-*` and its edge, rover path edge and line | `slot-overlays` |
| 6 | `route-keep-out` | `slot-keep-out` |
| 7 | `route-tether` | `slot-tether` |
| 8 | `route-lines-edge`, `-out`, `-back` | `slot-route` |
| 9 | rover-stop circles | `slot-points` |
| 10 | `site-columns-*`, then the page pins | none |

The changes are:
- `approach.ts`: sort by ring first and pass `slot-image`.
- `siteLayers.ts`: lines 40 and 99-103.
- `overlays.ts`: every `addLayer`.
- `routeLayer.ts`: the three line layers, keep-out and the tether.

## Speed, in order of payoff

1. **Skip unchanged tether redraws.** With a 1-hour limit, `allowedS` is 3,600 for every slider position up to 7 hours. Remember the last `allowedS` and fields in `drawTether` and return early.
2. **Make `tetherPicture` cheaper** (app/src/safety/tether.ts:23-63). The inner loop allocates a neighbour array per cell and uses `picture.set` per pixel. Write the four neighbours inline, write through a `Uint32Array` view, and reuse the buffers. Measure with `performance.now()` round the call.
3. **Build the slope picture only when the layer is first switched on** (app/src/map/overlays.ts:89-107). It starts hidden, yet costs a 2.4 MB fetch, two array allocations per cell at line 73 and a PNG encode at site open.
4. **One draped stack** (finding 8), then record a performance profile while tilting at Bright Angel.
5. **Rings for the site in focus only** (REVIEW_QUEUE item 6): 3 sources, not 27.
6. **Skip `tidyNames` while markers are hidden** (app/src/map/siteMarkers.ts:141-162).

## Fix plan

1. `routeLayer.ts`: findings 1 and 4. Check the slider moves the line on 3D ground, and that keep-out keeps its panel state after a slope change.
2. `routePanel.ts`: findings 2, 3, 5, 6 and 9, and speed item 1. Check a walk near the limit, a slope change, a rover move, and a tap on red ground in tablet mode.
3. Slots across `main.ts`, `approach.ts`, `siteLayers.ts`, `overlays.ts` and `routeLayer.ts`: finding 8, plus finding 10 in `siteLayers.ts`. Check the order with `map.getStyle().layers.map(l => l.id)`.
4. `modes.ts` and `style.css`: findings 7, 12 and 13. Check at 360 px and 1,024 px wide.
5. `flight.ts`, `tether.ts` and `overlays.ts`: finding 11 and speed items 2 and 3.
6. Run `npm run check` after each group.

## Things that look fine

- `mars/time.ts`: constants and steps match the Mars24 algorithm as I remember it, including 69.184 s for TT minus UTC.
- `mars/sun.ts`: azimuth is clockwise from north; morning is east, noon at 18° N is south.
- `safety/oxygen.ts`: Weir arithmetic gives 20.4 kJ per litre.
- `safety/dose.ts` and the storm replay: gray and sievert each use their own rate; the replay compares gray with gray.
- `safety/storm.ts`: uses the cautious time home; goes home whenever it fits.
- `route/search.ts`: cost-to-home prices steps towards home; diagonals cannot cut keep-out corners; no-data cells are blocked.
- `route/worker.ts`: route chosen on the expected case, tether fields on least time for the cautious and expected cases.
- Worker lifetime on restart: the old worker is terminated before the new one starts, and stale tether promises are guarded by `stopWorker !== client.stop`.
- The click listener is added once and removed on leaving a site.
- `siteLayers.ts` terrain: exaggeration is the radius ratio; the hidden shading layer loads no tiles.
- `earthLink.ts`: one-way time is half the feed's round-trip time; "no data" when the feed fails.
