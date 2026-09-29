# DocTalk state

Owner: Adhil. Milestones B3 (upload and ingest) and B4 (retrieval with page citations).

## Done

- Next.js 15 App Router, React 19, strict TypeScript, Tailwind v4.
- Auth.js v5 (`next-auth` 5.0.0-beta.32), Google provider only. JWT sessions. No database adapter and no users table.
- The viewer id is the Google account id (`token.sub`), copied onto `session.user.id`. Document lists use `visibleDocumentsWhere` (`is_demo OR user_id IS NULL OR user_id = viewer`) when `DATABASE_URL` is set.
- Middleware: `/`, `/documents`, `/sign-in`, and `/api/auth` are public. `/documents/:id` is allowed when that row is visible to the viewer. `/upload` and every other page require a session. `/api/chat` and `/api/documents` are public at the middleware so a signed-out viewer can open demo documents. The handlers enforce access: upload and delete require a session, and a question about a private document does too.
- When `DATABASE_URL` is unset, known sample ids and in-browser `local-` uploads skip the document lookup so the demo opens with no env vars. Questions on those samples stay in the browser. A configured database still fails closed on a missing or unavailable lookup.
- `/` is the landing page. `/documents` is the document list. With a database, the list and the upload dialog call `/api/documents`. Without one, the list stays on the three sample documents and the dialog keeps the file in the browser session.
- Signed-in upload is PDF only, 10 MB, and at most 5 documents per account. The browser uploads straight to Vercel Blob with `@vercel/blob/client` `upload()` and `POST /api/documents/upload` (`handleUpload`). That route requires a session, allows only `application/pdf`, caps the token at 10 MB, and reserves a document slot before it issues a token. After the upload, `POST /api/documents` checks that the private blob pathname belongs to that user, reads the file, and accepts it only when the bytes start with the PDF signature. Then it parses, chunks, and embeds. `DELETE /api/documents/:id` removes the caller's own row, its chunks, and the blob.
- Ingest parses each page with `unpdf`, chunks the text with the page number in `chunks.page` (and in metadata), embeds with the existing Gemini helper in small batches, and retries 429 with backoff. `documents.status` is `processing`, `ready`, or `failed`.
- Three original sample PDFs live in `/public/demo/` (a services agreement, an invoice, and a data policy). `npm run seed` reads those files, embeds them, and inserts `is_demo` rows whose `file_url` is the static path. It skips a file that is already seeded. If `GEMINI_API_KEY` is missing it exits without writing.
- `/api/chat` embeds the question, takes a cosine top-k over that document's chunks (`<=>`, the operator for HNSW index `chunks_embedding_hnsw_idx`), and asks Gemini to answer only from those passages. The JSON body is `{ answer, citations: [{ page, excerpt }] }`. If the passages do not contain the answer, the answer is `That is not in this document.` and `citations` is empty. A provider 429 or 402, or the signed-out daily cap, returns `Demo limit reached, try again later`.
- Signed-out demo questions are capped at 20 per IP per UTC day. The counter is one `settings` row updated with `INSERT ... ON CONFLICT DO UPDATE ... RETURNING`, so two questions at the same time cannot both pass the cap. The 5-document limit uses the same kind of statement and inserts the pending document in that statement. Signed-in questions are not capped. OpenRouter is still the optional fallback when both `OPENROUTER_API_KEY` and `OPENROUTER_MODEL` are set.
- With `DATABASE_URL` set, the workspace posts questions to `/api/chat`. `Source p. N` chips use the returned citations and move a `react-pdf` viewer to that page of the real PDF. Demo files are served from `/demo/...`. Private blob bytes are streamed through `/api/documents/:id/file` after the same visibility check. The document list does not include blob URLs. Without `DATABASE_URL`, the HTML sample pages and in-browser answers stay in place.
- Embeddings use the Gemini API. `EMBEDDING_MODEL` defaults to `gemini-embedding-2` at 768 dimensions. Vectors are L2-normalized when their norm is not already 1. Chat defaults to `gemini-3.5-flash-lite`.
- `getDb()` still connects on the first query. Importing `src/db/index.ts` does not require `DATABASE_URL`. The document list does not call `getDb()` when `DATABASE_URL` is unset.
- The app layout exports `dynamic = "force-dynamic"`, so Next.js does not run those queries during `next build`.
- Vitest covers page-numbered chunking, PDF parse of the sample invoice, upload validation and the 5-document cap, the upload token route, the atomic document slot and IP counters, citation building, the not-in-document path, embedding 429 retry, and the earlier auth, visibility, and rate-limit tests.
- GitHub Actions (`.github/workflows/ci.yml`) is unchanged: Node 22, `npm ci`, lint, `tsc --noEmit`, `npm test`, `npm run build`. No env vars.

Copy on the screens is plain. These labels are not shown: deterministic passage verification, exact coordinates verification, zero latency page indexing, verified passages, deterministic match, and match 100%.

The footer on these screens says Built by Adhil Shanif and links to https://github.com/shanifadhil33-blip/doctalk.

## Next

- UI polish beyond the current screens
- Landing page content

## Decisions

