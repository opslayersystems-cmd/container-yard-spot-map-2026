# Container yard spot map

An interactive Georgian-language demo for assigning containers to numbered yard spots and finding their location by container number. The map uses the user's clean satellite screenshot, registered against the second screenshot that marks the yard perimeter in red. The hand-drawn perimeter is redrawn as straight segments. The large gray area to the left is excluded. Spot footprints approximate the blue and red containers visible in the image; exact measurements require an on-site survey.

## Demo

- 24 spots in six perimeter rows (A–F), following the two-part yard footprint.
- Each spot's short door edge is parallel to its adjacent straight yard edge; its long axis is perpendicular. The rows avoid overlap and leave a central access aisle.
- The map is shown slightly zoomed out on desktop and phone so more of the yard is visible at once.
- The 52 user-provided container numbers are available as input suggestions. Their demo spot assignments are illustrative, not actual location claims.
- Sample container: `MSMU7709524` in spot `A02` in the demo only.
- Search highlights a matching spot in green.
- Select a free spot to assign a container. A duplicate container or occupied spot is rejected.
- Mark a container as removed to free its spot.
- Reset restores the sample data.

Assignments are saved in the current browser's `localStorage`. This GitHub Pages demo does **not** synchronize records between employees or devices. A production rollout needs a shared database, employee access control, audit history, and on-site measurement of the yard and container clearances. Do not use the demo map for physical pickup decisions.

## Run locally

Open `index.html` in a browser, or serve this directory with any static web server. No build step or dependencies are required.

## GitHub Pages

Publish the `main` branch from the repository root. The page is a static site and requires no build workflow.
