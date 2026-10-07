import type { ListedDocument } from "@/lib/document-types";

/**
 * Library-added dates and real page counts for the public samples.
 * The seeded rows share one createdAt, and listings otherwise store pageCount 0
 * while the card reads the PDF. These facts make Recently added, Name, and
 * Page count three different orders. Page count is most pages first; ties use the title.
 *
 * Invoice is newest. The agreement and the data policy both have 5 pages, so
 * page-count order breaks the tie by name and does not match name order.
 */
export const sampleSortFacts: Record<string, { addedOn: string; pageCount: number }> = {
  "Sample_Invoice.pdf": { addedOn: "2026-09-18", pageCount: 4 },
  "Sample_Services_Agreement.pdf": { addedOn: "2026-08-03", pageCount: 5 },
  "Sample_Data_Policy.pdf": { addedOn: "2026-06-01", pageCount: 5 },
  "Sample_Visitor_Note.md": { addedOn: "2026-03-18", pageCount: 0 },
};

export function addedLabelFromIso(isoDate: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) return isoDate;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

export function withSampleSortFacts<T extends ListedDocument>(document: T): T {
  const facts = sampleSortFacts[document.fileName];
  if (!facts) return document;
  const addedLabel = addedLabelFromIso(facts.addedOn);
  const meta = /^Added\b/.test(document.meta) ? `Added ${addedLabel}` : document.meta;
  return {
    ...document,
    addedOn: facts.addedOn,
    pageCount: facts.pageCount,
    meta,
  };
}
