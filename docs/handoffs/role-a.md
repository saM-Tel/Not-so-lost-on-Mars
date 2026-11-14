# Role A handoff

## 13 Nov 2026, role A, with Claude Code

Done:
- Researched 1 m HiRISE terrain models for seven landing sites (Viking 1, Viking 2, Pathfinder, Spirit, Opportunity, Phoenix, InSight) via the PDS Orbital Data Explorer.
- Found the Jezero geologic map package (USGS SIM 3464) and six MRO CRISM mineral products (~11.2 GB).
- Wrote download manifests: 759 new files, ~28.6 GB, to the team data server.
- Updated DATA_CATALOG, data/AGENTS, STATUS and SITES.

Not done:
- Nothing blocking. The new-batch server prompt has been handed to the server; both downloaders are now running.

Broken or risky:
- CRISM file list is rebuilt on the server from the PDS query; not yet verified against live URLs. Watch for FAIL/WARN in the new-batch log once CRISM starts.

Next:
- Confirm both units (`marsdata-download`, `marsdata-new-batch`) finish; check the new-batch log for FAIL/WARN on Saturday morning.

Files:
- docs/DATA_CATALOG.md, data/AGENTS.md, docs/STATUS.md, docs/SITES.md, docs/REFERENCES.md, docs/AI_USE.md

Other roles need to know:
- The team data server gains ~28.6 GB of new folders (raw/<site>/, raw/jezero/geology/, raw/jezero/crism/).

Checks:
- Manifest sizes computed from PDS KBytes; not yet downloaded.
