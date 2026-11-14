# docs: guide

## Purpose

The team's shared memory: what we are building, how, what is true about the data, and where things stand.

## Owner

Role C keeps this folder in order. Each document has its own rule for who changes it.

## Which document is the authority for what

| Question | Authority | Who changes it |
|---|---|---|
| What works now, who is on what | [STATUS.md](STATUS.md) | Everyone, own rows only |
| What the last session did | `handoffs/<role>.md` | That role only |
| What to build and how to check it | [SPEC.md](SPEC.md) | Team agreement |
| Shape of files between pipeline and app | [DATA_CONTRACT.md](DATA_CONTRACT.md) | Roles A and B together |
| How dates, grades and ranges are shown | [CONFIDENCE.md](CONFIDENCE.md) | Team agreement |
| Where data comes from | [DATA_CATALOG.md](DATA_CATALOG.md) | Whoever verifies a source |
| Which sites, at what level | [SITES.md](SITES.md) | Role A |
| Traps | [PITFALLS.md](PITFALLS.md) | Anyone who hits a new one |
| What the team has decided | [DECISIONS.md](DECISIONS.md) | After a person decides |
| How we work together | [WORKFLOW.md](WORKFLOW.md) | Team agreement |
| Strategy, schedule, cut lines | [PLAN.md](PLAN.md) | Team agreement |
| Sources and AI use | [REFERENCES.md](REFERENCES.md), [AI_USE.md](AI_USE.md) | Everyone, every session |
| What to submit | [SUBMISSION_CHECKLIST.md](SUBMISSION_CHECKLIST.md) | Role C |

## Rules for this folder

- State each fact in one place and link to it. Two copies drift apart.
- When you learn that something written here is wrong, correct it there and then. A wrong guide is worse than none.
- Mark what is confirmed and what is not. Never turn "not confirmed" into a fact by rewording it.
- An AI may propose a change to SPEC, CONFIDENCE, DATA_CONTRACT, WORKFLOW or PLAN, but a person decides.
- Hit a trap that is not in PITFALLS.md? Add it in one line, in the same commit as the fix.
