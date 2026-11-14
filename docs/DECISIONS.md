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

## Proposed, waiting for the team

| Proposal | Recommendation | Alternative |
|---|---|---|
| What each link opens on | The plain link opens on the globe. A link that names a site opens on that site; for Bright Angel that is the hero scenario with its route. Use the Bright Angel link in the video and on the project page | Every link opens on the hero scenario, with a button to reach the globe |
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

## Open questions to answer from the official guides

- Exact submission fields and any word limits
- Exact AI disclosure wording, and whether AI-generated media needs a watermark
- Names and definitions of the 2026 global awards
- Whether the code repository must be public and open source
- Whether a public video link may be "unlisted"
