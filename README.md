# Container yard spot map

An interactive Georgian-language demo for assigning containers to numbered yard spots and finding their location by container number. The site plan is schematic and based on a user-provided satellite screenshot. The large gray rectangular area is excluded.

## Demo

- 30 spots in four rows (A–D), with a clear maneuvering lane and entrance.
- Sample container: `MSCU 742918-3` in spot `A02`.
- Search highlights a matching spot in green.
- Select a free spot to assign a container. A duplicate container or occupied spot is rejected.
- Mark a container as removed to free its spot.
- Reset restores the sample data.

Assignments are saved in the current browser's `localStorage`. This GitHub Pages demo does **not** synchronize records between employees or devices. A production rollout needs a shared database, employee access control, audit history, and on-site measurement of the yard and container clearances.

## Run locally

Open `index.html` in a browser, or serve this directory with any static web server. No build step or dependencies are required.

## GitHub Pages

Publish the `main` branch from the repository root. The page is a static site and requires no build workflow.