- User id is Google's OIDC `sub`. On sign-in, `profile.sub` is written to `token.sub`. `account.providerAccountId` is used only when `profile.sub` is missing. Later requests keep the stored `token.sub`. `session.user.id` is that same string, and `visibleDocumentsWhere` compares it to `documents.user_id`.
- JWT sessions only. A users table is not required for the visibility rule.
- `trustHost: true` so Auth.js accepts the request host without `AUTH_URL`. `AUTH_SECRET` is required for a real session. When it is unset, `auth()` returns no session, which lets `next build` finish with no env vars.
- The document list is public. With a database it shows only rows `visibleDocumentsWhere` allows, including a signed-out viewer seeing demo and null-owner rows. Without a database it shows the three HTML sample documents.
- A document URL is public only after a visibility lookup when `DATABASE_URL` is set. If that lookup is missing or unavailable, a signed-out request goes to sign-in and a signed-in request gets 404. Without `DATABASE_URL`, sample slugs and `local-` ids are allowed so the demo still opens.
- Screen headers own the chrome. The old `max-w-6xl` app wrapper is not used, so the workspace can span the window. The page viewer grows and the chat stays 420px.
- Chat calls `generateText` with `maxRetries: 0`. Retrieval returns JSON (`answer` plus `citations`) so the workspace can attach `Source p. N` chips to the finished answer. A 429 or 402 still falls through to OpenRouter when that fallback is configured, then to `Demo limit reached, try again later`.
- OpenRouter is optional. It is not called unless both the key and `OPENROUTER_MODEL` are set. Model ids are not hardcoded beyond the Gemini defaults.
- Uploads use a private Vercel Blob store. Private Blob is generally available on every plan, including the free Hobby allowance (storage and operations are free until the Hobby limits, and extra usage is blocked instead of billed). Client `upload()` sets `access: "private"`. The store itself must be created as private. That choice cannot be changed later. The browser still receives its own upload result from the Blob SDK, and the follow-up request sends that URL back to the same user so ingest can run. API responses and other users never receive blob URLs. `/api/documents/:id/file` checks visibility, then reads the private blob with `get()`. Older public blob URLs, if any remain, are still proxied through that route and are not returned to the client. Pathnames keep a random suffix.
- Ingest does not run in `onUploadCompleted`. That callback cannot reach localhost, and the PDF signature has to be checked from the file bytes. The signed-in follow-up `POST /api/documents` does that check, confirms the blob path belongs to the reserved upload, then parses, chunks, and embeds.
- `chunks.page` is a nullable integer. New chunks set it. Older rows can still be read from `metadata.pageNumber`. `documents.status` defaults to `ready`.
- The HNSW migration `drizzle/0000_hnsw_cosine_embedding.sql` is the full initial schema. It was not applied. Do not run it against a database that already has these tables. For that database, apply `drizzle/0001_document_status_and_page.sql`, then `drizzle/0002_document_file_url_unique.sql`. A brand-new database runs 0000, then 0001, then 0002 (`npx drizzle-kit migrate` does that in order). `src/db/enable-pgvector.ts` still creates the `vector` extension, and 0000 does too. `documents.file_url` is unique so two reservations cannot claim the same upload.
- `gemini-embedding-2` normalizes 768-d vectors. The helper still normalizes when the L2 norm is not 1. Ingest embeds at most 100 chunks. A longer PDF is marked failed with `This PDF has too much text to process.`
- `.env.example` lists placeholders only. Gemini uses `GEMINI_API_KEY`. Blob storage uses `BLOB_READ_WRITE_TOKEN`.

## How to seed

1. Copy `.env.example` to `.env` and set `DATABASE_URL` and `GEMINI_API_KEY`. The seed script reads `.env`, not `.env.local`.
2. Apply the migrations with the note above. Do not apply 0000 if the tables already exist.
3. `npm run seed`

The script reads `/public/demo/*.pdf`. It inserts nothing when `GEMINI_API_KEY` is unset.

## Parked

- The generated migrations are not applied. Review them before running them.
- README says to copy `.env.example` to `.env.local`. `drizzle.config.ts`, `src/db/seed.ts`, and `src/db/enable-pgvector.ts` load `.env`.
- `npm audit` advisories were already present, including `glob` pulled in by `@vitest/coverage-v8`. Not changed here.
- Vitest stays on 3.2.7 with `@types/node` 20, for the same resolver reasons as B1.
- `public/pdf.worker.min.mjs` is copied from `pdfjs-dist` by `postinstall`. It is gitignored.

## Services

| Service | Plan | Where the key lives |
| --- | --- | --- |
| Auth.js Google | Free OAuth client | `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, named in `.env.example`. Values stay in local env and the host env. Not committed. |
| Neon Postgres | Not recorded in the repo | `DATABASE_URL`, named in `.env.example`. Not committed. |
| Gemini API | Free tier | `GEMINI_API_KEY`, named in `.env.example`. Used for embeddings and chat. Not committed. |
| OpenRouter | Optional free-model fallback | `OPENROUTER_API_KEY` and `OPENROUTER_MODEL`, named in `.env.example`. Not committed. |
| Vercel Blob | Free Hobby tier, private store | `BLOB_READ_WRITE_TOKEN`, named in `.env.example`. Not committed. Private access is included on Hobby. |
| GitHub Actions | Not recorded in the repo | Workflow stores no secrets. |
