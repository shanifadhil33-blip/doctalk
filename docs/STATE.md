# DocTalk state

Owner: Adhil. Milestone B1.

## Done

- Next.js 15 App Router, React 19, strict TypeScript, Tailwind v4.
- Clerk sign-in. The dashboard at `/` is public. Upload, document detail, and `/api/chat` stay protected.
- Neon Postgres schema in `src/db/schema.ts`: `documents`, `chunks` (pgvector, 768 dimensions), `extractions`, `settings`.
- `documents.user_id` is a nullable text column. `documents.is_demo` is a boolean, default false, not null.
- Dashboard query uses `visibleDocumentsWhere`. Signed-out viewers get demo and null-owner rows only. Signed-in viewers also get rows whose `user_id` matches their Clerk user id. Another user's private rows are not selected.
- Seed script inserts three demo documents (invoice, medical bill, service contract) with `isDemo: true`, no `userId`, and zero embeddings.
- Chat route streams through OpenRouter with the Vercel AI SDK (`google/gemini-pro`).
- `getDb()` connects on the first query. Importing `src/db/index.ts` does not require `DATABASE_URL`.
- The dashboard exports `dynamic = "force-dynamic"`, so Next.js does not run that query during `next build`.
- Vitest 3.2.7 and `@vitest/coverage-v8` 3.2.7. `npm test` runs `vitest run`. Node `>=22` is set in `package.json` `engines` and `.nvmrc`.
- GitHub Actions workflow `.github/workflows/ci.yml` runs on push and pull request: Node 22, `npm ci`, lint, `tsc --noEmit`, `npm test`, `npm run build`.

## Next

- B2 real embeddings
- B3 PDF upload and storage
- B4 retrieval with page citations
- UI from Stitch designs
- Landing page

## Decisions

- A row is public when `isDemo` is true or `userId` is null. Null owner means a public demo document. The `isDemo` flag is the other public signal, including a demo row that still has a `userId`.
- Private means `isDemo` is false and `userId` is set. Those rows are visible only to that user.
- The same rule lives in `isDocumentVisible` (row filter, unit tested) and `visibleDocumentsWhere` (SQL used by the dashboard). Signed-out SQL is `is_demo = true OR user_id IS NULL`. Signed-in SQL adds `OR user_id = viewer`.
- No Drizzle migration. The owner column and demo flag were already on `documents`. Nothing was applied to a database.
- `/` is public so a signed-out visitor can see demo documents. Document detail stays behind Clerk because that page does not load a document row yet, so it cannot enforce visibility.
- CI does not set Clerk keys or `DATABASE_URL`. `npm run build` with no env vars succeeded on `@clerk/nextjs` 7.7.3. Production build does not use Clerk keyless mode, and no placeholder publishable key was required.
- Vitest 3.2.7 is installed. Vitest 5 asks for `@types/node` 22, and this repo has `@types/node` 20. Vitest 4 fails this environment's npm 10 resolver (`edgesOut`). `@types/node` was not upgraded.

## Parked

- Document detail is a placeholder (PDF viewer and extracted JSON). It does not query the database.
- Upload is a dropzone placeholder. Cloudflare R2 is not wired up.
- Seed embeddings are zeros. Real embeddings are B2.
- `GOOGLE_GENERATIVE_AI_API_KEY` and `NEXT_PUBLIC_ENABLE_ADMIN` are named in `.env.example` and unused in code.
- README says to copy `.env.example` to `.env.local`. `drizzle.config.ts`, `src/db/seed.ts`, and `src/db/enable-pgvector.ts` load `.env`. Not changed here.
- `createRouteMatcher` is deprecated in the installed Clerk SDK. The existing middleware still uses it.
- `src/db/seed.ts` and `src/db/enable-pgvector.ts` already log to the console. `src/app/(app)/upload/page.tsx` and the seed skip message already contain em dashes. Left as they were.
- `npm audit` reports advisories, including `glob` pulled in by `@vitest/coverage-v8`. Not changed here.

## Services

| Service | Plan | Where the key lives |
| --- | --- | --- |
| Clerk | Not recorded in the repo | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`, named in `.env.example`. Values stay in local env and the host env. Not committed. |
| Neon Postgres | Not recorded in the repo | `DATABASE_URL`, named in `.env.example`. Not committed. |
| Cloudflare R2 | Not recorded in the repo | `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`, named in `.env.example`. Example bucket name is `doctalk-pdfs`. Not committed. |
| OpenRouter | Not recorded in the repo | `OPENROUTER_API_KEY`, named in `.env.example`. Used by `src/lib/ai.ts`. Not committed. |
| Google AI | Not recorded in the repo | `GOOGLE_GENERATIVE_AI_API_KEY`, optional and unused. Not committed. |
| GitHub Actions | Not recorded in the repo | Workflow stores no secrets. |
