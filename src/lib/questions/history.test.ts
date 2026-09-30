import { describe, expect, it } from "vitest";
import {
  documentTitleFromFileName,
  formatAskedAt,
  loadAskedQuestions,
  recordAskedQuestion,
} from "@/lib/questions/history";

describe("question history", () => {
  it("formats the asked date in UTC", () => {
    expect(formatAskedAt(new Date("2026-09-30T23:30:00.000Z"))).toEqual({
      askedOn: "2026-09-30",
      askedLabel: "Sep 30, 2026",
    });
  });

  it("uses the file name without the PDF extension as the document title", () => {
    expect(documentTitleFromFileName("Lease Agreement.pdf")).toBe("Lease Agreement");
    expect(documentTitleFromFileName("Visitor note.md")).toBe("Visitor note");
    expect(documentTitleFromFileName("Desk.markdown")).toBe("Desk");
    expect(documentTitleFromFileName("notes")).toBe("notes");
  });

  it("does nothing when the database is not configured", async () => {
    const previous = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;
    try {
      await expect(
        recordAskedQuestion({
          userId: "owner",
          documentId: "629dc9d8-5181-420f-8264-cf5e37246622",
          documentTitle: "Lease",
          question: "What is the notice period?",
          answer: "Sixty days.",
        }),
      ).resolves.toBeUndefined();
      await expect(loadAskedQuestions("owner")).resolves.toEqual([]);
    } finally {
      if (previous === undefined) {
        delete process.env.DATABASE_URL;
      } else {
        process.env.DATABASE_URL = previous;
      }
    }
  });
});
