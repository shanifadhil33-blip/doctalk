# DocTalk

DocTalk is a work-in-progress app for asking questions about PDFs, with answers that cite the source page.

## Current state

- Next.js 15
- Google sign-in with Auth.js
- Neon Postgres with pgvector and a Drizzle schema
- Seed script for three demo documents
- Chat via the Gemini API, with an optional OpenRouter fallback

## In progress

- PDF upload and storage
- Document search with page citations
- The document workspace

## Run locally

Requires Node 22.

1. Copy `.env.example` to `.env.local` and fill it in.
2. `npm install`
3. `npm run dev`
