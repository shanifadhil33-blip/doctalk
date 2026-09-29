# DocTalk state

Owner: Adhil. Milestone B2 (auth and embeddings).

## Done

- Next.js 15 App Router, React 19, strict TypeScript, Tailwind v4.
- Auth.js v5 (`next-auth` 5.0.0-beta.32), Google provider only. JWT sessions. No database adapter and no users table.
- The viewer id is the Google account id (`token.sub`), copied onto `session.user.id`. The dashboard still filters with `visibleDocumentsWhere` (`is_demo OR user_id IS NULL OR user_id = viewer`).
- Middleware: `/`, `/sign-in`, and `/api/auth` are public. A document route is public when that row is visible to a signed-out viewer (demo or null owner). `/upload`, `/api/chat`, and every other route require a session. The document page repeats the same check.
- Clerk packages, components, routes, and env vars are removed.
- Embeddings use the Gemini API. `EMBEDDING_MODEL` defaults to `gemini-embedding-2`. Requests set `output_dimensionality` to 768. Vectors are L2-normalized when their norm is not already 1. Key: `GEMINI_API_KEY`.
- `chunks.embedding` stays `vector(768)`. HNSW index `chunks_embedding_hnsw_idx` uses `vector_cosine_ops`. The Drizzle migration in `drizzle/` was generated and not applied.
- The seed script embeds chunk text before inserting a demo document. If `GEMINI_API_KEY` is missing it exits without writing and prints why.
- Chat answers come from the Gemini API. `CHAT_MODEL` defaults to `gemini-3.5-flash-lite`. If that call returns 429 or 402 and both `OPENROUTER_API_KEY` and `OPENROUTER_MODEL` are set, the route tries that OpenRouter model. If the providers are limited, the response is `Demo limit reached, try again later`. `google/gemini-pro` is removed.
- `getDb()` still connects on the first query. Importing `src/db/index.ts` does not require `DATABASE_URL`.
- The app layout and dashboard export `dynamic = "force-dynamic"`, so Next.js does not run those queries during `next build`.
- Vitest covers Google user-id mapping, the embedding helper with a mocked client, and rate-limit error mapping. Existing visibility and `getDb` tests still run.
- GitHub Actions (`.github/workflows/ci.yml`) is unchanged: Node 22, `npm ci`, lint, `tsc --noEmit`, `npm test`, `npm run build`. No env vars.

## Next

- B3 PDF upload and storage
- B4 retrieval with page citations
- UI from Stitch designs
- Landing page

## Decisions

- User id is Google's OIDC `sub`. On sign-in, `profile.sub` is written to `token.sub`. `account.providerAccountId` is used only when `profile.sub` is missing. Later requests keep the stored `token.sub`. `session.user.id` is that same string, and `visibleDocumentsWhere` compares it to `documents.user_id`.
- JWT sessions only. A users table is not required for the visibility rule.
- `trustHost: true` so Auth.js accepts the request host without `AUTH_URL`. `AUTH_SECRET` is required for a real session. When it is unset, `auth()` returns no session, which lets `next build` finish with no env vars.
- Demo document URLs are public only after a visibility lookup. If the database is unavailable, a signed-out document request is sent to sign-in.
- Document detail is still a placeholder. It shows the file name only after the visibility check passes.
- Chat calls `generateText` with `maxRetries: 0`, then returns an AI SDK UI message stream. The provider status is known before the response is sent, so a 429 or 402 can fall back or return the friendly limit message.
- OpenRouter is optional. It is not called unless both the key and `OPENROUTER_MODEL` are set. Model ids are not hardcoded beyond the Gemini defaults.
- The HNSW migration is the full initial Drizzle migration, including the tables already described in `src/db/schema.ts`. It was not applied. `src/db/enable-pgvector.ts` still creates the `vector` extension, and the migration SQL does too.
- `gemini-embedding-2` normalizes 768-d vectors. The helper still normalizes when the L2 norm is not 1.
- `.env.example` no longer lists Clerk, Cloudflare R2, `GOOGLE_GENERATIVE_AI_API_KEY`, or `NEXT_PUBLIC_ENABLE_ADMIN`. Gemini uses `GEMINI_API_KEY`.

## Parked

- Document detail does not render the PDF or extracted JSON. Retrieval with citations is B4.
- Upload is a dropzone placeholder. Storage is B3. R2 is not wired, so those env vars were dropped.
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
