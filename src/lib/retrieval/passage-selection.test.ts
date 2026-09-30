import { describe, expect, it } from "vitest";
import { buildRetrievalPrompt } from "@/lib/retrieval/answer";
import { choosePassages, numberedRefs, startsWithNumber } from "@/lib/retrieval/passage-selection";

const note = [
  { page: 1, label: "1. Opening", content: "1. Opening The desk opens at 8:30." },
  { page: 2, label: "2. The loop", content: "2. The loop Run the check, then send the report." },
  { page: 3, label: "4. Review steps", content: "4. Review steps Write the boundary before the prompt." },
];

describe("choosePassages", () => {
  it("sends a short document in full when vector search missed the numbered point", () => {
    const chosen = choosePassages(note, "what is point 4", [note[0]!]);
    expect(chosen.map((passage) => passage.label)).toEqual([
      "1. Opening",
      "2. The loop",
      "4. Review steps",
    ]);
    const prompt = buildRetrievalPrompt("what is point 4", chosen);
    expect(prompt).toContain("4. Review steps");
    expect(prompt).toContain("section 4. Review steps");
  });

  it("keeps a numbered heading when the file is too long for one prompt", () => {
    const huge = note.map((passage) => ({
      ...passage,
      content: `${passage.content} ${"word ".repeat(30)}`,
    }));
    const chosen = choosePassages(huge, "Explain point 4", [huge[0]!], 40);
    expect(chosen.some((passage) => passage.label === "4. Review steps")).toBe(true);
    expect(chosen.some((passage) => passage.label === "1. Opening")).toBe(true);
  });

  it("keeps the section that contains the asked-for words", () => {
    const chosen = choosePassages(note, "what is the loop", [], 10);
    expect(chosen.map((passage) => passage.page)).toEqual([2]);
  });

  it("adds nothing for a fact that is not in a long file", () => {
    expect(choosePassages(note, "who is the mayor", [], 10)).toEqual([]);
  });
});

describe("numbered references", () => {
  it("reads a point number and matches a heading that starts with it", () => {
    expect(numberedRefs("what about point 4?")).toEqual([4]);
    expect(numberedRefs("see section #2")).toEqual([2]);
    expect(startsWithNumber("4. Review steps", 4)).toBe(true);
    expect(startsWithNumber("14. Later", 4)).toBe(false);
    expect(startsWithNumber("Review steps 4", 4)).toBe(false);
  });
});
