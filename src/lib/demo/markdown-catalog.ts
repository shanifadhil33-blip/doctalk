import type { ListedDocument } from "@/lib/document-types";

/** Stable public id. It is not a database uuid. */
export const DEMO_MARKDOWN_ID = "sample-visitor-note";

export const DEMO_MARKDOWN_FILE = "Sample_Visitor_Note.md";

export const DEMO_MARKDOWN_URL = "/demo/sample-visitor-note.md";

export const DEMO_MARKDOWN_DISK = "sample-visitor-note.md";

export const DEMO_MARKDOWN_TITLE = "Visitor desk note";

export function isDemoMarkdownId(id: string): boolean {
  return id === DEMO_MARKDOWN_ID;
}

export function isDemoMarkdownFile(fileName: string): boolean {
  return fileName === DEMO_MARKDOWN_FILE;
}

export function markdownSampleListing(): ListedDocument {
  return {
    id: DEMO_MARKDOWN_ID,
    title: DEMO_MARKDOWN_TITLE,
    counterparty: "Northwind Studio",
    kindLabel: "Markdown",
    meta: "Sample",
    status: "Sample",
    preview: "file",
    fileName: DEMO_MARKDOWN_FILE,
    addedOn: "2026-03-18",
    pageCount: 0,
  };
}

/** Opening lines for the document card. The full note is the public file. */
export const DEMO_MARKDOWN_PREVIEW_LINES = [
  "Visitor desk note",
  "Northwind Studio, 120 Sample Avenue, Portland, OR 97204.",
  "Priya Shah, office coordinator, wrote it on March 18, 2026.",
  "Visitors stop in the lobby.",
];
