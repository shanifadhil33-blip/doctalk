import { describe, expect, it } from "vitest";
import { demoPdfs } from "@/lib/demo/pdf-catalog";
import { buildPdf, wrapPdfLine } from "@/lib/pdf/simple-pdf";

describe("sample PDF layout", () => {
  it("wraps a long line inside the page width", () => {
    const wrapped = wrapPdfLine(
      "This policy describes how sample documents are handled in this workspace and still stays inside the page.",
      12,
    );
    expect(wrapped.length).toBeGreaterThan(1);
    expect(wrapped.join(" ")).toContain("still stays inside the page");
  });

  it("builds every sample document onto several full pages", () => {
    for (const demo of demoPdfs) {
      expect(demo.pages.length).toBeGreaterThanOrEqual(4);
      const bytes = buildPdf(demo.pages);
      expect(bytes.byteLength).toBeGreaterThan(1000);
    }
  });
});
