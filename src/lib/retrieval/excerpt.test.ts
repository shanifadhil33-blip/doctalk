import { describe, expect, it } from "vitest";
import { cleanPassageText, finalizeAnswer, focusedExcerpt } from "@/lib/retrieval/answer";
import { chunkPages } from "@/lib/pdf/chunk";

const cvChunk =
  "ns.  Managed feature delivery, client feedback, testing, fixes and technical decisions; earned repeat paid work from an international founder. " +
  " Uses coding agents such as Claude Code and Codex to support implementation and review, with direct responsibility for the delivered software. " +
  "TECHNICAL SKILLS Development: TypeScript, JavaScript, Next.js, React, Tailwind CSS, full-stack web development, REST APIs " +
  "Data & security: PostgreSQL, Supabase, authentication, row-level security (RLS), data modelling, pgvector " +
  "Applied AI: LLM API integrations, RAG, AI agents, Claude Code, OpenAI Codex, Cursor " +
  "Deployment & delivery: Vercel, Cloudflare, GitHub Actions, Sentry, debugging, testing, technical documentation";

describe("focusedExcerpt", () => {
  it("starts the quote where the answer's content is, at a clean boundary", () => {
    const quote = focusedExcerpt(cvChunk, "Adhil's skills include TypeScript, Next.js, React, PostgreSQL, pgvector and Vercel.");
    expect(quote.startsWith("TECHNICAL SKILLS Development: TypeScript")).toBe(true);
    expect(quote.length).toBeLessThanOrEqual(403);
  });

  it("never starts partway through a word and replaces symbol-font bullets", () => {
    const quote = focusedExcerpt(cvChunk, "");
    expect(quote.startsWith("ns.")).toBe(false);
    expect(quote).not.toMatch(/[-]/);
    expect(cleanPassageText("a  b")).toBe("a • b");
  });

  it("is used for citations in a finished answer", () => {
    const result = finalizeAnswer(
      JSON.stringify({ answer: "Skills include TypeScript, React and PostgreSQL.", used: [1] }),
      [{ page: 1, content: cvChunk }],
    );
    expect(result.citations[0]?.page).toBe(1);
    expect(result.citations[0]?.excerpt.startsWith("TECHNICAL SKILLS")).toBe(true);
  });
});

describe("chunkPages overlap", () => {
  it("starts each overlapping chunk on a whole word", () => {
    const words = Array.from({ length: 600 }, (_, index) => `word${index}`).join(" ");
    const chunks = chunkPages([{ page: 1, text: words }]);
    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) expect(chunk.content).toMatch(/^word\d+(\s|$)/);
  });
});
