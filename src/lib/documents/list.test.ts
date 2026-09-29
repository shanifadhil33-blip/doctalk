import { describe, expect, it } from "vitest";
import { demoDocuments } from "@/lib/demo-documents";
import { loadVisibleDocuments } from "@/lib/documents/list";

describe("loadVisibleDocuments", () => {
  it("returns the sample documents when DATABASE_URL is unset", async () => {
    const previous = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;
    try {
      const result = await loadVisibleDocuments(null);
      expect(result.source).toBe("demo");
      expect(result.documents.map((document) => document.id)).toEqual(
        demoDocuments.map((document) => document.id),
      );
    } finally {
      if (previous === undefined) {
        delete process.env.DATABASE_URL;
      } else {
        process.env.DATABASE_URL = previous;
      }
    }
  });
});
