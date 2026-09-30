import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { DEMO_MARKDOWN_DISK } from "@/lib/demo/markdown-catalog";
import { passagesForMarkdownFile } from "@/lib/demo/markdown-passages";
import { answerMarkdownLocally } from "@/lib/markdown/local-answer";
import { isMarkdownFileName, parseMarkdownSections } from "@/lib/markdown/sections";
import { NOT_IN_DOCUMENT_ANSWER, finalizeAnswer } from "@/lib/retrieval/answer";

describe("markdown files", () => {
  it("treats .md and .markdown as the same kind of file", () => {
    expect(isMarkdownFileName("Desk note.md")).toBe(true);
    expect(isMarkdownFileName("Desk note.MARKDOWN")).toBe(true);
    expect(isMarkdownFileName("notes.pdf")).toBe(false);
    expect(isMarkdownFileName("notes.txt")).toBe(false);
  });

  it("splits a note on headings", () => {
    const sections = parseMarkdownSections("# Desk hours\nOpen at 8:30.\n\n# Lost badges\nThe fee is 25.00 USD.");
    expect(sections.map((section) => section.heading)).toEqual(["Desk hours", "Lost badges"]);
    expect(sections[1]?.text).toContain("25.00 USD");
    expect(sections[0]?.index).toBe(1);
  });
});

describe("visitor desk note", () => {
  const source = readFileSync(
    path.join(process.cwd(), "public", "demo", DEMO_MARKDOWN_DISK),
    "utf8",
  );

  it("is a long note with several sections", () => {
    const sections = parseMarkdownSections(source);
    expect(source.length).toBeGreaterThan(4000);
    expect(sections.length).toBeGreaterThanOrEqual(10);
    expect(sections.some((section) => section.heading === "Desk hours")).toBe(true);
    expect(sections.some((section) => section.heading === "Lost badges")).toBe(true);
    expect(source).toContain("25.00 USD");
    expect(source).toContain("March 18, 2026");
  });

  it("answers from a heading and cites that section", () => {
    const result = answerMarkdownLocally(source, "What does a lost badge cost?");
    expect(result.answer).toContain("25.00 USD");
    expect(result.citations).toHaveLength(1);
    expect(result.citations[0]?.label).toBe("Lost badges");
    expect(result.citations[0]?.label).not.toMatch(/page/i);
  });

  it("cites nothing when the fact is absent", () => {
    const result = answerMarkdownLocally(source, "Who is the mayor?");
    expect(result).toEqual({ answer: NOT_IN_DOCUMENT_ANSWER, citations: [] });
  });

  it("labels retrieval citations with the heading", () => {
    const passages = passagesForMarkdownFile("Sample_Visitor_Note.md");
    if (!passages) throw new Error("Missing visitor note");
    const lost = passages.findIndex((passage) => passage.content.includes("25.00 USD"));
    expect(lost).toBeGreaterThanOrEqual(0);
    const result = finalizeAnswer(
      JSON.stringify({ answer: "A lost badge costs 25.00 USD.", used: [lost + 1] }),
      passages,
    );
    expect(result.citations[0]?.label).toBe("Lost badges");
    expect(result.answer).toBe("A lost badge costs 25.00 USD.");

    const missing = finalizeAnswer(
      JSON.stringify({ answer: NOT_IN_DOCUMENT_ANSWER, used: [lost + 1] }),
      passages,
    );
    expect(missing).toEqual({ answer: NOT_IN_DOCUMENT_ANSWER, citations: [] });
  });
});
