import { describe, expect, it } from "vitest";
import { passagesForDemoFile } from "@/lib/demo/pdf-catalog";
import {
  NOT_IN_DOCUMENT_ANSWER,
  answerFromPassages,
  buildRetrievalPrompt,
  finalizeAnswer,
  isDocumentOverviewQuestion,
  pageNumberFromChunk,
  summaryFromPassages,
} from "@/lib/retrieval/answer";

const passages = [
  { page: 2, content: "Total due: 2400.00 USD" },
  { page: 3, content: "Either party may end this agreement by giving 14 days written notice." },
];

describe("retrieval prompt", () => {
  it("numbers passages and asks for the ones the answer used", () => {
    const prompt = buildRetrievalPrompt("What is the total due?", passages);
    expect(prompt).toContain("[1] page 2");
    expect(prompt).toContain("[2] page 3");
    expect(prompt).toContain("Total due: 2400.00 USD");
    expect(prompt).toContain('"used":[1,3]');
    expect(prompt).toContain(NOT_IN_DOCUMENT_ANSWER);
    expect(prompt.toLowerCase()).toContain("summary");
  });
});

describe("overview questions", () => {
  it("treats a content question as a summary and a missing fact as a refusal", () => {
    expect(isDocumentOverviewQuestion("What is the content")).toBe(true);
    expect(isDocumentOverviewQuestion("what is this document about?")).toBe(true);
    expect(isDocumentOverviewQuestion("summarize this")).toBe(true);
    expect(isDocumentOverviewQuestion("Who is the mayor?")).toBe(false);
    expect(isDocumentOverviewQuestion("What is the total due?")).toBe(false);
  });

  it("answers from the passages and cites a page when the model refuses a summary", async () => {
    const result = await answerFromPassages(
      "What is the content",
      passages,
      async () => NOT_IN_DOCUMENT_ANSWER,
    );
    expect(result.answer).not.toBe(NOT_IN_DOCUMENT_ANSWER);
    expect(result.answer).toContain("Total due: 2400.00 USD");
    expect(result.citations[0]?.page).toBe(2);
    expect(result.citations.length).toBeGreaterThan(0);
  });

  it("keeps a model summary that already cites a page", async () => {
    const result = await answerFromPassages(
      "summarize this",
      passages,
      async () =>
        JSON.stringify({
          answer: "The document states a total due of 2400.00 USD.",
          used: [1],
        }),
    );
    expect(result).toEqual({
      answer: "The document states a total due of 2400.00 USD.",
      citations: [{ page: 2, excerpt: "Total due: 2400.00 USD" }],
    });
  });

  it("summarizes the sample policy from its own pages", async () => {
    const passages = passagesForDemoFile("Sample_Data_Policy.pdf");
    if (!passages) throw new Error("Missing sample policy");
    const result = await answerFromPassages(
      "What is the content",
      passages,
      async () => NOT_IN_DOCUMENT_ANSWER,
    );
    expect(result.answer.toLowerCase()).not.toContain("that is not in this document");
    expect(result.answer).toContain("June 1, 2026");
    expect(result.answer).toContain("Mara Ellison");
    expect(result.citations.some((citation) => citation.page === 1)).toBe(true);
  });

  it("still refuses a fact the passages do not contain", async () => {
    const result = await answerFromPassages(
      "Who is the mayor?",
      passages,
      async () => JSON.stringify({ answer: NOT_IN_DOCUMENT_ANSWER, used: [] }),
    );
    expect(result).toEqual({
      answer: NOT_IN_DOCUMENT_ANSWER,
      citations: [],
    });
    expect(summaryFromPassages([])).toEqual({
      answer: NOT_IN_DOCUMENT_ANSWER,
      citations: [],
    });
  });
});

