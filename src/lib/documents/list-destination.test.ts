import { describe, expect, it } from "vitest";
import {
  backToDocumentsHref,
  ownDocumentsHref,
  shouldRedirectSignedInDocuments,
} from "@/lib/documents/list-destination";

describe("signed-in documents destination", () => {
  it("keeps the home screen as the only signed-in document list", () => {
    expect(ownDocumentsHref()).toBe("/");
    expect(backToDocumentsHref(true)).toBe("/");
    expect(backToDocumentsHref(false)).toBe("/documents");
    expect(shouldRedirectSignedInDocuments(true, undefined)).toBe(true);
    expect(shouldRedirectSignedInDocuments(true, "1")).toBe(false);
    expect(shouldRedirectSignedInDocuments(false, undefined)).toBe(false);
  });
});
