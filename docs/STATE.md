# DocTalk state

## UI

Presentational screens follow the approved Stitch designs. They take data as props and read sample documents from `src/lib/demo-documents.ts`. These files do not import auth, the database, or API routes, so a later change can pass real records into the same components.

- `/` is the landing page.
- `/documents` is the document list, with search, sort, and grid or list layout.
- The upload dialog opens from the list. It accepts one PDF up to 10 MB, then shows upload and reading progress. A file chosen here stays in the browser session.
- `/documents/[id]` is the workspace. Sample documents show a page on the left and answers on the right. Citation chips read `Source p. N` and move the viewer to that page, with the passage highlighted.
- Uploaded files that are still in memory open in an iframe. The demo does not index them.
- `/upload` redirects to the document list with the dialog open.

Copy uses plain wording. These labels are not shown: deterministic passage verification, exact coordinates verification, zero latency page indexing, verified passages, deterministic match, and match 100%.

The footer on these screens says Built by Adhil Shanif and links to https://github.com/shanifadhil33-blip/doctalk.

Sign-in is a `GoogleSignInButton` with an `href` or `onClick`. It does not import an auth library.

The sample page viewer is HTML so a citation can highlight a passage. `react-pdf` was not added. An iframe is used only for a file the browser still has.

## Gates

`npm test` runs Vitest. The landing, document list, and workspace do not read the database, so `npm run build` does not need env vars for these screens.

Auth, middleware, `src/db`, and API routes are unchanged in this UI pass.
