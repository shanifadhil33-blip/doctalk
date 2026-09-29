import { describe, expect, it } from "vitest";
import { chunkPages } from "./chunk";

describe("chunkPages", () => {
  it("keeps each chunk on the page the text came from", () => {
    const pageOne = `Alpha agreement starts here. ${"word ".repeat(400)}`;
    const chunks = chunkPages(
      [
        { page: 1, text: pageOne },
        { page: 2, text: "Total due: 2400.00 USD" },
        { page: 3, text: "   \n  " },
      ],
      { maxChars: 200, overlap: 20 },
    );

    expect(chunks.some((chunk) => chunk.page === 3)).toBe(false);
    expect(chunks.filter((chunk) => chunk.page === 1).length).toBeGreaterThan(1);
    expect(
      chunks
        .filter((chunk) => chunk.page === 1)
        .every((chunk) => !chunk.content.includes("Total due")),
    ).toBe(true);

    const invoice = chunks.filter((chunk) => chunk.content.includes("Total due"));
    expect(invoice).toHaveLength(1);
    expect(invoice[0]?.page).toBe(2);
    expect(chunks.map((chunk) => chunk.chunkIndex)).toEqual(
      chunks.map((_, index) => index),
    );
  });
});
