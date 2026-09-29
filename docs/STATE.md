# DocTalk state

Owner: Adhil. Milestone B2 (auth and embeddings), with the approved screens wired to that auth.

## Done

- Next.js 15 App Router, React 19, strict TypeScript, Tailwind v4.
- Auth.js v5 (`next-auth` 5.0.0-beta.32), Google provider only. JWT sessions. No database adapter and no users table.
- The viewer id is the Google account id (`token.sub`), copied onto `session.user.id`. The document list filters with `visibleDocumentsWhere` (`is_demo OR user_id IS NULL OR user_id = viewer`) when `DATABASE_URL` is set.
- Middleware: `/`, `/documents`, `/sign-in`, and `/api/auth` are public. `/documents/:id` is allowed when that row is visible to the viewer. `/upload`, `/api/chat`, and every other route require a session. The document page repeats the same check when a database is configured.
- When `DATABASE_URL` is unset, known sample ids and in-browser `local-` uploads skip the document lookup so the demo opens with no env vars. A configured database still fails closed on a missing or unavailable lookup.
- Clerk packages, components, routes, and env vars are removed.
- Header Sign in and Sign in with Google submit Auth.js `signIn("google")`. A signed-in session shows the account name and Sign out.
- `/` is the landing page. `/documents` is the document list. The upload dialog accepts one PDF up to 10 MB. `/documents/[id]` is the workspace: page viewer on the left, cited answers on the right. Citation chips read `Source p. N` and move the viewer to that page.
- The viewer is flexible and the chat panel is a fixed 420px, so the pair fills the window at desktop width. The Export button is removed. The chat subtitle is the page count, such as `11 pages`.
- Sample answers use HTML pages so a citation can highlight a passage. `react-pdf` was not added. An iframe is used only for a file the browser still has. A stored row without page text shows the file name and says page text is not available in this view yet.
- `/upload` redirects to the document list with the dialog open. The route stays protected.
- Embeddings use the Gemini API. `EMBEDDING_MODEL` defaults to `gemini-embedding-2`. Requests set `output_dimensionality` to 768. Vectors are L2-normalized when their norm is not already 1. Key: `GEMINI_API_KEY`.
- `chunks.embedding` stays `vector(768)`. HNSW index `chunks_embedding_hnsw_idx` uses `vector_cosine_ops`. The Drizzle migration in `drizzle/` was generated and not applied.
- The seed script embeds chunk text before inserting a demo document. If `GEMINI_API_KEY` is missing it exits without writing and prints why.
- Chat answers come from the Gemini API. `CHAT_MODEL` defaults to `gemini-3.5-flash-lite`. If that call returns 429 or 402 and both `OPENROUTER_API_KEY` and `OPENROUTER_MODEL` are set, the route tries that OpenRouter model. If the providers are limited, the response is `Demo limit reached, try again later`. `google/gemini-pro` is removed.
- `getDb()` still connects on the first query. Importing `src/db/index.ts` does not require `DATABASE_URL`. The document list does not call `getDb()` when `DATABASE_URL` is unset.
- The app layout exports `dynamic = "force-dynamic"`, so Next.js does not run those queries during `next build`.
- Vitest covers Google user-id mapping, the embedding helper with a mocked client, rate-limit error mapping, visibility, `getDb`, citation chips, and PDF upload checks. The default environment is node. UI tests opt into jsdom.
- GitHub Actions (`.github/workflows/ci.yml`) is unchanged: Node 22, `npm ci`, lint, `tsc --noEmit`, `npm test`, `npm run build`. No env vars.

Copy on the screens is plain. These labels are not shown: deterministic passage verification, exact coordinates verification, zero latency page indexing, verified passages, deterministic match, and match 100%.

The footer on these screens says Built by Adhil Shanif and links to https://github.com/shanifadhil33-blip/doctalk.

## Next

- B3 PDF upload and storage
- B4 retrieval with page citations

## Decisions

- User id is Google's OIDC `sub`. On sign-in, `profile.sub` is written to `token.sub`. `account.providerAccountId` is used only when `profile.sub` is missing. Later requests keep the stored `token.sub`. `session.user.id` is that same string, and `visibleDocumentsWhere` compares it to `documents.user_id`.
- JWT sessions only. A users table is not required for the visibility rule.
- `trustHost: true` so Auth.js accepts the request host without `AUTH_URL`. `AUTH_SECRET` is required for a real session. When it is unset, `auth()` returns no session, which lets `next build` finish with no env vars.
- The document list is public. With a database it shows only rows `visibleDocumentsWhere` allows, including a signed-out viewer seeing demo and null-owner rows. Without a database it shows the three sample documents.
- A document URL is public only after a visibility lookup when `DATABASE_URL` is set. If that lookup is missing or unavailable, a signed-out request goes to sign-in and a signed-in request gets 404. Without `DATABASE_URL`, sample slugs and `local-` ids are allowed so the demo still opens.
- Screen headers own the chrome. The old `max-w-6xl` app wrapper is not used, so the workspace can span the window. The page viewer grows and the chat stays 420px.
- Chat calls `generateText` with `maxRetries: 0`, then returns an AI SDK UI message stream. The provider status is known before the response is sent, so a 429 or 402 can fall back or return the friendly limit message.
- OpenRouter is optional. It is not called unless both the key and `OPENROUTER_MODEL` are set. Model ids are not hardcoded beyond the Gemini defaults.
- The HNSW migration is the full initial Drizzle migration, including the tables already described in `src/db/schema.ts`. It was not applied. `src/db/enable-pgvector.ts` still creates the `vector` extension, and the migration SQL does too.
- `gemini-embedding-2` normalizes 768-d vectors. The helper still normalizes when the L2 norm is not 1.
- `.env.example` no longer lists Clerk, Cloudflare R2, `GOOGLE_GENERATIVE_AI_API_KEY`, or `NEXT_PUBLIC_ENABLE_ADMIN`. Gemini uses `GEMINI_API_KEY`.

## Parked

- Stored documents do not render page text or extracted JSON. Retrieval with citations is B4. Sample documents still show their pages.
- Upload still checks the file in the browser and keeps it for the session. Storage is B3. R2 is not wired, so those env vars were dropped.
- The generated migration is not applied. Review it before running it against a database that already has these tables.
- README says to copy `.env.example` to `.env.local`. `drizzle.config.ts`, `src/db/seed.ts`, and `src/db/enable-pgvector.ts` load `.env`.
- Seeded medical-bill text keeps the original fixture punctuation.
- `npm audit` advisories were already present, including `glob` pulled in by `@vitest/coverage-v8`. Not changed here.
- Vitest stays on 3.2.7 with `@types/node` 20, for the same resolver reasons as B1.

## Services

| Service | Plan | Where the key lives |
| --- | --- | --- |
| Auth.js Google | Free OAuth client | `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, named in `.env.example`. Values stay in local env and the host env. Not committed. |
| Neon Postgres | Not recorded in the repo | `DATABASE_URL`, named in `.env.example`. Not committed. |
| Gemini API | Free tier | `GEMINI_API_KEY`, named in `.env.example`. Used for embeddings and chat. Not committed. |
| OpenRouter | Optional free-model fallback | `OPENROUTER_API_KEY` and `OPENROUTER_MODEL`, named in `.env.example`. Not committed. |
| GitHub Actions | Not recorded in the repo | Workflow stores no secrets. |
