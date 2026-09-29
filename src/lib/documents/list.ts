import { desc } from "drizzle-orm";
import { getDb } from "@/db";
import { documents } from "@/db/schema";
import type { ListedDocument } from "@/lib/document-types";
import { demoDocuments } from "@/lib/demo-documents";
import { visibleDocumentsWhere } from "@/lib/documents/visibility";

function libraryStatusLabel(status: string): string {
  if (status === "processing") return "Processing";
  if (status === "failed") return "Could not read";
  return "Yours";
}

export function isListedDocumentList(
  value: unknown,
): value is { documents: ListedDocument[] } {
  if (typeof value !== "object" || value === null || !("documents" in value)) {
    return false;
  }
  const rows = value.documents;
  return Array.isArray(rows) && rows.every(isListedDocument);
}

function isListedDocument(value: unknown): value is ListedDocument {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === "string" &&
    typeof record.title === "string" &&
    typeof record.counterparty === "string" &&
    typeof record.kindLabel === "string" &&
    typeof record.meta === "string" &&
    typeof record.status === "string" &&
    (record.preview === "invoice" ||
      record.preview === "statement" ||
      record.preview === "contract" ||
      record.preview === "file") &&
    typeof record.fileName === "string" &&
    typeof record.addedOn === "string" &&
    typeof record.pageCount === "number"
  );
}

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
      status: documents.status,
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
        status: row.isDemo ? "Sample" : libraryStatusLabel(row.status),
        preview: "file",
        fileName: row.fileName,
        addedOn,
        pageCount: 0,
      };
    }),
  };
}
