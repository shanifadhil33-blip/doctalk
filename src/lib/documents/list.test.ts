import { describe, expect, it } from "vitest";
import { demoDocuments } from "@/lib/demo-documents";
import { DEMO_MARKDOWN_ID } from "@/lib/demo/markdown-catalog";
import { accountDocuments, loadAccountHome, loadVisibleDocuments } from "@/lib/documents/list";

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

describe("loadVisibleDocuments for a signed-in account", () => {
  it("does not fall back to sample documents when the database is unset", async () => {
    const previous = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;
    try {
      const result = await loadVisibleDocuments("google-sub");
      expect(result.source).toBe("library");
      expect(result.documents).toEqual([]);
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
  it("leaves a signed-in account empty instead of showing samples without a database", async () => {
    const previous = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;
    try {
      const result = await loadAccountHome("google-sub");
      expect(result.source).toBe("library");
      expect(result.owned).toEqual([]);
      expect(result).not.toHaveProperty("samples");
    } finally {
      if (previous === undefined) {
        delete process.env.DATABASE_URL;
      } else {
        process.env.DATABASE_URL = previous;
      }
    }
  });
});

describe("accountDocuments", () => {
  it("keeps the viewer's uploads and drops sample rows", () => {
    const rows = [
      { id: "mine", userId: "owner", isDemo: false, fileName: "lease.pdf" },
      { id: "flagged", userId: "owner", isDemo: true, fileName: "notes.pdf" },
      { id: "copied", userId: "owner", isDemo: false, fileName: "Sample_Services_Agreement.pdf" },
      { id: "sample-visitor-note", userId: "owner", isDemo: false, fileName: "notes.md" },
      { id: "public", userId: null, isDemo: false, fileName: "Sample_Invoice.pdf" },
      { id: "other", userId: "someone-else", isDemo: false, fileName: "other.pdf" },
    ];

    expect(accountDocuments(rows, "owner").map((row) => row.id)).toEqual(["mine"]);
  });
});
