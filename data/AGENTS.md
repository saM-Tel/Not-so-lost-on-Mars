# data: guide

Prepared 13 November 2026, before the event, as planning.

## Purpose

Where data lives. Source files sit on the team data server and are read over the network. This folder holds only local working files. Only this guide is committed.

```
team data server     every source file, in full, read-only for the team
data/work/<site>/    local intermediate files the pipeline can rebuild
data/raw/<site>/     optional local copies, for working without the server
```

## Rules

- Never commit anything here except this guide. Git rejects files over 100 MB, and large files in history slow every clone.
- Do not open source or working files to inspect them. They are large and binary. Read sizes and metadata instead.
- Read source files by address from the team data server. If it cannot be reached, fall back to the original NASA or USGS address in [../docs/DATA_CATALOG.md](../docs/DATA_CATALOG.md). Say in the build output which one was used.
- The server address is a personal setting in an ignored `.env` file, never written into code or committed.
- The deployed app must never read from the team data server. It uses only the processed files in `app/public/data/`.
- Anything in `work/` can be deleted and rebuilt.

## Team data server (set up on 13 November)

The team owner's Ubuntu machine. It is a mirror of public NASA and USGS files plus a shared folder for large intermediate files. Nothing is developed on it, and its setup scripts live on that machine, not in this repository.

- **How to reach it:** install Tailscale and accept the team owner's share of the machine. The owner sends the address privately.
- **Where the address goes:** a file named `.env` in the repository root, with one line: `MARS_DATA_URL=<address>`. The file is ignored by git. Never put the address in code, in a commit or in a document.
- **What it serves:** an nginx web server, read-only, with partial downloads. Only reading is allowed; writes are refused.
- **The downloads:** the team owner started them on the evening of 13 November. The files stay unopened until 09:00 Saturday.

Web paths under the address:

```
/raw/jezero/    Jezero terrain and image files, exactly as downloaded; geology and minerals in subfolders
/raw/gale/      Gale terrain and image files
/raw/<site>/    one folder each for viking1, viking2, pathfinder, spirit, opportunity, phoenix, insight
/raw/feeds/     rover location files and the Curiosity weather feed
/raw/meda/      Perseverance weather archive; empty unless the second download stage is run
/shared/        large intermediate files worth sharing; only the owner can add to it
```

Checked on 13 November from the server itself and from the owner's laptop over Tailscale: a header request shows `Accept-Ranges: bytes`, a request for the first 100 bytes returns status 206, and a write attempt is refused.

Still to check:

- Each teammate can reach it from their own laptop.
- The transfer speed a teammate gets. They download at the server's upload rate, which has not been measured.
- After the server restarts, the download has to be resumed by hand.

## How much disk space

Sizes marked "measured" were read from the servers on 13 November. The rest are estimates.

### On the server: source files

| File | Size | Notes |
|---|---|---|
| Jezero terrain mosaic | 1.84 GB, measured | |
| Jezero image mosaic | 7.36 GB, measured | |
| Jezero context image and terrain | 0.05 GB, measured | |
| Jezero geologic map | 0.35 GB zipped, measured; about 1 GB unpacked, estimate | Unpack it on the server |
| Weather archive | About 23 MB per sol, measured | One season is about 1.4 GB. The full archive is about 43 GB |
| Jezero mineral products, 6 | About 11.2 GB, measured | |
| Gale terrain mosaic | 3.87 GB, measured | |
| Gale image mosaic | 24.4 GB, measured | |
| Seven other landing sites, 10 terrain model folders | 17.06 GB, measured | |

Everything in full, for every site, is about 110 GB: 37.5 GB for Jezero and Gale, 17.1 GB for the other sites, 11.6 GB for Jezero geology and minerals, and about 43 GB for the weather archive.

### On each laptop

| Item | Size | Notes |
|---|---|---|
| Working files | About 1 GB per site, estimate | |
| Processed outputs | Budget 120 MB per level 1 site, 50 MB per level 2 site | Hosting allows about 1 GB in total |
| Python environment | About 0.6 GB, estimate | |
| App dependencies | About 0.3 GB, estimate | |
| Repository history | Grows with every commit of processed data | Commit processed data only when stable |
| Screen recordings and video editing | About 5 GB, estimate | Role C |

With the server in use, a laptop needs about 3 to 5 GB, and role C about 8 GB.

### Without the server

If the server is not used, the data machine holds the source files itself:

| Plan | Uses | Free space to start with |
|---|---|---|
| Hero site only, image read in part | About 7 GB | 15 GB |
| Hero, Three Forks and Gale, with the Jezero image file in full | About 22 GB | 40 GB |
| Every site, without the Gale image file | About 47 GB | 60 GB |
| Every site and every file in full | About 70 GB | 100 GB |
