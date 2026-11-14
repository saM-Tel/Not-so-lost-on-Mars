# How we work

Prepared 13 November 2026, before the event, as planning.

Three people and their AI tools work on this at different times. An AI session starts with no memory of any earlier session, and no person can see another's conversation. So everything a later session needs must be in the repository, in a place it will look.

Four things carry that knowledge:

| Thing | Answers | Lives in |
|---|---|---|
| Status board | What works, what is broken, who is doing what | [STATUS.md](STATUS.md) |
| Handoff notes | What the last session did and what comes next | `docs/handoffs/<role>.md` |
| Folder guides | What is in this folder and how to work in it | `AGENTS.md` in each folder |
| File headers | What this file is for, without reading it all | Top of every source file |

## A session, start to finish

### Start
1. `git fetch`, then pull. If there are local changes you did not make, stop and ask.
2. Read STATUS.md and the newest entry in each handoff file.
3. Read the guide for the folder you will work in.
4. Check the time against the deadlines. After Sunday 12:00 only fixes are allowed.
5. State the task and the plan before changing anything.

### During
- Take one task from the SPEC. Mark it "in progress" on the status board with your role, and push that small change, so nobody starts the same thing.
- Stay in your folder. The owner of a folder decides what goes in it.
- Before opening a large file, read its header. Before searching the whole repository, read the folder's file index.
- Never open files under `data/` or map tiles to "look at" them. They are large and binary. Read their metadata instead.
- Commit when a small piece works, if your human asks you to commit. Pull before every push.

### End
1. Run the folder's check command. Report the real result.
2. Update your rows on the status board.
3. Write a handoff entry (template below).
4. Bring headers and the folder's file index up to date.
5. Add any new sources and an AI-use line.
6. Propose a commit message. Commit and push only when your human says so.

Leave the main branch working. If something is half-built, keep it switched off or on a short branch, and say so in the handoff.

## Handoff entry

Newest entry at the top of your role's file. Keep it under 15 lines. Write it for someone who has never seen your session.

```
## Sat 14 Nov 16:40, role B, with Claude Code

Done: route worker returns a path between two clicked points (F3). Checked on bright-angel with 3 routes.
Not done: three-case statistics; elevation profile.
Broken or risky: path is a staircase near steep ground; smoothing not started.
Next: smooth the path, then recompute cost along it.
Files: app/src/route/worker.ts, app/src/route/cost.ts
Other roles need to know: A, I need `slope.u8` in the grid folder as the contract says; it is missing for bright-angel.
Checks: `npm run check` passes. Not tested on a phone.
```

## File header

Every source file starts with this, as a comment in the file's language. Twelve lines at most.

```
WHAT:    One or two sentences on what this file does, and the feature it serves (for example F3).
IN:      What it takes, with units and coordinate convention.
OUT:     What it returns or writes, with units.
USED BY: Files or folders that depend on it.
RULES:   What any change must keep true.
TRAPS:   Section numbers in docs/PITFALLS.md that apply.
OWNER:   Role A, B or C.
```

An example of a filled header:

```
WHAT:    Finds the least-effort walking route between two cells (F3).
IN:      Cost grid and keep-out mask from the site's grid folder; start and end as grid row and column.
OUT:     List of cells, total distance in metres, energy in kJ for three cases.
USED BY: app/src/ui/routePanel.ts
RULES:   Runs in a Web Worker. Out and back are computed separately. Step lengths use corrected cell spacing.
TRAPS:   PITFALLS 4, 6.
OWNER:   Role B.
```

Rules for headers:
- Describe what the file is now. No history, dates or names; git records those.
- Change the header in the same commit that changes what the file does.
- If you find a header that is wrong, fix it before anything else.
- Config files, generated files and data files do not need one.

## Folder guide

Each folder's `AGENTS.md` has these parts, in this order: purpose, owner, commands, what it reads and writes, rules for the folder, file index, known issues.

The file index is a table of file, what it does and which feature it serves. When you add, rename or delete a file, change the index in the same commit. Next to each `AGENTS.md` is a `CLAUDE.md` containing only `@AGENTS.md`, so Claude Code loads the guide when it reads files in that folder.

## Git

- One main branch. Small commits. Pull, then push, often.
- Prefix the message with the area: `app:`, `pipeline:`, `sites:`, `docs:`, `status:`.
- Status and handoff changes go in their own small commit so they merge cleanly.
- Never force-push, rewrite history, change commit dates or skip hooks.
- Processed map data is large and binary. Commit it only when it is stable, not after every rebuild, because every version stays in the history and everyone has to download it.
- A conflict in someone else's file is theirs to resolve. Ask.

## When two people need the same file

1. The folder owner decides.
2. If it is the data contract, both owners agree and the change is recorded in DECISIONS.md.
3. If it cannot wait, make the smallest change, and put it first in your handoff note.

## Keeping the AI's context useful

- The root brief stays short. Detail lives in documents that are read when needed.
- Give the AI the task, the SPEC entry and the folder. Do not paste whole documents.
- Start a new session for a new task. Use `/catchup` to load the state.
- One AI session per working copy at a time. Two sessions editing the same folder on one machine will overwrite each other.
