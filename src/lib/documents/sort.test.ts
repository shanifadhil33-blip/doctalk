import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { demoPdfs } from "@/lib/demo/pdf-catalog";
import type { ListedDocument } from "@/lib/document-types";
import { cardLinkClass } from "@/components/button-styles";
import { demoListedDocuments, listedFromRow } from "@/lib/documents/list";
import { sampleSortFacts, withSampleSortFacts } from "@/lib/documents/sample-sort";
import {
  hrefWithSort,
  parseSortKey,
  sortDocuments,
  type SortableDocument,
  type SortKey,
} from "@/lib/documents/sort";

function sample(fileName: string, title: string): ListedDocument {
  return withSampleSortFacts({
    id: fileName,
    title,
    counterparty: "Sample",
    kindLabel: fileName.endsWith(".md") ? "Markdown" : "PDF",
    meta: "Added Sep 29",
    status: "Sample",
    preview: "file",
    fileName,
    addedOn: "2026-09-29",
    pageCount: 0,
  });
}

function titles(items: readonly SortableDocument[], sort: SortKey): string[] {
  return sortDocuments(items, sort).map((item) => item.title);
}

describe("document sort", () => {
  const publicSamples = [
    sample("Sample_Data_Policy.pdf", "Sample_Data_Policy"),
    sample("Sample_Invoice.pdf", "Sample_Invoice"),
    sample("Sample_Services_Agreement.pdf", "Sample_Services_Agreement"),
    sample("Sample_Visitor_Note.md", "Visitor desk note"),
  ];

  it("gives the public samples three different orders", () => {
    const recent = titles(publicSamples, "recent");
    const name = titles(publicSamples, "name");
    const pages = titles(publicSamples, "pages");

    expect(recent).toEqual([
      "Sample_Invoice",
      "Sample_Services_Agreement",
      "Sample_Data_Policy",
      "Visitor desk note",
    ]);
    expect(name).toEqual([
      "Sample_Data_Policy",
      "Sample_Invoice",
      "Sample_Services_Agreement",
      "Visitor desk note",
    ]);
    expect(pages).toEqual([
      "Sample_Data_Policy",
      "Sample_Services_Agreement",
      "Sample_Invoice",
      "Visitor desk note",
    ]);
    expect(new Set([recent.join("|"), name.join("|"), pages.join("|")]).size).toBe(3);
  });

  it("orders a signed-in library by date, name, and page count", () => {
    const owned = [
      { title: "Alpha", addedOn: "2026-01-01", pageCount: 1 },
      { title: "Middle", addedOn: "2026-08-01", pageCount: 4 },
      { title: "Zebra", addedOn: "2026-04-01", pageCount: 9 },
    ];

    expect(titles(owned, "name")).toEqual(["Alpha", "Middle", "Zebra"]);
    expect(titles(owned, "recent")).toEqual(["Middle", "Zebra", "Alpha"]);
    expect(titles(owned, "pages")).toEqual(["Zebra", "Middle", "Alpha"]);
  });

  it("orders the offline demo three different ways, most pages first", () => {
    const docs = demoListedDocuments();
    const recent = titles(docs, "recent");
    const name = titles(docs, "name");
    const pages = titles(docs, "pages");

    expect(recent).not.toEqual(name);
    expect(name).not.toEqual(pages);
    expect(recent).not.toEqual(pages);
    expect(pages[0]).toBe("Master Services Agreement");
  });

  it("breaks page-count ties by title", () => {
    const tied = [
      { title: "Beta", addedOn: "2026-01-01", pageCount: 5 },
      { title: "Alpha", addedOn: "2026-01-01", pageCount: 5 },
    ];
    expect(titles(tied, "pages")).toEqual(["Alpha", "Beta"]);
  });

  it("writes ?sort= without dropping the rest of the query", () => {
    expect(parseSortKey(undefined)).toBe("recent");
    expect(parseSortKey("pages")).toBe("pages");
    expect(parseSortKey("nope")).toBe("recent");
    expect(hrefWithSort("/documents", "?demo=1", "name")).toBe("/documents?demo=1&sort=name");
    expect(hrefWithSort("/documents", "", "recent")).toBe("/documents?sort=recent");
  });

  it("stamps seeded sample rows so a shared createdAt does not collapse the sort", () => {
    const createdAt = new Date("2026-09-29T15:00:00.000Z");
    const invoice = listedFromRow({
      id: "invoice",
      fileName: "Sample_Invoice.pdf",
      isDemo: true,
      status: "ready",
      createdAt,
    });
    const agreement = listedFromRow({
      id: "agreement",
      fileName: "Sample_Services_Agreement.pdf",
      isDemo: true,
      status: "ready",
      createdAt,
    });

    expect(invoice.addedOn).toBe("2026-09-18");
    expect(invoice.pageCount).toBe(4);
    expect(invoice.meta).toBe("Added Sep 18");
    expect(agreement.pageCount).toBe(5);
    expect(agreement.addedOn).toBe("2026-08-03");
    expect(sampleSortFacts["Sample_Data_Policy.pdf"]?.pageCount).toBe(5);
  });

  it("uses the catalog page counts", () => {
    for (const pdf of demoPdfs) {
      expect(sampleSortFacts[pdf.fileName]?.pageCount).toBe(pdf.pages.length);
    }
  });

  it("does not scale the sort trigger or document cards on press", () => {
    const css = readFileSync(new URL("../../app/globals.css", import.meta.url), "utf8");
    const route = readFileSync(new URL("../../components/RouteTransition.tsx", import.meta.url), "utf8");
    expect(css).not.toMatch(/scale\(/);
    expect(css).not.toContain("data-pressed");
    expect(css).not.toContain("translateY(-4px)");
    expect(route).not.toContain("data-pressed");
    expect(cardLinkClass).not.toMatch(/active:|scale|shadow/);
    expect(cardLinkClass).toContain("touch-manipulation");
  });
});
