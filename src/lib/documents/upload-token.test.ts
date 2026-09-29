import { describe, expect, it, vi } from "vitest";
import { PDF_LIMIT_MESSAGE } from "@/lib/documents/upload-policy";
import { blobBelongsToUpload } from "@/lib/documents/blob-url";
import { authorizeUploadToken } from "@/lib/documents/upload-token";
import { MAX_PDF_BYTES } from "@/lib/upload-validation";

const uploadId = "00000000-0000-4000-8000-000000000001";

function payload(overrides: Record<string, unknown> = {}): string {
  return JSON.stringify({
    uploadId,
    fileName: "notes.pdf",
    size: 2048,
    type: "application/pdf",
    ...overrides,
  });
}

describe("authorizeUploadToken", () => {
  it("requires a signed-in user before it reserves a slot", async () => {
    const reserve = vi.fn();
    const decision = await authorizeUploadToken({
      userId: null,
      pathname: `uploads/${uploadId}.pdf`,
      clientPayload: payload(),
      reserve,
    });
    expect(decision).toEqual({ ok: false, status: 401, message: "Sign in required" });
    expect(reserve).not.toHaveBeenCalled();
  });

  it("allows only application/pdf and at most 10 MB", async () => {
    const reserve = vi.fn();
    const pathname = `uploads/${uploadId}.pdf`;

    expect(
      await authorizeUploadToken({
        userId: "user-1",
        pathname,
        clientPayload: payload({ type: "image/png" }),
        reserve,
      }),
    ).toEqual({ ok: false, status: 400, message: "Only PDF files can be uploaded." });

    expect(
      await authorizeUploadToken({
        userId: "user-1",
        pathname,
        clientPayload: payload({ size: MAX_PDF_BYTES + 1 }),
        reserve,
      }),
    ).toEqual({ ok: false, status: 400, message: "PDF must be 10 MB or smaller." });

    expect(reserve).not.toHaveBeenCalled();
  });

  it("stops when the account is already at 5 documents", async () => {
    const reserve = vi.fn().mockResolvedValue({ ok: false, message: PDF_LIMIT_MESSAGE });
    const decision = await authorizeUploadToken({
      userId: "user-1",
      pathname: `uploads/${uploadId}.pdf`,
      clientPayload: payload(),
      reserve,
    });
    expect(decision).toEqual({ ok: false, status: 400, message: PDF_LIMIT_MESSAGE });
    expect(reserve).toHaveBeenCalledOnce();
  });

  it("reserves a slot for a valid PDF", async () => {
    const reserve = vi.fn().mockResolvedValue({ ok: true, documentId: "doc-1" });
    const decision = await authorizeUploadToken({
      userId: "user-1",
      pathname: `uploads/${uploadId}.pdf`,
      clientPayload: payload({ fileName: "My Notes.PDF" }),
      reserve,
    });
    expect(decision).toEqual({
      ok: true,
      uploadId,
      documentId: "doc-1",
      fileName: "My Notes.PDF",
    });
  });
});

describe("blobBelongsToUpload", () => {
  const pathname = `uploads/${uploadId}-a1b2c3.pdf`;

  it("accepts a private blob whose path matches this upload", () => {
    expect(
      blobBelongsToUpload({
        uploadId,
        pathname,
        url: `https://store123.private.blob.vercel-storage.com/${pathname}`,
      }),
    ).toBe(true);
  });

  it("rejects public hosts, other paths, and plain web URLs", () => {
    expect(
      blobBelongsToUpload({
        uploadId,
        pathname,
        url: `https://store123.public.blob.vercel-storage.com/${pathname}`,
      }),
    ).toBe(false);
    expect(
      blobBelongsToUpload({
        uploadId,
        pathname: "uploads/other.pdf",
        url: "https://store123.private.blob.vercel-storage.com/uploads/other.pdf",
      }),
    ).toBe(false);
    expect(
      blobBelongsToUpload({
        uploadId,
        pathname,
        url: "https://example.com/uploads/file.pdf",
      }),
    ).toBe(false);
  });
});
