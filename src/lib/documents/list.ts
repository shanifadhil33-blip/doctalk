import { desc } from "drizzle-orm";
import { getDb } from "@/db";
import { documents } from "@/db/schema";
import type { ListedDocument } from "@/lib/document-types";
import { demoDocuments } from "@/lib/demo-documents";
import { visibleDocumentsWhere } from "@/lib/documents/visibility";

function formatAdded(date: Date): { addedOn: string; addedLabel: string } {
  return {
    addedOn: date.toISOString().slice(0, 10),
    addedLabel: new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(date),
  };
}

export function demoListedDocuments(): ListedDocument[] {
  return demoDocuments.map((document) => ({
    id: document.id,
    title: document.title,
    counterparty: document.counterparty,
    kindLabel: document.kindLabel,
    meta: `${document.pageCount} pages · Added ${document.addedLabel}`,
    status: "Sample",
    preview: document.preview,
    fileName: document.fileName,
    addedOn: document.addedOn,
    pageCount: document.pageCount,
  }));
}

/**
 * With DATABASE_URL, return rows the viewer may see.
 * Without it, return the sample documents so the demo and the build still run.
 */
export async function loadVisibleDocuments(
  viewerUserId: string | null,
): Promise<{ source: "demo" | "library"; documents: ListedDocument[] }> {
  if (!process.env.DATABASE_URL) {
    return { source: "demo", documents: demoListedDocuments() };
  }

  const rows = await getDb()
    .select({
      id: documents.id,
      fileName: documents.fileName,
      isDemo: documents.isDemo,
      createdAt: documents.createdAt,
    })
    .from(documents)
    .where(visibleDocumentsWhere(viewerUserId))
    .orderBy(desc(documents.createdAt));

  return {
    source: "library",
    documents: rows.map((row) => {
      const { addedOn, addedLabel } = formatAdded(row.createdAt);
      return {
        id: row.id,
        title: row.fileName.replace(/\.pdf$/i, ""),
        counterparty: row.isDemo ? "Sample" : "Your document",
        kindLabel: "PDF",
        meta: `Added ${addedLabel}`,
        status: row.isDemo ? "Sample" : "Yours",
        preview: "file",
        fileName: row.fileName,
        addedOn,
        pageCount: 0,
      };
    }),
  };
}
