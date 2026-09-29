# Go live

These steps are for a new DocTalk deployment with a new Neon database. They stay on free tiers: Neon, Vercel Hobby, a private Vercel Blob store, Google OAuth, and the Gemini free tier. Do not put real keys in the repo.

## 1. Neon database (AWS)

1. Create a Neon project.
2. Choose AWS as the cloud provider, then pick a region near the Vercel region you will use. Example: AWS us-east-1 (N. Virginia) when the Vercel project runs in Washington, D.C. (iad1).
3. Create the database and copy the pooled connection string.
4. Put it in `DATABASE_URL`. It should include `sslmode=require`.

## 2. Environment variables

Set these on the host and, for local commands, in `.env`. `.env.example` lists the names only.

| Name | Required | Notes |
| --- | --- | --- |
| `AUTH_SECRET` | Yes | Long random string. Example command: `openssl rand -base64 32` |
| `AUTH_GOOGLE_ID` | Yes | Google OAuth client id |
| `AUTH_GOOGLE_SECRET` | Yes | Google OAuth client secret |
| `DATABASE_URL` | Yes | Neon pooled URL from step 1 |
| `GEMINI_API_KEY` | Yes | Embeddings and chat |
| `BLOB_READ_WRITE_TOKEN` | Yes | From the private Blob store in step 4 |
| `EMBEDDING_MODEL` | No | Default `gemini-embedding-2` |
| `CHAT_MODEL` | No | Default `gemini-3.5-flash-lite` |
| `OPENROUTER_API_KEY` | No | Fallback only if both OpenRouter values are set |
| `OPENROUTER_MODEL` | No | A free OpenRouter model id |

`drizzle.config.ts`, `npm run seed`, and `src/db/enable-pgvector.ts` read `.env`. The Next.js app also reads `.env.local`.

## 3. Google sign-in

In the Google Cloud OAuth client, add this authorized redirect URI:

`https://YOUR_DOMAIN/api/auth/callback/google`

For local sign-in, also add:

`http://localhost:3000/api/auth/callback/google`

Set the authorized JavaScript origin to the same site origin (`https://YOUR_DOMAIN` or `http://localhost:3000`).

## 4. Vercel Blob (private, Hobby)

1. Open the Vercel project, then Storage, then Create Database, then Blob.
2. Set access to Private. Create the store and connect it to this project, including Production. Add Development too if you will upload from a local app.
3. Copy `BLOB_READ_WRITE_TOKEN` into the host env and into `.env`.

Private Blob is included on the free Hobby plan until the Hobby usage limits. Create the store as private. The access mode cannot be changed afterward. The app uploads with `access: "private"` and serves files only through `/api/documents/:id/file`.

## 5. Migrations

On this new database, from the repo root, with `DATABASE_URL` in `.env`:

```bash
npx drizzle-kit migrate
```

That applies the files in order:

1. `drizzle/0000_hnsw_cosine_embedding.sql` (tables, pgvector, HNSW index)
2. `drizzle/0001_document_status_and_page.sql`
3. `drizzle/0002_document_file_url_unique.sql`

Do not run `0000` by hand against a database that already has these tables. This guide is only for a fresh database.

## 6. Seed

With `DATABASE_URL` and `GEMINI_API_KEY` in `.env`:

```bash
npm run seed
```

The script reads `/public/demo/*.pdf`, embeds the text, and inserts `is_demo` rows. It skips a file that is already seeded. If `GEMINI_API_KEY` is missing it exits without writing.

## 7. Deploy

Deploy the app to Vercel Hobby with the env vars from step 2. The build does not need those vars, but the running app does.

Uploads go from the browser to Blob. They do not pass through the 4.5 MB function body limit.

## 8. Smoke test

- [ ] Open the site and sign in with Google.
- [ ] The document list shows the seeded demo PDFs.
- [ ] Open a demo PDF, ask a question, and get an answer with a Source page chip. The chip moves the viewer to that page.
- [ ] Upload a PDF under 10 MB. It finishes as your document and the viewer loads `/api/documents/<id>/file`. The page does not use a `blob.vercel-storage.com` URL.
- [ ] Ask that PDF a question and get a page citation.
- [ ] Delete that document.
- [ ] A sixth document on the same account shows `You can keep up to 5 documents. Delete one to upload another.`
- [ ] Sign out. On a demo document, the 21st question in the same UTC day returns `Demo limit reached, try again later`.
