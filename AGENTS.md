# Briefing for AI assistants and new teammates

Prepared 13 November 2026, before the event, as planning. If you are an AI assistant working in this repository, read this whole file before you act. It is the shared brief for every tool the team uses.

## The project in one minute

We are the team "Not so lost on Mars" in the NASA Space Apps Challenge 2026, challenge "Interplanetary Survival Guide: Martian Map", Universal Event. Three people, 39 hours.

We are building **Tether** (working name): a static web app for an astronaut on a Marswalk. It shows a metre-scale layered map of a real place on Mars, plans a walking route a suited human can do, and shows how far they can go and still get home.

The product answers one question: **"Can I do this science and still get home safely?"** Every feature must help answer it. A feature that does not is out of scope, however impressive.

Three promises define the product:

1. **Hyperlocal.** Metre-scale detail over a few kilometres, not a global viewer. Mars Trek already does global.
2. **Human.** Routes, effort and limits for a person on foot in a suit, not for a rover.
3. **Honest.** Every layer shows where it came from and when. Every prediction shows a range. Nothing is invented.

## Deadlines (local time)

| When | What |
|---|---|
| Saturday 14 Nov 09:00 | Hackathon starts. No project code, data processing or submission text before this |
| Saturday 23:00 | All must-have features working; backup video recorded |
| Sunday 15 Nov 12:00 | Feature freeze |
| Sunday 21:00 | Submit |
| Sunday 23:59 | Official deadline |

## Hard rules

1. **Never invent data.** No made-up coordinates, values, dates or "realistic" placeholders. If data is missing, show "no data". Test fixtures must be named as such and never reach the deployed app.
2. **Every number shown to the user has a source, a date and a range.** The standard is in [docs/CONFIDENCE.md](docs/CONFIDENCE.md).
3. **Mars is not Earth.** Do not use any library function that assumes Earth's radius, gravity, day length or sea level. See [docs/PITFALLS.md](docs/PITFALLS.md).
4. **No backend, login, database, user accounts or chatbot.** The app is static files. Judges must be able to open one link and see it work.
5. **No AI-generated images or video, and no NASA logo,** anywhere in the app, the video or the project page. Use real NASA imagery with a credit line.
6. **Log AI use.** Add a line to [docs/AI_USE.md](docs/AI_USE.md) for each working session. The submission must disclose it.
7. **Cite everything.** Add each dataset, paper, library and image to [docs/REFERENCES.md](docs/REFERENCES.md) when you first use it.
8. **Keep git honest.** Commit only when your human asks. Small commits, truthful messages. No force-push, no history rewriting, no changed commit dates, no `--no-verify`.
9. **Must-haves first.** Work in the order set in [docs/SPEC.md](docs/SPEC.md). A finished hero site beats five half-built ones.
10. **English, plain words, SI units** in everything the user sees.
11. **The main branch always builds.** The public site deploys from it. Do not push something that breaks the check command.

## Working together across people and sessions

Three people and their AI tools work at different times. Nobody can see anyone else's conversation, so the repository is the only shared memory. The full method is in [docs/WORKFLOW.md](docs/WORKFLOW.md). The short version:

**When a session starts**
1. Fetch and pull. Read [docs/STATUS.md](docs/STATUS.md) and the newest entry in each file under `docs/handoffs/`.
2. Read the `AGENTS.md` in the folder you will work in.
3. Check the time against the deadlines above.
4. Say what you plan to do before you do it. In Claude Code, `/catchup` does steps 1 to 4.

**While working**
- One task at a time, from the SPEC, inside your own folder.
- Read a file's header comment before the file. Every source file has one; the template is in WORKFLOW.md.
- Need a change in someone else's folder? Do not make it silently. Write it in your handoff note, or ask your human to ask the owner.
- Change only what the task needs. No tidying or refactoring of files you were not asked to touch.
- If a guide or header disagrees with the code, the code is the truth. Fix the guide in the same commit.

**Before a session ends**
1. Run the folder's check command and report the result honestly.
2. Update your rows in docs/STATUS.md.
3. Add a handoff entry: done, not done, broken, next step, what other roles must know.
4. Make sure file headers and the folder's file index match what changed. In Claude Code, `/handoff` does steps 1 to 4.

