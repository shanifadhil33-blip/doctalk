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
  it("numbers passages and asks for the ones the answer used", () => {
    const prompt = buildRetrievalPrompt("What is the total due?", passages);
    expect(prompt).toContain("[1] page 2");
    expect(prompt).toContain("[2] page 3");
    expect(prompt).toContain("Total due: 2400.00 USD");
    expect(prompt).toContain('"used":[1,3]');
    expect(prompt).toContain(NOT_IN_DOCUMENT_ANSWER);
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
