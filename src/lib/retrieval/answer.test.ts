import { describe, expect, it } from "vitest";
import {
  NOT_IN_DOCUMENT_ANSWER,
  answerFromPassages,
  buildRetrievalPrompt,
  finalizeAnswer,
  pageNumberFromChunk,
} from "@/lib/retrieval/answer";

const passages = [
  { page: 2, content: "Total due: 2400.00 USD" },
  { page: 3, content: "Either party may end this agreement by giving 14 days written notice." },
];

describe("retrieval prompt", () => {
  it("builds citations from the retrieved chunks", () => {
    const prompt = buildRetrievalPrompt("What is the total due?", passages);
    expect(prompt).toContain("page 2");
    expect(prompt).toContain("Total due: 2400.00 USD");
    expect(prompt).toContain(NOT_IN_DOCUMENT_ANSWER);

    expect(
      finalizeAnswer("The total due is 2400.00 USD (p. 2).", passages),
    ).toEqual({
      answer: "The total due is 2400.00 USD (p. 2).",
      citations: [
        { page: 2, excerpt: "Total due: 2400.00 USD" },
        {
          page: 3,
          excerpt: "Either party may end this agreement by giving 14 days written notice.",
        },
      ],
    });
  });

  it("returns the not-in-document path without citations", async () => {
    const fromModel = await answerFromPassages(
      "Who is the mayor?",
      passages,
      async () => NOT_IN_DOCUMENT_ANSWER,
    );
    expect(fromModel).toEqual({
      answer: NOT_IN_DOCUMENT_ANSWER,
      citations: [],
    });

    const empty = await answerFromPassages("total", [], async () => "unused");
    expect(empty).toEqual({
      answer: NOT_IN_DOCUMENT_ANSWER,
      citations: [],
    });
  });
});

describe("pageNumberFromChunk", () => {
  it("prefers the page column and falls back to metadata", () => {
    expect(pageNumberFromChunk({ page: 4, metadata: { pageNumber: 1 } })).toBe(4);
    expect(pageNumberFromChunk({ page: null, metadata: { pageNumber: 2 } })).toBe(2);
    expect(pageNumberFromChunk({ page: null, metadata: null })).toBe(1);
  });
});
