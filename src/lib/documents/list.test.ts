import { describe, expect, it } from "vitest";
import { demoDocuments } from "@/lib/demo-documents";
import { DEMO_MARKDOWN_ID } from "@/lib/demo/markdown-catalog";
import { loadAccountHome, loadVisibleDocuments, partitionLibraryRows } from "@/lib/documents/list";

describe("loadVisibleDocuments", () => {
  it("returns the sample documents when DATABASE_URL is unset", async () => {
    const previous = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;
    try {
      const result = await loadVisibleDocuments(null);
      expect(result.source).toBe("demo");
      expect(result.documents.map((document) => document.id)).toEqual([
        ...demoDocuments.map((document) => document.id),
        DEMO_MARKDOWN_ID,
      ]);
    } finally {
      if (previous === undefined) {
        delete process.env.DATABASE_URL;
      } else {
        process.env.DATABASE_URL = previous;
      }
    }
  });
});

describe("loadAccountHome", () => {
  it("keeps samples available and leaves owned documents empty without a database", async () => {
    const previous = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;
    try {
      const result = await loadAccountHome("google-sub");
      expect(result.source).toBe("demo");
      expect(result.owned).toEqual([]);
      expect(result.samples.map((document) => document.id)).toEqual([
        ...demoDocuments.map((document) => document.id),
        DEMO_MARKDOWN_ID,
      ]);
    } finally {
      if (previous === undefined) {
        delete process.env.DATABASE_URL;
      } else {
        process.env.DATABASE_URL = previous;
      }
    }
  });
});

describe("partitionLibraryRows", () => {
  it("keeps the viewer's uploads apart from public samples", () => {
    const rows = [
      { id: "mine", userId: "owner", isDemo: false },
      { id: "sample", userId: "seed", isDemo: true },
      { id: "public", userId: null, isDemo: false },
      { id: "other", userId: "someone-else", isDemo: false },
    ];

    expect(partitionLibraryRows(rows, "owner")).toEqual({
      owned: [rows[0]],
      samples: [rows[1], rows[2]],
    });
  });
});
