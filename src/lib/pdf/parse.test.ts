import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { demoPdfs } from "@/lib/demo/pdf-catalog";
import { chunkPages } from "@/lib/pdf/chunk";
import { parsePdfPages } from "@/lib/pdf/parse";
import { buildPdf } from "@/lib/pdf/simple-pdf";

describe("parsePdfPages", () => {
  it("reads page text from a generated PDF", async () => {
    const bytes = buildPdf([
      ["Agreement number: SSA-2026-014"],
      ["Total due: 2400.00 USD"],
    ]);
    const pages = await parsePdfPages(bytes);
    expect(pages).toHaveLength(2);
    expect(pages[0]?.text).toContain("Agreement number: SSA-2026-014");
    expect(pages[1]?.text).toContain("Total due: 2400.00 USD");

    const chunks = chunkPages(pages);
    expect(chunks.find((chunk) => chunk.content.includes("Total due"))?.page).toBe(2);
  });

  it("reads the sample invoice from public/demo", async () => {
    const invoice = demoPdfs.find((item) => item.diskName === "sample-invoice.pdf");
    if (!invoice) throw new Error("Missing sample invoice catalog entry");
    const bytes = await readFile(
      path.join(process.cwd(), "public", "demo", invoice.diskName),
    );
    const pages = await parsePdfPages(new Uint8Array(bytes));
    expect(pages.length).toBe(invoice.pages.length);
    expect(pages[1]?.text).toContain("Total due: 2400.00 USD");
  });
});
