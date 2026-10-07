import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";
import {
  classifyPath,
  decideDocumentAccess,
  decideProtectedAccess,
} from "@/lib/auth/access";
import { demoPdfs } from "@/lib/demo/pdf-catalog";

/** Reads the matcher literal from middleware.ts without loading Auth.js. */
function middlewareMatcher(): string[] {
  const source = readFileSync(new URL("./middleware.ts", import.meta.url), "utf8");
  const start = source.indexOf("matcher:");
  const end = source.indexOf("],", start);
  const block = source.slice(start, end);
  return [...block.matchAll(/"((?:\\.|[^"\\])*)"/g)].map((match) =>
    JSON.parse(`"${match[1]}"`) as string,
  );
}

function middlewareRuns(pathname: string): boolean {
  return unstable_doesMiddlewareMatch({
    config: { matcher: middlewareMatcher() },
    url: pathname,
  });
}

/**
 * Same decision as src/middleware.ts for a signed-out request that does not
 * need a document lookup. A matcher miss serves the static file directly.
 */
function signedOutRedirectsToSignIn(pathname: string): boolean {
  if (!middlewareRuns(pathname)) return false;
  const kind = classifyPath(pathname);
  if (kind.kind === "public" || kind.kind === "unknown") return false;
  if (kind.kind === "protected") {
    return decideProtectedAccess(null) === "sign-in";
  }
  return false;
}

describe("signed-out PDF assets", () => {
  it("does not redirect /pdf.worker.min.mjs to sign-in", () => {
    expect(middlewareRuns("/pdf.worker.min.mjs")).toBe(false);
    expect(signedOutRedirectsToSignIn("/pdf.worker.min.mjs")).toBe(false);
  });

  it("does not redirect the seeded demo PDFs to sign-in", () => {
    for (const demo of demoPdfs) {
      expect(middlewareRuns(demo.fileUrl)).toBe(false);
      expect(signedOutRedirectsToSignIn(demo.fileUrl)).toBe(false);
    }
  });

  it("does not send an unknown address to sign-in", () => {
    expect(middlewareRuns("/missing-page")).toBe(true);
    expect(signedOutRedirectsToSignIn("/missing-page")).toBe(false);
  });

  it("still sends a signed-out visitor of a protected page to sign-in", () => {
    expect(middlewareRuns("/upload")).toBe(true);
    expect(signedOutRedirectsToSignIn("/upload")).toBe(true);
    expect(middlewareRuns("/settings")).toBe(true);
    expect(signedOutRedirectsToSignIn("/settings")).toBe(true);
  });

  it("still runs middleware on document pages so private rows can be hidden", () => {
    const pathname = "/documents/629dc9d8-5181-420f-8264-cf5e37246622";
    expect(middlewareRuns(pathname)).toBe(true);
    expect(classifyPath(pathname)).toEqual({
      kind: "document",
      documentId: "629dc9d8-5181-420f-8264-cf5e37246622",
    });
    expect(
      decideDocumentAccess(null, {
        status: "found",
        document: { userId: "owner", isDemo: false, fileName: "private.pdf" },
      }),
    ).toBe("sign-in");
  });

  it("still runs middleware on the private file route", () => {
    expect(middlewareRuns("/api/documents/abc/file")).toBe(true);
    expect(classifyPath("/api/documents/abc/file")).toEqual({ kind: "public" });
  });
});
