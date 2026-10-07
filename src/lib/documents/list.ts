import { desc } from "drizzle-orm";
import { getDb } from "@/db";
import { documents } from "@/db/schema";
import type { ListedDocument } from "@/lib/document-types";
import { demoDocuments } from "@/lib/demo-documents";
import {
  DEMO_MARKDOWN_FILE,
  DEMO_MARKDOWN_ID,
  markdownSampleListing,
} from "@/lib/demo/markdown-catalog";
import { isPublicSample } from "@/lib/documents/samples";
import { ownedDocumentsWhere, visibleDocumentsWhere } from "@/lib/documents/visibility";
import { isMarkdownFileName } from "@/lib/markdown/sections";

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

function listedFromRow(row: {
  id: string;
  fileName: string;
  isDemo: boolean;
  status: string;
  createdAt: Date;
}): ListedDocument {
  const { addedOn, addedLabel } = formatAdded(row.createdAt);
  return {
    id: row.id,
    title: titleFromFileName(row.fileName),
    counterparty: row.isDemo ? "Sample" : "Your document",
    kindLabel: isMarkdownFileName(row.fileName) ? "Markdown" : "PDF",
    meta: `Added ${addedLabel}`,
    status: row.isDemo ? "Sample" : libraryStatusLabel(row.status),
    preview: "file",
    fileName: row.fileName,
    addedOn,
    pageCount: 0,
  };
}

/** The signed-in account sees its own uploads, never public samples. */
export function accountDocuments<
  T extends { id: string; fileName: string; userId: string | null; isDemo: boolean },
>(rows: readonly T[], viewerUserId: string): T[] {
  return rows.filter((row) => row.userId === viewerUserId && !isPublicSample(row));
}

function titleFromFileName(fileName: string): string {
  return fileName.replace(/\.(pdf|markdown|md)$/i, "");
}

function withMarkdownSample(documents: ListedDocument[]): ListedDocument[] {
  if (
    documents.some(
      (item) => item.id === DEMO_MARKDOWN_ID || item.fileName === DEMO_MARKDOWN_FILE,
    )
  ) {
    return documents;
  }
  return [...documents, markdownSampleListing()];
}

export function demoListedDocuments(): ListedDocument[] {
  return withMarkdownSample(demoDocuments.map((document) => ({
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
  })));
}

/** Public demo only. Signed-out visitors and the separate demo link use this. */
export async function loadPublicDemo(): Promise<{
  source: "demo";
  documents: ListedDocument[];
}> {
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
    .where(visibleDocumentsWhere(null))
    .orderBy(desc(documents.createdAt));

  return {
    source: "demo",
    documents: withMarkdownSample(rows.map((row) => listedFromRow(row))),
  };
}

/** This account's uploads. Sample rows stay in the database and are not listed. */
export async function loadOwnedDocuments(viewerUserId: string): Promise<{
  source: "library";
  documents: ListedDocument[];
}> {
  if (!process.env.DATABASE_URL) {
    return { source: "library", documents: [] };
  }

  const rows = await getDb()
    .select({
      id: documents.id,
      userId: documents.userId,
      fileName: documents.fileName,
      isDemo: documents.isDemo,
      status: documents.status,
      createdAt: documents.createdAt,
    })
    .from(documents)
    .where(ownedDocumentsWhere(viewerUserId))
    .orderBy(desc(documents.createdAt));

  return {
    source: "library",
    documents: accountDocuments(rows, viewerUserId).map((row) => listedFromRow(row)),
  };
}

/**
 * Signed-out callers get the public demo. Signed-in callers get only their uploads.
 */
export async function loadVisibleDocuments(
  viewerUserId: string | null,
): Promise<{ source: "demo" | "library"; documents: ListedDocument[] }> {
  if (!viewerUserId) return loadPublicDemo();
  return loadOwnedDocuments(viewerUserId);
}

/** Signed-in home. Samples are not included; the public demo is a separate page. */
export async function loadAccountHome(viewerUserId: string): Promise<{
  source: "library";
  owned: ListedDocument[];
}> {
  const library = await loadOwnedDocuments(viewerUserId);
  return { source: "library", owned: library.documents };
}
