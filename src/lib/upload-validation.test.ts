import { describe, expect, it } from "vitest";
import {
  MAX_PDF_BYTES,
  formatFileSize,
  validatePdfFile,
} from "@/lib/upload-validation";

describe("validatePdfFile", () => {
  it("accepts a PDF at the size cap", () => {
    expect(
      validatePdfFile({
        name: "lease-agreement.pdf",
        size: MAX_PDF_BYTES,
        type: "application/pdf",
      }),
    ).toEqual({ ok: true });
  });

  it("accepts a PDF when the browser omits the mime type", () => {
    expect(
      validatePdfFile({
        name: "notes.PDF",
        size: 1200,
        type: "",
      }),
    ).toEqual({ ok: true });
  });

  it("rejects files that are not PDFs", () => {
    expect(
      validatePdfFile({
        name: "notes.txt",
        size: 12,
        type: "text/plain",
      }),
    ).toEqual({ ok: false, message: "Only PDF files can be uploaded." });
  });

  it("rejects a PDF over 10 MB", () => {
    expect(
      validatePdfFile({
        name: "large.pdf",
        size: MAX_PDF_BYTES + 1,
        type: "application/pdf",
      }),
    ).toEqual({ ok: false, message: "PDF must be 10 MB or smaller." });
  });

  it("rejects an empty PDF", () => {
    expect(
      validatePdfFile({
        name: "empty.pdf",
        size: 0,
        type: "application/pdf",
      }),
    ).toEqual({ ok: false, message: "That file is empty." });
  });
});

describe("formatFileSize", () => {
  it("formats megabytes to one decimal", () => {
    expect(formatFileSize(2.4 * 1024 * 1024)).toBe("2.4 MB");
  });
});
