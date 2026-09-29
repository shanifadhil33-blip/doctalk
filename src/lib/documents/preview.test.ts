import { describe, expect, it } from "vitest";
import { demoPdfs } from "@/lib/demo/pdf-catalog";
import {
  documentPreviewLines,
  documentPreviewSrc,
  knownPageCount,
  metaWithPageCount,
} from "@/lib/documents/preview";

describe("document previews", () => {
  it("points the three sample PDFs at their real files", () => {
    expect(documentPreviewSrc("any", "Sample_Invoice.pdf")).toBe(
      "/demo/sample-invoice.pdf",
    );
    expect(documentPreviewSrc("any", "Sample_Services_Agreement.pdf")).toBe(
      "/demo/sample-services-agreement.pdf",
    );
    expect(documentPreviewSrc("any", "Sample_Data_Policy.pdf")).toBe(
      "/demo/sample-data-policy.pdf",
    );
    for (const pdf of demoPdfs) {
      expect(knownPageCount("any", pdf.fileName)).toBe(pdf.pages.length);
      expect(documentPreviewLines("any", pdf.fileName)[0]).toBe(pdf.pages[0]?.[0]);
    }
  });

  it("uses the file route for a stored upload and skips ids that have no file", () => {
    expect(
      documentPreviewSrc("11111111-1111-4111-8111-111111111111", "notes.pdf", "Yours"),
    ).toBe("/api/documents/11111111-1111-4111-8111-111111111111/file");
    expect(
      documentPreviewSrc(
        "11111111-1111-4111-8111-111111111111",
        "Sample_Invoice.pdf",
        "Yours",
      ),
    ).toBe("/api/documents/11111111-1111-4111-8111-111111111111/file");
    expect(documentPreviewLines("local-abc", "notes.pdf")).toEqual([]);
    expect(documentPreviewSrc("local-abc", "notes.pdf")).toBeNull();
  });

  it("uses the offline sample's own lines, including each invoice row", () => {
    expect(documentPreviewLines("inv-20418", "Invoice-INV-20418.pdf")).toEqual([
      "Invoice",
      "Northwind Supplies. Invoice INV-20418. Issued September 12, 2024. Bill to: DocTalk sample account.",
      "Item · Qty · Amount",
      "Rack Servers 2U · 4 · $8,400.00",
      "SFP+ Transceiver 10G · 16 · $1,120.00",
      "Cat6a Patch Cables · 40 · $366.00",
    ]);
  });

  it("adds a page count without repeating one already in the meta", () => {
    expect(metaWithPageCount("Added Sep 12", 2)).toBe("2 pages · Added Sep 12");
    expect(metaWithPageCount("11 pages · Added Sep 3", 11)).toBe(
      "11 pages · Added Sep 3",
    );
  });
});