describe("used passage citations", () => {
  it("cites only the passages named in used, in that order", () => {
    expect(
      finalizeAnswer(
        JSON.stringify({
          answer: "Notice is 14 days. The total due is 2400.00 USD.",
          used: [2, 1],
        }),
        passages,
      ),
    ).toEqual({
      answer: "Notice is 14 days. The total due is 2400.00 USD.",
      citations: [
        {
          page: 3,
          excerpt: "Either party may end this agreement by giving 14 days written notice.",
        },
        { page: 2, excerpt: "Total due: 2400.00 USD" },
      ],
    });
  });

  it("keeps one citation per page, in answer order", () => {
    const samePage = [
      { page: 2, content: "Total due: 2400.00 USD" },
      { page: 2, content: "Invoice date: March 1" },
      { page: 5, content: "Payable on receipt." },
    ];

    expect(
      finalizeAnswer(
        JSON.stringify({
          answer: "The invoice is dated March 1 and is payable on receipt.",
          used: [2, 1, 3],
        }),
        samePage,
      ),
    ).toEqual({
      answer: "The invoice is dated March 1 and is payable on receipt.",
      citations: [
        { page: 2, excerpt: "Invoice date: March 1" },
        { page: 5, excerpt: "Payable on receipt." },
      ],
    });
  });

  it("ignores invalid passage ids", () => {
    expect(
      finalizeAnswer(
        JSON.stringify({
          answer: "The total due is 2400.00 USD.",
          used: [9, 0, 1.5, "nope", 1, "2"],
        }),
        passages,
      ),
    ).toEqual({
      answer: "The total due is 2400.00 USD.",
      citations: [
        { page: 2, excerpt: "Total due: 2400.00 USD" },
        {
          page: 3,
          excerpt: "Either party may end this agreement by giving 14 days written notice.",
        },
      ],
    });
  });

  it("strips passage markers from the displayed answer", () => {
    expect(
      finalizeAnswer(
        "The total due is 2400.00 USD [1]. Notice is 14 days [2] [9].",
        passages,
      ),
    ).toEqual({
      answer: "The total due is 2400.00 USD. Notice is 14 days.",
      citations: [
        { page: 2, excerpt: "Total due: 2400.00 USD" },
        {
          page: 3,
          excerpt: "Either party may end this agreement by giving 14 days written notice.",
        },
      ],
    });

    expect(
      finalizeAnswer(
        [
          "```json",
          JSON.stringify({
            answer: "The total due is 2400.00 USD [1].",
            used: [1],
          }),
          "```",
        ].join("\n"),
        passages,
      ),
    ).toEqual({
      answer: "The total due is 2400.00 USD.",
      citations: [{ page: 2, excerpt: "Total due: 2400.00 USD" }],
    });

    expect(finalizeAnswer("Notice is 14 days.\nused: [2, 1]", passages)).toEqual({
      answer: "Notice is 14 days.",
      citations: [
        {
          page: 3,
          excerpt: "Either party may end this agreement by giving 14 days written notice.",
        },
        { page: 2, excerpt: "Total due: 2400.00 USD" },
      ],
    });
  });

  it("returns the answer with no chips when nothing usable was cited", () => {
    expect(finalizeAnswer("The total due is 2400.00 USD.", passages)).toEqual({
      answer: "The total due is 2400.00 USD.",
      citations: [],
    });

    expect(
      finalizeAnswer(
        JSON.stringify({ answer: "The total due is 2400.00 USD [8].", used: [] }),
        passages,
      ),
    ).toEqual({
      answer: "The total due is 2400.00 USD.",
      citations: [],
    });

    expect(finalizeAnswer("The total due is 2400.00 USD [9].", passages)).toEqual({
      answer: "The total due is 2400.00 USD.",
      citations: [],
    });
  });

  it("returns the not-in-document path without citations", async () => {
    const fromModel = await answerFromPassages(
      "Who is the mayor?",
      passages,
      async (prompt) => {
        expect(prompt).toContain("[1] page 2");
        return NOT_IN_DOCUMENT_ANSWER;
      },
    );
    expect(fromModel).toEqual({
      answer: NOT_IN_DOCUMENT_ANSWER,
      citations: [],
    });

    expect(
      finalizeAnswer(
        JSON.stringify({ answer: NOT_IN_DOCUMENT_ANSWER, used: [1, 2] }),
        passages,
      ),
    ).toEqual({
      answer: NOT_IN_DOCUMENT_ANSWER,
      citations: [],
    });

    const empty = await answerFromPassages("total", [], async () => "unused");
    expect(empty).toEqual({
      answer: NOT_IN_DOCUMENT_ANSWER,
      citations: [],
    });

    expect(finalizeAnswer("   ", passages)).toEqual({
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
