---
description: Load the project state before starting work. Optional argument: your role (A, B or C)
---

My role: $ARGUMENTS (ask me if this is empty).

Do these in order. Do not change any file.

1. Run `git fetch`, `git status` and `git log --oneline -15`. Tell me if this copy is behind the remote or has uncommitted changes.
2. Read `docs/STATUS.md` and the newest entry in each file under `docs/handoffs/`.
3. Read the `AGENTS.md` in the folder my role owns.
4. Compare the current local time with the deadlines in the root `AGENTS.md` and say which phase we are in. If it is before 09:00 on Saturday 14 November 2026, say that only planning is allowed.
5. Report in at most 15 lines: what works, what is broken, what the other roles are doing, anything they are waiting on from me, and the next task you recommend for my role from `docs/SPEC.md`.
