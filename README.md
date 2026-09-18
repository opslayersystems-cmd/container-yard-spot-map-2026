# Container yard spot map

An interactive Georgian-language demo for assigning containers to numbered yard spots and finding their location by container number. The map uses the user's clean satellite screenshot, registered against the second screenshot that marks the yard perimeter in red. The hand-drawn perimeter is redrawn as straight segments. The large gray area to the left is excluded. Spot footprints approximate the blue and red containers visible in the image; exact measurements require an on-site survey.

## Demo

- 58 spots in six perimeter rows (A–F), following the two-part yard footprint. A01–A06 and B06–B10 are removed to leave two access lanes at the top of the yard; D has 16 spots and F has 15.
- Container widths are 1.2 times the preceding half-width layout (23.4 map units in A–D; 24.6 in E–F). Lengths are 1.1 times that layout (137.5 in A–B, 123.2 in C/E/F, 126.5 in D). Gaps between neighboring spots equal 20% of their width (4.68 and 4.92 map units respectively).
- The red boundary now connects only clear corners with straight segments. Each spot's short door edge is parallel to its adjacent straight yard edge; its long axis is perpendicular. The rows avoid overlap and leave a central access aisle.
- The map is shown slightly zoomed out on desktop and phone so more of the yard is visible at once.
- Zoom buttons let phone users enlarge the spots for easier selection while keeping the wider overview as the default.
- The 52 user-provided container numbers are available as input suggestions. Their demo spot assignments are illustrative, not actual location claims.
- Sample container: `MSMU7709524` in spot `A07` in the demo only.
- Search highlights a matching spot in green.
- Select a free spot to assign a container. A duplicate container or occupied spot is rejected.
- Mark a container as removed to free its spot.
- Reset restores the sample data.

Assignments are saved in the current browser's `localStorage`. This GitHub Pages demo does **not** synchronize records between employees or devices. A production rollout needs a shared database, employee access control, audit history, and on-site measurement of the yard and container clearances. Do not use the demo map for physical pickup decisions.

The revised geometry uses a new local demo storage key, so earlier test placements are not reinterpreted as locations in the new layout. The previous browser data is left untouched.

## Run locally

Open `index.html` in a browser, or serve this directory with any static web server. No build step or dependencies are required.

## GitHub Pages

Publish the `main` branch from the repository root. The page is a static site and requires no build workflow.
