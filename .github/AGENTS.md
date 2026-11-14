# .github: guide

## Purpose

Settings GitHub reads. Today that is one workflow, which publishes the app to GitHub Pages.

## Owner

Role B.

## Rules for this folder

- The workflow runs the app's check command before it publishes. Do not remove that step.
- It never runs the pipeline and never reads the team data server. The site is built only from what is committed.
- GitHub Pages must be switched on once by a repository admin: Settings, Pages, Source: "GitHub Actions".

## File index

| File | What it does | Feature |
|---|---|---|
| `workflows/deploy.yml` | On every push to main: installs, runs `npm run check` in `app/`, publishes `app/dist` to GitHub Pages | F8 |
