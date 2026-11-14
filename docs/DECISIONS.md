# Decisions

Prepared 13 November 2026, before the event, as planning. Add a line whenever the team settles something, so nobody and no AI reopens it.

## Decided

| Date | Decision | Why |
|---|---|---|
| 13 Nov | No commits, pushes or project work before Saturday 14 Nov 09:00 local | The hackathon starts then, and the FAQ says teams may not begin work on challenges earlier |
| 13 Nov | Challenge: Interplanetary Survival Guide: Martian Map, Universal Event | Team registration |
| 13 Nov | Source data lives on the team owner's Ubuntu server, shared read-only over Tailscale. The pipeline reads by address from `MARS_DATA_URL` in an ignored `.env` file and falls back to the original NASA and USGS addresses | Nobody needs the large files on a laptop. Set up by the team owner |
| 13 Nov | Source files are downloaded to the team data server on the evening before the event. They are not opened, converted or analysed until Saturday 09:00 | The team owner's download speed is slow, and fetching public files is not using them. Decided by the team owner |
| 14 Nov | The app opens on a 3D Mars globe with a tall marker at each NASA landing site. Clicking a marker flies to the site and shows its details (F14). It is now a must-have and is built first | Decided by the team owner. It puts the "any site" claim on the first screen |
| 14 Nov | Commits carry no AI co-author line and are made under the committer's own git identity. AI use is disclosed in [AI_USE.md](AI_USE.md) and in the submission | Decided by the team owner |
| 14 Nov | Routing grids use 4 m cells (4 x 4 cells of the 1 m terrain), stored as raw 32-bit floats: mean height and steepest slope. The pipeline marks nothing as keep-out. Layout in [DATA_CONTRACT.md](DATA_CONTRACT.md) | Matches the terrain's real detail of 3 to 5 m and keeps each file near 2.4 MB. Decided by Joseph, covering roles A and B |
| 14 Nov | The default slope limit for a person in a suit is 20 degrees, adjustable in the suit settings. Shown as grade C | NASA's Artemis III requirement that slopes for EVA be under 20 degrees (Ortiz 2025, in [REFERENCES.md](REFERENCES.md)). Grade C because it is a lunar requirement applied to Mars and the source does not say over what distance slope is measured; ours is over about 6 m. At Bright Angel 19% of routing cells are steeper. Decided by Joseph: use values from published sources |

## Proposed, waiting for the team

| Proposal | Recommendation | Alternative |
|---|---|---|
| How AI-written code and data are acknowledged, now that commits carry no AI line. The guide asks for "descriptive text and metadata" | A section in the README, [AI_USE.md](AI_USE.md), a note in the app's credits, and a metadata note in `index.html` and in the data files the pipeline writes | A plain "written with AI help" line in commit messages, which names no co-author |
| What each link opens on | The plain link opens on the globe. A link that names a site opens on that site; for Bright Angel that is the hero scenario with its route. Use the Bright Angel link in the video and on the project page | Every link opens on the hero scenario, with a button to reach the globe |
| The width of the "possibly too steep" band either side of the 20 degree slope limit | 4 degrees either side, so 16 to 24 degrees: at Bright Angel 9 in 10 of our slopes are within 4.0 degrees of the tilt the rover measured (116 stops). Not built yet. To decide with it: whether the cautious case treats 16 to 20 degrees as keep-out | 1.4 degrees, the typical difference, which would call far less ground doubtful |
| Which published figure goes with which of the three cases (built on 14 Nov in `app/src/route/cost.ts`) | Favourable: 1.6 m/s on the level (the Apollo-based model as published) and a 77 kg suit (Apollo). Expected: 1.0 m/s (Apollo's one-hour walk-back planning speed) and a 104 kg suit (NASA's initial Mars limit). Cautious: 0.75 m/s (Apollo's longer walk-back speed) and a 170 kg suit (xEMU). Person 82 kg in all three. Every figure is from Ogilvie and others 2026 or the SEXTANT model; the pairing is ours, grade D | Use one mass for all three cases and vary only speed |
| What the tether is made of (built on 14 Nov in `app/src/safety/`) | A time limit: you may be no further from home than the walk-back limit (1 hour by default, or 30 minutes), or the time left of an 8-hour walk if that is less, measured as the quickest walk home in the cautious case. All three figures are from Ogilvie and others 2026. No reserve is taken off | Add energy and oxygen budgets and a reserve once figures with sources are found |
| Hero site | Bright Angel, Jezero crater | Gale crater boxwork: matches the challenge's example and has radiation measured in place, but many teams will choose it |
| Product name | Tether | Homeward, Lifeline |
| Roles | A: data and science. B: app. C: story and submission | To assign by name |
| Demo format | 30-second video, slides as fallback | 7 slides |
| How many sites | Hero first; site picker for all sites at overview level; then Three Forks, Gale, and automatic level 2 sites as time allows | Hero only |
| App stack | MapLibre GL JS, Vite, TypeScript, static hosting on GitHub Pages | OpenLayers, which reads Trek tiles directly but has no 3D |
| Data preparation | Python with rasterio and numpy | GDAL command line, not installed on the lead machine |
| Git workflow | One main branch, small commits, pull before push, one owner per folder | Branch per person with pull requests |
| Licence for our code | To choose; check whether the submission guide requires open source | |
| Whether teammates' AI tools may commit | Only when their human asks | |

## Answered from the official guides on 14 November

Read from the Project Submission Guide and the Judging and Awards Guide, both dated 13 November 2026.

- **Submission fields:** Project Name; High-Level Project Summary; Link to Project Demo; Link to Final Project; Detailed Project Description; Use of Super Intelligence (the guide's name for AI); NASA Data; Space Agency Partner Data and Other References. No word limits are given. Images (JPG, PNG, GIF, up to 10 MB) can be placed on the page; videos and documents cannot. Everything must be in English.
- **AI wording:** see the "AI use" row in [PLAN.md](PLAN.md) section 2. Two points need the team's attention: the guide says AI should not be used to come up with the idea, so our statement must say truthfully where the idea came from; and AI-written code and data must be acknowledged in descriptive text and metadata.
- **Global awards, ten:** Best Use of Science, Best Use of Data, Best Use of Technology, Galactic Impact, Best Mission Concept, Most Inspirational, Best Storytelling, Global Connection, Art and Technology, Local Impact.
- **Public or open-source repository:** neither guide requires it. The link to the final project must open with no password, permission or registration.
- **Unlisted video:** not mentioned. The demo link must be "publicly accessible" with no login. Test it in a private window.
- **Editing after submitting:** allowed until the deadline; only the last saved submission is judged.

## Still open

- The participant FAQ and the terms and conditions have not been read
- A licence for our code
