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
| 14 Nov | The team owner took over roles A, B and C at about 15:00 after Joseph stopped, and hands back to Joseph at 16:55 | Decided by the team owner |
| 14 Nov | Build all landing sites (F15) and the extras (F16) on the 14th, ahead of the SPEC order, coding fast with little testing and fixing afterwards | Time. Decided by the team owner |
| 14 Nov | During fast coding, commit after each task but push only when the owner says; pushed at handover | So untested work does not reach the public site unannounced. Decided by the team owner |
| 14 Nov | "Launch as an app" means an installable web app (manifest and service worker), not a separate desktop build | Stays static files behind one link (rule 4). Decided by the team owner, built that way |
| 14 Nov | The helmet view is offered only when a real rover photo near the target has loaded | It was often empty. Decided by the team owner |
| 14 Nov | Large bugs and reviews go to docs/REVIEW_QUEUE.md, for a larger model or a person to review; one app review was done and logged | Decided by the team owner |
| 15 Nov | Joseph handed the project over to the team owner, who now covers roles A, B and C and may change any file | Told to Claude Code by the team owner on Sunday morning |
| 15 Nov | A walk through several stops goes into the shareable link with its stops and the minutes at each (`stops=lon,lat,min;...`, in place of `to=`). A refused point is not written to the link (review item S7) | F7 says a copied link must open the same view; writing only the last stop opened a different walk with a different verdict. The owner left the choice to Claude Code ("use your best judgment") |
| 15 Nov | Walking the planned route in the walk-through stands still at each stop for its time (review item S13) | The card counts time at stops in the tether, so the playback's clock, margin and relay times must match it. The owner left the choice to Claude Code |
| 15 Nov | The tether verdict and the margin chart use one rule: each point of the walk is checked against the moment the walker is there, with time at stops, and the planned way back counts on the way home (review items S5 and R3) | The two disagreed. Made with the bug fixes the owner asked for |
| 15 Nov | Gale is built as a second full site, on the boxwork of Mount Sharp: a 3 km box centred on Curiosity's Altadena drill stop (116_1944), home and targets at Curiosity's own stops | Asked for by the owner ("if we have the data then do the second full site"); the boxwork is the challenge statement's own example, and the box was chosen by Claude Code from NASA's 2025 boxwork articles and the rover's log |
| 15 Nov | The Helmet button opens the walk-through's first-person view under the visor at any built site, in place of the concept view over a rover photo (which replaces the 14 Nov rule that the helmet is offered only with a photo) | Asked for by the owner: "when clicking on the helmet concept it should load the first person mode so we can see the visor" |
| 15 Nov | Zooming out of a chosen site past zoom 3.5 lets it go and shows all sites, leaving the camera where the person put it. Sites are still chosen by zooming in from zoom 4, so the half step between them stops a view at the border from choosing and letting go again | Asked for by the owner: "zooming out of a site enough should deselect it and put us into all sites mode" |
| 15 Nov | While steering in the walk-through, the quickest walkable way home is drawn on the ground in blue and the visor's arrow follows it, not a straight line home | Asked for by the owner for first-person free roam with the visor |
| 15 Nov | AI use is acknowledged inside the project: in text (the README section "How AI was used", [AI_USE.md](AI_USE.md), a line under the intro in the app's side panel, and the map's credit line in every view) and in metadata (`generator` and `ai-assistance` tags in `index.html`, and the app manifest's description). The data files the pipeline writes carry no note of their own | The owner asked to "fix the fact AI was used in development"; the Project Submission Guide asks for descriptive text and metadata. This settles the proposal from 13 Nov, without the data-file note, which would need every site rebuilt |
| 15 Nov | Our own code, data files and text are released under the Apache License 2.0 (`LICENSE`) | The participant terms say original content must be free to use or under an open-source licence, and that NASA applies Apache 2.0 when a team names none. Chosen by Claude Code when the owner asked for the README to follow the terms; the owner agreed to push it on 15 Nov |

## Proposed, waiting for the team

| Proposal | Recommendation | Alternative |
|---|---|---|
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
| Whether teammates' AI tools may commit | Only when their human asks | |

## Answered from the official guides on 14 November

Read from the Project Submission Guide and the Judging and Awards Guide, both dated 13 November 2026.

- **Submission fields:** Project Name; High-Level Project Summary; Link to Project Demo; Link to Final Project; Detailed Project Description; Use of Super Intelligence (the guide's name for AI); NASA Data; Space Agency Partner Data and Other References. No word limits are given. Images (JPG, PNG, GIF, up to 10 MB) can be placed on the page; videos and documents cannot. Everything must be in English.
- **AI wording:** see the "AI use" row in [PLAN.md](PLAN.md) section 2. Two points need the team's attention: the guide says AI should not be used to come up with the idea, so our statement must say truthfully where the idea came from; and AI-written code and data must be acknowledged in descriptive text and metadata.
- **Global awards, ten:** Best Use of Science, Best Use of Data, Best Use of Technology, Galactic Impact, Best Mission Concept, Most Inspirational, Best Storytelling, Global Connection, Art and Technology, Local Impact.
- **Public or open-source repository:** neither guide requires it. The link to the final project must open with no password, permission or registration.
- **Unlisted video:** not mentioned. The demo link must be "publicly accessible" with no login. Test it in a private window.
- **Editing after submitting:** allowed until the deadline; only the last saved submission is judged.

## From the participant terms and conditions, read 15 November

Read from the text of the terms (updated 7 August 2026), which the owner pasted in.

- **Licence:** original content must be free to use without restriction or under an open-source licence (OSI). With no licence named, NASA distributes it under Apache 2.0. We name Apache 2.0 (`LICENSE`).
- **Third-party material:** must be free and public, or under an open-source licence. Every licence must be listed in the documentation we submit, or NASA will not post the project. The README lists them.
- **Citations:** every source must be cited, even open-source ones. Teams that do not cite resources can lose nominations, awards or winner status.
- **Not allowed in a submission:**
  - material that promotes commercial products or services;
  - personal details such as birthdays, addresses or phone numbers;
  - material we do not hold the rights to;
  - recognisable names, voices or likenesses of anyone under 18;
  - any person 18 or over shown without their agreement to NASA using their name and likeness.
- **Video:** it must be our own work, infringe no one's rights, and anyone shown must have agreed in writing. Submitting it grants the US government a free, perpetual licence to use it.
- **Identity:** participants take part as themselves, under their own names.
- **Export control:** nothing export-controlled (ITAR, EAR). Nothing in this project is.

## Still open

- The participant FAQ has not been read
