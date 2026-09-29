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
  it("keeps the dashboard, sign-in, and Auth.js routes public", () => {
    expect(classifyPath("/")).toEqual({ kind: "public" });
    expect(classifyPath("/sign-in")).toEqual({ kind: "public" });
    expect(classifyPath("/sign-in/")).toEqual({ kind: "public" });
    expect(classifyPath("/api/auth/callback/google")).toEqual({
      kind: "public",
    });
  });

  it("protects upload and chat", () => {
    expect(classifyPath("/upload")).toEqual({ kind: "protected" });
    expect(classifyPath("/api/chat")).toEqual({ kind: "protected" });
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