## Layout

Folders hold only guide files until 09:00 Saturday.

```
app/                      TypeScript, Vite, MapLibre GL JS     owner: role B
pipeline/                 Python data preparation              owner: role A
sites/                    one config file per site             owner: role A
data/                     local working files; source data is read from the team data server; never committed
app/public/data/<site>/   processed outputs; written by the pipeline only
docs/                     plans, specs, logs                   owner: role C
```

Every folder has its own `AGENTS.md` with its purpose, commands, rules and a file index. The agreed shape of the files that pass from the pipeline to the app is in [docs/DATA_CONTRACT.md](docs/DATA_CONTRACT.md).

Stack: MapLibre GL JS for 2D and 3D, route planning in a Web Worker, Python with rasterio and numpy for data preparation, GitHub Pages for hosting. Do not add a framework, a build tool or a dependency without saying why in the commit message.

## Conventions

- **Coordinates:** planetocentric latitude, east-positive longitude, -180 to 180 inside the app. Convert at the boundary when a source uses 0 to 360 or west-positive.
- **Mars constants:** radius 3,396,190 m (the sphere the USGS products use), gravity 3.71 m/s², one sol 88,775.244 s. Defined once per language and imported everywhere.
- **Heights:** metres relative to the MOLA areoid. Never call it sea level.
- **Time:** store UTC in ISO 8601. Show Earth UTC and Mars local time with the sol number.
- **Radiation:** absorbed dose in gray, dose equivalent in sievert. Never convert one to the other 1:1.
- **Ids:** sites in kebab-case (`bright-angel`). Layers as `<type>-<source>` (`slope-hirise`).
- **Names carry units:** `distanceM`, `slopeDeg`, `energyKJ`, `doseUGy`.
- **Colour:** red means danger and nothing else. Use colour-blind-safe ramps. Overlays must stay readable on orange terrain.

## Document map

Read on demand. Do not load all of these at the start of a session.

| File | Read it when |
|---|---|
| [docs/STATUS.md](docs/STATUS.md), `docs/handoffs/` | Every session, first |
| [docs/WORKFLOW.md](docs/WORKFLOW.md) | You are unsure how we hand over, commit, or write headers |
| [docs/SPEC.md](docs/SPEC.md) | You are about to build a feature, display or prediction |
| [docs/DATA_CONTRACT.md](docs/DATA_CONTRACT.md) | Your work writes or reads pipeline outputs |
| [docs/CONFIDENCE.md](docs/CONFIDENCE.md) | You show any number, date or layer to the user |
| [docs/DATA_CATALOG.md](docs/DATA_CATALOG.md) | You need a data source, its address, dates or accuracy |
| [docs/SITES.md](docs/SITES.md) | You add or change a site |
| [docs/PITFALLS.md](docs/PITFALLS.md) | Before any work on maps, terrain, time, radiation or routing |
| [docs/DECISIONS.md](docs/DECISIONS.md) | You hit a choice that belongs to the team |
| [docs/PLAN.md](docs/PLAN.md) | You need the strategy, schedule, roles or cut lines |
| [docs/REVIEW_QUEUE.md](docs/REVIEW_QUEUE.md) | You find a large bug or a review too big for your task, or you look for known open problems |
| [docs/SUBMISSION_CHECKLIST.md](docs/SUBMISSION_CHECKLIST.md) | Sunday afternoon |
| [docs/REFERENCES.md](docs/REFERENCES.md), [docs/AI_USE.md](docs/AI_USE.md) | Every session, at the end |

## Definition of done

A task is done when all of these are true:

- It passes the acceptance checks in the SPEC, run with real data.
- The folder's check command passes.
- New and changed files have correct header comments, and the folder's file index lists them.
- Sources and AI use are recorded.
- You have said plainly what you tested and what you did not.

## When you are unsure

Ask your human. A wrong guess about Mars geometry, a rule, or a number costs more than a question. Items marked "check" or "not confirmed" in the docs are open; do not treat them as facts.
