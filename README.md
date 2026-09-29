# DocTalk

DocTalk is a work-in-progress app for asking questions about PDFs, with answers that cite the source page.

## Current state

- Next.js 15
- Google sign-in with Auth.js
- Neon Postgres with pgvector and a Drizzle schema
- Seed script for three demo PDFs in `/public/demo`
- Chat via the Gemini API, with an optional OpenRouter fallback
- Signed-in PDF upload to Vercel Blob, with page-numbered chunks
- Answers that cite a page and open that page of the PDF

## In progress

- Further screen polish

## Run locally

Requires Node 22.

1. Copy `.env.example` to `.env.local` and fill it in.
2. `npm install`
3. `npm run dev`
