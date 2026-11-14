---
description: Close a session properly: checks, status board, handoff note. Optional argument: your role (A, B or C)
---

My role: $ARGUMENTS (ask me if this is empty).

Do these in order.

1. Run the check command from my folder's `AGENTS.md`. Report the real result. If there is no check command yet, say so.
2. Summarise this session's changes from `git status` and `git diff --stat`.
3. Update only my rows in `docs/STATUS.md`. "Works" means it passed its checks in `docs/SPEC.md` with real data.
4. Add a new entry at the top of `docs/handoffs/role-<my role in lower case>.md`, using the template in `docs/handoffs/README.md`. Under 15 lines. Write it for someone who has not seen this session. Say what was not tested.
5. For every file I added or changed, make sure its header comment is correct and its folder's file index lists it. Fix what is out of date.
6. Add any missing lines to `docs/REFERENCES.md` and `docs/AI_USE.md`.
7. Show me the handoff entry and a proposed commit message. Do not commit or push unless I tell you to.
