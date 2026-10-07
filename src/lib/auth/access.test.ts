import { describe, expect, it } from "vitest";
import {
  classifyPath,
  decideDocumentAccess,
  decideProtectedAccess,
  safeCallbackPath,
} from "./access";

const demo = {
  userId: "owner",
  isDemo: true,
  fileName: "demo.pdf",
};

const owned = {
  userId: "owner",
  isDemo: false,
  fileName: "private.pdf",
};

describe("classifyPath", () => {
  it("keeps the dashboard, document list, sign-in, and Auth.js routes public", () => {
    expect(classifyPath("/")).toEqual({ kind: "public" });
    expect(classifyPath("/documents")).toEqual({ kind: "public" });
    expect(classifyPath("/documents/")).toEqual({ kind: "public" });
    expect(classifyPath("/sign-in")).toEqual({ kind: "public" });
    expect(classifyPath("/sign-in/")).toEqual({ kind: "public" });
    expect(classifyPath("/api/auth/callback/google")).toEqual({
      kind: "public",
    });
  });

  it("protects the upload page and account settings", () => {
    expect(classifyPath("/upload")).toEqual({ kind: "protected" });
    expect(classifyPath("/settings")).toEqual({ kind: "protected" });
    expect(classifyPath("/settings/")).toEqual({ kind: "protected" });
  });

  it("lets an unknown address render the not-found page", () => {
    expect(classifyPath("/missing-page")).toEqual({ kind: "unknown" });
    expect(classifyPath("/settings/extra")).toEqual({ kind: "unknown" });
  });

  it("leaves the PDF.js worker and demo PDFs public", () => {
    expect(classifyPath("/pdf.worker.min.mjs")).toEqual({ kind: "public" });
    expect(classifyPath("/demo/sample-invoice.pdf")).toEqual({ kind: "public" });
    expect(classifyPath("/demo/sample-services-agreement.pdf")).toEqual({
      kind: "public",
    });
    expect(classifyPath("/demo/sample-data-policy.pdf")).toEqual({
      kind: "public",
    });
    expect(classifyPath("/demo/sample-visitor-note.md")).toEqual({
      kind: "public",
    });
  });

  it("leaves chat and the document API to enforce access in the handler", () => {
    expect(classifyPath("/api/chat")).toEqual({ kind: "public" });
    expect(classifyPath("/api/documents")).toEqual({ kind: "public" });
    expect(classifyPath("/api/documents/abc/file")).toEqual({ kind: "public" });
  });

  it("reads a document id from the document route", () => {
    expect(classifyPath("/documents/abc")).toEqual({
      kind: "document",
      documentId: "abc",
    });
  });
});

describe("decideProtectedAccess", () => {
  it("requires a viewer id", () => {
    expect(decideProtectedAccess(null)).toBe("sign-in");
    expect(decideProtectedAccess("owner")).toBe("allow");
  });
});

describe("decideDocumentAccess", () => {
  it("allows demo documents for a signed-out viewer", () => {
    expect(
      decideDocumentAccess(null, { status: "found", document: demo }),
    ).toBe("allow");
  });

  it("sends signed-out viewers of private documents to sign-in", () => {
    expect(
      decideDocumentAccess(null, { status: "found", document: owned }),
    ).toBe("sign-in");
  });

  it("allows the owner and hides the document from someone else", () => {
    expect(
      decideDocumentAccess("owner", { status: "found", document: owned }),
    ).toBe("allow");
    expect(
      decideDocumentAccess("other", { status: "found", document: owned }),
    ).toBe("not-found");
  });

  it("fails closed when the lookup is unavailable", () => {
    expect(decideDocumentAccess(null, { status: "unavailable" })).toBe(
      "sign-in",
    );
    expect(decideDocumentAccess("owner", { status: "unavailable" })).toBe(
      "not-found",
    );
    expect(decideDocumentAccess(null, { status: "missing" })).toBe("sign-in");
  });
});

describe("safeCallbackPath", () => {
  it("keeps in-app paths and drops external targets", () => {
    expect(safeCallbackPath("/documents/abc")).toBe("/documents/abc");
    expect(safeCallbackPath(undefined)).toBe("/");
    expect(safeCallbackPath("https://example.com")).toBe("/");
    expect(safeCallbackPath("//example.com")).toBe("/");
  });
});
