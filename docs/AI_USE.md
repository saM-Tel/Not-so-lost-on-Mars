# AI use log

The submission must say where and how we used AI. Add a line for each working session, on the day. Be specific about what the AI did and what a person checked.

| Date | Person | Tool | Used for | Checked by a person |
|---|---|---|---|---|
| 13 Nov 2026, before the event | Team owner | Claude Code (Claude Sonnet 5.5, then Claude Fable 5.2) | Research on the event rules and on NASA data sources; testing that public NASA data addresses respond; writing the planning documents in `docs/`, the `AGENTS.md` and `CLAUDE.md` guides in each folder, the two session commands in `.claude/commands/`, and `.gitignore`. Also wrote the setup prompt for the team data server. No project code, data processing or submission text | To be read and corrected by the team |
| 13 Nov 2026, before the event | Team owner | Claude Code | Used the PDS Orbital Data Explorer search service to find 1 m HiRISE terrain models at seven landing sites, the Jezero geologic map package (USGS SIM 3464), and six MRO CRISM mineral products; wrote the download manifests and updated `docs/DATA_CATALOG.md`, `data/AGENTS.md`, `docs/STATUS.md` and `docs/SITES.md`. No project code, data processing or submission text | To be read and corrected by the team |
| Sat 14 Nov 2026, from 08:40 | Team owner | Claude Code (Claude Fable 5.2) | Checked the team data server's downloads against the source archives by file name and size; wrote the prompts used to diagnose and repair the server's download lists. Recorded the team owner's decisions (globe first; no AI co-author line on commits) in the docs. Generated the file scaffold: 55 source files holding only their header comments, the folder guides under `app/src/`, and the build settings for the app and the pipeline. Then wrote the pipeline code that builds the globe image and the site list, the nine site configs (positions copied from the terrain files' own labels, the rover waypoint files and NASA's catalogue pages), the app code for the globe, site markers, fly-in and details card, and the tests for all of it. Read the two official guides from saved PDFs and corrected the planning documents from them | To be read and corrected by the team |

## What we will state in the submission

Fill this in on Sunday from the log above.

- Tools used:
- What they were used for:
- What the team did without AI:
- AI-generated images, video or audio in the project: none
