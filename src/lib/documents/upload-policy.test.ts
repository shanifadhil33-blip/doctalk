import { describe, expect, it } from "vitest";
import { MAX_PDF_BYTES } from "@/lib/upload-validation";
import {
  MAX_DOCUMENTS_PER_USER,
  PDF_LIMIT_MESSAGE,
  hasPdfMagic,
  pdfSrcFor,
  validatePdfUpload,
  withinDocumentLimit,
} from "@/lib/documents/upload-policy";

const pdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]);

describe("validatePdfUpload", () => {
  it("accepts a small PDF with a PDF header", () => {
    expect(
      validatePdfUpload({
        name: "notes.PDF",
        size: pdfBytes.byteLength,
        type: "application/pdf",
        bytes: pdfBytes,
      }),
    ).toEqual({ ok: true, fileName: "notes.PDF" });
  });

  it("rejects a renamed file that is not a PDF", () => {
    expect(
      validatePdfUpload({
        name: "notes.pdf",
        size: 4,
        type: "application/pdf",
        bytes: new Uint8Array([1, 2, 3, 4]),
      }),
    ).toEqual({ ok: false, message: "That file is not a PDF." });
    expect(hasPdfMagic(new Uint8Array([1, 2, 3, 4]))).toBe(false);
  });

  it("rejects a PDF over 10 MB", () => {
    expect(
      validatePdfUpload({
        name: "large.pdf",
        size: MAX_PDF_BYTES + 1,
        type: "application/pdf",
        bytes: pdfBytes,
      }),
    ).toEqual({ ok: false, message: "PDF must be 10 MB or smaller." });
  });
});

describe("withinDocumentLimit", () => {
  it("allows another upload until the per-user cap", () => {
    expect(withinDocumentLimit(0)).toBe(true);
    expect(withinDocumentLimit(MAX_DOCUMENTS_PER_USER - 1)).toBe(true);
    expect(withinDocumentLimit(MAX_DOCUMENTS_PER_USER)).toBe(false);
    expect(PDF_LIMIT_MESSAGE).toContain("5");
  });
});

describe("pdfSrcFor", () => {
  it("keeps same-origin demo files and proxies remote blobs", () => {
    expect(pdfSrcFor("abc", "/demo/sample-invoice.pdf")).toBe(
      "/demo/sample-invoice.pdf",
    );
    expect(pdfSrcFor("abc", "https://example.public.blob.vercel-storage.com/a.pdf")).toBe(
      "/api/documents/abc/file",
    );
  });
});
