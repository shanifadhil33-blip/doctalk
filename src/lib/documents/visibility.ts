import { eq, isNull, or, type SQL } from "drizzle-orm";
import { documents } from "@/db/schema";

export type DocumentVisibility = {
  userId: string | null;
  isDemo: boolean;
};

/**
 * Public when isDemo is set, or when userId is null (a public demo document).
 * A signed-in viewer also sees rows they own. Anyone else's private rows stay hidden.
 */
export function isDocumentVisible(
  document: DocumentVisibility,
  viewerUserId: string | null,
): boolean {
  if (document.isDemo) {
    return true;
  }

  if (document.userId === null) {
    return true;
  }

  if (viewerUserId === null) {
    return false;
  }

  return document.userId === viewerUserId;
}

export function filterVisibleDocuments<T extends DocumentVisibility>(
  rows: readonly T[],
  viewerUserId: string | null,
): T[] {
  return rows.filter((row) => isDocumentVisible(row, viewerUserId));
}

function requireCondition(condition: SQL | undefined): SQL {
  if (!condition) {
    throw new Error("Document visibility condition was empty");
  }
  return condition;
}

/** SQL form of isDocumentVisible. Private rows for other users are not selected. */
export function visibleDocumentsWhere(viewerUserId: string | null): SQL {
  const publicDocuments = requireCondition(
    or(eq(documents.isDemo, true), isNull(documents.userId)),
  );

  if (viewerUserId === null) {
    return publicDocuments;
  }

  return requireCondition(
    or(publicDocuments, eq(documents.userId, viewerUserId)),
  );
}
